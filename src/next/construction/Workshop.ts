import {
  allotment,
  capacityLimit,
  defenses,
  investment,
  sites,
  spec,
  type DefenseKind,
  type Rank,
  type SiteId,
} from './Catalog';

export interface Blueprint {
  id: number;
  kind: DefenseKind;
  rank: Rank;
  site: SiteId;
  yaw: number;
  hp: number;
}
export interface Workshop {
  version: 1;
  gold: number;
  nextId: number;
  buildings: Blueprint[];
}
export const createWorkshop = (): Workshop => ({
  version: 1,
  gold: allotment,
  nextId: 1,
  buildings: [],
});
export const usedCapacity = (state: Workshop) =>
  state.buildings.reduce((sum, b) => sum + defenses[b.kind].capacity, 0);
export const salvageValue = (b: Blueprint) => Math.floor(investment(b.kind, b.rank) * 0.7);
export const repairCost = (b: Blueprint) => Math.ceil((spec(b.kind, b.rank).health - b.hp) / 4);
export function placeDefense(
  s: Workshop,
  kind: DefenseKind,
  site: SiteId,
  yaw: number,
  rank: Rank = 1,
): string | null {
  if (
    !Object.hasOwn(defenses, kind) ||
    ![1, 2, 3].includes(rank) ||
    !sites.some((p) => p.id === site) ||
    !Number.isFinite(yaw)
  )
    return 'Choose a valid defense and site.';
  if (s.buildings.some((b) => b.site === site))
    return 'This site is occupied. Relocate or salvage its defense first.';
  if (usedCapacity(s) + defenses[kind].capacity > capacityLimit)
    return 'Insufficient construction capacity.';
  if (s.gold < investment(kind, rank)) return 'Not enough crowns.';
  s.gold -= investment(kind, rank);
  s.buildings.push({ id: s.nextId++, kind, site, yaw, rank, hp: spec(kind, rank).health });
  return null;
}
export function upgradeDefense(s: Workshop, id: number): string | null {
  const b = s.buildings.find((b) => b.id === id);
  if (!b) return 'Select a deployed defense.';
  if (b.rank === 3) return 'This defense is already at rank III.';
  if (b.hp <= 0) return 'Repair this defense before upgrading it.';
  const next = spec(b.kind, (b.rank + 1) as Rank);
  if (s.gold < next.cost) return 'Not enough crowns.';
  const missing = spec(b.kind, b.rank).health - b.hp;
  s.gold -= next.cost;
  b.rank = (b.rank + 1) as Rank;
  b.hp = next.health - missing;
  return null;
}
export function relocateDefense(s: Workshop, id: number, site: SiteId, yaw: number): string | null {
  const b = s.buildings.find((b) => b.id === id);
  if (!b || !sites.some((p) => p.id === site) || !Number.isFinite(yaw))
    return 'Choose a valid defense and site.';
  if (s.buildings.some((other) => other.id !== id && other.site === site))
    return 'This site is occupied.';
  b.site = site;
  b.yaw = yaw;
  return null;
}
export function salvageDefense(s: Workshop, id: number): string | null {
  const b = s.buildings.find((b) => b.id === id);
  if (!b) return 'Select a deployed defense.';
  s.gold += salvageValue(b);
  s.buildings = s.buildings.filter((b) => b.id !== id);
  return null;
}
export function repairDefense(s: Workshop, id: number): string | null {
  const b = s.buildings.find((b) => b.id === id);
  if (!b) return 'Select a deployed defense.';
  const cost = repairCost(b);
  if (!cost) return 'This defense is undamaged.';
  if (s.gold < cost) return 'Not enough crowns.';
  s.gold -= cost;
  b.hp = spec(b.kind, b.rank).health;
  return null;
}
export function decodeWorkshop(raw: string): Workshop | null {
  try {
    const s = JSON.parse(raw) as Workshop;
    if (
      s.version !== 1 ||
      !Number.isInteger(s.gold) ||
      s.gold < 0 ||
      s.gold > allotment ||
      !Number.isInteger(s.nextId) ||
      s.nextId < 1 ||
      s.nextId > 1e6 ||
      !Array.isArray(s.buildings) ||
      s.buildings.length > sites.length
    )
      return null;
    const ids = new Set<number>(),
      occupied = new Set<string>();
    for (const b of s.buildings) {
      if (
        !b ||
        !Object.hasOwn(defenses, b.kind) ||
        ![1, 2, 3].includes(b.rank) ||
        !sites.some((p) => p.id === b.site)
      )
        return null;
      if (
        !Number.isInteger(b.id) ||
        b.id < 1 ||
        b.id >= s.nextId ||
        ids.has(b.id) ||
        occupied.has(b.site)
      )
        return null;
      if (
        !Number.isFinite(b.yaw) ||
        Math.abs(b.yaw) > 1e6 ||
        !Number.isFinite(b.hp) ||
        b.hp < 0 ||
        b.hp > spec(b.kind, b.rank).health
      )
        return null;
      ids.add(b.id);
      occupied.add(b.site);
    }
    if (
      usedCapacity(s) > capacityLimit ||
      s.gold + s.buildings.reduce((sum, b) => sum + investment(b.kind, b.rank), 0) > allotment
    )
      return null;
    return {
      version: 1,
      gold: s.gold,
      nextId: s.nextId,
      buildings: s.buildings.map((b) => ({
        id: b.id,
        kind: b.kind,
        rank: b.rank,
        site: b.site,
        yaw: b.yaw,
        hp: b.hp,
      })),
    };
  } catch {
    return null;
  }
}
const key = 'neon-knights:v3:workshop:1';
let memory: Workshop | undefined;
export function loadWorkshop(): { state: Workshop; notice: string } {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const state = decodeWorkshop(raw);
      if (state) {
        memory = state;
        return { state, notice: '' };
      }
      memory = createWorkshop();
      return {
        state: memory,
        notice: 'The stored workshop could not be read. A fresh allotment is ready.',
      };
    }
  } catch {
    return {
      state: memory || createWorkshop(),
      notice: 'Browser storage is unavailable. Workshop changes will last for this session.',
    };
  }
  memory ||= createWorkshop();
  return { state: memory, notice: '' };
}
export function saveWorkshop(state: Workshop): string {
  memory = structuredClone(state);
  try {
    localStorage.setItem(key, JSON.stringify(state));
    return '';
  } catch {
    return 'Saved for this session. Browser storage is unavailable.';
  }
}
