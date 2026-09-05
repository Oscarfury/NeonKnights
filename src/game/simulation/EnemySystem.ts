import { ANCHORS, CENTER, ENEMIES, type Sector } from '../data/catalog';
import { distance, notifyRun } from './RunState';
import { damageEnemy, effect, hurtFortress, makeAttack } from './CombatSystem';
import { spawnEnemy } from './WaveDirector';
import type { Enemy, RunState } from './types';
function bossThink(run: RunState, e: Enemy, dt: number) {
  if (e.hp < e.maxHp * 0.5 && e.phase === 1) {
    e.phase = 2;
    e.timer = 1;
    notifyRun(run, `${ENEMIES[e.kind].name} · Phase II`);
  }
  if (
    e.kind === 'king' &&
    run.enemies.filter((other) => !other.dead && !ENEMIES[other.kind].boss).length === 0
  )
    e.exposed = Math.max(e.exposed, 0.2);
  if (e.windup > 0) {
    e.windup -= dt;
    if (e.windup <= 0) {
      const arm = e.summons % 2;
      if (e.kind !== 'golem' || e.limbs[arm] > 0)
        hurtFortress(run, ENEMIES[e.kind].damage, ENEMIES[e.kind].name, e.attackSector);
      effect(run, 'line', e, '#ff957b', 0.5, {
        x2: ANCHORS[e.attackSector].x,
        y2: ANCHORS[e.attackSector].y,
        radius: 35,
      });
      e.exposed = e.kind === 'king' ? 1 : 3;
      e.timer = e.phase === 2 ? 4 : 5.5;
    }
  } else {
    e.timer -= dt;
    if (e.timer <= 0) {
      e.attackSector = ((e.attackSector + 1) % 4) as Sector;
      e.windup = run.difficulty === 'story' ? 3 : run.difficulty === 'veteran' ? 1.5 : 2.2;
      e.stagger = 0;
      e.summons++;
      notifyRun(run, `${ENEMIES[e.kind].name} prepares an attack · Break the glowing rune`);
      if (e.summons % 2 === 0 && e.summons <= 8) {
        for (let j = 0; j < (e.kind === 'king' ? 3 : 2); j++)
          spawnEnemy(run, {
            kind: e.kind === 'king' ? 'shield' : 'squire',
            sector: ((e.attackSector + j) % 4) as Sector,
            time: 0,
            offset: j * 25,
            reward: false,
          });
      }
    }
  }
  if (e.kind === 'golem') {
    for (const carrier of run.enemies) {
      if (carrier === e || carrier.dead || carrier.reward || ENEMIES[carrier.kind].boss) continue;
      const d = distance(carrier, e);
      if (d < 48) {
        carrier.dead = true;
        e.hp = Math.min(e.maxHp, e.hp + 35);
        for (let side = 0; side < 2; side++)
          if (e.limbs[side] > 0) e.limbs[side] = Math.min(e.maxHp * 0.16, e.limbs[side] + 20);
        effect(run, 'line', carrier, '#bf9bea', 0.4, { x2: e.x, y2: e.y });
      } else {
        carrier.x += ((e.x - carrier.x) / d) * 35 * dt;
        carrier.y += ((e.y - carrier.y) / d) * 35 * dt;
      }
    }
  }
}
export function updateEnemies(run: RunState, dt: number) {
  for (const e of [...run.enemies]) {
    if (e.dead || run.phase !== 'battle') continue;
    e.exposed = Math.max(0, e.exposed - dt);
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    if (e.poisonTime > 0) {
      e.poisonTime = Math.max(0, e.poisonTime - dt);
      e.statusTick += dt;
      if (e.statusTick >= 0.5) {
        e.statusTick -= 0.5;
        damageEnemy(run, e, makeAttack(run, 'status', e.poison * 1.5), e, true);
      }
      if (e.poisonTime <= 0) {
        e.poison = 0;
        e.statusTick = 0;
      }
    }
    if (e.dead) continue;
    if (ENEMIES[e.kind].boss) {
      bossThink(run, e, dt);
      continue;
    }
    const dx = CENTER.x - e.x,
      dy = CENTER.y - e.y,
      dist = Math.hypot(dx, dy),
      normalized = Math.hypot(dx / 158, dy / 127);
    const pad = run.pads[e.sector],
      moat = pad?.kind === 'moat' && distance(e, ANCHORS[e.sector]) < 135 && e.kind !== 'pegasus';
    if (normalized > 1) {
      if ((e.kind === 'lancer' || e.kind === 'pegasus') && dist < 280 && e.summons === 0) {
        e.windup = 0.9 * (run.difficulty === 'story' ? 1.5 : 1);
        e.summons = 1;
      }
      if (e.windup > 0) {
        e.windup -= dt;
        if (e.windup <= 0) e.summons = 2;
      } else {
        const speed =
          ENEMIES[e.kind].speed *
          (moat ? 0.6 : 1) *
          (e.summons === 2 && (e.kind === 'lancer' || e.kind === 'pegasus') ? 3 : 1);
        e.x += (dx / dist) * speed * dt;
        e.y += (dy / dist) * speed * dt;
      }
    } else if (e.windup > 0) {
      e.windup -= dt;
      if (e.windup <= 0) {
        hurtFortress(run, ENEMIES[e.kind].damage, ENEMIES[e.kind].name, e.sector);
        e.timer = 2.8;
      }
    } else {
      e.timer -= dt;
      if (e.timer <= 0) e.windup = 0.8;
    }
    if (
      e.kind === 'cleric' &&
      Math.floor(run.worldTime / 4) !== Math.floor((run.worldTime - dt) / 4)
    ) {
      for (const friend of run.enemies)
        if (!friend.dead && !ENEMIES[friend.kind].boss && distance(e, friend) < 145) {
          friend.hp = Math.min(friend.maxHp, friend.hp + 12);
          effect(run, 'line', e, '#d5bf91', 0.4, { x2: friend.x, y2: friend.y });
        }
    }
    if (e.kind === 'wizard' && e.summons < 3 && run.waveTime > 8 + e.summons * 9) {
      e.summons++;
      spawnEnemy(run, { time: 0, kind: 'squire', sector: e.sector, offset: 30, reward: false });
      effect(run, 'ring', e, '#ad97dd', 1, { radius: 45 });
    }
  }
}
