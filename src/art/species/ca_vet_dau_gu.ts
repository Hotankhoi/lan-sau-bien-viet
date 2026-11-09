/**
 * Cá vẹt đầu gù – Bolbometopon muricatum
 * Đặc điểm nhận dạng: trán gồ thành bướu cao, mặt trước gần thẳng đứng (ngả hồng / xanh nhạt);
 * mỏ vẹt do răng hợp thành, lộ ra ngoài, màu trắng ngà – xanh nhạt; thân lớn chắc xanh lục ô liu
 * đến xanh lam xám, vảy to rõ; vây lưng & hậu môn dài thấp xanh đen; đuôi rộng gần cụt.
 * Bơi chủ yếu bằng vây ngực (lớp tách rời, vẫy rõ).
 */
import type { CreatureArt } from '../contract';
import {
  makeIds,
  standardBody,
  eye,
  finRays,
  linear,
  radial,
  blurFilter,
  scatterSpots,
  smoothPath,
  joinDefs,
  rng,
} from '../style-bible';

const u = makeIds('ca_vet_dau_gu');

const FIN_D = '#1c2c33';
const INK = '#1a2c2b';
const PINK = '#d9a29a';
const IVORY = '#eef0dc';

// ---------- Đường viền thân ----------
/** Đường lưng: cuống đuôi → lưng → bướu trán → mặt trước → mỏ trên */
const TOP: [number, number][] = [
  [142, 155], [160, 148], [185, 133], [218, 110], [262, 86], [320, 67], [385, 57], [440, 57],
  [470, 62], [486, 57], [506, 46], [530, 38], [553, 39], [569, 49], [578, 72], [582, 104],
  [587, 138], [592, 162], [596, 180],
];
/** Đường bụng: dưới mỏ → cằm → họng → bụng → cuống đuôi */
const BOTTOM: [number, number][] = [
  [592, 197], [584, 209], [566, 223], [536, 239], [496, 255], [450, 265], [405, 269], [360, 267],
  [310, 259], [260, 247], [215, 236], [182, 229], [160, 225], [142, 222],
];

const BODY = smoothPath(TOP) + smoothPath(BOTTOM).replace(/^M/, 'L') + 'C136 206 136 172 142 155Z';

function interp(pts: [number, number][], x: number): number {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if ((x >= x1 && x <= x2) || (x <= x1 && x >= x2)) return y1 + ((x - x1) / (x2 - x1 || 1)) * (y2 - y1);
  }
  return pts[pts.length - 1][1];
}
const backY = (x: number) => interp(TOP, x);
const bellyY = (x: number) => interp(BOTTOM, x);

// ---------- Vảy to (pattern riêng: vảy xếp so le, mép tự do cong về phía đuôi) ----------
function bigScales(id: string, color: string, op: number, sw: number): string {
  const H = 14;
  const W = 11;
  const rx = H * 0.42;
  const arc = (x: number, y: number) => `M${x} ${y}A${rx} ${H / 2} 0 0 0 ${x} ${y + H}`;
  const d = [arc(0, 0), arc(W, 0), arc(W / 2, -H / 2), arc(W / 2, H / 2), arc(W * 1.5, -H / 2), arc(W * 1.5, H / 2)].join('');
  return `<pattern id="${id}" width="${W}" height="${H}" patternUnits="userSpaceOnUse"><path d="${d}" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="${sw}"/></pattern>`;
}

