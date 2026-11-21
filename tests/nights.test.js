import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World,distance} from '../src/world.js';
import {floorAt} from '../src/maps.js';
const t=JSON.parse(readFileSync(new URL('../game.contract.json',import.meta.url))).tuning;
const world=(s={},n=2)=>new World(t,17,{random_motes:false,random_shades:false,random_drifters:false,...s},n);
const run=(w,n,frame)=>{for(let i=0;i<n;i++)w.step(i===0?frame:{});};
test('three maps, ramps, bridge and launch pads',()=>{
  assert.deepEqual([1,2,3].map(n=>world({},n).lanterns.length),[5,6,7]);
  assert.equal(floorAt(2,35,2),0);assert.equal(floorAt(2,35,2.01),-Infinity);
  assert.equal(floorAt(3,0,6),6);assert.equal(floorAt(3,0,18),3);
  assert.ok(Math.abs(floorAt(3,27*Math.sqrt(3)/2,13.5)-1.5)<1e-7);
  const w=world({player:{pos:[20,0,18]}});run(w,90,{move:[-1,0]});assert.ok(w.player.pos[0]>45);assert.equal(w.player.grounded,true);
});
test('pause freezes clocks, cooldown and TTL; dash on a rising edge lasts twelve steps',()=>{
  const w=world({player:{pulse_cd_ticks:20},motes:[{id:'drop',pos:[5,0,0],kind:'dropped',ttl_s:1}]});
  w.step({pause:true});run(w,40);assert.equal(w.simTick,0);assert.equal(w.motes[0].life,60);
  w.step({pause:false});w.step({pause:true,dash:true});run(w,11);assert.equal(w.simTick,12);
  assert.ok(Math.abs(w.player.pos[2]-2.8)<1e-7);assert.equal(w.player.dash,0);
});
test('charm pickup, repeated dash and respawn clock',()=>{
  const w=world({player:{pos:[35,0,0]}});assert.equal(w.step()[0].name,'charm_picked');
  assert.equal(w.player.charm,600);assert.equal(w.charms[0].wait,2700);
  run(w,12,{dash:true,move:[1,0]});w.step({dash:false});assert.ok(w.step({dash:true}).some(e=>e.name==='dash'));
  run(w,2700);assert.equal(w.charms[0].available,true);
});
test('drifter steals before hit, ignores invulnerability, drops cargo to pulse',()=>{
  const w=world({player:{carried:10,invuln_ticks:30},drifters:[{id:'D1',pos:[0,.8,0]}]});
  assert.equal(w.step()[0].name,'drifter_steal');assert.equal(w.player.carried,7);
  assert.ok(w.step({pulse:true}).some(e=>e.name==='drifter_drop'&&e.data.amount===3));assert.equal(w.motes.length,3);
  run(w,120);assert.equal(w.drifters.length,0);
});
test('fall ignores invulnerability, loses bag once and respawns after 60 ticks',()=>{
  const w=world({player:{pos:[35,-10.1,5],invuln_ticks:90,carried:6}});
  assert.equal(w.step()[0].data.lost,6);run(w,59);assert.equal(w.player.respawn,1);w.step();assert.deepEqual(w.player.pos,[0,0,0]);assert.equal(w.player.flames,2);
});
test('wind warning then exactly five seconds of wind; scheduled enemies',()=>{
  const w=world({random_drifters:true},3);run(w,1679);assert.ok(w.step().some(e=>e.name==='wind_warning'));
  assert.equal(w.drifters.length,1);run(w,120);assert.equal(w.wind.active,true);const before=[...w.player.pos];
  run(w,60);assert.ok(distance(before,w.player.pos)>1.99);run(w,240);assert.equal(w.wind.active,false);
});
test('height matters for pickup, hit and spherical pulse',()=>{
  const w=world({player:{pos:[0,5,0],carried:3},motes:[[0,0,0]],shades:[{pos:[0,0,0]}]});
  const ev=w.step({pulse:true});assert.deepEqual(ev.find(e=>e.name==='pulse').data.stunned_ids,[]);assert.equal(w.player.flames,3);assert.equal(w.motes.length,1);
});
