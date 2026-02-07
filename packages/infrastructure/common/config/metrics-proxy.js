const http = require('http');

const HEALTH_CHECK_SECRET = process.env.HEALTH_CHECK_SECRET || '';
const TARGET_HOST = process.env.TARGET_HOST || 'app-api';
const TARGET_PORT = process.env.TARGET_PORT || '3000';
const PROXY_PORT = process.env.PROXY_PORT || '9100';

const server = http.createServer((_req, res) => {
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: '/api/v1/metrics',
    method: 'GET',
    headers: {
      'X-Health-Key': HEALTH_CHECK_SECRET
    }
  };

  const proxyReq = http.request(options, proxyRes => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', err => {
    console.error(`Proxy error for ${TARGET_HOST}:`, err.message);
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    res.end('Service Unavailable');
  });

  proxyReq.end();
});

server.listen(PROXY_PORT, () => {
  console.log(`Metrics proxy running on port ${PROXY_PORT}`);
  console.log(`Forwarding to ${TARGET_HOST}:${TARGET_PORT}/api/v1/metrics`);
});
