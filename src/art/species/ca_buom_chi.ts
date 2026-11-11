/**
 * Cá bướm chỉ – Chaetodon auriga (Threadfin butterflyfish)
 * Đặc điểm nhận dạng: thân dẹt bên gần tròn như đĩa, mõm nhỏ nhọn; nửa trước trắng với HAI hệ
 * sọc chéo mảnh vuông góc nhau (chữ V nằm); nửa sau trên + vây lưng/hậu môn/đuôi vàng tươi;
 * dải đen dọc che mắt; SỢI CHỈ dài từ góc sau vây lưng, đốm đen nhỏ ở gốc sợi chỉ.
 * Tham khảo: references/ca_buom_chi (4 ảnh Wikimedia Commons, chỉ để nhìn).
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
  joinDefs,
  smoothPath,
  rng,
  rimGradient,
  rimLight,
} from '../style-bible';

const u = makeIds('ca_buom_chi');

/** Toạ độ thiết kế được dịch (DX, DY) để căn giữa viewBox (mọi lớp bọc trong G()). */
const DX = 20;
const DY = -26;
const G = (s: string) => `<g transform="translate(${DX} ${DY})">${s}</g>`;
const P = (x: number, y: number): [number, number] => [x + DX, y + DY];

const WHITE_D = '#D9E2EB';
const WHITE = '#F3F7FA';
const WHITE_L = '#FFFFFF';
const YELLOW = '#FFD21A';
const YELLOW_D = '#F2B400';
const GOLD = '#E9A514';
const STRIPE = '#2B3038';
const INK = '#111214';
const OUTLINE = '#6d6748';

type Pt = [number, number];

// ---------- Đĩa thân (thân + vây lưng/hậu môn mềm phủ vảy liền khối) ----------
const BODY_PTS: Pt[] = [
  [536, 222], // chóp mõm
  [529, 213],
  [515, 206],
  [499, 195],
  [487, 179], // trán lõm nhẹ trên mõm
  [471, 147],
  [451, 113],
  [425, 87],
  [392, 70],
  [350, 62],
  [300, 60],
  [250, 62],
  [205, 67],
  [166, 75],
  [133, 83],
  [111, 92], // góc sau vây lưng mềm (gốc sợi chỉ)
  [110, 110],
  [119, 134],
  [131, 156], // cuống đuôi trên
  [135, 186],
  [130, 216], // cuống đuôi dưới
  [117, 234],
  [105, 252], // góc sau vây hậu môn
  [112, 269],
  [139, 287],
  [180, 304],
  [230, 316],
  [290, 322],
  [350, 320],
  [400, 310],
  [440, 294],
  [468, 277], // họng
  [492, 257],
  [512, 241],
  [527, 230],
];
const BODY = smoothPath(BODY_PTS, true, 0.55);

// mép lưng (cho rim light) – chỉ phần trên
const BACK_EDGE = smoothPath(BODY_PTS.slice(3, 16), false, 0.55);

// ---------- Vây lưng & hậu môn: viền màng mỏng ló ra ngoài đĩa ----------
const DORSAL_OUT: Pt[] = [
  [384, 68],
  [350, 57.5],
  [310, 55],
  [270, 55.5],
  [232, 58],
  [198, 62.5],
  [164, 69.5],
  [132, 77.5],
  [105, 87],
  [103, 110],
  [113, 137],
  [127, 160],
];
const DORSAL = smoothPath(DORSAL_OUT, false, 0.55) + 'L190 150L330 110L380 82Z';
const DORSAL_EDGE = smoothPath(DORSAL_OUT, false, 0.55);

const ANAL_OUT: Pt[] = [
  [126, 214],
  [111, 236],
  [98, 254],
  [106, 274],
  [134, 293],
  [178, 310],
  [230, 321.5],
  [290, 327.5],
  [340, 325.5],
  [372, 316],
];
const ANAL = smoothPath(ANAL_OUT, false, 0.55) + 'L330 280L200 250Z';
const ANAL_EDGE = smoothPath(ANAL_OUT, false, 0.55);

