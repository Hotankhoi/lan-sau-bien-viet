/**
 * Ốc anh vũ – Nautilus pompilius (Vùng khơi xa, Tầng 3 – sườn rạn sâu)
 * Tham khảo: references/oc_anh_vu (Wikimedia, chỉ để nhìn). Đặc điểm phải nhận ra ngay:
 *  - vỏ xoắn ốc LOGARIT tròn trơn láng, vòng xoắn cuối ôm kín các vòng trong (rốn vỏ khép);
 *  - nền trắng kem, các SỌC LỬA nâu cam uốn lượn chạy ngang vòng xoắn, tỏa từ rốn ra mép bụng; phần vỏ gần miệng
 *    (mới mọc) trắng trơn; quanh rốn có lớp xà cừ/vôi sẫm với các vệt đen tỏa ra;
 *  - mũ trùm (hood) da nâu cam lấm tấm chấm trắng che phía trên miệng vỏ;
 *  - mắt to tròn màu xám trắng với đồng tử "lỗ kim" (mắt không có thủy tinh thể);
 *  - vài chục xúc tu mảnh, ngắn, trắng ngà chìa ra phía trước.
 * Vẽ quay đầu (mũ + xúc tu) sang phải. Bơi phản lực: nhấp nhô chậm.
 */
import type { CreatureArt } from '../contract';
import { makeIds, linear, radial, blurFilter, smoothPath, rng, scatterSpots, organicTexture } from '../style-bible';

const ID = 'oc_anh_vu';
const u = makeIds(ID);
type P = [number, number];
const f = (n: number) => n.toFixed(1);

const VW = 560;
const VH = 420;

// ---------------------------------------------------------------------
// XOẮN ỐC LOGARIT: r(φ) = R·e^{b(φ-φe)}, φ tăng = xoắn ngược chiều kim đồng hồ trên màn hình
// ---------------------------------------------------------------------
const C: P = [224, 196]; // rốn vỏ (tâm xoắn)
const R = 184; // bán kính mép bụng tại miệng vỏ
// nhìn ngang, vòng sau lớn gấp ~2,6 vòng trước (vỏ gần tròn như ảnh tham khảo)
const B = Math.log(2.6) / (Math.PI * 2);
// tia miệng vỏ chúc xuống hơi lệch trái → miệng vỏ (theo hướng xoắn) mở ra PHÍA TRƯỚC (bên phải)
const PHI_E = (-100 * Math.PI) / 180;
const rAt = (phi: number) => R * Math.exp(B * (phi - PHI_E));
const pt = (phi: number, r: number): P => [C[0] + r * Math.cos(phi), C[1] - r * Math.sin(phi)];
const spiral = (phi: number) => pt(phi, rAt(phi));

// viền vỏ: vòng cuối từ φe-2π tới φe, rồi khép theo mép miệng (tia φe từ ngoài vào vòng trước)
const SHELL_PTS: P[] = [];
for (let i = 0; i <= 120; i++) SHELL_PTS.push(spiral(PHI_E - Math.PI * 2 + (Math.PI * 2 * i) / 120));
const INNER_AT_APERTURE = pt(PHI_E, rAt(PHI_E - Math.PI * 2));
const OUTER_AT_APERTURE = spiral(PHI_E);
const SHELL_D = smoothPath(SHELL_PTS, false, 0.5) + `L${f(INNER_AT_APERTURE[0])} ${f(INNER_AT_APERTURE[1])}Z`;

/** điểm trên sườn vòng cuối ở góc φ, k: 0 = rốn vỏ (vòng cuối ôm kín các vòng trong) → 1 = mép bụng ngoài */
const R_UMB = 9;
function onWhorl(phi: number, k: number): P {
  return pt(phi, R_UMB + (rAt(phi) - R_UMB) * k);
}

