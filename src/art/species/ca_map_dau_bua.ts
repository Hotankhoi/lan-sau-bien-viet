/**
 * Cá mập đầu búa vây vòm – Sphyrna lewini
 * Đặc điểm nhận dạng: đầu dẹt bè ngang hình búa (cephalofoil), mép trước cong vòm có khía lõm giữa
 * và các khía phụ (dáng "vây vòm"), hai mắt ở hai đầu búa. Vẽ nhìn ngang hơi chếch từ trên (3/4):
 * nửa búa phía gần thò xuống (to, sáng), nửa phía xa thò lên (nhỏ, mờ hơn).
 * Thân thoi xám nâu – xám ô liu, bụng trắng; vây lưng 1 cao nhọn hình liềm; vây ngực dài cụp sau,
 * chóp sẫm; đuôi thùy trên dài có khía dưới chóp; 5 khe mang.
 * Tham khảo: references/ca_map_dau_bua (ref1–ref4, Wikimedia Commons).
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
} from '../style-bible';

const u = makeIds('ca_map_dau_bua');

const BACK = '#545246';
const FLANK = '#787666';
const WHITE = '#f1efe7';
const INK = '#1d1f23';
const EDGE = '#37352c';

// ---------- Thân (đầu phải, đuôi trái) ----------
const BODY = smoothPath(
  [
    [744, 150],
    [737, 139],
    [722, 131],
    [698, 123],
    [662, 114],
    [622, 107],
    [582, 103],
    [542, 101],
    [502, 102],
    [462, 106],
    [420, 112],
    [372, 121],
    [322, 131],
    [274, 140],
    [236, 146.5],
    [206, 150.5],
    [188, 150.2],
    [176, 151.5],
    [171.5, 155],
    [176, 158.6],
    [188, 161.5],
    [208, 165],
    [244, 170],
    [284, 177],
    [332, 186],
    [382, 193],
    [432, 198],
    [482, 200],
    [532, 199.5],
    [582, 196],
    [630, 190],
    [672, 182.5],
    [702, 176],
    [724, 168],
    [738, 160],
  ],
  true,
);

// ---------- Đầu búa (mặt trên, nhìn chếch: nửa gần ở dưới, nửa xa ở trên) ----------
const HAMMER = smoothPath(
  [
    [771, 150], // khía lõm giữa
    [775.5, 156],
    [776, 164],
    [773, 171], // khía phụ
    [772.5, 179],
    [770, 189],
    [765.5, 199],
    [760, 208],
    [754, 216],
    [748.5, 222.5],
    [743, 227],
    [737.5, 228],
    [733, 225],
    [731.5, 219],
    [734, 210],
    [736.5, 201],
    [736, 193],
    [731.5, 186.5],
    [722, 181.5],
    [711, 179],
    [701, 177],
    [695.5, 168],
    [694, 150],
    [696, 132],
    [701, 125],
    [711, 123],
    [721, 120.5],
    [729.5, 116.5],
    [734, 110.5],
    [734.5, 104],
    [733.5, 98.5],
    [736, 94.2],
    [741, 92.6],
    [746, 95],
    [750.5, 99.5],
    [755.5, 106],
    [760, 113],
    [763.5, 120],
    [765, 126.5],
    [767, 132], // khía phụ
    [770, 138],
    [773.5, 144],
  ],
  true,
);
/** Mép trước (vòm, có khía) từ đầu búa gần → đầu búa xa. */
const HAMMER_FRONT = smoothPath([
  [733, 225],
  [737.5, 228],
  [743, 227],
  [748.5, 222.5],
  [754, 216],
  [760, 208],
  [765.5, 199],
  [770, 189],
  [772.5, 179],
  [773, 171],
  [776, 164],
  [775.5, 156],
  [771, 150],
  [773.5, 144],
  [770, 138],
  [767, 132],
  [765, 126.5],
  [763.5, 120],
  [760, 113],
  [755.5, 106],
  [750.5, 99.5],
  [746, 95],
  [741, 92.6],
  [736, 94.2],
]);
/** Mép sau hai cánh búa (viền riêng, không viền phần cổ để liền với thân). */
const HAMMER_REAR_N = 'M733 225C730.5 220 732 214 734 209C736 202 737.5 196 734 190C729 184 718 180.5 704 177.5';
const HAMMER_REAR_F = 'M736 94.2C733 97 734.5 101 734.5 105C734.5 111 731 116 724 119.5C717 122 708 123.5 702 125';
/** Mép sau nửa búa phía gần (bóng đổ xuống thân/nước). */

