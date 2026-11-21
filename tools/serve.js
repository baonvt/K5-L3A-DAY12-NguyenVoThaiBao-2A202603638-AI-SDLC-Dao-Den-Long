import http from 'node:http';
import {scoreStore} from './leaderboard.js';
import {readFile,stat,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const root = fileURLToPath(new URL('../',import.meta.url));
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.json':'application/json','.png':'image/png','.ico':'image/x-icon'};
const allowed = /^\/(?:index\.html|style\.css|game\.contract\.json|src\/[\w/-]+\.js|node_modules\/three\/build\/three\.module\.js)$/;
const store=scoreStore();
if(process.argv[2]==='--export-leaderboard'){
  if(!process.argv[3])throw Error('Cần tên tệp xuất');
  await writeFile(process.argv[3],JSON.stringify({entries:await store.read()},null,2)+'\n');process.exit(0);
}
const server = http.createServer(async (req,res) => {
  try {
    let path = new URL(req.url,'http://localhost').pathname;
    if(path==='/api/leaderboard'){
      res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
      if(req.method==='GET'){res.end(JSON.stringify({entries:await store.read()}));return;}
      if(req.method!=='POST'){res.writeHead(405).end();return;}
      if(req.headers.origin && req.headers.origin!=='http://'+req.headers.host){res.writeHead(403).end();return;}
      let body='';for await(const chunk of req){body+=chunk;if(body.length>2048){res.writeHead(413).end();return;}}
      try{res.end(JSON.stringify({entries:await store.save(JSON.parse(body))}));}
      catch(e){res.writeHead(e instanceof TypeError||e instanceof SyntaxError?400:500).end();}return;
    }
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
