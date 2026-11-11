/**
 * Cá heo trắng Trung Hoa – Sousa chinensis (Vịnh Bắc Bộ)
 * Đặc điểm nhận dạng: thân chắc, mõm dài thon tách khỏi trán dô thấp bằng một nếp gấp; khóe miệng dài cong lên
 * tới sát mắt; mắt nhỏ hiền; lỗ thở trên đỉnh đầu; vây lưng tam giác thấp nằm trên GỜ LƯNG (bướu gù) rộng;
 * da trắng hồng (hồng rõ ở hàm dưới, quanh mắt, bụng, chóp vây), lưng loang xám nhạt và lốm đốm xám;
 * đuôi NẰM NGANG (nhìn chếch từ trên: hai thùy xòe hai bên cuống đuôi, có khía giữa).
 * Chuyển động: thú biển – thân uốn rất nhẹ, thùy đuôi là lớp rời quạt lên xuống quanh cuống đuôi.
 * Tham khảo: references/ca_heo_trang (ref1–ref5, Wikimedia Commons).
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
  clip,
  rng,
} from '../style-bible';

const u = makeIds('ca_heo_trang');

const BACK = '#b0a0a4';
const FLANK = '#ead7d6';
const BELLY = '#f6cfcb';
const PINK = '#eeaeae';
const SPECK = '#5e5557';
const EDGE = '#7d6368';

// ---------- Thân (đầu phải, đuôi trái) ----------
/** Đường lưng: chóp mõm → nếp gấp trán → trán dô → gờ lưng → cuống đuôi. */
const TOP: [number, number][] = [
  [746, 142.5], [742, 139.5], [730, 136.5], [710, 133.2], [688, 130], [670, 127.2], [661, 125],
  [656, 117], [648, 106], [636, 96.5], [620, 88.5], [600, 82], [578, 77.5], [550, 73.5], [518, 70],
  [486, 68], [460, 66], [438, 61], [412, 56], [382, 54], [354, 56], [334, 61.5], [316, 70.5], [296, 76],
  [262, 84], [225, 94], [192, 105], [165, 116], [140, 126], [118, 133.5], [100, 138.6], [90, 141.8],
];
/** Đường bụng: cuống đuôi → bụng → họng → hàm dưới. */
const BOT: [number, number][] = [
  [100, 145.2], [118, 151], [140, 160], [165, 169], [192, 177], [225, 185], [262, 191.5],
  [300, 196], [345, 199.5], [390, 201], [440, 201], [488, 199.5], [532, 196.5], [572, 191.5],
  [606, 184.5], [632, 176], [654, 167], [674, 160], [698, 155.5], [722, 152], [740, 148.5],
];
const BODY = smoothPath([...TOP, ...BOT], true);

const TOP_ASC = [...TOP].sort((a, b) => a[0] - b[0]);
function interp(pts: [number, number][], x: number): number {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) {
      const a = pts[i - 1];
      const b = pts[i];
      const t = (x - a[0]) / Math.max(0.001, b[0] - a[0]);
      return a[1] + (b[1] - a[1]) * t;
    }
  }
  return pts[pts.length - 1][1];
}
const topY = (x: number) => interp(TOP_ASC, x);
const botY = (x: number) => interp(BOT, x);

// ---------- Vây ----------
/** Vây lưng thấp, đáy rộng, đỉnh tròn hơi cong về sau – nằm trên gờ lưng. */
const DORSAL = 'M432 62C414 54 392 41 374 31C367 27.5 361 29 360.5 35C360 44 354 54 334 63L380 72Z';
const DORSAL_EDGE = 'M432 62C414 54 392 41 374 31C367 27.5 361 29 360.5 35C360 44 354 54 334 63';

/** Thùy đuôi nằm ngang nhìn chếch từ trên: thùy xa (trên hình) + khía giữa + thùy gần (dưới hình). */
const FLUKES =
  'M136 133C112 124 80 116 50 117C44 117 41 120 45 123.5C54 128 61 134 64 141.5' +
  'C61 150 50 160 36 167C29 170.5 29 176 36.5 176.5C72 177 112 164 136 152Z';
const FLUKE_FAR = 'M136 133C112 124 80 116 50 117C44 117 41 120 45 123.5C54 128 61 134 64 141.5L136 142.5Z';
const FLUKE_TRAIL = 'M45 123.5C54 128 61 134 64 141.5C61 150 50 160 36 167';