// ---------- Vây gắn thân (uốn theo thân) ----------
const CAUDAL =
  'M210 151C176 140 118 110 66 88C50 81 36 75 28 74C22 73.5 21 79 26 83C32 87.5 41 90.5 47 92.5L52 100' +
  'C70 118 100 140 130 157C121 176 112 197 105 218C103 226 108 229 114 223C140 200 172 178 212 165Z';
const CAUDAL_EDGE =
  'M28 74C22 73.5 21 79 26 83C32 87.5 41 90.5 47 92.5L52 100C70 118 100 140 130 157C121 176 112 197 105 218C103 226 108 229 114 223';

const DORSAL1 =
  'M556 104C543 82 518 50 494 28C488 22.5 482 21.5 481.5 29C484 54 479 76 470 90C465 97 457 101 444 104.5L470 108Z';
const DORSAL1_EDGE = 'M556 104C543 82 518 50 494 28C488 22.5 482 21.5 481.5 29C484 54 479 76 470 90C465 97 457 101 444 104.5';

const DORSAL2 = 'M246 147C240 140 234 134 228 131C224 129 221 131 221 135C221 141 215 146 196 150.5L222 150Z';
const DORSAL2_EDGE = 'M246 147C240 140 234 134 228 131C224 129 221 131 221 135C221 141 215 146 196 150.5';

const ANAL =
  'M276 176C270 184 261 194 252 201C247.5 204.5 243.5 203.5 244.5 198.5C245.5 192 243 184 228 175L216 167L252 168.5Z';
const ANAL_EDGE = 'M276 176C270 184 261 194 252 201C247.5 204.5 243.5 203.5 244.5 198.5C245.5 192 243 184 228 175L216 167';

const PELVIC = 'M394 194C388 201 378 209 366 214.5C361 216.5 358 214.5 359 209.5C360 203 356 197 340 187.5L368 189Z';
const PELVIC_EDGE = 'M394 194C388 201 378 209 366 214.5C361 216.5 358 214.5 359 209.5C360 203 356 197 340 187.5';

// ---------- Vây ngực (tách lớp) ----------
const PECT_NEAR =
  'M646 178C634 202 606 234 574 259C566 265 557 268.5 555 264.5C553 260.5 557 253 562 245' +
  'C571 230 581 212 592 194C600 189 608 186.5 616 185Z';
const PECT_NEAR_LEAD = 'M646 178C634 202 606 234 574 259C566 265 557 268.5 555 264.5';
const PECT_FAR = 'M628 184C620 202 604 225 588 241C584 245 579 246 579.5 241.5C582 229 586 214 590 198C600 191 612 187 622 184Z';

// ---------- Hoa văn thân ----------
const BELLY =
  'M720 166C704 170 684 174 660 176C624 179 586 178 548 177C508 176 468 175 430 174C390 172 352 170 318 169' +
  'C286 168 258 168 234 167.5C220 167 208 166.5 196 166L196 240L760 240L760 166Z';
const BELLY_LINE =
  'M716 168C696 172 676 175 650 177C612 179 572 178 532 177C492 176 452 175 412 173C372 171 336 169 298 168C262 167 232 166 200 164';

/** Lỗ cảm điện (ampullae) dày đặc trên mặt búa */
function ampullae(): string {
  return (
    `<g clip-path="${u.url('hammerClip')}">` +
    scatterSpots(61, { x: 746, y: 96, w: 31, h: 128 }, { count: 70, rMin: 0.4, rMax: 0.85, color: '#2e2c25', opacity: 0.35, minGap: 3.4 }) +
    scatterSpots(67, { x: 728, y: 100, w: 26, h: 122 }, { count: 30, rMin: 0.35, rMax: 0.7, color: '#2e2c25', opacity: 0.22, minGap: 4.5 }) +
    `</g>`
  );
}

