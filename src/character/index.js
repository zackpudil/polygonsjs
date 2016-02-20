import Character from './character';
import AnimationController from './animation-controller';
import Animator from './animator';
import Actor from './actor';
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

		let characterVertSrc = glslify('../../shaders/character.glsl');
		let fragSrc = glslify('../../shaders/material.glsl');	

		__renderShader__ = new Shader(gl)
			.attach(characterVertSrc, 'vert')
			.attach(fragSrc, 'frag')
			.link();

		return __renderShader__;
	}

	static getShadowShader(gl) {
		if(__shadowShader__) return __shadowShader__;

		let charterShdwVertSrc = glslify('../../shaders/shadow/actor_shadow.glsl');
		let shadowSrc = glslify('../../shaders/shadow/shadow_frag.glsl');

		__shadowShader__ = new Shader(gl)
			.attach(charterShdwVertSrc, 'vert')
			.attach(shadowSrc, 'frag')
			.link();

		return __shadowShader__;
	}

	static getModelAndAnimationController(gl, scene) {
		let modelName = md5(JSON.stringify(model));
		if(__loadedModels__[modelName]) return __loadedModels__[modelName];

		let model = new Model(gl, scene);
		__loadedModels__[modelName] = { 
			model: model,
			animationController: new AnimationController(model)
		};

		return __loadedModels__[modelName];
	}
}

export function createCharacter(gl, scene, script, position, scale = 1) {
	let renderShader = AssetManager.getRenderShader(gl);
	let shadowShader = AssetManager.getShadowShader(gl);
	let { model, animationController } = AssetManager.getModelAndAnimationController(gl, scene);
	let actor = new Actor(renderShader, shadowShader, new Animator(animationController), model, position, scale);

	return new Character(script, actor);
};