import {readFileSync,openSync,writeSync,closeSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {World} from '../src/world.js';
import {DataError,validateInputs,validateScenario} from './validate.js';

const contract = JSON.parse(readFileSync(new URL('../game.contract.json',import.meta.url)));
function load(path) {
  try { return JSON.parse(readFileSync(path,'utf8').replace(/^\uFEFF/,'')); }
  catch (error) { throw new DataError(path+' — '+error.message); }
}
function integer(value,name,min) {
  if (!/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value)<min)
    throw new Error('Tham số sai: --'+name);
  return Number(value);
}
function run() {
  const names = ['seed','night','scenario','inputs','ticks','out','snapshot-every'];
  const options = Object.fromEntries(names.map(n=>[n,{type:'string'}]));
  const {values:a} = parseArgs({options});
  const seed = integer(a.seed,'seed',Number.MIN_SAFE_INTEGER);
  if (a.night!=='1' || !a.out) throw new Error('Cần --night 1 và --out <file.jsonl>');
  const limit = integer(a.ticks,'ticks',0);
  const cadence = integer(a['snapshot-every']??'10','snapshot-every',1);
  const frames = a.inputs===undefined ? [] : validateInputs(load(a.inputs));
  const scenario = a.scenario===undefined ? {} : validateScenario(load(a.scenario),contract.tuning);
  const world = new World(contract.tuning,seed,scenario);
  const fd = openSync(a.out,'w');
  const line = value => writeSync(fd,JSON.stringify(value)+'\n');
  try {
    line(world.snapshot());
    let cursor = 0;
    while (world.tick<limit && world.state==='playing') {
      const frame = frames[cursor]?.tick===world.tick ? frames[cursor++] : undefined;
      for (const event of world.step(frame)) line(event);
      if (world.tick%cadence===0) line(world.snapshot());
    }
    line({type:'end',ticks:world.tick,state:world.state,score:world.score});
  } finally { closeSync(fd); }
}
try { run(); }
catch (err) { console.error(err.message); process.exitCode = err instanceof DataError ? 2 : 1; }
