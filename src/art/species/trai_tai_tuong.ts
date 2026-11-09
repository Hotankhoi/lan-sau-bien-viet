/**
 * Trai tai tượng vảy – Tridacna squamosa
 * Góc nhìn 3/4 từ trên-trước: dải vỏ xa phía sau (diềm vảy), màng áo rực rỡ tràn giữa hai mép vỏ,
 * mặt ngoài vỏ gần phía dưới với 5 gờ lớn mang các hàng vảy xòe như diềm áo (trắng ngà).
 * Màng áo: nền nâu sẫm, tia & đốm nâu vàng / xanh lam / xanh lục, viền xanh ngọc + hàng chấm sẫm,
 * ống thoát nước bầu dục. Màng áo "thở" nhẹ (pulse), lấp lánh (glow), khép vỏ khi hoảng (alarm).
 */
import type { CreatureArt } from '../contract';
import { makeIds, linear, radial, blurFilter, organicTexture, dotPattern, rimGradient, rng, joinDefs } from '../style-bible';

const u = makeIds('trai_tai_tuong');

type Pt = [number, number];
type Fn = (x: number) => number;

// ---------- Hình học chung ----------
const X0 = 34; // đầu trái mép khép
const X1 = 526; // đầu phải
const XC = 280;
const PER = 92; // chu kỳ gờ (5 gờ: 96, 188, 280, 372, 464)
const PIVOT: Pt = [280, 160];

const env = (x: number) => Math.max(0, Math.sin((Math.PI * (x - X0)) / (X1 - X0)));
const ph = (x: number) => Math.cos((2 * Math.PI * (x - XC)) / PER);
/** mép vỏ gần (dưới) */
const yN: Fn = (x) => 224 + 22 * env(x) ** 0.7 - 24 * env(x) ** 0.6 * ph(x);
/** mép vỏ xa (trên) */
const yF: Fn = (x) => 224 - 112 * env(x) ** 0.8 - 22 * env(x) ** 0.6 * ph(x);
/** đỉnh dải vỏ xa */
const yFT: Fn = (x) => yF(x) - 40 * env(x) ** 0.5 + 9 * env(x) ** 0.6 * ph(x);
/** đường giữa hai thùy màng áo */
const yS: Fn = (x) => yF(x) + (yN(x) - yF(x)) * 0.54;
/** mép màng áo (tràn qua mép vỏ, gợn nhẹ) */
const yMT: Fn = (x) => yF(x) - 7 * env(x) ** 0.5 + 1.5 * Math.sin(x / 5.1) * env(x) ** 0.5;
const yMB: Fn = (x) => yN(x) + 9 * env(x) ** 0.5 + 1.6 * Math.sin(x / 4.6 + 1) * env(x) ** 0.5;

const CRESTS = [96, 188, 280, 372, 464];
const TROUGHS = [142, 234, 326, 418];
const uOf = (x: number) => (x - X0) / (X1 - X0);

const f1 = (n: number) => n.toFixed(1);
const P = (p: Pt) => `${f1(p[0])} ${f1(p[1])}`;
const poly = (pts: Pt[], close = true) => 'M' + pts.map(P).join('L') + (close ? 'Z' : '');
const range = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

// ---------- Màu ----------
const IVORY = '#F4EBD8';
const IVORY_L = '#FFFBF2';
const IVORY_D = '#CDB894';
const SHELL_LINE = '#7d6a4c';
const GROOVE = '#6b5636';
const MANTLE = '#30271b';
const TEAL = '#4FE0D6';
const PALETTE: [string, number][] = [
  ['#E0B45A', 0.32],
  ['#3CC6C8', 0.22],
  ['#2F86D8', 0.17],
  ['#6CC070', 0.17],
  ['#C98A3A', 0.12],
];
function pick(r: () => number): string {
  let v = r();
  for (const [c, w] of PALETTE) {
    if (v < w) return c;
    v -= w;
  }
  return PALETTE[0][0];
}

// ---------- Vảy xòe (diềm) ----------
/**
 * Một vảy hình bán nguyệt có 4 thùy nhỏ ở mép tự do, gốc tại (cx,cy), mở theo hướng t (đơn vị).
 */
