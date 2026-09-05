import {
  defenses,
  investment,
  spec,
  type Rank,
  type DefenseKind,
  type SiteId,
} from '../construction/Catalog';
import type { Blueprint } from '../construction/Workshop';
import {
  items,
  recruits,
  wallSpec,
  mounts,
  encounters,
  type ItemKind,
  type Relic,
} from './Catalog';
import type { Weapon } from '../presentation/Paladin';
import { talentError, validTalents } from './Talents';
export interface Knight {
  id: string;
  active: boolean;
  hp: number;
  rank: Rank;
  xp: number;
  gear: number | null;
  stance: 'guard' | 'hunt';
  talents: string[];
}
export interface OwnedItem {
  id: number;
  kind: ItemKind;
}
export interface Campaign {
  version: 1;
  layout?: 'circle';
  gold: number;
  encounter: number;
  wallTier: Rank;
  walls: number[];
  kingHp: number;
  weapon: Weapon;
  ranks: Record<Weapon, Rank>;
  sockets: Record<Weapon, number[]>;
  knights: Knight[];
  inventory: OwnedItem[];
  offers: ItemKind[];
  bought: number[];
  rerolls: number;
  nextId: number;
  buildings: Blueprint[];
  relic: Relic | null;
  difficulty: 'normal' | 'veteran';
  wins: number;
}
export const knightMax = (k: Knight) =>
  (recruits.find((r) => r.id === k.id)!.role === 'warden' ? 135 : 95) + (k.rank - 1) * 25;
export function createCampaign(difficulty: Campaign['difficulty'] = 'normal'): Campaign {
  return {
    version: 1,
    layout: 'circle',
    gold: 650,
    encounter: 0,
    wallTier: 1,
    walls: [230, 230, 230, 230],
    kingHp: 160,
    weapon: 'stormbow',
    ranks: { stormbow: 1, sunlance: 1 },
    sockets: { stormbow: [], sunlance: [] },
    knights: recruits.slice(0, 3).map((r) => ({
      id: r.id,
      active: true,
      hp: r.role === 'warden' ? 135 : 95,
      rank: 1,
      xp: 0,
      gear: null,
      talents: [],
      stance: r.role === 'warden' ? 'guard' : 'hunt',
    })),
    inventory: [],
    offers: ['ward-seal', 'storm-seal', 'field-kit', 'quickdraw', 'sundering', 'vital-spark'],
    bought: [],
    rerolls: 0,
    nextId: 1,
    buildings: [],
    relic: null,
    difficulty,
    wins: 0,
  };
}
export const capacity = (s: Campaign) =>
  s.buildings.reduce((sum, b) => sum + defenses[b.kind].capacity, 0);
