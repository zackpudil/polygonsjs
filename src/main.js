import { radians } from './util';
import Model from './model';
import AnimationController from './animation-controller';
import Animator from './animator';
import Actor from './actor';
import Stage from './stage';
import Camera from './camera';
import { mat4, vec3 } from 'gl-matrix';
import Shader from './shader';
import touch from 'touches';
import {mobilecheck, createShadowMap} from './util';

var shell = require('gl-now')();
var subject, stage, camera;
var shadow;

var glslify = require('glslify');
var isStereoScopic = false;

touch(document.getElementById("cardboard"))
  .on('end', (ev) => {
    if(mobilecheck()) {
      document.body.webkitRequestFullScreen();
      isStereoScopic = !isStereoScopic; 
   }
 });

document.getElementById("cardboard").style.display = mobilecheck() ? "block" : "none";

shell.on('gl-init', () => {
  console.log('init started');
  var gl = shell.gl;

  gl.enable(gl.DEPTH_TEST);

  shadow = createShadowMap(gl, 1024, 1024);

  let characterVertSrc = glslify('../shaders/character.glsl');
  let charterShdwVertSrc = glslify('../shaders/shadow/actor_shadow.glsl');

  let stageVertSrc = glslify('../shaders/stage.glsl');
  let stageShdwVertSrc = glslify("../shaders/shadow/stage_shadow.glsl");

  let fragSrc = glslify('../shaders/material.glsl');
  let shadowSrc = glslify('../shaders/shadow/shadow_frag.glsl');

  let stageShader = new Shader(gl)
    .attach(stageVertSrc, 'vert')
    .attach(fragSrc, 'frag')
    .link();

  let stageShadowShader = new Shader(gl)
    .attach(stageShdwVertSrc, 'vert')
    .attach(shadowSrc, 'frag')
    .link();

  let stageModel = new Model(gl, require('../models/small_stage.json'));
  stage = new Stage(stageModel, stageShadowShader, stageShader);

  let subjectShader = new Shader(gl)
    .attach(characterVertSrc, 'vert')
    .attach(fragSrc, 'frag')
    .link();

  let subjectShadowShader = new Shader(gl)
    .attach(charterShdwVertSrc, 'vert')
    .attach(shadowSrc, 'frag')
    .link();

  let subjectModel = new Model(gl, require('../models/container_guy.json'));
  let animationController = new AnimationController(subjectModel);
  let animator = new Animator(animationController);
  subject = new Actor(subjectShader, subjectShadowShader, animator, subjectModel, [0, 0, 0], 0.5, 2.0, 0.02);

  subject.stop.push((a) => a.loop(0));
  subject.stopToGo.push((a) => a.play(1, 0, [10], {}, true));
  subject.go.push((a) => a.loop(1, 10, 56, { from: 23, to: 43 }, true));

  subject.goToStop.push((a) => a.play(1, 0, [23, 56], {from: 10, to: 56}, false));
  subject.goToStop.push((a) => a.play(1, 0, [33, 65], {}, false));

  camera = new Camera([0, 6.5, 70], [0, 0, 0]);

  console.log('init finished');
});

shell.on('gl-render', function (t) {
  var gl = shell.gl;

  subject.handleInput();
  camera.handleInput();

  vec3.add(camera.position, subject.position, [-subject.direction[0]*40, 19, -subject.direction[2]*40]);

  let projection = mat4.perspective(mat4.create(), radians(45.0), shell.width/shell.height, 0.1, 1000.0);
  let view = camera.getViewMatrix();

  let lightProjection = mat4.ortho(mat4.create(), 0.0, 1000.0, 0.0, 1000.0, 1.0, 1000.0);
  let lightView = mat4.lookAt(mat4.create(), stage.lights.points[0].position, [0, 0, 0], [1, 1, 1]);
  let lightSpace = mat4.mul(mat4.create(), lightProjection, lightView);

  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.viewport(0, 0, 1024, 1024);
  gl.bindFramebuffer(gl.FRAMEBUFFER, shadow.buffer);

  stage.drawShadow(lightSpace);
  subject.drawShadow(lightSpace);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  gl.clearColor(0.25, 0.25, 0.25, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

  if(isStereoScopic) {
    gl.scissor(0, 0, shell.width/2, shell.height);
    gl.viewport(0, 0, shell.width/2, shell.height);
    render(gl, projection, view, t, [0, 0, 0]);

    gl.scissor(shell.width/2, 0, shell.width/2, shell.height);
    gl.viewport(shell.width/2, 0, shell.width/2, shell.height);
    render(gl, projection, view, -1, [0, 0, 0]);
  } else {
    gl.viewport(0, 0, shell.width, shell.height);
    render(gl, projection, view, t, [0, 0, 0]);
  }
});

shell.on('gl-error', (e) => {
  worked = false;
  throw e;
});

var render = function (gl, projection, view, t) {
  subject.draw(projection, view, camera.position, stage.lights, t/30);
  stage.draw(projection, view, camera.position);
}
