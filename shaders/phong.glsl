vec3 calculateDiffuse(vec3 diffuse, vec3 lightDirection, vec3 norm) {
    float diff = max(dot(norm, lightDirection), 0.0);
    return diffuse * diff;
}

vec3 calculateSpecular(vec3 specular, vec3 lightDirection, vec3 fragPos, vec3 norm) {
    vec3 viewDir = normalize(rViewPos - fragPos);
    vec3 halfwayDir = normalize(lightDirection + viewDir);
    
    float spec = pow(max(dot(viewDir, halfwayDir), 0.0), rShininess);
    return specular * spec;
}

float calculateLuminosity(vec3 pos, vec3 fragPos, float r) {
    float d  = length(pos - fragPos);
    float attenuation = r*d*d;
    return 1.0/(attenuation);
}

struct DirectionalLight {
    vec3 direction;
    
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

vec3 calculateDirectionalLight(DirectionalLight directional, vec3 fragPos, vec3 norm) {
    
    vec3 lightDir = normalize(-directional.direction);
    
    vec3 ambient = directional.ambient*rGetMaterialDiffuse();
    vec3 diffuse = calculateDiffuse(directional.diffuse, lightDir, norm)*rGetMaterialDiffuse();
    vec3 specular = calculateSpecular(directional.specular, lightDir, fragPos, norm)*rGetMaterialSpecular();
    
    return ambient + diffuse + specular;
}

struct PointLight {
    vec3 position;
    
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;

    float radius;
};

vec3 calculatePointLight(PointLight point, vec3 fragPos, vec3 norm) {
    vec3 lightDir = normalize(point.position - fragPos);
    
    float a = calculateLuminosity(point.position, fragPos, point.radius);
    
    vec3 ambient = point.ambient*rGetMaterialDiffuse();
    vec3 diffuse = calculateDiffuse(point.diffuse, lightDir, norm)*a*rGetMaterialDiffuse();
    vec3 specular = calculateSpecular(point.specular, lightDir, fragPos, norm)*a*rGetMaterialSpecular();
    
    return ambient + diffuse + specular;
}

struct SpotLight {
    vec3 position;
    vec3 direction;
    
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;

    float radius;
    
    float cutOff;
    float outerCutOff;
};

vec3 calculateSpotLight(SpotLight spot, vec3 fragPos, vec3 norm) {
    vec3 lightDir = normalize(spot.position - fragPos);
    
    float theta = dot(lightDir, normalize(-spot.direction));
    float epsilon = (spot.cutOff - spot.outerCutOff);
    float intensity = clamp((theta - spot.outerCutOff)/epsilon, 0.0, 1.0);
    
    float a = calculateLuminosity(spot.position, fragPos, spot.radius);

    vec3 ambient = spot.ambient*rGetMaterialDiffuse();
    vec3 diffuse = calculateDiffuse(spot.diffuse, lightDir, norm)*a*rGetMaterialDiffuse();
    vec3 specular = calculateSpecular(spot.specular, lightDir, fragPos, norm)*a*rGetMaterialSpecular();
    
    return ambient + diffuse + specular;
}


uniform DirectionalLight directionals[5];
uniform int directionalLightAmount;

uniform SpotLight spots[1];
uniform int spotLightAmount;

uniform PointLight points[5];
uniform int pointLightAmount;

vec3 calculateLighting(vec3 fragPos, vec3 norm) {
    vec3 result;
    
    for(int i = 0; i < 5; i++) {
        if(i >= directionalLightAmount) break;
        result += calculateDirectionalLight(directionals[i], fragPos, norm);
    }
    
    for (int i = 0; i < 5; i++) {
        if(i >= pointLightAmount) break;
        result += calculatePointLight(points[i], fragPos, norm);
    }
    
    for(int i = 0; i < 1; i++) {
        if(i >= spotLightAmount) break;
        result += calculateSpotLight(spots[i], fragPos, norm);
    }

    return result;
}

#pragma glslify: export(calculateLighting);