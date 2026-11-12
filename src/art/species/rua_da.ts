/**
 * Rùa da – Dermochelys coriacea (Vùng khơi xa, Tầng 2)
 * Tham khảo: references/rua_da (Wikimedia, chỉ để nhìn). Đặc điểm phải nhận ra ngay:
 *  - KHÔNG có mai sừng: lưng là lớp da dày đen xanh, dài, thuôn nhọn ra sau thành "đuôi mai" chìa quá chân sau;
 *  - các GỜ DỌC lưng sáng màu chạy song song từ vai tới chóp mai (nhìn ngang thấy gờ sống lưng + 3 gờ hông);
 *  - chân chèo trước CỰC DÀI (gần bằng thân), không móng, phủ dày đốm/loang trắng không đều;
 *  - đầu to tròn, mỏ trên có HAI MẤU NHỌN (khía hình chữ W), họng/cằm loang hồng; đốm trắng ở đầu & cổ;
 *  - chân sau rộng như mái chèo, nối liền với gốc đuôi.
 * Vẽ quay đầu sang phải, tư thế bơi giữa nước (chân trước gần đưa ra sau – xuống, chân trước xa vươn lên).
 */
import type { CreatureArt } from '../contract';
import { makeIds, linear, radial, blurFilter, smoothPath, rng, eye, organicTexture } from '../style-bible';

const ID = 'rua_da';
const u = makeIds(ID);
type P = [number, number];

const VW = 700;
const VH = 380;

// ---------------------------------------------------------------------
// MAI DA: mép lưng (TOP) và mép hông (MARGIN), đi từ chóp đuôi (trái) tới vai (phải)
// ---------------------------------------------------------------------
const TOP: P[] = [
  [36, 214],
  [92, 186],
  [170, 146],
  [258, 112],
  [346, 95],
  [420, 96],
  [476, 112],
  [512, 146],
];
const MARGIN: P[] = [
  [36, 214],
  [96, 219],
  [180, 228],
  [270, 234],
  [360, 232],
  [430, 223],
  [482, 208],
  [514, 190],
];
// hình kín: mép lưng (trái→phải) rồi mép hông (phải→trái), khép về chóp đuôi
const CARA_D = smoothPath([...TOP, ...MARGIN.slice(1).reverse()], true, 0.5);

function lerpPoly(poly: P[], x: number): number {
  if (x <= poly[0][0]) return poly[0][1];
  for (let i = 1; i < poly.length; i++) {
    if (x <= poly[i][0]) {
      const k = (x - poly[i - 1][0]) / (poly[i][0] - poly[i - 1][0]);
      return poly[i - 1][1] + (poly[i][1] - poly[i - 1][1]) * k;
    }
  }
  return poly[poly.length - 1][1];
}
/** điểm trên mai: x, k (0 = mép lưng → 1 = mép hông) */
const onShell = (x: number, k: number): P => [x, lerpPoly(TOP, x) * (1 - k) + lerpPoly(MARGIN, x) * k];
/** gờ dọc ở độ cao k: hội tụ về chóp đuôi */
function ridge(k: number, x0 = 60, x1 = 488): string {
  const pts: P[] = [];
  for (let i = 0; i <= 26; i++) {
    const x = x0 + ((x1 - x0) * i) / 26;
    pts.push(onShell(x, k));
  }
  return smoothPath(pts, false, 0.5);
}

// Bụng (yếm da) lộ dưới mép hông – sáng, loang
const BELLY_D = smoothPath(
  [
    [500, 198],
    [468, 226],
    [400, 244],
    [310, 250],
    [220, 244],
    [140, 232],
    [96, 221],
    [180, 228],
    [270, 234],
    [360, 232],
    [430, 223],
    [482, 208],
  ],
  true,
  0.5,
);

