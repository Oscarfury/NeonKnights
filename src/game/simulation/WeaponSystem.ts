import { WEAPONS, weaponStats, ENEMIES } from '../data/catalog';
import { distance, notifyRun } from './RunState';
import {
  blast,
  damageEnemy,
  effect,
  makeAttack,
  obstructed,
  segmentDistance,
} from './CombatSystem';
import type { Attack, Point, RunState } from './types';
export function projectile(
  run: RunState,
  origin: Point,
  angle: number,
  speed: number,
  attack: Attack,
  pierce = 0,
) {
  if (run.projectiles.length >= 250) return;
  run.projectiles.push({
    ...origin,
    id: run.nextId++,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 2.4,
    age: 0,
    radius: attack.weapon === 'chakram' ? 17 : 4,
    attack,
    pierce,
    returning: false,
    returnHit: [],
  });
}
export function fireWeapon(run: RunState, charge = 0): boolean {
  if (
    run.phase !== 'battle' ||
    run.paused ||
    run.fireCooldown > 0 ||
    run.overheated ||
    obstructed(run.player, run.aim)
  )
    return false;
  const stats = weaponStats(run.weapon, run.rank, run.runes.rapid || 0),
    angle = Math.atan2(run.aim.y - run.player.y, run.aim.x - run.player.x);
  const powered = run.momentum > 0 && !!run.runes.momentum;
  const damage =
    stats.damage * (1 + charge * 1.8) * (powered ? 1.45 : 1) * (run.capstone ? 1.35 : 1);
  const attack = makeAttack(run, 'player', damage, run.weapon, charge);
  run.momentum = 0;
  run.fireCooldown = stats.interval;
  run.tutorial = Math.max(1, run.tutorial);
  if (run.capstone && run.weapon === 'stormbow' && charge >= 0.5)
    attack.chain = Math.max(3, attack.chain);
  const spread =
    (run.runes.multishot || 0) +
    (run.weapon === 'stormbow' && run.branch === 0 ? 1 : 0) +
    (run.capstone && run.weapon === 'chakram' ? 1 : 0);
  if (run.weapon === 'stormbow' || run.weapon === 'chakram') {
    projectile(
      run,
      run.player,
      angle,
      run.weapon === 'chakram' ? 365 : 690,
      attack,
      charge >= 0.5 ? 4 : 0,
    );
    for (let i = 1; i <= spread; i++)
      for (const sign of [-1, 1])
        projectile(
          run,
          run.player,
          angle + sign * 0.14 * i,
          run.weapon === 'chakram' ? 365 : 690,
          { ...attack, damage: damage * 0.3 },
          charge >= 0.5 ? 2 : 0,
        );
    if (run.weapon === 'stormbow' && run.branch === 1 && charge >= 0.5)
      run.projectiles[run.projectiles.length - 1].attack.damage *= 1.4;
  } else if (run.weapon === 'sunlance') {
    attack.guardBreak = charge >= 0.35 || run.branch === 1;
    const end = {
      x: run.player.x + Math.cos(angle) * 1100,
      y: run.player.y + Math.sin(angle) * 1100,
    };
    effect(run, 'line', run.player, '#ffe0a0', 0.22, {
      x2: end.x,
      y2: end.y,
      radius: charge * 8 + 3,
    });
    const targets = run.enemies
      .filter(
        (e) =>
          !e.dead && segmentDistance(e, run.player, end) < ENEMIES[e.kind].radius + 5 + charge * 10,
      )
      .sort((a, b) => distance(a, run.player) - distance(b, run.player));
    for (const target of targets) damageEnemy(run, target, attack, run.player);
    if (run.capstone && charge >= 0.9)
      blast(run, run.aim, 85, makeAttack(run, 'player', damage * 0.4, 'sunlance'));
    if (run.branch === 0 && targets.length) {
      const last = targets[targets.length - 1],
        next = run.enemies.find(
          (e) => !e.dead && !attack.hit.includes(e.id) && distance(e, last) < 240,
        );
      if (next) {
        effect(run, 'line', last, '#f3cd83', 0.3, { x2: next.x, y2: next.y });
        damageEnemy(run, next, { ...attack, damage: damage * 0.6 }, last);
      }
    }
  } else if (run.weapon === 'cinder') {
    const range = run.branch === 0 ? 350 : 280,
      width = 0.38 + spread * 0.12;
    effect(run, 'line', run.player, '#ed9869', 0.15, {
      x2: run.player.x + Math.cos(angle) * range,
      y2: run.player.y + Math.sin(angle) * range,
      radius: 22,
    });
    for (const enemy of run.enemies)
      if (
        !enemy.dead &&
        distance(run.player, enemy) < range &&
        Math.cos(Math.atan2(enemy.y - run.player.y, enemy.x - run.player.x) - angle) >
          Math.cos(width)
      )
        damageEnemy(run, enemy, attack, run.player);
    run.heat = Math.min(100, run.heat + (run.branch === 0 ? 3.2 : 4.5));
    if (run.heat >= 100) {
      run.overheated = true;
      notifyRun(run, 'Engine overheated · Vent to cool');
    }
  } else {
    run.marks.push({
      ...run.aim,
      id: run.nextId++,
      life: 1.1,
      radius: run.branch === 0 ? 112 : 80,
      attack,
    });
    if (run.capstone)
      run.marks.push({
        ...run.aim,
        id: run.nextId++,
        life: 1.7,
        radius: 70,
        attack: makeAttack(run, 'player', damage * 0.4, 'starfall'),
      });
    if (
      run.runes.precision &&
      run.orbitalCooldown <= 0 &&
      run.enemies.some((e) => !e.dead && e.exposed > 0 && distance(e, run.aim) < 35)
    ) {
      run.orbitalCooldown = 6;
      run.marks.push({
        ...run.aim,
        id: run.nextId++,
        life: 1.65,
        radius: 55,
        attack: { ...makeAttack(run, 'player', damage * 1.5, 'starfall'), guardBreak: true },
        orbital: true,
      });
      notifyRun(run, 'Orbital Verdict · Target locked');
    }
  }
  return true;
}
export function alternate(run: RunState) {
  if (run.altCooldown > 0 || run.paused || run.phase !== 'battle') return;
  if (run.weapon === 'cinder') {
    const stored = run.radiance;
    run.radiance = 0;
    run.heat = Math.max(0, run.heat - 65);
    run.overheated = false;
    run.altCooldown = run.capstone ? 1.5 : 3;
    const range = 230;
    for (const enemy of run.enemies)
      if (!enemy.dead && !ENEMIES[enemy.kind].boss && distance(enemy, run.player) < range) {
        const a = Math.atan2(enemy.y - run.player.y, enemy.x - run.player.x);
        enemy.x += Math.cos(a) * 55;
        enemy.y += Math.sin(a) * 55;
        enemy.exposed = 1;
      }
    blast(run, run.player, range, makeAttack(run, 'player', 12 + stored, 'cinder'));
    if (run.branch === 1)
      run.marks.push({
        ...run.aim,
        id: run.nextId++,
        life: 1.5,
        radius: 110,
        attack: makeAttack(run, 'player', 80, 'cinder'),
      });
  } else if (run.weapon === 'chakram') {
    for (const p of run.projectiles)
      if (p.attack.weapon === 'chakram' && !p.returning) {
        p.returning = true;
        p.attack = {
          ...p.attack,
          hit: [],
          damage: p.attack.damage * (run.branch === 1 ? 1.65 : 1),
        };
      }
    run.altCooldown = 0.4;
  } else if (run.weapon === 'starfall') {
    for (const mark of run.marks) if (mark.attack.source === 'player') mark.life = 0;
    run.altCooldown = 0.35;
  }
}
export function updateProjectiles(run: RunState, dt: number) {
  for (const p of run.projectiles) {
    p.life -= dt;
    p.age += dt;
    if (p.attack.weapon === 'chakram') {
      if (!p.returning && p.age > 0.72) {
        p.returning = true;
        p.attack = {
          ...p.attack,
          hit: [],
          damage: p.attack.damage * (run.branch === 1 ? 1.65 : 1),
        };
      }
      if (p.returning) {
        if (run.branch === 0 && p.age < 1.75) {
          const a = p.age * 8;
          p.vx = (run.player.x + Math.cos(a) * 95 - p.x) * 5;
          p.vy = (run.player.y + Math.sin(a) * 95 - p.y) * 5;
        } else {
          const angle = Math.atan2(run.player.y - p.y, run.player.x - p.x);
          p.vx = Math.cos(angle) * 470;
          p.vy = Math.sin(angle) * 470;
          if (distance(p, run.player) < 20) p.life = 0;
        }
      }
    }
    const old = { x: p.x, y: p.y };
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life <= 0) continue;
    for (const enemy of run.enemies) {
      if (enemy.dead || p.attack.hit.includes(enemy.id)) continue;
      if (segmentDistance(enemy, old, p) < ENEMIES[enemy.kind].radius + p.radius) {
        damageEnemy(run, enemy, p.attack, old);
        if (p.attack.weapon !== 'chakram' && p.pierce-- <= 0) {
          p.life = 0;
          break;
        }
      }
    }
  }
  run.projectiles = run.projectiles.filter((p) => p.life > 0);
  for (const mark of run.marks) {
    mark.life -= dt;
    if (mark.life <= 0) {
      let attack = mark.attack;
      if (
        run.weapon === 'starfall' &&
        run.branch === 1 &&
        run.enemies.some(
          (e) => ENEMIES[e.kind].boss && e.exposed > 0 && distance(e, mark) < mark.radius,
        )
      )
        attack = { ...attack, damage: attack.damage * 1.6 };
      blast(run, mark, mark.radius, attack);
    }
  }
  run.marks = run.marks.filter((m) => m.life > 0);
}