// ---------- Vây đuôi: quạt, mép sau gần thẳng ----------
const TAIL =
  'M138 150C116 142 84 122 58 110C50 108 45 114 45 124C42 152 42 178 44 204C44 230 45 250 50 262' +
  'C54 270 60 268 66 264C88 250 116 232 138 226Z';
const TAIL_EDGE = 'M58 110C50 108 45 114 45 124C42 152 42 178 44 204C44 230 45 250 50 262C54 270 60 268 66 264';
const TAIL_SUB = 'M64 116C57 140 56 170 57 200C57 226 58 244 62 258';

// ---------- Sợi chỉ (vây lưng kéo dài) – thon dần ----------
const THREAD =
  'M124 83C98 77 70 77 42 83C22 87 6 94 -8 104C-6 104.6 -4 104.4 -2 103.4C10 96 26 91.5 44 89C70 86 98 87 122 92Z';

// ---------- Dải đen che mắt ----------
const BAND = 'M463 192C465 177 492 174 498 188C497 206 494 222 490 238C486 256 483 270 481 286L443 294C447 274 452 254 457 236C460 222 461 206 463 192Z';

// ---------- Hai hệ sọc chéo ----------
const A_DIR: Pt = [Math.cos((61 * Math.PI) / 180), Math.sin((61 * Math.PI) / 180)]; // xuống-trước
const A_N: Pt = [A_DIR[1], -A_DIR[0]]; // pháp tuyến (lên-trước)
const B_DIR: Pt = [-Math.cos((20 * Math.PI) / 180), Math.sin((20 * Math.PI) / 180)]; // xuống-sau
const B_N: Pt = [B_DIR[1], -B_DIR[0]]; // pháp tuyến (xuống-trước)