function flute(c: Pt, t: Pt, w: number, h: number, tint: string, seed: number): string {
  const n: Pt = [-t[1], t[0]];
  const at = (a: number, b: number): Pt => [c[0] + n[0] * a + t[0] * b, c[1] + n[1] * a + t[1] * b];
  const edge: Pt[] = [];
  const N = 18;
  for (let i = 0; i <= N; i++) {
    const th = Math.PI - (Math.PI * i) / N;
    const k = 1 + 0.09 * Math.abs(Math.sin(th * 4));
    edge.push(at((w / 2) * Math.cos(th) * k, h * Math.sin(th) * k));
  }
  const base = at(0, h * 0.28);
  const body = `M${P(edge[0])}L${edge.slice(1).map(P).join('L')}Q${P(base)} ${P(edge[0])}Z`;
  // bóng đổ (nắng từ trên-phải → bóng lệch xuống-trái, về phía gốc vảy)
  const sh: Pt = [-t[0] * h * 0.32 + n[0] * 0 - 1.2, -t[1] * h * 0.32 + 1.4];
  const shadow = `<path d="${body}" transform="translate(${f1(sh[0])} ${f1(sh[1])})" fill="#5a4630" fill-opacity="0.32"/>`;
  // nếp gấp trên vảy
  const r = rng(seed);
  let flutes = '';
  for (const k of [0.22, 0.4, 0.6, 0.78]) {
    const e = edge[Math.round(k * N)];
    const b = at((k - 0.5) * w * 0.25, h * 0.2);
    flutes += `M${P(b)}L${P([e[0] + (r() - 0.5), e[1] + (r() - 0.5)])}`;
  }
  return (
    shadow +
    `<path d="${body}" fill="${tint}" stroke="${SHELL_LINE}" stroke-opacity="0.55" stroke-width="0.8" stroke-linejoin="round"/>` +
    `<path d="${flutes}" fill="none" stroke="#a48a63" stroke-opacity="0.45" stroke-width="0.6"/>` +
    // mép tự do sáng (dày vỏ)
    `<path d="M${edge.slice(3, N - 2).map(P).join('L')}" fill="none" stroke="#ffffff" stroke-opacity="0.75" stroke-width="0.9" stroke-linecap="round"/>`
  );
}

const SCALE_TINTS = ['#FFF9EE', '#FBF1DF', '#FFF4E6', '#F7E6CF', '#FDEFE3'];

// ---------- Mảnh vỏ gần (mặt ngoài, phía dưới) ----------
function nearPt(uu: number, s: number, mf: Fn): Pt {
  const xm = X0 + (X1 - X0) * uu;
  const ux = 246 + 68 * uu;
  const y0 = 380 - 10 * (2 * uu - 1) ** 2;
  const g = Math.sin((s * Math.PI) / 2) ** 0.62;
  return [ux + (xm - ux) * g, y0 + (mf(xm) - y0) * s];
}

function nearOutline(mf: Fn): string {
  const pts: Pt[] = [];
  for (const uu of range(0, 1, 90)) pts.push(nearPt(uu, 1, mf));
  for (const s of range(1, 0, 30)) pts.push(nearPt(1, s, mf));
  for (const uu of range(1, 0, 16)) pts.push(nearPt(uu, 0, mf));
  for (const s of range(0, 1, 30)) pts.push(nearPt(0, s, mf));
  return poly(pts);
}

