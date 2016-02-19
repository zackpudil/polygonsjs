import Model from './render/model';
import AnimationController from './character/animation-controller';
import Animator from './character/animator';
import Actor from './character/actor';
import Stage from './set/stage';
import Camera from './set/camera';
import { mat4, vec3 } from 'gl-matrix';
import Shader from './render/shader';
import touch from 'touches';
import {mobilecheck, createShadowMap, radians} from './util';

var shell = require('gl-now')();
var subjects = [], stage, camera;
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
  gl.enable(gl.CULL_FACE);

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
  stage = new Stage(stageModel, stageShader, stageShadowShader);

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

  for(var i = 0; i < 3; i++) {
    let animator = new Animator(animationController);
    let subject = new Actor(subjectShader, subjectShadowShader, animator, subjectModel, [0, 0, i*20], 0.5, 2.0, 0.02);

    subject.stop.push((a) => a.loop(0));
    subject.stopToGo.push((a) => a.play(1, 0, [10], {}, true));
    subject.go.push((a) => a.loop(1, 10, 56, { from: 23, to: 43 }, true));

    subject.goToStop.push((a) => a.play(1, 0, [23, 56], {from: 10, to: 56}, false));
    subject.goToStop.push((a) => a.play(1, 0, [33, 65], {}, false));
    subjects.push(subject);
  }

  camera = new Camera([0, 6.5, 70], [0, 0, 0]);
  subjects[0].active = true;

  console.log('init finished');
});

shell.on('gl-render', function (t) {
  var gl = shell.gl;

  subjects.forEach((s, i) => i != 0 ? s.emulateStop() : s.handleInput());
  camera.handleInput();

  vec3.add(camera.position, subjects[0].position, [-15*subjects[0].direction[0], 18, -15*subjects[0].direction[2]]);

  let projection = mat4.perspective(mat4.create(), radians(45.0), shell.width/shell.height, 0.1, 1000.0);
  let view = camera.getViewMatrix();

  let lightPos = stage.lights.points[0].position;
  let lightDir = vec3.add([], lightPos, [0, -1, 0]);

  let lightProjection = mat4.perspective(mat4.create(), radians(90.0), 1.0, 0.1, 300.0);
  let lightView = mat4.lookAt(mat4.create(), lightPos, lightDir, [-1, 0, 0]);
  let lightSpace = mat4.mul(mat4.create(), lightProjection, lightView);

  gl.viewport(0, 0, 1024, 1024);
  gl.bindFramebuffer(gl.FRAMEBUFFER, shadow.buffer);
  gl.clear(gl.DEPTH_BUFFER_BIT);

  gl.cullFace(gl.FRONT);
  stage.drawShadow(lightSpace);
  subjects.forEach(s => s.drawShadow(lightSpace));
  gl.cullFace(gl.BACK);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  gl.clearColor(0.25, 0.25, 0.25, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

  let shadowUnit = shadow.map.texture.bind(shadow.map.unit);

  if(isStereoScopic) {
    gl.scissor(0, 0, shell.width/2, shell.height);
    gl.viewport(0, 0, shell.width/2, shell.height);
    render(gl, projection, view, lightSpace, shadowUnit, t);

    gl.scissor(shell.width/2, 0, shell.width/2, shell.height);
    gl.viewport(shell.width/2, 0, shell.width/2, shell.height);
    render(gl, projection, view, lightSpace, shadowUnit, -1);
  } else {
    gl.viewport(0, 0, shell.width, shell.height);
    render(gl, projection, view, lightSpace, shadowUnit, t);
  }
});

shell.on('gl-error', (e) => {
  worked = false;
  throw e;
});
var render = function (gl, projection, view, lightSpace, shadowUnit, t) {
  subjects.forEach(s => s.draw(projection, view, lightSpace, camera.position, shadowUnit, stage.lights, t/30));
  stage.draw(projection, view, lightSpace, camera.position, shadowUnit);
}