/** Họ đường song song (hơi cong). w: [min,max] độ dày ngẫu nhiên tất định; trả về các <path> riêng. */
function family(
  origin: Pt,
  dir: Pt,
  n: Pt,
  spacing: number,
  k0: number,
  k1: number,
  bow: (k: number) => number,
  o: { w?: [number, number]; seed?: number; L?: number; jitter?: number } = {},
): string {
  const r = rng(o.seed ?? 7);
  const [wMin, wMax] = o.w ?? [2.4, 2.4];
  const L = o.L ?? 230;
  let out = '';
  for (let k = k0; k <= k1; k++) {
    const jit = ((r() - 0.5) * (o.jitter ?? 0)) * spacing;
    const px = origin[0] + n[0] * (spacing * k + jit);
    const py = origin[1] + n[1] * (spacing * k + jit);
    const x1 = px - dir[0] * L;
    const y1 = py - dir[1] * L;
    const x2 = px + dir[0] * L;
    const y2 = py + dir[1] * L;
    const b = bow(k);
    const cx = px + n[0] * b;
    const cy = py + n[1] * b;
    const w = wMin + r() * (wMax - wMin);
    out += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke-width="${w.toFixed(2)}"/>`;
  }
  return out;
}

// Đường giao hai hệ (đỉnh chữ V) chạy chéo từ giữa lưng xuống ngực
const J_TOP: Pt = [160, 10];
const J_BOT: Pt = [470, 267];
const REGION_A = `M${J_TOP[0]} ${J_TOP[1]}Q330 118 ${J_BOT[0]} ${J_BOT[1]}L466 190C461 172 457 160 452 150C445 133 438 121 430 112C420 100 410 91 402 84C392 66 384 50 380 0L160 0Z`;
const REGION_B = `M${J_TOP[0]} ${J_TOP[1]}Q330 118 ${J_BOT[0]} ${J_BOT[1]}L478 360L0 360L0 ${J_TOP[1]}Z`;

// hệ A cong dần theo đường trán ở phía trước; hệ B hơi phồng xuống bụng
const STRIPES_A = family([300, 110], A_DIR, A_N, 19.5, -5, 8, (k) => 6 + Math.max(0, k) * 3, { w: [2.2, 3.1], seed: 11, jitter: 0.12 });
const STRIPES_B = family([300, 120], B_DIR, B_N, 17.5, -7, 13, (k) => 8 + Math.max(0, k) * 1.2, { w: [2.0, 2.9], seed: 23, jitter: 0.12 });
// vệt sáng mảnh xen giữa các sọc ở vùng vàng cam (giống ảnh: sọc vàng sáng giữa sọc sẫm)
const HL_A = family([300 + A_N[0] * 9.75, 110 + A_N[1] * 9.75], A_DIR, A_N, 19.5, -5, 4, (k) => 6 + Math.max(0, k) * 3, { w: [1.4, 1.8], seed: 11, jitter: 0.12 });
const HL_B = family([300 + B_N[0] * 8.75, 120 + B_N[1] * 8.75], B_DIR, B_N, 17.5, -7, 3, (k) => 8 + Math.max(0, k) * 1.2, { w: [1.3, 1.7], seed: 23, jitter: 0.12 });

// ---------- Tia vây trên đĩa (vùng vây lưng/hậu môn phủ vảy) ----------
const CENTER: Pt = [260, 190];
function raysFromEdge(tips: Pt[], depth: number, opts: { color: string; opacity: number; width?: number }): string {
  const bases = tips.map(([x, y]) => [x + (CENTER[0] - x) * depth, y + (CENTER[1] - y) * depth] as Pt);
  return finRays(bases, tips, { color: opts.color, opacity: opts.opacity, width: opts.width ?? 0.9, bend: 0.03 });
}
const DORSAL_TIPS: Pt[] = [
  [410, 74], [390, 66], [368, 61], [346, 58], [324, 56], [302, 55], [280, 56], [258, 57], [236, 59], [214, 62],
  [192, 65], [172, 69], [152, 73], [134, 78], [118, 85], [108, 96], [107, 110], [112, 126],
];
const ANAL_TIPS: Pt[] = [
  [112, 232], [103, 250], [106, 268], [122, 282], [142, 294], [164, 304], [188, 312], [214, 318], [240, 322],
  [266, 325], [292, 326], [318, 325], [344, 323],
];

// ---------- Vây ngực (trong suốt) & vây bụng ----------
const PEC_BASE: Pt = [436, 238];
const PECTORAL = 'M438 232C418 224 392 226 372 236C366 242 370 250 380 252C400 254 422 252 440 246Z';
const PELVIC_BASE: Pt = [446, 290];
const PELVIC = 'M450 283C442 295 428 308 408 320C405 323 407 326 411 324C428 317 442 309 454 300C455 293 453 288 450 283Z';

// ---------- Defs ----------
const body = standardBody(u, BODY, {
  dorsal: WHITE_D,
  flank: WHITE,
  belly: WHITE_L,
  outlineColor: OUTLINE,
  scales: { size: 7.5, color: '#5e6b78', opacity: 0.12, stroke: 0.6 },
  flankAt: 0.42,
  rimOpacity: 0.9,
});

const theEye = eye(u, 'eye', {
  cx: 478,
  cy: 201,
  r: 9.5,
  iris: ['#7a6a44', '#16130d'],
  pupil: 'round',
  look: [0.3, 0.05],
});

const defs = joinDefs(
  body,
  theEye,
  clipDef('regionA', REGION_A),
  clipDef('regionB', REGION_B),
  // vàng nửa sau: đậm cam ở lưng → vàng chanh ở dưới
  linear(u('yellow'), [
    [0, YELLOW_D],
    [0.35, YELLOW],
    [1, '#FFE24A'],
  ]),
  linear(u('fin'), [
    [0, '#FFE04A', 0.9],
    [0.7, '#FFF0A0', 0.55],
    [1, '#FFF8D8', 0.35],
  ]),
  // vây đuôi: vàng đặc ở gốc, mép ngoài trong
  linear(
    u('tailFill'),
    [
      [0, '#FFF6CC', 0.35],
      [0.12, '#FFEB8A', 0.55],
      [0.22, '#F6C800', 0.92],
      [1, '#F2B800', 0.96],
    ],
    { user: true, x1: 44, y1: 0, x2: 138, y2: 0 },
  ),
  linear(u('pec'), [
    [0, '#ffffff', 0.55],
    [1, '#e8f4ff', 0.28],
  ], { x1: 1, y1: 0, x2: 0, y2: 0 }),
  linear(u('thread'), [
    [0, '#F7E27A'],
    [1, '#FFF8DA', 0.6],
  ], { x1: 1, y1: 0, x2: 0, y2: 0 }),
  linear(u('band'), [
    [0, '#1d1f22'],
    [0.5, INK],
    [1, '#060708'],
  ]),
  // mặt nạ làm sọc nhạt dần về vùng vàng phía sau
  linear(
    u('stripeFade'),
    [
      [0, '#ffffff', 0.08],
      [0.45, '#ffffff', 0.55],
      [1, '#ffffff', 1],
    ],
    { user: true, x1: 180, y1: 0, x2: 330, y2: 0 },
  ),
  `<mask id="${u('stripeMask')}" maskUnits="userSpaceOnUse" x="-20" y="-60" width="600" height="460"><rect x="-20" y="-60" width="600" height="460" fill="${u.url('stripeFade')}"/></mask>`,
  radial(u('snout'), [
    [0, '#ffffff', 0.0],
    [0.7, '#b9c4cf', 0.0],
    [1, '#9aa7b4', 0.45],
  ], { cx: 0.4, cy: 0.35, r: 0.7 }),
  radial(u('spotRing'), [
    [0, '#000000'],
    [0.68, '#0b0b0b'],
    [0.82, '#3a2a06'],
    [1, '#FFE45C', 0],
  ]),
  radial(u('gloss'), [
    [0, '#ffffff', 0.6],
    [1, '#ffffff', 0],
  ]),
  rimGradient(u('rimY'), '#FFF6C0', 0.8),
  blurFilter(u('soft'), 7),
  blurFilter(u('soft2'), 3),
  blurFilter(u('soft3'), 4.5),
  linear(u('bellyShade'), [
    [0, '#5b7088', 0],
    [0.62, '#5b7088', 0],
    [1, '#5b7088', 0.22],
  ]),
);

function clipDef(name: string, d: string): string {
  return `<clipPath id="${u(name)}"><path d="${d}"/></clipPath>`;
}

const clipBody = (s: string) => `<g clip-path="${u.url('bodyClip')}">${s}</g>`;

// ---------- Lớp hoa văn (trong lớp body, cắt theo đĩa thân) ----------
const pattern =
  // vệt sáng khối ở vai trước-trên
  `<ellipse cx="380" cy="128" rx="90" ry="42" fill="${u.url('gloss')}" filter="${u.url('soft')}"/>` +
  // hai hệ sọc chéo
  `<g mask="url(#${u('stripeMask')})" fill="none" stroke="${STRIPE}" stroke-linecap="round">` +
  `<g clip-path="${u.url('regionA')}" stroke-opacity="0.88">${STRIPES_A}</g>` +
  `<g clip-path="${u.url('regionB')}" stroke-opacity="0.86">${STRIPES_B}</g>` +
  `</g>` +
  // nửa sau vàng: ranh giới chéo mềm
  `<path d="M262 18C250 80 238 140 216 198C198 246 168 284 128 340L-10 340L-10 18Z" fill="${u.url('yellow')}" filter="${u.url('soft3')}"/>` +
  // bóng khối lạnh ở bụng và phía sau thân trắng
  `<path d="${BODY}" fill="${u.url('bellyShade')}"/>` +
  // vùng giao cam-vàng (sọc chuyển ô-liu dưới lớp phủ)
  `<path d="M244 30L336 30C326 70 304 104 276 140C256 168 236 200 214 236L186 236C206 170 232 100 244 30Z" fill="${GOLD}" fill-opacity="0.5" filter="${u.url('soft')}"/>` +
  // vệt vàng sáng xen giữa sọc ở vùng giao
  `<g clip-path="${u.url('regionA')}"><g fill="none" stroke="#FFE45C" stroke-opacity="0.55" mask="url(#${u('hlMask')})">${HL_A}</g></g>` +
  `<g clip-path="${u.url('regionB')}"><g fill="none" stroke="#FFE45C" stroke-opacity="0.45" mask="url(#${u('hlMask')})">${HL_B}</g></g>` +
  // viền vàng dọc mép bụng sau (vây hậu môn)
  `<path d="M150 282C196 302 256 314 336 318L346 350L110 350Z" fill="${YELLOW}" fill-opacity="0.95" filter="${u.url('soft2')}"/>` +
  // tia vây trên vùng vây lưng / hậu môn
  raysFromEdge(DORSAL_TIPS, 0.2, { color: '#8a6a20', opacity: 0.2 }) +
  raysFromEdge(ANAL_TIPS, 0.18, { color: '#8a6a20', opacity: 0.2 }) +
  // vạch sẫm sát mép + viền nhạt (vây lưng mềm sau, vây hậu môn)
  `<path d="${smoothPath(BODY_PTS.slice(10, 19), false, 0.55)}" fill="none" stroke="#3a2a0c" stroke-opacity="0.45" stroke-width="5.5"/>` +
  `<path d="${smoothPath(BODY_PTS.slice(10, 19), false, 0.55)}" fill="none" stroke="#FFF4C4" stroke-opacity="0.85" stroke-width="2.6"/>` +
  `<path d="${smoothPath(BODY_PTS.slice(19, 28), false, 0.55)}" fill="none" stroke="#3a2a0c" stroke-opacity="0.4" stroke-width="5.5"/>` +
  `<path d="${smoothPath(BODY_PTS.slice(19, 28), false, 0.55)}" fill="none" stroke="#FFF4C4" stroke-opacity="0.85" stroke-width="2.6"/>` +
  // đốm đen gần góc sau vây lưng, viền vàng sáng
  `<ellipse cx="140" cy="94" rx="19" ry="8.6" fill="#FFE866" fill-opacity="0.6" transform="rotate(-17 140 94)"/>` +
  `<ellipse cx="140" cy="94" rx="16.5" ry="6.6" fill="url(#${u('spotRing')})" transform="rotate(-17 140 94)"/>` +
  // mõm trắng hơi xám ở dưới
  `<path d="M497 192C512 204 526 212 536 222C527 232 512 242 492 254Z" fill="${u.url('snout')}"/>` +
  // nắp mang (mép mảnh sau dải mắt)
  `<path d="M452 196C448 220 446 250 440 284" fill="none" stroke="#7d8996" stroke-opacity="0.35" stroke-width="1.3"/>` +
  `<path d="M456 196C452 222 450 250 444 282" fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1"/>` +
  // dải đen che mắt
  `<path d="${BAND}" fill="${u.url('band')}"/>` +
  `<path d="M470 186C474 180 486 180 490 186" fill="none" stroke="#5a5f66" stroke-opacity="0.5" stroke-width="1.2"/>`;

const hlMask =
  linear(
    u('hlFade'),
    [
      [0, '#ffffff', 0],
      [0.35, '#ffffff', 1],
      [0.7, '#ffffff', 0.6],
      [1, '#ffffff', 0],
    ],
    { user: true, x1: 170, y1: 0, x2: 340, y2: 0 },
  ) +
  `<mask id="${u('hlMask')}" maskUnits="userSpaceOnUse" x="-20" y="-60" width="600" height="460"><rect x="-20" y="-60" width="600" height="460" fill="${u.url('hlFade')}"/></mask>`;

const art: CreatureArt = {
  id: 'ca_buom_chi',
  viewBox: [576, 330],
  lengthUnits: 492,
  spineY: 188 + DY,
  animation: 'fish',
  cycleHz: 1.35,
  bendAmp: 9,
  cardDetailLevel: 'hi',
  defs: defs + hlMask,
  layers: [
    {
      name: 'tail',
      role: 'tail',
      svg: G(
        `<path d="${TAIL}" fill="${u.url('tailFill')}"/>` +
          finRays([136, 188], [
            [60, 113], [53, 128], [49, 144], [47, 160], [46, 176], [46, 192], [47, 208], [48, 224], [50, 240], [54, 256],
          ], { color: '#9a6a00', opacity: 0.32, width: 1 }) +
          `<path d="${TAIL_SUB}" fill="none" stroke="#5a2e0a" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round"/>` +
          `<path d="${TAIL_EDGE}" fill="none" stroke="#c9a640" stroke-opacity="0.5" stroke-width="1.1"/>`,
      ),
    },
    {
      name: 'thread',
      role: 'detail',
      svg: G(
        `<path d="${THREAD}" fill="${u.url('thread')}" stroke="#b8952a" stroke-opacity="0.45" stroke-width="0.6"/>`,
      ),
    },
    {
      name: 'dorsal',
      role: 'detail',
      svg: G(
        `<path d="${DORSAL}" fill="${u.url('fin')}"/>` +
          raysFromEdge(
            DORSAL_OUT.slice(1, 11),
            0.12,
            { color: '#b89030', opacity: 0.35, width: 0.8 },
          ) +
          `<path d="${DORSAL_EDGE}" fill="none" stroke="#c4a850" stroke-opacity="0.45" stroke-width="1"/>`,
      ),
    },
    {
      name: 'anal',
      role: 'detail',
      svg: G(
        `<path d="${ANAL}" fill="${u.url('fin')}"/>` +
          raysFromEdge(ANAL_OUT.slice(1, 9), 0.12, { color: '#b89030', opacity: 0.35, width: 0.8 }) +
          `<path d="${ANAL_EDGE}" fill="none" stroke="#c4a850" stroke-opacity="0.45" stroke-width="1"/>`,
      ),
    },
    {
      name: 'body',
      role: 'body',
      svg: G(body.base + clipBody(pattern) + body.overlay + rimLight(BACK_EDGE, u.url('rimY'), 1.6)),
    },
    {
      name: 'face',
      role: 'detail',
      svg: G(
        // miệng nhỏ ở chóp mõm
        `<path d="M536 222Q530 224.5 524 223.5" fill="none" stroke="#4a4f57" stroke-width="1.4" stroke-linecap="round"/>` +
          `<path d="M531 214Q524 211 518 212" fill="none" stroke="#ffffff" stroke-width="1.1" opacity="0.8"/>` +
          `<circle cx="508" cy="206" r="1.3" fill="#6a737d" opacity="0.6"/>`,
      ),
    },
    { name: 'eye', role: 'eye', svg: G(theEye.svg) },
    {
      name: 'pelvic',
      role: 'fin',
      z: 'front',
      pivot: P(PELVIC_BASE[0], PELVIC_BASE[1]),
      anim: { type: 'rotate', amp: 0.1, speed: 0.8, phase: 1.2 },
      svg: G(
        `<path d="${PELVIC}" fill="#FBFCF4" fill-opacity="0.88" stroke="#a9a27a" stroke-opacity="0.5" stroke-width="1"/>` +
          finRays([450, 290], [[410, 322], [420, 318], [431, 312], [442, 305]], { color: '#c8b860', opacity: 0.4, width: 0.7 }),
      ),
    },
    {
      name: 'pectoral',
      role: 'fin',
      z: 'front',
      pivot: P(PEC_BASE[0], PEC_BASE[1]),
      anim: { type: 'rotate', amp: 0.34, speed: 1.6 },
      svg: G(
        `<path d="${PECTORAL}" fill="${u.url('pec')}" stroke="#c9d6e2" stroke-opacity="0.8" stroke-width="1"/>` +
          finRays(PEC_BASE, [[376, 236], [374, 242], [378, 249], [390, 252], [406, 253], [422, 251]], {
            color: '#ffffff',
            opacity: 0.45,
            width: 0.7,
          }),
      ),
    },
  ],
};

export default art;