/** 5 khe mang dài, cong nhẹ; khe sau nằm trên gốc vây ngực. */
function gills(): string {
  let dark = '';
  let lite = '';
  for (let i = 0; i < 5; i++) {
    const x = 690 - i * 9;
    const top = 140 + i * 1.4;
    const bot = 176 - i * 0.6;
    const mid = (top + bot) / 2;
    dark += `M${x + 2.5} ${top}Q${x - 3.5} ${mid} ${x + 1} ${bot}`;
    lite += `M${x + 4.2} ${top + 2}Q${x - 1.6} ${mid} ${x + 2.8} ${bot - 1}`;
  }
  return (
    `<path d="${lite}" fill="none" stroke="#ebe6da" stroke-opacity="0.4" stroke-width="1.3" stroke-linecap="round"/>` +
    `<path d="${dark}" fill="none" stroke="#35322a" stroke-opacity="0.62" stroke-width="1.45" stroke-linecap="round"/>`
  );
}

/** Sợi mờ tỏa trong vây (ceratotrichia thấy qua da). */
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

/** Vây da cá mập: đục, gradient, sợi mờ, (tuỳ chọn) chóp sẫm. */
function sharkFin(d: string, edge: string, clipId: string, fill: string, extra: string, str: string): string {
  return (
    `<path d="${d}" fill="${fill}"/>` +
    `<g clip-path="${u.url(clipId)}">` +
    `<path d="${str}" fill="none" stroke="#2c2a22" stroke-opacity="0.1" stroke-width="0.8" stroke-linecap="round"/>` +
    extra +
    `</g>` +
    `<path d="${edge}" fill="none" stroke="${EDGE}" stroke-width="1.3" stroke-opacity="0.55" stroke-linejoin="round" stroke-linecap="round"/>`
  );
}

const body = standardBody(u, BODY, {
  dorsal: BACK,
  flank: FLANK,
  belly: '#cfcbbd',
  outlineColor: EDGE,
  scales: false,
  flankAt: 0.46,
  rimOpacity: 0.7,
});

// mắt gần (đầu búa dưới) và mắt xa (đầu búa trên, nhỏ hơn, mờ hơn)
const eyeNear = eye(u, 'eyeN', {
  cx: 739.5,
  cy: 222,
  r: 4.4,
  iris: ['#8a7a46', '#2e2a1c'],
  pupil: 'round',
  socket: '#a8a494',
  look: [0.3, 0],
});
const eyeFar = eye(u, 'eyeF', {
  cx: 740.5,
  cy: 97.5,
  r: 3.2,
  iris: ['#7a6c40', '#2a2619'],
  pupil: 'round',
  socket: '#8f8c7e',
  look: [0.3, 0],
});

