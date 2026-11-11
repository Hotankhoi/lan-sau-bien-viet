/**
 * Cá cần câu biển sâu – Melanocetus johnsonii, cá cái (Vùng khơi xa, Tầng 3 – biển sâu)
 * Tham khảo: references/ca_can_cau (ref2 hình ngang thân – tỉ lệ chuẩn; ref3/ref5 dáng bụng bóng; ref4 màu đen bóng).
 * Đặc điểm nhận dạng: thân tròn như quả bóng, lưng gù, da đen nâu nhung không vảy; miệng khổng lồ gần thẳng đứng,
 * HÀM DƯỚI chìa ra trước và hếch lên; răng kim dài trong suốt cong vào trong; mắt rất nhỏ; vây ngực nhỏ có cuống,
 * vây lưng/hậu môn nhỏ sát cuống đuôi, đuôi quạt tròn.
 * Đặc trưng: "cần câu" (illicium) mọc từ đỉnh mõm, đầu là mồi phát quang (esca) → lớp glow cộng sáng, lam/lục lam,
 * đung đưa quanh gốc cần (bend:false).
 */
import type { CreatureArt } from '../contract';
import {
  makeIds,
  counterShade,
  rimGradient,
  clip,
  eye,
  finRays,
  finMembrane,
  linear,
  radial,
  glowFilter,
  blurFilter,
  organicTexture,
  dotPattern,
  outline,
  rimLight,
  bezierPoint,
  rng,
  joinDefs,
} from '../style-bible';

const u = makeIds('ca_can_cau');

type P = [number, number];

// ---------- Màu ----------
const DORSAL = '#0e0908';
const FLANK = '#17100d';
const BELLY = '#231915';
const OUTLINE = '#060303';
const FIN_RAY = '#b8a690';
const SKIN_HI = '#7a5a48';

// ---------- Thân (gồm cả hai hàm; khoang miệng vẽ đè bên trong) ----------
const SNOUT: P = [412, 112];
const JAW_TIP: P = [492, 142];
const JAW_ANGLE: P = [380, 268];

const BODY =
  `M${SNOUT[0]} ${SNOUT[1]}` +
  `C440 120 468 135 ${JAW_TIP[0]} ${JAW_TIP[1]}` + // mép mở miệng (khoảng nước)
  'C499 145 500 155 495 161' + // đầu hàm dưới
  'C480 196 454 232 424 260' + // cằm – mặt ngoài hàm dưới
  'C404 280 392 304 368 320' + // họng → bụng
  'C338 338 286 342 250 326' + // đáy bụng tròn, trễ xuống
  'C214 310 196 282 186 258' + // bụng sau
  'C176 246 160 242 140 238' +
  'C126 235 112 232 100 230' + // cuống đuôi dưới
  'C96 212 96 190 100 172' + // gốc đuôi
  'C114 168 130 164 148 159' + // cuống đuôi trên
  'C172 152 190 138 206 118' + // dốc lưng
  'C226 90 256 66 296 62' + // gù lưng
  'C336 58 370 72 392 90' + // trán
  'C402 98 409 105 412 112Z';

const DORSAL_EDGE =
  'M412 112C409 105 402 98 392 90C370 72 336 58 296 62C256 66 226 90 206 118C190 138 172 152 148 159';
const BELLY_EDGE = 'M424 260C404 280 392 304 368 320C338 338 286 342 250 326C214 310 196 282 186 258';

// hàm trên: từ mõm chạy xuống góc miệng (hơi phình ra trước)
const UJ: [P, P, P, P] = [SNOUT, [421, 150], [411, 212], JAW_ANGLE];
// mép trong hàm dưới: từ góc miệng lên đầu hàm
const LJ: [P, P, P, P] = [JAW_ANGLE, [420, 238], [466, 186], [490, 145]];

const MOUTH =
  `M${SNOUT[0]} ${SNOUT[1]}C440 120 468 135 ${JAW_TIP[0]} ${JAW_TIP[1]}` +
  `C466 186 420 238 ${JAW_ANGLE[0]} ${JAW_ANGLE[1]}` +
  `C411 212 421 150 ${SNOUT[0]} ${SNOUT[1]}Z`;
