/**
 * Cá mập sáu mang – Hexanchus griseus
 * Đặc điểm nhận dạng: cá mập nguyên thủy thân dày nặng nề, nâu xám sẫm, bụng nhạt dần (không tách bạch);
 * đầu dẹt, mõm tròn tù rộng, miệng dài dưới đầu; SÁU khe mang dài (khe đầu dài nhất);
 * CHỈ MỘT vây lưng thấp nằm rất lùi về sau (ngay sau vây bụng); vây hậu môn nhỏ ngay dưới;
 * đuôi thùy trên dài, nâng rất thấp, có khía dưới chóp, thùy dưới ngắn yếu;
 * mắt to phản quang xanh lục huỳnh quang (tapetum) – lớp glow nhẹ #5BFFB0.
 * Tầng 3: thân tối, có rim light trắng + rim lạnh mảnh để nhìn được khi đèn chiếu.
 * Tham khảo: references/ca_map_sau_mang (ref1–ref3, Wikimedia Commons).
 */
import type { CreatureArt } from '../contract';
import {
  makeIds,
  standardBody,
  eye,
  linear,
  radial,
  blurFilter,
  glowFilter,
  organicTexture,
  joinDefs,
  smoothPath,
  scatterSpots,
} from '../style-bible';

const u = makeIds('ca_map_sau_mang');

const BACK = '#3d3a35';
const FLANK = '#58534b';
const BELLY = '#8f897c';
const EDGE = '#2f2c27';
const PALE = '#d6cfc0';
const GLOW = '#5BFFB0';

// ---------- Thân (đầu phải, đuôi trái) ----------
const TOP: [number, number][] = [
  [777, 152],
  [777, 143],
  [774, 134],
  [766, 126],
  [752, 119.5],
  [738, 114.5],
  [722, 110],
  [692, 101],
  [657, 93],
  [620, 86],
  [580, 81],
  [540, 78.5],
  [500, 78.5],
  [460, 81],
  [420, 87],
  [382, 95],
  [346, 104],
  [308, 113],
  [270, 121],
  [240, 126.5],
  [214, 131],
  [194, 134.5],
  [178, 138.5],
];
const BOTTOM: [number, number][] = [
  [194, 142.5],
  [216, 147.5],
  [242, 153],
  [274, 160],
  [312, 169],
  [354, 179],
  [400, 189],
  [450, 196],
  [500, 199.5],
  [550, 199.5],
  [598, 197],
  [640, 192.5],
  [678, 186.5],
  [708, 180],
  [732, 173.5],
  [752, 166.5],
  [768, 161],
  [775, 156.5],
];
const BODY = smoothPath([...TOP, ...BOTTOM], true);
/** Đường lưng (mở) – cho rim lạnh. */
const DORSAL_LINE = smoothPath(TOP.slice(2, 18));

// ---------- Vây gắn thân (uốn theo thân) ----------
/** Đuôi: thùy trên dài nâng thấp, khía dưới chóp; thùy dưới ngắn, tròn. */
const CAUDAL =
  'M240 127C204 121 150 112 100 106C72 103 48 100 34 101C27 101.5 25 107 30 110.5C37 115 48 119 57 122' +
  'L62 129C88 135 118 143 146 152C154 160 158 170 157 180C156 187 161 189 167 185' +
  'C182 175 204 163 242 156Z';
const CAUDAL_EDGE =
  'M34 101C27 101.5 25 107 30 110.5C37 115 48 119 57 122L62 129C88 135 118 143 146 152C154 160 158 170 157 180C156 187 161 189 167 185';

/** Vây lưng duy nhất: thấp, chóp tròn, mép sau lõm, đuôi tự do dài. */
const DORSAL =
  'M360 103C352 91 340 78 328 71C321 67 315 68 313 75C309 89 302 102 290 111C285 115 280 118 274 120' +
  'C284 120.5 293 118.5 302 116.5L332 109Z';