const defs = joinDefs(
  body,
  eyeNear,
  eyeFar,
  organicTexture(u('skin'), { freq: 0.42, octaves: 2, strength: 0.1, seed: 13 }),
  blurFilter(u('soft1'), 1.1),
  blurFilter(u('soft2'), 2.2),
  blurFilter(u('soft4'), 4),
  linear(u('belly'), [
    [0, WHITE],
    [0.7, '#ebe8de'],
    [1, '#d4cfc0'],
  ], { user: true, x1: 0, y1: 160, x2: 0, y2: 202 }),
  // mặt trên búa: nửa xa (trên) tối + hơi mờ xanh nước, nửa gần (dưới) sáng hơn
  linear(u('hammer'), [
    [0, '#6d7270'],
    [0.28, '#6b6a5b'],
    [0.5, '#79776a'],
    [0.75, '#8e8c7d'],
    [1, '#a3a091'],
  ], { user: true, x1: 0, y1: 92, x2: 0, y2: 229 }),
  // ánh sáng dọc mép trước búa
  linear(u('hammerFront'), [
    [0, '#ffffff', 0.0],
    [1, '#ffffff', 0.32],
  ], { user: true, x1: 735, y1: 0, x2: 776, y2: 0 }),
  linear(u('fadeX'), [
    [0, '#000000'],
    [1, '#ffffff'],
  ], { user: true, x1: 696, y1: 0, x2: 714, y2: 0 }),
  `<mask id="${u('hammerMask')}" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="290">` +
    `<rect x="0" y="0" width="800" height="290" fill="#ffffff"/>` +
    `<rect x="680" y="0" width="34" height="290" fill="${u.url('fadeX')}"/>` +
    `<rect x="0" y="0" width="680" height="290" fill="#000000"/></mask>`,
  linear(u('joinFade'), [
    [0, '#ffffff'],
    [0.55, '#ffffff'],
    [1, '#000000'],
  ], { user: true, x1: 160, y1: 0, x2: 204, y2: 0 }),
  `<mask id="${u('joinMask')}" maskUnits="userSpaceOnUse" x="140" y="130" width="80" height="50">` +
    `<rect x="140" y="130" width="80" height="50" fill="${u.url('joinFade')}"/></mask>`,
  linear(u('ink'), [
    [0, '#15171a'],
    [1, '#2a2c31'],
  ]),
  linear(u('finTop'), [
    [0, '#7b7969'],
    [0.6, BACK],
    [1, '#5e5c4f'],
  ]),
  linear(u('finLow'), [
    [0, '#9a9888'],
    [1, '#c6c2b3'],
  ]),
  linear(u('caudal'), [
    [0, '#5c5a4d'],
    [0.5, '#777566'],
    [1, '#959282'],
  ], { user: true, x1: 0, y1: 74, x2: 0, y2: 226 }),
  linear(u('pect'), [
    [0, '#7f7d6e'],
    [0.55, '#a3a090'],
    [1, '#c4c0b0'],
  ], { user: true, x1: 646, y1: 180, x2: 560, y2: 250 }),
  radial(u('pectGloss'), [
    [0, '#ffffff', 0.22],
    [1, '#ffffff', 0],
  ], { cx: 0.62, cy: 0.25, r: 0.5 }),
  `<clipPath id="${u('hammerClip')}"><path d="${HAMMER}"/></clipPath>`,
  `<clipPath id="${u('undersideClip')}"><path d="M738 162L800 162L800 290L728 290L728 232Q732 224 742 218Z"/></clipPath>`,
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
    [[200, 150], [196, 151], [192, 153], [190, 156], [192, 161], [196, 164], [200, 167]],
    [[40, 80], [66, 98], [92, 122], [122, 156], [112, 184], [106, 204], [108, 220]],
  )}" fill="none" stroke="#2c2a22" stroke-opacity="0.1" stroke-width="0.8"/>` +
  // mép sau đuôi sẫm hơn, chóp thùy dưới và thùy cuối hơi sẫm
  `<path d="${CAUDAL_EDGE}" fill="none" stroke="#33322b" stroke-width="5" stroke-opacity="0.5" stroke-linejoin="round" filter="${u.url('soft1')}"/>` +
  `<ellipse cx="106" cy="224" rx="16" ry="20" transform="rotate(25 106 224)" fill="${INK}" fill-opacity="0.38" filter="${u.url('soft2')}"/>` +
  `<ellipse cx="32" cy="80" rx="13" ry="7" transform="rotate(25 32 80)" fill="${INK}" fill-opacity="0.4" filter="${u.url('soft2')}"/>` +
  // sống thùy trên sáng nhẹ
  `<path d="M200 145C160 128 112 106 62 86" fill="none" stroke="#ffffff" stroke-opacity="0.17" stroke-width="2"/>` +
  `</g>` +
  `<path d="${CAUDAL}" fill="none" stroke="${EDGE}" stroke-width="1.2" stroke-opacity="0.5" stroke-linejoin="round"/>`;

/** Che mũi thân chồng lên gốc đuôi để cuống đuôi liền mạch. */
const tailJoinSvg =
  `<g clip-path="${u.url('caudalClip')}" mask="${u.url('joinMask')}">` +
  `<rect x="150" y="140" width="62" height="34" fill="${u.url('caudal')}"/>` +
  `</g>`;

const dorsal1Svg =
  sharkFin(
    DORSAL1,
    DORSAL1_EDGE,
    'd1Clip',
    u.url('finTop'),
    // chóp và mép sau hơi sẫm
    `<path d="M470 0L520 0L510 44Q492 36 470 38Z" fill="${INK}" fill-opacity="0.22" filter="${u.url('soft2')}"/>`,
    striae(
      [[546, 103], [528, 103], [510, 104], [492, 105], [476, 106]],
      [[494, 34], [486, 30], [484, 36], [480, 62], [464, 98]],
    ),
  ) +
  `<path d="M550 98C538 78 516 50 494 31" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.6" stroke-linecap="round"/>`;

const dorsal2Svg = sharkFin(
  DORSAL2,
  DORSAL2_EDGE,
  'd2Clip',
  u.url('finTop'),
  '',
  striae([[240, 147], [230, 148], [220, 149]], [[226, 132], [222, 134], [214, 146]]),
);

const analSvg = sharkFin(
  ANAL,
  ANAL_EDGE,
  'analClip',
  u.url('finLow'),
  `<path d="M236 194Q252 192 266 188L270 220L236 220Z" fill="#3a382f" fill-opacity="0.18" filter="${u.url('soft2')}"/>`,
  striae([[270, 176], [258, 174], [246, 173]], [[254, 199], [248, 201], [242, 190]]),
);

