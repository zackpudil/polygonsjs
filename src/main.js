import { Model } from './model';
import AnimationController from './animation-controller';
import Camera from './camera';
import { mat4 } from 'gl-matrix';
import Shader from './shader';

var shell = require('gl-now')();
var subjectShader, subject, animationController, camera;
var time = 0;

var glslify = require('glslify');

Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};

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

  camera = new Camera([0, 2.5, 7], [0, 0, 0]);

  console.log('init finished');
});

shell.on('gl-render', function (t) {
  camera.handleInput(t);
  var gl = shell.gl;
  time += t;

  let projection = mat4.perspective(mat4.create(), Math.radians(45.0), shell.width/shell.height, 0.1, 1000.0);
  let view = camera.getViewMatrix();
  let boneTransforms = animationController.boneTransforms(time, 1);

  gl.clearColor(0.25, 0.25, 0.25, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  subjectShader.use()
    .bind("projection", { type: 'mat4', val: projection })
    .bind("view", { type: 'mat4', val: view });
  boneTransforms.forEach((b, i) => subjectShader.bind(`bones[${i}]`, { type: 'mat4', val: b }));

  subject.draw(subjectShader);
});

shell.on('gl-error', (e) => {
  worked = false;
  throw e;
})
