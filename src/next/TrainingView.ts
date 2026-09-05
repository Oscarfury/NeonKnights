import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  PCFShadowMap,
  CylinderGeometry,
  TorusGeometry,
  BoxGeometry,
} from 'three';
import { Assets } from './presentation/Assets';
import { Paladin } from './presentation/Paladin';
import { DangerView } from './presentation/DangerView';
import { dangerPhase, makeDanger } from './combat/Hazards';
import {
  createTraining,
  groundHeight,
  issueOrder,
  neutralInput,
  stepTraining,
} from './world/Training';

export function mountTraining(app: HTMLElement, assets: Assets, back: () => void) {
  app.innerHTML = `<div class="training-root"><header><button class="quiet" id="back-armory">← The armory</button><span class="build-label">THE TRAINING COURTYARD</span><div class="header-actions"><button class="quiet" id="trial">Start ward trial</button><button class="quiet" id="restore">Restore company</button><button class="quiet" id="field-pause">Pause Ⅱ</button></div></header><div class="field-stage" aria-label="Playable training courtyard"></div><div class="field-heading"><span class="eyebrow">LEARN YOUR GROUND</span><h1>The first watch.</h1><p id="drill-message">Try both weapons. Lead your company. Take the high ground.</p></div><div class="company-panel"><span class="eyebrow">YOUR COMPANY</span><article><span class="company-number">I</span><div><b>Elin</b><small>ROYAL MARKSMAN · <span id="elin-order">FOLLOWING</span></small><meter id="elin-health" min="0" max="100" value="100"></meter></div></article><article><span class="company-number">II</span><div><b>Corvin</b><small>ROYAL MARKSMAN · <span id="corvin-order">FOLLOWING</span></small><meter id="corvin-health" min="0" max="100" value="100"></meter></div></article><button class="secondary" id="recall">Regroup at commander <kbd>E</kbd></button><p>Hold <kbd>Tab</kbd> and click to hold a formation.</p></div><details class="field-help" open><summary>Field guide</summary><p><kbd>W A S D</kbd> Move<br><kbd>Mouse</kbd> Aim · hold to fire<br><kbd>Right mouse</kbd> Charge & release<br><kbd>Space</kbd> Dodge<br><kbd>Q</kbd> Switch weapon<br><kbd>Shift</kbd> Slow time<br><kbd>Tab + click</kbd> Order company<br><kbd>F</kbd> Hold to rescue<br><kbd>E</kbd> Regroup · <kbd>Esc</kbd> Pause</p><p>The brass-edged ramp leads to the east balcony. Ward impacts, sweeping rays and lingering fire test your footwork. Hold F near a fallen knight to assist. Two field dressings are shared by the company.</p></details><div class="rescue-status" id="rescue-status" role="status"><span id="rescue-text">FIELD DRESSINGS 2</span><progress id="rescue-progress" max="1.8" value="0"></progress></div><div class="field-bottom"><div class="vitality"><span class="eyebrow">COMMANDER</span><strong><span id="hp">100</span> <small>/ 100</small></strong><meter id="hp-bar" min="0" max="100" value="100"></meter></div><div class="weapon-hud"><span class="eyebrow" id="field-weapon">STORMBOW</span><div class="charge-track"><i id="charge-fill"></i></div><span id="weapon-hint">Hold primary to draw and loose</span></div><div class="charges"><span class="eyebrow">DODGE</span><div id="dodge-pips">◆ ◆</div><small id="focus">FOCUS 100</small></div><div class="accuracy"><span class="eyebrow">RANGE RECORD</span><strong id="hits">0 <small>hits</small></strong><small id="evades">0 attacks evaded</small></div></div><div class="touch-controls"><div id="move-pad" aria-label="Move joystick"><i></i><span>MOVE</span></div><div class="touch-actions"><button id="touch-alt">Charge</button><button id="touch-slow">Slow</button><button id="touch-dodge">Dodge</button><button id="touch-swap">Swap</button><button id="touch-order">Order</button><button id="touch-rescue">Rescue</button></div></div><div class="pause-screen" hidden><span class="eyebrow">THE COMPANY WAITS</span><h2 id="pause-title">Take a breath.</h2><button class="primary" id="resume">Return to the courtyard</button><button class="secondary" id="pause-restore">Restore company</button></div></div>`;
  const stage = app.querySelector<HTMLElement>('.field-stage')!;
  const scene = new Scene();
  scene.background = new Color(0x111c27);
  scene.fog = new Fog(0x111c27, 35, 65);
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  stage.append(renderer.domElement);
  const camera = new PerspectiveCamera(41, 1, 0.1, 90);
  camera.position.set(0, 18, 21);
  camera.lookAt(0, 0, 0);
  scene.add(new HemisphereLight(0xb9d9e9, 0x192d35, 2.0));
  const sun = new DirectionalLight(0xffe5b9, 3);
  sun.position.set(-7, 16, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, far: 45 });
  sun.shadow.normalBias = 0.025;
  sun.shadow.bias = -0.0002;
  scene.add(sun);
  const rim = new DirectionalLight(0x5ca3c1, 1.3);
  rim.position.set(10, 8, -12);
  scene.add(rim);
  const courtyard = assets.get('courtyard').scene.clone(true);
  const occluders: Mesh[] = [];
  courtyard.traverse((o) => {
    if (o instanceof Mesh && o.name.startsWith('Gate')) {
      const original = Array.isArray(o.material) ? o.material[0] : o.material;
      o.material = original.clone();
      o.material.transparent = true;
      occluders.push(o);
    }
  });
  scene.add(courtyard);
  const occlusionRay = new Raycaster();
  const sightline = new Vector3();
  let state = createTraining();
  const input = neutralInput();
  const actors = [
    new Paladin(assets),
    new Paladin(assets, ['stormbow']),
    new Paladin(assets, ['stormbow']),
  ];
  actors.forEach((a) => scene.add(a.root));
  const priorPositions = [state.player, ...state.company].map((a) => ({
    x: a.x,
    y: a.y,
    z: a.z,
    yaw: a.yaw,
  }));
  const resources = new Group();
  scene.add(resources);
  const gold = new MeshStandardMaterial({ color: 0x9f7f43, metalness: 0.72, roughness: 0.4 });
  const timber = new MeshStandardMaterial({ color: 0x382c25, roughness: 0.9 });
  const painted = new MeshStandardMaterial({ color: 0xadb9b0, metalness: 0.25, roughness: 0.65 });
  const targetFaces: Mesh[] = [];
  for (const target of state.targets) {
    const group = new Group();
    group.position.set(target.x, 0, target.z);
    resources.add(group);
    const post = new Mesh(new BoxGeometry(0.12, 1.5, 0.15), timber);
    post.position.y = 0.75;
    post.castShadow = true;
    group.add(post);
    const foot = new Mesh(new BoxGeometry(1.0, 0.12, 0.65), timber);
    foot.position.y = 0.06;
    group.add(foot);
    const face = new Mesh(new CylinderGeometry(0.58, 0.58, 0.12, 32), painted.clone());
    face.rotation.x = Math.PI / 2;
    face.position.y = 1.4;
    face.castShadow = true;
    group.add(face);
    targetFaces.push(face);
    for (const radius of [0.18, 0.36, 0.54]) {
      const ring = new Mesh(new TorusGeometry(radius, 0.012, 6, 48), gold);
      ring.position.set(0, 1.4, 0.068);
      group.add(ring);
    }
    const bull = new Mesh(new CylinderGeometry(0.07, 0.07, 0.02, 16), gold);
    bull.rotation.x = Math.PI / 2;
    bull.position.set(0, 1.4, 0.075);
    group.add(bull);
  }
  const boltMeshes = new Map<number, Mesh>();
  const hazardMeshes = new Map<number, DangerView>();
  const boltGeo = new CylinderGeometry(0.014, 0.028, 0.7, 8);
  boltGeo.rotateX(Math.PI / 2);
  const arrowMat = new MeshStandardMaterial({
    color: 0xb4eef2,
    emissive: 0x318aa2,
    emissiveIntensity: 1.4,
    metalness: 0.5,
  });
  const lanceMat = new MeshStandardMaterial({
    color: 0xffe8a1,
    emissive: 0xfaab35,
    emissiveIntensity: 2.2,
  });
  const cursor = new Mesh(
    new TorusGeometry(0.28, 0.012, 6, 48),
    new MeshStandardMaterial({ color: 0xc5d3be, emissive: 0x527773, emissiveIntensity: 0.7 }),
  );
  cursor.rotation.x = Math.PI / 2;
  scene.add(cursor);
  const orderMarkers = [-1, 1].map(() => {
    const mesh = new Mesh(
      new TorusGeometry(0.45, 0.018, 8, 48),
      new MeshStandardMaterial({ color: 0x8ce2d3, emissive: 0x1a7774 }),
    );
    mesh.rotation.x = Math.PI / 2;
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
  });
  const ray = new Raycaster(),
    pointer = new Vector2(),
    plane = new Plane(new Vector3(0, 1, 0), 0),
    intersection = new Vector3();
  const keys = new Set<string>();
  let pointerFire = false,
    pointerAlt = false,
    primaryTap = false,
    alternateTap = false,
    ordering = false,
    touchOrder = false,
    focused = true;
  let accumulator = 0,
    previous = performance.now(),
    frame = 0,
    oldHits = 0,
    oldShots = 0;
  let defeatElapsed = 0;
  const listeners: (() => void)[] = [];
  function on(
    target: EventTarget,
    name: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
  ) {
    target.addEventListener(name, listener, options);
    listeners.push(() => target.removeEventListener(name, listener, options));
  }
  let audio: AudioContext | undefined;
  function sound(freq: number, duration: number, type: OscillatorType, volume = 0.025) {
    try {
      audio ??= new AudioContext();
      void audio.resume();
      const o = audio.createOscillator(),
        g = audio.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, audio.currentTime);
      o.frequency.exponentialRampToValueAtTime(
        Math.max(40, freq * 0.35),
        audio.currentTime + duration,
      );
      g.gain.setValueAtTime(volume, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
      o.connect(g);
      g.connect(audio.destination);
      o.start();
      o.stop(audio.currentTime + duration);
    } catch {}
  }
  function clearInput() {
    keys.clear();
    pointerFire = false;
    pointerAlt = false;
    primaryTap = alternateTap = false;
    ordering = false;
    touchOrder = false;
    touchX = touchZ = 0;
    touchSlow = touchAlt = touchRescue = false;
    input.x = input.z = 0;
    input.primary = input.alternate = input.slow = input.dodge = input.swap = input.rescue = false;
    state.wasAlt = false;
    state.charge = 0;
    state.bufferedPrimary = 0;
  }
  function pause(value = !state.paused) {
    state.paused = value;
    clearInput();
    app.querySelector<HTMLElement>('.pause-screen')!.hidden = !value;
    app.querySelector('#field-pause')!.textContent = value ? 'Resume ▷' : 'Pause Ⅱ';
  }
  function reset() {
    state = createTraining();
    pause(false);
    oldHits = oldShots = 0;
    defeatElapsed = 0;
    app.querySelector('#trial')!.textContent = 'Start ward trial';
    app.querySelector('#pause-title')!.textContent = 'Take a breath.';
  }
  function aim(e: PointerEvent) {
    const r = stage.getBoundingClientRect();
    pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    if (ray.ray.intersectPlane(plane, intersection)) {
      input.aim = {
        x: intersection.x,
        y: groundHeight(intersection.x, intersection.z),
        z: intersection.z,
      };
    }
  }
  on(renderer.domElement, 'pointermove', (e) => aim(e as PointerEvent));
  on(renderer.domElement, 'pointerdown', (event) => {
    const e = event as PointerEvent;
    aim(e);
    if (state.paused) return;
    renderer.domElement.setPointerCapture(e.pointerId);
    if (ordering || touchOrder) {
      issueOrder(state, input.aim);
      touchOrder = false;
      sound(420, 0.09, 'sine');
    } else if (e.button === 2) pointerAlt = alternateTap = true;
    else pointerFire = primaryTap = true;
  });
  on(renderer.domElement, 'pointerup', (event) => {
    const e = event as PointerEvent;
    if (e.button === 2) pointerAlt = false;
    else pointerFire = false;
  });
  on(renderer.domElement, 'pointercancel', () => clearInput());
  on(renderer.domElement, 'contextmenu', (e) => e.preventDefault());
  on(window, 'keydown', (event) => {
    const e = event as KeyboardEvent;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
    if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
      e.preventDefault();
    if (e.repeat) return;
    if (e.code === 'Escape') {
      pause();
      return;
    }
    if (state.paused) return;
    keys.add(e.code);
    if (e.code === 'Space') input.dodge = true;
    if (e.code === 'KeyQ') input.swap = true;
    if (e.code === 'KeyE') state.order = 'follow';
    if (e.code === 'Tab') {
      ordering = true;
      pointerFire = primaryTap = false;
      state.bufferedPrimary = 0;
    }
  });
  on(window, 'keyup', (event) => {
    const e = event as KeyboardEvent;
    keys.delete(e.code);
    if (e.code === 'Tab') ordering = false;
  });
  on(window, 'blur', () => {
    focused = false;
    pause(true);
  });
  on(window, 'focus', () => {
    focused = true;
  });
  on(document, 'visibilitychange', () => {
    if (document.hidden) pause(true);
  });
  const action = (id: string, fn: () => void) => {
    app.querySelector<HTMLButtonElement>(`#${id}`)!.onclick = fn;
  };
  action('back-armory', back);
  action('restore', reset);
  action('pause-restore', reset);
  action('field-pause', () => pause());
  action('resume', () => {
    if (state.player.hp <= 0) reset();
    else pause(false);
  });
  action('recall', () => {
    state.order = 'follow';
  });
  action('trial', () => {
    state.trial = !state.trial;
    state.nextHazard = 1;
    app.querySelector('#trial')!.textContent = state.trial ? 'End ward trial' : 'Start ward trial';
  });
  let touchX = 0,
    touchZ = 0,
    touchSlow = false,
    touchRescue = false,
    touchAlt = false;
  const pad = app.querySelector<HTMLElement>('#move-pad')!;
  const moveTouch = (event: Event) => {
    const e = event as PointerEvent;
    const r = pad.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) / 35,
      z = (e.clientY - r.top - r.height / 2) / 35;
    const l = Math.max(1, Math.hypot(x, z));
    touchX = x / l;
    touchZ = z / l;
    pad.querySelector<HTMLElement>('i')!.style.transform =
      `translate(${touchX * 30}px,${touchZ * 30}px)`;
  };
  on(pad, 'pointerdown', (e) => {
    pad.setPointerCapture((e as PointerEvent).pointerId);
    moveTouch(e);
  });
  on(pad, 'pointermove', (e) => {
    if ((e as PointerEvent).buttons) moveTouch(e);
  });
  for (const event of ['pointerup', 'pointercancel'])
    on(pad, event, () => {
      touchX = touchZ = 0;
      pad.querySelector<HTMLElement>('i')!.style.transform = '';
    });
  for (const [id, set] of [
    ['touch-alt', (v: boolean) => (touchAlt = v)],
    ['touch-slow', (v: boolean) => (touchSlow = v)],
    ['touch-rescue', (v: boolean) => (touchRescue = v)],
  ] as const) {
    const b = app.querySelector<HTMLElement>(`#${id}`)!;
    on(b, 'pointerdown', (e) => {
      b.setPointerCapture((e as PointerEvent).pointerId);
      set(true);
      if (id === 'touch-alt') alternateTap = true;
    });
    on(b, 'pointerup', () => set(false));
    on(b, 'pointercancel', () => set(false));
  }
  action('touch-dodge', () => {
    input.dodge = true;
  });
  action('touch-swap', () => {
    input.swap = true;
  });
  action('touch-order', () => {
    touchOrder = !touchOrder;
    pointerFire = primaryTap = false;
    state.bufferedPrimary = 0;
  });
  const resize = new ResizeObserver(() => {
    const { width, height } = stage.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / Math.max(1, height);
    camera.fov = width < 700 ? 54 : 41;
    camera.updateProjectionMatrix();
  });
  resize.observe(stage);
  function sync() {
    const all = [state.player, ...state.company];
    const blocked = all.some((a) => {
      sightline.set(a.x, a.y + (a.hp > 0 ? 1 : 0.3), a.z).sub(camera.position);
      occlusionRay.far = sightline.length();
      occlusionRay.set(camera.position, sightline.normalize());
      return occlusionRay.intersectObjects(occluders, false).length > 0;
    });
    for (const mesh of occluders) {
      const material = mesh.material as MeshStandardMaterial;
      material.opacity += ((blocked ? 0.16 : 1) - material.opacity) * 0.2;
      material.depthWrite = material.opacity > 0.95;
    }
    for (const [index, a] of all.entries()) {
      const avatar = actors[index];
      const prior = priorPositions[index];
      const dx = a.x - prior.x,
        dz = a.z - prior.z,
        l = Math.max(0.0001, Math.hypot(dx, dz));
      avatar.root.position.set(a.x, a.y, a.z);
      avatar.root.rotation.y = a.yaw;
      avatar.weapon = a.weapon;
      let action =
        index === 0
          ? state.wasAlt
            ? a.weapon === 'stormbow'
              ? state.charge >= 1
                ? 'bow_hold'
                : 'bow_draw'
              : 'lance_charge'
            : a.action
          : a.action;
      let actionTime = a.actionTime;
      if (index === 0 && state.wasAlt) actionTime = state.charge * 0.8;
      if (state.rescueBy === index) {
        action = 'interact';
        actionTime = state.rescueProgress;
      } else if (a.hurtTime > 0 && a.hp > 0 && !a.action && !state.wasAlt) {
        action = 'hit';
        actionTime = 0.4 - a.hurtTime;
      }
      avatar.setDowned(a.hp <= 0);
      avatar.animate(
        a.moving,
        (dx * Math.cos(a.yaw) - dz * Math.sin(a.yaw)) / l,
        action,
        (dx * Math.sin(a.yaw) + dz * Math.cos(a.yaw)) / l,
        index === 0 && state.dodgeTime > 0,
        actionTime,
        state.dodgeDirection,
      );
      avatar.update(state.paused ? 0 : state.lastDelta);
    }
    cursor.position.set(input.aim.x, input.aim.y + 0.02, input.aim.z);
    cursor.visible = !state.paused;
    for (const bolt of state.bolts) {
      let mesh = boltMeshes.get(bolt.id);
      if (!mesh) {
        mesh = new Mesh(boltGeo, bolt.weapon === 'stormbow' ? arrowMat : lanceMat);
        boltMeshes.set(bolt.id, mesh);
        scene.add(mesh);
      }
      mesh.position.set(bolt.x, bolt.y, bolt.z);
      mesh.lookAt(bolt.x + bolt.vx, bolt.y + bolt.vy, bolt.z + bolt.vz);
    }
    for (const [id, mesh] of boltMeshes)
      if (!state.bolts.some((b) => b.id === id)) {
        mesh.removeFromParent();
        boltMeshes.delete(id);
      }
    for (const h of state.hazards) {
      let view = hazardMeshes.get(h.id);
      if (!view) {
        view = new DangerView(h);
        hazardMeshes.set(h.id, view);
        scene.add(view.root);
      }
      view.update(h);
    }
    for (const [id, view] of hazardMeshes)
      if (!state.hazards.some((h) => h.id === id)) {
        view.dispose();
        hazardMeshes.delete(id);
      }
    targetFaces.forEach((mesh, index) =>
      (mesh.material as MeshStandardMaterial).emissive.set(
        state.targets[index].flash > 0 ? 0x705526 : 0x000000,
      ),
    );
    orderMarkers.forEach((m, index) => {
      m.visible = state.order === 'hold';
      const x = state.destination.x + (index ? 0.8 : -0.8);
      m.position.set(x, groundHeight(x, state.destination.z) + 0.025, state.destination.z);
    });
    app.querySelector('#hp')!.textContent = String(Math.ceil(state.player.hp));
    (app.querySelector('#hp-bar') as HTMLMeterElement).value = state.player.hp;
    app.querySelector('#field-weapon')!.textContent = state.player.weapon.toUpperCase();
    app.querySelector('#weapon-hint')!.textContent = state.wasAlt
      ? 'Release alternate to fire'
      : state.player.weapon === 'stormbow'
        ? 'Hold primary to draw and loose'
        : 'Hold primary for focused discharges';
    app.querySelector<HTMLElement>('#charge-fill')!.style.width = `${state.charge * 100}%`;
    app.querySelector('#dodge-pips')!.textContent =
      '◆ '.repeat(state.dodgeCharges) + '◇ '.repeat(2 - state.dodgeCharges);
    app.querySelector('#focus')!.textContent = `FOCUS ${Math.round(state.focus)}`;
    app.querySelector('#hits')!.innerHTML =
      `${state.hits} <small>hits / ${state.shots} shots</small>`;
    app.querySelector('#evades')!.textContent = `${state.dodged} attacks evaded`;
    for (const [index, name] of ['elin', 'corvin'].entries()) {
      app.querySelector(`#${name}-order`)!.textContent =
        state.company[index].hp <= 0
          ? 'DOWNED · ASSIST'
          : state.company[index].action === 'recover'
            ? 'RECOVERING'
            : state.rescueBy === index + 1
              ? 'ASSISTING'
              : state.order === 'follow'
                ? 'FOLLOWING'
                : 'HOLDING';
      (app.querySelector(`#${name}-health`) as HTMLMeterElement).value = state.company[index].hp;
    }
    app.querySelector('#rescue-text')!.textContent =
      state.rescueTarget >= 0
        ? `ASSISTING ${['COMMANDER', 'ELIN', 'CORVIN'][state.rescueTarget]} · ${Math.ceil((1.8 - state.rescueProgress) * 10) / 10}s`
        : state.player.hp <= 0 && !state.failed
          ? 'DOWNED · A KNIGHT IS COMING TO HELP'
          : state.company.some((a) => a.hp <= 0)
            ? `HOLD F NEAR A FALLEN KNIGHT · ${state.rescueCharges} DRESSINGS`
            : `FIELD DRESSINGS ${state.rescueCharges} · ${state.rescues} RESCUED`;
    (app.querySelector('#rescue-progress') as HTMLProgressElement).value = state.rescueProgress;
    app
      .querySelector<HTMLElement>('#rescue-status')!
      .classList.toggle('rescuing', state.rescueTarget >= 0);
    const warning = state.hazards.find((h) => dangerPhase(h) === 'warning');
    const active = state.hazards.find((h) => dangerPhase(h) === 'active');
    app.querySelector('#drill-message')!.textContent =
      ordering || touchOrder
        ? 'Choose a position for your company.'
        : warning
          ? `${warning.label} in ${(warning.warning - warning.age).toFixed(1)}s. ${warning.shape.kind === 'sweep' ? 'Move behind the source or dodge the moving ray.' : warning.cadence ? 'Leave the marked ground; fire will linger.' : 'Leave the circle or time your dodge.'}`
          : active
            ? `${active.label} active. ${active.cadence ? 'Fire deals damage every half second.' : 'Get your company clear.'}`
            : state.trial
              ? 'Keep moving. Your company needs orders, too.'
              : 'Try both weapons. Lead your company. Take the high ground.';
  }
  function disposeGroup(group: Group) {
    group.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose();
      }
    });
    group.removeFromParent();
  }
  function tick(now: number) {
    let elapsed = Math.min((now - previous) / 1000, 0.1);
    previous = now;
    accumulator += elapsed;
    input.x = touchX + (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
    input.z = touchZ + (keys.has('KeyS') ? 1 : 0) - (keys.has('KeyW') ? 1 : 0);
    input.primary = (pointerFire || primaryTap) && !ordering && !touchOrder;
    input.alternate = pointerAlt || touchAlt || alternateTap;
    input.rescue = keys.has('KeyF') || touchRescue;
    input.slow = keys.has('ShiftLeft') || keys.has('ShiftRight') || ordering || touchSlow;
    while (accumulator >= 1 / 60) {
      [state.player, ...state.company].forEach((a, index) =>
        Object.assign(priorPositions[index], { x: a.x, y: a.y, z: a.z, yaw: a.yaw }),
      );
      if (focused) stepTraining(state, input);
      primaryTap = alternateTap = false;
      input.primary = pointerFire && !ordering && !touchOrder;
      input.alternate = pointerAlt || touchAlt;
      input.dodge = false;
      input.swap = false;
      sync();
      accumulator -= 1 / 60;
    }
    const alpha = accumulator / (1 / 60);
    [state.player, ...state.company].forEach((a, index) => {
      const prior = priorPositions[index];
      actors[index].root.position.set(
        prior.x + (a.x - prior.x) * alpha,
        prior.y + (a.y - prior.y) * alpha,
        prior.z + (a.z - prior.z) * alpha,
      );
      actors[index].root.rotation.y =
        prior.yaw + Math.atan2(Math.sin(a.yaw - prior.yaw), Math.cos(a.yaw - prior.yaw)) * alpha;
    });
    if (state.failed && !state.paused) {
      defeatElapsed += elapsed;
      if (defeatElapsed >= 1.4) {
        app.querySelector('#pause-title')!.textContent = 'The company needs rest.';
        pause(true);
      }
    }
    if (state.hits > oldHits) sound(520, 0.1, 'triangle', 0.035);
    else if (state.shots > oldShots)
      sound(state.player.weapon === 'stormbow' ? 180 : 290, 0.12, 'triangle');
    oldHits = state.hits;
    oldShots = state.shots;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  const snapshot = () => ({
    mode: 'courtyard',
    time: state.time,
    player: { ...state.player },
    company: state.company.map((a) => ({ ...a })),
    order: state.order,
    destination: { ...state.destination },
    shots: state.shots,
    hits: state.hits,
    hazards: state.hazards.map((h) => ({ ...h })),
    damage: state.damage,
    dodged: state.dodged,
    paused: state.paused,
    dodgeCharges: state.dodgeCharges,
    focus: state.focus,
    rescueCharges: state.rescueCharges,
    rescueProgress: state.rescueProgress,
    rescueTarget: state.rescueTarget,
    rescues: state.rescues,
    failed: state.failed,
    gateOpacity: (occluders[0]?.material as MeshStandardMaterial | undefined)?.opacity,
    poses: actors.map((a) => a.poseSnapshot()),
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
  });
  (window as unknown as { __NEON_NEXT__: unknown }).__NEON_NEXT__ = { snapshot };
  if (import.meta.env.DEV)
    Object.assign((window as unknown as { __NEON_NEXT__: object }).__NEON_NEXT__, {
      reset,
      advance: (ticks: number) => {
        for (let n = 0; n < Math.min(ticks, 600); n++) stepTraining(state, neutralInput());
      },
      aim: (x: number, z: number) => (input.aim = { x, y: groundHeight(x, z), z }),
      review: (kind: 'impact' | 'sweep' | 'fire' | 'rescue' | 'commander') => {
        reset();
        if (kind === 'rescue') {
          state.company[0].hp = 0;
          state.player.x = state.company[0].x;
          state.player.z = state.company[0].z - 1;
        } else if (kind === 'commander') state.player.hp = 0;
        else
          state.hazards.push(
            makeDanger(
              state.nextId++,
              kind,
              kind === 'sweep' ? { x: 0, y: 0, z: 1 } : state.player,
            ),
          );
      },
    });
  return () => {
    cancelAnimationFrame(frame);
    listeners.forEach((fn) => fn());
    resize.disconnect();
    actors.forEach((a) => a.dispose());
    occluders.forEach((mesh) => (mesh.material as MeshStandardMaterial).dispose());
    disposeGroup(resources);
    hazardMeshes.forEach((view) => view.dispose());
    boltGeo.dispose();
    arrowMat.dispose();
    lanceMat.dispose();
    cursor.geometry.dispose();
    (cursor.material as MeshStandardMaterial).dispose();
    orderMarkers.forEach((m) => {
      m.geometry.dispose();
      (m.material as MeshStandardMaterial).dispose();
    });
    void audio?.close();
    renderer.dispose();
  };
}