function nearValve(mf: Fn, clipName: string, seed: number): { defs: string; svg: string } {
  const outline = nearOutline(mf);
  const ribLine = (uu: number, s0 = 0.04, s1 = 1) => poly(range(s0, s1, 24).map((s) => nearPt(uu, s, mf)), false);
  let grooves = '';
  let highs = '';
  for (const x of TROUGHS) grooves += ribLine(uOf(x));
  for (const x of CRESTS) highs += ribLine(uOf(x) + 0.018, 0.08, 0.98);
  let growth = '';
  for (const s of [0.3, 0.42, 0.53, 0.63, 0.72, 0.8, 0.87, 0.93]) {
    growth += poly(range(0.01, 0.99, 50).map((uu) => nearPt(uu, s, mf)), false);
  }
  // vảy xòe trên các gờ
  const r = rng(seed);
  let scales = '';
  const du = PER / 2 / (X1 - X0);
  for (const x of CRESTS) {
    const uu = uOf(x);
    for (const s of [0.36, 0.48, 0.59, 0.68, 0.76, 0.83, 0.89, 0.945]) {
      const c = nearPt(uu, s, mf);
      const c2 = nearPt(uu, s + 0.02, mf);
      const tl = Math.hypot(c2[0] - c[0], c2[1] - c[1]);
      const t: Pt = [(c2[0] - c[0]) / tl, (c2[1] - c[1]) / tl];
      const a = nearPt(uu - du, s, mf);
      const b = nearPt(uu + du, s, mf);
      const rw = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const w = rw * (0.5 + 0.12 * s) * (0.92 + r() * 0.16);
      const h = w * (0.34 + 0.08 * s);
      scales += flute(c, t, w, h, SCALE_TINTS[Math.floor(r() * SCALE_TINTS.length)], seed + Math.round(s * 100) + x);
    }
  }
  const cid = u(clipName);
  const defs = `<clipPath id="${cid}"><path d="${outline}"/></clipPath>`;
  const svg =
    `<path d="${outline}" fill="${u.url('nearFill')}"/>` +
    `<g clip-path="url(#${cid})">` +
    `<path d="${outline}" fill="${IVORY}" filter="${u.url('tex')}" opacity="0.55"/>` +
    // rãnh giữa các gờ: bóng mềm + đường rãnh
    `<g filter="${u.url('soft3')}"><path d="${grooves}" fill="none" stroke="${GROOVE}" stroke-opacity="0.45" stroke-width="14" stroke-linecap="round"/>` +
    `<path d="${highs}" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="9" stroke-linecap="round"/></g>` +
    `<path d="${grooves}" fill="none" stroke="#5a472c" stroke-opacity="0.45" stroke-width="1.6"/>` +
    `<path d="${growth}" fill="none" stroke="#9c845e" stroke-opacity="0.32" stroke-width="0.8"/>` +
    // đáy vỏ tối dần (cong khuất) + bóng tiếp đất
    `<path d="${outline}" fill="${u.url('nearShade')}"/>` +
    scales +
    `</g>` +
    `<path d="${outline}" fill="none" stroke="${SHELL_LINE}" stroke-opacity="0.6" stroke-width="1.8" stroke-linejoin="round"/>` +
    // rim light mép trái-trên của vỏ (nắng từ trên)
    `<path d="${poly(range(0.02, 0.98, 60).map((uu) => nearPt(uu, 0.985, mf)), false)}" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1.4"/>`;
  return { defs, svg };
}

// ---------- Mảnh vỏ xa (dải phía sau có diềm vảy) ----------
function farPt(uu: number, s: number, mf: Fn): Pt {
  const xm = X0 + (X1 - X0) * uu;
  const top = yFT(xm) - (s === 0 ? 2.6 * Math.abs(Math.sin((Math.PI * (xm - X0)) / 11)) * env(xm) ** 0.5 : 0);
  return [XC + (xm - XC) * (0.955 + 0.045 * s), top + (mf(xm) - top) * s];
}

function farValve(mf: Fn, seed: number): string {
  const pts: Pt[] = [];
  for (const uu of range(0, 1, 160)) pts.push(farPt(uu, 0, mf));
  for (const uu of range(1, 0, 90)) pts.push(farPt(uu, 1, mf));
  const outline = poly(pts);
  const ribLine = (uu: number) => poly(range(0, 1, 16).map((s) => farPt(uu, s, mf)), false);
  let grooves = '';
  let highs = '';
  for (const x of TROUGHS) grooves += ribLine(uOf(x));
  for (const x of CRESTS) highs += ribLine(uOf(x) + 0.016);
  let growth = '';
  for (const s of [0.25, 0.5, 0.75]) growth += poly(range(0.02, 0.98, 50).map((uu) => farPt(uu, s, mf)), false);
  const r = rng(seed);
  let scales = '';
  const du = PER / 2 / (X1 - X0);
  for (const x of CRESTS) {
    const uu = uOf(x);
    const rows = mf === yF ? [0.08, 0.34, 0.6] : [0.08, 0.28, 0.48, 0.68];
    for (const s of rows) {
      const c = farPt(uu, s, mf);
      const c2 = farPt(uu, s + 0.04, mf);
      const tl = Math.hypot(c2[0] - c[0], c2[1] - c[1]) || 1;
      const t: Pt = [(c2[0] - c[0]) / tl, (c2[1] - c[1]) / tl];
      const a = farPt(uu - du, s, mf);
      const b = farPt(uu + du, s, mf);
      const rw = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const w = rw * 0.52 * (0.92 + r() * 0.16);
      const h = w * 0.3;
      scales += flute(c, t, w, h, SCALE_TINTS[Math.floor(r() * SCALE_TINTS.length)], seed + x + Math.round(s * 50));
    }
  }
  return (
    `<path d="${outline}" fill="${u.url('farFill')}"/>` +
    `<g clip-path="${u.url(mf === yF ? 'farClip' : 'farClipShut')}">` +
    `<path d="${outline}" fill="${IVORY}" filter="${u.url('tex')}" opacity="0.5"/>` +
    `<g filter="${u.url('soft3')}"><path d="${grooves}" fill="none" stroke="${GROOVE}" stroke-opacity="0.5" stroke-width="12" stroke-linecap="round"/>` +
    `<path d="${highs}" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="8"/></g>` +
    `<path d="${grooves}" fill="none" stroke="#5a472c" stroke-opacity="0.4" stroke-width="1.4"/>` +
    `<path d="${growth}" fill="none" stroke="#9c845e" stroke-opacity="0.3" stroke-width="0.8"/>` +
    scales +
    `</g>` +
    `<path d="${outline}" fill="none" stroke="${SHELL_LINE}" stroke-opacity="0.6" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<path d="${poly(range(0.03, 0.97, 120).map((uu) => farPt(uu, 0, mf)), false)}" fill="none" stroke="${u.url('rim')}" stroke-width="2.2"/>`
  );
}

