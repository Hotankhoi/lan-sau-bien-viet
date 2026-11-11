/**
 * Bào ngư chín lỗ – Haliotis diversicolor
 * Góc nhìn 3/4 từ trên-trước, đầu trước quay PHẢI, đang bám đá.
 * Đặc điểm nhận dạng: vỏ dẹt hình bầu dục như tai, đỉnh xoắn nhỏ thấp sát đầu sau (hơi lệch về phía
 * không có lỗ), HÀNG LỖ THỞ dọc mép trái con vật (mép xa trong hình): các lỗ cũ gần đỉnh bịt thành u,
 * 7 lỗ mở phía trước to dần; mặt vỏ có gân xoắn cắt vân tăng trưởng gợn sóng thành lưới ô; màu loang nâu
 * đỏ – xanh ô liu – xanh rêu với dải nâu tím; mép vỏ lộ ánh xà cừ. Dưới mép vỏ: viền chân (epipodium)
 * sẫm mép ren, xúc tu viền mảnh thò ra (lớp tách rời, cử động rất nhẹ), chân cơ màu kem; 2 xúc tu đầu.
 */
import type { CreatureArt } from '../contract';
import { makeIds, linear, radial, blurFilter, clip, rng, joinDefs, smoothPath, mix, shade, hexToRgb, rgbToHex, rimGradient, scatterSpots, organicTexture } from '../style-bible';

const u = makeIds('bao_ngu_chin_lo');
const f = (n: number) => n.toFixed(1);

// ---------- Màu ----------
const RED = '#80402D';
const RED_D = '#5E2F24';
const OLIVE = '#6F743F';
const TEAL = '#4C7B66';
const DARK = '#47292A';
const CREAM = '#C9A47C';
const OUTLINE = '#3E2018';
const FOOT = '#E2CD98';
const FOOT_D = '#B99A62';
const EPI = '#3A3A26';
const TENT = '#B4A86E';

// ---------- Phép chiếu 3/4 ----------
// Mặt phẳng: X dọc thân (-1 sau … +1 trước), Y ngang (âm = mép xa, phía có lỗ; dương = mép gần). Z cao.
const R = 190;
const CX = 262;
const CY = 132;
const SE = 0.899; // sin(64°) – nén chiều Y
const CE = 0.438; // cos(64°) – độ nâng theo Z
const H = 0.38; // chiều cao đỉnh vòm
const S: [number, number] = [-0.8, 0.14]; // đỉnh xoắn

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (e0: number, e1: number, x: number) => {
  const k = clamp01((x - e0) / (e1 - e0));
  return k * k * (3 - 2 * k);
};

/** hàm ẩn của viền vỏ (bầu dục, mép gần tròn hơn, đầu sau hẹp hơn) */
function outside(x: number, y: number): number {
  // mép xa (phía hàng lỗ) thẳng hơn, mép gần phình; đầu sau hẹp, đầu trước rộng (dáng tai)
  const b = (y < 0 ? 0.6 : 0.73) * (1 + 0.11 * x);
  const xx = x < 0 ? x * (1 + 0.04 * Math.max(0, y)) : x;
  return xx * xx + (y / b) * (y / b) - 1;
}
/** khoảng cách từ đỉnh S tới mép vỏ theo tia góc phi (có gợn nhỏ ở mép) */
const mdCache = new Map<number, number>();
function md(phi: number): number {
  const key = Math.round(phi * 10000);
  const c = mdCache.get(key);
  if (c !== undefined) return c;
  const dx = Math.cos(phi);
  const dy = Math.sin(phi);
  let lo = 0;
  let hi = 2.6;
  for (let i = 0; i < 34; i++) {
    const m = (lo + hi) / 2;
    if (outside(S[0] + dx * m, S[1] + dy * m) > 0) hi = m;
    else lo = m;
  }
  const v = lo * (1 + 0.006 * Math.sin(phi * 19 + 0.4) + 0.004 * Math.sin(phi * 31 + 1.3));
  mdCache.set(key, v);
  return v;
}
/** điểm mặt phẳng theo toạ độ cực quanh đỉnh: s = 0 ở đỉnh, 1 ở mép */
function plan(s: number, phi: number, k = 1): [number, number] {
  const m = md(phi) * s * k;
  return [S[0] + Math.cos(phi) * m, S[1] + Math.sin(phi) * m];
}
function polar(x: number, y: number): [number, number] {
  const phi = Math.atan2(y - S[1], x - S[0]);
  return [Math.hypot(x - S[0], y - S[1]) / md(phi), phi];
}

// hàng lỗ thở
const ROW_A = -2.25; // gần đỉnh (sau-xa)
const ROW_B = -0.22; // đầu trước-xa
const dIn = (q: number) => 0.2 - 0.085 * q; // khoảng lùi vào trong mép
const rowWin = (phi: number) => smooth(ROW_A - 0.25, ROW_A + 0.05, phi) * (1 - smooth(ROW_B - 0.05, ROW_B + 0.2, phi));

/** độ cao mặt vỏ */
function Z(x: number, y: number): number {
  const [s, phi] = polar(x, y);
  const sc = clamp01(s);
  let z = H * Math.pow(Math.max(0, 1 - Math.pow(sc, 1.6)), 0.8);
  // gờ mang hàng lỗ (mép xa)
  const q = clamp01((phi - ROW_A) / (ROW_B - ROW_A));
  const sRow = 1 - dIn(q) / md(phi);
  z += 0.024 * Math.exp(-Math.pow((sc - sRow) / 0.04, 2)) * rowWin(phi);
  // núm đỉnh xoắn
  const d = Math.hypot(x - S[0], y - S[1]);
  z += 0.03 * Math.exp(-Math.pow(d / 0.06, 2));
  return z;
}

