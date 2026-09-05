import { ACTS, ANCHORS, CENTER, ENEMIES, STRUCTURES, WEAPONS } from '../data/catalog';
import { combinations } from '../simulation/EconomySystem';
import { obstructed } from '../simulation/CombatSystem';
import type { Enemy, RunState } from '../simulation/types';
import type { Settings } from '../persistence/storage';

const TAU = Math.PI * 2;
function polygon(c: CanvasRenderingContext2D, points: number[][], fill: string, stroke?: string) {
  c.beginPath();
  points.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1;
    c.stroke();
  }
}
function ellipse(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, TAU);
  c.fill();
}
function line(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  x2: number,
  y2: number,
  color: string,
  width = 1,
) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y2);
  c.stroke();
}
function label(
  c: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size = 11,
  color = '#789397',
  align: CanvasTextAlign = 'center',
) {
  c.fillStyle = color;
  c.textAlign = align;
  c.font = `${size}px system-ui, sans-serif`;
  c.fillText(text, x, y);
}
function block(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  d: number,
  h: number,
  light = '#34404a',
  front = '#202b37',
  side = '#151e2a',
) {
  polygon(
    c,
    [
      [x - w / 2, y - d / 2 - h],
      [x + w / 2, y - d / 2 - h],
      [x + w / 2, y + d / 2 - h],
      [x - w / 2, y + d / 2 - h],
    ],
    light,
    '#52606a',
  );
  polygon(
    c,
    [
      [x - w / 2, y + d / 2 - h],
      [x + w / 2, y + d / 2 - h],
      [x + w / 2, y + d / 2],
      [x - w / 2, y + d / 2],
    ],
    front,
    '#35414c',
  );
  polygon(
    c,
    [
      [x + w / 2, y - d / 2 - h],
      [x + w / 2 + 8, y - d / 2 - h - 7],
      [x + w / 2 + 8, y + d / 2 - 7],
      [x + w / 2, y + d / 2],
    ],
    side,
  );
}
function tower(c: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  ellipse(c, 4, 17, 42, 21, '#0a1119a0');
  block(c, 0, 8, 61, 42, 70);
  for (let row = 0; row < 4; row++) {
    line(c, -29, 5 - row * 15, 30, 5 - row * 15, '#17212c');
    for (let col = 0; col < 3; col++)
      line(
        c,
        -26 + col * 22 + (row % 2) * 9,
        -9 - row * 15,
        -26 + col * 22 + (row % 2) * 9,
        5 - row * 15,
        '#17212c',
      );
  }
  block(c, 0, -58, 70, 48, 9, '#4b5660', '#34414d');
  for (const xx of [-26, 0, 26]) {
    block(c, xx, -78, 13, 12, 15, '#4c5963', '#26323e');
    block(c, xx, -39, 13, 12, 15, '#55626a', '#2c3945');
  }
  for (const yy of [-67, -48]) {
    block(c, -29, yy, 11, 13, 13);
    block(c, 29, yy, 11, 13, 13);
  }
  c.fillStyle = '#0a131e';
  c.fillRect(-6, -23, 12, 23);
  c.fillStyle = '#7bd7c4';
  c.fillRect(-2, -21, 4, 16);
  c.restore();
}
export class BattleRenderer {
  private ground: HTMLCanvasElement;
  constructor(
    private c: CanvasRenderingContext2D,
    private atlas: CanvasImageSource,
    public settings: Settings,
  ) {
    this.ground = document.createElement('canvas');
    this.ground.width = 1280;
    this.ground.height = 800;
    this.drawGround(this.ground.getContext('2d')!);
  }
  private drawGround(c: CanvasRenderingContext2D) {
    const gradient = c.createRadialGradient(665, 395, 50, 640, 400, 740);
    gradient.addColorStop(0, '#1b2931');
    gradient.addColorStop(0.65, '#101d28');
    gradient.addColorStop(1, '#090f1b');
    c.fillStyle = gradient;
    c.fillRect(0, 0, 1280, 800);
    // Distant basalt shelves and mist remain quiet behind the playable plane.
    for (let i = 0; i < 24; i++) {
      const x = ((i * 197) % 1320) - 20,
        y = 100 + ((i * 137) % 630);
      polygon(
        c,
        [
          [x - 45, y],
          [x + 16, y - 30],
          [x + 67, y - 9],
          [x + 21, y + 45],
        ],
        i % 2 ? '#15222b' : '#111b28',
      );
    }
    const island = [
      [100, 287],
      [188, 180],
      [363, 130],
      [514, 101],
      [742, 110],
      [932, 162],
      [1103, 259],
      [1190, 424],
      [1146, 545],
      [1006, 650],
      [814, 707],
      [600, 731],
      [361, 678],
      [187, 573],
      [104, 440],
    ];
    polygon(
      c,
      island.map(([x, y]) => [x, y + 45]),
      '#080f18',
      '#24333f',
    );
    polygon(c, island, '#202d33', '#33444b');
    for (let i = 0; i < island.length; i++) {
      const p = island[i],
        next = island[(i + 1) % island.length];
      polygon(
        c,
        [p, next, [next[0] - 12, next[1] + 32], [p[0] + 5, p[1] + 50]],
        i % 3 ? '#13202b' : '#192934',
      );
    }
    ellipse(c, 640, 412, 425, 240, '#243137');
    // Four broken causeways align with the player's four bastions.
    for (let i = 0; i < 4; i++) {
      c.save();
      c.translate(640, 420);
      c.rotate((i * Math.PI) / 2);
      c.fillStyle = '#3b3d3e';
      c.fillRect(-45, 130, 90, 285);
      for (let y = 150; y < 415; y += 24) {
        line(c, -44, y, 44, y, '#202b30', 3);
        for (let col = 0; col < 3; col++) {
          c.fillStyle = (y + col) % 3 ? '#444646' : '#4b4a47';
          c.fillRect(-42 + col * 29, y + 3, 26, 18);
        }
      }
      line(c, -48, 135, -48, 420, '#716c58', 2);
      line(c, 48, 135, 48, 420, '#716c5840', 2);
      c.restore();
    }
    let seed = 93;
    const rand = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 340; i++) {
      const x = 120 + rand() * 1040,
        y = 140 + rand() * 530;
      if (
        Math.hypot((x - 640) / 490, (y - 420) / 270) > 1 ||
        Math.abs(x - 640) < 58 ||
        Math.abs(y - 420) < 54
      )
        continue;
      const size = 2 + rand() * 12;
      polygon(
        c,
        [
          [x, y],
          [x + size, y - 3],
          [x + size + 3, y + 3],
          [x + 2, y + 6],
        ],
        i % 4 ? '#2c393b' : '#3a4644',
      );
      if (i % 3 === 0) {
        line(c, x, y, x - 3, y - 10, '#3c4e47');
        line(c, x, y, x + 4, y - 6, '#394a42');
      }
    }
    for (const [x, y] of [
      [254, 251],
      [947, 220],
      [286, 582],
      [1015, 550],
    ]) {
      block(c, x, y, 22, 16, 35);
      block(c, x + 26, y + 6, 17, 13, 20);
    }
    ellipse(c, 640, 458, 204, 137, '#07111d85');
    // Masonry ring under the fortress, with a restrained inscribed perimeter.
    ellipse(c, 640, 428, 196, 152, '#17262f');
    c.strokeStyle = '#5a665f';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(640, 422, 190, 146, 0, 0, TAU);
    c.stroke();
    for (let i = 0; i < 56; i++) {
      const a = (i / 56) * TAU;
      line(
        c,
        640 + Math.cos(a) * 185,
        422 + Math.sin(a) * 141,
        640 + Math.cos(a) * 190,
        422 + Math.sin(a) * 146,
        '#738071',
        2,
      );
    }
  }
  draw(run: RunState) {
    const c = this.c,
      menu = run.phase === 'menu';
    c.clearRect(0, 0, 1280, 800);
    c.fillStyle = '#0b1520';
    c.fillRect(0, 0, 1280, 800);
    if (menu) {
      c.save();
      c.translate(250, 22);
      c.scale(0.95, 0.95);
    }
    c.drawImage(this.ground, 0, 0);
    // Danger markers render above ground but below every unit.
    if (!menu)
      for (const enemy of run.enemies)
        if (enemy.windup > 0) {
          const target = ANCHORS[enemy.attackSector];
          c.strokeStyle = '#ffb099';
          c.lineWidth = 2;
          c.setLineDash([9, 7]);
          c.beginPath();
          c.moveTo(enemy.x, enemy.y);
          c.lineTo(target.x, target.y);
          c.stroke();
          c.setLineDash([]);
          const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
          polygon(
            c,
            [
              [target.x + Math.cos(angle) * 18, target.y + Math.sin(angle) * 18],
              [target.x + Math.cos(angle + 2.4) * 16, target.y + Math.sin(angle + 2.4) * 16],
              [target.x + Math.cos(angle - 2.4) * 16, target.y + Math.sin(angle - 2.4) * 16],
            ],
            '#f29a76',
          );
          ellipse(c, target.x, target.y, 48, 32, '#d97a5830');
          label(c, '!  INCOMING', target.x, target.y + 48, 11, '#ffc4ad');
        }
    for (const mark of run.marks) {
      c.strokeStyle = mark.orbital ? '#f4d595' : '#b7c8f1';
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(mark.x, mark.y, mark.radius, mark.radius * 0.7, 0, 0, TAU);
      c.stroke();
      line(c, mark.x - 8, mark.y, mark.x + 8, mark.y, '#cedafa');
      line(c, mark.x, mark.y - 8, mark.x, mark.y + 8, '#cedafa');
      label(
        c,
        mark.orbital ? 'VERDICT' : mark.life.toFixed(1) + 's',
        mark.x,
        mark.y - mark.radius * 0.7 - 8,
        10,
        '#c3d6fa',
      );
    }
    this.fortress(run);
    if (menu) {
      for (let i = 0; i < 5; i++) this.knight(480 + i * 74, 580 + (i % 2) * 15, 2, 1, 62);
      this.knight(650, 312, 1, 0, 85);
      label(c, 'THE LIGHT STILL HOLDS', 640, 670, 12, '#9bb8af');
      c.restore();
      const fade = c.createLinearGradient(0, 0, 770, 0);
      fade.addColorStop(0, '#0b141ff5');
      fade.addColorStop(0.55, '#0b141fe5');
      fade.addColorStop(1, '#0b141f00');
      c.fillStyle = fade;
      c.fillRect(0, 0, 1280, 800);
      return;
    }
    for (const e of [...run.enemies].sort((a, b) => a.y - b.y)) this.enemy(e, run);
    const combo = combinations(run);
    for (const k of run.knights) {
      if (k.dragon) {
        c.save();
        c.translate(k.x, k.y);
        c.scale(0.5, 0.5);
        this.dragon(c, '#9e90d0', run.worldTime);
        c.restore();
      } else {
        ellipse(c, k.x, k.y + 8, 18, 7, k.spectral ? '#ab85e455' : '#98cdbb30');
        this.knight(
          k.x,
          k.y,
          Math.round(((Math.atan2(k.target.x - k.x, k.target.y - k.y) + TAU) / TAU) * 8) % 8,
          1 + (Math.floor(run.worldTime * 7) % 2),
          60,
        );
        if (combo.includes('midas')) ellipse(c, k.x, k.y - 36, 5, 3, '#d9b66e');
      }
    }
    const dir =
      Math.round(
        ((Math.atan2(run.aim.x - run.player.x, run.aim.y - run.player.y) + TAU) / TAU) * 8,
      ) % 8;
    ellipse(c, run.player.x, run.player.y + 8, 24, 9, '#8be1c144');
    this.knight(
      run.player.x,
      run.player.y,
      dir,
      run.charge > 0 ? 3 : run.fireCooldown > 0.1 ? 4 : 0,
      76,
    );
    const angle = Math.atan2(run.aim.y - run.player.y, run.aim.x - run.player.x);
    line(
      c,
      run.player.x + Math.cos(angle) * 15,
      run.player.y - 12 + Math.sin(angle) * 15,
      run.player.x + Math.cos(angle) * 34,
      run.player.y - 12 + Math.sin(angle) * 34,
      WEAPONS[run.weapon].color,
      4,
    );
    if (run.charge > 0) {
      c.strokeStyle = '#eacf94';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(run.player.x, run.player.y - 10, 31, -Math.PI / 2, -Math.PI / 2 + TAU * run.charge);
      c.stroke();
    }
    for (const p of run.projectiles) {
      const color = p.attack.source === 'player' ? WEAPONS[run.weapon].color : '#cbb793';
      if (p.attack.weapon === 'chakram') {
        c.save();
        c.translate(p.x, p.y);
        c.rotate(run.worldTime * 12);
        c.strokeStyle = color;
        c.lineWidth = 3;
        c.strokeRect(-10, -10, 20, 20);
        c.restore();
      } else {
        line(
          c,
          p.x - p.vx * 0.025,
          p.y - p.vy * 0.025,
          p.x,
          p.y,
          color,
          p.attack.source === 'player' ? 2 : 3,
        );
      }
    }
    for (const e of run.effects) {
      if (
        (e.kind === 'text' && !this.settings.numbers) ||
        (!this.settings.effects && ['hit', 'phase'].includes(e.kind))
      )
        continue;
      c.save();
      c.globalAlpha = Math.min(1, (e.life / e.maxLife) * 1.5);
      if (e.kind === 'line')
        line(c, e.x, e.y, e.x2!, e.y2!, e.color, this.settings.effects ? e.radius || 2 : 2);
      else if (e.kind === 'text')
        label(c, e.text || '', e.x, e.y - (1 - e.life / e.maxLife) * 25, 13, e.color);
      else {
        const r = (e.radius || 18) * (1 - (e.life / e.maxLife) * 0.8);
        c.strokeStyle = e.color;
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(e.x, e.y, r, r * 0.7, 0, 0, TAU);
        c.stroke();
      }
      c.restore();
    }
    if (run.phase === 'battle') {
      const blocked = obstructed(run.player, run.aim),
        color = blocked ? '#dd9b83' : '#bbd9ce';
      c.strokeStyle = color;
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(run.aim.x, run.aim.y, 11, 0, TAU);
      c.stroke();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU;
        line(
          c,
          run.aim.x + Math.cos(a) * 15,
          run.aim.y + Math.sin(a) * 15,
          run.aim.x + Math.cos(a) * 21,
          run.aim.y + Math.sin(a) * 21,
          color,
        );
      }
      if (blocked) label(c, 'FORTRESS BLOCKS SHOT · PHASE', run.aim.x, run.aim.y + 35, 10, color);
      if (run.slow) {
        c.strokeStyle = '#90bce77f';
        c.lineWidth = 9;
        c.strokeRect(5, 5, 1270, 790);
      }
      for (let i = 0; i < 4; i++) {
        const count = run.enemies.filter((e) => e.sector === i).length;
        if (count) {
          const p = ANCHORS[i];
          label(
            c,
            String(count),
            p.x + (i === 1 ? 66 : i === 3 ? -66 : 0),
            p.y + (i === 0 ? -90 : i === 2 ? 72 : 0),
            13,
            '#e3ad96',
          );
        }
      }
    }
  }
  private knight(x: number, y: number, direction: number, frame: number, size: number) {
    this.c.drawImage(
      this.atlas,
      frame * 128,
      direction * 128,
      128,
      128,
      x - size / 2,
      y - size * 0.78,
      size,
      size,
    );
  }
  private fortress(run: RunState) {
    const c = this.c;
    block(c, 640, 400, 215, 130, 28, '#37444b', '#27323e');
    block(c, 640, 356, 250, 28, 43);
    tower(c, 523, 350, 0.87);
    tower(c, 757, 350, 0.87);
    for (const x of [525, 755]) block(c, x, 425, 26, 130, 44);
    // Central chapel and light engine.
    block(c, 640, 422, 106, 70, 78, '#48515a', '#293440');
    polygon(
      c,
      [
        [575, 350],
        [640, 308],
        [705, 350],
      ],
      '#4c4054',
      '#7c6774',
    );
    polygon(
      c,
      [
        [640, 308],
        [715, 331],
        [705, 350],
      ],
      '#302b40',
    );
    block(c, 640, 360, 41, 35, 42, '#47515a', '#263440');
    polygon(
      c,
      [
        [611, 304],
        [640, 258],
        [669, 304],
      ],
      '#3d3d51',
      '#7d7186',
    );
    const glow = c.createRadialGradient(640, 330, 2, 640, 330, 70);
    glow.addColorStop(0, '#89efd74a');
    glow.addColorStop(1, '#89efd700');
    c.fillStyle = glow;
    c.fillRect(570, 260, 140, 140);
    polygon(
      c,
      [
        [640, 301],
        [650, 323],
        [640, 347],
        [630, 323],
      ],
      '#9af0d8',
      '#e5ffe8',
    );
    line(c, 640, 310, 640, 337, '#f0ffe8', 2);
    for (const x of [608, 638, 668]) {
      c.fillStyle = '#111d29';
      c.fillRect(x - 4, 374, 9, 28);
      c.fillStyle = '#d4b887';
      c.fillRect(x - 1, 377, 3, 19);
    }
    block(c, 640, 490, 250, 26, 47);
    tower(c, 523, 489);
    tower(c, 757, 489);
    c.fillStyle = '#101a24';
    c.beginPath();
    c.roundRect(610, 464, 60, 57, [28, 28, 0, 0]);
    c.fill();
    for (let x = 616; x < 670; x += 9) line(c, x, 477, x, 521, '#716249', 3);
    for (const [x, y] of [
      [538, 372],
      [737, 372],
      [535, 480],
      [740, 480],
    ]) {
      line(c, x, y - 38, x, y + 1, '#ad9364', 2);
      polygon(
        c,
        [
          [x, y - 39],
          [x + 23, y - 36],
          [x + 23, y - 7],
          [x + 12, y - 12],
          [x, y - 6],
        ],
        '#42334f',
        '#766581',
      );
      line(c, x + 11, y - 30, x + 11, y - 16, '#8fcfb9', 2);
    }
    for (let i = 0; i < 4; i++) {
      const p = ANCHORS[i],
        pad = run.pads[i];
      ellipse(c, p.x, p.y + 8, 34, 19, '#1a2a34');
      c.strokeStyle = run.sector === i ? '#80d6be' : '#57676a';
      c.lineWidth = run.sector === i ? 2 : 1;
      c.beginPath();
      c.ellipse(p.x, p.y + 8, 33, 18, 0, 0, TAU);
      c.stroke();
      if (!pad) continue;
      const color = ['tesla', 'moat'].includes(pad.kind)
        ? '#8bdfdd'
        : ['ossuary'].includes(pad.kind)
          ? '#b49ad3'
          : '#d5bc86';
      if (pad.kind === 'ballista') {
        block(c, p.x, p.y, 32, 20, 22);
        line(c, p.x - 23, p.y - 29, p.x + 23, p.y - 29, '#b29668', 5);
        line(c, p.x, p.y - 42, p.x, p.y - 6, '#9bb7bd', 4);
      } else if (pad.kind === 'tesla') {
        block(c, p.x, p.y, 24, 20, 16);
        line(c, p.x, p.y - 15, p.x, p.y - 53, '#9caab1', 7);
        ellipse(c, p.x, p.y - 50, 12, 7, color);
        line(c, p.x - 15, p.y - 35, p.x + 15, p.y - 35, color, 2);
      } else if (pad.kind === 'moat') {
        c.strokeStyle = color;
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(p.x, p.y, 90, 60, 0, 0, TAU);
        c.stroke();
      } else {
        block(c, p.x, p.y, 36, 26, 30);
        label(c, STRUCTURES[pad.kind].icon, p.x, p.y - 26, 23, color);
      }
      label(c, 'I'.repeat(pad.rank), p.x, p.y + 29, 9, color);
    }
    if (combinations(run).includes('babel')) {
      line(c, 640, 300, 640, 209, '#729097', 12);
      polygon(
        c,
        [
          [640, 183],
          [656, 212],
          [640, 242],
          [624, 212],
        ],
        '#98e8db',
        '#e5f3cb',
      );
    }
    if (run.hp / run.maxHp < 0.4) {
      for (const p of [
        [565, 467],
        [714, 457],
      ]) {
        polygon(
          c,
          [
            [p[0], p[1]],
            [p[0] - 8, p[1] + 18],
            [p[0] + 5, p[1] + 25],
          ],
          '#bd7d4f',
        );
        line(c, p[0], p[1] + 28, p[0] + 11, p[1] + 42, '#0a131f', 3);
      }
    }
  }
  private dragon(c: CanvasRenderingContext2D, color: string, time: number) {
    const flap = this.settings.motion ? Math.sin(time * 2) * 7 : 0;
    polygon(
      c,
      [
        [-18, 0],
        [-95, -45 - flap],
        [-69, 2],
        [-42, 18],
        [-28, 34],
      ],
      '#513e58',
      '#9d7692',
    );
    polygon(
      c,
      [
        [18, 0],
        [95, -45 - flap],
        [69, 2],
        [42, 18],
        [28, 34],
      ],
      '#634659',
      '#ba8f9a',
    );
    polygon(
      c,
      [
        [-25, 22],
        [-28, -22],
        [0, -53],
        [28, -22],
        [25, 22],
        [0, 48],
      ],
      color,
      '#e1af96',
    );
    polygon(
      c,
      [
        [-15, -28],
        [0, -68],
        [18, -27],
        [9, -7],
      ],
      '#946d77',
      '#e3ac99',
    );
    line(c, -6, -42, -2, -42, '#ffcf85', 3);
    line(c, 8, -42, 12, -42, '#ffcf85', 3);
    polygon(
      c,
      [
        [0, 10],
        [9, 24],
        [0, 40],
        [-9, 24],
      ],
      '#e6ba8c',
    );
  }
  private enemy(e: Enemy, run: RunState) {
    const c = this.c,
      boss = ENEMIES[e.kind].boss,
      color =
        e.hitFlash > 0 && this.settings.effects
          ? '#eed7bf'
          : e.kind === 'cleric'
            ? '#b9a477'
            : e.kind === 'wizard'
              ? '#9c83b4'
              : '#ad827c';
    c.save();
    c.translate(e.x, e.y);
    ellipse(c, 0, 12, boss ? 55 : 17, boss ? 22 : 7, '#06101b80');
    if (e.kind === 'dragon') this.dragon(c, color, run.worldTime);
    else if (e.kind === 'golem') {
      block(c, 0, 9, 73, 38, 71, '#746e7b', '#565166');
      block(c, 0, -60, 33, 25, 27, '#8d7e88', '#665968');
      for (let i = 0; i < 2; i++) {
        const x = i ? 48 : -48;
        if (e.limbs[i] > 0) {
          block(c, x, 12, 25, 25, 65, '#82777d', '#554957');
          ellipse(c, x, 0, 7, 7, '#f0c78e');
        }
        block(c, i ? 22 : -22, 39, 23, 23, 34);
      }
      polygon(
        c,
        [
          [-10, -26],
          [0, -43],
          [10, -26],
          [0, -8],
        ],
        '#b3a4d3',
      );
    } else if (e.kind === 'king') {
      polygon(
        c,
        [
          [-28, -31],
          [0, -55],
          [28, -31],
          [44, 40],
          [0, 25],
          [-44, 40],
        ],
        '#3e304e',
        '#997caa',
      );
      block(c, 0, 0, 36, 24, 40, '#6a6072', '#393147');
      polygon(
        c,
        [
          [-20, -50],
          [-24, -76],
          [-10, -64],
          [0, -82],
          [10, -64],
          [24, -76],
          [20, -50],
        ],
        '#bda06b',
        '#e9cf98',
      );
      line(c, -6, -39, 6, -39, '#e0a994', 3);
      line(c, 30, -43, 38, 34, '#c5b9bd', 4);
    } else if (e.kind === 'ram') {
      block(c, 0, 2, 52, 31, 29, '#7e6f61', '#514b45');
      for (const x of [-24, 24]) {
        ellipse(c, x, 14, 9, 13, '#1c232a');
        ellipse(c, x, 14, 4, 7, '#8d8270');
      }
      line(c, 0, -35, 0, 16, '#b4a088', 9);
      polygon(
        c,
        [
          [-12, -37],
          [0, -49],
          [12, -37],
        ],
        '#ac8f77',
      );
    } else {
      const walk = this.settings.motion ? Math.sin(run.worldTime * 8 + e.id) * 3 : 0;
      line(c, -5, -2, -6, 13 + walk, '#4a4350', 5);
      line(c, 5, -2, 6, 13 - walk, '#5b515a', 5);
      polygon(
        c,
        [
          [-11, -24],
          [11, -24],
          [14, -3],
          [-12, -3],
        ],
        color,
        '#be9f96',
      );
      polygon(
        c,
        [
          [-9, -26],
          [-7, -42],
          [7, -42],
          [10, -26],
        ],
        '#5c535e',
        '#c1a49a',
      );
      line(c, -6, -32, 6, -32, '#efb099', 2);
      if (e.kind === 'shield')
        polygon(
          c,
          [
            [-20, -25],
            [-5, -28],
            [-2, -8],
            [-12, 1],
            [-23, -8],
          ],
          e.exposed > 0 ? '#80604c' : '#8f8177',
          '#d5b592',
        );
      else if (e.kind === 'lancer') {
        line(c, 17, -48, 15, 9, '#c8b49f', 3);
        polygon(
          c,
          [
            [17, -57],
            [11, -44],
            [22, -44],
          ],
          '#e0c7b0',
        );
      } else if (e.kind === 'cleric') {
        c.strokeStyle = '#dfc28e';
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(0, -49, 16, 6, 0, 0, TAU);
        c.stroke();
        line(c, 17, -40, 17, 6, '#bfb39e', 3);
        line(c, 10, -32, 24, -32, '#e2ce9f', 3);
      } else if (e.kind === 'wizard') {
        polygon(
          c,
          [
            [-14, -39],
            [0, -62],
            [16, -39],
          ],
          '#746088',
          '#b69bc6',
        );
        line(c, 18, -45, 18, 8, '#a594ae', 3);
        ellipse(c, 18, -46, 5, 6, '#bfa1e1');
      } else if (e.kind === 'pegasus') {
        polygon(
          c,
          [
            [-8, -19],
            [-35, -42],
            [-29, -10],
            [-12, -5],
          ],
          '#a29aaa',
        );
        polygon(
          c,
          [
            [8, -19],
            [35, -42],
            [29, -10],
            [12, -5],
          ],
          '#c0b1bb',
        );
      } else if (e.kind === 'rogue') {
        polygon(
          c,
          [
            [-15, -23],
            [0, -47],
            [15, -23],
            [12, 5],
            [-14, 5],
          ],
          '#63586d',
        );
        line(c, 14, -4, 25, -19, '#e1bdad', 2);
        ellipse(c, -4, 24, 3, 2, '#b8a498');
        ellipse(c, 5, 32, 3, 2, '#b8a498');
      } else line(c, 16, -27, 17, 5, '#c7b4ad', 3);
    }
    if (e.windup > 0 || e.exposed > 0) {
      const r = boss ? 16 : 20;
      c.strokeStyle = e.exposed > 0 ? '#f6d79a' : '#ffbd9f';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, boss ? 0 : -24, r, 0, TAU);
      c.stroke();
      label(c, e.exposed > 0 ? '◇' : '!', 0, boss ? 5 : -19, 16, '#ffe1ad');
    }
    if (!boss && e.hp < e.maxHp) {
      c.fillStyle = '#382c32';
      c.fillRect(-17, 21, 34, 3);
      c.fillStyle = '#d5a291';
      c.fillRect(-17, 21, 34 * Math.max(0, e.hp / e.maxHp), 3);
    }
    if (e.poison) label(c, '•'.repeat(e.poison), 0, 34, 11, '#b5c798');
    c.restore();
  }
}
