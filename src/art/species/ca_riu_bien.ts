/**
 * Cá rìu biển – họ Sternoptychidae (chi tiêu biểu Argyropelecus) – Vùng khơi xa, Tầng 3 – biển sâu.
 * Tham khảo: references/ca_riu_bien (A. olfersii, A. aculeatus, ảnh phát quang trong tối).
 * Đặc điểm nhận dạng:
 *  - thân CỰC DẸT BÊN, cao, hình LƯỠI RÌU: ngực/bụng phình sâu xuống, mép sau lưỡi rìu dốc đứng,
 *    gai bụng nhỏ ở góc sau; CUỐNG ĐUÔI rất mảnh; đuôi chẻ trong suốt, gốc đuôi đen;
 *  - hông BẠC GƯƠNG phản chiếu (gradient bạc–lam nhiều dải + vệt phản quang + ánh ngũ sắc),
 *    lưng nâu sẫm thành dải dọc sống lưng;
 *  - MẮT HÌNH ỐNG rất to trên đỉnh đầu nhìn thẳng LÊN; MIỆNG xiên dốc hướng lên, hàm dưới chìa;
 *  - tấm gai răng cưa nhỏ trước vây lưng; vây mỡ nhỏ;
 *  - ĐẶC TRƯNG: hàng cơ quan phát quang dạng "phím đàn" dọc mép bụng, ánh sáng HƯỚNG XUỐNG
 *    (xóa bóng – counter-illumination) → lớp role 'glow', blend 'add', #7CF7FF / #4FA8FF + glowFilter.
 *
 * Bố cục lớp phát quang: nhóm họng + sống bụng (x ≥ 280, nửa trước gần như không uốn) là sprite tách rời
 * nhấp nháy chậm; nhóm hậu môn + cuống đuôi nướng chung với thân (bend) để không rời thân khi đuôi quẫy.
 */
import type { CreatureArt } from '../contract';
import {
  makeIds,
  eye,
  finRays,
  finMembrane,
  linear,
  radial,
  glowFilter,
  blurFilter,
  outline,
  clip,
  scalePattern,
  smoothPath,
  joinDefs,
  rng,
} from '../style-bible';

const u = makeIds('ca_riu_bien');

type P = [number, number];

// ---------- Màu ----------
const OUTLINE = '#141b28';
const DORSAL_DARK = '#2a1f19';
const FIN_RAY = '#c7d3e4';

// ---------- Thân (đầu quay phải) ----------
const BODY_PTS: P[] = [
  [498, 89], // chóp hàm dưới chìa lên (miệng hướng lên)
  [489, 96], // khe miệng mở lên trên
  [480, 84], // mõm / hàm trên
  [468, 68],
  [452, 54],
  [432, 45],
  [406, 40],
  [376, 39],
  [348, 41],
  [318, 48],
  [282, 61],
  [242, 78],
  [202, 96],
  [164, 113],
  [132, 127],
  [108, 136],
  [90, 140],
  [80, 142], // gốc đuôi trên
  [77, 154],
  [80, 166], // gốc đuôi dưới
  [92, 168],
  [120, 172],
  [160, 178],
  [200, 184],
  [234, 190],
  [251, 199],
  [259, 222],
  [264, 252],
  [269, 280],
  [278, 298], // góc sau lưỡi rìu
  [300, 308],
  [336, 312],
  [372, 308],
  [398, 294],
  [418, 277],
  [436, 255],
  [452, 228],
  [466, 198],
  [478, 166],
  [488, 136],
  [495, 112],
];
const BODY = smoothPath(BODY_PTS, true, 0.5);
const DORSAL_EDGE = smoothPath(BODY_PTS.slice(2, 18), false, 0.5);
const VENTRAL_EDGE = smoothPath(BODY_PTS.slice(19, 41), false, 0.5);

