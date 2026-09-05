import type { Weapon } from '../presentation/Paladin';

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
export interface Hazard {
  id: number;
  x: number;
  y?: number;
  z: number;
  radius: number;
  age: number;
  hit: number[];
}
export interface TrainingInput {
  x: number;
  z: number;
  aim: Point;
  primary: boolean;
  alternate: boolean;
  dodge: boolean;
  slow: boolean;
  swap: boolean;
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
  if (s.paused) return;
  if (!i.slow && s.focus >= 25) s.slowLocked = false;
  const slow = i.slow && !s.slowLocked && s.focus > 0;
  s.focus = Math.max(0, Math.min(100, s.focus + (slow ? -32 : 17) * dt));
  if (s.focus === 0) s.slowLocked = true;
  dt *= slow ? 0.3 : 1;
  s.lastDelta = dt;
  s.time += dt;
  const p = s.player;
  if (i.swap && !p.action && !s.wasAlt) {
    p.weapon = p.weapon === 'stormbow' ? 'sunlance' : 'stormbow';
    s.charge = 0;
  }
  p.yaw = angleLerp(p.yaw, Math.atan2(i.aim.x - p.x, i.aim.z - p.z), dt * 18);
  const inputLength = Math.hypot(i.x, i.z),
    mx = inputLength ? i.x / inputLength : 0,
    mz = inputLength ? i.z / inputLength : 0;
  if (i.dodge && s.dodgeCharges > 0 && s.dodgeTime <= 0 && !s.wasAlt) {
    s.dodgeCharges--;
    s.dodgeTime = 0.27;
    s.dodgeX = inputLength ? mx : Math.sin(p.yaw);
    s.dodgeZ = inputLength ? mz : Math.cos(p.yaw);
  }
  if (s.dodgeCharges < 2) {
    s.dodgeRecovery += dt;
    if (s.dodgeRecovery >= 3) {
      s.dodgeCharges++;
      s.dodgeRecovery -= 3;
    }
  } else s.dodgeRecovery = 0;
  const isDodging = s.dodgeTime > 0;
  s.dodgeTime = Math.max(0, s.dodgeTime - dt);
  const speed = s.wasAlt ? 1.9 : 4;
  const before = { ...p };
  moveActor(
    p,
    (isDodging ? s.dodgeX * 9 : mx * speed) * dt,
    (isDodging ? s.dodgeZ * 9 : mz * speed) * dt,
  );
  p.moving = Math.hypot(p.x - before.x, p.z - before.z) > 0.001;
  if (!p.action) {
    if (i.alternate) {
      s.charge = Math.min(1, s.charge + dt / 0.8);
      s.wasAlt = true;
    } else if (s.wasAlt) {
      p.action = p.weapon === 'stormbow' ? 'bow_release' : 'lance_fire';
      p.actionTime = 0;
      p.fired = false;
      s.wasAlt = false;
    } else if (i.primary) {
      p.action = p.weapon === 'stormbow' ? 'bow_fire' : 'lance_fire';
      p.actionTime = 0;
      p.fired = false;
      s.charge = 0;
    }
  }
  if (p.action) {
    p.actionTime += dt;
    const duration = p.action === 'bow_fire' ? 1.15 : p.action === 'bow_release' ? 0.32 : 0.65;
    const release = p.action === 'bow_fire' ? 0.66 : p.action === 'bow_release' ? 0.06 : 0.08;
    if (!p.fired && p.actionTime >= duration * release) {
      shoot(s, p.weapon === 'stormbow' ? 28 + s.charge * 42 : 45 + s.charge * 35, i.aim);
      p.fired = true;
    }
    if (p.actionTime >= duration) {
      p.action = '';
      p.actionTime = 0;
      s.charge = 0;
    }
  }
  for (const [index, k] of s.company.entries()) {
    if (k.hp <= 0) {
      k.moving = false;
      continue;
    }
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
      s.hazards.push({ id: s.nextId++, x: p.x, y: p.y, z: p.z, radius: 2.15, age: 0, hit: [] });
      s.nextHazard = 4.4;
    }
  }
  for (const hazard of s.hazards) {
    const prior = hazard.age;
    hazard.age += dt;
    if (prior < 1.5 && hazard.age >= 1.5) {
      for (const [index, a] of [p, ...s.company].entries()) {
        const inside =
          Math.hypot(a.x - hazard.x, a.z - hazard.z) < hazard.radius + 0.3 &&
          Math.abs(a.y - (hazard.y || 0)) < 0.5;
        if (inside && !(index === 0 && isDodging)) {
          a.hp = Math.max(0, a.hp - 22);
          hazard.hit.push(index);
          if (!index) s.damage += 22;
        } else if (index === 0) s.dodged++;
      }
    }
  }
  s.hazards = s.hazards.filter((h) => h.age < 2.1);
}
