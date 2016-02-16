import {vec4} from 'gl-matrix';

export class Vertex {
  constructor(p, n, tx, t, b, w) {
    this.position = p;
    this.normal = n;
    this.tex = tx;
    this.tangent = t;

    this.boneIds = b || [];
    this.weights = w || [];
  }

  getAsArray() {
    return [
      ...this.position,
      ...this.normal,
      ...this.tex,
      ...this.tangent,
      ...Array.apply(0, Array(4)).map((v, i) => this.boneIds.length <= i ? 0 : this.boneIds[i]),
      ...Array.apply(0, Array(4)).map((v, i) => this.weights.length <= i ? 0 : this.weights[i]),
      this.boneIds.length
    ];
  }
}

var unit = -1;
export class Texture {
  static get unit() {
    unit += 1;
    return unit;
  }

  constructor(texture, name)  {
    this.texture = texture;
    this.name = name;
    this.unit = Texture.unit;
  }
}

export class Mesh {
  constructor(gl, v, i, t, s) {
    this.gl = gl;

    this.vertices = v;
    this.indices = i;
    this.textures = t;
    this.shininess = s;
    this.createBuffers();
  }

  draw(shader) {
    let gl = this.gl;

    this.textures.forEach(t => {
      shader.bind('material.' + t.name, { type: 'sampler2D', val: t.texture.bind(t.unit)});
    });
    shader.bind('material.hasNormals', this.textures.filter(t => t.name === "normal").length);
    shader.bind('material.hasSpecular', this.textures.filter(t => t.name === "specular").length);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);

    this.bindAttributes(shader);
    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
  }

  createBuffers() {
    let gl = this.gl;
    let bufferData = [];
    this.vertices.forEach(v => bufferData.push(...v.getAsArray()));

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bufferData), gl.STATIC_DRAW);

    this.ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices), gl.STATIC_DRAW);
  }

  bindAttributes(shader) {
    let gl = this.gl;

    // TODO: hoist these variables and positions to class objects to reduce garbage collection,
    // and improve performance.
    let bytes = Float32Array.BYTES_PER_ELEMENT;
    var stride = bytes*20;

    //vec3 poision
    let pal = gl.getAttribLocation(shader.program, "position");
    gl.enableVertexAttribArray(pal);
    gl.vertexAttribPointer(pal, 3, gl.FLOAT, false, stride, 0);

    //vec3 normal
    let nal = gl.getAttribLocation(shader.program, "normal");
    gl.enableVertexAttribArray(nal);
    gl.vertexAttribPointer(nal, 3, gl.FLOAT, false, stride, bytes*3);

    // vec2 tex
    let tal = gl.getAttribLocation(shader.program, "tex");
    gl.enableVertexAttribArray(tal);
    gl.vertexAttribPointer(tal, 2, gl.FLOAT, false, stride, bytes*6);

    let gal = gl.getAttribLocation(shader.program, "tangent");
    gl.enableVertexAttribArray(gal);
    gl.vertexAttribPointer(gal, 2, gl.FLOAT, false, stride, bytes*8)

    // vec4 boneIds
    let bal = gl.getAttribLocation(shader.program, "boneIds");
    if(bal !== -1) {
      gl.enableVertexAttribArray(bal);
      gl.vertexAttribPointer(bal, 4, gl.FLOAT, false, stride, bytes*11);
    }

    // vec4 weights
    let wal = gl.getAttribLocation(shader.program, "weights");
    if(wal !== -1) { 
      gl.enableVertexAttribArray(wal);
      gl.vertexAttribPointer(wal, 4, gl.FLOAT, false, stride, bytes*15);
    }

    // float boneIdAmount
    let ial = gl.getAttribLocation(shader.program, "boneIdAmount");
    if(ial !== -1) {
      gl.enableVertexAttribArray(ial);
      gl.vertexAttribPointer(ial, 1, gl.FLOAT, false, stride, bytes*19);
    }
  }
}
