import { createShadowMap, radians } from '../util';
import { mat4, vec3 } from 'gl-matrix';

export default class Setting {
	constructor(gl, stage, camera) {
		this.gl = gl;
		this.stage = stage;
		this.camera = camera;
		this.shadowData = createShadowMap(gl, 1024, 1024);
	}

	renderShadow(characters, lightSpace) {
		let gl = this.gl;
		gl.viewport(0, 0, 1024, 1024);
	  gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowData.buffer);
	  gl.clear(gl.DEPTH_BUFFER_BIT);

	  gl.cullFace(gl.FRONT);
	  characters.forEach(c => c.actor.drawShadow(lightSpace));
	  this.stage.drawShadow(lightSpace);
	  gl.cullFace(gl.BACK);

  	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	render(characters, width, height, t) {
		let gl = this.gl;

		let projection = mat4.perspective(mat4.create(), radians(45.0), width/height, 0.1, 1000.0);
	  let view = this.camera.getViewMatrix();

	  let lightPos = this.stage.lights.points[0].position;
	  let lightDir = vec3.add([], lightPos, [0, -1, 0]);

	  let lightProjection = mat4.perspective(mat4.create(), radians(90.0), 1.0, 0.1, 300.0);
	  let lightView = mat4.lookAt(mat4.create(), lightPos, lightDir, [-1, 0, 0]);
	  let lightSpace = mat4.mul(mat4.create(), lightProjection, lightView);

	  this.renderShadow(characters, lightSpace);
	  let shadowUnit = this.shadowData.map.texture.bind(this.shadowData.map.unit);

	  gl.clearColor(0.25, 0.25, 0.25, 1);
  	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
  	gl.viewport(0, 0, width, height);

	  characters.forEach(s => s.actor.draw(projection, view, lightSpace, this.camera.position, shadowUnit, this.stage.lights, t));
  	this.stage.draw(projection, view, lightSpace, this.camera.position, shadowUnit);
	}

	renderVR(characters, width, height, t) {
		let gl = this.gl;
		
		let projection = mat4.perspective(mat4.create(), radians(45.0), width/height, 0.1, 1000.0);
	  let view = this.camera.getViewMatrix();

	  let lightPos = this.stage.lights.points[0].position;
	  let lightDir = vec3.add([], lightPos, [0, -1, 0]);

	  let lightProjection = mat4.perspective(mat4.create(), radians(90.0), 1.0, 0.1, 300.0);
	  let lightView = mat4.lookAt(mat4.create(), lightPos, lightDir, [-1, 0, 0]);
	  let lightSpace = mat4.mul(mat4.create(), lightProjection, lightView);

	  this.renderShadow(characters, lightSpace);
	  let shadowUnit = this.shadowData.map.texture.bind(this.shadowData.map.unit);

	  gl.clearColor(0.25, 0.25, 0.25, 1);
  	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

 		gl.scissor(0, 0, width/2, height);
    gl.viewport(0, 0, width/2, height);
	  characters.forEach(s => s.actor.draw(projection, view, lightSpace, this.camera.position, shadowUnit, this.stage.lights, t));
  	this.stage.draw(projection, view, lightSpace, this.camera.position, shadowUnit);

  	gl.scissor(width/2, 0, width/2, height);
    gl.viewport(width/2, 0, width/2, height);
    characters.forEach(s => s.actor.draw(projection, view, lightSpace, this.camera.position, shadowUnit, this.stage.lights, -1));
  	this.stage.draw(projection, view, lightSpace, this.camera.position, shadowUnit);
	}
}