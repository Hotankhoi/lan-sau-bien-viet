/**
 * Cá dìa (cá dìa công / cá dìa chấm) – Siganus guttatus
 * Đặc điểm nhận dạng: thân dẹt bên hình bầu dục cao; mõm nhỏ tù như mõm thỏ, miệng bé ở mút mõm;
 * nền xám bạc – xanh ô liu phủ dày chấm tròn cam vàng (sau nắp mang chấm kéo thành vân giun);
 * ĐỐM VÀNG LỚN ở thân dưới phần sau vây lưng; đầu vàng ô liu có vân lượn xanh lam;
 * vây lưng dài 13 gai nhọn (có nọc) + 10 tia mềm; vây hậu môn 7 gai; vây bụng 2 gai kẹp tia mềm;
 * vây đuôi rộng, mép sau hơi lõm.
 */
import type { CreatureArt } from '../contract';
import { makeIds, standardBody, eye, linear, radial, joinDefs, rng, mix, finRays, blurFilter, smoothPath } from '../style-bible';

const u = makeIds('ca_dia');

type P = [number, number];
const f = (n: number): string => n.toFixed(1);
const poly = (pts: P[]): string => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join('');

// ---------- Đường viền thân (đầu bên phải) ----------
const OUTLINE: P[] = [
  [539, 177], // mút mõm
  [535, 166],
  [526, 151],
  [514, 131],
  [497, 111],
  [474, 94],
  [444, 81],
  [404, 72],
  [356, 68],
  [306, 72],
  [256, 84],
  [208, 102],
  [164, 122],
  [134, 136],
  [116, 142],
  [104, 143], // gốc đuôi trên
  [104, 186], // gốc đuôi dưới
  [116, 186],
  [134, 190],
  [160, 200],
  [204, 222],
  [252, 242],
  [302, 254],
  [352, 258],
  [400, 252],
  [440, 240],
  [474, 225],
  [503, 208],
  [524, 195],
  [536, 187], // môi dưới
];
const BODY = smoothPath(OUTLINE, true, 0.55);

/** Lấy mẫu dày đường Catmull-Rom (cùng công thức smoothPath) để tra mép thân. */
function sampleClosed(pts: P[], tension: number, n = 10): P[] {
  const p = [pts[pts.length - 1], ...pts, pts[0], pts[1]];
  const out: P[] = [];
  const k = tension / 3;
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    const c1: P = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: P = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    for (let s = 0; s < n; s++) {
      const t = s / n;
      const m = 1 - t;
      out.push([
        m * m * m * p1[0] + 3 * m * m * t * c1[0] + 3 * m * t * t * c2[0] + t * t * t * p2[0],
        m * m * m * p1[1] + 3 * m * m * t * c1[1] + 3 * m * t * t * c2[1] + t * t * t * p2[1],
      ]);
    }
  }
  return out;
}
const SAMPLES = sampleClosed(OUTLINE, 0.55);
const TOP_N = 15 * 10; // 15 đoạn đầu (mõm → gốc đuôi trên) là mép lưng
const TOP = SAMPLES.slice(0, TOP_N + 1);
const BOT = SAMPLES.slice(16 * 10).concat([SAMPLES[0]]).reverse(); // mõm → gốc đuôi dưới (x giảm)

function edgeY(line: P[], x: number): number {
  for (let i = 0; i < line.length - 1; i++) {
    const [x1, y1] = line[i];
    const [x2, y2] = line[i + 1];
    if ((x <= x1 && x >= x2) || (x >= x1 && x <= x2)) {
      if (x1 === x2) return y1;
      return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
    }
  }
  return 165;
}
const topY = (x: number): number => edgeY(TOP, x);
const botY = (x: number): number => edgeY(BOT, x);