const pelvicSvg = sharkFin(
  PELVIC,
  PELVIC_EDGE,
  'pelvClip',
  u.url('finLow'),
  `<path d="M352 208Q368 205 386 199L392 230L352 230Z" fill="#3a382f" fill-opacity="0.16" filter="${u.url('soft2')}"/>`,
  striae([[386, 193], [372, 191], [358, 190]], [[366, 212], [362, 213], [356, 204]]),
);

const bodySvg =
  `<g filter="${u.url('skin')}">` +
  body.base +
  `<g clip-path="${u.url('bodyClip')}">` +
  // dải xám đậm ngay trên ranh giới bụng
  `<path d="${BELLY_LINE}" fill="none" stroke="#4d4a3e" stroke-opacity="0.45" stroke-width="10" filter="${u.url('soft4')}"/>` +
  // bụng trắng
  `<path d="${BELLY}" fill="${u.url('belly')}" filter="${u.url('soft1')}"/>` +
  // vai sáng nhẹ (ánh đồng) phía sau đầu
  `<ellipse cx="610" cy="132" rx="70" ry="16" fill="#b7a88a" fill-opacity="0.18" filter="${u.url('soft4')}"/>` +
  // lấm tấm rất mờ trên lưng
  scatterSpots(29, { x: 170, y: 100, w: 560, h: 60 }, { count: 160, rMin: 0.45, rMax: 0.95, color: '#3b392f', opacity: 0.12, minGap: 6 }) +
  `</g>` +
  `</g>` +
  // đường bên rất mờ
  `<path d="M680 136C600 124 500 122 410 128C320 136 250 144 180 152" fill="none" stroke="#e4ddd0" stroke-opacity="0.13" stroke-width="1.2"/>` +
  body.overlay;

const faceSvg =
  gills() +
  // miệng lưỡi liềm dưới đầu (sau mép búa) + cằm trắng
  `<path d="M712 172Q704 175.5 694 176" fill="none" stroke="#4a463a" stroke-opacity="0.5" stroke-width="1.3" stroke-linecap="round"/>`;

/** Đầu búa: viền mặt dưới trắng (độ dày) → mặt trên → lỗ cảm điện → khía → mũi → ánh sáng mép trước. */
const hammerSvg =
  `<g mask="${u.url('hammerMask')}">` +
  // mặt dưới trắng ló ra ở mép dưới (thấy độ dày búa)
  `<g clip-path="${u.url('undersideClip')}"><path d="${HAMMER}" transform="translate(0.8 3.6)" fill="${WHITE}"/></g>` +
  `<path d="${HAMMER}" fill="${u.url('hammer')}"/>` +
  `<g clip-path="${u.url('hammerClip')}">` +
  // bóng khối: gờ sống giữa búa (đầu) sáng, hai cánh tối dần
  `<ellipse cx="752" cy="152" rx="20" ry="9" fill="#ffffff" fill-opacity="0.13" filter="${u.url('soft4')}"/>` +
  `<path d="M700 126C716 124 740 120 762 114L780 110L780 86L700 86Z" fill="#40525a" fill-opacity="0.22" filter="${u.url('soft2')}"/>` +
  `<path d="${HAMMER_REAR_N}" fill="none" stroke="#3a382e" stroke-opacity="0.35" stroke-width="6" filter="${u.url('soft2')}"/>` +
  `<path d="${HAMMER_FRONT}" fill="none" stroke="${u.url('hammerFront')}" stroke-width="5" filter="${u.url('soft1')}"/>` +
  `</g>` +
  ampullae() +
  // rãnh mũi chạy dọc mép trước, gần hai đầu búa
  `<path d="M766 195Q762 203 756.5 209.5" fill="none" stroke="#2c2a22" stroke-opacity="0.55" stroke-width="1.1" stroke-linecap="round"/>` +
  `<path d="M759 113Q756 108 751.5 103.5" fill="none" stroke="#2c2a22" stroke-opacity="0.4" stroke-width="0.9" stroke-linecap="round"/>` +
  // viền
  `<path d="${HAMMER_FRONT}" fill="none" stroke="${EDGE}" stroke-width="1.5" stroke-opacity="0.6" stroke-linejoin="round"/>` +
  `<path d="${HAMMER_REAR_N}M${HAMMER_REAR_F.slice(1)}" fill="none" stroke="${EDGE}" stroke-width="1.3" stroke-opacity="0.5" stroke-linejoin="round" stroke-linecap="round"/>` +
  // khía lõm giữa và 2 khía phụ nhấn tối nhẹ
  `<path d="M774.5 145Q769.5 150 774.5 156M773.5 167Q771 171 772.5 176M769 136Q765.5 131 766 126" fill="none" stroke="#2c2a22" stroke-opacity="0.45" stroke-width="1.1" stroke-linecap="round"/>` +
  `</g>`;