function proj(x: number, y: number, z: number): [number, number] {
  return [CX + x * R, CY + y * R * SE - z * R * CE];
}
/** điểm trên mặt vỏ (toạ độ màn hình) */
function surf(s: number, phi: number): [number, number] {
  const [x, y] = plan(s, phi);
  return proj(x, y, s >= 0.999 ? 0 : Z(x, y));
}
/** điểm mép mở rộng ở độ cao z (chân, viền chân) */
function rim(phi: number, k: number, z: number): [number, number] {
  const [x, y] = plan(1, phi, k);
  return proj(x, y, z);
}

// ---------- Viền vỏ ----------
const NOUT = 160;
const SHELL_PTS: [number, number][] = Array.from({ length: NOUT }, (_, i) => surf(1, -Math.PI + (2 * Math.PI * i) / NOUT));
const SHELL = smoothPath(SHELL_PTS, true, 0.4);
/** đoạn mép gần (thấy mép vỏ và xà cừ) */
const NEAR_A = -0.32;
const NEAR_B = Math.PI + 0.55;
/** tham số hoá mép gần theo độ dài cung: t 0..1 → phi (để rải xúc tu đều) */
const ARC: { phi: number; len: number }[] = (() => {
  const out: { phi: number; len: number }[] = [];
  let acc = 0;
  let prev = rim(NEAR_A, 1, 0);
  for (let i = 0; i <= 300; i++) {
    const phi = NEAR_A + ((NEAR_B - NEAR_A) * i) / 300;
    const p = rim(phi, 1, 0);
    acc += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    prev = p;
    out.push({ phi, len: acc });
  }
  return out;
})();
function arcPhi(t: number): number {
  const target = clamp01(t) * ARC[ARC.length - 1].len;
  let i = 1;
  while (i < ARC.length - 1 && ARC[i].len < target) i++;
  const a = ARC[i - 1];
  const b = ARC[i];
  const k = b.len > a.len ? (target - a.len) / (b.len - a.len) : 0;
  return a.phi + (b.phi - a.phi) * k;
}
const nearEdge = (k = 1, z = 0, dz = 0, t0 = 0, t1 = 1) =>
  smoothPath(Array.from({ length: 81 }, (_, i) => {
    const phi = arcPhi(t0 + ((t1 - t0) * i) / 80);
    const p = rim(phi, k, z);
    return [p[0], p[1] + dz] as [number, number];
  }));

// ---------- Ánh sáng ----------
const L = (() => {
  const v = [0.35, -0.45, 0.82];
  const n = Math.hypot(v[0], v[1], v[2]);
  return v.map((a) => a / n);
})();
function lambert(x: number, y: number): number {
  const e = 0.004;
  const zx = (Z(x + e, y) - Z(x - e, y)) / (2 * e);
  const zy = (Z(x, y + e) - Z(x, y - e)) / (2 * e);
  const n = Math.hypot(zx, zy, 1);
  return Math.max(0, (-zx * L[0] - zy * L[1] + L[2]) / n);
}

/** màu loang của vỏ (chưa có ánh sáng) */
function baseColor(s: number, x: number, y: number, phi: number): string {
  const n1 = Math.sin(x * 7.3 + y * 4.1 + 1.7) * Math.cos(y * 9.4 - x * 3.2);
  const n2 = Math.sin(x * 15.7 - y * 11.1 + 0.4) * 0.5 + Math.sin(x * 25 + y * 19 + 2) * 0.3;
  const band = Math.sin(s * 17 + 0.9 * Math.sin(phi * 2) + 0.5);
  // vệt loang kéo dài theo hướng gân xoắn (tia từ đỉnh)
  const streak = Math.sin(phi * 13 + s * 6 + 1.3 * Math.sin(s * 9 + phi * 2));
  const g = smooth(0.2, 0.74, 0.5 + 0.32 * n1 + 0.2 * n2 + 0.14 * band + 0.14 * streak);
  let c = mix(RED, OLIVE, g);
  const teal = smooth(0.45, 0.9, 0.5 + 0.5 * Math.sin(x * 5.2 - y * 6.6 + 2.6) * Math.sin(s * 10 + 1));
  c = mix(c, TEAL, teal * 0.6 * g);
  const dk = smooth(0.7, 0.96, Math.sin(s * 12 + Math.sin(phi * 3) * 0.6 + 2.2));
  c = mix(c, DARK, dk * 0.55);
  c = mix(c, RED_D, smooth(0.55, 0.95, -streak * (0.5 + 0.5 * n1)) * 0.4);
  const fl = smooth(0.72, 0.98, Math.sin(phi * 17 + s * 5 + Math.sin(s * 7)) * (0.6 + 0.4 * n2));
  c = mix(c, CREAM, fl * 0.32);
  // vạch đỏ mảnh theo vân tăng trưởng (ref2)
  const rl = smooth(0.9, 0.99, Math.sin(s * 23 + Math.sin(phi * 2.3) * 0.8));
  c = mix(c, '#A83C26', rl * 0.45);
  // đỉnh mòn nhạt
  c = mix(c, '#B48C74', smooth(0.2, 0.0, s) * 0.6);
  return c;
}

function quant(hex: string, step = 9): string {
  const [r, g, b] = hexToRgb(hex);
  const q = (v: number) => Math.round(v / step) * step;
  return rgbToHex(q(r), q(g), q(b));
}

