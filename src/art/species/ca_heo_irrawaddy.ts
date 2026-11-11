/**
 * Cá heo Irrawaddy – Orcaella brevirostris (Biển miền Nam – Kiên Giang)
 * Đặc điểm nhận dạng: ĐẦU TRÒN NHƯ QUẢ DƯA, trán vồng cao, KHÔNG có mõm (khác hẳn cá heo thường / cá heo trắng);
 * miệng ngắn nằm thấp, khóe cong lên như đang mỉm cười; mắt rất nhỏ ngay sau khóe miệng; nếp gấp cổ mờ sau đầu;
 * da xám xanh đá đều màu (không lốm đốm), bụng nhạt dần; vây lưng NHỎ, thấp, đầu tròn tù, nằm sau giữa thân
 * (không có bướu lưng); vây ngực to rộng hình MÁI CHÈO; thùy đuôi nằm ngang, mép sau lõm, khía giữa rõ.
 * Chuyển động: thú biển – thân uốn rất nhẹ, thùy đuôi là lớp rời quạt lên xuống quanh cuống đuôi.
 * Tham khảo: references/ca_heo_irrawaddy (ref1–ref4, Wikimedia Commons).
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
  clip,
  rng,
} from '../style-bible';

const u = makeIds('ca_heo_irrawaddy');

const BACK = '#3c4c5f';
const FLANK = '#627589';
const BELLY = '#bcc7d0';
const EDGE = '#34414e';
const DARK = '#3a4a5b';

// ---------- Thân (đầu phải, đuôi trái) ----------
/** Đường lưng: mặt trước đầu dưa → đỉnh dưa → lưng vồng (không bướu) → cuống đuôi. */
const TOP: [number, number][] = [
  [751, 137], [750.4, 127], [747.6, 117], [742.4, 108], [734.6, 100], [724, 93.8], [711, 89.4], [696, 86.8],
  [680, 85.4], [662, 84.2], [640, 82.6], [612, 80], [576, 77.2], [538, 75.8], [500, 76], [462, 77.6],
  [426, 80.4], [394, 84], [364, 88.4], [334, 93.6], [304, 99.6], [272, 106], [240, 113], [208, 120],
  [178, 126.5], [150, 132], [126, 136.6], [108, 140], [96, 142.4],
];
/** Đường bụng: cuống đuôi → bụng → họng sâu → hàm dưới ngắn lẹm vào → môi trên (dưới khối dưa). */
const BOT: [number, number][] = [
  [96, 148], [108, 151], [126, 155.6], [150, 161.5], [178, 168.2], [208, 176], [240, 184], [272, 191.4],
  [306, 198], [344, 203.8], [386, 208.4], [430, 211.2], [474, 212], [518, 210.6], [560, 206.2], [598, 199.8],
  [632, 192.8], [662, 185.8], [688, 179.2], [708, 173.8], [722, 169.6], [732, 166.2], [739, 162.8],
  [743.4, 159.6], [746, 156.8], [748.8, 151.8], [750.6, 145],
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
/** Vây lưng nhỏ, thấp, đỉnh tròn tù, mép sau hơi lõm – nằm ở ~55% chiều dài tính từ đầu. */
const DORSAL = 'M400 84C388 79.6 375 74.6 365 71.6C358 69.6 351.6 70 349.4 74.6C347.6 81 342.6 88 333 93.8L372 92.6Z';
const DORSAL_EDGE = 'M400 84C388 79.6 375 74.6 365 71.6C358 69.6 351.6 70 349.4 74.6C347.6 81 342.6 88 333 93.8';

/** Thùy đuôi nằm ngang nhìn chếch từ trên: thùy xa (trên) + khía giữa + thùy gần (dưới); mép sau lõm. */
const FLUKES =
  'M128 137.5C110 131 86 119 64 111.5C54 108 46 107.5 45.5 112.5C52 118 58 129 60.5 145.5' +
  'C59 160 52 172 42 180.5C39 185.5 45 188 54 185C80 176 108 162 128 153Z';
const FLUKE_FAR = 'M128 137.5C110 131 86 119 64 111.5C54 108 46 107.5 45.5 112.5C52 118 58 129 60.5 145.5L128 145.5Z';
const FLUKE_TRAIL = 'M45.5 112.5C52 118 58 129 60.5 145.5C59 160 52 172 42 180.5';

/** Vây ngực gần: to, rộng, hình mái chèo, mép trước cong lồi, chóp tròn – chĩa xuống–ra sau. */
const PECT_NEAR =
  'M612 183C611 206 603 234 588 258C579 273 566 283 555 281C545 279 542 268 544 256' +
  'C546 241 550 224 553 208C555 199 558 193 561 189C580 190 598 188 612 183Z';
const PECT_NEAR_EDGE =
  'M610.6 196C608 216 600 238 588 258C579 273 566 283 555 281C545 279 542 268 544 256C546 241 550 224 553 208';
/** Vây ngực xa: ló ra phía trước vây gần. */
const PECT_FAR =
  'M636 184C633 204 624 226 610 244C603 253 594 256 590.5 249C587.5 240 590 224 590 206C603 200 621 193 636 184Z';

// ---------- Mặt ----------
/** Miệng ngắn, thấp; khóe cong lên phía mắt → "nụ cười". */
const MOUTH = 'M746.4 156.9C737 160.6 725 162.6 712 162C703.5 161.6 698 159 694 154.6';

/** Vài vết xước mảnh nhạt (như ref1/ref2) – tất định theo seed. */
function scars(seed: number, count: number, x0: number, x1: number): string {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < count; i++) {
    const x = x0 + r() * (x1 - x0);
    const ty = topY(x);
    const by = botY(x);
    const y = ty + (0.22 + r() * 0.5) * Math.max(0, by - ty);
    const len = 8 + r() * 16;
    const ang = -0.35 + r() * 0.25; // hơi chéo lên phía trước
    const dx = Math.cos(ang) * len;
    const dy = Math.sin(ang) * len;
    const bow = (r() - 0.5) * 3;
    const op = 0.1 + r() * 0.14;
    s +=
      `<path d="M${x.toFixed(1)} ${y.toFixed(1)}Q${(x + dx / 2).toFixed(1)} ${(y + dy / 2 + bow).toFixed(1)} ${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}"` +
      ` stroke-opacity="${op.toFixed(2)}"/>`;
  }
  return `<g fill="none" stroke="#eef3f6" stroke-width="0.8" stroke-linecap="round">${s}</g>`;
}

