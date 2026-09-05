import { ANCHORS, ENEMIES } from '../data/catalog';
import { combinations } from './EconomySystem';
import { distance, structureRank } from './RunState';
import { blast, damageEnemy, effect, makeAttack } from './CombatSystem';
import { projectile } from './WeaponSystem';
import type { RunState } from './types';
export function commandSquad(run: RunState) {
  if (run.commandCooldown > 0 || run.phase !== 'battle' || run.paused) return;
  run.commandCooldown = 12;
  const combos = combinations(run),
    spectral = structureRank(run, 'ossuary') > 0 && run.souls > 0;
  let count = 1 + run.orderRank;
  if (spectral) {
    count += Math.min(2, run.souls);
    run.souls = Math.max(0, run.souls - 2);
  }
  if (combos.includes('midas') && run.gold >= 10) {
    run.gold -= 10;
    run.ledger.spent += 10;
    count += 2;
  }
  for (let i = 0; i < count && run.knights.length < 6; i++)
    run.knights.push({
      id: run.nextId++,
      x: run.player.x + (i - 1) * 15,
      y: run.player.y,
      life: 8,
      cooldown: 0,
      spectral,
      dragon: false,
      target: { ...run.aim },
    });
  effect(run, 'ring', run.aim, run.order === 'aegis' ? '#f1d297' : '#83ead8', 0.6, { radius: 70 });
}
export function updateSquad(run: RunState, dt: number) {
  const combos = combinations(run);
  for (const k of run.knights) {
    k.life -= dt;
    k.cooldown -= dt;
    const enemy = run.enemies
      .filter((e) => !e.dead)
      .sort((a, b) => distance(a, k.target) - distance(b, k.target))[0];
    const target = enemy || k.target,
      dist = distance(k, target);
    if (dist > 34) {
      k.x += ((target.x - k.x) / dist) * 125 * dt;
      k.y += ((target.y - k.y) / dist) * 125 * dt;
    }
    if (enemy && dist < (k.dragon ? 240 : 65) && k.cooldown <= 0) {
      k.cooldown = k.dragon ? 1.3 : 0.8;
      const attack = makeAttack(run, 'squad', k.dragon ? 55 : 17 + run.orderRank * 4, 'soul');
      attack.chain = combos.includes('storm') ? 1 : 0;
      damageEnemy(run, enemy, attack, k);
      effect(run, 'line', k, k.spectral ? '#baa6f2' : '#bfe4dd', 0.18, {
        x2: enemy.x,
        y2: enemy.y,
      });
      if (combos.includes('angel') && run.healed < 16) {
        const heal = Math.min(8, 16 - run.healed);
        run.hp = Math.min(run.maxHp, run.hp + heal);
        run.healed += heal;
      }
    }
  }
  run.knights = run.knights.filter((k) => k.life > 0);
  for (let i = 0; i < run.pads.length; i++) {
    const pad = run.pads[i];
    if (!pad) continue;
    pad.built = Math.min(1, pad.built + dt / 0.8);
    pad.cooldown -= dt;
    const targets = run.enemies
      .filter((e) => !e.dead && e.sector === i)
      .sort((a, b) => distance(a, ANCHORS[i]) - distance(b, ANCHORS[i]));
    if (pad.cooldown > 0 || !targets.length) continue;
    const enemy = targets[0],
      origin = ANCHORS[i];
    if (pad.kind === 'ballista') {
      pad.cooldown = 1.3;
      projectile(
        run,
        origin,
        Math.atan2(enemy.y - origin.y, enemy.x - origin.x),
        500,
        makeAttack(run, 'structure', 26 * pad.rank),
      );
    }
    if (pad.kind === 'tesla') {
      pad.cooldown = 1.5;
      const attack = makeAttack(run, 'structure', 18 * pad.rank);
      attack.chain = 2;
      damageEnemy(run, enemy, attack, origin);
      effect(run, 'line', origin, '#87e5ee', 0.25, { x2: enemy.x, y2: enemy.y });
    }
    if (pad.kind === 'moat') {
      pad.cooldown = 0.5;
      for (const e of targets)
        if (e.kind !== 'pegasus' && distance(e, origin) < 135)
          damageEnemy(run, e, makeAttack(run, 'structure', 5 * pad.rank), origin);
    }
  }
  if (
    combos.includes('babel') &&
    Math.floor(run.worldTime / 3) !== Math.floor((run.worldTime - dt) / 3)
  )
    blast(run, { x: 640, y: 420 }, 450, makeAttack(run, 'structure', 60));
}
