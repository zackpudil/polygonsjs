precision highp float;
precision highp int;
precision lowp sampler2D;
precision lowp samplerCube;

varying vec3 Normal;
varying vec3 FragPos;
varying vec2 Tex;
varying mat3 TBN;
varying vec4 FragLightPos;

uniform sampler2D diffuse;
uniform sampler2D specular;
uniform sampler2D normals;
uniform float shininess;
uniform int hasSpecular;
uniform int hasNormals;

uniform vec3 viewPos;
uniform sampler2D shadow;
uniform vec3 highLightColor;

vec3 getDiffuse() {
    return vec3(texture2D(diffuse, Tex));
}

vec3 getSpecular() {
    if(hasSpecular != 0)
        return vec3(texture2D(specular, Tex));

    return vec3(0);
}

#pragma glslify: calculateLighting = require('./phong.glsl', rShininess = shininess, rGetMaterialDiffuse = getDiffuse, rGetMaterialSpecular = getSpecular, rViewPos = viewPos, rLightPos = FragLightPos, rShadow = shadow);

void main() {
    vec3 norm;
    
    if(hasNormals == 0) {
        norm = normalize(Normal);
    } else {
        norm = texture2D(normals, Tex).rgb;
        norm = normalize(norm * 2.0 - 1.0);
        norm = normalize(TBN * norm);
    }

    vec3 result = calculateLighting(FragPos, norm);
    result += highLightColor;

    gl_FragColor = vec4(result, 1.0);
}