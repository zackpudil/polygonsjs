#pragma glslify: inverse = require(glsl-inverse)
#pragma glslify: transpose = require(glsl-transpose)

attribute vec3 position;
attribute vec3 normal;
attribute vec2 tex;
attribute vec3 tangent;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

varying vec2 Tex;
varying vec3 Normal;
void main() {

    gl_Position = projection*view*model*vec4(position, 1);
    Tex = tex;
    Normal = mat3(transpose(inverse(model)))*normal;
}
