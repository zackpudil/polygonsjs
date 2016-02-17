attribute vec3 position;

uniform mat4 lightSpace;
uniform mat4 model;

void main() {
	gl_Position = lightSpace*model*vec4(position, 1);
}