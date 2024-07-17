const express = require('express');
const fetch = require('node-fetch');
const https = require('https');

const app = express();
const TELEGRAPH_URL = process.env.TELEGRAPH_URL || 'https://api.tmdb.org';

// 创建一个忽略证书验证的https.Agent实例
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all('*', async (req, res) => {
  try {
    const url = new URL(req.url, TELEGRAPH_URL);
    url.host = TELEGRAPH_URL.replace(/^https?:\/\//, '');

    const headers = Object.fromEntries(
      Object.entries(req.headers).filter(([key]) => key.toLowerCase() !== 'host')
    );

    const modifiedRequest = new fetch(url.toString(), {
      headers: headers,
      method: req.method,
      body: ['GET', 'HEAD'].includes(req.method) ? null : req.body,
      redirect: 'follow',
      agent: url.protocol === 'https:' ? httpsAgent : null
    });

    const response = await modifiedRequest;
    const responseBody = await response.buffer();
    const modifiedHeaders = {};

    response.headers.forEach((value, key) => {
      modifiedHeaders[key] = value;
    });

    // 添加允许跨域访问的响应头
    modifiedHeaders['Access-Control-Allow-Origin'] = '*';

    res.status(response.status).set(modifiedHeaders).send(responseBody);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