const body = standardBody(u, BODY, {
  dorsal: BACK,
  flank: FLANK,
  belly: BELLY,
  outlineColor: EDGE,
  scales: false,
  flankAt: 0.5,
  rimOpacity: 0.75,
});

const EYE_C: [number, number] = [680.6, 145];
const theEye = eye(u, 'eye', {
  cx: EYE_C[0],
  cy: EYE_C[1],
  r: 3.5,
  iris: ['#5a4636', '#1c1612'],
  pupil: 'round',
  socket: '#3c4a58',
  look: [0.35, -0.1],
});

const defs = joinDefs(
  body,
  theEye,
  organicTexture(u('skin'), { freq: 0.045, octaves: 3, strength: 0.07, seed: 29 }),
  blurFilter(u('soft1'), 1.1),
  blurFilter(u('soft2'), 2.4),
  blurFilter(u('soft5'), 5),
  blurFilter(u('soft9'), 9),
  radial(u('melon'), [
    [0, '#ffffff', 0.42],
    [0.5, '#ffffff', 0.12],
    [1, '#ffffff', 0],
  ]),
  linear(u('dorsalFill'), [
    [0, '#5d7083'],
    [0.5, '#4c5e70'],
    [1, '#3f4f60'],
  ]),
  linear(u('fluke'), [
    [0, '#3f4f60'],
    [0.6, '#4d5f71'],
    [1, '#5a6c7e'],
  ], { user: true, x1: 40, y1: 0, x2: 128, y2: 0 }),
  linear(u('pect'), [
    [0, '#5d6f81', 0],
    [0.13, '#5d6f81', 0.97],
    [0.55, '#55687a'],
    [1, '#46576a'],
  ], { user: true, x1: 594, y1: 184, x2: 554, y2: 280 }),
  linear(u('pectFar'), [
    [0, '#45566a'],
    [1, '#3b4b5d'],
  ]),
  radial(u('pectGloss'), [
    [0, '#ffffff', 0.28],
    [1, '#ffffff', 0],
  ], { cx: 0.62, cy: 0.32, r: 0.5 }),
  clip(u('dorsalClip'), DORSAL),
  clip(u('flukeClip'), FLUKES),
  clip(u('pectClip'), PECT_NEAR),
);

