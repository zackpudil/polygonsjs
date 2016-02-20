import { mat4, vec3 } from 'gl-matrix';
import touch from 'touches';
import vkey from 'vkey';
import mouseWheel from 'mouse-wheel';

import {mobilecheck, radians} from './util';
import { createCharacter } from './character';
import { createSet } from './set';

var shell = require('gl-now')();
var subjects = [], set;

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

  let stageModel = require('../models/small_stage.json');
  set = createSet(gl, stageModel, [-10, 18, 5]);

  let model = require('../models/container_guy.json');
  let script = require('../models/container_guy.script.json');
  for(var i = 0; i < 3; i++) 
    subjects.push(createCharacter(gl, model, script, [0, 0, i*15], 0.01));

  if(window.DeviceMotionEvent && mobilecheck()) {

    window.addEventListener('devicemotion', event => {
      set.camera.yaw += event.rotationRate.alpha;
      set.camera.pitch += event.rotationRate.beta;
      subjects[activeSubject].actor.angle -= event.rotationRate.alpha;
    });

    touch()
      .on("start", () => {
        isFowardKeyDown = true;
      })
      .on("end", () => {
        hasMoved = true;
        isFowardKeyDown = false;
        updateActive = true;
      });
  } else {
    mouseWheel((dx, dy) => {
      set.camera.yaw -= dx*0.5;
      set.camera.pitch += dy*0.5;
      subjects[activeSubject].actor.angle += dx*0.5;
    }, true);

    document.body.addEventListener("keydown", (e) => {
      if(vkey[e.keyCode] == "W") {
        hasMoved = true;
        isFowardKeyDown = true;
      }
    });

    document.body.addEventListener("keyup", (e) => {
      if(vkey[e.keyCode] == "W") isFowardKeyDown = false;
    });

    document.body.addEventListener("click", () => {
      updateActive = true;
    });
  }

  console.log('init finished');
});

shell.on('gl-render', function (t) {
  let gl = shell.gl;
  t /= 30;

  let subjectBeingLookAt = -1;

  subjects.forEach((s, i) => {
    s.update();
    if(i === activeSubject) return;
    if(!subjects[activeSubject].isLookingAt(s.getEllipsoid())) {
      s.actor.highLightColor = [0, 0, 0];
      return;
    };

    s.actor.highLightColor = [0, 10, 0];
    subjectBeingLookAt = i;
  })

  if(updateActive) {
    updateActive = false;
    if(subjectBeingLookAt !== -1) {
      hasMoved = false;
      activeSubject = subjectBeingLookAt;
      set.camera.yaw = -subjects[activeSubject].actor.angle;
      subjects[activeSubject].actor.highLightColor = [0, 0, 0];
    }
  }

  set.camera.update();

  let activeActor = subjects[activeSubject].actor;
  let cameraPosition = vec3.add([], activeActor.position, [-15*activeActor.direction[0], 7, -15*activeActor.direction[2]]);
  let subjectRight = vec3.cross([], activeActor.direction, [0, -1, 0]);

  vec3.add(set.camera.position, cameraPosition, vec3.scale([], subjectRight, 3));

  if(isFowardKeyDown) {
    subjects[activeSubject].startWalking();
    subjects[activeSubject].walk();
  } else {
    if(hasMoved) subjects[activeSubject].stopWalking();
    subjects[activeSubject].idle();
  }

  subjects.forEach((s, i) => { if(i !== activeSubject) s.idle(); });

  if(isStereoscopic) 
    set.renderVR(subjects, shell.width, shell.height, t);
  else
    set.render(subjects, shell.width, shell.height, t);
});

shell.on('gl-error', (e) => {
  worked = false;
  throw e;
});
