import { GLASS_TINT_COUNT, MAX_PIECES } from './glassStrand'
import { BALL_LAYOUT } from './blob'

export const MAX_BALLS = BALL_LAYOUT.length

export const VERTEX_SHADER = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

#define MAX_BALLS ${MAX_BALLS}
#define MAX_PIECES ${MAX_PIECES}
#define GLASS_TINTS ${GLASS_TINT_COUNT}

uniform vec2 uResolution;
uniform float uTime;
uniform float uPixelRatio;
uniform vec3 uBalls[MAX_BALLS];
uniform vec4 uPieces[MAX_PIECES];
uniform int uPieceCount;
uniform float uPulse;
uniform sampler2D uText;
uniform vec3 uGround;
uniform vec3 uInk;
uniform vec3 uSignal;
uniform vec3 uGlass[GLASS_TINTS];

out vec4 fragColor;

const vec2 LIGHT = vec2(-0.5, 0.866);

struct Glass {
  vec3 transmission;
  vec3 glow;
  vec3 sheen;
  vec3 glint;
};

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float roundedTriangle(vec2 p, float size) {
  const float k = sqrt(3.0);
  float corner = size * 0.2;
  float r = size - corner;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y) - corner;
}

float coverage(float distance) {
  return 1.0 - smoothstep(-uPixelRatio, uPixelRatio, distance);
}

void addCaustic(inout Glass glass, vec2 offset, mat2 toLocal, float size, vec3 tint) {
  vec2 local = toLocal * (offset + LIGHT * size * 0.45);
  float distance = roundedTriangle(local * 1.1, size);
  float light = 1.0 - smoothstep(-size * 0.45, size * 0.35, distance);
  glass.sheen += tint * light * 0.09;
}

void addPiece(inout Glass glass, vec2 local, float size, vec3 tint, vec2 lightLocal) {
  float distance = roundedTriangle(local, size);
  if (distance > 2.0 * uPixelRatio) return;

  vec2 gradient = vec2(
    roundedTriangle(local + vec2(1.0, 0.0), size) - distance,
    roundedTriangle(local + vec2(0.0, 1.0), size) - distance
  );
  vec2 normal = normalize(gradient + 1e-6);
  float bevel = 1.0 - clamp(-distance / (size * 0.24), 0.0, 1.0);
  float fringe = 0.45 * uPixelRatio;
  vec3 cover = vec3(coverage(distance - fringe), coverage(distance), coverage(distance + fringe));

  vec3 filterColor = pow(tint, vec3(0.8 + bevel * 0.2));
  glass.transmission *= mix(vec3(1.0), filterColor, cover * (0.72 + bevel * 0.04));
  glass.glow = max(glass.glow, tint * cover.g);

  float facing = dot(normal, lightLocal);
  float rim = bevel * bevel;
  vec3 highlight = cover.g * vec3(1.0, 0.96, 0.88) * pow(max(facing, 0.0), 3.0) * rim * 0.6;
  float edgeLine = 1.0 - smoothstep(0.0, 1.2 * uPixelRatio, abs(distance + 2.5 * uPixelRatio)) * 0.7;
  vec2 across = vec2(-lightLocal.y, lightLocal.x);
  float streak = 1.0 - smoothstep(0.0, 0.05, abs(dot(local, across) / size - 0.18 + 0.25 * dot(local, lightLocal) / size));
  vec3 sparkle = highlight + edgeLine * max(facing, 0.0) * 0.7 + streak * cover.g * (1.0 - bevel) * 0.22;

  glass.sheen += sparkle;
  glass.sheen -= cover.g * max(-facing, 0.0) * rim * 0.03;
  glass.sheen += cover.g * tint * 0.12 * smoothstep(-size, size, dot(local, lightLocal));
  glass.glint += mix(vec3(1.0), tint, 0.55) * (edgeLine * 0.8 + highlight.r) ;
}

Glass traceGlass(vec2 p) {
  Glass glass = Glass(vec3(1.0), vec3(0.0), vec3(0.0), vec3(0.0));
  for (int i = 0; i < MAX_PIECES; i++) {
    if (i >= uPieceCount) break;
    vec4 piece = uPieces[i];
    vec2 offset = p - piece.xy;
    if (dot(offset, offset) > piece.z * piece.z * 3.2) continue;
    float tintIndex = floor((piece.w + 8.0) / 16.0);
    float angle = piece.w - tintIndex * 16.0;
    float c = cos(angle);
    float s = sin(angle);
    mat2 toLocal = mat2(c, -s, s, c);
    vec3 tint = uGlass[int(tintIndex)];
    addCaustic(glass, offset, toLocal, piece.z, tint);
    addPiece(glass, toLocal * offset, piece.z, tint, toLocal * LIGHT);
  }
  return glass;
}

vec3 blobField(vec2 p) {
  float field = 0.0;
  vec2 gradient = vec2(0.0);
  for (int i = 0; i < MAX_BALLS; i++) {
    vec2 offset = p - uBalls[i].xy;
    float r2 = uBalls[i].z * uBalls[i].z;
    float d2 = max(dot(offset, offset), 1.0);
    field += r2 / d2;
    gradient += -2.0 * r2 * offset / (d2 * d2);
  }
  return vec3(field, gradient);
}

float softGlow(vec2 uv) {
  vec2 texel = 28.0 * uPixelRatio / uResolution;
  float total = textureLod(uText, uv, 4.0).g;
  for (int i = 0; i < 8; i++) {
    float angle = float(i) * 0.7854;
    total += textureLod(uText, uv + vec2(cos(angle), sin(angle)) * texel, 4.0).g;
  }
  return total / 9.0;
}

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 uv = p / uResolution;

  vec3 blob = blobField(p);
  vec2 blobDirection = normalize(blob.yz + 1e-6);
  float edgeDistance = (blob.x - 1.0) / max(length(blob.yz), 1e-5);
  float inside = smoothstep(-uPixelRatio, uPixelRatio, edgeDistance);

  float meniscus = smoothstep(0.2, 1.0, blob.x) * (1.0 - smoothstep(1.0, 2.8, blob.x));
  Glass glass = traceGlass(p + blobDirection * meniscus * 34.0 * uPixelRatio);

  float rim = smoothstep(0.0, 14.0 * uPixelRatio, edgeDistance) * (1.0 - smoothstep(14.0 * uPixelRatio, 80.0 * uPixelRatio, edgeDistance));
  vec2 textUv = (p + blobDirection * rim * 6.0 * uPixelRatio) / uResolution;
  vec3 text = texture(uText, textUv).rgb;
  float caption = texture(uText, uv).b;
  float halo = softGlow(uv);

  float vignette = smoothstep(1.25, 0.2, length(uv - 0.5));
  vec3 ground = mix(uGround * 0.93, uGround, vignette);
  vec3 open = ground * glass.transmission * 1.06 + glass.sheen;
  vec3 liquid = uInk + glass.glint * 0.5;
  vec3 color = mix(open, liquid, inside);

  vec3 digitColor = mix(uInk, uGround, inside);
  color = mix(color, digitColor, max(text.r, caption));

  float glow = halo * (0.4 + 1.1 * uPulse);
  color = mix(color, uSignal, clamp(glow * (1.0 - text.r), 0.0, 0.6));
  color = mix(color, uSignal, text.g);

  float grain = hash(floor(p / max(uPixelRatio * 0.75, 1.0)) + floor(uTime * 24.0) * 17.0) - 0.5;
  color += grain * 0.045;

  fragColor = vec4(color, 1.0);
}
`