export function build(s: Campaign, kind: DefenseKind, site: SiteId, rank: Rank = 1): string | null {
  if (
    !mounts.some((m) => m.id === site) ||
    !Object.hasOwn(defenses, kind) ||
    ![1, 2, 3].includes(rank)
  )
    return 'Choose a highlighted platform and a building.';
  if (s.buildings.some((b) => b.site === site)) return 'That bastion already has a defense.';
  if (capacity(s) + defenses[kind].capacity > wallSpec(s.wallTier).capacity)
    return 'Upgrade the walls or salvage a defense to free capacity.';
  const cost = investment(kind, rank);
  if (s.gold < cost) return 'Not enough crowns.';
  const mount = mounts.find((m) => m.id === site)!;
  s.gold -= cost;
  s.buildings.push({
    id: s.nextId++,
    kind,
    site,
    rank,
    yaw: mount.yaw,
    hp: spec(kind, rank).health,
  });
  return null;
}
export function moveBuilding(s: Campaign, id: number, site: SiteId): string | null {
  const b = s.buildings.find((b) => b.id === id),
    mount = mounts.find((m) => m.id === site);
  if (!b || !mount) return 'Choose a building and a highlighted platform.';
  if (s.buildings.some((other) => other.id !== id && other.site === site))
    return 'That platform is occupied.';
  b.site = site;
  b.yaw = mount.yaw;
  return null;
}
export function learnTalent(s: Campaign, id: string, talent: string): string | null {
  const k = s.knights.find((k) => k.id === id);
  if (!k) return 'Choose a knight.';
  const error = talentError(k, talent);
  if (error) return error;
  k.talents.push(talent);
  return null;
}
export function resetTalents(s: Campaign, id: string): string | null {
  const k = s.knights.find((k) => k.id === id);
  if (!k) return 'Choose a knight.';
  k.talents = [];
  return null;
}
export function upgradeBuilding(s: Campaign, id: number): string | null {
  const b = s.buildings.find((b) => b.id === id);
  if (!b) return 'Choose a defense.';
  if (b.rank === 3) return 'Rank III is complete.';
  if (b.hp <= 0) return 'Repair the wreck before upgrading.';
  const rank = (b.rank + 1) as Rank,
    cost = spec(b.kind, rank).cost;
  if (s.gold < cost) return 'Not enough crowns.';
  b.hp += spec(b.kind, rank).health - spec(b.kind, b.rank).health;
  b.rank = rank;
  s.gold -= cost;
  return null;
}
export function salvage(s: Campaign, id: number): string | null {
  const b = s.buildings.find((b) => b.id === id);
  if (!b) return 'Choose a defense.';
  s.gold += Math.floor(investment(b.kind, b.rank) * 0.7);
  s.buildings = s.buildings.filter((b) => b.id !== id);
  return null;
}
export function repairBuilding(s: Campaign, id: number): string | null {
  const b = s.buildings.find((b) => b.id === id);
  if (!b) return 'Choose a defense.';
  const cost = Math.ceil((spec(b.kind, b.rank).health - b.hp) / 4);
  if (!cost) return 'Already repaired.';
  if (s.gold < cost) return 'Not enough crowns.';
  s.gold -= cost;
  b.hp = spec(b.kind, b.rank).health;
  return null;
}
export function upgradeWalls(s: Campaign): string | null {
  if (s.wallTier === 3) return 'The royal bastion is complete.';
  const next = wallSpec((s.wallTier + 1) as Rank);
  if (s.gold < next.cost) return 'Not enough crowns.';
  const difference = next.hp - wallSpec(s.wallTier).hp;
  s.gold -= next.cost;
  s.wallTier = (s.wallTier + 1) as Rank;
  s.walls = s.walls.map((hp) => hp + difference);
  return null;
}
export const wallRepairCost = (s: Campaign) =>
  Math.ceil(s.walls.reduce((sum, hp) => sum + wallSpec(s.wallTier).hp - hp, 0) / 6);