const DORSAL_EDGE = 'M360 103C352 91 340 78 328 71C321 67 315 68 313 75C309 89 302 102 290 111C285 115 280 118 274 120';
const DORSAL_TRAIL = 'M313 75C309 89 302 102 290 111C285 115 280 118 274 120';

const ANAL = 'M310 168C304 176 295 184 285 188.5C280 190.5 276 188.5 277 184C278 178 273 169 260 160L286 163Z';
const ANAL_EDGE = 'M310 168C304 176 295 184 285 188.5C280 190.5 276 188.5 277 184C278 178 273 169 260 160';
const ANAL_TRAIL = 'M285 188.5C280 190.5 276 188.5 277 184C278 178 273 169 260 160';

const PELVIC = 'M420 191C414 202 403 212 389 218.5C382 221.5 377 219.5 378 214.5C379 206 372 194 354 182L388 186Z';
const PELVIC_EDGE = 'M420 191C414 202 403 212 389 218.5C382 221.5 377 219.5 378 214.5C379 206 372 194 354 182';
const PELVIC_TRAIL = 'M389 218.5C382 221.5 377 219.5 378 214.5C379 206 372 194 354 182';

// ---------- Vây ngực (rộng, chóp tròn; tách lớp) ----------
const PECT_NEAR =
  'M646 189C639 207 624 231 602 253C593 262 582 267 577 263.5C573 260 576 252 580 244' +
  'C587 229 592 215 593 199C605 195 622 192 636 190Z';
const PECT_NEAR_LEAD = 'M646 189C639 207 624 231 602 253C593 262 582 267 577 263.5';
const PECT_NEAR_TRAIL = 'M577 263.5C573 260 576 252 580 244C587 229 592 215 593 199';
const PECT_FAR =
  'M626 192C619 208 607 228 593 242C588 247 582 248 582.5 243.5C585 231 588 217 589 204C600 198 612 195 620 193Z';

// ---------- Hoa văn ----------
/** Vùng bụng nhạt – ranh giới mềm (blur), chạy từ cằm về cuống đuôi. */
const BELLY_ZONE =
  'M772 160C752 165 728 170 700 173C664 177 626 178 588 179C548 180 508 180 468 179C428 177 392 173 356 167' +
  'C316 161 276 155 236 150C216 148 200 146 186 145L186 250L780 250Z';

/** 6 khe mang dài cong nhẹ, khe đầu dài nhất – ngắn dần về sau. */
function gills(): string {
  let dark = '';
  let lite = '';
  let deep = '';
  for (let i = 0; i < 6; i++) {
    const x = 688 - i * 10;
    const top = 136 + i * 2.2;
    const bot = 176 + i * 2.0;
    const mid = (top + bot) / 2;
    dark += `M${x + 2.5} ${top}Q${x - 3.5} ${mid} ${x + 0.5} ${bot}`;
    lite += `M${x + 4.6} ${top + 2}Q${x - 1.2} ${mid} ${x + 2.6} ${bot - 1.5}`;
    deep += `M${x + 1.6} ${top + 4}Q${x - 3} ${mid} ${x + 0.4} ${bot - 4}`;
  }
  return (
    // vạt da sau mỗi khe sáng nhẹ (phản sáng đèn)
    `<path d="${lite}" fill="none" stroke="#d9d2c2" stroke-opacity="0.24" stroke-width="1.3" stroke-linecap="round"/>` +
    `<path d="${dark}" fill="none" stroke="#1d1b18" stroke-opacity="0.72" stroke-width="1.7" stroke-linecap="round"/>` +
    // lòng khe sâu, đỏ sẫm rất nhẹ
    `<path d="${deep}" fill="none" stroke="#3a1f1c" stroke-opacity="0.45" stroke-width="0.8" stroke-linecap="round"/>`
  );
}

/** Miệng: bậc hai từ gần mõm về khóe miệng (lùi sau mắt). */
const MOUTH_P: [number, number][] = [
  [766, 158],
  [744, 169],
  [701, 174.5],
];
const MOUTH = `M${MOUTH_P[0][0]} ${MOUTH_P[0][1]}Q${MOUTH_P[1][0]} ${MOUTH_P[1][1]} ${MOUTH_P[2][0]} ${MOUTH_P[2][1]}`;

