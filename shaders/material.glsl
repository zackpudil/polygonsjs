precision highp float;

uniform sampler2D diffuse;
varying vec2 Tex;
varying vec3 Normal;

void main() {
  gl_FragColor = texture2D(diffuse, Tex);
}
