import { type Campaign, completeEncounter, knightMax } from './Campaign';
import {
  encounters,
  enemyRoles,
  mounts,
  recruits,
  roles,
  wallSpec,
  type EnemyRole,
  type ItemKind,
} from './Catalog';
import { spec } from '../construction/Catalog';
import { type Defense, stepDefenses, interceptSegment } from '../construction/DefenseSystem';
import type { Position } from '../combat/Hazards';

export interface Actor extends Position {
  id: number;
  name: string;
  role: 'king' | 'warden' | 'marksman' | EnemyRole | 'dragon';
  hp: number;
  maxHp: number;
  yaw: number;
  moving: boolean;
  action: string;
  actionTime: number;
  cooldown: number;
  fired: boolean;
  home: Position;
  deployed: boolean;
  gear: ItemKind | null;
  ward: number;
  rescue: boolean;
  relay: number;
  marked: number;
  deadTime: number;
  rank: number;
  roster?: string;
  stance: 'guard' | 'hunt';
  talents: string[];
  ability: number;
  cry: number;
  healing: number;
  attacks: number;
  stunned: number;
  taunted: number;
  taunter: number;
  barrier: number;
  barrierTime: number;
}
export interface Bolt extends Position {
  id: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  damage: number;
  friendly: boolean;
  owner: number;
  hits: number[];
  pierce: number;
  royal: boolean;
  relay: boolean;
  ignoreShield: boolean;
}
export interface Telegraph {
  id: number;
  kind: 'breath' | 'rake' | 'tail' | 'hex';
  x: number;
  z: number;
  yaw: number;
  radius: number;
  arc: number;
  length: number;
  age: number;
  windup: number;
  duration: number;
  damage: number;
  hits: number[];
}
export interface Effect extends Position {
  id: number;
  age: number;
  kind: 'hit' | 'block' | 'heal' | 'decree' | 'death' | 'slam' | 'taunt' | 'lightning' | 'charge';
  end?: Position;
}
export interface Input {
  rotate: number;
  heading?: number;
  charge: boolean;
  decree: boolean;
}
const tau = Math.PI * 2;
export const deltaAngle = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export const distance = (a: Pick<Position, 'x' | 'z'>, b: Pick<Position, 'x' | 'z'>) =>
  Math.hypot(a.x - b.x, a.z - b.z);
export function wallPosition(angle: number, height: number): Position {
  const s = Math.sin(angle),
    c = Math.cos(angle),
    r = 5.3;
  return { x: s * r, y: height, z: c * r };
}
export const wallSide = (p: Pick<Position, 'x' | 'z'>) =>
  Math.abs(p.z) >= Math.abs(p.x) ? (p.z < 0 ? 0 : 2) : p.x > 0 ? 1 : 3;
