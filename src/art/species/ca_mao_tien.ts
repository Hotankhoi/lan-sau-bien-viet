/**
 * Cá mao tiên – Pterois volitans
 * LOÀI MẪU CHUẨN #2 (do agent điều phối vẽ; sửa theo REVIEW_DOT2 mục 1.3c).
 * Đặc điểm nhận dạng: thân cao, đầu to (~1/3 thân), trán dốc, miệng rộng chúc xuống;
 * sọc đỏ nâu – trắng kem rộng hẹp xen kẽ, trên đầu sọc tỏa quanh mắt, một dải đậm xuyên qua mắt;
 * gai vây lưng tỏa hình quạt, mỗi gai có màng "lá cờ" bán trong; vây ngực cực lớn xòe như quạt lông vũ;
 * tua da trên mắt, râu cằm; vây mềm trong suốt có hàng chấm.
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
  finRays,
} from '../style-bible';

const u = makeIds('ca_mao_tien');

type P = [number, number];
const f = (n: number): string => n.toFixed(1);
const pts2d = (pts: P[]): string => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join('');

const RED = '#8E2414';
const RED_D = '#5a140a';
const CREAM = '#F7E6D0';
const BROWN_LINE = '#a8553a';

// ---------- Thân: cao, đầu to, trán dốc ----------
/** Đường lưng từ mõm (phải) về cuống đuôi (trái) – 4 đoạn bezier bậc 3. */
const BACK: [P, P, P, P][] = [
  [[568, 214], [556, 200], [547, 180], [534, 162]], // trán dốc, hơi lõm trước mắt
  [[534, 162], [514, 142], [480, 132], [440, 130]], // gáy
  [[440, 130], [380, 128], [310, 148], [252, 177]], // lưng
  [[252, 177], [232, 187], [210, 195], [190, 199]], // cuống đuôi
];

const BODY =
  `M${BACK[0][0][0]} ${BACK[0][0][1]}` +
  BACK.map(([, a, b, c]) => `C${a[0]} ${a[1]} ${b[0]} ${b[1]} ${c[0]} ${c[1]}`).join('') +
  // cuống đuôi → bụng sâu → họng → hàm dưới hơi trề → khe miệng
  'L190 229C212 234 236 247 262 260C310 283 380 292 440 287C482 283 522 270 544 254C558 246 572 240 571 227L564 221Z';

