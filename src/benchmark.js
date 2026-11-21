import {World,seeded} from './world.js';
import {View} from './view.js';
import {moveShades} from './enemies.js';

export function benchScenario(seed){
  const rng=seeded(seed);
  function spread(n,i,y){
    const a=(i*2.399963229728653+rng()*.1),r=39*Math.sqrt((i+rng())/n);
    return [r*Math.cos(a),y,r*Math.sin(a)];
  }
  return {random_motes:false,random_shades:false,random_drifters:false,
    shades:Array.from({length:200},(_,i)=>({id:'S'+(i+1),pos:spread(200,i,1),state:'wander'})),
    motes:Array.from({length:100},(_,i)=>spread(100,i,0)),lanterns:['L1','L2','L3'].map(id=>({id,lit:true,fuel:100}))};
}
export async function benchmark(params){
  const {tuning}=await (await fetch('./game.contract.json')).json();
  const seed=Number(params.get('seed')),duration=Number(params.get('duration'));
  const w=new World(tuning,seed,benchScenario(seed),1);w.wanderOnly=true;
  const view=new View(document.getElementById('world'));document.getElementById('game').dataset.mode='bench';
  for(const el of document.querySelectorAll('header,.scrim,#intro,#titleFoot,#hud,#touch'))el.hidden=true;
  const gl=view.renderer.getContext(),diag=gl.getExtension('WEBGL_debug_renderer_info');
  const renderer='Three.js r170 / '+(diag?gl.getParameter(diag.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER));
  let start,previous,firstFrame,measure,acc=0,previousMeasured;
  const intervals=[];
  return new Promise((resolve,reject)=>{
    function draw(now){
      try{
        start??=now;acc+=(now-(previous??now))/1000;previous=now;
        while(acc>=1/60){moveShades(w);w.simTick++;acc-=1/60;}
        const seconds=(now-start)/1000;view.render(w,seconds,'bench',0);
        firstFrame??=performance.timeOrigin+performance.now();
        if(seconds>=3){
          if(measure===undefined){measure=now;previousMeasured=now;}
          else{intervals.push(now-previousMeasured);previousMeasured=now;}
          if(now-measure>=duration*1000){resolve({intervals,renderer,firstFrame,
            scene:{shades:w.shades.length,motes:w.motes.length,lit:w.lanterns.filter(l=>l.lit).length,
              width:view.renderer.domElement.clientWidth,height:view.renderer.domElement.clientHeight}});return;}
        }
        requestAnimationFrame(draw);
      }catch(error){reject(error);}
    }
    requestAnimationFrame(draw);
  });
}
