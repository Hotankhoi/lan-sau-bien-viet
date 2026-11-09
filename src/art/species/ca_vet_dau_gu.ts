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
  scalePattern,
  scatterSpots,
  smoothPath,
  joinDefs,
  rng,
} from '../style-bible';

const u = makeIds('ca_vet_dau_gu');

const FIN_D = '#1f3139';
const FIN = '#2f4a55';
const INK = '#1a2c2b';
const PINK = '#d9a29a';
const IVORY = '#eef0dc';

// ---------- Đường viền thân ----------
/** Đường lưng: cuống đuôi → lưng → bướu trán → mặt trước → mỏ trên */
const TOP: [number, number][] = [
  [128, 156], [150, 149], [178, 135], [215, 111], [262, 86], [320, 67], [385, 57], [440, 57],
  [470, 62], [486, 57], [506, 46], [530, 39], [553, 40], [569, 50], [578, 72], [582, 104],
  [587, 138], [592, 162], [596, 180],
];
/** Đường bụng: dưới mỏ → cằm → họng → bụng → cuống đuôi */
const BOTTOM: [number, number][] = [
  [592, 197], [584, 209], [566, 223], [536, 239], [496, 255], [450, 265], [405, 269], [360, 267],
  [310, 259], [260, 247], [215, 236], [175, 228], [148, 224], [128, 222],
];

const BODY = smoothPath(TOP) + smoothPath(BOTTOM).replace(/^M/, 'L') + 'Z';

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

// ---------- Vây lưng dài thấp (gai ở trước, tia mềm ở sau) ----------
function dorsalFin(): { d: string; edge: string; rays: string } {
  const top: [number, number][] = [];
  const base: [number, number][] = [];
  const x0 = 478;
  const x1 = 158;
  const n = 34;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    // cao dần từ 9 → 14 (phần mềm) rồi thu nhỏ về cuống đuôi
    let h = 9 + 6 * Math.sin(Math.PI * Math.min(1, t * 1.15)) - (t > 0.85 ? (t - 0.85) * 40 : 0);
    if (t < 0.45) h += i % 2 === 0 ? 1.6 : -1.2; // mép gai lởm chởm nhẹ
    const y = backY(x);
    // hướng pháp tuyến xấp xỉ theo độ dốc lưng
    const slope = (backY(x - 4) - backY(x + 4)) / 8;
    const nx = slope * 0.6;
    top.push([x - nx * h, y - h]);
    base.push([x, y + 8]);
  }
  const topD = smoothPath(top, false, 0.35);
  const baseRev = [...base].reverse();
  const d = topD + baseRev.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join('') + 'Z';
  const rays = finRays(
    base.filter((_, i) => i % 2 === 0).map(([x, y]) => [x, y - 6] as [number, number]),
    top.filter((_, i) => i % 2 === 0),
    { color: '#9fc2c8', opacity: 0.35, width: 0.8, bend: 0.03 },
  );
  return { d, edge: topD, rays };
}

// ---------- Vây hậu môn dài thấp ----------
function analFin(): { d: string; edge: string; rays: string } {
  const bot: [number, number][] = [];
  const base: [number, number][] = [];
  const x0 = 304;
  const x1 = 152;
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const h = 4 + 11 * Math.sin(Math.PI * Math.min(1, 0.2 + t * 0.95)) * (1 - t * 0.35);
    const y = bellyY(x);
    bot.push([x - h * 0.35, y + h]);
    base.push([x, y - 7]);
  }
  const edge = smoothPath(bot, false, 0.4);
  const d = edge + [...base].reverse().map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join('') + 'Z';
  const rays = finRays(
    base.filter((_, i) => i % 2 === 0).map(([x, y]) => [x, y + 5] as [number, number]),
    bot.filter((_, i) => i % 2 === 0),
    { color: '#9fc2c8', opacity: 0.3, width: 0.8, bend: 0.03 },
  );
  return { d, edge, rays };
}

const DORSAL = dorsalFin();
const ANAL = analFin();

// ---------- Đuôi rộng gần cụt ----------
const CAUDAL =
  'M150 150C124 146 98 136 72 126C58 120 44 116 34 116C40 134 46 160 47 189C47 218 42 244 36 264' +
  'C48 262 62 258 76 252C100 244 124 234 150 228Z';
const CAUDAL_EDGE = 'M34 116C40 134 46 160 47 189C47 218 42 244 36 264';
const CAUDAL_TIPS: [number, number][] = [
  [36, 118], [41, 132], [44, 146], [46, 160], [47, 175], [47, 189], [47, 203], [46, 218], [44, 232], [41, 247], [37, 262],
];

// ---------- Vây ngực tròn như quạt ----------
const PEC_BASE: [number, number] = [458, 207];
const PECTORAL = 'M461 196C436 182 402 176 376 182C364 188 361 203 368 212C392 224 428 224 455 217C462 212 464 202 461 196Z';
const PEC_TIPS: [number, number][] = [
  [380, 181], [370, 188], [366, 196], [366, 204], [370, 211], [380, 216], [394, 220], [410, 222], [426, 222],
];

