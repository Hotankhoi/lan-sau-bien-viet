/**
 * Cá đèn lồng – họ Myctophidae (Vùng khơi xa, Tầng 3 – biển sâu)
 * Tham khảo: references/ca_den_long (Benthosema, Myctophum, Notoscopelus, Gonichthys, Lobianchia).
 * Đặc điểm nhận dạng: cá nhỏ thon dẹt bên, đầu tù, mõm rất ngắn, MẮT RẤT TO sát mõm; miệng lớn xiên;
 * thân nâu đen ánh kim bạc–xanh, vảy tròn lớn; vây lưng giữa thân + VÂY MỠ nhỏ phía sau; đuôi chẻ.
 * Đặc trưng: các nhóm điểm phát quang (PO, PVO, PLO, VO, VLO, SAO, AO, Pol, Prc, Dn/Vn, Op, Br)
 * xếp hàng dọc bụng và hông → lớp role 'glow', blend 'add', lam/lục lam (#7CF7FF, #2FD8FF, #4FA8FF).
 *
 * Bố cục lớp phát quang: chấm ở nửa trước (x ≥ 300) là sprite tách rời (nhấp nháy, ít lệch vì nửa trước
 * gần như không uốn); chấm ở nửa sau (VO, SAO, AO, Pol, Prc) nướng chung với thân (bend) để không rời
 * thân khi đuôi quẫy mạnh.
 */
import type { CreatureArt } from '../contract';
import {
  makeIds,
  standardBody,
  eye,
  finRays,
  finMembrane,
  linear,
  radial,
  glowFilter,
  outline,
  rimLight,
  blurFilter,
  smoothPath,
  joinDefs,
} from '../style-bible';

const u = makeIds('ca_den_long');

type P = [number, number];

// ---------- Màu ----------
const DORSAL = '#0d0910';
const FLANK = '#211b29';
const BELLY = '#323142';
const OUTLINE = '#07050a';
const FIN_RAY = '#9aa6bd';

// ---------- Thân ----------
const BODY_PTS: P[] = [
  [492, 124], // mõm tù
  [487, 106],
  [473, 92],
  [452, 84],
  [422, 80],
  [382, 80],
  [334, 82],
  [292, 85],
  [250, 90],
  [210, 97],
  [170, 104],
  [134, 111],
  [106, 116],
  [84, 118], // gốc đuôi trên
  [80, 129],
  [84, 140], // gốc đuôi dưới
  [106, 142],
  [136, 146],
  [170, 152],
  [210, 160],
  [250, 166],
  [300, 171],
  [350, 173],
  [400, 170],
  [438, 163],
  [466, 151],
  [483, 139],
];
const BODY = smoothPath(BODY_PTS, true, 0.5);
const DORSAL_EDGE = smoothPath(BODY_PTS.slice(0, 14), false, 0.5);
const VENTRAL_EDGE = smoothPath(BODY_PTS.slice(15).concat([BODY_PTS[0]]), false, 0.5);

// ---------- Vây ----------
const TAIL =
  'M92 113C72 103 48 90 20 78C26 92 40 114 58 129C40 144 26 164 20 181C48 168 72 155 92 145Z';
const TAIL_EDGE = 'M20 78C26 92 40 114 58 129C40 144 26 164 20 181';

const DORSAL_FIN = 'M302 86C300 74 296 64 290 58C276 60 258 66 244 76C236 84 230 90 226 96Z';
const DORSAL_FIN_EDGE = 'M302 86C300 74 296 64 290 58C276 60 258 66 244 76C236 84 230 90 226 96';

const ADIPOSE = 'M150 109C148 100 142 95 134 95C128 97 125 103 124 112Z';

const ANAL_FIN = 'M238 165C236 176 232 184 226 190C206 186 182 176 158 166C154 158 150 152 148 149Z';
const ANAL_FIN_EDGE = 'M238 165C236 176 232 184 226 190C206 186 182 176 158 166C154 158 150 152 148 149';

const PELVIC = 'M322 171C312 180 298 188 280 192C288 184 298 176 306 170Z';

const PECTORAL = 'M374 148C360 142 342 142 322 150C340 156 358 158 374 154Z';