// ---------- Vây lưng dài thấp (gai ở trước, tia mềm ở sau) ----------
function dorsalFin(): { d: string; edge: string; rays: string } {
  const top: [number, number][] = [];
  const base: [number, number][] = [];
  const x0 = 476;
  const x1 = 168;
  const n = 34;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    let h = 3 + 10 * Math.sin(Math.PI * Math.min(1, 0.06 + t * 1.02));
    if (t > 0.04 && t < 0.42) h += i % 2 === 0 ? 0.9 : -0.6; // mép gai hơi lượn
    const y = backY(x);
    const slope = (backY(x - 4) - backY(x + 4)) / 8;
    top.push([x - slope * 0.6 * h, y - h]);
    base.push([x, y + 8]);
  }
  const topD = smoothPath(top, false, 0.35);
  const d = topD + [...base].reverse().map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join('') + 'Z';
  const rays = finRays(
    base.filter((_, i) => i % 2 === 0).map(([x, y]) => [x, y - 6] as [number, number]),
    top.filter((_, i) => i % 2 === 0),
    { color: '#8fb3bb', opacity: 0.22, width: 0.8, bend: 0.03 },
  );
  return { d, edge: topD, rays };
}

// ---------- Vây hậu môn dài thấp ----------
function analFin(): { d: string; edge: string; rays: string } {
  const bot: [number, number][] = [];
  const base: [number, number][] = [];
  const x0 = 306;
  const x1 = 166;
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const h = 4 + 14 * Math.sin(Math.PI * Math.min(1, 0.18 + t * 0.95)) * (1 - t * 0.3);
    const y = bellyY(x);
    bot.push([x - h * 0.4, y + h]);
    base.push([x, y - 7]);
  }
  const edge = smoothPath(bot, false, 0.4);
  const d = edge + [...base].reverse().map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join('') + 'Z';
  const rays = finRays(
    base.filter((_, i) => i % 2 === 0).map(([x, y]) => [x, y + 5] as [number, number]),
    bot.filter((_, i) => i % 2 === 0),
    { color: '#8fb3bb', opacity: 0.25, width: 0.8, bend: 0.03 },
  );
  return { d, edge, rays };
}

const DORSAL = dorsalFin();
const ANAL = analFin();

// ---------- Đuôi rộng gần cụt ----------
const CAUDAL =
  'M164 150C134 146 104 136 76 126C60 120 46 116 34 115C40 134 46 160 47 189C47 218 42 244 36 265' +
  'C48 263 64 258 80 252C106 244 134 234 164 228Z';
const CAUDAL_EDGE = 'M34 115C40 134 46 160 47 189C47 218 42 244 36 265';
const CAUDAL_TIPS: [number, number][] = [
  [36, 118], [41, 132], [44, 146], [46, 160], [47, 175], [47, 189], [47, 203], [46, 218], [44, 232], [41, 247], [37, 262],
];

// ---------- Vây ngực tròn như quạt ----------
const PEC_BASE: [number, number] = [458, 207];
const PECTORAL =
  'M462 200C438 186 406 178 382 181C369 186 364 198 367 209C372 218 394 224 422 225C440 224 452 219 460 214C464 210 464 204 462 200Z';
const PEC_TIPS: [number, number][] = [
  [384, 181], [374, 186], [368, 194], [366, 202], [368, 210], [376, 216], [390, 221], [406, 224], [422, 225], [438, 223],
];

// ---------- Vây bụng nhỏ nhọn ----------
const PELVIC = 'M437 262C429 272 417 281 398 288C401 280 408 271 419 262C424 258 431 257 437 262Z';

// ---------- Mỏ vẹt (tấm răng hợp) ----------
const BEAK_UP = 'M585 189C591 186 598 187 603 191C604 195 601 198 596 198.5C590 198.5 587 195 585 189Z';
const BEAK_LO = 'M587 201.5C592 201 598 201.5 602 204C600 208 595 210 590 209C588 207.5 587 205 587 201.5Z';
const LIP_UP = 'M570 180C582 170 598 171 604 185C605 189 601 190 597 188.5C591 186.5 585 187 580 190.5C575 188 572 184 570 180Z';
const LIP_LO = 'M581 209.5C588 211 595 210 602 205C604 210 601 216 593 218.5C586 220 581 215 581 209.5Z';