function inside(x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = SAMPLES.length - 1; i < SAMPLES.length; j = i++) {
    const [xi, yi] = SAMPLES[i];
    const [xj, yj] = SAMPLES[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// ---------- Mốc giải phẫu ----------
const EYE: P = [492, 150];
/** Mép nắp mang: ranh giới đầu (vân xanh) / thân (chấm cam). */
const GILL = 'M462 86C451 116 444 152 446 186C448 206 456 222 468 230';
const gillX = (y: number): number => {
  // xấp xỉ mép nắp mang theo y
  const t = Math.max(0, Math.min(1, (y - 86) / (230 - 86)));
  return 462 - 18 * Math.sin(Math.PI * t * 0.95) + (t > 0.7 ? (t - 0.7) * 30 : 0);
};
const HEAD_CLIP = `${GILL}L560 230L560 86Z`;
const TRUNK_CLIP = `${GILL}L90 300L90 40L462 40Z`;

/** Đốm vàng lớn dưới phần sau vây lưng. */
const SADDLE: P = [190, 124];
const SADDLE_D =
  'M171 121C169 112 176 105 187 104C196 103 205 106 209 113C213 120 210 130 202 135C195 139 186 139 179 135C174 132 172 127 171 121Z';

// ---------- Màu ----------
const OLIVE = '#6f7b4c';
const OUTLINE_C = '#3b4430';
const ORANGE = '#e08a34';
const ORANGE_D = '#b8742c';
const ORANGE_B = '#d9a07a';
const FIN_EDGE = '#e8c45a';
const SPINE = '#efe5b4';
const SPINE_D = '#6e6a3c';

// ---------- Chấm tròn cam vàng ----------
function bodySpots(): string {
  const r = rng(4242);
  const gap = 9.6;
  const rowH = gap * 0.87;
  const out: string[] = [];
  let row = 0;
  for (let y = 66; y < 262; y += rowH, row++) {
    for (let x = 100 + (row % 2 ? gap / 2 : 0); x < 470; x += gap) {
      const jx = x + (r() - 0.5) * 2.6;
      const jy = y + (r() - 0.5) * 2.4;
      if (!inside(jx, jy)) continue;
      if (jx > gillX(jy) + 2) continue;
      // chừa đốm vàng (có viền nền bạc mảnh quanh)
      const ex = (jx - SADDLE[0]) / 22;
      const ey = (jy - SADDLE[1]) / 18;
      if (ex * ex + ey * ey < 1) continue;
      const t = topY(jx);
      const b = botY(jx);
      const v = Math.max(0, Math.min(1, (jy - t) / Math.max(1, b - t))); // 0 lưng → 1 bụng
      // to nhất giữa thân, nhỏ dần về cuống đuôi và bụng
      const along = Math.max(0, Math.min(1, (jx - 104) / 120));
      let rad = (2.05 + 1.35 * along) * (1 - 0.35 * Math.max(0, v - 0.6) / 0.4) * (0.88 + r() * 0.24);
      if (v > 0.9) rad *= 0.8;
      if (v < 0.14) rad *= 0.8;
      let col = v < 0.5 ? mix(ORANGE_D, ORANGE, Math.min(1, v / 0.35)) : mix(ORANGE, ORANGE_B, Math.max(0, (v - 0.62) / 0.38));
      const op = v > 0.75 ? 0.95 - (v - 0.75) * 1.6 : 0.95;
      // vùng sau nắp mang: chấm kéo dài thành vân giun
      const near = Math.max(0, Math.min(1, (jx - (gillX(jy) - 55)) / 50));
      if (near > 0.05) {
        const ang = (r() - 0.5) * 140;
        const rx = rad * (1 + near * (0.5 + r() * 0.6));
        const ry = rad * (1 - near * 0.25);
        col = mix(col, '#d0962e', near * 0.4);
        out.push(
          `<ellipse cx="${f(jx)}" cy="${f(jy)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${ang.toFixed(0)} ${f(jx)} ${f(jy)})" fill="${col}" fill-opacity="${op.toFixed(2)}"/>`,
        );
      } else {
        out.push(`<circle cx="${f(jx)}" cy="${f(jy)}" r="${f(rad)}" fill="${col}" fill-opacity="${op.toFixed(2)}"/>`);
      }
    }
  }
  return `<g>${out.join('')}</g>`;
}

// ---------- Đầu: nền vàng ô liu + vân lượn xanh lam ----------
function headPattern(): string {
  const r = rng(909);
  let lines = '';
  // dải vân chạy từ mõm ra sau, xòe nhẹ quanh mắt
  for (let i = 0; i < 15; i++) {
    const y0 = 112 + i * 7.6;
    const pts: P[] = [];
    const ph = r() * 6;
    const fq = 9 + r() * 6;
    for (let k = 0; k <= 10; k++) {
      const s = k / 10;
      const x = 540 - s * 100;
      let y = y0 + (y0 - 160) * 0.25 * s + Math.sin(s * fq + ph) * 1.9;
      // tránh mắt: đẩy vân vòng quanh
      const dx = x - EYE[0];
      const dy = y - EYE[1];
      const d = Math.hypot(dx, dy);
      if (d < 21) y = EYE[1] + (dy >= 0 ? 1 : -1) * Math.sqrt(Math.max(0, 21 * 21 - dx * dx));
      pts.push([x, y]);
    }
    // ngắt quãng ngẫu nhiên để thành vân mê cung
    const cut = 2 + Math.floor(r() * 6);
    const a = pts.slice(0, cut + 1);
    const b = pts.slice(cut + 1);
    lines += `<path d="${smoothPath(a)}"/>`;
    if (b.length > 1) lines += `<path d="${smoothPath(b)}"/>`;
  }
  // vòng quanh mắt
  lines += `<circle cx="${EYE[0]}" cy="${EYE[1]}" r="23" stroke-dasharray="14 5 22 6"/>`;
  lines += `<path d="M470 140C474 128 484 122 496 122"/><path d="M508 164C506 176 498 182 486 184"/>`;
  // chấm xanh lẻ
  let dots = '';
  for (let i = 0; i < 16; i++) {
    const x = 452 + r() * 80;
    const y = 112 + r() * 104;
    if (Math.hypot(x - EYE[0], y - EYE[1]) < 20) continue;
    dots += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1 + r() * 0.9)}"/>`;
  }
  return (
    `<rect x="430" y="60" width="130" height="200" fill="${u.url('head')}"/>` +
    `<g fill="none" stroke="#2e7f8f" stroke-opacity="0.3" stroke-width="2.6" stroke-linecap="round">${lines}</g>` +
    `<g fill="none" stroke="#9be6f2" stroke-opacity="0.95" stroke-width="1.35" stroke-linecap="round">${lines}</g>` +
    `<g fill="#b9f0f8" fill-opacity="0.9">${dots}</g>`
  );
}

