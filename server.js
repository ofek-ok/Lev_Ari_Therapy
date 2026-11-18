const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const apiHandler = require('./api/index');
const bundledAssets = require('./bundle-assets.json');

const PORT = process.env.PORT || 3456;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

async function requestHandler(req, res) {
  try {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let pathname = parsedUrl.pathname;

    if (pathname.startsWith('/api/')) {
      return await apiHandler(req, res);
    }

    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    }

    // 1. Check in-memory bundledAssets first (100% guaranteed to exist in Vercel Serverless)
    const assetKey = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    if (bundledAssets[assetKey]) {
      const item = bundledAssets[assetKey];
      const buf = Buffer.from(item.data, item.encoding);
      res.writeHead(200, {
        'Content-Type': item.contentType,
        'Cache-Control': 'public, max-age=60'
      });
      return res.end(buf);
    }

    // 2. Check public/ directory on disk if running locally
    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(PUBLIC_DIR, safePath);
    if (filePath.startsWith(PUBLIC_DIR) && fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      return res.end(content);
    }

    // 3. SPA Fallback to index.html
    if (bundledAssets['index.html']) {
      const indexItem = bundledAssets['index.html'];
      res.writeHead(200, { 'Content-Type': indexItem.contentType });
      return res.end(Buffer.from(indexItem.data, indexItem.encoding));
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
  }
}

if (require.main === module) {
  const server = http.createServer(requestHandler);
  server.listen(PORT, () => {
    console.log(`Lev Ari Therapy Operations Platform running at http://localhost:${PORT}`);
  });
}

module.exports = requestHandler;