/** Vây ngực rộng, đầu tròn, chĩa xuống–ra sau. */
const PECT_NEAR =
  'M606 170C603 192 590 222 566 246C557 255 546 258 541 252C536 245 539 233 543 222' +
  'C548 208 549 196 545 182C566 182 588 178 606 170Z';
const PECT_NEAR_EDGE =
  'M604.5 181C600 199 588 224 566 246C557 255 546 258 541 252C536 245 539 233 543 222C547.5 210 549 200 547 191';
const PECT_FAR = 'M626 172C621 190 610 212 594 230C588 237 580 238 578 232C576 222 580 208 579 194C596 190 612 182 626 172Z';

// ---------- Hoa văn ----------
/** Đường miệng: thẳng dọc mõm, khóe dài cong lên tới sát dưới–trước mắt. */
const MOUTH = 'M745.5 143.4C722 143.8 696 144.8 672 145.2C656 145.2 645 142.6 636 136.4';

/**
 * Lốm đốm xám: dày ở sát đường lưng, thưa dần xuống hông (k lớn → dồn về lưng).
 * depth = phần chiều cao thân (0..1) mà đốm được phép lan xuống.
 */
function speckles(seed: number, count: number, x0: number, x1: number, depth: number, k: number, rMax: number): string {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < count; i++) {
    const x = x0 + r() * (x1 - x0);
    const t = Math.pow(Math.max(0, r()), k);
    const ty = topY(x);
    const y = ty + 1.5 + t * Math.max(0, botY(x) - ty) * depth;
    const rad = (0.45 + r() * (rMax - 0.45)) * (1 - 0.45 * t);
    const rx = rad * (1 + r() * 0.9);
    const rot = Math.round(r() * 180);
    const op = 0.35 + r() * 0.45;
    s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(2)}" ry="${rad.toFixed(2)}" transform="rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})" opacity="${op.toFixed(2)}"/>`;
  }
  return `<g fill="${SPECK}">${s}</g>`;
}

const body = standardBody(u, BODY, {
  dorsal: BACK,
  flank: FLANK,
  belly: BELLY,
  outlineColor: EDGE,
  scales: false,
  flankAt: 0.4,
  rimOpacity: 0.8,
});

const theEye = eye(u, 'eye', {
  cx: 624,
  cy: 131,
  r: 4.3,
  iris: ['#6a4a3a', '#2a1c18'],
  pupil: 'round',
  socket: '#7a5c62',
  look: [0.3, 0],
});

const defs = joinDefs(
  body,
  theEye,
  organicTexture(u('skin'), { freq: 0.05, octaves: 3, strength: 0.1, seed: 17 }),
  blurFilter(u('soft1'), 1.1),
  blurFilter(u('soft2'), 2.4),
  blurFilter(u('soft5'), 5),
  linear(u('dorsalFill'), [
    [0, '#efc0be'],
    [0.45, '#d9b4b5'],
    [1, '#a99a9e'],
  ]),
  linear(u('fluke'), [
    [0, '#eebdbc'],
    [0.5, '#d2b2b4'],
    [1, '#ab9ba0'],
  ], { user: true, x1: 30, y1: 0, x2: 136, y2: 0 }),
  linear(u('pect'), [
    [0, '#d9c0c1', 0],
    [0.17, '#d9c0c1', 0.97],
    [0.6, '#eec3c1'],
    [1, '#f1b4b3'],
  ], { user: true, x1: 596, y1: 172, x2: 546, y2: 252 }),
  linear(u('pectFar'), [
    [0, '#b79da1'],
    [1, '#cf9fa1'],
  ]),
  radial(u('pectGloss'), [
    [0, '#ffffff', 0.3],
    [1, '#ffffff', 0],
  ], { cx: 0.6, cy: 0.35, r: 0.45 }),
  clip(u('dorsalClip'), DORSAL),
  clip(u('flukeClip'), FLUKES),
  clip(u('pectClip'), PECT_NEAR),
);