// ---------- Vây lưng & vây hậu môn: gai nhọn có màng khía + phần tia mềm ----------
interface FinSpec {
  /** x gốc các gai (từ trước ra sau) */
  spineX: number[];
  spineLen: number[];
  /** góc ngả về sau so với phương thẳng đứng (độ), đầu → cuối */
  lean: [number, number];
  softX: [number, number];
  softRays: number;
  softH: number;
  softLean: [number, number];
  dir: 1 | -1; // -1: hướng lên (vây lưng), 1: hướng xuống (vây hậu môn)
  edgeY: (x: number) => number;
  inset: number;
}

function spinyFin(s: FinSpec): { membrane: string; spines: string; rays: string; edge: string } {
  const base = (x: number): P => [x, s.edgeY(x) - s.dir * s.inset];
  const dirv = (lean: number): P => {
    const a = (lean * Math.PI) / 180;
    return [-Math.sin(a), s.dir * Math.cos(a)];
  };
  const n = s.spineX.length;
  const spines: { b: P; d: P; L: number; at: (t: number) => P }[] = [];
  for (let i = 0; i < n; i++) {
    const lean = s.lean[0] + ((s.lean[1] - s.lean[0]) * i) / Math.max(1, n - 1);
    const b = base(s.spineX[i]);
    const d = dirv(lean);
    const L = s.spineLen[i];
    const bow = L * 0.06;
    const at = (t: number): P => [b[0] + d[0] * L * t - bow * t * t, b[1] + d[1] * L * t];
    spines.push({ b, d, L, at });
  }
  // màng: bám mỗi gai tới ~76%, mép khía lõm giữa hai gai
  let mem = `M${f(spines[0].b[0])} ${f(spines[0].b[1])}`;
  const m0 = spines[0].at(0.8);
  mem += `L${f(m0[0])} ${f(m0[1])}`;
  const edgePts: string[] = [];
  let edgeD = `M${f(m0[0])} ${f(m0[1])}`;
  for (let i = 1; i < n; i++) {
    const a = spines[i - 1].at(0.8);
    const b = spines[i].at(0.74);
    const lo = spines[i].at(0.42);
    const c: P = [(a[0] + lo[0]) / 2 - 1, (a[1] + lo[1]) / 2];
    const seg = `Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`;
    mem += seg;
    edgeD += seg;
  }
  // phần tia mềm: mép tròn
  const last = spines[n - 1];
  const softTips: P[] = [];
  const softBases: P[] = [];
  for (let k = 0; k < s.softRays; k++) {
    const t = k / (s.softRays - 1);
    const x = s.softX[0] + (s.softX[1] - s.softX[0]) * t;
    const b = base(x);
    const lean = s.softLean[0] + (s.softLean[1] - s.softLean[0]) * t;
    const d = dirv(lean);
    const h = s.softH * (0.62 + 0.5 * Math.sin(Math.PI * (0.28 + 0.72 * t))) * (t > 0.85 ? 1 - (t - 0.85) * 2.8 : 1);
    softBases.push(b);
    softTips.push([b[0] + d[0] * h, b[1] + d[1] * h]);
  }
  const lastTop = last.at(0.76);
  const softEdge = smoothPath([lastTop, ...softTips], false, 0.6).replace(/^M[^C]*/, '');
  mem += softEdge;
  edgeD += softEdge;
  const endB = softBases[softBases.length - 1];
  mem += `L${f(endB[0] - 4)} ${f(endB[1])}`;
  // chân màng chạy ngầm trong thân
  const back: P[] = [];
  for (let x = endB[0] - 4; x <= spines[0].b[0]; x += 12) back.push([x, s.edgeY(x) + s.dir * -(s.inset + 6)]);
  back.push([spines[0].b[0], spines[0].b[1] + s.dir * -6]);
  mem += back.map(([x, y]) => `L${f(x)} ${f(y)}`).join('') + 'Z';
  void edgePts;

  // gai: thuôn nhọn, sáng, viền sẫm; mũi gai vượt khỏi màng
  let sp = '';
  for (const g of spines) {
    const A: P[] = [];
    const B: P[] = [];
    const nx = -g.d[1];
    const ny = g.d[0];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      const w = 1.9 * (1 - t) + 0.08;
      const p = g.at(t);
      A.push([p[0] + nx * w, p[1] + ny * w]);
      B.push([p[0] - nx * w, p[1] - ny * w]);
    }
    sp += `<path d="${poly([...A, ...B.reverse()])}Z"/>`;
  }
  const rays = finRays(softBases, softTips.map((t, i) => {
    const b = softBases[i];
    return [b[0] + (t[0] - b[0]) * 0.96, b[1] + (t[1] - b[1]) * 0.96] as P;
  }), { color: '#3e4a52', opacity: 0.45, width: 0.9, bend: 0.04 });
  return { membrane: mem, spines: sp, rays, edge: edgeD };
}

