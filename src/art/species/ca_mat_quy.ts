/**
 * Cá mặt quỷ – Synanceia verrucosa (Reef stonefish)
 * Đặc điểm nhận dạng: thân thô kệch phủ u bướu như hòn đá phủ rêu; đầu cực to, tù;
 * miệng rộng gần thẳng đứng hướng lên trên (môi sáng); mắt nhỏ nằm sâu trên gờ xương đỉnh đầu,
 * sau mắt có hõm lõm; vây lưng liền thành dải gai núm lởm chởm (13 gai nọc);
 * vây ngực rất lớn xòe tròn tì lên đáy; màu loang nâu xám với mảng đỏ gạch, cam, vàng rêu, vỏ trắng.
 * Tư thế: nằm sát đáy, gần như bất động.
 * Ảnh tham khảo: references/ca_mat_quy (ref1 – dáng ngang; ref2–5 – màu, da, miệng, mắt).
 */
import type { CreatureArt } from '../contract';
import {
  makeIds,
  standardBody,
  eye,
  linear,
  radial,
  joinDefs,
  rng,
  smoothPath,
  blurFilter,
  clip,
  finRays,
} from '../style-bible';

const u = makeIds('ca_mat_quy');

// ---------- Bảng màu (ước lượng từ ảnh tham khảo) ----------
const OUTLINE = '#3a2622';
const STONE_D = '#4a3632';
const STONE = '#7a5e55';
const STONE_L = '#9c8172';
const BRICK = '#a8452f';
const ORANGE = '#e2832f';
const AMBER = '#eaa53c';
const MOSS = '#9c9a45';
const MOSS_D = '#6b7034';
const CRUST = '#d9cdb6';
const PINK = '#b97a86';

const BOTTOM = 300; // mặt đáy (bụng & vây ngực tì lên)

type P = [number, number];

// ---------- Đường viền thân (đầu phải) ----------
const BODY_KEY: P[] = [
  [597, 158], [588, 145], [573, 137], [556, 131], [540, 126], [524, 131], [510, 142], [494, 144],
  [472, 137], [440, 138], [400, 143], [360, 149], [320, 156], [280, 164], [240, 174], [205, 184],
  [178, 190], [160, 194], [150, 200], [150, 224], [160, 231], [182, 237], [216, 248], [256, 260],
  [300, 270], [350, 279], [400, 285], [450, 288], [500, 287], [536, 281], [563, 268], [584, 248],
  [598, 224], [604, 199], [602, 176],
];

function jitterPts(pts: P[], seed: number, amp: number, fixed: number[] = []): P[] {
  const r = rng(seed);
  return pts.map(([x, y], i) => (fixed.includes(i) ? [x, y] : [x + (r() - 0.5) * amp, y + (r() - 0.5) * amp]));
}

const BODY_PTS = jitterPts(BODY_KEY, 41, 4, [17, 18, 19, 20]);
const BODY = smoothPath(BODY_PTS, true, 0.55);

/** y của mép lưng thân tại x (nội suy theo các điểm khóa phía trên) */
function backY(x: number): number {
  const top = BODY_KEY.slice(4, 18); // 540 → 160
  for (let i = 0; i < top.length - 1; i++) {
    const [x1, y1] = top[i];
    const [x2, y2] = top[i + 1];
    if (x <= x1 && x >= x2) return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
  }
  return 190;
}