/** khảm màu: lưới (s, phi) chiếu lên mặt vỏ, mỗi ô tô màu loang × ánh sáng; gom theo màu */
function mosaic(): string {
  const NS = 24;
  const NP = 90;
  const groups = new Map<string, string>();
  const pts: [number, number][][] = [];
  for (let i = 0; i <= NS; i++) {
    const row: [number, number][] = [];
    const s = Math.pow(i / NS, 0.9);
    for (let j = 0; j <= NP; j++) row.push(surf(Math.min(1.02, s), -Math.PI + (2 * Math.PI * j) / NP));
    pts.push(row);
  }
  for (let i = 0; i < NS; i++) {
    for (let j = 0; j < NP; j++) {
      const s = Math.pow((i + 0.5) / NS, 0.9);
      const phi = -Math.PI + (2 * Math.PI * (j + 0.5)) / NP;
      const [x, y] = plan(s, phi);
      const lam = lambert(x, y);
      const k = Math.max(-0.55, Math.min(0.1, (lam - 0.82) * 1.3));
      const c = quant(shade(baseColor(s, x, y, phi), k));
      const a = pts[i][j];
      const b = pts[i][j + 1];
      const cc = pts[i + 1][j + 1];
      const d = pts[i + 1][j];
      const p = `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${f(cc[0])} ${f(cc[1])}L${f(d[0])} ${f(d[1])}Z`;
      groups.set(c, (groups.get(c) ?? '') + p);
    }
  }
  let out = '';
  for (const [c, d] of groups) out += `<path d="${d}" fill="${c}" stroke="${c}" stroke-width="0.9" stroke-linejoin="round"/>`;
  return out;
}

/** vệt kem nhạt và vệt nâu sẫm ngắn chạy theo gân xoắn (vằn loang như ref1/ref3) */
function flames(): string {
  const r = rng(2468);
  let pale = '';
  let dark = '';
  for (let i = 0; i < 90; i++) {
    const phi0 = -Math.PI + r() * Math.PI * 2;
    const s0 = 0.14 + r() * 0.74;
    const ds = 0.06 + r() * 0.18;
    const p: [number, number][] = [];
    for (let k = 0; k <= 5; k++) {
      const s = Math.min(0.99, s0 + (ds * k) / 5);
      p.push(surf(s, phi0 + 0.22 * s));
    }
    const w = (1.6 + r() * 3.2) * (0.5 + s0);
    const d = `<path d="${smoothPath(p)}" stroke-width="${f(w)}"/>`;
    if (r() < 0.6) pale += d;
    else dark += d;
  }
  return (
    `<g fill="none" stroke-linecap="round" filter="${u.url('tiny')}">` +
    `<g stroke="#D8B68E" stroke-opacity="0.24">${pale}</g>` +
    `<g stroke="#43201A" stroke-opacity="0.2">${dark}</g>` +
    `</g>`
  );
}

/** gân xoắn gợn sóng (tỏa từ đỉnh) + vân tăng trưởng gợn (đồng tâm quanh đỉnh) */
function sculpture(): string {
  const r = rng(91);
  // gân xoắn: dày đặc, tỏa từ đỉnh, hơi xoắn, gợn sóng nhẹ (ref3)
  let cordsD = '';
  let cordsMajor = '';
  const NC = 130;
  for (let j = 0; j < NC; j++) {
    const phi0 = -Math.PI + (2 * Math.PI * (j + 0.5)) / NC;
    const p: [number, number][] = [];
    const sStart = 0.1 + 0.08 * r();
    for (let i = 0; i <= 14; i++) {
      const s = sStart + ((0.995 - sStart) * i) / 14;
      p.push(surf(s, phi0 + 0.22 * s + 0.012 * Math.sin(s * 34 + j * 1.7)));
    }
    if (j % 3 === 0) cordsMajor += smoothPath(p);
    else cordsD += smoothPath(p);
  }
  // vân tăng trưởng mảnh đồng tâm quanh đỉnh + vài bậc nổi (gờ sóng)
  let growth = '';
  let steps = '';
  let stepsHi = '';
  let s = 0.06;
  let n = 0;
  while (s < 0.985) {
    const p: [number, number][] = [];
    const ph = r() * 6;
    for (let k = 0; k <= 72; k++) {
      const phi = -Math.PI + (2 * Math.PI * k) / 72;
      const ss = s + 0.0025 * Math.sin(phi * 7 + ph) + 0.0018 * Math.sin(phi * 41 + ph * 2);
      p.push(surf(Math.min(0.995, ss), phi));
    }
    const d = smoothPath(p);
    if (n % 7 === 5) {
      steps += d;
      stepsHi += smoothPath(p.map(([a, b]) => [a, b - 1.2] as [number, number]));
    } else growth += d;
    s += 0.013 + r() * 0.012;
    n++;
  }
  return (
    `<path d="${growth}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.2" stroke-width="0.55"/>` +
    // gân xoắn: bóng dưới + sống sáng chấm hạt (giao với vân tăng trưởng)
    `<g transform="translate(0 0.7)"><path d="${cordsMajor}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.34" stroke-width="1.3"/>` +
    `<path d="${cordsD}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.22" stroke-width="0.8"/></g>` +
    `<path d="${cordsMajor}" fill="none" stroke="#F2D9BC" stroke-opacity="0.28" stroke-width="0.9" stroke-dasharray="0.6 2.6" stroke-linecap="round"/>` +
    `<path d="${cordsD}" fill="none" stroke="#EBCDB0" stroke-opacity="0.18" stroke-width="0.55"/>` +
    // bậc tăng trưởng nổi
    `<path d="${steps}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.3" stroke-width="2.6" filter="${u.url('tiny')}"/>` +
    `<path d="${stepsHi}" fill="none" stroke="#F7E3C8" stroke-opacity="0.3" stroke-width="0.8"/>`
  );
}

