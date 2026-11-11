/**
 * Cá song chấm nâu (cá mú) – Epinephelus coioides
 * Đặc điểm nhận dạng: thân to chắc thuôn dài (cao ≈ 26% chiều dài), đầu lớn nhọn, trán thẳng,
 * miệng rộng – hàm dưới chìa ra; mắt nhỏ nằm cao; vây lưng liền: 11 gai màng khía sâu + phần
 * tia mềm cao tròn; vây hậu môn thùy tròn; vây ngực tròn như mái chèo; vây đuôi tròn.
 * Nền nâu ô liu nhạt, phủ dày chấm nâu cam nhỏ (cả đầu, thân, vây); 5 vệt sẫm xiên mờ trên thân.
 * Tham khảo: references/ca_song_cham_nau (ref1 ngang thân – tỉ lệ; ref4 dưới nước – vệt sẫm).
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
  organicTexture,
  smoothPath,
  joinDefs,
  rng,
} from '../style-bible';

const u = makeIds('ca_song_cham_nau');

type P = [number, number];
const f = (n: number): string => n.toFixed(1);

const OLIVE_D = '#5E5139';
const OLIVE = '#A69676';
const BELLY = '#E2D8C0';
const INK = '#47381F';
const SPOT_D = '#7A3E20';

// ---------- Đường viền thân (đầu quay phải) ----------
/** Đường lưng: mõm → trán → gáy → lưng → cuống đuôi (x giảm dần). */
const TOP: P[] = [
  [626, 186],
  [620, 171],
  [606, 152],
  [590, 138],
  [562, 122],
  [520, 107],
  [470, 96],
  [400, 89],
  [330, 91],
  [270, 99],
  [215, 113],
  [178, 129],
  [154, 140],
  [140, 145],
];
/** Mép cuống đuôi (gốc vây đuôi). */
const BASE: P[] = [
  [134, 153],
  [132, 171],
  [135, 189],
];
/** Đường bụng: cuống đuôi → bụng → họng → hàm dưới chìa (x tăng dần). */
const BOTTOM: P[] = [
  [148, 197],
  [178, 211],
  [215, 226],
  [260, 238],
  [330, 247],
  [410, 248],
  [468, 241],
  [518, 230],
  [558, 218],
  [594, 210],
  [620, 205],
  [638, 200],
  [632, 192],
];

const BODY = smoothPath([...TOP, ...BASE, ...BOTTOM], true, 0.45);

function interp(pts: P[], x: number): number {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const lo = Math.min(x1, x2);
    const hi = Math.max(x1, x2);
    if (x >= lo && x <= hi && x1 !== x2) return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
  }
  return x < 300 ? pts[pts.length - 1][1] : pts[0][1];
}
const backY = (x: number): number => interp(TOP, Math.max(140, Math.min(628, x)));
const bellyY = (x: number): number => interp(BOTTOM, Math.max(148, Math.min(634, x)));

const EYE: P = [582, 152];

// ---------- Vây lưng: 11 gai màng khía + phần tia mềm tròn ----------
const SPINE_H = [20, 34, 43, 46, 44, 43, 40, 38, 37, 35, 34];
const SPINE_X0 = 468;
const SPINE_X1 = 302;
const LEAN = (20 * Math.PI) / 180;

interface Spine {
  base: P;
  tip: P;
  at: (t: number) => P;
}
const SPINES: Spine[] = SPINE_H.map((h, i) => {
  const bx = SPINE_X0 - ((SPINE_X0 - SPINE_X1) * i) / (SPINE_H.length - 1);
  const by = backY(bx) + 3;
  const at = (t: number): P => [bx - Math.sin(LEAN) * h * t, by - Math.cos(LEAN) * h * t];
  return { base: [bx, by], tip: at(1), at };
});

/** Mép trên phần vây mềm (tròn, cao hơn phần gai), từ gai cuối → cuống đuôi. */
const SOFT_EDGE: P[] = [
  [292, backY(292) - 38],
  [270, backY(270) - 45],
  [245, backY(245) - 49],
  [220, backY(220) - 48],
  [198, backY(198) - 42],
  [180, backY(180) - 31],
  [166, backY(166) - 17],
  [156, backY(156) - 3],
];

