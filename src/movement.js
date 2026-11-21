import {distance,floorAt,pads} from './maps.js';
export function move(w,edge){
  const {t,player:p,input}=w,[x,z]=input.move,a=input.cam_yaw_deg*Math.PI/180;
  const scale=Math.max(1,Math.hypot(x,z));
  const dx=(x*Math.cos(a)+z*Math.sin(a))/scale,dz=(-x*Math.sin(a)+z*Math.cos(a))/scale;
  if(dx||dz)w.facing=Math.atan2(dx,dz);
  if(edge('dash') && !p.dash && (!p.dashCd || p.charm)){
    p.dash=Math.round(t.dash_duration_s*60);p.dashCd=p.charm?0:Math.round(t.dash_cooldown_s*60);
    p.dashDir=[Math.sin(w.facing),Math.cos(w.facing)];w.emit('dash',{});
  }
  const pad=p.grounded && pads[w.night].find(v=>distance(v,p.pos)<=1 && Math.abs(p.pos[1]-v[1])<.1);
  if(pad){
    const targetX=pad[0]<35?70:0, len=Math.hypot(targetX-pad[0],pad[2]);
    p.launch=w.night===2?[24*(targetX-pad[0])/len,-24*pad[2]/len]:[0,-8];
    p.vel[1]=w.night===2?14:12;p.grounded=false;
  } else if(edge('jump') && p.grounded){p.vel[1]=t.jump_speed;p.grounded=false;}
  const speed=p.charm?7.2:t.player_speed;
  [p.vel[0],p.vel[2]]=p.dash ? p.dashDir.map(v=>v*t.dash_speed) : p.launch??[dx*speed,dz*speed];
  const dashStep=p.dash>0;
  if(p.dash)p.dash--;
  if(w.wind.active){const theta=w.wind.dir_deg*Math.PI/180;p.vel[0]+=2*Math.cos(theta);p.vel[2]+=2*Math.sin(theta);}
  const [oldX,oldY,oldZ]=p.pos;
  let nx=oldX+p.vel[0]/60,nz=oldZ+p.vel[2]/60;
  let top=floorAt(w.night,nx,nz);
  const tower=w.night===3 && Math.hypot(nx,nz)<2 && Math.hypot(oldX,oldZ)>=2;
  if(tower || (top>oldY+.23 && top>floorAt(w.night,oldX,oldZ)+.23)){
    nx=oldX;nz=oldZ;p.vel[0]=p.vel[2]=0;top=floorAt(w.night,nx,nz);
  }
  p.pos[0]=nx;p.pos[2]=nz;
  if(p.grounded && top<oldY-.23)p.grounded=false;
  if(!p.grounded && !dashStep){p.vel[1]-=t.gravity/60;p.pos[1]+=p.vel[1]/60;}
  if(p.grounded || (p.pos[1]<=top && p.vel[1]<=0 && oldY>=top-.24)){
    p.pos[1]=top;p.grounded=true;p.vel[1]=0;p.launch=null;
  }
  if(p.pos[1]<t.fall_y)w.hit('fall');
}
