const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json'};
const server = http.createServer((req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
    fs.readFile(file, (error,data) => { if(error){res.writeHead(404);return res.end('Not found');} res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream'});res.end(data); });
  } catch { res.writeHead(400);res.end('Bad request'); }
});
server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