/** Răng hàm dưới hình lược (mỗi răng nhiều mấu) – răng cưa nhỏ dọc mép miệng, rất mờ. */
function combTeeth(): string {
  const [a, b, c] = MOUTH_P;
  const pts: string[] = [];
  const N = 34;
  for (let k = 0; k <= N; k++) {
    const t = 0.14 + (k / N) * 0.62;
    const mt = 1 - t;
    const x = mt * mt * a[0] + 2 * mt * t * b[0] + t * t * c[0];
    const y = mt * mt * a[1] + 2 * mt * t * b[1] + t * t * c[1];
    // răng cưa nhỏ nhô xuống, cứ 5 mấu có 1 mấu cao (răng chính của chiếc răng lược)
    const h = k % 2 === 0 ? 0.5 : k % 5 === 1 ? 2.2 : 1.3;
    pts.push(`${x.toFixed(1)} ${(y + h).toFixed(1)}`);
  }
  return `<path d="M${pts.join('L')}" fill="none" stroke="#e4ddcc" stroke-opacity="0.36" stroke-width="0.55" stroke-linejoin="round"/>`;
}

/** Sợi mờ trong vây (ceratotrichia thấy qua da). */
function striae(base: [number, number][], tips: [number, number][]): string {
  return base
    .map((b, i) => {
      const t = tips[i];
      const mx = (b[0] + t[0]) / 2 + (t[1] - b[1]) * 0.05;
      const my = (b[1] + t[1]) / 2 - (t[0] - b[0]) * 0.05;
      return `M${b[0]} ${b[1]}Q${mx.toFixed(1)} ${my.toFixed(1)} ${t[0]} ${t[1]}`;
    })
    .join('');
}

/** Vây da cá mập: đục, gradient, sợi mờ, mép sau nhạt. */
function sharkFin(d: string, edge: string, trail: string, clipId: string, fill: string, str: string, extra = ''): string {
  return (
    `<path d="${d}" fill="${fill}"/>` +
    `<g clip-path="${u.url(clipId)}">` +
    `<path d="${str}" fill="none" stroke="#1f1d19" stroke-opacity="0.12" stroke-width="0.8" stroke-linecap="round"/>` +
    extra +
    `<path d="${trail}" fill="none" stroke="${PALE}" stroke-opacity="0.5" stroke-width="3.2" filter="${u.url('soft1')}"/>` +
    `</g>` +
    `<path d="${edge}" fill="none" stroke="${EDGE}" stroke-width="1.3" stroke-opacity="0.6" stroke-linejoin="round" stroke-linecap="round"/>`
  );
}

const body = standardBody(u, BODY, {
  dorsal: BACK,
  flank: FLANK,
  belly: BELLY,
  outlineColor: EDGE,
  scales: false,
  flankAt: 0.5,
  rimOpacity: 0.85,
});

const theEye = eye(u, 'eye', {
  cx: 732,
  cy: 127,
  r: 7.2,
  iris: ['#8dffc8', '#14583e'],
  pupil: 'vslit',
  socket: '#34312c',
  look: [0.2, 0],
});