// ---------- Điểm phát quang ----------
// [x, y, bán kính]
const PH_FRONT: [number, number, number][] = [
  // Dn (trước mắt), Vn (dưới mắt)
  [479, 101, 2.6],
  [471, 127, 2.6],
  // Br – dưới hàm
  [438, 162.5, 2.4],
  [424, 165.5, 2.4],
  [410, 167.5, 2.4],
  // Op – nắp mang
  [407, 147, 3.2],
  [400, 157, 3.2],
  // PO – ngực, dọc mép bụng
  [402, 164, 3.8],
  [386, 165.5, 3.8],
  [368, 166.5, 3.8],
  [350, 167, 3.8],
  [332, 167, 3.8],
  // PVO – quanh gốc vây ngực
  [380, 139, 3.6],
  [371, 130, 3.6],
  // PLO – trên gốc vây ngực
  [362, 119, 3.6],
  // VLO – giữa hông
  [308, 134, 3.6],
];
const PH_REAR: [number, number, number][] = [
  // VO – bụng
  [304, 165, 3.8],
  [288, 164, 3.8],
  [272, 162.5, 3.8],
  [256, 161, 3.8],
  // SAO – hàng xiên trên gốc vây hậu môn
  [245, 150, 3.6],
  [238, 138, 3.6],
  [233, 125, 3.6],
  // AOa – dọc gốc vây hậu môn
  [226, 155, 3.6],
  [212, 153.5, 3.6],
  [198, 150.5, 3.6],
  [184, 148, 3.6],
  [170, 145.5, 3.6],
  [157, 143, 3.6],
  // Pol – cao trên cuống đuôi
  [164, 128, 3.4],
  // AOp – cuống đuôi
  [144, 140.5, 3.4],
  [130, 138.5, 3.4],
  [116, 137, 3.4],
  [103, 136, 3.4],
  // Prc – gốc đuôi
  [94, 131, 3.2],
  [89, 123.5, 3.0],
];

/** Hốc phát quang nhìn khi được đèn chiếu: viền sẫm + "thấu kính" bạc lam (nằm trên thân, uốn theo thân). */
function sockets(list: [number, number, number][]): string {
  return list
    .map(
      ([x, y, r]) =>
        `<circle cx="${x}" cy="${y}" r="${(r * 1.3).toFixed(2)}" fill="#05060b" fill-opacity="0.8"/>` +
        `<circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="${u.url('lens')}"/>`,
    )
    .join('');
}

/** Lớp phát quang: quầng mềm + lõi sáng (glowFilter) + chấm nóng. */
function glowDots(list: [number, number, number][]): string {
  const halos = list
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${(r * 3.2).toFixed(2)}" fill="${u.url('halo')}"/>`)
    .join('');
  const cores = list
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${(r * 0.78).toFixed(2)}"/>`)
    .join('');
  const hot = list
    .map(([x, y, r]) => `<circle cx="${(x + r * 0.15).toFixed(2)}" cy="${(y - r * 0.15).toFixed(2)}" r="${(r * 0.32).toFixed(2)}"/>`)
    .join('');
  return (
    `<g>${halos}</g>` +
    `<g fill="#2FD8FF" filter="${u.url('glow')}">${cores}</g>` +
    `<g fill="#B8FBFF" fill-opacity="0.9">${hot}</g>`
  );
}

// tuyến phát sáng trên cuống đuôi (supracaudal – ở cá đực)
const SUPRACAUDAL = 'M140 112C130 112 116 114 104 117C114 120 128 118 140 115Z';

/** Vảy tròn lớn (cycloid): cung lồi về phía đuôi, xếp so le. */
function scaleTile(id: string, s: number, color: string, op: number, sw: number): string {
  const w = s * 0.72;
  const arc = (x: number, y: number) => `M${x} ${y - s / 2}A${s / 2} ${s / 2} 0 0 0 ${x} ${y + s / 2}`;
  return (
    `<pattern id="${id}" width="${w}" height="${s}" patternUnits="userSpaceOnUse">` +
    `<path d="${arc(w, 0)}${arc(w, s)}${arc(w / 2, s / 2)}${arc(w * 1.5, s / 2)}" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="${sw}"/>` +
    `</pattern>`
  );
}