function cubic(p0: P, p1: P, p2: P, p3: P, t: number): P {
  const m = 1 - t;
  const a = m * m * m;
  const b = 3 * m * m * t;
  const c = 3 * m * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

const BACK_PTS: P[] = [];
for (const s of BACK) for (let k = 0; k <= 16; k++) BACK_PTS.push(cubic(s[0], s[1], s[2], s[3], k / 16));

/** y của đường lưng tại x (để cắm gai vây lưng). */
function backY(x: number): number {
  for (let i = 0; i < BACK_PTS.length - 1; i++) {
    const [x1, y1] = BACK_PTS[i];
    const [x2, y2] = BACK_PTS[i + 1];
    if (x <= x1 && x >= x2 && x1 !== x2) return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
  }
  return 170;
}

/** Mép nắp mang – ranh giới sọc đầu / sọc thân. */
const GILL = 'M478 112C462 152 452 200 462 240C466 262 476 282 490 304';
const HEAD_CLIP = `${GILL}L610 304L610 112Z`;
const TRUNK_CLIP = `${GILL}L150 304L150 112Z`;

const EYE: P = [515, 174];

// ---------- Sọc thân: rộng – hẹp xen kẽ, không đều ----------
function trunkStripes(): string {
  const r = rng(77);
  let dark = '';
  let thin = '';
  let lines = '';
  const top = 116;
  const mid = 210;
  const bot = 302;
  const band = (x: number, wT: number, wM: number, wB: number, lean: number, bulge: number): string =>
    `<path d="M${f(x + lean)} ${top}Q${f(x + bulge)} ${mid} ${f(x)} ${bot}L${f(x + wB)} ${bot}Q${f(x + bulge + wM)} ${mid} ${f(x + lean + wT)} ${top}Z"/>`;
  let x = 192;
  while (x < 486) {
    const t = (x - 192) / 294; // 0 = cuống đuôi → 1 = sau đầu
    const lean = 4 + t * 20 + (r() - 0.5) * 6;
    const bulge = -5 - t * 7 + (r() - 0.5) * 5;
    const sc = 0.55 + 0.45 * Math.min(1, t * 3.5); // cuống đuôi: sọc mảnh hơn
    // sọc đậm rộng (bề rộng nhiễu ±40%, trên – giữa – dưới khác nhau)
    const w = (7 + r() * 8) * sc * (r() < 0.22 ? 0.6 : 1);
    dark += band(x, w * (0.75 + r() * 0.5), w * (0.8 + r() * 0.5), w * (0.7 + r() * 0.5), lean, bulge);
    x += w + (4 + r() * 5) * sc;
    if (r() < 0.62) {
      // sọc mảnh nằm giữa dải kem
      const w2 = (2.6 + r() * 2.6) * sc;
      thin += band(x, w2, w2 * 1.2, w2 * 0.8, lean, bulge);
      x += w2 + (4 + r() * 4.5) * sc;
    } else {
      // chỉ một vạch nâu rất mảnh
      lines += `<path d="M${f(x + lean)} ${top}Q${f(x + bulge)} ${mid} ${f(x)} ${bot}"/>`;
      x += (4 + r() * 4) * sc;
    }
  }
  return (
    `<g fill="${u.url('stripe')}">${dark}</g>` +
    `<g fill="${u.url('stripe')}" fill-opacity="0.82">${thin}</g>` +
    `<g fill="none" stroke="${BROWN_LINE}" stroke-opacity="0.6" stroke-width="1.5">${lines}</g>`
  );
}

// ---------- Sọc đầu: tỏa quanh mắt ----------
/** Một dải tỏa từ mắt theo góc aDeg (độ, 0 = về mõm, 90 = xuống), nửa bề rộng h0→h1, bán kính r0→r1. */
function eyeRay(aDeg: number, h0: number, h1: number, r0: number, r1: number, curve = 0): string {
  const N = 5;
  const L: P[] = [];
  const R: P[] = [];
  for (let k = 0; k <= N; k++) {
    const s = k / N;
    const rr = r0 + (r1 - r0) * s;
    const a = ((aDeg + curve * s * s) * Math.PI) / 180;
    const cx = EYE[0] + Math.cos(a) * rr;
    const cy = EYE[1] + Math.sin(a) * rr;
    const h = h0 + (h1 - h0) * s;
    L.push([cx - Math.sin(a) * h, cy + Math.cos(a) * h]);
    R.push([cx + Math.sin(a) * h, cy - Math.cos(a) * h]);
  }
  return `<path d="${pts2d([...L, ...R.reverse()])}Z"/>`;
}

function headStripes(): string {
  // dải đậm xuyên qua mắt: từ trán (trên – trước) chéo xuống má (dưới – sau)
  const through = eyeRay(112, 5, 8.5, 6, 150, 16) + eyeRay(292, 5, 6.5, 6, 70, -6);
  // các dải tỏa quanh mắt, càng xa mắt càng quét chéo về phía sau – dưới (≈ 25–35° so với sọc thân)
  const sweep = (a: number): number => (a > 40 && a < 260 ? (122 - a) * 0.42 : 0);
  let wide = '';
  let thin = '';
  for (const a of [146, 178, 208, 240, 268, 84, 58, 30, 4, 338]) wide += eyeRay(a, 2.6, a > 100 && a < 250 ? 6 : 4.6, 16, 150, sweep(a));
  for (const a of [130, 162, 193, 224, 255, 99, 71, 44, 17, 351, 318]) thin += eyeRay(a, 1, 2.1, 17, 150, sweep(a));
  // khoang nhỏ trên môi/hàm
  const lips =
    `<path d="M557 207l9 5-1 5-10-6Z"/><path d="M549 196l8 4-1 4-9-4Z"/>` +
    `<path d="M559 232l8 5-4 5-7-6Z"/><path d="M547 243l7 6-5 5-6-7Z"/>`;
  return (
    `<g fill="${u.url('stripe')}">${through}${wide}</g>` +
    `<g fill="${u.url('stripe')}" fill-opacity="0.8">${thin}</g>` +
    `<g fill="${RED}" fill-opacity="0.7">${lips}</g>`
  );
}

// ---------- Gai vây lưng: tỏa quạt, mỗi gai một màng lá cờ ----------
function dorsalSpines(): string {
  const LEN = [78, 97, 110, 117, 120, 118, 112, 104, 94, 82, 69, 56, 44]; // dài nhất ở gai 4–6
  const n = LEN.length;
  const r = rng(31);
  let flags = '';
  let flagBands = '';
  let rods = '';
  let rodBands = '';
  let tips = '';
  let baseMem = '';
  const low: P[][] = [];
  for (let i = 0; i < n; i++) {
    const bx = 480 - i * 14.6;
    const by = backY(bx) + 6;
    const L = LEN[i];
    // gai đầu hơi ngả trước (−8°), gai cuối ngả sau (+38°)
    const lean = -8 + 46 * Math.pow(i / (n - 1), 1.15);
    const a = ((-90 - lean) * Math.PI) / 180;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const nx = dy; // pháp tuyến hướng về phía đuôi
    const ny = -dx;
    const bow = L * 0.045; // gai hơi cong về sau
    const pt = (t: number, off: number): P => [
      bx + dx * L * t + nx * (bow * t * t + off),
      by + dy * L * t + ny * (bow * t * t + off),
    ];
    const W = 6 + L * 0.05;
    const fw = (t: number): number =>
      W * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.05) / 0.93)))), 0.6) * (0.5 + 0.5 * t);
    // màng lá cờ phía sau gai, mép lượn nhẹ
    const fwd: P[] = [];
    const back: P[] = [];
    for (let k = 0; k <= 14; k++) {
      const t = 0.05 + (0.93 * k) / 14;
      fwd.push(pt(t, 0));
      back.push(pt(t - 0.025, fw(t) * (1 + 0.1 * Math.sin(t * 15 + i))));
    }
    flags += `<path d="${pts2d([...fwd, ...back.reverse()])}Z"/>`;
    // khoang đỏ – trắng dọc gai (và kéo sang màng)
    let t = 0.07 + r() * 0.05;
    while (t < 0.93) {
      const t1 = Math.min(0.95, t + (9 + r() * 5) / L);
      flagBands += `<path d="${pts2d([pt(t, 0), pt(t1, 0), pt(t1 - 0.035, fw(t1) * 0.96), pt(t - 0.035, fw(t) * 0.96)])}Z"/>`;
      const t2 = Math.min(0.97, t1 + (7 + r() * 5) / L);
      const h1 = 2.5 - 1.9 * t1;
      const h2 = 2.5 - 1.9 * t2;
      rodBands += `<path d="${pts2d([pt(t1, -h1), pt(t2, -h2), pt(t2, h2), pt(t1, h1)])}Z"/>`;
      t = t2;
    }
    // thân gai thuôn nhọn
    const ra: P[] = [];
    const rb: P[] = [];
    for (let k = 0; k <= 5; k++) {
      const s = k / 5;
      const h = 2.6 - 2.1 * s;
      ra.push(pt(s, -h));
      rb.push(pt(s, h));
    }
    rods += `<path d="${pts2d([...ra, ...rb.reverse()])}Z"/>`;
    const tip = pt(1, 0);
    tips += `<circle cx="${f(tip[0])}" cy="${f(tip[1])}" r="1.5"/>`;
    low.push([[bx, by], pt(0.2, 0)]);
  }
  // màng thấp nối chân các gai
  for (let i = 0; i < n - 1; i++) {
    const [b1, m1] = low[i];
    const [b2, m2] = low[i + 1];
    baseMem += `<path d="M${f(b1[0])} ${f(b1[1])}L${f(m1[0])} ${f(m1[1])}Q${f((m1[0] + m2[0]) / 2)} ${f((m1[1] + m2[1]) / 2 + 9)} ${f(m2[0])} ${f(m2[1])}L${f(b2[0])} ${f(b2[1])}Z"/>`;
  }
  return (
    `<g fill="#8a2a16" fill-opacity="0.34">${baseMem}</g>` +
    `<g fill="#fbe6cf" fill-opacity="0.45" stroke="#fff3e3" stroke-opacity="0.45" stroke-width="0.7" stroke-linejoin="round">${flags}</g>` +
    `<g fill="#9b2413" fill-opacity="0.6">${flagBands}</g>` +
    `<g fill="${RED}" stroke="${RED_D}" stroke-width="0.6" stroke-opacity="0.6">${rods}</g>` +
    `<g fill="${CREAM}">${rodBands}</g>` +
    `<g fill="#fff6ea">${tips}</g>`
  );
}

