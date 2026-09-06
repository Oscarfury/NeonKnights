import { Group } from 'three';
import type { Assets } from '../presentation/Assets';
import type { Rank, WingKind } from '../construction/Catalog';
import { Masonry } from './Masonry';

export const wingHeight = (rank: Rank) => [1.65, 2.8, 3.95][rank - 1];

/** An interlocking quarter of the main tower, with a readable identity on its outward face. */
export function towerWing(assets: Assets, kind: WingKind, rank: Rank) {
  const kit = new Masonry(assets.get(`castle-${rank}`).scene),
    h = wingHeight(rank);
  const chapel = kind === 'sanctuary';
  kit.box([2.78, 0.25, 2.78], [0, 0.16, 0], 'trim');
  kit.box([2.64, h - 0.2, 2.64], [0, h / 2 + 0.1, 0], 'stone');
  for (const y of [0.45, h - 0.08]) kit.box([2.77, 0.14, 2.77], [0, y, 0], 'trim');
  for (const x of [-1.25, 1.25])
    for (const z of [-1.25, 1.25])
      kit.box([0.22, h, 0.22], [x, h / 2 + 0.2, z], rank === 1 ? 'wood' : 'trim');
  for (let floor = 0; floor < rank; floor++) {
    const y = 0.95 + floor * 1.1;
    for (const x of [-0.73, 0.73]) kit.window(x, y, 1.34);
    for (const side of [-1, 1]) kit.window(side * 1.34, y, 0.35, Math.PI / 2);
    if (floor) kit.box([2.77, 0.12, 2.77], [0, y - 0.52, 0], 'trim');
  }
  kit.box([0.48, 0.95, 0.08], [0, 0.7, 1.36], 'wood');
  for (const sign of [-1, 1]) kit.box([0.12, 1.12, 0.18], [sign * 0.31, 0.75, 1.38], 'trim');
  kit.box([0.72, 0.15, 0.22], [0, 1.29, 1.38], 'trim');
  // The first wing has a low roof; upper levels become an inhabited stone tower.
  if (rank < 3 && !chapel) {
    kit.roof(2.05, rank === 1 ? 0.72 : 1.05, [0, h + (rank === 1 ? 0.35 : 0.51), 0]);
    kit.box([0.33, 0.95, 0.4], [-0.85, h + 0.66, -0.5], 'stone');
    kit.box([0.43, 0.12, 0.5], [-0.85, h + 1.12, -0.5], 'trim');
  } else {
    kit.box([2.75, 0.18, 2.75], [0, h + 0.1, 0], 'trim');
    for (let i = -1; i <= 1; i++)
      for (const side of [-1, 1]) {
        kit.box([0.38, 0.48, 0.27], [i * 0.96, h + 0.39, side * 1.26], 'stone');
        kit.box([0.27, 0.48, 0.38], [side * 1.26, h + 0.39, i * 0.96], 'stone');
      }
  }
  if (rank >= 2) {
    for (const x of [-1.2, 1.2]) {
      kit.box([0.3, h * 0.8, 0.45], [x, h * 0.4, 1.34], 'trim');
      kit.box([0.2, 0.64, 0.06], [x, h - 0.65, 1.59], 'roof');
    }
  }
  if (rank === 3) {
    // A corner turret is a whole new volume, not a scale change or a coloured badge.
    kit.cylinder(0.48, 1.35, [-0.85, h + 0.66, -0.85], 'stone');
    kit.cylinder(0.54, 0.14, [-0.85, h + 1.34, -0.85], 'gold');
    kit.roof(0.72, 1.05, [-0.85, h + 1.93, -0.85], 8);
    kit.cylinder(0.035, 0.55, [-0.85, h + 2.61, -0.85], 'gold', 6);
    kit.box([2.82, 0.08, 2.82], [0, h - 0.04, 0], 'gold');
    kit.box([0.65, 0.9, 0.06], [0.68, h - 0.63, 1.39], 'roof');
    kit.box([0.1, 0.58, 0.08], [0.68, h - 0.63, 1.43], 'gold');
  }
  if (kind === 'tavern') {
    kit.box([0.09, 0.08, 0.55], [1.04, 1.48, 1.58], 'wood');
    kit.box([0.43, 0.4, 0.09], [1.04, 1.22, 1.8], 'gold');
    kit.box([0.24, 0.1, 0.11], [1.04, 1.23, 1.83], 'light');
  }
  if (kind === 'forge') {
    for (const x of [-0.85, 0.85]) {
      kit.box([0.5, 1.8 + rank * 0.3, 0.6], [x, h + 0.9, -0.5], 'stone');
      kit.box([0.66, 0.15, 0.76], [x, h + 1.8 + rank * 0.15, -0.5], 'trim');
      for (let y = 0; y < 3; y++)
        kit.box([0.35, 0.12, 0.65], [x, h + 0.55 + y * 0.35, -0.5], 'dark');
    }
    kit.box([1.15, 0.7, 0.08], [0, 0.85, 1.4], 'dark');
    kit.box([0.85, 0.4, 0.1], [0, 0.75, 1.45], 'light');
    for (let x = -2; x <= 2; x++) kit.box([0.07, 0.72, 0.1], [x * 0.19, 0.85, 1.52], 'wood');
    kit.box([1.05, 0.2, 0.6], [0, 0.45, 1.65], 'dark');
    kit.box([0.32, 0.38, 0.38], [0, 0.22, 1.65], 'stone');
    if (rank === 3) {
      kit.cylinder(0.48, 0.7, [0.8, h + 0.55, 0.55], 'gold');
      kit.roof(0.75, 0.5, [0.8, h + 1.05, 0.55], 8);
    }
  }
  if (kind === 'war-room') {
    const mast = h + 0.8 + rank * 0.5;
    kit.cylinder(0.06, 2 + rank * 0.4, [0, mast, 0], 'gold');
    for (let n = 0; n < rank; n++) {
      kit.box([1.25 - n * 0.17, 0.42, 0.05], [0.64 - n * 0.08, mast + 0.65 - n * 0.5, 0], 'roof');
      kit.box([0.13, 0.3, 0.06], [0.38, mast + 0.65 - n * 0.5, 0.03], 'gold');
    }
    kit.box([1.3, 0.62, 0.07], [0, 1.02, 1.41], 'roof');
    kit.cylinder(0.05, 0.7, [0, 1.02, 1.48], 'gold');
    kit.box([0.56, 0.07, 0.09], [0, 1.08, 1.5], 'gold');
    if (rank >= 2)
      for (const x of [-1, 1]) {
        kit.cylinder(0.27, 0.95, [x, h + 0.55, 0.85], 'stone');
        kit.roof(0.4, 0.5, [x, h + 1.25, 0.85], 8);
      }
  }
  const root = kit.finish(`${kind} wing ${rank}`);
  if (chapel) {
    const crown = assets.get(`sanctuary-${rank}`).scene.clone(true) as Group;
    crown.name = 'Dawn chapel crown';
    crown.scale.setScalar(0.5);
    crown.position.y = h + 0.18;
    root.add(crown);
  }
  root.userData.towerWing = { kind, rank, floors: rank, turret: rank === 3, height: h };
  return root;
}