// ---------------------------------------------------------------------
// SỌC LỬA: dải uốn lượn ngang vòng xoắn; bỏ trống ~0,95 rad cuối gần miệng (vỏ mới trắng)
// ---------------------------------------------------------------------
function flames(): string {
  const r = rng(29);
  let s = '';
  const start = PHI_E - Math.PI * 2 + 0.05;
  const end = PHI_E - 0.95;
  let phi = start;
  let i = 0;
  while (phi < end) {
    const step = 0.2 + r() * 0.1;
    const w = 0.055 + r() * 0.035; // bề rộng góc của dải
    const reach = 0.55 + r() * 0.4; // dải chạy từ rốn ra tới đâu (một số dải ngắn)
    const wav = 0.08 + r() * 0.06;
    const L: P[] = [];
    const T: P[] = [];
    const N = 14;
    for (let j = 0; j <= N; j++) {
      const k = (j / N) * reach;
      // uốn hình chữ S nhẹ, nghiêng về phía miệng vỏ ở mép bụng
      const off = Math.sin(k * Math.PI * 1.3) * wav + k * 0.12;
      if (k < 0.12) continue; // để trống quanh rốn (lớp vôi sẫm)
      const taper = w * (0.45 + 0.55 * Math.sin(Math.min(1, (j / N) * 1.2) * Math.PI * 0.5)) * (j === N ? 0.25 : 1);
      L.push(onWhorl(phi + off - taper, k));
      T.push(onWhorl(phi + off + taper, k));
    }
    const fade = 1 - Math.max(0, (phi - (end - 1.2)) / 1.2) * 0.7; // nhạt dần về phía miệng
    const col = r() < 0.5 ? '#B34E22' : '#9C3F1C';
    s += `<path d="${smoothPath([...L, ...T.reverse()], true, 0.5)}" fill="${col}" fill-opacity="${(0.82 * fade).toFixed(2)}"/>`;
    // viền nhòe cho dải (sắc tố loang)
    if (i % 2 === 0) s += `<path d="${smoothPath(L, false, 0.5)}" stroke="#C9773F" stroke-opacity="${(0.35 * fade).toFixed(2)}" stroke-width="2" fill="none"/>`;
    phi += step;
    i++;
  }
  return s;
}

// ---------------------------------------------------------------------
// THÂN MỀM: mũ trùm, mắt, xúc tu (chìa ra khỏi miệng vỏ về bên phải)
// ---------------------------------------------------------------------
// mũ trùm: tựa lên mép bụng của vòng trước (cung trên của miệng vỏ), nhô ra phía trước
const HOOD_D = smoothPath(
  [
    [206, 262],
    [242, 262],
    [272, 248],
    [290, 226],
    [300, 202],
    [334, 196],
    [376, 206],
    [414, 226],
    [436, 250],
    [418, 262],
    [376, 266],
    [328, 272],
    [280, 280],
    [236, 284],
  ],
  true,
  0.55,
);
// đầu & bao xúc tu dưới mũ, lấp kín miệng vỏ
const ARMS_BASE_D = smoothPath(
  [
    [206, 280],
    [272, 284],
    [338, 278],
    [404, 264],
    [436, 268],
    [444, 300],
    [428, 332],
    [380, 352],
    [310, 360],
    [246, 362],
    [200, 364],
    [202, 322],
  ],
  true,
  0.55,
);
const EYE_C: P = [292, 308];
const TENT_ROOT_RAW: P = [430, 300];
// mốc gắn thân mềm = mép trong miệng vỏ; thu nhỏ để thân nằm gọn trong miệng vỏ như ảnh thật
const BODY_K = 0.8;
const BODY_ANCHOR: P = [206, 262];
const BODY_AT: P = [INNER_AT_APERTURE[0] + 2, INNER_AT_APERTURE[1] - 2];
const BODY_T = `translate(${f(BODY_AT[0])} ${f(BODY_AT[1])}) scale(${BODY_K}) translate(${-BODY_ANCHOR[0]} ${-BODY_ANCHOR[1]})`;
const bodyPt = (p: P): P => [BODY_AT[0] + (p[0] - BODY_ANCHOR[0]) * BODY_K, BODY_AT[1] + (p[1] - BODY_ANCHOR[1]) * BODY_K];
const TENT_ROOT = bodyPt(TENT_ROOT_RAW);
const wrapBody = (svg: string) => `<g transform="${BODY_T}">${svg}</g>`;

