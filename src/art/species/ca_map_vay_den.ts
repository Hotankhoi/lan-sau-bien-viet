/**
 * Cá mập vây đen – Carcharhinus melanopterus
 * Đặc điểm nhận dạng: thân thon dài kiểu cá mập rạn, lưng xám nâu nhạt, bụng trắng; mõm tròn ngắn,
 * mắt tròn nhỏ đồng tử dọc, 5 khe mang; MỌI chóp vây đen đậm (rõ nhất vây lưng 1 và thùy dưới vây đuôi),
 * ngay dưới chóp đen là dải trắng tương phản; vệt sáng hình nêm dọc hông.
 * Tham khảo: references/ca_map_vay_den (ref1–ref4, Wikimedia Commons).
 */
import type { CreatureArt } from '../contract';
import {
  makeIds,
  standardBody,
  eye,
  linear,
  radial,
  blurFilter,
  organicTexture,
  joinDefs,
  smoothPath,
  scatterSpots,
  rng,
} from '../style-bible';

const u = makeIds('ca_map_vay_den');

const BACK = '#635949';
const FLANK = '#8e8371';
const WHITE = '#f4f2ec';
const INK = '#16171a';
const EDGE = '#3b342c';

// ---------- Thân (đầu phải, đuôi trái) ----------
const BODY = smoothPath(
  [
    [746, 153],
    [740, 139],
    [726, 126],
    [702, 114],
    [670, 104],
    [632, 97],
    [592, 92],
    [552, 89],
    [512, 88],
    [472, 90],
    [432, 95],
    [392, 101],
    [342, 110],
    [292, 121],
    [242, 131],
    [202, 139.5],
    [174, 134.5],
    [155, 127],
    [135, 117.5],
    [116, 106],
    [113, 110],
    [128, 124],
    [152, 145],
    [176, 160],
    [204, 168],
    [240, 173],
    [280, 179],
    [320, 186],
    [370, 193],
    [420, 199],
    [470, 202],
    [520, 203],
    [570, 201],
    [615, 196],
    [655, 189],
    [690, 181],
    [716, 172],
    [735, 164],
  ],
  true,
);

// ---------- Vây (vây gắn thân, đuôi: uốn theo thân) ----------
const CAUDAL =
  'M200 139C170 136 120 110 66 74C48 62 34 52 27 49C22 47 20 53 25 58C31 64 39 70 45 73L49 79' +
  'C62 96 86 124 112 148C100 168 88 192 78 212C74 220 76 226 84 222C112 202 150 178 200 168Z';
const CAUDAL_EDGE =
  'M27 49C22 47 20 53 25 58C31 64 39 70 45 73L49 79C62 96 86 124 112 148C100 168 88 192 78 212C74 220 76 226 84 222';

const DORSAL1 = 'M510 98L508 89C496 70 472 42 446 28C437 23 428 25 428 34C427 55 420 78 400 96L420 100Z';
const DORSAL1_EDGE = 'M508 89C496 70 472 42 446 28C437 23 428 25 428 34C427 55 420 78 400 96';

const DORSAL2 = 'M246 134L244 129C236 120 226 110 218 105C213 102 210 105 210 110C209 120 204 128 188 134L206 137Z';
const DORSAL2_EDGE = 'M244 129C236 120 226 110 218 105C213 102 210 105 210 110C209 120 204 128 188 134';

const ANAL = 'M278 174L276 179C268 188 258 198 248 206C243 209 240 207 241 202C242 194 240 186 226 177L240 172Z';
const ANAL_EDGE = 'M276 179C268 188 258 198 248 206C243 209 240 207 241 202C242 194 240 186 226 177';

const PELVIC = 'M386 188L384 194C376 202 364 212 352 218C347 220 344 218 345 213C346 206 342 198 326 190L340 184Z';
const PELVIC_EDGE = 'M384 194C376 202 364 212 352 218C347 220 344 218 345 213C346 206 342 198 326 190';

// ---------- Vây ngực (cứng, tách lớp) ----------
const PECT_NEAR =
  'M622 178C612 200 594 230 566 258C558 266 550 270 547 266C545 262 548 254 550 246' +
  'C554 230 556 214 548 202C560 198 576 194 590 186Z';
