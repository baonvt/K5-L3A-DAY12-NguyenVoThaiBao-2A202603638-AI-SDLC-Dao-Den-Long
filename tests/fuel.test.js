import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../src/world.js';
const t=JSON.parse(readFileSync(new URL('../game.contract.json',import.meta.url))).tuning;
const game=(s={},n=1)=>new World(t,3,{random_motes:false,random_shades:false,random_drifters:false,...s},n);
test('fuel burns in fixed units, two drains stack, both report at 60 ticks',()=>{
  const w=game({player:{pos:[25,0,0]},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:25}],
    shades:['A','B'].map(id=>({id,pos:[0,1,0],state:'drain',target_lantern_id:'L1'}))});
  for(let i=0;i<60;i++)w.step();assert.equal(w.snapshot().lanterns[0].fuel,14);
  assert.equal(w.events.filter(e=>e.name==='fuel_drain').length,2);
});
test('nearest weak lamp is chosen by ID, chase stays on player, and pulse interrupts drain for 15 points',()=>{
  const w=game({player:{pos:[24,0,0],carried:6},lanterns:['L2','L1'].map(id=>({id,pos:[0,0,0],lit:true,fuel:29})),
    shades:[{id:'A',pos:[1,.8,0],state:'wander'}]});
  w.step();assert.equal(w.shades[0].target,'L1');assert.equal(w.shades[0].state,'drain');
  w.player.pos=[1,0,0];const ev=w.step({pulse:true});assert.equal(ev[0].name,'pulse');assert.equal(w.score,15);
});
test('relight, capacity cap and partial refuel; saturated lamp never takes more than needed',()=>{
  const w=game({player:{carried:10,successful_lights:4},lanterns:[{id:'L1',pos:[0,0,0],ever_lit:true}]});
  const ev=w.step({interact:true});assert.equal(ev[1].data.relight,true);assert.equal(w.capacity,20);
  assert.equal(w.lanterns[0].relit_count,1);assert.equal(w.score,65);
  w.step({interact:false});const refuel=w.step({interact:true})[0];assert.deepEqual(refuel.data,{lantern_id:'L1',amount:1,fuel:100});assert.equal(w.score,70);
});
test('exact threshold at step 6 protects, refuel expels drainer, depletion resets deposit',()=>{
  const w=game({player:{carried:1},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:30+1/60}],shades:[{pos:[0,1,0]}]});
  w.step();assert.equal(w.safe.length,1);
  w.shades[0].pos=[1,1,0];w.shades[0].state='drain';w.shades[0].target='L1';
  w.step({interact:true});assert.ok(w.lanterns[0].units>=1800);assert.ok(Math.hypot(w.shades[0].pos[0],w.shades[0].pos[2])>=6);
  w.lanterns[0].units=1;assert.equal(w.step()[0].name,'lantern_out');assert.equal(w.lanterns[0].deposited,0);
});
test('dawn ratios for every night, no early victory, death takes priority over dawn',()=>{
  for(const n of [1,2,3])for(const delta of [0,-1]){
    const count=Math.ceil((n+4)*.6)+delta;
    const w=game({time_left_s:2/60,lanterns:Array.from({length:count},(_,i)=>({id:'L'+(i+1),lit:true}))},n);
    w.step();assert.equal(w.state,'playing');w.step();assert.equal(w.state,delta?'lost':'won');
  }
  const w=game({time_left_s:1/60,player:{flames:1},lanterns:[1,2,3,4,5].map(i=>({id:'L'+i,lit:true})),shades:[{pos:[0,.8,0]}]});
  w.step();assert.equal(w.events.at(-1).data.reason,'no_flames');
});
