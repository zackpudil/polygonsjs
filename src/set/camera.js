import {mat4, vec3} from 'gl-matrix';
import {radians, mobilecheck} from '../util';
import mouseWheel from 'mouse-wheel';
import vkey from 'vkey';
import touches from 'touches';

export default class Camera {
  constructor(p, d, s = 0.5, sens = 0.5) {
    this.position = p;
    this.direction = d;
    this.speed = s;
    this.sensitivity = sens

    this.yaw = 0.0;
    this.pitch = 0.0;
  }

  getViewMatrix() {
    return mat4.lookAt(mat4.create(),
      this.position,
      vec3.add(vec3.create(), this.position, this.direction),
      [0, 1, 0]);
  }

  update() {
    let y = radians(this.yaw);
    let p = radians(this.pitch);

    this.direction = [
      Math.cos(y)*Math.cos(p),
      Math.sin(p),
      Math.sin(y)*Math.cos(p)
    ];
    this.direction = vec3.normalize([], this.direction);
  }
}