const PECT_NEAR_LEAD = 'M622 178C612 200 594 230 566 258C558 266 550 270 547 266';
const PECT_FAR = 'M606 182C598 202 586 226 568 248C564 252 559 253 559 249C560 236 562 220 558 204C572 196 588 190 600 182Z';

// ---------- Hoa văn thân ----------
/** Vùng bụng trắng: ranh giới sắc chạy dưới mắt về cuống đuôi. */
const BELLY =
  'M760 152C740 153 718 155 690 159C650 163 610 167 570 169C530 171 490 172 450 172C410 172 372 172 340 171' +
  'C300 169 260 166 220 163C190 160 160 158 130 156L130 240L760 240Z';
/** Ranh giới bụng (dùng vẽ dải xám đậm phía trên). */
const BELLY_LINE =
  'M746 153C718 155 690 159 650 163C610 167 570 169 530 171C490 172 450 172 410 172C372 172 340 171 300 169C260 166 220 163 180 159';
/** Vệt sáng hình nêm dọc hông: rộng ở trên vây bụng, nhọn về phía vây lưng 1. */
const FLANK_BAND =
  'M604 150C566 151 506 151 446 151C400 151 362 153 334 157C320 159 312 163 308 168L322 170C348 167 390 165 430 163C486 160 548 156 604 150Z';
const FLANK_BAND2 =
  'M596 154C548 160 488 164 432 166C392 168 356 169 328 171L334 175C370 175 418 174 466 172C522 169 566 163 596 154Z';

/** Lỗ cảm giác quanh mõm */
function ampullae(): string {
  const r = rng(41);
  let s = '';
  for (let i = 0; i < 34; i++) {
    const x = 700 + r() * 42;
    const y = 128 + r() * 32;
    const dx = (x - 745) / 52;
    const dy = (y - 150) / 26;
    if (dx * dx + dy * dy > 1) continue;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.5 + r() * 0.5).toFixed(2)}"/>`;
  }
  return `<g fill="#3a3229" fill-opacity="0.32">${s}</g>`;
}

/** 5 khe mang cong nhẹ, khe sau ngắn dần. */
function gills(): string {
  let dark = '';
  let lite = '';
  for (let i = 0; i < 5; i++) {
    const x = 654 - i * 8.5;
    const top = 137 + i * 1.2;
    const bot = 170 - i * 1.5;
    const mid = (top + bot) / 2;
    dark += `M${x + 2} ${top}Q${x - 3} ${mid} ${x + 1} ${bot}`;
    lite += `M${x + 3.6} ${top + 2}Q${x - 1.2} ${mid} ${x + 2.6} ${bot - 1}`;
  }
  return (
    `<path d="${lite}" fill="none" stroke="#e9e3d6" stroke-opacity="0.38" stroke-width="1.3" stroke-linecap="round"/>` +
    `<path d="${dark}" fill="none" stroke="#3a3128" stroke-opacity="0.6" stroke-width="1.4" stroke-linecap="round"/>`
  );
}

/**
 * Vây cá mập: da mịn đục (không tia vây như cá xương), gradient + vân sợi rất mờ + chóp đen.
 * `cap` = path vùng đen (cắt theo vây), `band` = path dải trắng ngay dưới chóp đen.
 */
function sharkFin(
  d: string,
  edge: string,
  clipId: string,
  fill: string,
  cap: string,
  band: string,
  striae: string,
): string {
  return (
    `<path d="${d}" fill="${fill}"/>` +
    `<g clip-path="${u.url(clipId)}">` +
    `<path d="${striae}" fill="none" stroke="#2e2820" stroke-opacity="0.09" stroke-width="0.8" stroke-linecap="round"/>` +
    (band ? `<path d="${band}" fill="${WHITE}" fill-opacity="0.9" filter="${u.url('soft2')}"/>` : '') +
    `<path d="${cap}" fill="${u.url('ink')}"/>` +
    `</g>` +
    `<path d="${edge}" fill="none" stroke="${EDGE}" stroke-width="1.3" stroke-opacity="0.55" stroke-linejoin="round" stroke-linecap="round"/>`
  );
}

