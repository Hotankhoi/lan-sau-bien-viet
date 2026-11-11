/**
 * Hải sâm đen – Holothuria atra (Biển miền Nam)
 * Thân hình trụ mềm như dưa chuột, đế bụng phẳng áp cát, lưng vồng tròn. Dựng bằng mô hình mặt trụ quanh
 * một đường tâm cong (t dọc thân: 0 = đuôi/hậu môn → 1 = đầu/miệng; θ quanh trục: 0 = mép lưng nhìn thấy,
 * π = mép đế; v = cos θ):
 *  - da đen tuyền ánh ướt xanh lam (tô theo dải v), rim light xanh lam ở mép lưng để thấy khối trên nền nước;
 *  - lớp cát xám phủ lưng & hông (mask) với các đốm/vòng HỞ lộ da đen xếp thành 2 hàng dọc lưng
 *    (hàng trên bị co ngắn vì nằm gần mép lưng – nhìn ngang hơi từ trên xuống), mép đốm lởm chởm có gờ cát sáng;
 *  - hông dưới & đế ít cát, lộ da đen bóng có gai thịt nhỏ li ti;
 *  - chân ống ở đế (uốn theo thân), vòng xúc tu hình khiên ở miệng (lớp riêng quét cát chậm);
 * Thẻ Sổ tay: nền cát trắng miền Nam + bóng đổ + cuộn phân cát sạch sau đuôi (cardOnly).
 */
import type { CreatureArt } from '../contract';
import { makeIds, linear, radial, blurFilter, clip, mix, rng, scatterSpots, organicTexture, smoothPath } from '../style-bible';

const ID = 'hai_sam_den';
const u = makeIds(ID);
type P = [number, number];
const f = (n: number) => n.toFixed(1);
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const sm = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const interp = (tab: P[], x: number): number => {
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) {
    if (x <= tab[i][0]) {
      const k = (x - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]);
      return tab[i - 1][1] + (tab[i][1] - tab[i - 1][1]) * k;
    }
  }
  return tab[tab.length - 1][1];
};
const poly = (pts: P[], close = true) => 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + (close ? 'Z' : '');

const VW = 640;
const VH = 190;
const GROUND = 150; // mặt cát (đế bụng nằm phẳng trên đó)

// =====================================================================
// ĐƯỜNG TÂM (Catmull-Rom) + tham số theo độ dài cung
// =====================================================================
const CTRL: P[] = [
  [40, 126],
  [115, 108],
  [210, 96],
  [320, 94],
  [430, 99],
  [522, 110],
  [604, 130],
];
const dense: P[] = [];
{
  const get = (i: number) => CTRL[clamp(i, 0, CTRL.length - 1)];
  for (let i = 0; i < CTRL.length - 1; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    for (let j = 0; j < 48; j++) {
      const t = j / 48;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) =>
        0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      dense.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  dense.push(CTRL[CTRL.length - 1]);
}
const cum: number[] = [0];
for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
const LEN = cum[cum.length - 1];

/** điểm + pháp tuyến "lên" (về phía lưng) tại độ dài cung s */
function at(s: number): { x: number; y: number; nx: number; ny: number } {
  const ss = clamp(s, 0, LEN);
  let i = 1;
  while (i < cum.length - 1 && cum[i] < ss) i++;
  const a = dense[i - 1];
  const b = dense[i];
  const seg = Math.max(1e-6, cum[i] - cum[i - 1]);
  const k = (ss - cum[i - 1]) / seg;
  const tx = (b[0] - a[0]) / seg;
  const ty = (b[1] - a[1]) / seg;
  return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, nx: ty, ny: -tx };
}