function farOutline(mf: Fn): string {
  const pts: Pt[] = [];
  for (const uu of range(0, 1, 160)) pts.push(farPt(uu, 0, mf));
  for (const uu of range(1, 0, 90)) pts.push(farPt(uu, 1, mf));
  return poly(pts);
}

// ---------- Màng áo ----------
const MX0 = 46;
const MX1 = 514;
const mantleTopPts = range(MX0, MX1, 140).map((x): Pt => [x, yMT(x)]);
const mantleBotPts = range(MX0, MX1, 140).map((x): Pt => [x, yMB(x)]);
const seamPts = range(MX0 + 4, MX1 - 4, 120).map((x): Pt => [x, yS(x)]);
const MANTLE_D = poly([...mantleTopPts, ...[...mantleBotPts].reverse()]);
const UPPER_D = poly([...mantleTopPts, [MX1, yS(MX1)], ...[...seamPts].reverse(), [MX0, yS(MX0)]]);
const LOWER_D = poly([[MX0, yS(MX0)], ...seamPts, [MX1, yS(MX1)], ...[...mantleBotPts].reverse()]);
const SEAM_D = poly(seamPts, false);

const SIPHON: Pt = [372, yS(372) - 1];

function streaks(upper: boolean, seed: number): string {
  const r = rng(seed);
  let s = '';
  for (let x = MX0 + 6; x < MX1 - 6; x += 4.2 + r() * 4.2) {
    const e = env(x);
    if (e < 0.12) continue;
    if (Math.abs(x - SIPHON[0]) < 22 && !upper) continue;
    const ey = upper ? yMT(x) + 6 : yMB(x) - 6;
    const sy = yS(x) + (upper ? -1 : 1);
    const depth = Math.abs(sy - ey);
    if (depth < 6) continue;
    const f = 0.28 + r() * 0.62;
    const tipX = x + (r() - 0.5) * 7;
    const tipY = ey + (sy - ey) * f;
    const w = (2.2 + r() * 4.6) * (0.55 + 0.45 * e);
    const my = (ey + tipY) / 2;
    const c = pick(r);
    s += `<path d="M${f1(x - w / 2)} ${f1(ey)}Q${f1(x - w * 0.62)} ${f1(my)} ${f1(tipX)} ${f1(tipY)}Q${f1(x + w * 0.62)} ${f1(my)} ${f1(x + w / 2)} ${f1(ey)}Z" fill="${c}" fill-opacity="${(0.62 + r() * 0.33).toFixed(2)}"/>`;
  }
  // đốm loang
  for (let i = 0; i < 110; i++) {
    const x = MX0 + 10 + r() * (MX1 - MX0 - 20);
    const top = upper ? yMT(x) : yS(x);
    const bot = upper ? yS(x) : yMB(x);
    const y = top + (bot - top) * (0.15 + r() * 0.75);
    const rr = (1.2 + r() * 3.6) * (0.5 + 0.5 * env(x));
    s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rr * 0.7)}" ry="${f1(rr)}" fill="${pick(r)}" fill-opacity="${(0.45 + r() * 0.4).toFixed(2)}"/>`;
  }
  return s;
}

