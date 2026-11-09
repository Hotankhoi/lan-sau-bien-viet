/**
 * Rùa đồi mồi – Eretmochelys imbricata (Huyền thoại)
 * Góc nhìn ngang hơi chếch từ trên (3/4): mai được dựng bằng phép chiếu 3D đơn giản
 * (vòm mai trên mặt bầu dục), các tấm vảy định nghĩa trong toạ độ mặt bằng (s, q) rồi chiếu ra màn hình.
 * Đặc điểm nhận dạng: mai bầu dục, tấm vảy xếp chồng như ngói (bóng đổ về phía sau), mép sau răng cưa,
 * hoa văn đồi mồi tỏa tia (hổ phách / vàng / nâu đỏ / nâu đen) trên từng tấm; đầu hẹp, mỏ khoằm như mỏ
 * chim ưng; vảy đầu nâu đen viền kem; chân chèo vảy đa giác viền sáng, 2 vuốt ở chân trước.
 */
import type { CreatureArt } from '../contract';
import { makeIds, eye, linear, radial, joinDefs, rng, rimGradient, blurFilter, organicTexture, volumeShade, smoothPath } from '../style-bible';

const ID = 'rua_doi_moi';
const u = makeIds(ID);
type P = [number, number];
const DEG = Math.PI / 180;
const f = (n: number) => n.toFixed(1);
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const pathOf = (pts: P[], close = true) => 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + (close ? 'Z' : '');
const centroid = (pts: P[]): P => {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p[0];
    y += p[1];
  }
  return [x / pts.length, y / pts.length];
};
const inset = (pts: P[], k: number): P[] => {
  const c = centroid(pts);
  return pts.map((p) => lerp(p, c, k));
};
/** Đa giác bo tròn góc (qua trung điểm các cạnh) – dáng vảy mềm. */
function roundPoly(pts: P[]): string {
  const n = pts.length;
  const mid = (a: P, b: P): P => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${f(m0[0])} ${f(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  return d + 'Z';
}
/** Đa giác bo góc nhẹ (giữ dáng góc cạnh của vảy sừng). k = tỉ lệ cạnh dùng để bo. */
function softPoly(pts: P[], k = 0.24): string {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const a = lerp(cur, prev, k);
    const b = lerp(cur, next, k);
    d += `${i ? 'L' : 'M'}${f(a[0])} ${f(a[1])}Q${f(cur[0])} ${f(cur[1])} ${f(b[0])} ${f(b[1])}`;
  }
  return d + 'Z';
}
const smooth01 =(a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// ---------- Màu ----------
const INK = '#2a1207';
const HORN = '#D8BE84';
const SCALE_D = '#3B1F10';

// =====================================================================
// MAI – mô hình vòm chiếu 3/4
// =====================================================================
const SH = { cx: 272, yb: 226, A: 172, H: 70, phi: 29 * DEG };
const SIN = Math.sin(SH.phi);
const COS = Math.cos(SH.phi);
/** hệ số bề rộng mặt bằng theo vị trí dọc s (-1 đuôi → 1 đầu): rộng phía trước, thuôn phía sau */
const kW = (s: number) => 0.76 + 0.05 * s - 0.1 * Math.max(0, -s) ** 2;
function h3(s: number, q: number): number {
  const r2 = s * s + q * q;
  if (r2 < 1) return SH.H * Math.pow(1 - r2, 0.72) * (1 + 0.06 * s);
  return -(Math.sqrt(r2) - 1) * SH.H * 0.9;
}
const pzOf = (s: number, q: number) => SH.A * kW(s) * q;
const upOf = (s: number, q: number) => h3(s, q) * COS - pzOf(s, q) * SIN;
const proj = (s: number, q: number): P => [SH.cx + SH.A * s, SH.yb - upOf(s, q)];
const foldCache = new Map<number, number>();
/** vị trí q của đường gập (mép trên nhìn thấy) – phần xa hơn bị khuất */
function foldQ(s: number): number {
  const key = Math.round(s * 2000);
  const c = foldCache.get(key);
  if (c !== undefined) return c;
  const lim = Math.sqrt(Math.max(0, 1 - s * s));
  let best = 0;
  let bu = -Infinity;
  for (let i = 0; i <= 60; i++) {
    const q = -lim * 1.08 + (lim * 1.08 * i) / 60;
    const v = upOf(s, q);
    if (v > bu) {
      bu = v;
      best = q;
    }
  }
  foldCache.set(key, best);
  return best;
}
const projC = (s: number, q: number): P => proj(s, Math.max(q, foldQ(s)));

/** Mốc góc (độ) các đường nối tấm viền phía gần (0 = mũi, 180 = đuôi). */
const MB = [10, 25, 40, 54, 68, 82, 96, 110, 124, 138, 152, 166, 180];
const MARG_IN = 0.88;
/** bán kính mép ngoài: răng cưa ở nửa sau (mỗi tấm viền nhọn chĩa về sau) */
function edgeR(betaDeg: number): number {
  const b = Math.abs(((betaDeg + 540) % 360) - 180); // 0 = mũi, 180 = đuôi, đối xứng 2 bên
  const bb = 180 - b;
  if (bb < MB[0]) return 1;
  let k = 0;
  while (k < MB.length - 2 && bb > MB[k + 1]) k++;
  const frac = (bb - MB[k]) / (MB[k + 1] - MB[k]);
  const amp = k === MB.length - 2 ? 0.05 : 0.015 + 0.1 * smooth01(55, 135, bb);
  const fr = frac < 0.86 ? Math.pow(frac / 0.86, 2.2) : (1 - frac) / 0.14;
  return 1 + amp * fr;
}
/** điểm trên elip mặt bằng: beta độ (dương = phía gần) */
const ell = (beta: number, rho: number): P => [rho * Math.cos(beta * DEG), rho * Math.sin(beta * DEG)];
function arcSQ(b0: number, b1: number, rho: number | 'edge', step = 1.5): P[] {
  const out: P[] = [];
  const n = Math.max(2, Math.ceil(Math.abs(b1 - b0) / step));
  for (let i = 0; i < n; i++) {
    const b = b0 + ((b1 - b0) * i) / n;
    out.push(ell(b, rho === 'edge' ? edgeR(b) : rho));
  }
  return out;
}
function segSQ(a: P, b: P, n = 6): P[] {
  const out: P[] = [];
  for (let i = 0; i < n; i++) out.push(lerp(a, b, i / n));
  return out;
}

interface Scute {
  pts: P[]; // (s,q)
  g: P; // tâm sinh trưởng (s,q)
  kind: 'm' | 'c' | 'v';
  far: boolean;
}

// --- tấm sống (vertebral) ---
const VS = [0.83, 0.5, 0.17, -0.16, -0.49, -0.83];
const VQ = [0.14, 0.22, 0.25, 0.24, 0.2, 0.14];
const VL = [0.29, 0.33, 0.33, 0.31, 0.26];
const vMid = (i: number) => (VS[i] + VS[i + 1]) / 2;

const idx5 = (i: number) => [2, 1, 3, 2, 1][i];
function vertebral(i: number): Scute {
  const pts: P[] = [];
  const a: P = [VS[i], VQ[i]];
  const lat: P = [vMid(i), VL[i]];
  const b: P = [VS[i + 1], VQ[i + 1]];
  if (i === 0) pts.push(...arcSQ(-10, 10, MARG_IN, 2.5));
  pts.push(...segSQ([a[0], a[1]], lat, 6), ...segSQ(lat, b, 6));
  if (i === 4) pts.push(...arcSQ(170, 190, MARG_IN, 2.5));
  else pts.push(...segSQ(b, [b[0], -b[1]], 6));
  pts.push(...segSQ([b[0], -b[1]], [lat[0], -lat[1]], 6), ...segSQ([lat[0], -lat[1]], [a[0], -a[1]], 6));
  if (i !== 0) pts.push(...segSQ([a[0], -a[1]], a, 6));
  const g: P = [VS[i + 1] + (VS[i] - VS[i + 1]) * 0.14, (idx5(i) - 2) * 0.03];
  return { pts, g, kind: 'v', far: false };
}

// --- tấm sườn (costal) phía gần, rồi lật cho phía xa ---
function costalsNear(): { pts: P[]; g: P }[] {
  const V = (i: number, side: 'a' | 'l' | 'b'): P =>
    side === 'a' ? [VS[i], VQ[i]] : side === 'l' ? [vMid(i), VL[i]] : [VS[i + 1], VQ[i + 1]];
  const E = (b: number): P => ell(b, MARG_IN);
  const C1 = [...arcSQ(10, 58, MARG_IN), ...segSQ(E(58), V(1, 'l')), ...segSQ(V(1, 'l'), V(1, 'a'), 4), ...segSQ(V(0, 'b'), V(0, 'l')), ...segSQ(V(0, 'l'), V(0, 'a'))];
  const C2 = [...arcSQ(58, 92, MARG_IN), ...segSQ(E(92), V(2, 'l')), ...segSQ(V(2, 'l'), V(2, 'a'), 4), ...segSQ(V(1, 'b'), V(1, 'l'), 4)];
  const C3 = [...arcSQ(92, 124, MARG_IN), ...segSQ(E(124), V(3, 'l')), ...segSQ(V(3, 'l'), V(3, 'a'), 4), ...segSQ(V(2, 'b'), V(2, 'l'), 4)];
  const C4 = [...arcSQ(124, 170, MARG_IN), ...segSQ(V(4, 'b'), V(4, 'l')), ...segSQ(V(4, 'l'), V(4, 'a')), ...segSQ(V(3, 'b'), V(3, 'l'), 4)];
  const gs: P[] = [
    [0.4, 0.42],
    [0.06, 0.5],
    [-0.26, 0.5],
    [-0.64, 0.4],
  ];
  return [C1, C2, C3, C4].map((pts, i) => ({ pts, g: gs[i] }));
}

function marginal(b0: number, b1: number): P[] {
  return [...arcSQ(b0, b1, MARG_IN, 2), ...arcSQ(b1, b0, 'edge', 0.8)];
}

function buildScutes(): Scute[] {
  const list: Scute[] = [];
  // tấm viền: phía gần + vài tấm phía xa ở đuôi/mũi (phần lộ ra ở mép trên)
  list.push({ pts: marginal(-10, 10), g: [0.93, 0], kind: 'm', far: false });
  for (let k = 0; k < MB.length - 1; k++) {
    const b0 = MB[k];
    const b1 = MB[k + 1];
    const mid = (b0 + b1) / 2;
    list.push({ pts: marginal(b0, b1), g: ell(mid + (b1 - b0) * 0.4, 0.93), kind: 'm', far: false });
    list.push({ pts: marginal(-b1, -b0), g: ell(-(mid + (b1 - b0) * 0.25), 0.95), kind: 'm', far: true });
  }
  costalsNear().forEach(({ pts, g }) => {
    list.push({ pts, g, kind: 'c', far: false });
    list.push({ pts: pts.map(([s, q]) => [s, -q] as P).reverse(), g: [g[0], -g[1]], kind: 'c', far: true });
  });
  for (let i = 0; i < 5; i++) list.push(vertebral(i));
  return list;
}

// ---------- ánh sáng theo pháp tuyến ----------
function P3(s: number, q: number): [number, number, number] {
  return [SH.A * s, h3(s, q), pzOf(s, q)];
}
function lambert(s: number, q: number): number {
  const e = 0.01;
  const a = P3(s + e, q);
  const b = P3(s - e, q);
  const c = P3(s, q + e);
  const d = P3(s, q - e);
  const ds = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dq = [c[0] - d[0], c[1] - d[1], c[2] - d[2]];
  let n = [ds[1] * dq[2] - ds[2] * dq[1], ds[2] * dq[0] - ds[0] * dq[2], ds[0] * dq[1] - ds[1] * dq[0]];
  if (n[1] < 0) n = n.map((x) => -x);
  const ln = Math.hypot(n[0], n[1], n[2]) || 1;
  const L = [0.3, 1, 0.42];
  const ll = Math.hypot(L[0], L[1], L[2]);
  return (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / (ln * ll);
}

// ---------- hoa văn đồi mồi trên từng tấm ----------
const STREAK = [
  { c: '#2B1208', o: 0.85 },
  { c: '#5E1F0C', o: 0.7 },
  { c: '#8E3A16', o: 0.6 },
  { c: '#F6C45E', o: 0.7 },
  { c: '#FCE3A2', o: 0.32 },
];
const STREAK_W = [0.34, 0.14, 0.1, 0.3, 0.12];

function pickStreak(r: () => number): number {
  let x = r();
  for (let i = 0; i < STREAK_W.length; i++) {
    x -= STREAK_W[i];
    if (x <= 0) return i;
  }
  return 0;
}

function carapace(): string {
  const scutes = buildScutes();
  const order = (k: Scute['kind']) => (k === 'm' ? 0 : k === 'c' ? 1 : 2);
  scutes.sort((a, b) => {
    if (a.far !== b.far && a.kind !== 'v' && b.kind !== 'v' && a.kind === b.kind) return a.far ? -1 : 1;
    if (order(a.kind) !== order(b.kind)) return order(a.kind) - order(b.kind);
    if (a.far !== b.far) return a.far ? -1 : 1;
    return centroid(a.pts)[0] - centroid(b.pts)[0]; // sau → trước: tấm trước đè tấm sau như ngói
  });
  const r = rng(8817);
  let out = '';
  scutes.forEach((sc, idx) => {
    // bỏ tấm viền phía xa đã khuất hoàn toàn sau đường gập
    if (sc.far && sc.kind === 'm') {
      const vis = sc.pts.filter(([s, q]) => q > foldQ(s) + 0.01).length;
      if (vis < 4) return;
    }
    const scr = sc.pts.map(([s, q]) => projC(s, q));
    const d = pathOf(scr);
    const G = projC(sc.g[0], sc.g[1]);
    const grad = sc.kind === 'm' ? (idx % 3 === 0 ? 'g3' : idx % 2 ? 'g0' : 'g2') : ['g0', 'g1', 'g2', 'g1', 'g3'][idx % 5];
    // bóng đổ của mép sau đè lên tấm phía sau
    out += `<path d="${d}" transform="translate(-3.2 1.6)" fill="#160702" opacity="0.5" filter="${u.url('sblur')}"/>`;
    out += `<path d="${d}" fill="${u.url(grad)}"/>`;
    // vệt lửa đồi mồi tỏa tia từ tâm sinh trưởng (hình ngọn lửa thon hai đầu, hơi cong)
    const buckets = STREAK.map(() => '');
    const n = scr.length;
    const flames = sc.kind === 'm' ? 10 : sc.kind === 'v' ? 26 : 30;
    for (let fi = 0; fi < flames; fi++) {
      const B = scr[Math.floor(((fi + r() * 0.9) / flames) * n) % n];
      const k = pickStreak(r);
      const S = lerp(G, B, r() * 0.12);
      const E = lerp(G, B, 0.7 + r() * 0.27);
      const dx = E[0] - S[0];
      const dy = E[1] - S[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const w = (0.7 + r() * (k === 0 ? 2.8 : 2.2)) * Math.min(1.2, len / 34);
      const bend = (r() - 0.5) * len * 0.16;
      const a = lerp(S, E, 0.35);
      const b = lerp(S, E, 0.75);
      const ax = a[0] + nx * bend;
      const ay = a[1] + ny * bend;
      const bx = b[0] + nx * bend * 0.5;
      const by = b[1] + ny * bend * 0.5;
      buckets[k] +=
        `M${f(S[0])} ${f(S[1])}C${f(ax + nx * w * 0.5)} ${f(ay + ny * w * 0.5)} ${f(bx + nx * w)} ${f(by + ny * w)} ${f(E[0] + nx * w * 0.6)} ${f(E[1] + ny * w * 0.6)}` +
        `L${f(E[0] - nx * w * 0.6)} ${f(E[1] - ny * w * 0.6)}C${f(bx - nx * w)} ${f(by - ny * w)} ${f(ax - nx * w * 0.5)} ${f(ay - ny * w * 0.5)} ${f(S[0])} ${f(S[1])}Z`;
    }
    // mảng loang nâu đen
    const blobs = sc.kind === 'm' ? 1 : 2 + Math.floor(r() * 2);
    for (let b = 0; b < blobs; b++) {
      const at = scr[Math.floor(r() * n)];
      const c = lerp(G, at, 0.3 + r() * 0.45);
      const rr = sc.kind === 'm' ? 2.5 + r() * 2.5 : 4 + r() * 8;
      const pts: P[] = [];
      const rot = r() * Math.PI;
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        const rad = rr * (0.55 + r() * 0.7);
        const ex = Math.cos(ang) * rad * 1.5;
        const ey = Math.sin(ang) * rad;
        pts.push([c[0] + ex * Math.cos(rot) - ey * Math.sin(rot), c[1] + ex * Math.sin(rot) + ey * Math.cos(rot)]);
      }
      buckets[b % 2 ? 1 : 0] += roundPoly(pts);
    }
    out += buckets.map((bd, k) => (bd ? `<path d="${bd}" fill="${STREAK[k].c}" fill-opacity="${STREAK[k].o}"/>` : '')).join('');
    // vân tăng trưởng song song mép tấm
    if (sc.kind !== 'm') {
      const rings = [0.18, 0.4, 0.62].map((k) => pathOf(scr.map((p) => lerp(p, G, k)))).join('');
      out += `<path d="${rings}" fill="none" stroke="#2a1006" stroke-opacity="0.16" stroke-width="0.7"/>`;
    }
    // ánh sáng theo pháp tuyến
    const cen = centroid(sc.pts);
    const lb = lambert(cen[0], Math.max(cen[1], foldQ(cen[0])));
    const ref = 0.78;
    if (lb > ref) out += `<path d="${d}" fill="#fff4d6" opacity="${Math.min(0.32, (lb - ref) * 1.4).toFixed(3)}"/>`;
    else out += `<path d="${d}" fill="#120600" opacity="${Math.min(0.5, (ref - lb) * 0.9).toFixed(3)}"/>`;
    // đường nối tấm
    out += `<path d="${d}" fill="none" stroke="${INK}" stroke-opacity="0.75" stroke-width="0.9" stroke-linejoin="round"/>`;
  });
  return out;
}

/** đường bao mai: mép gần (răng cưa) + mép trên (đường gập hoặc mép xa) */
function silhouette(): { full: string; top: string; topPts: P[] } {
  const near: P[] = [];
  for (let b = 0; b <= 180; b += 0.8) {
    const [s, q] = ell(b, edgeR(b));
    near.push(proj(s, q));
  }
  const top: P[] = [];
  for (let b = 180; b <= 360; b += 1) {
    const [s, q] = ell(b, edgeR(b));
    const sc = Math.max(-1, Math.min(1, s));
    const outer = upOf(s, q);
    const fq = foldQ(sc);
    const fold = upOf(sc, fq);
    top.push(outer >= fold ? proj(s, q) : proj(sc, fq));
  }
  return { full: pathOf([...near, ...top]), top: pathOf(top.slice(6, -6), false), topPts: top };
}

// =====================================================================
// CHÂN CHÈO
// =====================================================================
interface FlipOpts {
  pivot: P;
  ang: number; // độ, hướng gốc → ngọn
  L: number;
  wl: number; // nửa bề rộng mép trước
  wt: number; // nửa bề rộng mép sau
  curve: number;
  root: number; // phần nhô sau pivot (tỉ lệ L)
  rows: number;
  arm: number; // tỉ lệ phần "cánh tay" vảy nhỏ
  seed: number;
  claws: number[];
  far?: boolean;
  hind?: boolean;
}

function flipper(o: FlipOpts): string {
  const a = o.ang * DEG;
  const dv: P = [Math.cos(a), Math.sin(a)];
  const nv: P = [-Math.sin(a), Math.cos(a)];
  const W = (x: number, y: number): P => {
    const yc = -o.curve * o.L * Math.pow(Math.max(0, x) / o.L, 2);
    return [o.pivot[0] + x * dv[0] + (y + yc) * nv[0], o.pivot[1] + x * dv[1] + (y + yc) * nv[1]];
  };
  const pk = o.hind ? 0.4 : 0.32;
  const shL = (t: number) => {
    if (t <= 0) return 0.66;
    if (t < pk) return 0.66 + 0.34 * Math.sin(((t / pk) * Math.PI) / 2);
    return Math.pow(Math.max(0, Math.cos((((t - pk) / (1 - pk)) * Math.PI) / 2)), o.hind ? 0.5 : 0.62);
  };
  const pt = o.hind ? 0.5 : 0.46;
  const shT = (t: number) => {
    if (t <= 0) return 0.52;
    if (t < pt) return 0.52 + 0.48 * Math.sin(((t / pt) * Math.PI) / 2);
    return Math.pow(Math.max(0, Math.cos((((t - pt) / (1 - pt)) * Math.PI) / 2)), o.hind ? 0.55 : 0.8);
  };
  const E = (t: number, w: number): P => W(t * o.L, w >= 0 ? w * o.wl * shL(t) : w * o.wt * shT(t));
  const lead: P[] = [];
  const trail: P[] = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const t = -o.root + ((1 + o.root) * i) / N;
    lead.push(E(t, 1));
    trail.push(E(t, -1));
  }
  // nắp gốc tròn
  const cap: P[] = [];
  const x0 = -o.root * o.L;
  const yl = o.wl * shL(0);
  const yt = -o.wt * shT(0);
  for (let k = 1; k < 10; k++) {
    const th = Math.PI * (k / 10);
    const y = (yl + yt) / 2 - ((yl - yt) / 2) * Math.cos(th);
    cap.push(W(x0 - Math.sin(th) * (yl - yt) * 0.35, y));
  }
  const outlinePts = [...lead, ...trail.slice().reverse(), ...cap];
  const outline = smoothPath(outlinePts, true, 0.4);

  const r = rng(o.seed);
  const pal = o.hind ? ['#2E170B', '#43230F', '#5A3016', '#7B4A1F'] : ['#2A140A', '#3E1F0F', '#55301A', '#86531F'];
  const buckets = pal.map(() => '');
  let hi = '';
  // vảy lớn trên bản chèo
  const cols = o.hind ? [-0.94, -0.35, 0.25, 0.72, 0.97] : [-0.94, -0.5, -0.06, 0.38, 0.74, 0.97];
  const rows: number[] = [];
  for (let i = 0; i <= o.rows; i++) rows.push(o.arm + (0.985 - o.arm) * Math.pow(i / o.rows, 0.88));
  for (let i = 0; i < o.rows; i++) {
    const off = i % 2 ? 0.1 : -0.06;
    for (let j = 0; j < cols.length - 1; j++) {
      const w0 = j === 0 ? cols[0] : cols[j] + off;
      const w1 = j === cols.length - 2 ? cols[j + 1] : cols[j + 1] + off;
      const t0 = rows[i];
      const t1 = rows[i + 1];
      const q: P[] = [E(t0, w0), E(t0, w1), E(t1, w1), E(t1, w0)];
      // vảy mép trước lớn & đậm; rải ngẫu nhiên vảy hổ phách
      let k = j === cols.length - 2 ? Math.floor(r() * 2) : Math.floor(r() * 3.2);
      if (r() < 0.16) k = 3;
      const sp = inset(q, 0.1);
      buckets[k] += softPoly(sp, 0.26);
      const h = inset(q, 0.55).map((p) => [p[0] + nv[0] * 1.2, p[1] + nv[1] * 1.2] as P);
      hi += softPoly(h, 0.3);
    }
  }
  // vảy nhỏ phần cánh tay
  const armRows = o.hind ? 2 : 4;
  const armCols = 7;
  for (let i = 0; i < armRows; i++) {
    for (let j = 0; j < armCols; j++) {
      const t0 = -o.root * 0.6 + ((o.arm + o.root * 0.6) * i) / armRows;
      const t1 = -o.root * 0.6 + ((o.arm + o.root * 0.6) * (i + 1)) / armRows;
      const sh = i % 2 ? 0.12 : 0;
      const w0 = Math.max(-0.95, -0.95 + (1.9 * j) / armCols + sh);
      const w1 = Math.min(0.95, -0.95 + (1.9 * (j + 1)) / armCols + sh);
      if (w1 - w0 < 0.08) continue;
      const q: P[] = [E(t0, w0), E(t0, w1), E(t1, w1), E(t1, w0)];
      const k = 1 + Math.floor(r() * 3);
      buckets[k] += softPoly(inset(q, 0.12), 0.3);
    }
  }
  const leadPath = pathOf(lead.slice(4, -1), false);
  const trailPath = pathOf(trail.slice(8, -2), false);
  let claws = '';
  for (const ct of o.claws) {
    const p = E(ct, 1.02);
    const b1: P = [p[0] - dv[0] * 3.2, p[1] - dv[1] * 3.2];
    const b2: P = [p[0] + dv[0] * 3.2, p[1] + dv[1] * 3.2];
    const tip: P = [p[0] + dv[0] * 7 + nv[0] * 5, p[1] + dv[1] * 7 + nv[1] * 5];
    const c: P = [p[0] + dv[0] * 1 + nv[0] * 5.5, p[1] + dv[1] * 1 + nv[1] * 5.5];
    claws += `<path d="M${f(b1[0])} ${f(b1[1])}Q${f(c[0])} ${f(c[1])} ${f(tip[0])} ${f(tip[1])}Q${f(p[0] + dv[0] * 2 + nv[0] * 1.5)} ${f(p[1] + dv[1] * 2 + nv[1] * 1.5)} ${f(b2[0])} ${f(b2[1])}Z" fill="${HORN}" stroke="${INK}" stroke-width="0.7" stroke-opacity="0.7"/>`;
  }
  return (
    `<path d="${outline}" fill="${u.url('flipBase')}"/>` +
    buckets.map((d, k) => (d ? `<path d="${d}" fill="${pal[k]}" fill-opacity="0.94"/>` : '')).join('') +
    `<path d="${hi}" fill="#F7E2AC" fill-opacity="0.16"/>` +
    `<path d="${outline}" fill="${u.url('vol')}"/>` +
    `<path d="${trailPath}" fill="none" stroke="#F6E6BC" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round"/>` +
    `<path d="${leadPath}" fill="none" stroke="#FFF6DC" stroke-opacity="0.45" stroke-width="1.5" stroke-linecap="round"/>` +
    `<path d="${outline}" fill="none" stroke="${INK}" stroke-opacity="0.6" stroke-width="1.3" stroke-linejoin="round"/>` +
    claws +
    (o.far ? `<path d="${outline}" fill="#0b2c40" fill-opacity="0.36"/>` : '')
  );
}

// =====================================================================
// ĐẦU & CỔ
// =====================================================================
const EYE = { cx: 588, cy: 206, r: 8 };
/** cổ dày, da nhăn – phần trước bị đầu che */
const NECK = smoothPath(
  [
    [412, 214],
    [450, 204],
    [484, 198],
    [514, 195],
    [524, 228],
    [518, 262],
    [486, 268],
    [448, 274],
    [414, 272],
  ],
  true,
);
/** đầu hẹp, dài (mỏ vẽ riêng) */
const HEAD_PTS: P[] = [
  [500, 197],
  [520, 191],
  [546, 185],
  [574, 183],
  [598, 189],
  [614, 199],
  [625, 211],
  [626, 225],
  [622, 235],
  [604, 243],
  [578, 250],
  [548, 258],
  [520, 262],
  [502, 258],
  [496, 228],
];
const HEAD = smoothPath(HEAD_PTS, true, 0.5);
const HEAD_EDGE = smoothPath(HEAD_PTS.slice(0, 13), false, 0.5);
const UPPER_BEAK =
  'M603 199C616 202 627 210 631 221C634 231 635 240 631 248C628 242 623 239 616 238L604 236C600 226 599 210 603 199Z';
const LOWER_BEAK = 'M617 239C615 244 609 248 601 249L592 246C600 244 607 241 611 238Z';

function headMosaic(): string {
  const r = rng(404);
  const pal = ['#2A1409', '#3B1F10', '#4E2A14', '#6B3E1A'];
  const b = pal.map(() => '');
  const x0 = 498;
  const y0 = 180;
  const cs = 12;
  const nx = 8;
  const ny = 7;
  const grid: P[][] = [];
  for (let i = 0; i <= nx; i++) {
    grid.push([]);
    for (let j = 0; j <= ny; j++) {
      grid[i].push([x0 + i * cs + (r() - 0.5) * 6 + (j % 2) * 3, y0 + j * cs * 1.02 + (r() - 0.5) * 5 + i * 0.5]);
    }
  }
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      const q: P[] = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]];
      const c = centroid(q);
      if (Math.hypot(c[0] - EYE.cx, c[1] - EYE.cy) < EYE.r + 11) continue;
      if (c[0] > 592) continue;
      // hàm dưới & họng sáng hơn, ít vảy
      if (c[1] > 240 && r() < 0.55) continue;
      let k = c[1] > 236 ? 2 + Math.floor(r() * 2) : Math.floor(r() * 3);
      if (c[0] < 512) k = 3;
      // vảy lớn chia đôi ngẫu nhiên → mảng vảy không đều
      if (r() < 0.3) {
        const m1 = lerp(q[0], q[1], 0.5);
        const m2 = lerp(q[3], q[2], 0.5);
        b[k] += softPoly(inset([q[0], m1, m2, q[3]], 0.12), 0.25);
        b[Math.min(3, k + 1)] += softPoly(inset([m1, q[1], q[2], m2], 0.12), 0.25);
      } else b[k] += softPoly(inset(q, 0.09), 0.25);
    }
  }
  return b.map((d, k) => (d ? `<path d="${d}" fill="${pal[k]}"/>` : '')).join('');
}

