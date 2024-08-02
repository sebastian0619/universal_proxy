const express = require('express');
const fetch = require('node-fetch');
const https = require('https');

const app = express();
const TELEGRAPH_URL = process.env.TELEGRAPH_URL || 'https://image.tmdb.org';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all('*', async (req, res) => {
  try {
    const url = new URL(req.url, TELEGRAPH_URL);
    url.host = TELEGRAPH_URL.replace(/^https?:\/\//, '');

    console.log(`Proxying request to: ${url.toString()}`);

    const headers = Object.fromEntries(
      Object.entries(req.headers).filter(([key]) => key.toLowerCase() !== 'host' && key.toLowerCase() !== 'accept-encoding')
    );

    console.log('Request headers:', headers);

    const fetchOptions = {
      headers: headers,
      method: req.method,
      body: ['GET', 'HEAD'].includes(req.method) ? null : JSON.stringify(req.body),
      redirect: 'follow',
      agent: url.protocol === 'https:' ? httpsAgent : null
    };

    const response = await fetch(url.toString(), fetchOptions);

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());

    const responseBody = await response.buffer();
    const modifiedHeaders = {};

    response.headers.forEach((value, key) => {
      modifiedHeaders[key] = value;
    });

    modifiedHeaders['Access-Control-Allow-Origin'] = '*';

    res.status(response.status).set(modifiedHeaders).send(responseBody);
  } catch (error) {
    console.error('Fetch error:', error.message);
    res.status(500).send(error.toString());
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
