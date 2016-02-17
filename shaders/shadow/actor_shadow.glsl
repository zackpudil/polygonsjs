attribute vec3 position;
attribute vec4 boneIds;
attribute vec4 weights;
attribute float boneIdAmount;

uniform mat4 model;
uniform mat4 bones[17];
uniform mat4 lightSpace;

void main() {
	int bia = int(boneIdAmount);
	mat4 boneTransform;

	for(int i = 0; i < 17; i++) {
		if(i >= bia) break;
		boneTransform += bones[int(boneIds[i])]*weights[i];
	}

	gl_Position = lightSpace*model*boneTransform*vec4(position, 1);
}