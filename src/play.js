import {World,HZ,distance} from './world.js';
import {View} from './view.js';

const $ = id=>document.getElementById(id);
async function main(){
  const response=await fetch('./game.contract.json');if(!response.ok)throw new Error('Thiếu game.contract.json');
  const {tuning} = await response.json();
  const view=new View($('world'));
  let seed=17,w=new World(tuning,seed),mode='title',yaw=0,carryTime=0,prior,toastUntil=0,drag=null;
  let sound=false,audio;const keys=new Set(),pressed=new Set(),released=new Set();
  const buttons={jump:'Space',interact:'KeyE',pulse:'KeyF'};
  const clearKeys=()=>{keys.clear();pressed.clear();released.clear();};
  function keyDown(code){if(!keys.has(code))pressed.add(code);keys.add(code);}
  function keyUp(code){keys.delete(code);released.add(code);}
  function tone(freq,duration=.14){
    if(!sound || !audio)return;
    const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;
    o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(.055,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+duration);
  }
  $('sound').onclick=async()=>{
    sound=!sound;
    if(sound){audio??=new AudioContext();await audio.resume();tone(588);}
    const label=sound?'Tắt âm thanh':'Bật âm thanh';
    $('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',label);$('sound').title=label;
  };
  function setMode(next){
    mode=next;$('game').dataset.mode=mode;$('intro').hidden=mode!=='title';$('titleFoot').hidden=mode!=='title';
    $('hud').hidden=mode==='title';$('touch').hidden=mode!=='play' || !matchMedia('(pointer:coarse)').matches;
    carryTime=0;clearKeys();drag=null;
  }
  function start(){
    w=new World(tuning,seed);yaw=0;toastUntil=0;$('toast').textContent='';view.forceCamera=true;
    setMode('play');hud();document.activeElement?.blur();tone(392);
  }
  function toast(s){$('toast').textContent=s;toastUntil=w.tick+105;}
  function hud(){
    const lit=w.lanterns.filter(l=>l.lit).length;
    $('litCount').textContent=lit+' / '+w.lanterns.length;
    $('lamps').innerHTML=w.lanterns.map(l=>l.lit?'<i class="on"></i>':'<i></i>').join('');
    const sec=Math.ceil(w.timeLeft);$('clock').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
    $('points').textContent=w.score;$('bag').textContent=w.player.carried;
    $('health').innerHTML='◆'.repeat(w.player.flames)+'<i>'+'◇'.repeat(Math.max(0,tuning.flames-w.player.flames))+'</i>';
    $('health').setAttribute('aria-label',w.player.flames+' ngọn lửa');
    const near=w.lanterns.find(l=>!l.lit && distance(l.pos,w.player.pos)<=tuning.interact_radius);
    $('context').textContent=near ? near.id+' · '+near.deposited+'/'+tuning.lantern_cost+' · '+(w.player.carried?'Nhấn E để nạp đèn':'Tìm thêm đom đóm'):'';
    if(w.tick>toastUntil)$('toast').textContent='';
  }
  let onDialogClose=()=>{};
  function dialog(title,html,label,done){
    $('dialogTitle').textContent=title;$('dialogBody').innerHTML=html;$('dialogAction').textContent=label;
    onDialogClose=done;$('dialog').showModal();
  }
  function help(){
    if($('dialog').open)return;
    const before=mode;if(mode==='play')setMode('paused');
    dialog('Cách giữ đèn','<p>Đi qua đom đóm để nhặt. Mỗi đèn cần 4 đom đóm. Đèn đã sáng sẽ che chở Mây khỏi Bóng Mực.</p>'+
      '<dl><dt>Di chuyển</dt><dd><kbd>W A S D</kbd> / <kbd>↑ ← ↓ →</kbd></dd><dt>Xoay camera</dt><dd>Kéo cảnh / <kbd>Z</kbd> <kbd>X</kbd></dd>'+
      '<dt>Nhảy</dt><dd><kbd>Space</kbd></dd><dt>Nạp vào đèn gần</dt><dd><kbd>E</kbd></dd><dt>Tỏa sáng (2 đom đóm)</dt><dd><kbd>F</kbd></dd>'+
      '<dt>Tạm dừng</dt><dd><kbd>Esc</kbd></dd></dl>',before==='play'?'Chơi tiếp':'Quay lại',()=>setMode(before));
  }
  $('dialogAction').onclick=()=>$('dialog').close();
  $('dialog').addEventListener('close',()=>{onDialogClose();document.activeElement?.blur();});
  $('help').onclick=help;$('start').onclick=start;
  function end(reason){
    setMode('end');
    const won=w.state==='won';
    const message=won?'Cả năm Đèn Lồng Lớn đã sáng. Đảo Bến lại tìm thấy đường về trong biển mây.':
      reason==='no_flames'?'Bóng Mực đã làm tắt ngọn lửa cuối cùng của Mây.':'Bình minh đã đến khi trên đảo vẫn còn đèn tắt.';
    dialog(won?'Đảo đã sáng đèn':'Đêm đã khép lại','<p>'+message+'</p><dl><dt>Điểm</dt><dd>'+w.score+'</dd><dt>Đèn đã sáng</dt><dd>'+w.lanterns.filter(l=>l.lit).length+' / 5</dd></dl>','Chơi lại',()=>{seed++;start();});
  }
  const controls=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','Space','KeyE','KeyF','KeyZ','KeyX']);
  addEventListener('keydown',e=>{
    if(e.code==='Escape' && mode==='play'){e.preventDefault();help();return;}
    if(e.code==='Enter' && mode==='title' && !$('dialog').open && !e.target.closest('button')){start();return;}
    if(mode!=='play' || !controls.has(e.code))return;e.preventDefault();keyDown(e.code);
  });
  addEventListener('keyup',e=>{if(controls.has(e.code))keyUp(e.code);});
  addEventListener('blur',()=>{if(mode==='play')help();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden && mode==='play')help();});
  for(const b of document.querySelectorAll('[data-key]')){
    b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keyDown(b.dataset.key);};
    b.onpointerup=b.onpointercancel=()=>keyUp(b.dataset.key);
  }
  const canvas=$('world');
  canvas.onpointerdown=e=>{if(mode==='play'){drag=e.clientX;canvas.setPointerCapture(e.pointerId);}};
  canvas.onpointermove=e=>{if(drag!==null){yaw-=(e.clientX-drag)*.009;drag=e.clientX;}};
  canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};
  function step(time){
    const has=(...codes)=>codes.some(c=>keys.has(c));
    yaw+=(Number(has('KeyX'))-Number(has('KeyZ')))*1.8/HZ;
    const frame={move:[Number(has('KeyD','ArrowRight'))-Number(has('KeyA','ArrowLeft')),
      Number(has('KeyS','ArrowDown'))-Number(has('KeyW','ArrowUp'))],cam_yaw_deg:yaw*180/Math.PI};
    for(const [name,code] of Object.entries(buttons)) {
      // Preserve short taps between render frames, including release/repress within one tick.
      if(w.input[name] && released.has(code)) {frame[name]=false;released.delete(code);}
      else {frame[name]=keys.has(code)||pressed.has(code);pressed.delete(code);released.delete(code);}
    }
    let reason;
    for(const e of w.step(frame)) {
      if(e.name==='mote_picked')tone(640+e.data.carried*38,.10);
      if(e.name==='lantern_lit'){toast(e.data.lantern_id+' đã sáng');tone(880,.48);}
      if(e.name==='pulse'){view.pulse(w,time);tone(330,.28);}
      if(e.name==='player_hit'){toast('Bóng Mực chạm Mây · mất 1 ngọn lửa');tone(146,.3);}
      if(e.name==='game_over')reason=e.data.reason;
    }
    if(reason || w.tick%5===0 || w.events.length)hud();
    if(reason)end(reason);
  }
  function loop(ms){
    const time=ms/1000,dt=Math.min(.15,Math.max(0,time-(prior??time)));prior=time;
    if(mode==='play'){
      carryTime+=dt;
      while(carryTime>=1/HZ && mode==='play'){carryTime-=1/HZ;step(time);}
    }
    view.render(w,time,mode,yaw);requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
main().catch(err=>{
  $('start').disabled=true;$('loadError').hidden=false;
  $('loadError').textContent='Chưa mở được cảnh 3D. Hãy dùng trình duyệt có WebGL 2 và chạy npm ci rồi npm start. '+err.message;
  console.error(err);
});