const UJ_LINE = `M${SNOUT[0]} ${SNOUT[1]}C421 150 411 212 ${JAW_ANGLE[0]} ${JAW_ANGLE[1]}`;
const LJ_LINE = `M${JAW_ANGLE[0]} ${JAW_ANGLE[1]}C420 238 466 186 490 145`;
// mặt ngoài hàm dưới (dải giữa mép trong và cằm)
const LOWER_JAW =
  `M${JAW_ANGLE[0]} ${JAW_ANGLE[1]}C420 238 466 186 491 144C499 145 500 155 495 161C480 196 454 232 424 260C410 274 398 282 382 286C378 282 378 274 ${JAW_ANGLE[0]} ${JAW_ANGLE[1]}Z`;

// ---------- Răng kim trong suốt ----------
function tooth(b: P, ang: number, len: number, w: number, curve: number): string {
  const d: P = [Math.cos(ang), Math.sin(ang)];
  const p: P = [-d[1], d[0]];
  const t: P = [b[0] + d[0] * len, b[1] + d[1] * len];
  const m: P = [b[0] + d[0] * len * 0.55 + p[0] * curve * len, b[1] + d[1] * len * 0.55 + p[1] * curve * len];
  const f = (n: number) => n.toFixed(1);
  return (
    `M${f(b[0] + (p[0] * w) / 2)} ${f(b[1] + (p[1] * w) / 2)}` +
    `Q${f(m[0] + p[0] * w * 0.28)} ${f(m[1] + p[1] * w * 0.28)} ${f(t[0])} ${f(t[1])}` +
    `Q${f(m[0] - p[0] * w * 0.28)} ${f(m[1] - p[1] * w * 0.28)} ${f(b[0] - (p[0] * w) / 2)} ${f(b[1] - (p[1] * w) / 2)}Z`
  );
}

/** Rải răng dọc một đường Bezier; dir: hướng xoay thêm (rad) so với pháp tuyến vào khoang miệng. */
function teethRow(
  bz: [P, P, P, P],
  seed: number,
  o: { t0: number; t1: number; n: number; lenMin: number; lenMax: number; turn: number; curve: number; long?: (t: number) => number },
): { teeth: string; core: string } {
  const r = rng(seed);
  let teeth = '';
  let core = '';
  for (let i = 0; i < o.n; i++) {
    const tt = o.t0 + ((o.t1 - o.t0) * (i + 0.3 + r() * 0.4)) / o.n;
    const b = bezierPoint(bz[0], bz[1], bz[2], bz[3], tt);
    const b2 = bezierPoint(bz[0], bz[1], bz[2], bz[3], Math.min(1, tt + 0.01));
    const tx = b2[0] - b[0];
    const ty = b2[1] - b[1];
    const nAng = Math.atan2(-tx, ty); // pháp tuyến (ty, -tx) → hướng vào khoang miệng
    const k = o.long ? o.long(tt) : 1;
    const len = (o.lenMin + r() * (o.lenMax - o.lenMin)) * k;
    const ang = nAng + o.turn + (r() - 0.5) * 0.35;
    const w = Math.max(1.6, len * 0.13);
    teeth += tooth(b, ang, len, w, o.curve);
    // gân sáng giữa răng
    const d: P = [Math.cos(ang), Math.sin(ang)];
    core += `M${(b[0] + d[0] * 1.5).toFixed(1)} ${(b[1] + d[1] * 1.5).toFixed(1)}L${(b[0] + d[0] * len * 0.6).toFixed(1)} ${(b[1] + d[1] * len * 0.6).toFixed(1)}`;
  }
  return { teeth, core };
}

