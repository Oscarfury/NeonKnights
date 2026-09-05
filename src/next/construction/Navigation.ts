import { footprint, type Defense } from './DefenseSystem';
import type { Position } from '../combat/Hazards';

export function clearOfDefenses(a: Position, b: Position, defenses: Defense[]) {
  const dx = b.x - a.x,
    dz = b.z - a.z,
    length = dx * dx + dz * dz;
  return defenses.every((d) => {
    if (Math.abs(d.y - a.y) > 0.5) return true;
    const t = Math.max(0, Math.min(1, ((d.x - a.x) * dx + (d.z - a.z) * dz) / (length || 1)));
    return Math.hypot(a.x + dx * t - d.x, a.z + dz * t - d.z) > footprint(d.kind, d.rank) + 0.31;
  });
}

// A small visibility graph is only needed when a machine obstructs the direct
// route. Wrecks keep their footprint until salvaged. Stable nodes avoid side flips.
export function routeAround(
  a: Position,
  goal: Position,
  defenses: Defense[],
  valid: (p: Position) => boolean,
  anchors: Position[] = [],
): Position {
  for (const d of defenses) {
    const dx = a.x - d.x,
      dz = a.z - d.z,
      length = Math.hypot(dx, dz);
    if (Math.abs(a.y - d.y) < 0.5 && length < footprint(d.kind, d.rank) + 0.37) {
      const yaw = length ? Math.atan2(dx, dz) : Math.atan2(goal.x - d.x, goal.z - d.z);
      const radius = footprint(d.kind, d.rank) + 0.65;
      const escape = { x: d.x + Math.sin(yaw) * radius, y: a.y, z: d.z + Math.cos(yaw) * radius };
      if (valid(escape)) return escape;
    }
  }
  const traversable = (from: Position, to: Position) => {
    if (!clearOfDefenses(from, to, defenses)) return false;
    const steps = Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / 0.25);
    for (let n = 1; n <= steps; n++)
      if (
        !valid({
          x: from.x + ((to.x - from.x) * n) / steps,
          y: from.y,
          z: from.z + ((to.z - from.z) * n) / steps,
        })
      )
        return false;
    return true;
  };
  const target = { ...goal };
  for (const d of defenses) {
    const radius = footprint(d.kind, d.rank) + 0.5,
      dx = target.x - d.x,
      dz = target.z - d.z,
      length = Math.hypot(dx, dz);
    if (Math.abs(target.y - d.y) < 0.5 && length < radius) {
      const yaw = length ? Math.atan2(dx, dz) : Math.atan2(a.x - d.x, a.z - d.z);
      target.x = d.x + Math.sin(yaw) * radius;
      target.z = d.z + Math.cos(yaw) * radius;
    }
  }
  if (traversable(a, target)) return target;
  const nodes = [a, target, ...anchors.filter(valid)];
  for (const d of defenses) {
    if (Math.abs(d.y - a.y) > 0.5) continue;
    const radius = (footprint(d.kind, d.rank) + 0.36) / Math.cos(Math.PI / 8) + 0.06;
    for (let n = 0; n < 8; n++) {
      const p = {
        x: d.x + Math.sin((n * Math.PI) / 4) * radius,
        y: d.y,
        z: d.z + Math.cos((n * Math.PI) / 4) * radius,
      };
      if (valid(p)) nodes.push(p);
    }
  }
  const distance = nodes.map(() => Infinity),
    previous = nodes.map(() => -1),
    visited = new Set<number>();
  distance[0] = 0;
  for (let n = 0; n < nodes.length; n++) {
    let current = -1;
    for (let j = 0; j < nodes.length; j++)
      if (!visited.has(j) && (current < 0 || distance[j] < distance[current])) current = j;
    if (current < 0 || !Number.isFinite(distance[current])) break;
    if (current === 1) {
      let next = 1;
      while (previous[next] > 0) next = previous[next];
      return nodes[next];
    }
    visited.add(current);
    for (let j = 1; j < nodes.length; j++) {
      if (visited.has(j) || !traversable(nodes[current], nodes[j])) continue;
      const cost =
        distance[current] +
        Math.hypot(nodes[current].x - nodes[j].x, nodes[current].z - nodes[j].z);
      if (cost < distance[j]) {
        distance[j] = cost;
        previous[j] = current;
      }
    }
  }
  return a;
}