// =====================================================================
// BÁN KÍNH: lưng (RT) vồng tròn, đế (RB) phẳng theo mặt cát
// =====================================================================
const RT_TAB: P[] = [
  [0, 31],
  [0.07, 45],
  [0.22, 55],
  [0.38, 58],
  [0.58, 55],
  [0.75, 48],
  [0.86, 40],
  [0.94, 33],
  [1, 26],
];
const RB_TAB: P[] = [
  [0, 24],
  [0.08, 37],
  [0.22, 64],
  [0.78, 64],
  [0.92, 33],
  [1, 22],
];
const CAP_T = 0.072;
const CAP_H = 0.066;
function capK(t: number): number {
  let k = 1;
  if (t < CAP_T) k *= Math.sqrt(Math.max(0, 1 - ((CAP_T - t) / CAP_T) ** 2));
  if (t > 1 - CAP_H) k *= Math.sqrt(Math.max(0, 1 - ((t - (1 - CAP_H)) / CAP_H) ** 2));
  return k;
}
function RT(t: number): number {
  const tc = clamp(t, 0, 1);
  // vài đoạn phồng/thắt nhẹ (nhu động)
  const wob = 1 + 0.045 * Math.sin(tc * Math.PI * 2 * 2.6 + 0.9) * sm(0.05, 0.15, tc) * (1 - sm(0.85, 0.95, tc));
  return interp(RT_TAB, tc) * wob * capK(tc);
}
function RB(t: number): number {
  const tc = clamp(t, 0, 1);
  const p = at(tc * LEN);
  const flat = Math.max(4, GROUND - 0.6 - p.y);
  const a = interp(RB_TAB, tc);
  // min mềm → đế phẳng nhưng bo tròn dần lên hai đầu (không gãy góc)
  const k = 7;
  const h = clamp(0.5 + (0.5 * (flat - a)) / k, 0, 1);
  const m = flat * (1 - h) + a * h - k * h * (1 - h);
  return Math.max(4, m) * capK(tc);
}
function surf(t: number, v: number): P {
  const p = at(clamp(t, 0, 1) * LEN);
  const r = v >= 0 ? RT(t) : RB(t);
  return [p.x + p.nx * r * v, p.y + p.ny * r * v];
}
/** theo góc θ quanh trục (0 = mép lưng, π = mép đế) */
const surfA = (t: number, th: number): P => surf(t, Math.cos(clamp(th, 0, Math.PI)));
function tSeq(t0: number, t1: number, n: number): number[] {
  const out: number[] = [];
  for (let k = 0; k <= n; k++) out.push(t0 + (t1 - t0) * (0.5 - 0.5 * Math.cos((Math.PI * k) / n)));
  return out;
}
const edge = (t0: number, t1: number, v: number, n = 90) => poly(tSeq(t0, t1, n).map((t) => surf(t, v)), false);

const bodyTs = tSeq(0, 1, 260);
const BODY_D = poly([...bodyTs.map((t) => surf(t, 1)), ...bodyTs.slice().reverse().map((t) => surf(t, -1))]);
const BODY_LINE = poly(
  [...bodyTs.slice().reverse().map((t) => surf(t, 1)), ...bodyTs.map((t) => surf(t, -1))],
  true,
);

// =====================================================================
// MÀU
// =====================================================================
const INK = '#04070B';
const hex = (n: number) => '#' + Math.round(n).toString(16).padStart(6, '0');
function pal(tab: P[], v: number): string {
  const vv = clamp(v, -1, 1);
  for (let i = 1; i < tab.length; i++) {
    if (vv <= tab[i][0]) {
      const k = (vv - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]);
      return mix(hex(tab[i - 1][1]), hex(tab[i][1]), k);
    }
  }
  return hex(tab[tab.length - 1][1]);
}
// da đen ướt: ánh xanh lam ở vai lưng, phản quang cát ở mép đế
const PAL_SKIN: P[] = [
  [-1, 0x1e2a35],
  [-0.86, 0x0d1217],
  [-0.5, 0x0a0d11],
  [0, 0x0d1117],
  [0.35, 0x131a22],
  [0.6, 0x1d2a37],
  [0.78, 0x2b3f53],
  [0.9, 0x1c2836],
  [1, 0x111821],
];
// lớp cát xám phủ lưng (đổ khối trụ: sáng ở vai trên, tối dần xuống hông)
const PAL_SAND: P[] = [
  [-1, 0x2a2f31],
  [-0.5, 0x42484a],
  [-0.15, 0x5b6061],
  [0.25, 0x7a7e7c],
  [0.55, 0x939691],
  [0.78, 0x9ea09a],
  [0.92, 0x8a8d89],
  [1, 0x6c7070],
];