// răng hàm trên: chĩa vào khoang miệng, hơi xuống, cong về họng
const upperTeeth = teethRow(UJ, 11, {
  t0: 0.04,
  t1: 0.82,
  n: 9,
  lenMin: 11,
  lenMax: 22,
  turn: 0.75,
  curve: 0.12,
  long: (t) => 1.3 - t * 0.6,
});
// răng hàm dưới: dựng lên, dài nhất ở phía trước, cong về sau (vào trong)
const lowerTeeth = teethRow(LJ, 23, {
  t0: 0.08,
  t1: 0.97,
  n: 11,
  lenMin: 12,
  lenMax: 22,
  turn: 0.3,
  curve: -0.14,
  long: (t) => 0.55 + t * 0.95,
});
// hàng răng phía xa (mờ hơn, ngắn hơn, ở sâu trong miệng)
const farTeeth = teethRow(LJ, 41, { t0: 0.15, t1: 0.9, n: 8, lenMin: 8, lenMax: 15, turn: 0.5, curve: -0.08 });

// ---------- Vây ----------
const TAIL = 'M103 176C86 162 62 150 42 152C29 168 22 186 22 202C22 218 29 236 42 251C62 253 86 241 103 226Z';
const TAIL_EDGE = 'M42 152C29 168 22 186 22 202C22 218 29 236 42 251';
const TAIL_TIPS: P[] = [
  [44, 153],
  [34, 162],
  [27, 175],
  [23, 189],
  [22, 203],
  [24, 217],
  [28, 230],
  [35, 242],
  [44, 250],
];
const TAIL_BASES: P[] = TAIL_TIPS.map((_, i) => [100, 178 + (i * 46) / (TAIL_TIPS.length - 1)] as P);

const DORSAL_FIN = 'M204 124C198 112 186 104 172 102C158 105 147 117 141 133C141 145 143 152 148 158C168 152 188 140 204 124Z';
const DORSAL_FIN_EDGE = 'M204 124C198 112 186 104 172 102C158 105 147 117 141 133';
const DORSAL_BASES: P[] = [
  [201, 128],
  [195, 133],
  [189, 138],
  [183, 142],
  [177, 145],
  [171, 148],
  [165, 151],
  [159, 154],
  [153, 156],
];
const DORSAL_TIPS: P[] = [
  [198, 114],
  [190, 107],
  [181, 103],
  [172, 102],
  [163, 104],
  [156, 109],
  [149, 116],
  [144, 124],
  [141, 134],
];

const ANAL_FIN = 'M174 252C172 266 166 276 156 282C144 276 134 264 128 250C130 244 134 238 140 238C152 240 164 246 174 252Z';
const ANAL_FIN_EDGE = 'M174 252C172 266 166 276 156 282C144 276 134 264 128 250';

const PECT_PIVOT: P = [272, 176];
const PECTORAL =
  'M274 170C262 160 246 154 232 158C222 164 220 178 226 188C234 196 250 196 262 190C268 186 272 182 274 180Z';
const PECT_STALK = 'M286 172C284 166 276 164 270 167C266 172 266 182 270 186C276 189 284 186 286 180C287 177 287 174 286 172Z';

// ---------- Cần câu & mồi ----------
const LURE_BASE: P = [397, 98];
const ILLICIUM = 'M397 98C397 70 410 42 436 38C450 36 460 44 462 53';
const ESCA: P = [462, 61];

// ---------- Hàng u nhú cảm giác (đường bên) ----------
function papillae(): string {
  const rows: [P, P, P, P][] = [
    [[372, 104], [356, 150], [350, 210], [360, 278]], // sau hàm trên
    [[350, 92], [318, 100], [290, 118], [262, 150]], // trên đầu → gáy
    [[262, 196], [226, 204], [196, 206], [150, 200]], // giữa hông → cuống đuôi
    [[338, 250], [316, 274], [290, 292], [256, 300]], // bụng
  ];
  let s = '';
  rows.forEach((bz, k) => {
    const n = k === 0 ? 9 : 8;
    for (let i = 0; i < n; i++) {
      const [x, y] = bezierPoint(bz[0], bz[1], bz[2], bz[3], (i + 0.5) / n);
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1 + ((i * 7 + k * 3) % 4) * 0.2).toFixed(1)}"/>`;
    }
  });
  return `<g fill="#c6ae96" fill-opacity="0.16">${s}</g>`;
}

const theEye = eye(u, 'eye', {
  cx: 387,
  cy: 117,
  r: 5,
  iris: ['#6d8590', '#18232a'],
  pupil: 'round',
  socket: '#070404',
  look: [0.3, 0.1],
});