function tentacles(far: boolean): string {
  const r = rng(far ? 61 : 67);
  const n = far ? 22 : 30;
  let s = '';
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // gốc rải dọc mép trước của đầu (dưới mũ), xòe thành hình quạt
    const by = 266 + t * 76 + (r() - 0.5) * 5;
    const bx = 420 + Math.sin(t * Math.PI) * 20 + (r() - 0.5) * 6;
    const ang = -0.42 + t * 1.25 + (r() - 0.5) * 0.16 + (far ? -0.1 : 0);
    const len = (far ? 34 : 40) + r() * (far ? 40 : 56);
    const curl = (r() - 0.5) * 0.9;
    const c1: P = [bx + Math.cos(ang) * len * 0.5, by + Math.sin(ang) * len * 0.5];
    const tip: P = [bx + Math.cos(ang + curl * 0.6) * len, by + Math.sin(ang + curl * 0.6) * len];
    const wBase = far ? 2.4 : 3;
    const col = far ? '#B9AC9A' : '#F1E9DC';
    const d = `M${f(bx)} ${f(by)}Q${f(c1[0])} ${f(c1[1])} ${f(tip[0])} ${f(tip[1])}`;
    s += `<path d="${d}" stroke="#5E5246" stroke-opacity="0.45" stroke-width="${wBase + 1.2}" stroke-linecap="round" fill="none"/>`;
    s += `<path d="${d}" stroke="${col}" stroke-width="${wBase}" stroke-linecap="round" fill="none"/>`;
    // đầu xúc tu thon mảnh, hơi cong
    const a2 = ang + curl;
    const tip2: P = [tip[0] + Math.cos(a2) * 9, tip[1] + Math.sin(a2) * 9];
    s += `<path d="M${f(tip[0])} ${f(tip[1])}L${f(tip2[0])} ${f(tip2[1])}" stroke="${col}" stroke-width="${(wBase * 0.45).toFixed(1)}" stroke-linecap="round"/>`;
    if (!far && i % 3 === 0) s += `<path d="${d}" stroke="#B8A893" stroke-width="${wBase * 0.5}" stroke-dasharray="1.2 3.2" fill="none" stroke-opacity="0.6"/>`;
  }
  return s;
}

// ---------------------------------------------------------------------
// DEFS
// ---------------------------------------------------------------------
const defs =
  // khối cầu của vỏ: sáng trên-trái, tối dưới-phải
  radial(u('shell'), [
    [0, '#FFFBF2'],
    [0.55, '#F2E7D5'],
    [0.85, '#D9C7AE'],
    [1, '#A9967D'],
  ], { cx: 0.38, cy: 0.32, r: 0.72 }) +
  radial(u('shade'), [
    [0, '#000000', 0],
    [0.7, '#2B1A0E', 0.05],
    [1, '#2B1A0E', 0.45],
  ], { cx: 0.36, cy: 0.3, r: 0.75 }) +
  radial(u('umb'), [
    [0, '#120B07', 0.95],
    [0.45, '#3B2A1E', 0.75],
    [1, '#6E5A47', 0],
  ]) +
  linear(u('nacre'), [
    [0, '#E9EEF2', 0],
    [0.5, '#DDE6EE', 0.8],
    [1, '#B9C4CE', 0.9],
  ], { x1: 0, y1: 0, x2: 1, y2: 1 }) +
  linear(u('hood'), [
    [0, '#C9773C'],
    [0.55, '#A85A27'],
    [1, '#7A3E19'],
  ]) +
  linear(u('flesh'), [
    [0, '#EFE5D6'],
    [1, '#C9B9A2'],
  ]) +
  radial(u('eye'), [
    [0, '#2A2A2A'],
    [0.14, '#2A2A2A'],
    [0.2, '#D6D2CA'],
    [0.75, '#BEB8AE'],
    [1, '#8C857A'],
  ]) +
  organicTexture(u('leather'), { freq: 0.09, octaves: 3, strength: 0.3, seed: 8 }) +
  blurFilter(u('soft'), 2.2) +
  blurFilter(u('blur6'), 6) +
  `<clipPath id="${u('shellClip')}"><path d="${SHELL_D}"/></clipPath>` +
  `<clipPath id="${u('hoodClip')}"><path d="${HOOD_D}"/></clipPath>` +
  `<clipPath id="${u('armsClip')}"><path d="${ARMS_BASE_D}"/></clipPath>`;

