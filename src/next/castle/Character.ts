import {
  AnimationAction,
  AnimationMixer,
  Group,
  LoopOnce,
  LoopRepeat,
  Object3D,
  PropertyBinding,
  Quaternion,
  Matrix4,
  Vector3,
  SkinnedMesh,
} from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { Assets } from '../presentation/Assets';
import { Paladin } from '../presentation/Paladin';
import type { Actor } from './Battle';
import { dragonTiming } from './Battle';
import { royalWeapons, isBoss } from './Catalog';
import type { Weapon } from '../presentation/Paladin';
export function kit(assets: Assets, name: string) {
  const part =
    assets.get('company-kit').scene.getObjectByName(name) ||
    assets.get('campaign-kit').scene.getObjectByName(name);
  if (!part) throw new Error(`Missing equipment: ${name}`);
  const copy = part.clone(true);
  copy.position.set(0, 0, 0);
  return copy;
}
export class Character {
  readonly root: Group;
  readonly model: Group;
  readonly mixer: AnimationMixer;
  readonly paladin?: Paladin;
  private actions = new Map<string, AnimationAction>();
  private action?: AnimationAction;
  private attachments: { model: Object3D; bone: Object3D; rest: Quaternion; offset: Vector3 }[] =
    [];
  private p = new Vector3();
  private q = new Quaternion();
  private rotation = new Quaternion();
  private inverseRoot = new Matrix4();
  private scale = new Vector3();
  constructor(
    assets: Assets,
    readonly role: Actor['role'],
    weapon: Weapon = 'stormbow',
    gear?: string,
  ) {
    if (role === 'king' || role === 'marksman' || role === 'arbalist') {
      this.paladin = new Paladin(assets, role === 'king' ? ['stormbow', 'sunlance'] : ['stormbow']);
      this.paladin.weapon = weapon;
      this.paladin.animate(false, 0);
      this.paladin.update(0);
      this.root = this.paladin.root;
      this.model = this.paladin.model;
      this.mixer = this.paladin.mixer;
    } else {
      this.root = new Group();
      const source = assets.get(
        role === 'dragon'
          ? 'prism-dragon'
          : role === 'golem'
            ? 'procession-golem'
            : role === 'ram'
              ? 'iron-ram'
              : 'paladin',
      );
      this.model = role === 'war-banner' ? new Group() : (clone(source.scene) as Group);
      if (role === 'war-banner') {
        const flag = kit(assets, 'BlackStandard');
        flag.position.y = 1.2;
        this.model.add(flag);
      }
      this.root.add(this.model);
      this.mixer = new AnimationMixer(this.model);
      for (const clip of role === 'war-banner' ? [] : source.animations)
        this.actions.set(clip.name, this.mixer.clipAction(clip));
      this.play(role === 'dragon' ? 'idle' : role === 'hexcaster' ? 'staff_idle' : 'sword_idle');
      this.mixer.update(0);
    }
    this.model.traverse((o) => {
      if (o instanceof SkinnedMesh) o.frustumCulled = false;
    });
    this.root.updateMatrixWorld(true);
    const attach = (name: string, socket: string, offset: Vector3 = new Vector3()) => {
      const bone = this.model.getObjectByName(PropertyBinding.sanitizeNodeName(socket));
      if (!bone) throw new Error(`Missing body socket ${socket}`);
      const model = kit(assets, name),
        rest = bone.getWorldQuaternion(new Quaternion()).invert();
      this.root.add(model);
      this.attachments.push({ model, bone, rest, offset });
    };
    const hands = ['DEF-hand.L', 'DEF-hand.R'],
      head = 'DEF-spine.006',
      back = 'DEF-spine.003';
    if (role === 'king') {
      attach('RoyalCrown', head, new Vector3(0, 0.17, 0));
      attach('RoyalMantle', back, new Vector3(0, 0.12, -0.13));
    }
    if (role === 'warden') {
      attach('WardenShield', hands[0], new Vector3(0, 0, 0.08));
      attach('WardenBlade', hands[1]);
      attach('WardenCrest', head, new Vector3(0, 0.16, 0));
      attach('WardenMantle', back, new Vector3(0, 0.08, -0.13));
    }
    if (role === 'marksman') attach('MarksmanQuiver', back, new Vector3(0.15, -0.2, -0.2));
    if (['raider', 'reaver', 'sapper', 'banneret', 'arbalist'].includes(role)) {
      if (role !== 'arbalist') attach('RaiderAxe', hands[1]);
      if (role === 'reaver') attach('RaiderAxe', hands[0]);
      if (role === 'sapper') attach('SapperPack', back, new Vector3(0, -0.1, -0.2));
      if (role === 'banneret') attach('BlackStandard', back, new Vector3(0, 0.6, -0.2));
      attach('RaiderCrest', head, new Vector3(0, 0.1, 0));
      attach('RaiderMantle', back, new Vector3(0, 0.08, -0.15));
    }
    if (role === 'bulwark') {
      this.root.scale.setScalar(1.15);
      attach('BulwarkShield', hands[0], new Vector3(0, 0, 0.1));
      attach('BulwarkMace', hands[1]);
      attach('WardenCrest', head, new Vector3(0, 0.16, 0));
    }
    if (role === 'hexcaster') {
      attach('HexStaff', hands[1]);
      attach('HexCrown', head, new Vector3(0, 0.13, 0));
      attach('HexMantle', back, new Vector3(0, 0.08, -0.15));
    }
    if (role === 'lancer') {
      attach('LancerSpear', hands[1]);
      attach('WardenCrest', head, new Vector3(0, 0.16, 0));
      attach('WardenMantle', back, new Vector3(0, 0.08, -0.13));
    }
    if (role === 'chanter') {
      attach('DawnStaff', hands[1]);
      attach('WardenMantle', back, new Vector3(0, 0.08, -0.15));
      attach('HexCrown', head, new Vector3(0, 0.13, 0));
    }
    if (role === 'hollow-king') {
      this.root.scale.setScalar(1.7);
      attach('HollowCrown', head, new Vector3(0, 0.18, 0));
      attach('HollowBlade', hands[1]);
      attach('RoyalMantle', back, new Vector3(0, 0.12, -0.18));
      attach('BulwarkShield', hands[0], new Vector3(0, 0, 0.1));
    }
    if (gear) attach(gear, back, new Vector3(0.32, 0.01, 0.18));
    this.updateAttachments();
  }
  private play(name: string, once = false) {
    const action = this.actions.get(name);
    if (!action || action === this.action) return;
    action.reset().setLoop(once ? LoopOnce : LoopRepeat, once ? 1 : Infinity);
    action.clampWhenFinished = once;
    action.play();
    if (this.action) action.crossFadeFrom(this.action, 0.16, false);
    this.action = action;
  }
  private updateAttachments(updateWorld = true) {
    if (updateWorld) this.root.updateMatrixWorld(true);
    this.inverseRoot.copy(this.root.matrixWorld).invert();
    this.root.matrixWorld.decompose(this.p, this.rotation, this.scale);
    this.rotation.invert();
    for (const a of this.attachments) {
      a.bone.matrixWorld.decompose(this.p, this.q, this.scale);
      this.p.applyMatrix4(this.inverseRoot);
      this.q.premultiply(this.rotation).multiply(a.rest);
      a.model.position.copy(a.offset).applyQuaternion(this.q).add(this.p);
      a.model.quaternion.copy(this.q);
    }
  }
  update(a: Actor, dt: number, weapon: Weapon = 'stormbow', charging = false) {
    if (this.paladin && a.role !== 'king') weapon = 'stormbow';
    this.root.position.set(a.x, a.y, a.z);
    if (a.hp > 0 && a.hitFlash > 0) {
      this.root.position.x -= Math.sin(a.yaw) * a.hitFlash * 1.1;
      this.root.position.z -= Math.cos(a.yaw) * a.hitFlash * 1.1;
    }
    this.root.rotation.y = a.yaw;
    if (a.role === 'ram') {
      const head = this.model.getObjectByName('RamHead');
      if (head)
        head.position.z =
          a.action === 'ram'
            ? a.actionTime < 2.1
              ? -0.4 * Math.min(1, a.actionTime / 1.7)
              : 0.55 * Math.max(0, 1 - (a.actionTime - 2.1) / 0.6)
            : 0;
    }
    if (a.role === 'golem') {
      const arm = this.model.getObjectByName('ThrowingArm');
      if (arm) arm.visible = !a.brokenArm;
    }
    let actionTime = a.actionTime;
    if (a.role === 'king' && a.action) {
      const w = royalWeapons[weapon];
      // Fast simulation cadence retimes the authored draw/release, preserving the contact pose.
      actionTime =
        weapon === 'stormbow'
          ? a.actionTime < w.contact
            ? 0.45 + (a.actionTime / w.contact) * 0.21
            : 0.66 + ((a.actionTime - w.contact) / (w.interval - w.contact)) * 0.52
          : a.actionTime / w.interval;
    }
    if (this.paladin) {
      this.paladin.weapon = weapon;
      this.paladin.setDowned(a.hp <= 0);
      this.paladin.animate(
        a.moving,
        a.role === 'king' ? 1 : 0,
        charging ? (weapon === 'stormbow' ? 'bow_hold' : 'lance_charge') : a.action,
        1,
        false,
        a.action ? actionTime : undefined,
      );
      this.paladin.update(dt);
    } else {
      const name =
        a.hp <= 0
          ? this.role === 'dragon' || this.role === 'golem'
            ? 'death'
            : 'downed'
          : a.action ||
            (a.moving
              ? this.role === 'dragon' || this.role === 'golem'
                ? 'walk'
                : 'run'
              : this.role === 'dragon' || this.role === 'golem'
                ? 'idle'
                : this.role === 'hexcaster' || this.role === 'chanter'
                  ? 'staff_idle'
                  : 'sword_idle');
      const mapped =
        this.role === 'hollow-king'
          ? (
              {
                duel: 'sword_thrust',
                decree: 'sword_slash',
                crownfall: 'staff_cast',
                plant: 'interact',
                arrive: 'recover',
                stagger: 'hit',
              } as Record<string, string>
            )[name] || name
          : name === 'lunge'
            ? 'sword_thrust'
            : name;
      this.play(mapped, !!a.action || a.hp <= 0);
      this.mixer.update(dt);
      if (this.action && (a.action || a.hp <= 0)) {
        let time = a.hp <= 0 ? a.deadTime : a.actionTime;
        if (a.hp > 0 && this.role === 'dragon' && ['breath', 'rake', 'tail'].includes(a.action)) {
          const t = dragonTiming(a.action),
            start = a.action === 'breath' ? 1.5 : a.action === 'rake' ? 1.35 : 1.4;
          const end = a.action === 'breath' ? 3.2 : a.action === 'rake' ? 2.2 : 2;
          time =
            time < t.windup
              ? (time / t.windup) * start
              : time < t.windup + t.duration
                ? start + ((time - t.windup) / t.duration) * (end - start)
                : end + ((time - t.windup - t.duration) / t.recovery) * (4 - end);
        }
        if (this.role === 'hollow-king' && a.action)
          time =
            (a.actionTime * this.action.getClip().duration) /
            (a.action === 'duel'
              ? 2.4
              : a.action === 'arrive'
                ? 2.5
                : a.action === 'stagger'
                  ? 2.2
                  : a.action === 'plant'
                    ? 1.7
                    : 3.6);
        this.action.time = Math.min(time, this.action.getClip().duration);
        this.mixer.update(0);
      }
    }
    this.updateAttachments(!this.paladin);
  }
  dispose() {
    if (this.paladin) this.paladin.dispose();
    else {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.model);
      const skeletons = new Set<SkinnedMesh['skeleton']>();
      this.model.traverse((o) => {
        if (o instanceof SkinnedMesh) skeletons.add(o.skeleton);
      });
      skeletons.forEach((s) => s.dispose());
      this.root.removeFromParent();
    }
  }
}
