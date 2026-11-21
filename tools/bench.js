import {performance} from 'node:perf_hooks';
import {writeFileSync} from 'node:fs';
import os from 'node:os';
import {parseArgs} from 'node:util';
import assert from 'node:assert/strict';
import {openGame} from './browser.js';
const start=performance.timeOrigin;
const {values}=parseArgs({options:{seed:{type:'string',default:'42'},duration:{type:'string',default:'30'},out:{type:'string',default:'bench.json'}}});
const duration=Number(values.duration),seed=Number(values.seed);
if(!Number.isSafeInteger(seed)||!Number.isFinite(duration)||duration<=0)throw Error('Invalid seed or duration');
const game=await openGame();
try{
  await game.page.goto(game.url+'/?bench=1&duration='+duration+'&seed='+seed,{waitUntil:'domcontentloaded'});
  await game.page.waitForFunction(()=>Object.hasOwn(window,'islandBenchmark'),{},{timeout:30000});
  const {intervals,renderer,firstFrame,scene}=await game.page.evaluate(()=>window.islandBenchmark);
  assert.deepEqual(scene,{shades:200,motes:100,lit:3,width:1280,height:720});
  const sorted=intervals.toSorted((a,b)=>a-b),n=sorted.length,k=Math.max(1,Math.ceil(.01*n));
  const sum=items=>items.reduce((a,b)=>a+b,0),round=v=>Math.round(v*100)/100;
  const report={contract_version:'1.3',avg_fps:round(1000*n/sum(sorted)),p1_low_fps:round(1000*k/sum(sorted.slice(-k))),
    frame_ms_p95:round(sorted[Math.ceil(.95*n)-1]),frames:n,load_ms:Math.round(firstFrame-start),
    peak_mem_mb:null,vsync_off:false,renderer,os:os.type()+' '+os.release()+' '+os.arch()};
  writeFileSync(values.out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await game.close();}
