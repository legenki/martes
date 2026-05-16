/**
 * Martes — minimal static file server.
 *
 *   /          → hub.html
 *   /<path>    → file under project root, with path-traversal protection.
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8081;
const ROOT = path.resolve(__dirname);

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.json': 'application/json',
};

http.createServer((req, res) => {
  let urlPath = '/';
  try {
    const parsed = new URL(req.url, 'http://localhost');
    urlPath = decodeURIComponent(parsed.pathname);
  } catch {
    res.writeHead(400); res.end('Bad URL'); return;
  }

  // Reject null-bytes / control chars (some OSes truncate on \0).
  if (/[\x00-\x1f]/.test(urlPath)) {
    res.writeHead(400); res.end('Bad URL'); return;
  }

  if (urlPath === '/') urlPath = '/hub.html';

  // Resolve fully and require the result to live under ROOT.
  const filePath = path.resolve(ROOT, '.' + urlPath);
  const rel = path.relative(ROOT, filePath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    res.writeHead(403); res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + urlPath);
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Martes running at http://localhost:${PORT}`);
});