// ---------- Lớp ----------
const flukesSvg =
  `<path d="${FLUKES}" fill="${u.url('fluke')}"/>` +
  `<g clip-path="${u.url('flukeClip')}">` +
  // thùy xa tối hơn → gợi mặt phẳng nằm ngang
  `<path d="${FLUKE_FAR}" fill="#1f2a36" fill-opacity="0.28"/>` +
  // mép sau mỏng hơi sáng
  `<path d="${FLUKE_TRAIL}" fill="none" stroke="#9aaaba" stroke-opacity="0.45" stroke-width="5" filter="${u.url('soft2')}"/>` +
  // gờ giữa (cuống đuôi chạy tới khía)
  `<path d="M128 145.6C106 145.6 84 145.4 63 145.4" fill="none" stroke="#1f2a36" stroke-opacity="0.32" stroke-width="2.6" filter="${u.url('soft1')}"/>` +
  `<path d="M128 143C106 142.8 84 142.8 64 143" fill="none" stroke="#ffffff" stroke-opacity="0.24" stroke-width="1.2"/>` +
  // ánh sáng mép trước thùy gần & thùy xa
  `<path d="M122 156C100 166 74 178 48 184.5" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1.6" stroke-linecap="round"/>` +
  `<path d="M120 135C100 127 80 118 56 110" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.3" stroke-linecap="round"/>` +
  `</g>` +
  `<path d="${FLUKES}" fill="none" stroke="${EDGE}" stroke-width="1.3" stroke-opacity="0.6" stroke-linejoin="round"/>`;

const dorsalSvg =
  `<path d="${DORSAL}" fill="${u.url('dorsalFill')}"/>` +
  `<g clip-path="${u.url('dorsalClip')}">` +
  // mép sau tối, mép trước sáng → khối tròn
  `<path d="M349.4 74.6C347.6 81 342.6 88 333 93.8" fill="none" stroke="#1f2a36" stroke-opacity="0.3" stroke-width="5" filter="${u.url('soft2')}"/>` +
  `</g>` +
  `<path d="M396 82.4C385 78.4 374 74.2 364.5 71.4" fill="none" stroke="#ffffff" stroke-opacity="0.42" stroke-width="1.4" stroke-linecap="round"/>` +
  `<path d="${DORSAL_EDGE}" fill="none" stroke="${EDGE}" stroke-width="1.3" stroke-opacity="0.6" stroke-linejoin="round" stroke-linecap="round"/>`;

