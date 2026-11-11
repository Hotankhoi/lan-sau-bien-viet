/**
 * Rắn biển khoanh – Hydrophis cyanocinctus (Biển miền Nam) – NGUY HIỂM, nọc rất độc.
 * Đặc điểm nhận dạng (ref1–ref5):
 *  - thân rắn rất dài, uốn chữ S; nửa trước & cổ mảnh, nửa sau dày; ĐẦU NHỎ chỉ hơi rộng hơn cổ;
 *  - ĐUÔI DẸT BÊN như mái chèo (cao hơn thân, chóp tròn, chóp sẫm) – đặc điểm của rắn biển;
 *  - nền vàng xám – ô liu nhạt, nhiều khoanh đen xanh đều đặn: rộng ở lưng, thon hẹp dần xuống bụng;
 *  - vảy nhỏ lục giác xếp hàng chéo (pattern mờ); mắt nhỏ đồng tử tròn; lỗ mũi trên đỉnh mõm.
 * Dựng thân bằng mô hình ống quanh một đường tâm cong: t dọc thân (0 = chóp đuôi → 1 = chóp mõm),
 * v ∈ [−1, 1] quanh trục (+1 mép lưng, −1 mép bụng). Đầu quay PHẢI.
 */
import type { CreatureArt } from '../contract';
import { makeIds, linear, radial, blurFilter, clip, mix, eye, rng } from '../style-bible';