function dorsalPath(): string {
  const s0 = SPINES[0];
  let d = `M${f(s0.base[0] + 6)} ${f(s0.base[1] + 6)}L${f(s0.base[0])} ${f(s0.base[1])}L${f(s0.tip[0])} ${f(s0.tip[1])}`;
  for (let i = 1; i < SPINES.length; i++) {
    const a = SPINES[i - 1];
    const b = SPINES[i];
    const notch = b.at(0.48 + 0.06 * Math.sin(i * 2.3));
    // màng: từ đầu gai trước võng xuống khía rồi lên đầu gai sau
    const c: P = [(a.tip[0] + notch[0]) / 2 - 1, (a.tip[1] + notch[1]) / 2 + 4];
    d += `Q${f(c[0])} ${f(c[1])} ${f(notch[0] + 1.5)} ${f(notch[1])}L${f(b.tip[0])} ${f(b.tip[1])}`;
  }
  // nối sang phần mềm
  const soft = smoothPath([SPINES[SPINES.length - 1].tip, ...SOFT_EDGE], false, 0.5).replace(/^M[^C]*/, '');
  d += soft;
  // gốc vây chạy dọc lưng (bị thân che)
  for (let x = 158; x <= SPINE_X0 + 6; x += 16) d += `L${f(x)} ${f(backY(x) + 9)}`;
  return d + 'Z';
}
const DORSAL = dorsalPath();

/** Tua da nhỏ ở đầu gai. */
function spineTips(): string {
  return SPINES.map((s) => {
    const [x, y] = s.tip;
    return `M${f(x)} ${f(y)}q-3 -1 -5.5 1.5`;
  }).join('');
}

/** Thân gai thuôn (vẽ như dải hẹp). */
function spineRods(): string {
  return SPINES.map((s) => {
    const n = 5;
    const L: P[] = [];
    const R: P[] = [];
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const [x, y] = s.at(t);
      const w = 2.1 - 1.6 * t;
      L.push([x - Math.cos(LEAN) * w, y - Math.sin(LEAN) * w]);
      R.push([x + Math.cos(LEAN) * w, y + Math.sin(LEAN) * w]);
    }
    return `<path d="M${[...L, ...R.reverse()].map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z"/>`;
  }).join('');
}

function softDorsalRays(): string {
  const base: P[] = [];
  const tips: P[] = [];
  const n = 13;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const bx = 296 - t * 136;
    base.push([bx, backY(bx) + 2]);
    // điểm trên mép mềm (nội suy theo x, lệch về sau)
    const tx = bx - 8 - 4 * t;
    const ty = interp(SOFT_EDGE, Math.max(156, Math.min(292, tx))) + 2;
    tips.push([tx, ty]);
  }
  return finRays(base, tips, { color: INK, opacity: 0.42, width: 1, bend: 0.06 });
}

// ---------- Vây đuôi tròn ----------
const CAUDAL_PTS: P[] = [
  [150, 141],
  [122, 129],
  [92, 118],
  [62, 112],
  [39, 121],
  [27, 142],
  [22, 170],
  [26, 198],
  [38, 219],
  [62, 230],
  [94, 226],
  [124, 214],
  [150, 201],
];
const CAUDAL = smoothPath(CAUDAL_PTS, true, 0.5);

function caudalRays(): string {
  const tips: P[] = [];
  const n = 15;
  for (let i = 0; i < n; i++) {
    const a = ((-62 + (124 * i) / (n - 1)) * Math.PI) / 180;
    // giao gần đúng với mép tròn: elip tâm (140,171)
    tips.push([142 - Math.cos(a) * 112, 171 + Math.sin(a) * 58 * (1 + 0.1 * Math.abs(Math.sin(a)))]);
  }
  const base: P[] = tips.map((_, i) => [146, 150 + (42 * i) / (n - 1)]);
  return finRays(base, tips, { color: INK, opacity: 0.3, width: 1, bend: 0.03 });
}

