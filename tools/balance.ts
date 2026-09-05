/** Deterministic, perfect-information aiming harness; not a human difficulty assessment. */
import { WEAPONS, ENEMIES, CENTER, type WeaponId, type Sector } from '../src/game/data/catalog';
import { createRun, distance } from '../src/game/simulation/RunState';
import { beginWave } from '../src/game/simulation/WaveDirector';
import { step } from '../src/game/simulation/Simulation';
import {
  buyOffer,
  chooseEvent,
  generateOffers,
  repair,
  upgradePad,
} from '../src/game/simulation/EconomySystem';
import { emptyControls } from '../src/game/simulation/types';
for (const weapon of Object.keys(WEAPONS) as WeaponId[]) {
  const r = createRun(7242026, weapon, 'standard');
  beginWave(r);
  const input = emptyControls();
  const waves: { wave: number; seconds: number; hp: number; gold: number }[] = [];
  let ticks = 0;
  while (ticks++ < 60 * 2400) {
    if (r.phase === 'defeat' || r.phase === 'victory') break;
    if (r.phase === 'shop' || r.phase === 'event') {
      waves.push({
        wave: r.wave - 1,
        seconds: Math.round(r.waveTime),
        hp: Math.round(r.hp),
        gold: r.gold,
      });
      if (r.phase === 'event') chooseEvent(r, 'engineer');
      if (!r.offers.length) generateOffers(r);
      while (r.hp < r.maxHp - 15 && r.gold >= 25) repair(r);
      for (const o of r.offers) {
        const pad = r.pads.findIndex((p) => !p);
        if (o.kind === 'structure' && pad < 0) continue;
        buyOffer(r, o.id, Math.max(0, pad) as Sector);
      }
      if (r.rank === 3 && r.branch < 0)
        r.branch = weapon === 'sunlance' || weapon === 'chakram' ? 1 : 0;
      if (r.seals > 0 && !r.capstone) {
        r.seals--;
        r.capstone = true;
      }
      for (let i = 0; i < 4; i++) if (r.gold > 170) upgradePad(r, i as Sector);
      beginWave(r);
    }
    const target = [...r.enemies]
      .filter((e) => !e.dead)
      .sort((a, b) => {
        const priority = (e: typeof a) =>
          ENEMIES[e.kind].boss
            ? e.windup > 0
              ? -300
              : 350
            : distance(e, CENTER) - (e.kind === 'cleric' ? 80 : 0);
        return priority(a) - priority(b);
      })[0];
    input.fire = !!target;
    input.command = !!target;
    input.alt = false;
    input.slow = false;
    if (target) {
      input.aim = { x: target.x, y: target.y };
      const angle = Math.atan2((target.y - CENTER.y) / 122, (target.x - CENTER.x) / 154);
      input.sector = ((Math.round(angle / (Math.PI / 2)) + 1 + 4) % 4) as Sector;
      if (weapon === 'stormbow' || weapon === 'sunlance')
        input.alt = (target.kind === 'shield' || !!ENEMIES[target.kind].boss) && r.charge < 0.97;
      if (weapon === 'cinder') input.alt = r.heat > 70;
      input.slow = !!ENEMIES[target.kind].boss && target.windup > 0 && r.energy > 10;
    }
    step(r, input);
  }
  console.log(
    JSON.stringify({
      weapon,
      result: r.phase,
      wave: r.wave,
      activeSeconds: Math.round(r.time),
      hp: Math.round(r.hp),
      gold: r.gold,
      score: Math.round(r.score),
      damage: r.damageBySource,
      taken: r.damageTaken,
      waves,
    }),
  );
}
