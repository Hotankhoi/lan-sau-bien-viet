/**
 * Sá sùng – Sipunculus nudus (Vịnh Bắc Bộ – đặc sản Quan Lạn, Vân Đồn)
 * Thân giun hình trụ dài như xúc xích, uốn chữ S nhẹ. Thân được dựng bằng mô hình mặt trụ quanh một
 * đường tâm cong (t dọc thân 0 = đuôi → 1 = chóp vòi, v = cos góc quanh trục: +1 mép trên, −1 mép dưới):
 *  - tô khối bằng các dải màu theo v (làm mờ nhẹ) → khối trụ bóng như ngọc trai;
 *  - lưới rãnh vòng + rãnh dọc (rãnh dọc dày dần ra mép do hình trụ), mỗi rãnh có nét sáng đi kèm
 *    → ô nhỏ nổi phồng, mỗi ô một chấm phản chiếu (ảnh ref3);
 *  - vòi (introvert) thon, trơn, rãnh dọc lượn hội tụ về chóp (ref2) – lớp riêng co/duỗi quanh gốc;
 *  - đuôi tròn tù hơi phình.
 * Đầu (vòi) quay PHẢI. Thẻ Sổ tay: nền cát + bóng đổ + hạt cát dính mép bụng (cardOnly).
 */
import type { CreatureArt } from '../contract';
import { makeIds, linear, radial, blurFilter, clip, mix, rng, scatterSpots } from '../style-bible';

const ID = 'sa_sung';
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