function neckScales(): string {
  const r = rng(77);
  const pal = ['#7a4c24', '#946234', '#5e3a1c'];
  const b = pal.map(() => '');
  const pts: P[] = [];
  let tries = 0;
  while (pts.length < 150 && tries < 3000) {
    tries++;
    const x = 410 + r() * 112;
    const y = 194 + r() * 82;
    if (pts.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 < 36)) continue;
    pts.push([x, y]);
  }
  for (const [x, y] of pts) {
    const s = 2.3 + r() * 1.6 - Math.max(0, (y - 240) / 34) * 1.3;
    if (s < 1) continue;
    const poly: P[] = [];
    const rot = r();
    for (let a = 0; a < 6; a++) {
      const ang = ((a + rot) / 6) * Math.PI * 2;
      poly.push([x + Math.cos(ang) * s * (0.8 + r() * 0.3), y + Math.sin(ang) * s * 0.85]);
    }
    b[Math.floor(r() * 3)] += softPoly(poly, 0.3);
  }
  return b.map((d, k) => (d ? `<path d="${d}" fill="${pal[k]}" fill-opacity="0.42"/>` : '')).join('');
}

function ringScales(): string {
  // vảy quanh mắt: sau mắt (postocular), trên mắt (supraocular)
  const { cx, cy, r } = EYE;
  const seg = (a0: number, a1: number, r0: number, r1: number) => {
    const pts: P[] = [];
    for (let k = 0; k <= 4; k++) {
      const a = (a0 + ((a1 - a0) * k) / 4) * DEG;
      pts.push([cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.95]);
    }
    for (let k = 4; k >= 0; k--) {
      const a = (a0 + ((a1 - a0) * k) / 4) * DEG;
      pts.push([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.95]);
    }
    return softPoly(pts, 0.2);
  };
  const dark =
    seg(120, 153, r + 3.5, r + 11) +
    seg(157, 190, r + 3.5, r + 12) +
    seg(194, 224, r + 3.5, r + 12) +
    seg(228, 262, r + 3.5, r + 11) +
    seg(266, 316, r + 3.5, r + 10);
  const cheek = seg(28, 114, r + 3.5, r + 9);
  return `<path d="${dark}" fill="${SCALE_D}"/><path d="${cheek}" fill="#6B3E1A" fill-opacity="0.8"/>`;
}

