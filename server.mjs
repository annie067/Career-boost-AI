import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { createServer as createViteServer } from 'vite';

const root = process.cwd();
const indexHtmlPath = path.resolve(root, 'index.html');

async function loadDotEnv() {
  const envPath = path.resolve(root, '.env');

  try {
    const raw = await fs.readFile(envPath, 'utf8');
    const lines = raw.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex === -1) continue;

      const key = trimmed.slice(0, equalsIndex).trim();
      if (!key || process.env[key] !== undefined) continue;

      let value = trimmed.slice(equalsIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  } catch {
    // No .env file is fine; the app can still run with shell environment variables.
  }
}

function enhanceResponse(res) {
  if (res.status) return;

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (payload) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    res.end(JSON.stringify(payload));
    return res;
  };

  res.send = (payload) => {
    if (typeof payload === 'object' && !Buffer.isBuffer(payload)) {
      return res.json(payload);
    }

    res.end(payload);
    return res;
  };
}

async function readRawBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

function shouldParseBody(req, contentType) {
  if (!req.method || ['GET', 'HEAD'].includes(req.method)) return false;
  if (!contentType) return true;
  return !contentType.includes('multipart/form-data');
}

async function loadApiModule(routeName) {
  const filePath = path.resolve(root, 'api', `${routeName}.js`);
  const moduleUrl = `${pathToFileURL(filePath).href}?t=${Date.now()}`;
  return import(moduleUrl);
}

async function handleApi(req, res) {
  const url = new URL(req.url || '/', 'http://localhost');
  const routeName = path.basename(url.pathname);

  if (!routeName || routeName.includes('..')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  try {
    const mod = await loadApiModule(routeName);
    const handler = mod.default;

    if (typeof handler !== 'function') {
      res.status(500).json({ error: `API handler for /api/${routeName} is invalid` });
      return;
    }

    req.query = Object.fromEntries(url.searchParams.entries());

    const contentType = String(req.headers['content-type'] || '');
    if (shouldParseBody(req, contentType)) {
      const rawBody = await readRawBody(req);

      if (contentType.includes('application/json')) {
        req.body = rawBody.length ? JSON.parse(rawBody.toString('utf8')) : {};
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        req.body = Object.fromEntries(new URLSearchParams(rawBody.toString('utf8')));
      } else {
        req.body = rawBody;
      }
    }

    await handler(req, res);
  } catch (error) {
    console.error(`API error for /api/${routeName}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    } else {
      res.end();
    }
  }
}

await loadDotEnv();

const vite = await createViteServer({
  server: {
    middlewareMode: true,
  },
  appType: 'spa',
});

const server = http.createServer(async (req, res) => {
  enhanceResponse(res);

  const pathname = new URL(req.url || '/', 'http://localhost').pathname;

  if (pathname.startsWith('/api/')) {
    await handleApi(req, res);
    return;
  }

  vite.middlewares(req, res, async () => {
    try {
      const template = await fs.readFile(indexHtmlPath, 'utf8');
      const html = await vite.transformIndexHtml(pathname, template);
      res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(html);
    } catch (error) {
      vite.ssrFixStacktrace(error);
      res.status(500).end(error.stack);
    }
  });
});

const port = Number(process.env.PORT || 5173);
server.listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}`);
});