// ---------------------------------------------------------------------
// LỚP
// ---------------------------------------------------------------------
const shellSvg = (() => {
  // vân sinh trưởng mảnh theo bán kính (đường tăng trưởng song song mép miệng)
  let growth = '';
  for (let i = 0; i < 60; i++) {
    const phi = PHI_E - Math.PI * 2 + 0.08 + (i / 60) * (Math.PI * 2 - 0.12);
    const a = onWhorl(phi, 0.02);
    const b = onWhorl(phi + 0.05, 1);
    growth += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
  }
  // vệt đen tỏa quanh rốn (lớp vôi sẫm)
  const r = rng(13);
  let streaks = '';
  for (let i = 0; i < 16; i++) {
    const phi = PHI_E - 0.2 - r() * 3.4;
    const a = onWhorl(phi, 0.02);
    const len = 0.1 + r() * 0.22;
    const b = onWhorl(phi + 0.1 + r() * 0.1, len);
    const mid = onWhorl(phi + 0.04, len * 0.5);
    streaks += `<path d="M${f(a[0])} ${f(a[1])}Q${f(mid[0] + (r() - 0.5) * 8)} ${f(mid[1])} ${f(b[0])} ${f(b[1])}" stroke="#0E0906" stroke-opacity="${(0.5 + r() * 0.4).toFixed(2)}" stroke-width="${(1 + r() * 2.2).toFixed(1)}" stroke-linecap="round" fill="none"/>`;
  }
  return (
    `<path d="${SHELL_D}" fill="${u.url('shell')}"/>` +
    `<g clip-path="${u.url('shellClip')}">` +
    flames() +
    `<path d="${growth}" stroke="#7A6248" stroke-opacity="0.12" stroke-width="0.9" fill="none"/>` +
    // vùng rốn sẫm + vệt đen
    `<circle cx="${C[0]}" cy="${C[1]}" r="30" fill="${u.url('umb')}"/>` +
    `<circle cx="${C[0]}" cy="${C[1]}" r="7" fill="#0C0805" opacity="0.85"/>` +
    streaks +
    // ánh xà cừ bạc dọc mép miệng vỏ
    `<path d="M${f(OUTER_AT_APERTURE[0])} ${f(OUTER_AT_APERTURE[1])}L${f(INNER_AT_APERTURE[0])} ${f(INNER_AT_APERTURE[1])}" stroke="${u.url('nacre')}" stroke-width="22" opacity="0.6" filter="${u.url('blur6')}"/>` +
    // khối cầu + bóng loáng
    `<path d="${SHELL_D}" fill="${u.url('shade')}"/>` +
    `<ellipse cx="${C[0] - 60}" cy="${C[1] - 92}" rx="70" ry="26" transform="rotate(-28 ${C[0] - 60} ${C[1] - 92})" fill="#FFFFFF" opacity="0.4" filter="${u.url('blur6')}"/>` +
    `<ellipse cx="${C[0] - 74}" cy="${C[1] - 98}" rx="26" ry="8" transform="rotate(-28 ${C[0] - 74} ${C[1] - 98})" fill="#FFFFFF" opacity="0.55" filter="${u.url('soft')}"/>` +
    `</g>` +
    `<path d="${SHELL_D}" fill="none" stroke="#4A3828" stroke-opacity="0.75" stroke-width="1.6"/>` +
    // rim light trên mép lưng vỏ
    `<path d="${smoothPath(Array.from({ length: 30 }, (_, i) => spiral(PHI_E - Math.PI * 1.55 + (i / 29) * 1.3)), false, 0.5)}" stroke="#E8FBFF" stroke-opacity="0.6" stroke-width="2" fill="none"/>`
  );
})();

const armsBase =
  `<path d="${ARMS_BASE_D}" fill="${u.url('flesh')}"/>` +
  `<g clip-path="${u.url('armsClip')}">` +
  // các bao xúc tu xếp lớp (nếp da trắng)
  [290, 306, 322, 338].map((y, i) => `<path d="M${318 + i * 4} ${y + 4}Q${380} ${y + 8} ${440 - i * 6} ${y - 8}" stroke="#9E8C76" stroke-opacity="0.5" stroke-width="1.6" fill="none"/>`).join('') +
  `<ellipse cx="330" cy="352" rx="110" ry="12" fill="#6E5C49" opacity="0.4" filter="${u.url('soft')}"/>` +
  // bóng của mũ đổ xuống đầu
  `<path d="M206 282Q320 290 440 266" stroke="#5A3A20" stroke-opacity="0.45" stroke-width="10" fill="none" filter="${u.url('soft')}"/>` +
  `</g>` +
  `<path d="${ARMS_BASE_D}" fill="none" stroke="#6A5844" stroke-opacity="0.7" stroke-width="1.3"/>`;

