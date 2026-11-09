/**
 * Post-processing dưới nước (một pass trên camera chính):
 *  - Hấp thụ ánh sáng theo độ sâu: kênh đỏ mất trước, rồi xanh lục (đúng vật lý nước biển)
 *  - Đèn lặn hình nón: TRẢ LẠI MÀU THẬT trong vùng chiếu sáng
 *  - Bóng tối Tầng 3, sương nước, caustics (vân sáng), rung nước, viền tối, lóe đỏ khi bị thương
 */
import Phaser from 'phaser';

const FRAG = `
#define SHADER_NAME WATER_FX
precision mediump float;
uniform sampler2D uMainSampler;
varying vec2 outTexCoord;
uniform float uTime;
uniform vec2 uRes;
uniform float uAbsorb;
uniform float uDark;
uniform vec3 uWater;
uniform float uFog;
uniform float uLampOn;
uniform vec2 uLampPos;
uniform float uLampAng;
uniform float uLampRange;
uniform float uLampCone;
uniform float uCaustic;
uniform vec2 uScroll;
uniform float uZoom;
uniform float uWobble;
uniform float uVignette;
uniform float uHurt;
uniform float uLowO2;
uniform float uAim;
uniform float uEmissive;

float causticNet(vec2 p) {
  vec2 q = p;
  float v = 0.0;
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    q = vec2(q.x + 0.55 * sin(q.y * 1.3 + uTime * 0.7 + fk * 1.9),
             q.y + 0.55 * cos(q.x * 1.1 - uTime * 0.6 + fk * 2.3));
    v += abs(sin(q.x * 1.7) * sin(q.y * 1.7));
  }
  v /= 3.0;
  return pow(clamp(1.0 - v, 0.0, 1.0), 7.0);
}

void main() {
  vec2 uv = outTexCoord;
  if (uWobble > 0.0) {
    uv += vec2(sin(uv.y * 38.0 + uTime * 1.6), cos(uv.x * 29.0 + uTime * 1.3)) * 0.0011 * uWobble;
  }
  vec4 tex = texture2D(uMainSampler, uv);
  vec3 col = tex.rgb;
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);

  // ---- đèn lặn ----
  vec2 d = px - uLampPos;
  float dist = length(d);
  float ang = atan(d.y, d.x);
  float delta = abs(mod(ang - uLampAng + 3.14159265, 6.2831853) - 3.14159265);
  float cone = smoothstep(uLampCone, uLampCone * 0.55, delta) * smoothstep(uLampRange, uLampRange * 0.25, dist);
  float halo = smoothstep(uLampRange * 0.22, 0.0, dist) * 0.55;
  float lit = clamp(cone + halo, 0.0, 1.0) * uLampOn;

  // ---- hấp thụ màu theo độ sâu ----
  vec3 absorbed = col * vec3(1.0 - uAbsorb * 0.92, 1.0 - uAbsorb * 0.38, 1.0 - uAbsorb * 0.06);
  float lum = dot(absorbed, vec3(0.299, 0.587, 0.114));
  absorbed = mix(absorbed, vec3(lum) * vec3(0.55, 0.9, 1.15), uAbsorb * 0.35);
  vec3 outc = mix(absorbed, col * (1.0 + 0.3 * lit), lit);
  // chùm sáng thể tích (bụi nước phản chiếu ánh đèn ấm)
  float beam = cone * uLampOn * (1.0 - clamp(dist / uLampRange, 0.0, 1.0));
  outc += vec3(0.95, 0.88, 0.7) * beam * 0.13;

  // ---- sương nước ----
  outc = mix(outc, uWater, uFog * (1.0 - lit * 0.85));

  // ---- bóng tối ----
  outc *= mix(1.0 - uDark, 1.0, lit);

  // ---- phát quang sinh học (Tầng 3): điểm xanh lam/lục sáng, ít đỏ → giữ sáng giữa bóng tối ----
  if (uEmissive > 0.0) {
    float hi = max(col.g, col.b);
    float em = smoothstep(0.42, 0.85, hi) * smoothstep(0.5, 0.18, col.r) * smoothstep(0.18, 0.5, hi - col.r);
    outc = mix(outc, col * 1.2, em * uEmissive);
  }

  // ---- caustics ----
  if (uCaustic > 0.0) {
    vec2 wp = (px + uScroll) / uZoom;
    float c = causticNet(wp / 70.0) * 0.7 + causticNet(wp / 37.0 + 3.1) * 0.3;
    float l = dot(outc, vec3(0.299, 0.587, 0.114));
    outc += vec3(0.85, 0.97, 1.0) * c * uCaustic * (0.25 + l * 1.1);
  }

  // ---- viền tối, ngắm máy ảnh, oxy thấp, bị thương ----
  vec2 cuv = uv - 0.5;
  float r = length(cuv * vec2(uRes.x / uRes.y, 1.0));
  float vig = smoothstep(1.05, 0.35, r);
  outc *= mix(1.0, vig, uVignette + uAim * 0.35);
  float edge = smoothstep(0.35, 0.95, r);
  outc = mix(outc, vec3(1.0, 0.25, 0.22), edge * (uLowO2 * 0.32 + uHurt * 0.55));

  gl_FragColor = vec4(outc, tex.a);
}
`;

export class WaterFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  params = {
    absorb: 0,
    dark: 0,
    water: [0.1, 0.4, 0.55] as [number, number, number],
    fog: 0,
    lampOn: 0,
    lampX: 0,
    lampY: 0,
    lampAng: 0,
    lampRange: 400,
    lampCone: 0.4,
    caustic: 0,
    scrollX: 0,
    scrollY: 0,
    zoom: 1,
    wobble: 1,
    vignette: 0.45,
    hurt: 0,
    lowO2: 0,
    aim: 0,
    emissive: 0,
  };

  constructor(game: Phaser.Game) {
    super({ game, name: 'WaterFX', fragShader: FRAG });
  }

  onPreRender(): void {
    const p = this.params;
    this.set1f('uTime', this.game.loop.time / 1000);
    this.set2f('uRes', this.renderer.width, this.renderer.height);
    this.set1f('uAbsorb', p.absorb);
    this.set1f('uDark', p.dark);
    this.set3f('uWater', p.water[0], p.water[1], p.water[2]);
    this.set1f('uFog', p.fog);
    this.set1f('uLampOn', p.lampOn);
    this.set2f('uLampPos', p.lampX, p.lampY);
    this.set1f('uLampAng', p.lampAng);
    this.set1f('uLampRange', p.lampRange);
    this.set1f('uLampCone', p.lampCone);
    this.set1f('uCaustic', p.caustic);
    this.set2f('uScroll', p.scrollX, p.scrollY);
    this.set1f('uZoom', p.zoom);
    this.set1f('uWobble', p.wobble);
    this.set1f('uVignette', p.vignette);
    this.set1f('uHurt', p.hurt);
    this.set1f('uLowO2', p.lowO2);
    this.set1f('uAim', p.aim);
    this.set1f('uEmissive', p.emissive);
  }
}
