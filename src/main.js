import { radians } from './util';
import Model from './model';
import AnimationController from './animation-controller';
import Animator from './animator';
import Actor from './actor';
import Stage from './stage';
import Camera from './camera';
import { mat4 } from 'gl-matrix';
import Shader from './shader';

var shell = require('gl-now')();
var subject, stage, camera;

var glslify = require('glslify');

shell.on('gl-init', () => {
  console.log('init started');
  var gl = shell.gl;

  gl.viewport(0, 0, shell.width, shell.height);
  gl.enable(gl.DEPTH_TEST);

  let characterVertSrc = glslify('../shaders/character.glsl');
  let stageVertSrc = glslify('../shaders/stage.glsl');
  let fragSrc = glslify('../shaders/material.glsl');

  let stageShader = new Shader(gl)
    .attach(stageVertSrc, 'vert')
    .attach(fragSrc, 'frag')
    .link();

  let stageModel = new Model(gl, require('../models/small_stage.json'));

  stage = new Stage(stageModel, stageShader);

  let subjectShader = new Shader(gl)
    .attach(characterVertSrc, 'vert')
    .attach(fragSrc, 'frag')
    .link();

  let subjectModel = new Model(gl, require('../models/container_guy.json'));
  let animationController = new AnimationController(subjectModel);
  let animator = new Animator(animationController);

  subject = new Actor(subjectShader, animator, subjectModel, [0, 0, 0], 1.0, 2.0, 0.02);

  subject.stop.push((a) => a.loop(0));
  subject.stopToGo.push((a) => a.play(1, 0, [10], {}, true));
  subject.go.push((a) => a.loop(1, 10, 56, { from: 23, to: 43 }, true));

  subject.goToStop.push((a) => a.play(1, 0, [23, 56], {from: 10, to: 56}, false));
  subject.goToStop.push((a) => a.play(1, 0, [33, 65], {}, false));

  camera = new Camera([0, 2.5, 7], [0, 0, 0]);

  console.log('init finished');
});

shell.on('gl-render', function (t) {
  var gl = shell.gl;

  camera.handleInput(t);
  subject.handleInput();

  let projection = mat4.perspective(mat4.create(), radians(45.0), shell.width/shell.height, 0.1, 1000.0);
  let view = camera.getViewMatrix();

  gl.clearColor(0.25, 0.25, 0.25, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  subject.draw(projection, view, stage.lights, t/30);
  stage.draw(projection, view);
});

shell.on('gl-error', (e) => {
  worked = false;
  throw e;
})
