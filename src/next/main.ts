import './style.css';
import './construction.css';
import { mountConstruction } from './ConstructionView';
import { mountCastle } from './castle/CastleView';
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
  PCFShadowMap,
  CylinderGeometry,
  TorusGeometry,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Assets } from './presentation/Assets';
import { Paladin } from './presentation/Paladin';
import { mountTraining } from './TrainingView';

const app = document.querySelector<HTMLDivElement>('#next')!;
const assets = new Assets();
let renderer: WebGLRenderer | undefined;
let cleanup: (() => void) | undefined;
window.addEventListener(
  'pagehide',
  () => {
    cleanup?.();
    assets.dispose();
  },
  { once: true },
);
async function boot() {
  app.innerHTML =
    '<div class="boot" role="status"><span class="seal">N</span><p>Opening the castle…</p></div>';
  try {
    await assets.load((message) => {
      app.querySelector('p')!.textContent = message;
    });
    showCastle();
  } catch (error) {
    cleanup?.();
    assets.dispose();
    renderer?.dispose();
    app.innerHTML =
      '<div class="boot"><span class="eyebrow">THE FOUNDRY</span><h1>The armory could not open.</h1><p></p><button>Try again</button></div>';
    app.querySelector('p')!.textContent =
      error instanceof Error ? error.message : 'The browser could not load the scene.';
    app.querySelector('button')!.onclick = () => void boot();
  }
}
function showArmory() {
  cleanup?.();
  start();
}
function showCastle() {
  cleanup?.();
  cleanup = mountCastle(app, assets, showArmory);
}
function showCourtyard() {
  cleanup?.();
  cleanup = mountTraining(app, assets, showArmory, showWorkshop);
}
function showWorkshop() {
  cleanup?.();
  cleanup = mountConstruction(app, assets, showArmory, showCourtyard);
}
function start() {
  app.innerHTML = `
    <header><a class="wordmark" href="${import.meta.env.BASE_URL}"><span class="crest">N</span>NEON <b>KNIGHTS</b></a><span class="build-label">THE FOUNDRY <i></i> REBUILD PREVIEW</span><button class="quiet" id="credits">Asset credits ↗</button></header>
    <main class="foundry"><section class="intro"><span class="eyebrow">01 / A NEW COMPANY</span><h1>Steel with<br><em>a soul.</em></h1><p class="lede">Meet the new commander. Inspect the armor, turn the model, and put each movement through its paces.</p><div class="rule"></div><span class="eyebrow">THE STORMBOW COMMANDER</span><p class="description">Layered plate. Weathered leather. A hand-painted knight, brought into the battlefield with a full skeleton and purpose-built weapons.</p><div class="traits"><span>ROYAL GUARD</span><span>RANGED</span><span>HEAVY ARMOR</span></div><button class="primary" id="training">Enter the courtyard <span>↗</span></button><button class="secondary" id="workshop">Visit the workshop ↗</button><p class="scope">Character, combat and construction study.<br>The new campaign is still being built.</p></section>
    <section class="viewport" aria-label="Interactive paladin inspection"><div class="stage"></div><div class="stage-top"><span><i class="live-dot"></i> ARMORY INSPECTION</span><button id="pair" class="quiet">Compare two knights</button></div><div class="stage-bottom"><span>DRAG TO ROTATE · SCROLL TO INSPECT</span><button id="reset" class="quiet">Reset view ↺</button></div></section>
    <aside class="inspector"><span class="eyebrow">EQUIPMENT</span><div class="weapon-tabs"><button class="selected" data-weapon="stormbow"><span>01</span>Stormbow</button><button data-weapon="sunlance"><span>02</span>Sunlance</button></div><h2 id="weapon-name">Stormbow</h2><p id="weapon-description">A recurved bow with an electrum spine. Draw, hold your line, and release a charged arrow.</p><label for="clip">ANIMATION</label><select id="clip"></select><label for="speed">PLAYBACK <output id="speed-label">1.0×</output></label><input id="speed" type="range" min="0" max="1.5" step=".1" value="1"><button id="pause" class="secondary">Pause movement</button><div class="inspector-note"><span class="diamond">◇</span><p>These are the actual models and skeletal clips used by the preview.</p></div><details><summary>Inspect the rig</summary><label class="check"><input id="skeleton" type="checkbox"> Show skeleton</label><p class="fine">Compare two knights to see independent animation playback.</p></details></aside></main>
    <footer><span>A FORTRESS IS ONLY AS STRONG AS ITS COMPANY.</span><span>PALADIN ART · SILVER DELIVERY</span><a href="${import.meta.env.BASE_URL}">Return to current game ↗</a></footer><dialog id="credit-dialog"><button class="quiet close">Close ×</button><span class="eyebrow">ART & CRAFT</span><h2>The new paladin</h2><p>Original paladin geometry and painted textures by <a href="https://silver-delivery.itch.io/hand-painted-paladin-knight-rigged-game-ready" target="_blank" rel="noreferrer">Silver Delivery</a>, supplied by the project owner.</p><p>Runtime rig conversion, animation studies and weapon models were created for Neon Knights. The animation set is under review.</p></dialog>`;
  const stage = app.querySelector<HTMLDivElement>('.stage')!;
  const castleButton = document.createElement('button');
  castleButton.className = 'primary';
  castleButton.textContent = 'Return to the castle ↗';
  castleButton.onclick = showCastle;
  app.querySelector('.intro')!.append(castleButton);
  const scene = new Scene();
  scene.background = new Color(0x151e25);
  scene.fog = new Fog(0x151e25, 10, 26);
  renderer = new WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  stage.append(renderer.domElement);
  const camera = new PerspectiveCamera(34, 1, 0.05, 60);
  camera.position.set(3.5, 2.2, 5.3);
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.target.set(0, 1, 0);
  orbit.enableDamping = true;
  orbit.minDistance = 2.5;
  orbit.maxDistance = 8;
  orbit.maxPolarAngle = Math.PI * 0.49;
  orbit.minPolarAngle = 0.3;
  scene.add(new HemisphereLight(0xd9ecf3, 0x333129, 2.3));
  scene.add(new AmbientLight(0xc3d3e2, 0.35));
  const key = new DirectionalLight(0xffe4ba, 3.6);
  key.position.set(4, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.025;
  scene.add(key);
  const rim = new DirectionalLight(0x6cd4e0, 2);
  rim.position.set(-3, 3, -3);
  scene.add(rim);
  const set = new Group();
  scene.add(set);
  const stone = new MeshStandardMaterial({ color: 0x24303a, roughness: 0.92, metalness: 0.16 });
  const floor = new Mesh(new PlaneGeometry(60, 60), stone);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.12;
  floor.receiveShadow = true;
  set.add(floor);
  const plinth = new Mesh(
    new CylinderGeometry(1.6, 1.65, 0.13, 96),
    new MeshStandardMaterial({ color: 0x313a3e, roughness: 0.65, metalness: 0.3 }),
  );
  plinth.position.y = -0.065;
  plinth.receiveShadow = true;
  set.add(plinth);
  const ring = new Mesh(
    new TorusGeometry(1.54, 0.006, 8, 128),
    new MeshStandardMaterial({ color: 0xa68a55, metalness: 0.8, roughness: 0.34 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.004;
  set.add(ring);
  const hero = new Paladin(assets);
  scene.add(hero.root);
  hero.inspect('bow_idle');
  const partner = new Paladin(assets);
  scene.add(partner.root);
  partner.root.position.x = -0.85;
  partner.root.visible = false;
  partner.inspect('run');
  partner.speed = 0.74;
  const select = app.querySelector<HTMLSelectElement>('#clip')!;
  const labels: Record<string, string> = {
    bow_idle: 'Bow · ready',
    bow_draw: 'Bow · draw',
    bow_hold: 'Bow · hold aim',
    bow_release: 'Bow · release',
    bow_fire: 'Bow · full attack',
    lance_idle: 'Sunlance · ready',
    lance_fire: 'Sunlance · discharge',
    walk: 'Walk',
    run: 'Run',
    backpedal: 'Move backward',
    strafe_left: 'Strafe left',
    strafe_right: 'Strafe right',
    dodge: 'Dodge',
    hit: 'Hit reaction',
    downed: 'Downed',
    dodge_forward: 'Dodge · forward',
    dodge_backward: 'Dodge · backward',
    dodge_left: 'Dodge · left',
    dodge_right: 'Dodge · right',
    weapon_stow: 'Weapon · stow',
    weapon_equip: 'Weapon · equip',
    bow_cancel: 'Bow · cancel draw',
    lance_charge: 'Sunlance · prime',
    lance_release: 'Sunlance · charged discharge',
    interact: 'Company · assist',
    recover: 'Company · return to feet',
  };
  for (const clip of assets.manifest.clips) {
    const option = new Option(labels[clip.name] || clip.name, clip.name);
    select.add(option);
  }
  select.value = 'bow_idle';
  select.onchange = () => {
    hero.inspect(select.value);
    syncWeapon();
  };
  function syncWeapon() {
    app
      .querySelectorAll<HTMLButtonElement>('[data-weapon]')
      .forEach((b) => b.classList.toggle('selected', b.dataset.weapon === hero.weapon));
    app.querySelector('#weapon-name')!.textContent =
      hero.weapon === 'stormbow' ? 'Stormbow' : 'Sunlance';
    app.querySelector('#weapon-description')!.textContent =
      hero.weapon === 'stormbow'
        ? 'A recurved bow with an electrum spine. Draw, hold your line, and release a charged arrow.'
        : 'A two-handed prism emitter. Set your stance and discharge a focused lance of sunlight.';
  }
  app.querySelectorAll<HTMLButtonElement>('[data-weapon]').forEach(
    (b) =>
      (b.onclick = () => {
        hero.weapon = b.dataset.weapon as 'stormbow' | 'sunlance';
        select.value = hero.weapon === 'stormbow' ? 'bow_idle' : 'lance_idle';
        hero.inspect(select.value);
        syncWeapon();
      }),
  );
  const speed = app.querySelector<HTMLInputElement>('#speed')!;
  let lastSpeed = 1;
  const playback = (value: number) => {
    hero.speed = value;
    if (value > 0) lastSpeed = value;
    speed.value = String(value);
    app.querySelector('#speed-label')!.textContent = `${value.toFixed(1)}×`;
    app.querySelector('#pause')!.textContent = value ? 'Pause movement' : 'Resume movement';
  };
  speed.oninput = () => playback(Number(speed.value));
  app.querySelector<HTMLButtonElement>('#pause')!.onclick = () =>
    playback(hero.speed ? 0 : lastSpeed);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    playback(0);
    partner.speed = 0;
  }
  app.querySelector<HTMLInputElement>('#skeleton')!.onchange = (e) => {
    hero.helper.visible = (e.target as HTMLInputElement).checked;
  };
  app.querySelector<HTMLButtonElement>('#pair')!.onclick = () => {
    partner.root.visible = !partner.root.visible;
    hero.root.position.x = partner.root.visible ? 0.85 : 0;
    orbit.target.x = 0;
    camera.position.set(3.5, 2.2, partner.root.visible ? 7 : 5.3);
  };
  app.querySelector<HTMLButtonElement>('#reset')!.onclick = () => {
    camera.position.set(3.5, 2.2, partner.root.visible ? 7 : 5.3);
    orbit.target.set(0, 1, 0);
  };
  const dialog = app.querySelector<HTMLDialogElement>('dialog')!;
  app.querySelector<HTMLButtonElement>('#credits')!.onclick = () => dialog.showModal();
  dialog.querySelector<HTMLButtonElement>('.close')!.onclick = () => dialog.close();
  app.querySelector<HTMLButtonElement>('#training')!.onclick = showCourtyard;
  app.querySelector<HTMLButtonElement>('#workshop')!.onclick = showWorkshop;
  const resize = new ResizeObserver(() => {
    const { width, height } = stage.getBoundingClientRect();
    renderer!.setSize(width, height);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  });
  resize.observe(stage);
  let previous = performance.now(),
    frame = 0;
  const tick = (now: number) => {
    const dt = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    if (!document.hidden && !dialog.open) {
      hero.update(dt);
      partner.update(dt);
    }
    orbit.update();
    renderer!.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  cleanup = () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    orbit.dispose();
    hero.dispose();
    partner.dispose();
    set.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose();
        (o.material as MeshStandardMaterial).dispose();
      }
    });
    renderer!.dispose();
  };
  const snapshot = () => ({
    mode: 'inspection',
    asset: assets.manifest.id,
    revision: assets.manifest.revision,
    clips: assets.manifest.clips.length,
    weapon: hero.weapon,
    animation: select.value,
    actors: partner.root.visible ? 2 : 1,
    hero: hero.poseSnapshot(),
    partner: partner.poseSnapshot(),
    triangles: renderer!.info.render.triangles,
    drawCalls: renderer!.info.render.calls,
  });
  (window as unknown as { __NEON_NEXT__: unknown }).__NEON_NEXT__ = { snapshot };
}
void boot();