// ---------------------------------------------------------------------
// ĐẦU & CỔ
// ---------------------------------------------------------------------
const NECK_D = smoothPath(
  [
    [486, 146],
    [530, 140],
    [556, 156],
    [560, 196],
    [530, 214],
    [492, 206],
  ],
  true,
  0.6,
);
const HEAD_D = smoothPath(
  [
    [518, 150],
    [544, 124],
    [584, 114],
    [624, 122],
    [650, 142],
    [662, 164],
    [658, 182], // chóp mỏ trên
    [646, 192],
    [618, 202],
    [582, 208],
    [548, 206],
    [524, 190],
  ],
  true,
  0.55,
);
// đường miệng: thẳng, hơi chúc xuống; mỏ trên có 2 mấu nhọn (khía W) ở chóp
const MOUTH_LINE = `M658 182L651 188L645 182L638 190L620 193L584 196`;
const JAW_D = `M638 190L620 193L584 196Q600 205 624 201Q640 197 646 192Z`;
const EYE = eye(u, 'eye', { cx: 606, cy: 150, r: 6.4, iris: ['#4A3A2E', '#1A120D'], pupil: 'round', socket: '#0B1116' });

// ---------------------------------------------------------------------
// CHÂN CHÈO: dựng từ đường tâm cong + bề rộng thon dần (mép trước dày, mép sau mỏng)
// ---------------------------------------------------------------------
function paddle(base: P, ctrl: P, tip: P, maxW: number, lead = 0.36): { d: string; leading: string; trailing: P[] } {
  const N = 28;
  const L: P[] = [];
  const T: P[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const mt = 1 - t;
    const x = mt * mt * base[0] + 2 * mt * t * ctrl[0] + t * t * tip[0];
    const y = mt * mt * base[1] + 2 * mt * t * ctrl[1] + t * t * tip[1];
    const dx = 2 * mt * (ctrl[0] - base[0]) + 2 * t * (tip[0] - ctrl[0]);
    const dy = 2 * mt * (ctrl[1] - base[1]) + 2 * t * (tip[1] - ctrl[1]);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    // rộng nhất ở ~30% chiều dài, thon nhọn về chóp
    const w = t < 0.3 ? maxW * (0.62 + 0.38 * Math.sin((t / 0.3) * (Math.PI / 2))) : maxW * Math.max(0.03, 1 - ((t - 0.3) / 0.7) ** 1.5);
    L.push([x - nx * w * lead, y - ny * w * lead]);
    T.push([x + nx * w * (1 - lead), y + ny * w * (1 - lead)]);
  }
  // nắp tròn ở gốc: điểm lùi về phía thân theo hướng ngược tiếp tuyến
  const tx0 = ctrl[0] - base[0];
  const ty0 = ctrl[1] - base[1];
  const l0 = Math.hypot(tx0, ty0) || 1;
  const cap: P = [base[0] - (tx0 / l0) * maxW * 0.42, base[1] - (ty0 / l0) * maxW * 0.42];
  return { d: smoothPath([cap, ...L, ...T.slice().reverse()], true, 0.6), leading: smoothPath(L, false, 0.5), trailing: T };
}
const FN_PIVOT: P = [466, 206];
const FN = paddle(FN_PIVOT, [338, 236], [150, 338], 74, 0.3);
const FRONT_NEAR_D = FN.d;
const FF_PIVOT: P = [450, 150];
const FF = paddle(FF_PIVOT, [372, 96], [236, 24], 56, 0.62);
const FRONT_FAR_D = FF.d;
const HN_PIVOT: P = [140, 216];
const HN = paddle(HN_PIVOT, [100, 236], [44, 262], 50, 0.35);
const HIND_NEAR_D = HN.d;
const HF_PIVOT: P = [128, 200];
const HF = paddle(HF_PIVOT, [92, 194], [44, 186], 34, 0.5);
const HIND_FAR_D = HF.d;