const DORSAL = spinyFin({
  spineX: Array.from({ length: 13 }, (_, i) => 452 - i * 17.2),
  spineLen: [24, 34, 42, 46, 47, 46, 44, 42, 40, 38, 37, 36, 36],
  lean: [16, 40],
  softX: [228, 140],
  softRays: 10,
  softH: 46,
  softLean: [38, 54],
  dir: -1,
  edgeY: topY,
  inset: 5,
});

const ANAL = spinyFin({
  spineX: Array.from({ length: 7 }, (_, i) => 344 - i * 15),
  spineLen: [20, 28, 32, 33, 32, 31, 30],
  lean: [34, 46],
  softX: [242, 146],
  softRays: 9,
  softH: 40,
  softLean: [42, 56],
  dir: 1,
  edgeY: botY,
  inset: 5,
});

function finSvg(fin: ReturnType<typeof spinyFin>, grad: string, clipName: string): string {
  return (
    `<path d="${fin.membrane}" fill="${u.url(grad)}"/>` +
    `<g clip-path="${u.url(clipName)}">${fin.rays}</g>` +
    `<path d="${fin.edge}" fill="none" stroke="${FIN_EDGE}" stroke-opacity="0.55" stroke-width="1.3" stroke-linejoin="round"/>` +
    `<path d="${fin.membrane}" fill="none" stroke="${OUTLINE_C}" stroke-opacity="0.35" stroke-width="0.8" stroke-linejoin="round"/>` +
    `<g fill="${SPINE}" stroke="${SPINE_D}" stroke-width="0.6" stroke-opacity="0.75" stroke-linejoin="round">${fin.spines}</g>`
  );
}

