import { spec, sites, type DefenseKind, type Rank } from './Catalog';
import type { Blueprint, Workshop } from './Workshop';
import type { Danger, Position } from '../combat/Hazards';

export interface Defense extends Blueprint, Position {
  age: number;
  reload: number;
  reloadDuration?: number;
  recoil: number;
  aimYaw: number;
  charge: number;
  lastBlocked: number;
  shots: number;
  blocked: number;
  flash: number;
}
export interface SiegeBolt extends Position {
  id: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  damage: number;
  owner: number;
  remaining: number;
  hit: number[];
}
export const createDefenses = (plan: Workshop): Defense[] =>
  plan.buildings.map((b) => ({
    ...b,
    ...positionOf(b),
    age: 0,
    reload: 0.8,
    recoil: 0,
    aimYaw: b.yaw,
    charge: spec(b.kind, b.rank).capacity,
    lastBlocked: 0,
    shots: 0,
    blocked: 0,
    flash: 0,
  }));
export const positionOf = (b: Blueprint): Position => {
  const site = sites.find((s) => s.id === b.site)!;
  return { x: site.x, y: site.y, z: site.z };
};
export const footprint = (kind: DefenseKind, rank: Rank) =>
  kind === 'ballista' ? [1.3, 1.45, 1.85][rank - 1] : [0.9, 1.1, 1.3][rank - 1];
