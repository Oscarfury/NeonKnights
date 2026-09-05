import {
  ACESFilmicToneMapping,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Fog,
  Group,
  HemisphereLight,
  Line,
  LineBasicMaterial,
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
  InstancedMesh,
  Matrix4,
  AdditiveBlending,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Assets } from '../presentation/Assets';
import { DefenseView } from '../presentation/DefenseView';
import {
  spec,
  defenses,
  investment,
  type DefenseKind,
  type Rank,
  type SiteId,
} from '../construction/Catalog';
import * as C from './Campaign';
import {
  encounters,
  items,
  mounts,
  recruits,
  relics,
  wallSpec,
  wallTiers,
  type Relic,
  type ItemKind,
} from './Catalog';
import { Battle, type Actor, type Telegraph } from './Battle';
import { Character, kit } from './Character';
import type { Weapon } from '../presentation/Paladin';
import './castle.css';
import { buildingCouncil, companyCouncil } from './Council';
import { platformAt } from './Placement';
import { Environment } from './Environment';
import { RoyalEffects } from './RoyalEffects';

const roman = ['I', 'II', 'III'];
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function mountCastle(app: HTMLElement, assets: Assets, foundry: () => void) {
  const loaded = C.loadCampaign();
  let campaign = loaded.state || C.createCampaign(),
    battle = new Battle(campaign),
    tab = 'castle',
    site: SiteId = 'east-court';
  let selectedKnight = 'aldren';
  let picked: string | null = null;
  let notice =
    loaded.notice ||
    'Your King fights from the walls. Equip the company, mount defenses, then begin the watch.';
  let accumulator = 0;
  let battlePortrait = false;
  let frame = 0,
    last = performance.now(),
    hudTime = 0,
    finished = false,
    disposed = false,
    dragging = false;
  const input = {
    rotate: 0,
    heading: undefined as number | undefined,
    charge: false,
    decree: false,
  };
  const keys = new Set<string>();
  app.innerHTML = `<div class="castle-app"><header class="castle-header"><a class="wordmark" href="${import.meta.env.BASE_URL}"><span class="crest">N</span>NEON <b>KNIGHTS</b></a><span class="castle-chapter">THE KING'S BATTLEMENTS</span><div><button class="quiet" id="castle-foundry">Art & training</button><button class="quiet" id="castle-pause">Pause</button></div></header><main class="castle-layout"><section class="castle-stage" aria-label="Castle siege battlefield"><div class="castle-canvas"></div><div class="castle-labels" aria-hidden="true"></div><div class="castle-title"><span class="eyebrow">THE ROYAL HOLD</span><h1>Hold the crown.</h1><p id="castle-objective"></p></div><div class="castle-boss" hidden><span>THE EMBERWING DRAGON</span><meter min="0" max="1650" value="1650"></meter><small>Move the King out of marked attacks. Royal Decree can interrupt a breath during its warning.</small></div><div class="castle-announcement" role="status"></div><div class="castle-hud"><div class="royal-vital"><span class="eyebrow">♔ LEGENDARY KING</span><strong id="royal-hp"></strong><meter id="royal-health" min="0" max="160"></meter></div><div class="castle-rotation"><button id="king-left" aria-label="Move King clockwise">↶</button><span>FOLLOW THE CROWN<br><small>MOUSE TO MOVE · AUTO FIRE</small></span><button id="king-right" aria-label="Move King counterclockwise">↷</button></div><button id="king-charge" class="royal-skill">Charged shot <small>HOLD CLICK / E</small><i id="royal-charge"></i></button><button id="king-decree" class="royal-skill">Royal Decree <small id="decree-power"></small><i id="royal-power"></i></button></div><div class="castle-result" hidden></div></section><aside class="war-council"><div class="council-heading"><span class="eyebrow">WAR COUNCIL</span><div><h2 id="watch-name"></h2><strong id="castle-gold"></strong></div><p id="watch-description"></p><button class="quiet new-siege" data-action="new-dialog">New siege</button></div><nav class="council-tabs" aria-label="Castle management"><button data-tab="castle">Build</button><button data-tab="company">Knights</button><button data-tab="armory">King & gear</button><button data-tab="relics">Relics</button></nav><div class="council-content"></div><div class="council-bottom"><p id="council-notice" role="status"></p><button class="primary" id="begin-watch">Begin watch <span>↗</span></button><p class="checkpoint-note">Council choices save automatically. Reloading a battle returns to its starting checkpoint.</p></div></aside></main></div>`;
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => app.querySelector<T>(s)!;
  const stage = $('.castle-stage'),
    canvas = $('.castle-canvas'),
    labels = $('.castle-labels'),
    content = $('.council-content');
  const touchControls = matchMedia('(pointer: coarse)').matches;
  if (touchControls) {
    $('.castle-rotation small').textContent = 'DRAG TO MOVE · AUTO FIRE';
    $('#king-charge small').textContent = 'HOLD TO CHARGE';
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
  canvas.append(renderer.domElement);
  const camera = new PerspectiveCamera(41, 1, 0.1, 400);
  camera.position.set(0, 24, 30);
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
  const keepMaterials = new Set<MeshStandardMaterial>();
  const occlusionRay = new Raycaster(),
    occlusionPoint = new Vector3(),
    occlusionDirection = new Vector3();
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
    dangerMeshes = new Map<number, Group>();
  const mountMaterial = new MeshBasicMaterial({
    color: 0xe7c67d,
    transparent: true,
    opacity: 0.55,
  });
  const mountGeometry = new TorusGeometry(1.5, 0.07, 6, 48);
  const mountRings: Mesh[] = [];
  for (const m of mounts) {
    const ring = new Mesh(mountGeometry, mountMaterial.clone());
    ring.position.set(m.x, wallSpec(campaign.wallTier).height + 0.1, m.z);
    ring.rotation.x = -Math.PI / 2;
    ring.userData.site = m.id;
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
    for (const group of dangerMeshes.values())
      group.traverse((o) => {
        if (o instanceof Mesh || o instanceof Line) {
          if (o instanceof InstancedMesh) o.dispose();
          o.geometry.dispose();
          (o.material as MeshBasicMaterial).dispose();
        }
      });
    dangerMeshes.clear();
    dangerGroup.clear();
    boltMeshes.clear();
    projectileGroup.clear();
    effectMeshes.clear();
    effectGroup.clear();
  }
  function rebuild() {
    closeInspection();
    if (battle.phase !== 'planning') {
      camera.fov = 41;
      camera.position.set(0, 24, 30);
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
    castle?.removeFromParent();
    keepMaterials.forEach((m) => m.dispose());
    keepMaterials.clear();
    castle = assets.get(`castle-${campaign.wallTier}`).scene.clone(true);
    const copied = new Map<MeshStandardMaterial, MeshStandardMaterial>();
    castle.getObjectByName('RoyalKeep')!.traverse((o) => {
      if (o instanceof Mesh) {
        const source = o.material as MeshStandardMaterial;
        let mat = copied.get(source);
        if (!mat) {
          mat = source.clone();
          mat.transparent = true;
          copied.set(source, mat);
          keepMaterials.add(mat);
        }
        o.material = mat;
      }
    });
    scene.add(castle);
    battle = new Battle(campaign);
    finished = false;
    for (const b of battle.defenses) {
      const v = new DefenseView(assets, b.kind, b.rank);
      defenseViews.set(b.id, v);
      scene.add(v.root);
      if (campaign.relic === 'worldpiercer' && b.kind === 'ballista') {
        const module = kit(assets, 'WorldpiercerModule');
        module.position.y = b.rank === 1 ? 1.08 : b.rank === 2 ? 1.43 : 1.78;
        v.model.getObjectByName('Turret')!.add(module);
      }
    }
    if (campaign.relic === 'black-standard')
      for (const z of [-9.6, 9.6]) {
        const banner = kit(assets, 'BlackStandard');
        banner.position.set(3, 0, z);
        castle.add(banner);
      }
    mountRings.forEach((r) => (r.position.y = wallSpec(campaign.wallTier).height + 0.1));
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
      content.innerHTML = `<div class="battle-orders"><span class="eyebrow">THE COMPANY IS FIGHTING</span><h3>The crown holds the line.</h3><p>Move your mouse around the castle to guide the King. He fires automatically toward nearby invaders.</p><p>Hold left click or E, then release a piercing shot. Space casts Royal Decree when ready.</p><p>Your knights fight and use their talents automatically. On touchscreens, drag around the castle and use the skill buttons.</p><div id="battle-company"></div><div id="battle-walls"></div><button class="council-button" data-action="pause">Pause the watch</button></div>`;
      return;
    }
    if (tab === 'castle') {
      content.innerHTML = buildingCouncil(campaign, site, picked);
    } else if (tab === 'company') {
      content.innerHTML = companyCouncil(campaign, selectedKnight);
    } else if (tab === 'armory') {
      content.innerHTML = `<article class="king-plate"><span class="eyebrow">♔ LEGENDARY COMMANDER</span><h3>The Storm King</h3>${button('Inspect the King', 'inspect:king')}${button(`Treat the King \u00b7 ${Math.ceil((160 - campaign.kingHp) / 2)} \u265c`, 'king-treat', campaign.kingHp === 160)}<p>Patrols the walls and fires automatically. Charged shots pierce three invaders. Royal Decree breaks nearby attackers and can interrupt the Dragon's breath.</p><label class="council-label" for="royal-weapon">ROYAL WEAPON</label><select id="royal-weapon"><option value="stormbow" ${campaign.weapon === 'stormbow' ? 'selected' : ''}>Stormbow · ${roman[campaign.ranks.stormbow - 1]}</option><option value="sunlance" ${campaign.weapon === 'sunlance' ? 'selected' : ''}>Sunlance · ${roman[campaign.ranks.sunlance - 1]}</option></select>${button(campaign.ranks[campaign.weapon] < 3 ? `Improve ${campaign.weapon === 'stormbow' ? 'Stormbow' : 'Sunlance'} · ${campaign.ranks[campaign.weapon] === 1 ? 150 : 280} ♜` : 'Royal weapon complete', 'weapon-up', campaign.ranks[campaign.weapon] === 3)}<p>${campaign.sockets[campaign.weapon].length} / ${campaign.wallTier} sockets occupied. Equipping and removing owned runes is free.</p><div class="owned-runes">${
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
      content.innerHTML = `<div class="council-intro"><span class="eyebrow">RELIC VAULT</span><h3>Power with a purpose.</h3><p>${campaign.relic ? 'Your chosen relic is bound to this siege.' : campaign.encounter === 2 ? 'The Dragon has fallen. Choose one legendary relic for the counter-siege.' : 'Defeat the Emberwing Dragon in the second encounter to claim one of these relics.'}</p></div>${(
        Object.keys(relics) as Relic[]
      )
        .map((id) => {
          const r = relics[id];
          return `<article class="relic-plate ${campaign.relic === id ? 'chosen' : ''}"><span class="relic-symbol">${r.symbol}</span><span class="eyebrow">LEGENDARY · ${r.system}</span><h3>${r.name}</h3><p>${r.effect}</p><p class="relic-tradeoff">${r.tradeoff}</p>${button(campaign.relic === id ? 'Bound to the castle' : campaign.relic ? 'Another relic is bound' : campaign.encounter === 2 ? 'Claim this relic' : 'Earned from the Dragon', `relic:${id}`, !!campaign.relic || campaign.encounter !== 2)}</article>`;
        })
        .join('')}`;
    }
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
      notice = 'Choose the relic you earned before the counter-siege.';
      renderCouncil();
      return;
    }
    C.saveCampaign(campaign);
    battle.start();
    clearInput();
    renderCouncil();
    fitBattle();
  }
  function fitBattle() {
    battlePortrait = canvas.clientWidth < canvas.clientHeight * 0.8;
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
    input.charge = false;
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
      notice = 'The company has returned. Treat wounds and strengthen the castle.';
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
      if (action === 'king-treat') return C.treatKing(campaign);
      if (action === 'weapon-up') return C.improveWeapon(campaign, campaign.weapon);
      if (action === 'assign') return C.assign(campaign, arg);
      if (action === 'treat') return C.treat(campaign, arg);
      if (action === 'promote') return C.promote(campaign, arg);
      if (action === 'recruit') return C.recruit(campaign, 'lysa');
      if (action === 'relic') return C.chooseRelic(campaign, arg as Relic);
    });
  };
  app.addEventListener('click', click);
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
    if (event.code === 'KeyQ' && !event.repeat) {
      battle.state.weapon = battle.state.weapon === 'stormbow' ? 'sunlance' : 'stormbow';
      battle.king.action = '';
      battle.charge = 0;
    }
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
    '#king-charge',
    () => (input.charge = true),
    () => (input.charge = false),
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
    button.className = 'platform-target';
    button.dataset.action = `slot:${m.id}`;
    button.setAttribute('aria-label', `Place on ${m.name} platform`);
    button.innerHTML = `<strong>${m.name[0]}</strong><small>PLACE</small>`;
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
    ghost = new DefenseView(assets, kind, existing?.rank || 1, true);
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
    notice = 'Building placed. It will fight automatically when the watch begins.';
    C.saveCampaign(campaign);
    rebuild();
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
    plane.constant = -wallSpec(campaign.wallTier).height;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.ray.intersectPlane(plane, point);
  }
  function placementMove(e: PointerEvent) {
    if (!picked) return;
    const p = groundPoint(e);
    hovered = p ? platformAt(p.x, p.z) : null;
    const m = mounts.find((m) => m.id === hovered);
    if (ghost) {
      ghost.root.visible = !!m;
      if (m) {
        ghost.root.position.set(m.x, wallSpec(campaign.wallTier).height, m.z);
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
      const p = groundPoint(e),
        destination = p ? platformAt(p.x, p.z) : null;
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
    if (e.pointerType === 'mouse' && e.button === 0) input.charge = true;
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
    input.charge = false;
  };
  renderer.domElement.addEventListener('pointerdown', pointerdown);
  renderer.domElement.addEventListener('pointermove', pointermove);
  renderer.domElement.addEventListener('pointerup', pointerup);
  renderer.domElement.addEventListener('pointercancel', pointerup);
  renderer.domElement.addEventListener('lostpointercapture', pointerup);
  function danger(t: Telegraph) {
    const group = new Group(),
      points: Vector3[] = [];
    if (t.kind !== 'hex') points.push(new Vector3(t.x, 0.08, t.z));
    const count = 48;
    for (let i = 0; i <= count; i++) {
      const angle =
          t.kind === 'hex' ? (i * Math.PI * 2) / count : t.yaw - t.arc / 2 + (i * t.arc) / count,
        r = t.kind === 'hex' ? t.radius : t.length;
      points.push(new Vector3(t.x + Math.sin(angle) * r, 0.08, t.z + Math.cos(angle) * r));
    }
    if (t.kind !== 'hex') points.push(points[0].clone());
    for (const y of [0, wallSpec(campaign.wallTier).height]) {
      const path = points.map((p) => new Vector3(p.x, p.y + y, p.z)),
        vertices: number[] = [];
      for (let i = 1; i < path.length - 1; i++)
        vertices.push(...path[0].toArray(), ...path[i].toArray(), ...path[i + 1].toArray());
      const g = new BufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute(vertices, 3));
      group.add(
        new Mesh(
          g,
          new MeshBasicMaterial({
            color: 0xef6078,
            transparent: true,
            opacity: 0.1,
            depthWrite: false,
            side: DoubleSide,
          }),
        ),
        new Line(
          new BufferGeometry().setFromPoints(path),
          new LineBasicMaterial({
            color: 0xffb097,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
          }),
        ),
      );
    }
    if (t.kind === 'breath' || t.kind === 'rake') {
      const particles = new InstancedMesh(
        t.kind === 'rake'
          ? new CylinderGeometry(0.05, 0.16, 1.3, 6)
          : new SphereGeometry(0.2, 6, 4),
        new MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
          blending: AdditiveBlending,
        }),
        80,
      );
      particles.name = 'breath-stream';
      particles.frustumCulled = false;
      for (let i = 0; i < 80; i++)
        particles.setColorAt(
          i,
          new Color(
            (t.kind === 'rake' ? [0xb4dfff, 0xffffff, 0x96ead9] : [0xffb451, 0xff563a, 0xffe7a2])[
              i % 3
            ],
          ),
        );
      group.add(particles);
    }
    return group;
  }
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
      characters.set(a.id, c);
      scene.add(c.root);
      const label = document.createElement('div');
      label.className = `unit-label ${a.role === 'king' ? 'legendary' : battle.enemies.includes(a) ? 'enemy' : 'ally'}`;
      label.innerHTML = `<span>${a.role === 'king' ? '♔ THE KING' : escape(a.name)}</span><i></i>`;
      actorLabels.set(a.id, label);
      labels.append(label);
    }
    c.update(
      a,
      dt,
      a.role === 'king' ? battle.state.weapon : 'stormbow',
      a.role === 'king' && battle.charge > 0,
    );
    const label = actorLabels.get(a.id)!;
    projected.set(a.x, a.y + (a.role === 'dragon' ? 4.7 : 2.45), a.z).project(camera);
    const visible =
      projected.z < 1 &&
      Math.abs(projected.x) < 1 &&
      Math.abs(projected.y) < 1 &&
      !(a.hp <= 0 && battle.enemies.includes(a));
    label.hidden = !visible;
    if (visible) {
      label.style.transform = `translate(${(projected.x * 0.5 + 0.5) * canvas.clientWidth}px,${(-projected.y * 0.5 + 0.5) * canvas.clientHeight}px) translate(-50%,-100%)`;
      label.querySelector('i')!.style.setProperty('--hp', `${(a.hp / a.maxHp) * 100}%`);
      label.classList.toggle('fallen', a.hp <= 0);
    }
  }
  function updateHud() {
    $('#royal-hp').textContent = `${Math.ceil(battle.king.hp)} / 160`;
    ($('#royal-health') as HTMLMeterElement).value = battle.king.hp;
    $('#decree-power').textContent =
      battle.power >= 100
        ? `READY · ${touchControls ? 'TAP' : 'SPACE'}`
        : `${Math.floor(battle.power)} / 100 · ${touchControls ? 'TAP' : 'SPACE'}`;
    $('#royal-power').style.width = `${battle.power}%`;
    $('#royal-charge').style.width = `${battle.charge * 100}%`;
    $('#king-decree').classList.toggle('ready', battle.power >= 100);
    $('.castle-announcement').textContent = battle.phase === 'planning' ? '' : battle.announcement;
    const weakest = Math.min(...battle.state.walls);
    if (
      battle.phase === 'battle' &&
      weakest < wallSpec(campaign.wallTier).hp * 0.35 &&
      !battle.dangers.length
    ) {
      const side = battle.state.walls.indexOf(weakest);
      $('.castle-announcement').textContent =
        `${['North', 'East', 'South', 'West'][side]} wall is failing — move the King to defend it.`;
    }
    $('#castle-objective').textContent =
      battle.phase === 'planning'
        ? `${wallSpec(campaign.wallTier).name} · ${campaign.difficulty.toUpperCase()}`
        : `${Math.floor(battle.time / 60)}:${Math.floor(battle.time % 60)
            .toString()
            .padStart(
              2,
              '0',
            )} · ${battle.kills} invaders defeated · ${battle.state.weapon === 'stormbow' ? 'Stormbow' : 'Sunlance'}`;
    const boss = battle.enemies.find((e) => e.role === 'dragon' && e.hp > 0);
    $('.castle-boss').hidden = !boss;
    if (boss) {
      const m = $<HTMLMeterElement>('.castle-boss meter');
      m.max = boss.maxHp;
      m.value = boss.hp;
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
    const running = battle.phase === 'battle' && !battle.paused;
    const effective = {
      ...input,
      rotate:
        input.rotate +
        (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
        (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0),
      charge: input.charge || keys.has('KeyE'),
    };
    if (running) {
      accumulator += dt;
      while (accumulator >= 1 / 60) {
        battle.tick(1 / 60, effective);
        effective.decree = false;
        input.decree = false;
        accumulator -= 1 / 60;
      }
    } else accumulator = 0;
    environment.update(dt);
    orbit.update();
    for (const a of [battle.king, ...battle.knights, ...battle.enemies])
      present(a, running || battle.phase === 'planning' ? dt : 0);
    const live = new Set([battle.king, ...battle.knights, ...battle.enemies].map((a) => a.id));
    for (const [id, c] of characters)
      if (!live.has(id)) {
        c.dispose();
        characters.delete(id);
        actorLabels.get(id)?.remove();
        actorLabels.delete(id);
      }
    royalEffects.update(battle);
    kingHalo.position.set(battle.king.x, battle.king.y + 0.1, battle.king.z);
    kingHalo.visible = battle.king.hp > 0;
    wallLabels.forEach((label, i) => {
      label.hidden = !!inspection;
      const p = [
        { x: 0, z: -6.4 },
        { x: 6.4, z: 0 },
        { x: 0, z: 6.4 },
        { x: -6.4, z: 0 },
      ][i];
      projected.set(p.x, wallSpec(campaign.wallTier).height + 2.6, p.z).project(camera);
      label.style.left = `${(projected.x * 0.5 + 0.5) * canvas.clientWidth}px`;
      label.style.top = `${(-projected.y * 0.5 + 0.5) * canvas.clientHeight}px`;
      label.textContent = `${['N', 'E', 'S', 'W'][i]}${battle.phase === 'battle' ? ` ${Math.ceil(battle.state.walls[i])}` : ''}`;
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
      occlusionRay.intersectObject(castle.getObjectByName('RoyalKeep')!, true).length > 0;
    keepMaterials.forEach((m) => {
      m.opacity += ((blocked ? 0.26 : 1) - m.opacity) * Math.min(1, dt * 7);
      m.depthWrite = m.opacity > 0.95;
    });
    for (const b of battle.defenses) {
      const v = defenseViews.get(b.id)!;
      v.update(b, battle.phase === 'planning');
      v.coverage.visible = battle.phase === 'planning' && tab === 'castle' && b.site === site;
    }
    mountGroup.visible = battle.phase === 'planning' && tab === 'castle';
    mountRings.forEach((r, i) => {
      const m = mounts[i],
        occupied = campaign.buildings.some((b) => b.site === m.id && picked !== `move:${b.id}`);
      const material = r.material as MeshBasicMaterial;
      material.color.setHex(
        picked ? (occupied ? 0xf0797d : 0x79f0cf) : r.userData.site === site ? 0xffda86 : 0xbcb391,
      );
      material.opacity = picked ? 0.75 + Math.sin(now * 0.004) * 0.2 : 0.42;
      r.scale.setScalar(hovered === m.id ? 1.12 : 1);
      const button = platformButtons[i];
      button.hidden = !picked || !!inspection || battle.phase !== 'planning';
      projected.set(m.x, wallSpec(campaign.wallTier).height + 0.15, m.z).project(camera);
      button.style.left = `${(projected.x * 0.5 + 0.5) * canvas.clientWidth}px`;
      button.style.top = `${(-projected.y * 0.5 + 0.5) * canvas.clientHeight}px`;
      button.classList.toggle('occupied', occupied);
      button.classList.toggle('hovered', hovered === m.id);
      button.querySelector('small')!.textContent = occupied ? 'OCCUPIED' : 'PLACE';
    });
    for (const gateName of ['NorthGate', 'SouthGate']) {
      const gate = castle.getObjectByName(gateName);
      if (gate) gate.position.y = battle.phase === 'battle' && battle.time < 4 ? 2.1 : 0;
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
        effectMeshes.set(e.id, mesh);
        effectGroup.add(mesh);
      }
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
                  ? 3
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
        effectMeshes.delete(id);
      }
    for (const t of battle.dangers) {
      let group = dangerMeshes.get(t.id);
      if (!group) {
        group = danger(t);
        dangerMeshes.set(t.id, group);
        dangerGroup.add(group);
      }
      group.traverse((o) => {
        if (o instanceof InstancedMesh && o.name === 'breath-stream') {
          o.visible = t.age >= t.windup;
          const matrix = new Matrix4();
          for (let i = 0; i < 80; i++) {
            const u = ((t.age - t.windup) * 1.6 + i / 80 + 10) % 1,
              angle = t.yaw + Math.sin(i * 37) * t.arc * 0.46,
              r = 2.9 + u * (t.length - 2.9),
              y =
                2.8 * (1 - u) + (wallSpec(campaign.wallTier).height + 1.6) * ((i * 0.618) % 1) * u;
            if (t.kind === 'rake') {
              matrix.makeRotationY(angle).multiply(new Matrix4().makeRotationX(Math.PI / 2));
              matrix.scale(new Vector3(0.7, 1 + u * 2, 0.7));
            } else matrix.makeScale(0.6 + u * 1.6, 0.6 + u * 1.6, 0.6 + u * 1.6);
            matrix.setPosition(t.x + Math.sin(angle) * r, y, t.z + Math.cos(angle) * r);
            o.setMatrixAt(i, matrix);
          }
          o.instanceMatrix.needsUpdate = true;
        } else if (o instanceof Mesh) {
          const m = o.material as MeshBasicMaterial;
          m.opacity = t.age < t.windup ? 0.1 + (0.08 * t.age) / t.windup : 0.48;
          m.color.setHex(t.age < t.windup ? 0xef6078 : 0xffb761);
        }
      });
    }
    for (const [id, g] of dangerMeshes)
      if (!battle.dangers.some((d) => d.id === id)) {
        g.traverse((o) => {
          if (o instanceof Mesh || o instanceof Line) {
            if (o instanceof InstancedMesh) o.dispose();
            o.geometry.dispose();
            (o.material as MeshBasicMaterial).dispose();
          }
        });
        g.removeFromParent();
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
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
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
        king: { ...battle.king },
        knights: structuredClone(battle.knights),
        enemies: structuredClone(battle.enemies),
        dangers: structuredClone(battle.dangers),
        state: structuredClone(battle.state),
        stats: { ...battle.stats },
        render: { ...renderer.info.render },
      }),
    };
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    resize.disconnect();
    clearInput();
    app.removeEventListener('click', click);
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
    keepMaterials.forEach((m) => m.dispose());
    royalEffects.dispose();
    environment.dispose();
    cancelPlacement();
    mountRings.forEach((r) => (r.material as MeshBasicMaterial).dispose());
    renderer.dispose();
    delete (window as unknown as Record<string, unknown>).__castle;
  };
}
