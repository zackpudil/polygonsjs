import { Mesh, Vertex, Texture } from './mesh';
import {mat4} from 'gl-matrix';
import createTexture from 'gl-texture2d';

export class Bone {
  constructor(i, n, o, w) {
    this.idx = i;
    this.name = n;
    this.offset = o,
    this.finalTrans = mat4.create();
    this.weights = w;
  }
}

export class Model {
  constructor(gl, scene, scale = 1) {
    this.gl = gl;
    this.meshes = [];
    this.bones = [];
    this.scene = scene;
    this.scale = scale;

    this.globalTranformation = mat4.invert([], this.scene.rootNode.transform);
    this.processNode(scene.rootNode);
  }

  draw(shader) {
    let model = mat4.create();
    mat4.scale(model, model, [this.scale, this.scale, this.scale]);//[0.005, 0.005, 0.005]);
    shader.bind("model", { type: 'mat4', val: model });
    this.meshes.forEach(m => m.draw(shader));
  }

  processNode(node) {
    node.meshes.forEach(m => this.meshes.push(this.processMesh(this.scene.meshes[m])));
    node.children.forEach(this.processNode.bind(this));
  }

  processMesh(mesh) {
    let vertices = [];
    let indices = [];
    let textures = [];

    mesh.vertices.forEach((v, i) => {
      vertices.push(new Vertex(v,mesh.normals[i],mesh.textureCoords[i], mesh.tangents[i]));
    });

    mesh.faces.forEach(f => indices.push(...f.indices));

    let material = this.scene.materials[mesh.materialIndex];
    textures.push(new Texture(createTexture(this.gl, document.getElementById(material.diffuse)), "diffuse"));

    this.loadBones(mesh.bones).forEach(b => {
      b.weights.forEach(w => {
        let v = vertices[w.vertexIdx];

        v.boneIds.push(b.idx);
        v.weights.push(w.weight);
      });
    });

    return new Mesh(this.gl, vertices, indices, textures);
  }

  loadBones(bones) {
    let vertexBoneData = [];
    bones.forEach(bone => {
      let foundBone = this.bones.find(b => bone.name == b.name);

      if(!foundBone) {
        var newBone = new Bone(
          this.bones.length,
          bone.name,
          bone.offset,
          bone.weights
        );
        this.bones.push(newBone);
        vertexBoneData.push(newBone);
      } else {
        vertexBoneData.push(foundBone);
      }
    });

    return vertexBoneData;
  }
}
