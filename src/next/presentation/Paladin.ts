import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  LoopOnce,
  LoopRepeat,
  PropertyBinding,
  SkeletonHelper,
  Vector3,
  Mesh,
  MeshStandardMaterial,
  CylinderGeometry,
  ConeGeometry,
  Quaternion,
  SkinnedMesh,
} from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { Assets } from './Assets';

export type Weapon = 'stormbow' | 'sunlance';
const lower = /(?:root|DEF-(?:spine|pelvis|thigh|shin|foot|toe))/;
export class Paladin {
  readonly root = new Group();
  readonly model: Group;
  readonly mixer: AnimationMixer;
  readonly helper: SkeletonHelper;
  readonly bow: Group;
  readonly lance: Group;
  readonly string: Line;
  readonly arrow = new Group();
  downed = false;
  weapon: Weapon = 'stormbow';
  speed = 1;
  private actions = new Map<string, AnimationAction>();
  private base?: AnimationAction;
  private upper?: AnimationAction;
  private review?: AnimationAction;
  private full?: AnimationAction;
  private synced?: { action: AnimationAction; time: number };
  private back;
  private stowedBow: Group;
  private stowedLance: Group;
  private restingString: Line;
  private backRest = new Quaternion();
  private backRotation = new Quaternion();
  private rootRotation = new Quaternion();
  private p = new Vector3();
  private q = new Vector3();
  private tip = new Vector3();
  private points = new Float32Array(9);
  private leftHand;
  private rightHand;