export function facingShield(target: Actor, source: Position) {
  return (
    ['warden', 'bulwark'].includes(target.role) &&
    Math.abs(deltaAngle(Math.atan2(source.x - target.x, source.z - target.z), target.yaw)) <
      Math.PI * 0.38
  );
}
export function inTelegraph(t: Telegraph, p: Position) {
  const d = distance(t, p);
  if (t.kind === 'hex') return d <= t.radius;
  const angle = deltaAngle(Math.atan2(p.x - t.x, p.z - t.z), t.yaw);
  return d <= t.length && d >= t.radius && Math.abs(angle) <= t.arc / 2;
}
function segmentHit(a: Position, b: Position, p: Position, r: number) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    dz = b.z - a.z,
    l = dx * dx + dy * dy + dz * dz;
  const u = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy + (p.z - a.z) * dz) / (l || 1)),
  );
  return Math.hypot(a.x + dx * u - p.x, a.y + dy * u - p.y, a.z + dz * u - p.z) < r;
}
export class Battle {
  readonly state: Campaign;
  readonly checkpoint: Campaign;
  king: Actor;
  knights: Actor[] = [];
  enemies: Actor[] = [];
  defenses: Defense[] = [];
  bolts: Bolt[] = [];
  dangers: Telegraph[] = [];
  effects: Effect[] = [];
  time = 0;
  angle = 0;
  phase: 'planning' | 'battle' | 'won' | 'lost' = 'planning';
  paused = false;
  power = 60;
  charge = 0;
  kills = 0;
  royalHits = 0;
  spawned = 0;
  spawnTimer = 3;
  bossSpawned = false;
  bossClock = 0;
  bossAttack = 0;
  bossResolve = 0;
  bossInterrupts = 0;
  announcement = 'Prepare the castle, then sound the horns.';
  private serial = 10000;
  private seed = 412;
  private rewarded = false;
  stats = {
    royalDamage: 0,
    companyDamage: 0,
    defenseDamage: 0,
    wallDamage: 0,
    bossDamage: 0,
    shielded: 0,
    rescues: 0,
  };
  constructor(s: Campaign) {
    this.checkpoint = structuredClone(s);
    this.state = structuredClone(s);
    this.seed += s.encounter * 317;
    this.king = this.actor(
      'king',
      'The Storm King',
      wallPosition(0, wallSpec(s.wallTier).height),
      160,
    );
    this.king.hp = s.kingHp;
    const active = s.knights.filter((k) => k.active);
    this.knights = active.map((k, i) => {
      const recruit = recruits.find((r) => r.id === k.id)!,
        north = i === 0,
        home = { x: i === 2 ? 2.2 : -2.2, y: 0, z: north ? -9.6 : 9.6 };
      const a = this.actor(
        recruit.role,
        recruit.name,
        { x: (i - 1) * 0.7, y: 0, z: north ? -3.1 : 3.1 },
        knightMax(k),
      );
      Object.assign(a, {
        hp: k.hp,
        home,
        rank: k.rank,
        roster: k.id,
        stance: k.stance,
        gear: s.inventory.find((item) => item.id === k.gear)?.kind || null,
        talents: [...k.talents],
      });
      return a;
    });
    this.defenses = s.buildings.map((b) => {
      const m = mounts.find((m) => m.id === b.site)!;
      return {
        ...b,
        x: m.x,
        z: m.z,
        y: wallSpec(s.wallTier).height,
        age: 2,
        reload: 0.8,
        recoil: 0,
        aimYaw: b.yaw,
        charge: spec(b.kind, b.rank).capacity,
        lastBlocked: 0,
        shots: 0,
        blocked: 0,
        flash: 0,
      };
    });
  }
  private id = () => this.serial++;
  private random() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  private actor(role: Actor['role'], name: string, p: Position, hp: number): Actor {
    return {
      ...p,
      id: this.id(),
      role,
      name,
      hp,
      maxHp: hp,
      yaw: 0,
      moving: false,
      action: '',
      actionTime: 0,
      cooldown: 0.4,
      fired: false,
      home: { ...p },
      deployed: role === 'king',
      gear: null,
      ward: 0,
      rescue: false,
      relay: 0,
      marked: 0,
      deadTime: 0,
      rank: 1,
      stance: 'hunt',
      talents: [],
      ability: 1,
      cry: 1,
      healing: 2,
      attacks: 0,
      stunned: 0,
      taunted: 0,
      taunter: 0,
      barrier: 0,
      barrierTime: 0,
    };
  }
  start() {
    if (this.phase !== 'planning' || this.state.encounter >= encounters.length) return;
    this.phase = 'battle';
    this.announcement = 'Horns sounded. The company is deploying.';
  }
  private effect(p: Position, kind: Effect['kind']) {
    this.effects.push({ ...p, id: this.id(), age: 0, kind });
  }
  private rune(kind: ItemKind) {
    return this.state.sockets[this.state.weapon].some(
      (id) => this.state.inventory.find((i) => i.id === id)?.kind === kind,
    );
  }
  private walk(a: Actor, target: Position, dt: number, speed: number, outside = true) {
    let tx = target.x,
      tz = target.z;
    // Follow the circular curtain until the direct route clears the wall.
    if (outside) {
      for (let t = 0.15; t < 1; t += 0.15)
        if (Math.hypot(a.x + (tx - a.x) * t, a.z + (tz - a.z) * t) < 7) {
          const from = Math.atan2(a.x, a.z),
            to = Math.atan2(tx, tz),
            turn = Math.sign(deltaAngle(to, from));
          tx = Math.sin(from + turn * 0.35) * 9.2;
          tz = Math.cos(from + turn * 0.35) * 9.2;
          break;
        }
    }
    const dx = tx - a.x,
      dz = tz - a.z,
      d = Math.hypot(dx, dz);
    a.moving = d > 0.16;
    if (!a.moving) return;
    const step = Math.min(d, speed * dt);
    a.x += (dx / d) * step;
    a.z += (dz / d) * step;
    a.yaw = Math.atan2(dx, dz);
  }
  private attack(a: Actor, clip: string) {
    a.action = clip;
    a.actionTime = 0;
    a.fired = false;
    a.moving = false;
  }
  private shoot(
    a: Actor,
    target: Position,
    damage: number,
    friendly: boolean,
    royal = false,
    relay = false,
    heavy = false,
    sourceOwner = a.id,
  ) {
    const p = { x: a.x, y: a.y + (a.role === 'dragon' ? 2.8 : 1.4), z: a.z };
    const end = {
      x: target.x,
      y: target.y + ('role' in target && target.role === 'dragon' ? 2 : 1.1),
      z: target.z,
    };
    const d = Math.max(0.1, Math.hypot(end.x - p.x, end.y - p.y, end.z - p.z)),
      speed = relay ? 20 : heavy ? 27 : friendly ? 23 : 9;
    this.bolts.push({
      ...p,
      id: this.id(),
      vx: ((end.x - p.x) / d) * speed,
      vy: ((end.y - p.y) / d) * speed,
      vz: ((end.z - p.z) / d) * speed,
      damage,
      friendly,
      royal,
      relay,
      owner: sourceOwner,
      life: 2.8,
      hits: [],
      pierce: heavy ? 3 : 1,
      ignoreShield: heavy,
    });
  }
  damage(
    target: Actor,
    amount: number,
    source: Position,
    owner: number,
    royal = false,
    ignoreShield = false,
    relay = false,
  ) {
    if (target.hp <= 0) return;
    if (target.talents.includes('bulwark') && target.cry > 5) amount *= 0.75;
    if (target.barrierTime > 0 && target.barrier > 0) {
      const absorbed = Math.min(amount, target.barrier);
      amount -= absorbed;
      target.barrier -= absorbed;
      this.stats.shielded += absorbed;
      this.effect(target, 'block');
    }
    const enemy = this.enemies.includes(target);
    if (!ignoreShield && facingShield(target, source)) {
      amount *= target.role === 'bulwark' ? 0.3 : 0.6;
      this.effect(target, 'block');
    }
    if (target.gear === 'ward-seal' && target.ward === 0) {
      const blocked = Math.min(12, amount);
      amount -= blocked;
      target.ward = 6;
      this.stats.shielded += blocked;
      this.effect(target, 'block');
    }
    if (royal && this.rune('sundering') && (target.role === 'dragon' || target.role === 'bulwark'))
      amount += 14;
    amount = Math.min(target.hp, amount);
    target.hp = Math.max(0, target.hp - amount);
    this.effect({ ...target, y: target.y + 1 }, 'hit');
    if (enemy) {
      if (royal) {
        this.stats.royalDamage += amount;
        this.royalHits++;
        if (this.rune('vital-spark') && this.royalHits % 4 === 0) {
          const k = this.knights
            .filter((k) => k.hp > 0)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (k) {
            k.hp = Math.min(k.maxHp, k.hp + 6);
            this.effect(k, 'heal');
          }
        }
        if (this.rune('forked-light') && this.royalHits % 3 === 0) {
          const next = this.enemies.find(
            (e) => e !== target && e.hp > 0 && distance(e, target) < 6,
          );
          if (next) this.shoot(target, next, 16, true, false, true, false, this.king.id);
        }
      } else if (owner === this.king.id) this.stats.royalDamage += amount;
      else if (this.defenses.some((b) => b.id === owner)) this.stats.defenseDamage += amount;
      else this.stats.companyDamage += amount;
      if (target.role === 'dragon') this.stats.bossDamage += amount;
      const knight = this.knights.find((k) => k.id === owner);
      if (
        !relay &&
        knight &&
        knight.relay === 0 &&
        target.marked > 0 &&
        this.state.relic === 'storm-oath'
      ) {
        const next = this.enemies.find((e) => e !== target && e.hp > 0 && distance(e, target) < 7);
        if (next) {
          this.shoot(target, next, 24, true, false, true, false, knight.id);
          knight.relay = 3;
        }
      }
      if (target.hp === 0) {
        this.kills++;
        this.power = Math.min(100, this.power + 5);
        this.effect(target, 'death');
        if (target.role === 'dragon') {
          this.dangers = [];
          this.announcement = 'The Emberwing Dragon has fallen.';
        }
      }
    }
  }
  private spawn() {
    const encounter = encounters[this.state.encounter],
      left = encounter.budget - this.spawned;
    const roll = this.random(),
      role: EnemyRole =
        roll < 0.22 && left >= 2.5 ? 'bulwark' : roll < 0.44 && left >= 2 ? 'hexcaster' : 'raider';
    const a = this.random() * tau,
      r = 21 + this.random() * 2.3,
      data = enemyRoles[role];
    const e = this.actor(
      role,
      data.name,
      { x: Math.sin(a) * r, y: 0, z: Math.cos(a) * r },
      data.hp * (this.state.difficulty === 'veteran' ? 1.22 : 1),
    );
    e.deployed = true;
    this.enemies.push(e);
    this.spawned += data.cost;
  }
  private deploy(k: Actor, dt: number) {
    const sign = Math.sign(k.home.z),
      destination = Math.abs(k.z) < 7.7 ? { x: 0, y: 0, z: sign * 8.2 } : k.home;
    this.walk(k, destination, dt, 3.4, false);
    if (distance(k, k.home) < 0.25) {
      k.deployed = true;
      k.moving = false;
    }
  }
  private heal(a: Actor, amount: number) {
    if (a.hp <= 0 || a.hp >= a.maxHp) return;
    a.hp = Math.min(a.maxHp, a.hp + amount);
    this.effect(a, 'heal');
  }
  private knightTalents(k: Actor) {
    const has = (id: string) => k.talents.includes(id);
    if (has('slam') && k.ability === 0 && !k.action) {
      const targets = this.enemies.filter(
        (e) => e.hp > 0 && e.action !== 'arrive' && distance(e, k) < (has('aftershock') ? 4 : 3),
      );
      if (targets.length) {
        this.attack(k, 'shield_bash');
        k.fired = true;
        k.ability = has('earthshaker') ? 5 : 8;
        this.effect(k, 'slam');
        for (const e of targets) {
          this.damage(e, has('aftershock') ? 40 : 24, k, k.id, false, true);
          if (e.role !== 'dragon') {
            e.stunned = has('earthshaker') ? 2 : 1.2;
            e.action = '';
          }
        }
      }
    }
    if (has('taunt') && k.cry === 0) {
      const targets = this.enemies.filter(
        (e) => e.hp > 0 && e.role !== 'dragon' && distance(e, k) < 6,
      );
      if (targets.length) {
        k.cry = 9;
        this.effect(k, 'taunt');
        for (const e of targets) {
          e.taunted = 4;
          e.taunter = k.id;
          e.action = '';
        }
      }
    }
    if (k.healing === 0 && (has('renewal') || has('mending'))) {
      k.healing = has('beacon') ? 3 : 4;
      const nearby = this.knights.filter(
        (a) => a.hp > 0 && distance(a, k) <= (has('renewal') ? 5 : has('beacon') ? 10 : 7),
      );
      if (has('renewal')) for (const a of nearby) this.heal(a, 6);
      else {
        const target = nearby.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (target) {
          this.heal(target, has('beacon') ? 14 : 8);
          if (has('shelter')) {
            target.barrier = 10;
            target.barrierTime = 5;
            this.effect(target, 'block');
          }
        }
      }
    }
  }
  private supportBuilding(b: Defense, dt: number) {
    b.age += dt;
    b.flash = Math.max(0, b.flash - dt);
    b.reload = Math.max(0, b.reload - dt);
    if (b.hp <= 0 || b.age < 1.2 || b.reload > 0) return;
    const r = spec(b.kind, b.rank);
    if (b.kind === 'sanctuary') {
      const allies = this.knights.filter(
        (k) => k.hp > 0 && k.hp < k.maxHp && distance(b, k) <= r.range,
      );
      if (!allies.length) return;
      for (const k of allies) this.heal(k, r.damage);
      this.effect(b, 'heal');
    } else {
      const targets = this.enemies
        .filter((e) => e.hp > 0 && e.action !== 'arrive' && distance(b, e) <= r.range)
        .sort((a, c) => distance(a, b) - distance(c, b));
      if (!targets.length) return;
      let from: Position = { ...b, y: b.y + 1.5 + b.rank * 0.5 };
      const hit = new Set<number>();
      for (let n = 0; n < b.rank + 1; n++) {
        const target = targets.find((e) => !hit.has(e.id) && (n === 0 || distance(e, from) <= 5));
        if (!target) break;
        this.effects.push({
          ...from,
          id: this.id(),
          age: 0,
          kind: 'lightning',
          end: { ...target, y: target.y + 1 },
        });
        this.damage(target, r.damage, from, b.id, false, true);
        from = { ...target, y: target.y + 1 };
        hit.add(target.id);
      }
    }
    b.reload = r.interval;
    b.flash = 0.6;
    b.shots++;
  }
  private tickKnight(k: Actor, dt: number) {
    if (!k.deployed) {
      this.deploy(k, dt);
      return;
    }
    this.knightTalents(k);
    if (k.gear === 'field-kit' && !k.rescue) {
      const fallen = this.knights.find((a) => a !== k && a.hp <= 0 && a.deployed);
      if (fallen) {
        if (distance(k, fallen) > 1.3) this.walk(k, fallen, dt, 3.5);
        else {
          k.moving = false;
          if (k.action !== 'interact') k.actionTime = 0;
          k.action = 'interact';
          k.actionTime += dt;
          if (k.actionTime > 1.4) {
            fallen.hp = fallen.maxHp * 0.35;
            k.rescue = true;
            k.action = '';
            k.actionTime = 0;
            this.stats.rescues++;
            this.effect(fallen, 'heal');
          }
        }
        return;
      }
    }
    const data = roles[k.role as 'warden' | 'marksman'];
    const targets = this.enemies.filter(
      (e) => e.hp > 0 && (k.stance === 'hunt' || distance(e, k.home) < 8),
    );
    targets.sort((a, b) => distance(a, k) - distance(b, k));
    const target = targets[0];
    if (!target) {
      k.action = '';
      this.walk(k, k.home, dt, data.speed);
      return;
    }
    const d = distance(k, target),
      range = data.range + (target.role === 'dragon' ? 1.8 : 0);
    if (!k.action && d > range) {
      this.walk(k, target, dt, data.speed);
      return;
    }
    k.moving = false;
    k.yaw = Math.atan2(target.x - k.x, target.z - k.z);
    if (!k.action && k.cooldown === 0)
      this.attack(k, k.role === 'warden' ? 'sword_slash' : 'bow_fire');
    if (k.action) {
      k.actionTime += dt;
      const contact = k.role === 'warden' ? 0.66 : 0.66;
      if (!k.fired && k.actionTime >= contact) {
        k.fired = true;
        k.attacks++;
        let damage =
          (data.damage + (k.rank - 1) * 7 + (k.gear === 'storm-seal' ? 6 : 0)) *
          (k.talents.includes('deadeye') ? 1.3 : 1);
        if (
          this.state.relic === 'black-standard' &&
          k.stance === 'guard' &&
          distance(k, k.home) <= 3
        )
          damage *= 1.35;
        if (k.role === 'marksman') {
          this.shoot(k, target, damage, true, false, false, k.talents.includes('piercing'));
          if (k.talents.includes('piercing')) this.bolts[this.bolts.length - 1].pierce = 2;
          if (k.talents.includes('volley') && k.attacks % 3 === 0) {
            const second = targets.find((e) => e !== target && distance(k, e) <= range);
            if (second) this.shoot(k, second, k.talents.includes('deadeye') ? 24 : 16, true);
          }
        } else if (d <= range + 0.4) this.damage(target, damage, k, k.id);
      }
      if (k.actionTime >= 1.2) {
        k.action = '';
        k.cooldown = k.role === 'warden' ? 0.3 : 0.35;
      }
    }
  }
  private tickEnemy(e: Actor, dt: number) {
    if (e.stunned > 0) {
      e.moving = false;
      return;
    }
    if (e.role === 'dragon') {
      this.tickDragon(e, dt);
      return;
    }
    const data = enemyRoles[e.role as EnemyRole];
    const company = this.knights
      .filter((k) => k.hp > 0 && k.deployed)
      .sort((a, b) => distance(a, e) - distance(b, e));
    const forced = e.taunted > 0 ? company.find((k) => k.id === e.taunter) : undefined;
    const target =
      forced ||
      (company[0] && distance(company[0], e) < (e.role === 'hexcaster' ? 14 : 5)
        ? company[0]
        : null);
    const side = wallSide(e),
      radius = Math.max(0.1, Math.hypot(e.x, e.z)),
      wall: Position = { x: (e.x / radius) * 6.65, y: 0, z: (e.z / radius) * 6.65 };
    const aim =
      forced ||
      (e.role === 'hexcaster' && distance(e, this.king) < 15 ? this.king : target || wall);
    const range = e.role === 'hexcaster' ? 11 : data.range,
      d = distance(e, aim);
    if (!e.action && d > range) {
      this.walk(e, aim, dt, data.speed);
      return;
    }
    e.moving = false;
    e.yaw = Math.atan2(aim.x - e.x, aim.z - e.z);
    if (!e.action && e.cooldown === 0)
      this.attack(
        e,
        e.role === 'hexcaster'
          ? 'staff_cast'
          : e.role === 'bulwark'
            ? 'shield_bash'
            : 'sword_slash',
      );
    if (e.action) {
      e.actionTime += dt;
      const contact = e.role === 'hexcaster' ? 0.9 : e.role === 'bulwark' ? 0.5 : 0.66;
      if (!e.fired && e.actionTime >= contact) {
        e.fired = true;
        if (e.role === 'hexcaster') {
          this.shoot(e, aim, data.damage, false);
          if (this.state.encounter > 0 && this.random() < 0.35)
            this.dangers.push({
              id: this.id(),
              kind: 'hex',
              x: aim.x,
              z: aim.z,
              yaw: 0,
              radius: 1.8,
              arc: tau,
              length: 0,
              age: 0,
              windup: 1.4,
              duration: 0.35,
              damage: 16,
              hits: [],
            });
        } else if (target && d < range + 0.35) this.damage(target, data.damage, e, e.id);
        else if (!target && d < range + 0.35) {
          this.state.walls[side] = Math.max(0, this.state.walls[side] - data.damage);
          this.stats.wallDamage += data.damage;
          this.effect({ ...wall, y: 1 }, 'hit');
        }
      }
      if (e.actionTime > 1.5) {
        e.action = '';
        e.cooldown = e.role === 'hexcaster' ? 2.1 : 1;
      }
    }
  }
  private tickDragon(e: Actor, dt: number) {
    this.bossClock += dt;
    if (e.action === 'arrive') {
      e.actionTime += dt;
      e.y = Math.max(0, 6 * (1 - e.actionTime / 3));
      if (e.actionTime >= 3) {
        e.action = '';
        e.actionTime = 0;
        this.bossClock = 0;
      }
      return;
    }
    if (e.action === 'stagger') {
      e.actionTime += dt;
      if (e.actionTime >= 2.2) {
        e.action = '';
        this.bossClock = 0;
      }
      return;
    }
    if (e.action) {
      e.actionTime += dt;
      if (e.actionTime >= 4) {
        e.action = '';
        e.actionTime = 0;
        this.bossClock = 0;
      }
      return;
    }
    const a = Math.atan2(e.x, e.z),
      next = a + dt * (e.hp < e.maxHp * 0.5 ? 0.2 : 0.13),
      r = 14;
    e.x = Math.sin(next) * r;
    e.z = Math.cos(next) * r;
    e.yaw = Math.atan2(-e.x, -e.z);
    e.moving = true;
    if (this.bossClock < 3.6) return;
    e.moving = false;
    this.bossClock = 0;
    this.bossAttack++;
    const type = this.bossAttack % 3 === 1 ? 'breath' : this.bossAttack % 3 === 2 ? 'rake' : 'tail';
    e.action = type;
    e.actionTime = 0;
    this.bossResolve = type === 'breath' ? 90 : 140;
    const aim =
      type === 'tail'
        ? this.knights.filter((k) => k.hp > 0).sort((a, b) => distance(a, e) - distance(b, e))[0] ||
          this.king
        : this.king;
    const attackYaw = Math.atan2(aim.x - e.x, aim.z - e.z);
    e.yaw = attackYaw + (type === 'tail' ? Math.PI : 0);
    this.dangers.push({
      id: this.id(),
      kind: type,
      x: e.x,
      z: e.z,
      yaw: attackYaw,
      radius: type === 'tail' ? 0 : 1.5,
      arc: type === 'breath' ? 0.6 : type === 'rake' ? 0.8 : 2.5,
      length: type === 'tail' ? 6 : 19,
      age: 0,
      windup: type === 'breath' ? 2.2 : 1.6,
      duration: type === 'breath' ? 1.1 : 0.45,
      damage: type === 'breath' ? 39 : 29,
      hits: [],
    });
    this.announcement =
      type === 'breath'
        ? 'DRAGONFIRE — rotate the King out of the marked cone.'
        : type === 'rake'
          ? 'RENDING GALE — claw-winds strike the marked battlements.'
          : 'TAIL SWEEP — the company is within reach.';
  }
  private royal(dt: number, input: Input) {
    let rotation = input.rotate;
    if (input.heading !== undefined && input.rotate === 0)
      rotation = Math.max(-1, Math.min(1, deltaAngle(input.heading, this.angle) * 4));
    this.angle = (this.angle + rotation * dt * 2.25) % tau;
    Object.assign(this.king, wallPosition(this.angle, wallSpec(this.state.wallTier).height));
    this.king.moving = Math.abs(rotation) > 0.05;
    const foes = this.enemies
      .filter(
        (e) =>
          e.hp > 0 &&
          e.action !== 'arrive' &&
          distance(e, this.king) < 17 &&
          Math.abs(deltaAngle(Math.atan2(e.x, e.z), this.angle)) < 1.05,
      )
      .sort((a, b) => distance(a, this.king) - distance(b, this.king));
    const target = foes[0];
    this.king.yaw = target
      ? Math.atan2(target.x - this.king.x, target.z - this.king.z)
      : this.angle;
    if (input.decree && this.power >= 100) {
      this.power = 0;
      this.effect(this.king, 'decree');
      this.announcement = 'ROYAL DECREE — the King breaks the assault.';
      for (const e of this.enemies)
        if (e.hp > 0 && distance(e, this.king) < 13) {
          this.damage(e, 58, this.king, this.king.id, true, true);
          e.marked = 12;
          if (
            e.role === 'dragon' &&
            e.action &&
            e.action !== 'arrive' &&
            e.action !== 'stagger' &&
            e.actionTime < 1.6
          ) {
            this.bossResolve -= 100;
            if (this.bossResolve <= 0) {
              e.action = 'stagger';
              e.actionTime = 0;
              this.dangers = this.dangers.filter((d) => d.kind === 'hex');
              this.bossInterrupts++;
              this.announcement = 'The breath is broken. Strike the exposed Dragon.';
            }
          }
        }
    }
    if (input.charge && !this.king.action) {
      this.charge = Math.min(1, this.charge + dt);
      this.king.actionTime = this.charge;
      return;
    }
    if (!input.charge && this.charge > 0) {
      if (this.charge > 0.35) {
        this.attack(this.king, this.state.weapon === 'stormbow' ? 'bow_release' : 'lance_release');
        this.king.fired = true;
        this.effect(this.king, 'charge');
        this.shoot(
          this.king,
          target || {
            x: this.king.x + Math.sin(this.angle) * 17,
            y: 0,
            z: this.king.z + Math.cos(this.angle) * 17,
          },
          (48 + this.state.ranks[this.state.weapon] * 13) * (0.5 + this.charge),
          true,
          true,
          false,
          true,
        );
      }
      this.charge = 0;
    }
    if (!this.king.action && target && this.king.cooldown === 0)
      this.attack(this.king, this.state.weapon === 'stormbow' ? 'bow_fire' : 'lance_fire');
    if (this.king.action) {
      this.king.actionTime += dt / (this.rune('quickdraw') ? 0.85 : 1);
      const contact = this.state.weapon === 'stormbow' ? 0.66 : 0.08;
      if (!this.king.fired && this.king.actionTime >= contact) {
        this.king.fired = true;
        if (target)
          this.shoot(this.king, target, 28 + this.state.ranks[this.state.weapon] * 11, true, true);
      }
      if (this.king.actionTime > 1) {
        this.king.action = '';
        this.king.cooldown = this.rune('quickdraw') ? 0.17 : 0.2;
      }
    }
  }
  tick(dt: number, input: Input = { rotate: 0, charge: false, decree: false }) {
    if (this.phase !== 'battle' || this.paused) return;
    dt = Math.min(0.05, Math.max(0, dt));
    this.time += dt;
    this.power = Math.min(100, this.power + dt * 4);
    for (const a of [this.king, ...this.knights, ...this.enemies]) {
      a.moving = false;
      a.cooldown = Math.max(0, a.cooldown - dt);
      a.ward = Math.max(0, a.ward - dt);
      a.relay = Math.max(0, a.relay - dt);
      a.marked = Math.max(0, a.marked - dt);
      a.ability = Math.max(0, a.ability - dt);
      a.cry = Math.max(0, a.cry - dt);
      a.healing = Math.max(0, a.healing - dt);
      a.stunned = Math.max(0, a.stunned - dt);
      a.taunted = Math.max(0, a.taunted - dt);
      a.barrierTime = Math.max(0, a.barrierTime - dt);
      if (a.hp <= 0) a.deadTime += dt;
    }
    const encounter = encounters[this.state.encounter];
    this.spawnTimer -= dt;
    if (
      this.spawned < encounter.budget &&
      this.spawnTimer <= 0 &&
      this.enemies.filter((e) => e.hp > 0).length < 11
    ) {
      this.spawn();
      this.spawnTimer = encounter.interval * (0.65 + this.random() * 0.65);
    }
    if (encounter.boss && !this.bossSpawned && this.time > 12) {
      this.bossSpawned = true;
      const a = this.random() * tau;
      const boss = this.actor(
        'dragon',
        'The Emberwing Dragon',
        { x: Math.sin(a) * 14, y: 6, z: Math.cos(a) * 14 },
        this.state.difficulty === 'veteran' ? 2100 : 1650,
      );
      boss.action = 'arrive';
      boss.yaw = a + Math.PI;
      this.enemies.push(boss);
      this.announcement = 'The Emberwing Dragon descends. Watch its wings.';
    }
    this.royal(dt, input);
    for (const k of this.knights) if (k.hp > 0) this.tickKnight(k, dt);
    for (const e of this.enemies) if (e.hp > 0) this.tickEnemy(e, dt);
    // Soft separation prevents a pile of knights without teleporting or expiring them.
    const ground = [...this.knights, ...this.enemies].filter(
      (a) => a.hp > 0 && a.deployed && a.role !== 'dragon',
    );
    for (let i = 0; i < ground.length; i++)
      for (let j = i + 1; j < ground.length; j++) {
        const a = ground[i],
          b = ground[j],
          d = distance(a, b);
        if (d < 0.8) {
          const yaw = d > 0.001 ? Math.atan2(a.x - b.x, a.z - b.z) : a.id % 7;
          const push = Math.min(dt * 0.7, (0.8 - d) / 2);
          a.x += Math.sin(yaw) * push;
          a.z += Math.cos(yaw) * push;
          b.x -= Math.sin(yaw) * push;
          b.z -= Math.cos(yaw) * push;
        }
      }
    const heavy = this.state.relic === 'worldpiercer';
    for (const b of this.defenses) {
      if (b.kind === 'spire' || b.kind === 'sanctuary') {
        this.supportBuilding(b, dt);
        continue;
      }
      const targets = this.enemies.filter(
        (e) =>
          e.hp > 0 &&
          e.action !== 'arrive' &&
          (!heavy ||
            Math.abs(deltaAngle(Math.atan2(e.x - b.x, e.z - b.z), b.yaw)) < (Math.PI * 75) / 360),
      );
      const emitted = stepDefenses(
        [b],
        targets,
        dt,
        this.id,
        heavy ? { damage: 2.2, pierce: 5, reload: 1.75, turning: 0.5, arc: 75 } : {},
      );
      for (const p of emitted)
        this.bolts.push({
          ...p,
          friendly: true,
          royal: false,
          relay: false,
          hits: [],
          pierce: heavy ? 5 : p.remaining,
          ignoreShield: heavy,
          damage: p.damage,
        });
    }
    for (const p of this.bolts) {
      const before = { x: p.x, y: p.y, z: p.z };
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.life -= dt;
      if (p.friendly) {
        for (const e of this.enemies) {
          if (e.hp <= 0 || e.action === 'arrive' || p.hits.includes(e.id)) continue;
          const center = { x: e.x, y: e.y + (e.role === 'dragon' ? 2 : 1), z: e.z };
          if (segmentHit(before, p, center, e.role === 'dragon' ? 2.3 : 0.65)) {
            this.damage(e, p.damage, before, p.owner, p.royal, p.ignoreShield, p.relay);
            p.hits.push(e.id);
            p.pierce--;
            if (p.pierce <= 0) {
              p.life = 0;
              break;
            }
          }
        }
      } else {
        const damage = interceptSegment(this.defenses, before, p, p.damage);
        this.stats.shielded += p.damage - damage;
        p.damage = damage;
        if (damage <= 0) p.life = 0;
        if (p.life > 0)
          for (const a of [this.king, ...this.knights])
            if (a.hp > 0 && segmentHit(before, p, { x: a.x, y: a.y + 1, z: a.z }, 0.65)) {
              this.damage(a, p.damage, before, p.owner);
              p.life = 0;
              break;
            }
        if (
          p.life > 0 &&
          Math.hypot(p.x, p.z) < 6.6 &&
          p.y < wallSpec(this.state.wallTier).height
        ) {
          const side = wallSide(p);
          this.state.walls[side] = Math.max(0, this.state.walls[side] - p.damage);
          this.stats.wallDamage += p.damage;
          p.life = 0;
          this.effect(p, 'hit');
        }
      }
    }
    this.bolts = this.bolts.filter((p) => p.life > 0 && p.y > -0.5);
    for (const t of this.dangers) {
      t.age += dt;
      if (t.age < t.windup || t.age > t.windup + t.duration) continue;
      for (const a of [this.king, ...this.knights])
        if (a.hp > 0 && !t.hits.includes(a.id) && inTelegraph(t, a)) {
          let damage = t.damage;
          if (t.kind === 'breath') {
            damage = interceptSegment(
              this.defenses,
              { x: t.x, y: 2.8, z: t.z },
              { x: a.x, y: a.y + 1.1, z: a.z },
              damage,
            );
            this.stats.shielded += t.damage - damage;
          }
          this.damage(a, damage, { x: t.x, y: a.y, z: t.z }, -1, false, t.kind !== 'breath');
          t.hits.push(a.id);
        }
      if (t.kind === 'rake' || t.kind === 'breath')
        for (let i = 0; i < 4; i++) {
          const p = wallPosition(
            i === 0 ? Math.PI : i === 1 ? Math.PI / 2 : i === 2 ? 0 : -Math.PI / 2,
            0,
          );
          if (!t.hits.includes(-10 - i) && inTelegraph(t, p)) {
            this.state.walls[i] = Math.max(0, this.state.walls[i] - t.damage);
            this.stats.wallDamage += t.damage;
            t.hits.push(-10 - i);
          }
        }
      for (const b of this.defenses)
        if (b.hp > 0 && !t.hits.includes(b.id) && inTelegraph(t, b)) {
          b.hp = Math.max(0, b.hp - t.damage);
          t.hits.push(b.id);
        }
    }
    this.dangers = this.dangers.filter((t) => t.age < t.windup + t.duration);
    this.effects.forEach((e) => (e.age += dt));
    this.effects = this.effects.filter((e) => e.age < 0.65);
    this.enemies = this.enemies.filter((e) => e.hp > 0 || e.deadTime < 4);
    if (this.king.hp <= 0 || this.state.walls.some((hp) => hp <= 0)) {
      this.phase = 'lost';
      this.announcement =
        this.king.hp <= 0 ? 'The King has fallen.' : 'A wall has fallen. The castle is overrun.';
      return;
    }
    if (
      this.spawned >= encounter.budget &&
      (!encounter.boss || this.bossSpawned) &&
      !this.enemies.some((e) => e.hp > 0) &&
      this.dangers.length === 0
    ) {
      this.phase = 'won';
      this.announcement = 'The watch is won. Your company returns to the castle.';
      if (!this.rewarded) {
        this.rewarded = true;
        this.state.kingHp = this.king.hp;
        for (const k of this.knights) this.state.knights.find((a) => a.id === k.roster)!.hp = k.hp;
        for (const b of this.defenses) this.state.buildings.find((a) => a.id === b.id)!.hp = b.hp;
        completeEncounter(this.state);
      }
    }
  }
}
