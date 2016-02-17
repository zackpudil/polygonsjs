import {mat4, vec3} from 'gl-matrix';
import {radians} from './util';
import mouseWheel from 'mouse-wheel';
import vkey from 'vkey';
import touches from 'touches';
import {mobilecheck} from './util';

export default class Camera {
  constructor(p, d, s = 0.5, sens = 0.5) {
    this.position = p;
    this.direction = d;
    this.speed = s;
    this.sensitivity = sens

    this._yaw = 0.0;
    this._pitch = 0.0;

    this.moveForward = false;

    if(window.DeviceMotionEvent && mobilecheck()) {
      window.addEventListener('devicemotion', event => {
        this._yaw += event.rotationRate.alpha;
        this._pitch += event.rotationRate.beta;
      });
    } else {
      mouseWheel((dx, dy) => {
        this._yaw -= dx;
        this._pitch += dy;
      }, true);
    }
  }

  getViewMatrix() {
    return mat4.lookAt(mat4.create(),
      this.position,
      vec3.add(vec3.create(), this.position, this.direction),
      [0, 1, 0]);
  }

  handleInput() {
    this._handleMouse();
  }

  _handleMouse() {
    let y = radians(this._yaw);
    let p = radians(this._pitch);

    this.direction = [
      Math.cos(y)*Math.cos(p),
      Math.sin(p),
      Math.sin(y)*Math.cos(p)
    ];
    this.direction = vec3.normalize([], this.direction);
  }
}