function bands(palTab: P[], nb: number, vTop = 1.08, vBot = -1.08): string {
  const ts = tSeq(0, 1, 120);
  let out = '';
  for (let i = 0; i < nb; i++) {
    const va = vTop - ((vTop - vBot) * i) / nb;
    const vb = vTop - ((vTop - vBot) * (i + 1)) / nb - 0.05;
    const top = ts.map((t) => surf(t, va));
    const bot = ts.slice().reverse().map((t) => surf(t, vb));
    out += `<path d="${poly([...top, ...bot])}" fill="${pal(palTab, (va + vb) / 2)}"/>`;
  }
  return out;
}

// =====================================================================
// ĐỐM HỞ (lộ da đen) – 2 hàng dọc lưng + vài đốm lẻ
// =====================================================================
interface Hole {
  t: number;
  th: number;
  r: number;
  d: string;
  pts: P[];
}
function holeShape(tc: number, thc: number, rh: number, seed: number, elong = 1): Hole {
  const r = rng(seed);
  const a = r() * 6.28;
  const b = r() * 6.28;
  const c = r() * 6.28;
  const pts: P[] = [];
  const Rref = Math.max(8, RT(tc));
  const n = 18;
  for (let i = 0; i < n; i++) {
    const ph = (Math.PI * 2 * i) / n;
    const rr = rh * (1 + 0.09 * Math.sin(3 * ph + a) + 0.05 * Math.sin(5 * ph + b) + 0.03 * Math.sin(8 * ph + c));
    const ds = rr * Math.cos(ph) * elong;
    const dth = (rr * Math.sin(ph)) / Rref;
    pts.push(surfA(tc + ds / LEN, thc + dth));
  }
  return { t: tc, th: thc, r: rh, d: smoothPath(pts, true), pts };
}
const holes: Hole[] = [];
{
  const r = rng(517);
  // hàng trên (gần đường giữa lưng, bị co dẹt do nhìn chéo)
  const nA = 9;
  for (let i = 0; i < nA; i++) {
    const t = 0.1 + (0.8 * (i + 0.5)) / nA + (r() - 0.5) * 0.03;
    const rad = 7.5 + r() * 4;
    holes.push(holeShape(t, 0.44 + (r() - 0.5) * 0.08, rad, 1000 + i * 7, 1 + r() * 0.35));
    // thỉnh thoảng có đốm nhỏ dính kèm (hai đốm nhập nhau)
    if (r() < 0.35) holes.push(holeShape(t + (r() < 0.5 ? -1 : 1) * (rad * 1.15) / LEN, 0.46, rad * 0.55, 1500 + i * 3));
  }
  // hàng dưới (hông gần, đốm to tròn)
  const nB = 8;
  for (let i = 0; i < nB; i++) {
    const t = 0.12 + (0.76 * (i + 0.5)) / nB + (r() - 0.5) * 0.035;
    const rad = 9 + r() * 4.5;
    holes.push(holeShape(t, 1.28 + (r() - 0.5) * 0.16, rad, 2000 + i * 11, 0.95 + r() * 0.3));
    if (r() < 0.3) holes.push(holeShape(t + (r() < 0.5 ? -1 : 1) * (rad * 1.1) / LEN, 1.36, rad * 0.5, 2500 + i * 5));
  }
  // vài chỗ hở lẻ nhỏ (cát bong)
  for (let i = 0; i < 9; i++) {
    const t = 0.1 + r() * 0.8;
    const th = 0.75 + r() * 0.95;
    if (holes.some((h) => Math.abs(h.t - t) * LEN < h.r + 8 && Math.abs(h.th - th) < 0.35)) continue;
    holes.push(holeShape(t, th, 2.5 + r() * 2.5, 3000 + i * 13));
  }
}

// ranh giới dưới của lớp cát (lởm chởm), hở về phía đầu (quanh miệng ít cát)
const thLow = (t: number) =>
  2.0 + 0.24 * Math.sin(t * 13 + 0.4) + 0.14 * Math.sin(t * 31 + 2.1) + 0.05 * Math.sin(t * 113) + 0.25 * (1 - sm(0, 0.1, t)) - 0.2 * sm(0.86, 0.99, t);