// ---------- Hàng lỗ thở ----------
interface Hole {
  x: number;
  y: number;
  rx: number;
  ry: number;
  ang: number;
  open: boolean;
}
const N_HOLES = 16;
const N_OPEN = 7;
function holes(): Hole[] {
  const out: Hole[] = [];
  const pos: [number, number][] = [];
  for (let k = 0; k <= N_HOLES; k++) {
    const q = k / N_HOLES;
    const phi = ROW_A + Math.pow(q, 0.95) * (ROW_B - ROW_A);
    const sRow = 1 - dIn(q) / md(phi);
    pos.push(surf(sRow, phi));
  }
  for (let k = 0; k < N_HOLES; k++) {
    const q = k / N_HOLES;
    const open = k >= N_HOLES - N_OPEN;
    const t = open ? (k - (N_HOLES - N_OPEN)) / (N_OPEN - 1) : k / (N_HOLES - N_OPEN);
    const jit = 0.88 + 0.24 * (0.5 + 0.5 * Math.sin(k * 12.9898 + 4.1));
    const r = (open ? 0.024 + 0.015 * t : 0.011 + 0.008 * t) * jit;
    const a = pos[Math.max(0, k - 1)];
    const b = pos[k + 1];
    const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    out.push({ x: pos[k][0], y: pos[k][1], rx: r * R, ry: r * R * (0.62 + 0.08 * q), ang, open });
  }
  return out;
}
const HOLES = holes();

function holesSvg(): string {
  let s = '';
  for (const h of HOLES) {
    const tr = `transform="rotate(${f(h.ang)} ${f(h.x)} ${f(h.y)})"`;
    if (h.open) {
      s +=
        // gờ nổi quanh lỗ
        `<ellipse cx="${f(h.x)}" cy="${f(h.y + 1)}" rx="${f(h.rx * 1.5)}" ry="${f(h.ry * 1.55)}" fill="${OUTLINE}" fill-opacity="0.28" filter="${u.url('tiny')}" ${tr}/>` +
        `<ellipse cx="${f(h.x)}" cy="${f(h.y)}" rx="${f(h.rx * 1.35)}" ry="${f(h.ry * 1.38)}" fill="${u.url('holeRim')}" fill-opacity="0.8" ${tr}/>` +
        // lòng lỗ tối (thấy lớp áo màng sẫm bên dưới)
        `<ellipse cx="${f(h.x)}" cy="${f(h.y)}" rx="${f(h.rx)}" ry="${f(h.ry)}" fill="${u.url('holeIn')}" ${tr}/>` +
        // thành trong phía xa lóe xà cừ (mảnh)
        `<path d="M${f(h.x - h.rx * 0.7)} ${f(h.y - h.ry * 0.35)}Q${f(h.x)} ${f(h.y - h.ry * 0.95)} ${f(h.x + h.rx * 0.7)} ${f(h.y - h.ry * 0.35)}" fill="none" stroke="${u.url('nacreLine')}" stroke-width="${f(Math.max(0.6, h.ry * 0.22))}" stroke-opacity="0.55" ${tr}/>` +
        // môi gần được chiếu sáng
        `<path d="M${f(h.x - h.rx * 1.1)} ${f(h.y + h.ry * 0.5)}Q${f(h.x)} ${f(h.y + h.ry * 1.55)} ${f(h.x + h.rx * 1.1)} ${f(h.y + h.ry * 0.5)}" fill="none" stroke="#F3DCC4" stroke-opacity="0.45" stroke-width="0.8" ${tr}/>`;
    } else {
      // lỗ cũ đã bịt: u nhỏ thấp, cùng tông vỏ
      s +=
        `<ellipse cx="${f(h.x)}" cy="${f(h.y + 0.8)}" rx="${f(h.rx * 1.2)}" ry="${f(h.ry * 1.25)}" fill="${OUTLINE}" fill-opacity="0.22" filter="${u.url('tiny')}" ${tr}/>` +
        `<ellipse cx="${f(h.x)}" cy="${f(h.y)}" rx="${f(h.rx * 1.1)}" ry="${f(h.ry * 1.1)}" fill="${u.url('bump')}" fill-opacity="0.75" ${tr}/>` +
        `<ellipse cx="${f(h.x)}" cy="${f(h.y + h.ry * 0.1)}" rx="${f(h.rx * 0.4)}" ry="${f(h.ry * 0.35)}" fill="${RED_D}" fill-opacity="0.3" ${tr}/>`;
    }
  }
  return s;
}

