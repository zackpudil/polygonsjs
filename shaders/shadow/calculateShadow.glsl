uniform int castShadow;

float calculateShadow(vec4 fragPosLightSpace, vec3 lightDir, vec3 normal) {
	if(castShadow == 0)
		return 0.0;

	vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
	projCoords = projCoords * 0.5 + 0.5;

	if(projCoords.z > 1.0)
		return 0.0;

	float closestDepth = texture2D(rShadow, projCoords.xy).r;
	float currentDepth = projCoords.z;

	float bias = 0.00001;

	float shadowCoef = currentDepth - bias > closestDepth ? 1.0 : 0.0;

	return shadowCoef;
}

#pragma glslify: export(calculateShadow);