const bodySvg =
  `<g filter="${u.url('skin')}">` +
  body.base +
  `<g clip-path="${u.url('bodyClip')}">` +
  // mảng xám đá đậm dọc lưng & đỉnh đầu (loang rất nhẹ)
  `<g fill="${DARK}" filter="${u.url('soft9')}">` +
  `<ellipse cx="700" cy="96" rx="44" ry="12" fill-opacity="0.34" transform="rotate(10 700 96)"/>` +
  `<ellipse cx="560" cy="86" rx="80" ry="13" fill-opacity="0.3"/>` +
  `<ellipse cx="400" cy="92" rx="70" ry="12" fill-opacity="0.26" transform="rotate(6 400 92)"/>` +
  `<ellipse cx="240" cy="120" rx="80" ry="12" fill-opacity="0.3" transform="rotate(-14 240 120)"/>` +
  `</g>` +
  // bụng nhạt, chuyển mềm
  `<path d="M700 178C640 196 560 206 460 210C360 208 260 194 150 166L130 230L720 230Z" fill="#cfd8df" fill-opacity="0.3" filter="${u.url('soft5')}"/>` +
  // họng & hàm dưới nhạt
  `<path d="M746.4 156.9C737 160.6 725 162.6 712 162C703.5 161.6 698 159 694 154.6C686 164 672 174 652 183L760 186Z" fill="#b8c3cd" fill-opacity="0.5" filter="${u.url('soft2')}"/>` +
  // khối dưa tròn: điểm sáng lớn trên trán + bóng dưới trán sát môi trên
  `<ellipse cx="722" cy="118" rx="30" ry="24" fill="${u.url('melon')}"/>` +
  `<path d="M749 148C741 153 729 156 715 156.5" fill="none" stroke="#24303c" stroke-opacity="0.22" stroke-width="4" stroke-linecap="round" filter="${u.url('soft2')}"/>` +
  // nếp gấp cổ: rãnh mờ + mép sáng phía sau
  `<path d="M664 104C658 118 656 134 658 150C659.5 160 662 168 666 175" fill="none" stroke="#1f2a36" stroke-opacity="0.13" stroke-width="6" stroke-linecap="round" filter="${u.url('soft2')}"/>` +
  `<path d="M659 108C653.5 122 652 136 654 150" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="3" stroke-linecap="round" filter="${u.url('soft1')}"/>` +
  // bóng dưới gốc vây ngực
  `<ellipse cx="592" cy="194" rx="30" ry="8" fill="#26323f" fill-opacity="0.3" filter="${u.url('soft2')}" transform="rotate(-10 592 194)"/>` +
  // vết xước mảnh
  scars(41, 18, 300, 640) +
  scars(42, 6, 170, 300) +
  // vệt bóng da ướt dọc lưng & trán
  `<path d="M640 88C590 82 530 80 470 81" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="5" stroke-linecap="round" filter="${u.url('soft2')}"/>` +
  `<path d="M330 98C290 106 250 115 200 128" fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="4" stroke-linecap="round" filter="${u.url('soft2')}"/>` +
  `<path d="M745 126C739 113 728 102 711 95" fill="none" stroke="#ffffff" stroke-opacity="0.32" stroke-width="3.5" stroke-linecap="round" filter="${u.url('soft2')}"/>` +
  `<path d="M560 140C500 142 420 140 350 136" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="8" stroke-linecap="round" filter="${u.url('soft5')}"/>` +
  `</g>` +
  `</g>` +
  // gờ cuống đuôi (keel) mờ
  `<path d="M230 146C196 146 156 145.8 112 145.4" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="2" filter="${u.url('soft1')}"/>` +
  body.overlay;