// ---------- Lớp ----------
const flukesSvg =
  `<path d="${FLUKES}" fill="${u.url('fluke')}"/>` +
  `<g clip-path="${u.url('flukeClip')}">` +
  // thùy xa tối hơn → gợi mặt phẳng nằm ngang
  `<path d="${FLUKE_FAR}" fill="#5f4f56" fill-opacity="0.26"/>` +
  // mép sau ửng hồng
  `<path d="${FLUKE_TRAIL}" fill="none" stroke="#f6b9b8" stroke-opacity="0.8" stroke-width="7" filter="${u.url('soft2')}"/>` +
  scatterSpots(31, { x: 34, y: 110, w: 104, h: 70 }, { count: 70, rMin: 0.5, rMax: 1.5, color: SPECK, opacity: 0.4, minGap: 4.5, ellipse: 1.4 }) +
  // gờ giữa (cuống đuôi chạy tới khía)
  `<path d="M136 143.6C110 143.4 86 143 66 142.6" fill="none" stroke="#5a4a50" stroke-opacity="0.3" stroke-width="2.4" filter="${u.url('soft1')}"/>` +
  `<path d="M136 141C110 140.8 86 140.6 66 140.6" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1.2"/>` +
  // ánh sáng mép trước thùy gần
  `<path d="M130 154.5C108 164 72 176 38 175.5" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1.6" stroke-linecap="round"/>` +
  `</g>` +
  `<path d="${FLUKES}" fill="none" stroke="${EDGE}" stroke-width="1.3" stroke-opacity="0.55" stroke-linejoin="round"/>`;

const dorsalSvg =
  `<path d="${DORSAL}" fill="${u.url('dorsalFill')}"/>` +
  `<g clip-path="${u.url('dorsalClip')}">` +
  scatterSpots(7, { x: 338, y: 37, w: 92, h: 32 }, { count: 60, rMin: 0.5, rMax: 1.5, color: SPECK, opacity: 0.5, minGap: 3.6, ellipse: 1.3 }) +
  `<path d="M360.5 35C360 44 354 54 334 63" fill="none" stroke="#5a4a50" stroke-opacity="0.22" stroke-width="5" filter="${u.url('soft2')}"/>` +
  `</g>` +
  `<path d="M428 60C412 53.5 392 41.5 375 32.5" fill="none" stroke="#ffffff" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round"/>` +
  `<path d="${DORSAL_EDGE}" fill="none" stroke="${EDGE}" stroke-width="1.3" stroke-opacity="0.55" stroke-linejoin="round" stroke-linecap="round"/>`;

