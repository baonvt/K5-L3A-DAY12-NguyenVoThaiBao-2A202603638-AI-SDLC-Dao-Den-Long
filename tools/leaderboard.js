import {readFile,writeFile,mkdir,rename,unlink,rmdir} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
export function scoreStore(dir=process.env.DAO_DATA_DIR??join(homedir(),'.dao-den-long')){
  const file=join(dir,'scores.json'),lock=join(dir,'writing');
  async function read(){
    try{return JSON.parse(await readFile(file,'utf8')).entries;}
    catch(e){if(e.code==='ENOENT')return [];throw e;}
  }
  async function save(input){
    if(typeof input?.name!=='string'||!/^\w{3,12}$/.test(input.name)||
       !Number.isSafeInteger(input.score)||input.score<0||!Number.isSafeInteger(input.nights_won)||
       input.nights_won<0||input.nights_won>3||!Number.isSafeInteger(input.seed))throw new TypeError('Tên hoặc điểm không hợp lệ');
    await mkdir(dir,{recursive:true});
    for(let i=0;;i++){
      try{await mkdir(lock);break;}catch(e){if(e.code!=='EEXIST'||i>=150)throw e;await delay(20);}
    }
    const tmp=file+'.'+randomUUID()+'.tmp';
    try{
      const entries=await read();
      entries.push({name:input.name,score:input.score,nights_won:input.nights_won,achieved_at:new Date().toISOString(),seed:input.seed});
      entries.sort((a,b)=>b.score-a.score||Date.parse(a.achieved_at)-Date.parse(b.achieved_at));entries.length=Math.min(10,entries.length);
      await writeFile(tmp,JSON.stringify({entries},null,2)+'\n');await rename(tmp,file);return entries;
    }finally{await unlink(tmp).catch(e=>{if(e.code!=='ENOENT')throw e;});await rmdir(lock);}
  }
  return {read,save};
}
