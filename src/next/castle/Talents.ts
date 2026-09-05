import type { Knight } from './Campaign';
import { recruits, type Role } from './Catalog';

export interface Talent {
  id: string;
  name: string;
  icon: string;
  branch: string;
  role: Role;
  tier: number;
  requires?: string;
  description: string;
}
// The registry is shared by validation, the tree and combat. New classes can add their own branches.
export const talents: Talent[] = [
  {
    id: 'slam',
    name: 'Thunder Slam',
    icon: '✹',
    role: 'warden',
    branch: 'Vanguard',
    tier: 0,
    description:
      'Every 8s, slams nearby enemies for 24 damage and stuns them for 1.2s. Bosses resist the stun.',
  },
  {
    id: 'aftershock',
    name: 'Aftershock',
    icon: 'ϟ',
    role: 'warden',
    branch: 'Vanguard',
    tier: 1,
    requires: 'slam',
    description: 'Thunder Slam deals 40 damage in a wider 4m radius.',
  },
  {
    id: 'earthshaker',
    name: 'Earthshaker',
    icon: '✷',
    role: 'warden',
    branch: 'Vanguard',
    tier: 2,
    requires: 'aftershock',
    description: 'Thunder Slam recovers in 5s and its stun lasts 2s.',
  },
  {
    id: 'taunt',
    name: 'Challenging Cry',
    icon: '♜',
    role: 'warden',
    branch: 'Guardian',
    tier: 0,
    description:
      'Every 9s, forces invaders within 6m to attack this knight for 4s. Does not redirect bosses.',
  },
  {
    id: 'bulwark',
    name: 'Iron Resolve',
    icon: '⬟',
    role: 'warden',
    branch: 'Guardian',
    tier: 1,
    requires: 'taunt',
    description: 'Take 25% less damage while Challenging Cry is active.',
  },
  {
    id: 'renewal',
    name: 'Sacred Ground',
    icon: '✚',
    role: 'warden',
    branch: 'Guardian',
    tier: 2,
    requires: 'bulwark',
    description: 'Every 4s, passively heals this knight and living allies within 5m for 6 health.',
  },
  {
    id: 'volley',
    name: 'Split Volley',
    icon: '⋔',
    role: 'marksman',
    branch: 'Stormshot',
    tier: 0,
    description: 'Every third attack also fires a 16-damage arrow at a second enemy within range.',
  },
  {
    id: 'piercing',
    name: 'Barbed Arrows',
    icon: '➶',
    role: 'marksman',
    branch: 'Stormshot',
    tier: 1,
    requires: 'volley',
    description: 'Arrows ignore shields and pierce through two enemies.',
  },
  {
    id: 'deadeye',
    name: 'Deadeye',
    icon: '◈',
    role: 'marksman',
    branch: 'Stormshot',
    tier: 2,
    requires: 'piercing',
    description: 'All attacks deal 30% more damage. Split Volley deals 24 damage.',
  },
  {
    id: 'mending',
    name: 'Mending Light',
    icon: '✚',
    role: 'marksman',
    branch: 'Lifewarden',
    tier: 0,
    description: 'Every 4s, heals the most wounded living knight within 7m for 8 health.',
  },
  {
    id: 'shelter',
    name: 'Sheltering Light',
    icon: '⬡',
    role: 'marksman',
    branch: 'Lifewarden',
    tier: 1,
    requires: 'mending',
    description:
      'Mending Light also grants its target a 10-damage shield lasting 5s. Shields refresh, never stack.',
  },
  {
    id: 'beacon',
    name: 'Beacon of Dawn',
    icon: '☀',
    role: 'marksman',
    branch: 'Lifewarden',
    tier: 2,
    requires: 'shelter',
    description: 'Mending Light heals 14 health every 3s and reaches allies within 10m.',
  },
];
export const talentBudget = (k: Pick<Knight, 'xp' | 'rank'>) =>
  Math.min(6, 1 + Math.floor(k.xp / 2) + k.rank - 1);
export const talentRemaining = (k: Knight) => talentBudget(k) - k.talents.length;
export function talentError(k: Knight, id: string): string | null {
  const t = talents.find((t) => t.id === id);
  if (!t || t.role !== recruits.find((r) => r.id === k.id)?.role)
    return 'This talent belongs to another class.';
  if (k.talents.includes(id)) return 'This talent is already learned.';
  if (talentRemaining(k) < 1)
    return 'Earn another talent point by completing a watch or promoting this knight.';
  if (t.requires && !k.talents.includes(t.requires))
    return `Learn ${talents.find((other) => other.id === t.requires)!.name} first.`;
  return null;
}
export function validTalents(k: Knight): boolean {
  if (!Array.isArray(k.talents) || k.talents.length > talentBudget(k)) return false;
  const copy = { ...k, talents: [] as string[] };
  // Validate prerequisites independently of serialization order.
  const ordered = [...k.talents].sort(
    (a, b) =>
      (talents.find((t) => t.id === a)?.tier ?? 0) - (talents.find((t) => t.id === b)?.tier ?? 0),
  );
  for (const id of ordered) {
    if (talentError(copy, id)) return false;
    copy.talents.push(id);
  }
  return true;
}
