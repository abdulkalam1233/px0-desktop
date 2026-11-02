// Proxies px0 (:7777) on :7778 and adds a web manifest with tabbed display,
// so the installed Edge app gets a tab strip. px0 serves no manifest itself.
import http from 'node:http';
import net from 'node:net';

const TARGET = { host: '127.0.0.1', port: 7777 };
const PORT = 7778;

const manifest = JSON.stringify({
  name: 'px0 workbench',
  short_name: 'px0',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  display_override: ['tabbed'],
  icons: [{ src: 'https://px0.ai/favicon-32x32.png', sizes: '32x32', type: 'image/png' }],
});

const server = http.createServer((req, res) => {
  if (req.url === '/manifest.webmanifest') {
    res.writeHead(200, { 'content-type': 'application/manifest+json' });
    return res.end(manifest);
  }
  const headers = { ...req.headers, host: `${TARGET.host}:${TARGET.port}` };
  delete headers['accept-encoding']; // keep HTML uncompressed so it can be edited
  const upstream = http.request({ ...TARGET, method: req.method, path: req.url, headers }, (up) => {
    if (!String(up.headers['content-type']).includes('text/html')) {
      res.writeHead(up.statusCode, up.headers);
      return up.pipe(res);
    }
    const chunks = [];
    up.on('data', (c) => chunks.push(c));
    up.on('end', () => {
      const html = Buffer.concat(chunks).toString()
        .replace('</head>', '<link rel="manifest" href="/manifest.webmanifest"></head>');
      const { 'content-length': _, ...rest } = up.headers;
      res.writeHead(up.statusCode, rest);
      res.end(html);
    });
  });
  upstream.on('error', (e) => { res.writeHead(502); res.end(`px0 unreachable: ${e.message}`); });
  req.pipe(upstream);
});

// WebSocket upgrades: replay the raw request upstream and pipe both ways.
server.on('upgrade', (req, socket, head) => {
  const up = net.connect(TARGET.port, TARGET.host, () => {
    const lines = [`${req.method} ${req.url} HTTP/1.1`];
    for (let i = 0; i < req.rawHeaders.length; i += 2) lines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
    up.write(lines.join('\r\n') + '\r\n\r\n');
    up.write(head);
    up.pipe(socket).pipe(up);
  });
  up.on('error', () => socket.destroy());
  socket.on('error', () => up.destroy());
});

server.listen(PORT, '127.0.0.1', () => console.log(`px0 tabs proxy on http://127.0.0.1:${PORT}`));
