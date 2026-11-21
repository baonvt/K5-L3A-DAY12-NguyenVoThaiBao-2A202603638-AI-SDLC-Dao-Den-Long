import {readFileSync,writeFileSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {performance} from 'node:perf_hooks';
import {World,seeded} from '../src/world.js';
const {values}=parseArgs({options:{seed:{type:'string',default:'7'},nights:{type:'string',default:'10'},out:{type:'string',default:'soak.json'}}});
const seed=Number(values.seed),nights=Number(values.nights);
if(!Number.isSafeInteger(seed)||!Number.isSafeInteger(nights)||nights<1)throw Error('Invalid seed or nights');
const {tuning}=JSON.parse(readFileSync(new URL('../game.contract.json',import.meta.url)));
const rss=()=>process.memoryUsage.rss()/1048576,results=[];
let crashes=0,w,startMem;const start=performance.now();
for(let i=0;i<nights;i++){
  const n=i%3+1;
  try{
    w=new World(tuning,seed+i,{},n);if(i===0)startMem=rss();
    const rng=seeded(seed+i);let move=[0,0];
    const limit=tuning['night'+n+'_duration_s']*60;
    while(w.simTick<limit && w.state==='playing'){
      if(w.simTick%30===0){const a=rng()*Math.PI*2;move=[Math.cos(a),Math.sin(a)];}
      w.step({move,jump:rng()<.05,dash:rng()<.03,pulse:rng()<.02,interact:rng()<.1});
    }
    results.push(w.state);
  }catch(e){crashes++;results.push('crash');console.error(e);}
  w=null;
}
w=new World(tuning,seed+nights,{},nights%3+1);
const report={nights,crashes,results,mem_start_mb:startMem,mem_end_mb:rss(),duration_s:(performance.now()-start)/1000};
writeFileSync(values.out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(crashes)process.exitCode=1;
