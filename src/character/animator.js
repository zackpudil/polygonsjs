import { isArryEquivalent, isEquivalent } from '../util';

let PlayType = {
	play: "play",
	loop: "loop"
};

export default class Animator {
	constructor(ctrl) {
		this.durations = [];
		this.ctrl = ctrl;

		this.runningTime = 0;
		this.currentStackIdx = 0;
		this.lastStackIdx = 0;

		this.lastFrame = 0;
		this.currentStackAnimationDone = false;

		this.callStack = [];
		this.previousCallStack = [];

		ctrl.model.scene.animations.forEach((a, i) => {
			this.durations.push({
				duration: a.duration,
				ticksPerSecond: a.ticksPerSecond
			});
		});
	}

	play(idx, start = 0, ends = [-1], skip = {}, reset = false) {
		if(ends[0] == -1)
			ends[0] = this.durations[idx].duration;

		this.callStack.push({
			playType: PlayType.play,
			idx: idx,
			startFrame: start,
			endFrames: ends,
			skipFrame: skip,
			reset: reset,
			doWhile: () => {}
		});

		return this;
	}

	loop(idx, start = 0, end = [-1], skip = {}, reset = true) {
		this.callStack.push({
			playType: PlayType.loop,
			idx: idx,
			startFrame: start,
			endFrames: end[0] == -1 ? [this.durations[idx].duration] : end,
			skipFrame: skip,
			reset: reset,
			doWhile: () => {}
		});

		return this;
	}

	doWhile(func) {
		this.callStack[this.callStack.length - 1].doWhile = func;
		return this;
	}

	run(shader, t) {
		var entryToPlay;

		if(!isArryEquivalent(this.previousCallStack, this.callStack)) {
			this.currentStackIdx = 0;
			this.lastStackIdx = -1;
			this.currentStackAnimationDone = false;
		}

		if(this.currentStackAnimationDone) {
			this.currentStackIdx += 1;
			this.currentStackAnimationDone = false;

			if(this.currentStackIdx == this.callStack.length) {
				this.currentStackIdx -= 1;
				this.currentStackAnimationDone = this.callStack[this.currentStackIdx].playType == PlayType.play;
			}

			entryToPlay = this.callStack[this.currentStackIdx];
		} else entryToPlay = this.callStack[this.currentStackIdx];

		if(this.lastStackIdx != this.currentStackIdx && entryToPlay.reset) 
			this.runningTime = 0;

		let frame = this.getFrame(entryToPlay.idx, t);

		if(entryToPlay.playType == PlayType.play)
			this.runPlayEntry(entryToPlay, frame, shader, true);
		else
			this.runLoopEntry(entryToPlay, frame, shader, true);

		this.lastStackIdx = this.currentStackIdx;
		this.previousCallStack = this.callStack.slice(0);
		this.callStack = [];
	}

	get(shader) {
		let entryToPlay = this.callStack.length == 0 || this.currentStackIdx == this.callStack.length
			? this.previousCallStack[this.currentStackIdx]
			: this.callStack[this.currentStackIdx];

		let frame = (this.durations[entryToPlay.idx].ticksPerSecond*this.runningTime) % this.durations[entryToPlay.idx].duration;

		if(entryToPlay.playType == PlayType.play)
			this.runPlayEntry(entryToPlay, frame, shader, false);
		else
			this.runLoopEntry(entryToPlay, frame, shader, false);
	}

	runPlayEntry(entry, frame, shader, runCbs) {
		if(this.currentStackAnimationDone) {
			this.bindUniforms(this.ctrl.boneTransforms(this.lastFrame, entry.idx), shader);
			return;
		}

		if(frame < entry.startFrame) {
			frame = entry.startFrame;
			this.runningTime = entry.startFrame/this.durations[entry.idx].ticksPerSecond;
		}

		if(entry.skipFrame) {
			if(Math.abs(frame - entry.skipFrame.from) < 1) {
				frame = entry.skipFrame.to;
				this.runningTime = frame/this.durations[entry.idx].ticksPerSecond;
			}
		}

		let endFrame = entry.endFrames.find(f => Math.abs(frame - f) < 1);
		if(endFrame) {
			this.currentStackAnimationDone = true;
			this.lastFrame = endFrame;
			this.bindUniforms(this.ctrl.boneTransforms(this.lastFrame, entry.idx), shader);

			return;
		}

		this.bindUniforms(this.ctrl.boneTransforms(frame, entry.idx), shader);

		if(runCbs)
			entry.doWhile();
	}

	runLoopEntry(entry, frame, shader, runCbs) {
		if(frame < entry.startFrame || frame > entry.endFrames[0]) {
			frame = entry.startFrame;
			this.runningTime = frame/this.durations[entry.idx].ticksPerSecond;
		}

		if(entry.skipFrame.from) {
			if(Math.abs(frame - entry.skipFrame.from) < 1) {
				frame = entry.skipFrame.to;
				this.runningTime = frame/this.durations[entry.idx].ticksPerSecond;
			}
		}

		this.bindUniforms(this.ctrl.boneTransforms(frame, entry.idx), shader);

		if(runCbs)
			entry.doWhile();
	}

	getFrame(idx, tick) {
		this.runningTime += tick;

		return (this.durations[idx].ticksPerSecond*(this.runningTime))%this.durations[idx].duration;
	}

	bindUniforms(transforms, shader) {
		transforms.forEach((t, i) => shader.bind("bones[" + i + "]", { type: 'mat4', val: t }));
	}
}