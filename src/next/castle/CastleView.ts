import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
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
  SphereGeometry,
  TorusGeometry,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Assets } from '../presentation/Assets';
import { DefenseView } from '../presentation/DefenseView';
import { spec, defenses, type DefenseKind, type Rank, type SiteId } from '../construction/Catalog';
import * as C from './Campaign';
import {
  encounters,
  items,
  mounts,
  recruits,
  relics,
  wallSpec,
  royalWeapons,
  mountHeight,
  isSupport,
  fitsMount,
  type Relic,
  type ItemKind,
} from './Catalog';
import { Battle, wallSide, type Actor } from './Battle';
import { Character, kit } from './Character';
import type { Weapon } from '../presentation/Paladin';
import './castle.css';
import { buildingCouncil, companyCouncil } from './Council';
import { platformAt } from './Placement';
import { Environment } from './Environment';
import { RoyalEffects } from './RoyalEffects';
import { ContactShadows } from './ContactShadows';
import { AttackView } from './AttackView';
import { WallDamage } from './WallDamage';
import { CombatAudio } from './CombatAudio';
import { CastleAssembly } from './CastleAssembly';
import { bindTouchTaps } from './TouchTaps';

const roman = ['I', 'II', 'III'];
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function mountCastle(app: HTMLElement, assets: Assets, foundry: () => void) {
  const loaded = C.loadCampaign();
  const audio = new CombatAudio();
  let campaign = loaded.state || C.createCampaign(),
    battle = new Battle(campaign),
    tab = 'castle',
    site: SiteId = 'inner-sw';
  let selectedKnight = 'aldren';
  const expandedDetails = new Set<string>();
  let picked: string | null = null;
  let notice =
    loaded.notice ||
    (C.hasTavern(campaign)
      ? 'Company ready. Choose your next upgrade.'
      : 'Build a tavern to recruit more knights.');
  let accumulator = 0;
  let battlePortrait = false;
  let frame = 0,
    last = performance.now(),
    lastFrameSample = last,
    hudTime = 0,
    finished = false,
    disposed = false,
    dragging = false;
  const input = {
    rotate: 0,
    heading: undefined as number | undefined,
    guard: false,
    decree: false,
  };
  const keys = new Set<string>();
  app.innerHTML = `<div class="castle-app"><header class="castle-header"><a class="wordmark" href="${import.meta.env.BASE_URL}"><span class="crest">N</span>NEON <b>KNIGHTS</b></a><span class="castle-chapter">THE KING'S BATTLEMENTS</span><div><button class="quiet" id="castle-foundry">Art & training</button><button class="quiet" id="castle-sound" aria-label="Toggle combat sound">Sound</button><button class="quiet" id="castle-pause">Pause</button></div></header><main class="castle-layout"><section class="castle-stage" aria-label="Castle siege battlefield"><div class="castle-canvas"></div><div class="castle-labels" aria-hidden="true"></div><div class="castle-title"><span class="eyebrow">THE ROYAL HOLD</span><h1>Hold the crown.</h1><p id="castle-objective"></p></div><div class="castle-boss" hidden><span>THE EMBERWING DRAGON</span><meter min="0" max="1650" value="1650"></meter><small>Amber: move away &middot; Red: impact</small></div><div class="castle-announcement" role="status"></div><div class="castle-chain" aria-live="polite"></div><div class="castle-assault"><span></span><i></i></div><div class="castle-hud"><div class="castle-integrity" aria-label="Castle wall integrity">${['N', 'E', 'S', 'W'].map((name, i) => `<div><span>${name}</span><meter id="wall-health-${i}" min="0" max="100" value="100"></meter></div>`).join('')}</div><div class="castle-rotation"><button id="king-left" aria-label="Move King clockwise">↶</button><button id="king-weapon" data-action="weapon-swap" class="weapon-switch"><b>Stormbow</b><small>AUTO FIRE / Q TO SWAP</small></button><button id="king-right" aria-label="Move King counterclockwise">↷</button></div><button id="king-guard" class="royal-skill">Guard wall <small id="guard-status">READY / E</small><i id="guard-ready"></i></button><button id="king-decree" class="royal-skill">Royal Decree <small id="decree-power"></small><i id="royal-power"></i></button></div><div class="castle-result" hidden></div></section><aside class="war-council"><div class="council-heading"><span class="eyebrow">WAR COUNCIL</span><div><h2 id="watch-name"></h2><strong id="castle-gold"></strong></div><p id="watch-description"></p><button class="quiet new-siege" data-action="new-dialog">New siege</button></div><nav class="council-tabs" aria-label="Castle management"><button data-tab="castle">Build</button><button data-tab="company">Knights</button><button data-tab="armory">King & gear</button><button data-tab="relics">Relics</button></nav><div class="council-content"></div><div class="council-bottom"><p id="council-notice" role="status"></p><button class="primary" id="begin-watch">Begin watch <span>↗</span></button><p class="checkpoint-note">Saved between watches</p></div></aside></main></div>`;
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => app.querySelector<T>(s)!;
  const stage = $('.castle-stage'),
    canvas = $('.castle-canvas'),
    labels = $('.castle-labels'),
    content = $('.council-content');
  const soundButton = $('#castle-sound');
  const syncSound = () => {
    soundButton.textContent = audio.muted ? 'Sound off' : 'Sound on';
    soundButton.setAttribute('aria-pressed', String(!audio.muted));
  };
  syncSound();
  soundButton.onclick = () => {
    audio.toggle();
    syncSound();
  };
  const touchControls = matchMedia('(pointer: coarse)').matches;
  if (touchControls) {
    $('#king-weapon small').textContent = 'AUTO FIRE / TAP TO SWAP';
    $('#king-guard small').textContent = 'TAP TO GUARD';
  }
  const wallLabels = Array.from({ length: 4 }, (_, i) => {
    const label = document.createElement('div');
    label.className = 'castle-wall-label';
    label.setAttribute('aria-hidden', 'true');
    label.textContent = ['NORTH', 'EAST', 'SOUTH', 'WEST'][i];
    stage.append(label);
    return label;
  });
  const scene = new Scene();
  scene.background = new Color(0x111e25);
  scene.fog = new Fog(0x96b8ba, 65, 115);
  const environment = new Environment(scene);
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.17;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  let viewportWidth = canvas.clientWidth,
    viewportHeight = canvas.clientHeight;
  canvas.append(renderer.domElement);
  const camera = new PerspectiveCamera(41, 1, 0.1, 400);
  camera.position.set(0, 30, 25);
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.target.set(0, 1, 0);
  orbit.enableDamping = true;
  orbit.minDistance = 17;
  orbit.maxDistance = 110;
  orbit.maxPolarAngle = Math.PI * 0.43;
  orbit.minPolarAngle = 0.32;
  orbit.enablePan = false;
  scene.add(new HemisphereLight(0xc8e2ec, 0x2d3630, 2.5));
  const sun = new DirectionalLight(0xffdfa8, 3.6);
  sun.position.set(-14, 25, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, far: 70 });
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.0002;
  scene.add(sun);
  const rim = new DirectionalLight(0x6eacda, 1.8);
  rim.position.set(8, 14, -17);
  scene.add(rim);
  scene.add(assets.get('castle-ground').scene.clone(true));
  scene.add(assets.get('highland-foliage').scene.clone(true));
  let castle: Group;
  let wallDamage: WallDamage | undefined;
  let assembly: CastleAssembly | undefined;
  const towerMaterials = new Set<MeshStandardMaterial>();
  const occlusionRay = new Raycaster(),
    occlusionPoint = new Vector3(),
    occlusionDirection = new Vector3();
  const towerBounds = new Box3(),
    occlusionHit = new Vector3();
  const contactShadows = new ContactShadows();
  scene.add(contactShadows.root);
  let shadowRevision = -1;
  let renderSampleTime = 0,
    renderSamples = 0;
  const characters = new Map<number, Character>(),
    defenseViews = new Map<number, DefenseView>(),
    actorLabels = new Map<number, HTMLElement>();
  const projectileGroup = new Group(),
    dangerGroup = new Group(),
    effectGroup = new Group(),
    mountGroup = new Group();
  scene.add(projectileGroup, dangerGroup, effectGroup, mountGroup);
  const boltGeometry = new CylinderGeometry(0.035, 0.035, 0.8, 6),
    sparkGeometry = new SphereGeometry(0.13, 8, 5),
    ringGeometry = new TorusGeometry(0.5, 0.045, 6, 40);
  const gold = new MeshBasicMaterial({ color: 0xf8d68a }),
    blue = new MeshBasicMaterial({ color: 0x76e6fa }),
    red = new MeshBasicMaterial({ color: 0xf581a6 }),
    green = new MeshBasicMaterial({ color: 0x8df4bd });
  const boltMeshes = new Map<number, Mesh>(),
    effectMeshes = new Map<number, Mesh>(),
    dangerMeshes = new Map<number, AttackView>();
  const mountMaterial = new MeshBasicMaterial({
    color: 0xe7c67d,
    transparent: true,
    opacity: 0.55,
  });
  const mountGeometry = new TorusGeometry(1.5, 0.07, 6, 48);
  const mountRings: Mesh[] = [];
  for (const m of mounts) {
    const ring = new Mesh(mountGeometry, mountMaterial.clone());
    ring.position.set(m.x, mountHeight(m.id, campaign.wallTier) + 0.1, m.z);
    ring.rotation.x = -Math.PI / 2;
    ring.userData.site = m.id;
    if (m.inner) ring.scale.setScalar(0.8);
    mountRings.push(ring);
    mountGroup.add(ring);
  }
  const kingHalo = new Mesh(new TorusGeometry(0.64, 0.035, 6, 48), gold);
  kingHalo.rotation.x = -Math.PI / 2;
  scene.add(kingHalo);
  const royalEffects = new RoyalEffects();
  scene.add(royalEffects.root);
  let inspection:
    | {
        scene: Scene;
        actor: Actor;
        character: Character;
        position: Vector3;
        target: Vector3;
        attack: boolean;
      }
    | undefined;
  const inspectionBar = document.createElement('div');
  inspectionBar.className = 'castle-inspection';
  inspectionBar.hidden = true;
  stage.append(inspectionBar);
  function closeInspection() {
    if (!inspection) return;
    inspection.character.dispose();
    camera.position.copy(inspection.position);
    orbit.target.copy(inspection.target);
    orbit.minDistance = 17;
    orbit.maxDistance = 110;
    camera.fov = 41;
    camera.updateProjectionMatrix();
    inspection = undefined;
    orbit.enableRotate = false;
    inspectionBar.hidden = true;
    stage.classList.remove('inspecting');
  }
  function inspectUnit(id: string) {
    if (battle.phase !== 'planning') return;
    closeInspection();
    const k = campaign.knights.find((k) => k.id === id),
      recruit = recruits.find((r) => r.id === id);
    const source =
      id === 'king'
        ? battle.king
        : k
          ? battle.knights.find((a) => a.roster === id) || {
              ...battle.knights[0],
              name: recruit!.name,
              role: recruit!.role,
              gear: campaign.inventory.find((i) => i.id === k.gear)?.kind || null,
            }
          : {
              ...battle.king,
              role: id as Actor['role'],
              name:
                id === 'dragon'
                  ? 'The Emberwing Dragon'
                  : id === 'raider'
                    ? 'Ash Raider'
                    : id === 'bulwark'
                      ? 'Iron Bulwark'
                      : 'Hexcaster',
            };
    const actor: Actor = {
      ...source,
      x: 0,
      y: 0,
      z: 0,
      yaw: 0,
      hp: 160,
      action: '',
      actionTime: 0,
      moving: false,
    };
    const room = new Scene();
    room.background = new Color(0x172630);
    room.add(new HemisphereLight(0xc4e1ea, 0x253332, 2.6));
    const light = new DirectionalLight(0xffe5bb, 3);
    light.position.set(3, 6, 5);
    room.add(light);
    const edge = new DirectionalLight(0x6cadcd, 2);
    edge.position.set(-4, 3, -5);
    room.add(edge);
    const character = new Character(
      assets,
      actor.role,
      campaign.weapon,
      actor.gear ? items[actor.gear].model : undefined,
    );
    room.add(character.root);
    inspection = {
      scene: room,
      actor,
      character,
      position: camera.position.clone(),
      target: orbit.target.clone(),
      attack: false,
    };
    const dragon = actor.role === 'dragon';
    camera.position.set(dragon ? 8 : 3.2, dragon ? 6 : 2.7, dragon ? 12 : 5.3);
    orbit.target.set(0, dragon ? 1.8 : 1, dragon ? -1 : 0);
    orbit.enableRotate = true;
    orbit.minDistance = dragon ? 8 : 2.7;
    orbit.maxDistance = dragon ? 22 : 9;
    camera.fov = 34;
    camera.updateProjectionMatrix();
    inspectionBar.innerHTML = `<span class="eyebrow">${actor.role === 'king' ? 'LEGENDARY COMMANDER' : actor.role.toUpperCase()}</span><h2>${escape(actor.name)}</h2><p>Drag to turn · scroll or pinch to inspect</p><div><button class="secondary" data-action="inspect-attack">Play attack</button><button class="secondary" data-action="inspect-close">Return to the walls</button></div>`;
    inspectionBar.hidden = false;
    stage.classList.add('inspecting');
  }
  function clearTransient() {
    for (const view of dangerMeshes.values()) view.dispose();
    dangerMeshes.clear();
    dangerGroup.clear();
    boltMeshes.clear();
    projectileGroup.clear();
    effectMeshes.forEach((m) => (m.material as MeshBasicMaterial).dispose());
    effectMeshes.clear();
    effectGroup.clear();
  }
  function rebuild() {
    closeInspection();
    if (battle.phase !== 'planning') {
      camera.fov = 41;
      camera.position.set(0, 30, 25);
      orbit.target.set(0, 1, 0);
      camera.updateProjectionMatrix();
      scene.fog = new Fog(0x96b8ba, 65, 115);
    }
    characters.forEach((c) => c.dispose());
    characters.clear();
    defenseViews.forEach((v) => v.dispose());
    defenseViews.clear();
    actorLabels.clear();
    labels.replaceChildren();
    clearTransient();
    wallDamage?.dispose();
    assembly?.dispose();
    castle?.removeFromParent();
    towerMaterials.clear();
    castle = assets.get(`castle-${campaign.wallTier}`).scene.clone(true);
    castle.getObjectByName('RoyalKeep')?.removeFromParent();
    assembly = new CastleAssembly(campaign, assets);
    castle.add(assembly.root);
    scene.add(castle);
    wallDamage = new WallDamage(castle, wallSpec(campaign.wallTier).height);
    scene.add(wallDamage.root);
    battle = new Battle(campaign);
    finished = false;
    for (const b of battle.defenses) {
      const v = new DefenseView(assets, b.kind, b.rank, false, true);
      defenseViews.set(b.id, v);
      v.update(b);
      (isSupport(b.kind) ? assembly.root : scene).add(v.root);
      if (campaign.relic === 'worldpiercer' && b.kind === 'ballista') {
        const module = kit(assets, 'WorldpiercerModule');
        module.position.y = b.rank === 1 ? 1.08 : b.rank === 2 ? 1.43 : 1.78;
        v.model.getObjectByName('Turret')!.add(module);
      }
    }
    towerBounds.setFromObject(assembly.root);
    renderer.shadowMap.needsUpdate = true;
    shadowRevision = -1;
    assembly.root.traverse((o) => {
      if (o instanceof Mesh && o.material instanceof MeshStandardMaterial) {
        o.material.transparent = true;
        towerMaterials.add(o.material);
      }
    });
    if (campaign.relic === 'black-standard')
      for (const z of [-9.6, 9.6]) {
        const banner = kit(assets, 'BlackStandard');
        banner.position.set(3, 0, z);
        castle.add(banner);
      }
    mountRings.forEach(
      (r, i) => (r.position.y = mountHeight(mounts[i].id, campaign.wallTier) + 0.1),
    );
    renderCouncil();
  }
  function transact(fn: () => string | null | void) {
    if (battle.phase !== 'planning') return;
    const error = fn();
    notice = error || C.saveCampaign(campaign) || 'Council orders recorded.';
    if (!error) rebuild();
    else renderCouncil();
  }
  const button = (label: string, action: string, disabled = false, extra = '') =>
    `<button class="council-button ${extra}" data-action="${action}" ${disabled ? 'disabled' : ''}>${label}</button>`;
  function renderCouncil() {
    content.querySelectorAll('details[class]').forEach((d) => {
      if ((d as HTMLDetailsElement).open) expandedDetails.add(d.className);
      else expandedDetails.delete(d.className);
    });
    const active = battle.phase === 'battle';
    $('.new-siege').hidden = active;
    $('.castle-app').classList.toggle('in-battle', active);
    $('#castle-pause').hidden = !active;
    orbit.enabled = true;
    orbit.enableRotate = !!inspection;
    const e = encounters[Math.min(campaign.encounter, 2)];
    $('#watch-name').textContent = campaign.encounter >= 3 ? 'The hold endures' : e.name;
    $('#watch-description').textContent =
      campaign.encounter >= 3
        ? 'Three encounters won. Your company has held the royal castle.'
        : e.subtitle;
    $('#castle-gold').textContent = `${campaign.gold} ♜`;
    $('#council-notice').textContent = notice;
    $('#begin-watch').textContent = active
      ? 'The watch is underway'
      : campaign.encounter >= 3
        ? 'Begin a new siege'
        : 'Begin watch ↗';
    ($('#begin-watch') as HTMLButtonElement).disabled = active;
    app
      .querySelectorAll<HTMLButtonElement>('[data-tab]')
      .forEach((b) => b.classList.toggle('selected', b.dataset.tab === tab));
    if (active) {
      content.innerHTML = `<div class="battle-orders"><span class="eyebrow">YOUR COMPANY</span><div id="battle-company"></div><div id="battle-walls"></div><details><summary>Controls</summary><p>Mouse / drag to move. Auto fire.</p><p>E: Guard your wall. Space: Royal Decree.</p><p>Move to the marked wall. Guard just before impact to stagger the Dragon.</p></details><button class="council-button" data-action="pause">Pause</button></div>`;
      return;
    }
    if (tab === 'castle') {
      content.innerHTML = buildingCouncil(campaign, site, picked);
    } else if (tab === 'company') {
      content.innerHTML = companyCouncil(campaign, selectedKnight);
    } else if (tab === 'armory') {
      content.innerHTML = `<article class="king-plate"><span class="eyebrow">♔ LEGENDARY COMMANDER</span><h3>The Storm King</h3>${button('Inspect the King', 'inspect:king')}<p>The castle is your lifeline. Auto-attacks continue while moving and guarding.</p><p>${royalWeapons[campaign.weapon].description}</p><p>E: protect your wall for 1.5 seconds. A guard just before impact exposes the Dragon. Q: swap weapons.</p><label class="council-label" for="royal-weapon">ROYAL WEAPON</label><select id="royal-weapon"><option value="stormbow" ${campaign.weapon === 'stormbow' ? 'selected' : ''}>Stormbow · ${roman[campaign.ranks.stormbow - 1]}</option><option value="sunlance" ${campaign.weapon === 'sunlance' ? 'selected' : ''}>Sunlance · ${roman[campaign.ranks.sunlance - 1]}</option></select>${button(campaign.ranks[campaign.weapon] < 3 ? `Improve ${campaign.weapon === 'stormbow' ? 'Stormbow' : 'Sunlance'} · ${campaign.ranks[campaign.weapon] === 1 ? 150 : 280} ♜` : 'Royal weapon complete', 'weapon-up', campaign.ranks[campaign.weapon] === 3)}<p>${campaign.sockets[campaign.weapon].length} / ${campaign.wallTier} sockets occupied. Equipping and removing owned runes is free.</p><div class="owned-runes">${
        campaign.inventory
          .filter((i) => items[i.kind].kind === 'rune')
          .map((i) =>
            button(
              `${campaign.sockets[campaign.weapon].includes(i.id) ? '◆' : '◇'} ${items[i.kind].name}<small>${items[i.kind].description}</small>`,
              `rune:${i.id}`,
              false,
              campaign.sockets[campaign.weapon].includes(i.id) ? 'equipped' : '',
            ),
          )
          .join('') || '<p class="fine">Purchase a rune below to socket it.</p>'
      }</div></article><div class="shop-heading"><span class="eyebrow">SIX ARMORY OFFERS</span>${button(`Refresh · ${35 + campaign.rerolls * 15} ♜`, 'reroll')}</div><p class="fine">Buying keeps the other offers in place. Knight items and royal runes have separate equipment slots.</p><div class="market-offers">${campaign.offers.map((kind, i) => `<article class="item-plate ${items[kind].kind}"><span class="eyebrow">${items[kind].kind === 'gear' ? 'KNIGHT EQUIPMENT' : 'ROYAL RUNE'}</span><h3>${items[kind].name}</h3><p>${items[kind].description}</p>${button(campaign.bought.includes(i) ? 'Owned' : `Purchase · ${items[kind].cost} ♜`, `buy:${i}`, campaign.bought.includes(i) || campaign.gold < items[kind].cost)}</article>`).join('')}</div>`;
    } else {
      content.innerHTML = `<div class="council-intro"><span class="eyebrow">RELIC VAULT</span><h3>Power with a purpose.</h3><p>${campaign.relic ? 'Your chosen relic is bound to this siege.' : campaign.encounter === 2 ? 'The siege is broken. Claim a relic for the final battle.' : 'Break the second siege to claim a relic before facing Emberwing.'}</p></div>${(
        Object.keys(relics) as Relic[]
      )
        .map((id) => {
          const r = relics[id];
          return `<article class="relic-plate ${campaign.relic === id ? 'chosen' : ''}"><span class="relic-symbol">${r.symbol}</span><span class="eyebrow">LEGENDARY · ${r.system}</span><h3>${r.name}</h3><p>${r.effect}</p><p class="relic-tradeoff">${r.tradeoff}</p>${button(campaign.relic === id ? 'Bound to the castle' : campaign.relic ? 'Another relic is bound' : campaign.encounter === 2 ? 'Claim this relic' : 'Earned from the siege', `relic:${id}`, !!campaign.relic || campaign.encounter !== 2)}</article>`;
        })
        .join('')}`;
    }
    content
      .querySelectorAll<HTMLDetailsElement>('details[class]')
      .forEach((d) => (d.open = expandedDetails.has(d.className)));
  }
  function openNew() {
    if (battle.phase === 'battle') return;
    $('.castle-result').hidden = false;
    $('.castle-result').innerHTML =
      `<span class="eyebrow">A NEW WATCH</span><h2>Raise another company?</h2><p>This replaces the current castle checkpoint.</p><label for="new-difficulty">Difficulty</label><select id="new-difficulty"><option value="normal">Normal</option><option value="veteran">Veteran</option></select><button class="primary" data-action="new">Begin a new siege</button><button class="secondary" data-action="cancel-new">Keep this castle</button>`;
  }
  function start() {
    closeInspection();
    cancelPlacement();
    if (campaign.encounter >= 3) {
      openNew();
      return;
    }
    if (campaign.encounter === 2 && !campaign.relic) {
      tab = 'relics';
      notice = 'Choose your siege relic before facing Emberwing.';
      renderCouncil();
      return;
    }
    C.saveCampaign(campaign);
    audio.unlock();
    battle.start();
    clearInput();
    renderCouncil();
    fitBattle();
  }
  function fitBattle() {
    battlePortrait = viewportWidth < viewportHeight * 0.8;
    scene.fog = new Fog(0x96b8ba, battlePortrait ? 95 : 65, battlePortrait ? 140 : 115);
    orbit.target.set(0, 1, 0);
    if (battlePortrait) {
      camera.fov = 45;
      camera.position.set(0, 46, 54);
    } else {
      camera.fov = 41;
      camera.position.set(0, 28, 34);
    }
    camera.updateProjectionMatrix();
  }
  $('#begin-watch').onclick = start;
  function clearInput() {
    keys.clear();
    input.rotate = 0;
    input.heading = undefined;
    input.guard = false;
    input.decree = false;
    dragging = false;
  }
  function pause() {
    if (battle.phase !== 'battle') return;
    battle.paused = !battle.paused;
    clearInput();
    $('.castle-result').hidden = !battle.paused;
    if (battle.paused)
      $('.castle-result').innerHTML =
        `<span class="eyebrow">THE WATCH WAITS</span><h2>Hold your ground.</h2><button class="primary" data-action="pause">Resume the watch</button><button class="secondary" data-action="retry">Return to the starting council</button>`;
  }
  $('#castle-pause').onclick = pause;
  $('#castle-foundry').onclick = () => {
    if (battle.phase === 'battle') {
      battle.paused = true;
      clearInput();
      $('.castle-result').hidden = false;
      $('.castle-result').innerHTML =
        `<h2>Return to the foundry?</h2><p>This battle will return to its starting checkpoint.</p><button class="primary" data-action="foundry">Open art & training</button><button class="secondary" data-action="pause">Resume the watch</button>`;
    } else foundry();
  };
  const click = (event: MouseEvent) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action], [data-tab]');
    if (!target) return;
    if (target.dataset.tab) {
      cancelPlacement();
      tab = target.dataset.tab;
      renderCouncil();
      content.scrollTop = 0;
      return;
    }
    const [action, arg, rank] = target.dataset.action!.split(':'),
      selected = campaign.buildings.find((b) => b.site === site);
    if (action === 'weapon-swap') {
      swapWeapon();
      return;
    }
    if (action === 'slot') {
      site = arg as SiteId;
      if (picked) commitPlacement(site);
      else renderCouncil();
      return;
    }
    if (action === 'knight') {
      selectedKnight = arg;
      renderCouncil();
      content.scrollTop = 0;
      return;
    }
    if (action === 'inspect') {
      inspectUnit(arg);
      return;
    }
    if (action === 'inspect-close') {
      closeInspection();
      return;
    }
    if (action === 'inspect-attack' && inspection) {
      inspection.attack = !inspection.attack;
      inspection.actor.actionTime = 0;
      target.textContent = inspection.attack ? 'Return to idle' : 'Play attack';
      return;
    }
    if (action === 'zone' && battle.phase === 'planning') {
      cancelPlacement();
      site = arg === 'inner' ? 'inner-sw' : 'east-court';
      renderCouncil();
      return;
    }
    if (action === 'pause') {
      pause();
      return;
    }
    if (action === 'foundry') {
      foundry();
      return;
    }
    if (action === 'cancel-new') {
      $('.castle-result').hidden = true;
      return;
    }
    if (action === 'new-dialog') {
      openNew();
      return;
    }
    if (action === 'new') {
      const difficulty =
        app.querySelector<HTMLSelectElement>('#new-difficulty')?.value === 'veteran'
          ? 'veteran'
          : 'normal';
      campaign = C.createCampaign(difficulty);
      C.saveCampaign(campaign);
      $('.castle-result').hidden = true;
      notice = 'A new company answers the horns.';
      rebuild();
      return;
    }
    if (action === 'retry') {
      $('.castle-result').hidden = true;
      campaign = structuredClone(battle.checkpoint);
      notice =
        'The starting council is restored. Change your defenses or equipment before retrying.';
      rebuild();
      return;
    }
    if (action === 'continue') {
      $('.castle-result').hidden = true;
      campaign = structuredClone(battle.state);
      notice = 'All knights fully recovered. Strengthen the castle.';
      if (campaign.encounter === 2) tab = 'relics';
      rebuild();
      return;
    }
    transact(() => {
      if (action === 'talent') return C.learnTalent(campaign, arg, rank);
      if (action === 'talent-reset') return C.resetTalents(campaign, arg);
      if (action === 'walls-up') return C.upgradeWalls(campaign);
      if (action === 'walls-repair') return C.repairWalls(campaign);
      if (action === 'build') return C.build(campaign, arg as DefenseKind, site, +rank as Rank);
      if (action === 'building-up' && selected) return C.upgradeBuilding(campaign, selected.id);
      if (action === 'building-repair' && selected) return C.repairBuilding(campaign, selected.id);
      if (action === 'building-salvage' && selected) return C.salvage(campaign, selected.id);
      if (action === 'buy') return C.buyOffer(campaign, +arg);
      if (action === 'reroll') return C.reroll(campaign);
      if (action === 'rune') return C.equipRune(campaign, campaign.weapon, +arg);
      if (action === 'weapon-up') return C.improveWeapon(campaign, campaign.weapon);
      if (action === 'assign') return C.assign(campaign, arg);
      if (action === 'treat') return C.treat(campaign, arg);
      if (action === 'promote') return C.promote(campaign, arg);
      if (action === 'recruit') return C.recruit(campaign, arg);
      if (action === 'relic') return C.chooseRelic(campaign, arg as Relic);
    });
  };
  app.addEventListener('click', click);
  const unbindTouchTaps = bindTouchTaps(app);
  const change = (event: Event) => {
    const t = event.target as HTMLSelectElement;
    if (battle.phase !== 'planning') return;
    if (t.id === 'mount-select') {
      site = t.value as SiteId;
      renderCouncil();
      return;
    }
    transact(() => {
      if (t.dataset.stance) {
        campaign.knights.find((k) => k.id === t.dataset.stance)!.stance = t.value as
          | 'guard'
          | 'hunt';
        return;
      }
      if (t.dataset.gear) {
        if (+t.value === 0) {
          campaign.knights.find((k) => k.id === t.dataset.gear)!.gear = null;
          return;
        }
        return C.equipKnight(campaign, t.dataset.gear, +t.value);
      }
      if (t.id === 'royal-weapon') campaign.weapon = t.value as Weapon;
      if (t.id === 'defense-yaw') {
        const b = campaign.buildings.find((b) => b.site === site);
        if (b) b.yaw = (+t.value * Math.PI) / 180;
      }
    });
  };
  app.addEventListener('change', change);
  function swapWeapon() {
    if (battle.phase !== 'battle' || battle.paused) return;
    battle.state.weapon = battle.state.weapon === 'stormbow' ? 'sunlance' : 'stormbow';
    battle.king.action = '';
    battle.king.cooldown = 0;
  }
  function keydown(event: KeyboardEvent) {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) return;
    if (
      ['Space', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'KeyE', 'KeyQ', 'Escape'].includes(
        event.code,
      )
    )
      event.preventDefault();
    if (event.code === 'Escape' && !event.repeat) {
      if (picked) cancelPlacement();
      else pause();
      return;
    }
    if (battle.phase !== 'battle' || battle.paused) return;
    keys.add(event.code);
    if (['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'].includes(event.code)) input.heading = undefined;
    if (event.code === 'Space' && !event.repeat) input.decree = true;
    if (event.code === 'KeyE' && !event.repeat) input.guard = true;
    if (event.code === 'KeyQ' && !event.repeat) swapWeapon();
  }
  const keyup = (e: KeyboardEvent) => keys.delete(e.code);
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  const blur = () => {
    if (battle.phase === 'battle' && !battle.paused) pause();
    else clearInput();
  };
  window.addEventListener('blur', blur);
  const visibility = () => {
    if (document.hidden) blur();
  };
  document.addEventListener('visibilitychange', visibility);
  const touchHandlers: (() => void)[] = [];
  function hold(id: string, down: () => void, up: () => void) {
    const b = $(id);
    const start = (e: PointerEvent) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      if (!battle.paused) down();
    };
    const stop = () => up();
    b.addEventListener('pointerdown', start);
    b.addEventListener('pointerup', stop);
    b.addEventListener('pointercancel', stop);
    b.addEventListener('lostpointercapture', stop);
    touchHandlers.push(() => {
      b.removeEventListener('pointerdown', start);
      b.removeEventListener('pointerup', stop);
      b.removeEventListener('pointercancel', stop);
      b.removeEventListener('lostpointercapture', stop);
    });
  }
  hold(
    '#king-left',
    () => {
      input.rotate = -1;
      input.heading = undefined;
    },
    () => (input.rotate = 0),
  );
  hold(
    '#king-right',
    () => {
      input.rotate = 1;
      input.heading = undefined;
    },
    () => (input.rotate = 0),
  );
  hold(
    '#king-guard',
    () => (input.guard = true),
    () => {},
  );
  $('#king-decree').onclick = () => (input.decree = true);
  const raycaster = new Raycaster(),
    pointer = new Vector2(),
    plane = new Plane(new Vector3(0, 1, 0), 0),
    point = new Vector3();
  let ghost: DefenseView | undefined;
  let hovered: SiteId | null = null;
  let placementPointer: { id: number; x: number; y: number; moved: boolean } | null = null;
  const placementHint = document.createElement('div');
  placementHint.className = 'placement-hint';
  placementHint.hidden = true;
  stage.append(placementHint);
  const platformButtons = mounts.map((m) => {
    const button = document.createElement('button');
    button.className = `platform-target${m.inner ? ' inner-target' : ''}`;
    button.dataset.action = `slot:${m.id}`;
    button.setAttribute('aria-label', `Place on ${m.name} platform`);
    button.innerHTML = `<strong>${m.inner ? m.name.split(' ')[1] : m.name[0]}</strong><small>PLACE</small>`;
    stage.append(button);
    return button;
  });
  function cancelPlacement() {
    stage.classList.remove('placing');
    picked = null;
    hovered = null;
    placementPointer = null;
    ghost?.dispose();
    ghost = undefined;
    placementHint.hidden = true;
    platformButtons.forEach((b) => (b.hidden = true));
    app.querySelectorAll('.building-card').forEach((card) => card.classList.remove('armed'));
  }
  function pickBuilding(value: string) {
    cancelPlacement();
    if (battle.phase !== 'planning' || inspection) return;
    const existing = value.startsWith('move:')
      ? campaign.buildings.find((b) => b.id === +value.split(':')[1])
      : undefined;
    const kind = existing?.kind || (value as DefenseKind);
    if (!Object.hasOwn(defenses, kind)) return;
    picked = value;
    stage.classList.add('placing');
    ghost = new DefenseView(assets, kind, existing?.rank || 1, true, true);
    scene.add(ghost.root);
    ghost.root.visible = false;
    placementHint.hidden = false;
    setPlacementHint(
      `${existing ? 'Move' : 'Place'} ${defenses[kind].name} · choose a glowing platform`,
    );
    renderCouncil();
  }
  function setPlacementHint(message: string) {
    placementHint.innerHTML = `<span>${escape(message)}</span><button type="button">Cancel</button>`;
    placementHint.querySelector('button')!.onclick = cancelPlacement;
  }
  function commitPlacement(destination: SiteId) {
    const value = picked;
    if (!value || battle.phase !== 'planning') return;
    const error = value.startsWith('move:')
      ? C.moveBuilding(campaign, +value.split(':')[1], destination)
      : C.build(campaign, value as DefenseKind, destination);
    if (error) {
      notice = error;
      setPlacementHint(error);
      renderCouncil();
      return;
    }
    site = destination;
    cancelPlacement();
    notice =
      value === 'tavern' ? 'Tavern open. Recruit your next knight in Knights.' : 'Building ready.';
    C.saveCampaign(campaign);
    rebuild();
  }
  function pickedKind(): DefenseKind | undefined {
    return picked?.startsWith('move:')
      ? campaign.buildings.find((b) => b.id === +picked!.split(':')[1])?.kind
      : (picked as DefenseKind | undefined);
  }
  function groundPoint(e: { clientX: number; clientY: number }) {
    const rect = renderer.domElement.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    )
      return null;
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    plane.constant = picked && isSupport(pickedKind()!) ? 0 : -wallSpec(campaign.wallTier).height;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.ray.intersectPlane(plane, point);
  }
  function placementMove(e: PointerEvent) {
    if (!picked) return;
    const p = groundPoint(e);
    // Labels spread apart at small viewports; drags must land on the visible target too.
    const target = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLButtonElement>('.platform-target');
    hovered =
      target && !target.hidden
        ? (target.dataset.action!.slice(5) as SiteId)
        : p
          ? platformAt(p.x, p.z, isSupport(pickedKind()!))
          : null;
    const m = mounts.find((m) => m.id === hovered);
    if (ghost) {
      ghost.root.visible = !!m;
      if (m) {
        ghost.root.position.set(m.x, mountHeight(m.id, campaign.wallTier), m.z);
        ghost.root.rotation.y = m.yaw;
      }
    }
    if (
      placementPointer &&
      Math.hypot(e.clientX - placementPointer.x, e.clientY - placementPointer.y) > 7
    )
      placementPointer.moved = true;
  }
  const pickDown = (e: PointerEvent) => {
    const card = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-pick]');
    if (!card || card.disabled) return;
    e.preventDefault();
    pickBuilding(card.dataset.pick!);
    placementPointer = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    app.setPointerCapture(e.pointerId);
  };
  const pickUp = (e: PointerEvent) => {
    if (!placementPointer || placementPointer.id !== e.pointerId) return;
    const moved = placementPointer.moved;
    placementPointer = null;
    if (app.hasPointerCapture(e.pointerId)) app.releasePointerCapture(e.pointerId);
    if (moved) {
      if (hovered) commitPlacement(hovered);
      else cancelPlacement();
    }
  };
  const pickCancel = () => {
    if (placementPointer) cancelPlacement();
  };
  const pickClick = (e: MouseEvent) => {
    const card = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-pick]');
    if (e.detail === 0 && card && !card.disabled) pickBuilding(card.dataset.pick!);
  };
  app.addEventListener('pointerdown', pickDown);
  app.addEventListener('click', pickClick);
  window.addEventListener('pointermove', placementMove);
  window.addEventListener('pointerup', pickUp);
  window.addEventListener('pointercancel', pickCancel);
  touchHandlers.push(() => {
    app.removeEventListener('pointerdown', pickDown);
    app.removeEventListener('click', pickClick);
    window.removeEventListener('pointermove', placementMove);
    window.removeEventListener('pointerup', pickUp);
    window.removeEventListener('pointercancel', pickCancel);
  });
  const aim = (e: PointerEvent) => {
    const p = groundPoint(e);
    if (p && Math.hypot(p.x, p.z) > 1.7) input.heading = Math.atan2(p.x, p.z);
  };
  const pointerdown = (e: PointerEvent) => {
    if (inspection) return;
    if (battle.phase === 'planning') {
      if (!picked) {
        groundPoint(e);
        const hit = raycaster.intersectObjects(
          [...defenseViews.values()].map((v) => v.root),
          true,
        )[0];
        if (hit) {
          const selected = [...defenseViews.entries()].find(([, v]) => {
            let o = hit.object;
            while (o.parent && o !== v.root) o = o.parent;
            return o === v.root;
          });
          if (selected) {
            site = campaign.buildings.find((b) => b.id === selected[0])!.site;
            renderCouncil();
            return;
          }
        }
      }
      const p = groundPoint(e),
        destination = p ? platformAt(p.x, p.z, isSupport(pickedKind()!)) : null;
      if (destination) {
        site = destination;
        if (picked) commitPlacement(destination);
        else renderCouncil();
      }
      return;
    }
    if (battle.phase !== 'battle' || battle.paused) return;
    dragging = true;
    renderer.domElement.setPointerCapture(e.pointerId);
    aim(e);
  };
  const pointermove = (e: PointerEvent) => {
    if (
      !inspection &&
      battle.phase === 'battle' &&
      !battle.paused &&
      (e.pointerType === 'mouse' || dragging)
    )
      aim(e);
  };
  const pointerup = () => {
    dragging = false;
    input.guard = false;
  };
  renderer.domElement.addEventListener('pointerdown', pointerdown);
  renderer.domElement.addEventListener('pointermove', pointermove);
  renderer.domElement.addEventListener('pointerup', pointerup);
  renderer.domElement.addEventListener('pointercancel', pointerup);
  renderer.domElement.addEventListener('lostpointercapture', pointerup);
  const projected = new Vector3();
  function present(a: Actor, dt: number) {
    let c = characters.get(a.id);
    if (!c) {
      c = new Character(
        assets,
        a.role,
        a.role === 'king' ? battle.state.weapon : 'stormbow',
        a.gear ? items[a.gear].model : undefined,
      );
      c.root.traverse((o) => {
        if (o instanceof Mesh) o.castShadow = false;
      });
      characters.set(a.id, c);
      scene.add(c.root);
      const label = document.createElement('div');
      label.className = `unit-label ${a.role === 'king' ? 'legendary' : battle.enemies.includes(a) ? 'enemy' : 'ally'}`;
      label.innerHTML = `<span>${a.role === 'king' ? '♔ THE KING' : escape(a.name)}</span><i></i>`;
      actorLabels.set(a.id, label);
      labels.append(label);
    }
    c.update(a, dt, a.role === 'king' ? battle.state.weapon : 'stormbow', false);
    const label = actorLabels.get(a.id)!;
    projected.set(a.x, a.y + (a.role === 'dragon' ? 4.7 : 2.45), a.z).project(camera);
    const visible =
      projected.z < 1 &&
      Math.abs(projected.x) < 1 &&
      Math.abs(projected.y) < 1 &&
      !(a.hp <= 0 && battle.enemies.includes(a)) &&
      a.role !== 'dragon' &&
      (!battle.enemies.includes(a) || a.hp < a.maxHp);
    label.hidden = !visible;
    if (visible) {
      label.style.transform = `translate(${(projected.x * 0.5 + 0.5) * viewportWidth}px,${(-projected.y * 0.5 + 0.5) * viewportHeight}px) translate(-50%,-100%)`;
      label.querySelector('i')!.style.setProperty('--hp', `${(a.hp / a.maxHp) * 100}%`);
      label.classList.toggle('fallen', a.hp <= 0);
      label.classList.toggle('struck', a.hitFlash > 0);
      label.classList.toggle('evading', a.action === 'dodge');
    }
  }
  function updateHud() {
    $('#king-weapon b').textContent = royalWeapons[battle.state.weapon].name;
    $('#king-weapon').setAttribute(
      'aria-label',
      `Switch weapon: ${royalWeapons[battle.state.weapon].name}`,
    );
    const maxWall = wallSpec(campaign.wallTier).hp;
    battle.state.walls.forEach((hp, i) => {
      const meter = $<HTMLMeterElement>(`#wall-health-${i}`);
      meter.value = (hp / maxWall) * 100;
      meter.setAttribute(
        'aria-label',
        `${['North', 'East', 'South', 'West'][i]} wall ${Math.ceil((hp / maxWall) * 100)}%`,
      );
      meter.parentElement!.classList.toggle('critical', hp / maxWall < 0.35);
      meter.parentElement!.classList.toggle(
        'guarded',
        battle.guardTime > 0 && battle.guardSide === i,
      );
    });
    const sideName = ['NORTH', 'EAST', 'SOUTH', 'WEST'][wallSide(battle.king)];
    $('#guard-status').textContent =
      battle.guardTime > 0
        ? 'GUARDING'
        : battle.guardCooldown > 0
          ? `${battle.guardCooldown.toFixed(1)}s`
          : `${sideName} / ${touchControls ? 'TAP' : 'E'}`;
    $('#guard-ready').style.width = `${(1 - battle.guardCooldown / 4.5) * 100}%`;
    $('#king-guard').classList.toggle('ready', battle.guardCooldown === 0);
    $('#decree-power').textContent =
      battle.power >= 100
        ? `READY · ${touchControls ? 'TAP' : 'SPACE'}`
        : `${Math.floor(battle.power)} / 100 · ${touchControls ? 'TAP' : 'SPACE'}`;
    $('#royal-power').style.width = `${battle.power}%`;
    $('#king-decree').classList.toggle('ready', battle.power >= 100);
    const danger = battle.dangers.find((t) => t.kind !== 'hex');
    const boss = battle.enemies.find((e) => e.role === 'dragon' && e.hp > 0);
    const attackName =
      danger?.kind === 'breath'
        ? 'DRAGONFIRE'
        : danger?.kind === 'rake'
          ? 'CLAW GALE'
          : 'TAIL SWEEP';
    const warning = danger && danger.age < danger.windup;
    const message =
      battle.feedbackTime > 0
        ? battle.feedback
        : danger
          ? danger.wall !== undefined
            ? `${['NORTH', 'EAST', 'SOUTH', 'WEST'][danger.wall]} WALL \u00b7 ${warning ? (danger.windup - danger.age).toFixed(1) + 's / GUARD' : 'IMPACT'}`
            : `${attackName} \u00b7 COMPANY UNDER ATTACK`
          : boss && boss.exposed > 0
            ? 'EXPOSED \u00b7 +30% damage'
            : battle.time < 2.5 && battle.phase === 'battle'
              ? 'HOLD THE LINE'
              : '';
    $('.castle-announcement').textContent = message;
    $('.castle-announcement').classList.toggle('impact', !!danger && !warning);
    $('.castle-announcement').hidden = !message || battle.phase !== 'battle';
    $('.castle-chain').textContent =
      battle.streak >= 3 && battle.streakTime > 0
        ? `${battle.streak} CHAIN \u00b7 +${battle.loot} \u265c`
        : '';
    $('.castle-assault').hidden = battle.phase !== 'battle';
    const total = encounters[Math.min(2, campaign.encounter)].budget;
    const remaining = battle.enemies.filter((e) => e.hp > 0).length;
    $('.castle-assault span').textContent =
      battle.spawned >= total ? `${remaining} remaining` : 'Assault';
    $('.castle-assault i').style.width = `${Math.min(100, (battle.spawned / total) * 100)}%`;
    $('#castle-gold').textContent = `${battle.state.gold} \u265c`;
    $('#castle-objective').textContent =
      battle.phase === 'planning'
        ? `${wallSpec(campaign.wallTier).name} · ${campaign.difficulty.toUpperCase()}`
        : `${Math.floor(battle.time / 60)}:${Math.floor(battle.time % 60)
            .toString()
            .padStart(
              2,
              '0',
            )} · ${battle.kills} invaders defeated · ${battle.state.weapon === 'stormbow' ? 'Stormbow' : 'Sunlance'}`;
    $('.castle-boss').hidden = !boss;
    if (boss) {
      const m = $<HTMLMeterElement>('.castle-boss meter');
      m.max = boss.maxHp;
      m.value = boss.hp;
      $('.castle-boss small').textContent =
        boss.exposed > 0
          ? 'Exposed \u00b7 strike now'
          : boss.hp < boss.maxHp * 0.5
            ? 'Enraged \u00b7 faster attacks'
            : 'Hunts knights, then attacks a marked wall';
    }
    const company = app.querySelector('#battle-company');
    if (company)
      company.innerHTML = battle.knights
        .map(
          (k) =>
            `<p><span>${k.name}</span><b>${k.hp > 0 ? `${Math.ceil(k.hp)} HP` : 'DOWNED'}</b></p>`,
        )
        .join('');
    const walls = app.querySelector('#battle-walls');
    if (walls)
      walls.innerHTML = `<span class="eyebrow">WALL INTEGRITY</span>${['North', 'East', 'South', 'West'].map((name, i) => `<p><span>${name}</span><b>${Math.ceil(battle.state.walls[i])}</b></p>`).join('')}`;
    if ((battle.phase === 'won' || battle.phase === 'lost') && !finished) {
      finished = true;
      clearInput();
      const won = battle.phase === 'won';
      if (won) C.saveCampaign(battle.state);
      $('.castle-result').hidden = false;
      $('.castle-result').innerHTML =
        `<span class="eyebrow">${won ? 'THE WATCH IS WON' : 'THE CASTLE HAS FALLEN'}</span><h2>${won ? 'The crown endures.' : 'Rally the company.'}</h2><p>${escape(battle.announcement)}</p><p>${battle.kills} invaders defeated · ${Math.round(battle.stats.companyDamage)} company damage · ${Math.round(battle.stats.defenseDamage)} defense damage</p>${won ? `<p>+${encounters[campaign.encounter].reward} crowns · +2 service XP per deployed knight</p><button class="primary" data-action="continue">Return to the council</button>` : '<p>Your starting checkpoint is preserved. Change the defenses, equipment or orders before trying again.</p><button class="primary" data-action="retry">Revisit the council</button>'}`;
    }
  }
  function animate(now: number) {
    if (disposed) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const rawFrame = (now - lastFrameSample) / 1000;
    lastFrameSample = now;
    if (battle.phase === 'battle' && !battle.paused && rawFrame < 0.15) {
      renderSampleTime += rawFrame;
      renderSamples++;
      if (renderSamples >= 90) {
        if (renderSampleTime / renderSamples > 0.022 && renderer.getPixelRatio() > 0.66)
          renderer.setPixelRatio(Math.max(0.65, renderer.getPixelRatio() * 0.86));
        renderSampleTime = 0;
        renderSamples = 0;
      }
    }
    const running = battle.phase === 'battle' && !battle.paused;
    const effective = {
      ...input,
      rotate:
        input.rotate +
        (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
        (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0),
      guard: input.guard,
    };
    if (running) {
      accumulator += dt;
      while (accumulator >= 1 / 60) {
        battle.tick(1 / 60, effective);
        effective.decree = false;
        effective.guard = false;
        input.decree = false;
        input.guard = false;
        accumulator -= 1 / 60;
      }
    } else accumulator = 0;
    audio.update(battle, dt);
    environment.update(dt);
    orbit.update();
    for (const a of [battle.king, ...battle.knights, ...battle.enemies])
      present(a, running || battle.phase === 'planning' ? dt : 0);
    wallDamage?.update(battle, !!picked && isSupport(pickedKind()!));
    const live = new Set([battle.king, ...battle.knights, ...battle.enemies].map((a) => a.id));
    for (const [id, c] of characters)
      if (!live.has(id)) {
        c.dispose();
        characters.delete(id);
        actorLabels.get(id)?.remove();
        actorLabels.delete(id);
      }
    contactShadows.update(battle);
    if (wallDamage && wallDamage.revision !== shadowRevision) {
      shadowRevision = wallDamage.revision;
      renderer.shadowMap.needsUpdate = true;
    }
    royalEffects.update(battle);
    kingHalo.position.set(battle.king.x, battle.king.y + 0.1, battle.king.z);
    kingHalo.visible = true;
    wallLabels.forEach((label, i) => {
      label.hidden = !!inspection;
      const p = [
        { x: 0, z: -6.4 },
        { x: 6.4, z: 0 },
        { x: 0, z: 6.4 },
        { x: -6.4, z: 0 },
      ][i];
      projected.set(p.x, wallSpec(campaign.wallTier).height + 2.6, p.z).project(camera);
      label.style.left = `${(projected.x * 0.5 + 0.5) * viewportWidth}px`;
      label.style.top = `${(-projected.y * 0.5 + 0.5) * viewportHeight}px`;
      const targeted = battle.dangers.some((t) => t.wall === i);
      label.textContent = `${['N', 'E', 'S', 'W'][i]}${targeted ? ' / GUARD' : ''}`;
      label.classList.toggle('targeted', targeted);
      label.classList.toggle('struck', battle.wallImpacts[i] > 0);
      label.style.setProperty(
        '--wall-hp',
        `${(battle.state.walls[i] / wallSpec(campaign.wallTier).hp) * 100}%`,
      );
      label.classList.toggle(
        'critical',
        battle.state.walls[i] < wallSpec(campaign.wallTier).hp * 0.35,
      );
    });
    occlusionPoint.set(battle.king.x, battle.king.y + 1, battle.king.z);
    occlusionDirection.copy(occlusionPoint).sub(camera.position);
    occlusionRay.set(camera.position, occlusionDirection.clone().normalize());
    occlusionRay.far = occlusionDirection.length();
    const blocked =
      !!occlusionRay.ray.intersectBox(towerBounds, occlusionHit) &&
      camera.position.distanceToSquared(occlusionHit) < occlusionDirection.lengthSq();
    towerMaterials.forEach((m) => {
      m.opacity +=
        ((blocked && battle.phase === 'battle' ? 0.24 : 1) - m.opacity) * Math.min(1, dt * 7);
      m.depthWrite = m.opacity > 0.95;
    });
    for (const b of battle.defenses) {
      const v = defenseViews.get(b.id)!;
      v.update(b, battle.phase === 'planning');
      v.coverage.visible =
        !!picked && battle.phase === 'planning' && tab === 'castle' && b.site === site;
    }
    mountGroup.visible = battle.phase === 'planning' && tab === 'castle';
    const innerCenter = new Vector3(0, 0.15, 0).project(camera);
    const centerX = (innerCenter.x * 0.5 + 0.5) * viewportWidth;
    const centerY = (-innerCenter.y * 0.5 + 0.5) * viewportHeight;
    mountRings.forEach((r, i) => {
      const m = mounts[i],
        occupied = campaign.buildings.some((b) => b.site === m.id && picked !== `move:${b.id}`);
      const valid = !picked || fitsMount(pickedKind()!, m.id);
      r.visible = valid;
      const material = r.material as MeshBasicMaterial;
      material.color.setHex(
        picked ? (occupied ? 0xf0797d : 0x79f0cf) : r.userData.site === site ? 0xffda86 : 0xbcb391,
      );
      material.opacity = picked ? 0.75 + Math.sin(now * 0.004) * 0.2 : 0.42;
      r.scale.setScalar((m.inner ? 0.8 : 1) * (hovered === m.id ? 1.12 : 1));
      const button = platformButtons[i];
      button.hidden = !picked || !valid || !!inspection || battle.phase !== 'planning';
      projected.set(m.x, mountHeight(m.id, campaign.wallTier) + 0.15, m.z).project(camera);
      let x = (projected.x * 0.5 + 0.5) * viewportWidth;
      let y = (-projected.y * 0.5 + 0.5) * viewportHeight;
      if (m.inner) {
        x = centerX + Math.sign(m.x) * Math.max(36, Math.abs(x - centerX));
        y = centerY + Math.sign(m.z) * Math.max(36, Math.abs(y - centerY));
      }
      button.style.left = `${x}px`;
      button.style.top = `${y}px`;
      button.classList.toggle('occupied', occupied);
      button.classList.toggle('hovered', hovered === m.id);
      button.querySelector('small')!.textContent = occupied ? 'OCCUPIED' : 'PLACE';
    });
    for (const gateName of ['NorthGate', 'SouthGate']) {
      const gate = castle.getObjectByName(gateName);
      if (gate) {
        const y = battle.phase === 'battle' && battle.time < 4 ? 2.1 : 0;
        if (gate.position.y !== y) renderer.shadowMap.needsUpdate = true;
        gate.position.y = y;
      }
    }
    for (const b of battle.bolts) {
      let mesh = boltMeshes.get(b.id);
      if (!mesh) {
        mesh = new Mesh(
          b.relay || !b.friendly ? sparkGeometry : boltGeometry,
          b.friendly ? (b.royal ? gold : blue) : red,
        );
        boltMeshes.set(b.id, mesh);
        projectileGroup.add(mesh);
      }
      mesh.position.set(b.x, b.y, b.z);
      mesh.quaternion.setFromUnitVectors(
        new Vector3(0, 1, 0),
        new Vector3(b.vx, b.vy, b.vz).normalize(),
      );
    }
    for (const [id, m] of boltMeshes)
      if (!battle.bolts.some((b) => b.id === id)) {
        m.removeFromParent();
        boltMeshes.delete(id);
      }
    for (const e of battle.effects) {
      if (['wall', 'dodge', 'guard'].includes(e.kind)) continue;
      let mesh = effectMeshes.get(e.id);
      if (!mesh) {
        mesh = new Mesh(
          ['decree', 'slam', 'taunt', 'charge', 'heal'].includes(e.kind)
            ? ringGeometry
            : e.kind === 'lightning'
              ? boltGeometry
              : sparkGeometry,
          e.kind === 'heal'
            ? green
            : ['block', 'slam', 'lightning', 'charge'].includes(e.kind)
              ? blue
              : gold,
        );
        mesh.material = (mesh.material as MeshBasicMaterial).clone();
        (mesh.material as MeshBasicMaterial).transparent = true;
        (mesh.material as MeshBasicMaterial).depthWrite = false;
        effectMeshes.set(e.id, mesh);
        effectGroup.add(mesh);
      }
      (mesh.material as MeshBasicMaterial).opacity = Math.max(0, 1 - e.age / 0.5);
      mesh.position.set(e.x, e.y + 0.25, e.z);
      mesh.scale.setScalar(e.kind === 'decree' ? 1 + e.age * 36 : Math.max(0.1, 1 - e.age));
      if (['decree', 'slam', 'taunt', 'charge', 'heal'].includes(e.kind)) {
        mesh.rotation.x = -Math.PI / 2;
        const radius =
          e.kind === 'decree'
            ? 13
            : e.kind === 'taunt'
              ? 6
              : e.kind === 'slam'
                ? 4
                : e.kind === 'charge'
                  ? 1.2
                  : 1.3;
        mesh.scale.setScalar(Math.min(1, e.age / 0.45) * radius * 2);
      }
      if (e.kind === 'lightning' && e.end) {
        const from = new Vector3(e.x, e.y, e.z),
          end = new Vector3(e.end.x, e.end.y, e.end.z),
          direction = end.clone().sub(from);
        mesh.position.copy(from.add(end).multiplyScalar(0.5));
        mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize());
        mesh.scale.set(2.2, direction.length() / 0.8, 2.2);
      }
    }
    for (const [id, m] of effectMeshes)
      if (!battle.effects.some((e) => e.id === id)) {
        m.removeFromParent();
        (m.material as MeshBasicMaterial).dispose();
        effectMeshes.delete(id);
      }
    for (const t of battle.dangers) {
      let view = dangerMeshes.get(t.id);
      if (!view) {
        view = new AttackView(t, wallSpec(campaign.wallTier).height);
        dangerMeshes.set(t.id, view);
        dangerGroup.add(view.root);
      }
      view.update();
    }
    for (const [id, view] of dangerMeshes)
      if (!battle.dangers.some((t) => t.id === id)) {
        view.dispose();
        dangerMeshes.delete(id);
      }
    hudTime += dt;
    if (hudTime > 0.1) {
      hudTime = 0;
      updateHud();
    }
    if (inspection) {
      const { actor, character } = inspection;
      actor.action = inspection.attack
        ? actor.role === 'dragon'
          ? 'breath'
          : actor.role === 'hexcaster'
            ? 'staff_cast'
            : ['warden', 'raider', 'bulwark'].includes(actor.role)
              ? 'sword_slash'
              : campaign.weapon === 'stormbow'
                ? 'bow_fire'
                : 'lance_fire'
        : '';
      actor.actionTime =
        (actor.actionTime + dt) %
        (actor.role === 'dragon' ? 4 : actor.role === 'hexcaster' ? 1.5 : 1.2);
      character.update(actor, dt, campaign.weapon);
      renderer.render(inspection.scene, camera);
    } else renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  }
  const resize = new ResizeObserver(() => {
    const w = (viewportWidth = canvas.clientWidth),
      h = (viewportHeight = canvas.clientHeight);
    renderer.setPixelRatio(
      Math.min(devicePixelRatio, 1.25, Math.sqrt(1400000 / Math.max(1, w * h))),
    );
    renderer.setSize(w, h);
    camera.aspect = w / h;
    if (battle.phase === 'battle' && !inspection && w < h * 0.8 !== battlePortrait) fitBattle();
    camera.updateProjectionMatrix();
  });
  resize.observe(canvas);
  rebuild();
  updateHud();
  frame = requestAnimationFrame(animate);
  // Development-only read access for reproducible browser evidence; shipping builds expose no controls.
  if (import.meta.env.DEV)
    (window as unknown as Record<string, unknown>).__castle = {
      snapshot: () => ({
        phase: battle.phase,
        time: battle.time,
        paused: battle.paused,
        power: battle.power,
        guardTime: battle.guardTime,
        guardCooldown: battle.guardCooldown,
        guardSide: battle.guardSide,
        streak: battle.streak,
        loot: battle.loot,
        wallImpacts: [...battle.wallImpacts],
        king: { ...battle.king },
        knights: structuredClone(battle.knights),
        enemies: structuredClone(battle.enemies),
        dangers: structuredClone(battle.dangers),
        state: structuredClone(battle.state),
        stats: { ...battle.stats },
        render: { ...renderer.info.render },
        pixelRatio: renderer.getPixelRatio(),
        characterMeshes: [...characters.values()].map((c) => {
          let count = 0;
          c.model.traverse((o) => {
            if (o instanceof Mesh) count++;
          });
          return { role: c.role, count };
        }),
        architecture: assembly?.summary,
      }),
    };
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    resize.disconnect();
    clearInput();
    app.removeEventListener('click', click);
    unbindTouchTaps();
    app.removeEventListener('change', change);
    window.removeEventListener('keydown', keydown);
    window.removeEventListener('keyup', keyup);
    window.removeEventListener('blur', blur);
    document.removeEventListener('visibilitychange', visibility);
    touchHandlers.forEach((fn) => fn());
    orbit.dispose();
    closeInspection();
    characters.forEach((c) => c.dispose());
    defenseViews.forEach((d) => d.dispose());
    clearTransient();
    for (const geometry of [
      boltGeometry,
      sparkGeometry,
      ringGeometry,
      mountGeometry,
      kingHalo.geometry,
    ])
      geometry.dispose();
    for (const mat of [gold, blue, red, green, mountMaterial]) mat.dispose();
    sun.shadow.map?.dispose();
    assembly?.dispose();
    towerMaterials.clear();
    contactShadows.dispose();
    royalEffects.dispose();
    wallDamage?.dispose();
    environment.dispose();
    audio.dispose();
    cancelPlacement();
    mountRings.forEach((r) => (r.material as MeshBasicMaterial).dispose());
    renderer.dispose();
    delete (window as unknown as Record<string, unknown>).__castle;
  };
}
