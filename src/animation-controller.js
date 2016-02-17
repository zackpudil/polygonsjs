import { mat4, vec4, vec3, quat } from 'gl-matrix';

export default class AnimationController {
  constructor(model) { this.model = model; }

  boneTransforms(tick, idx) {
    let ident = mat4.create();
    let transforms = [];

    let anim = this.model.scene.animations[idx];

    this.readNodeHeirarchy(tick, this.model.scene.rootNode, idx, ident);

    this.model.bones.forEach(b => transforms.push(b.finalTrans));

    return transforms;
  }

  readNodeHeirarchy(time, node, i, parent) {
    let animation = this.model.scene.animations[i];
    let nodeTransform = node.transform;

    let animNode = animation.channels.find(c => c.name == node.name);

    if(animNode) {
      let rotTrans = mat4.fromRotationTranslation([],
        this.calculateInterpolatedQuaternoin(time, animNode.rotationKeys),
        this.calculateInterpolatedVector(time, animNode.positionKeys)
      );
      mat4.scale(nodeTransform, rotTrans, this.calculateInterpolatedVector(time, animNode.scaleKeys));
    }

    let gt = mat4.create();
    mat4.multiply(gt, parent, nodeTransform);

    let bone = this.model.bones.find(b => b.name == node.name);
    if(bone) {
      let g = mat4.multiply([], this.model.globalTranformation, gt);
      mat4.multiply(bone.finalTrans, g, bone.offset);
    }

    node.children.forEach(nc => this.readNodeHeirarchy(time, nc, i, gt));
  }

  calculateInterpolatedQuaternoin(time, quatKeys) {
    if(quatKeys.length == 1)
      return quat.clone(quatKeys[0].value);

    let { start, end, factor } = this.getLerpComponents(time, quatKeys);

    return quat.slerp(quat.create(), start, end, factor);
  }

  calculateInterpolatedVector(time, vectorKeys) {
    if(vectorKeys.length == 1)
      return vec3.clone(vectorKeys[0].value);

    let { start, end, factor } = this.getLerpComponents(time, vectorKeys);

    return vec3.lerp(vec3.create(), start, end, factor);
  }

  getLerpComponents(time, keys) {
    var startKey, endKey;

    keys.some((k, i) => {
      if(time < k.time) {
        startKey = keys[i - 1];
        endKey = k;
        return true;
      }

      return false;
    });

    let delta = endKey.time - startKey.time;
    let factor = (time - startKey.time) / delta;
    return { start: startKey.value, end: endKey.value, factor: factor };
  }
}