function inPoly(x: number, y: number, poly: P[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ---------- Hình đốm hữu cơ ----------
function blob(cx: number, cy: number, rx: number, ry: number, seed: number, n = 9, jit = 0.38): string {
  const r = rng(seed);
  const pts: P[] = [];
  const rot = r() * Math.PI;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 - jit / 2 + r() * jit;
    const x0 = Math.cos(a) * rx * k;
    const y0 = Math.sin(a) * ry * k;
    pts.push([cx + x0 * Math.cos(rot) - y0 * Math.sin(rot), cy + x0 * Math.sin(rot) + y0 * Math.cos(rot)]);
  }
  return smoothPath(pts, true, 0.6);
}

function patches(
  seed: number,
  area: { x: number; y: number; w: number; h: number },
  spec: { color: string; count: number; rMin: number; rMax: number; op: number }[],
): string {
  const r = rng(seed);
  let out = '';
  spec.forEach((s, si) => {
    let d = '';
    for (let i = 0; i < s.count; i++) {
      const cx = area.x + r() * area.w;
      const cy = area.y + r() * area.h;
      const rr = s.rMin + r() * (s.rMax - s.rMin);
      d += blob(cx, cy, rr * (0.9 + r() * 0.6), rr * (0.6 + r() * 0.4), seed * 31 + si * 997 + i, 8 + Math.floor(r() * 4), 0.55);
    }
    out += `<path d="${d}" fill="${s.color}" fill-opacity="${s.op}"/>`;
  });
  return out;
}

/** Lớp vỏ lấm tấm (chấm trắng xám như vôi bám đá – ref5). Một path duy nhất. */
function speckle(seed: number, area: { x: number; y: number; w: number; h: number }, n: number, rMin: number, rMax: number, color: string, op: number): string {
  const r = rng(seed);
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = area.x + r() * area.w;
    const y = area.y + r() * area.h;
    const rr = rMin + r() * (rMax - rMin);
    d += `M${(x - rr).toFixed(1)} ${y.toFixed(1)}a${rr.toFixed(2)} ${(rr * 0.8).toFixed(2)} 0 1 0 ${(2 * rr).toFixed(2)} 0a${rr.toFixed(2)} ${(rr * 0.8).toFixed(2)} 0 1 0 ${(-2 * rr).toFixed(2)} 0`;
  }
  return `<path d="${d}" fill="${color}" fill-opacity="${op}"/>`;
}

// ---------- U bướu ----------
const WART_COLORS = [STONE_L, '#8a6a5e', CRUST, PINK, MOSS, BRICK, '#6f574f', '#b49a86'];

/** Một u bướu: khối méo + sáng trên-trái + bóng dưới-phải (mờ, không bóng loáng). */
function wart(x: number, y: number, rad: number, color: string, seed: number, op = 0.75): string {
  const d = blob(x, y, rad, rad * 0.8, seed, 7, 0.35);
  return `<path d="${d}" fill="${color}" fill-opacity="${op}"/><path d="${d}" fill="${u.url('wart')}"/>`;
}

function bodyWarts(): string {
  const r = rng(913);
  const pts: [number, number, number][] = [];
  let tries = 0;
  while (pts.length < 95 && tries < 8000) {
    tries++;
    const x = 166 + r() * 436;
    const y = 128 + r() * 160;
    if (!inPoly(x, y, BODY_KEY)) continue;
    if (Math.hypot(x - 540, y - 129) < 20) continue; // chừa hốc mắt
    if (x > 556 && y > 140 && y < 210) continue; // chừa miệng
    const head = Math.max(0, Math.min(1, (x - 200) / 330));
    const low = Math.max(0, (y - backY(Math.min(x, 540))) / 140);
    const rad = (2.6 + r() * 5.5) * (0.5 + head * 0.75) * (1.15 - low * 0.5);
    if (pts.some(([px, py, pr]) => Math.hypot(px - x, py - y) < (pr + rad) * 0.8)) continue;
    pts.push([x, y, rad]);
  }
  return pts.map(([x, y, rad], i) => wart(x, y, rad, WART_COLORS[i % WART_COLORS.length], 500 + i, 0.5 + r() * 0.35)).join('');
}

/** Núm bướu nhô ra ở mép lưng/đỉnh đầu/hàm – phá đường viền như mép đá. */
function edgeKnobs(): string {
  const r = rng(57);
  let s = '';
  const top = BODY_PTS.slice(1, 4).concat(BODY_PTS.slice(6, 9));
  top.forEach(([x, y], i) => {
    s += wart(x + (r() - 0.5) * 6, y + 3, 4.5 + r() * 4, i % 3 === 0 ? CRUST : i % 3 === 1 ? STONE_L : PINK, 800 + i, 0.95);
  });
  const jaw: P[] = [[588, 240], [574, 256], [555, 270], [602, 214], [603, 186]];
  jaw.forEach(([x, y], i) => {
    s += wart(x, y, 3.5 + r() * 2.5, i % 2 ? CRUST : STONE_L, 820 + i, 0.9);
  });
  return s;
}

