import {mat4, vec3} from 'gl-matrix';
import {radians, mobilecheck} from '../util';
import touch from 'touches';
import vkey from 'vkey';
import mouseWheel from 'mouse-wheel';

export default class Actor {
	constructor(shader, shadowShader, animator, model, position, scale = 1) {
		this.shader = shader;
		this.shadowShader = shadowShader;
		this.animator = animator;
		this.model = model;
		this.scale = scale;

		this.position = position;
		this.speed = 0;
		this.angle = 0;
	}

	update() {
		let a = radians(this.angle);
    this.direction = [Math.cos(a), 0, -Math.sin(a)];
    this.direction = vec3.normalize(vec3.create(), this.direction);
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

	getModelMatrix(scaleAddon = 0) {
		let model = mat4.create();
		mat4.translate(model, model, this.position);
		mat4.rotateY(model, model, radians(this.angle));

		let scale = this.scale + scaleAddon;
		mat4.scale(model, model, [scale, scale, scale]);

		return model;
	}
}