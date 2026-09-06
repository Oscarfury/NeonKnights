import * as C from './Campaign';
import {
  defenses,
  spec,
  investment,
  type DefenseKind,
  type Rank,
  type SiteId,
} from '../construction/Catalog';
import {
  mounts,
  wallSpec,
  recruits,
  items,
  isSupport,
  recruitPrice,
  recruitUnlock,
} from './Catalog';
import { talents, talentRemaining, talentError } from './Talents';

const roman = ['I', 'II', 'III'];
const symbols: Record<DefenseKind, string> = {
  forge: '&#9874;',
  'war-room': '&#9873;',
  mortar: '&#9673;',
  tavern: '&#9820;',
  ballista: '➶',
  aegis: '⬡',
  spire: 'ϟ',
  sanctuary: '✚',
};
const purposes: Record<DefenseKind, string> = {
  forge: 'Tempers every sixth royal shot',
  'war-room': 'Faster Decrees & company ward',
  mortar: 'Arcing shells break formations',
  tavern: 'Recruit knights &middot; starting ward',
  ballista: 'Piercing siege bolts',
  aegis: 'Intercepts enemy projectiles',
  spire: 'Lightning chains through crowds',
  sanctuary: 'Heals your nearby knights',
};
const button = (text: string, action: string, disabled = false) =>
  `<button class="council-button" data-action="${action}" ${disabled ? 'disabled' : ''}>${text}</button>`;
