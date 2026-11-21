import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';

test('seed 17 from spawn: win by all five deposits; standing still loses to shades', t => {
  const dir = mkdtempSync(join(tmpdir(),'dao-full-night-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  function play(extra) {
    const out=join(dir,'actual.jsonl');
    const r=spawnSync(process.execPath,['tools/headless.js','--seed','17','--night','1','--ticks','14400',
      '--out',out,'--snapshot-every','300',...extra],{encoding:'utf8'});
    assert.equal(r.status,0,r.stderr);
    return readFileSync(out,'utf8').trim().split('\n').map(JSON.parse);
  }
  const won=play(['--inputs','docs/proof/full-night/inputs.json']);
  assert.deepEqual(won.filter(r=>r.name==='lantern_lit').map(r=>r.data.lantern_id),['L1','L2','L3','L4','L5']);
  assert.deepEqual(won.at(-1),{type:'end',ticks:1355,state:'won',score:1344});
  const lost=play([]);
  assert.equal(lost.find(r=>r.name==='game_over').data.reason,'no_flames');
  assert.equal(lost.filter(r=>r.name==='player_hit').length,3);
  assert.equal(lost.at(-1).state,'lost');
});