// ---------- Vây ngực xòe quạt lông vũ ----------
function pectoralFan(base: P, a0: number, a1: number, n: number, Lmax: number, Lmin: number, seed: number, grad: string, dim = 0): string {
  const r = rng(seed);
  const [bx, by] = base;
  const B: P = [bx, by];
  const lerp = (p: P, q: P, t: number): P => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const rays: { c: P; tip: P }[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const aDeg = a0 + (a1 - a0) * t;
    const ang = (aDeg * Math.PI) / 180;
    const L = Lmin + (Lmax - Lmin) * Math.sin(Math.PI * (0.15 + 0.85 * t)) + (r() - 0.5) * 14;
    // tia rời gốc xòe rộng rồi cong dần về phía đuôi
    const delta = 0.2 * Math.max(-1, Math.min(1, (180 - aDeg) / 45));
    rays.push({
      c: [bx + Math.cos(ang - delta) * L * 0.5, by + Math.sin(ang - delta) * L * 0.5],
      tip: [bx + Math.cos(ang) * L, by + Math.sin(ang) * L],
    });
  }
  const q = (i: number, s: number): P => {
    const m = 1 - s;
    const { c, tip } = rays[i];
    return [m * m * bx + 2 * m * s * c[0] + s * s * tip[0], m * m * by + 2 * m * s * c[1] + s * s * tip[1]];
  };
  const qn = (i: number, s: number): P => {
    // pháp tuyến đơn vị của tia tại s
    const { c, tip } = rays[i];
    const tx = 2 * (1 - s) * (c[0] - bx) + 2 * s * (tip[0] - c[0]);
    const ty = 2 * (1 - s) * (c[1] - by) + 2 * s * (tip[1] - c[1]);
    const len = Math.hypot(tx, ty) || 1;
    return [-ty / len, tx / len];
  };
  // màng nối nửa gốc (tới ~55% tia), mép lõm giữa hai tia
  const MS = 0.55;
  const c0 = lerp(B, rays[0].c, MS);
  const p0 = q(0, MS);
  let mem = `M${f(bx)} ${f(by)}Q${f(c0[0])} ${f(c0[1])} ${f(p0[0])} ${f(p0[1])}`;
  for (let i = 1; i < n; i++) {
    const a = q(i - 1, MS);
    const b = q(i, MS);
    const c = lerp(lerp(a, b, 0.5), B, 0.16);
    mem += `Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`;
  }
  const cl = lerp(B, rays[n - 1].c, MS);
  mem += `Q${f(cl[0])} ${f(cl[1])} ${f(bx)} ${f(by)}Z`;

  let rayPaths = '';
  let vanes = '';
  let spots = '';
  let darkSpots = '';
  for (let i = 0; i < n; i++) {
    const { c, tip } = rays[i];
    rayPaths += `M${f(bx)} ${f(by)}Q${f(c[0])} ${f(c[1])} ${f(tip[0])} ${f(tip[1])}`;
    // phiến lông vũ dọc nửa ngọn của tia
    const up: P[] = [];
    const dn: P[] = [];
    for (let k = 0; k <= 8; k++) {
      const s = 0.44 + (0.56 * k) / 8;
      const w = 5.6 * Math.pow(Math.max(0, Math.sin((Math.PI * k) / 8)), 0.55) * (1.1 - 0.45 * (k / 8));
      const p = q(i, s);
      const nn = qn(i, s);
      up.push([p[0] + nn[0] * w, p[1] + nn[1] * w]);
      dn.push([p[0] - nn[0] * w * 0.8, p[1] - nn[1] * w * 0.8]);
    }
    vanes += `<path d="${pts2d([...up, ...dn.reverse()])}Z"/>`;
    // đốm trắng + chấm sẫm trên màng giữa hai tia
    if (i < n - 1) {
      for (const s of i % 2 ? [0.24, 0.4] : [0.3, 0.47]) {
        const p = lerp(q(i, s), q(i + 1, s), 0.5);
        spots += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(1.3 + s * 2.8)}"/>`;
      }
      const d = lerp(q(i, 0.36), q(i + 1, 0.36), i % 2 ? 0.5 : 0.3);
      darkSpots += `<circle cx="${f(d[0])}" cy="${f(d[1])}" r="1.5"/>`;
    }
  }
  const g = u.url(grad);
  const darken = dim ? `<path d="${mem}" fill="#2a0804" fill-opacity="${dim}"/><g fill="#2a0804" fill-opacity="${dim}">${vanes}</g>` : '';
  return (
    `<path d="${mem}" fill="${g}" fill-opacity="0.42"/>` +
    `<path d="${mem}" fill="#f6e2c9" fill-opacity="0.14" stroke="#f6e2c9" stroke-opacity="0.35" stroke-width="0.8"/>` +
    `<g fill="${g}" fill-opacity="0.55" stroke="#f6e2c9" stroke-opacity="0.3" stroke-width="0.6">${vanes}</g>` +
    darken +
    `<g fill="${RED_D}" fill-opacity="0.45">${darkSpots}</g>` +
    `<g fill="#fff8ee" fill-opacity="0.85">${spots}</g>` +
    `<path d="${rayPaths}" fill="none" stroke="${g}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="${rayPaths}" fill="none" stroke="${RED_D}" stroke-opacity="0.3" stroke-width="0.6"/>`
  );
}

