import {
  RUNES,
  STRUCTURES,
  WEAPONS,
  weaponStats,
  type RuneId,
  type StructureId,
  type Sector,
} from '../data/catalog';
import { notifyRun, random, structureRank } from './RunState';
import type { Offer, RunState } from './types';
export const runeSlots = (run: RunState) => (run.wave >= 6 ? 3 : run.wave >= 3 ? 2 : 1);
export function offerCost(run: RunState, offer: Offer): number {
  if (offer.kind === 'weapon') return [0, 55, 80, 110][run.rank] || 110;
  if (offer.kind === 'rune') return 50 + (run.runes[offer.key as RuneId] || 0) * 30;
  if (offer.kind === 'structure') return STRUCTURES[offer.key as StructureId].cost;
  if (offer.kind === 'order') return 70;
  return 60;
}
export function eligibleRunes(run: RunState): RuneId[] {
  return (Object.keys(RUNES) as RuneId[]).filter(
    (key) =>
      RUNES[key].weapons.includes(run.weapon) &&
      (run.runes[key] || 0) < RUNES[key].max &&
      (!!run.runes[key] || Object.keys(run.runes).length < runeSlots(run)),
  );
}
export function generateOffers(run: RunState) {
  const offer = (kind: Offer['kind'], key: string): Offer => ({
    id: `${run.wave}-${run.rerolls}-${kind}-${key}`,
    kind,
    key,
    bought: false,
  });
  const runes = eligibleRunes(run),
    structures = Object.keys(STRUCTURES) as StructureId[],
    defense = structures[Math.floor(random(run) * structures.length)];
  run.offers = [
    run.rank < 3
      ? offer('weapon', run.weapon)
      : runes.length
        ? offer('rune', runes.shift()!)
        : offer('fort', 'fort'),
    run.pads.some((p) => !p) ? offer('structure', defense) : offer('fort', 'fort'),
    runes.length
      ? offer('rune', runes[Math.floor(random(run) * runes.length)])
      : run.orderRank < 3
        ? offer('order', run.order)
        : offer('fort', 'fort'),
  ];
  run.offers.forEach((o, i) => (o.id += '-' + i));
  run.revision++;
}
export function offerInfo(
  run: RunState,
  offer: Offer,
): { name: string; icon: string; description: string; detail: string } {
  if (offer.kind === 'weapon') {
    const before = weaponStats(run.weapon, run.rank, run.runes.rapid),
      after = weaponStats(run.weapon, run.rank + 1, run.runes.rapid);
    return {
      name: WEAPONS[run.weapon].name,
      icon: WEAPONS[run.weapon].icon,
      description:
        run.rank === 2
          ? 'Reach rank III and choose a permanent weapon branch.'
          : 'Strengthen your chosen weapon. Your attack pattern stays familiar.',
      detail: `Rank ${run.rank} → ${run.rank + 1} · ${before.damage} → ${after.damage} damage · ${after.interval}s cycle`,
    };
  }
  if (offer.kind === 'rune') {
    const d = RUNES[offer.key as RuneId],
      rank = run.runes[offer.key as RuneId] || 0;
    return {
      ...d,
      detail: `Weapon rune · Rank ${rank} → ${rank + 1} / ${d.max}${offer.key === 'rapid' ? ` · ${weaponStats(run.weapon, run.rank, rank).interval}s → ${weaponStats(run.weapon, run.rank, rank + 1).interval}s` : ''}`,
    };
  }
  if (offer.kind === 'structure')
    return {
      ...STRUCTURES[offer.key as StructureId],
      detail: 'Fortress structure · Choose an empty bastion pad',
    };
  if (offer.kind === 'order')
    return {
      name: 'Veteran Garrison',
      icon: '⚑',
      description: 'Commands deploy one additional knight per rank, with a hard capacity of six.',
      detail: `Order rank ${run.orderRank} → ${Math.min(3, run.orderRank + 1)} / 3`,
    };
  return {
    name: 'Stone & Steel',
    icon: '♜',
    description: 'Strengthen all four walls and restore the added durability.',
    detail: `${run.maxHp} → ${run.maxHp + 30} maximum HP`,
  };
}
export function buyOffer(run: RunState, id: string, pad: Sector): boolean {
  if (run.phase !== 'shop') return false;
  const offer = run.offers.find((o) => o.id === id);
  if (!offer || offer.bought || run.gold < offerCost(run, offer)) return false;
  if (
    (offer.kind === 'weapon' && run.rank >= 3) ||
    (offer.kind === 'order' && run.orderRank >= 3) ||
    (offer.kind === 'rune' && !eligibleRunes(run).includes(offer.key as RuneId))
  )
    return false;
  if (offer.kind === 'structure' && run.pads[pad]) return false;
  const cost = offerCost(run, offer);
  run.gold -= cost;
  run.ledger.spent += cost;
  offer.bought = true;
  if (offer.kind === 'weapon') run.rank++;
  else if (offer.kind === 'rune') {
    const key = offer.key as RuneId;
    run.runes[key] = (run.runes[key] || 0) + 1;
  } else if (offer.kind === 'structure') {
    run.pads[pad] = { kind: offer.key as StructureId, rank: 1, cooldown: 0, built: 0 };
    if (offer.key === 'workshop') {
      run.maxHp += 25;
      run.hp += 25;
    }
  } else if (offer.kind === 'order') run.orderRank++;
  else {
    run.maxHp += 30;
    run.hp += 30;
  }
  run.revision++;
  return true;
}
export function repair(run: RunState): boolean {
  if (run.phase !== 'shop' || run.hp >= run.maxHp || run.gold < 25) return false;
  run.gold -= 25;
  run.hp = Math.min(run.maxHp, run.hp + 20);
  run.ledger.spent += 25;
  run.revision++;
  return true;
}
export function reroll(run: RunState): boolean {
  const cost = (run.rerolls + 1) * 15;
  if (run.phase !== 'shop' || run.rerolls >= 2 || run.gold < cost) return false;
  run.gold -= cost;
  run.ledger.spent += cost;
  run.rerolls++;
  generateOffers(run);
  return true;
}
export function upgradePad(run: RunState, pad: Sector): boolean {
  const p = run.pads[pad];
  if (run.phase !== 'shop' || !p || p.rank >= 3) return false;
  const cost = 50 + p.rank * 25;
  if (run.gold < cost) return false;
  run.gold -= cost;
  run.ledger.spent += cost;
  p.rank++;
  if (p.kind === 'workshop') {
    run.hp += 25;
    run.maxHp += 25;
  }
  run.revision++;
  return true;
}
export function sellPad(run: RunState, pad: Sector): boolean {
  const p = run.pads[pad],
    act = Math.ceil(run.wave / 5);
  if (run.phase !== 'shop' || !p || run.respecAct === act) return false;
  run.gold += Math.floor(
    (STRUCTURES[p.kind].cost + (p.rank >= 2 ? 75 : 0) + (p.rank >= 3 ? 100 : 0)) * 0.6,
  );
  if (p.kind === 'workshop') {
    run.maxHp -= 25 * p.rank;
    run.hp = Math.min(run.hp, run.maxHp);
  }
  run.pads[pad] = null;
  run.respecAct = act;
  run.revision++;
  return true;
}
export function chooseEvent(run: RunState, choice: string): boolean {
  if (run.phase !== 'event' || !['engineer', 'vault', 'shrine'].includes(choice)) return false;
  run.eventChoice = choice;
  if (choice === 'engineer') {
    run.hp = Math.min(run.maxHp, run.hp + 45);
    if (structureRank(run, 'workshop') && structureRank(run, 'tesla'))
      run.babel = Math.min(3, run.babel + 1);
  } else if (choice === 'vault') {
    run.gold += 100;
    run.hp = Math.max(1, run.hp - 25);
  } else {
    run.maxHp -= 20;
    run.hp = Math.min(run.hp, run.maxHp);
    run.seals++;
  }
  run.phase = 'shop';
  generateOffers(run);
  notifyRun(run, 'The road ahead is chosen');
  return true;
}
export function combinations(run: RunState): string[] {
  const active: string[] = [];
  if (run.order === 'cavalry') {
    if (run.runes.chain) active.push('storm');
    if (structureRank(run, 'aegis') || structureRank(run, 'chapel')) active.push('angel');
    if (structureRank(run, 'treasury')) active.push('midas');
  }
  if (run.weapon === 'cinder' && structureRank(run, 'aegis')) active.push('radiant');
  if (structureRank(run, 'ossuary')) active.push('grave');
  if (run.weapon === 'starfall' && run.runes.precision) active.push('orbital');
  if (run.dragonkin) active.push('dragonkin');
  if (run.babel >= 3 && structureRank(run, 'workshop') && structureRank(run, 'tesla'))
    active.push('babel');
  return active;
}