function head(): string {
  const snout =
    softPoly([
      [592, 189],
      [608, 196],
      [605, 203],
      [591, 200],
    ]) +
    softPoly([
      [609, 199],
      [619, 206],
      [614, 211],
      [606, 207],
    ]) +
    softPoly([
      [599, 206],
      [607, 209],
      [606, 218],
      [599, 217],
    ]) +
    softPoly([
      [556, 184],
      [578, 185],
      [576, 192],
      [558, 193],
    ]) +
    softPoly([
      [574, 220],
      [593, 221],
      [595, 233],
      [578, 233],
    ]);
  const wrinkles =
    'M446 212Q438 236 444 258M466 206Q458 230 463 250M486 202Q479 222 482 238M470 252Q476 262 474 270' +
    'M428 236Q458 244 504 236M436 258Q470 264 506 254M452 222Q472 228 496 222';
  return (
    // cổ
    `<path d="${NECK}" fill="${u.url('neck')}"/>` +
    `<g clip-path="${u.url('neckClip')}">` +
    neckScales() +
    `<path d="${wrinkles}" fill="none" stroke="#5a3616" stroke-opacity="0.26" stroke-width="1.2" stroke-linecap="round"/>` +
    `<path d="${wrinkles}" fill="none" stroke="#FFF1CC" stroke-opacity="0.14" stroke-width="0.9" transform="translate(1.4 0.6)"/>` +
    `<path d="${NECK}" fill="${u.url('vol')}"/>` +
    `</g>` +
    `<path d="${NECK}" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="1.4"/>` +
    // đầu
    `<path d="${HEAD}" fill="${u.url('headBase')}"/>` +
    `<g clip-path="${u.url('headClip')}">` +
    headMosaic() +
    `<path d="${snout}" fill="${SCALE_D}"/>` +
    ringScales() +
    `<path d="${HEAD}" fill="${u.url('vol')}"/>` +
    `<ellipse cx="548" cy="192" rx="36" ry="7" fill="#FFF3D0" opacity="0.22" filter="${u.url('sblur')}"/>` +
    `</g>` +
    // mỏ khoằm như mỏ chim ưng
    `<path d="${LOWER_BEAK}" fill="${u.url('beak')}" stroke="${INK}" stroke-width="0.9" stroke-opacity="0.6"/>` +
    `<path d="${UPPER_BEAK}" fill="${u.url('beak')}" stroke="${INK}" stroke-width="1" stroke-opacity="0.65"/>` +
    `<path d="M606 203C616 207 625 215 629 226" fill="none" stroke="#FFF4D4" stroke-opacity="0.6" stroke-width="1.3" stroke-linecap="round"/>` +
    `<path d="M626 240C629 243 630 245 631 248" fill="none" stroke="#3a1d0c" stroke-opacity="0.6" stroke-width="1"/>` +
    // miệng
    `<path d="M624 239C612 237 598 239 582 243C576 244 571 243 567 239" fill="none" stroke="${INK}" stroke-opacity="0.8" stroke-width="1.6" stroke-linecap="round"/>` +
    `<ellipse cx="620" cy="209" rx="1.7" ry="1.1" fill="${INK}" transform="rotate(30 620 209)"/>` +
    // mắt + mí dày
    `<ellipse cx="${EYE.cx}" cy="${EYE.cy}" rx="${EYE.r + 3}" ry="${EYE.r + 2.4}" fill="#5a3418"/>` +
    EYE_SVG +
    `<path d="M${EYE.cx - EYE.r - 2} ${EYE.cy - 1}Q${EYE.cx} ${EYE.cy - EYE.r - 6} ${EYE.cx + EYE.r + 2} ${EYE.cy - 2}Q${EYE.cx} ${EYE.cy - EYE.r + 1.5} ${EYE.cx - EYE.r - 2} ${EYE.cy - 1}Z" fill="#8a5a2a"/>` +
    `<path d="M${EYE.cx - EYE.r - 1} ${EYE.cy + 3}Q${EYE.cx} ${EYE.cy + EYE.r + 4} ${EYE.cx + EYE.r + 1} ${EYE.cy + 2}" fill="none" stroke="#C9A060" stroke-width="1.4" stroke-opacity="0.8"/>` +
    // viền & rim light
    `<path d="${HEAD_EDGE}" fill="none" stroke="${INK}" stroke-opacity="0.6" stroke-width="1.5"/>` +
    `<path d="M420 210C450 202 480 197 512 194C540 186 570 182 596 188C608 192 616 198 622 205" fill="none" stroke="${u.url('rimH')}" stroke-width="2.2" stroke-linecap="round"/>`
  );
}