/** Các đường sợi mờ toả từ gốc vây tới mép (ceratotrichia nhìn qua da). */
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

const body = standardBody(u, BODY, {
  dorsal: BACK,
  flank: FLANK,
  belly: '#c9c1b2',
  outlineColor: EDGE,
  scales: false,
  flankAt: 0.48,
  rimOpacity: 0.7,
});

const theEye = eye(u, 'eye', {
  cx: 711,
  cy: 138,
  r: 5.4,
  iris: ['#d8d0a0', '#6e6a48'],
  pupil: 'small',
  pupilColor: 'none',
  socket: '#4a4236',
});
// đồng tử dọc kiểu cá mập
const EYE_SVG = theEye.svg.replace(
  /<circle[^>]*fill="none"\/>/,
  `<ellipse cx="711.4" cy="138" rx="1.3" ry="4" fill="#07090c"/>`,
);

const defs = joinDefs(
  body,
  theEye,
  organicTexture(u('skin'), { freq: 0.42, octaves: 2, strength: 0.12, seed: 9 }),
  blurFilter(u('soft1'), 1.1),
  blurFilter(u('soft2'), 2.2),
  blurFilter(u('soft4'), 4),
  linear(u('belly'), [
    [0, WHITE],
    [0.7, '#ece8de'],
    [1, '#d6d0c2'],
  ], { user: true, x1: 0, y1: 150, x2: 0, y2: 202 }),
  linear(u('ink'), [
    [0, '#0d0e10'],
    [1, '#24252a'],
  ]),
  linear(u('finTop'), [
    [0, '#7d7363'],
    [0.6, BACK],
    [1, '#62594b'],
  ], { x1: 0, y1: 0, x2: 0, y2: 1 }),
  linear(u('finLow'), [
    [0, '#9a917f'],
    [1, '#c3baa8'],
  ], { x1: 0, y1: 0, x2: 0, y2: 1 }),
  linear(u('caudal'), [
    [0, '#5f5649'],
    [0.5, '#7d7362'],
    [1, '#9a8f7d'],
  ], { user: true, x1: 0, y1: 50, x2: 0, y2: 225 }),
  linear(u('pect'), [
    [0, '#7d7363'],
    [0.55, '#a1978a'],
    [1, '#c6bdac'],
  ], { user: true, x1: 622, y1: 180, x2: 548, y2: 230 }),
  radial(u('pectGloss'), [
    [0, '#ffffff', 0.22],
    [1, '#ffffff', 0],
  ], { cx: 0.62, cy: 0.25, r: 0.5 }),
  `<clipPath id="${u('caudalClip')}"><path d="${CAUDAL}"/></clipPath>`,
  `<clipPath id="${u('d1Clip')}"><path d="${DORSAL1}"/></clipPath>`,
  `<clipPath id="${u('d2Clip')}"><path d="${DORSAL2}"/></clipPath>`,
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
    [[190, 145], [186, 147], [182, 150], [180, 153], [182, 158], [186, 162], [190, 165]],
    [[40, 60], [62, 82], [86, 112], [110, 146], [96, 176], [86, 200], [82, 218]],
  )}" fill="none" stroke="#2e2820" stroke-opacity="0.1" stroke-width="0.8"/>` +
  // dải trắng dưới chóp đen thùy dưới
  `<path d="M100 172Q114 184 134 196L120 206Q104 192 90 184Z" fill="${WHITE}" fill-opacity="0.85" filter="${u.url('soft2')}"/>` +
  // chóp đen thùy dưới (lớn, rõ)
  `<path d="M89 182Q104 191 121 205L130 240L40 240L40 182Z" fill="${u.url('ink')}"/>` +
  // mép sau viền đen + chóp thùy trên
  `<path d="${CAUDAL_EDGE}" fill="none" stroke="${INK}" stroke-width="7" stroke-opacity="0.85" stroke-linejoin="round"/>` +
  `<ellipse cx="34" cy="56" rx="16" ry="9" transform="rotate(35 34 56)" fill="${u.url('ink')}"/>` +
  // sống thùy trên sáng nhẹ
  `<path d="M190 141C150 126 106 100 60 70" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>` +
  `</g>` +
  `<path d="${CAUDAL}" fill="none" stroke="${EDGE}" stroke-width="1.2" stroke-opacity="0.5" stroke-linejoin="round"/>`;

