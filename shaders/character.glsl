#pragma glslify: inverse = require(glsl-inverse)
#pragma glslify: transpose = require(glsl-transpose)

attribute vec3 position;
attribute vec3 normal;
attribute vec2 tex;
attribute vec3 tangent;
attribute vec4 boneIds;
attribute vec4 weights;
attribute float boneIdAmount;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;
uniform mat4 bones[17];
uniform mat4 lightSpace;

varying vec2 Tex;
varying vec3 Normal;
varying vec3 FragPos;
varying mat3 TBN;
varying vec4 FragLightPos;

void main() {
    mat4 boneTransform;
    int bia = int(boneIdAmount);

    for(int i = 0; i < 17; i++) {
      if(i < bia)
        boneTransform += bones[int(boneIds[i])]*weights[i];
    }

    vec4 p = boneTransform*vec4(position, 1);

    gl_Position = projection*view*model*p;

    vec3 T = normalize(vec3(model*boneTransform*vec4(tangent, 0.0)));
    vec3 N = normalize(vec3(model*boneTransform*vec4(normal, 0.0)));
    vec3 B = normalize(cross(T, N));

    TBN = mat3(T, B, N); 
    FragPos = vec3(model * p);
    Tex = tex;
    Normal = mat3(transpose(inverse(model*boneTransform)))*normal;
    FragLightPos = lightSpace*vec4(FragPos, 1.0);
}
