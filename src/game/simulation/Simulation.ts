import { ANCHORS, CENTER, type Sector } from '../data/catalog';
import { effect } from './CombatSystem';
import { generateOffers } from './EconomySystem';
import { updateEnemies } from './EnemySystem';
import { commandSquad, updateSquad } from './SquadSystem';
import { fireWeapon, alternate, updateProjectiles } from './WeaponSystem';
import { completeWave, spawnEnemy } from './WaveDirector';
import type { Controls, RunState } from './types';
export function step(run: RunState, input: Controls, dt = 1 / 60) {
  if (run.phase !== 'battle' || run.paused) return;
  run.time += dt;
  run.aim = { ...input.aim };
  const prevSlow = run.slow;
  if (!input.slow) run.slowLocked = false;
  run.slow = input.slow && run.energy > 0 && !run.slowLocked;
  if (run.slow) {
    run.energy = Math.max(0, run.energy - 40 * dt);
    run.regenDelay = 1;
    if (run.energy <= 0) run.slowLocked = true;
    if (run.tutorial === 2) run.tutorial = 3;
  } else {
    run.regenDelay = Math.max(0, run.regenDelay - dt);
    if (run.regenDelay === 0) run.energy = Math.min(100, run.energy + 20 * dt);
  }
  if (prevSlow && !run.slow && run.echoes) {
    for (let i = 0; i < run.echoes && run.knights.length < 6; i++)
      run.knights.push({
        id: run.nextId++,
        x: run.player.x + i * 12,
        y: run.player.y,
        life: 6,
        cooldown: 0,
        spectral: true,
        dragon: false,
        target: { ...run.aim },
      });
    run.echoes = 0;
  }
  const worldDt = dt * (run.slow ? 0.35 : 1);
  run.worldTime += worldDt;
  run.waveTime += worldDt;
  for (const key of [
    'fireCooldown',
    'commandCooldown',
    'altCooldown',
    'orbitalCooldown',
    'momentum',
    'momentumCooldown',
    'messageTime',
  ] as const)
    run[key] = Math.max(0, run[key] - dt);
  let sector = input.sector;
  if (input.orbit) {
    const angle = Math.atan2((run.aim.y - CENTER.y) / 122, (run.aim.x - CENTER.x) / 154);
    sector = ((Math.round(angle / (Math.PI / 2)) + 1 + 4) % 4) as Sector;
    run.player = { x: CENTER.x + Math.cos(angle) * 154, y: CENTER.y + Math.sin(angle) * 122 };
  }
  if (sector !== null && sector !== run.sector) {
    effect(run, 'phase', run.player, '#87eedb', 0.45, { radius: 28 });
    run.sector = sector;
    if (!input.orbit) run.player = { ...ANCHORS[sector] };
    if (run.momentumCooldown <= 0) {
      run.momentum = 1.5;
      run.momentumCooldown = 2;
    }
    run.tutorial = Math.max(2, run.tutorial);
  }
  if (!input.orbit) run.player = { ...ANCHORS[run.sector] };
  const chargingWeapon = run.weapon === 'stormbow' || run.weapon === 'sunlance';
  if (input.alt && chargingWeapon) run.charge = Math.min(1, run.charge + dt / 0.95);
  else if (run.charge > 0) {
    if (fireWeapon(run, run.charge)) run.charge = 0;
  }
  if (input.alt && !chargingWeapon) alternate(run);
  if (input.fire && !input.alt && run.charge === 0) fireWeapon(run);
  if (input.command) {
    commandSquad(run);
    if (run.tutorial === 3) run.tutorial = 4;
  }
  run.heat = Math.max(0, run.heat - (input.fire && !run.overheated ? 5 : 24) * dt);
  if (run.overheated && run.heat <= 35) run.overheated = false;
  while (
    run.spawnIndex < run.spawns.length &&
    run.spawns[run.spawnIndex].time <= run.waveTime &&
    run.enemies.length < 100
  )
    spawnEnemy(run, run.spawns[run.spawnIndex++]);
  updateProjectiles(run, worldDt);
  updateSquad(run, worldDt);
  updateEnemies(run, worldDt);
  for (const e of run.effects) e.life -= worldDt;
  run.effects = run.effects.filter((e) => e.life > 0);
  run.enemies = run.enemies.filter((e) => !e.dead);
  if (run.training) {
    run.hp = run.maxHp;
    if (run.enemies.length === 0 && run.spawnIndex >= run.spawns.length) {
      run.waveTime = 0;
      run.spawnIndex = 0;
    }
    return;
  }
  if (run.phase === 'battle' && run.spawnIndex >= run.spawns.length && run.enemies.length === 0) {
    completeWave(run);
    if ((run.phase as string) === 'shop') generateOffers(run);
  }
}