// ---------- Vây đuôi: rộng, mép sau hơi lõm ----------
const CAUDAL =
  'M122 144C112 141 102 138 94 134C76 124 52 108 25 97C28 104 33 124 37 144C40 156 41 172 38 186C34 206 29 224 26 236C52 224 76 208 94 196C102 191 112 187 122 186Z';
const CAUDAL_TIPS: P[] = [
  [27, 100], [31, 114], [35, 128], [38, 142], [40, 156], [40, 170], [38, 184], [35, 198], [31, 212], [28, 226], [27, 233],
];

function caudalSpots(): string {
  const r = rng(77);
  let s = '';
  for (let i = 0; i < 46; i++) {
    const x = 44 + r() * 64;
    const y = 106 + r() * 120;
    // trong vây (xấp xỉ hình quạt từ gốc)
    const tt = (114 - x) / 76;
    const half = 23 + tt * 46;
    if (Math.abs(y - 165) > half - 3 || tt < 0.05 || tt > 0.9) continue;
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.9 + r() * 0.9 + (1 - tt) * 0.8)}"/>`;
  }
  return `<g fill="${ORANGE}" fill-opacity="0.55">${s}</g>`;
}

// ---------- Vây ngực & vây bụng (tách rời, vẫy) ----------
const PEC_BASE: P = [448, 199];
const PECTORAL = 'M450 191C432 181 406 175 384 179C376 182 377 189 384 193C400 202 426 210 450 208Z';
const PEC_TIPS: P[] = [[388, 179], [384, 184], [383, 189], [388, 195], [399, 200], [414, 205], [430, 208]];

const PELVIC_BASE: P = [404, 249];
const PELVIC = 'M411 246C405 262 399 282 395 301C387 302 377 298 369 291C378 276 388 261 397 247Z';
const PELVIC_FAR = 'M418 244C414 260 410 276 408 292C402 293 396 290 390 286C396 272 404 258 410 244Z';

// ---------- Defs ----------
const body = standardBody(u, BODY, {
  dorsal: OLIVE,
  flank: '#cfe4ea',
  belly: '#eeebe4',
  outlineColor: OUTLINE_C,
  scales: { size: 5, color: '#ffffff', opacity: 0.1, stroke: 0.5 },
  flankAt: 0.46,
  rimOpacity: 0.8,
});

const theEye = eye(u, 'eye', {
  cx: EYE[0],
  cy: EYE[1],
  r: 13.5,
  iris: ['#f2cf96', '#8a5a2c'],
  socket: '#e9d488',
  look: [0.2, 0.05],
});

