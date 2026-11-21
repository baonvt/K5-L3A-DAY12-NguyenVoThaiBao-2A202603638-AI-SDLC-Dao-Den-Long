import * as T from '../node_modules/three/build/three.module.js';
import {seeded,ISLAND_RADIUS} from './world.js';

const geometries = new Map(), materials = new Map();
function geometry(key,make) {
  if (!geometries.has(key)) geometries.set(key,make()); return geometries.get(key);
}
export function material(color,glow=false) {
  const key=color+':'+glow;
  if (!materials.has(key)) materials.set(key,glow ? new T.MeshBasicMaterial({color}) :
    new T.MeshStandardMaterial({color,flatShading:true,roughness:.94}));
  return materials.get(key);
}
export function shape(parent, kind, color, x,y,z, sx,sy,sz, glow=false) {
  const geo=geometry(kind,()=>{
    if(kind==='box') return new T.BoxGeometry();
    if(kind==='orb') return new T.IcosahedronGeometry(1,0);
    if(kind==='round') return new T.SphereGeometry(1,10,7);
    if(kind==='cone') return new T.ConeGeometry(1,1,9);
    if(kind==='pine') return new T.ConeGeometry(1,1,6);
    if(kind==='rim') return new T.TorusGeometry(1,.045,5,32);
    return new T.CylinderGeometry(1,1,1,kind==='post'?8:12);
  });
  const mesh=new T.Mesh(geo,material(color,glow));
  mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;
}
function beam(parent,a,b,width,color) {
  const v=new T.Vector3(...a),end=new T.Vector3(...b),dir=end.clone().sub(v);
  const mesh=shape(parent,'post',color,0,0,0,width,dir.length(),width);
  mesh.position.copy(v.add(end).multiplyScalar(.5));
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());
}
function paper(parent,x,y,z,size,color,glow=false) {
  const g=new T.Group();parent.add(g);g.position.set(x,y,z);g.scale.setScalar(size);
  const body=shape(g,'round',color,0,0,0,.76,.9,.76,glow);
  for (const h of [-.76,.76]) shape(g,'post','#593b48',0,h,0,.43,.14,.43);
  for(const h of [-.43,0,.43]) {
    const r=(h===0?.76:.66);
    shape(g,'post',glow?'#dd9a53':'#815659',0,h,0,r,.033,r);
  }
  shape(g,'post','#ecaa62',0,-1.08,0,.055,.55,.055);
  return body;
}
export function makePlayer() {
  const g=new T.Group();
  const skin='#ecc59e',cloth='#df7854',boots='#493849';
  const body=new T.Group();g.add(body);
  shape(body,'cone',cloth,0,.71,0,.43,.8,.32);
  shape(body,'round','#35475b',0,1.0,0,.28,.18,.25);
  shape(body,'round',skin,0,1.35,.015,.28,.32,.26);
  shape(body,'round','#443347',0,1.48,-.04,.29,.21,.25);
  for(const x of [-.092,.092]) shape(body,'orb','#362c3c',x,1.36,.25,.023,.029,.019);
  const legs=[-.15,.15].map(x=>shape(body,'post',boots,x,.22,0,.105,.43,.115));
  for(const x of [-.33,.33]) {
    const sleeve=shape(body,'post',cloth,x,.83,0,.115,.43,.115);sleeve.rotation.z=x>0?.24:-.24;
    shape(body,'round',skin,x*1.12,.6,.02,.087,.10,.09);
  }
  const hat=shape(body,'cone','#e7b071',0,1.67,0,.67,.46,.67);
  hat.rotation.z=-.07;
  shape(body,'post','#936546',0,1.45,0,.66,.045,.66).rotation.z=-.07;
  beam(body,[.53,1.51,.18],[.57,1.21,.2],.016,'#5c3d43');
  paper(body,.57,1.10,.2,.155,'#ffd176',true);
  return {g,body,legs};
}
export function makeLamp() {
  const g=new T.Group();
  shape(g,'post','#394653',0,.12,0,1,.23,1);
  shape(g,'post','#8f836c',0,.29,0,.78,.17,.78);
  shape(g,'post','#4e3e48',0,1.63,0,.15,2.65,.15);
  for(const y of [.54,2.9,3.02]) shape(g,'post','#cb9c66',0,y,0,.21,.1,.21);
  shape(g,'box','#593f48',.54,3.2,0,1.55,.18,.20);
  beam(g,[0,2.5,0],[.65,3.18,0],.075,'#77574a');
  beam(g,[1,3.12,0],[1,2.87,0],.032,'#c09d72');
  const body=paper(g,1,2.37,0,.57,'#b87758');
  const ring=shape(g,'rim','#efbd72',0,.052,0,1.22,1.22,1.22,true);ring.rotation.x=-Math.PI/2;
  return {g,body,ring};
}
export function makeShade() {
  const g=new T.Group();
  shape(g,'orb','#32273f',0,.14,0,.65,.77,.61);
  for(let i=0;i<5;i++) {
    const a=i*1.2566;
    const tail=shape(g,'cone','#483558',Math.sin(a)*.32,-.41,Math.cos(a)*.32,.19,.56,.19);
    tail.rotation.x=Math.PI+.16*Math.cos(a);tail.rotation.z=.17*Math.sin(a);
  }
  for(const x of [-.2,.2]) shape(g,'orb','#dda1ef',x,.23,.52,.075,.10,.048,true);
  return g;
}
function island(parent,r,depth,rng,hero=false) {
  const n=hero?64:18, rings=[], positions=[], colors=[];
  const levels=hero?[[0,.005],[.38,.005],[.72,.005],[1,0],[.99,-.17],[.82,-.61],[.40,-1],[.12,-1.18]]:
    [[0,0],[.67,0],[1,-.1],[.91,-.42],[.54,-.93],[.17,-1.12]];
  const ground=['#577c74','#557a72','#5b7e74','#607f73','#57786f'];
  const cliff=['#52516a','#51475d','#61596d','#65586c','#777082','#66546a','#4a495e'];
  for(let k=0;k<levels.length;k++) {
    const [rad,y]=levels[k], ring=[];
    for(let i=0;i<n;i++) {
      const a=i*2*Math.PI/n;
      const edge=(hero && k<3)?1:1+(rng()-.5)*(hero?.065:.16);
      ring.push([Math.cos(a)*rad*r*edge,y*depth+(y<0?(rng()-.5)*depth*.12:0),Math.sin(a)*rad*r*edge]);
    }rings.push(ring);
  }
  function face(a,b,c,palette) {
    positions.push(...a,...b,...c);
    const col=new T.Color(palette[Math.floor(rng()*palette.length)]);
    for(let i=0;i<3;i++) colors.push(col.r,col.g,col.b);
  }
  for(let k=0;k<rings.length-1;k++) for(let i=0;i<n;i++) {
    const j=(i+1)%n,p=levels[k+1][1]>=-.10 ? ground:cliff;
    face(rings[k][i],rings[k][j],rings[k+1][i],p);
    face(rings[k][j],rings[k+1][j],rings[k+1][i],p);
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  parent.add(new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,flatShading:true,side:T.DoubleSide})));
}
function pine(parent,x,y,z,height,variant) {
  const g=new T.Group();parent.add(g);g.position.set(x,y,z);g.scale.setScalar(height);
  shape(g,'post','#674e52',0,.18,0,.055,.36,.055);
  for(let k=0;k<3;k++){
    const crown=shape(g,'pine',variant[k],0,.40+.22*k,0,.32-.063*k,.52-.075*k,.32-.063*k);
    crown.rotation.y=k*.57;
  }
}
function batchStatic(parent) {
  parent.updateMatrixWorld(true);
  const bins=new Map();
  parent.traverse(obj=>{
    if(!obj.isMesh) return;
    const key=obj.geometry.uuid+obj.material.uuid;
    if(!bins.has(key)) bins.set(key,[]); bins.get(key).push(obj);
  });
  const output=new T.Group();
  for(const group of bins.values()) {
    const first=group[0],mesh=new T.InstancedMesh(first.geometry,first.material,group.length);
    group.forEach((obj,i)=>mesh.setMatrixAt(i,obj.matrixWorld));output.add(mesh);
  }return output;
}

