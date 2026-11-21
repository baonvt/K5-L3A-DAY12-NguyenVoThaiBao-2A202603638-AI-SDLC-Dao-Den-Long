import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {scoreStore} from '../tools/leaderboard.js';
test('persistent top ten, name validation, concurrent saves, tie order and export',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'dao-scores-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const store=scoreStore(dir),entry={name:'May_1',score:0,nights_won:1,seed:42};
  for(const invalid of ['AB','a b','abcdefghijklmn','<img>'])await assert.rejects(store.save({...entry,name:invalid}),TypeError);
  await store.save({...entry,name:'First',score:90});await store.save({...entry,name:'Later',score:90});
  await Promise.all(Array.from({length:12},(_,i)=>store.save({...entry,name:'May_'+i,score:i})));
  const rows=await scoreStore(dir).read();assert.equal(rows.length,10);assert.deepEqual(rows.slice(0,3).map(r=>r.name),['First','Later','May_11']);
  assert.ok(rows.every(r=>/Z$/.test(r.achieved_at)&&Number.isFinite(Date.parse(r.achieved_at))));
  const out=join(dir,'export.json'),r=spawnSync(process.execPath,['tools/serve.js','--export-leaderboard',out],{env:{...process.env,DAO_DATA_DIR:dir}});
  assert.equal(r.status,0,r.stderr.toString());assert.deepEqual(JSON.parse(await readFile(out)),{entries:rows});
});