const defs = joinDefs(
  body,
  theEye,
  linear(
    u('head'),
    [
      [0, '#7f7c36'],
      [0.35, '#a99a3a'],
      [0.72, '#c9b45a'],
      [1, '#e2d7a8'],
    ],
    { user: true, x1: 0, y1: 80, x2: 0, y2: 232 },
  ),
  radial(
    u('saddle'),
    [
      [0, '#ffcf3c'],
      [0.55, '#f7b52a'],
      [0.9, '#eca21e'],
      [1, '#d98e1a'],
    ],
    { cx: 0.45, cy: 0.42, r: 0.6 },
  ),
  linear(
    u('dorsalFin'),
    [
      [0, '#a9bfca', 0.45],
      [0.6, '#8aa0a8', 0.55],
      [1, '#c2b45e', 0.8],
    ],
    { user: true, x1: 0, y1: 20, x2: 0, y2: 150 },
  ),
  linear(
    u('analFin'),
    [
      [0, '#c2b45e', 0.8],
      [0.4, '#8aa0a8', 0.55],
      [1, '#a9bfca', 0.5],
    ],
    { user: true, x1: 0, y1: 190, x2: 0, y2: 300 },
  ),
  linear(
    u('caudal'),
    [
      [0, '#c9dbe0', 0],
      [0.1, '#b3c6cd', 0.55],
      [0.2, '#9fb7c2', 0.82],
      [0.6, '#7f97a6', 0.7],
      [1, '#4e6474', 0.78],
    ],
    { user: true, x1: 122, y1: 0, x2: 24, y2: 0 },
  ),
  linear(
    u('pec'),
    [
      [0, '#eadb8e', 0.85],
      [1, '#d6e4e8', 0.62],
    ],
    { user: true, x1: 450, y1: 0, x2: 380, y2: 0 },
  ),
  linear(
    u('pelvic'),
    [
      [0, '#e6cf7a', 0.85],
      [1, '#d7c27a', 0.6],
    ],
  ),
  radial(
    u('gloss'),
    [
      [0, '#ffffff', 0.4],
      [1, '#ffffff', 0],
    ],
  ),
  blurFilter(u('soft'), 6),
  `<clipPath id="${u('headClip')}"><path d="${HEAD_CLIP}"/></clipPath>`,
  `<clipPath id="${u('trunkClip')}"><path d="${TRUNK_CLIP}"/></clipPath>`,
  `<clipPath id="${u('dorsalClip')}"><path d="${DORSAL.membrane}"/></clipPath>`,
  `<clipPath id="${u('analClip')}"><path d="${ANAL.membrane}"/></clipPath>`,
  `<clipPath id="${u('caudalClip')}"><path d="${CAUDAL}"/></clipPath>`,
);

