/**
 * Hải sâm vú – Holothuria whitmaei (Biển miền Trung, nền cát giữa rạn)
 * Tham khảo: references/hai_sam_vu (Wikimedia, chỉ để nhìn). Ảnh category lẫn cả hải sâm vú trắng nên vẽ theo `visual`:
 *  - thân to, chắc, hình trụ hơi dẹt; lưng vồng thấp, đế bụng phẳng áp cát (khác hải sâm đen dài & mảnh hơn);
 *  - da ĐEN TUYỀN mịn như nhung (vân nhiễu rất mịn + gai thịt li ti), rim light xanh lam ở mép lưng để thấy khối;
 *  - đặc điểm nhận dạng: hàng NÚM LỒI TO ("vú") dọc hai bên hông, sát mép đế – mỗi núm có khối sáng/tối riêng;
 *  - bụng loang trắng xám; lưng phủ một ít cát trắng loang lổ;
 *  - miệng ở đầu phải, hướng xuống, vòng xúc tu hình khiên nhỏ (lớp riêng quét cát chậm); hậu môn ở chóp đuôi.
 * Thẻ Sổ tay: nền cát + bóng đổ (cardOnly).
 */
import type { CreatureArt } from '../contract';
import { makeIds, linear, radial, blurFilter, organicTexture, smoothPath, rng, scatterSpots } from '../style-bible';

const ID = 'hai_sam_vu';
const u = makeIds(ID);
type P = [number, number];
const f = (n: number) => n.toFixed(1);

const VW = 620;
const VH = 210;
const GROUND = 168;

// ---------------------------------------------------------------------
// HÌNH THÂN: lưng vồng (trái = đuôi, phải = đầu), đế phẳng trên cát
// ---------------------------------------------------------------------
const TOP: P[] = [
  [30, 138],
  [44, 108],
  [84, 86],
  [150, 74],
  [212, 70],
  [268, 64],
  [330, 66],
  [392, 61],
  [452, 68],
  [510, 82],
  [552, 102],
  [578, 126],
];
const BOTTOM: P[] = [
  [590, 146],
  [574, 160],
  [536, 166],
  [450, 168],
  [320, 169],
  [190, 168],
  [100, 166],
  [56, 160],
  [36, 150],
];
const BODY_D = smoothPath([...TOP, ...BOTTOM], true, 0.55);
const DORSAL_LINE = smoothPath(TOP.slice(1, -1), false, 0.55);

/** y của mép lưng tại x (nội suy tuyến tính trên TOP) */
function topAt(x: number): number {
  for (let i = 1; i < TOP.length; i++) {
    if (x <= TOP[i][0]) {
      const k = (x - TOP[i - 1][0]) / (TOP[i][0] - TOP[i - 1][0]);
      return TOP[i - 1][1] + (TOP[i][1] - TOP[i - 1][1]) * k;
    }
  }
  return TOP[TOP.length - 1][1];
}

// Núm lồi ("vú") dọc hông dưới – to dần về giữa thân, hàng hơi cong theo đế
// (đặt sát mép đế, phần dưới núm chạm cát; xoay nhẹ theo độ cong thân)
const TEATS: { x: number; y: number; rx: number; ry: number; rot: number }[] = [
  { x: 86, y: 154, rx: 17, ry: 13, rot: -12 },
  { x: 146, y: 156, rx: 22, ry: 15, rot: -6 },
  { x: 214, y: 157, rx: 25, ry: 16.5, rot: -3 },
  { x: 288, y: 158, rx: 26, ry: 17, rot: 0 },
  { x: 364, y: 158, rx: 26, ry: 17, rot: 2 },
  { x: 438, y: 157, rx: 24, ry: 16, rot: 5 },
  { x: 506, y: 155, rx: 20, ry: 14, rot: 10 },
];

const MOUTH: P = [574, 150];

