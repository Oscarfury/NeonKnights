import type { Weapon } from '../presentation/Paladin';
import { actionTiming } from '../combat/Actions';
import { makeDanger, resolveDanger, type Danger } from '../combat/Hazards';

export interface Point {
  x: number;
  y: number;
  z: number;
}
export interface Actor extends Point {
  yaw: number;
  hp: number;
  weapon: Weapon;
  moving: boolean;
  action: string;
  actionTime: number;
  fired: boolean;
  protectedTime: number;
  hurtTime: number;
}
export interface Bolt extends Point {
  id: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  damage: number;
  weapon: Weapon;
}
export type Hazard = Danger;
export interface TrainingInput {
  x: number;
  z: number;
  aim: Point;
  primary: boolean;
  alternate: boolean;
  dodge: boolean;
  slow: boolean;
  swap: boolean;
  rescue: boolean;
}
export interface TrainingState {
  time: number;
  player: Actor;
  company: Actor[];
  order: 'follow' | 'hold';
  destination: Point;
  bolts: Bolt[];
  hazards: Hazard[];
  targets: { id: number; x: number; z: number; hp: number; flash: number }[];
  dodgeCharges: number;
  dodgeRecovery: number;
  dodgeTime: number;
  dodgeX: number;
  dodgeZ: number;
  focus: number;
  slowLocked: boolean;
  lastDelta: number;
  charge: number;
  wasAlt: boolean;
  trial: boolean;
  nextHazard: number;
  nextId: number;
  hits: number;
  shots: number;
  dodged: number;
  damage: number;
  paused: boolean;
  swapQueued: Weapon | null;
  dodgeDirection: string;
  trialPattern: number;
  rescues: number;
  rescueCharges: number;
  rescueProgress: number;
  rescueTarget: number;
  rescueBy: number;
  failed: boolean;
  bufferedPrimary: number;
}
export const neutralInput = (): TrainingInput => ({
  x: 0,
  z: 0,
  aim: { x: 0, y: 0, z: -7 },
  primary: false,
  alternate: false,
  dodge: false,
  slow: false,
  swap: false,
  rescue: false,
});
const actor = (x: number, z: number): Actor => ({
  x,
  z,
  y: 0,
  yaw: Math.PI,
  hp: 100,
  weapon: 'stormbow',
  moving: false,
  action: '',
  actionTime: 0,
  fired: false,
  protectedTime: 0,
  hurtTime: 0,
});
export function createTraining(): TrainingState {
  return {
    time: 0,
    player: actor(0, 5),
    company: [actor(-1.5, 6.5), actor(1.5, 6.5)],
    order: 'follow',
    destination: { x: 0, y: 0, z: 5 },
    bolts: [],
    hazards: [],
    targets: [-3, 0, 3].map((x, id) => ({ id, x, z: -7, hp: 100, flash: 0 })),
    dodgeCharges: 2,
    dodgeRecovery: 0,
    dodgeTime: 0,
    dodgeX: 0,
    dodgeZ: 0,
    focus: 100,
    slowLocked: false,
    lastDelta: 1 / 60,
    charge: 0,
    wasAlt: false,
    trial: false,
    nextHazard: 2,
    nextId: 1,
    hits: 0,
    shots: 0,
    dodged: 0,
    damage: 0,
    paused: false,
    swapQueued: null,
    dodgeDirection: 'dodge_forward',
    trialPattern: 0,
    rescues: 0,
    rescueCharges: 2,
    rescueProgress: 0,
    rescueTarget: -1,
    rescueBy: -1,
    failed: false,
    bufferedPrimary: 0,
  };
}
export function groundHeight(x: number, z: number) {
  if (x >= 6 && x <= 10 && Math.abs(z) <= 3) return 1.8;
  if (x >= 2 && x < 6 && Math.abs(z) <= 1.3) return ((x - 2) / 4) * 1.8;
  return 0;
}
export function moveActor(a: Point, dx: number, dz: number) {
  // Resolve the axes separately for smooth sliding. A slope or same-level
  // connection is required; stepping through a balcony wall is impossible.
  const attempt = (x: number, z: number) => {
    if (x < -10.2 || x > 10.1 || z < -9 || z > 8.3) return;
    const y = groundHeight(x, z);
    if (Math.abs(y - a.y) > 0.13) return;
    a.x = x;
    a.z = z;
    a.y = y;
  };
  attempt(a.x + dx, a.z);
  attempt(a.x, a.z + dz);
}
export function segmentSphere(start: Point, end: Point, center: Point, radius: number) {
  const dx = end.x - start.x,
    dy = end.y - start.y,
    dz = end.z - start.z;
  const length = dx * dx + dy * dy + dz * dz;
  const t = length
    ? Math.max(
        0,
        Math.min(
          1,
          ((center.x - start.x) * dx + (center.y - start.y) * dy + (center.z - start.z) * dz) /
            length,
        ),
      )
    : 0;
  return (
    Math.hypot(
      start.x + dx * t - center.x,
      start.y + dy * t - center.y,
      start.z + dz * t - center.z,
    ) <= radius
  );
}
const angleLerp = (a: number, b: number, t: number) =>
  a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * Math.min(1, t);
