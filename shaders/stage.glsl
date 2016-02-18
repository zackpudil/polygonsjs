#pragma glslify: inverse = require(glsl-inverse)
#pragma glslify: transpose = require(glsl-transpose)

attribute vec3 position;
attribute vec3 normal;
attribute vec2 tex;
attribute vec3 tangent;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;
uniform mat4 lightSpace;

varying vec2 Tex;
varying vec3 Normal;
varying mat3 TBN;
varying vec3 FragPos;
varying vec4 FragLightPos;

void main() {
  gl_Position = projection*view*model*vec4(position, 1);

  vec3 T = normalize(vec3(model*vec4(tangent, 0.0)));
  vec3 N = normalize(vec3(model*vec4(normal, 0.0)));
  vec3 B = normalize(cross(T, N));
  
  FragPos = vec3(model * vec4(position, 1));
  TBN = mat3(T, B, N);
  Tex = tex;
  Normal = mat3(transpose(inverse(model)))*normal;
  FragLightPos = lightSpace*vec4(FragPos, 1);
}