/** hàng chấm sẫm sát mép màng áo (mắt hyaline) */
function edgeDots(fn: Fn, inward: number, seed: number): string {
  const r = rng(seed);
  let d = '';
  for (let x = MX0 + 8; x < MX1 - 8; x += 6.5 + r() * 2.5) {
    const e = env(x);
    if (e < 0.15) continue;
    d += `<circle cx="${f1(x)}" cy="${f1(fn(x) + inward)}" r="${f1(0.9 + 0.7 * e)}"/>`;
  }
  return `<g fill="#120c07" fill-opacity="0.85">${d}</g>`;
}

function siphon(): string {
  const [x, y] = SIPHON;
  return (
    `<ellipse cx="${x}" cy="${y + 2}" rx="25" ry="14" fill="#140f0a" opacity="0.45" filter="${u.url('soft3')}"/>` +
    `<ellipse cx="${x}" cy="${y}" rx="22" ry="12.5" fill="${u.url('siphonCone')}"/>` +
    `<ellipse cx="${x}" cy="${y}" rx="22" ry="12.5" fill="none" stroke="${TEAL}" stroke-opacity="0.7" stroke-width="1.3"/>` +
    `<ellipse cx="${x + 0.5}" cy="${y + 0.5}" rx="12" ry="6.4" fill="${u.url('siphonHole')}"/>` +
    `<path d="M${x - 11} ${y - 1.5}Q${x} ${y - 8} ${x + 11} ${y - 1.5}" fill="none" stroke="#e9fffb" stroke-opacity="0.75" stroke-width="1.2" stroke-linecap="round"/>` +
    `<ellipse cx="${x - 9}" cy="${y - 6}" rx="5" ry="2" fill="#ffffff" opacity="0.35" transform="rotate(-14 ${x - 9} ${y - 6})"/>`
  );
}

function mantle(): string {
  const highUpper = poly(range(MX0 + 20, MX1 - 20, 80).map((x): Pt => [x, yMT(x) + (yS(x) - yMT(x)) * 0.32]), false);
  const highLower = poly(range(MX0 + 20, MX1 - 20, 80).map((x): Pt => [x, yS(x) + (yMB(x) - yS(x)) * 0.62]), false);
  return (
    // bóng màng áo đổ lên vỏ gần
    `<path d="${poly(mantleBotPts.map(([x, y]): Pt => [x, y + 4]), false)}" fill="none" stroke="#3b2c18" stroke-opacity="0.45" stroke-width="7" filter="${u.url('soft3')}"/>` +
    `<path d="${MANTLE_D}" fill="${u.url('mantleBase')}"/>` +
    `<g clip-path="${u.url('upperClip')}">${streaks(true, 101)}</g>` +
    `<g clip-path="${u.url('lowerClip')}">${streaks(false, 202)}</g>` +
    `<g clip-path="${u.url('mantleClip')}">` +
    // lấm tấm sẫm
    `<path d="${MANTLE_D}" fill="${u.url('stipple')}"/>` +
    // nếp gấp ziczac: sáng ở sườn hướng nắng, tối ở nếp lõm
    `<path d="${MANTLE_D}" fill="${u.url('folds')}"/>` +
    // khối: rãnh giữa tối, lưng thùy sáng
    `<g filter="${u.url('soft4')}">` +
    `<path d="${SEAM_D}" fill="none" stroke="#0d0905" stroke-opacity="0.75" stroke-width="15"/>` +
    `<path d="${highUpper}" fill="none" stroke="#fff3d8" stroke-opacity="0.16" stroke-width="16"/>` +
    `<path d="${highLower}" fill="none" stroke="#fff3d8" stroke-opacity="0.13" stroke-width="14"/>` +
    `</g>` +
    // đường giữa hai thùy
    `<path d="${SEAM_D}" fill="none" stroke="#080503" stroke-opacity="0.9" stroke-width="2.4"/>` +
    `<path d="${poly(seamPts.map(([x, y]): Pt => [x, y + 2.2]), false)}" fill="none" stroke="${TEAL}" stroke-opacity="0.35" stroke-width="0.9"/>` +
    // dải mép sẫm + hàng chấm
    `<path d="${poly(mantleTopPts, false)}" fill="none" stroke="#1d140b" stroke-opacity="0.8" stroke-width="7"/>` +
    `<path d="${poly(mantleBotPts, false)}" fill="none" stroke="#1d140b" stroke-opacity="0.8" stroke-width="7"/>` +
    `<path d="${poly(mantleTopPts.map(([x, y]): Pt => [x, y + 4.2]), false)}" fill="none" stroke="#E0B45A" stroke-opacity="0.55" stroke-width="1.1"/>` +
    `<path d="${poly(mantleBotPts.map(([x, y]): Pt => [x, y - 4.2]), false)}" fill="none" stroke="#E0B45A" stroke-opacity="0.5" stroke-width="1.1"/>` +
    edgeDots(yMT, 6.6, 7) +
    edgeDots(yMB, -6.6, 8) +
    siphon() +
    `</g>` +
    // viền xanh ngọc ở mép màng áo
    `<path d="${MANTLE_D}" fill="none" stroke="${TEAL}" stroke-opacity="0.85" stroke-width="1.7" stroke-linejoin="round"/>` +
    `<path d="${poly(mantleTopPts, false)}" fill="none" stroke="#d8fffb" stroke-opacity="0.45" stroke-width="0.7"/>`
  );
}

