import { BackSide, Color, Group, Mesh, ShaderMaterial, SphereGeometry, type Scene } from 'three';

/** A distant sky dome supplies atmosphere without obscuring the combat ground. */
export class Environment {
  private geometry = new SphereGeometry(120, 32, 16);
  private material = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      time: { value: 0 },
      horizon: { value: new Color('#96b8ba') },
      zenith: { value: new Color('#355979') },
    },
    vertexShader: `varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec3 direction; uniform float time; uniform vec3 horizon; uniform vec3 zenith;
    float noise(vec2 p){return sin(p.x+sin(p.y*1.7))*.5+sin(p.y*.8+p.x*.35)*.3;}
    void main(){vec3 d=normalize(direction);float height=max(0.,d.y);vec3 c=mix(horizon,zenith,smoothstep(0.,.75,height));
    vec2 p=d.xz/max(.08,d.y+.35)*4.+vec2(time*.007,0.);float cloud=smoothstep(.26,.70,noise(p)+noise(p*2.8)*.2)*smoothstep(-.1,.25,d.y)*(1.-smoothstep(.65,.95,d.y));
    c=mix(c,vec3(.84,.88,.85),cloud*.56);vec3 sun=normalize(vec3(-.55,.55,.3));float glow=pow(max(dot(d,sun),0.),42.);c+=vec3(.25,.16,.05)*glow;gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
  });
  readonly root = new Group();
  constructor(scene: Scene) {
    const dome = new Mesh(this.geometry, this.material);
    dome.renderOrder = -10;
    this.root.add(dome);
    scene.add(this.root);
  }
  update(dt: number) {
    this.material.uniforms.time.value += dt;
  }
  dispose() {
    this.root.removeFromParent();
    this.geometry.dispose();
    this.material.dispose();
  }
}
