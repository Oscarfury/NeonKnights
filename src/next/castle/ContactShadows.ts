import { InstancedMesh, PlaneGeometry, ShaderMaterial, Matrix4, Vector3, Quaternion } from 'three';
import type { Battle } from './Battle';

/** Moving actors get soft, single-draw contact shadows; the detailed scenery shadow is cached. */
export class ContactShadows {
  private geometry = new PlaneGeometry(2, 2);
  private material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv; void main(){float d=length(vUv-.5)*2.;gl_FragColor=vec4(.025,.045,.05,(1.-smoothstep(.25,1.,d))*.28);}`,
  });
  readonly root = new InstancedMesh(this.geometry, this.material, 24);
  private matrix = new Matrix4();
  private p = new Vector3();
  private scale = new Vector3();
  private rotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
  constructor() {
    this.root.frustumCulled = false;
    this.root.renderOrder = 1;
  }
  update(b: Battle) {
    let count = 0;
    for (const a of [b.king, ...b.knights, ...b.enemies]) {
      if (count === 24 || (a.hp <= 0 && a.deadTime > 1)) continue;
      const radius = a.role === 'dragon' ? 2 : 0.62;
      this.p.set(a.x, a.role === 'king' ? a.y + 0.03 : 0.035, a.z);
      this.scale.set(radius, radius, 1);
      this.matrix.compose(this.p, this.rotation, this.scale);
      this.root.setMatrixAt(count++, this.matrix);
    }
    this.root.count = count;
    this.root.instanceMatrix.needsUpdate = true;
  }
  dispose() {
    this.root.removeFromParent();
    this.root.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }
}