const defs = joinDefs(
  counterShade(u('bodyFill'), { dorsal: DORSAL, flank: FLANK, belly: BELLY, flankAt: 0.5 }),
  rimGradient(u('rim'), '#f4ecff', 0.95),
  clip(u('bodyClip'), BODY),
  theEye,
  organicTexture(u('tex'), { freq: 0.14, octaves: 2, strength: 0.22, seed: 7 }),
  dotPattern(u('velvet'), { gap: 3.2, r: 0.45, color: '#8a6c58', opacity: 0.14 }),
  blurFilter(u('soft'), 6),
  blurFilter(u('soft2'), 2.5),
  // bóng khối nhẹ cho thân đen (sáng vai trên-trước, tối bụng sau)
  radial(
    u('vol'),
    [
      [0, '#d8c2b2', 0.16],
      [0.45, '#d8c2b2', 0],
      [0.78, '#000000', 0],
      [1, '#000000', 0.38],
    ],
    { cx: 0.62, cy: 0.26, r: 0.78 },
  ),
  // phản chiếu xanh lạnh ở mép bụng (ánh mồi / ánh đèn hắt lên)
  linear(u('rimBelly'), [
    [0.62, '#9fd8ff', 0],
    [0.86, '#9fd8ff', 0.08],
    [1, '#c8ecff', 0.42],
  ]),
  // ánh bóng nhung trên bụng
  radial(
    u('sheen'),
    [
      [0, '#8a6a58', 0.34],
      [0.6, '#5a4034', 0.1],
      [1, '#5a4034', 0],
    ],
    { cx: 0.5, cy: 0.5, r: 0.5 },
  ),
  // khoang miệng: sâu tối ở góc miệng, hơi đỏ sẫm gần mép
  radial(
    u('mouth'),
    [
      [0, '#000000'],
      [0.55, '#0d0505'],
      [0.85, '#220c0e'],
      [1, '#331516'],
    ],
    { cx: 0.15, cy: 0.95, r: 1.05, fx: 0.1, fy: 1 },
  ),
  linear(
    u('jaw'),
    [
      [0, '#3b2a24'],
      [0.5, '#251915'],
      [1, '#120b09'],
    ],
    { x1: 0, y1: 0, x2: 0.4, y2: 1 },
  ),
  linear(
    u('tooth'),
    [
      [0, '#f6fbff', 0.78],
      [1, '#cfe3ea', 0.3],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 1 },
  ),
  linear(
    u('tailFill'),
    [
      [0, '#4a3a30', 0.5],
      [0.55, '#2a1f1a', 0.72],
      [1, '#120c0a', 0.95],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 0 },
  ),
  linear(u('fin'), [
    [0, '#3e2f27', 0.62],
    [1, '#1a1210', 0.78],
  ]),
  linear(
    u('stalk'),
    [
      [0, '#3a2a22'],
      [1, '#1a110e'],
    ],
    { x1: 0, y1: 1, x2: 1, y2: 0 },
  ),
  // mồi: thân bóng mờ đục (thấy khi chiếu đèn)
  radial(
    u('escaBulb'),
    [
      [0, '#eafffb'],
      [0.5, '#9ff5e8'],
      [0.85, '#3c8f8a'],
      [1, '#1c3c3e'],
    ],
    { cx: 0.42, cy: 0.62, r: 0.62 },
  ),
  radial(u('halo'), [
    [0, '#7CF7FF', 0.75],
    [0.25, '#5BFFB0', 0.38],
    [0.6, '#3FB8FF', 0.12],
    [1, '#1E6BFF', 0],
  ]),
  radial(u('haloBig'), [
    [0, '#7CF7FF', 0.5],
    [0.35, '#5BFFB0', 0.2],
    [1, '#2a7bff', 0],
  ]),
  glowFilter(u('glow'), 2.4, 2),
);