const theEye = eye(u, 'eye', {
  cx: EYE.cx,
  cy: EYE.cy,
  r: EYE.r,
  iris: ['#8a5a2a', '#2a160a'],
  look: [0.35, 0.05],
});
const EYE_SVG = theEye.svg;

// =====================================================================
// THÂN (da vai, da hông, đuôi, mai)
// =====================================================================
const SIL = silhouette();
const SHOULDER = smoothPath(
  [
    [398, 262],
    [430, 254],
    [452, 262],
    [456, 278],
    [436, 290],
    [408, 290],
    [392, 280],
  ],
  true,
);
const REAR_SKIN = smoothPath(
  [
    [116, 252],
    [150, 258],
    [174, 266],
    [164, 282],
    [134, 284],
    [114, 270],
  ],
  true,
);
const TAIL = 'M112 244C100 249 88 257 80 268C92 268 104 264 120 258Z';

function bodySvg(): string {
  const skinScales = (seed: number, x0: number, y0: number, w: number, h: number) => {
    const r = rng(seed);
    let d = '';
    for (let i = 0; i < 40; i++) {
      const x = x0 + r() * w;
      const y = y0 + r() * h;
      const s = 1.6 + r() * 2.2;
      d += `M${f(x - s)} ${f(y)}Q${f(x)} ${f(y - s)} ${f(x + s)} ${f(y)}Q${f(x)} ${f(y + s * 0.9)} ${f(x - s)} ${f(y)}Z`;
    }
    return `<path d="${d}" fill="#7a4c24" fill-opacity="0.45"/>`;
  };
  const carapaceShift = SIL.full;
  const rp: P[] = [];
  for (let t = -0.55; t <= 0.62; t += 0.04) rp.push(proj(t, -0.08));
  const ridge = pathOf(rp, false);
  const rp2: P[] = [];
  for (let t = 0.1; t <= 0.55; t += 0.03) rp2.push(proj(t, 0.12));
  const ridge2 = pathOf(rp2, false);
  return (
    // đuôi + da hông
    `<path d="${TAIL}" fill="${u.url('skin')}" stroke="${INK}" stroke-opacity="0.5" stroke-width="1"/>` +
    `<path d="${REAR_SKIN}" fill="${u.url('skin')}"/>` +
    `<g clip-path="${u.url('rearClip')}">${skinScales(5, 106, 250, 78, 44)}</g>` +
    `<path d="${REAR_SKIN}" fill="none" stroke="${INK}" stroke-opacity="0.4" stroke-width="1"/>` +
    // da vai
    `<path d="${SHOULDER}" fill="${u.url('skin')}"/>` +
    `<g clip-path="${u.url('shClip')}">${skinScales(9, 384, 248, 90, 50)}</g>` +
    `<path d="${SHOULDER}" fill="none" stroke="${INK}" stroke-opacity="0.4" stroke-width="1"/>` +
    // bề dày mép mai (mặt dưới tấm viền màu vàng sừng)
    `<path d="${carapaceShift}" transform="translate(-1 5.5)" fill="#8A5A24" stroke="${INK}" stroke-width="1.2" stroke-opacity="0.7"/>` +
    `<path d="${carapaceShift}" transform="translate(-0.5 2.8)" fill="#C79A4E"/>` +
    // mai
    `<g clip-path="${u.url('shell')}">` +
    `<g filter="${u.url('tex')}">` +
    `<path d="${SIL.full}" fill="#2a1207"/>` +
    carapace() +
    `</g>` +
    // khối vòm: sáng trên, tối dưới + vệt bóng ướt dọc sống mai
    `<path d="${SIL.full}" fill="${u.url('dome')}"/>` +
    `<path d="${ridge}" fill="none" stroke="#FFF6DD" stroke-opacity="0.18" stroke-width="8" stroke-linecap="round" filter="${u.url('hblur')}"/>` +
    `<path d="${ridge2}" fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="2.2" stroke-linecap="round" filter="${u.url('sblur')}"/>` +
    `</g>` +
    `<path d="${SIL.full}" fill="none" stroke="${INK}" stroke-opacity="0.7" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<path d="${SIL.top}" fill="none" stroke="${u.url('rim')}" stroke-width="2.4" stroke-linecap="round"/>`
  );
}