const body = standardBody(u, BODY, {
  dorsal: '#2f4c4a',
  flank: '#5b7e78',
  belly: '#a9bdb2',
  outlineColor: INK,
  scales: false,
  flankAt: 0.52,
  rimOpacity: 0.7,
});

const theEye = eye(u, 'eye', {
  cx: 531,
  cy: 121,
  r: 8,
  iris: ['#cdc58e', '#3a4733'],
  socket: '#2c4642',
  look: [0.3, 0.1],
});

// ---------- Đốm loang ô liu & xanh lam ----------
function mottles(): string {
  const r = rng(29);
  let olive = '';
  let blue = '';
  for (let i = 0; i < 16; i++) {
    const x = 170 + r() * 300;
    const y = 76 + r() * 140;
    const e = `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(18 + r() * 24).toFixed(1)}" ry="${(9 + r() * 10).toFixed(1)}"/>`;
    if (i % 2) olive += e;
    else blue += e;
  }
  return (
    `<g filter="${u.url('soft')}"><g fill="#7d8c50" fill-opacity="0.14">${olive}</g>` +
    `<g fill="#4f7f8c" fill-opacity="0.16">${blue}</g></g>`
  );
}

const defs = joinDefs(
  body,
  theEye,
  bigScales(u('scaleDark'), '#0f2422', 0.28, 1),
  bigScales(u('scaleLight'), '#e6f5ee', 0.13, 0.8),
  linear(u('fin'), [
    [0, '#2c4650', 0.9],
    [1, FIN_D, 0.95],
  ]),
  linear(u('finV'), [
    [0, FIN_D, 0.95],
    [1, '#2b4550', 0.92],
  ]),
  radial(
    u('caudalFill'),
    [
      [0, '#4a6b72', 0.92],
      [0.65, '#2c4651', 0.9],
      [1, FIN_D, 0.95],
    ],
    { user: true, cx: 164, cy: 190, r: 130 },
  ),
  radial(
    u('pecFill'),
    [
      [0, '#6a8c90', 0.8],
      [0.65, '#3d5b64', 0.68],
      [1, '#243e48', 0.85],
    ],
    { user: true, cx: PEC_BASE[0], cy: PEC_BASE[1], r: 96 },
  ),
  linear(u('pelvicFill'), [
    [0, '#7fa6b4', 0.85],
    [1, '#3c5f6e', 0.8],
  ]),
  // mặt trước trán ngả hồng
  linear(
    u('facePink'),
    [
      [0, PINK, 0],
      [0.55, PINK, 0.26],
      [1, '#e7b4aa', 0.72],
    ],
    { user: true, x1: 540, y1: 0, x2: 598, y2: 0 },
  ),
  // má / hàm ngả xanh nhạt
  radial(u('cheek'), [
    [0, '#c3e0d8', 0.5],
    [1, '#c3e0d8', 0],
  ]),
  radial(u('humpGloss'), [
    [0, '#f4fff9', 0.38],
    [1, '#f4fff9', 0],
  ]),
  linear(u('beak'), [
    [0, IVORY],
    [0.6, '#d5e6d2'],
    [1, '#a9cbb8'],
  ]),
  linear(u('lip'), [
    [0, '#d6aca3'],
    [1, '#9a9a90'],
  ]),
  // mặt nạ: vảy chỉ phủ thân, mờ dần sau nắp mang (đầu không vảy)
  linear(
    u('scaleMaskGrad'),
    [
      [0, '#ffffff'],
      [1, '#000000'],
    ],
    { user: true, x1: 440, y1: 0, x2: 474, y2: 0 },
  ),
  `<mask id="${u('scaleMask')}" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="320"><rect width="640" height="320" fill="${u.url('scaleMaskGrad')}"/></mask>`,
  blurFilter(u('soft'), 6),
  blurFilter(u('softS'), 2.2),
);

