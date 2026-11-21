import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';

test('standard island: five lanterns and twenty unique starting sites; idle run terminates', t => {
  const dir = mkdtempSync(join(tmpdir(),'dao-full-night-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  function play(extra) {
    const out=join(dir,'actual.jsonl');
    const r=spawnSync(process.execPath,['tools/headless.js','--seed','17','--night','1','--ticks','21600',
      '--out',out,'--snapshot-every','300',...extra],{encoding:'utf8'});
    assert.equal(r.status,0,r.stderr);
    return readFileSync(out,'utf8').trim().split('\n').map(JSON.parse);
  }
  const lost=play([]);
  const opening=lost[0];
  assert.equal(opening.lanterns.length,5);
  assert.equal(opening.motes.length,20);
  assert.equal(new Set(opening.motes.map(m=>m.pos.join(','))).size,20);
  assert.ok(['dawn','no_flames'].includes(lost.find(r=>r.name==='game_over').data.reason));

  assert.equal(lost.at(-1).state,'lost');
});