// =====================================================================
// ĐƯỜNG TÂM (Catmull-Rom) + tham số theo độ dài cung
// =====================================================================
const CTRL: P[] = [
  [36, 116],
  [112, 95],
  [208, 91],
  [300, 110],
  [390, 121],
  [470, 104],
  [540, 97],
  [612, 96],
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
// BÁN KÍNH THÂN theo t
// =====================================================================
const TJ = 0.785; // ranh giới thân / vòi
const TI0 = 0.768; // gốc lớp vòi (chồng lên cổ thân, mờ dần vào)
const TIF = 0.79; // hết vùng mờ ở gốc vòi
const RAD: P[] = [
  [0, 19.5],
  [0.06, 21.5],
  [0.13, 19.6],
  [0.3, 23.4],
  [0.5, 24.2],
  [0.66, 23],
  [0.73, 21.2],
  [0.76, 18.6],
  [0.778, 16.9],
  [0.8, 17.4],
  [0.83, 16.9],
  [0.88, 14.2],
  [0.93, 10.4],
  [0.968, 6.8],
  [1, 4.4],
];
const CAP_T = 0.046;
const CAP_H = 0.013;
function R(t: number): number {
  const tc = clamp(t, 0, 1);
  let r = interp(RAD, tc);
  // nhu động: vài đoạn phồng nhẹ dọc thân
  r *= 1 + 0.028 * Math.sin(tc * Math.PI * 2 * 3.1 + 0.5) * (1 - sm(0.66, 0.76, tc)) * sm(0.06, 0.14, tc);
  if (tc < CAP_T) r *= Math.sqrt(Math.max(0, 1 - ((CAP_T - tc) / CAP_T) ** 2));
  if (tc > 1 - CAP_H) r *= Math.sqrt(Math.max(0, 1 - ((tc - (1 - CAP_H)) / CAP_H) ** 2));
  return r;
}
/** bán kính lớp thân (kết thúc bằng vòm nhỏ nằm gọn dưới gốc vòi) */
const TE = TJ + 0.03;
function Rtrunk(t: number): number {
  if (t <= TJ) return R(t);
  const k = clamp((t - TJ) / (TE - TJ), 0, 1);
  return Math.max(0, (R(t) - 1.2) * Math.sqrt(Math.max(0, 1 - k * k)));
}
function surfR(t: number, v: number, rf: (t: number) => number = R): P {
  const p = at(t * LEN);
  const r = rf(t);
  return [p.x + p.nx * r * v, p.y + p.ny * r * v];
}
/** dãy t dày dần về hai đầu */
function tSeq(t0: number, t1: number, n: number): number[] {
  const out: number[] = [];
  for (let k = 0; k <= n; k++) out.push(t0 + (t1 - t0) * (0.5 - 0.5 * Math.cos((Math.PI * k) / n)));
  return out;
}
function outlinePts(t0: number, t1: number, n: number, rf: (t: number) => number = R): P[] {
  const ts = tSeq(t0, t1, n);
  return [...ts.map((t) => surfR(t, 1, rf)), ...ts.slice().reverse().map((t) => surfR(t, -1, rf))];
}

// =====================================================================
// MÀU
// =====================================================================
const INK = '#6A4657';
const INK_I = '#7E5A66';
const PAL_TRUNK: P[] = [
  [-1, 0x968299],
  [-0.9, 0x7f6a86],
  [-0.7, 0x8a7090],
  [-0.4, 0xa98a9f],
  [0, 0xc6a1b2],
  [0.3, 0xdbbcc9],
  [0.55, 0xefdee5],
  [0.8, 0xd6b5c3],
  [1, 0xa88598],
];
const PAL_INTRO: P[] = [
  [-1, 0xa98d9c],
  [-0.85, 0x957587],
  [-0.4, 0xbf9fad],
  [0, 0xd6bac4],
  [0.3, 0xe6d0d7],
  [0.55, 0xf5e9ec],
  [0.82, 0xdcc1ca],
  [1, 0xb0909f],
];
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

/** dải khối trụ: các dải v chồng nhau, tô theo bảng màu */
function bands(t0: number, t1: number, palTab: P[], nb: number, rf: (t: number) => number = R): string {
  const ts = tSeq(t0, t1, 90);
  let out = '';
  for (let i = 0; i < nb; i++) {
    const va = 1.08 - (2.16 * i) / nb;
    const vb = 1.08 - (2.16 * (i + 1)) / nb - 0.05;
    const top = ts.map((t) => surfR(t, va, rf));
    const bot = ts.slice().reverse().map((t) => surfR(t, vb, rf));
    out += `<path d="${poly([...top, ...bot])}" fill="${pal(palTab, (va + vb) / 2)}"/>`;
  }
  return out;
}

// =====================================================================
// THÂN (trunk)
// =====================================================================
const trunkPts = outlinePts(0, TE, 240, Rtrunk);
const TRUNK_D = poly(trunkPts);
const TRUNK_LINE = poly(tSeq(0, TJ, 200).reverse().map((t) => surfR(t, 1)), false) + poly(tSeq(0, TJ, 200).map((t) => surfR(t, -1)), false).replace('M', 'L');
const TOP_EDGE = (t0: number, t1: number, v: number, rf: (t: number) => number = R) => poly(tSeq(t0, t1, 80).map((t) => surfR(t, v, rf)), false);

// ---- lưới rãnh ----
const RING_STEP = 5.1;
const TH_N = 18; // số khoảng góc quanh nửa thân nhìn thấy
let ringDark = '';
let ringLight = '';
const ringS: number[] = [];
for (let s = 0.012 * LEN; s < (TJ - 0.004) * LEN; s += RING_STEP * (1 - 0.35 * sm(0.72, 0.775, s / LEN)) * (0.75 + 0.25 * sm(0.0, 0.05, s / LEN))) ringS.push(s);
for (const s of ringS) {
  const t = s / LEN;
  const r = R(t);
  const dk: P[] = [];
  const lt: P[] = [];
  for (let k = 0; k <= 10; k++) {
    const v = -0.985 + (1.97 * k) / 10;
    const bow = 0.12 * r * Math.sqrt(Math.max(0, 1 - v * v));
    dk.push(surfR((s + bow) / LEN, v));
    lt.push(surfR((s + bow - 1.15) / LEN, v));
  }
  ringDark += poly(dk, false);
  ringLight += poly(lt, false);
}
let longDark = '';
let longLight = '';
for (let k = 1; k < TH_N; k++) {
  const v = Math.cos((Math.PI * k) / TH_N);
  const ts = tSeq(0.004, TJ - 0.004, 110);
  longDark += poly(ts.map((t) => surfR(t, v)), false);
  longLight += poly(ts.map((t) => surfR(t, v - 0.04)), false);
}
// chấm phản chiếu trên từng ô (hạt ngọc)
let cellHi = '';
let cellMid = '';
let cellLo = '';
for (let i = 0; i < ringS.length - 1; i++) {
  const sc = (ringS[i] + ringS[i + 1]) / 2;
  const tc = sc / LEN;
  const p = at(sc);
  const tx = -p.ny;
  const ty = p.nx;
  for (let k = 0; k < TH_N; k++) {
    const v = Math.cos((Math.PI * (k + 0.38)) / TH_N);
    const [x, y] = surfR(tc, v);
    const seg = `M${f(x - tx * 0.35)} ${f(y - ty * 0.35)}l${f(tx * 0.7)} ${f(ty * 0.7)}`;
    if (v > 0.28 && v < 0.8) cellHi += seg;
    else if (v > -0.35 && v < 0.93) cellMid += seg;
    else if (v > -0.92) cellLo += seg;
  }
}

// ---- nền cát (thẻ) ----
const grains = (() => {
  const area = { x: 10, y: 22, w: 620, h: 172 };
  return (
    scatterSpots(11, area, { count: 260, rMin: 0.5, rMax: 1.3, color: '#7A6849', opacity: 0.55, minGap: 2.2 }) +
    scatterSpots(29, area, { count: 200, rMin: 0.5, rMax: 1.2, color: '#F2E6C8', opacity: 0.7, minGap: 2.2 }) +
    scatterSpots(47, area, { count: 70, rMin: 1, rMax: 2.2, color: '#A99674', opacity: 0.6, minGap: 5, ellipse: 1.4 })
  );
})();
const shells = (() => {
  const r = rng(91);
  let s = '';
  for (let i = 0; i < 14; i++) {
    const x = 30 + r() * 580;
    const y = 30 + r() * 160;
    const a = r() * 180;
    const w = 2 + r() * 3.5;
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(w)}" ry="${f(w * 0.45)}" transform="rotate(${f(a)} ${f(x)} ${f(y)})" fill="${r() < 0.5 ? '#EDE2CB' : '#C9B79A'}" opacity="0.8"/>`;
  }
  return s;
})();