/** Tảo lông mảnh bám mép trên (rêu). */
function fuzz(seed: number, line: P[], n: number, len: number, colors: string[]): string {
  const r = rng(seed);
  const paths: string[] = colors.map(() => '');
  for (let i = 0; i < n; i++) {
    const t = r() * (line.length - 1);
    const k = Math.floor(t);
    const f = t - k;
    const [x1, y1] = line[k];
    const [x2, y2] = line[Math.min(k + 1, line.length - 1)];
    const x = x1 + (x2 - x1) * f;
    const y = y1 + (y2 - y1) * f + 2;
    const a = -Math.PI / 2 + (r() - 0.5) * 1.8;
    const L = len * (0.4 + r() * 0.8);
    const cx = x + Math.cos(a + 0.5) * L * 0.5;
    const cy = y + Math.sin(a + 0.5) * L * 0.5;
    paths[i % colors.length] += `M${x.toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${(x + Math.cos(a) * L).toFixed(1)} ${(y + Math.sin(a) * L).toFixed(1)}`;
  }
  return colors
    .map((c, i) => `<path d="${paths[i]}" fill="none" stroke="${c}" stroke-width="0.9" stroke-opacity="0.7" stroke-linecap="round"/>`)
    .join('');
}

// ---------- Vây lưng: dải gai núm (13 gai) + vây mềm tròn ----------
const SPINES: { base: P; tip: P }[] = [];
function buildDorsal(): string {
  const heights = [24, 40, 47, 50, 46, 48, 43, 44, 39, 37, 31, 27, 18];
  const top: P[] = [];
  const r = rng(29);
  const x0 = 476;
  top.push([x0 + 10, backY(x0 + 10) + 4]);
  let x = x0;
  heights.forEach((h, i) => {
    const step = 13.5 + r() * 4;
    const by = backY(x);
    const tip: P = [x - 4, by - h - (r() - 0.5) * 6];
    SPINES.push({ base: [x, by + 6], tip });
    top.push(tip);
    // màng giữa hai gai: thịt dày, khía nông
    const nx = x - step * 0.52;
    const hn = Math.min(h, heights[i + 1] ?? h * 0.6);
    top.push([nx, backY(nx) - hn * (0.72 + r() * 0.12)]);
    x -= step;
  });
  // vây mềm phía sau: tròn, mép gợn
  const soft: P[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const sx = 262 - t * 92;
    const h = 46 * Math.sin(Math.PI * (0.25 + 0.75 * t)) ** 0.8 + 4;
    soft.push([sx, backY(sx) - h + (i % 2 ? 2.5 : 0)]);
  }
  top.push(...soft, [166, backY(166) + 5]);
  const base: P[] = [[180, backY(180) + 10], [300, backY(300) + 12], [420, backY(420) + 12], [482, backY(482) + 10]];
  return smoothPath([...top, ...base], true, 0.5);
}
const DORSAL = buildDorsal();

// ---------- Vây dạng quạt (đuôi, hậu môn, ngực, bụng) ----------
function fanFin(o: {
  base0: P;
  base1: P;
  center: P;
  a0: number;
  a1: number;
  n: number;
  len: (t: number) => number;
  floor?: number;
  notch?: number;
  seed: number;
}): { d: string; tips: P[]; bases: P[] } {
  const r = rng(o.seed);
  const [cx, cy] = o.center;
  const clampL = (ang: number, L: number) => {
    if (o.floor === undefined || Math.sin(ang) <= 0.05) return L;
    const maxL = (o.floor - cy) / Math.sin(ang);
    // tì đáy mềm: nén dần thay vì cắt phẳng
    return L > maxL ? maxL + (L - maxL) * 0.08 : L;
  };
  const tips: P[] = [];
  const bases: P[] = [];
  const pts: P[] = [o.base0];
  for (let i = 0; i < o.n; i++) {
    const t = i / (o.n - 1);
    const ang = ((o.a0 + (o.a1 - o.a0) * t) * Math.PI) / 180;
    const L = clampL(ang, o.len(t) * (0.97 + r() * 0.06));
    const tip: P = [cx + Math.cos(ang) * L, cy + Math.sin(ang) * L];
    tips.push(tip);
    bases.push([o.base0[0] + (o.base1[0] - o.base0[0]) * t, o.base0[1] + (o.base1[1] - o.base0[1]) * t]);
    pts.push(tip);
    if (i < o.n - 1) {
      const tm = t + 0.5 / (o.n - 1);
      const angM = ((o.a0 + (o.a1 - o.a0) * tm) * Math.PI) / 180;
      const Lm = clampL(angM, o.len(tm)) * (o.notch ?? 0.94);
      pts.push([cx + Math.cos(angM) * Lm, cy + Math.sin(angM) * Lm]);
    }
  }
  pts.push(o.base1);
  return { d: smoothPath(pts, true, 0.55), tips, bases };
}