// ---------- Hình học dọc mép ----------
/** Điểm + pháp tuyến (hướng vào trong thân, tức hướng lên) tại tỉ lệ t theo chiều dài polyline. */
function along(poly: P[], t: number): { x: number; y: number; nx: number; ny: number } {
  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < poly.length - 1; i++) {
    const l = Math.hypot(poly[i + 1][0] - poly[i][0], poly[i + 1][1] - poly[i][1]);
    seg.push(l);
    total += l;
  }
  let d = Math.max(0, Math.min(1, t)) * total;
  let i = 0;
  while (i < seg.length - 1 && d > seg[i]) {
    d -= seg[i];
    i++;
  }
  const a = poly[i];
  const b = poly[i + 1];
  const k = seg[i] > 0 ? d / seg[i] : 0;
  const tx = (b[0] - a[0]) / (seg[i] || 1);
  const ty = (b[1] - a[1]) / (seg[i] || 1);
  let nx = -ty;
  let ny = tx;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, nx, ny };
}

/** y của mép bụng tại x (nội suy tuyến tính trên polyline). */
function edgeY(poly: P[], x: number): number {
  for (let i = 0; i < poly.length - 1; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[i + 1];
    if ((x - x0) * (x - x1) <= 0 && x0 !== x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return poly[poly.length - 1][1];
}

// cơ quan phát quang: [x, y, rộng ô, cao ô, góc(độ), bán kính sáng]
type Photo = [number, number, number, number, number, number];

function group(poly: P[], n: number, t0: number, t1: number, inset: number, w: number, h: number, r: number): Photo[] {
  const out: Photo[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? (t0 + t1) / 2 : t0 + ((t1 - t0) * i) / (n - 1);
    const p = along(poly, t);
    const ang = (Math.atan2(p.ny, p.nx) * 180) / Math.PI + 90; // trục ô vuông góc với mép
    out.push([p.x + p.nx * inset, p.y + p.ny * inset, w, h, ang, r]);
  }
  return out;
}

const THROAT_POLY: P[] = BODY_PTS.slice(34, 39).reverse();
const KEEL_POLY: P[] = BODY_PTS.slice(29, 35).reverse();
const AN_POLY: P[] = [[257, 210], [250, 198], [236, 191], [218, 188]];
const AC_POLY: P[] = [[196, 184], [160, 178], [128, 173], [100, 169]];

const PH_THROAT = group(THROAT_POLY, 6, 0.16, 0.95, 7, 7, 10, 3.0);
const PH_KEEL = group(KEEL_POLY, 12, 0.03, 0.97, 8, 9, 13, 3.6);
const PH_AN = group(AN_POLY, 4, 0.12, 0.92, 6, 6, 8, 2.8);
const PH_AC = group(AC_POLY, 6, 0.0, 1.0, 5, 5.5, 7, 2.6);
const PH_FRONT = [...PH_THROAT, ...PH_KEEL];
const PH_REAR = [...PH_AN, ...PH_AC];

/** Dải bụng sẫm chứa hàng phát quang: vùng giữa mép bụng và đường lệch vào trong (dày thay đổi). */
const BELLY_POLY: P[] = BODY_PTS.slice(20, 39).reverse();
function bellyBand(): string {
  const n = 60;
  const outer: P[] = [];
  const inner: P[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = along(BELLY_POLY, t);
    // dày ~20 ở họng & sống bụng, mỏng ~11 dọc cuống đuôi, 0 ở hai đầu
    const th = t < 0.05 ? (t / 0.05) * 20 : t < 0.55 ? 20 : t < 0.98 ? 20 - ((t - 0.55) / 0.43) * 10 : 4;
    outer.push([p.x - p.nx * 6, p.y - p.ny * 6]);
    inner.push([p.x + p.nx * th, p.y + p.ny * th]);
  }
  return smoothPath([...outer, ...inner.reverse()], true, 0.3);
}
const BELLY_BAND = bellyBand();

/** Ô phát quang khi được đèn chiếu: "phím đàn" bạc lam viền đen (nằm trên thân, uốn theo thân). */
function sockets(list: Photo[]): string {
  return list
    .map(([x, y, w, h, a]) => {
      const tr = `transform="rotate(${a.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"`;
      return (
        `<rect x="${(x - w * 0.62).toFixed(1)}" y="${(y - h * 0.62).toFixed(1)}" width="${(w * 1.24).toFixed(1)}" height="${(h * 1.24).toFixed(1)}" rx="${(w * 0.4).toFixed(1)}" fill="#0a0f18" fill-opacity="0.85" ${tr}/>` +
        `<rect x="${(x - w / 2).toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${(w * 0.35).toFixed(1)}" fill="${u.url('lens')}" ${tr}/>` +
        `<rect x="${(x - w * 0.18).toFixed(1)}" y="${(y - h * 0.36).toFixed(1)}" width="${(w * 0.22).toFixed(1)}" height="${(h * 0.5).toFixed(1)}" rx="${(w * 0.1).toFixed(1)}" fill="#ffffff" fill-opacity="0.55" ${tr}/>`
      );
    })
    .join('');
}

/** Lớp phát quang: quầng hướng XUỐNG dưới bụng + lõi sáng (glowFilter) + chấm nóng. */
function glowDots(list: Photo[]): string {
  const halos = list
    .map(([x, y, , , , r]) => `<ellipse cx="${x.toFixed(1)}" cy="${(y + r * 1.7).toFixed(1)}" rx="${(r * 2.4).toFixed(1)}" ry="${(r * 3.6).toFixed(1)}" fill="${u.url('halo')}"/>`)
    .join('');
  const cores = list
    .map(([x, y, w, h, a, r]) => `<ellipse cx="${x.toFixed(1)}" cy="${(y + r * 0.2).toFixed(1)}" rx="${(Math.min(w, h * 0.7) * 0.4).toFixed(1)}" ry="${(h * 0.36).toFixed(1)}" transform="rotate(${a.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`)
    .join('');
  const hot = list
    .map(([x, y, , , , r]) => `<circle cx="${x.toFixed(1)}" cy="${(y + r * 0.35).toFixed(1)}" r="${(r * 0.36).toFixed(2)}"/>`)
    .join('');
  return (
    `<g>${halos}</g>` +
    `<g fill="#7CF7FF" filter="${u.url('glow')}">${cores}</g>` +
    `<g fill="#E6FFFF" fill-opacity="0.95">${hot}</g>`
  );
}

// ---------- Vây ----------
const TAIL =
  'M86 141C72 131 52 118 22 101C30 118 44 138 55 154C44 170 30 190 22 207C52 190 72 177 86 167Z';
const TAIL_EDGE = 'M22 101C30 118 44 138 55 154C44 170 30 190 22 207';

const DORSAL_FIN = 'M306 45C304 36 301 28 298 22C290 25 283 31 277 38C272 43 269 49 267 54Z';
const DORSAL_FIN_EDGE = 'M306 45C304 36 301 28 298 22C290 25 283 31 277 38C272 43 269 49 267 54';

// tấm gai răng cưa trước vây lưng (dorsal blade)
const BLADE =
  'M352 40L347 35L343 37L339 31L335 33L331 27L327 29L322 22L318 32L314 38L311 43Z';

const ADIPOSE = 'M154 102C152 95 146 91 140 92C135 95 132 102 131 112C140 110 148 106 154 102Z';

const ANAL_FIN = 'M238 190C236 200 232 208 226 214C212 212 196 206 182 198C178 192 176 186 176 181Z';
const ANAL_FIN_EDGE = 'M238 190C236 200 232 208 226 214C212 212 196 206 182 198C178 192 176 186 176 181';

const PELVIC = 'M298 304C292 312 284 318 272 322C278 314 284 308 290 302Z';

const PECTORAL = 'M394 190C380 188 362 194 348 206C350 218 356 230 366 238C374 222 384 204 394 196Z';

// ---------- Dải lưng sẫm (bám theo đường lưng) ----------
const DORSAL_BAND_TOP: P[] = BODY_PTS.slice(3, 18);
function dorsalBand(): string {
  const inner: P[] = DORSAL_BAND_TOP.map(([x, y]) => {
    // dày ~24 ở gáy, mảnh dần còn ~11 ở cuống đuôi
    const t = (456 - x) / (456 - 80);
    const th = 26 - 15 * t;
    return [x + 2 * t, y + th];
  });
  const pts = [...DORSAL_BAND_TOP.map(([x, y]) => [x, y - 6] as P), ...inner.reverse()];
  return smoothPath(pts, true, 0.4);
}
const BAND = dorsalBand();

// ---------- Vạch tấm guanin dọc nửa dưới hông ----------
function platesLines(): string {
  const r = rng(712);
  let dark = '';
  let light = '';
  let x = 390;
  let i = 0;
  while (x > 276) {
    const yb = edgeY(KEEL_POLY.concat([[264, 270]]), x) - 20 - r() * 6;
    const yt = 148 + r() * 26 + i * 2.5;
    const xb = x - 3 - r() * 4;
    const w = 1.1 + r() * 1.6;
    dark += `<path d="M${x.toFixed(1)} ${yt.toFixed(1)}Q${(x - 1).toFixed(1)} ${((yt + yb) / 2).toFixed(1)} ${xb.toFixed(1)} ${yb.toFixed(1)}" stroke-width="${w.toFixed(1)}" stroke-opacity="${(0.16 + r() * 0.24).toFixed(2)}"/>`;
    light += `M${(x + w).toFixed(1)} ${(yt + 10).toFixed(1)}Q${(x + w - 1).toFixed(1)} ${((yt + yb) / 2).toFixed(1)} ${(xb + w).toFixed(1)} ${(yb - 4).toFixed(1)}`;
    x -= 7 + r() * 8;
    i++;
  }
  // vân sọc gương mảnh khắp hông (tấm guanin xếp dọc)
  let fine = '';
  for (let k = 0; k < 34; k++) {
    const fx = 120 + r() * 290;
    const top = 70 + Math.max(0, (400 - fx) * -0.05) + (420 - fx) * 0.18;
    const bot = top + 40 + r() * 70;
    fine += `M${fx.toFixed(1)} ${top.toFixed(1)}L${(fx - 3).toFixed(1)} ${bot.toFixed(1)}`;
  }
  return (
    `<path d="${fine}" stroke="#ffffff" stroke-opacity="0.26" stroke-width="1.1" fill="none" stroke-linecap="round"/>` +
    `<g stroke="#1d2635" fill="none" stroke-linecap="round">${dark}</g>` +
    `<path d="${light}" stroke="#ffffff" stroke-opacity="0.34" stroke-width="1" fill="none" stroke-linecap="round"/>`
  );
}

// ---------- Mắt ống nhìn lên ----------
// Mắt ống nhìn ngang: khối ống bạc–lam dựng đứng, tròng + thấu kính ở đỉnh ống nhô khỏi đường lưng.
const EYE_CX = 445;
const EYE_CY = 61;
const EYE_R = 18;
const EYE_TUBE = `M${EYE_CX - 21} ${EYE_CY + 2}C${EYE_CX - 22} ${EYE_CY + 18} ${EYE_CX - 17} ${EYE_CY + 32} ${EYE_CX - 6} ${EYE_CY + 38}C${EYE_CX + 2} ${EYE_CY + 41} ${EYE_CX + 12} ${EYE_CY + 37} ${EYE_CX + 18} ${EYE_CY + 28}C${EYE_CX + 22} ${EYE_CY + 20} ${EYE_CX + 22} ${EYE_CY + 10} ${EYE_CX + 21} ${EYE_CY + 2}Z`;

const theEye = eye(u, 'eye', {
  cx: EYE_CX,
  cy: EYE_CY,
  r: EYE_R,
  iris: ['#5f8fd6', '#0c1634'],
  pupil: 'round',
  look: [0.25, -0.7],
});

const defs = joinDefs(
  theEye,
  clip(u('bodyClip'), BODY),
  // bạc gương: nhiều dải sáng–tối xen kẽ theo chiều cao (phản chiếu môi trường)
  linear(u('bodyFill'), [
    [0, '#1d150f'],
    [0.07, '#3a2b21'],
    [0.13, '#3a4458'],
    [0.21, '#8ea2c0'],
    [0.3, '#e6eef7'],
    [0.39, '#6d81a3'],
    [0.47, '#c9d6e8'],
    [0.56, '#eef4fa'],
    [0.66, '#4d5f80'],
    [0.76, '#aebfd6'],
    [0.86, '#dbe5f1'],
    [1, '#4a5d80'],
  ]),
  // các tấm gương dọc (sáng–tối xen kẽ theo chiều ngang)
  linear(
    u('plates'),
    [
      [0, '#ffffff', 0.24],
      [0.35, '#ffffff', 0.0],
      [0.55, '#0e1830', 0.0],
      [1, '#0e1830', 0.42],
    ],
    { x1: 0.2, y1: 0, x2: 0.255, y2: 0.02, spread: 'reflect' },
  ),
  // ánh lam ngang thân: đuôi lạnh, đầu sáng hơn
  linear(
    u('blueSheen'),
    [
      [0, '#2c4a78', 0.45],
      [0.4, '#5f86c0', 0.18],
      [0.7, '#ffffff', 0.0],
      [1, '#1c2a44', 0.28],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 0 },
  ),
  // ánh ngũ sắc hồng–tím / lục lam
  linear(
    u('irid'),
    [
      [0, '#7fd6d0', 0],
      [0.3, '#7fd6d0', 0.1],
      [0.5, '#c88ad0', 0.16],
      [0.7, '#e7c98c', 0.1],
      [1, '#7fd6d0', 0],
    ],
    { x1: 0, y1: 0.2, x2: 1, y2: 0.8 },
  ),
  linear(
    u('coolDark'),
    [
      [0, '#0a1222', 0.5],
      [0.35, '#0a1222', 0.18],
      [0.6, '#0a1222', 0.0],
      [1, '#0a1222', 0.1],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 0.25 },
  ),
  scalePattern(u('scales'), { size: 15, color: '#ffffff', opacity: 0.045, stroke: 0.8 }),
  radial(
    u('vol'),
    [
      [0, '#ffffff', 0.12],
      [0.45, '#ffffff', 0],
      [0.78, '#000000', 0],
      [1, '#000000', 0.32],
    ],
    { cx: 0.7, cy: 0.28, r: 0.78 },
  ),
  linear(u('band'), [
    [0, '#140e0a', 0.95],
    [0.6, DORSAL_DARK, 0.9],
    [1, '#4a3a2e', 0.0],
  ]),
  // đầu: tấm xương bạc lam
  linear(
    u('cheek'),
    [
      [0, '#eef4fb', 0.35],
      [0.5, '#9fb2cc', 0.2],
      [1, '#2a3446', 0.35],
    ],
    { x1: 0, y1: 0, x2: 0.4, y2: 1 },
  ),
  linear(
    u('tube'),
    [
      [0, '#141c2c'],
      [0.25, '#566a8a'],
      [0.45, '#c4d2e4'],
      [0.62, '#5c6f92'],
      [1, '#121a2a'],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 0 },
  ),
  radial(
    u('lens'),
    [
      [0, '#f4fbff'],
      [0.45, '#a9cdee'],
      [1, '#2b4566'],
    ],
    { cx: 0.42, cy: 0.35, r: 0.65 },
  ),
  radial(u('halo'), [
    [0, '#7CF7FF', 0.7],
    [0.35, '#4FA8FF', 0.38],
    [1, '#1E6BFF', 0],
  ]),
  radial(
    u('underGlow'),
    [
      [0, '#4FA8FF', 0.32],
      [0.6, '#2F7BFF', 0.12],
      [1, '#1E5BFF', 0],
    ],
    { cx: 0.5, cy: 0.5, r: 0.5 },
  ),
  linear(u('fin'), [
    [0, '#dfe8f4', 0.42],
    [1, '#8ea2c0', 0.32],
  ]),
  linear(
    u('tailFill'),
    [
      [0, '#cdd8e8', 0.28],
      [0.6, '#8b9cb8', 0.42],
      [0.92, '#1a1410', 0.9],
      [1, '#120d0a', 0.95],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 0 },
  ),
  linear(u('bladeFill'), [
    [0, '#e3ebf5'],
    [0.6, '#7d8ea8'],
    [1, '#2e2620'],
  ]),
  linear(u('rimTop'), [
    [0, '#ffffff', 0.65],
    [1, '#ffffff', 0.15],
  ]),
  glowFilter(u('glow'), 2.2, 1.9),
  blurFilter(u('soft'), 4),
  blurFilter(u('soft2'), 2),
  blurFilter(u('soft1'), 1),
);

const finEdge = (d: string, w = 1.1, op = 0.5) =>
  `<path d="${d}" fill="none" stroke="#e4edf8" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

const bodySvg =
  `<path d="${BODY}" fill="${u.url('bodyFill')}"/>` +
  `<g clip-path="${u.url('bodyClip')}">` +
  `<path d="${BODY}" fill="${u.url('blueSheen')}"/>` +
  `<path d="${BODY}" fill="${u.url('irid')}"/>` +
  `<path d="${BODY}" fill="${u.url('plates')}"/>` +
  `<path d="${BODY}" fill="${u.url('scales')}"/>` +
  // vệt phản quang chéo (gương)
  `<g filter="${u.url('soft2')}" fill="#ffffff">` +
  `<path d="M356 66L366 66L328 296L316 296Z" opacity="0.5"/>` +
  `<path d="M296 64L302 64L274 250L267 250Z" opacity="0.38"/>` +
  `<path d="M226 88L231 88L212 180L207 180Z" opacity="0.32"/>` +
  `<path d="M392 120L398 120L384 262L377 262Z" opacity="0.28"/>` +
  `</g>` +
  `<g filter="${u.url('soft')}" fill="#0b1426">` +
  `<path d="M336 80L350 80L310 290L294 290Z" opacity="0.35"/>` +
  `<path d="M258 82L270 82L246 200L236 200Z" opacity="0.3"/>` +
  `</g>` +
  // mảng ánh ngũ sắc loang
  `<g filter="${u.url('soft')}">` +
  `<ellipse cx="300" cy="140" rx="40" ry="24" fill="#d08ad0" opacity="0.1"/>` +
  `<ellipse cx="240" cy="150" rx="32" ry="16" fill="#e8c88a" opacity="0.13"/>` +
  `<ellipse cx="350" cy="226" rx="34" ry="26" fill="#7fd6d0" opacity="0.1"/>` +
  `</g>` +
  // tông lạnh sẫm dần về cuống đuôi & mép dưới hông (gương phản chiếu nước tối)
  `<path d="${BODY}" fill="${u.url('coolDark')}"/>` +
  // dải tối ngay sau mép nắp mang
  `<path d="M404 60C392 110 388 180 396 250L384 262C376 190 380 110 394 56Z" fill="#0c1426" opacity="0.4" filter="${u.url('soft')}"/>` +
  // vạch tấm guanin nửa dưới hông
  platesLines() +
  // dải bụng sẫm chứa hàng phát quang
  `<path d="${BELLY_BAND}" fill="#121a28" opacity="0.6" filter="${u.url('soft2')}"/>` +
  // đường ranh hông – dải bụng (mảnh sáng)
  `<path d="M456 206C436 244 408 268 372 284C336 294 300 290 276 278" fill="none" stroke="#e8f0fa" stroke-opacity="0.3" stroke-width="1.2"/>` +
  // dải lưng nâu sẫm
  `<path d="${BAND}" fill="${u.url('band')}" filter="${u.url('soft2')}"/>` +
  `<path d="${BAND}" fill="${DORSAL_DARK}" opacity="0.45" filter="${u.url('soft1')}"/>` +
  // gốc đuôi đen
  `<ellipse cx="86" cy="154" rx="14" ry="17" fill="#0e0a08" opacity="0.85" filter="${u.url('soft2')}"/>` +
  // đầu: tấm má bạc + vùng quanh mắt sẫm
  `<path d="M412 44C440 46 470 66 486 94C492 128 482 172 462 214C446 244 424 264 404 278C396 230 394 170 400 120C402 92 406 64 412 44Z" fill="${u.url('cheek')}"/>` +
  `<path d="M420 46C436 44 456 52 468 66C470 90 466 112 458 122C446 118 430 112 420 100C414 84 414 62 420 46Z" fill="#0d1424" opacity="0.4" filter="${u.url('soft2')}"/>` +
  // hốc phát quang (thấy khi được đèn chiếu)
  sockets(PH_FRONT) +
  sockets(PH_REAR) +
  `</g>` +
  `<path d="${BODY}" fill="${u.url('vol')}"/>` +
  outline(BODY, OUTLINE, 1.8, 0.65) +
  // rim light mép lưng (đèn chiếu từ trên) + phản quang mép bụng
  `<path d="${DORSAL_EDGE}" fill="none" stroke="${u.url('rimTop')}" stroke-width="1.9" stroke-linecap="round"/>` +
  `<path d="${VENTRAL_EDGE}" fill="none" stroke="#dbe8ff" stroke-opacity="0.3" stroke-width="1.2"/>`;

const faceSvg =
  // mép nắp mang (gần thẳng đứng, sẫm) + viền sáng
  `<path d="M414 46C400 92 394 160 402 228C405 250 410 268 418 284" fill="none" stroke="#0c1220" stroke-opacity="0.7" stroke-width="2.2"/>` +
  `<path d="M416 50C403 94 397 160 405 228C408 250 413 266 420 280" fill="none" stroke="#f0f6ff" stroke-opacity="0.4" stroke-width="1"/>` +
  // tiền nắp mang
  `<path d="M432 110C424 150 426 196 442 250" fill="none" stroke="#0c1220" stroke-opacity="0.45" stroke-width="1.4"/>` +
  `<path d="M434 112C427 150 429 194 445 246" fill="none" stroke="#eef4fb" stroke-opacity="0.3" stroke-width="0.8"/>` +
  // tấm dưới mắt
  `<path d="M462 118C466 138 468 160 464 186" fill="none" stroke="#0c1220" stroke-opacity="0.35" stroke-width="1.2"/>` +
  // miệng xiên dốc hướng lên: khe miệng mở lên trên + xương hàm trên kéo xuống dưới mắt
  `<path d="M498 90C494 91 491 93 488 97C486 92 483 87 480 84C483 94 485 104 485 112C490 104 495 96 498 90Z" fill="#05070c" opacity="0.85"/>` +
  `<path d="M488 96C484 112 479 128 473 146C470 154 466 160 461 163" fill="none" stroke="#06080e" stroke-width="2.4" stroke-linecap="round"/>` +
  `<path d="M482 90C478 104 474 120 468 138C466 146 462 152 458 156" fill="none" stroke="#f2f7ff" stroke-opacity="0.4" stroke-width="1"/>` +
  // hàm dưới chìa lên (mép trước) + nét xương hàm
  `<path d="M497 94C497 112 493 134 486 154C480 172 472 186 464 200" fill="none" stroke="#06080e" stroke-opacity="0.5" stroke-width="1.4"/>` +
  `<path d="M492 100C490 118 486 136 480 154" fill="none" stroke="#f2f7ff" stroke-opacity="0.35" stroke-width="0.9"/>` +
  // răng nhỏ ở mép hàm dưới
  `<path d="M489 100l-3 2M487 108l-3 2M485 116l-3 2M483 124l-3 2M481 132l-3 2" stroke="#f4f8ff" stroke-opacity="0.65" stroke-width="0.9" stroke-linecap="round"/>` +
  // lỗ mũi
  `<circle cx="472" cy="80" r="1.6" fill="#06080e" opacity="0.8"/>` +
  // gai bụng nhỏ ở góc sau lưỡi rìu
  `<path d="M280 299L262 316L276 304Z" fill="#cfd9e8" stroke="${OUTLINE}" stroke-opacity="0.6" stroke-width="0.8" stroke-linejoin="round"/>` +
  // gai nhỏ trước vây hậu môn
  `<path d="M252 200L246 214L250 202Z" fill="#cfd9e8" stroke="${OUTLINE}" stroke-opacity="0.5" stroke-width="0.6"/>`;

const eyeSvg =
  // ống mắt (nhìn thẳng lên): khối bạc lam, sẫm hai bên
  `<path d="${EYE_TUBE}" fill="${u.url('tube')}" opacity="0.85" filter="${u.url('soft1')}"/>` +
  `<path d="M${EYE_CX - 10} ${EYE_CY + 18}C${EYE_CX - 11} ${EYE_CY + 26} ${EYE_CX - 8} ${EYE_CY + 32} ${EYE_CX - 3} ${EYE_CY + 35}" fill="none" stroke="#eef6ff" stroke-opacity="0.4" stroke-width="1.6" stroke-linecap="round"/>` +
  theEye.svg +
  // vòm thấu kính nhô lên trên
  `<path d="M${EYE_CX - 17} ${EYE_CY - 6}C${EYE_CX - 13} ${EYE_CY - 22} ${EYE_CX + 13} ${EYE_CY - 22} ${EYE_CX + 17} ${EYE_CY - 6}" fill="none" stroke="#e8f4ff" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round"/>` +
  `<ellipse cx="${EYE_CX + 3}" cy="${EYE_CY - 15}" rx="6" ry="2" fill="#ffffff" opacity="0.55"/>`;

const art: CreatureArt = {
  id: 'ca_riu_bien',
  viewBox: [512, 340],
  lengthUnits: 472,
  spineY: 155,
  animation: 'fish',
  // cá rìu lơ lửng gần như bất động, chỉ quạt nhẹ đuôi/vây ngực
  cycleHz: 1.1,
  bendAmp: 7,
  // Thật chỉ ~5–12 cm → công thức cho ~51 px; nâng lên 60 px để dáng lưỡi rìu, mắt ống
  // và hàng điểm phát quang dọc bụng (mỗi ô ~1 px + quầng) còn đọc được trong game.
  displayLengthPx: 60,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'tail',
      role: 'tail',
      svg:
        finMembrane(TAIL, u.url('tailFill'), { opacity: 1 }) +
        finRays([84, 154], [
          [24, 103], [32, 115], [41, 128], [49, 141], [55, 153], [49, 166], [41, 180], [32, 193], [24, 205],
        ], { color: FIN_RAY, opacity: 0.42, width: 0.8, bend: 0.03 }) +
        finEdge(TAIL_EDGE, 1, 0.4),
    },
    {
      name: 'dorsal',
      role: 'detail',
      svg:
        finMembrane(DORSAL_FIN, u.url('fin'), { opacity: 1 }) +
        finRays(
          [[304, 46], [298, 47], [290, 49], [282, 51], [274, 53], [268, 55]],
          [[298, 24], [292, 26], [286, 31], [280, 36], [274, 42], [269, 50]],
          { color: FIN_RAY, opacity: 0.5, width: 0.8, bend: 0.03 },
        ) +
        finEdge(DORSAL_FIN_EDGE),
    },
    {
      name: 'blade',
      role: 'detail',
      svg:
        `<path d="${BLADE}" fill="${u.url('bladeFill')}" stroke="${OUTLINE}" stroke-opacity="0.6" stroke-width="0.9" stroke-linejoin="round"/>` +
        `<path d="M322 24L316 40" stroke="#ffffff" stroke-opacity="0.5" stroke-width="0.8"/>`,
    },
    {
      name: 'adipose',
      role: 'detail',
      svg:
        `<path d="${ADIPOSE}" fill="${u.url('fin')}"/>` +
        finEdge('M154 102C152 95 146 91 140 92C135 95 132 102 131 112', 0.9, 0.45),
    },
    {
      name: 'anal',
      role: 'detail',
      svg:
        finMembrane(ANAL_FIN, u.url('fin'), { opacity: 1 }) +
        finRays(
          [[236, 191], [226, 189], [214, 187], [202, 185], [190, 183], [180, 182]],
          [[228, 212], [218, 211], [206, 208], [194, 204], [184, 198], [178, 188]],
          { color: FIN_RAY, opacity: 0.45, width: 0.8, bend: -0.03 },
        ) +
        finEdge(ANAL_FIN_EDGE, 0.9, 0.4),
    },
    {
      name: 'pelvic',
      role: 'detail',
      svg:
        finMembrane(PELVIC, u.url('fin'), { opacity: 1 }) +
        finRays([294, 304], [[274, 321], [280, 316], [286, 310]], { color: FIN_RAY, opacity: 0.45, width: 0.7 }),
    },
    { name: 'body', role: 'body', svg: bodySvg },
    { name: 'face', role: 'detail', svg: faceSvg },
    { name: 'eye', role: 'eye', svg: eyeSvg },
    {
      name: 'glowRear',
      role: 'glow',
      bend: true,
      blend: 'add',
      svg: glowDots(PH_REAR),
    },
    {
      name: 'pectoral',
      role: 'fin',
      z: 'front',
      pivot: [394, 193],
      anim: { type: 'rotate', amp: 0.3, speed: 1.3 },
      svg:
        `<path d="${PECTORAL}" fill="${u.url('fin')}" stroke="#e4edf8" stroke-opacity="0.45" stroke-width="0.9" stroke-linejoin="round"/>` +
        finRays([394, 193], [[350, 206], [352, 216], [356, 226], [362, 234], [370, 226]], { color: FIN_RAY, opacity: 0.5, width: 0.7 }),
    },
    {
      name: 'glowFront',
      role: 'glow',
      bend: false,
      z: 'front',
      blend: 'add',
      pivot: [360, 296],
      anim: { type: 'alpha', amp: 0.25, speed: 0.3 },
      svg:
        // quầng sáng tỏa xuống dưới bụng (xóa bóng)
        `<ellipse cx="350" cy="314" rx="100" ry="24" fill="${u.url('underGlow')}"/>` +
        glowDots(PH_FRONT),
    },
  ],
};

export default art;
