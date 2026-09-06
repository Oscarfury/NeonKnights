import { Group } from 'three';
import type { Campaign } from './Campaign';
import { mounts, isSupport } from './Catalog';
import type { Assets } from '../presentation/Assets';
import type { Rank } from '../construction/Catalog';
import { Masonry, disposeMasonry } from './Masonry';
import { wingHeight } from './TowerWing';

/** Only purchased wings form the keep. The shared stair tower grows with their number and ranks. */
export class CastleAssembly {
  readonly root = new Group();
  readonly hub: Group;
  readonly summary: { tier: Rank; wings: number; connections: number; height: number };
  constructor(s: Campaign, assets: Assets) {
    this.root.name = 'Assembled castle';
    const wings = s.buildings.filter((b) => isSupport(b.kind)),
      kit = new Masonry(assets.get(`castle-${s.wallTier}`).scene);
    for (const m of mounts.filter((m) => m.inner)) {
      kit.box([2.76, 0.12, 2.76], [m.x, 0.065, m.z], 'stone');
      for (const sign of [-1, 1]) {
        kit.box([2.74, 0.055, 0.08], [m.x, 0.14, m.z + sign * 1.34], 'trim');
        kit.box([0.08, 0.055, 2.74], [m.x + sign * 1.34, 0.14, m.z], 'trim');
      }
    }
    let connections = 0,
      height = 0;
    if (wings.length) {
      const rank = Math.max(...wings.map((b) => b.rank)) as Rank;
      height = wingHeight(rank) + 0.5 + (wings.length - 1) * 0.25 + (s.wallTier - 1) * 0.3;
      kit.cylinder(0.58, height, [0, height / 2, 0], 'stone', 8);
      for (let y = 0.55; y < height; y += 1.05) {
        kit.cylinder(0.64, 0.13, [0, y, 0], 'trim', 8);
        kit.window(0, y + 0.29, 0.59);
      }
      kit.cylinder(0.68, 0.15, [0, height + 0.07, 0], s.wallTier === 3 ? 'gold' : 'trim', 8);
      kit.roof(
        s.wallTier === 3 ? 0.95 : 0.82,
        s.wallTier === 3 ? 1.45 : 0.85,
        [0, height + (s.wallTier === 3 ? 0.87 : 0.57), 0],
        8,
      );
      if (s.wallTier === 3) {
        kit.cylinder(0.04, 0.85, [0, height + 1.93, 0], 'gold', 6);
        kit.box([0.68, 0.4, 0.035], [0.34, height + 2.04, 0], 'roof');
        kit.box([0.08, 0.28, 0.05], [0.27, height + 2.04, 0], 'gold');
      }
      for (let i = 0; i < wings.length; i++) {
        const b = wings[i],
          m = mounts.find((m) => m.id === b.site)!;
        // Full-height corner piers and cornices make each purchased room part of one tower.
        if (s.wallTier >= 2) {
          const x = Math.sign(m.x) * 2.66,
            z = Math.sign(m.z) * 2.66,
            h = wingHeight(b.rank);
          kit.box([0.42, h, 0.42], [x, h / 2, z], 'trim');
          if (s.wallTier === 3) kit.roof(0.4, 0.62, [x, h + 0.31, z], 4);
        }
        for (let j = i + 1; j < wings.length; j++) {
          const other = wings[j],
            n = mounts.find((m) => m.id === other.site)!;
          if (m.x !== n.x && m.z !== n.z) continue;
          connections++;
          const x = (m.x + n.x) / 2,
            z = (m.z + n.z) / 2;
          const h = wingHeight(Math.min(b.rank, other.rank) as Rank);
          const horizontal = m.z === n.z;
          kit.box(horizontal ? [0.22, h, 2.65] : [2.65, h, 0.22], [x, h / 2, z], 'stone');
          for (const y of [0.38, h - 0.02])
            kit.box(
              horizontal ? [0.38, 0.16, 2.79] : [2.79, 0.16, 0.38],
              [x, y, z],
              s.wallTier === 3 && y > 1 ? 'gold' : 'trim',
            );
          if (s.wallTier >= 2) {
            // A raised linking gallery bridges the roof seam as the shell is fortified.
            kit.box(horizontal ? [0.52, 0.2, 2.88] : [2.88, 0.2, 0.52], [x, h + 0.18, z], 'trim');
            for (const side of [-1, 1])
              kit.box(
                [0.2, 0.5, 0.2],
                [x + (horizontal ? 0 : side * 1.32), h + 0.5, z + (horizontal ? side * 1.32 : 0)],
                'stone',
              );
          }
        }
      }
    }
    this.hub = kit.finish('Shared castle masonry');
    this.root.add(this.hub);
    this.summary = { tier: s.wallTier, wings: wings.length, connections, height };
  }
  dispose() {
    disposeMasonry(this.hub);
    this.root.removeFromParent();
  }
}