const coatTs = tSeq(0, 1, 200);
const COAT_D = poly([...coatTs.map((t) => surf(t, 1.3)), ...coatTs.slice().reverse().map((t) => surfA(t, thLow(t)))]);
// mảng cát loang lổ bên dưới ranh giới + hạt rời
const coatBits = (() => {
  const r = rng(733);
  let s = '';
  for (let i = 0; i < 30; i++) {
    const t = 0.06 + r() * 0.86;
    const th = thLow(t) + 0.02 + r() * 0.5;
    s += `<path d="${holeShape(t, th, 2 + r() * 4.5, 4000 + i * 17, 1.2 + r()).d}"/>`;
  }
  let g = '';
  for (let i = 0; i < 160; i++) {
    const t = 0.03 + r() * 0.94;
    const th = thLow(t) + (r() - 0.25) * 0.7;
    const [x, y] = surfA(t, th);
    g += `<circle cx="${f(x)}" cy="${f(y)}" r="${(0.5 + r() * 0.9).toFixed(2)}"/>`;
  }
  return s + g;
})();
// cổ miệng: vùng quanh vòng xúc tu gần như không có cát
const mouthP = surf(0.993, -0.42);
const MOUTH: P = [Math.round(mouthP[0] * 10) / 10, Math.round(mouthP[1] * 10) / 10];

// =====================================================================
// HẠT CÁT (pattern lặp, 2 cỡ lệch nhau để không lộ lưới)
// =====================================================================
function grainTile(id: string, w: number, h: number, seed: number, n: number, rMax: number): string {
  const r = rng(seed);
  let lt = '';
  let dk = '';
  let wh = '';
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const y = r() * h;
    const rr = 0.3 + r() * rMax;
    const c = `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${rr.toFixed(2)}"/>`;
    const k = r();
    if (k < 0.38) dk += c;
    else if (k < 0.82) lt += c;
    else wh += c;
  }
  return (
    `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">` +
    `<g fill="#1E2224" fill-opacity="0.45">${dk}</g><g fill="#D6D8D0" fill-opacity="0.32">${lt}</g><g fill="#F4F5EE" fill-opacity="0.5">${wh}</g>` +
    `</pattern>`
  );
}

// =====================================================================
// CHI TIẾT DA (gai thịt nhỏ, vệt ướt)
// =====================================================================
const papillae = (() => {
  const r = rng(271);
  let hi = '';
  let lo = '';
  for (let i = 0; i < 300; i++) {
    const t = 0.03 + r() * 0.95;
    const th = 0.2 + r() * 2.75;
    const [x, y] = surfA(t, th);
    const rr = 0.45 + r() * 0.7;
    const v = Math.cos(th);
    const c = `<circle cx="${f(x)}" cy="${f(y)}" r="${rr.toFixed(2)}"/>`;
    if (v > -0.2 && r() < 0.6) hi += c;
    else lo += c;
  }
  return `<g fill="#7FAAD0" fill-opacity="0.32">${hi}</g><g fill="#5E7F9C" fill-opacity="0.24">${lo}</g>`;
})();
// ánh ướt bên trong mỗi đốm hở: vệt cong sáng ở nửa trên
const holeSheen = holes
  .filter((h) => h.r > 5)
  .map((h) => {
    const Rref = Math.max(8, RT(h.t));
    const pts: P[] = [];
    for (let k = 0; k <= 6; k++) {
      const ph = Math.PI * (0.95 + (0.45 * k) / 6);
      pts.push(surfA(h.t + (h.r * 0.55 * Math.cos(ph)) / LEN, h.th + (h.r * 0.55 * Math.sin(ph)) / Rref - (h.r * 0.05) / Rref));
    }
    return poly(pts, false);
  })
  .join('');

// =====================================================================
// CHÂN ỐNG (đế bụng) – uốn theo thân
// =====================================================================
const tubeFeet = (() => {
  const r = rng(907);
  let back = '';
  let backTip = '';
  let front = '';
  let frontTip = '';
  for (let s = 0.07 * LEN; s < 0.93 * LEN; s += 5.5 + r() * 4.5) {
    const t = s / LEN;
    const [x, y] = surf(t, -0.97);
    const lean = (r() - 0.5) * 2.4;
    const len = 2 + r() * 2.2;
    const bx = x + lean;
    const by = Math.min(GROUND + 2.5, y + len);
    if (r() < 0.45) {
      back += `M${f(x)} ${f(y - 1)}L${f(bx - 0.8)} ${f(by - 1.2)}`;
      backTip += `<ellipse cx="${f(bx - 0.8)}" cy="${f(by - 1)}" rx="1.5" ry="0.7"/>`;
    } else {
      front += `M${f(x)} ${f(y - 1.5)}L${f(bx)} ${f(by)}`;
      frontTip += `<ellipse cx="${f(bx)}" cy="${f(by + 0.2)}" rx="1.8" ry="0.85"/>`;
    }
  }
  return (
    `<path d="${back}" stroke="#141A20" stroke-width="2" stroke-linecap="round" fill="none"/>` +
    `<g fill="#28323B">${backTip}</g>` +
    `<path d="${front}" stroke="#1E262E" stroke-width="2.5" stroke-linecap="round" fill="none"/>` +
    `<path d="${front}" stroke="#6F8DA6" stroke-opacity="0.35" stroke-width="0.7" stroke-linecap="round" fill="none" transform="translate(-0.6 0)"/>` +
    `<g fill="#46535F">${frontTip}</g>`
  );
})();