// ---------- Vây mềm trong suốt có hàng chấm ----------
function dottedFin(d: string, seed: number, area: { x: number; y: number; w: number; h: number }, clipId: string): string {
  const r = rng(seed);
  let dots = '';
  for (let i = 0; i < 60; i++) {
    const x = area.x + r() * area.w;
    const y = area.y + r() * area.h;
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.6 + r() * 1.6).toFixed(1)}"/>`;
  }
  return (
    `<path d="${d}" fill="${u.url('clear')}"/>` +
    `<g clip-path="${u.url(clipId)}" fill="${RED_D}" fill-opacity="0.75">${dots}</g>` +
    `<path d="${d}" fill="none" stroke="${CREAM}" stroke-opacity="0.45" stroke-width="1"/>`
  );
}

const SOFT_DORSAL = 'M312 158C296 118 262 102 234 114C220 136 212 164 204 198L250 186Z';
const CAUDAL = 'M196 198C172 176 130 166 98 172C84 194 82 236 98 258C130 262 172 252 196 230Z';
const ANAL = 'M312 272C306 304 280 326 252 324C238 306 230 278 224 244Z';
const PELVIC = 'M448 280C438 314 410 348 368 364C372 338 398 306 426 280Z';
const TENTACLE = 'M506 157C499 138 504 120 519 108C527 125 525 143 518 158Z';

