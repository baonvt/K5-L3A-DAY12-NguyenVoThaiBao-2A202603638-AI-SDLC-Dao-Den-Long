import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World,HZ,distance} from '../src/world.js';
const t = JSON.parse(readFileSync(new URL('../game.contract.json',import.meta.url))).tuning;
const game = scenario=>new World(t,9,{random_motes:false,random_shades:false,...scenario});
const advance=(w,n)=>{for(let i=0;i<n;i++) w.step();};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8, a+' ≠ '+b);
test('yaw, analog input, normalized diagonals and sticky fields',()=>{
  const w=game();
  w.step({move:[0,.5],cam_yaw_deg:90}); advance(w,HZ-1);
  near(w.player.pos[0],t.player_speed/2); near(w.player.pos[2],0);
  const before=[...w.player.pos]; w.step({move:[1,1]}); advance(w,HZ-1);
  near(distance(before,w.player.pos),t.player_speed);
});
test('jump is edge triggered and returns feet to the ground',()=>{
  const w=game();
  w.step({jump:true}); assert.ok(w.player.pos[1]>0); advance(w,100);
  assert.equal(w.player.pos[1],0); w.step({jump:false}); w.step({jump:true}); assert.ok(w.player.pos[1]>0);
});
test('horizontal pickup at exact radius and full bag preserves leftovers',()=>{
  const w=game({player:{pos:[0,1.5,0],carried:t.carry_capacity-1},motes:[[t.pickup_radius,0,0],[0,0,0],[0,0,t.pickup_radius+.01]]});
  assert.deepEqual(w.step().map(e=>e.name),['mote_picked']);
  assert.equal(w.player.carried,t.carry_capacity); assert.equal(w.motes.length,2); assert.equal(w.score,0);
});
test('deposits only what fits, leaves other IDs intact, held interact needs new edge',()=>{
  const w=game({lanterns:[{id:'L2',pos:[0,0,t.interact_radius],deposited:t.lantern_cost-2}],player:{carried:1}});
  assert.equal(w.lanterns.length,5); assert.equal(w.score,0);
  assert.equal(w.step({interact:true})[0].data.amount,1); assert.equal(w.lanterns[1].lit,false);
  w.addMote([0,0,0]); w.addMote([0,0,0]); w.step(); assert.equal(w.player.carried,2);
  w.step({interact:false}); assert.deepEqual(w.step({interact:true}).map(e=>e.name),['deposit','lantern_lit']);
  assert.equal(w.player.carried,1); assert.equal(w.score,t.score.per_lantern+2*t.score.per_mote);
});
test('pulse radius, cost, cooldown, push and exact wake tick',()=>{
  const w=game({player:{carried:8,invuln_ticks:600},shades:[{id:'near',pos:[t.pulse_radius,.8,0]},{id:'far',pos:[-t.pulse_radius-.01,1,0]}]});
  const e=w.step({pulse:true})[0]; assert.deepEqual(e.data.stunned_ids,['near']);
  assert.equal(w.player.carried,8-t.pulse_cost); assert.equal(w.score,t.score.per_stun);
  near(w.shades[0].pos[0],t.pulse_radius+t.pulse_push_m/15);
  w.step({pulse:false}); assert.ok(!w.step({pulse:true}).some(e=>e.name==='pulse'));
  advance(w,t.pulse_stun_s*HZ-3); assert.equal(w.shades[0].state,'stunned');
  w.step(); assert.equal(w.shades[0].state,'wander');
  advance(w,t.pulse_cooldown_s*HZ); w.step({pulse:false}); assert.ok(w.step({pulse:true}).some(e=>e.name==='pulse'));
  const empty=game(); assert.deepEqual(empty.step({pulse:true}),[]);
});
test('shade contact drops floor(ratio × bag), invulnerability has exact duration',()=>{
  const w=game({player:{carried:5},shades:[{pos:[0,0,0]},{pos:[0,1,0]}]});
  const e=w.step(); assert.equal(e.length,1); assert.deepEqual(e[0].data,{by:'shade',flames:t.flames-1,dropped:Math.floor(5*t.hit_drop_ratio)});
  advance(w,t.invuln_s*HZ-1); assert.equal(w.player.flames,t.flames-1);
  advance(w,120); assert.ok(w.player.flames<=t.flames-2);
});
test('lit lamps shelter player and exclude a chasing shade',()=>{
  const w=game({lanterns:[{id:'L1',pos:[0,0,0],lit:true}],shades:[{pos:[5,0,0]}]});
  advance(w,300); assert.ok(distance(w.shades[0].pos,[0,0,0])>=t.safe_radius);assert.equal(w.player.flames,t.flames);
});
test('three end reasons, early stop and win bonus',()=>{
  const w=game({time_left_s:1/HZ,player:{carried:t.lantern_cost},lanterns:Array.from({length:5},(_,i)=>({id:'L'+(i+1),lit:i!==0,pos:[i,0,0]}))});
  const last=w.step({interact:true}).at(-1);
  assert.deepEqual(last,{type:'event',tick:1,name:'game_over',data:{result:'won',reason:'dawn_survived'}});
  assert.equal(w.score,t.lantern_cost*t.score.per_mote+t.score.per_lantern+150+4*149+t.flames*t.score.per_flame_left);
  w.step(); assert.equal(w.tick,1);
  const dawn=game({time_left_s:1/HZ}); assert.equal(dawn.step().at(-1).data.reason,'dawn');
  const dark=game({player:{flames:1},shades:[{pos:[0,0,0]}]}); assert.equal(dark.step().at(-1).data.reason,'no_flames');
});
test('seeded spawns are reproducible and reserve explicit shade IDs',()=>{
  const s={random_motes:false,shades:[{pos:[26,0,0]},{id:'S1',pos:[26,0,0]}],player:{flames:100}};
  const w=new World(t,19,s), w2=new World(t,19,s);
  for(let i=0;i<780;i++) assert.deepEqual(w.step(),w2.step());
  assert.deepEqual(w.snapshot(),w2.snapshot()); assert.ok(w.events.some(e=>e.name==='shade_spawned'));
  assert.equal(new Set(w.shades.map(s=>s.id)).size,w.shades.length);
  assert.equal(w.motes.length,0);
});
