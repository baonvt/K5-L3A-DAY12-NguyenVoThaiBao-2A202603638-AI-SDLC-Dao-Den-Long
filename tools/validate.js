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
      jump:flag,pulse:flag,interact:flag,dash:flag},'frames['+i+']');
    check(uint(frame.tick) && frame.tick>previous,'frames['+i+'].tick');
    previous=frame.tick;
  }
  return data.frames;
}
export function validateScenario(data,t) {
  const pos = v => vec(v,3);
  fields(data,{player:object,random_motes:flag,random_shades:flag,motes:Array.isArray,shades:Array.isArray,
    lanterns:Array.isArray,time_left_s:v=>Number.isFinite(v)&&v>=0},'scenario');
  if (data.player) fields(data.player,{pos,carried:v=>uint(v)&&v<=t.carry_capacity,flames:uint},'player');
  for (const [i,m] of (data.motes??[]).entries()) check(pos(m),'motes['+i+']');
  const seen = new Set();
  for (const [i,s] of (data.shades??[]).entries()) {
    fields(s,{pos,id:v=>typeof v==='string'&&v.length>0},'shades['+i+']');
    check(pos(s.pos),'shades['+i+'].pos');
    if (s.id) { check(!seen.has(s.id),'shades.id'); seen.add(s.id); }
  }
  seen.clear();
  const ids = Array.from({length:t.lantern_count_night1},(_,i)=>'L'+(i+1));
  for (const [i,l] of (data.lanterns??[]).entries()) {
    fields(l,{pos,id:v=>ids.includes(v),lit:flag,deposited:v=>uint(v)&&v<=t.lantern_cost},'lanterns['+i+']');
    check(ids.includes(l.id)&&!seen.has(l.id),'lanterns.id'); seen.add(l.id);
  }
  return data;
}