const PEC_NEAR: P = [448, 236];
const PEC_FAR: P = [459, 230];

const body = standardBody(u, BODY, {
  dorsal: '#E7C3A0',
  flank: CREAM,
  belly: '#FFF7EC',
  outlineColor: '#5a1a0c',
  scales: { size: 7, color: '#6b2410', opacity: 0.1 },
  flankAt: 0.5,
});

const theEye = eye(u, 'eye', {
  cx: EYE[0],
  cy: EYE[1],
  r: 12,
  iris: ['#e0543a', '#4a0e08'],
  socket: '#7a1c10',
});

const defs = joinDefs(
  body,
  theEye,
  // sọc thân: lưng đậm hơn bụng
  linear(
    u('stripe'),
    [
      [0, RED_D],
      [0.45, RED],
      [1, '#b84a2e'],
    ],
    { user: true, x1: 0, y1: 128, x2: 0, y2: 290 },
  ),
  // khoang đỏ – trắng (lặp theo trục y) cho tua mắt và gai vây hậu môn
  linear(
    u('bandV'),
    [
      [0, RED],
      [0.42, RED],
      [0.5, CREAM],
      [0.92, CREAM],
      [1, RED],
    ],
    { user: true, x1: 0, y1: 0, x2: 0, y2: 22, spread: 'repeat' },
  ),
  // vòng sọc đồng tâm cho vây ngực (lặp theo bán kính)
  radial(
    u('bandR'),
    [
      [0, '#9b2a17'],
      [0.46, '#7c1d10'],
      [0.52, CREAM],
      [0.86, '#f3d9bd'],
      [0.92, '#9b2a17'],
      [1, '#9b2a17'],
    ],
    { user: true, cx: PEC_NEAR[0], cy: PEC_NEAR[1], r: 30, spread: 'repeat' },
  ),
  radial(
    u('bandRfar'),
    [
      [0, '#9b2a17'],
      [0.5, CREAM],
      [1, '#9b2a17'],
    ],
    { user: true, cx: PEC_FAR[0], cy: PEC_FAR[1], r: 30, spread: 'repeat' },
  ),
  linear(u('clear'), [
    [0, '#f5e9da', 0.42],
    [1, '#e8d2bb', 0.3],
  ]),
  `<clipPath id="${u('softClip')}"><path d="${SOFT_DORSAL}"/></clipPath>`,
  `<clipPath id="${u('caudalClip')}"><path d="${CAUDAL}"/></clipPath>`,
  `<clipPath id="${u('analClip')}"><path d="${ANAL}"/></clipPath>`,
  `<clipPath id="${u('headClip')}"><path d="${HEAD_CLIP}"/></clipPath>`,
  `<clipPath id="${u('trunkClip')}"><path d="${TRUNK_CLIP}"/></clipPath>`,
  linear(u('pelvic'), [
    [0, '#3a0d06'],
    [1, '#6e1a0d'],
  ]),
);

