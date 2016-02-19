import Model from './render/model';
import AnimationController from './character/animation-controller';
import Animator from './character/animator';
import Actor from './character/actor';
import Character from './character/character';
import Stage from './set/stage';
import Camera from './set/camera';
import { mat4, vec3 } from 'gl-matrix';
import Shader from './render/shader';
import {mobilecheck, createShadowMap, radians} from './util';
import touch from 'touches';
import vkey from 'vkey';
import mouseWheel from 'mouse-wheel';


var shell = require('gl-now')();
var subjects = [], stage, camera;
var shadow;

var glslify = require('glslify');
var isStereoscopic = false;
var isFowardKeyDown = false, hasMoved = false, updateActive = false, activeSubject = 0;

touch(document.getElementById("cardboard"))
  .on('end', (ev) => {
    if(mobilecheck()) {
      document.body.webkitRequestFullScreen();
      isStereoscopic = !isStereoscopic; 
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

  let script = require('../models/container_guy.script.json');

  for(var i = 0; i < 3; i++) {
    let animator = new Animator(animationController);
    let subjectActor = new Actor(subjectShader, subjectShadowShader, animator, subjectModel, [0, 0, i*20], 0.02);
    let subject = new Character(script, subjectActor);

    subjects.push(subject);
  }

  camera = new Camera([-10, 18, 5], [0, 0, 0]);


  if(window.DeviceMotionEvent && mobilecheck()) {

    window.addEventListener('devicemotion', event => {
      camera.yaw += event.rotationRate.alpha;
      camera.pitch += event.rotationRate.beta;
      subjects[activeSubject].actor.angle -= event.rotationRate.alpha;
    });

    touch()
      .on("start", () => isFowardKeyDown = true)
      .on("end", () => isFowardKeyDown = false);
  } else {
    mouseWheel((dx, dy) => {
      camera.yaw -= dx;
      camera.pitch += dy;
      subjects[activeSubject].actor.angle += dx;
    }, true);

    document.body.addEventListener("keydown", (e) => {
      if(vkey[e.keyCode] == "W") {
        hasMoved = true;
        isFowardKeyDown = true;
      }
    });

    document.body.addEventListener("keyup", (e) => {
      if(vkey[e.keyCode] == "W") isFowardKeyDown = false;
      if(vkey[e.keyCode] == "<enter>") updateActive = true;
    });
  }

  console.log('init finished');
});

shell.on('gl-render', function (t) {
  var gl = shell.gl;
  t = t/30;

  subjects.forEach(s => s.update());

  if(updateActive) {
    updateActive = false;
    hasMoved = false;
    activeSubject += 1;
    if(activeSubject == subjects.length) activeSubject = 0;
    camera.yaw = -subjects[activeSubject].actor.angle;
  }

  camera.update();

  let activeActor = subjects[activeSubject].actor;

  let cameraPosition = vec3.add([], activeActor.position, [-15*activeActor.direction[0], 18, -15*activeActor.direction[2]]);
  let subjectRight = vec3.cross([], activeActor.direction, [0, -1, 0]);
  vec3.add(camera.position, cameraPosition, vec3.scale([], subjectRight, 5));

  if(isFowardKeyDown) {
    subjects[activeSubject].startWalking();
    subjects[activeSubject].walk();
  } else {
    if(hasMoved) subjects[activeSubject].stopWalking();
    subjects[activeSubject].idle();
  }

  subjects.forEach((s, i) => {
    if(i !== activeSubject) s.idle();
  });

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
  subjects.forEach(s => s.actor.drawShadow(lightSpace));
  stage.drawShadow(lightSpace);
  gl.cullFace(gl.BACK);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  gl.clearColor(0.25, 0.25, 0.25, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

  let shadowUnit = shadow.map.texture.bind(shadow.map.unit);

  if(isStereoscopic) {
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
  subjects.forEach(s => s.actor.draw(projection, view, lightSpace, camera.position, shadowUnit, stage.lights, t));
  stage.draw(projection, view, lightSpace, camera.position, shadowUnit);
}