// ---------------------------------------------------------------------
// ĐỐM TRẮNG KHÔNG ĐỀU (loang như vết sơn – đặc trưng chân trước)
// ---------------------------------------------------------------------
function blots(seed: number, area: { x: number; y: number; w: number; h: number }, n: number, rMin: number, rMax: number, color: string, op: number): string {
  const r = rng(seed);
  let s = `<g fill="${color}" fill-opacity="${op}">`;
  for (let i = 0; i < n; i++) {
    const cx = area.x + r() * area.w;
    const cy = area.y + r() * area.h;
    const rad = rMin + r() * (rMax - rMin);
    const pts: P[] = [];
    const m = 6;
    for (let k = 0; k < m; k++) {
      const a = (k / m) * Math.PI * 2 + r() * 0.4;
      const rr = rad * (0.6 + r() * 0.6);
      pts.push([cx + Math.cos(a) * rr * 1.3, cy + Math.sin(a) * rr]);
    }
    s += `<path d="${smoothPath(pts, true, 0.7)}"/>`;
  }
  return s + '</g>';
}

// ---------------------------------------------------------------------
// DEFS
// ---------------------------------------------------------------------
const defs =
  linear(u('shell'), [
    [0, '#2E3E4B'],
    [0.25, '#1A2631'],
    [0.7, '#111A22'],
    [1, '#24323E'],
  ]) +
  linear(u('belly'), [
    [0, '#7E8B95'],
    [0.5, '#A8B3BB'],
    [1, '#C9D1D6'],
  ]) +
  linear(u('flipNear'), [
    [0, '#26343F'],
    [0.6, '#16202A'],
    [1, '#0E151C'],
  ]) +
  linear(u('flipFar'), [
    [0, '#1A2530'],
    [1, '#0D141A'],
  ]) +
  radial(u('head'), [
    [0, '#34444F'],
    [0.6, '#1B2731'],
    [1, '#101820'],
  ], { cx: 0.45, cy: 0.3, r: 0.8 }) +
  linear(u('throat'), [
    [0, '#D69AA3', 0],
    [0.5, '#D9A2AA', 0.75],
    [1, '#E8C3C6', 0.95],
  ]) +
  organicTexture(u('leather'), { freq: 0.05, octaves: 3, strength: 0.28, seed: 21 }) +
  blurFilter(u('soft'), 2.4) +
  blurFilter(u('blur8'), 8) +
  `<clipPath id="${u('shellClip')}"><path d="${CARA_D}"/></clipPath>` +
  `<clipPath id="${u('headClip')}"><path d="${HEAD_D}"/></clipPath>` +
  `<clipPath id="${u('bellyClip')}"><path d="${BELLY_D}"/></clipPath>` +
  `<clipPath id="${u('fnClip')}"><path d="${FRONT_NEAR_D}"/></clipPath>` +
  `<clipPath id="${u('ffClip')}"><path d="${FRONT_FAR_D}"/></clipPath>` +
  `<clipPath id="${u('hnClip')}"><path d="${HIND_NEAR_D}"/></clipPath>` +
  `<clipPath id="${u('neckClip')}"><path d="${NECK_D}"/></clipPath>` +
  EYE.defs;

// ---------------------------------------------------------------------
// LỚP
// ---------------------------------------------------------------------
const flipper = (d: string, fill: string, clipId: string, seed: number, area: { x: number; y: number; w: number; h: number }, dense: number, edge = '#071016') =>
  `<path d="${d}" fill="${fill}"/>` +
  `<g clip-path="${u.url(clipId)}">` +
  blots(seed, area, dense, 1.3, 3.8, '#E4ECEF', 0.85) +
  blots(seed + 1, area, Math.round(dense * 0.9), 0.7, 1.6, '#C9D6DC', 0.75) +
  `</g>` +
  `<path d="${d}" fill="none" stroke="${edge}" stroke-opacity="0.85" stroke-width="1.6"/>`;

const frontFar = flipper(FRONT_FAR_D, u.url('flipFar'), 'ffClip', 51, { x: 220, y: 10, w: 250, h: 170 }, 300) + `<path d="${FRONT_FAR_D}" fill="#06131D" opacity="0.35"/>`;
const hindFar = `<path d="${HIND_FAR_D}" fill="${u.url('flipFar')}" stroke="#071016" stroke-width="1.4"/>` + `<path d="${HIND_FAR_D}" fill="#06131D" opacity="0.3"/>`;
const hindNear = flipper(HIND_NEAR_D, u.url('flipNear'), 'hnClip', 61, { x: 36, y: 196, w: 130, h: 90 }, 90);