export function buildingCouncil(s: C.Campaign, site: SiteId, picked: string | null) {
  const tier = wallSpec(s.wallTier),
    b = s.buildings.find((b) => b.site === site),
    inner = !!mounts.find((m) => m.id === site)?.inner;
  const slots = (inner: boolean) =>
    `<div class="platform-tabs" aria-label="${inner ? 'Courtyard slots' : 'Wall platforms'}">${mounts
      .filter((m) => !!m.inner === inner)
      .map(
        (m) =>
          `<button data-action="slot:${m.id}" class="${site === m.id ? 'selected' : ''}" aria-label="${m.name} platform">${inner ? m.name.split(' ')[1] : m.name[0]}<small>${s.buildings.some((b) => b.site === m.id) ? 'Built' : 'Open'}</small></button>`,
      )
      .join('')}</div>`;
  const cards = (inner: boolean) =>
    `<div class="building-catalog">${(
      [
        'tavern',
        'sanctuary',
        'forge',
        'war-room',
        'ballista',
        'spire',
        'aegis',
        'mortar',
      ] as DefenseKind[]
    )
      .filter((kind) => isSupport(kind) === inner)
      .map((kind) => {
        const d = defenses[kind],
          r = spec(kind, 1),
          built = isSupport(kind) && s.buildings.some((b) => b.kind === kind),
          gate = C.buildingGate(s, kind, 1);
        return `<button class="building-card ${kind} ${picked === kind ? 'armed' : ''}" data-pick="${kind}" ${built || gate || s.gold < r.cost || C.capacity(s) + d.capacity > tier.capacity ? 'disabled' : ''} aria-label="Place ${kind === 'tavern' ? 'Tavern' : d.name} for ${r.cost} crowns"><span class="building-emblem">${symbols[kind]}</span><strong>${kind === 'tavern' ? 'Tavern' : d.name}</strong><span>${purposes[kind]}</span><small><b>${built ? 'Built' : gate || `${r.cost} &#9820;`}</b>${d.capacity ? ` &middot; ${d.capacity} power` : ''}</small></button>`;
      })
      .join('')}</div>`;
  return `<div class="build-intro"><h3>Build the Crownspire.</h3><p>${!C.hasTavern(s) ? 'Start the tower with a tavern wing.' : 'Attach wings. Add floors. Raise one castle.'}</p></div>
  <div class="build-zones"><button data-action="zone:inner" class="${inner ? 'selected' : ''}">Castle wings <small>4 attached sections</small></button><button data-action="zone:wall" class="${!inner ? 'selected' : ''}">Defenses <small>4 wall mounts</small></button></div>
  <div class="build-section">${slots(inner)}${cards(inner)}</div>
  <div class="castle-tier-track" aria-label="Castle tiers">${['Outpost', 'Stonehold', 'Crownspire'].map((name, i) => `<span class="${s.wallTier >= i + 1 ? 'reached' : ''}"><b>${roman[i]}</b>${name}</span>`).join('')}</div>
  <div class="wall-summary"><div><strong>${tier.name} ${roman[s.wallTier - 1]}</strong><small>${C.capacity(s)} / ${tier.capacity} power</small></div>${button(s.wallTier < 3 ? `Fortify ${roman[s.wallTier]} &middot; ${wallSpec((s.wallTier + 1) as Rank).cost} &#9820;` : 'Max tier', 'walls-up', !!C.wallGate(s) || s.gold < wallSpec(Math.min(3, s.wallTier + 1) as Rank).cost)}</div>
  <p class="fine">${C.wallGate(s) || 'Fortification adds health and power capacity.'}</p>${C.wallRepairCost(s) ? button(`Repair walls &middot; ${C.wallRepairCost(s)} &#9820;`, 'walls-repair', s.gold < C.wallRepairCost(s)) : ''}
  ${b ? `<article class="mounted-card ${b.kind}"><span class="eyebrow">${mounts.find((m) => m.id === site)!.name}</span><h3>${defenses[b.kind].name} ${roman[b.rank - 1]}</h3><p>${b.kind === 'tavern' ? `Recruit in Knights. Company starts with ${b.rank * 10} ward.` : purposes[b.kind]} &middot; ${Math.ceil(b.hp)} HP</p>${b.rank < 3 ? button(`Upgrade &middot; ${spec(b.kind, (b.rank + 1) as Rank).cost} &#9820;`, 'building-up', !!C.buildingGate(s, b.kind, (b.rank + 1) as Rank) || s.gold < spec(b.kind, (b.rank + 1) as Rank).cost || b.hp <= 0) : ''}<p class="fine">${b.rank < 3 ? C.buildingGate(s, b.kind, (b.rank + 1) as Rank) || 'Next tier adds a visible floor or mechanism.' : ''}</p>${b.rank === 3 && !isSupport(b.kind) ? `<div class="knight-actions">${['a', 'b'].map((path, i) => button(({ ballista: ['Impaler', 'Gatekeeper'], spire: ['Chainweaver', 'Thunderhead'], aegis: ['Bastion', 'Mirror'], mortar: ['Scatterfire', 'Siegebreaker'] } as Record<string, string[]>)[b.kind][i], `specialize:${path}`, (b.specialization || 'a') === path)).join('')}</div>` : ''}<div class="knight-actions"><button class="council-button" data-pick="move:${b.id}">Move</button>${button(`Salvage &middot; +${Math.floor(investment(b.kind, b.rank) * 0.7)} &#9820;`, 'building-salvage')}</div>${b.hp < spec(b.kind, b.rank).health ? button(`Repair &middot; ${Math.ceil((spec(b.kind, b.rank).health - b.hp) / 4)} &#9820;`, 'building-repair') : ''}</article>` : ''}`;
}
export function companyCouncil(s: C.Campaign, selected: string) {
  const k = s.knights.find((k) => k.id === selected) || s.knights[0],
    r = recruits.find((r) => r.id === k.id)!;
  const tree = talents.filter((t) => t.role === r.role),
    branches = [...new Set(tree.map((t) => t.branch))];
  return `${
    !C.hasTavern(s)
      ? '<div class="recruit-card"><h3>One knight. A new company.</h3><p>Build a tavern to recruit. All knights recover fully between watches.</p></div>'
      : `<div class="recruit-list">${recruits
          .filter((r) => !s.knights.some((k) => k.id === r.id))
          .map(
            (r) =>
              `<article class="recruit-card"><div><strong>${r.name}</strong><small>${{ warden: 'Warden · holds the line', marksman: 'Marksman · ranged support', lancer: 'Lancer · charging spear', chanter: 'Chanter · healing light' }[r.role]}</small></div>${button(`${s.encounter < recruitUnlock(r.id) ? `After level ${recruitUnlock(r.id)}` : `Recruit · ${recruitPrice(r.id)} &#9820;`}`, `recruit:${r.id}`, s.encounter < recruitUnlock(r.id) || s.gold < recruitPrice(r.id))}</article>`,
          )
          .join('')}</div>`
  }<div class="company-selector" aria-label="Choose a knight">${s.knights.map((other) => `<button data-action="knight:${other.id}" class="${k.id === other.id ? 'selected' : ''}"><span>${recruits.find((r) => r.id === other.id)!.role === 'warden' ? '⬟' : '➶'}</span><strong>${recruits.find((r) => r.id === other.id)!.name}</strong><small>${talentRemaining(other)} points · ${other.active ? 'Active' : 'Reserve'}</small></button>`).join('')}</div>
  <article class="knight-profile"><span class="eyebrow">${r.role.toUpperCase()} · RANK ${roman[k.rank - 1]}</span><h3>${r.name} <small>${r.trait}</small></h3><p>${Math.ceil(k.hp)} / ${C.knightMax(k)} health · ${k.xp} service XP</p><div class="knight-actions">${button('Inspect', `inspect:${k.id}`)}${button(k.active ? 'Reserve' : 'Deploy', `assign:${k.id}`)}${button(k.rank < 3 ? `Promote · ${k.rank === 1 ? 100 : 180} ♜` : 'Veteran', `promote:${k.id}`, k.rank === 3 || k.xp < (k.rank === 1 ? 6 : 16) || s.encounter < (k.rank === 1 ? 5 : 10) || s.gold < (k.rank === 1 ? 100 : 180))}</div>
  <details class="knight-settings"><summary>Orders & equipment</summary><label class="council-label" for="stance-${k.id}">BEHAVIOUR</label><select id="stance-${k.id}" data-stance="${k.id}"><option value="guard" ${k.stance === 'guard' ? 'selected' : ''}>Guard the gate</option><option value="hunt" ${k.stance === 'hunt' ? 'selected' : ''}>Hunt invaders</option></select>
  <label class="council-label" for="gear-${k.id}">EQUIPPED ITEM</label><select id="gear-${k.id}" data-gear="${k.id}"><option value="0">No item equipped</option>${s.inventory
    .filter((i) => items[i.kind].kind === 'gear')
    .map(
      (i) =>
        `<option value="${i.id}" ${k.gear === i.id ? 'selected' : ''}>${items[i.kind].name}${s.knights.some((other) => other !== k && other.gear === i.id) ? ' (transfer)' : ''}</option>`,
    )
    .join(
      '',
    )}</select>${k.gear ? `<p class="fine">${items[s.inventory.find((i) => i.id === k.gear)!.kind].description}</p>` : '<p class="fine">Buy equipment in King & gear. Transfers are free.</p>'}</details></article>
  <details class="knight-talents"><summary>Talents &middot; ${talentRemaining(k)} points available</summary><div class="talent-heading"><div><span class="eyebrow">CLASS TALENTS</span><h3>${talentRemaining(k)} point${talentRemaining(k) === 1 ? '' : 's'} available</h3></div>${button('Reset free', `talent-reset:${k.id}`, !k.talents.length)}</div><p class="fine">Start at the top of either path. One point per rank. Choose a branch or mix its opening talents. Abilities trigger automatically.</p>
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
  </details><details class="enemy-inspection"><summary>Inspect the enemy</summary><div class="knight-actions">${button('Raider', 'inspect:raider')}${button('Bulwark', 'inspect:bulwark')}${button('Hexcaster', 'inspect:hexcaster')}${button('Archer', 'inspect:arbalist')}${button('Sapper', 'inspect:sapper')}${button('Banneret', 'inspect:banneret')}${button('Reaver', 'inspect:reaver')}${button('Ram', 'inspect:ram')}${button('Golem', 'inspect:golem')}${button('Dragon', 'inspect:dragon')}${button('Hollow King', 'inspect:hollow-king')}</div></details>`;
}