// ---------------------------------------------------------------------
// DEFS
// ---------------------------------------------------------------------
const defs =
  linear(u('skin'), [
    [0, '#2A3038'],
    [0.18, '#15181D'],
    [0.62, '#0B0D10'],
    [0.86, '#191B1F'],
    [1, '#55534E'],
  ]) +
  // bụng loang trắng xám
  linear(u('belly'), [
    [0, '#C9C2B4', 0],
    [0.55, '#B9B2A4', 0.0],
    [0.8, '#B5AE9F', 0.55],
    [1, '#D9D3C6', 0.9],
  ]) +
  // núm lì như nhung: tương phản thấp, sáng nhẹ phía trên (nắng), tối ở chân
  radial(u('teat'), [
    [0, '#2B3037'],
    [0.5, '#1A1D22'],
    [0.85, '#0F1114'],
    [1, '#0A0B0D'],
  ], { cx: 0.42, cy: 0.28, r: 0.8 }) +
  linear(u('rim'), [
    [0, '#9FD6FF', 0],
    [0.15, '#BFE6FF', 0.75],
    [0.85, '#BFE6FF', 0.75],
    [1, '#9FD6FF', 0],
  ], { x2: 1, y2: 0 }) +
  radial(u('shadow'), [
    [0, '#000000', 0.5],
    [1, '#000000', 0],
  ]) +
  linear(u('sand'), [
    [0, '#E9DFC6', 0],
    [0.35, '#E3D7BA', 0.9],
    [1, '#CDBF9C', 1],
  ]) +
  organicTexture(u('velvet'), { freq: 0.32, octaves: 2, strength: 0.32, seed: 11 }) +
  blurFilter(u('soft'), 2.2) +
  blurFilter(u('blur6'), 6) +
  `<clipPath id="${u('bodyClip')}"><path d="${BODY_D}"/></clipPath>`;

// ---------------------------------------------------------------------
// LỚP
// ---------------------------------------------------------------------
const sandBack =
  `<path d="M0 ${GROUND - 6}Q160 ${GROUND - 12} 320 ${GROUND - 7}T${VW} ${GROUND - 8}V${VH}H0Z" fill="${u.url('sand')}"/>` +
  (() => {
    const r = rng(41);
    let s = '';
    for (let i = 0; i < 110; i++) {
      const x = r() * VW;
      const y = GROUND - 4 + r() * (VH - GROUND + 4);
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${(0.6 + r() * 1.3).toFixed(2)}" fill="${r() < 0.55 ? '#F7F1E2' : '#A99D7E'}" opacity="0.8"/>`;
    }
    return s;
  })();

const shadow = `<ellipse cx="318" cy="${GROUND + 2}" rx="300" ry="14" fill="${u.url('shadow')}"/>`;

const tentacles = (far: boolean) => {
  // xúc tu khiên: cuống ngắn + đĩa dẹt có khía
  const r = rng(far ? 7 : 9);
  const n = far ? 5 : 7;
  let s = `<g opacity="${far ? 0.75 : 1}">`;
  for (let i = 0; i < n; i++) {
    const a = (-0.2 + (i / (n - 1)) * 1.55) + (far ? 0.12 : 0);
    const len = 10 + r() * 5;
    const bx = MOUTH[0] + Math.cos(a) * 3;
    const by = MOUTH[1] + Math.sin(a) * 3;
    const tx = MOUTH[0] + Math.cos(a) * len;
    const ty = MOUTH[1] + Math.sin(a) * len;
    const col = far ? '#2D3138' : '#3B4048';
    s += `<path d="M${f(bx)} ${f(by)}L${f(tx)} ${f(ty)}" stroke="${col}" stroke-width="2.6" stroke-linecap="round"/>`;
    s += `<ellipse cx="${f(tx)}" cy="${f(ty)}" rx="4.2" ry="2.4" transform="rotate(${f((a * 180) / Math.PI + 90)} ${f(tx)} ${f(ty)})" fill="${far ? '#3A3F47' : '#565D67'}" stroke="#15181C" stroke-width="0.7"/>`;
    s += `<path d="M${f(tx - 2)} ${f(ty)}h4" stroke="#1A1D22" stroke-width="0.6" transform="rotate(${f((a * 180) / Math.PI + 90)} ${f(tx)} ${f(ty)})"/>`;
  }
  return s + '</g>';
};

