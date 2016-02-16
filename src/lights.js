
let LightType = {
	direction: "direction",
	point: "point",
	spot: "spot"
};

export default class Lights {
	constructor() {
		this.directionals = [];
		this.points = [];
		this.spots = [];
	}

	light(shader) {
		this.directionals.forEach((d, i) => {
			let start = `directionals[${i}].`;
			shader.bind(start + "direction", { type: 'vec3', val: d.direction });
			this.bindCommonUniforms(shader, d, start);
		});
		shader.bind("directionalLightAmount", { type: 'int', val: this.directionals.length });

		this.points.forEach((p, i) => {
			let start = `points[${i}].`;
			shader
				.bind(start + "position", { type: 'vec3', val: p.position })
				.bind(start + "quadratic", { type: 'float', val: p.attenuation })
				.bind(start + "linear", { type: 'float', val: 0 });

			this.bindCommonUniforms(shader, p, start);
		});
		shader.bind("pointLightAmount", { type: 'int', val: this.points.length });

		this.spots.forEach((s, i) => {
			let start = `spots[${i}].`;
			shader
				.bind(start + "position", { type: 'vec3', val: s.position })
				.bind(start + "direction", { type: 'vec3', val: s.direction })
				.bind(start + "quadratic", { type: 'float', val: s.attenuation })
				.bind(start + "linear", { type: 'float', val: s.linear })
				.bind(start + "cutOff", { type: 'float', val: s.innerCutOff })
				.bind(start + "outerCufOff", { type: 'float', val: s.outerCufOff });

			this.bindCommonUniforms(shader, s, start);
		});
		shader.bind("spotLightAmount", { type: 'int', val: this.spots.length });
	}

	bindCommonUniforms(shader, light, start) {
		shader
			.bind(start + 'ambient', { type: 'vec3', val: light.ambient })
			.bind(start + 'diffuse', { type: 'vec3', val: light.diffuse })
			.bind(start + 'specular', { type: 'vec3', val: light.specular });
	}

	addDirectionalLight(dir, a, d, s) {
		this.directionals.push({
			type: LightType.direction, 
			ambient: a, 
			diffuse: d, 
			specular: s
		});

		return this;
	}

	addPointLight(pos, q, a, d, s) {
		this.points.push({
			type: LightType.point, 
			position: pos, 
			attenuation: q, 
			ambient: a, 
			diffuse: d, 
			specular: s
		});

		return this;
	}

	addSpotLight(pos, dir, q, i, o, a, d, s) {
		this.spots.push({
			type: LightType.spot, 
			position: pos, 
			direction: dir, 
			attenuation: q, 
			innerCutOff: i,
			outerCufOff: o, 
			ambient: a, 
			diffuse: d, 
			specular: s
		});

		return this;
	}
}