const ID = 'ran_bien_khoanh';
const u = makeIds(ID);
type P = [number, number];
const f = (n: number) => n.toFixed(1);
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const sm = (a: number, b: number, x: number) => {
  const k = clamp((x - a) / (b - a), 0, 1);
  return k * k * (3 - 2 * k);
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

// =====================================================================
// ĐƯỜNG TÂM (Catmull-Rom) – chữ S mềm, đuôi trái, đầu phải
// =====================================================================
const CTRL: P[] = [
  [34, 150],
  [96, 162],
  [176, 166],
  [262, 142],
  [352, 102],
  [446, 86],
  [540, 104],
  [632, 142],
  [726, 160],
  [818, 146],
  [896, 120],
  [952, 108],
  [992, 106],
];
const dense: P[] = [];
{
  const get = (i: number) => CTRL[clamp(i, 0, CTRL.length - 1)];
  for (let i = 0; i < CTRL.length - 1; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    for (let j = 0; j < 40; j++) {
      const t = j / 40;
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
// BỀ DÀY THÂN: nửa trên (lưng) / nửa dưới (bụng) theo t
// =====================================================================
const RAD: P[] = [
  [0, 30], // mái chèo đuôi – dẹt bên nên nhìn ngang cao hơn thân
  [0.03, 30],
  [0.058, 27.6],
  [0.084, 22.6],
  [0.108, 18.8],
  [0.13, 17.6],
  [0.17, 18.9],
  [0.27, 21.6],
  [0.42, 22.6],
  [0.55, 21.2],
  [0.66, 18.4],
  [0.76, 15],
  [0.84, 12.2],
  [0.895, 11],
  [0.92, 12.2],
  [0.945, 13.8],
  [0.965, 13.4],
  [0.982, 11.4],
  [1, 8.6],
];
const CAP_TAIL = 0.03; // bo tròn chóp mái chèo
const CAP_UP = 0.026; // bo mõm (môi trên trùm hơn)
const CAP_DN = 0.034; // hàm dưới lùi vào
const capK = (d: number, len: number) => Math.sqrt(Math.max(0, 1 - Math.max(0, d / len) ** 2));
function R(t: number): number {
  const tc = clamp(t, 0, 1);
  let r = interp(RAD, tc);
  if (tc < CAP_TAIL) r *= 0.12 + 0.88 * capK(CAP_TAIL - tc, CAP_TAIL);
  return r;
}
function Rup(t: number): number {
  const tc = clamp(t, 0, 1);
  let r = R(tc);
  // đỉnh đầu dẹt nhẹ
  r *= 1 - 0.06 * sm(0.93, 0.99, tc);
  if (tc > 1 - CAP_UP) r *= capK(tc - (1 - CAP_UP), CAP_UP);
  return r;
}
function Rdn(t: number): number {
  const tc = clamp(t, 0, 1);
  let r = R(tc);
  // bụng thân sau hơi phẳng (thân dẹt bên, có gờ bụng); họng nhỏ hơn đỉnh đầu
  r *= 1 - 0.1 * sm(0.9, 0.99, tc);
  if (tc > 1 - CAP_DN) r *= capK(tc - (1 - CAP_DN), CAP_DN);
  return r;
}
function surf(t: number, v: number): P {
  const p = at(t * LEN);
  const r = v >= 0 ? Rup(t) : Rdn(t);
  return [p.x + p.nx * r * v, p.y + p.ny * r * v];
}
/** dãy t dày dần về hai đầu */
function tSeq(t0: number, t1: number, n: number): number[] {
  const out: number[] = [];
  for (let k = 0; k <= n; k++) out.push(t0 + (t1 - t0) * (0.5 - 0.5 * Math.cos((Math.PI * k) / n)));
  return out;
}
const TS = tSeq(0, 1, 220);
const outlinePts: P[] = [...TS.map((t) => surf(t, 1)), ...TS.slice().reverse().map((t) => surf(t, -1))];
const BODY = poly(outlinePts);
const line = (t0: number, t1: number, v: number | ((t: number) => number), n = 80) =>
  poly(
    tSeq(t0, t1, n).map((t) => surf(t, typeof v === 'number' ? v : v(t))),
    false,
  );
/** dải giữa hai mức v (tô khối ống) */
const strip = (t0: number, t1: number, v0: number, v1: number, n = 140) => {
  const ts = tSeq(t0, t1, n);
  return poly([...ts.map((t) => surf(t, v0)), ...ts.slice().reverse().map((t) => surf(t, v1))]);
};

// =====================================================================
// MÀU
// =====================================================================
const INK = '#3B3A22'; // viền ô liu rất sẫm (cùng tông)
const BAND_TOP = '#1C2629';
const BAND_BOT = '#3F4943';
/** màu ống theo v: lưng ô liu xám (đổ bóng ngược) → hông vàng sáng → bụng kem, mép bụng hơi tối */
const PAL: [number, string][] = [
  [1.0, '#686843'],
  [0.86, '#858251'],
  [0.66, '#ABA36B'],
  [0.46, '#C8BE83'],
  [0.26, '#CCC28A'],
  [0.0, '#C2B77E'],
  [-0.3, '#C9BF8A'],
  [-0.56, '#DAD2A4'],
  [-0.78, '#D6CEA2'],
  [-0.92, '#BBB287'],
  [-1.0, '#958C66'],
];
const GREY_OLIVE = '#A3A68C'; // kéo tông vàng về xám – ô liu
function palAt(v: number): string {
  for (let i = 1; i < PAL.length; i++) {
    if (v >= PAL[i][0]) {
      const [v0, c0] = PAL[i - 1];
      const [v1, c1] = PAL[i];
      return mix(mix(c1, c0, (v - v1) / (v0 - v1)), GREY_OLIVE, 0.16);
    }
  }
  return PAL[PAL.length - 1][1];
}

// =====================================================================
// THÂN: tô khối ống bằng các dải v (làm mờ nhẹ cho mịn)
// =====================================================================
function tubeShading(): string {
  const K = 18;
  let s = '';
  for (let k = 0; k < K; k++) {
    const v0 = 1.08 - (2.16 * k) / K;
    const v1 = 1.08 - (2.16 * (k + 1)) / K;
    const c = palAt(clamp((v0 + v1) / 2, -1, 1));
    // dải chồng nhau một chút để không hở
    s += `<path d="${strip(0, 1, v0 + 0.02, v1 - 0.02)}" fill="${c}"/>`;
  }
  return s;
}

// mái chèo đuôi: dẹt bên nên phẳng màu hơn (ít khối trụ) + gân giữa
const TAIL_T = 0.1;
function paddle(): string {
  const blade = strip(0, TAIL_T, 1.1, -1.1, 50);
  const tip = TS.filter((t) => t <= TAIL_T);
  const mid = poly(tip.map((t) => surf(t, 0.05)), false);
  return (
    `<path d="${blade}" fill="${u.url('paddle')}"/>` +
    // gân giữa mái chèo & 2 mép mỏng sáng hơn
    `<path d="${mid}" fill="none" stroke="#5c5a37" stroke-opacity="0.3" stroke-width="2.2" filter="${u.url('soft1')}"/>` +
    `<path d="${line(0, TAIL_T, 0.86, 40)}" fill="none" stroke="#efe6b8" stroke-opacity="0.35" stroke-width="2.4"/>` +
    `<path d="${line(0, TAIL_T, -0.86, 40)}" fill="none" stroke="#efe6b8" stroke-opacity="0.28" stroke-width="2.2"/>`
  );
}

// =====================================================================
// KHOANH SẪM: rộng ở lưng, thon dần xuống bụng; nhạt & mảnh ở bụng
// =====================================================================
const T_NECK = 0.905; // khoanh cuối trước đầu
function bands(): string {
  const r = rng(731);
  let s = '';
  let sc = 7;
  const centers: number[] = [];
  while (sc < T_NECK * LEN) {
    centers.push(sc);
    const t = sc / LEN;
    const period = 9.5 + 0.78 * R(t) + 2.5 * sm(0.04, 0, t);
    sc += period * (0.96 + r() * 0.08);
  }
  for (const c of centers) {
    const t = c / LEN;
    const period = 9.5 + 0.78 * R(t);
    const wTop = period * (0.5 + (r() - 0.5) * 0.06) * (t < TAIL_T ? 1.1 : 1);
    const wBot = period * (t < TAIL_T ? 0.24 : 0.1);
    const lean = (r() - 0.5) * 2.4; // lệch nhẹ, không quá đều máy móc
    const N = 14;
    const left: P[] = [];
    const right: P[] = [];
    for (let i = 0; i <= N; i++) {
      const v = 1.12 - (2.06 * i) / N; // dừng ở v ≈ −0.94: mũi khoanh hẹp sát bụng
      // lưng (v > 0.5) gần như đều rộng; từ hông thắt dần thành mũi hẹp ở bụng
      const k = sm(-1.0, 0.55, v);
      const hw = (wBot + (wTop - wBot) * Math.pow(k, 0.75)) / 2;
      const bow = lean * (1 - v) * 0.5 + 1.2 * (1 - v * v);
      const ls = c - hw + bow;
      const rs = c + hw + bow;
      left.push(surf(clamp(ls / LEN, 0, 1), v));
      right.push(surf(clamp(rs / LEN, 0, 1), v));
    }
    s += `<path d="${poly([...left, ...right.reverse()])}"/>`;
  }
  return s;
}

// chóp đuôi sẫm (ref5)
const TAIL_TIP = strip(0, 0.016, 1.15, -1.15, 16);

// =====================================================================
// ĐẦU
// =====================================================================
const T_HEAD0 = 0.9;
const EYE_T = 0.972;
const [EX, EY] = surf(EYE_T, 0.38);
const theEye = eye(u, 'eye', {
  cx: +EX.toFixed(1),
  cy: +EY.toFixed(1),
  r: 3.6,
  iris: ['#7A6C34', '#211C0E'],
  pupil: 'round',
  socket: '#3a3a22',
  look: [0.3, 0],
});
// đỉnh đầu ô liu sẫm, mờ dần xuống má
const HEAD_CAP = strip(T_HEAD0 - 0.012, 1, 1.15, -0.12, 60);
// đường miệng: từ chóp mõm lùi về sau, quá mắt một chút, cuối hơi trễ xuống
const MOUTH = poly(
  tSeq(0.95, 0.997, 30).map((t) => surf(t, -0.3 - 0.12 * sm(0.965, 0.95, t))),
  false,
);
function headScales(): string {
  const seg = (a: P, b: P) => `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
  let s = '';
  // hàng vảy môi trên: mép trên + vách ngăn hơi xiên
  for (const t of [0.958, 0.966, 0.974, 0.983]) s += seg(surf(t, -0.29), surf(t + 0.0025, -0.02));
  // vảy sau mắt (2 tấm) & tấm thái dương
  s += seg(surf(EYE_T - 0.007, 0.5), surf(EYE_T - 0.016, 0.66));
  s += seg(surf(EYE_T - 0.007, 0.27), surf(EYE_T - 0.017, 0.16));
  s += seg(surf(EYE_T - 0.017, 0.66), surf(EYE_T - 0.017, 0.16));
  // mép sau tấm đỉnh (parietal) & ranh giới tấm trên ổ mắt / trước trán
  const p1 = surf(0.936, 1.0);
  const p2 = surf(0.944, 0.62);
  const p3 = surf(0.955, 0.6);
  s += `M${f(p1[0])} ${f(p1[1])}Q${f(p2[0])} ${f(p2[1])} ${f(p3[0])} ${f(p3[1])}`;
  s += seg(surf(0.984, 1.0), surf(0.981, 0.62));
  return `<path d="${s}" fill="none" stroke="#2c2b18" stroke-opacity="0.3" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"/>`;
}
const [NX, NY] = surf(0.993, 0.72);

// lưỡi chẻ (chỉ trên thẻ Sổ tay – trong game quá nhỏ)
function tongue(): string {
  const [mx, my] = surf(0.999, -0.3);
  const x0 = mx + 1;
  const y0 = my;
  return (
    `<path d="M${f(x0)} ${f(y0)}Q${f(x0 + 9)} ${f(y0 + 1.5)} ${f(x0 + 15)} ${f(y0 + 0.6)}` +
    `M${f(x0 + 15)} ${f(y0 + 0.6)}Q${f(x0 + 19)} ${f(y0 - 1.2)} ${f(x0 + 22)} ${f(y0 - 3.2)}` +
    `M${f(x0 + 15)} ${f(y0 + 0.6)}Q${f(x0 + 19)} ${f(y0 + 2.4)} ${f(x0 + 22.5)} ${f(y0 + 3.6)}" ` +
    `fill="none" stroke="#2b2a2e" stroke-width="1.5" stroke-linecap="round"/>`
  );
}

// =====================================================================
// DEFS
// =====================================================================
const [TX0] = surf(0, 0);
const [TX1] = surf(TAIL_T, 0);
const defs =
  clip(u('bodyClip'), BODY) +
  blurFilter(u('soft1'), 1.1) +
  blurFilter(u('soft07'), 0.6) +
  blurFilter(u('soft2'), 2.2) +
  blurFilter(u('soft4'), 4) +
  // mái chèo phẳng màu: đậm ở chóp, tan dần vào thân
  linear(
    u('paddle'),
    [
      [0, '#9C976A', 0.85],
      [0.55, '#B3AB78', 0.55],
      [1, '#BDB47C', 0],
    ],
    { user: true, x1: TX0, y1: 0, x2: TX1, y2: 0 },
  ) +
  // khoanh: đen xanh ở lưng → xám ô liu nhạt dần xuống bụng (theo bbox từng khoanh)
  linear(u('band'), [
    [0, BAND_TOP],
    [0.45, BAND_TOP, 0.97],
    [0.75, '#2C3634', 0.85],
    [1, BAND_BOT, 0.6],
  ]) +
  linear(u('head'), [
    [0, '#2F3121', 0.95],
    [0.45, '#4A4A30', 0.85],
    [0.8, '#5F5D3B', 0.35],
    [1, '#6b6844', 0],
  ]) +
  // vảy: lưới thoi nhỏ xếp hàng chéo (vảy rắn nhìn ngang), nét sẫm + chấm gờ sáng giữa vảy
  `<pattern id="${u('scales')}" width="6" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)">` +
  `<path d="M0 2.5L3 0L6 2.5L3 5Z" fill="none" stroke="#2a2a16" stroke-opacity="0.11" stroke-width="0.5" stroke-linejoin="round"/>` +
  `<circle cx="3" cy="2.3" r="0.55" fill="#fffae0" fill-opacity="0.1"/><circle cx="0" cy="4.8" r="0.55" fill="#fffae0" fill-opacity="0.1"/>` +
  `</pattern>` +
  `<pattern id="${u('scalesHi')}" width="6" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)">` +
  `<path d="M0 2.5L3 0L6 2.5L3 5Z" fill="none" stroke="#c9cdb6" stroke-opacity="0.1" stroke-width="0.45" stroke-linejoin="round"/>` +
  `</pattern>` +
  `<clipPath id="${u('bandClip')}">${bands()}</clipPath>` +
  radial(u('gloss'), [
    [0, '#fffbe2', 0.5],
    [1, '#fffbe2', 0],
  ]) +
  theEye.defs;

// =====================================================================
// LỚP
// =====================================================================
const bodySvg =
  `<g clip-path="${u.url('bodyClip')}">` +
  `<g filter="${u.url('soft1')}">${tubeShading()}</g>` +
  paddle() +
  `</g>`;

const patternSvg =
  `<g clip-path="${u.url('bodyClip')}">` +
  // khoanh sẫm (mép hơi mềm)
  `<g fill="${u.url('band')}" filter="${u.url('soft07')}">${bands()}</g>` +
  `<path d="${TAIL_TIP}" fill="${BAND_TOP}" fill-opacity="0.92" filter="${u.url('soft1')}"/>` +
  // đỉnh đầu sẫm
  `<path d="${HEAD_CAP}" fill="${u.url('head')}" filter="${u.url('soft2')}"/>` +
  // vảy: nét sẫm toàn thân + nét sáng chỉ trong khoanh
  `<path d="${BODY}" fill="${u.url('scales')}"/>` +
  `<g clip-path="${u.url('bandClip')}"><path d="${BODY}" fill="${u.url('scalesHi')}"/></g>` +
  // khối: dải sáng ướt dọc hông trên + bóng dưới bụng (phủ cả khoanh)
  `<path d="${strip(0.03, 0.9, 0.66, 0.36, 120)}" fill="#fff6d0" fill-opacity="0.16" filter="${u.url('soft2')}"/>` +
  `<path d="${strip(0.12, 0.86, 0.56, 0.46, 120)}" fill="#ffffff" fill-opacity="0.14" filter="${u.url('soft1')}"/>` +
  `<path d="${strip(0, 1, -0.7, -1.15, 140)}" fill="#2a2412" fill-opacity="0.16" filter="${u.url('soft2')}"/>` +
  `<path d="${strip(0, 1, 1.15, 0.86, 140)}" fill="#141a10" fill-opacity="0.12" filter="${u.url('soft1')}"/>` +
  // vảy môi trên & cằm nhạt màu kem (ref2B)
  `<path d="${strip(0.948, 0.998, 0.0, -0.32, 30)}" fill="#e6dfb4" fill-opacity="0.32" filter="${u.url('soft1')}"/>` +
  // vệt bóng loáng trên đầu
  `<ellipse cx="${f(surf(0.955, 0.6)[0])}" cy="${f(surf(0.955, 0.6)[1])}" rx="14" ry="3.2" fill="${u.url('gloss')}" transform="rotate(-6 ${f(surf(0.955, 0.6)[0])} ${f(surf(0.955, 0.6)[1])})"/>` +
  `</g>` +
  // gờ bụng mảnh
  `<path d="${line(0.1, 0.88, -0.8, 120)}" fill="none" stroke="#6d6542" stroke-opacity="0.22" stroke-width="0.9"/>` +
  // viền ngoài + rim light lưng
  `<path d="${BODY}" fill="none" stroke="${INK}" stroke-width="1.8" stroke-opacity="0.6" stroke-linejoin="round"/>` +
  `<path d="${line(0.012, 0.985, 0.9, 160)}" fill="none" stroke="#fffbe0" stroke-opacity="0.38" stroke-width="1.6" stroke-linecap="round"/>`;

const headSvg =
  headScales() +
  `<path d="${MOUTH}" fill="none" stroke="#22200f" stroke-opacity="0.7" stroke-width="1.1" stroke-linecap="round"/>` +
  // lỗ mũi trên đỉnh mõm (có van)
  `<ellipse cx="${f(NX)}" cy="${f(NY)}" rx="1.7" ry="1.05" fill="#141409" transform="rotate(-10 ${f(NX)} ${f(NY)})"/>` +
  `<path d="M${f(NX - 1.6)} ${f(NY - 1.4)}Q${f(NX)} ${f(NY - 2.4)} ${f(NX + 1.8)} ${f(NY - 1.2)}" fill="none" stroke="#d8d0a0" stroke-opacity="0.5" stroke-width="0.6"/>`;

const xs = outlinePts.map((p) => p[0]);
const LENGTH_UNITS = Math.round(Math.max(...xs) - Math.min(...xs));

const art: CreatureArt = {
  id: ID,
  viewBox: [1024, 256],
  lengthUnits: LENGTH_UNITS,
  spineY: 128,
  animation: 'eel',
  cycleHz: 0.8,
  bendAmp: 62,
  // thân rất dài & mảnh: công thức theo sizeCm (180 cm → ~245 px) làm con rắn dài quá khung nhìn;
  // 180 px vẫn đọc được khoanh và mái chèo đuôi.
  displayLengthPx: 180,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    { name: 'tongue', role: 'detail', cardOnly: true, svg: tongue() },
    { name: 'body', role: 'body', svg: bodySvg },
    { name: 'bands', role: 'pattern', svg: patternSvg },
    { name: 'head', role: 'detail', svg: headSvg },
    { name: 'eye', role: 'eye', svg: theEye.svg },
  ],
};

export default art;
