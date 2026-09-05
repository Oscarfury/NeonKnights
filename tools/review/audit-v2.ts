/** Controlled diagnostic probes for the second-overhaul design. Not a difficulty assessment. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { ENEMIES, weaponStats, type EnemyId } from '../../src/game/data/catalog';
import { createRun } from '../../src/game/simulation/RunState';
import { beginWave, spawnEnemy, planWave } from '../../src/game/simulation/WaveDirector';
import { step } from '../../src/game/simulation/Simulation';
import { emptyControls } from '../../src/game/simulation/types';
import { generateOffers } from '../../src/game/simulation/EconomySystem';
import { commandSquad, updateSquad } from '../../src/game/simulation/SquadSystem';

const stationaryBoss = (kind: EnemyId, wave: number, interrupt: boolean) => {
  const run = createRun(225928);
  run.wave = wave;
  run.rank = 3;
  run.branch = 0;
  run.capstone = true;
  beginWave(run);
  run.spawns = [];
  const boss = spawnEnemy(run, { kind, time: 0, sector: 0, offset: 0, reward: true });
  const start = { x: boss.x, y: boss.y };
  const input = emptyControls();
  input.sector = 0;
  input.aim = { ...start };
  let windups = 0,
    interrupted = 0,
    committed = 0,
    maxMovement = 0;
  for (let tick = 0; tick < 60 * 20 && run.phase === 'battle' && !boss.dead; tick++) {
    const before = boss.windup,
      beforeDamage = run.damageTaken[ENEMIES[kind].name] || 0;
    input.fire = interrupt;
    input.alt = interrupt && run.charge < 0.97;
    step(run, input);
    if (before <= 0 && boss.windup > 0) windups++;
    if (
      before > 0 &&
      boss.windup <= 0 &&
      boss.timer >= 2.9 &&
      (run.damageTaken[ENEMIES[kind].name] || 0) === beforeDamage &&
      !boss.dead
    )
      interrupted++;
    if ((run.damageTaken[ENEMIES[kind].name] || 0) > beforeDamage) committed++;
    maxMovement = Math.max(maxMovement, Math.hypot(boss.x - start.x, boss.y - start.y));
  }
  return {
    kind,
    wave,
    interrupt,
    seconds: run.time,
    windups,
    interrupted,
    fortressDamageEvents: committed,
    fortressDamage: run.damageTaken[ENEMIES[kind].name] || 0,
    maxMovement,
    bossDefeated: boss.dead,
    originalPosition: start,
    loadout: { weapon: run.weapon, rank: run.rank, branch: run.branch, capstone: run.capstone },
    notes:
      'At most 20 seconds, ending on boss death. Controlled north placement for comparison; natural spawn schedule is reported separately. No purchased structures or player knights.',
  };
};
const run = createRun(225928);
run.phase = 'shop';
run.wave = 11;
run.rank = 3;
run.branch = 0;
run.runes = { chain: 3, rapid: 3, venom: 1 };
run.orderRank = 3;
run.pads = ['ballista', 'aegis', 'chapel', 'tesla'].map((kind) => ({
  kind,
  rank: 3,
  cooldown: 0,
  built: 1,
})) as typeof run.pads;
generateOffers(run);
const schedule = [5, 10, 15].map((wave) => {
  const r = createRun(225928);
  r.wave = wave;
  return { wave, bossSpawns: planWave(r).filter((s) => ENEMIES[s.kind].boss) };
});
const companyRun = createRun(225928);
beginWave(companyRun);
commandSquad(companyRun);
const knightContract = {
  initialCount: companyRun.knights.length,
  durationSeconds: companyRun.knights[0]?.life,
  commandCooldownSeconds: companyRun.commandCooldown,
  remainingAfterEightPointOneSeconds: 0,
};
updateSquad(companyRun, 8.1);
knightContract.remainingAfterEightPointOneSeconds = companyRun.knights.length;
const report = {
  baseline: '2259a28da440df56e30426371c5461201ada2248',
  purpose:
    'Reproduce design shortcomings. Passing original tests did not demonstrate combat or art quality.',
  schedule,
  isolatedBosses: [
    stationaryBoss('dragon', 5, false),
    stationaryBoss('dragon', 5, true),
    stationaryBoss('golem', 10, false),
    stationaryBoss('king', 15, false),
  ],
  saturatedShop: {
    wave: run.wave,
    rank: run.rank,
    runes: run.runes,
    occupiedPads: run.pads.length,
    offers: run.offers.map((o) => ({ kind: o.kind, key: o.key })),
  },
  dragonInterruptThreshold: ENEMIES.dragon.hp * 0.045,
  rankThreeChargedStormbowDamageBeforeWeakpointBonuses: weaponStats('stormbow', 3).damage * 2.8,
  knightContract,
};
mkdirSync('docs/overhaul-v3/evidence', { recursive: true });
writeFileSync('docs/overhaul-v3/evidence/v2-audit.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