const skin =
  `<path d="${BODY_D}" fill="${u.url('skin')}"/>` +
  `<g clip-path="${u.url('bodyClip')}">` +
  // da nhung: vân nhiễu mịn
  `<rect x="0" y="40" width="${VW}" height="150" fill="#1C2026" filter="${u.url('velvet')}" opacity="0.55"/>` +
  // gai thịt li ti rải ngẫu nhiên (không xếp lưới)
  scatterSpots(5, { x: 30, y: 60, w: 560, h: 100 }, { count: 520, rMin: 0.5, rMax: 1.1, color: '#3E4650', opacity: 0.55, minGap: 3.2 }) +
  scatterSpots(6, { x: 30, y: 60, w: 560, h: 100 }, { count: 160, rMin: 0.6, rMax: 1.2, color: '#05060a', opacity: 0.6, minGap: 5 }) +
  // bụng loang trắng thành mảng (chỉ lộ giữa các núm)
  `<g filter="${u.url('blur6')}" fill="#BDB6A8" opacity="0.55">` +
  `<ellipse cx="118" cy="168" rx="20" ry="7"/><ellipse cx="252" cy="170" rx="26" ry="6"/><ellipse cx="402" cy="170" rx="24" ry="6"/><ellipse cx="545" cy="164" rx="22" ry="8"/>` +
  `</g>` +
  // khối tròn: tối dần về hai đầu
  `<ellipse cx="40" cy="140" rx="34" ry="40" fill="#000" opacity="0.4" filter="${u.url('blur6')}"/>` +
  `<ellipse cx="590" cy="132" rx="26" ry="38" fill="#000" opacity="0.3" filter="${u.url('blur6')}"/>` +
  `</g>`;

// cát trắng phủ lưng loang lổ (nhẹ hơn hải sâm đen nhiều)
const sandCoat = (() => {
  const r = rng(77);
  let s = `<g clip-path="${u.url('bodyClip')}">`;
  const patches: [number, number, number][] = [
    [140, 0, 30],
    [250, 0, 42],
    [380, 0, 34],
    [470, 0, 24],
  ];
  for (const [cx, , w] of patches) {
    const cy = topAt(cx) + 10;
    s += `<ellipse cx="${cx}" cy="${f(cy)}" rx="${w}" ry="8" fill="#D9CFB6" opacity="0.18" filter="${u.url('soft')}"/>`;
    for (let i = 0; i < 26; i++) {
      const x = cx + (r() - 0.5) * w * 2;
      const y = topAt(x) + 3 + r() * 14;
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${(0.5 + r() * 1.1).toFixed(2)}" fill="${r() < 0.7 ? '#EFE7D2' : '#B9AE90'}" opacity="${(0.55 + r() * 0.4).toFixed(2)}"/>`;
    }
  }
  return s + '</g>';
})();

