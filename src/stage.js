import Lights from './lights';
import { vec3, mat4 } from 'gl-matrix';
import { radians } from './util';

export default class Stage {
	constructor(model, shader, scale = 1.0) {
		this.model = model;
		this.shader = shader;
		this.scale = scale;

		this.lights = new Lights();
		this.model.scene.lights.forEach(l => this.processLight(l));
	}

	draw(projection, view) {
		this.shader.use()
			.bind("projection", { type: 'mat4', val: projection })
			.bind("view", { type: 'mat4', val: view })
			.bind("model", { type: 'mat4', val: this.getModelMatrix() });

		this.lights.light(this.shader);

		this.model.draw(this.shader);
	}

	processLight(l) {
		let node = this.findNode([this.model.scene.rootNode], l.name);

		let diffuse = l.diffuse;
		let specular = l.specular;

		var position;

		position = vec3.fromValues(node.transform[12], node.transform[13], node.transform[14]);

		this.lights.addPointLight(position, l.attenuationQuadratic, l.ambient, l.diffuse, l.specular);
	}

	findNode(nodes, name) {
		var t = nodes.filter(n => n.name == name);
		if(t.length !== 0)
			return t[0];
		else {
			let children = nodes.map(n => n.children).reduce((a, b) => a.concat(b));
			return this.findNode(children, name);
		}
	}

	getModelMatrix() {
		let model = mat4.create();
		mat4.rotateX(model, model, radians(-90.0));
		mat4.scale(model, model, [this.scale, this.scale, this.scale]);

		return model;
	}
}