const faceSvg =
  // môi sáng dưới đường miệng
  `<path d="${MOUTH}" fill="none" stroke="#dfe6eb" stroke-opacity="0.6" stroke-width="1.2" transform="translate(0 1.6)"/>` +
  // đường miệng
  `<path d="${MOUTH}" fill="none" stroke="#25303b" stroke-opacity="0.85" stroke-width="1.5" stroke-linecap="round"/>` +
  // lúm khóe miệng (nụ cười)
  `<path d="M696 157.6C693.6 157 692.2 155.6 692 153.8" fill="none" stroke="#25303b" stroke-opacity="0.32" stroke-width="1" stroke-linecap="round"/>` +
  // lỗ thở hình lưỡi liềm sau đỉnh dưa
  `<ellipse cx="650" cy="86" rx="4.8" ry="1.3" transform="rotate(5 650 86)" fill="#1f2a35" fill-opacity="0.8"/>` +
  `<path d="M645 87.4Q650 90.2 655 89.4" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1"/>` +
  // quầng sẫm & mí mắt
  `<ellipse cx="${EYE_C[0]}" cy="${EYE_C[1]}" rx="7.6" ry="5.8" fill="#26323e" fill-opacity="0.3" filter="${u.url('soft1')}"/>` +
  `<path d="M674.2 143.4Q680.4 138.2 687.2 142.8" fill="none" stroke="#26323e" stroke-opacity="0.6" stroke-width="1.1" stroke-linecap="round"/>` +
  `<path d="M675 147.8Q680.8 151.4 686.4 147.8" fill="none" stroke="#26323e" stroke-opacity="0.35" stroke-width="0.9" stroke-linecap="round"/>` +
  // lỗ tai nhỏ sau mắt
  `<circle cx="666.5" cy="148.6" r="0.85" fill="#1f2a35" fill-opacity="0.7"/>`;

const pectFarSvg =
  `<path d="${PECT_FAR}" fill="${u.url('pectFar')}"/>` +
  `<path d="${PECT_FAR}" fill="none" stroke="${EDGE}" stroke-width="1.1" stroke-opacity="0.55" stroke-linejoin="round"/>`;

const pectNearSvg =
  `<path d="${PECT_NEAR}" fill="${u.url('pect')}"/>` +
  `<g clip-path="${u.url('pectClip')}">` +
  `<path d="${PECT_NEAR}" fill="${u.url('pectGloss')}"/>` +
  // mép sau tối hơn (mặt khuất)
  `<path d="M555 281C545 279 542 268 544 256C546 241 550 224 553 208" fill="none" stroke="#25313e" stroke-opacity="0.35" stroke-width="8" filter="${u.url('soft2')}"/>` +
  // gờ xương giữa vây (gợi các ngón trong mái chèo)
  `<path d="M586 196C582 220 574 244 562 268" fill="none" stroke="#ffffff" stroke-opacity="0.1" stroke-width="5" stroke-linecap="round" filter="${u.url('soft2')}"/>` +
  `</g>` +
  `<path d="M607 198C603 220 596 240 584 259" fill="none" stroke="#ffffff" stroke-opacity="0.24" stroke-width="1.2" stroke-linecap="round"/>` +
  `<path d="${PECT_NEAR_EDGE}" fill="none" stroke="${EDGE}" stroke-width="1.3" stroke-opacity="0.6" stroke-linejoin="round" stroke-linecap="round"/>`;

const art: CreatureArt = {
  id: 'ca_heo_irrawaddy',
  viewBox: [768, 300],
  lengthUnits: 708,
  spineY: 144,
  animation: 'mammal',
  cycleHz: 0.55,
  bendAmp: 5,
  // 270 cm theo công thức ~308px – quá lớn; thân Irrawaddy ngắn mập hơn cá heo trắng (260px) nên 220px
  // vẫn cho khối lượng tương đương trên màn hình, to ~1.5 lần thợ lặn và vừa khung hình khi lẩn tránh.
  displayLengthPx: 220,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'pectoralFar',
      role: 'flipper',
      z: 'back',
      pivot: [618, 190],
      anim: { type: 'rotate', amp: 0.06, speed: 0.5, phase: 1.3 },
      svg: pectFarSvg,
    },
    {
      // thùy đuôi nằm ngang: quạt lên–xuống quanh cuống đuôi, trễ 1/4 nhịp so với thân
      name: 'flukes',
      role: 'tail',
      bend: false,
      z: 'back',
      pivot: [114, 145],
      anim: { type: 'rotate', amp: 0.16, phase: -Math.PI / 2 },
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
      pivot: [588, 190],
      anim: { type: 'rotate', amp: 0.07, speed: 0.5 },
      svg: pectNearSvg,
    },
  ],
};

export default art;
