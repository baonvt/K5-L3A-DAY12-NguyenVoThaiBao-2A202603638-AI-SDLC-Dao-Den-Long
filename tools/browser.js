import {chromium} from 'playwright-core';
import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
export async function openGame({headless=false,recordVideo}={}){
  const server=spawn(process.execPath,[fileURLToPath(new URL('serve.js',import.meta.url))],{
    env:{...process.env,PORT:'0',NO_OPEN:'1'},stdio:['ignore','pipe','inherit']});
  const [line]=await once(server.stdout,'data'), url=line.toString().match(/http:\/\/127\.0\.0\.1:\d+/)[0];
  const candidates=[process.env.CHROME_PATH,chromium.executablePath(),'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
  const executablePath=candidates.find(p=>p&&existsSync(p));
  try{
    const browser=await chromium.launch({headless,executablePath,args:['--window-size=1280,720','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
    const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1,recordVideo});
    return {url,page,browser,close:async()=>{try{await browser.close();}finally{server.kill();}}};
  }catch(err){server.kill();throw err;}
}