// hạt cát dính trên thân (thẻ) – dày ở mép bụng sát cát, thưa dần lên lưng (ảnh ref4)
const sandDust = (() => {
  const r = rng(73);
  let dark = '';
  let light = '';
  for (let i = 0; i < 95; i++) {
    const t = 0.06 + r() * 0.7;
    const v = -1 + Math.pow(r(), 3) * 1.6;
    const [x, y] = surfR(t, v);
    const rr = 0.4 + r() * 0.6;
    const c = `<circle cx="${f(x)}" cy="${f(y)}" r="${rr.toFixed(2)}"/>`;
    if (r() < 0.35) dark += c;
    else light += c;
  }
  return `<g fill="#6F5E42" fill-opacity="0.45">${dark}</g><g fill="#DCCDB0" fill-opacity="0.6">${light}</g>`;
})();

// =====================================================================
// VÒI (introvert)
// =====================================================================
const TI1 = 1;
const introTop = tSeq(TI0, TI1, 150).map((t) => surfR(t, 1));
const introBot = tSeq(TI0, TI1, 150)
  .reverse()
  .map((t) => surfR(t, -1));
// gốc vòi: mép cong như miệng ống (lồi về phía đuôi)
const introBase: P[] = [];
for (let k = 1; k < 12; k++) {
  const v = -1 + (2 * k) / 12;
  introBase.push(surfR(TI0 - (0.009 * Math.sqrt(1 - v * v)) , v));
}
const INTRO_D = poly([...introTop, ...introBot, ...introBase]);
const pivotP = at(TI0 * LEN);
const fadeA = at(TI0 * LEN);
const fadeB = at(TIF * LEN);
const INTRO_MASK =
  linear(u('introFade'), [[0, '#ffffff', 0], [0.25, '#ffffff', 0.35], [1, '#ffffff', 1]], { x1: fadeA.x, y1: fadeA.y, x2: fadeB.x, y2: fadeB.y, user: true }) +
  `<mask id="${u('introMask')}" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="200"><rect x="0" y="0" width="640" height="200" fill="${u.url('introFade')}"/></mask>`;
const PIVOT: P = [Math.round(pivotP.x * 10) / 10, Math.round(pivotP.y * 10) / 10];

let furDark = '';
let furLight = '';
for (let k = 1; k < 11; k++) {
  const th = (Math.PI * k) / 11;
  const ts = tSeq(TI0 + 0.006, 0.996, 70);
  const wav = (t: number) => 0.035 * Math.sin(t * 110 + k * 1.7) * Math.sin(th);
  furDark += poly(ts.map((t) => surfR(t, Math.cos(th) + wav(t))), false);
  furLight += poly(ts.map((t) => surfR(t, Math.cos(th) + wav(t) - 0.05)), false);
}
// nếp ngang mảnh ở gốc vòi
let introWrinkle = '';
for (let s = (TI0 + 0.012) * LEN; s < (TI0 + 0.06) * LEN; s += 2.8) {
  const pts: P[] = [];
  for (let k = 0; k <= 8; k++) {
    const v = -0.95 + (1.9 * k) / 8;
    pts.push(surfR((s + 0.1 * R(s / LEN) * Math.sqrt(1 - v * v)) / LEN, v));
  }
  introWrinkle += poly(pts, false);
}
const tipP = at(LEN * 0.992);