// =====================================================================
// XÚC TU HÌNH KHIÊN quanh miệng
// =====================================================================
function shieldTentacle(ang: number, len: number, seed: number, dark: boolean): string {
  const r = rng(seed);
  const a = (ang * Math.PI) / 180;
  const [mx, my] = MOUTH;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const ex = mx + dx * len;
  const ey = Math.min(GROUND + 1.5, my + dy * len);
  const cx = mx + dx * len * 0.5 - dy * 2.2;
  const cy = my + dy * len * 0.5 + dx * 2.2;
  // đĩa khiên: nhìn chéo → elip, trục lớn vuông góc với cuống; mép chia thùy
  const rx = 7.2 + r() * 1.6;
  const ry = 3 + r() * 1.1;
  const rot = ang + 90;
  const lobes = 9;
  const ph0 = r() * 6;
  const disc: P[] = [];
  for (let i = 0; i < lobes * 4; i++) {
    const th = (Math.PI * 2 * i) / (lobes * 4);
    const k = 1 + 0.16 * Math.max(0, Math.sin(th * lobes + ph0));
    const lx = Math.cos(th) * rx * k;
    const ly = Math.sin(th) * ry * k;
    const cr = Math.cos((rot * Math.PI) / 180);
    const sr = Math.sin((rot * Math.PI) / 180);
    disc.push([ex + dx * 1.2 + lx * cr - ly * sr, ey + dy * 1.2 + lx * sr + ly * cr]);
  }
  const stalk = `M${f(mx)} ${f(my)}Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}`;
  const base = dark ? '#0E1318' : '#161D24';
  const sand = Array.from({ length: 4 }, () => {
    const q = Math.floor(r() * disc.length);
    const p = disc[q];
    return `<circle cx="${f(p[0] + (ex - p[0]) * 0.35)}" cy="${f(p[1] + (ey - p[1]) * 0.35)}" r="${(0.45 + r() * 0.5).toFixed(2)}"/>`;
  }).join('');
  return (
    `<path d="${stalk}" stroke="${base}" stroke-width="${dark ? 3.2 : 3.8}" stroke-linecap="round" fill="none"/>` +
    `<path d="${stalk}" stroke="#7DB3DE" stroke-opacity="${dark ? 0.18 : 0.32}" stroke-width="0.7" stroke-linecap="round" fill="none" transform="translate(${f(dy * 0.8)} ${f(-dx * 0.8)})"/>` +
    `<path d="${smoothPath(disc, true)}" fill="${dark ? u.url('discDark') : u.url('disc')}" stroke="${dark ? '#56636E' : '#8FA2B2'}" stroke-opacity="${dark ? 0.4 : 0.55}" stroke-width="0.6"/>` +
    `<g fill="#D9DAD2" fill-opacity="${dark ? 0.45 : 0.75}">${sand}</g>`
  );
}
const TENT_BACK = [
  [-18, 15],
  [10, 17],
  [36, 18.5],
  [62, 19],
]
  .map(([a, l], i) => shieldTentacle(a, l, 300 + i * 9, true))
  .join('');
const TENT_FRONT = [
  [-4, 16],
  [22, 18.5],
  [48, 20],
  [74, 20],
  [100, 17],
]
  .map(([a, l], i) => shieldTentacle(a, l, 400 + i * 9, false))
  .join('');