function sparkles(): string {
  const r = rng(909);
  let s = '';
  for (let i = 0; i < 150; i++) {
    const x = MX0 + 14 + r() * (MX1 - MX0 - 28);
    const y = yMT(x) + (yMB(x) - yMT(x)) * (0.08 + r() * 0.84);
    if (Math.abs(y - yS(x)) < 3) continue;
    const big = r() < 0.12;
    const rr = big ? 1.3 + r() * 0.8 : 0.45 + r() * 0.7;
    const c = r() < 0.6 ? '#bff8ff' : r() < 0.5 ? '#b6ffcf' : '#ffe9a8';
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${rr.toFixed(2)}" fill="${c}" fill-opacity="${(0.55 + r() * 0.4).toFixed(2)}"/>`;
  }
  return `<g clip-path="${u.url('sparkClip')}">${s}</g>`;
}

// ---------- Trạng thái khép vỏ (alarm) ----------
const yShutN: Fn = (x) => yS(x) + 1.6;
const yShutF: Fn = (x) => yS(x) - 1.6;
const nearShut = nearValve(yShutN, 'nearClipShut', 77);

function closedShell(): string {
  const seam = poly(range(X0 + 6, X1 - 6, 120).map((x): Pt => [x, yS(x)]), false);
  return (
    // khe hẹp lộ màng áo
    `<path d="${seam}" fill="none" stroke="#1b130b" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="${seam}" fill="none" stroke="${TEAL}" stroke-opacity="0.6" stroke-width="2"/>` +
    farValve(yShutF, 55) +
    nearShut.svg +
    // bóng của vỏ xa đổ xuống khe
    `<path d="${poly(range(X0 + 10, X1 - 10, 100).map((x): Pt => [x, yS(x) + 2.4]), false)}" fill="none" stroke="#2a1d10" stroke-opacity="0.35" stroke-width="2.4"/>`
  );
}

// ---------- Nền rạn (chỉ thẻ) ----------
function reef(): string {
  const r = rng(31);
  const pts: Pt[] = [[0, 400]];
  for (let x = 0; x <= 560; x += 16) {
    const hump = 300 + 50 * Math.cos(((x - 280) / 300) * Math.PI) * -0.4 + (r() - 0.5) * 14;
    pts.push([x, Math.min(392, hump + Math.abs(x - 280) * -0.08 + 12)]);
  }
  pts.push([560, 400]);
  let blobs = '';
  for (let i = 0; i < 16; i++) {
    const x = 10 + r() * 540;
    const y = 330 + r() * 60;
    blobs += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(8 + r() * 18)}" ry="${f1(4 + r() * 8)}" fill="${r() < 0.5 ? '#b55a78' : '#7a5f8a'}" fill-opacity="0.55"/>`;
  }
  return (
    `<path d="${poly(pts)}" fill="${u.url('rock')}"/>` +
    `<g filter="${u.url('tex')}">${blobs}</g>` +
    `<ellipse cx="280" cy="372" rx="230" ry="20" fill="#0d0a10" opacity="0.45" filter="${u.url('soft4')}"/>`
  );
}

// ---------- Defs ----------
const nearOpen = nearValve(yN, 'nearClip', 13);

