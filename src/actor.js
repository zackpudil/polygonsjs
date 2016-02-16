import {mat4} from 'gl-matrix';
import {radians} from './util';
import pressed from 'key-pressed';

export default class Actor {
	constructor(shader, animator, model, position, maxSpeed = 1.0, maxAngularSpeed = 2.0, scale = 1) {
		this.shader = shader;
		this.animator = animator;
		this.model = model;
		this.maxSpeed = maxSpeed;
		this.maxAngularSpeed = maxAngularSpeed;
		this.scale = scale;

		this.position = position;
		this.angle = 0;

		this.stopToGo = [() => {}];
		this.go = [() => {}];
		this.goToStop = [() => {}];
		this.stop = [() => {}];

		this.hasMoved = false;
	}

	handleInput() {

		if(pressed('<up>')) {
			this.emulateGo();
			this.hasMoved = true;
		} else {
			this.emulateStop();
		}

	}

	draw(projection, view, viewPos, lighting, t) {
		this.shader.use()
			.bind("projection", { type: 'mat4', val: projection })
			.bind("view", { type: 'mat4', val: view })
			.bind("model", { type: 'mat4', val: this.getModelMatrix() })
			.bind("viewPos", { type: 'vec3', val: viewPos });

		lighting.light(this.shader);
		if(t >= 0)
			this.animator.run(this.shader, t);
		else
			this.animator.get(this.shader);

		this.model.draw(this.shader);
	}

	emulateStop() {
		if(this.hasMoved) this.goToStop.forEach(f => f(this.animator));
		this.stop.forEach(f => f(this.animator));
	}

	emulateGo() {
		this.stopToGo.forEach(f => f(this.animator));
		this.go.forEach(f => f(this.animator));
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