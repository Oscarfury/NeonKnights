import {
  ACTS,
  BRANCH_DETAILS,
  CAPSTONES,
  COMBINATIONS,
  ENEMIES,
  RUNES,
  SECTORS,
  STRUCTURES,
  WEAPONS,
  weaponStats,
  type WeaponId,
  type Sector,
} from '../game/data/catalog';
import { combinations, offerCost, offerInfo, runeSlots } from '../game/simulation/EconomySystem';
import { bossAt } from '../game/simulation/WaveDirector';
import { structureRank } from '../game/simulation/RunState';
import type { RunState } from '../game/simulation/types';
import type { Profile, Settings } from '../game/persistence/storage';
const esc = (s: unknown) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
const keyName = (code: string) =>
  code
    .replace('Key', '')
    .replace('Digit', '')
    .replace('Left', '')
    .replace('Right', '')
    .replace('Arrow', '');
export interface UIActions {
  action: (name: string, value: string) => void;
  touch: (name: string, down: boolean) => void;
  setting: (name: string, value: string | boolean) => void;
}
export class UI {
  modal: '' | 'settings' | 'codex' = '';
  selectedWeapon: WeaponId = 'stormbow';
  selectedPad: Sector = 0;
  difficulty: RunState['difficulty'] = 'standard';
  seed = '';
  guided = true;
  hasSave = false;
  storageWarning = false;
  private root = document.getElementById('ui')!;
  constructor(
    public settings: Settings,
    public profile: Profile,
    private callbacks: UIActions,
  ) {
    this.root.addEventListener('click', (e) => {
      const button = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
      if (button) this.callbacks.action(button.dataset.action!, button.dataset.value || '');
    });
    this.root.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      if (input.dataset.setting)
        this.callbacks.setting(
          input.dataset.setting,
          input.type === 'checkbox' ? input.checked : input.value,
        );
      if (input.id === 'difficulty') this.difficulty = input.value as RunState['difficulty'];
      if (input.id === 'seed') this.seed = input.value;
      if (input.id === 'guided') this.guided = input.checked;
    });
    this.root.addEventListener('keydown', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.dataset.binding) {
        e.preventDefault();
        if (
          /^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Shift(Left|Right)|Space)$/.test(e.code)
        )
          this.callbacks.setting('bind:' + target.dataset.binding, e.code);
      }
      if (e.key === 'Tab') {
        const panel = this.root.querySelector<HTMLElement>('.modal,.planning,.result');
        if (panel) {
          const items = Array.from(
            panel.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,a[href]'),
          );
          if (e.shiftKey && document.activeElement === items[0]) {
            e.preventDefault();
            items.at(-1)?.focus();
          } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
            e.preventDefault();
            items[0]?.focus();
          }
        }
      }
    });
    this.root.addEventListener('pointerdown', (e) => {
      const button = (e.target as HTMLElement).closest<HTMLElement>('[data-touch]');
      if (button) {
        button.setPointerCapture(e.pointerId);
        this.callbacks.touch(button.dataset.touch!, true);
        e.preventDefault();
      }
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
      this.root.addEventListener(event, (e) => {
        const button = (e.target as HTMLElement).closest<HTMLElement>('[data-touch]');
        if (button) this.callbacks.touch(button.dataset.touch!, false);
      });
  }
  render(run: RunState) {
    const focused = (document.activeElement as HTMLElement)?.dataset.focus;
    document.documentElement.style.setProperty('--ui-scale', String(this.settings.uiScale));
    document.body.classList.toggle('reduced-motion', !this.settings.motion);
    document.body.classList.toggle('large-ui', this.settings.uiScale > 1);
    this.root.innerHTML = `${this.header(run)}${run.phase === 'menu' ? this.menu() : this.hud(run)}${!this.modal ? (run.paused ? this.pause(run) : run.phase === 'shop' ? this.shop(run) : run.phase === 'event' ? this.event() : run.phase === 'defeat' || run.phase === 'victory' ? this.result(run) : '') : this.modal === 'settings' ? this.settingsPanel() : this.codex(run)}${this.storageWarning ? '<div class="save-warning">Browser storage is unavailable. Keep this tab open to retain your run.</div>' : ''}`;
    if (focused)
      this.root.querySelector<HTMLElement>(`[data-focus="${CSS.escape(focused)}"]`)?.focus();
    else
      this.root
        .querySelector<HTMLElement>('[role="dialog"] button:not(:disabled)')
        ?.focus({ preventScroll: true });
    if (run.phase === 'battle')
      this.root.insertAdjacentHTML(
        'beforeend',
        '<div class="boss-hud" id="boss-hud" hidden><span id="boss-name"></span><b id="boss-health"></b><div class="meter"><i id="boss-fill"></i></div></div>',
      );
    for (const el of this.root.querySelectorAll<HTMLElement>('[data-action="branch"]'))
      el.insertAdjacentHTML(
        'beforeend',
        `<small>${BRANCH_DETAILS[run.weapon][Number(el.dataset.value)]}</small>`,
      );
    const capstone = this.root.querySelector<HTMLElement>('[data-action="capstone"]');
    if (capstone) {
      capstone.innerHTML = `${CAPSTONES[run.weapon].name} · 1 seal<small>+35% damage. ${CAPSTONES[run.weapon].description}</small>`;
    }
    this.update(run);
  }
  private header(run: RunState) {
    return `<header class="topbar"><a class="brand" href="${import.meta.env.BASE_URL}" aria-label="Neon Knights home"><img src="${import.meta.env.BASE_URL}assets/crest.svg" alt=""/> NEON KNIGHTS <span>THE LAST BASTION</span></a><nav><span class="build-label">PLAYTEST · v2.0</span>${run.phase === 'menu' ? '<button data-action="codex">Field guide</button><button data-action="settings" aria-label="Open settings">Settings <span>⚙</span></button>' : '<button data-action="pause" aria-label="Pause game">Pause <kbd>Esc</kbd></button>'}</nav></header>`;
  }
  private menu() {
    return `<main class="menu"><div class="eyebrow"><span class="tiny-line"></span> A KINGDOM FALLEN. A LIGHT REMAINING.</div><h1>THE LAST<br/><em>BASTION</em></h1><p class="intro">The dark has taken the kingdom.<br/>It hasn't taken you.</p><p class="pitch">Phase between the battlements. Command your knights.<br class="desktop-only"/> Build a fortress that the siege will remember.</p><div class="loadout-label"><span>CHOOSE YOUR WEAPON</span><span>01 — 05</span></div><div class="weapon-picker">${Object.entries(
      WEAPONS,
    )
      .map(
        ([id, w]) =>
          `<button class="weapon-choice ${id === this.selectedWeapon ? 'selected' : ''}" data-action="weapon" data-value="${id}" aria-pressed="${id === this.selectedWeapon}" aria-label="Select ${w.name}" title="${w.name}"><span>${w.icon}</span><small>${w.name.split(' ')[0]}</small></button>`,
      )
      .join(
        '',
      )}</div><div class="weapon-summary"><b>${WEAPONS[this.selectedWeapon].name}</b><p>${WEAPONS[this.selectedWeapon].description}</p></div><div class="menu-options"><label>Siege difficulty<select id="difficulty"><option value="story" ${this.difficulty === 'story' ? 'selected' : ''}>Story · forgiving</option><option value="standard" ${this.difficulty === 'standard' ? 'selected' : ''}>Standard · tactical</option><option value="veteran" ${this.difficulty === 'veteran' ? 'selected' : ''}>Veteran · relentless</option></select></label><label class="check"><input id="guided" type="checkbox" ${this.guided ? 'checked' : ''}/> Guided first wave</label></div><button class="primary begin" data-action="start">Begin the siege <span>↗</span></button>${this.hasSave ? '<button class="resume" data-action="resume">Continue saved campaign →</button>' : ''}<div class="menu-links"><button data-action="training">Enter the training yard</button><span>·</span><a href="${import.meta.env.BASE_URL}classic/" target="_blank" rel="noopener">Classic draft ↗</a></div><details class="seed"><summary>Reproducible run seed</summary><input id="seed" type="text" inputmode="numeric" placeholder="Leave blank for a new siege" value="${esc(this.seed)}" maxlength="10"/></details></main><aside class="menu-art-note"><span class="eyebrow">THE BROKEN CAUSEWAY</span><div class="coordinate">FORTRESS 001 <span>◇</span> LIGHT ENGINE ACTIVE</div></aside><footer class="menu-footer"><span><b>15</b> WAVES</span><span><b>3</b> ACTS</span><span><b>1</b> LAST STAND</span><small>${this.profile.best ? `PERSONAL BEST · ${this.profile.best.toLocaleString()}` : 'A SINGLE-PLAYER SIEGE ROGUELITE'}</small></footer>`;
  }
  private hud(run: RunState) {
    const w = WEAPONS[run.weapon];
    return `<div class="hud"><div class="health-panel"><div class="hud-label">FORTRESS INTEGRITY <strong id="hp-label"></strong></div><div class="meter"><i id="hp-fill"></i></div><span id="sector-label"></span></div><div class="wave-panel"><span class="eyebrow">${ACTS[Math.min(2, Math.floor((run.wave - 1) / 5))]}</span><b>${run.training ? 'TRAINING YARD' : `WAVE ${String(run.wave).padStart(2, '0')} <small>/ ${run.endless ? '∞' : '15'}</small>`}</b><span id="wave-progress"></span></div><div class="gold-panel"><span class="eyebrow">WAR CHEST</span><b id="gold-label"></b><small id="score-label"></small></div></div>${run.phase === 'battle' ? `<div class="battle-notice" id="battle-notice" role="status"></div><div class="tutorial" id="tutorial"></div><div class="battle-bottom"><div class="weapon-hud"><span class="weapon-icon">${w.icon}</span><div><b>${w.name} <small>${'I'.repeat(run.rank)}</small></b><span>${run.branch >= 0 ? w.branches[run.branch] : 'Hold primary to fire'}</span></div></div><div class="abilities"><div><kbd>RMB</kbd><span id="alt-label">${run.weapon === 'cinder' ? 'Vent' : run.weapon === 'chakram' ? 'Recall' : run.weapon === 'starfall' ? 'Detonate' : 'Charge shot'}</span></div><div class="energy-ability"><kbd>${keyName(this.settings.bindings.slow)}</kbd><span>Time slow <b id="energy-label"></b></span><div class="meter"><i id="energy-fill"></i></div></div><div><kbd>${keyName(this.settings.bindings.command)}</kbd><span id="command-label">Command knights</span></div></div><div class="movement-hint"><kbd>${keyName(this.settings.bindings.north)}</kbd><kbd>${keyName(this.settings.bindings.west)}</kbd><kbd>${keyName(this.settings.bindings.south)}</kbd><kbd>${keyName(this.settings.bindings.east)}</kbd><span>PHASE BASTION</span></div></div><div class="touch-controls"><div class="touch-directions">${['north', 'west', 'south', 'east'].map((s, i) => `<button data-touch="${s}" aria-label="Phase ${s}">${['↑', '←', '↓', '→'][i]}</button>`).join('')}</div><div class="touch-actions"><button data-touch="alt">Alternate</button><button data-touch="slow">Slow time</button><button data-touch="command">Command</button></div></div>${run.training ? '<div class="training-tools"><button data-action="training-weapon">Change weapon</button><button data-action="training-reset">Reset yard</button><button data-action="preview-end">Leave yard</button></div>' : ''}` : ''}`;
  }
  update(run: RunState) {
    const text = (id: string, value: string) => {
      const el = document.getElementById(id);
      if (el && el.textContent !== value) el.textContent = value;
    };
    text('hp-label', `${Math.ceil(run.hp)} / ${run.maxHp}`);
    text(
      'sector-label',
      `${SECTORS[run.sector].toUpperCase()} BASTION · ${run.enemies.length} HOSTILES`,
    );
    text('gold-label', `◈ ${Math.floor(run.gold)}`);
    text('score-label', `${Math.floor(run.score).toLocaleString()} SCORE`);
    text(
      'wave-progress',
      `${Math.min(run.spawnIndex, run.spawns.length)} / ${run.spawns.length} arrived`,
    );
    text('energy-label', `${Math.ceil(run.energy)}%`);
    text(
      'command-label',
      run.commandCooldown > 0 ? `Command · ${Math.ceil(run.commandCooldown)}s` : 'Command ready',
    );
    text('battle-notice', run.messageTime > 0 ? run.message : '');
    const hp = document.getElementById('hp-fill'),
      energy = document.getElementById('energy-fill');
    if (hp) hp.style.width = `${(run.hp / run.maxHp) * 100}%`;
    if (energy) energy.style.width = `${run.energy}%`;
    if (run.weapon === 'cinder')
      text('alt-label', `Heat ${Math.ceil(run.heat)}%${run.overheated ? ' · OVERHEATED' : ''}`);
    const boss = run.enemies.find((e) => ENEMIES[e.kind].boss),
      bossPanel = document.getElementById('boss-hud');
    if (bossPanel) {
      bossPanel.hidden = !boss;
      if (boss) {
        text('boss-name', ENEMIES[boss.kind].name + (boss.exposed > 0 ? ' · EXPOSED' : ''));
        text('boss-health', `${Math.ceil(Math.max(0, boss.hp))} / ${Math.round(boss.maxHp)}`);
        const fill = document.getElementById('boss-fill')!;
        fill.style.width = `${Math.max(0, boss.hp / boss.maxHp) * 100}%`;
        fill.style.background = boss.exposed > 0 ? '#e4ca89' : '#c58c7a';
      }
    }
    const tips = [
      `Hold left mouse or drag on the battlefield to fire.`,
      `${keyName(this.settings.bindings.north)} ${keyName(this.settings.bindings.west)} ${keyName(this.settings.bindings.south)} ${keyName(this.settings.bindings.east)} · Phase to face another approach. The fortress blocks cross-castle shots.`,
      `Hold ${keyName(this.settings.bindings.slow)} to slow the siege. Your weapon keeps its normal rhythm.`,
      `Aim at a formation and press ${keyName(this.settings.bindings.command)} to command your knights.`,
    ];
    text(
      'tutorial',
      run.training
        ? 'Training is safe. Try a charged shot against the shields.'
        : run.tutorial < 4
          ? tips[run.tutorial]
          : '',
    );
  }
  private shop(run: RunState) {
    const boss = bossAt(run.wave),
      forecast = boss
        ? ENEMIES[boss]
        : run.wave < 3
          ? ENEMIES.shield
          : run.wave < 6
            ? ENEMIES.lancer
            : run.wave < 10
              ? ENEMIES.wizard
              : ENEMIES.ram,
      pad = run.pads[this.selectedPad],
      combos = combinations(run);
    return `<div class="scrim"><section class="planning" role="dialog" aria-modal="true" aria-label="Prepare the fortress"><div class="planning-title"><div><span class="eyebrow">THE SIEGE RELENTS</span><h2>Make the next stand yours.</h2><p>Wave ${run.wave - 1} held. Spend wisely. The light is counting on you.</p></div><span class="purse">◈ ${Math.floor(run.gold)} <small>GOLD</small></span></div><div class="planning-layout"><div><div class="section-label">THE QUARTERMASTER <span>Offers stay until you reroll</span></div><div class="offer-grid">${run.offers
      .map((o, i) => {
        const d = offerInfo(run, o),
          cost = offerCost(run, o),
          blocked =
            o.bought ||
            run.gold < cost ||
            (o.kind === 'structure' && !!pad) ||
            (o.kind === 'order' && run.orderRank >= 3);
        return `<article class="offer ${o.bought ? 'purchased' : ''}"><span class="offer-category">${['YOUR BUILD', 'FORTRESS', 'DISCOVERY'][i]}</span><span class="offer-icon">${d.icon}</span><h3>${d.name}</h3><p>${d.description}</p><small>${d.detail}</small><button class="buy" data-focus="buy-${i}" data-action="buy" data-value="${o.id}" ${blocked ? 'disabled' : ''}>${o.bought ? '✓ Acquired' : o.kind === 'structure' && pad ? 'Select an empty pad' : `Acquire · ${cost} ◈`}</button>${!o.bought ? `<button class="preview-link" data-action="preview" data-value="${o.id}">Try for 10 seconds ↗</button>` : ''}</article>`;
      })
      .join(
        '',
      )}</div><div class="services"><button data-action="repair" data-focus="repair" ${run.gold < 25 || run.hp === run.maxHp ? 'disabled' : ''}>+ Repair 20 HP <span>25 ◈</span></button><button data-action="reroll" data-focus="reroll" ${run.rerolls >= 2 || run.gold < (run.rerolls + 1) * 15 ? 'disabled' : ''}>↻ Reroll offers <span>${run.rerolls >= 2 ? 'Limit reached' : `${(run.rerolls + 1) * 15} ◈`}</span></button><button data-action="codex">View build recipes ↗</button></div><div class="section-label">BASTION PADS <span>Select a sector before constructing</span></div><div class="pad-grid">${SECTORS.map((name, i) => `<button class="pad ${i === this.selectedPad ? 'selected' : ''}" data-action="pad" data-value="${i}" aria-pressed="${i === this.selectedPad}"><span>${name}</span><b>${run.pads[i] ? STRUCTURES[run.pads[i]!.kind].icon : '+'}</b><small>${run.pads[i] ? STRUCTURES[run.pads[i]!.kind].name + ' ' + 'I'.repeat(run.pads[i]!.rank) : 'Empty build pad'}</small></button>`).join('')}</div>${pad ? `<div class="pad-actions"><span>${STRUCTURES[pad.kind].description}</span><button data-action="pad-upgrade" ${pad.rank >= 3 || run.gold < 50 + pad.rank * 25 ? 'disabled' : ''}>${pad.rank >= 3 ? 'Max rank' : `Upgrade · ${50 + pad.rank * 25} ◈`}</button><button data-action="pad-sell" ${run.respecAct === Math.ceil(run.wave / 5) ? 'disabled' : ''}>Salvage 60% · once/act</button></div>` : ''}${run.rank === 3 && run.branch < 0 ? `<div class="branch-choice"><b>Choose your weapon branch</b>${WEAPONS[run.weapon].branches.map((name, i) => `<button data-action="branch" data-value="${i}">${name}</button>`).join('')}</div>` : ''}${run.seals > 0 ? `<div class="capstones"><span>✦ ${run.seals} boss ${run.seals === 1 ? 'seal' : 'seals'}</span>${!run.capstone ? `<button data-action="capstone">Awaken weapon · +35% damage · 1 seal</button>` : ''}${!run.dragonkin && structureRank(run, 'ossuary') ? '<button data-action="dragonkin">Recruit Dragonkin Lord · 1 seal</button>' : ''}</div>` : ''}</div><aside class="forecast"><span class="eyebrow">NEXT ENCOUNTER · WAVE ${run.wave}</span><div class="forecast-icon">${boss ? '♛' : '⚑'}</div><h3>${forecast.name}</h3><p>${forecast.tip}</p><div class="forecast-divider"></div><span class="eyebrow">YOUR WAR MACHINE</span><p class="build-summary">${WEAPONS[run.weapon].name} ${'I'.repeat(run.rank)}${run.branch >= 0 ? ' · ' + WEAPONS[run.weapon].branches[run.branch] : ''}</p><div class="rune-chips">${
      Object.entries(run.runes)
        .map(([k, v]) => `<span>${RUNES[k as keyof typeof RUNES].name} ${v}</span>`)
        .join('') || '<span>No runes inscribed</span>'
    }<small>${Object.keys(run.runes).length} / ${runeSlots(run)} rune slots</small></div><p class="combo-list">${combos.map((id) => `✦ ${COMBINATIONS.find((c) => c.id === id)!.name}`).join('<br/>') || 'Discover combinations in the field guide.'}</p><label class="doctrine">Order doctrine<select data-setting="order"><option value="cavalry" ${run.order === 'cavalry' ? 'selected' : ''}>Cavalry · charge the target</option><option value="aegis" ${run.order === 'aegis' ? 'selected' : ''}>Aegis · 4s fortress brace</option></select></label><div class="ledger"><span class="eyebrow">LAST WAVE INCOME</span><p>Bounties <b>${run.lastLedger.bounties}</b></p><p>Completion <b>${run.lastLedger.completion}</b></p><p>Skill <b>${run.lastLedger.skill}</b></p><p>Treasury <b>${run.lastLedger.treasury}</b></p></div></aside></div><div class="planning-footer"><span>✓ Saved at this planning break <small>Purchases save immediately</small></span><button class="primary" data-action="next" ${run.rank === 3 && run.branch < 0 ? 'disabled' : ''}>Defend wave ${run.wave} <span>→</span></button></div></section></div>`;
  }
  private pause(run: RunState) {
    return `<div class="scrim"><section class="modal pause-menu" role="dialog" aria-modal="true" aria-label="Game paused"><span class="eyebrow">A MOMENT BETWEEN HEARTBEATS</span><h2>The siege can wait.</h2><p>Combat, projectiles, and wave timers are paused.</p><button class="primary" data-action="pause">Return to the battlements →</button><button data-action="settings">Settings & controls</button><button data-action="codex">Field guide & recipes</button><button data-action="menu">Return to title</button><small>${run.training ? 'Training progress is temporary.' : 'Your last planning checkpoint is kept. Returning restarts the current wave.'}</small></section></div>`;
  }
  private event() {
    return `<div class="scrim"><section class="modal event-panel" role="dialog" aria-modal="true" aria-label="Choose the next route"><span class="eyebrow">BEYOND THE BATTLEMENTS</span><h2>A road through the ashes.</h2><p>Your scouts return with three opportunities. Choose one.</p><div class="event-options"><button data-action="event" data-value="engineer"><b>⚒ Rescue the engineer</b><p>Restore 45 fortress HP. Advance the Babel project one stage if Workshop and Tesla are built.</p></button><button data-action="event" data-value="vault"><b>◈ Break the contested vault</b><p>Gain 100 gold. The skirmish costs 25 fortress HP, leaving at least 1.</p></button><button data-action="event" data-value="shrine"><b>✦ Enter the corrupted shrine</b><p>Gain a boss seal for a capstone. Permanently sacrifice 20 maximum HP this run.</p></button></div></section></div>`;
  }
  private result(run: RunState) {
    const won = run.phase === 'victory',
      source = Object.entries(run.damageTaken).sort((a, b) => b[1] - a[1]),
      tip = Object.values(ENEMIES).find((e) => e.name === run.lastThreat)?.tip;
    return `<div class="scrim"><section class="modal result" role="dialog" aria-modal="true" aria-label="Siege results"><span class="eyebrow">${won ? 'THE HOLLOW CROWN IS BROKEN' : 'THE LIGHT WILL RISE AGAIN'}</span><h2>${won ? 'The kingdom has a dawn.' : 'The last wall falls.'}</h2><p>${won ? 'Fifteen waves. Three fallen tyrants. Your fortress held.' : `${esc(run.lastThreat || 'The siege')} breached the ${SECTORS[run.lastSector].toLowerCase()} bastion on wave ${run.wave}.`}</p><div class="result-stats"><div><b>${Math.floor(run.score).toLocaleString()}</b><span>SCORE</span></div><div><b>${run.completedWaves}</b><span>WAVES HELD</span></div><div><b>${run.bosses.length}</b><span>BOSSES DEFEATED</span></div></div><p><b>${WEAPONS[run.weapon].name} ${'I'.repeat(run.rank)}</b> · ${run.branch >= 0 ? WEAPONS[run.weapon].branches[run.branch] : 'Unbranched'} · ${run.difficulty}</p><div class="rune-chips">${Object.entries(
      run.runes,
    )
      .map(([id, rank]) => `<span>${RUNES[id as keyof typeof RUNES].name} ${rank}</span>`)
      .join('')}${run.pads
      .filter(Boolean)
      .map((p) => `<span>${STRUCTURES[p!.kind].name} ${p!.rank}</span>`)
      .join('')}</div><p class="combo-list">${
      combinations(run)
        .map((id) => COMBINATIONS.find((c) => c.id === id)!.name)
        .join(' · ') || 'No signature combination this run'
    }</p>${
      !won
        ? `<div class="loss-tip"><b>For the next stand</b><p>${esc(tip || 'Build a defense on your busiest sector, and use time slow to answer a marked attack.')}</p><small>Damage taken: ${source
            .slice(0, 3)
            .map(([k, v]) => `${esc(k)} ${Math.round(v)}`)
            .join(' · ')}</small></div>`
        : '<p>The standard campaign is complete. Endless mode adds 8% enemy strength per wave.</p>'
    }<div class="result-actions"><button class="primary" data-action="retry">Make another stand →</button>${won ? '<button data-action="endless">Continue into endless</button>' : ''}<button data-action="menu">Return to title</button></div><small>Run seed ${run.seed} · Rules v2 · ${Math.floor(run.time / 60)}m ${Math.floor(run.time % 60)}s active time</small></section></div>`;
  }
  private settingsPanel() {
    const toggle = (key: keyof Settings, label: string) =>
      `<label class="setting-row"><span>${label}</span><input data-setting="${key}" type="checkbox" ${this.settings[key] ? 'checked' : ''}/></label>`;
    return `<div class="scrim"><section class="modal settings" role="dialog" aria-modal="true" aria-label="Settings"><div class="modal-heading"><h2>Make it yours.</h2><button data-action="close-modal" aria-label="Close settings">✕</button></div><span class="eyebrow">COMFORT & ACCESSIBILITY</span>${toggle('motion', 'Motion and animated poses')}${toggle('effects', 'Decorative effects and hit flashes')}${toggle('numbers', 'Damage numbers')}${toggle('slowToggle', 'Toggle time slow instead of holding')}${toggle('orbit', 'Pointer orbit movement preset')}<label class="setting-row"><span>Interface scale</span><select data-setting="uiScale"><option value="1" ${this.settings.uiScale === 1 ? 'selected' : ''}>Standard</option><option value="1.15" ${this.settings.uiScale === 1.15 ? 'selected' : ''}>Large</option></select></label><span class="eyebrow">AUDIO</span>${['sfx', 'music'].map((k) => `<label class="setting-row"><span>${k === 'sfx' ? 'Battle effects' : 'Siege ambience'}</span><input aria-label="${k === 'sfx' ? 'Battle effects volume' : 'Ambience volume'}" data-setting="${k}" type="range" min="0" max="1" step=".05" value="${this.settings[k as 'sfx' | 'music']}"/></label>`).join('')}<span class="eyebrow">KEY BINDINGS · SELECT A FIELD AND PRESS A KEY</span><div class="bindings">${Object.entries(
      this.settings.bindings,
    )
      .map(
        ([name, code]) =>
          `<label>${name}<input data-binding="${name}" aria-label="${name} key binding" value="${keyName(code)}" readonly/></label>`,
      )
      .join(
        '',
      )}</div><p>Mouse / touch drag: aim and fire. Right mouse / Alternate: weapon action. Escape: pause. Losing focus pauses the game. Touch action buttons appear on touch devices; landscape gives the most room.</p><p>Story grants 260 HP, longer warnings, and 35% less incoming damage. Veteran has shorter warnings and stronger enemies. Telegraph boundaries remain visible with effects disabled.</p><button data-action="reset-settings">Restore default settings</button></section></div>`;
  }
  private codex(run: RunState) {
    const active = combinations(run);
    return `<div class="scrim"><section class="modal codex" role="dialog" aria-modal="true" aria-label="Field guide"><div class="modal-heading"><div><span class="eyebrow">THE COMMANDER'S FIELD GUIDE</span><h2>Power has a shape.</h2></div><button data-action="close-modal" aria-label="Close field guide">✕</button></div><p>One weapon. Three rune slots, unlocked by wave 6. Four build pads. A knight order. Boss seals awaken your weapon or recruit a spectral dragon.</p><div class="codex-grid">${COMBINATIONS.map((c) => `<article class="${active.includes(c.id) ? 'active-recipe' : ''}"><span class="eyebrow">${active.includes(c.id) ? '✦ ACTIVE' : this.profile.discoveries.includes(c.id) ? 'DISCOVERED' : 'RECIPE'}</span><h3>${c.name}</h3><b>${c.recipe}</b><p>${c.description}</p></article>`).join('')}</div><h3>Know your weapon</h3><div class="weapon-guide">${Object.values(
      WEAPONS,
    )
      .map((w) => `<p><b>${w.icon} ${w.name}</b><br/>${w.alt}<br/><small>${w.weakness}</small></p>`)
      .join('')}</div><h3>Know your enemy</h3><div class="weapon-guide">${Object.values(ENEMIES)
      .map((e) => `<p><b>${e.name}</b><br/>${e.tip}</p>`)
      .join(
        '',
      )}</div><p>Personal victories: ${this.profile.victories} · Best score: ${this.profile.best}${this.profile.legacyBest ? ` · Classic best (separate rules): ${this.profile.legacyBest}` : ''}</p></section></div>`;
  }
}
