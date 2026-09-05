import { ENEMIES, type EnemyId, type Sector } from '../data/catalog';
import { random, emptyLedger, notifyRun, structureRank } from './RunState';
import type { RunState, Spawn, Enemy } from './types';
export const bossAt = (wave: number): EnemyId | null =>
  wave === 5
    ? 'dragon'
    : wave === 10
      ? 'golem'
      : wave === 15
        ? 'king'
        : wave > 15 && wave % 5 === 0
          ? (['dragon', 'golem', 'king'][Math.floor(wave / 5) % 3] as EnemyId)
          : null;
export function planWave(run: RunState): Spawn[] {
  const wave = run.wave,
    act = Math.min(2, Math.floor((wave - 1) / 5)),
    result: Spawn[] = [];
  const add = (time: number, kind: EnemyId, sector: Sector, count = 1) => {
    for (let i = 0; i < count; i++)
      result.push({
        time: time + i * 0.65,
        kind,
        sector,
        offset: (random(run) - 0.5) * 95,
        reward: true,
      });
  };
  const boss = bossAt(wave);
  if (boss) {
    add(1.5, boss, wave === 10 ? 2 : 0);
    add(7, 'squire', 1, 3 + act);
    add(17, 'shield', 3, 2 + act);
    add(29, 'lancer', 2, 2 + act);
  } else {
    const groups = wave === 1 ? 3 : 4 + act;
    for (let g = 0; g < groups; g++) {
      const sector = ((g + wave) % 4) as Sector,
        time = g * (wave === 1 ? 7 : 9);
      add(time, 'squire', sector, 2 + act);
      if (wave >= 2 && g % 2 === 0) add(time + 1, 'shield', sector);
      if (wave >= 3 && g % 2 === 1) add(time + 2, 'lancer', sector, 1 + act);
      if (wave >= 4 && g === 1) add(time, 'cleric', sector);
      if (wave >= 6 && g === 2) add(time + 1, 'wizard', sector);
      if (wave >= 7 && g === 3) add(time, 'pegasus', sector, 2);
      if (wave >= 8 && g === 0) add(time + 2, 'ram', sector);
      if (wave >= 9 && g === 2) add(time + 3, 'rogue', ((sector + 2) % 4) as Sector, 2);
      if (wave >= 12 && g === 4) add(time + 2, 'ram', sector, 2);
    }
  }
  return result.sort((a, b) => a.time - b.time);
}
export function spawnEnemy(run: RunState, spawn: Spawn): Enemy {
  const d = ENEMIES[spawn.kind],
    scale =
      (1 + Math.min(2, Math.floor((run.wave - 1) / 5)) * 0.2) *
      (run.wave > 15 ? 1 + (run.wave - 15) * 0.08 : 1);
  const points = [
    { x: 640 + spawn.offset, y: 78 },
    { x: 1210, y: 420 + spawn.offset },
    { x: 640 + spawn.offset, y: 750 },
    { x: 70, y: 420 + spawn.offset },
  ];
  const pos = points[spawn.sector];
  if (d.boss) {
    pos.x = 640;
    pos.y = spawn.sector === 2 ? 670 : 200;
  }
  const hp =
    d.hp *
    (d.boss ? 1 : scale) *
    (run.difficulty === 'story' ? 0.85 : run.difficulty === 'veteran' ? 1.15 : 1);
  const enemy: Enemy = {
    ...pos,
    id: run.nextId++,
    kind: spawn.kind,
    hp,
    maxHp: hp,
    sector: spawn.sector,
    attackSector: spawn.sector,
    timer: d.boss ? 4 : 2,
    windup: 0,
    exposed: 0,
    stagger: 0,
    poison: 0,
    poisonTime: 0,
    statusTick: 0,
    dead: false,
    reward: spawn.reward,
    summons: 0,
    phase: 1,
    limbs: [d.boss ? hp * 0.16 : 0, d.boss ? hp * 0.16 : 0],
    hitFlash: 0,
  };
  run.enemies.push(enemy);
  return enemy;
}
export function beginWave(run: RunState) {
  run.phase = 'battle';
  run.paused = false;
  run.waveTime = 0;
  run.enemies = [];
  run.projectiles = [];
  run.marks = [];
  run.effects = [];
  run.knights = [];
  run.energy = 100;
  run.slow = false;
  run.slowLocked = false;
  run.fireCooldown = 0;
  run.charge = 0;
  run.heat = 0;
  run.overheated = false;
  run.commandCooldown = 0;
  run.altCooldown = 0;
  run.orbitalCooldown = 0;
  run.momentum = 0;
  run.momentumCooldown = 0;
  run.regenDelay = 0;
  for (const pad of run.pads) if (pad) pad.cooldown = 0;
  run.healed = 0;
  run.echoes = 0;
  run.rerolls = 0;
  run.ledger = emptyLedger();
  run.spawnIndex = 0;
  run.spawns = planWave(run);
  run.revision++;
  if (run.dragonkin)
    run.knights.push({
      id: run.nextId++,
      x: 710,
      y: 400,
      life: 9999,
      cooldown: 0,
      spectral: true,
      dragon: true,
      target: { x: 640, y: 180 },
    });
  notifyRun(
    run,
    run.training
      ? 'Training yard · Practice freely'
      : bossAt(run.wave)
        ? ENEMIES[bossAt(run.wave)!].name + ' approaches'
        : `Wave ${run.wave} · Hold the bastion`,
  );
}
export function completeWave(run: RunState) {
  if (run.phase !== 'battle') return;
  run.completedWaves++;
  run.ledger.completion = 30 + (bossAt(run.wave) ? 60 : run.wave * 2);
  run.ledger.skill = Math.min(15, Math.floor(run.combo * 2));
  run.gold += run.ledger.completion + run.ledger.skill;
  run.hp = Math.min(run.maxHp, run.hp + structureRank(run, 'chapel') * 12);
  if (structureRank(run, 'workshop') && structureRank(run, 'tesla'))
    run.babel = Math.min(3, run.babel + 1);
  run.lastLedger = { ...run.ledger };
  run.slow = false;
  run.charge = 0;
  run.projectiles = [];
  run.marks = [];
  if (run.wave === 15 && !run.endless) run.phase = 'victory';
  else {
    run.wave++;
    run.phase = run.wave === 6 || run.wave === 11 ? 'event' : 'shop';
  }
  run.revision++;
}
