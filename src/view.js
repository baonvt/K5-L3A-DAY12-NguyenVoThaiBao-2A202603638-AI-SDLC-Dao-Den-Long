import * as T from '../node_modules/three/build/three.module.js';
import {environment,sky,makePlayer,makeLamp,makeShade,material,shape} from './art.js';
import {seeded} from './world.js';

function glowTexture() {
  const c=document.createElement('canvas');c.width=c.height=64;
  const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.15,'rgba(255,255,255,.85)');
  g.addColorStop(.44,'rgba(255,255,255,.2)');g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new T.CanvasTexture(c);
}
function seaOfClouds(scene) {
  const rng=seeded(843);
  const c=document.createElement('canvas');c.width=256;c.height=96;
  const ctx=c.getContext('2d');
  for(let i=0;i<36;i++) {
    const x=28+rng()*200,y=44+(rng()-.5)*24,r=14+rng()*23;
    const grad=ctx.createRadialGradient(x,y,0,x,y,r);
    grad.addColorStop(0,'rgba(218,206,223,.52)');grad.addColorStop(1,'rgba(196,190,215,0)');
    ctx.fillStyle=grad;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
  const mat=new T.SpriteMaterial({map,transparent:true,opacity:.56,depthWrite:false});
  for(let i=0;i<140;i++) {
    const a=rng()*Math.PI*2,r=35+rng()*125;
    const sprite=new T.Sprite(mat);sprite.position.set(Math.cos(a)*r,-10-rng()*8,Math.sin(a)*r);
    const w=12+rng()*31;sprite.scale.set(w,w*.22,1);scene.add(sprite);
  }
}
export class View {
  constructor(canvas) {
    this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
    this.camera=new T.PerspectiveCamera(48,1,.12,540);
    this.scene=new T.Scene();this.scene.fog=new T.FogExp2('#1b2350',.0082);
    this.sky=sky(this.scene);
    this.ambient=new T.HemisphereLight('#e3dcf6','#82717f',1.62);this.scene.add(this.ambient);
    const sun=new T.DirectionalLight('#ffd5a4',2.0);sun.position.set(-24,38,6);this.scene.add(sun);
    this.terrain=new Map();seaOfClouds(this.scene);this.props=new Map();
    this.person=makePlayer();this.scene.add(this.person.g);
    this.shadow=shape(this.scene,'post','#435d5d',0,.11,0,.49,.015,.32);
    this.lamps=Array.from({length:7},()=>{const l=makeLamp();this.scene.add(l.g);return l;});
    this.haloMap=glowTexture();this.haloMat=new T.SpriteMaterial({map:this.haloMap,color:'#ffe9b0',transparent:true,
      depthWrite:false,blending:T.AdditiveBlending});
    this.lamps.forEach(l=>{l.halo=new T.Sprite(this.haloMat);l.halo.position.set(1,2.37,0);l.g.add(l.halo);});
    this.shades=[];this.flyGeom=new T.BufferGeometry();this.flyPos=new Float32Array(3*64);
    this.flyGeom.setAttribute('position',new T.BufferAttribute(this.flyPos,3).setUsage(T.DynamicDrawUsage));
    const flies=new T.Points(this.flyGeom,new T.PointsMaterial({color:'#fff6c2',map:this.haloMap,size:.65,
      transparent:true,depthWrite:false,blending:T.AdditiveBlending}));flies.frustumCulled=false;this.scene.add(flies);
    this.pulseRing=shape(this.scene,'rim','#ffe2a0',0,.35,0,1,1,1,true);
    this.pulseRing.rotation.x=Math.PI/2;this.pulseAt=-10;
    this.lastTime=0;this.look=new T.Vector3();this.dest=new T.Vector3();this.eye=new T.Vector3();
    this.leaves=new T.Group();this.scene.add(this.leaves);
    for(let i=0;i<16;i++)shape(this.leaves,'orb','#f2c14e',0,0,0,.16,.035,.09);
    this.forceCamera=true;
  }
  pulse(w,time) { this.pulseAt=time;this.pulseRing.position.set(w.player.pos[0],.38,w.player.pos[2]); }
  render(w,time,mode,yaw) {
    const canvas=this.renderer.domElement,bw=canvas.clientWidth,bh=canvas.clientHeight;
    if (bw!==this.width || bh!==this.height) {
      this.width=bw;this.height=bh;this.renderer.setSize(bw,bh,false);
      this.camera.aspect=bw/bh;this.camera.updateProjectionMatrix();this.forceCamera=true;
    }
    const dt=Math.min(.12,Math.max(.001,time-this.lastTime));this.lastTime=time;
    if(!this.terrain.has(w.night))this.terrain.set(w.night,environment(this.scene,w.night));
    for(const [night,model] of this.terrain)model.visible=night===w.night;
    this.lamps.forEach((l,i)=>l.g.visible=i<w.lanterns.length);
    for(const model of this.props.values())model.visible=false;
    for(const prop of [...w.drifters,...w.charms.filter(c=>c.available)]){
      const charm=prop.id.startsWith('C');let model=this.props.get(prop.id);
      if(!model){model=new T.Group();this.scene.add(model);this.props.set(prop.id,model);
        if(charm){shape(model,'box','#f2c14e',0,0,0,.7,1,.13);shape(model,'box','#c8102e',0,0,.09,.58,.88,.12);}
        else{for(let i=0;i<5;i++)shape(model,'orb','#8fa3b8',0,Math.sin(i)*.16,i*.28,.39-i*.05,.13,.34);}
      }
      model.visible=true;model.position.set(prop.pos[0],prop.pos[1]+1.05+.12*Math.sin(time*2),prop.pos[2]);model.rotation.y=time;
    }
    const {pos}=w.player;this.person.g.position.set(...pos);
    this.person.g.rotation.y=w.facing;
    const moving=mode==='play' && Math.hypot(...w.input.move)>0;
    const stride=moving ? Math.sin(w.tick*.26):0;
    this.person.body.position.y=.09+Math.abs(stride)*.05;
    this.person.legs[0].rotation.x=stride*.48;this.person.legs[1].rotation.x=-stride*.48;
    this.person.g.visible=!(mode==='play' && w.player.invuln>0 && Math.floor(w.tick/6)%2);
    this.shadow.position.set(pos[0],pos[1]+.115,pos[2]);
    for(let i=0;i<w.lanterns.length;i++){
      const l=w.lanterns[i],v=this.lamps[i];v.g.position.set(...l.pos);
      v.body.material=l.lit?material('#ffb347',true):material('#5b5f6e');
      v.ring.material=l.lit?material('#ffd384',true):material('#b6a07c');
      const weak=l.lit && l.units<w.t.low_fuel_threshold*60;
      v.body.parent.scale.set(.57,.57*(l.lit?1:.8),.57);v.tear.visible=!l.lit;
      v.fuel.visible=l.lit;v.fuel.quaternion.copy(this.camera.quaternion);
      const fraction=l.units/(w.t.fuel_max*60);
      v.fill.scale.x=1.54*fraction;v.fill.position.x=-.77*(1-fraction);
      const flicker=!weak || Math.cos(time*Math.PI*2)>0;
      v.fill.visible=flicker;v.body.material=l.lit?material(flicker?'#ffb347':'#9c6947',true):material('#5b5f6e');
      v.halo.visible=l.lit && flicker;v.halo.scale.setScalar(4.4+Math.sin(time*2+i)*.2);
    }
    const lit=w.lanterns.filter(l=>l.lit).length;
    this.sky.day.value=lit/w.lanterns.length;this.ambient.intensity=.15+.55*this.sky.day.value;
    for(let i=0;i<Math.max(this.shades.length,w.shades.length);i++){
      if(!this.shades[i]){const s=makeShade();this.shades.push(s);this.scene.add(s);}
      const v=this.shades[i],s=w.shades[i];v.visible=!!s;if(!s)continue;
      v.position.set(s.pos[0],s.pos[1]+Math.sin(time*3+i)*.1,s.pos[2]);
      v.rotation.y=Math.atan2(pos[0]-s.pos[0],pos[2]-s.pos[2]);
      v.rotation.z=s.state==='stunned'?.61:0;
      v.children[1].material=material(s.state==='stunned'?'#3a3450':'#120a1a');
      const accent=material(this.accessible?'#00b3ff':'#7a3cff',true);
      for(const part of [v.children[0],...v.children.slice(-2)])part.material=accent;
    }
    this.leaves.visible=w.night===3 && w.windEnabled && (w.wind.active || w.simTick%1800>=1680);
    if(this.leaves.visible)this.leaves.children.forEach((m,i)=>m.position.set(pos[0]+((time*5+i*1.7)%12)-6,pos[1]+1+Math.sin(time+i),pos[2]+(i%7)-4));
    const count=w.motes.length;
    if(count*3>this.flyPos.length) {
      this.flyPos=new Float32Array(count*6);
      this.flyGeom.setAttribute('position',new T.BufferAttribute(this.flyPos,3).setUsage(T.DynamicDrawUsage));
    }
    w.motes.forEach((m,i)=>{
      this.flyPos[i*3]=m.pos[0]+.09*Math.sin(time*1.1+i);
      this.flyPos[i*3+1]=m.pos[1]+.66+.22*Math.sin(time*2.1+i*2);
      this.flyPos[i*3+2]=m.pos[2]+.1*Math.cos(time+i);
    });
    this.flyGeom.setDrawRange(0,count);this.flyGeom.attributes.position.needsUpdate=true;
    const age=time-this.pulseAt;this.pulseRing.visible=age>=0 && age<.47;
    if(this.pulseRing.visible)this.pulseRing.scale.setScalar(.15+w.t.pulse_radius*age/.47);
    const intro=mode==='title';
    if(intro) {
      const a=.61+.045*Math.sin(time*.09),d=bw/bh<1.05?102:91;
      this.dest.set(Math.sin(a)*d,20,Math.cos(a)*d);this.eye.set(0,-1.8,0);
      const horizontal=bw/bh<1.05?0:-bw*.145;
      this.camera.setViewOffset(bw,bh,horizontal,bw/bh<1.05?bh*.12:0,bw,bh);
    }else {
      if(this.camera.view?.enabled)this.camera.clearViewOffset();
      this.dest.set(pos[0]+Math.sin(yaw)*10.6,6.8+pos[1]*.46,pos[2]+Math.cos(yaw)*10.6);
      this.eye.set(pos[0]-Math.sin(yaw)*2.4,1.1+pos[1]*.6,pos[2]-Math.cos(yaw)*2.4);
    }
    if(this.forceCamera || this.wasIntro!==intro){
      this.camera.position.copy(this.dest);this.look.copy(this.eye);this.forceCamera=false;
    }else{
      const blend=1-Math.exp(-dt*13);this.camera.position.lerp(this.dest,blend);this.look.lerp(this.eye,blend);
    }
    this.wasIntro=intro;this.camera.lookAt(this.look);this.renderer.render(this.scene,this.camera);
  }
}