// ---------- Đỉnh xoắn ----------
function spire(): string {
  const [x0, y0] = proj(S[0], S[1], Z(S[0], S[1]));
  const cx = x0 + 1;
  const cy = y0 + 2;
  // đường khâu xoắn 1.6 vòng thu vào tâm
  const p: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const a = -0.6 + t * Math.PI * 2 * 1.6;
    const rr = 8.5 * (1 - t * 0.82);
    p.push([cx + Math.cos(a) * rr * 1.15, cy + Math.sin(a) * rr * 0.72]);
  }
  return (
    `<ellipse cx="${f(cx + 1)}" cy="${f(cy + 2.5)}" rx="12.5" ry="8" fill="${OUTLINE}" fill-opacity="0.35" filter="${u.url('soft')}"/>` +
    `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="10.5" ry="7" fill="${u.url('spire')}"/>` +
    `<path d="${smoothPath(p)}" fill="none" stroke="#6A3B2C" stroke-opacity="0.4" stroke-width="0.7"/>` +
    `<ellipse cx="${f(cx - 3)}" cy="${f(cy - 3)}" rx="4" ry="1.8" fill="#FFFFFF" fill-opacity="0.55" transform="rotate(-14 ${f(cx - 3)} ${f(cy - 3)})" filter="${u.url('tiny')}"/>` +
    `<path d="M${f(cx + 2)} ${f(cy + 5)}Q${f(cx + 7)} ${f(cy + 4)} ${f(cx + 9.5)} ${f(cy - 0.5)}" fill="none" stroke="${u.url('nacreLine')}" stroke-width="1.1" stroke-opacity="0.7"/>`
  );
}

// ---------- Chân, viền chân, đầu ----------
const ZF = 0.12; // đế chân thấp hơn mép vỏ
const ZE = 0.04; // mép viền chân
const FOOT_PATH = smoothPath(Array.from({ length: 120 }, (_, i) => rim(-Math.PI + (2 * Math.PI * i) / 120, 1.045, -ZF)), true, 0.45);
const EPI_PATH = smoothPath(
  Array.from({ length: 200 }, (_, i) => {
    const phi = -Math.PI + (2 * Math.PI * i) / 200;
    const lobe = Math.abs(Math.sin(phi * 34));
    return rim(phi, 1.02 + 0.014 * lobe, -ZE - 0.012 * lobe);
  }),
  true,
  0.5,
);
const HEAD_C: [number, number] = (() => {
  const p = rim(0.02, 1.035, -0.06);
  return [p[0] + 2, p[1]];
})();

function footSvg(): string {
  const r = rng(77);
  // vân nhăn dọc của chân (cơ)
  let wr = '';
  for (let i = 0; i < 46; i++) {
    const phi = NEAR_A + 0.1 + (NEAR_B - NEAR_A - 0.2) * (i / 45) + (r() - 0.5) * 0.04;
    const a = rim(phi, 1.025, -ZE - 0.01);
    const b = rim(phi, 1.04, -ZF + 0.01);
    wr += `M${f(a[0])} ${f(a[1])}L${f(b[0] + (r() - 0.5) * 2)} ${f(b[1])}`;
  }
  return (
    `<path d="${FOOT_PATH}" fill="${u.url('foot')}"/>` +
    `<g clip-path="${u.url('footClip')}">` +
    `<path d="${wr}" fill="none" stroke="${FOOT_D}" stroke-opacity="0.55" stroke-width="1.1"/>` +
    scatterSpots(311, { x: 60, y: 140, w: 440, h: 150 }, { count: 90, rMin: 0.6, rMax: 1.6, color: '#8E7440', opacity: 0.4, ellipse: 1.6 }) +
    // tối dần xuống đế
    `<path d="${nearEdge(1.045, -ZF)}" fill="none" stroke="#6E5530" stroke-opacity="0.55" stroke-width="4" filter="${u.url('soft')}"/>` +
    // bóng của viền chân đổ xuống
    `<path d="${nearEdge(1.03, -ZE - 0.012, 2)}" fill="none" stroke="#2C2414" stroke-opacity="0.5" stroke-width="5" filter="${u.url('soft')}"/>` +
    `</g>` +
    `<path d="${FOOT_PATH}" fill="none" stroke="#6E5530" stroke-opacity="0.55" stroke-width="1.1"/>`
  );
}

function epiSvg(): string {
  // đốm vàng li ti trên viền chân sẫm
  const r = rng(515);
  let dots = '';
  for (let i = 0; i < 110; i++) {
    const phi = NEAR_A - 0.1 + (NEAR_B - NEAR_A + 0.2) * r();
    const k = 1.0 + 0.03 * r();
    const [x, y] = rim(phi, k, -0.005 - 0.04 * r());
    dots += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.5 + r() * 0.8)}"/>`;
  }
  return (
    `<path d="${EPI_PATH}" fill="${u.url('epi')}" stroke="#1F1F12" stroke-opacity="0.6" stroke-width="0.8"/>` +
    `<g fill="#D9C98A" fill-opacity="0.55">${dots}</g>` +
    // mép ren sáng
    `<path d="${EPI_PATH}" fill="none" stroke="#A9A06A" stroke-opacity="0.35" stroke-width="0.6" stroke-dasharray="2 1.5"/>`
  );
}

function headSvg(): string {
  const [hx, hy] = HEAD_C;
  return (
    `<ellipse cx="${f(hx)}" cy="${f(hy + 2)}" rx="15" ry="10.5" fill="${u.url('head')}" stroke="#241E10" stroke-opacity="0.55" stroke-width="0.9"/>` +
    // mõm
    `<ellipse cx="${f(hx + 9)}" cy="${f(hy + 6)}" rx="6.5" ry="4.5" fill="#8C7A4C" stroke="#3A301A" stroke-opacity="0.5" stroke-width="0.7"/>` +
    `<path d="M${f(hx + 5)} ${f(hy + 7)}Q${f(hx + 10)} ${f(hy + 9)} ${f(hx + 14)} ${f(hy + 6)}" fill="none" stroke="#2A2214" stroke-opacity="0.6" stroke-width="0.8"/>` +
    scatterSpots(19, { x: hx - 12, y: hy - 6, w: 22, h: 14 }, { count: 10, rMin: 0.5, rMax: 1.1, color: '#D8C98E', opacity: 0.5 }) +
    `<ellipse cx="${f(hx - 3)}" cy="${f(hy - 3)}" rx="7" ry="2.5" fill="#FFFFFF" fill-opacity="0.18" filter="${u.url('tiny')}"/>`
  );
}