export function environment(scene) {
  const rng=seeded(3613), base=new T.Group();
  const forest=[['#244d51','#346263','#467775'],['#345b5b','#48746c','#63867a'],['#32434f','#3d565c','#4f6d6c']];
  island(base,ISLAND_RADIUS+.55,11,rng,true);
  // The paths and stones sit slightly above the level collision plane.
  for(let j=0;j<5;j++) {
    const a=j*2*Math.PI/5;
    for(let i=0;i<13;i++) {
      const r=2+i*1.14,offset=Math.sin(i*.52+j)*.62;
      const x=Math.sin(a)*r+Math.cos(a)*offset,z=-Math.cos(a)*r+Math.sin(a)*offset;
      const stone=shape(base,'post',i%3?'#9d9b81':'#b3a78a',x,.10,z,.55+rng()*.3,.04,.31+rng()*.2);stone.rotation.y=a+rng();
    }
  }
  for(let i=0;i<65;i++) {
    const a=rng()*6.283,r=18.6+rng()*6.8;
    if ((a>.8&&a<1.15)||(a>2.25&&a<2.65)) continue;
    pine(base,Math.cos(a)*r,.02,Math.sin(a)*r,2+rng()*4.1,forest[i%3]);
  }
  for(let i=0;i<150;i++) {
    const a=rng()*6.283,r=Math.sqrt(rng())*26,x=Math.cos(a)*r,z=Math.sin(a)*r;
    if(r<2)continue;
    if(i%4===0) {
      const rock=shape(base,'orb',i%8?'#7d8d88':'#93968c',x,.15,z,.45+rng(),.33+rng()*.5,.4+rng()*.55);rock.rotation.y=a;
    } else {
      for(let j=0;j<3;j++) {
        const grass=shape(base,'pine',j===0?'#99a183':'#7c9479',x+j*.10,.24,z,.095,.47,.1);
        grass.rotation.z=(j-1)*.32;
      }
    }
  }
  // Dock, gate and a sagging line of small guide lanterns.
  function pier(x,z,angle) {
    const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;base.add(g);
    for(let i=0;i<9;i++) shape(g,'box',i%2?'#9b7964':'#8a6e61',0,.24,i*.56,3.7,.27,.52);
    for(const side of [-1,1]) for(const end of [0,4]) shape(g,'post','#69515a',side*1.63,-.33,end,.17,2.7,.17);
    for(const side of [-1,1]) shape(g,'post','#7d554d',side*1.7,2,0,.18,4,.18);
    shape(g,'box','#70494c',0,4.0,0,4.4,.34,.39);
    shape(g,'box','#c29469',0,4.2,0,4.75,.13,.48);
    for(const side of [-1,1]) {beam(g,[side*1.15,3.92,0],[side*1.15,3.55,0],.025,'#734c48');paper(g,side*1.15,3.17,0,.47,'#ffb465',true);}
  }
  pier(15,18,.78);
  for(let i=0;i<3;i++) shape(base,'post','#665152',-19+i*4,2.35,-10,.12,4.7,.12);
  for(let i=0;i<8;i++) {
    const x=-19+i, y=4.6-.45*Math.sin(i%4*Math.PI/4);
    beam(base,[x,y,-10],[x+1,4.6-.45*Math.sin((i+1)%4*Math.PI/4),-10],.025,'#6a5150');
    if(i%2) paper(base,x,y-.33,-10,.25,'#ffbd72',true);
  }
  for(let i=0;i<13;i++) {
    const a=i*2.4,r=62+(i%3)*14,g=new T.Group();g.position.set(Math.cos(a)*r,-5+rng()*5,Math.sin(a)*r);base.add(g);
    const size=3+rng()*6;island(g,size,size*1.35,rng);
    for(let k=0;k<4;k++) pine(g,(rng()-.5)*size,0,(rng()-.5)*size,(rng()*.6+.42)*size,forest[(i+k)%3]);
  }
  scene.add(batchStatic(base));
}
export function sky(scene) {
  const uniforms={day:{value:0}};
  const dome=new T.Mesh(new T.SphereGeometry(380,48,24),new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,uniforms,
    vertexShader:'varying vec3 dir; void main(){dir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec3 dir; uniform float day;
    float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){
      vec3 d=normalize(dir); float h=d.y;
      vec3 col=mix(vec3(.45,.40,.55),vec3(.095,.14,.235),smoothstep(-.13,.31,h));
      col=mix(col,vec3(.035,.063,.125),smoothstep(.25,.88,h));
      col=mix(col,vec3(.72,.59,.66),smoothstep(-.12,-.78,h));
      float md=distance(d,normalize(vec3(-.40,.028,-.916)));
      col+=vec3(.30,.20,.12)*exp(-md*11.)+vec3(.92,.78,.52)*(1.-smoothstep(.047,.049,md));
      vec2 uv=vec2(atan(d.z,d.x),asin(d.y))*160.; vec2 cell=floor(uv);
      float star=step(.984,noise(cell))*(1.-smoothstep(.025,.17,length(fract(uv)-.5)))*smoothstep(-.03,.15,h);
      col+=star*vec3(.92,.84,.7); col+=day*vec3(.07,.045,.025);
      gl_FragColor=vec4(col,1.);}`
  }));dome.renderOrder=-10;scene.add(dome);return uniforms;
}
