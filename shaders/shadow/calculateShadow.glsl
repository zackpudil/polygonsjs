uniform int castShadow;

float calculateShadow(vec4 fragPosLightSpace, vec3 lightDir, vec3 normal) {
	if(castShadow == 0)
		return 0.0;

	vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
	projCoords = projCoords * 0.5 + 0.5;

	if(projCoords.z > 1.0)
		return 0.0;

	float currentDepth = projCoords.z;

	float shadowCoef = 0.0;
	float bias = 0.000001;

	for(float x = -0.001; x < 0.001; x += 0.0005) {
		for(float y = -0.001; y < 0.001; y += 0.0005) {
			float closestDepth = texture2D(rShadow, projCoords.xy + vec2(x, y)).r;
			if(currentDepth - bias > closestDepth) shadowCoef += 1.0;
		}
	}

	shadowCoef /= 16.0;

	return shadowCoef;
}

#pragma glslify: export(calculateShadow);