const finEdge = (d: string, w = 1.1, op = 0.38) =>
  `<path d="${d}" fill="none" stroke="#c9b8a2" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

const art: CreatureArt = {
  id: 'ca_can_cau',
  viewBox: [512, 352],
  lengthUnits: 476,
  spineY: 200,
  animation: 'fish',
  // treo lơ lửng, bơi rất chậm; thân tròn gần như không uốn
  cycleHz: 0.7,
  bendAmp: 5,
  // Thật chỉ ~18 cm → công thức cho ~64 px, miệng/răng/cần câu sẽ dính thành một cục đen.
  // Nâng lên 100 px để đọc được dáng "quả bóng + miệng há + cần câu" (khoảnh khắc ấn tượng nhất Tầng 3).
  displayLengthPx: 100,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'tail',
      role: 'tail',
      svg:
        finMembrane(TAIL, u.url('tailFill'), { opacity: 1 }) +
        finRays(TAIL_BASES, TAIL_TIPS, { color: FIN_RAY, opacity: 0.36, width: 1, bend: 0.03 }) +
        finEdge(TAIL_EDGE, 1.2, 0.45),
    },
    {
      name: 'dorsal',
      role: 'detail',
      svg:
        finMembrane(DORSAL_FIN, u.url('fin'), { opacity: 0.9 }) +
        finRays(DORSAL_BASES, DORSAL_TIPS, { color: FIN_RAY, opacity: 0.36, width: 0.9, bend: 0.04 }) +
        finEdge(DORSAL_FIN_EDGE),
    },
    {
      name: 'anal',
      role: 'detail',
      svg:
        finMembrane(ANAL_FIN, u.url('fin'), { opacity: 0.9 }) +
        finRays(
          [[170, 250], [160, 245], [150, 241], [140, 239]],
          [[158, 280], [148, 274], [138, 264], [130, 252]],
          { color: FIN_RAY, opacity: 0.36, width: 0.9, bend: -0.04 },
        ) +
        finEdge(ANAL_FIN_EDGE, 1.1, 0.45),
    },
    {
      name: 'body',
      role: 'body',
      svg:
        `<g filter="${u.url('tex')}"><path d="${BODY}" fill="${u.url('bodyFill')}"/></g>` +
        `<g clip-path="${u.url('bodyClip')}">` +
        // bóng nhung trên bụng tròn & gù lưng
        `<ellipse cx="296" cy="262" rx="64" ry="40" fill="${u.url('sheen')}" opacity="0.7"/>` +
        `<ellipse cx="300" cy="96" rx="58" ry="26" fill="${u.url('sheen')}" opacity="0.55"/>` +
        `<path d="${BODY}" fill="${u.url('velvet')}"/>` +
        // điểm bóng loáng (da nhung ướt bắt đèn – ref4)
        `<ellipse cx="318" cy="80" rx="30" ry="7" fill="#e6dcff" opacity="0.08" filter="${u.url('soft2')}" transform="rotate(-8 318 80)"/>` +
        `<ellipse cx="318" cy="232" rx="40" ry="14" fill="#d8c8ff" opacity="0.07" filter="${u.url('soft')}"/>` +
        // gáy sau đầu sẫm (vùng lõm giữa đầu và gù)
        `<ellipse cx="338" cy="176" rx="34" ry="70" fill="#050202" opacity="0.35" filter="${u.url('soft')}"/>` +
        // cuống đuôi sẫm
        `<rect x="96" y="160" width="40" height="80" fill="#050202" opacity="0.4" filter="${u.url('soft')}"/>` +
        papillae() +
        `<path d="${BODY}" fill="${u.url('rimBelly')}"/>` +
        `</g>` +
        `<path d="${BODY}" fill="${u.url('vol')}"/>` +
        outline(BODY, OUTLINE, 1.8, 0.75) +
        rimLight(BODY, u.url('rim'), 2.4) +
        `<path d="${DORSAL_EDGE}" fill="none" stroke="#f0e6ff" stroke-opacity="0.32" stroke-width="0.9"/>` +
        `<path d="${BELLY_EDGE}" fill="none" stroke="#bfe6ff" stroke-opacity="0.3" stroke-width="1.3"/>`,
    },
    {
      name: 'mouth',
      role: 'detail',
      svg:
        // khoang miệng
        `<path d="${MOUTH}" fill="${u.url('mouth')}"/>` +
        // cung mang mờ trong họng
        `<g fill="none" stroke="#5a2a2a" stroke-opacity="0.35" stroke-width="1.6" stroke-linecap="round">` +
        `<path d="M398 176C404 200 402 228 392 250"/><path d="M408 164C416 192 414 222 402 246"/></g>` +
        // hàng răng phía xa
        `<path d="${farTeeth.teeth}" fill="#d8e8ee" fill-opacity="0.3"/>` +
        // mặt ngoài hàm dưới
        `<path d="${LOWER_JAW}" fill="${u.url('jaw')}"/>` +
        `<path d="M486 170C470 200 446 232 416 258" fill="none" stroke="#05030a" stroke-opacity="0.55" stroke-width="1.4"/>` +
        `<path d="M480 176C466 202 444 228 420 250" fill="none" stroke="${SKIN_HI}" stroke-opacity="0.22" stroke-width="1"/>` +
        // môi hàm dưới (mép trong)
        `<path d="${LJ_LINE}" fill="none" stroke="#4d3830" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="${LJ_LINE}" fill="none" stroke="#c9a896" stroke-opacity="0.35" stroke-width="1" stroke-linecap="round"/>` +
        // môi hàm trên
        `<path d="${UJ_LINE}" fill="none" stroke="#3e2c25" stroke-width="3.4" stroke-linecap="round"/>` +
        `<path d="M410 116C418 150 410 206 383 262" fill="none" stroke="#d2b4a2" stroke-opacity="0.32" stroke-width="1" stroke-linecap="round"/>` +
        // răng kim trong suốt
        `<path d="${lowerTeeth.teeth}" fill="${u.url('tooth')}" stroke="#ffffff" stroke-opacity="0.45" stroke-width="0.5"/>` +
        `<path d="${upperTeeth.teeth}" fill="${u.url('tooth')}" stroke="#ffffff" stroke-opacity="0.45" stroke-width="0.5"/>` +
        `<path d="${lowerTeeth.core}${upperTeeth.core}" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="0.5" stroke-linecap="round"/>`,
    },
    {
      name: 'face',
      role: 'detail',
      svg:
        // nếp gấp má (ref2): hai đường cong từ đỉnh đầu xuống góc miệng
        `<path d="M372 102C360 144 352 206 362 290" fill="none" stroke="#040202" stroke-opacity="0.45" stroke-width="1.6"/>` +
        `<path d="M374 106C363 146 356 200 362 250" fill="none" stroke="${SKIN_HI}" stroke-opacity="0.2" stroke-width="0.9"/>` +
        `<path d="M396 126C390 168 384 214 372 262" fill="none" stroke="#040202" stroke-opacity="0.5" stroke-width="1.4"/>` +
        `<path d="M398 128C392 170 386 214 375 260" fill="none" stroke="${SKIN_HI}" stroke-opacity="0.22" stroke-width="0.8"/>` +
        // gờ mõm
        `<path d="M392 90C400 96 408 104 412 112" fill="none" stroke="${SKIN_HI}" stroke-opacity="0.35" stroke-width="1.2"/>` +
        // lỗ mũi
        `<ellipse cx="404" cy="106" rx="1.8" ry="1.3" fill="#020101" opacity="0.85"/>` +
        // gốc cần câu (u gồ)
        `<ellipse cx="397" cy="98" rx="5" ry="3.2" fill="#2e211c"/>` +
        `<ellipse cx="396" cy="96.6" rx="3" ry="1.4" fill="${SKIN_HI}" opacity="0.4"/>` +
        // khe mang nhỏ sau-dưới gốc vây ngực
        `<path d="M280 194C283 198 284 203 282 207" fill="none" stroke="#020101" stroke-opacity="0.6" stroke-width="1.6" stroke-linecap="round"/>` +
        `<path d="M281.6 193.6C284.6 197.6 285.6 202.6 283.6 206.6" fill="none" stroke="${SKIN_HI}" stroke-opacity="0.18" stroke-width="0.7"/>`,
    },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    {
      name: 'pectoral',
      role: 'fin',
      z: 'front',
      pivot: PECT_PIVOT,
      anim: { type: 'rotate', amp: 0.22, speed: 1.1 },
      svg:
        `<path d="${PECT_STALK}" fill="#22180f" stroke="${OUTLINE}" stroke-opacity="0.35" stroke-width="0.8"/>` +
        `<path d="M284 169C280 166 275 166 271 168" fill="none" stroke="${SKIN_HI}" stroke-opacity="0.3" stroke-width="0.8"/>` +
        `<path d="${PECTORAL}" fill="${u.url('fin')}" fill-opacity="0.85" stroke="#c9b8a2" stroke-opacity="0.4" stroke-width="1" stroke-linejoin="round"/>` +
        finRays(PECT_PIVOT, [[236, 158], [228, 166], [225, 176], [227, 186], [236, 192], [250, 194], [262, 189]], {
          color: FIN_RAY,
          opacity: 0.5,
          width: 0.9,
          bend: 0.05,
        }),
    },
    {
      // cần câu (illicium) – đung đưa quanh gốc trên mõm
      name: 'lure',
      role: 'detail',
      bend: false,
      z: 'front',
      pivot: LURE_BASE,
      anim: { type: 'rotate', amp: 0.1, speed: 0.55 },
      svg:
        `<path d="${ILLICIUM}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.7" stroke-width="4.4" stroke-linecap="round"/>` +
        `<path d="${ILLICIUM}" fill="none" stroke="${u.url('stalk')}" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M396 92C397 68 410 44 434 40" fill="none" stroke="#e8dcff" stroke-opacity="0.35" stroke-width="0.9" stroke-linecap="round"/>` +
        // gốc mồi sẫm (cuống sắc tố)
        `<path d="M458 52C459 49 465 49 466 52L467 56L457 56Z" fill="#1c1210"/>` +
        // bầu mồi (thấy khi chiếu đèn)
        `<ellipse cx="${ESCA[0]}" cy="${ESCA[1]}" rx="6.4" ry="7.2" fill="${u.url('escaBulb')}" stroke="#0e2a2c" stroke-opacity="0.6" stroke-width="0.8"/>` +
        // tua nhỏ ở chóp mồi
        `<path d="M460 68C459.4 70 458 71.4 456.4 72M463.6 68.2C464 70.6 463.6 72.6 462.6 74.4" fill="none" stroke="#9ff0e4" stroke-opacity="0.7" stroke-width="0.9" stroke-linecap="round"/>`,
    },
    {
      // lõi sáng của mồi – cùng nhịp đung đưa với cần câu
      name: 'esca',
      role: 'glow',
      bend: false,
      z: 'front',
      blend: 'add',
      pivot: LURE_BASE,
      anim: { type: 'rotate', amp: 0.1, speed: 0.55 },
      svg:
        `<circle cx="${ESCA[0]}" cy="${ESCA[1] + 1}" r="20" fill="${u.url('halo')}"/>` +
        `<g filter="${u.url('glow')}">` +
        `<ellipse cx="${ESCA[0]}" cy="${ESCA[1] + 0.5}" rx="4.6" ry="5.4" fill="#7CF7FF"/>` +
        `<path d="M460 68C459.4 70 458 71.4 456.4 72M463.6 68.2C464 70.6 463.6 72.6 462.6 74.4" fill="none" stroke="#5BFFB0" stroke-width="1" stroke-linecap="round"/>` +
        `</g>` +
        `<ellipse cx="${ESCA[0] - 1}" cy="${ESCA[1] + 1}" rx="2.2" ry="2.6" fill="#EFFFFF"/>`,
    },
    {
      // quầng sáng lớn, phập phồng chậm quanh mồi
      name: 'escaHalo',
      role: 'glow',
      bend: false,
      z: 'front',
      blend: 'add',
      pivot: ESCA,
      anim: { type: 'alpha', amp: 0.4, speed: 0.6 },
      svg: `<circle cx="${ESCA[0]}" cy="${ESCA[1] + 2}" r="46" fill="${u.url('haloBig')}" filter="${u.url('soft2')}"/>`,
    },
  ],
};

export default art;
