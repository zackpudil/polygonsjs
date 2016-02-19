import { vec3 } from 'gl-matrix';

export default class Character {
	constructor(script, actor) {
		this.actor = actor;
		Object.keys(script).forEach((key) => this.constructAction(key, script[key]));
	}

	constructAction(key, action) {
		this[key] = () => {
			action.gestures.forEach(g =>  {
				this.createGesture(this.actor.animator, g).doWhile(() => this.createStunt.apply(this, [action.stunt]))
			});
		};
	}

	createGesture(animator, gesture) {
		animator[gesture.type](
			gesture.animation, 
			gesture.startFrame, 
			gesture.endFrames, 
			gesture.skip,
			gesture.reset);

		return animator;
	}

	update() {
		this.actor.update();
	}

  isLookingAt(ellipsoid) {
    let v = vec3.subtract([], this.actor.position, ellipsoid.center);
    let scaledDirection = vec3.transformMat3([], this.actor.direction, ellipsoid.scale);
    let scaledPosition = vec3.transformMat3([], v, ellipsoid.scale);

    let q = vec3.dot(this.actor.direction, scaledDirection);
    let r = vec3.dot(v, scaledDirection);
    let u = vec3.dot(this.actor.direction, scaledPosition);
    let w = vec3.dot(v, scaledPosition);

    let s = (r+u)*(r+u) - 4*q*(w - 1);

    if(s < 0) return false;

    return true;
  }

	getEllipsoid() {
		return {
			center: vec3.add([], this.actor.position, [0, 5, 0]),
			scale: [1.0/7.0, 0, 0, 0, 1.0/80.0, 0, 0, 0, 1.0/7.0]
		};
	}

	createStunt(stunt) {
		stunt.do.split(",").forEach(d => {
			if(d == "move") {
				vec3.add(this.actor.position, this.actor.position, vec3.scale([], this.actor.direction, this.actor.speed));
			}

			if(d == "accel") {
				this.actor.speed += stunt.accel;
				this.actor.speed = Math.min(this.actor.speed, stunt.maxSpeed);
			}

			if(d == "deaccel") {
				this.actor.speed -= stunt.deaccel;
				this.actor.speed = Math.max(this.actor.speed, 0);
			}

			if (d == "stop") this.actor.speed = 0;
			if (d == "go") this.actor.speed = stunt.maxSpeed;
		});
	}
}