const defs = joinDefs(
  body,
  theEye,
  organicTexture(u('skin'), { freq: 0.38, octaves: 2, strength: 0.14, seed: 17 }),
  blurFilter(u('soft1'), 1.1),
  blurFilter(u('soft2'), 2.4),
  blurFilter(u('soft5'), 5),
  glowFilter(u('glow'), 2.4, 1.7),
  linear(u('belly'), [
    [0, '#9d9789'],
    [0.6, '#aaa496'],
    [1, '#958f81'],
  ], { user: true, x1: 0, y1: 166, x2: 0, y2: 202 }),
  linear(u('finTop'), [
    [0, '#4f4b44'],
    [0.6, BACK],
    [1, '#33302b'],
  ]),
  linear(u('finLow'), [
    [0, '#625d55'],
    [1, '#857f72'],
  ]),
  linear(u('caudal'), [
    [0, '#3a3732'],
    [0.45, '#4f4b44'],
    [1, '#6e685d'],
  ], { user: true, x1: 0, y1: 100, x2: 0, y2: 188 }),
  linear(u('pect'), [
    [0, '#4f4b44'],
    [0.55, '#68635a'],
    [1, '#837d70'],
  ], { user: true, x1: 646, y1: 190, x2: 578, y2: 260 }),
  linear(u('joinFade'), [
    [0, '#ffffff'],
    [0.55, '#ffffff'],
    [1, '#000000'],
  ], { user: true, x1: 160, y1: 0, x2: 218, y2: 0 }),
  `<mask id="${u('joinMask')}" maskUnits="userSpaceOnUse" x="140" y="115" width="90" height="50">` +
    `<rect x="140" y="115" width="90" height="50" fill="${u.url('joinFade')}"/></mask>`,
  radial(u('pectGloss'), [
    [0, '#ffffff', 0.18],
    [1, '#ffffff', 0],
  ], { cx: 0.62, cy: 0.25, r: 0.5 }),
  radial(u('eyeHalo'), [
    [0, GLOW, 0.55],
    [0.45, GLOW, 0.22],
    [1, GLOW, 0],
  ]),
  linear(u('coolRim'), [
    [0, '#9feaff', 0],
    [0.25, '#9feaff', 0.5],
    [0.8, '#9feaff', 0.55],
    [1, '#9feaff', 0.2],
  ], { user: true, x1: 190, y1: 0, x2: 776, y2: 0 }),
  `<clipPath id="${u('caudalClip')}"><path d="${CAUDAL}"/></clipPath>`,
  `<clipPath id="${u('dClip')}"><path d="${DORSAL}"/></clipPath>`,
  `<clipPath id="${u('analClip')}"><path d="${ANAL}"/></clipPath>`,
  `<clipPath id="${u('pelvClip')}"><path d="${PELVIC}"/></clipPath>`,
  `<clipPath id="${u('pectClip')}"><path d="${PECT_NEAR}"/></clipPath>`,
  `<clipPath id="${u('pectFarClip')}"><path d="${PECT_FAR}"/></clipPath>`,
);

// ---------- Lớp ----------
const caudalSvg =
  `<path d="${CAUDAL}" fill="${u.url('caudal')}"/>` +
  `<g clip-path="${u.url('caudalClip')}">` +
  `<path d="${striae(
    [[230, 128], [222, 131], [214, 134], [206, 138], [200, 144], [200, 150], [206, 156]],
    [[44, 104], [70, 112], [96, 120], [124, 132], [150, 150], [160, 172], [164, 184]],
  )}" fill="none" stroke="#1f1d19" stroke-opacity="0.12" stroke-width="0.8"/>` +
  // mép sau nhạt dọc thùy trên + thùy dưới
  `<path d="${CAUDAL_EDGE}" fill="none" stroke="${PALE}" stroke-width="4" stroke-opacity="0.38" stroke-linejoin="round" filter="${u.url('soft1')}"/>` +
  // sống thùy trên sáng nhẹ
  `<path d="M232 125C190 118 132 110 64 104" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2.2"/>` +
  `</g>` +
  `<path d="${CAUDAL}" fill="none" stroke="${EDGE}" stroke-width="1.2" stroke-opacity="0.55" stroke-linejoin="round"/>`;

/** Che mũi thân chồng lên gốc đuôi để cuống đuôi liền mạch. */
const tailJoinSvg =
  `<g clip-path="${u.url('caudalClip')}" mask="${u.url('joinMask')}">` +
  `<rect x="150" y="120" width="72" height="40" fill="${u.url('caudal')}"/>` +
  `</g>`;