const art: CreatureArt = {
  id: 'ca_vet_dau_gu',
  viewBox: [640, 320],
  lengthUnits: 572,
  spineY: 172,
  animation: 'fish',
  cycleHz: 1.0,
  bendAmp: 10,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'caudal',
      role: 'tail',
      svg:
        `<path d="${CAUDAL}" fill="${u.url('caudalFill')}"/>` +
        finRays([166, 190], CAUDAL_TIPS.map(([x, y]) => [x + 3, y + (y < 189 ? 2 : -2)] as [number, number]), {
          color: '#0c1a1f',
          opacity: 0.3,
          width: 1.6,
          bend: 0.02,
        }) +
        finRays([166, 190], CAUDAL_TIPS, { color: '#a9cdd2', opacity: 0.3, width: 0.9, bend: 0.02 }) +
        `<path d="${CAUDAL_EDGE}" fill="none" stroke="${FIN_D}" stroke-width="2.2" stroke-linecap="round" stroke-opacity="0.8"/>`,
    },
    {
      name: 'dorsal',
      role: 'detail',
      svg:
        `<path d="${DORSAL.d}" fill="${u.url('finV')}"/>` +
        DORSAL.rays +
        `<path d="${DORSAL.edge}" fill="none" stroke="#6c919b" stroke-width="0.9" stroke-opacity="0.35"/>`,
    },
    {
      name: 'anal',
      role: 'detail',
      svg:
        `<path d="${ANAL.d}" fill="${u.url('fin')}"/>` +
        ANAL.rays +
        `<path d="${ANAL.edge}" fill="none" stroke="#6c919b" stroke-width="0.9" stroke-opacity="0.35"/>`,
    },
    {
      name: 'body',
      role: 'body',
      svg:
        body.base +
        `<g clip-path="${u.url('bodyClip')}">` +
        mottles() +
        // vảy to: viền sẫm + viền sáng lệch nhẹ (nổi khối), chỉ ở thân
        `<g mask="${u.url('scaleMask')}">` +
        `<path d="${BODY}" fill="${u.url('scaleDark')}"/>` +
        `<g transform="translate(1.3 0.6)"><path d="${BODY}" fill="${u.url('scaleLight')}"/></g>` +
        `</g>` +
        // chấm nhạt rải rác
        scatterSpots(91, { x: 170, y: 80, w: 300, h: 170 }, { count: 46, rMin: 0.7, rMax: 1.5, color: '#eaf6f1', opacity: 0.4 }) +
        // bướu trán: bóng sáng + mặt trước ngả hồng + má xanh nhạt
        `<ellipse cx="530" cy="72" rx="52" ry="32" fill="${u.url('humpGloss')}"/>` +
        `<rect x="530" y="30" width="80" height="250" fill="${u.url('facePink')}"/>` +
        `<ellipse cx="548" cy="190" rx="44" ry="30" fill="${u.url('cheek')}"/>` +
        // bóng tối dưới rãnh nối bướu – lưng
        `<path d="M470 60C462 84 460 108 466 130L486 128C480 106 482 84 492 62Z" fill="#1a2f2c" opacity="0.28" filter="${u.url('softS')}"/>` +
        `</g>` +
        body.overlay,
    },
    {
      name: 'face',
      role: 'detail',
      svg:
        // nếp gấp nơi bướu nối với lưng, chạy xuống nắp mang
        `<path d="M476 62C468 84 466 106 470 128" fill="none" stroke="${INK}" stroke-width="1.6" stroke-opacity="0.4" stroke-linecap="round"/>` +
        `<path d="M480 64C473 86 471 106 474 126" fill="none" stroke="#e6f3ee" stroke-width="1" stroke-opacity="0.28" stroke-linecap="round"/>` +
        // nắp mang
        `<path d="M468 126C458 156 462 196 490 244" fill="none" stroke="${INK}" stroke-width="2" stroke-opacity="0.5" stroke-linecap="round"/>` +
        `<path d="M472 128C463 158 467 194 494 240" fill="none" stroke="#e6f3ee" stroke-width="1" stroke-opacity="0.25" stroke-linecap="round"/>` +
        // gờ trước nắp mang
        `<path d="M504 146C497 174 503 204 524 230" fill="none" stroke="${INK}" stroke-width="1.2" stroke-opacity="0.28" stroke-linecap="round"/>` +
        // mép trán hồng sáng & lỗ mũi
        `<path d="M556 40C571 48 579 72 582 104C585 130 589 154 594 172" fill="none" stroke="#f0c4bb" stroke-width="2" stroke-opacity="0.5" stroke-linecap="round"/>` +
        `<ellipse cx="562" cy="134" rx="2" ry="1.4" fill="${INK}" opacity="0.55"/>` +
        `<ellipse cx="567" cy="142" rx="1.4" ry="1" fill="${INK}" opacity="0.45"/>` +
        // mỏ trên & dưới (răng hợp thành tấm) nằm giữa hai môi thịt
        `<path d="${BEAK_LO}" fill="${u.url('beak')}" stroke="#5f7d6f" stroke-width="0.9" stroke-opacity="0.7"/>` +
        `<path d="${BEAK_UP}" fill="${u.url('beak')}" stroke="#5f7d6f" stroke-width="0.9" stroke-opacity="0.7"/>` +
        `<path d="M591 190Q593 194 592 197.5M596 189Q598 193 597 198M600 190.5Q602 194 601 197M592 203Q593 205.5 592 208M597 203Q598 205.5 597 208.5" fill="none" stroke="#7d9b8c" stroke-width="0.7" stroke-opacity="0.6" stroke-linecap="round"/>` +
        `<path d="M588 190C592 187.5 597 187.5 601 190.5" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.7" stroke-linecap="round"/>` +
        `<path d="${LIP_UP}" fill="${u.url('lip')}" fill-opacity="0.92" stroke="${INK}" stroke-width="0.7" stroke-opacity="0.25"/>` +
        `<path d="${LIP_LO}" fill="${u.url('lip')}" fill-opacity="0.88" stroke="${INK}" stroke-width="0.7" stroke-opacity="0.22"/>` +
        `<path d="M577 177C586 173 596 175 601 183" fill="none" stroke="#f6d6cf" stroke-width="0.9" stroke-opacity="0.6" stroke-linecap="round"/>` +
        // khe miệng
        `<path d="M580 199.5Q592 200 603 200.5" fill="none" stroke="#14211f" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.85"/>`,
    },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    {
      name: 'pelvic',
      role: 'fin',
      z: 'front',
      pivot: [430, 261],
      anim: { type: 'rotate', amp: 0.1, speed: 1, phase: 1.6 },
      svg:
        `<path d="${PELVIC}" fill="${u.url('pelvicFill')}" stroke="#2c4a56" stroke-width="0.9" stroke-opacity="0.6"/>` +
        finRays([430, 261], [[401, 284], [408, 278], [416, 271]], { color: '#e6f4f6', opacity: 0.35, width: 0.7 }),
    },
    {
      name: 'pectoral',
      role: 'fin',
      bend: false,
      z: 'front',
      pivot: PEC_BASE,
      anim: { type: 'rotate', amp: 0.3, speed: 1 },
      svg:
        `<path d="${PECTORAL}" fill="${u.url('pecFill')}" stroke="#1d323a" stroke-width="1.2" stroke-opacity="0.55" stroke-linejoin="round"/>` +
        finRays(PEC_BASE, PEC_TIPS, { color: '#16282e', opacity: 0.28, width: 1.4, bend: 0.05 }) +
        finRays(PEC_BASE, PEC_TIPS, { color: '#cfe6e8', opacity: 0.35, width: 0.7, bend: 0.05 }) +
        `<path d="M462 200C438 186 406 178 382 181" fill="none" stroke="#d6ecee" stroke-width="1" stroke-opacity="0.35" stroke-linecap="round"/>`,
    },
  ],
};

export default art;