const defs = joinDefs(
  nearOpen,
  nearShut,
  linear(
    u('nearFill'),
    [
      [0, IVORY_L],
      [0.35, IVORY],
      [0.75, '#E6D7BA'],
      [1, IVORY_D],
    ],
    { user: true, x1: 0, y1: 150, x2: 0, y2: 382 },
  ),
  linear(
    u('nearShade'),
    [
      [0, '#2b1f12', 0],
      [0.55, '#2b1f12', 0],
      [1, '#2b1f12', 0.38],
    ],
    { user: true, x1: 0, y1: 170, x2: 0, y2: 382 },
  ),
  linear(
    u('farFill'),
    [
      [0, '#D9C7A3'],
      [0.5, '#EDE1C8'],
      [1, IVORY_L],
    ],
    { user: true, x1: 0, y1: 40, x2: 0, y2: 150 },
  ),
  rimGradient(u('rim'), '#ffffff', 0.9),
  `<clipPath id="${u('farClip')}"><path d="${farOutline(yF)}"/></clipPath>`,
  `<clipPath id="${u('farClipShut')}"><path d="${farOutline(yShutF)}"/></clipPath>`,
  `<clipPath id="${u('mantleClip')}"><path d="${MANTLE_D}"/></clipPath>`,
  `<clipPath id="${u('upperClip')}"><path d="${UPPER_D}"/></clipPath>`,
  `<clipPath id="${u('lowerClip')}"><path d="${LOWER_D}"/></clipPath>`,
  `<clipPath id="${u('sparkClip')}"><path d="${MANTLE_D}" transform="translate(${PIVOT[0]} ${PIVOT[1]}) scale(0.95) translate(${-PIVOT[0]} ${-PIVOT[1]})"/></clipPath>`,
  linear(
    u('mantleBase'),
    [
      [0, '#4a3b22'],
      [0.4, MANTLE],
      [0.6, '#211a12'],
      [1, '#463722'],
    ],
    { user: true, x1: 0, y1: 70, x2: 0, y2: 260 },
  ),
  linear(
    u('folds'),
    [
      [0, '#fff2d0', 0.14],
      [0.25, '#fff2d0', 0],
      [0.5, '#000000', 0.28],
      [0.75, '#000000', 0],
      [1, '#fff2d0', 0.14],
    ],
    { user: true, x1: XC - 10, y1: 0, x2: XC - 10 + PER, y2: 0, spread: 'repeat' },
  ),
  dotPattern(u('stipple'), { gap: 3.4, r: 0.55, color: '#0c0805', opacity: 0.4 }),
  radial(u('siphonCone'), [
    [0, '#2a3a36'],
    [0.55, '#5b6a52'],
    [0.85, '#8fa38a'],
    [1, '#3f5a54'],
  ]),
  radial(
    u('siphonHole'),
    [
      [0, '#000000'],
      [0.7, '#0e1412'],
      [1, '#355a55'],
    ],
    { fy: 0.35 },
  ),
  linear(
    u('rock'),
    [
      [0, '#5a4a52'],
      [1, '#241a22'],
    ],
    { user: true, x1: 0, y1: 290, x2: 0, y2: 400 },
  ),
  blurFilter(u('soft3'), 3),
  blurFilter(u('soft4'), 4.5),
  organicTexture(u('tex'), { freq: 0.09, octaves: 3, strength: 0.32, seed: 11 }),
);

const art: CreatureArt = {
  id: 'trai_tai_tuong',
  viewBox: [560, 400],
  lengthUnits: X1 - X0,
  spineY: 210,
  animation: 'static',
  cycleHz: 0.25,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    { name: 'reef', role: 'detail', bend: false, z: 'back', cardOnly: true, svg: reef() },
    { name: 'farValve', role: 'body', svg: farValve(yF, 21) },
    { name: 'nearValve', role: 'body', svg: nearOpen.svg },
    {
      name: 'mantle',
      role: 'detail',
      bend: false,
      z: 'front',
      pivot: PIVOT,
      anim: { type: 'pulse', amp: 0.018 },
      svg: mantle(),
    },
    {
      name: 'sparkle',
      role: 'glow',
      bend: false,
      z: 'front',
      blend: 'add',
      pivot: PIVOT,
      anim: { type: 'alpha', amp: 0.6, speed: 3.2, phase: 0.8 },
      svg: sparkles(),
    },
    {
      name: 'shut',
      role: 'alarm',
      bend: false,
      z: 'front',
      pivot: [280, 210],
      svg: closedShell(),
    },
  ],
};

export default art;