// ---------- Vây hậu môn: 3 gai ngắn + thùy mềm tròn ----------
const ANAL_EDGE: P[] = [
  [303, 247],
  [292, 262],
  [276, 273],
  [254, 279],
  [230, 279],
  [208, 271],
  [190, 256],
  [178, 238],
  [172, 220],
];
function analPath(): string {
  let d = smoothPath(ANAL_EDGE, false, 0.5);
  for (let x = 176; x <= 306; x += 16) d += `L${f(x)} ${f(bellyY(x) - 8)}`;
  return d + 'Z';
}
const ANAL = analPath();

function analRays(): string {
  const base: P[] = [];
  const tips: P[] = [];
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const bx = 262 - t * 84;
    base.push([bx, bellyY(bx) - 2]);
    const tx = bx - 12 - 6 * t;
    tips.push([tx, interp(ANAL_EDGE, Math.max(172, Math.min(303, tx))) - 2]);
  }
  return finRays(base, tips, { color: INK, opacity: 0.3, width: 0.9, bend: -0.05 });
}
const ANAL_SPINES =
  `<g stroke="${INK}" stroke-opacity="0.55" stroke-linecap="round" fill="none">` +
  `<path d="M300 247L291 262" stroke-width="1.6"/><path d="M290 245L276 270" stroke-width="1.8"/><path d="M279 242L262 274" stroke-width="1.8"/></g>`;

// ---------- Vây ngực tròn (mái chèo) ----------
const PEC_PIVOT: P = [455, 200];
const PEC_PTS: P[] = [
  [457, 182],
  [436, 171],
  [408, 168],
  [380, 175],
  [360, 189],
  [351, 206],
  [358, 222],
  [378, 231],
  [408, 233],
  [436, 227],
  [456, 218],
];
const PECTORAL = smoothPath(PEC_PTS, true, 0.5);
function pecRays(): string {
  const tips: P[] = [];
  const edge = PEC_PTS.slice(1, 10);
  for (let i = 0; i < edge.length - 1; i++) {
    tips.push([edge[i][0] + 3, edge[i][1] + (edge[i][1] < 200 ? 3 : -3)]);
    const m: P = [(edge[i][0] + edge[i + 1][0]) / 2 + 3, (edge[i][1] + edge[i + 1][1]) / 2];
    tips.push([m[0], m[1] + (m[1] < 200 ? 3 : -3)]);
  }
  return finRays(PEC_PIVOT, tips, { color: '#2e2414', opacity: 0.38, width: 1, bend: 0.05 });
}

// ---------- Vây bụng ----------
const PEL_PIVOT: P = [450, 240];
const PELVIC = smoothPath(
  [
    [463, 238],
    [455, 252],
    [442, 268],
    [424, 284],
    [408, 292],
    [398, 289],
    [399, 277],
    [410, 262],
    [426, 248],
    [442, 237],
  ],
  true,
  0.5,
);
const PELVIC_FAR = PELVIC; // vây phía xa: cùng hình, lệch & tối hơn (transform)

// ---------- Chấm nâu cam ----------
interface SpotOpts {
  area: { x0: number; x1: number; y0: number; y1: number };
  step: number;
  rMin: number;
  rMax: number;
  seed: number;
  skip?: (x: number, y: number) => boolean;
  op?: (x: number, y: number) => number;
}
function spots(o: SpotOpts): string {
  const r = rng(o.seed);
  let s = '';
  let row = 0;
  for (let y = o.area.y0; y <= o.area.y1; y += o.step * 0.86, row++) {
    for (let x = o.area.x0 + (row % 2 ? o.step / 2 : 0); x <= o.area.x1; x += o.step) {
      const jx = x + (r() - 0.5) * o.step * 0.62;
      const jy = y + (r() - 0.5) * o.step * 0.62;
      const rr = o.rMin + r() * (o.rMax - o.rMin);
      if (o.skip && o.skip(jx, jy)) continue;
      const op = o.op ? o.op(jx, jy) : 0.9;
      if (op <= 0.02) continue;
      const ell = 0.85 + r() * 0.35;
      s += `<ellipse cx="${f(jx)}" cy="${f(jy)}" rx="${f(rr * ell)}" ry="${f(rr)}"${op < 0.99 ? ` fill-opacity="${op.toFixed(2)}"` : ''}/>`;
    }
  }
  return `<g fill="${u.url('spot')}">${s}</g>`;
}