// =====================================================================
// THẺ: nền cát, bóng đổ, cuộn phân cát
// =====================================================================
const grains = (() => {
  const area = { x: 6, y: 112, w: 628, h: 78 };
  return (
    scatterSpots(19, area, { count: 230, rMin: 0.5, rMax: 1.3, color: '#8E846B', opacity: 0.5, minGap: 2.4 }) +
    scatterSpots(37, area, { count: 200, rMin: 0.5, rMax: 1.2, color: '#FFFBEF', opacity: 0.8, minGap: 2.4 }) +
    scatterSpots(53, area, { count: 60, rMin: 1, rMax: 2.3, color: '#B9AE93', opacity: 0.6, minGap: 6, ellipse: 1.5 })
  );
})();
const shells = (() => {
  const r = rng(61);
  let s = '';
  for (let i = 0; i < 13; i++) {
    const x = 20 + r() * 600;
    const y = 150 + r() * 36;
    const a = r() * 180;
    const w = 2 + r() * 3.5;
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(w)}" ry="${f(w * 0.42)}" transform="rotate(${f(a)} ${f(x)} ${f(y)})" fill="${r() < 0.5 ? '#F6F0E2' : '#CFC4AA'}" opacity="0.85"/>`;
  }
  return s;
})();
// cuộn phân cát (hải sâm "lọc" cát, thải ra các cuộn cát sạch phía sau đuôi)
const casts = (() => {
  // mỗi cuộn: ống cát mảnh cuộn chồng lên nhau như sợi mì (xoắn ốc thấp dần lên đỉnh)
  const piles: [number, number, number, number][] = [
    [26, 176, 1, 0.4],
    [52, 184, 0.75, 2.1],
  ];
  return piles
    .map(([x0, y0, k, ph]) => {
      const n = 22;
      const pts: P[] = [];
      for (let i = 0; i <= n; i++) {
        const a = ph + i * 0.62;
        const rx = (10 - i * 0.34) * k;
        pts.push([x0 + Math.cos(a) * rx, y0 + Math.sin(a) * rx * 0.34 - i * 0.42 * k]);
      }
      const d = smoothPath(pts, false);
      const w = 3.4 * k;
      return (
        `<ellipse cx="${f(x0 + 2)}" cy="${f(y0 + 3 * k)}" rx="${f(13 * k)}" ry="${f(3.2 * k)}" fill="#8F8467" opacity="0.35" filter="${u.url('soft')}"/>` +
        `<path d="${d}" stroke="#958A6E" stroke-width="${f(w + 1.4)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
        `<path d="${d}" stroke="#D3CAB1" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
        `<path d="${d}" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="${f(w * 0.3)}" stroke-linecap="round" fill="none" transform="translate(-0.3 ${f(-w * 0.28)})"/>`
      );
    })
    .join('');
})();

// =====================================================================
// DEFS
// =====================================================================
const defs =
  clip(u('bodyClip'), BODY_D) +
  blurFilter(u('soft'), 1.1) +
  blurFilter(u('soft2'), 2.4) +
  blurFilter(u('maskSoft'), 0.8) +
  blurFilter(u('shadowBlur'), 5) +
  organicTexture(u('sandTex'), { freq: 0.75, octaves: 2, strength: 0.45, seed: 8 }) +
  grainTile(u('grainA'), 23, 19, 41, 34, 0.55) +
  grainTile(u('grainB'), 41, 33, 77, 46, 0.85) +
  `<mask id="${u('coatMask')}" maskUnits="userSpaceOnUse" x="0" y="0" width="${VW}" height="${VH}">` +
  `<g filter="${u.url('maskSoft')}">` +
  `<path d="${COAT_D}" fill="#ffffff"/>` +
  `<g fill="#ffffff">${coatBits}</g>` +
  `<g fill="#000000">${holes.map((h) => `<path d="${h.d}"/>`).join('')}</g>` +
  `<ellipse cx="${f(MOUTH[0] - 1)}" cy="${f(MOUTH[1] + 1)}" rx="7" ry="9" fill="#000000" opacity="0.75"/>` +
  `</g></mask>` +
  linear(
    u('rim'),
    [
      [0, '#9FDCFF', 0],
      [0.06, '#9FDCFF', 0.75],
      [0.5, '#C8ECFF', 0.9],
      [0.94, '#9FDCFF', 0.75],
      [1, '#9FDCFF', 0],
    ],
    { x1: 40, y1: 0, x2: 610, y2: 0, user: true },
  ) +
  radial(u('disc'), [
    [0, '#3E4954'],
    [0.6, '#232B33'],
    [1, '#141A20'],
  ]) +
  radial(u('discDark'), [
    [0, '#29313A'],
    [1, '#0D1116'],
  ]) +
  radial(
    u('sandFade'),
    [
      [0, '#ffffff', 1],
      [0.6, '#ffffff', 0.85],
      [1, '#ffffff', 0],
    ],
    { cx: 0.5, cy: 0.5, r: 0.5 },
  ) +
  `<mask id="${u('sandMask')}" maskUnits="userSpaceOnUse" x="0" y="0" width="${VW}" height="${VH}"><ellipse cx="320" cy="158" rx="318" ry="44" fill="${u.url('sandFade')}"/></mask>` +
  linear(u('sandFill'), [
    [0, '#D9D2BC'],
    [0.5, '#CFC6AC'],
    [1, '#B9AE90'],
  ]);