const frontNear =
  flipper(FRONT_NEAR_D, u.url('flipNear'), 'fnClip', 71, { x: 140, y: 170, w: 340, h: 190 }, 520) +
  // mép trước dày sáng (gờ xương), mép sau mỏng hơi trong
  `<g clip-path="${u.url('fnClip')}"><path d="${FN.leading}" stroke="#9EB8C6" stroke-opacity="0.4" stroke-width="6" fill="none" filter="${u.url('soft')}"/>` +
  `<path d="${smoothPath(FN.trailing, false, 0.5)}" stroke="#D5E2E8" stroke-opacity="0.35" stroke-width="3" fill="none"/></g>`;

const neck =
  `<path d="${NECK_D}" fill="#1A2630"/>` +
  `<g clip-path="${u.url('neckClip')}">` +
  `<path d="M486 200Q520 220 560 200V220H486Z" fill="${u.url('throat')}"/>` +
  blots(81, { x: 486, y: 140, w: 74, h: 70 }, 22, 1.4, 3.2, '#DCE6EA', 0.75) +
  // nếp da cổ
  `<path d="M500 160Q520 176 516 204M516 150Q536 170 534 206" stroke="#0A1117" stroke-opacity="0.6" stroke-width="1.3" fill="none"/>` +
  `</g>`;

const head =
  `<path d="${HEAD_D}" fill="${u.url('head')}"/>` +
  `<g clip-path="${u.url('headClip')}">` +
  // cằm, họng loang hồng
  `<path d="M522 194Q560 214 604 204V222H520Z" fill="${u.url('throat')}" opacity="0.5"/>` +
  `<path d="${JAW_D}" fill="#24303A"/>` +
  `<path d="${JAW_D}" fill="#B98892" opacity="0.18"/>` +
  // đốm hồng trên đỉnh đầu (đặc điểm riêng từng cá thể)
  `<ellipse cx="574" cy="122" rx="8" ry="4.5" fill="#D99AA6" opacity="0.5" filter="${u.url('soft')}"/>` +
  blots(91, { x: 520, y: 116, w: 136, h: 80 }, 70, 0.8, 2.2, '#DCE6EA', 0.75) +
  // gò má / hàm dưới (khối)
  `<path d="M560 196Q600 186 640 176" stroke="#05090C" stroke-opacity="0.35" stroke-width="5" fill="none" filter="${u.url('soft')}"/>` +
  // khối tròn đầu
  `<ellipse cx="600" cy="138" rx="34" ry="12" fill="#7FA2B8" opacity="0.18" filter="${u.url('soft')}"/>` +
  `</g>` +
  `<path d="${HEAD_D}" fill="none" stroke="#060C11" stroke-opacity="0.9" stroke-width="1.6"/>` +
  `<path d="${MOUTH_LINE}" fill="none" stroke="#05090C" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
  // lỗ mũi
  `<ellipse cx="652" cy="156" rx="1.6" ry="2.4" fill="#05090C"/>` +
  // mí mắt dày
  `<path d="M595 144Q606 137 617 145" stroke="#0A1218" stroke-width="3" fill="none" stroke-linecap="round"/>` +
  EYE.svg;

const shell =
  `<path d="${BELLY_D}" fill="${u.url('belly')}"/>` +
  `<g clip-path="${u.url('bellyClip')}">` +
  blots(101, { x: 110, y: 214, w: 380, h: 36 }, 40, 2.5, 7, '#4E5C67', 0.55) +
  `</g>` +
  `<path d="${CARA_D}" fill="${u.url('shell')}"/>` +
  `<g clip-path="${u.url('shellClip')}">` +
  `<rect x="30" y="100" width="500" height="140" fill="#1B2832" filter="${u.url('leather')}" opacity="0.6"/>` +
  // dải tối giữa các gờ (khối lõm), sáng trên mỗi gờ
  [0.36, 0.68].map((k) => `<path d="${ridge(k + 0.1)}" stroke="#05090D" stroke-opacity="0.45" stroke-width="12" fill="none" filter="${u.url('soft')}"/>`).join('') +
  blots(111, { x: 60, y: 110, w: 450, h: 110 }, 70, 1, 2.4, '#B9C8D0', 0.5) +
  // vùng gần vai sáng hơn (nắng chiếu)
  `<ellipse cx="400" cy="126" rx="120" ry="18" fill="#88AEC6" opacity="0.18" filter="${u.url('blur8')}"/>` +
  `</g>` +
  // GỜ DỌC: nét sáng mảnh + bóng tối ngay dưới
  [0.36, 0.68, 0.97]
    .map(
      (k) =>
        `<path d="${ridge(k)}" stroke="#05090D" stroke-opacity="0.6" stroke-width="2.4" fill="none" transform="translate(0 2)"/>` +
        `<path d="${ridge(k)}" stroke="#B8CCD6" stroke-opacity="${k > 0.9 ? 0.55 : 0.75}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    )
    .join('') +
  // gờ sống lưng = mép trên, có rim light
  `<path d="${smoothPath(TOP.slice(0, -1), false, 0.5)}" stroke="#05090D" stroke-opacity="0.8" stroke-width="1.6" fill="none"/>` +
  `<path d="${smoothPath(TOP.slice(1, -1), false, 0.5)}" transform="translate(0 1.6)" stroke="#CFEAFF" stroke-opacity="0.55" stroke-width="1.6" fill="none"/>` +
  `<path d="${CARA_D}" fill="none" stroke="#05090D" stroke-opacity="0.6" stroke-width="1.2"/>`;

