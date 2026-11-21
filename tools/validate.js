export class DataError extends Error {}
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const uint = v => Number.isSafeInteger(v) && v >= 0;
const flag = v => typeof v === 'boolean';
const vec = (v,n) => Array.isArray(v) && v.length === n && v.every(Number.isFinite);
function check(ok, path) { if (!ok) throw new DataError('Dữ liệu không hợp lệ tại '+path); }
function fields(v, rules, path) {
  check(object(v),path);
  for (const [key,val] of Object.entries(v)) check(rules[key]?.(val) === true,path+'.'+key);
}
export function validateInputs(data) {
  fields(data,{frames:Array.isArray},'inputs');
  check(Array.isArray(data.frames),'frames');
  let previous = -1;
  for (const [i, frame] of data.frames.entries()) {
    fields(frame,{tick:uint,move:v=>vec(v,2)&&v.every(n=>Math.abs(n)<=1),cam_yaw_deg:Number.isFinite,
      jump:flag,pulse:flag,interact:flag,dash:flag,pause:flag},'frames['+i+']');
    check(uint(frame.tick) && frame.tick>previous,'frames['+i+'].tick');
    previous=frame.tick;
  }
  return data.frames;
}
export function validateScenario(data,t,night=1) {
  const pos = v => vec(v,3);
  fields(data,{player:object,random_motes:flag,random_shades:flag,random_drifters:flag,wind_enabled:flag,drifters:Array.isArray,charms:Array.isArray,motes:Array.isArray,shades:Array.isArray,
    lanterns:Array.isArray,time_left_s:v=>Number.isFinite(v)&&v>=0},'scenario');
  if (data.player) fields(data.player,{pos,carried:v=>uint(v)&&v<=t.carry_capacity,flames:uint,invuln_ticks:uint,dash_cd_ticks:uint,pulse_cd_ticks:uint,charm_ticks:uint},'player');
  for (const [i,m] of (data.motes??[]).entries()) {
    if(Array.isArray(m))check(pos(m),'motes['+i+']');
    else {fields(m,{id:v=>typeof v==='string',pos,kind:v=>['random','dropped'].includes(v),ttl_s:v=>v===null||Number.isFinite(v)&&v>=0},'mote');check(pos(m.pos),'mote.pos');}
  }
  for(const d of data.drifters??[]){fields(d,{id:v=>typeof v==='string',pos,state:v=>['idle','chase','flee'].includes(v),stolen:uint,state_ticks_left:uint},'drifter');check(pos(d.pos),'drifter.pos');}
  for(const c of data.charms??[])fields(c,{id:v=>typeof v==='string',pos,available:flag,respawn_ticks:uint,respawn_s:v=>Number.isFinite(v)&&v>=0},'charm');
  const seen = new Set();
  for (const [i,s] of (data.shades??[]).entries()) {
    fields(s,{pos,state:v=>['spawning','wander','chase','recoil','stunned'].includes(v),state_ticks_left:uint,id:v=>typeof v==='string'&&v.length>0},'shades['+i+']');
    check(pos(s.pos),'shades['+i+'].pos');
    if (s.id) { check(!seen.has(s.id),'shades.id'); seen.add(s.id); }
  }
  seen.clear();
  const ids = Array.from({length:4+night},(_,i)=>'L'+(i+1));
  for (const [i,l] of (data.lanterns??[]).entries()) {
    fields(l,{pos,id:v=>ids.includes(v),lit:flag,deposited:v=>uint(v)&&v<=t.lantern_cost},'lanterns['+i+']');
    check(ids.includes(l.id)&&!seen.has(l.id),'lanterns.id'); seen.add(l.id);
  }
  return data;
}