// =====================================================================
// LỚP
// =====================================================================
const sandBack =
  `<g mask="${u.url('sandMask')}">` +
  `<rect x="0" y="100" width="${VW}" height="${VH - 100}" fill="${u.url('sandFill')}"/>` +
  `<g>${grains}</g>${shells}` +
  `</g>` +
  casts;
const shadow =
  `<g filter="${u.url('shadowBlur')}">` +
  `<ellipse cx="322" cy="${GROUND + 2}" rx="292" ry="10" fill="#3B3524" opacity="0.5"/>` +
  `<path d="${BODY_D}" fill="#3B3524" opacity="0.28" transform="translate(6 9)"/>` +
  `</g>`;

const skin =
  `<g clip-path="${u.url('bodyClip')}">` +
  `<path d="${BODY_D}" fill="${pal(PAL_SKIN, 0)}"/>` +
  `<g filter="${u.url('soft')}">${bands(PAL_SKIN, 18)}</g>` +
  // vệt ướt dài ở vai lưng và hông dưới (thấy rõ ở chỗ hở)
  `<g fill="none" stroke-linecap="round">` +
  `<path d="${edge(0.05, 0.93, 0.7)}" stroke="#86C3F0" stroke-opacity="0.22" stroke-width="7" filter="${u.url('soft2')}"/>` +
  `<path d="${edge(0.08, 0.9, -0.52)}" stroke="#6FA6D6" stroke-opacity="0.3" stroke-width="5" filter="${u.url('soft2')}"/>` +
  `<path d="${edge(0.06, 0.94, -0.9)}" stroke="#5F8098" stroke-opacity="0.25" stroke-width="3" filter="${u.url('soft2')}"/>` +
  `<path d="${holeSheen}" stroke="#9ED2FA" stroke-opacity="0.3" stroke-width="2.2" filter="${u.url('soft')}"/>` +
  `</g>` +
  papillae +
  `</g>`;

const coat =
  `<g clip-path="${u.url('bodyClip')}">` +
  `<g mask="${u.url('coatMask')}">` +
  `<g filter="${u.url('sandTex')}">` +
  bands(PAL_SAND, 14, 1.3, -1.08) +
  // chỗ cát mỏng/dày loang lổ
  `<g filter="${u.url('soft2')}">` +
  scatterSpots(83, { x: 50, y: 60, w: 540, h: 70 }, { count: 26, rMin: 5, rMax: 13, color: '#20262B', opacity: 0.38, minGap: 16, ellipse: 1.8 }) +
  scatterSpots(89, { x: 50, y: 55, w: 540, h: 60 }, { count: 16, rMin: 5, rMax: 10, color: '#D3D5CD', opacity: 0.22, minGap: 20, ellipse: 1.8 }) +
  `</g>` +
  `</g>` +
  `<rect x="0" y="0" width="${VW}" height="${VH}" fill="${u.url('grainB')}"/>` +
  `<rect x="0" y="0" width="${VW}" height="${VH}" fill="${u.url('grainA')}"/>` +
  // gờ cát sáng quanh đốm hở (nửa trong bị mask che)
  `<g fill="none" stroke="#C9CBC4" stroke-opacity="0.22" stroke-width="2.6">${holes.map((h) => `<path d="${h.d}"/>`).join('')}</g>` +
  `</g>` +
  `</g>`;

