import Lights from './lights';
import { vec3, mat4 } from 'gl-matrix';
import { radians } from '../util';

export default class Stage {
	constructor(model, shader, shadowShader, scale = 1.0) {
		this.model = model;
		this.shader = shader;
		this.shadowShader = shadowShader;
		this.scale = scale;

		this.lights = new Lights();
		this.model.scene.lights.forEach(l => this.processLight(l));
	}

	draw(projection, view, lightSpace, viewPos, shadowUnit) {
		this.shader.use()
			.bind("projection", { type: 'mat4', val: projection })
			.bind("view", { type: 'mat4', val: view })
			.bind("model", { type: 'mat4', val: this.getModelMatrix() })
			.bind("lightSpace", { type: 'mat4', val: lightSpace })
			.bind("viewPos", { type: 'vec3', val: viewPos })
			.bind("shadow", { type: 'sampler2D', val: shadowUnit })
			.bind("highLightColor", { type: 'vec3', val: [0, 0, 0] })
			.bind("castShadow", { type: 'int', val: 1 });

		this.lights.light(this.shader);

		this.model.draw(this.shader);
	}

	drawShadow(lightSpace) {
		this.shadowShader.use()
			.bind('lightSpace', { type: 'mat4', val: lightSpace })
			.bind('model', { type: 'mat4', val: this.getModelMatrix() });

		this.model.draw(this.shadowShader);
	}

	processLight(l) {
		this.lights.addPointLight(l.position, l.attenuationQuadratic, l.ambient, l.diffuse, l.specular);
	}

	getModelMatrix() {
		let model = mat4.create();
		mat4.rotateX(model, model, radians(-90.0));
		mat4.scale(model, model, [this.scale, this.scale, this.scale]);

		return model;
	}
}