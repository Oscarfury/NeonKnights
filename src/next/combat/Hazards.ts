export interface Position {
  x: number;
  y: number;
  z: number;
}
export type HazardShape =
  | { kind: 'circle'; radius: number }
  | { kind: 'sweep'; radius: number; yaw: number; arc: number; halfAngle: number };
export interface Danger extends Position {
  id: number;
  label: string;
  shape: HazardShape;
  age: number;
  warning: number;
  active: number;
  recovery: number;
  damage: number;
  cadence: number;
  targets: ('commander' | 'company' | 'structure')[];
  contacts: Record<string, number>;
}
export interface DangerTarget extends Position {
  id: string;
  team: 'commander' | 'company' | 'structure';
  previous: Position;
  radius?: number;
  immune: boolean;
  alive: boolean;
}
export const dangerPhase = (h: Danger) =>
  h.age < h.warning ? 'warning' : h.age < h.warning + h.active ? 'active' : 'recovery';

// Presentation and collision consume this same footprint. World +Z is yaw zero.
export function dangerOutline(h: Danger, age = h.age, preview = false): Position[] {
  const shape = h.shape;
  const circle = shape.kind === 'circle';
  const progress = Math.max(0, Math.min(1, (age - h.warning) / h.active));
  const yaw = circle ? 0 : shape.yaw + (preview ? 0 : (progress - 0.5) * shape.arc);
  const half = circle ? Math.PI : shape.halfAngle + (preview ? Math.abs(shape.arc) / 2 : 0);
  const count = Math.max(12, Math.ceil(half * 36));
  const points: Position[] = circle ? [] : [{ x: h.x, y: h.y, z: h.z }];
  for (let n = 0; n <= count; n++) {
    const angle = yaw - half + (2 * half * n) / count;
    points.push({
      x: h.x + Math.sin(angle) * shape.radius,
      y: h.y,
      z: h.z + Math.cos(angle) * shape.radius,
    });
  }
  return points;
}
function distanceToSegment(p: Position, a: Position, b: Position) {
  const dx = b.x - a.x,
    dz = b.z - a.z;
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)),
  );
  return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t);
}
export function insideDanger(h: Danger, p: Position, age = h.age, radius = 0.28) {
  if (Math.abs(p.y - h.y) >= 0.5) return false;
  if (h.shape.kind === 'circle') return Math.hypot(p.x - h.x, p.z - h.z) <= h.shape.radius + radius;
  const outline = dangerOutline(h, age);
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const a = outline[i],
      b = outline[j];
    if (distanceToSegment(p, a, b) <= radius) return true;
    if (a.z > p.z !== b.z > p.z && p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x)
      inside = !inside;
  }
  return inside;
}
function contactDuring(
  h: Danger,
  target: DangerTarget,
  priorAge: number,
  nextAge: number,
  start: number,
  end: number,
) {
  const travel = Math.hypot(target.x - target.previous.x, target.z - target.previous.z);
  const rotation =
    h.shape.kind === 'sweep' ? (Math.abs(h.shape.arc) * (end - start)) / h.active : 0;
  // Bound travel and angular intervals so neither a fast target nor a sweeping
  // edge can cross an entire collision radius between samples.
  const count = Math.max(
    1,
    Math.ceil(travel / 0.08),
    Math.ceil((rotation * h.shape.radius) / 0.08),
  );
  for (let n = 0; n <= count; n++) {
    const age = start + ((end - start) * n) / count;
    const t = Math.max(0, Math.min(1, (age - priorAge) / (nextAge - priorAge || 1)));
    const p = {
      x: target.previous.x + (target.x - target.previous.x) * t,
      y: target.previous.y + (target.y - target.previous.y) * t,
      z: target.previous.z + (target.z - target.previous.z) * t,
    };
    if (insideDanger(h, p, age, target.radius)) return true;
  }
  return false;
}
export function resolveDanger(h: Danger, targets: DangerTarget[], dt: number) {
  const prior = h.age;
  h.age += dt;
  const start = Math.max(prior, h.warning),
    end = Math.min(h.age, h.warning + h.active);
  const results: { target: string; damage: number; avoided: boolean }[] = [];
  if (end < start || prior >= h.warning + h.active || h.age < h.warning) return results;
  const cadence = h.cadence || h.active;
  const first = Math.floor(Math.max(0, start - h.warning) / cadence + 1e-8);
  const last = Math.min(
    Math.ceil(h.active / cadence) - 1,
    Math.floor(Math.max(0, end - h.warning - 1e-8) / cadence),
  );
  for (let bucket = first; bucket <= Math.max(first, last); bucket++) {
    const a = Math.max(start, h.warning + bucket * cadence);
    const b = Math.min(end, h.warning + (bucket + 1) * cadence);
    if (a > b || bucket * cadence >= h.active) continue;
    for (const target of targets) {
      if (!target.alive || !h.targets.includes(target.team) || h.contacts[target.id] >= bucket)
        continue;
      if (!contactDuring(h, target, prior, h.age, a, b)) continue;
      h.contacts[target.id] = bucket;
      results.push({
        target: target.id,
        damage: target.immune ? 0 : h.damage,
        avoided: target.immune,
      });
    }
  }
  return results;
}
export function makeDanger(
  id: number,
  kind: 'impact' | 'sweep' | 'fire',
  point: Position,
  yaw = 0,
): Danger {
  return {
    x: point.x,
    y: point.y,
    z: point.z,
    id,
    age: 0,
    contacts: {},
    targets: ['commander', 'company', 'structure'],
    label:
      kind === 'impact' ? 'Ward impact' : kind === 'sweep' ? 'Sweeping ray' : 'Scorched ground',
    shape:
      kind === 'sweep'
        ? { kind: 'sweep', radius: 6.6, yaw, arc: 2.3, halfAngle: 0.19 }
        : { kind: 'circle', radius: kind === 'fire' ? 2.65 : 2.15 },
    warning: kind === 'sweep' ? 1.8 : 1.5,
    active: kind === 'sweep' ? 2 : kind === 'fire' ? 3 : 0.08,
    recovery: 0.55,
    damage: kind === 'fire' ? 6 : kind === 'sweep' ? 18 : 22,
    cadence: kind === 'fire' ? 0.5 : 0,
  };
}