  constructor(
    readonly assets: Assets,
    readonly carriedWeapons: Weapon[] = ['stormbow', 'sunlance'],
  ) {
    this.model = clone(assets.get('paladin').scene) as Group;
    this.root.add(this.model);
    this.mixer = new AnimationMixer(this.model);
    for (const clip of assets.get('paladin').animations) {
      this.actions.set(clip.name, this.mixer.clipAction(clip));
      for (const part of ['lower', 'upper'] as const) {
        const tracks = clip.tracks.filter((track) => lower.test(track.name) === (part === 'lower'));
        if (tracks.length)
          this.actions.set(
            `${clip.name}:${part}`,
            this.mixer.clipAction(new AnimationClip(`${clip.name}:${part}`, clip.duration, tracks)),
          );
      }
    }
    this.leftHand = this.model.getObjectByName(
      PropertyBinding.sanitizeNodeName(assets.manifest.sockets.leftHand),
    )!;
    this.rightHand = this.model.getObjectByName(
      PropertyBinding.sanitizeNodeName(assets.manifest.sockets.rightHand),
    )!;
    this.back = this.model.getObjectByName(
      PropertyBinding.sanitizeNodeName(
        assets.manifest.sockets.back || assets.manifest.sockets.chest,
      ),
    )!;
    this.back.getWorldQuaternion(this.backRest).invert();
    this.bow = assets.get('stormbow').scene.clone(true);
    this.lance = assets.get('sunlance').scene.clone(true);
    this.root.add(this.bow, this.lance);
    this.stowedBow = this.bow.clone(true);
    this.stowedLance = this.lance.clone(true);
    this.root.add(this.stowedBow, this.stowedLance);
    this.restingString = new Line(
      new BufferGeometry().setFromPoints([
        new Vector3(0, -0.66, -0.13),
        new Vector3(0, 0.66, -0.13),
      ]),
      new LineBasicMaterial({ color: 0x8fbdc5 }),
    );
    this.stowedBow.add(this.restingString);
    this.string = new Line(
      new BufferGeometry().setFromPoints([new Vector3(), new Vector3(), new Vector3()]),
      new LineBasicMaterial({ color: 0xade9f3 }),
    );
    this.root.add(this.string);
    const shaft = new Mesh(
      new CylinderGeometry(0.006, 0.006, 0.8, 8),
      new MeshStandardMaterial({ color: 0x704825, roughness: 0.6 }),
    );
    shaft.rotation.x = Math.PI / 2;
    shaft.position.z = 0.4;
    const head = new Mesh(
      new ConeGeometry(0.021, 0.09, 4),
      new MeshStandardMaterial({ color: 0xcbd7d7, metalness: 0.8, roughness: 0.25 }),
    );
    head.rotation.x = Math.PI / 2;
    head.position.z = 0.845;
    this.arrow.add(shaft, head);
    this.root.add(this.arrow);
    this.helper = new SkeletonHelper(this.model);
    this.helper.visible = false;
    this.root.add(this.helper);
    this.animate(false, 0);
    this.update(0);
  }
  private activate(name: string, old: AnimationAction | undefined, once = false) {
    const action = this.actions.get(name);
    if (!action || action === old) return old;
    action.reset().setLoop(once ? LoopOnce : LoopRepeat, once ? 1 : Infinity);
    action.clampWhenFinished = once;
    action.enabled = true;
    action.setEffectiveWeight(1).play();
    if (old) action.crossFadeFrom(old, 0.13, false);
    return action;
  }
  animate(
    moving: boolean,
    strafe: number,
    action = '',
    forward = 1,
    dodging = false,
    actionTime?: number,
    dodgeDirection = 'dodge_forward',
  ) {
    if (this.review) return;
    this.synced = undefined;
    if (action === 'recover' || action === 'interact') {
      this.base?.stop();
      this.upper?.stop();
      this.base = this.upper = undefined;
      this.full = this.activate(action, this.full, true);
      if (this.full && actionTime !== undefined)
        this.synced = { action: this.full, time: actionTime };
      return;
    }
    if (this.full) {
      this.full.stop();
      this.full = undefined;
    }
    const gait = dodging
      ? dodgeDirection
      : moving
        ? Math.abs(strafe) > 0.6
          ? strafe > 0
            ? 'strafe_right'
            : 'strafe_left'
          : forward < -0.3
            ? 'backpedal'
            : 'run'
        : 'bow_idle';
    this.base = this.activate(`${gait}:lower`, this.base);
    this.base?.setEffectiveTimeScale(dodging ? 0.5 / 0.27 : gait === 'run' ? 1.3 : 1);
    const name = action || (this.weapon === 'stormbow' ? 'bow_idle' : 'lance_idle');
    this.upper = this.activate(
      `${name}:upper`,
      this.upper,
      !['bow_idle', 'bow_hold', 'lance_idle'].includes(name),
    );
    if (this.upper && actionTime !== undefined && action)
      this.synced = { action: this.upper, time: actionTime };
  }
  setDowned(value: boolean) {
    if (this.downed === value) return;
    this.downed = value;
    if (value) {
      this.inspect('downed');
      this.review!.setLoop(LoopOnce, 1);
      this.review!.clampWhenFinished = true;
    } else this.endInspection();
  }
  inspect(name: string) {
    this.mixer.stopAllAction();
    this.base = undefined;
    this.upper = undefined;
    this.review = undefined;
    this.full = undefined;
    this.synced = undefined;
    this.review = this.activate(name, undefined, false);
    if (name.startsWith('lance')) this.weapon = 'sunlance';
    else if (name.startsWith('bow')) this.weapon = 'stormbow';
  }
  endInspection() {
    this.mixer.stopAllAction();
    this.review = undefined;
    this.full = undefined;
    this.synced = undefined;
    this.base = undefined;
    this.upper = undefined;
    this.animate(false, 0);
  }
  update(dt: number) {
    this.mixer.update(dt * this.speed);
    if (this.synced) {
      this.synced.action.time = Math.min(this.synced.time, this.synced.action.getClip().duration);
      this.mixer.update(0);
    }
    this.root.updateMatrixWorld(true);
    this.leftHand.getWorldPosition(this.p);
    this.root.worldToLocal(this.p);
    this.rightHand.getWorldPosition(this.q);
    this.root.worldToLocal(this.q);
    this.p.y -= 0.014;
    this.p.z += 0.1;
    this.q.y -= 0.014;
    this.q.z += 0.1;
    this.bow.position.copy(this.p);
    this.lance.position.copy(this.q);
    this.lance.position.y += 0.035;
    const action = this.review || this.full || this.upper;
    const name = action?.getClip().name || '';
    const assisting = name.startsWith('interact') || name.startsWith('recover');
    this.bow.visible = this.string.visible =
      this.weapon === 'stormbow' && !this.downed && !assisting;
    this.lance.visible = this.weapon === 'sunlance' && !this.downed && !assisting;
    this.back.getWorldPosition(this.tip);
    this.root.worldToLocal(this.tip);
    this.back.getWorldQuaternion(this.backRotation);
    this.root.getWorldQuaternion(this.rootRotation).invert();
    this.backRotation.premultiply(this.rootRotation).multiply(this.backRest);
    this.stowedBow.position
      .set(-0.1, -0.16, -0.23)
      .applyQuaternion(this.backRotation)
      .add(this.tip);
    this.stowedBow.quaternion.copy(this.backRotation);
    this.stowedBow.rotateZ(0.4);
    this.stowedLance.position
      .set(0.17, -0.5, -0.22)
      .applyQuaternion(this.backRotation)
      .add(this.tip);
    this.stowedLance.quaternion.copy(this.backRotation);
    this.stowedLance.rotateX(-Math.PI / 2);
    this.stowedBow.visible =
      this.carriedWeapons.includes('stormbow') &&
      (this.weapon !== 'stormbow' || assisting || this.downed);
    this.stowedLance.visible =
      this.carriedWeapons.includes('sunlance') &&
      (this.weapon !== 'sunlance' || assisting || this.downed);
    this.arrow.position.copy(this.q);
    const shot = name.startsWith('bow_fire') || name.startsWith('bow_release');
    const released =
      shot &&
      action!.time / action!.getClip().duration >= (name.startsWith('bow_fire') ? 0.66 : 0.06);
    this.arrow.visible =
      this.bow.visible &&
      !released &&
      !name.startsWith('weapon_') &&
      !name.startsWith('bow_cancel');
    this.points.set([
      this.p.x,
      this.p.y + 0.66,
      this.p.z - 0.13,
      this.q.x,
      this.q.y,
      this.q.z,
      this.p.x,
      this.p.y - 0.66,
      this.p.z - 0.13,
    ]);
    const attribute = this.string.geometry.getAttribute('position');
    (attribute.array as Float32Array).set(this.points);
    attribute.needsUpdate = true;
    this.string.geometry.computeBoundingSphere();
  }
  muzzle(target = new Vector3()) {
    this.tip.copy(this.weapon === 'stormbow' ? this.bow.position : this.lance.position);
    this.tip.z += this.weapon === 'stormbow' ? 0.15 : 0.94;
    return target.copy(this.root.localToWorld(this.tip));
  }
  poseSnapshot() {
    const names = ['DEF-handL', 'DEF-handR', 'DEF-footL', 'DEF-footR'];
    return {
      time: this.mixer.time,
      speed: this.speed,
      held: this.bow.visible ? 'stormbow' : this.lance.visible ? 'sunlance' : null,
      stowed: [
        this.stowedBow.visible ? 'stormbow' : null,
        this.stowedLance.visible ? 'sunlance' : null,
      ].filter(Boolean),
      action: (this.review || this.full || this.upper)?.getClip().name,
      bones: names.map((name) =>
        this.model.getObjectByName(name)?.getWorldPosition(new Vector3()).toArray(),
      ),
    };
  }
  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.model);
    const skeletons = new Set<SkinnedMesh['skeleton']>();
    this.model.traverse((o) => {
      if (o instanceof SkinnedMesh) skeletons.add(o.skeleton);
    });
    skeletons.forEach((s) => s.dispose());
    this.string.geometry.dispose();
    (this.string.material as LineBasicMaterial).dispose();
    this.restingString.geometry.dispose();
    (this.restingString.material as LineBasicMaterial).dispose();
    this.helper.dispose();
    this.root.removeFromParent();
    this.arrow.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose();
        (o.material as MeshStandardMaterial).dispose();
      }
    });
  }
}