// ---------- Xúc tu ----------
/** xúc tu mảnh thuôn nhọn, đầu tròn */
function tentacle(x: number, y: number, ang: number, len: number, w: number, curl: number, wave = 0): string {
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const ctr: [number, number][] = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const along = len * t;
    const side = curl * len * t * t + wave * len * 0.09 * Math.sin(t * Math.PI * 1.6);
    ctr.push([x + ca * along - sa * side, y + sa * along + ca * side]);
  }
  const Lp: [number, number][] = [];
  const Rp: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = ctr[Math.max(0, i - 1)];
    const b = ctr[Math.min(n, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const hw = (w / 2) * (1 - 0.75 * (i / n));
    Lp.push([ctr[i][0] - (dy / l) * hw, ctr[i][1] + (dx / l) * hw]);
    Rp.push([ctr[i][0] + (dy / l) * hw, ctr[i][1] - (dx / l) * hw]);
  }
  const d = smoothPath([...Lp, ...Rp.reverse()], true, 0.45);
  const mid = ctr[Math.round(n * 0.45)];
  const tip = ctr[n];
  return (
    `<path d="${d}" fill="${u.url('tent')}" stroke="#4A4224" stroke-opacity="0.55" stroke-width="0.55"/>` +
    // vòng sẫm mờ giữa xúc tu
    `<circle cx="${f(mid[0])}" cy="${f(mid[1])}" r="${f(w * 0.36)}" fill="#5C5530" fill-opacity="0.35"/>` +
    `<circle cx="${f(tip[0])}" cy="${f(tip[1])}" r="${f(Math.max(0.4, w * 0.12))}" fill="#E6DCAE" fill-opacity="0.45"/>`
  );
}

/** xúc tu viền chân phía gần, chia 3 nhóm (cử động lệch pha) */
function nearTentacles(group: number): string {
  const r = rng(400 + group);
  let s = '';
  const N = 17;
  for (let i = 0; i < N; i++) {
    const t = (group + (i + 0.15 + r() * 0.7) / N) / 3;
    const phi = arcPhi(0.02 + t * 0.96);
    const [x, y] = rim(phi, 1.022 + 0.012 * r(), -ZE - 0.004);
    // hướng: pháp tuyến ngoài của mép trên màn hình, chúc xuống
    const a = rim(arcPhi(Math.max(0, t - 0.004)), 1, 0);
    const b = rim(arcPhi(Math.min(1, t + 0.004)), 1, 0);
    let nx = b[1] - a[1];
    let ny = -(b[0] - a[0]);
    if (nx * (x - CX) + ny * (y - CY - 20) < 0) {
      nx = -nx;
      ny = -ny;
    }
    const nl = Math.hypot(nx, ny) || 1;
    const out = Math.atan2(ny / nl + 0.7, nx / nl);
    const long = r() < 0.25;
    const len = long ? 16 + r() * 11 : 6 + r() * 9;
    const w = long ? 3.4 + r() * 1.3 : 2.4 + r() * 1.2;
    s += tentacle(x, y, out + (r() - 0.5) * 0.7, len, w, (r() - 0.5) * 0.9, (r() - 0.5) * 2);
  }
  return s;
}

/** xúc tu thò lên sau mép xa */
function farTentacles(): string {
  const r = rng(808);
  let s = '';
  for (let i = 0; i < 18; i++) {
    const phi = -2.55 + (2.25 * (i + r() * 0.8)) / 18;
    const [x, y] = rim(phi, 1.0, -0.01);
    const [px] = plan(1, phi);
    const out = -Math.PI / 2 + px * 0.55 + (r() - 0.5) * 0.5;
    s += tentacle(x, y + 3, out, 9 + r() * 12, 2.4 + r() * 1.2, (r() - 0.5) * 0.8, (r() - 0.5) * 2);
  }
  return s;
}

/** 2 xúc tu đầu + mắt trên cuống ngắn */
function headTentacles(): string {
  const [hx, hy] = HEAD_C;
  const t1 = tentacle(hx + 4, hy - 4, -0.42, 58, 5.2, 0.22);
  const t2 = tentacle(hx + 7, hy + 1, 0.06, 62, 5.6, -0.16);
  const eye = (x: number, y: number, a: number) =>
    `<path d="M${f(x)} ${f(y)}L${f(x + Math.cos(a) * 7)} ${f(y + Math.sin(a) * 7)}" stroke="#7A6B40" stroke-width="3.4" stroke-linecap="round"/>` +
    `<circle cx="${f(x + Math.cos(a) * 7.5)}" cy="${f(y + Math.sin(a) * 7.5)}" r="2.1" fill="#120E08"/>` +
    `<circle cx="${f(x + Math.cos(a) * 7.5 - 0.6)}" cy="${f(y + Math.sin(a) * 7.5 - 0.7)}" r="0.65" fill="#FFFFFF" fill-opacity="0.85"/>`;
  return t1 + t2 + eye(hx + 2, hy - 6, -1.25) + eye(hx + 8, hy + 2, -0.55);
}

