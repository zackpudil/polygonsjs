import {mat4, vec3} from 'gl-matrix';
import {radians, mobilecheck} from '../util';
import touch from 'touches';
import vkey from 'vkey';
import mouseWheel from 'mouse-wheel';

export default class Actor {
	constructor(shader, shadowShader, animator, model, position, maxSpeed = 1.0, maxAngularSpeed = 2.0, scale = 1) {
		this.shader = shader;
		this.shadowShader = shadowShader;
		this.animator = animator;
		this.model = model;
		this.maxSpeed = maxSpeed;
		this.maxAngularSpeed = maxAngularSpeed;
		this.scale = scale;

		this.position = position;
		this.speed = 0;
		this.angle = 0;

		this.stopToGo = [];
		this.go = [];
		this.goToStop = [];
		this.stop = [];

		this.hasMoved = false;
		this.isMoving = false;
		this.active = false;

		if(window.DeviceMotionEvent && mobilecheck()) {

      window.addEventListener('devicemotion', event => {
      	if(this.active) this.angle -= event.rotationRate.alpha;
      });

			touch()
				.on('start', () => this.isMoving = true)
				.on('end', () => this.isMoving = false);

    } else {
    	 document.body.addEventListener('keydown', ev => {
        if(vkey[ev.keyCode] == "W") this.isMoving = true;
      });

      document.body.addEventListener('keyup', ev => {
        if(vkey[ev.keyCode] == "W") this.isMoving = false;
      });

      mouseWheel((dx, dy) => {
        if(this.active) this.angle += dx;
      }, true);
    }
	}

	handleInput() {
		let a = radians(this.angle);

    this.direction = [
      Math.cos(a), 0, -Math.sin(a)
    ];

    this.direction = vec3.normalize(vec3.create(), this.direction);
		if(this.isMoving) {
			this.hasMoved = true;
			this.emulateGo();
		} else {
			this.emulateStop();
		}
	}

	draw(projection, view, lightSpace, viewPos, shadowUnit, lighting, t) {
		this.shader.use()
			.bind("projection", { type: 'mat4', val: projection })
			.bind("view", { type: 'mat4', val: view })
			.bind("model", { type: 'mat4', val: this.getModelMatrix() })
			.bind("lightSpace", { type: 'mat4', val: lightSpace })
			.bind("viewPos", { type: 'vec3', val: viewPos })
			.bind("shadow", { type: 'sampler2D', val: shadowUnit })
			.bind("castShadow", { type: 'int', val: 0 });

		lighting.light(this.shader);
		if(t >= 0)
			this.animator.run(this.shader, t);
		else
			this.animator.get(this.shader);

		this.model.draw(this.shader);
	}

	drawShadow(lightSpace) {
		this.shadowShader.use()
			.bind('lightSpace', { type: 'mat4', val: lightSpace })
			.bind('model', { type: 'mat4', val: this.getModelMatrix() });

		this.animator.get(this.shadowShader);
		this.model.draw(this.shadowShader);
	}

	emulateStop() {
		if(this.hasMoved) {
			this.goToStop.forEach(f => f(this.animator).doWhile(() => {
				vec3.add(this.position, this.position, vec3.scale([], this.direction, this.speed));
				this.speed -= 0.005;
				this.speed = Math.max(this.speed, 0);
			}));
		};
		this.stop.forEach(f => f(this.animator).doWhile(() => this.speed = 0));
	}

	emulateGo() {
		this.stopToGo.forEach(f => f(this.animator).doWhile(() => {
			this.speed += 0.05;
			this.speed = Math.min(this.speed, this.maxSpeed);

			vec3.add(this.position, this.position, vec3.scale([], this.direction, this.speed));
		}));

		this.go.forEach(f => f(this.animator).doWhile(() => {
			this.speed = this.maxSpeed;
			vec3.add(this.position, this.position, vec3.scale([], this.direction, this.speed));
		}));
	}

	getModelMatrix(scaleAddon = 0) {
		let model = mat4.create();
		mat4.translate(model, model, this.position);
		mat4.rotateY(model, model, radians(this.angle));

		let scale = this.scale + scaleAddon;
		mat4.scale(model, model, [scale, scale, scale]);

		return model;
	}
}