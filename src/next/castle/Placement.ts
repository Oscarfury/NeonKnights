import { mounts } from './Catalog';
import type { SiteId } from '../construction/Catalog';

export function platformAt(x: number, z: number): SiteId | null {
  const nearest = mounts
    .map((m) => ({ m, distance: Math.hypot(m.x - x, m.z - z) }))
    .sort((a, b) => a.distance - b.distance)[0];
  return nearest.distance <= 2.05 ? nearest.m.id : null;
}