// ---------- Vây bụng nhỏ nhọn ----------
const PELVIC = 'M436 262C426 272 410 282 388 290C384 288 386 284 392 280C404 272 416 264 426 258Z';

// ---------- Mỏ vẹt (tấm răng hợp) ----------
const BEAK_UP = 'M582 178C590 173 600 175 605 182C608 188 605 195 598 197C591 198 585 193 582 178Z';
const BEAK_LO = 'M586 200C593 198 601 199 605 203C605 209 599 213 592 212C587 210 585 205 586 200Z';

const body = standardBody(u, BODY, {
  dorsal: '#35524e',
  flank: '#61807a',
  belly: '#a9bdb2',
  outlineColor: INK,
  scales: { size: 15, color: '#122826', opacity: 0.3 },
  flankAt: 0.52,
  rimOpacity: 0.7,
});

const theEye = eye(u, 'eye', {
  cx: 531,
  cy: 121,
  r: 7.5,
  iris: ['#cdc58e', '#3a4733'],
  socket: '#2c4642',
  look: [0.3, 0.1],
});

// vảy sáng lệch nhẹ để tạo cảm giác vảy nổi khối
const scalesLight = scalePattern(u('scalesLight'), { size: 15, color: '#e8f6ef', opacity: 0.2, stroke: 0.8 });

// ---------- Đốm loang ô liu & chấm nhạt ----------
function mottles(): string {
  const r = rng(29);
  let s = '';
  for (let i = 0; i < 14; i++) {
    const x = 170 + r() * 300;
    const y = 80 + r() * 110;
    s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(16 + r() * 22).toFixed(1)}" ry="${(8 + r() * 10).toFixed(1)}"/>`;
  }
  return `<g fill="#76874f" fill-opacity="0.22" filter="${u.url('soft')}">${s}</g>`;
}

