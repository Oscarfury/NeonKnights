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
  private p = new Vector3();
  private q = new Vector3();
  private tip = new Vector3();
  private points = new Float32Array(9);
  private leftHand;
  private rightHand;

  constructor(readonly assets: Assets) {
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
    this.bow = assets.get('stormbow').scene.clone(true);
    this.lance = assets.get('sunlance').scene.clone(true);
    this.root.add(this.bow, this.lance);
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
  animate(moving: boolean, strafe: number, action = '', forward = 1, dodging = false) {
    if (this.review) return;
    const gait = dodging
      ? 'dodge'
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
      ['bow_fire', 'bow_release', 'lance_fire', 'hit'].includes(name),
    );
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
    this.review = this.activate(name, undefined, false);
    if (name.startsWith('lance')) this.weapon = 'sunlance';
    else if (name.startsWith('bow')) this.weapon = 'stormbow';
  }
  endInspection() {
    this.mixer.stopAllAction();
    this.review = undefined;
    this.base = undefined;
    this.upper = undefined;
    this.animate(false, 0);
  }
  update(dt: number) {
    this.mixer.update(dt * this.speed);
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
    this.bow.visible = this.string.visible = this.weapon === 'stormbow' && !this.downed;
    this.lance.visible = this.weapon === 'sunlance' && !this.downed;
    this.arrow.position.copy(this.q);
    const action = this.review || this.upper;
    const name = action?.getClip().name || '';
    const shot = name.startsWith('bow_fire') || name.startsWith('bow_release');
    const released =
      shot &&
      action!.time / action!.getClip().duration >= (name.startsWith('bow_fire') ? 0.66 : 0.06);
    this.arrow.visible = this.bow.visible && !released;
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
      bones: names.map((name) =>
        this.model.getObjectByName(name)?.getWorldPosition(new Vector3()).toArray(),
      ),
    };
  }
  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.model);
    this.string.geometry.dispose();
    (this.string.material as LineBasicMaterial).dispose();
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