// =====================================================================
// DEFS
// =====================================================================
const scuteGrad = (name: string, c0: string, c1: string, c2: string) =>
  radial(
    u(name),
    [
      [0, c0],
      [0.5, c1],
      [1, c2],
    ],
    { cx: 0.38, cy: 0.55, r: 0.75 },
  );

const defs = joinDefs(
  theEye,
  scuteGrad('g0', '#F0B44E', '#A9541E', '#4E1D0B'),
  scuteGrad('g1', '#D98F36', '#86381A', '#3A1408'),
  scuteGrad('g2', '#E8A646', '#9C4A1C', '#46190A'),
  scuteGrad('g3', '#C27A30', '#6A2A12', '#2C1007'),
  linear(u('dome'), [
    [0, '#FFF2CF', 0.22],
    [0.3, '#FFF2CF', 0.0],
    [0.62, '#1a0800', 0.0],
    [1, '#1a0800', 0.38],
  ]),
  rimGradient(u('rim'), '#FFF4D8', 0.85),
  rimGradient(u('rimH'), '#FFF4D8', 0.75),
  linear(u('flipBase'), [
    [0, '#F1DCA4'],
    [1, '#CFA968'],
  ]),
  linear(u('skin'), [
    [0, '#A88050'],
    [1, '#D8BC86'],
  ]),
  linear(u('neck'), [
    [0, '#B58A50'],
    [0.45, '#D8BC84'],
    [1, '#F3E4BA'],
  ]),
  linear(u('headBase'), [
    [0, '#E8CC8E'],
    [1, '#F4E6BE'],
  ]),
  linear(
    u('beak'),
    [
      [0, '#EAD29A'],
      [0.6, '#C9A462'],
      [1, '#6E4A22'],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 1 },
  ),
  volumeShade(u('vol'), '#FFF6DC', '#1a0a02'),
  blurFilter(u('sblur'), 1.6),
  blurFilter(u('hblur'), 5),
  organicTexture(u('tex'), { freq: 0.11, octaves: 3, strength: 0.2, seed: 11 }),
  `<clipPath id="${u('shell')}"><path d="${SIL.full}"/></clipPath>`,
  `<clipPath id="${u('headClip')}"><path d="${HEAD}"/></clipPath>`,
  `<clipPath id="${u('neckClip')}"><path d="${NECK}"/></clipPath>`,
  `<clipPath id="${u('shClip')}"><path d="${SHOULDER}"/></clipPath>`,
  `<clipPath id="${u('rearClip')}"><path d="${REAR_SKIN}"/></clipPath>`,
);

