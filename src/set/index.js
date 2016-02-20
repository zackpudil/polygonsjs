import Setting from './set';
import Stage from './stage';
import Camera from './camera';
import Model from '../render/model';
import Shader from '../render/shader';
import md5 from 'md5';

var __renderShader__ = null;
var __shadowShader__ = null;
var __loadedModels__ = {};

var glslify = require('glslify');

class AssetManager {
	static getRenderShader(gl) {
		if(__renderShader__) return __renderShader__;

		let vertSrc = glslify('../../shaders/stage.glsl');
		let fragSrc = glslify('../../shaders/material.glsl');	

		__renderShader__ = new Shader(gl)
			.attach(vertSrc, 'vert')
			.attach(fragSrc, 'frag')
			.link();

		return __renderShader__;
	}

	static getShadowShader(gl) {
		if(__shadowShader__) return __shadowShader__;

		let shdwVertSrc = glslify('../../shaders/shadow/stage_shadow.glsl');
		let shadowSrc = glslify('../../shaders/shadow/shadow_frag.glsl');

		__shadowShader__ = new Shader(gl)
			.attach(shdwVertSrc, 'vert')
			.attach(shadowSrc, 'frag')
			.link();

		return __shadowShader__;
	}

	static getModel(gl, scene) {
		let modelName = md5(JSON.stringify(model));
		if(__loadedModels__[modelName]) return __loadedModels__[modelName];

		let model = new Model(gl, scene);
		__loadedModels__[modelName] = model;

		return __loadedModels__[modelName];
	}
}

export function createSet(gl, scene, cameraPosition, scale = 1) {
	let renderShader = AssetManager.getRenderShader(gl);
	let shadowShader = AssetManager.getShadowShader(gl);
	let model = AssetManager.getModel(gl, scene);
	let stage = new Stage(model, renderShader, shadowShader, scale);
	let camera = new Camera(cameraPosition, [0, 0, 0]);

	return new Setting(gl, stage, camera);
};