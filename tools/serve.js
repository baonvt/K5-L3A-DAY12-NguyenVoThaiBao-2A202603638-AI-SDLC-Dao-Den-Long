import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const root = fileURLToPath(new URL('../',import.meta.url));
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.json':'application/json','.png':'image/png','.ico':'image/x-icon'};
const allowed = /^\/(?:index\.html|style\.css|game\.contract\.json|src\/[\w/-]+\.js|node_modules\/three\/build\/three\.module\.js)$/;
const server = http.createServer(async (req,res) => {
  try {
    let path = new URL(req.url,'http://localhost').pathname;
    if (path==='/') path='/index.html';
    const target=resolve(root,'.'+path);
    if (!allowed.test(path) || !target.startsWith(resolve(root)+sep) || !(await stat(target)).isFile()) {
      res.writeHead(404).end(); return;
    }
    res.setHeader('Content-Type',types[extname(target)] ?? 'application/octet-stream');
    res.end(await readFile(target));
  } catch { res.writeHead(404).end(); }
});
server.on('error',err=>{console.error(err.message);process.exitCode=1;});
server.listen(Number(process.env.PORT??4173),'127.0.0.1',()=>{
  const url='http://127.0.0.1:'+server.address().port;
  console.log('Đảo Đèn Lồng · '+url);
  if (process.stdout.isTTY && !process.env.CI && !process.env.NO_OPEN) {
    const cmd = process.platform==='win32' ? ['rundll32',['url.dll,FileProtocolHandler',url]] :
      process.platform==='darwin' ? ['open',[url]] : ['xdg-open',[url]];
    const child=spawn(cmd[0],cmd[1],{stdio:'ignore',detached:true,windowsHide:true});
    child.on('error',()=>{}); child.unref();
  }
});