const bodySvg =
  `<g filter="${u.url('skin')}">` +
  body.base +
  `<g clip-path="${u.url('bodyClip')}">` +
  // mảng xám loang trên lưng
  `<g fill="#84787e" filter="${u.url('soft5')}">` +
  `<ellipse cx="632" cy="108" rx="26" ry="11" fill-opacity="0.3" transform="rotate(32 632 108)"/>` +
  `<ellipse cx="560" cy="93" rx="58" ry="13" fill-opacity="0.26"/>` +
  `<ellipse cx="460" cy="84" rx="52" ry="14" fill-opacity="0.22"/>` +
  `<ellipse cx="380" cy="70" rx="56" ry="12" fill-opacity="0.3"/>` +
  `<ellipse cx="280" cy="96" rx="48" ry="12" fill-opacity="0.26" transform="rotate(-20 280 96)"/>` +
  `<ellipse cx="180" cy="121" rx="60" ry="11" fill-opacity="0.34" transform="rotate(-21 180 121)"/>` +
  `<ellipse cx="700" cy="134" rx="40" ry="5" fill-opacity="0.3" transform="rotate(-9 700 134)"/>` +
  `</g>` +
  // mảng trắng hồng sáng ở hông
  `<g fill="#fdf1f0" filter="${u.url('soft5')}">` +
  `<ellipse cx="520" cy="136" rx="80" ry="20" fill-opacity="0.42"/>` +
  `<ellipse cx="340" cy="138" rx="80" ry="18" fill-opacity="0.34"/>` +
  `</g>` +
  // bụng & họng hồng
  `<path d="M664 158C600 176 500 187 400 188C300 187 220 173 130 150L130 220L664 220Z" fill="#f5bcb9" fill-opacity="0.5" filter="${u.url('soft5')}"/>` +
  // hàm dưới hồng, sạch đốm
  `<path d="M746 143.4C722 143.8 696 144.8 672 145.2C656 145.2 645 142.6 636 136.4C630 150 618 166 600 182L760 184Z" fill="${PINK}" fill-opacity="0.78" filter="${u.url('soft2')}"/>` +
  // hồng quanh mắt & khóe miệng
  `<ellipse cx="700" cy="138" rx="46" ry="7" fill="${PINK}" fill-opacity="0.42" filter="${u.url('soft2')}" transform="rotate(-8 700 138)"/><ellipse cx="628" cy="134" rx="17" ry="12" fill="${PINK}" fill-opacity="0.72" filter="${u.url('soft2')}"/>` +
  // chóp mõm hồng
  `<ellipse cx="736" cy="142" rx="14" ry="6" fill="#f4b6b5" fill-opacity="0.5" filter="${u.url('soft2')}"/>` +
  // bóng dưới gốc vây ngực
  `<ellipse cx="574" cy="188" rx="30" ry="9" fill="#a0787c" fill-opacity="0.3" filter="${u.url('soft2')}" transform="rotate(-12 574 188)"/>` +
  // bóng mờ dưới chân gờ lưng (bướu gù) + sáng trên sống gờ
  `<path d="M462 78C430 70 350 68 308 84" fill="none" stroke="#6f6068" stroke-opacity="0.24" stroke-width="7" stroke-linecap="round" filter="${u.url('soft5')}"/>` +
  `<path d="M440 65C420 59 360 57 332 66" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="3.5" stroke-linecap="round" filter="${u.url('soft2')}"/>` +
  // lốm đốm xám
  speckles(11, 520, 96, 742, 0.72, 2.3, 1.9) +
  speckles(12, 150, 596, 742, 0.42, 1.5, 1.7) +
  speckles(13, 130, 96, 270, 0.9, 1.3, 1.8) +
  // vài vết xước răng nhạt trên hông
  `<path d="M470 118C452 122 438 128 426 136M464 124C448 128 436 133 426 141M292 122C278 128 268 134 260 142" fill="none" stroke="#fff6f5" stroke-opacity="0.3" stroke-width="0.9" stroke-linecap="round"/>` +
  // vệt bóng da ướt dọc lưng & trán
  `<path d="M610 91C566 81 510 76 456 74" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="5" stroke-linecap="round" filter="${u.url('soft2')}"/>` +
  `<path d="M300 84C264 93 226 104 184 118" fill="none" stroke="#ffffff" stroke-opacity="0.24" stroke-width="4" stroke-linecap="round" filter="${u.url('soft2')}"/>` +
  `<path d="M650 117C643 107 632 99 617 94" fill="none" stroke="#ffffff" stroke-opacity="0.34" stroke-width="4" stroke-linecap="round" filter="${u.url('soft2')}"/>` +
  `<path d="M730 139.5C712 136.5 692 133.5 672 130.5" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="2" stroke-linecap="round" filter="${u.url('soft1')}"/>` +
  `</g>` +
  `</g>` +
  // gờ cuống đuôi (keel) mờ
  `<path d="M250 138C210 140 160 141.5 104 142" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="1.4"/>` +
  body.overlay;

const faceSvg =
  // nếp gấp giữa mõm và trán
  `<path d="M661.5 125.5C657 129 655.5 133 657 138" fill="none" stroke="${EDGE}" stroke-opacity="0.5" stroke-width="1.3" stroke-linecap="round"/>` +
  `<path d="M663.5 126C659.5 129.5 658 133.5 659 137.5" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1"/>` +
  // đường miệng + môi sáng phía dưới
  `<path d="${MOUTH}" fill="none" stroke="#fbe3e2" stroke-opacity="0.7" stroke-width="1.2" transform="translate(0 1.6)"/>` +
  `<path d="${MOUTH}" fill="none" stroke="#7a4e55" stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round"/>` +
  // lỗ thở hình lưỡi liềm trên đỉnh đầu
  `<ellipse cx="599" cy="83.4" rx="6" ry="1.7" transform="rotate(13 599 83.4)" fill="#4a3a40" fill-opacity="0.8"/>` +
  `<path d="M592.5 84.8Q599 88.4 605.5 87.4" fill="none" stroke="#ffffff" stroke-opacity="0.4" stroke-width="1"/>` +
  // quầng sẫm nhẹ & mí mắt
  `<ellipse cx="624" cy="131" rx="8.4" ry="6.4" fill="#6b4f56" fill-opacity="0.28" filter="${u.url('soft1')}"/>` +
  `<path d="M616.6 129.4Q623.6 123.6 631 128.8" fill="none" stroke="#6b4f56" stroke-opacity="0.55" stroke-width="1.1" stroke-linecap="round"/>` +
  `<path d="M617.6 134.4Q624 138.2 630.4 134.2" fill="none" stroke="#6b4f56" stroke-opacity="0.35" stroke-width="0.9" stroke-linecap="round"/>` +
  // lỗ tai nhỏ sau mắt
  `<circle cx="605.5" cy="137.5" r="0.9" fill="#5a444a" fill-opacity="0.7"/>` +
  // nếp họng mờ
  `<path d="M650 163C640 164 630 167 622 171" fill="none" stroke="${EDGE}" stroke-opacity="0.22" stroke-width="1"/>`;

