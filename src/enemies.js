import {distance,floorAt} from './maps.js';
export function nearest(items,pos) {
  let result=null,best=Infinity;
  for(const item of items){const d=distance(item.pos,pos);
    if(d<best || (d===best && item.id<result.id)){result=item;best=d;}}
  return result;
}
export function direction(from,to){
  const d=distance(from,to);
  return d ? [(to[0]-from[0])/d,(to[2]-from[2])/d] : [1,0];
}
function toward(s,target,speed){
  const d=distance(s.pos,target),f=d?Math.min(1,speed/60/d):0;
  s.pos[0]+=(target[0]-s.pos[0])*f;s.pos[2]+=(target[2]-s.pos[2])*f;
}
export function expel(world,s){
  for(const l of world.safe){
    const r=distance(l.pos,s.pos);
    if(r>world.t.safe_radius)continue;
    const [x,z]=direction(l.pos,s.pos);
    s.pos[0]=l.pos[0]+x*(world.t.safe_radius+.001);s.pos[2]=l.pos[2]+z*(world.t.safe_radius+.001);
  }
}
export function moveShades(w){
  const {t,player:p}=w;
  for(const s of w.shades){
    if(s.push>0 && s.state==='stunned'){
      const dest=[s.pos[0]+s.pushDir[0]*t.pulse_push_m/15,s.pos[1],s.pos[2]+s.pushDir[1]*t.pulse_push_m/15];
      if(Number.isFinite(floorAt(w.night,dest[0],dest[2])) && !(w.night===3 && Math.hypot(dest[0],dest[2])<2))s.pos=dest;
      s.push--;
    }
    if(s.state==='recoil' && s.wait>0){s.pos[0]+=s.recoilDir[0]*2/60;s.pos[2]+=s.recoilDir[1]*2/60;}
    if(s.wait>0 && ['spawning','recoil','stunned'].includes(s.state)){expel(w,s);continue;}
    if(['spawning','recoil','stunned'].includes(s.state)){s.state='wander';expel(w,s);continue;}
    const d=distance(s.pos,p.pos);
    if(s.state==='wander' && d<=t.shade_chase_radius && !w.sheltered)s.state='chase';
    else if(s.state==='chase' && (d>t.shade_release_radius || w.sheltered))s.state='wander';
    const target=s.state==='chase'?p:nearest(w.lanterns.filter(l=>!l.lit),s.pos);
    if(target)toward(s,target.pos,w.night===3?4.5:t.shade_speed);
    expel(w,s);
    const floor=floorAt(w.night,s.pos[0],s.pos[2]);if(Number.isFinite(floor))s.pos[1]=floor+1;
  }
}
export function moveDrifters(w){
  const p=w.player;
  for(const d of w.drifters){
    if(d.state==='flee'){
      d.pos[0]+=d.dir[0]*7/60;d.pos[2]+=d.dir[1]*7/60;d.wait--;continue;
    }
    d.state=(p.carried>=5 && distance(d.pos,p.pos)<=15)?'chase':'idle';
    if(d.state==='chase')toward(d,p.pos,7);
    else{
      const a=w.simTick/120+d.phase;
      d.pos[0]+=Math.cos(a)*2/60;d.pos[2]+=Math.sin(a)*2/60;
    }
  }
  w.drifters=w.drifters.filter(d=>d.state!=='flee'||d.wait>0);
}
export function flee(d,p,ticks){d.state='flee';d.wait=ticks;d.dir=direction(p.pos,d.pos);}
export function contacts(w){
  const p=w.player;
  for(const d of w.drifters){
    if(d.state!=='chase'||distance(d.pos,p.pos)>1.2)continue;
    const amount=Math.min(3,p.carried);p.carried-=amount;d.stolen=amount;
    flee(d,p,240);w.emit('drifter_steal',{drifter_id:d.id,amount,carried:p.carried});
  }
  if(w.sheltered || p.invuln>0)return;
  for(const s of [...w.shades].sort((a,b)=>a.id.localeCompare(b.id,'en',{numeric:true}))){
    if(!['wander','chase'].includes(s.state)||(distance(s.pos,p.pos)>w.t.shade_hit_radius || Math.abs(s.pos[1]-p.pos[1])>1.5))continue;
    w.hit('shade');s.recoilDir=direction(p.pos,s.pos);s.state='recoil';s.wait=Math.round(w.t.recoil_s*60);break;
  }
}