const bodyFrac = (x: number, y: number): number => {
  const t = backY(x);
  const b = bellyY(x);
  return Math.max(0, Math.min(1, (y - t) / Math.max(1, b - t)));
};
const bodySpotOp = (x: number, y: number): number => {
  const t = bodyFrac(x, y);
  return t > 0.8 ? 0.95 - (t - 0.8) * 3.2 : 0.95;
};
const nearEye = (x: number, y: number): boolean => (x - EYE[0]) ** 2 + (y - EYE[1]) ** 2 < 15 * 15;

const BODY_SPOTS =
  spots({
    area: { x0: 134, x1: 478, y0: 84, y1: 252 },
    step: 14,
    rMin: 2.7,
    rMax: 3.8,
    seed: 11,
    op: bodySpotOp,
  }) +
  spots({
    area: { x0: 478, x1: 636, y0: 100, y1: 222 },
    step: 10.5,
    rMin: 1.9,
    rMax: 2.8,
    seed: 23,
    skip: (x, y) => x < 478 || nearEye(x, y),
    op: bodySpotOp,
  });

// ---------- Vệt sẫm xiên mờ (5 vệt) ----------
function bars(): string {
  const centers = [438, 378, 314, 252, 192];
  return centers
    .map((cx, i) => {
      const top = backY(cx) - 6;
      const bot = top + (bellyY(cx) - top) * (0.74 - i * 0.03);
      const wt = 34 - i * 3;
      const wb = 24 - i * 2;
      const lean = 16; // đỉnh vệt ngả về đuôi
      return `<path d="M${f(cx - lean - wt / 2)} ${f(top)}L${f(cx - lean + wt / 2)} ${f(top)}C${f(cx + wt * 0.3)} ${f((top + bot) / 2)} ${f(cx + 8 + wb / 2)} ${f(bot - 10)} ${f(cx + 6 + wb / 2)} ${f(bot)}L${f(cx + 6 - wb / 2)} ${f(bot)}C${f(cx - wb * 0.6)} ${f(bot - 14)} ${f(cx - wt * 0.6)} ${f((top + bot) / 2)} ${f(cx - lean - wt / 2)} ${f(top)}Z"/>`;
    })
    .join('');
}

// ---------- Định nghĩa ----------
const body = standardBody(u, BODY, {
  dorsal: OLIVE_D,
  flank: OLIVE,
  belly: BELLY,
  outlineColor: INK,
  scales: { size: 6, color: '#3a2c18', opacity: 0.13, stroke: 0.6 },
  flankAt: 0.48,
  rimOpacity: 0.5,
});

const theEye = eye(u, 'eye', {
  cx: EYE[0],
  cy: EYE[1],
  r: 8.2,
  iris: ['#d0a65a', '#4a3518'],
  socket: '#5d4c33',
  look: [0.25, 0.05],
});

const defs = joinDefs(
  body,
  theEye,
  radial(u('spot'), [
    [0, '#BA7446'],
    [0.6, '#9E5532'],
    [1, SPOT_D],
  ]),
  linear(u('fin'), [
    [0, '#8E7C5D', 0.78],
    [1, '#A99777', 0.66],
  ]),
  linear(
    u('finSoft'),
    [
      [0, '#857353', 0.74],
      [1, '#B4A383', 0.6],
    ],
    { user: true, x1: 0, y1: 50, x2: 0, y2: 110 },
  ),
  linear(u('pec'), [
    [0, '#6E5D42', 0.86],
    [1, '#8B7856', 0.78],
  ], { x1: 1, y1: 0, x2: 0, y2: 0 }),
  linear(
    u('bar'),
    [
      [0, '#33281a', 0.9],
      [0.55, '#33281a', 0.55],
      [1, '#3c2f1d', 0],
    ],
    { user: true, x1: 0, y1: 88, x2: 0, y2: 220 },
  ),
  radial(
    u('cheek'),
    [
      [0, '#fff6e2', 0.35],
      [1, '#fff6e2', 0],
    ],
  ),
  blurFilter(u('barBlur'), 5),
  organicTexture(u('tex'), { freq: 0.05, octaves: 3, strength: 0.16, seed: 7 }),
  `<clipPath id="${u('dorsalClip')}"><path d="${DORSAL}"/></clipPath>`,
  `<clipPath id="${u('caudalClip')}"><path d="${CAUDAL}"/></clipPath>`,
  `<clipPath id="${u('analClip')}"><path d="${ANAL}"/></clipPath>`,
  `<clipPath id="${u('pecClip')}"><path d="${PECTORAL}"/></clipPath>`,
);