// =====================================================================
// LỚP
// =====================================================================
const FRONT_NEAR: FlipOpts = { pivot: [436, 262], ang: 162, L: 212, wl: 30, wt: 27, curve: 0.13, root: 0.08, rows: 10, arm: 0.22, seed: 31, claws: [0.3, 0.42] };
const FRONT_FAR: FlipOpts = { pivot: [424, 206], ang: 204, L: 190, wl: 25, wt: 23, curve: 0.12, root: 0.06, rows: 9, arm: 0.24, seed: 57, claws: [], far: true };
const HIND_NEAR: FlipOpts = { pivot: [150, 268], ang: 170, L: 84, wl: 22, wt: 26, curve: 0.08, root: 0.12, rows: 5, arm: 0.2, seed: 73, claws: [0.36], hind: true };
const HIND_FAR: FlipOpts = { pivot: [150, 238], ang: 192, L: 72, wl: 18, wt: 21, curve: 0.08, root: 0.1, rows: 4, arm: 0.2, seed: 91, claws: [], far: true, hind: true };

const art: CreatureArt = {
  id: ID,
  viewBox: [700, 470],
  lengthUnits: 570,
  spineY: 226,
  animation: 'turtle',
  cycleHz: 0.42,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'flipperFrontFar',
      role: 'flipper',
      bend: false,
      z: 'back',
      pivot: FRONT_FAR.pivot,
      anim: { type: 'rotate', amp: 0.42, phase: 0.25 },
      svg: flipper(FRONT_FAR),
    },
    {
      name: 'flipperHindFar',
      role: 'flipper',
      bend: false,
      z: 'back',
      pivot: HIND_FAR.pivot,
      anim: { type: 'rotate', amp: 0.2, phase: Math.PI / 2 + 0.4 },
      svg: flipper(HIND_FAR),
    },
    {
      name: 'flipperHindNear',
      role: 'flipper',
      bend: false,
      z: 'back',
      pivot: HIND_NEAR.pivot,
      anim: { type: 'rotate', amp: 0.22, phase: Math.PI / 2 },
      svg: flipper(HIND_NEAR),
    },
    {
      name: 'head',
      role: 'detail',
      bend: false,
      z: 'back',
      pivot: [440, 236],
      anim: { type: 'rotate', amp: 0.025, phase: 1.1 },
      svg: head(),
    },
    { name: 'body', role: 'body', svg: bodySvg() },
    {
      name: 'flipperFrontNear',
      role: 'flipper',
      bend: false,
      z: 'front',
      pivot: FRONT_NEAR.pivot,
      anim: { type: 'rotate', amp: 0.48 },
      svg: flipper(FRONT_NEAR),
    },
  ],
};

export default art;
