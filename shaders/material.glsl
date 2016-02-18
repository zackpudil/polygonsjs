precision highp float;
precision highp int;
precision lowp sampler2D;
precision lowp samplerCube;

struct Material {
    sampler2D diffuse;
    sampler2D specular;
    sampler2D normal;
    float shininess;
    
    int hasSpecular;
    int hasNormals;
};

varying vec3 Normal;
varying vec3 FragPos;
varying vec2 Tex;
varying mat3 TBN;
varying vec4 FragLightPos;

uniform vec3 viewPos;
uniform Material material;
uniform sampler2D shadow;

vec3 getDiffuse() {
    return vec3(texture2D(material.diffuse, Tex));
}

vec3 getSpecular() {
    if(material.hasSpecular != 0)
        return vec3(texture2D(material.specular, Tex));

    return vec3(0);
}

#pragma glslify: calculateLighting = require('./phong.glsl', rShininess = material.shininess, rGetMaterialDiffuse = getDiffuse, rGetMaterialSpecular = getSpecular, rViewPos = viewPos, rLightPos = FragLightPos, rShadow = shadow);

void main() {
    vec3 norm;
    
    if(material.hasNormals == 0) {
        norm = normalize(Normal);
    } else {
        norm = texture2D(material.normal, Tex).rgb;
        norm = normalize(norm * 2.0 - 1.0);
        norm = normalize(TBN * norm);
    }

    vec3 result = calculateLighting(FragPos, norm);

    gl_FragColor = vec4(result, 1.0);
}