const CAUDAL = fanFin({
  base0: [170, 191],
  base1: [170, 233],
  center: [176, 212],
  a0: 216,
  a1: 144,
  n: 12,
  len: (t) => 96 + Math.sin(Math.PI * t) ** 0.6 * 18,
  notch: 0.95,
  seed: 5,
});

const ANAL = fanFin({
  base0: [294, 264],
  base1: [212, 244],
  center: [262, 238],
  a0: 92,
  a1: 160,
  n: 8,
  len: (t) => 50 + Math.sin(Math.PI * t) * 12,
  floor: BOTTOM - 3,
  seed: 8,
});

const PEC_PIVOT: P = [456, 232];
const PECTORAL = fanFin({
  base0: [462, 258],
  base1: [450, 210],
  center: PEC_PIVOT,
  a0: 78,
  a1: 204,
  n: 16,
  len: (t) => 70 + Math.sin(Math.PI * Math.min(1, t * 1.08)) ** 0.7 * 66,
  floor: BOTTOM,
  notch: 0.93,
  seed: 13,
});

const PELVIC_FAR = fanFin({
  base0: [540, 270],
  base1: [500, 276],
  center: [520, 266],
  a0: 55,
  a1: 125,
  n: 6,
  len: () => 40,
  floor: BOTTOM - 1,
  seed: 21,
});

/** Vây thịt dày: nền gradient + mảng loang + tia nổi như gờ + núm ở ngọn tia. */
function fleshyFin(
  fin: { d: string; tips: P[]; bases: P[] },
  fill: string,
  clipId: string,
  seed: number,
  area: { x: number; y: number; w: number; h: number },
  o: { op?: number; rayW?: number; from?: number } = {},
): string {
  const r = rng(seed);
  const from = o.from ?? 0;
  const rays = fin.bases.map((b, i) => {
    const t = fin.tips[i];
    const s: P = [b[0] + (t[0] - b[0]) * from, b[1] + (t[1] - b[1]) * from];
    const e: P = [b[0] + (t[0] - b[0]) * 0.94, b[1] + (t[1] - b[1]) * 0.94];
    return [s, e] as [P, P];
  });
  let tipWarts = '';
  fin.tips.forEach(([x, y], i) => {
    const b = fin.bases[i];
    tipWarts += wart(b[0] + (x - b[0]) * 0.88, b[1] + (y - b[1]) * 0.88, 2 + r() * 1.8, i % 3 ? STONE_L : CRUST, seed * 7 + i, 0.75);
  });
  return (
    `<g filter="${u.url('stoneFin')}">` +
    `<path d="${fin.d}" fill="${fill}" fill-opacity="${o.op ?? 0.95}"/>` +
    `<g clip-path="${u.url(clipId)}">` +
    patches(seed, area, [
      { color: STONE_D, count: 5, rMin: 7, rMax: 14, op: 0.45 },
      { color: BRICK, count: 5, rMin: 6, rMax: 13, op: 0.5 },
      { color: MOSS, count: 5, rMin: 5, rMax: 11, op: 0.45 },
      { color: CRUST, count: 7, rMin: 3, rMax: 8, op: 0.45 },
    ]) +
    speckle(seed + 3, area, 70, 0.6, 1.5, CRUST, 0.5) +
    finRays(rays.map((x) => x[0]), rays.map((x) => x[1]), { color: '#2a1a16', opacity: 0.38, width: o.rayW ?? 2.4, bend: 0.04 }) +
    finRays(rays.map((x) => [x[0][0] + 0.9, x[0][1] - 0.9] as P), rays.map((x) => [x[1][0] + 0.9, x[1][1] - 0.9] as P), { color: CRUST, opacity: 0.28, width: 0.9, bend: 0.04 }) +
    tipWarts +
    `</g>` +
    `<path d="${fin.d}" fill="none" stroke="${CRUST}" stroke-opacity="0.2" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="${fin.d}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.55" stroke-width="1.4" stroke-linejoin="round"/>` +
    `</g>`
  );
}

