import {
  ACESFilmicToneMapping,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Assets } from './presentation/Assets';
import { DefenseView } from './presentation/DefenseView';
import { createDefenses, type Defense } from './construction/DefenseSystem';
import {
  capacityLimit,
  defaultYaw,
  defenses,
  investment,
  sites,
  spec,
  type DefenseKind,
  type Rank,
  type SiteId,
} from './construction/Catalog';
import {
  createWorkshop,
  loadWorkshop,
  placeDefense,
  relocateDefense,
  repairCost,
  repairDefense,
  salvageDefense,
  salvageValue,
  saveWorkshop,
  upgradeDefense,
  usedCapacity,
} from './construction/Workshop';

export function mountConstruction(
  app: HTMLElement,
  assets: Assets,
  back: () => void,
  courtyard: () => void,
) {
  const loaded = loadWorkshop();
  let state = loaded.state;
  let kind: DefenseKind = 'ballista',
    rank: Rank = 1,
    site: SiteId = sites[0].id,
    yaw = defaultYaw(sites[0]);
  let placement = false,
    compare = false,
    neutral = true,
    relocating: number | null = null;
  app.innerHTML = `<div class="workshop-root"><header><button class="quiet" id="workshop-back">← The armory</button><span class="build-label">THE ROYAL WORKSHOP</span><button class="quiet" id="workshop-enter">Enter courtyard ↗</button></header><main class="workshop-layout"><aside class="workshop-catalog"><span class="eyebrow">02 / RAISE THE BASTION</span><h1>Built to <br><em>hold.</em></h1><p>Choose the machine. Inspect every rank. Give it ground worth defending.</p><div class="workshop-wallet"><span>CROWNS <b id="workshop-gold"></b></span><span>CAPACITY <b id="workshop-capacity"></b></span></div><div class="defense-catalog">${Object.entries(
    defenses,
  )
    .map(
      ([id, def], i) =>
        `<button data-defense="${id}"><span class="eyebrow">0${i + 1} / ${def.capacity} CAPACITY</span><strong>${def.name}</strong><small>${def.subtitle}</small></button>`,
    )
    .join(
      '',
    )}</div><p class="workshop-scope">Workshop allotment: 1,200 crowns. Your defenses and remaining crowns are saved in this browser. Campaign economy is still in development.</p><details><summary>Workshop ledger</summary><p>Inspection is free. New builds pay the full cost of the selected rank. Upgrades pay only the next rank's cost. Relocation and facing changes are free; salvage returns 70% of construction investment.</p><button class="quiet" id="workshop-reset">Reset all defenses & crowns</button></details></aside><section class="workshop-preview"><div class="workshop-view-tabs"><button id="inspect-view" class="selected">Inspect machine</button><button id="placement-view">Place in courtyard</button></div><div class="workshop-stage" aria-label="Defense model and placement preview"></div><div class="workshop-stage-tools"><button class="quiet" id="compare-ranks">Compare all three ranks</button><label><input type="checkbox" id="neutral-materials" checked> Neutral materials</label></div><div class="rank-selector" role="group" aria-label="Defense rank">${[1, 2, 3].map((n) => `<button data-rank="${n}"><b>${['I', 'II', 'III'][n - 1]}</b><span id="rank-name-${n}"></span></button>`).join('')}</div><div class="site-selector" aria-label="Construction sites"></div></section><aside class="workshop-details"><span class="eyebrow" id="defense-subtitle"></span><h2 id="defense-title"></h2><p id="defense-description"></p><dl id="defense-stats"></dl><div class="facing-control"><label for="defense-facing">FACING <output id="facing-value"></output></label><input id="defense-facing" type="range" min="0" max="359" step="1"></div><div class="workshop-actions"><button class="primary" id="build-defense"></button><button class="secondary" id="upgrade-defense"></button><button class="secondary" id="move-defense">Relocate · free</button><button class="secondary" id="cancel-move" hidden>Cancel relocation</button><button class="quiet" id="repair-defense"></button><button class="quiet" id="salvage-defense"></button></div><p id="workshop-notice" role="status"></p><p class="fine">Ballista bolts strike the range targets. Aegis barriers intercept sweeping ward rays; impacts and ground fire bypass them.</p></aside></main></div>`;
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => app.querySelector<T>(`#${id}`)!;
  const stage = app.querySelector<HTMLElement>('.workshop-stage')!;
  const scene = new Scene();
  scene.background = new Color(0x15212b);
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  stage.append(renderer.domElement);
  const camera = new PerspectiveCamera(38, 1, 0.1, 100);
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.maxPolarAngle = Math.PI * 0.47;
  scene.add(new HemisphereLight(0xc7dce6, 0x282a21, 2.2));
  const key = new DirectionalLight(0xffe2ae, 3.2);
  key.position.set(-5, 12, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, far: 45 });
  key.shadow.normalBias = 0.025;
  scene.add(key);
  const rim = new DirectionalLight(0x76adb9, 1.4);
  rim.position.set(7, 8, -7);
  scene.add(rim);
  const court = assets.get('courtyard').scene.clone(true);
  scene.add(court);
  const platform = new Mesh(
    new CylinderGeometry(5.4, 5.6, 0.2, 64),
    new MeshStandardMaterial({ color: 0x263743, roughness: 0.7 }),
  );
  platform.position.y = -0.12;
  platform.receiveShadow = true;
  scene.add(platform);
  const padMaterial = new MeshStandardMaterial({
    color: 0xa99162,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const pads = sites.map((p) => {
    const mesh = new Mesh(new CylinderGeometry(1.95, 1.95, 0.025, 48), padMaterial.clone());
    mesh.position.set(p.x, 0.03, p.z);
    mesh.userData.site = p.id;
    scene.add(mesh);
    return mesh;
  });
  let views: DefenseView[] = [],
    runtime: Defense[] = [],
    previewIds = new Set<number>();
  const selected = () =>
    state.buildings.find((b) => (relocating !== null ? b.id === relocating : b.site === site));
  const sitePoint = () => sites.find((s) => s.id === site)!;
  function cameraMode() {
    const fit = Math.max(1, (placement ? 1.3 : compare ? 1.6 : 0.85) / camera.aspect);
    if (placement) {
      camera.position.set(0, 24, 24);
      orbit.target.set(0, 0, 0);
      orbit.minDistance = 18;
      orbit.maxDistance = 45 * fit;
    } else {
      camera.position.set(compare ? 5 : 3.3, compare ? 4 : 2.7, compare ? 11 : 5.2);
      orbit.target.set(0, 1, 0);
      orbit.minDistance = 3;
      orbit.maxDistance = 18 * fit;
    }
    camera.position.sub(orbit.target).multiplyScalar(fit).add(orbit.target);
    orbit.update();
  }
  function rebuild() {
    views.forEach((v) => v.dispose());
    views = [];
    runtime = [];
    previewIds.clear();
    court.visible = placement;
    platform.visible = !placement;
    pads.forEach((p) => (p.visible = placement));
    const add = (b: Defense, ghost = false, preview = false) => {
      const view = new DefenseView(assets, b.kind, b.rank, ghost);
      view.neutral(neutral);
      view.coverage.visible = placement && (preview || b.site === site);
      view.update(b, !placement);
      views.push(view);
      runtime.push(b);
      if (preview) previewIds.add(b.id);
      scene.add(view.root);
    };
    if (placement) {
      for (const b of createDefenses(state)) {
        b.age = 2;
        if (b.id !== relocating) add(b);
      }
      if (relocating !== null || !state.buildings.some((b) => b.site === site)) {
        const source = selected();
        const ghost = createDefenses({
          version: 1,
          gold: 0,
          nextId: 2,
          buildings: [
            {
              id: -1,
              kind: source && relocating !== null ? source.kind : kind,
              rank: source && relocating !== null ? source.rank : rank,
              site,
              yaw,
              hp: source?.hp ?? spec(kind, rank).health,
            },
          ],
        })[0];
        ghost.age = 2;
        add(ghost, true, true);
      }
    } else {
      for (const level of compare ? ([1, 2, 3] as Rank[]) : [rank]) {
        const b = createDefenses({
          version: 1,
          gold: 0,
          nextId: 1,
          buildings: [
            { id: -level, kind, rank: level, site, yaw: 0, hp: spec(kind, level).health },
          ],
        })[0];
        b.x = compare ? (level - 2) * 3.5 : 0;
        b.z = 0;
        b.y = 0;
        b.age = 2;
        b.aimYaw = 0;
        add(b, false, true);
      }
    }
    pads.forEach((p) =>
      (p.material as MeshStandardMaterial).color.setHex(
        p.userData.site === site ? 0xf3d28a : 0x789b99,
      ),
    );
  }
  function renderUI(message?: string) {
    const d = defenses[kind],
      r = spec(kind, rank),
      built = selected(),
      occupied = state.buildings.find((b) => b.site === site);
    $('workshop-gold').textContent = String(state.gold);
    $('workshop-capacity').textContent = `${usedCapacity(state)} / ${capacityLimit}`;
    app
      .querySelectorAll<HTMLButtonElement>('[data-defense]')
      .forEach((b) => b.classList.toggle('selected', b.dataset.defense === kind));
    app
      .querySelectorAll<HTMLButtonElement>('[data-rank]')
      .forEach((b) => b.classList.toggle('selected', Number(b.dataset.rank) === rank));
    for (let n = 1; n <= 3; n++) $(`rank-name-${n}`).textContent = spec(kind, n as Rank).name;
    $('defense-subtitle').textContent = `RANK ${r.title} / ${r.name.toUpperCase()}`;
    $('defense-title').textContent = d.name;
    $('defense-description').textContent = d.description;
    $('defense-stats').innerHTML =
      `<div><dt>Full construction</dt><dd>${investment(kind, rank)} crowns</dd></div><div><dt>Capacity</dt><dd>${d.capacity}</dd></div><div><dt>Durability</dt><dd>${r.health}</dd></div><div><dt>Coverage</dt><dd>${r.range} m · ${r.arc}°</dd></div>` +
      (kind === 'ballista'
        ? `<div><dt>Bolt damage</dt><dd>${r.damage}</dd></div><div><dt>Reload</dt><dd>${r.interval} s</dd></div>`
        : `<div><dt>Shield reserve</dt><dd>${r.capacity}</dd></div><div><dt>Recharge</dt><dd>${r.recharge} / s</dd></div>`);
    const facing = (180 - (yaw * 180) / Math.PI + 720) % 360;
    $<HTMLInputElement>('defense-facing').value = String(Math.round(facing));
    $('facing-value').textContent = `${Math.round(facing)}°`;
    const build = $<HTMLButtonElement>('build-defense');
    build.textContent =
      relocating !== null
        ? 'Confirm relocation · free'
        : `Build rank ${r.title} · ${investment(kind, rank)} crowns`;
    build.disabled =
      relocating !== null
        ? !!occupied && occupied.id !== relocating
        : !!occupied ||
          state.gold < investment(kind, rank) ||
          usedCapacity(state) + d.capacity > capacityLimit;
    const upgrade = $<HTMLButtonElement>('upgrade-defense');
    upgrade.hidden = !built || relocating !== null;
    upgrade.textContent =
      built && built.rank < 3
        ? `Upgrade to ${spec(built.kind, (built.rank + 1) as Rank).title} · ${spec(built.kind, (built.rank + 1) as Rank).cost} crowns`
        : 'Rank III complete';
    upgrade.disabled =
      !built ||
      built.rank === 3 ||
      built.hp <= 0 ||
      state.gold < spec(built.kind, Math.min(3, built.rank + 1) as Rank).cost;
    $<HTMLButtonElement>('move-defense').disabled = !built;
    $('cancel-move').hidden = relocating === null;
    const repair = $<HTMLButtonElement>('repair-defense');
    repair.textContent = built
      ? `Repair ${Math.ceil(built.hp)} / ${spec(built.kind, built.rank).health} · ${repairCost(built)} crowns`
      : 'Select a deployed defense to repair';
    repair.disabled = !built || !repairCost(built) || state.gold < repairCost(built);
    const salvage = $<HTMLButtonElement>('salvage-defense');
    salvage.textContent = built ? `Salvage · recover ${salvageValue(built)} crowns` : 'Salvage';
    salvage.disabled = !built;
    $('inspect-view').classList.toggle('selected', !placement);
    $('placement-view').classList.toggle('selected', placement);
    $('compare-ranks').textContent = compare ? 'Show selected rank' : 'Compare all three ranks';
    $('compare-ranks').hidden = placement;
    app.querySelector('.site-selector')!.innerHTML = sites
      .map((p) => {
        const b = state.buildings.find((b) => b.site === p.id);
        return `<button data-site="${p.id}" class="${site === p.id ? 'selected' : ''}"><span>${p.name}</span><b>${b ? `${defenses[b.kind].name} ${spec(b.kind, b.rank).title}` : 'Open site'}</b></button>`;
      })
      .join('');
    app
      .querySelectorAll<HTMLButtonElement>('[data-site]')
      .forEach((b) => (b.onclick = () => selectSite(b.dataset.site as SiteId)));
    if (message !== undefined) $('workshop-notice').textContent = message;
    else if (relocating !== null)
      $('workshop-notice').textContent =
        'Choose an open site, set facing, then confirm the free move.';
    else if (occupied)
      $('workshop-notice').textContent =
        `${sitePoint().name}: ${defenses[occupied.kind].name} ${spec(occupied.kind, occupied.rank).title}. Inspect other ranks or manage this defense below.`;
    else if (usedCapacity(state) + d.capacity > capacityLimit)
      $('workshop-notice').textContent =
        `${sitePoint().name} is open. This machine needs ${d.capacity} capacity; ${capacityLimit - usedCapacity(state)} remains. Salvage a defense to free capacity.`;
    else if (state.gold < investment(kind, rank))
      $('workshop-notice').textContent =
        `${sitePoint().name} is open. You need ${investment(kind, rank) - state.gold} more crowns for this rank. Choose a lower rank or salvage a defense.`;
    else
      $('workshop-notice').textContent =
        `${sitePoint().name} is open. ${investment(kind, rank)} crowns builds the selected rank.`;
  }
  function selectSite(id: SiteId) {
    site = id;
    const b = selected();
    if (b && relocating === null) {
      kind = b.kind;
      rank = b.rank;
      yaw = b.yaw;
    } else yaw = defaultYaw(sitePoint());
    if (!placement) {
      placement = true;
      cameraMode();
    }
    rebuild();
    renderUI();
  }
  function transaction(fn: () => string | null) {
    const error = fn();
    if (error) {
      renderUI(error);
      return;
    }
    const notice = saveWorkshop(state);
    relocating = null;
    rebuild();
    renderUI(notice || 'Workshop saved. Your defense is ready in the courtyard.');
  }
  $('workshop-back').onclick = back;
  $('workshop-enter').onclick = courtyard;
  app.querySelectorAll<HTMLButtonElement>('[data-defense]').forEach(
    (b) =>
      (b.onclick = () => {
        kind = b.dataset.defense as DefenseKind;
        rank = 1;
        relocating = null;
        rebuild();
        renderUI();
      }),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-rank]').forEach(
    (b) =>
      (b.onclick = () => {
        rank = Number(b.dataset.rank) as Rank;
        rebuild();
        renderUI();
      }),
  );
  $('inspect-view').onclick = () => {
    placement = false;
    cameraMode();
    rebuild();
    renderUI();
  };
  $('placement-view').onclick = () => {
    placement = true;
    cameraMode();
    rebuild();
    renderUI();
  };
  $('compare-ranks').onclick = () => {
    compare = !compare;
    cameraMode();
    rebuild();
    renderUI();
  };
  $<HTMLInputElement>('neutral-materials').onchange = (e) => {
    neutral = (e.target as HTMLInputElement).checked;
    views.forEach((v) => v.neutral(neutral));
  };
  const facing = $<HTMLInputElement>('defense-facing');
  facing.oninput = () => {
    yaw = Math.PI - (Number(facing.value) * Math.PI) / 180;
    const current = selected();
    for (let n = 0; n < runtime.length; n++)
      if (previewIds.has(runtime[n].id) || (placement && runtime[n].id === current?.id)) {
        runtime[n].yaw = yaw;
        runtime[n].aimYaw = yaw;
      }
    $('facing-value').textContent = `${facing.value}°`;
  };
  facing.onchange = () => {
    const b = selected();
    if (b && relocating === null) transaction(() => relocateDefense(state, b.id, b.site, yaw));
  };
  $('build-defense').onclick = () =>
    transaction(() =>
      relocating !== null
        ? relocateDefense(state, relocating, site, yaw)
        : placeDefense(state, kind, site, yaw, rank),
    );
  $('upgrade-defense').onclick = () => {
    const b = selected();
    if (b)
      transaction(() => {
        const e = upgradeDefense(state, b.id);
        if (!e) {
          kind = b.kind;
          rank = b.rank;
        }
        return e;
      });
  };
  $('move-defense').onclick = () => {
    const b = selected();
    if (!b) return;
    relocating = b.id;
    placement = true;
    cameraMode();
    rebuild();
    renderUI();
  };
  $('cancel-move').onclick = () => {
    relocating = null;
    rebuild();
    renderUI();
  };
  $('repair-defense').onclick = () => {
    const b = selected();
    if (b) transaction(() => repairDefense(state, b.id));
  };
  $('salvage-defense').onclick = () => {
    const b = selected();
    if (b) transaction(() => salvageDefense(state, b.id));
  };
  $('workshop-reset').onclick = () => {
    state = createWorkshop();
    relocating = null;
    transaction(() => null);
  };
  const ray = new Raycaster(),
    pointer = new Vector2();
  let downX = 0,
    downY = 0;
  const down = (e: PointerEvent) => {
    downX = e.clientX;
    downY = e.clientY;
  };
  const up = (e: PointerEvent) => {
    if (!placement || Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
    const r = stage.getBoundingClientRect();
    pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(pads, false)[0];
    if (hit) selectSite(hit.object.userData.site);
  };
  renderer.domElement.addEventListener('pointerdown', down);
  renderer.domElement.addEventListener('pointerup', up);
  const resize = new ResizeObserver(() => {
    const r = stage.getBoundingClientRect();
    renderer.setSize(r.width, r.height);
    camera.aspect = r.width / Math.max(1, r.height);
    camera.updateProjectionMatrix();
    cameraMode();
  });
  resize.observe(stage);
  cameraMode();
  rebuild();
  renderUI(loaded.notice || undefined);
  let frame = 0,
    previous = performance.now();
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - previous) / 1000);
    previous = now;
    for (let n = 0; n < views.length; n++) {
      const b = runtime[n];
      if (!document.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        b.age += dt;
        if (!placement) {
          b.aimYaw = b.yaw + Math.sin(b.age * 0.3) * 0.28;
          const interval = spec(b.kind, b.rank).interval || 3;
          const cycle = b.age % interval;
          b.reload = interval - cycle;
          b.recoil = cycle < 0.42 ? 0.42 - cycle : 0;
        }
      }
      views[n].update(b, !placement);
    }
    orbit.update();
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  (window as unknown as { __NEON_NEXT__: unknown }).__NEON_NEXT__ = {
    snapshot: () => ({
      mode: 'construction',
      plan: structuredClone(state),
      preview: { kind, rank, site, yaw, placement, compare, neutral, relocating },
      models: views.map((v) => `${v.kind}-${v.rank}`),
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
    }),
  };
  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    orbit.dispose();
    renderer.domElement.removeEventListener('pointerdown', down);
    renderer.domElement.removeEventListener('pointerup', up);
    views.forEach((v) => v.dispose());
    platform.geometry.dispose();
    (platform.material as MeshStandardMaterial).dispose();
    pads.forEach((p) => {
      p.geometry.dispose();
      (p.material as MeshStandardMaterial).dispose();
    });
    padMaterial.dispose();
    renderer.dispose();
  };
}
