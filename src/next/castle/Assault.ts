import type { Position } from '../combat/Hazards';
import type { Actor } from './Battle';
import { isRanged } from './Catalog';

/** Battle-only intent: a wall assignment survives diversions and knockback. */
export interface AssaultPlan {
  side: number;
  slot: number;
  position: Position;
  wall: Position;
  think: number;
  pursuit?: Position;
  returning?: boolean;
  mode: 'advance' | 'engage' | 'siege' | 'recover';
  strike?: { point: Position; target?: number; wall?: number };
}

const delta = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const distance = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.z - b.z);

export function reserveAssault(e: Actor, enemies: readonly Actor[], side: number): AssaultPlan {
  const middle = Math.PI - (side * Math.PI) / 2;
  const ranged = isRanged(e.role) || e.role === 'banneret';
  const radius = ranged ? 13.3 : e.role === 'ram' ? 8.3 : 7.85;
  const incoming = Math.atan2(e.x, e.z);
  let slot = 0,
    best = Infinity;
  // Eleven distinct contact points fit the existing live-enemy cap. Casters use a rear row.
  for (let n = 0; n < 11; n++) {
    const angle = middle - 0.65 + n * 0.13;
    let score = Math.abs(delta(angle, incoming));
    for (const other of enemies)
      if (
        other !== e &&
        other.hp > 0 &&
        other.assault?.side === side &&
        Math.abs(other.assault.slot - n) <= (other.role === 'ram' || e.role === 'ram' ? 1 : 0) &&
        (isRanged(other.role) || other.role === 'banneret') === ranged
      )
        score += 10;
    if (score < best) {
      best = score;
      slot = n;
    }
  }
  const angle = middle - 0.65 + slot * 0.13;
  return {
    side,
    slot,
    position: { x: Math.sin(angle) * radius, y: 0, z: Math.cos(angle) * radius },
    wall: { x: Math.sin(angle) * 6.65, y: 0, z: Math.cos(angle) * 6.65 },
    think: 0,
    mode: 'advance',
  };
}

export function assaultTarget(
  e: Actor,
  knights: readonly Actor[],
  clearPath: (a: Position, b: Position) => boolean,
): Actor | undefined {
  const plan = e.assault!;
  if (e.role === 'ram' || e.role === 'sapper') return undefined;
  const ranged = isRanged(e.role);
  const acquire = ranged ? 8 : e.role === 'bulwark' ? 2.8 : e.role === 'reaver' ? 6 : 4;
  const retain = acquire + 2;
  const reachable = (k: Actor) => k.hp > 0 && k.deployed && clearPath(e, k);
  const forced =
    e.taunted > 0
      ? knights.find((k) => k.id === e.taunter && reachable(k) && distance(e, k) < 10)
      : undefined;
  if (forced) {
    if (e.targetId !== forced.id) plan.pursuit = { x: e.x, y: 0, z: e.z };
    return forced;
  }
  if (plan.returning) {
    if (distance(e, plan.position) > 0.3) return undefined;
    plan.returning = false;
  }
  const current = knights.find((k) => k.id === e.targetId);
  if (
    current &&
    reachable(current) &&
    distance(e, current) < retain &&
    (!plan.pursuit || distance(plan.pursuit, current) < 7)
  )
    return current;
  // A failed pursuit must return to the assault before reacquiring the same kiting knight.
  if (current && plan.pursuit && distance(plan.pursuit, current) >= 7) {
    plan.returning = true;
    return undefined;
  }
  let chosen: Actor | undefined,
    closest = acquire;
  for (const k of knights) {
    const d = distance(e, k) - (e.role === 'reaver' && isRanged(k.role) ? 1.5 : 0);
    if (d < closest && reachable(k)) {
      chosen = k;
      closest = d;
    }
  }
  if (chosen) plan.pursuit = { x: e.x, y: 0, z: e.z };
  return chosen;
}

export function faceAssault(e: Actor, point: Position, dt: number): boolean {
  const turn = delta(Math.atan2(point.x - e.x, point.z - e.z), e.yaw);
  e.yaw += Math.max(-dt * 5, Math.min(dt * 5, turn));
  return Math.abs(turn) < 0.18;
}

export function assaultContact(e: Actor, point: Position, range: number): boolean {
  return (
    distance(e, point) <= range + 0.35 &&
    Math.abs(delta(Math.atan2(point.x - e.x, point.z - e.z), e.yaw)) < 0.85
  );
}