const dorsal1Svg = sharkFin(
  DORSAL1,
  DORSAL1_EDGE,
  'd1Clip',
  u.url('finTop'),
  // chóp đen ~1/3 trên, ranh giới sắc (thấp hơn ở mép trước)
  'M400 0L530 0L530 56Q478 46 424 43L400 43Z',
  'M400 40L424 41Q478 44 530 54L530 70Q478 60 424 59L400 59Z',
  striae(
    [[500, 95], [480, 95], [460, 96], [440, 97], [424, 99]],
    [[460, 40], [446, 33], [438, 31], [432, 45], [418, 83]],
  ),
) +
  // ánh sáng nhẹ ở mép trước
  `<path d="M504 86C492 69 470 46 448 33" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.6" stroke-linecap="round"/>`;

const dorsal2Svg = sharkFin(
  DORSAL2,
  DORSAL2_EDGE,
  'd2Clip',
  u.url('finTop'),
  'M200 88L250 88L250 116Q230 111 206 114L200 114Z',
  'M200 112L206 112Q230 109 250 114L250 122Q230 118 206 120L200 120Z',
  striae([[238, 134], [226, 136], [214, 137]], [[220, 110], [212, 108], [208, 126]]),
);

const analSvg = sharkFin(
  ANAL,
  ANAL_EDGE,
  'analClip',
  u.url('finLow'),
  'M230 196Q246 194 262 190L270 230L230 230Z',
  'M230 188Q246 186 262 182L264 192Q246 196 230 198Z',
  striae([[270, 178], [258, 176], [246, 174]], [[252, 204], [246, 206], [240, 194]]),
);

const pelvicSvg = sharkFin(
  PELVIC,
  PELVIC_EDGE,
  'pelvClip',
  u.url('finLow'),
  'M336 208Q354 204 376 198L384 240L336 240Z',
  'M336 200Q354 196 374 190L378 200Q356 206 336 210Z',
  striae([[378, 192], [364, 190], [350, 188]], [[356, 216], [350, 218], [344, 208]]),
);

const bodySvg =
  `<g filter="${u.url('skin')}">` +
  body.base +
  `<g clip-path="${u.url('bodyClip')}">` +
  // dải xám đậm ngay trên ranh giới bụng
  `<path d="${BELLY_LINE}" fill="none" stroke="#4f473b" stroke-opacity="0.5" stroke-width="10" filter="${u.url('soft4')}"/>` +
  // bụng trắng (ranh giới sắc nhưng mềm nhẹ)
  `<path d="${BELLY}" fill="${u.url('belly')}" filter="${u.url('soft1')}"/>` +
  // vệt sáng dọc hông
  `<path d="${FLANK_BAND}" fill="#e9e4d8" fill-opacity="0.75" filter="${u.url('soft2')}"/>` +
  `<path d="${FLANK_BAND2}" fill="#4f473b" fill-opacity="0.35" filter="${u.url('soft2')}"/>` +
  // má sáng dưới mắt, lan tới mõm
  `<path d="M746 151C730 149 712 151 694 157L700 166L746 164Z" fill="${WHITE}" fill-opacity="0.35" filter="${u.url('soft2')}"/>` +
  // lấm tấm chấm nâu trên lưng
  scatterSpots(23, { x: 130, y: 88, w: 610, h: 72 }, { count: 240, rMin: 0.45, rMax: 1.0, color: '#3e362c', opacity: 0.16, minGap: 5 }) +
  ampullae() +
  `</g>` +
  `</g>` +
  // đường bên rất mờ
  `<path d="M640 132C560 124 470 124 380 128C300 134 230 142 160 152" fill="none" stroke="#e6dfd1" stroke-opacity="0.13" stroke-width="1.2"/>` +
  body.overlay;