// ---------- Thân chuẩn ----------
const body = standardBody(u, BODY, {
  dorsal: DORSAL,
  flank: FLANK,
  belly: BELLY,
  outlineColor: OUTLINE,
  scales: false, // scalePattern dùng chung đang lỗi (xem báo cáo) → tự vẽ vảy ở scaleTile()
  flankAt: 0.5,
  rimOpacity: 0.95,
});

const theEye = eye(u, 'eye', {
  cx: 455,
  cy: 112,
  r: 18,
  iris: ['#8fd3c8', '#1c3a44'],
  socket: '#0a0910',
  look: [0.15, 0.05],
});

// đường bên: hàng vảy hình chữ V
function lateralLine(): string {
  let s = '';
  for (let x = 372; x > 96; x -= 9) {
    const t = (372 - x) / (372 - 96);
    const y = 110 + t * 18;
    s += `M${(x + 3).toFixed(1)} ${(y - 2.4).toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}L${(x + 3).toFixed(1)} ${(y + 2.4).toFixed(1)}`;
  }
  return (
    `<path d="M374 110L96 128" stroke="#8fa7c6" stroke-opacity="0.22" stroke-width="1.1" fill="none"/>` +
    `<path d="${s}" stroke="#b9cde6" stroke-opacity="0.24" stroke-width="1.1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
  );
}

const defs = joinDefs(
  body,
  theEye,
  scaleTile(u('scl'), 15, '#b4cbe8', 0.15, 1.0),
  // vùng có vảy: sau mép nắp mang (đầu trơn bóng)
  `<clipPath id="${u('trunk')}"><path d="M0 0H404C388 106 382 136 392 168L392 256H0Z"/></clipPath>`,
  // ánh kim bạc – xanh dọc hông
  linear(u('sheen'), [
    [0, '#7fa8d6', 0],
    [0.3, '#7fa8d6', 0.06],
    [0.55, '#86b2e0', 0.13],
    [0.78, '#c9d6ea', 0.16],
    [1, '#c9d6ea', 0.05],
  ]),
  // ánh tím – lục lam chạy dọc thân (đổi sắc như kim loại)
  linear(
    u('irid'),
    [
      [0, '#5fd0d8', 0.0],
      [0.35, '#5fd0d8', 0.12],
      [0.6, '#8a6bd0', 0.1],
      [0.85, '#4f8fe0', 0.14],
      [1, '#4f8fe0', 0],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 0 },
  ),
  // má / nắp mang bạc
  linear(u('cheek'), [
    [0, '#c8d4e6', 0.2],
    [0.5, '#8796b0', 0.13],
    [1, '#2a3040', 0.2],
  ]),
  // rim bụng (phản chiếu đèn từ dưới)
  linear(u('rimBelly'), [
    [0.6, '#cfe0ff', 0],
    [0.85, '#cfe0ff', 0.12],
    [1, '#e6f0ff', 0.55],
  ]),
  linear(u('fin'), [
    [0, '#3c3549', 0.75],
    [1, '#1a1620', 0.6],
  ]),
  linear(
    u('tailFill'),
    [
      [0, '#3a3446', 0.55],
      [0.6, '#1e1924', 0.75],
      [1, '#0c090f', 0.95],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 0 },
  ),
  radial(u('lens'), [
    [0, '#e8f6ff'],
    [0.45, '#8fc8ee'],
    [1, '#2b4a6a'],
  ], { cx: 0.42, cy: 0.4, r: 0.6 }),
  radial(u('halo'), [
    [0, '#4FA8FF', 0.62],
    [0.35, '#3FB8FF', 0.32],
    [1, '#1E6BFF', 0],
  ]),
  radial(u('gland'), [
    [0, '#7CF7FF', 0.9],
    [1, '#2FA8FF', 0],
  ]),
  glowFilter(u('glow'), 2.2, 1.8),
  blurFilter(u('soft'), 5),
  // bóng khối dịu (volumeShade chuẩn quá sáng cho thân đen → tự làm bản nhẹ)
  radial(u('vol'), [
    [0, '#cfe0ff', 0.16],
    [0.45, '#cfe0ff', 0],
    [0.8, '#000000', 0],
    [1, '#000000', 0.3],
  ], { cx: 0.66, cy: 0.3, r: 0.75 }),
);

const finEdge = (d: string, w = 1.3, op = 0.55) =>
  `<path d="${d}" fill="none" stroke="#b6c3d8" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

const art: CreatureArt = {
  id: 'ca_den_long',
  viewBox: [512, 256],
  lengthUnits: 472,
  spineY: 128,
  animation: 'fish',
  cycleHz: 3.0,
  bendAmp: 18,
  // Thật chỉ ~10–15 cm → công thức cho ~58 px; nâng lên 68 px để các hàng điểm phát quang
  // (mỗi chấm ~1 px + quầng) còn tách bạch thành "dải sao" trong game.
  displayLengthPx: 68,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'tail',
      role: 'tail',
      svg:
        finMembrane(TAIL, u.url('tailFill'), { opacity: 1 }) +
        finRays([90, 129], [
          [22, 80], [30, 92], [40, 105], [50, 118], [58, 128], [50, 140], [40, 153], [30, 166], [22, 179],
        ], { color: FIN_RAY, opacity: 0.32, width: 0.9, bend: 0.03 }) +
        finEdge(TAIL_EDGE, 1.2, 0.45),
    },
    {
      name: 'dorsal',
      role: 'detail',
      svg:
        finMembrane(DORSAL_FIN, u.url('fin'), { opacity: 0.85 }) +
        finRays(
          [[298, 87], [289, 88], [280, 89], [270, 90], [260, 91], [250, 92], [240, 93], [232, 95]],
          [[291, 60], [282, 62], [272, 65], [262, 69], [252, 73], [244, 78], [236, 85], [229, 93]],
          { color: FIN_RAY, opacity: 0.4, width: 0.9, bend: 0.03 },
        ) +
        finEdge(DORSAL_FIN_EDGE),
    },
    {
      name: 'adipose',
      role: 'detail',
      svg:
        `<path d="${ADIPOSE}" fill="${u.url('fin')}" fill-opacity="0.9"/>` +
        finEdge('M150 109C148 100 142 95 134 95C128 97 125 103 124 112', 1, 0.4),
    },
    {
      name: 'anal',
      role: 'detail',
      svg:
        finMembrane(ANAL_FIN, u.url('fin'), { opacity: 0.8 }) +
        finRays(
          [[234, 164], [222, 161], [210, 159], [198, 156], [186, 154], [174, 152], [162, 150], [152, 149]],
          [[228, 188], [214, 186], [202, 183], [190, 179], [178, 175], [168, 171], [160, 166], [152, 156]],
          { color: FIN_RAY, opacity: 0.38, width: 0.9, bend: -0.03 },
        ) +
        finEdge(ANAL_FIN_EDGE, 1.1, 0.45),
    },
    {
      name: 'pelvic',
      role: 'detail',
      svg:
        finMembrane(PELVIC, u.url('fin'), { opacity: 0.8 }) +
        finRays([316, 171], [[284, 191], [292, 186], [300, 180]], { color: FIN_RAY, opacity: 0.4, width: 0.8 }) +
        finEdge('M322 171C312 180 298 188 280 192', 1, 0.45),
    },
    {
      name: 'body',
      role: 'body',
      svg:
        body.base +
        `<g clip-path="${u.url('bodyClip')}">` +
        // ánh kim bạc–xanh dọc hông
        `<path d="${BODY}" fill="${u.url('sheen')}"/>` +
        `<path d="${BODY}" fill="${u.url('irid')}"/>` +
        // vảy tròn lớn
        `<g clip-path="${u.url('trunk')}"><path d="${BODY}" fill="${u.url('scl')}"/></g>` +
        // mảng bạc loang (giống lớp guanine bong tróc ở mẫu thật)
        `<g filter="${u.url('soft')}" fill="#9fb6d6">` +
        `<ellipse cx="330" cy="142" rx="42" ry="14" opacity="0.16"/>` +
        `<ellipse cx="250" cy="138" rx="34" ry="11" opacity="0.12"/>` +
        `<ellipse cx="178" cy="132" rx="26" ry="8" opacity="0.1"/>` +
        `</g>` +
        // má & nắp mang bạc
        `<path d="M444 128C456 136 470 140 482 140C474 156 450 166 420 168C400 168 386 160 380 146C384 126 396 112 412 104C424 108 434 116 444 128Z" fill="${u.url('cheek')}"/>` +
        // gáy & đỉnh đầu sẫm hơn
        `<path d="M380 78C410 76 446 80 474 92C462 98 440 98 412 98C396 96 386 90 380 78Z" fill="#05040a" opacity="0.45"/>` +
        // gốc đuôi sẫm đen (ref4, ref5)
        `<rect x="76" y="108" width="34" height="40" fill="#050307" opacity="0.55" filter="${u.url('soft')}"/>` +
        // ánh lục – vàng trên nắp mang (ref2)
        `<ellipse cx="404" cy="134" rx="18" ry="22" fill="#6fd0b0" opacity="0.13" filter="${u.url('soft')}"/>` +
        `<ellipse cx="430" cy="150" rx="16" ry="8" fill="#d8c27a" opacity="0.08" filter="${u.url('soft')}"/>` +
        lateralLine() +
        // hốc phát quang (thấy khi được đèn chiếu)
        sockets(PH_FRONT) +
        sockets(PH_REAR) +
        // rim bạc mép bụng
        `<path d="${BODY}" fill="${u.url('rimBelly')}"/>` +
        `</g>` +
        `<path d="${BODY}" fill="${u.url('vol')}"/>` +
        outline(BODY, OUTLINE, 1.8, 0.7) +
        rimLight(BODY, u.url('rim'), 2.4) +
        `<path d="${VENTRAL_EDGE}" fill="none" stroke="#dbe8ff" stroke-opacity="0.28" stroke-width="1.2"/>` +
        `<path d="${DORSAL_EDGE}" fill="none" stroke="#e8f2ff" stroke-opacity="0.35" stroke-width="0.8"/>`,
    },
    {
      name: 'face',
      role: 'detail',
      svg:
        // mép nắp mang & tiền nắp mang
        `<path d="M400 84C384 106 378 136 388 168" fill="none" stroke="#04030a" stroke-opacity="0.75" stroke-width="2"/>` +
        `<path d="M401 86C386 108 380 136 390 166" fill="none" stroke="#c3d2ea" stroke-opacity="0.3" stroke-width="0.9"/>` +
        `<path d="M424 102C412 120 408 142 414 160" fill="none" stroke="#04030a" stroke-opacity="0.45" stroke-width="1.3"/>` +
        // miệng lớn xiên – hàm trên kéo ra sau quá mắt
        `<path d="M489 121C476 128 456 140 432 152C426 155 420 158 417 162C423 164 430 162 436 158C458 146 478 136 491 128Z" fill="#454b62" fill-opacity="0.85"/>` +
        `<path d="M489 121C476 128 456 140 432 152C426 155 420 158 417 162" fill="none" stroke="#c9d6ea" stroke-opacity="0.35" stroke-width="0.9"/>` +
        `<path d="M491 129C476 138 456 150 436 159C430 162 424 164 418 163" fill="none" stroke="#020104" stroke-width="2.2" stroke-linecap="round"/>` +
        // hàm dưới
        `<path d="M489 136C478 144 462 152 446 158" fill="none" stroke="#04030a" stroke-opacity="0.55" stroke-width="1.1"/>` +
        // lỗ mũi
        `<circle cx="481" cy="110" r="1.6" fill="#020104" opacity="0.8"/>`,
    },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    {
      name: 'glowRear',
      role: 'glow',
      bend: true,
      blend: 'add',
      svg:
        glowDots(PH_REAR) +
        `<path d="${SUPRACAUDAL}" fill="${u.url('gland')}" filter="${u.url('glow')}" opacity="0.8"/>`,
    },
    {
      name: 'pectoral',
      role: 'fin',
      z: 'front',
      pivot: [374, 151],
      anim: { type: 'rotate', amp: 0.32, speed: 1.4 },
      svg:
        `<path d="${PECTORAL}" fill="${u.url('fin')}" fill-opacity="0.75" stroke="#b6c3d8" stroke-opacity="0.4" stroke-width="1" stroke-linejoin="round"/>` +
        finRays([374, 151], [[324, 150], [332, 152], [342, 154], [352, 156], [362, 156]], { color: FIN_RAY, opacity: 0.4, width: 0.8 }),
    },
    {
      name: 'glowFront',
      role: 'glow',
      bend: false,
      z: 'front',
      blend: 'add',
      pivot: [390, 145],
      anim: { type: 'alpha', amp: 0.28, speed: 0.35 },
      svg: glowDots(PH_FRONT),
    },
  ],
};

export default art;
