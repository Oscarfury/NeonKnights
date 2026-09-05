import { CENTER, ENEMIES, type Sector } from '../data/catalog';
import { distance, notifyRun, structureRank } from './RunState';
import type { Attack, Enemy, Point, RunState } from './types';
export function effect(
  run: RunState,
  kind: RunState['effects'][number]['kind'],
  point: Point,
  color: string,
  life = 0.35,
  extra: Partial<RunState['effects'][number]> = {},
) {
  if (run.effects.length >= 180) run.effects.shift();
  run.effects.push({ ...point, kind, color, life, maxLife: life, ...extra });
}
export function makeAttack(
  run: RunState,
  source: Attack['source'],
  damage: number,
  weapon: Attack['weapon'] = 'bolt',
  charge = 0,
): Attack {
  return {
    id: run.nextId++,
    source,
    weapon,
    damage,
    charge,
    chain: source === 'player' ? run.runes.chain || 0 : 0,
    poison: source === 'player' && !!run.runes.venom,
    hit: [],
    guardBreak: charge >= 0.5,
  };
}
export function damageEnemy(
  run: RunState,
  enemy: Enemy,
  attack: Attack,
  origin: Point,
  secondary = false,
): number {
  if (enemy.dead || attack.hit.includes(enemy.id)) return 0;
  attack.hit.push(enemy.id);
  let amount = attack.damage;
  const exposed = enemy.exposed > 0 || (enemy.kind !== 'shield' && !ENEMIES[enemy.kind].boss);
  if (enemy.kind === 'shield' && !exposed && !attack.guardBreak) {
    const facing = Math.atan2(CENTER.y - enemy.y, CENTER.x - enemy.x),
      incoming = Math.atan2(origin.y - enemy.y, origin.x - enemy.x);
    if (Math.cos(facing - incoming) > 0.45) amount *= 0.3;
  }
  if (enemy.kind === 'king' && enemy.exposed <= 0) amount *= 0.25;
  if (ENEMIES[enemy.kind].boss && enemy.exposed > 0) amount *= 1.35;
  if (attack.guardBreak) {
    enemy.exposed = Math.max(enemy.exposed, 1.2);
    if (!ENEMIES[enemy.kind].boss) {
      enemy.windup = 0;
      enemy.timer = 1;
    }
  }
  if (attack.source === 'player' && run.runes.precision && exposed && distance(run.aim, enemy) < 18)
    amount *= 1.4;
  if (enemy.kind === 'golem' && attack.source === 'player') {
    for (let side = 0; side < 2; side++)
      if (
        enemy.limbs[side] > 0 &&
        distance(run.aim, { x: enemy.x + (side ? 48 : -48), y: enemy.y }) < 26
      ) {
        enemy.limbs[side] = Math.max(0, enemy.limbs[side] - amount * 1.5);
        if (enemy.limbs[side] === 0) {
          enemy.exposed = 4;
          notifyRun(run, 'Golem arm shattered · attack disabled');
          effect(run, 'ring', run.aim, '#f3cd83', 0.7, { radius: 65 });
        }
      }
  }
  if (
    ENEMIES[enemy.kind].boss &&
    enemy.windup > 0 &&
    attack.source === 'player' &&
    distance(run.aim, enemy) < 30
  ) {
    enemy.stagger += amount;
    if (enemy.stagger >= enemy.maxHp * 0.045) {
      enemy.windup = 0;
      enemy.timer = 3;
      enemy.exposed = 3;
      notifyRun(run, 'Interrupted · weak point exposed');
    }
  }
  const applied = Math.min(Math.max(0, enemy.hp), amount);
  enemy.hp -= amount;
  enemy.hitFlash = 0.12;
  run.damageBySource[attack.source] = (run.damageBySource[attack.source] || 0) + applied;
  if (attack.poison && !secondary) {
    enemy.poison = Math.min(5, enemy.poison + 1);
    enemy.poisonTime = 3;
  }
  effect(run, 'hit', enemy, secondary ? '#b6a2fa' : '#e7d8b5', 0.18, {
    radius: Math.min(20, 5 + amount / 10),
  });
  if (attack.source === 'player' && amount >= 45)
    effect(run, 'text', { x: enemy.x, y: enemy.y - 24 }, '#f1d39b', 0.65, {
      text: String(Math.round(amount)),
    });
  if (enemy.hp <= 0) killEnemy(run, enemy, attack.source);
  if (!secondary && attack.chain > 0) {
    let originEnemy = enemy;
    for (let i = 0; i < attack.chain; i++) {
      const target = run.enemies
        .filter((e) => !e.dead && !attack.hit.includes(e.id) && distance(e, originEnemy) < 155)
        .sort((a, b) => distance(a, originEnemy) - distance(b, originEnemy))[0];
      if (!target) break;
      effect(run, 'line', originEnemy, '#8df5ea', 0.25, { x2: target.x, y2: target.y });
      damageEnemy(
        run,
        target,
        { ...attack, damage: attack.damage * Math.pow(0.55, i + 1), chain: 0, poison: false },
        originEnemy,
        true,
      );
      originEnemy = target;
    }
  }
  return amount;
}
export function killEnemy(run: RunState, enemy: Enemy, source: Attack['source']) {
  if (enemy.dead) return;
  enemy.dead = true;
  run.kills++;
  run.combo = Math.min(10, run.combo + 0.1);
  run.score += Math.round((10 + ENEMIES[enemy.kind].bounty) * run.combo);
  if (enemy.reward) {
    const bounty = ENEMIES[enemy.kind].bounty;
    run.gold += bounty;
    run.ledger.bounties += bounty;
    const treasury = structureRank(run, 'treasury');
    const bonus = Math.min(
      treasury * 15 - run.ledger.treasury,
      Math.floor(run.ledger.bounties * 0.15 * treasury) - run.ledger.treasury,
    );
    if (bonus > 0) {
      run.gold += bonus;
      run.ledger.treasury += bonus;
    }
    if (structureRank(run, 'ossuary')) {
      run.souls = Math.min(6, run.souls + 1);
      if (run.slow && source !== 'squad') run.echoes = Math.min(3, run.echoes + 1);
    }
  }
  if (ENEMIES[enemy.kind].boss) {
    run.seals++;
    run.bosses.push(enemy.kind);
    notifyRun(run, `${ENEMIES[enemy.kind].name} defeated · Boss seal earned`);
    effect(run, 'ring', enemy, '#f5d991', 1, { radius: 130 });
  }
  effect(run, 'ring', enemy, '#bc746e', 0.4, { radius: 24 });
}
export function hurtFortress(run: RunState, amount: number, kind: string, sector: Sector) {
  if (run.phase !== 'battle' || run.training) return;
  const pad = run.pads[sector],
    armor = pad?.kind === 'aegis' ? Math.min(0.65, pad.rank * 0.3) : 0;
  const brace = run.order === 'aegis' && run.commandCooldown > 8 ? 0.5 : 0;
  let dealt = amount * (1 - Math.min(0.8, armor + brace));
  if (run.difficulty === 'story') dealt *= 0.65;
  else if (run.difficulty === 'veteran') dealt *= 1.2;
  if (run.weapon === 'cinder' && armor) run.radiance = Math.min(60, run.radiance + amount - dealt);
  run.hp = Math.max(0, run.hp - dealt);
  run.combo = Math.max(1, run.combo - 0.5);
  run.lastThreat = kind;
  run.lastSector = sector;
  run.damageTaken[kind] = (run.damageTaken[kind] || 0) + dealt;
  effect(run, 'ring', CENTER, '#ff9b7f', 0.35, { radius: 150 });
  if (run.hp === 0) {
    run.phase = 'defeat';
    run.slow = false;
    run.revision++;
  }
}
export function blast(run: RunState, point: Point, radius: number, attack: Attack) {
  effect(run, 'ring', point, attack.weapon === 'cinder' ? '#f79d61' : '#b7d1ff', 0.5, { radius });
  for (const enemy of run.enemies)
    if (!enemy.dead && distance(point, enemy) < radius + ENEMIES[enemy.kind].radius)
      damageEnemy(run, enemy, attack, point);
}
export function segmentDistance(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    len = dx * dx + dy * dy,
    t = len ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len)) : 0;
  return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
}
export function obstructed(origin: Point, target: Point): boolean {
  const a = { x: (origin.x - CENTER.x) / 113, y: (origin.y - CENTER.y) / 83 },
    b = { x: (target.x - CENTER.x) / 113, y: (target.y - CENTER.y) / 83 };
  return segmentDistance({ x: 0, y: 0 }, a, b) < 1;
}