const finish =
  `<g fill="none" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="${BODY_LINE}" stroke="${INK}" stroke-opacity="0.7" stroke-width="1.6"/>` +
  // rim light xanh lam ở mép lưng (nắng xuyên nước)
  `<g clip-path="${u.url('bodyClip')}"><path d="${edge(0.01, 0.99, 0.93, 160)}" stroke="#BFE6FF" stroke-opacity="0.32" stroke-width="5" filter="${u.url('soft')}"/></g>` +
  `<path d="${edge(0.012, 0.988, 0.995, 160)}" stroke="${u.url('rim')}" stroke-width="1.6"/>` +
  `</g>` +
  // hậu môn ở chóp đuôi
  (() => {
    const [ax, ay] = surf(0.004, 0.08);
    let rays = '';
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6 + 0.3;
      rays += `M${f(ax + 1.2 + Math.cos(a) * 2.2)} ${f(ay + Math.sin(a) * 3)}L${f(ax + 1.2 + Math.cos(a) * 4.4)} ${f(ay + Math.sin(a) * 5.6)}`;
    }
    return (
      `<g clip-path="${u.url('bodyClip')}">` +
      `<ellipse cx="${f(ax + 1.6)}" cy="${f(ay)}" rx="2.2" ry="3.4" fill="#020304"/>` +
      `<path d="${rays}" stroke="#4E6C86" stroke-opacity="0.45" stroke-width="0.7" fill="none"/>` +
      `</g>`
    );
  })() +
  // cổ miệng: nếp da tối quanh vòng xúc tu
  `<g clip-path="${u.url('bodyClip')}">` +
  `<ellipse cx="${f(MOUTH[0] + 1)}" cy="${f(MOUTH[1] + 1)}" rx="4" ry="5.5" fill="#030507" opacity="0.7" filter="${u.url('soft')}"/>` +
  `</g>`;

const sandDust = (() => {
  const r = rng(149);
  let s = '';
  for (let i = 0; i < 70; i++) {
    const x = 50 + r() * 545;
    const y = GROUND - 1 + r() * 6;
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${(0.5 + r() * 0.9).toFixed(2)}" fill="${r() < 0.6 ? '#F4EEDD' : '#A2977C'}" opacity="0.85"/>`;
  }
  return s;
})();

const art: CreatureArt = {
  id: ID,
  viewBox: [VW, VH],
  defs,
  lengthUnits: Math.round(LEN),
  spineY: 108,
  // Hải sâm bò cực chậm bằng nhu động, không bơi uốn sóng: dùng 'eel' với biên độ rất nhỏ và nhịp rất chậm để thân
  // "thở"/dịch nhẹ (khác hòn đá), còn 'static' thì thân đứng cứng hoàn toàn.
  animation: 'eel',
  cycleHz: 0.14,
  bendAmp: 2.5,
  cardDetailLevel: 'hi',
  layers: [
    { name: 'sand', role: 'detail', bend: false, z: 'back', cardOnly: true, pivot: [320, 160], svg: sandBack },
    { name: 'shadow', role: 'detail', bend: false, z: 'back', cardOnly: true, pivot: [320, 150], svg: shadow },
    {
      name: 'tentaclesBack',
      role: 'tentacle',
      bend: false,
      z: 'back',
      pivot: MOUTH,
      // xúc tu khiên phía xa: quét cát chậm, lệch pha với hàng trước
      anim: { type: 'rotate', amp: 0.14, speed: 2.4, phase: 1.9 },
      svg: TENT_BACK,
    },
    { name: 'tubeFeet', role: 'detail', svg: tubeFeet },
    { name: 'skin', role: 'body', svg: skin },
    { name: 'sandCoat', role: 'pattern', svg: coat },
    { name: 'finish', role: 'detail', svg: finish },
    {
      name: 'tentaclesFront',
      role: 'tentacle',
      bend: false,
      z: 'front',
      pivot: MOUTH,
      anim: { type: 'rotate', amp: 0.12, speed: 2.4 },
      svg: TENT_FRONT,
    },
    { name: 'sandDust', role: 'detail', bend: false, z: 'front', cardOnly: true, pivot: [320, 152], svg: sandDust },
  ],
};

export default art;
