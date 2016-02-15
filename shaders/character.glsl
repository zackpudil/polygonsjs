#pragma glslify: inverse = require(glsl-inverse)
#pragma glslify: transpose = require(glsl-transpose)

attribute vec3 position;
attribute vec3 normal;
attribute vec2 tex;
attribute vec4 boneIds;
attribute vec4 weights;
attribute float boneIdAmount;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;
uniform mat4 bones[17];

varying vec2 Tex;
varying vec3 Normal;

void main() {
    mat4 boneTransform;
    int bia = int(boneIdAmount);

    for(int i = 0; i < 17; i++) {
      if(i < bia)
        boneTransform += bones[int(boneIds[i])]*weights[i];
    }

    gl_Position = projection*view*model*boneTransform*vec4(position, 1);
    Tex = tex;
    Normal = mat3(transpose(inverse(model*boneTransform)))*normal;
}
