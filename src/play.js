import {World,HZ,distance} from './world.js';
import {NAMES} from './maps.js';
import {View} from './view.js';
import {nearest} from './enemies.js';
import {Vector3} from '../node_modules/three/build/three.module.js';
const $=id=>document.getElementById(id);
const defaults={volume:.28,sensitivity:1};
const defaultKeys={up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',jump:'Space',dash:'ShiftLeft',interact:'KeyE',pulse:'KeyF',pause:'Escape'};
async function main(){
  const {tuning}=await (await fetch('./game.contract.json')).json();
  const view=new View($('world'));
  let settings={...defaults};
  try{Object.assign(settings,JSON.parse(localStorage.getItem('dao-settings'))??{});}catch{}
  const save=()=>localStorage.setItem('dao-settings',JSON.stringify(settings));
  let seed=17,night=1,total=0,yaw=0,w=new World(tuning,seed),mode='title',prev=0,acc=0,drag=null,toastEnd=0,sound=true,audio;
  const keys=new Set(),press=new Set(),release=new Set();
  function keyDown(k){if(!keys.has(k))press.add(k);keys.add(k);}
  function keyUp(k){keys.delete(k);release.add(k);}
  function tone(freq,duration=.16,gain=.20){
    if(!sound||!audio||!settings.volume)return;
    const osc=audio.createOscillator(),env=audio.createGain(),now=audio.currentTime;
    osc.frequency.value=freq;env.gain.setValueAtTime(.0001,now);env.gain.exponentialRampToValueAtTime(Math.max(.0002,settings.volume*gain),now+.015);
    env.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(env);env.connect(audio.destination);osc.start();osc.stop(now+duration);
  }
  function beginAudio(){audio??=new AudioContext();audio.resume().catch(()=>{});}
  $('sound').onclick=()=>{beginAudio();sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));tone(552);};
  function setMode(next){
    mode=next;$('game').dataset.mode=next;$('intro').hidden=next!=='title';$('titleFoot').hidden=next!=='title';
    $('hud').hidden=next==='title';$('touch').hidden=next!=='play'||!matchMedia('(pointer:coarse)').matches;
    keys.clear();press.clear();release.clear();acc=0;drag=null;
  }
  function close(){if($('dialog').open)$('dialog').close();}
  function panel(title,html,actions){
    $('dialogTitle').textContent=title;$('dialogBody').innerHTML=html;$('choices').replaceChildren();
    const entries=Object.entries(actions);const [primary,callback]=entries.shift();$('dialogAction').textContent=primary;
    $('dialogAction').onclick=()=>{close();callback();};
    for(const [name,fn] of entries){const b=document.createElement('button');b.textContent=name;b.onclick=()=>{close();fn();};$('choices').append(b);}
    if(!$('dialog').open)$('dialog').showModal();
  }
  function options(back){
    panel('Cài đặt','<label>Âm lượng <input id="volume" type="range" min="0" max="1" step=".01"></label>'+
      '<label>Độ nhạy chuột <input id="sensitivity" type="range" min=".2" max="3" step=".1"></label>',{'Quay lại':back});
    for(const k of ['volume','sensitivity']){const el=$(k);el.value=settings[k];el.oninput=()=>{settings[k]=Number(el.value);save();};}
  }
  function start(){
    w=new World(tuning,seed+night-1,{},night);yaw=0;view.forceCamera=true;toastEnd=0;$('toast').textContent='';setMode('play');hud();
  }
  function introduction(){
    const lines=['','Hãy lần theo những đốm sáng trên Đảo Bến.','Cầu tre và bùa gió sẽ đưa con qua hai bờ.','Hãy tìm đường lên tháp giữa những cơn gió.'];
    panel('Đêm '+night+' · '+NAMES[night],'<p>Ông Đăng — “'+lines[night]+'”</p>',{'Bắt đầu đêm':start,'Về menu':menu});
  }
  function menu(){close();total=0;night=1;w=new World(tuning,seed);setMode('title');}
  function resume(){if(w.state==='paused'){w.step({pause:false});w.step({pause:true});w.input.pause=false;}setMode('play');}
  function pause(){
    if(mode==='play'){w.step({pause:true});setMode('paused');}
    panel('Tạm dừng','<p>WASD di chuyển · Space nhảy · Shift lướt · E nạp đèn · F tỏa sáng · Z/X xoay cảnh.</p>',
      {'Tiếp tục':resume,'Chơi lại Đêm':introduction,'Cài đặt':()=>options(pause),'Về menu':menu});
  }
  $('dialog').oncancel=e=>{e.preventDefault();if(mode==='paused'){close();resume();}};
  $('start').onclick=()=>{beginAudio();introduction();};
  $('help').onclick=()=>{if(mode==='play')pause();else options(()=>{});};
  function end(reason){
    setMode('end');const won=w.state==='won';if(won)total+=w.score;
    tone(won?784:147,.7);
    const final=won&&night===3;
    const msg=won?'Điểm đêm '+w.score:reason==='no_flames'?'Mây đã mất ngọn lửa cuối cùng.':'Đảo chưa đủ sáng khi bình minh đến.';
    const actions=won?(final?{'Về menu':menu}:{'Đêm kế tiếp':()=>{night++;introduction();},'Về menu':menu}):{'Chơi lại Đêm':introduction,'Về menu':menu};
    panel(final?'Bình Minh':won?'Đêm đã sáng':'Đêm đã khép lại','<p>'+msg+'</p><p>Tổng điểm các đêm đã thắng · '+total+'</p>',actions);
  }
  function announce(text){$('toast').textContent=text;toastEnd=w.simTick+120;}
  function hud(){
    const p=w.player,lit=w.lanterns.filter(l=>l.lit).length;
    $('nightName').textContent='ĐÊM '+night+' · '+NAMES[night];$('litCount').textContent=lit+' / '+w.lanterns.length;
    $('lamps').innerHTML=w.lanterns.map(l=>l.lit?'<i class="on"></i>':'<i></i>').join('');
    const sec=Math.ceil(w.timeLeft);$('clock').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
    $('clock').classList.toggle('urgent',sec<=30);$('points').textContent=w.score;$('bag').textContent=p.carried;$('limit').textContent='/ '+w.capacity;
    $('health').textContent='◆'.repeat(p.flames)+'◇'.repeat(Math.max(0,tuning.flames-p.flames));$('health').setAttribute('aria-label',p.flames+' ngọn lửa');
    $('slots').innerHTML=Array.from({length:w.capacity},(_,i)=>i<p.carried?'<i class="on"></i>':'<i></i>').join('');
    $('cooldowns').textContent='Lướt '+(p.dashCd?Math.ceil(p.dashCd/60)+'s':'✓')+' · Tỏa sáng '+(p.pulseCd?Math.ceil(p.pulseCd/60)+'s':'✓');
    const lamp=nearest(w.lanterns.filter(l=>!l.lit),p.pos);
    $('context').textContent=lamp && distance(lamp.pos,p.pos)<=tuning.interact_radius?'E — Nạp ánh sáng ('+lamp.deposited+'/'+tuning.lantern_cost+')':'';
    const projected=lamp?new Vector3(...lamp.pos).project(view.camera):null;
    const behind=projected && projected.z>1;
    $('arrow').hidden=!projected||(!behind && Math.abs(projected.x)<1 && Math.abs(projected.y)<1);
    if(projected)$('arrow').textContent=((behind?-projected.x:projected.x)<0?'← ':'→ ')+lamp.id;
    if(w.simTick>toastEnd)$('toast').textContent='';
  }
  addEventListener('keydown',e=>{
    if((e.code===defaultKeys.pause || e.code==='KeyP')&&!e.repeat){
      if(mode==='play'){e.preventDefault();pause();return;}
      if(mode==='paused'){e.preventDefault();close();resume();return;}
    }
    if(mode==='play' && [...Object.values(defaultKeys),'ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyZ','KeyX'].includes(e.code)){e.preventDefault();keyDown(e.code);}
  });
  addEventListener('keyup',e=>keyUp(e.code));
  addEventListener('blur',()=>{if(mode==='play')pause();});
  for(const b of document.querySelectorAll('[data-key]')){
    b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keyDown(b.dataset.key);};
    b.onpointerup=b.onpointercancel=()=>keyUp(b.dataset.key);
  }
  const canvas=$('world');canvas.onpointerdown=e=>{if(mode==='play'){drag=e.clientX;canvas.setPointerCapture(e.pointerId);}};
  canvas.onpointermove=e=>{if(drag!==null){yaw-=(e.clientX-drag)*.009*settings.sensitivity;drag=e.clientX;}};
  canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};
  function step(time){
    const has=(...k)=>k.some(c=>keys.has(c));
    yaw+=(Number(has('KeyX'))-Number(has('KeyZ')))*1.8/HZ;
    const frame={move:[Number(has(defaultKeys.right,'ArrowRight'))-Number(has(defaultKeys.left,'ArrowLeft')),
      Number(has(defaultKeys.down,'ArrowDown'))-Number(has(defaultKeys.up,'ArrowUp'))],cam_yaw_deg:yaw*180/Math.PI};
    for(const k of ['jump','dash','interact','pulse']){
      const code=defaultKeys[k];
      if(w.input[k]&&release.has(code)){frame[k]=false;release.delete(code);}
      else{frame[k]=has(code)||press.has(code);press.delete(code);release.delete(code);}
    }
    if(frame.jump&&!w.input.jump&&w.player.grounded)tone(480);
    for(const ev of w.step(frame)){
      const sounds={mote_picked:660+w.player.carried*28,lantern_lit:880,pulse:330,player_hit:146,shade_spawned:196,dash:392,charm_picked:988,wind_warning:240};
      if(sounds[ev.name])tone(sounds[ev.name]);
      if(ev.name==='pulse')view.pulse(w,time);
      if(ev.name==='lantern_lit')announce(ev.data.lantern_id+' đã sáng');
      if(ev.name==='wind_warning')announce('❧ Gió sắp thổi');
      if(ev.name==='shade_spawned')announce('Bóng Mực xuất hiện');
      if(ev.name==='player_hit')announce('Mất một ngọn lửa');
      if(ev.name==='game_over')end(ev.data.reason);
    }
    if(w.simTick%90===0)tone([196,247,294,220][Math.floor(w.simTick/90)%4],1.1,.045);
    if(w.timeLeft<=10 && w.simTick%60===0){tone(440);announce('Còn '+Math.ceil(w.timeLeft)+' giây');}
    if(w.tick%5===0||w.events.length)hud();
  }
  function loop(ms){
    const time=ms/1000,dt=Math.min(.18,time-(prev||time));prev=time;
    if(mode==='play'){acc+=dt;while(acc>=1/HZ&&mode==='play'){acc-=1/HZ;step(time);}}
    view.render(w,time,mode,yaw);requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
main().catch(err=>{$('loadError').hidden=false;$('loadError').textContent='Không mở được game: '+err.message;console.error(err);});
