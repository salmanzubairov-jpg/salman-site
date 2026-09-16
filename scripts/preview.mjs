import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
const root = resolve('dist');
const port = Number(process.env.PORT || 4173);
const rawHeaders = await readFile(join(root,'_headers'),'utf8');
const configured = Object.fromEntries(rawHeaders.split('\n').filter((l)=>l.startsWith('  ')).map((l)=>{const i=l.indexOf(':');return [l.slice(2,i),l.slice(i+1).trim()];}));
if(process.env.CSP_REPORT_ONLY === '1') {
  configured['Content-Security-Policy-Report-Only'] = configured['Content-Security-Policy'];
  delete configured['Content-Security-Policy'];
}
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
createServer(async(req,res)=>{
  Object.entries(configured).forEach(([k,v])=>res.setHeader(k,v));
  res.setHeader('Cache-Control','no-store');
  if(!['GET','HEAD'].includes(req.method)) {res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname.split('/').some((part)=>part.startsWith('.') && part!=='.well-known') || pathname.includes('\\') || /\/(?:_headers|_redirects)$/.test(pathname)) throw new Error('not found');
    let file=resolve(root,'.'+pathname);
    if(file!==root && !file.startsWith(root+sep)) throw new Error('not found');
    if((await stat(file)).isDirectory()) {
      if(!pathname.endsWith('/')) {res.writeHead(301,{'Location':pathname+'/'});res.end();return;}
      file=join(file,'index.html');
    }
    let bytes=await readFile(file);res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');
    if (/\.(html|css|js|xml|txt|json|svg|webmanifest)$/.test(file) && (req.headers['accept-encoding']||'').includes('gzip')) {
      bytes=gzipSync(bytes);res.setHeader('Content-Encoding','gzip');res.setHeader('Vary','Accept-Encoding');
    }
    res.writeHead(200);res.end(req.method==='HEAD'?undefined:bytes);
  } catch {res.setHeader('Content-Type','text/html; charset=utf-8');res.writeHead(404);res.end(req.method==='HEAD'?undefined:await readFile(join(root,'404.html')));}
}).listen(port,'127.0.0.1',()=>console.log(`Local preview: http://127.0.0.1:${port}`));