export const inCoverage = (
  b: Pick<Defense, 'x' | 'z' | 'yaw' | 'kind' | 'rank'>,
  target: Pick<Position, 'x' | 'z'>,
) => {
  const r = spec(b.kind, b.rank),
    dx = target.x - b.x,
    dz = target.z - b.z;
  return (
    Math.hypot(dx, dz) < 0.001 ||
    (Math.hypot(dx, dz) <= r.range &&
      Math.abs(
        Math.atan2(Math.sin(Math.atan2(dx, dz) - b.yaw), Math.cos(Math.atan2(dx, dz) - b.yaw)),
      ) <=
        (r.arc * Math.PI) / 360)
  );
};
export function stepDefenses(
  buildings: Defense[],
  targets: { id: number; x: number; z: number; y?: number; hp: number }[],
  dt: number,
  nextId: () => number,
  modifiers: {
    damage?: number;
    pierce?: number;
    reload?: number;
    turning?: number;
    arc?: number;
  } = {},
): SiegeBolt[] {
  const bolts: SiegeBolt[] = [];
  for (const b of buildings) {
    const rechargeTime = Math.max(0, dt - b.lastBlocked);
    b.age += dt;
    b.recoil = Math.max(0, b.recoil - dt);
    b.flash = Math.max(0, b.flash - dt);
    b.lastBlocked = Math.max(0, b.lastBlocked - dt);
    if (b.hp <= 0 || b.age < 1.2) continue;
    const r = spec(b.kind, b.rank);
    if (b.kind === 'aegis') {
      if (!b.lastBlocked) b.charge = Math.min(r.capacity, b.charge + r.recharge * rechargeTime);
      continue;
    }
    // Castle support buildings use their own ability system, never the ballista firing path.
    if (b.kind !== 'ballista') continue;
    const candidates = targets.filter(
      (target) =>
        target.hp > 0 &&
        inCoverage(b, target) &&
        (modifiers.arc === undefined ||
          Math.abs(
            Math.atan2(
              Math.sin(Math.atan2(target.x - b.x, target.z - b.z) - b.yaw),
              Math.cos(Math.atan2(target.x - b.x, target.z - b.z) - b.yaw),
            ),
          ) <=
            (modifiers.arc * Math.PI) / 360),
    );
    candidates.sort((a, c) => Math.hypot(a.x - b.x, a.z - b.z) - Math.hypot(c.x - b.x, c.z - b.z));
    const target = candidates[0];
    b.reload = Math.max(0, b.reload - dt);
    if (!target) continue;
    const yaw = Math.atan2(target.x - b.x, target.z - b.z);
    const difference = Math.atan2(Math.sin(yaw - b.aimYaw), Math.cos(yaw - b.aimYaw));
    const turn = dt * 2.2 * (modifiers.turning ?? 1);
    b.aimYaw += Math.max(-turn, Math.min(turn, difference));
    if (Math.abs(difference) > 0.06 || b.reload > 0) continue;
    const y = b.y + (b.rank === 1 ? 1.08 : b.rank === 2 ? 1.43 : 1.78);
    const x = b.x + Math.sin(b.aimYaw) * 1.2,
      z = b.z + Math.cos(b.aimYaw) * 1.2;
    const distance = Math.max(0.1, Math.hypot(target.x - x, target.z - z));
    bolts.push({
      id: nextId(),
      x,
      y,
      z,
      vx: Math.sin(b.aimYaw) * 19,
      vy: (((target.y ?? 0) + 1.4 - y) * 19) / distance,
      vz: Math.cos(b.aimYaw) * 19,
      damage: r.damage * (modifiers.damage ?? 1),
      life: r.range / 19,
      owner: b.id,
      remaining: modifiers.pierce ?? (b.rank === 3 ? 3 : 1),
      hit: [],
    });
    b.reload = b.reloadDuration = r.interval * (modifiers.reload ?? 1);
    b.recoil = 0.42;
    b.shots++;
  }
  return bolts;
}
// A mounted shield intercepts an entering segment at its actual vertical arc.
// The protected target can be behind the projector; only the crossing must be in its forward arc.
export function interceptSegment(
  buildings: Defense[],
  from: Position,
  to: Position,
  damage: number,
): number {
  let remaining = damage;
  for (const b of buildings) {
    if (b.kind !== 'aegis' || b.hp <= 0 || b.age < 1.2 || b.charge <= 0) continue;
    const r = spec(b.kind, b.rank),
      dx = to.x - from.x,
      dz = to.z - from.z,
      ox = from.x - b.x,
      oz = from.z - b.z;
    const a = dx * dx + dz * dz,
      k = 2 * (ox * dx + oz * dz),
      c = ox * ox + oz * oz - r.range * r.range;
    if (a < 1e-9 || c <= 0) continue;
    const discriminant = k * k - 4 * a * c;
    if (discriminant < 0) continue;
    const t = (-k - Math.sqrt(discriminant)) / (2 * a);
    if (t < 0 || t > 1) continue;
    const y = from.y + (to.y - from.y) * t,
      p = { x: from.x + dx * t, z: from.z + dz * t };
    const angle = Math.atan2(
      Math.sin(Math.atan2(p.x - b.x, p.z - b.z) - b.yaw),
      Math.cos(Math.atan2(p.x - b.x, p.z - b.z) - b.yaw),
    );
    if (y < b.y + 0.06 || y > b.y + 2 || Math.abs(angle) > (r.arc * Math.PI) / 360) continue;
    const blocked = Math.min(remaining, b.charge);
    b.charge -= blocked;
    remaining -= blocked;
    b.blocked += blocked;
    b.lastBlocked = 1.5;
    b.flash = 0.35;
    if (remaining <= 0) break;
  }
  return remaining;
}
export function interceptRay(
  buildings: Defense[],
  target: Position,
  hazard: Pick<Danger, 'x' | 'y' | 'z' | 'shape'>,
  damage: number,
): number {
  if (hazard.shape.kind !== 'sweep' || damage <= 0) return damage;
  let remaining = damage;
  for (const b of buildings) {
    if (
      b.kind !== 'aegis' ||
      b.hp <= 0 ||
      b.age < 1.2 ||
      b.charge <= 0 ||
      Math.abs(target.y - b.y) > 0.5 ||
      !inCoverage(b, target)
    )
      continue;
    const r = spec(b.kind, b.rank),
      dx = hazard.x - target.x,
      dz = hazard.z - target.z;
    if (Math.hypot(hazard.x - b.x, hazard.z - b.z) <= r.range) continue;
    const ox = target.x - b.x,
      oz = target.z - b.z;
    const a = dx * dx + dz * dz,
      k = 2 * (ox * dx + oz * dz),
      c = ox * ox + oz * oz - r.range * r.range;
    const discriminant = k * k - 4 * a * c;
    if (a < 0.001 || discriminant < 0) continue;
    const t = (-k + Math.sqrt(discriminant)) / (2 * a);
    if (
      t < 0 ||
      t > 1 ||
      !inCoverage(b, { x: target.x + dx * t * 0.9999, z: target.z + dz * t * 0.9999 })
    )
      continue;
    const blocked = Math.min(remaining, b.charge);
    b.charge -= blocked;
    remaining -= blocked;
    b.blocked += blocked;
    b.lastBlocked = 1.5;
    b.flash = 0.35;
    if (!remaining) break;
  }
  return remaining;
}
