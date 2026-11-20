export const HZ = 60;
export const ISLAND_RADIUS = 27;
export const distance = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
export const round = n => Math.round(n * 1000) / 1000;
const point = pos => pos.map(round);
const secondsToTicks = s => Math.round(s * HZ);
const blankInput = () => ({move:[0, 0], cam_yaw_deg:0, jump:false, interact:false, pulse:false});

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
  constructor(tuning, seed = 1, scenario = {}) {
    this.t = tuning;
    this.rng = seeded(seed);
    this.tick = 0;
    this.score = 0;
    this.state = 'playing';
    this.events = [];
    this.input = blankInput();
    this.initialTime = scenario.time_left_s ?? tuning.night1_duration_s;
    this.timeLeft = this.initialTime;
    this.player = {pos:[...(scenario.player?.pos ?? [0,0,0])], carried:scenario.player?.carried ?? 0,
      flames:scenario.player?.flames ?? tuning.flames};
    this.velocityY = 0;
    this.facing = 0;
    this.hitReady = 0;
    this.pulseReady = 0;
    this.randomMotes = scenario.random_motes ?? true;
    this.randomShades = scenario.random_shades ?? true;
    this.moteSeq = 0;
    this.shadeSeq = 0;
    this.reservedShades = new Set((scenario.shades ?? []).map(s => s.id).filter(Boolean));
    this.lanterns = Array.from({length:tuning.lantern_count_night1}, (_, i) => {
      const a = i * 2 * Math.PI / tuning.lantern_count_night1;
      const id = 'L' + (i+1);
      const patch = scenario.lanterns?.find(l => l.id === id);
      const deposited = patch?.deposited ?? (patch?.lit ? tuning.lantern_cost : 0);
      return {id, pos:[...(patch?.pos ?? [16*Math.sin(a), 0, -16*Math.cos(a)])],
        lit:patch?.lit ?? deposited >= tuning.lantern_cost, deposited};
    });
    this.motes = [];
    this.shades = [];
    if (scenario.motes) scenario.motes.forEach(pos => this.addMote(pos));
    else if (this.randomMotes) {
      // Five reachable trails, with seeded variation and more lights near the coast.
      for (const lamp of this.lanterns) {
        for (let i=1; i<=6; i++) {
          const r = i / 7;
          this.addMote([lamp.pos[0]*r+(this.rng()-.5)*1.4, 0, lamp.pos[2]*r+(this.rng()-.5)*1.4]);
        }
      }
      for (let i=0; i<16; i++) this.addMote(this.randomPoint());
    }
    if (scenario.shades) scenario.shades.forEach(s => this.addShade(s.pos, s.id));
    else if (this.randomShades) this.addShade(this.randomPoint(true));
  }

  randomPoint(edge = false) {
    const a = this.rng()*Math.PI*2;
    const r = edge ? ISLAND_RADIUS-1 : Math.sqrt(this.rng())*(ISLAND_RADIUS-2);
    return [Math.cos(a)*r, 0, Math.sin(a)*r];
  }
  addMote(pos, available = 0) {
    this.motes.push({id:'M'+(++this.moteSeq), pos:[...pos], available});
  }
  addShade(pos, id) {
    if (!id) {
      do { id = 'S'+(++this.shadeSeq); } while (this.reservedShades.has(id));
    }
    this.reservedShades.add(id);
    this.shades.push({id, pos:[...pos], state:'chase', wake:0});
    return id;
  }
  emit(name, data) { this.events.push({type:'event', tick:this.tick, name, data}); }
  movePlayer(jump) {
    const {move:[x,z], cam_yaw_deg} = this.input;
    const theta = cam_yaw_deg*Math.PI/180;
    const magnitude = Math.max(1,Math.hypot(x,z));
    const dx = (x*Math.cos(theta)+z*Math.sin(theta))/magnitude;
    const dz = (-x*Math.sin(theta)+z*Math.cos(theta))/magnitude;
    const pos = this.player.pos;
    pos[0] += dx*this.t.player_speed/HZ;
    pos[2] += dz*this.t.player_speed/HZ;
    if (dx || dz) this.facing = Math.atan2(dx,dz);
    const r = Math.hypot(pos[0],pos[2]);
    if (r > ISLAND_RADIUS) {
      pos[0] *= ISLAND_RADIUS/r;
      pos[2] *= ISLAND_RADIUS/r;
    }
    if (jump && pos[1] <= 0) this.velocityY = 7;
    this.velocityY -= 18/HZ;
    pos[1] = Math.max(0, pos[1]+this.velocityY/HZ);
    if (!pos[1]) this.velocityY = 0;
  }
  pick() {
    const p = this.player;
    this.motes = this.motes.filter(m => {
      if (m.available > this.tick || p.carried >= this.t.carry_capacity ||
          distance(m.pos,p.pos) > this.t.pickup_radius) return true;
      p.carried++;
      this.score += this.t.score.per_mote;
      this.emit('mote_picked',{carried:p.carried});
      return false;
    });
  }
  deposit() {
    const p = this.player;
    const lamp = this.lanterns.filter(l => !l.lit && distance(l.pos,p.pos)<=this.t.interact_radius)
      .sort((a,b) => distance(a.pos,p.pos)-distance(b.pos,p.pos))[0];
    if (!lamp || !p.carried) return;
    const amount = Math.min(p.carried, this.t.lantern_cost-lamp.deposited);
    lamp.deposited += amount;
    p.carried -= amount;
    this.emit('deposit',{lantern_id:lamp.id,amount,deposited:lamp.deposited});
    if (lamp.deposited === this.t.lantern_cost) {
      lamp.lit = true;
      this.score += this.t.score.per_lantern;
      this.emit('lantern_lit',{lantern_id:lamp.id});
    }
  }
  pulse() {
    const {player:p,t} = this;
    if (p.carried < t.pulse_cost || this.tick < this.pulseReady) return;
    p.carried -= t.pulse_cost;
    this.pulseReady = this.tick+secondsToTicks(t.pulse_cooldown_s);
    const ids = [];
    for (const s of this.shades) {
      const d = distance(s.pos,p.pos);
      if (d > t.pulse_radius) continue;
      const dx = d ? (s.pos[0]-p.pos[0])/d : 1;
      const dz = d ? (s.pos[2]-p.pos[2])/d : 0;
      s.pos[0] += dx*t.pulse_push_m;
      s.pos[2] += dz*t.pulse_push_m;
      s.state = 'stunned';
      s.wake = this.tick+secondsToTicks(t.pulse_stun_s);
      ids.push(s.id);
    }
    this.score += ids.length*t.score.per_stun;
    this.emit('pulse',{stunned_ids:ids});
  }
  updateShades() {
    const {player:p, t} = this;
    const safe = this.lanterns.filter(l => l.lit);
    const sheltered = safe.some(l => distance(l.pos,p.pos) <= t.safe_radius);
    for (const s of this.shades) {
      const d = distance(s.pos,p.pos);
      const step = Math.min(1, t.shade_speed/HZ/(d || 1));
      const stunned = this.tick < s.wake;
      s.state = stunned ? 'stunned' : 'chase';
      if (!stunned) {
        s.pos[0] += (p.pos[0]-s.pos[0])*step;
        s.pos[2] += (p.pos[2]-s.pos[2])*step;
      }
      for (const l of safe) {
        const r = distance(l.pos,s.pos);
        if (r > t.safe_radius) continue;
        const ux = r ? (s.pos[0]-l.pos[0])/r : 1;
        const uz = r ? (s.pos[2]-l.pos[2])/r : 0;
        s.pos[0] = l.pos[0]+ux*(t.safe_radius+0.001);
        s.pos[2] = l.pos[2]+uz*(t.safe_radius+0.001);
      }
      if (!stunned && !sheltered && this.tick >= this.hitReady && distance(s.pos,p.pos) <= t.shade_hit_radius) {
        this.hitReady = this.tick+secondsToTicks(t.invuln_s);
        p.flames = Math.max(0,p.flames-1);
        const dropped = Math.floor(p.carried*t.hit_drop_ratio);
        p.carried -= dropped;
        for (let i=0;i<dropped;i++) {
          const a = 2*Math.PI*i/dropped;
          this.addMote([p.pos[0]+Math.cos(a)*1.8,0,p.pos[2]+Math.sin(a)*1.8],this.tick+HZ);
        }
        this.emit('player_hit',{by:'shade',flames:p.flames,dropped});
      }
    }
  }
  finish(result, reason) {
    this.state = result;
    if (result === 'won') this.score += Math.floor(this.timeLeft)*this.t.score.per_second_left+
      this.player.flames*this.t.score.per_flame_left;
    this.emit('game_over',{result,reason});
  }
  step(frame = {}) {
    if (this.state !== 'playing') return [];
    const old = this.input;
    this.input = {...old, ...frame};
    const rising = key => this.input[key] && !old[key];
    this.events = [];
    this.tick++;
    this.timeLeft = Math.max(0,this.initialTime-this.tick/HZ);
    this.movePlayer(rising('jump'));
    this.pick();
    if (rising('interact')) this.deposit();
    if (rising('pulse')) this.pulse();
    this.updateShades();
    if (this.lanterns.every(l => l.lit)) this.finish('won','all_lit');
    else if (this.player.flames === 0) this.finish('lost','no_flames');
    else if (this.timeLeft <= 0) this.finish('lost','dawn');
    else {
      if (this.randomMotes && this.tick%(2*HZ)===0 && this.motes.length<48) this.addMote(this.randomPoint());
      if (this.randomShades && this.tick%(20*HZ)===0 && this.shades.length<4) {
        this.emit('shade_spawned',{id:this.addShade(this.randomPoint(true))});
      }
    }
    return this.events;
  }
  snapshot() {
    const p = this.player;
    return {type:'snapshot', tick:this.tick, sim_tick:this.tick, state:this.state,
      time_left_s:this.timeLeft, score:this.score, player:{pos:point(p.pos),flames:p.flames,carried:p.carried},
      lanterns:this.lanterns.map(l => ({...l,pos:point(l.pos)})),
      shades:this.shades.map(s => ({id:s.id,pos:point(s.pos),state:s.state})),
      motes_active:this.motes.length,motes:this.motes.map(m => ({id:m.id,pos:point(m.pos)}))};
  }
}
