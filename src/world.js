export const HZ = 60;
import {lamps,charms,moteSites,fogSites,floorAt} from './maps.js';
import {nearest,direction,moveShades,moveDrifters,contacts,flee} from './enemies.js';
import {move} from './movement.js';
export const ISLAND_RADIUS = 40;
export const distance = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
export const round = n => Math.round(n * 1000) / 1000;
const point = pos => pos.map(round);
const secondsToTicks = s => Math.round(s * HZ);
const blankInput = () => ({move:[0, 0], cam_yaw_deg:0, jump:false, interact:false, pulse:false,dash:false,pause:false});

export function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let x = Math.imul(value ^ (value >>> 15), 1 | value);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}


export class World {
  constructor(tuning,seed=1,scenario={},night=1) {
    this.t=tuning;this.night=night;this.rng=seeded(seed);this.tick=0;this.simTick=0;
    this.state='playing';this.score=0;this.events=[];this.wind={active:false,dir_deg:0};
    this.initialTime=scenario.time_left_s??tuning['night'+night+'_duration_s'];this.timeLeft=this.initialTime;
    this.input=blankInput();this.facing=0;this.spawn=night===3?[0,0,-28]:[0,0,0];
    const s=scenario.player??{},pos=[...(s.pos??this.spawn)];
    this.player={pos,vel:[0,0,0],grounded:pos[1]===floorAt(night,pos[0],pos[2]),carried:s.carried??0,
      flames:s.flames??tuning.flames,invuln:s.invuln_ticks??0,dashCd:s.dash_cd_ticks??0,
      pulseCd:s.pulse_cd_ticks??0,charm:s.charm_ticks??0,dash:0,respawn:0,launch:null};
    this.lanterns=lamps[night].map((p,i)=>{
      const id='L'+(i+1),l=scenario.lanterns?.find(l=>l.id===id)??{};
      const deposited=l.deposited??(l.lit?tuning.lantern_cost:0);
      return {id,pos:[...(l.pos??p)],deposited,lit:l.lit??(deposited>=tuning.lantern_cost)};
    });
    this.randomMotes=scenario.random_motes??true;this.randomShades=scenario.random_shades??true;
    this.randomDrifters=scenario.random_drifters??true;this.windEnabled=scenario.wind_enabled??true;
    this.motes=[];this.shades=[];this.drifters=[];this.sequence={M:0,S:0,D:0};this.ids=new Set();
    for(const item of [...(scenario.shades??[]),...(scenario.drifters??[]),...(scenario.motes??[])])if(item.id)this.ids.add(item.id);
    if(scenario.motes)for(const m of scenario.motes)this.addMote(m.pos??m,m.kind,m.ttl_s,m.id);
    else if(this.randomMotes)for(let i=0;i<tuning.initial_motes;i++)this.spawnMote();
    for(const s of scenario.shades??[])this.addShade(s.pos,s.id,s);
    for(const d of scenario.drifters??[])this.addDrifter(d.pos,d);
    this.charms=(scenario.charms??charms[night].map((pos,i)=>({id:'C'+(i+1),pos}))).map((c,i)=>({
      id:c.id??'C'+(i+1),pos:[...(c.pos??charms[night][i]??[0,0,0])],available:c.available??true,
      wait:c.respawn_ticks??secondsToTicks(c.respawn_s??0)}));
    this.updateSafe();
  }
  id(prefix){
    let name;do{name=prefix+(++this.sequence[prefix]);}while(this.ids.has(name));this.ids.add(name);return name;
  }
  choice(list){return list[Math.floor(this.rng()*list.length)];}
  addMote(pos,kind='random',ttl=null,id){
    this.motes.push({id:id??this.id('M'),pos:[...pos],kind,life:ttl==null?(kind==='dropped'?480:null):secondsToTicks(ttl)});
  }
  spawnMote(){
    if(this.motes.length>=this.t.mote_limit)return;
    const sites=moteSites[this.night].filter(p=>!this.motes.some(m=>distance(m.pos,p)<.001));
    if(sites.length)this.addMote(this.choice(sites));
  }
  addShade(pos,id,s={}) {
    const shade={id:id??this.id('S'),pos:[...pos],state:s.state??'wander',wait:s.state_ticks_left??0,
      push:0,pushDir:[1,0],recoilDir:[1,0]};
    this.shades.push(shade);return shade.id;
  }
  addDrifter(pos,d={}){
    const state=d.state??'idle',dir=direction(this.player.pos,pos);
    this.drifters.push({id:d.id??this.id('D'),pos:[...pos],state,stolen:d.stolen??0,dir,
      wait:d.state_ticks_left??(state==='flee'?240:0),phase:this.rng()*2*Math.PI});
  }
  emit(name,data){this.events.push({type:'event',tick:this.tick,name,data});}
  hit(by){
    const p=this.player;const fall=by==='fall',before=p.carried;
    const dropped=fall?0:Math.floor(before*this.t.hit_drop_ratio);
    p.flames=Math.max(0,p.flames-1);p.carried=fall?0:before-dropped;p.invuln=secondsToTicks(this.t.invuln_s);
    for(let i=0;i<dropped;i++){
      const a=this.rng()*Math.PI*2,r=1.5+this.rng();
      this.addMote([p.pos[0]+r*Math.cos(a),p.pos[1],p.pos[2]+r*Math.sin(a)],'dropped');
    }
    if(fall){p.respawn=60;p.dash=0;p.launch=null;p.vel=[0,0,0];}
    this.emit('player_hit',{by,flames:p.flames,dropped,...(fall?{lost:before}:{})});
  }
  pick(){
    const p=this.player,within=m=>distance(p.pos,m.pos)<=this.t.pickup_radius && Math.abs(p.pos[1]-m.pos[1])<=1.5;
    this.motes=this.motes.filter(m=>{
      if(p.carried>=this.capacity || !within(m))return true;
      p.carried++;this.emit('mote_picked',{carried:p.carried});return false;
    });
    for(const c of this.charms)if(c.available && within(c)){
      c.available=false;c.wait=2700;p.charm=600;p.dashCd=0;this.emit('charm_picked',{charm_id:c.id,charm_ticks:600});
    }
  }
  get capacity(){return this.t.carry_capacity;}
  deposit(){
    const p=this.player,l=nearest(this.lanterns.filter(l=>!l.lit),p.pos);
    if(!l||!p.carried||distance(l.pos,p.pos)>this.t.interact_radius)return;
    const amount=Math.min(p.carried,this.t.lantern_cost-l.deposited);p.carried-=amount;l.deposited+=amount;
    this.score+=amount*this.t.score.per_mote;
    this.emit('deposit',{lantern_id:l.id,amount,deposited:l.deposited});
    if(l.deposited===this.t.lantern_cost){
      l.lit=true;this.score+=this.t.score.per_lantern;this.emit('lantern_lit',{lantern_id:l.id});
    }
  }
  updateSafe(){this.safe=this.lanterns.filter(l=>l.lit);this.sheltered=this.safe.some(l=>distance(l.pos,this.player.pos)<=this.t.safe_radius);}
  pulse(){
    const {player:p,t}=this;
    if(p.carried<t.pulse_cost||p.pulseCd)return;
    p.carried-=t.pulse_cost;p.pulseCd=secondsToTicks(t.pulse_cooldown_s);
    const ids=[],inRange=s=>Math.hypot(distance(p.pos,s.pos),p.pos[1]+.8-s.pos[1])<=t.pulse_radius;
    for(const s of this.shades.filter(inRange)){
      s.state='stunned';s.wait=secondsToTicks(t.pulse_stun_s);s.push=15;s.pushDir=direction(p.pos,s.pos);
      ids.push(s.id);this.score+=t.score.per_stun;
    }
    this.emit('pulse',{stunned_ids:ids});
    for(const d of this.drifters.filter(inRange)){
      if(d.state==='chase')flee(d,p,240);
      else if(d.state==='flee'&&d.stolen){
        for(let i=0;i<d.stolen;i++)this.addMote(d.pos,'dropped');
        this.emit('drifter_drop',{drifter_id:d.id,amount:d.stolen});d.stolen=0;d.wait=120;
      }
    }
  }
  timers(){
    const p=this.player;
    for(const key of ['invuln','dashCd','pulseCd','charm'])if(p[key])p[key]--;
    for(const s of this.shades)if(s.wait)s.wait--;
    for(const c of this.charms)if(!c.available && --c.wait<=0){c.wait=0;c.available=true;}
    this.motes=this.motes.filter(m=>m.life===null || --m.life>0);
    this.timeLeft=Math.max(0,this.initialTime-this.simTick/HZ);
    if(this.night===3 && this.windEnabled){
      const phase=this.simTick%1800;
      if(phase===1680){this.wind.dir_deg=Math.floor(this.rng()*360);this.emit('wind_warning',{dir_deg:this.wind.dir_deg});}
      this.wind.active=this.simTick>=1800 && phase<300;
    }
  }
  spawnEntities(){
    const n=this.night,k=this.simTick;
    if(this.randomMotes && k%this.t.mote_interval_ticks===0)this.spawnMote();
    const interval=[0,480,420,360][n],max=[0,6,8,10][n];
    if(this.randomShades && k>=300 && (k-300)%interval===0){
      for(let i=0;i<(k===300?2:1)&&this.shades.length<max;i++){
        const sites=fogSites[n].filter(pos=>distance(pos,this.player.pos)>=15);
        if(!sites.length)break;
        const pos=[...this.choice(sites)];pos[1]+=1;
        this.emit('shade_spawned',{id:this.addShade(pos,null,{state:'spawning',state_ticks_left:secondsToTicks(this.t.spawn_s)})});
      }
    }
    if(n>=2 && this.randomDrifters && k%1200===0 && this.drifters.length<2)this.addDrifter(this.choice(fogSites[n]));
  }
  evaluate(){
    const p=this.player;
    if(!p.flames)this.finish('lost','no_flames');
    else if(this.lanterns.every(l=>l.lit))this.finish('won','all_lit');
    else if(this.timeLeft<=0)this.finish('lost','dawn');
  }
  finish(result,reason){
    this.state=result;
    if(result==='won')this.score+=Math.floor(this.timeLeft)*this.t.score.per_second_left+this.player.flames*this.t.score.per_flame_left;
    this.emit('game_over',{result,reason});
  }
  step(frame={}){
    if(this.state==='won'||this.state==='lost')return [];
    const old=this.input;this.input={...old,...frame};const edge=k=>this.input[k]&&!old[k];
    this.events=[];this.tick++;
    if(edge('pause')){this.state=this.state==='paused'?'playing':'paused';this.emit(this.state==='paused'?'paused':'resumed',{});}
    if(this.state==='paused')return this.events;
    this.simTick++;this.timers();
    const p=this.player;
    if(p.respawn){
      if(--p.respawn===0){p.pos=[...this.spawn];p.invuln=secondsToTicks(this.t.invuln_s);p.grounded=true;}
    }else move(this,edge);
    if(!p.respawn){this.pick();if(edge('interact'))this.deposit();}
    this.updateSafe();if(!p.respawn&&edge('pulse'))this.pulse();
    moveShades(this);moveDrifters(this);if(!p.respawn)contacts(this);
    this.spawnEntities();this.evaluate();return this.events;
  }
  snapshot(){
    const p=this.player;
    return {type:'snapshot',night:this.night,tick:this.tick,sim_tick:this.simTick,state:this.state,time_left_s:this.timeLeft,score:this.score,
      wind:{...this.wind},player:{pos:point(p.pos),vel:point(p.vel),flames:p.flames,carried:p.carried,grounded:p.grounded,invuln:p.invuln>0,
        dash_cd_s:p.dashCd/HZ,pulse_cd_s:p.pulseCd/HZ,charm_s:p.charm/HZ},
      lanterns:this.lanterns.map(l=>({...l,pos:point(l.pos)})),shades:this.shades.map(s=>({id:s.id,pos:point(s.pos),state:s.state})),
      motes_active:this.motes.length,motes:this.motes.map(m=>({id:m.id,pos:point(m.pos),kind:m.kind,ttl_s:m.life===null?null:m.life/HZ})),
      charms:this.charms.map(c=>({id:c.id,available:c.available,respawn_s:c.wait/HZ})),
      drifters:this.drifters.map(d=>({id:d.id,pos:point(d.pos),state:d.state,stolen:d.stolen}))};
  }
}