const eyesSvg =
  eyeNear.svg +
  `<g opacity="0.82">${eyeFar.svg}</g>` +
  // mí da phía trên mắt gần
  `<path d="M733 217.5Q739.5 214 746 217.5" fill="none" stroke="#3b392f" stroke-opacity="0.45" stroke-width="1.3" stroke-linecap="round"/>`;

const pectFarSvg =
  `<path d="${PECT_FAR}" fill="#6a6858"/>` +
  `<g clip-path="${u.url('pectFarClip')}"><ellipse cx="584" cy="242" rx="11" ry="8" transform="rotate(-50 584 242)" fill="${INK}" fill-opacity="0.8" filter="${u.url('soft1')}"/></g>` +
  `<path d="${PECT_FAR}" fill="none" stroke="${EDGE}" stroke-width="1" stroke-opacity="0.45"/>`;

const pectNearSvg =
  `<path d="${PECT_NEAR}" fill="${u.url('pect')}"/>` +
  `<g clip-path="${u.url('pectClip')}">` +
  `<path d="${striae(
    [[640, 182], [628, 185], [616, 187], [604, 190], [594, 194]],
    [[574, 256], [566, 260], [562, 250], [568, 236], [578, 216]],
  )}" fill="none" stroke="#2c2a22" stroke-opacity="0.1" stroke-width="0.8"/>` +
  `<path d="${PECT_NEAR}" fill="${u.url('pectGloss')}"/>` +
  // mép sau sáng
  `<path d="M562 245C571 230 581 212 592 194" fill="none" stroke="#efe9dc" stroke-opacity="0.5" stroke-width="3"/>` +
  // chóp sẫm
  `<path d="M558 240Q572 243 586 236L600 290L540 290Z" fill="${u.url('ink')}" fill-opacity="0.82" filter="${u.url('soft1')}"/>` +
  `</g>` +
  `<path d="${PECT_NEAR_LEAD}" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1.4"/>` +
  `<path d="${PECT_NEAR}" fill="none" stroke="${EDGE}" stroke-width="1.2" stroke-opacity="0.55" stroke-linejoin="round"/>`;

const art: CreatureArt = {
  id: 'ca_map_dau_bua',
  viewBox: [800, 290],
  lengthUnits: 752,
  spineY: 151,
  animation: 'fish',
  cycleHz: 0.75,
  bendAmp: 20,
  // 400 cm → công thức mặc định ~388 px, quá lớn so với màn chơi và đàn bơi; 260 px vẫn lớn hơn rõ
  // cá mập vây đen (~228 px) nhưng không che màn hình.
  displayLengthPx: 260,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'pectoralFar',
      role: 'fin',
      z: 'back',
      pivot: [624, 185],
      anim: { type: 'rotate', amp: 0.025, speed: 0.5, phase: 1.4 },
      svg: pectFarSvg,
    },
    { name: 'caudal', role: 'tail', svg: caudalSvg },
    { name: 'dorsal2', role: 'detail', svg: dorsal2Svg },
    { name: 'anal', role: 'detail', svg: analSvg },
    { name: 'pelvic', role: 'detail', svg: pelvicSvg },
    { name: 'dorsal1', role: 'detail', svg: dorsal1Svg },
    { name: 'body', role: 'body', svg: bodySvg },
    { name: 'tailJoin', role: 'detail', svg: tailJoinSvg },
    { name: 'face', role: 'detail', svg: faceSvg },
    { name: 'hammer', role: 'detail', svg: hammerSvg },
    { name: 'eye', role: 'eye', svg: eyesSvg },
    {
      name: 'pectoralNear',
      role: 'fin',
      z: 'front',
      pivot: [634, 182],
      anim: { type: 'rotate', amp: 0.03, speed: 0.5 },
      svg: pectNearSvg,
    },
  ],
};

export default art;
