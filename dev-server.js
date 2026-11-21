/* ============================================================
   Zero-dependency local dev server for testing the sN_vibe_*.html pages
   together with their real backends in api/*.js — no Vercel CLI, no
   npm install, just Node core modules.

   Run:   node dev-server.js
   Open:  http://localhost:3000/s6_vibe_page_summarizer.html
          http://localhost:3000/s7_vibe_digital_twin.html
          (or any other static file in this folder)

   This mimics what `vercel dev` / a real Vercel deployment does: it
   serves static files from this folder, and routes POST /api/<name>
   to api/<name>.js, the same way Vercel would. It is for local testing
   only — not meant to be deployed as-is.
   ============================================================ */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = 3000;
const ROOT = __dirname;
const API_DIR = path.join(ROOT, 'api');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function serveIndex(res) {
  const pages = fs.readdirSync(ROOT).filter((f) => /^s\d+_vibe_.*\.html$/i.test(f)).sort();
  const items = pages.map((f) => '<li><a href="/' + f + '">' + f + '</a></li>').join('');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!doctype html><title>Dev server</title><h1>Available pages</h1><ul>' + items + '</ul>');
}

function serveStatic(req, res, urlPath) {
  if (urlPath === '/') {
    serveIndex(res);
    return;
  }

  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found: ' + urlPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 2_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const apiHandlerCache = new Map();

function loadApiHandler(name) {
  // Only simple alphanumeric/underscore/hyphen names map to a function file —
  // this isn't a security boundary against a trusted local dev user, just a
  // guard against accidental path traversal via the URL.
  if (!/^[a-z0-9_-]+$/i.test(name)) return null;
  if (apiHandlerCache.has(name)) return apiHandlerCache.get(name);

  const filePath = path.join(API_DIR, name + '.js');
  if (!fs.existsSync(filePath)) {
    apiHandlerCache.set(name, null);
    return null;
  }
  const handler = require(filePath);
  apiHandlerCache.set(name, handler);
  return handler;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const apiMatch = url.pathname.match(/^\/api\/([^/]+)$/);

  if (apiMatch) {
    const handler = loadApiHandler(apiMatch[1]);
    if (!handler) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('No such function: ' + apiMatch[1]);
      return;
    }

    let body = '{}';
    try {
      body = await readBody(req);
    } catch {
      res.writeHead(413).end('Request body too large');
      return;
    }

    // Build minimal req/res objects matching the shape Vercel passes in
    const vercelLikeReq = { method: req.method, body };
    const vercelLikeRes = {
      _status: 200,
      status(code) { this._status = code; return this; },
      setHeader(key, value) { res.setHeader(key, value); },
      send(text) { res.writeHead(this._status); res.end(text); },
    };

    try {
      await handler(vercelLikeReq, vercelLikeRes);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' }).end('Dev server error: ' + err.message);
    }
    return;
  }

  serveStatic(req, res, url.pathname);
});

server.listen(PORT, () => {
  console.log('Dev server running:');
  console.log('  http://localhost:' + PORT + '/');
  console.log('(Ctrl+C to stop)');
});
