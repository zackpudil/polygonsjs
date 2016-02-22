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

export default class Model {
  constructor(gl, scene) {
    this.gl = gl;
    this.meshes = [];
    this.bones = [];
    this.scene = scene;

    this.globalTranformation = mat4.invert([], this.scene.rootNode.transform);
    this.processNode(scene.rootNode);
  }

  draw(shader) {
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

    let getTexture = (t, type) => {
      if(t.length == 0) return;
      let textureId = createTexture(this.gl, document.getElementById(t));
      textureId.generateMipmap();
      textureId.wrap = [this.gl.REPEAT, this.gl.REPEAT];
      textures.push(new Texture(textureId, type));
    };

    getTexture(material.diffuse, "diffuse");
    getTexture(material.normals, "normals");
    getTexture(material.specular, "specular");

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