const pectFarSvg =
  `<path d="${PECT_FAR}" fill="${u.url('pectFar')}"/>` +
  `<path d="${PECT_FAR}" fill="#5a4a55" fill-opacity="0.2"/>` +
  `<path d="${PECT_FAR}" fill="none" stroke="${EDGE}" stroke-width="1.1" stroke-opacity="0.5" stroke-linejoin="round"/>`;

const pectNearSvg =
  `<path d="${PECT_NEAR}" fill="${u.url('pect')}"/>` +
  `<g clip-path="${u.url('pectClip')}">` +
  `<path d="${PECT_NEAR}" fill="${u.url('pectGloss')}"/>` +
  // mép sau & chóp ửng hồng
  `<path d="M541 252C536 245 539 233 543 222C547.5 210 549 200 547 191" fill="none" stroke="#f3a9aa" stroke-opacity="0.6" stroke-width="7" filter="${u.url('soft2')}"/>` +
  // mép trước xám lốm đốm
  `<path d="M604 184C600 200 588 224 568 245" fill="none" stroke="#8d7f85" stroke-opacity="0.3" stroke-width="7" filter="${u.url('soft2')}"/>` +
  scatterSpots(53, { x: 556, y: 186, w: 48, h: 56 }, { count: 28, rMin: 0.5, rMax: 1.3, color: SPECK, opacity: 0.4, minGap: 5, ellipse: 1.3 }) +
  `</g>` +
  `<path d="M602 190C597 205 586 226 567 244" fill="none" stroke="#ffffff" stroke-opacity="0.38" stroke-width="1.4" stroke-linecap="round"/>` +
  `<path d="${PECT_NEAR_EDGE}" fill="none" stroke="${EDGE}" stroke-width="1.3" stroke-opacity="0.55" stroke-linejoin="round" stroke-linecap="round"/>`;

const art: CreatureArt = {
  id: 'ca_heo_trang',
  viewBox: [768, 288],
  lengthUnits: 720,
  spineY: 141,
  animation: 'mammal',
  cycleHz: 0.6,
  bendAmp: 5,
  // 280 cm theo công thức sẽ ~315px – quá lớn so với khung hình; 260px vẫn to gấp ~1.7 lần thợ lặn.
  displayLengthPx: 260,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'pectoralFar',
      role: 'flipper',
      z: 'back',
      pivot: [606, 180],
      anim: { type: 'rotate', amp: 0.05, speed: 0.5, phase: 1.3 },
      svg: pectFarSvg,
    },
    {
      // thùy đuôi nằm ngang: quạt lên–xuống quanh cuống đuôi, trễ 1/4 nhịp so với thân
      name: 'flukes',
      role: 'tail',
      bend: false,
      z: 'back',
      pivot: [122, 142],
      anim: { type: 'rotate', amp: 0.15, phase: -Math.PI / 2 },
      svg: flukesSvg,
    },
    { name: 'dorsal', role: 'detail', svg: dorsalSvg },
    { name: 'body', role: 'body', svg: bodySvg },
    { name: 'face', role: 'detail', svg: faceSvg },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    {
      name: 'pectoralNear',
      role: 'flipper',
      z: 'front',
      pivot: [586, 180],
      anim: { type: 'rotate', amp: 0.06, speed: 0.5 },
      svg: pectNearSvg,
    },
  ],
};

export default art;