const dorsalSvg =
  sharkFin(
    DORSAL,
    DORSAL_EDGE,
    DORSAL_TRAIL,
    'dClip',
    u.url('finTop'),
    striae(
      [[352, 104], [342, 106], [332, 108], [320, 111], [308, 114]],
      [[328, 73], [320, 70], [315, 75], [308, 91], [292, 112]],
    ),
  ) +
  // ánh sáng mép trước
  `<path d="M356 98C348 87 338 77 327 72" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.6" stroke-linecap="round"/>`;

const analSvg = sharkFin(
  ANAL,
  ANAL_EDGE,
  ANAL_TRAIL,
  'analClip',
  u.url('finLow'),
  striae([[304, 168], [294, 166], [282, 164]], [[286, 187], [280, 187], [278, 179]]),
);

const pelvicSvg = sharkFin(
  PELVIC,
  PELVIC_EDGE,
  PELVIC_TRAIL,
  'pelvClip',
  u.url('finLow'),
  striae([[412, 192], [400, 190], [386, 188], [372, 186]], [[392, 216], [384, 218], [380, 212], [378, 204]]),
);

const bodySvg =
  `<g filter="${u.url('skin')}">` +
  body.base +
  `<g clip-path="${u.url('bodyClip')}">` +
  // bụng nhạt, ranh giới mềm
  `<path d="${BELLY_ZONE}" fill="${u.url('belly')}" fill-opacity="0.75" filter="${u.url('soft5')}"/>` +
  // vai/lưng trước sẫm, khối đầu nặng
  `<ellipse cx="590" cy="94" rx="130" ry="18" fill="#24221e" fill-opacity="0.3" filter="${u.url('soft5')}"/>` +
  // má sáng nhẹ quanh vùng mang
  `<ellipse cx="672" cy="160" rx="44" ry="14" fill="#c9c2b3" fill-opacity="0.18" filter="${u.url('soft5')}"/>` +
  // đốm, chấm sẫm rải rác (da cá mập già)
  scatterSpots(53, { x: 200, y: 86, w: 540, h: 80 }, { count: 220, rMin: 0.5, rMax: 1.2, color: '#26231f', opacity: 0.2, minGap: 5 }) +
  scatterSpots(59, { x: 260, y: 110, w: 420, h: 60 }, { count: 50, rMin: 1.2, rMax: 2.4, color: '#2c2924', opacity: 0.12, minGap: 14 }) +
  // lỗ cảm điện trên mõm
  scatterSpots(61, { x: 742, y: 132, w: 30, h: 26 }, { count: 26, rMin: 0.45, rMax: 0.85, color: '#1f1d19', opacity: 0.35, minGap: 3 }) +
  `</g>` +
  `</g>` +
  // vệt đường bên nhạt (ref2)
  `<path d="M664 132C600 126 530 124 462 127C386 132 310 138 236 142C214 143 198 141 188 140" fill="none" stroke="#d2cbbb" stroke-opacity="0.18" stroke-width="1.6"/>` +
  body.overlay +
  // rim lạnh mảnh dọc lưng – giữ được hình dáng khi Tầng 3 tối
  `<path d="${DORSAL_LINE}" fill="none" stroke="${u.url('coolRim')}" stroke-width="1.6" stroke-linecap="round" transform="translate(0 1.4)"/>`;

const faceSvg =
  gills() +
  // môi dưới sáng nhẹ
  `<path d="M762 163Q744 172 712 177" fill="none" stroke="#cfc8b8" stroke-opacity="0.28" stroke-width="1.2"/>` +
  // răng hàm dưới hình lược: hàng răng cưa nhỏ ló ngay dưới mép miệng
  combTeeth() +
  // miệng dài dưới đầu, khóe lùi ra sau mắt
  `<path d="${MOUTH}" fill="none" stroke="#1a1815" stroke-opacity="0.78" stroke-width="1.7" stroke-linecap="round"/>` +
  // lỗ mũi gần chóp mõm
  `<ellipse cx="766" cy="151" rx="3.4" ry="1.3" transform="rotate(-22 766 151)" fill="#171512" fill-opacity="0.6"/>` +
  // gờ trên mắt
  `<path d="M721 119Q732 114.5 743 119" fill="none" stroke="#1f1d19" stroke-opacity="0.4" stroke-width="1.8" stroke-linecap="round"/>`;