const finEdge = (d: string, w = 1.3, op = 0.5): string =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-opacity="${op}" stroke-linejoin="round"/>`;

const art: CreatureArt = {
  id: 'ca_song_cham_nau',
  viewBox: [660, 330],
  lengthUnits: 612,
  spineY: 170,
  animation: 'fish',
  cycleHz: 0.85,
  bendAmp: 11,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'pelvicFar',
      role: 'fin',
      z: 'back',
      pivot: [456, 238],
      anim: { type: 'rotate', amp: 0.07, speed: 0.8, phase: 2.6 },
      svg: `<g transform="translate(8 -3)"><path d="${PELVIC_FAR}" fill="#5b4b33" fill-opacity="0.75"/></g>`,
    },
    {
      name: 'caudal',
      role: 'tail',
      svg:
        `<path d="${CAUDAL}" fill="${u.url('fin')}"/>` +
        `<g clip-path="${u.url('caudalClip')}">` +
        spots({ area: { x0: 20, x1: 152, y0: 110, y1: 232 }, step: 13, rMin: 2.4, rMax: 3.3, seed: 31, op: (x) => (x < 34 ? 0.35 : 0.72) }) +
        // mép đuôi hơi sẫm
        `<path d="${smoothPath(CAUDAL_PTS.slice(2, 11), false)}" fill="none" stroke="#4d3d25" stroke-opacity="0.35" stroke-width="5"/>` +
        `</g>` +
        caudalRays() +
        finEdge(smoothPath(CAUDAL_PTS.slice(1, 12), false), 1.3, 0.45),
    },
    {
      name: 'dorsal',
      role: 'detail',
      svg:
        `<path d="${DORSAL}" fill="${u.url('finSoft')}"/>` +
        `<g clip-path="${u.url('dorsalClip')}">` +
        spots({
          area: { x0: 150, x1: 470, y0: 46, y1: 120 },
          step: 12.5,
          rMin: 2.3,
          rMax: 3.2,
          seed: 41,
          op: (x, y) => (y > backY(x) - 4 ? 0 : 0.85),
        }) +
        `</g>` +
        softDorsalRays() +
        `<g fill="#45371f" fill-opacity="0.85">${spineRods()}</g>` +
        `<path d="${spineTips()}" fill="none" stroke="#6b5a3e" stroke-opacity="0.7" stroke-width="1.1" stroke-linecap="round"/>` +
        finEdge(DORSAL, 1.1, 0.42),
    },
    {
      name: 'anal',
      role: 'detail',
      svg:
        `<path d="${ANAL}" fill="${u.url('fin')}"/>` +
        `<g clip-path="${u.url('analClip')}">` +
        spots({
          area: { x0: 170, x1: 306, y0: 214, y1: 282 },
          step: 12,
          rMin: 2.2,
          rMax: 3.1,
          seed: 53,
          op: (x, y) => (y < bellyY(x) + 2 ? 0 : 0.8),
        }) +
        `</g>` +
        analRays() +
        ANAL_SPINES +
        finEdge(smoothPath(ANAL_EDGE, false), 1.2, 0.45),
    },
    {
      name: 'body',
      role: 'body',
      svg:
        `<g filter="${u.url('tex')}">${body.base}</g>` +
        `<g clip-path="${u.url('bodyClip')}">` +
        // vệt sẫm xiên mờ
        `<g fill="${u.url('bar')}" filter="${u.url('barBlur')}" opacity="0.7">${bars()}</g>` +
        // đầu hơi sẫm phía trên, má sáng
        `<ellipse cx="560" cy="186" rx="44" ry="26" fill="${u.url('cheek')}"/>` +
        BODY_SPOTS +
        `</g>` +
        body.overlay,
    },
    {
      name: 'head',
      role: 'detail',
      svg:
        // gờ trước nắp mang (cong, góc có răng cưa nhỏ)
        `<path d="M532 128C524 150 519 178 522 199C524 210 531 217 542 219" fill="none" stroke="${INK}" stroke-opacity="0.38" stroke-width="1.4" stroke-linecap="round"/>` +
        `<path d="M535 129C527 151 522 178 525 198" fill="none" stroke="#fff3dc" stroke-opacity="0.3" stroke-width="0.9"/>` +
        `<path d="M521 196l-3 2M522 203l-3 3M526 210l-2 3M532 215l-1 3" fill="none" stroke="${INK}" stroke-opacity="0.35" stroke-width="0.9" stroke-linecap="round"/>` +
        // mép nắp mang + 3 gai dẹt
        `<path d="M488 104C476 128 467 158 464 186C462 204 467 220 478 232" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="1.6" stroke-linecap="round"/>` +
        `<path d="M491 106C480 130 471 158 468 186" fill="none" stroke="#fff3dc" stroke-opacity="0.28" stroke-width="1"/>` +
        `<path d="M470 146L459 152L469 156ZM467 162L454 168L466 172ZM466 180L457 184L466 187Z" fill="${INK}" fill-opacity="0.32"/>` +
        // màng mang dưới họng
        `<path d="M478 232C500 228 526 222 548 214" fill="none" stroke="${INK}" stroke-opacity="0.22" stroke-width="1.1"/>` +
        // xương hàm trên (maxilla) – đầu sau nở rộng, kéo tới dưới mắt
        `<path d="M624 184C602 189 578 195 560 200C551 203 548 210 554 213C566 212 584 207 600 201" fill="#a39272" fill-opacity="0.35" stroke="${INK}" stroke-opacity="0.5" stroke-width="1.2" stroke-linejoin="round"/>` +
        // khe miệng
        `<path d="M634 195C614 199 588 205 556 212" fill="none" stroke="#2c2112" stroke-opacity="0.85" stroke-width="1.8" stroke-linecap="round"/>` +
        // hàm dưới chìa ra: môi dưới & cằm
        `<path d="M632 197C614 201 590 207 562 214" fill="none" stroke="#fff4de" stroke-opacity="0.4" stroke-width="1.1" stroke-linecap="round"/>` +
        // môi trên sáng
        `<path d="M627 185C612 188 596 192 580 196" fill="none" stroke="#fff4de" stroke-opacity="0.35" stroke-width="1" stroke-linecap="round"/>` +
        // lỗ mũi
        `<circle cx="608" cy="152" r="1.6" fill="#2c2112" opacity="0.55"/><circle cx="600" cy="148" r="1.3" fill="#2c2112" opacity="0.45"/>` +
        // đường bên (song song đường lưng)
        `<path d="${smoothPath(
          [480, 420, 360, 300, 240, 190, 152].map((x): P => [x, backY(x) + 13 + (x < 200 ? 4 : 0)]),
          false,
        )}" fill="none" stroke="#f6eedb" stroke-opacity="0.22" stroke-width="1.2"/>`,
    },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    {
      name: 'pelvic',
      role: 'fin',
      pivot: PEL_PIVOT,
      anim: { type: 'rotate', amp: 0.07, speed: 0.8, phase: 1.6 },
      svg:
        `<path d="${PELVIC}" fill="${u.url('fin')}"/>` +
        finRays([450, 240], [[446, 256], [432, 272], [418, 284], [406, 289], [401, 282]], { color: INK, opacity: 0.32, width: 0.9 }) +
        finEdge(PELVIC, 1.1, 0.4),
    },
    {
      name: 'pectoral',
      role: 'fin',
      pivot: PEC_PIVOT,
      anim: { type: 'rotate', amp: 0.16, speed: 0.8 },
      svg:
        `<path d="${PECTORAL}" fill="${u.url('pec')}"/>` +
        `<g clip-path="${u.url('pecClip')}">` +
        spots({ area: { x0: 350, x1: 450, y0: 168, y1: 234 }, step: 12, rMin: 2.2, rMax: 3, seed: 61, op: (x) => (x > 435 ? 0.25 : 0.55) }) +
        `</g>` +
        pecRays() +
        finEdge(PECTORAL, 1.2, 0.5),
    },
  ],
};

export default art;
