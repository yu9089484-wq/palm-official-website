import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../web');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4'};
http.createServer((req,res) => {
 const pathname = decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
 const file = path.resolve(root,'.' + (pathname === '/' ? '/index.html' : pathname));
 if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);res.end('Not found');return;}
 const size = fs.statSync(file).size;
 const headers = {'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
 const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
 let start = 0, end = size - 1, status = 200;
 if (req.headers.range) {
   if (!range) { res.writeHead(416, {'Content-Range':`bytes */${size}`});res.end();return; }
   start = range[1] ? Number(range[1]) : Math.max(0,size-Number(range[2]));
   end = range[1] && range[2] ? Math.min(Number(range[2]),size-1) : size-1;
   if (start >= size || start > end) {res.writeHead(416, {'Content-Range':`bytes */${size}`});res.end();return;}
   status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
 }
 headers['Content-Length'] = end-start+1;
 res.writeHead(status, headers);
 if (req.method === 'HEAD') {res.end();return;}
 const stream = fs.createReadStream(file,{start,end});
 stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
}).listen(4173, '127.0.0.1', () => console.log('PALM V8 Local: http://127.0.0.1:4173'));