// ---------- Nền đá (thẻ) ----------
const ROCK = smoothPath(
  [
    [-4, 178], [24, 132], [52, 112], [96, 84], [150, 66], [214, 58], [262, 62], [318, 54], [392, 60], [452, 78], [500, 100],
    [536, 128], [564, 168], [564, 304], [-4, 304],
  ],
  true,
  0.4,
);
function rockSvg(): string {
  const r = rng(3030);
  let crust = '';
  let speck = '';
  for (let i = 0; i < 9; i++) {
    const x = 20 + r() * 520;
    const y = 74 + r() * 210;
    const pts: [number, number][] = [];
    const rr = 6 + r() * 13;
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const q = rr * (0.6 + r() * 0.6);
      pts.push([x + Math.cos(a) * q * 1.5, y + Math.sin(a) * q * 0.65]);
    }
    crust += `<path d="${smoothPath(pts, true, 0.5)}"/>`;
    for (let k = 0; k < 6; k++) speck += `<circle cx="${f(x + (r() - 0.5) * rr * 2)}" cy="${f(y + (r() - 0.5) * rr * 0.8)}" r="${f(0.6 + r() * 0.9)}"/>`;
  }
  let pits = '';
  for (let i = 0; i < 46; i++) {
    const x = 20 + r() * 520;
    const y = 70 + r() * 222;
    pits += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1 + r() * 3)}" ry="${f(0.6 + r() * 1.4)}"/>`;
  }
  // khe nứt và mặt đá sáng phía trên
  let cracks = '';
  for (let i = 0; i < 7; i++) {
    const p: [number, number][] = [];
    let x = 20 + r() * 520;
    let y = 80 + r() * 190;
    for (let k = 0; k < 5; k++) {
      p.push([x, y]);
      x += 10 + r() * 22;
      y += (r() - 0.4) * 10;
    }
    cracks += smoothPath(p);
  }
  return (
    `<path d="${ROCK}" fill="${u.url('rock')}" filter="${u.url('rockTex')}"/>` +
    `<g clip-path="${u.url('rockClip')}">` +
    `<path d="M20 120C90 82 200 66 300 64C400 62 470 82 530 118C460 104 380 92 300 94C190 96 100 108 20 120Z" fill="#9FB3A6" fill-opacity="0.16" filter="${u.url('softer')}"/>` +
    `<path d="${cracks}" fill="none" stroke="#1B2622" stroke-opacity="0.45" stroke-width="1.1"/>` +
    `<g transform="translate(0 1.2)"><path d="${cracks}" fill="none" stroke="#C9DAD0" stroke-opacity="0.18" stroke-width="0.8"/></g>` +
    `<g fill="#A9737C" fill-opacity="0.42" stroke="#D9B0B4" stroke-opacity="0.3" stroke-width="0.8">${crust}</g>` +
    `<g fill="#EBC9CB" fill-opacity="0.5">${speck}</g>` +
    `<g fill="#2D3A33" fill-opacity="0.35">${pits}</g>` +
    `<path d="M0 286C140 280 420 282 560 286L560 300L0 300Z" fill="#1C2925" fill-opacity="0.35" filter="${u.url('soft')}"/>` +
    `</g>` +
    `<path d="${ROCK}" fill="none" stroke="${u.url('rockRim')}" stroke-width="2.2"/>`
  );
}

// ---------- defs ----------
const nacreStops: [number, string][] = [
  [0, '#E9C6D8'],
  [0.18, '#CFE8D6'],
  [0.36, '#B9D3EE'],
  [0.52, '#E4CDF2'],
  [0.68, '#D9C08E'],
  [0.84, '#C6EBD9'],
  [1, '#F0D2E2'],
];
const defs = joinDefs(
  clip(u('shellClip'), SHELL),
  clip(u('footClip'), FOOT_PATH),
  clip(u('rockClip'), ROCK),
  rimGradient(u('rim'), '#ffffff', 0.85),
  linear(u('nacreBand'), nacreStops, { x1: 70, y1: 0, x2: 470, y2: 40, user: true }),
  linear(u('nacreLine'), nacreStops, { x1: 0, y1: 0, x2: 1, y2: 0.3 }),
  radial(u('holeIn'), [
    [0, '#0E0A08'],
    [0.6, '#1F1712'],
    [1, '#3E2C22'],
  ], { cx: 0.5, cy: 0.38, r: 0.6 }),
  radial(u('holeRim'), [
    [0, '#B98F72'],
    [0.6, '#9B6A4F'],
    [1, '#6E4433'],
  ], { cx: 0.45, cy: 0.35, r: 0.65 }),
  radial(u('bump'), [
    [0, '#C9A285'],
    [0.55, '#94604A'],
    [1, '#6A3E30'],
  ], { cx: 0.42, cy: 0.32, r: 0.7 }),
  radial(u('spire'), [
    [0, '#E6CDB8'],
    [0.45, '#C49C82'],
    [0.85, '#94654F'],
    [1, '#6E4434'],
  ], { cx: 0.4, cy: 0.35, r: 0.7 }),
  linear(u('shellBase'), [
    [0, '#7E5038'],
    [1, '#5E3F2C'],
  ]),
  radial(u('sheen'), [
    [0, '#FFFFFF', 0.32],
    [0.5, '#FFFFFF', 0.08],
    [1, '#FFFFFF', 0],
  ]),
  linear(u('nearShade'), [
    [0, '#1E0F0A', 0],
    [0.6, '#1E0F0A', 0],
    [1, '#1E0F0A', 0.32],
  ], { x1: 0, y1: 0, x2: 0, y2: 1 }),
  linear(u('foot'), [
    [0, '#C9B07A'],
    [0.6, FOOT],
    [1, '#C7AB72'],
  ]),
  linear(u('epi'), [
    [0, '#4A4A30'],
    [0.6, EPI],
    [1, '#2A2A1A'],
  ]),
  radial(u('head'), [
    [0, '#8F8050'],
    [0.7, '#5E5232'],
    [1, '#3E3520'],
  ], { cx: 0.4, cy: 0.35, r: 0.7 }),
  linear(u('tent'), [
    [0, shade(TENT, 0.25)],
    [0.5, TENT],
    [1, '#8E8250'],
  ], { x1: 0, y1: 0, x2: 1, y2: 1 }),
  linear(u('rock'), [
    [0, '#5E6B60'],
    [0.45, '#4B5850'],
    [1, '#2F3A35'],
  ]),
  rimGradient(u('rockRim'), '#E8F4EC', 0.55),
  radial(u('shadow'), [
    [0, '#0E1512', 0.55],
    [1, '#0E1512', 0],
  ]),
  blurFilter(u('tiny'), 0.8),
  blurFilter(u('soft'), 2.2),
  blurFilter(u('softer'), 5),
  blurFilter(u('mosaicBlur'), 4.5),
  organicTexture(u('rockTex'), { freq: 0.05, octaves: 3, strength: 0.45, seed: 12 }),
);