export function repairWalls(s: Campaign): string | null {
  const cost = wallRepairCost(s);
  if (!cost) return 'The walls are undamaged.';
  if (s.gold < cost) return 'Not enough crowns.';
  s.gold -= cost;
  s.walls = s.walls.map(() => wallSpec(s.wallTier).hp);
  return null;
}
export function buyOffer(s: Campaign, index: number): string | null {
  const kind = s.offers[index];
  if (!kind || s.bought.includes(index)) return 'This offer is no longer available.';
  if (s.inventory.length >= 30) return 'The armory is full.';
  if (s.gold < items[kind].cost) return 'Not enough crowns.';
  s.gold -= items[kind].cost;
  s.inventory.push({ id: s.nextId++, kind });
  s.bought.push(index);
  return null;
}
export function reroll(s: Campaign): string | null {
  const cost = 35 + s.rerolls * 15;
  if (s.gold < cost) return 'Not enough crowns.';
  s.gold -= cost;
  s.rerolls++;
  const pool = Object.keys(items) as ItemKind[];
  s.offers = Array.from(
    { length: 6 },
    (_, n) => pool[(n + s.rerolls + s.encounter * 2) % pool.length],
  );
  s.bought = [];
  return null;
}
export function equipRune(s: Campaign, weapon: Weapon, id: number): string | null {
  const owned = s.inventory.find((i) => i.id === id);
  if (!owned || items[owned.kind].kind !== 'rune') return 'Choose an owned rune.';
  if (s.sockets[weapon].includes(id)) {
    s.sockets[weapon] = s.sockets[weapon].filter((i) => i !== id);
    return null;
  }
  if (s.sockets[weapon].length >= s.wallTier)
    return 'Remove a rune or upgrade the walls to unlock another socket.';
  if (
    s.sockets[weapon].some((other) => s.inventory.find((i) => i.id === other)?.kind === owned.kind)
  )
    return 'That weapon already has this rune.';
  for (const w of ['stormbow', 'sunlance'] as Weapon[])
    s.sockets[w] = s.sockets[w].filter((i) => i !== id);
  s.sockets[weapon].push(id);
  return null;
}
export function equipKnight(s: Campaign, knight: string, id: number): string | null {
  const k = s.knights.find((k) => k.id === knight),
    item = s.inventory.find((i) => i.id === id);
  if (!k || !item || items[item.kind].kind !== 'gear') return 'Choose an owned knight item.';
  if (k.gear === id) {
    k.gear = null;
    return null;
  }
  for (const other of s.knights) if (other.gear === id) other.gear = null;
  k.gear = id;
  return null;
}
export function recruit(s: Campaign, id: string): string | null {
  if (!recruits.some((r) => r.id === id) || s.knights.some((k) => k.id === id))
    return 'This knight has already joined.';
  if (s.gold < 180) return 'Recruitment costs 180 crowns.';
  s.gold -= 180;
  const k: Knight = {
    id,
    active: false,
    hp: 95,
    rank: 1,
    xp: 0,
    gear: null,
    stance: 'hunt',
    talents: [],
  };
  k.hp = knightMax(k);
  s.knights.push(k);
  return null;
}
export function assign(s: Campaign, id: string): string | null {
  const k = s.knights.find((k) => k.id === id);
  if (!k) return 'Choose a knight.';
  if (k.active) {
    if (s.knights.filter((k) => k.active).length === 1) return 'Keep at least one knight deployed.';
    k.active = false;
    return null;
  }
  if (s.knights.filter((k) => k.active).length >= 3)
    return 'Move one active knight into reserve first.';
  if (k.hp <= 0) return 'Treat this knight before deployment.';
  k.active = true;
  return null;
}
export function treat(s: Campaign, id: string): string | null {
  const k = s.knights.find((k) => k.id === id);
  if (!k) return 'Choose a knight.';
  const cost = Math.ceil((knightMax(k) - k.hp) / 3);
  if (!cost) return 'This knight is ready.';
  if (s.gold < cost) return 'Not enough crowns.';
  s.gold -= cost;
  k.hp = knightMax(k);
  return null;
}
export function promote(s: Campaign, id: string): string | null {
  const k = s.knights.find((k) => k.id === id);
  if (!k) return 'Choose a knight.';
  if (k.rank === 3) return 'This knight is a veteran.';
  if (k.xp < k.rank * 3) return `Requires ${k.rank * 3} service experience.`;
  const cost = k.rank === 1 ? 100 : 180;
  if (s.gold < cost) return 'Not enough crowns.';
  s.gold -= cost;
  k.rank = (k.rank + 1) as Rank;
  k.hp += 25;
  return null;
}
export function improveWeapon(s: Campaign, weapon: Weapon): string | null {
  if (s.ranks[weapon] === 3) return 'Royal weapon rank III is complete.';
  const cost = s.ranks[weapon] === 1 ? 150 : 280;
  if (s.gold < cost) return 'Not enough crowns.';
  s.gold -= cost;
  s.ranks[weapon] = (s.ranks[weapon] + 1) as Rank;
  return null;
}
export function treatKing(s: Campaign): string | null {
  const cost = Math.ceil((160 - s.kingHp) / 2);
  if (cost === 0) return 'The King is ready.';
  if (s.gold < cost) return 'Not enough crowns.';
  s.gold -= cost;
  s.kingHp = 160;
  return null;
}
export function chooseRelic(s: Campaign, relic: Relic): string | null {
  if (s.encounter !== 2 || s.relic) return 'The earned relic has already been chosen.';
  s.relic = relic;
  return null;
}
export function completeEncounter(s: Campaign) {
  if (s.encounter >= encounters.length) return;
  s.gold += encounters[s.encounter].reward;
  s.encounter++;
  s.wins++;
  s.kingHp = Math.min(160, s.kingHp + 45);
  for (const k of s.knights)
    if (k.active) {
      k.xp += 2;
      if (k.hp <= 0) k.hp = 25;
      else k.hp = Math.min(knightMax(k), k.hp + 15);
    }
  s.bought = [];
  s.rerolls = 0;
  const pool = Object.keys(items) as ItemKind[];
  s.offers = Array.from({ length: 6 }, (_, n) => pool[(n + s.encounter) % pool.length]);
}
export function decodeCampaign(raw: string): Campaign | null {
  try {
    const s = JSON.parse(raw) as Campaign;
    const int = (n: number, min: number, max: number) =>
      Number.isInteger(n) && n >= min && n <= max;
    if (
      !s ||
      s.version !== 1 ||
      !int(s.gold, 0, 99999) ||
      !int(s.encounter, 0, 3) ||
      !int(s.wallTier, 1, 3) ||
      !Number.isFinite(s.kingHp) ||
      s.kingHp < 0 ||
      s.kingHp > 160 ||
      !int(s.nextId, 1, 1e6) ||
      !int(s.rerolls, 0, 1000) ||
      !int(s.wins, 0, 3) ||
      !['normal', 'veteran'].includes(s.difficulty)
    )
      return null;
    if (
      !Array.isArray(s.walls) ||
      s.walls.length !== 4 ||
      s.walls.some((hp) => !Number.isFinite(hp) || hp < 0 || hp > wallSpec(s.wallTier).hp)
    )
      return null;
    if (
      !['stormbow', 'sunlance'].includes(s.weapon) ||
      !s.ranks ||
      !s.sockets ||
      !Array.isArray(s.inventory) ||
      s.inventory.length > 30
    )
      return null;
    const ids = new Set<number>();
    for (const i of s.inventory) {
      if (!i || !Object.hasOwn(items, i.kind) || !int(i.id, 1, s.nextId - 1) || ids.has(i.id))
        return null;
      ids.add(i.id);
    }
    const equipped = new Set<number>();
    for (const w of ['stormbow', 'sunlance'] as Weapon[]) {
      if (
        !int(s.ranks[w], 1, 3) ||
        !Array.isArray(s.sockets[w]) ||
        s.sockets[w].length > s.wallTier
      )
        return null;
      const kinds = new Set<ItemKind>();
      for (const id of s.sockets[w]) {
        const i = s.inventory.find((i) => i.id === id);
        if (!i || items[i.kind].kind !== 'rune' || equipped.has(id) || kinds.has(i.kind))
          return null;
        equipped.add(id);
        kinds.add(i.kind);
      }
    }
    if (
      !Array.isArray(s.knights) ||
      s.knights.length < 1 ||
      s.knights.length > 4 ||
      s.knights.filter((k) => k.active).length > 3 ||
      !s.knights.some((k) => k.active)
    )
      return null;
    const knights = new Set<string>();
    for (const k of s.knights) {
      if (k && k.talents === undefined) k.talents = [];
      if (
        !k ||
        !recruits.some((r) => r.id === k.id) ||
        knights.has(k.id) ||
        typeof k.active !== 'boolean' ||
        !int(k.rank, 1, 3) ||
        !int(k.xp, 0, 9999) ||
        !Number.isFinite(k.hp) ||
        k.hp < 0 ||
        k.hp > knightMax(k) ||
        !['guard', 'hunt'].includes(k.stance) ||
        !validTalents(k)
      )
        return null;
      knights.add(k.id);
      if (k.gear !== null) {
        const item = s.inventory.find((i) => i.id === k.gear);
        if (!item || items[item.kind].kind !== 'gear' || equipped.has(item.id)) return null;
        equipped.add(item.id);
      }
    }
    if (
      !Array.isArray(s.offers) ||
      s.offers.length !== 6 ||
      s.offers.some((i) => !Object.hasOwn(items, i)) ||
      !Array.isArray(s.bought) ||
      new Set(s.bought).size !== s.bought.length ||
      s.bought.some((i) => !int(i, 0, 5))
    )
      return null;
    if (!Array.isArray(s.buildings) || s.buildings.length > 4) return null;
    const used = new Set<string>();
    for (const b of s.buildings) {
      if (
        !b ||
        !Object.hasOwn(defenses, b.kind) ||
        !mounts.some((m) => m.id === b.site) ||
        used.has(b.site) ||
        !int(b.rank, 1, 3) ||
        !int(b.id, 1, s.nextId - 1) ||
        ids.has(b.id) ||
        !Number.isFinite(b.yaw) ||
        Math.abs(b.yaw) > 1e6 ||
        !Number.isFinite(b.hp) ||
        b.hp < 0 ||
        b.hp > spec(b.kind, b.rank).health
      )
        return null;
      used.add(b.site);
      ids.add(b.id);
      if (s.layout !== 'circle') b.yaw = mounts.find((m) => m.id === b.site)!.yaw;
    }
    if (
      capacity(s) > wallSpec(s.wallTier).capacity ||
      (s.relic !== null && !['worldpiercer', 'storm-oath', 'black-standard'].includes(s.relic)) ||
      (s.relic && s.encounter < 2)
    )
      return null;
    s.layout = 'circle';
    return structuredClone(s);
  } catch {
    return null;
  }
}
const key = 'neon-knights:v3:castle:1';
let session: Campaign | undefined;
export function saveCampaign(s: Campaign) {
  session = structuredClone(s);
  try {
    localStorage.setItem(key, JSON.stringify(s));
    return '';
  } catch {
    return 'Saved for this session; browser storage is unavailable.';
  }
}
export function loadCampaign(): { state: Campaign | null; notice: string } {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { state: session ? structuredClone(session) : null, notice: '' };
    const state = decodeCampaign(raw);
    return {
      state,
      notice: state ? '' : 'The castle checkpoint could not be read. A new siege is available.',
    };
  } catch {
    return {
      state: session ? structuredClone(session) : null,
      notice: 'Browser storage is unavailable. Progress lasts for this session.',
    };
  }
}
