import * as C from './Campaign';
import {
  defenses,
  spec,
  investment,
  type DefenseKind,
  type Rank,
  type SiteId,
} from '../construction/Catalog';
import { mounts, wallSpec, recruits, items } from './Catalog';
import { talents, talentRemaining, talentError } from './Talents';

const roman = ['I', 'II', 'III'];
const symbols: Record<DefenseKind, string> = {
  ballista: '➶',
  aegis: '⬡',
  spire: 'ϟ',
  sanctuary: '✚',
};
const purposes: Record<DefenseKind, string> = {
  ballista: 'Piercing siege bolts',
  aegis: 'Intercepts enemy projectiles',
  spire: 'Lightning chains through crowds',
  sanctuary: 'Heals your nearby knights',
};
const button = (text: string, action: string, disabled = false) =>
  `<button class="council-button" data-action="${action}" ${disabled ? 'disabled' : ''}>${text}</button>`;
export function buildingCouncil(s: C.Campaign, site: SiteId, picked: string | null) {
  const tier = wallSpec(s.wallTier),
    b = s.buildings.find((b) => b.site === site);
  return `<div class="build-intro"><span class="eyebrow">FORTIFY THE CIRCLE</span><h3>Four fronts. Your strategy.</h3><p>Drag a building onto a glowing platform. Or select a card, then select North, East, South or West.</p></div>
  <div class="wall-summary"><div><span class="eyebrow">WALLS ${roman[s.wallTier - 1]}</span><strong>${tier.name}</strong><small>${C.capacity(s)} / ${tier.capacity} power used</small></div>${button(s.wallTier < 3 ? `Upgrade · ${wallSpec((s.wallTier + 1) as Rank).cost} ♜` : 'Maximum tier', 'walls-up', s.wallTier === 3 || s.gold < wallSpec(Math.min(3, s.wallTier + 1) as Rank).cost)}</div>
  ${C.wallRepairCost(s) ? button(`Repair all walls · ${C.wallRepairCost(s)} ♜`, 'walls-repair', s.gold < C.wallRepairCost(s)) : ''}
  <div class="platform-tabs" aria-label="Wall platforms">${mounts.map((m) => `<button data-action="slot:${m.id}" class="${site === m.id ? 'selected' : ''}" aria-label="${m.name} platform">${m.name[0]}<small>${s.buildings.some((b) => b.site === m.id) ? 'Built' : 'Open'}</small></button>`).join('')}</div>
  <div class="building-catalog">${(Object.keys(defenses) as DefenseKind[])
    .map((kind) => {
      const d = defenses[kind],
        r = spec(kind, 1),
        disabled = s.gold < r.cost || C.capacity(s) + d.capacity > tier.capacity;
      return `<button class="building-card ${kind} ${picked === kind ? 'armed' : ''}" data-pick="${kind}" ${disabled ? 'disabled' : ''} aria-label="Place ${d.name} for ${r.cost} crowns"><span class="building-emblem">${symbols[kind]}</span><strong>${d.name}</strong><span>${purposes[kind]}</span><small><b>${r.cost} ♜</b> · ${d.capacity} power</small></button>`;
    })
    .join('')}</div>
  ${b ? `<article class="mounted-card ${b.kind}"><span class="eyebrow">${mounts.find((m) => m.id === site)!.name.toUpperCase()} PLATFORM</span><h3>${symbols[b.kind]} ${defenses[b.kind].name} <small>${roman[b.rank - 1]}</small></h3><p>${spec(b.kind, b.rank).name} · ${Math.ceil(b.hp)} / ${spec(b.kind, b.rank).health} health</p><p>${defenses[b.kind].description}</p><div class="building-stats"><span>${spec(b.kind, b.rank).range}m<small>Range</small></span><span>${b.kind === 'aegis' ? spec(b.kind, b.rank).capacity : spec(b.kind, b.rank).damage}<small>${b.kind === 'sanctuary' ? 'Healing' : b.kind === 'aegis' ? 'Shield' : 'Damage'}</small></span><span>${b.kind === 'aegis' ? `${spec(b.kind, b.rank).recharge}/s` : `${spec(b.kind, b.rank).interval}s`}<small>${b.kind === 'aegis' ? 'Recharge' : 'Interval'}</small></span></div>${b.rank < 3 ? button(`Upgrade to ${roman[b.rank]} · ${spec(b.kind, (b.rank + 1) as Rank).cost} ♜`, 'building-up', s.gold < spec(b.kind, (b.rank + 1) as Rank).cost || b.hp <= 0) : '<p class="fine">Rank III complete.</p>'}<div class="knight-actions"><button class="council-button" data-pick="move:${b.id}">Move for free</button>${button(`Salvage · +${Math.floor(investment(b.kind, b.rank) * 0.7)} ♜`, 'building-salvage')}</div>${b.hp < spec(b.kind, b.rank).health ? button(`Repair · ${Math.ceil((spec(b.kind, b.rank).health - b.hp) / 4)} ♜`, 'building-repair') : ''}</article>` : '<p class="fine">Each platform holds one building. Upgrading walls unlocks more power and another royal rune socket.</p>'}`;
}
export function companyCouncil(s: C.Campaign, selected: string) {
  const k = s.knights.find((k) => k.id === selected) || s.knights[0],
    r = recruits.find((r) => r.id === k.id)!;
  const tree = talents.filter((t) => t.role === r.role),
    branches = [...new Set(tree.map((t) => t.branch))];
  return `<div class="company-selector" aria-label="Choose a knight">${s.knights.map((other) => `<button data-action="knight:${other.id}" class="${k.id === other.id ? 'selected' : ''}"><span>${recruits.find((r) => r.id === other.id)!.role === 'warden' ? '⬟' : '➶'}</span><strong>${recruits.find((r) => r.id === other.id)!.name}</strong><small>${talentRemaining(other)} points · ${other.active ? 'Active' : 'Reserve'}</small></button>`).join('')}</div>
  <article class="knight-profile"><span class="eyebrow">${r.role.toUpperCase()} · RANK ${roman[k.rank - 1]}</span><h3>${r.name} <small>${r.trait}</small></h3><p>${Math.ceil(k.hp)} / ${C.knightMax(k)} health · ${k.xp} service XP</p><div class="knight-actions">${button('Inspect', `inspect:${k.id}`)}${button(k.active ? 'Reserve' : 'Deploy', `assign:${k.id}`)}${button(`Treat · ${Math.ceil((C.knightMax(k) - k.hp) / 3)} ♜`, `treat:${k.id}`, k.hp === C.knightMax(k))}${button(k.rank < 3 ? `Promote · ${k.rank === 1 ? 100 : 180} ♜` : 'Veteran', `promote:${k.id}`, k.rank === 3 || k.xp < k.rank * 3)}</div>
  <label class="council-label" for="stance-${k.id}">BEHAVIOUR</label><select id="stance-${k.id}" data-stance="${k.id}"><option value="guard" ${k.stance === 'guard' ? 'selected' : ''}>Guard the gate</option><option value="hunt" ${k.stance === 'hunt' ? 'selected' : ''}>Hunt invaders</option></select>
  <label class="council-label" for="gear-${k.id}">EQUIPPED ITEM</label><select id="gear-${k.id}" data-gear="${k.id}"><option value="0">No item equipped</option>${s.inventory
    .filter((i) => items[i.kind].kind === 'gear')
    .map(
      (i) =>
        `<option value="${i.id}" ${k.gear === i.id ? 'selected' : ''}>${items[i.kind].name}${s.knights.some((other) => other !== k && other.gear === i.id) ? ' (transfer)' : ''}</option>`,
    )
    .join(
      '',
    )}</select>${k.gear ? `<p class="fine">${items[s.inventory.find((i) => i.id === k.gear)!.kind].description}</p>` : '<p class="fine">Buy equipment in King & gear. Transfers are free.</p>'}</article>
  <div class="talent-heading"><div><span class="eyebrow">CLASS TALENTS</span><h3>${talentRemaining(k)} point${talentRemaining(k) === 1 ? '' : 's'} available</h3></div>${button('Reset free', `talent-reset:${k.id}`, !k.talents.length)}</div><p class="fine">Start at the top of either path. Earn 1 point per watch and 1 per promotion. Abilities trigger automatically.</p>
  <div class="talent-tree">${branches
    .map(
      (branch) =>
        `<section class="talent-branch"><h4>${branch}</h4>${tree
          .filter((t) => t.branch === branch)
          .map((t) => {
            const learned = k.talents.includes(t.id),
              error = talentError(k, t.id);
            return `<button class="talent-node ${learned ? 'learned' : error ? 'locked' : 'available'}" data-action="talent:${k.id}:${t.id}" aria-disabled="${!!error}" title="${error || 'Spend 1 talent point'}"><span class="talent-icon">${t.icon}</span><strong>${t.name}</strong><span>${t.description}</span><small>${learned ? '✓ Learned' : t.requires && !k.talents.includes(t.requires) ? `Requires ${talents.find((p) => p.id === t.requires)!.name}` : talentRemaining(k) ? 'Learn · 1 point' : 'Earn another point'}</small></button>`;
          })
          .join('')}</section>`,
    )
    .join('')}</div>
  ${!s.knights.some((k) => k.id === 'lysa') ? `<div class="recruit-card"><span class="eyebrow">RESERVE MARKSMAN</span><h3>Lysa awaits your banner.</h3>${button('Recruit · 180 ♜', 'recruit', s.gold < 180)}</div>` : ''}<details class="enemy-inspection"><summary>Inspect the enemy</summary><div class="knight-actions">${button('Raider', 'inspect:raider')}${button('Bulwark', 'inspect:bulwark')}${button('Hexcaster', 'inspect:hexcaster')}${button('Dragon', 'inspect:dragon')}</div></details>`;
}