/** một núm: khối lì, mép trên hòa vào thân (không viền), chân núm chạm cát; hơi méo cho tự nhiên */
const teat = (t: (typeof TEATS)[number], i: number) => {
  const r = rng(300 + i);
  const w = t.rx;
  const hh = t.ry;
  // hình núm: vòm tròn hơi xệ về phía dưới
  const pts: P[] = [];
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2;
    const sag = Math.sin(a) > 0 ? 1.08 : 0.94;
    const jit = 1 + (r() - 0.5) * 0.08;
    pts.push([Math.cos(a) * w * jit, Math.sin(a) * hh * sag * jit]);
  }
  const d = smoothPath(pts, true, 0.6);
  const tr = `translate(${t.x} ${t.y}) rotate(${t.rot})`;
  return (
    `<g transform="${tr}">` +
    // bóng hằn dưới chân núm
    `<ellipse cx="2" cy="${f(hh * 0.62)}" rx="${f(w * 1.05)}" ry="${f(hh * 0.45)}" fill="#000" opacity="0.6" filter="${u.url('soft')}"/>` +
    `<path d="${d}" fill="${u.url('teat')}"/>` +
    `<path d="${d}" fill="#1C2026" filter="${u.url('velvet')}" opacity="0.45"/>` +
    // nếp da tối ôm nửa dưới núm (tách khối khỏi thân), nửa trên hòa vào thân
    `<path d="M${f(-w * 0.95)} ${f(hh * 0.1)}Q${f(-w * 0.6)} ${f(hh * 1.0)} 0 ${f(hh * 1.02)}Q${f(w * 0.6)} ${f(hh * 1.0)} ${f(w * 0.95)} ${f(hh * 0.1)}" fill="none" stroke="#040506" stroke-opacity="0.75" stroke-width="1.4"/>` +
    // ánh sáng mờ trên vòm (nắng xuyên nước), không bóng loáng
    `<ellipse cx="${f(-w * 0.12)}" cy="${f(-hh * 0.45)}" rx="${f(w * 0.55)}" ry="${f(hh * 0.3)}" fill="#7F98AE" opacity="0.16" filter="${u.url('soft')}"/>` +
    scatterSpots(400 + i, { x: -w * 0.8, y: -hh * 0.7, w: w * 1.6, h: hh * 1.3 }, { count: 12, rMin: 0.5, rMax: 1, color: '#46505B', opacity: 0.6, minGap: 3 }) +
    `</g>`
  );
};
const teats = TEATS.map(teat).join('');

const finish =
  `<g fill="none">` +
  `<path d="${BODY_D}" stroke="#050607" stroke-opacity="0.8" stroke-width="1.6"/>` +
  `<g clip-path="${u.url('bodyClip')}"><path d="${DORSAL_LINE}" transform="translate(0 5)" stroke="#9FD3FF" stroke-opacity="0.28" stroke-width="6" filter="${u.url('soft')}"/></g>` +
  `<path d="${DORSAL_LINE}" transform="translate(0 1.2)" stroke="${u.url('rim')}" stroke-width="1.6"/>` +
  `</g>` +
  // hậu môn ở chóp đuôi
  `<ellipse cx="38" cy="138" rx="2.6" ry="4" fill="#020304"/>` +
  `<path d="M36 132l-3-3M36 144l-3 3M42 132l2-3M42 144l2 3" stroke="#4A5562" stroke-width="0.8" stroke-opacity="0.6"/>` +
  // cổ miệng
  `<ellipse cx="${MOUTH[0]}" cy="${MOUTH[1]}" rx="6" ry="7" fill="#030405" opacity="0.8" filter="${u.url('soft')}"/>`;

const art: CreatureArt = {
  id: ID,
  viewBox: [VW, VH],
  defs,
  lengthUnits: 556,
  spineY: 118,
  // như hải sâm đen: "thở"/nhu động rất chậm thay vì đứng cứng như đá
  animation: 'eel',
  cycleHz: 0.12,
  bendAmp: 2,
  cardDetailLevel: 'hi',
  layers: [
    { name: 'sand', role: 'detail', bend: false, z: 'back', cardOnly: true, pivot: [310, 180], svg: sandBack },
    { name: 'shadow', role: 'detail', bend: false, z: 'back', cardOnly: true, pivot: [310, 170], svg: shadow },
    { name: 'tentaclesBack', role: 'tentacle', bend: false, z: 'back', pivot: MOUTH, anim: { type: 'rotate', amp: 0.16, speed: 2.2, phase: 1.7 }, svg: tentacles(true) },
    { name: 'skin', role: 'body', svg: skin },
    { name: 'sandCoat', role: 'pattern', svg: sandCoat },
    { name: 'teats', role: 'pattern', svg: teats },
    { name: 'finish', role: 'detail', svg: finish },
    { name: 'tentaclesFront', role: 'tentacle', bend: false, z: 'front', pivot: MOUTH, anim: { type: 'rotate', amp: 0.13, speed: 2.2 }, svg: tentacles(false) },
  ],
};

export default art;
