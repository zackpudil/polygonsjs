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

	update(camera) {
		this.actor.update();
		if(camera) {
			vec3.add(camera.position, 
				this.actor.position, 
				[-15*this.actor.direction[0], 18, -15*this.actor.direction[2]]);
		}
	}

	createStunt(stunt) {
		stunt.do.split(",").forEach(d => {
			if(d == "move") {
				//debugger;
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