// =====================================================================
// DEFS
// =====================================================================
const defs =
  clip(u('trunkClip'), TRUNK_D) +
  clip(u('introClip'), INTRO_D) +
  INTRO_MASK +
  blurFilter(u('soft'), 1.1) +
  blurFilter(u('soft2'), 2.2) +
  blurFilter(u('shadowBlur'), 5) +
  linear(
    u('iris'),
    [
      [0, '#B9A6E0', 0.0],
      [0.12, '#B9A6E0', 0.22],
      [0.28, '#9FD8D2', 0.14],
      [0.45, '#F2B9C8', 0.12],
      [0.62, '#B7A4E4', 0.2],
      [0.78, '#A6DCD8', 0.12],
      [1, '#F2C4CF', 0.06],
    ],
    { x1: 30, y1: 0, x2: 620, y2: 0, user: true },
  ) +
  linear(
    u('rimTrunk'),
    [
      [0, '#ffffff', 0],
      [0.08, '#ffffff', 0.55],
      [0.7, '#ffffff', 0.7],
      [0.8, '#ffffff', 0.25],
    ],
    { x1: 30, y1: 0, x2: 620, y2: 0, user: true },
  ) +
  radial(
    u('sandFade'),
    [
      [0, '#ffffff', 1],
      [0.62, '#ffffff', 0.85],
      [1, '#ffffff', 0],
    ],
    { cx: 0.5, cy: 0.52, r: 0.5 },
  ) +
  `<mask id="${u('sandMask')}" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="200"><ellipse cx="322" cy="108" rx="318" ry="96" fill="${u.url('sandFade')}"/></mask>` +
  linear(u('sandFill'), [
    [0, '#CBB994'],
    [0.5, '#BDAA84'],
    [1, '#A39070'],
  ]);

// =====================================================================
// LỚP
// =====================================================================
const sandBack =
  `<g mask="${u.url('sandMask')}">` +
  `<rect x="0" y="0" width="640" height="200" fill="${u.url('sandFill')}"/>` +
  `<g opacity="0.9">${grains}</g>${shells}` +
  `</g>`;
const shadow = `<g filter="${u.url('shadowBlur')}"><path d="${TRUNK_D}" fill="#3A2C1E" opacity="0.42" transform="translate(4 8)"/><path d="${INTRO_D}" fill="#3A2C1E" opacity="0.36" transform="translate(4 7)"/></g>`;

const trunkBody =
  `<g clip-path="${u.url('trunkClip')}">` +
  `<path d="${TRUNK_D}" fill="${pal(PAL_TRUNK, 0)}"/>` +
  `<g filter="${u.url('soft')}">${bands(0, TE, PAL_TRUNK, 16, Rtrunk)}</g>` +
  `<path d="${TRUNK_D}" fill="${u.url('iris')}"/>` +
  `<g filter="${u.url('soft2')}" fill="none" stroke="#6E5E8C" stroke-opacity="0.16">` +
  [0.2, 0.43, 0.64]
    .map((t) => `<path d="${poly([-1.1, -0.5, 0, 0.5, 1.1].map((v) => surfR(t, v)), false)}" stroke-width="9"/>`)
    .join('') +
  `</g>` +
  `</g>`;

const trunkGrid =
  `<g clip-path="${u.url('trunkClip')}" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="${longLight}" stroke="#FFF3F8" stroke-opacity="0.16" stroke-width="0.5"/>` +
  `<path d="${longDark}" stroke="${INK}" stroke-opacity="0.38" stroke-width="0.6"/>` +
  `<path d="${ringLight}" stroke="#FFF3F8" stroke-opacity="0.2" stroke-width="0.6"/>` +
  `<path d="${ringDark}" stroke="${INK}" stroke-opacity="0.52" stroke-width="0.75"/>` +
  `<path d="${cellLo}" stroke="#F4E6F2" stroke-opacity="0.14" stroke-width="2"/>` +
  `<path d="${cellMid}" stroke="#FFF4F9" stroke-opacity="0.3" stroke-width="2.1"/>` +
  `<path d="${cellHi}" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="2.2"/>` +
  `</g>`;

