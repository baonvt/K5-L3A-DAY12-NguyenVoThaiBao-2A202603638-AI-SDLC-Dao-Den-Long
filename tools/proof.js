import {spawnSync} from 'node:child_process';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base='docs/proof/phase-3/';
const temp=mkdtempSync(join(tmpdir(),'lantern-proof-'));
try {
  function collect(out) {
    const r=spawnSync(process.execPath,['tools/headless.js','--seed','17','--night','1','--scenario',base+'scenario.json',
      '--inputs',base+'inputs.json','--ticks','600','--snapshot-every','5','--out',out],{encoding:'utf8'});
    assert.equal(r.status,0,r.stderr);return readFileSync(out);
  }
  const first=collect(base+'actual.jsonl');
  assert.ok(first.equals(collect(join(temp,'repeat.jsonl'))));
  const rows=first.toString().trim().split('\n').map(JSON.parse);
  assert.deepEqual(rows.filter(r=>r.type==='event').map(r=>r.name),['night_start','lantern_out','deposit','lantern_lit','game_over']);
  assert.deepEqual(rows.at(-1),{type:'end',ticks:3,state:'won',score:573});
  console.log('seed 17 · won at tick 3 · score 573 · SHA-256 '+createHash('sha256').update(first).digest('hex'));
} finally { rmSync(temp,{recursive:true,force:true}); }
