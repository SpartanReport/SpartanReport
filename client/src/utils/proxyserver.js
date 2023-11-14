const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3001;

// Custom filter function to selectively forward headers
const filterHeaders = (proxyReq, req) => {
  // Clear out existing headers
  Object.keys(proxyReq.getHeaders()).forEach((key) => {
    proxyReq.removeHeader(key);
  });

  // Add only the necessary headers
  if (req.headers['x-343-authorization-spartan']) {
    proxyReq.setHeader('X-343-Authorization-Spartan', req.headers['x-343-authorization-spartan']);
  }

  // Optionally, set Host header to the target host
  proxyReq.setHeader('Host', 'gamecms-hacs.svc.halowaypoint.com');
};

// Proxy endpoint configuration
app.use('/api', createProxyMiddleware({ 
  target: 'https://gamecms-hacs.svc.halowaypoint.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '',
  },
  onProxyReq: filterHeaders, // Use the custom filter function
}));

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
