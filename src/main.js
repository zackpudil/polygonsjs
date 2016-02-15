import { radians } from './util';
import { Model } from './model';
import AnimationController from './animation-controller';
import Animator from './animator';
import Camera from './camera';
import { mat4 } from 'gl-matrix';
import Shader from './shader';

var shell = require('gl-now')();
var subjectShader, subject, animator, animationController, camera;

var glslify = require('glslify');

shell.on('gl-init', () => {
  console.log('init started');
  var gl = shell.gl;

  gl.viewport(0, 0, shell.width, shell.height);
  gl.enable(gl.DEPTH_TEST);

  let characterVertSrc = glslify('../shaders/character.glsl');
  let fragSrc = glslify('../shaders/material.glsl');

  subjectShader = new Shader(gl)
    .attach(characterVertSrc, 'vert')
    .attach(fragSrc, 'frag')
    .link();

  subject = new Model(gl, require('../models/container_guy.json'), 0.005);
  animationController = new AnimationController(subject);
  animator = new Animator(animationController);

  camera = new Camera([0, 2.5, 7], [0, 0, 0]);

  console.log('init finished');
});

shell.on('gl-render', function (t) {
  camera.handleInput(t);
  var gl = shell.gl;

  let projection = mat4.perspective(mat4.create(), radians(45.0), shell.width/shell.height, 0.1, 1000.0);
  let view = camera.getViewMatrix();

  gl.clearColor(0.25, 0.25, 0.25, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  subjectShader.use()
    .bind("projection", { type: 'mat4', val: projection })
    .bind("view", { type: 'mat4', val: view });

  animator
    .play(0)
    .play(1, 0, [10])
    .loop(1, 10, 56, { from: 23, to: 43 }, true)
    .run(subjectShader, t/30);

  subject.draw(subjectShader);
});

shell.on('gl-error', (e) => {
  worked = false;
  throw e;
})