const faceSvg =
  gills() +
  // miệng lưỡi liềm phía dưới mõm + rãnh môi
  `<path d="M731 167Q714 175 693 178" fill="none" stroke="#4a4035" stroke-opacity="0.65" stroke-width="1.5" stroke-linecap="round"/>` +
  `<path d="M695 178Q688 177 684 173" fill="none" stroke="#4a4035" stroke-opacity="0.4" stroke-width="1" stroke-linecap="round"/>` +
  `<path d="M729 170Q714 178 695 181" fill="none" stroke="#ffffff" stroke-opacity="0.4" stroke-width="1"/>` +
  // lỗ mũi
  `<ellipse cx="735" cy="157" rx="3" ry="1.1" transform="rotate(-18 735 157)" fill="#2e2720" fill-opacity="0.6"/>` +
  // gờ trên mắt, bóng nhẹ
  `<path d="M702 132Q711 128 720 132" fill="none" stroke="#4a4236" stroke-opacity="0.35" stroke-width="1.6" stroke-linecap="round"/>`;

const pectFarSvg =
  `<path d="${PECT_FAR}" fill="#6e6556"/>` +
  `<g clip-path="${u.url('pectFarClip')}"><ellipse cx="562" cy="250" rx="12" ry="9" transform="rotate(-50 562 250)" fill="${INK}" fill-opacity="0.85"/></g>` +
  `<path d="${PECT_FAR}" fill="none" stroke="${EDGE}" stroke-width="1" stroke-opacity="0.45"/>`;

const pectNearSvg =
  `<path d="${PECT_NEAR}" fill="${u.url('pect')}"/>` +
  `<g clip-path="${u.url('pectClip')}">` +
  `<path d="${striae(
    [[616, 184], [606, 188], [594, 190], [580, 194], [566, 198]],
    [[566, 256], [560, 258], [556, 252], [552, 236], [550, 214]],
  )}" fill="none" stroke="#2e2820" stroke-opacity="0.1" stroke-width="0.8"/>` +
  `<path d="${PECT_NEAR}" fill="${u.url('pectGloss')}"/>` +
  // mép sau sáng
  `<path d="M550 246C554 230 556 214 548 202" fill="none" stroke="#efe9dc" stroke-opacity="0.55" stroke-width="3"/>` +
  // chóp đen
  `<path d="M548 236Q566 240 584 238L590 280L530 280Z" fill="${u.url('ink')}" fill-opacity="0.9" filter="${u.url('soft1')}"/>` +
  `</g>` +
  `<path d="${PECT_NEAR_LEAD}" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1.4"/>` +
  `<path d="${PECT_NEAR}" fill="none" stroke="${EDGE}" stroke-width="1.2" stroke-opacity="0.55" stroke-linejoin="round"/>`;

const art: CreatureArt = {
  id: 'ca_map_vay_den',
  viewBox: [768, 288],
  lengthUnits: 722,
  spineY: 150,
  animation: 'fish',
  cycleHz: 0.9,
  bendAmp: 18,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'pectoralFar',
      role: 'fin',
      z: 'back',
      pivot: [602, 184],
      anim: { type: 'rotate', amp: 0.025, speed: 0.5, phase: 1.4 },
      svg: pectFarSvg,
    },
    { name: 'caudal', role: 'tail', svg: caudalSvg },
    { name: 'dorsal2', role: 'detail', svg: dorsal2Svg },
    { name: 'anal', role: 'detail', svg: analSvg },
    { name: 'pelvic', role: 'detail', svg: pelvicSvg },
    { name: 'dorsal1', role: 'detail', svg: dorsal1Svg },
    { name: 'body', role: 'body', svg: bodySvg },
    { name: 'face', role: 'detail', svg: faceSvg },
    { name: 'eye', role: 'eye', svg: EYE_SVG },
    {
      name: 'pectoralNear',
      role: 'fin',
      z: 'front',
      pivot: [612, 184],
      anim: { type: 'rotate', amp: 0.03, speed: 0.5 },
      svg: pectNearSvg,
    },
  ],
};

export default art;