const art: CreatureArt = {
  id: 'ca_dia',
  viewBox: [560, 316],
  lengthUnits: 514,
  spineY: 165,
  animation: 'fish',
  cycleHz: 1.5,
  bendAmp: 14,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'pelvicFar',
      role: 'fin',
      z: 'back',
      pivot: [414, 246],
      anim: { type: 'rotate', amp: 0.08, speed: 0.8, phase: 1.4 },
      svg:
        `<path d="${PELVIC_FAR}" fill="#b9a861" fill-opacity="0.7" stroke="${SPINE_D}" stroke-opacity="0.4" stroke-width="0.7"/>` +
        `<path d="M417 246L408 291" stroke="#d8cf9c" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>`,
    },
    { name: 'dorsal', role: 'detail', svg: finSvg(DORSAL, 'dorsalFin', 'dorsalClip') },
    { name: 'anal', role: 'detail', svg: finSvg(ANAL, 'analFin', 'analClip') },
    {
      name: 'body',
      role: 'body',
      svg:
        body.base +
        `<g clip-path="${u.url('bodyClip')}">` +
        `<g clip-path="${u.url('trunkClip')}">${bodySpots()}</g>` +
        `<g clip-path="${u.url('headClip')}">${headPattern()}</g>` +
        // đốm vàng lớn – viền nền bạc mảnh
        `<path d="${SADDLE_D}" fill="${u.url('saddle')}" stroke="#fff3c8" stroke-opacity="0.45" stroke-width="1"/>` +
        `<g fill="#e08a1a" fill-opacity="0.35"><circle cx="183" cy="125" r="1.2"/><circle cx="196" cy="128" r="1"/><circle cx="202" cy="118" r="1.1"/><circle cx="189" cy="117" r="0.9"/><circle cx="178" cy="119" r="0.8"/></g>` +
        `<path d="M181 112C186 108 194 108 199 111" fill="none" stroke="#fff6d0" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round"/>` +
        // vệt bóng mềm trên lưng
        `<ellipse cx="350" cy="100" rx="110" ry="20" opacity="0.55" fill="${u.url('gloss')}" filter="${u.url('soft')}"/>` +
        // đường bên chạy song song mép lưng
        `<path d="M452 98C400 84 330 82 270 92C220 102 176 120 118 152" fill="none" stroke="#f3f6ee" stroke-opacity="0.3" stroke-width="1"/>` +
        `</g>` +
        body.overlay,
    },
    {
      name: 'caudal',
      role: 'tail',
      svg:
        `<path d="${CAUDAL}" fill="${u.url('caudal')}"/>` +
        `<g clip-path="${u.url('caudalClip')}">` +
        caudalSpots() +
        finRays(CAUDAL_TIPS.map((_, i): P => [112 - Math.abs(i - 5) * 1.2, 147 + i * 3.6]), CAUDAL_TIPS, { color: '#2f3f4a', opacity: 0.4, width: 0.9, bend: 0.03 }) +
        `</g>` +
        // mép sau sẫm, mép trên/dưới ánh vàng
        `<path d="M25 97C28 104 33 124 37 144C40 156 41 172 38 186C34 206 29 224 26 236" fill="none" stroke="#2f3e48" stroke-opacity="0.6" stroke-width="1.6" stroke-linecap="round"/>` +
        `<path d="M104 138C82 126 56 108 25 97M26 236C52 224 80 206 104 192" fill="none" stroke="${FIN_EDGE}" stroke-opacity="0.55" stroke-width="1.3"/>`,
    },
    {
      name: 'face',
      role: 'detail',
      svg:
        // gờ nắp mang + gờ trước nắp mang
        `<path d="${GILL}" fill="none" stroke="#4d5a2c" stroke-opacity="0.5" stroke-width="1.6" stroke-linecap="round"/>` +
        `<path d="M465 88C454 117 447 152 449 186C451 205 459 220 470 228" fill="none" stroke="#fff7d6" stroke-opacity="0.35" stroke-width="1"/>` +
        `<path d="M478 124C470 148 470 178 480 200C486 210 494 214 502 214" fill="none" stroke="#5c6430" stroke-opacity="0.28" stroke-width="1.2" stroke-linecap="round"/>` +
        // mõm thỏ: môi dày nhạt, miệng nhỏ ở mút mõm
        `<path d="M539 176C536 171 531 169 527 171C530 175 535 177 539 177Z" fill="#efe3b0" fill-opacity="0.9"/>` +
        `<path d="M538 178C535 184 530 187 525 186C528 182 533 179 538 178Z" fill="#e6d7a0" fill-opacity="0.9"/>` +
        `<path d="M539 177Q532 178.5 525 177.5" fill="none" stroke="#3f4524" stroke-width="1.4" stroke-linecap="round"/>` +
        `<path d="M525 177.5Q521 177 518 175" fill="none" stroke="#3f4524" stroke-opacity="0.5" stroke-width="0.9" stroke-linecap="round"/>` +
        // lỗ mũi
        `<ellipse cx="517" cy="146" rx="1.8" ry="1.3" fill="#3f4524" opacity="0.65"/><ellipse cx="511" cy="143" rx="1.3" ry="1" fill="#3f4524" opacity="0.5"/>`,
    },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    {
      name: 'pelvic',
      role: 'fin',
      pivot: PELVIC_BASE,
      anim: { type: 'rotate', amp: 0.08, speed: 0.8, phase: 0.6 },
      svg:
        `<path d="${PELVIC}" fill="${u.url('pelvic')}" stroke="${SPINE_D}" stroke-opacity="0.45" stroke-width="0.7" stroke-linejoin="round"/>` +
        finRays([[402, 250], [400, 250], [398, 250]], [[388, 294], [383, 293], [378, 291]], { color: '#8a7a3a', opacity: 0.5, width: 0.8 }) +
        // 2 gai (ngoài & trong) – đặc trưng họ cá dìa
        `<g fill="${SPINE}" stroke="${SPINE_D}" stroke-width="0.6" stroke-opacity="0.8">` +
        `<path d="M408 247L411 249L395 301L393 300Z"/><path d="M397 248L400 249L373 291L371 290Z"/></g>`,
    },
    {
      name: 'pectoral',
      role: 'fin',
      pivot: PEC_BASE,
      anim: { type: 'rotate', amp: 0.28, speed: 1.2 },
      svg:
        `<path d="${PECTORAL}" fill="${u.url('pec')}" stroke="#8a8a52" stroke-opacity="0.45" stroke-width="0.8" stroke-linejoin="round"/>` +
        finRays([449, 199], PEC_TIPS, { color: '#6e6a3c', opacity: 0.6, width: 0.9, bend: 0.05 }),
    },
  ],
};

export default art;
