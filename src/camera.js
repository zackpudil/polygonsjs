import {mat4, vec3} from 'gl-matrix';
import {radians} from './util';
import mouseWheel from 'mouse-wheel';
import vkey from 'vkey';
import touches from 'touches';
import {mobilecheck} from './util';

export default class Camera {
  constructor(p, d, s = 0.5, sens = 0.1) {
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
        this._pitch -= event.rotationRate.beta;
      });

      touches()
        .on('start', () => this.moveForward = true)
        .on('end', () => this.moveForward = false);

    } else {
      mouseWheel((dx, dy) => {
        this._yaw -= dx*this.sensitivity;
        this._pitch += dy*this.sensitivity;
      }, true);

      document.body.addEventListener('keydown', ev => {
        if(vkey[ev.keyCode] == "W") this.moveForward = true;
      });

      document.body.addEventListener('keyup', ev => {
        if(vkey[ev.keyCode] == "W") this.moveForward = false;
      });
    }
  }

  getViewMatrix() {
    return mat4.lookAt(mat4.create(),
      this.position,
      vec3.add(vec3.create(), this.position, this.direction),
      [0, 1, 0]);
  }

  handleInput(t) {
    this._handleKeyboard(t);
    this._handleMouse();
  }

  _handleKeyboard(t) {
    let frameSpeed = this.speed*t;
    let right = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.direction, [0, 1, 0]));
    let up = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), right, this.direction));

    let d = vec3.scale(vec3.create(), this.direction, frameSpeed);
    let r = vec3.scale(vec3.create(), right, frameSpeed);
    let u = vec3.scale(vec3.create(), up, frameSpeed);

    if(this.moveForward) vec3.add(this.position, this.position, d);
    // if(pressed('S')) vec3.subtract(this.position, this.position, d);
    // if(pressed('A')) vec3.subtract(this.position, this.position, r);
    // if(pressed('D')) vec3.add(this.position, this.position, r);
    // if(pressed('<space>')) vec3.add(this.position, this.position, u);
    // if(pressed('<shift>')) vec3.subtract(this.position, this.position, u);
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
