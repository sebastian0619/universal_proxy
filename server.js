const express = require('express');
const axios = require('axios');
const https = require('https');
const cluster = require('cluster');
const os = require('os');

const numCPUs = os.cpus().length;
const TELEGRAPH_URL = process.env.TELEGRAPH_URL || 'https://image.tmdb.org';

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Restart the worker
  });
} else {
  const app = express();

  app.use(async (req, res) => {
    try {
      // 从请求URL中获取 API查询参数
      const url = new URL(req.url, `http://${req.headers.host}`);
      const searchParams = url.searchParams;

      // 设置代理API请求的URL地址
      const apiUrl = `${TELEGRAPH_URL}${url.pathname}?${searchParams.toString()}`;

      console.log(`Proxying request to: ${apiUrl}`); // Log the proxied URL

      // 设置API请求的headers
      const headers = {};
      for (let [key, value] of Object.entries(req.headers)) {
        headers[key] = value;
      }
      headers['Host'] = new URL(TELEGRAPH_URL).host;

      // 创建一个忽略 SSL 错误的 agent
      const agent = new https.Agent({ rejectUnauthorized: false });

      // 创建API请求
      const response = await axios({
        url: apiUrl,
        method: req.method,
        headers: headers,
        responseType: 'stream', // 关键在于使用 stream 处理图像数据
        httpsAgent: agent
      });

      // 设置响应的状态码和headers
      res.status(response.status);
      for (let [key, value] of Object.entries(response.headers)) {
        res.set(key, value);
      }

      // 返回API响应的内容
      response.data.pipe(res);
    } catch (error) {
      console.error('Fetch error:', error.message); // Log the error message
      res.status(500).send('Internal Server Error');
    }
  });

  // 启动服务器
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Worker ${process.pid} is running on port ${port}`);
  });
}