export function issueOrder(s: TrainingState, point: Point) {
  s.order = 'hold';
  s.destination = {
    x: Math.max(-8.8, Math.min(8.8, point.x)),
    z: Math.max(-8, Math.min(7.4, point.z)),
    y: 0,
  };
  s.destination.y = groundHeight(s.destination.x, s.destination.z);
}
function nextWaypoint(a: Point, target: Point): Point {
  const targetHeight = groundHeight(target.x, target.z);
  if (targetHeight > 0 && a.y === 0) {
    if (Math.hypot(a.x - 1.7, a.z) > 0.28) return { x: 1.7, y: 0, z: 0 };
    return { x: 6.4, y: 1.8, z: 0 };
  }
  if (targetHeight >= 1.8 && a.x < 6.2) return { x: 6.4, y: 1.8, z: 0 };
  if (targetHeight === 0 && a.y > 0) {
    if (a.x > 6.45 || Math.abs(a.z) > 0.25) return { x: 6.2, y: 1.8, z: 0 };
    return { x: 1.5, y: 0, z: 0 };
  }
  return target;
}
function shoot(s: TrainingState, damage: number, aim: Point) {
  const p = s.player,
    sin = Math.sin(p.yaw),
    cos = Math.cos(p.yaw);
  const localX = p.weapon === 'stormbow' ? 0.13 : -0.13,
    forward = p.weapon === 'stormbow' ? 0.75 : 1.25;
  const x = p.x + localX * cos + forward * sin,
    z = p.z - localX * sin + forward * cos,
    y = p.y + (p.weapon === 'stormbow' ? 1.61 : 1.31);
  const horizontal = Math.max(0.1, Math.hypot(aim.x - x, aim.z - z)),
    vertical = aim.y + 1.4 - y;
  const distance = Math.hypot(horizontal, vertical),
    speed = (22 * horizontal) / distance;
  s.bolts.push({
    id: s.nextId++,
    x,
    y,
    z,
    vx: sin * speed,
    vy: (22 * vertical) / distance,
    vz: cos * speed,
    life: 1.5,
    damage,
    weapon: p.weapon,
  });
  s.shots++;
}
export function stepTraining(s: TrainingState, i: TrainingInput, dt = 1 / 60) {
  if (s.paused || s.failed) return;
  if (!i.slow && s.focus >= 25) s.slowLocked = false;
  const slow = i.slow && !s.slowLocked && s.focus > 0;
  s.focus = Math.max(0, Math.min(100, s.focus + (slow ? -32 : 17) * dt));
  if (s.focus === 0) s.slowLocked = true;
  dt *= slow ? 0.3 : 1;
  s.lastDelta = dt;
  s.time += dt;
  const p = s.player;
  const all = [p, ...s.company];
  const previous = all.map((a) => ({ ...a }));
  for (const a of all) {
    a.protectedTime = Math.max(0, a.protectedTime - dt);
    a.hurtTime = Math.max(0, a.hurtTime - dt);
  }
  const alive = p.hp > 0;
  if (
    alive &&
    i.swap &&
    !s.swapQueued &&
    (!p.action ||
      (!p.fired && ['bow_fire', 'lance_fire', 'lance_release', 'bow_cancel'].includes(p.action)))
  ) {
    s.swapQueued = p.weapon === 'stormbow' ? 'sunlance' : 'stormbow';
    p.action = 'weapon_stow';
    p.actionTime = 0;
    p.fired = false;
    s.charge = 0;
    s.wasAlt = false;
  }
  if (alive && !i.rescue)
    p.yaw = angleLerp(p.yaw, Math.atan2(i.aim.x - p.x, i.aim.z - p.z), dt * 18);
  const inputLength = Math.hypot(i.x, i.z),
    mx = inputLength ? i.x / inputLength : 0,
    mz = inputLength ? i.z / inputLength : 0;
  if (
    alive &&
    i.dodge &&
    s.dodgeCharges > 0 &&
    s.dodgeTime <= 0 &&
    !s.swapQueued &&
    p.action !== 'recover'
  ) {
    s.dodgeCharges--;
    s.dodgeTime = 0.27;
    s.dodgeX = inputLength ? mx : Math.sin(p.yaw);
    s.dodgeZ = inputLength ? mz : Math.cos(p.yaw);
    const lateral = s.dodgeX * Math.cos(p.yaw) - s.dodgeZ * Math.sin(p.yaw);
    const forward = s.dodgeX * Math.sin(p.yaw) + s.dodgeZ * Math.cos(p.yaw);
    s.dodgeDirection =
      Math.abs(lateral) > 0.6
        ? lateral > 0
          ? 'dodge_right'
          : 'dodge_left'
        : forward >= 0
          ? 'dodge_forward'
          : 'dodge_backward';
    if (!p.fired) {
      p.action =
        p.weapon === 'stormbow' && (s.wasAlt || p.action === 'bow_fire') ? 'bow_cancel' : '';
      p.actionTime = 0;
    }
    s.wasAlt = false;
    s.charge = 0;
  }
  if (s.dodgeCharges < 2) {
    s.dodgeRecovery += dt;
    if (s.dodgeRecovery >= 3) {
      s.dodgeCharges++;
      s.dodgeRecovery -= 3;
    }
  } else s.dodgeRecovery = 0;
  const isDodging = s.dodgeTime > 0;
  s.bufferedPrimary =
    alive && !i.rescue ? (isDodging && i.primary ? 0.3 : Math.max(0, s.bufferedPrimary - dt)) : 0;
  s.dodgeTime = Math.max(0, s.dodgeTime - dt);
  const speed =
    !alive || i.rescue || p.action === 'recover' || p.action === 'lance_release'
      ? 0
      : s.wasAlt
        ? 1.9
        : 4;
  const before = { ...p };
  moveActor(
    p,
    (alive && isDodging ? s.dodgeX * 9 : mx * speed) * dt,
    (alive && isDodging ? s.dodgeZ * 9 : mz * speed) * dt,
  );
  p.moving = Math.hypot(p.x - before.x, p.z - before.z) > 0.001;
  if (alive && !p.action && !isDodging && !i.rescue) {
    if (i.alternate) {
      s.charge = Math.min(1, s.charge + dt / 0.8);
      s.wasAlt = true;
    } else if (s.wasAlt) {
      p.action = p.weapon === 'stormbow' ? 'bow_release' : 'lance_release';
      p.actionTime = 0;
      p.fired = false;
      s.wasAlt = false;
    } else if (i.primary || s.bufferedPrimary > 0) {
      p.action = p.weapon === 'stormbow' ? 'bow_fire' : 'lance_fire';
      p.actionTime = 0;
      p.fired = false;
      s.charge = 0;
      s.bufferedPrimary = 0;
    }
  }
  if (alive && p.action) {
    p.actionTime += dt;
    const { duration, release } = actionTiming[p.action] || { duration: 0.4 };
    if (release !== undefined && !p.fired && p.actionTime >= duration * release) {
      shoot(s, p.weapon === 'stormbow' ? 28 + s.charge * 42 : 45 + s.charge * 35, i.aim);
      p.fired = true;
    }
    if (p.actionTime >= duration) {
      if (p.action === 'weapon_stow' && s.swapQueued) {
        p.weapon = s.swapQueued;
        s.swapQueued = null;
        p.action = 'weapon_equip';
      } else p.action = '';
      p.actionTime = 0;
      s.charge = 0;
    }
  }
  for (const [index, k] of s.company.entries()) {
    if (k.hp <= 0) {
      k.moving = false;
      continue;
    }
    if (k.action === 'recover') {
      k.actionTime += dt;
      k.moving = false;
      if (k.actionTime >= actionTiming.recover.duration) {
        k.action = '';
        k.actionTime = 0;
      }
      continue;
    }
    if (!alive && index === s.company.findIndex((a) => a.hp > 0 && a.action !== 'recover'))
      continue;
    const goal =
      s.order === 'follow'
        ? { x: p.x + (index ? 1.6 : -1.6), z: p.z + 1.7, y: p.y }
        : { x: s.destination.x + (index ? 0.8 : -0.8), z: s.destination.z, y: s.destination.y };
    if (goal.y === 1.8) {
      goal.x = Math.max(6.5, Math.min(9.5, goal.x));
      goal.z = Math.max(-2.4, Math.min(2.4, goal.z));
    }
    const target = nextWaypoint(k, goal);
    const dx = target.x - k.x,
      dz = target.z - k.z,
      d = Math.hypot(dx, dz);
    k.moving = d > 0.18;
    if (k.moving) {
      const step = Math.min(d, dt * 3.5);
      moveActor(k, (dx / d) * step, (dz / d) * step);
      k.yaw = angleLerp(k.yaw, Math.atan2(dx, dz), dt * 9);
    } else k.yaw = angleLerp(k.yaw, p.yaw, dt * 5);
    // Stable slots and short-range separation prevent a shared destination pile.
    for (const other of [p, ...s.company]) {
      if (other === k) continue;
      const x = k.x - other.x,
        z = k.z - other.z,
        l = Math.hypot(x, z);
      if (l > 0 && l < 0.64) moveActor(k, (x / l) * dt * 0.9, (z / l) * dt * 0.9);
    }
  }
  // A nearby knight can pull the commander up. The commander can hold F to
  // assist a downed companion. Each rescue consumes one shared field dressing.
  let rescueBy = -1,
    rescueTarget = -1;
  if (s.rescueCharges > 0) {
    if (!alive) {
      rescueBy = all.findIndex((a, index) => index > 0 && a.hp > 0 && a.action !== 'recover');
      if (rescueBy > 0) {
        const rescuer = all[rescueBy];
        const waypoint = nextWaypoint(rescuer, p);
        const d = Math.hypot(waypoint.x - rescuer.x, waypoint.z - rescuer.z);
        if (d > 1.15 || Math.abs(rescuer.y - p.y) > 0.3) {
          moveActor(
            rescuer,
            ((waypoint.x - rescuer.x) / Math.max(0.01, d)) * dt * 3.5,
            ((waypoint.z - rescuer.z) / Math.max(0.01, d)) * dt * 3.5,
          );
          rescuer.yaw = angleLerp(
            rescuer.yaw,
            Math.atan2(waypoint.x - rescuer.x, waypoint.z - rescuer.z),
            dt * 10,
          );
          rescuer.moving = true;
        }
        if (Math.hypot(rescuer.x - p.x, rescuer.z - p.z) <= 1.5 && Math.abs(rescuer.y - p.y) < 0.3)
          rescueTarget = 0;
      }
    } else if (i.rescue && !p.action && !isDodging) {
      rescueTarget = all.findIndex(
        (a, index) =>
          index > 0 &&
          a.hp <= 0 &&
          Math.hypot(a.x - p.x, a.z - p.z) <= 1.6 &&
          Math.abs(a.y - p.y) < 0.3,
      );
      rescueBy = 0;
    }
  }
  if (rescueTarget < 0 || rescueBy < 0 || all[rescueBy].hurtTime > 0) {
    s.rescueProgress = 0;
    s.rescueBy = s.rescueTarget = -1;
  } else {
    if (s.rescueTarget !== rescueTarget || s.rescueBy !== rescueBy) s.rescueProgress = 0;
    s.rescueTarget = rescueTarget;
    s.rescueBy = rescueBy;
    all[rescueBy].moving = false;
    all[rescueBy].yaw = angleLerp(
      all[rescueBy].yaw,
      Math.atan2(all[rescueTarget].x - all[rescueBy].x, all[rescueTarget].z - all[rescueBy].z),
      dt * 14,
    );
    s.rescueProgress += dt;
    if (s.rescueProgress >= 1.8) {
      const recovered = all[rescueTarget];
      recovered.hp = 35;
      recovered.protectedTime = 2.5;
      recovered.action = 'recover';
      recovered.actionTime = 0;
      s.rescueCharges--;
      s.rescues++;
      s.rescueProgress = 0;
      s.rescueTarget = s.rescueBy = -1;
    }
  }
  for (const target of s.targets) {
    target.flash = Math.max(0, target.flash - dt);
    if (target.hp <= 0 && target.flash <= 0) target.hp = 100;
  }
  for (const bolt of s.bolts) {
    const old = { ...bolt };
    bolt.x += bolt.vx * dt;
    bolt.y += bolt.vy * dt;
    bolt.z += bolt.vz * dt;
    bolt.life -= dt;
    for (const target of s.targets) {
      if (target.hp <= 0) continue;
      if (segmentSphere(old, bolt, { x: target.x, y: 1.4, z: target.z }, 0.6)) {
        target.hp = Math.max(0, target.hp - bolt.damage);
        target.flash = 0.3;
        bolt.life = 0;
        s.hits++;
        break;
      }
    }
  }
  s.bolts = s.bolts.filter((b) => b.life > 0);
  if (s.trial) {
    s.nextHazard -= dt;
    if (s.nextHazard <= 0) {
      const kind = (['impact', 'sweep', 'fire'] as const)[s.trialPattern++ % 3];
      const origin = kind === 'sweep' ? { x: p.x, y: p.y, z: Math.max(-8, p.z - 4) } : p;
      s.hazards.push(
        makeDanger(s.nextId++, kind, origin, Math.atan2(p.x - origin.x, p.z - origin.z)),
      );
      s.nextHazard = 4.4;
    }
  }
  for (const hazard of s.hazards) {
    for (const hit of resolveDanger(
      hazard,
      all.map((a, index) => ({
        ...a,
        id: String(index),
        team: index ? 'company' : 'commander',
        previous: previous[index],
        immune: a.protectedTime > 0 || (index === 0 && isDodging),
        alive: a.hp > 0,
      })),
      dt,
    )) {
      const index = Number(hit.target),
        a = all[index];
      const damage = Math.min(a.hp, hit.damage);
      a.hp -= damage;
      if (damage) {
        a.hurtTime = 0.4;
        if (index === s.rescueBy) s.rescueProgress = 0;
        if (!index) s.damage += damage;
      }
      if (!index && hit.avoided) s.dodged++;
      if (a.hp <= 0) {
        a.moving = false;
        a.action = '';
        a.actionTime = 0;
        if (!index) {
          s.wasAlt = false;
          s.charge = 0;
          s.swapQueued = null;
          s.dodgeTime = 0;
        }
      }
    }
  }
  s.hazards = s.hazards.filter((h) => h.age < h.warning + h.active + h.recovery);
  if (p.hp <= 0 && (s.rescueCharges === 0 || s.company.every((a) => a.hp <= 0))) {
    s.failed = true;
    s.trial = false;
  }
}
