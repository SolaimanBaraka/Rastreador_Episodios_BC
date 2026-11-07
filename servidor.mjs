// Sirve la página en http://localhost:5517 (así los vídeos de YouTube se reproducen dentro).
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PUERTO = 5517;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };

http.createServer((req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const archivo = path.join(DIR, ruta === '/' ? 'index.html' : ruta);
  if (!archivo.startsWith(DIR) || archivo.includes('wiki-cache')) { res.writeHead(404); return res.end(); }
  fs.readFile(archivo, (err, datos) => {
    if (err) { res.writeHead(404); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream' });
    res.end(datos);
  });
}).listen(PUERTO, '127.0.0.1', () => console.log(`Grimorio abierto en http://localhost:${PUERTO}  (cierra esta ventana para apagarlo)`));
