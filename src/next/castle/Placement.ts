import { mounts } from './Catalog';
import type { SiteId } from '../construction/Catalog';

export function platformAt(x: number, z: number, inner?: boolean): SiteId | null {
  const nearest = mounts
    .filter((m) => inner === undefined || !!m.inner === inner)
    .map((m) => ({ m, distance: Math.hypot(m.x - x, m.z - z) }))
    .sort((a, b) => a.distance - b.distance)[0];
  return nearest && nearest.distance <= (nearest.m.inner ? 1.5 : 2.05) ? nearest.m.id : null;
}