const shadowCard = `<ellipse cx="330" cy="352" rx="250" ry="12" fill="#000" opacity="0.18" filter="${u.url('blur8')}"/>`;

const art: CreatureArt = {
  id: ID,
  viewBox: [VW, VH],
  defs,
  lengthUnits: 614, // chóp mai (36) → chóp mỏ (650)
  spineY: 180,
  animation: 'turtle',
  cycleHz: 0.32,
  bendAmp: 0,
  // rùa lớn nhất thế giới (~2 m) – giới hạn để không che kín màn hình
  displayLengthPx: 300,
  cardDetailLevel: 'hi',
  layers: [
    { name: 'shadow', role: 'detail', bend: false, z: 'back', cardOnly: true, pivot: [330, 352], svg: shadowCard },
    { name: 'flipperFrontFar', role: 'flipper', bend: false, z: 'back', pivot: FF_PIVOT, anim: { type: 'rotate', amp: 0.34, phase: 0.25 }, svg: frontFar },
    { name: 'flipperHindFar', role: 'flipper', bend: false, z: 'back', pivot: HF_PIVOT, anim: { type: 'rotate', amp: 0.12, phase: Math.PI / 2 + 0.4 }, svg: hindFar },
    { name: 'neck', role: 'detail', bend: false, z: 'back', pivot: [500, 180], anim: { type: 'rotate', amp: 0.02, phase: 1.1 }, svg: neck },
    { name: 'head', role: 'detail', bend: false, z: 'back', pivot: [520, 176], anim: { type: 'rotate', amp: 0.03, phase: 1.1 }, svg: head },
    { name: 'flipperHindNear', role: 'flipper', bend: false, z: 'back', pivot: HN_PIVOT, anim: { type: 'rotate', amp: 0.16, phase: Math.PI / 2 }, svg: hindNear },
    { name: 'shell', role: 'body', svg: shell },
    { name: 'flipperFrontNear', role: 'flipper', bend: false, z: 'front', pivot: FN_PIVOT, anim: { type: 'rotate', amp: 0.36 }, svg: frontNear },
  ],
};

export default art;