const art: CreatureArt = {
  id: 'ca_mao_tien',
  viewBox: [640, 400],
  lengthUnits: 471,
  spineY: 212,
  animation: 'fish',
  cycleHz: 0.9,
  bendAmp: 8,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'pectoralFar',
      role: 'fin',
      z: 'back',
      pivot: PEC_FAR,
      anim: { type: 'rotate', amp: 0.09, speed: 0.6, phase: 1.2 },
      svg: pectoralFan(PEC_FAR, 198, 112, 12, 200, 112, 7, 'bandRfar', 0.35),
    },
    {
      name: 'caudal',
      role: 'tail',
      svg: dottedFin(CAUDAL, 11, { x: 84, y: 166, w: 112, h: 96 }, 'caudalClip') +
        finRays([196, 214], [[104, 176], [94, 192], [90, 214], [94, 236], [104, 254]], { color: CREAM, opacity: 0.35 }),
    },
    {
      name: 'softDorsal',
      role: 'detail',
      svg:
        dottedFin(SOFT_DORSAL, 5, { x: 204, y: 102, w: 108, h: 96 }, 'softClip') +
        finRays(
          [[296, 160], [280, 166], [264, 172], [248, 180], [232, 187]],
          [[284, 116], [262, 106], [242, 110], [226, 128], [216, 152]],
          { color: CREAM, opacity: 0.3 },
        ),
    },
    {
      name: 'anal',
      role: 'detail',
      svg:
        dottedFin(ANAL, 9, { x: 224, y: 244, w: 88, h: 82 }, 'analClip') +
        `<g stroke="${u.url('bandV')}" stroke-width="2.4" stroke-linecap="round"><path d="M304 272L286 316"/><path d="M294 268L272 310"/><path d="M284 264L260 304"/></g>`,
    },
    {
      name: 'dorsalSpines',
      role: 'detail',
      svg: dorsalSpines(),
    },
    {
      name: 'body',
      role: 'body',
      svg:
        body.base +
        `<g clip-path="${u.url('bodyClip')}">` +
        `<g clip-path="${u.url('trunkClip')}">${trunkStripes()}</g>` +
        `<g clip-path="${u.url('headClip')}">${headStripes()}</g>` +
        `</g>` +
        body.overlay,
    },
    {
      name: 'face',
      role: 'detail',
      svg:
        // miệng rộng, chạy chéo xuống phía sau, khóe miệng trễ
        `<path d="M565 221C555 226 545 235 537 246Q535 249 535 253" fill="none" stroke="${RED_D}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>` +
        // môi trên / môi dưới
        `<path d="M562 215C552 220 542 229 534 240" fill="none" stroke="#fff3e3" stroke-width="1.2" stroke-linecap="round" opacity="0.55"/>` +
        `<path d="M548 214C540 222 534 232 530 243" fill="none" stroke="${RED_D}" stroke-width="1" stroke-linecap="round" opacity="0.3"/>` +
        `<path d="M568 231C559 239 551 246 543 253" fill="none" stroke="${RED_D}" stroke-width="1" stroke-linecap="round" opacity="0.3"/>` +
        // lỗ mũi
        `<circle cx="551" cy="194" r="1.7" fill="${RED_D}" opacity="0.6"/>` +
        // gờ nắp mang + gờ trước nắp mang
        `<path d="M476 136C462 160 453 200 462 240C466 258 474 272 484 284" fill="none" stroke="${RED_D}" stroke-opacity="0.5" stroke-width="1.7" stroke-linecap="round"/>` +
        `<path d="M479 138C465 161 456 200 465 240C469 257 477 271 487 283" fill="none" stroke="#fff3e3" stroke-opacity="0.35" stroke-width="1"/>` +
        `<path d="M497 202C491 224 495 248 507 264" fill="none" stroke="${RED_D}" stroke-opacity="0.28" stroke-width="1.3" stroke-linecap="round"/>` +
        // râu cằm (tua da dưới hàm)
        `<path d="M546 253Q547 264 541 270M534 260Q535 271 529 277M522 266Q522 275 517 279" fill="none" stroke="${RED}" stroke-width="2.2" stroke-linecap="round" opacity="0.85"/>`,
    },
    {
      name: 'tentacle',
      role: 'detail',
      svg: `<path d="${TENTACLE}" fill="${u.url('bandV')}" stroke="${RED_D}" stroke-width="0.8" stroke-opacity="0.6"/>`,
    },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    {
      name: 'pelvic',
      role: 'fin',
      pivot: [437, 282],
      anim: { type: 'rotate', amp: 0.08, speed: 0.6, phase: 2 },
      svg:
        `<path d="${PELVIC}" fill="${u.url('pelvic')}" fill-opacity="0.85"/>` +
        `<g fill="#fff3e3" opacity="0.85"><circle cx="423" cy="305" r="2.4"/><circle cx="409" cy="323" r="2.2"/><circle cx="393" cy="339" r="2"/><circle cx="431" cy="293" r="2"/><circle cx="403" cy="313" r="1.8"/><circle cx="385" cy="349" r="1.8"/></g>`,
    },
    {
      name: 'pectoralNear',
      role: 'fin',
      z: 'front',
      pivot: PEC_NEAR,
      anim: { type: 'rotate', amp: 0.1, speed: 0.6 },
      svg: pectoralFan(PEC_NEAR, 204, 106, 14, 212, 116, 3, 'bandR'),
    },
  ],
};

export default art;