const trunkFinish =
  `<g clip-path="${u.url('trunkClip')}" fill="none" stroke-linecap="round">` +
  // vệt bóng ngọc trai dài dọc thân
  `<path d="${TOP_EDGE(0.06, 0.74, 0.5)}" stroke="#ffffff" stroke-opacity="0.26" stroke-width="5" filter="${u.url('soft2')}"/>` +
  `<path d="${TOP_EDGE(0.1, 0.7, 0.56)}" stroke="#ffffff" stroke-opacity="0.32" stroke-width="1.2"/>` +
  // ánh phản xạ mép bụng (từ cát)
  `<path d="${TOP_EDGE(0.08, 0.74, -0.86)}" stroke="#E9D2C8" stroke-opacity="0.32" stroke-width="2.2" filter="${u.url('soft')}"/>` +
  // rãnh cổ: thân thắt lại trước khi vào vòi
  `</g>` +
  `<path d="${TRUNK_LINE}" fill="none" stroke="${INK}" stroke-opacity="0.6" stroke-width="1.5" stroke-linejoin="round"/>` +
  `<path d="${TOP_EDGE(0.03, TJ - 0.01, 0.9)}" fill="none" stroke="${u.url('rimTrunk')}" stroke-width="1.7" stroke-linecap="round"/>`;

const intro =
  `<g mask="${u.url('introMask')}">` +
  `<g clip-path="${u.url('introClip')}">` +
  `<path d="${INTRO_D}" fill="${pal(PAL_INTRO, 0)}"/>` +
  `<g filter="${u.url('soft')}">${bands(TI0 - 0.012, 1, PAL_INTRO, 14)}</g>` +
  `<path d="${INTRO_D}" fill="${u.url('iris')}" opacity="0.6"/>` +
  `<g fill="none" stroke-linecap="round">` +
  `<path d="${introWrinkle}" stroke="${INK_I}" stroke-opacity="0.22" stroke-width="0.55"/>` +
  `<path d="${furLight}" stroke="#FFFAFA" stroke-opacity="0.5" stroke-width="0.7"/>` +
  `<path d="${furDark}" stroke="${INK_I}" stroke-opacity="0.42" stroke-width="0.75"/>` +
  `<path d="${TOP_EDGE(TI0 + 0.01, 0.97, 0.5)}" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3.2" filter="${u.url('soft')}"/>` +
  `<path d="${TOP_EDGE(TI0 + 0.01, 0.98, -0.85)}" stroke="#F0DAD2" stroke-opacity="0.3" stroke-width="1.6" filter="${u.url('soft')}"/>` +
  // bóng tối ở gốc vòi (vòi chui ra từ cổ thân)
  `</g>` +
  // miệng ở chóp vòi
  `<ellipse cx="${f(tipP.x + 1.5)}" cy="${f(tipP.y)}" rx="2.2" ry="1.6" fill="#9A7280" opacity="0.55"/>` +
  `</g>` +
  `<path d="${poly([...introTop, ...introBot], false)}" fill="none" stroke="${INK_I}" stroke-opacity="0.58" stroke-width="1.3" stroke-linejoin="round"/>` +
  `<path d="${TOP_EDGE(TI0 + 0.004, 0.985, 0.9)}" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="1.3" stroke-linecap="round"/>` +
  `</g>`;

const dust =
  `<g clip-path="${u.url('trunkClip')}">` +
  `<path d="${TOP_EDGE(0.12, 0.7, -0.82)}" fill="none" stroke="#C9B48A" stroke-opacity="0.3" stroke-width="5" filter="${u.url('soft2')}"/>` +
  sandDust +
  `</g>`;

const art: CreatureArt = {
  id: ID,
  viewBox: [640, 200],
  defs,
  lengthUnits: Math.round(LEN),
  displayLengthPx: 120, // dài thật ~94px quá nhỏ để thấy lưới ô
  spineY: 106,
  animation: 'eel',
  // bò chậm, co duỗi: uốn rất nhẹ, nhịp chậm
  cycleHz: 0.32,
  bendAmp: 9,
  cardDetailLevel: 'hi',
  layers: [
    { name: 'sand', role: 'detail', bend: false, z: 'back', cardOnly: true, pivot: [320, 100], svg: sandBack },
    { name: 'shadow', role: 'detail', bend: false, z: 'back', cardOnly: true, pivot: [320, 100], svg: shadow },
    { name: 'trunk', role: 'body', svg: trunkBody },
    { name: 'grid', role: 'pattern', svg: trunkGrid },
    { name: 'trunkFinish', role: 'detail', svg: trunkFinish },
    {
      name: 'introvert',
      role: 'detail',
      bend: false,
      z: 'front',
      pivot: PIVOT,
      // vòi thò ra / thụt vào chậm
      anim: { type: 'scaleX', amp: 0.09, speed: 0.5, phase: 0.6 },
      svg: intro,
    },
    { name: 'sandDust', role: 'detail', bend: false, z: 'front', cardOnly: true, pivot: [320, 120], svg: dust },
  ],
};

export default art;