const pectFarSvg =
  `<path d="${PECT_FAR}" fill="#423f39"/>` +
  `<g clip-path="${u.url('pectFarClip')}"><path d="M583 243C585 231 588 217 589 204" fill="none" stroke="${PALE}" stroke-opacity="0.3" stroke-width="3" filter="${u.url('soft1')}"/></g>` +
  `<path d="${PECT_FAR}" fill="none" stroke="${EDGE}" stroke-width="1" stroke-opacity="0.5"/>`;

const pectNearSvg =
  `<path d="${PECT_NEAR}" fill="${u.url('pect')}"/>` +
  `<g clip-path="${u.url('pectClip')}">` +
  `<path d="${striae(
    [[642, 191], [630, 193], [618, 195], [606, 197], [596, 201]],
    [[600, 254], [590, 262], [582, 262], [580, 248], [584, 228]],
  )}" fill="none" stroke="#1f1d19" stroke-opacity="0.12" stroke-width="0.8"/>` +
  `<path d="${PECT_NEAR}" fill="${u.url('pectGloss')}"/>` +
  // mép sau nhạt (đặc trưng)
  `<path d="${PECT_NEAR_TRAIL}" fill="none" stroke="${PALE}" stroke-opacity="0.6" stroke-width="3.4" filter="${u.url('soft1')}"/>` +
  `</g>` +
  `<path d="${PECT_NEAR_LEAD}" fill="none" stroke="#ffffff" stroke-opacity="0.24" stroke-width="1.4"/>` +
  `<path d="${PECT_NEAR}" fill="none" stroke="${EDGE}" stroke-width="1.2" stroke-opacity="0.6" stroke-linejoin="round"/>`;

/** Phản quang tapetum: quầng xanh lục nhẹ + lõi sáng trong tròng. */
const eyeGlowSvg =
  `<circle cx="732" cy="127" r="17" fill="${u.url('eyeHalo')}"/>` +
  `<g filter="${u.url('glow')}" fill="${GLOW}" fill-opacity="0.55">` +
  `<circle cx="730.6" cy="127" r="2.6"/><circle cx="734.4" cy="127" r="2.6"/>` +
  `</g>`;

const art: CreatureArt = {
  id: 'ca_map_sau_mang',
  viewBox: [800, 280],
  lengthUnits: 750,
  spineY: 140,
  animation: 'fish',
  // bơi rất chậm, uể oải
  cycleHz: 0.45,
  bendAmp: 20,
  // 500 cm → công thức mặc định ~441 px, quá to cho màn chơi Tầng 3 tối (che tầm đèn);
  // 300 px vẫn lớn hơn rõ cá mập đầu búa (260) để thấy "khổng lồ", nhỏ hơn cá nhám voi (520).
  displayLengthPx: 300,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'pectoralFar',
      role: 'fin',
      z: 'back',
      pivot: [622, 194],
      anim: { type: 'rotate', amp: 0.03, speed: 0.6, phase: 1.4 },
      svg: pectFarSvg,
    },
    { name: 'caudal', role: 'tail', svg: caudalSvg },
    { name: 'anal', role: 'detail', svg: analSvg },
    { name: 'pelvic', role: 'detail', svg: pelvicSvg },
    { name: 'dorsal', role: 'detail', svg: dorsalSvg },
    { name: 'body', role: 'body', svg: bodySvg },
    { name: 'tailJoin', role: 'detail', svg: tailJoinSvg },
    { name: 'face', role: 'detail', svg: faceSvg },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    { name: 'eyeGlow', role: 'glow', bend: true, blend: 'add', svg: eyeGlowSvg },
    {
      name: 'pectoralNear',
      role: 'fin',
      z: 'front',
      pivot: [638, 191],
      anim: { type: 'rotate', amp: 0.035, speed: 0.6 },
      svg: pectNearSvg,
    },
  ],
};

export default art;