// ---------- Defs ----------
const body = standardBody(u, BODY, {
  dorsal: '#6e554c',
  flank: '#80635a',
  belly: '#a58a7b',
  outlineColor: OUTLINE,
  scales: false,
  flankAt: 0.48,
  rimOpacity: 0.4,
});

const theEye = eye(u, 'eye', {
  cx: 541,
  cy: 128,
  r: 5.6,
  iris: ['#f08a3c', '#7a1c10'],
  look: [0.4, -0.1],
});

/**
 * Bộ lọc "đá": nhiễu làm méo nhẹ mép hình (viền lởm chởm như đá phủ rêu)
 * rồi nhân vân hạt sần. Rasterize một lần khi nướng texture.
 */
function stoneFilter(id: string, o: { freq: number; disp: number; grain: number; k: number; seed: number }): string {
  return (
    `<filter id="${id}" x="-4%" y="-6%" width="108%" height="112%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${o.freq}" numOctaves="3" seed="${o.seed}" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="${o.disp}" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
    `<feTurbulence type="fractalNoise" baseFrequency="${o.grain}" numOctaves="4" seed="${o.seed + 7}" result="n2"/>` +
    `<feColorMatrix in="n2" type="saturate" values="0" result="g0"/>` +
    `<feComponentTransfer in="g0" result="g"><feFuncR type="linear" slope="1.9" intercept="-0.25"/><feFuncG type="linear" slope="1.9" intercept="-0.25"/><feFuncB type="linear" slope="1.9" intercept="-0.25"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer>` +
    `<feBlend in="d" in2="g" mode="multiply" result="m"/>` +
    `<feComposite in="m" in2="d" operator="arithmetic" k1="0" k2="${o.k}" k3="${1 - o.k}" k4="0" result="mx"/>` +
    `<feComposite in="mx" in2="d" operator="in"/>` +
    `</filter>`
  );
}

const defs = joinDefs(
  body,
  theEye,
  stoneFilter(u('stone'), { freq: 0.045, disp: 7, grain: 0.14, k: 0.45, seed: 4 }),
  stoneFilter(u('stoneFin'), { freq: 0.06, disp: 5, grain: 0.16, k: 0.38, seed: 12 }),
  blurFilter(u('soft'), 2.5),
  blurFilter(u('soft6'), 6),
  radial(
    u('wart'),
    [
      [0, '#fbf1df', 0.42],
      [0.4, '#fbf1df', 0.06],
      [0.72, '#000000', 0],
      [1, '#1a0f0c', 0.42],
    ],
    { cx: 0.48, cy: 0.45, r: 0.58, fx: 0.34, fy: 0.28 },
  ),
  radial(
    u('knob'),
    [
      [0, STONE_L],
      [0.6, STONE],
      [1, '#3e2c27'],
    ],
    { cx: 0.42, cy: 0.32, r: 0.68 },
  ),
  linear(
    u('dorsalFill'),
    [
      [0, '#9c7f6c'],
      [0.55, '#7a5e55'],
      [1, '#5c4540'],
    ],
    { user: true, x1: 0, y1: 85, x2: 0, y2: 190 },
  ),
  radial(
    u('caudalFill'),
    [
      [0, '#5a433d'],
      [0.6, '#7a5e55'],
      [1, '#9a7e6e'],
    ],
    { user: true, cx: 176, cy: 212, r: 115 },
  ),
  radial(
    u('pecFill'),
    [
      [0, '#5e463f'],
      [0.5, '#7d6156'],
      [1, '#a08676'],
    ],
    { user: true, cx: PEC_PIVOT[0], cy: PEC_PIVOT[1], r: 140 },
  ),
  linear(u('lip'), [
    [0, '#f2d8c4'],
    [1, '#c98f86'],
  ]),
  clip(u('dorsalClip'), DORSAL),
  clip(u('caudalClip'), CAUDAL.d),
  clip(u('analClip'), ANAL.d),
  clip(u('pecClip'), PECTORAL.d),
  clip(u('pelClip'), PELVIC_FAR.d),
);

// ---------- Lớp ----------
function dorsalLayer(): string {
  const r = rng(71);
  let ridges = '';
  let hi = '';
  let tips = '';
  SPINES.forEach(({ base, tip }, i) => {
    const mx = (base[0] + tip[0]) / 2 + 2;
    const my = (base[1] + tip[1]) / 2;
    ridges += `M${base[0].toFixed(1)} ${base[1].toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${tip[0].toFixed(1)} ${(tip[1] + 5).toFixed(1)}`;
    hi += `M${(base[0] + 1.8).toFixed(1)} ${(base[1] - 2).toFixed(1)}Q${(mx + 1.8).toFixed(1)} ${my.toFixed(1)} ${(tip[0] + 1.6).toFixed(1)} ${(tip[1] + 6).toFixed(1)}`;
    tips += wart(tip[0], tip[1] + 4, 3.6 + r() * 2.2, i % 4 === 0 ? PINK : i % 4 === 2 ? CRUST : STONE_L, 900 + i, 0.9);
  });
  return (
    `<g filter="${u.url('stoneFin')}">` +
    `<path d="${DORSAL}" fill="${u.url('dorsalFill')}"/>` +
    `<g clip-path="${u.url('dorsalClip')}">` +
    patches(301, { x: 166, y: 80, w: 320, h: 110 }, [
      { color: STONE_D, count: 6, rMin: 8, rMax: 16, op: 0.4 },
      { color: BRICK, count: 7, rMin: 7, rMax: 15, op: 0.5 },
      { color: MOSS, count: 8, rMin: 6, rMax: 13, op: 0.5 },
      { color: CRUST, count: 9, rMin: 3, rMax: 9, op: 0.45 },
      { color: PINK, count: 4, rMin: 5, rMax: 10, op: 0.35 },
    ]) +
    speckle(302, { x: 166, y: 80, w: 320, h: 110 }, 140, 0.6, 1.6, CRUST, 0.45) +
    `<path d="${ridges}" fill="none" stroke="#2a1a16" stroke-opacity="0.42" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="${hi}" fill="none" stroke="${CRUST}" stroke-opacity="0.26" stroke-width="1.1" stroke-linecap="round"/>` +
    tips +
    `</g>` +
    `<path d="${DORSAL}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.55" stroke-width="1.5" stroke-linejoin="round"/>` +
    `</g>`
  );
}

function bodyLayer(): string {
  return (
    `<g filter="${u.url('stone')}">` +
    body.base +
    `<g clip-path="${u.url('bodyClip')}">` +
    // vùng lớn: lưng sáng màu vỏ vôi, má hồng tảo, sườn rêu
    `<path d="${blob(470, 160, 120, 34, 7, 12, 0.3)}" fill="${CRUST}" fill-opacity="0.22"/>` +
    `<path d="${blob(548, 205, 46, 52, 9, 11, 0.3)}" fill="${PINK}" fill-opacity="0.3"/>` +
    `<path d="${blob(300, 220, 90, 30, 11, 12, 0.35)}" fill="${MOSS_D}" fill-opacity="0.25"/>` +
    patches(17, { x: 150, y: 120, w: 460, h: 170 }, [
      { color: STONE_D, count: 10, rMin: 12, rMax: 26, op: 0.42 },
      { color: BRICK, count: 12, rMin: 8, rMax: 22, op: 0.55 },
      { color: PINK, count: 7, rMin: 8, rMax: 18, op: 0.4 },
      { color: MOSS_D, count: 7, rMin: 7, rMax: 16, op: 0.45 },
      { color: MOSS, count: 10, rMin: 5, rMax: 14, op: 0.55 },
      { color: CRUST, count: 16, rMin: 4, rMax: 11, op: 0.5 },
    ]) +
    // đốm cam / hổ phách nổi bật (ref3, ref5)
    patches(88, { x: 250, y: 165, w: 300, h: 95 }, [
      { color: ORANGE, count: 6, rMin: 4, rMax: 9, op: 0.8 },
      { color: AMBER, count: 5, rMin: 3, rMax: 7, op: 0.8 },
    ]) +
    speckle(19, { x: 150, y: 120, w: 460, h: 170 }, 420, 0.6, 1.7, CRUST, 0.55) +
    speckle(23, { x: 150, y: 120, w: 460, h: 170 }, 160, 0.8, 2, '#2a1a16', 0.35) +
    bodyWarts() +
    // bóng tối dưới bụng chỗ tì đáy
    `<path d="M170 244Q330 300 590 266L600 306L160 306Z" fill="#1a0f0c" opacity="0.34" filter="${u.url('soft6')}"/>` +
    `</g>` +
    body.overlay +
    `</g>`
  );
}

function headLayer(): string {
  // gờ xương quanh mắt – mắt nằm sâu trong hốc
  const knobD = blob(540, 131, 16, 12.5, 404, 10, 0.25);
  const knob =
    `<path d="${knobD}" fill="${u.url('knob')}"/>` +
    `<path d="${knobD}" fill="${u.url('wart')}" opacity="0.6"/>` +
    `<ellipse cx="541" cy="128.5" rx="8.4" ry="7.4" fill="#1a0e0b" opacity="0.8"/>`;
  // mí thịt che nửa trên mắt + tua nhỏ
  const lid =
    `<path d="M532.5 126Q541 117 550 125Q546 123 541 123Q536 123 532.5 126Z" fill="${STONE}" stroke="${OUTLINE}" stroke-opacity="0.5" stroke-width="0.6"/>` +
    `<path d="M538 121L536 113L541 120M544 121L547 114L546 122" fill="${STONE_L}" stroke="${OUTLINE}" stroke-opacity="0.45" stroke-width="0.5"/>`;
  // hõm lõm sau mắt + rãnh giữa hai mắt
  const pit =
    `<ellipse cx="510" cy="151" rx="15" ry="8" fill="#1e110e" opacity="0.5" filter="${u.url('soft')}"/>` +
    `<path d="M497 157Q510 163 525 154" fill="none" stroke="${CRUST}" stroke-opacity="0.32" stroke-width="1.2"/>`;
  // miệng rộng hướng lên trên: khe tối mảnh + môi trên & hàm dưới hếch có viền sáng
  const mouth =
    `<path d="M588 146Q578 166 568 184Q563 193 558 199" fill="none" stroke="#1a0b09" stroke-opacity="0.9" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="M585 145Q575 165 565 182Q560 191 555 196" fill="none" stroke="${u.url('lip')}" stroke-opacity="0.75" stroke-width="1.6" stroke-linecap="round"/>` +
    `<path d="M593 149Q584 169 574 187Q568 197 562 203" fill="none" stroke="${u.url('lip')}" stroke-opacity="0.9" stroke-width="2.2" stroke-linecap="round"/>` +
    `<path d="M598 157Q591 176 581 194Q575 203 569 209" fill="none" stroke="${BRICK}" stroke-opacity="0.45" stroke-width="1.3" stroke-linecap="round"/>` +
    `<path d="M556 197Q552 201 553 206" fill="none" stroke="#1a0b09" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round"/>`;
  // nắp mang (đường đứt, gờ sần) + gờ má
  const gill =
    `<path d="M490 152C480 178 474 206 477 230M478 238C479 248 482 256 486 264" fill="none" stroke="#1e110e" stroke-opacity="0.45" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M494 154C484 180 478 207 481 230M482 238C483 247 486 255 490 262" fill="none" stroke="${CRUST}" stroke-opacity="0.25" stroke-width="1.1" stroke-linecap="round"/>` +
    `<path d="M530 152C518 176 516 208 530 246" fill="none" stroke="#1e110e" stroke-opacity="0.22" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M553 139Q570 141 585 149" fill="none" stroke="${CRUST}" stroke-opacity="0.32" stroke-width="2" stroke-linecap="round"/>`;
  // tua da nhỏ dưới hàm & mép mang
  const r = rng(66);
  let cirri = '';
  const spots: P[] = [[594, 228], [586, 244], [574, 258], [560, 268], [478, 232], [480, 250], [488, 206], [603, 202]];
  spots.forEach(([x, y]) => {
    const a = Math.PI * 0.35 + (r() - 0.5) * 1.2;
    const L = 4 + r() * 5;
    cirri += `M${x} ${y}L${(x + Math.cos(a) * L - 1.5).toFixed(1)} ${(y + Math.sin(a) * L).toFixed(1)}L${(x + 2).toFixed(1)} ${(y + 0.5).toFixed(1)}Z`;
  });
  return (
    pit +
    gill +
    mouth +
    knob +
    `<path d="${cirri}" fill="${STONE_L}" stroke="${OUTLINE}" stroke-opacity="0.45" stroke-width="0.6"/>` +
    `<!--lid-->` +
    lid
  );
}

function topFuzz(): string {
  const line = BODY_PTS.slice(0, 9);
  const crest: P[] = SPINES.map((s) => [s.tip[0], s.tip[1] + 3]);
  return fuzz(7, line, 40, 7, [MOSS, CRUST, '#b8c070']) + fuzz(9, crest, 46, 6, [MOSS, CRUST, PINK]);
}

const art: CreatureArt = {
  id: 'ca_mat_quy',
  viewBox: [640, 340],
  lengthUnits: 552,
  spineY: 214,
  animation: 'fish',
  cycleHz: 0.28,
  bendAmp: 2.2,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'groundShadow',
      role: 'detail',
      cardOnly: true,
      svg: `<ellipse cx="350" cy="${BOTTOM + 3}" rx="292" ry="12" fill="#06141c" opacity="0.42" filter="${u.url('soft6')}"/>`,
    },
    {
      // vây bụng/ngực phía xa ló dưới cằm, tì đáy
      name: 'pelvicFar',
      role: 'fin',
      z: 'back',
      pivot: [520, 268],
      anim: { type: 'rotate', amp: 0.015, speed: 0.5, phase: 1.4 },
      svg: fleshyFin(PELVIC_FAR, u.url('caudalFill'), 'pelClip', 71, { x: 490, y: 262, w: 60, h: 40 }, { rayW: 1.6 }) +
        `<path d="${PELVIC_FAR.d}" fill="#120806" opacity="0.3"/>`,
    },
    {
      name: 'caudal',
      role: 'tail',
      svg: fleshyFin(CAUDAL, u.url('caudalFill'), 'caudalClip', 51, { x: 56, y: 140, w: 124, h: 150 }, { from: 0.1 }),
    },
    {
      name: 'anal',
      role: 'detail',
      svg: fleshyFin(ANAL, u.url('caudalFill'), 'analClip', 61, { x: 200, y: 236, w: 100, h: 66 }, { rayW: 2 }),
    },
    { name: 'dorsal', role: 'detail', svg: dorsalLayer() },
    { name: 'body', role: 'body', svg: bodyLayer() },
    { name: 'knobs', role: 'pattern', svg: edgeKnobs() },
    { name: 'head', role: 'detail', svg: headLayer() },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    { name: 'fuzz', role: 'detail', svg: topFuzz() },
    {
      name: 'pectoral',
      role: 'fin',
      z: 'front',
      pivot: PEC_PIVOT,
      anim: { type: 'rotate', amp: 0.025, speed: 0.6 },
      svg:
        // bóng đổ mềm của vây lên thân
        `<path d="${PECTORAL.d}" fill="#120806" opacity="0.32" transform="translate(4 5)" filter="${u.url('soft')}"/>` +
        fleshyFin(PECTORAL, u.url('pecFill'), 'pecClip', 81, { x: 310, y: 180, w: 160, h: 125 }, { rayW: 2.4, from: 0.22 }),
    },
  ],
};

export default art;
