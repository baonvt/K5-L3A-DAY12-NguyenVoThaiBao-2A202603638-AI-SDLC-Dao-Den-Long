import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const run=(...args)=>spawnSync(process.execPath,['tools/headless.js','--seed','17','--night','1',...args],{encoding:'utf8'});
function directory(t) {
  const dir=mkdtempSync(join(tmpdir(),'dao-test-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));return dir;
}
test('CLI outputs exact ticks/cadence, deterministic bytes and different seeds',t=>{
  const dir=directory(t),out=join(dir,'out.jsonl');
  const play=(...extra)=>{const r=run('--ticks','21','--out',out,...extra);assert.equal(r.status,0,r.stderr);return readFileSync(out,'utf8');};
  const a=play(); assert.equal(play(),a); assert.notEqual(play('--seed','18'),a);
  const rows=a.trim().split('\n').map(JSON.parse);assert.deepEqual(rows.filter(r=>r.type==='snapshot').map(r=>r.tick),[0,10,20]);assert.equal(rows.at(-1).ticks,21);
  assert.equal(play('--ticks','0').trim().split('\n').length,3);
});
test('malformed JSON, shapes and frame order exit 2 with stderr',t=>{
  const dir=directory(t),file=join(dir,'case.json'),out=join(dir,'out.jsonl');
  for(const [flag,content] of [['inputs','{'],['inputs','null'],['inputs','{"frames":[{"tick":1},{"tick":1}]}'],
    ['inputs','{"frames":[{"tick":1,"move":[2,0]}]}'],['inputs','{"frames":[{"tick":0,"pulse":1}]}'],
    ['scenario','{"lanterns":[{"id":"L9"}]}'],['scenario','{"shades":[{"pos":[1,2]}]}'],['scenario','{"motes":null}']]){
    writeFileSync(file,content);const r=run('--ticks','0','--out',out,'--'+flag,file);
    assert.equal(r.status,2,content);assert.ok(r.stderr.trim());
  }
  const r=run('--ticks','0','--out',dir);assert.notEqual(r.status,0);assert.ok(r.stderr.trim());
});
test('real JSON inputs apply after tick 0, emit step index and stop at dawn',t=>{
  const dir=directory(t),s=join(dir,'s.json'),f=join(dir,'i.json'),out=join(dir,'out');
  writeFileSync(s,JSON.stringify({random_shades:false,random_motes:false,time_left_s:2/60,motes:[[0,0,0]]}));
  writeFileSync(f,JSON.stringify({frames:[{tick:0,move:[0,1]}]}));
  assert.equal(run('--ticks','100','--out',out,'--scenario',s,'--inputs',f,'--snapshot-every','1').status,0);
  const rows=readFileSync(out,'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(rows[0].player.carried,0);assert.equal(rows[0].player.pos[2],0);
  assert.equal(rows[2].name,'mote_picked');assert.equal(rows[2].tick,1);
  assert.equal(rows.at(-2).player.pos[2],.2);
  assert.deepEqual(rows.at(-1),{type:'end',ticks:2,state:'lost',score:0});
});