const defs = joinDefs(
  body,
  theEye,
  scalesLight,
  linear(u('fin'), [
    [0, FIN_D, 0.92],
    [1, FIN, 0.82],
  ]),
  linear(
    u('finV'),
    [
      [0, '#3c5c66', 0.85],
      [1, FIN_D, 0.92],
    ],
    { x1: 0, y1: 0, x2: 0, y2: 1 },
  ),
  radial(
    u('caudalFill'),
    [
      [0, '#4d6f74', 0.9],
      [0.65, '#2e4852', 0.88],
      [1, FIN_D, 0.95],
    ],
    { user: true, cx: 150, cy: 190, r: 120 },
  ),
  radial(
    u('pecFill'),
    [
      [0, '#4e6e72', 0.9],
      [0.7, '#33505a', 0.72],
      [1, '#25404a', 0.8],
    ],
    { user: true, cx: PEC_BASE[0], cy: PEC_BASE[1], r: 96 },
  ),
  linear(u('pelvicFill'), [
    [0, '#a8cbd4', 0.85],
    [1, '#6f97a6', 0.75],
  ]),
  // mặt trước trán ngả hồng
  linear(
    u('facePink'),
    [
      [0, PINK, 0],
      [0.55, PINK, 0.28],
      [1, '#e7b4aa', 0.75],
    ],
    { user: true, x1: 540, y1: 0, x2: 598, y2: 0 },
  ),
  // má / hàm ngả xanh nhạt
  radial(u('cheek'), [
    [0, '#c3e0d8', 0.55],
    [1, '#c3e0d8', 0],
  ]),
  radial(u('humpGloss'), [
    [0, '#f4fff9', 0.5],
    [1, '#f4fff9', 0],
  ]),
  linear(u('beak'), [
    [0, IVORY],
    [0.6, '#d5e6d2'],
    [1, '#a9cbb8'],
  ]),
  // mặt nạ: vảy chỉ phủ phần thân, mờ dần ở sau nắp mang (đầu không vảy)
  linear(
    u('scaleMaskGrad'),
    [
      [0, '#ffffff'],
      [1, '#000000'],
    ],
    { user: true, x1: 438, y1: 0, x2: 476, y2: 0 },
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
        finRays([152, 190], CAUDAL_TIPS, { color: '#a9cdd2', opacity: 0.32, width: 1, bend: 0.02 }) +
        finRays([152, 190], CAUDAL_TIPS.map(([x, y]) => [x + 3, y + (y < 189 ? 2 : -2)] as [number, number]), {
          color: '#0f1d22',
          opacity: 0.25,
          width: 1.4,
          bend: 0.02,
        }) +
        `<path d="${CAUDAL_EDGE}" fill="none" stroke="${FIN_D}" stroke-width="2.2" stroke-linecap="round" stroke-opacity="0.8"/>`,
    },
    {
      name: 'dorsal',
      role: 'detail',
      svg:
        `<path d="${DORSAL.d}" fill="${u.url('finV')}"/>` +
        DORSAL.rays +
        `<path d="${DORSAL.edge}" fill="none" stroke="#7fa3ad" stroke-width="1" stroke-opacity="0.45"/>`,
    },
    {
      name: 'anal',
      role: 'detail',
      svg:
        `<path d="${ANAL.d}" fill="${u.url('fin')}"/>` +
        ANAL.rays +
        `<path d="${ANAL.edge}" fill="none" stroke="#7fa3ad" stroke-width="1" stroke-opacity="0.4"/>`,
    },
    {
      name: 'body',
      role: 'body',
      svg:
        body.base +
        `<g clip-path="${u.url('bodyClip')}">` +
        mottles() +
        // vảy to: lớp viền sẫm + lớp sáng lệch nhẹ, chỉ ở thân
        `<g mask="${u.url('scaleMask')}">` +
        `<path d="${BODY}" fill="${u.url('scales')}"/>` +
        `<g transform="translate(1.3 1.1)"><path d="${BODY}" fill="${u.url('scalesLight')}"/></g>` +
        `</g>` +
        // chấm nhạt rải rác
        scatterSpots(91, { x: 170, y: 80, w: 300, h: 170 }, { count: 46, rMin: 0.7, rMax: 1.5, color: '#eaf6f1', opacity: 0.4 }) +
        // bướu trán: bóng sáng ở đỉnh + mặt trước ngả hồng + má xanh nhạt
        `<ellipse cx="532" cy="60" rx="46" ry="20" fill="${u.url('humpGloss')}"/>` +
        `<rect x="530" y="30" width="80" height="185" fill="${u.url('facePink')}"/>` +
        `<ellipse cx="548" cy="190" rx="44" ry="30" fill="${u.url('cheek')}"/>` +
        // bóng tối dưới bướu (rãnh nối bướu – lưng)
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
        `<path d="M556 41C571 49 579 72 582 104C585 130 589 154 594 172" fill="none" stroke="#f0c4bb" stroke-width="2" stroke-opacity="0.5" stroke-linecap="round"/>` +
        `<ellipse cx="562" cy="134" rx="2" ry="1.4" fill="${INK}" opacity="0.55"/>` +
        `<ellipse cx="567" cy="142" rx="1.4" ry="1" fill="${INK}" opacity="0.45"/>` +
        // môi thịt quanh mỏ
        `<path d="M574 176C584 168 600 170 606 180" fill="none" stroke="${PINK}" stroke-width="4" stroke-opacity="0.65" stroke-linecap="round"/>` +
        `<path d="M580 212C588 216 598 215 604 208" fill="none" stroke="${PINK}" stroke-width="3.4" stroke-opacity="0.55" stroke-linecap="round"/>` +
        // mỏ trên & dưới (răng hợp thành tấm)
        `<path d="${BEAK_UP}" fill="${u.url('beak')}" stroke="#5f7d6f" stroke-width="1" stroke-opacity="0.7"/>` +
        `<path d="${BEAK_LO}" fill="${u.url('beak')}" stroke="#5f7d6f" stroke-width="1" stroke-opacity="0.7"/>` +
        // vết ghép răng trên mỏ
        `<path d="M590 183Q592 188 591 194M596 181Q599 187 598 195M601 183Q603 188 602 194M592 202Q593 206 592 210M598 202Q599 206 598 211" fill="none" stroke="#7d9b8c" stroke-width="0.7" stroke-opacity="0.65" stroke-linecap="round"/>` +
        `<path d="M587 179C592 176 599 177 603 181" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.7" stroke-linecap="round"/>` +
        // khe miệng
        `<path d="M578 199Q592 199 605 200" fill="none" stroke="#14211f" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.85"/>`,
    },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    {
      name: 'pelvic',
      role: 'fin',
      z: 'front',
      pivot: [430, 261],
      anim: { type: 'rotate', amp: 0.1, speed: 1, phase: 1.6 },
      svg:
        `<path d="${PELVIC}" fill="${u.url('pelvicFill')}" stroke="#4d7280" stroke-width="0.9" stroke-opacity="0.6"/>` +
        finRays([430, 261], [[394, 284], [402, 279], [412, 272]], { color: '#e6f4f6', opacity: 0.4, width: 0.7 }),
    },
    {
      name: 'pectoral',
      role: 'fin',
      bend: false,
      z: 'front',
      pivot: PEC_BASE,
      anim: { type: 'rotate', amp: 0.3, speed: 1 },
      svg:
        `<path d="${PECTORAL}" fill="${u.url('pecFill')}" stroke="#20363e" stroke-width="1.2" stroke-opacity="0.55" stroke-linejoin="round"/>` +
        finRays(PEC_BASE, PEC_TIPS, { color: '#bcd8dc', opacity: 0.4, width: 0.9, bend: 0.05 }) +
        `<path d="M461 196C436 182 402 176 376 182" fill="none" stroke="#d6ecee" stroke-width="1" stroke-opacity="0.35" stroke-linecap="round"/>`,
    },
  ],
};

export default art;