// ---------- Lớp vỏ ----------
function shellSvg(): string {
  return (
    `<path d="${SHELL}" fill="${u.url('shellBase')}"/>` +
    `<g clip-path="${u.url('shellClip')}">` +
    `<g filter="${u.url('mosaicBlur')}">${mosaic()}</g>` +
    flames() +
    sculpture() +
    holesSvg() +
    spire() +
    `</g>`
  );
}

function glossSvg(): string {
  const top = proj(-0.25, -0.12, Z(-0.25, -0.12));
  const mid = proj(0.3, -0.05, Z(0.3, -0.05));
  return (
    `<g clip-path="${u.url('shellClip')}">` +
    // ánh ướt rộng ở vòm
    `<ellipse cx="${f(top[0])}" cy="${f(top[1])}" rx="120" ry="46" fill="${u.url('sheen')}" transform="rotate(-6 ${f(top[0])} ${f(top[1])})"/>` +
    `<ellipse cx="${f(mid[0])}" cy="${f(mid[1] - 4)}" rx="58" ry="10" fill="#FFFFFF" fill-opacity="0.12" transform="rotate(-10 ${f(mid[0])} ${f(mid[1])})" filter="${u.url('soft')}"/>` +
    // tối dần về mép gần
    `<path d="${SHELL}" fill="${u.url('nearShade')}"/>` +
    // mép vỏ gần: dải xà cừ mảnh
    `<path d="${nearEdge(1, 0, -1.3, 0.02, 0.98)}" fill="none" stroke="${u.url('nacreBand')}" stroke-width="3" stroke-opacity="0.85"/>` +
    `<path d="${nearEdge(1, 0, -0.6, 0.1, 0.8)}" fill="none" stroke="#FFFFFF" stroke-width="0.6" stroke-opacity="0.3"/>` +
    `</g>` +
    `<path d="${SHELL}" fill="none" stroke="${OUTLINE}" stroke-width="1.6" stroke-opacity="0.65" stroke-linejoin="round"/>` +
    `<path d="${SHELL}" fill="none" stroke="${u.url('rim')}" stroke-width="2.2" stroke-linejoin="round"/>`
  );
}

const SHADOW_C = proj(0.05, 0.08, -ZF);

const art: CreatureArt = {
  id: 'bao_ngu_chin_lo',
  viewBox: [560, 300],
  lengthUnits: 380,
  spineY: 150,
  animation: 'static',
  cycleHz: 0.3,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'rock',
      role: 'detail',
      bend: false,
      z: 'back',
      cardOnly: true,
      svg: rockSvg(),
    },
    {
      name: 'tentaclesFar',
      role: 'tentacle',
      bend: false,
      z: 'back',
      pivot: [262, 40],
      anim: { type: 'scaleY', amp: 0.04, speed: 0.9, phase: 2.1 },
      svg: farTentacles(),
    },
    {
      name: 'foot',
      role: 'body',
      svg:
        `<ellipse cx="${f(SHADOW_C[0])}" cy="${f(SHADOW_C[1] + 22)}" rx="215" ry="34" fill="${u.url('shadow')}" filter="${u.url('soft')}"/>` +
        footSvg() +
        headSvg() +
        epiSvg(),
    },
    {
      name: 'shell',
      role: 'body',
      svg: shellSvg(),
    },
    {
      name: 'gloss',
      role: 'detail',
      svg: glossSvg(),
    },
    ...[0, 1, 2].map((g) => {
      const pv = rim(arcPhi(0.02 + ((g + 0.5) / 3) * 0.96), 1.025, -ZE);
      return {
        name: `tentaclesNear${g}`,
        role: 'tentacle' as const,
        bend: false,
        z: 'front' as const,
        pivot: [Math.round(pv[0]), Math.round(pv[1])] as [number, number],
        anim: { type: 'scaleY' as const, amp: 0.07, speed: 1, phase: g * 2.1 },
        svg: nearTentacles(g),
      };
    }),
    {
      name: 'headTentacles',
      role: 'tentacle',
      bend: false,
      z: 'front',
      pivot: [Math.round(HEAD_C[0] + 4), Math.round(HEAD_C[1] - 2)],
      anim: { type: 'rotate', amp: 0.05, speed: 0.8 },
      svg: headTentacles(),
    },
  ],
};

export default art;