const hood =
  `<path d="${HOOD_D}" fill="${u.url('hood')}"/>` +
  `<g clip-path="${u.url('hoodClip')}">` +
  `<rect x="200" y="190" width="245" height="100" fill="#A85A27" filter="${u.url('leather')}" opacity="0.5"/>` +
  scatterSpots(17, { x: 210, y: 196, w: 226, h: 86 }, { count: 80, rMin: 1.2, rMax: 3, color: '#F6EFE4', opacity: 0.9, minGap: 7 }) +
  // mép dưới mũ dày, sáng (viền da gập)
  `<path d="M214 280Q330 272 436 252" stroke="#F0DDC4" stroke-opacity="0.55" stroke-width="5" fill="none" filter="${u.url('soft')}"/>` +
  `<ellipse cx="350" cy="212" rx="70" ry="10" transform="rotate(14 350 212)" fill="#FFE2BE" opacity="0.25" filter="${u.url('soft')}"/>` +
  `</g>` +
  `<path d="${HOOD_D}" fill="none" stroke="#4E2810" stroke-opacity="0.8" stroke-width="1.5"/>`;

const eyeSvg =
  `<ellipse cx="${EYE_C[0] + 2}" cy="${EYE_C[1] + 3}" rx="22" ry="20" fill="#5D4C3A" opacity="0.45" filter="${u.url('soft')}"/>` +
  `<circle cx="${EYE_C[0]}" cy="${EYE_C[1]}" r="18" fill="#E3DDD3"/>` +
  `<circle cx="${EYE_C[0]}" cy="${EYE_C[1]}" r="14" fill="${u.url('eye')}"/>` +
  // đồng tử lỗ kim + rãnh dọc
  `<path d="M${EYE_C[0]} ${EYE_C[1] - 5}L${EYE_C[0]} ${EYE_C[1] + 6}" stroke="#151515" stroke-width="1.4" stroke-linecap="round"/>` +
  `<circle cx="${EYE_C[0]}" cy="${EYE_C[1]}" r="2.4" fill="#0A0A0A"/>` +
  `<circle cx="${EYE_C[0]}" cy="${EYE_C[1]}" r="18" fill="none" stroke="#7D6E5D" stroke-width="1.4"/>` +
  `<ellipse cx="${EYE_C[0] - 6}" cy="${EYE_C[1] - 7}" rx="5" ry="3" fill="#FFFFFF" opacity="0.7"/>`;

const art: CreatureArt = {
  id: ID,
  viewBox: [VW, VH],
  defs,
  lengthUnits: 420, // mép sau vỏ → chóp xúc tu
  displayLengthPx: 120, // dài thật ~20 cm (≈68 px) quá nhỏ để thấy sọc lửa và mũ trùm
  spineY: 230,
  animation: 'cephalopod',
  cycleHz: 0.5,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  layers: [
    { name: 'tentaclesBack', role: 'tentacle', bend: false, z: 'back', pivot: TENT_ROOT, anim: { type: 'rotate', amp: 0.07, speed: 1.4, phase: 1.2 }, svg: wrapBody(tentacles(true)) },
    { name: 'shell', role: 'body', svg: shellSvg },
    { name: 'arms', role: 'detail', svg: wrapBody(armsBase) },
    { name: 'hood', role: 'detail', bend: false, pivot: bodyPt([260, 250]), anim: { type: 'rotate', amp: 0.015, phase: 0.6 }, svg: wrapBody(hood) },
    { name: 'eye', role: 'eye', svg: wrapBody(eyeSvg) },
    { name: 'tentaclesFront', role: 'tentacle', bend: false, z: 'front', pivot: TENT_ROOT, anim: { type: 'rotate', amp: 0.09, speed: 1.4 }, svg: wrapBody(tentacles(false)) },
  ],
};

export default art;
