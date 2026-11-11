/**
 * Rùa xanh – Chelonia mydas (Hiếm, miền Nam – Côn Đảo)
 * Góc nhìn ngang hơi chếch từ trên. Mai dựng bằng vòm 3D thấp chiếu ra màn hình.
 * Đặc điểm nhận dạng (khác rùa đồi mồi):
 *  - Mai hình tim/bầu dục TRƠN, mép không răng cưa; vai mai rộng, thuôn về đuôi.
 *  - Tấm vảy mai xếp KỀ nhau (không chồng ngói): đường nối mảnh màu kem, không có bóng đổ bậc thang.
 *  - Màu nâu ô liu, vân tia tỏa nâu vàng mềm từ tâm sinh trưởng của từng tấm.
 *  - Đầu tròn nhỏ, mõm ngắn tù; vảy đầu nâu sẫm viền vàng nhạt dày; chỉ 1 đôi vảy trước trán (1 tấm lớn thấy từ bên).
 *  - Chân chèo trước dài, vảy đa giác nâu tím với lưới viền kem, 1 móng.
 *  - Yếm vàng kem lộ dưới mép mai.
 */
import type { CreatureArt } from '../contract';
import { makeIds, eye, linear, radial, joinDefs, rng, rimGradient, blurFilter, organicTexture, volumeShade, smoothPath } from '../style-bible';

const ID = 'rua_xanh';
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
const area = (pts: P[]) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return Math.abs(a) / 2;
};
/** đa giác bo góc mềm (giữ dáng đa giác của vảy sừng) */
function softPoly(pts: P[], k = 0.26): string {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = lerp(pts[i], pts[(i - 1 + n) % n], k);
    const b = lerp(pts[i], pts[(i + 1) % n], k);
    d += `${i ? 'L' : 'M'}${f(a[0])} ${f(a[1])}Q${f(pts[i][0])} ${f(pts[i][1])} ${f(b[0])} ${f(b[1])}`;
  }
  return d + 'Z';
}

// ---------- Lưới vảy kiểu "power-Voronoi" (vảy đa giác kề nhau, có trọng số kích thước) ----------
interface Seed {
  p: P;
  w: number; // trọng số (px²) – lớn → vảy to
}
function clipHalf(poly: P[], ax: number, ay: number, b: number): P[] {
  const out: P[] = [];
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i];
    const B = poly[(i + 1) % poly.length];
    const da = ax * A[0] + ay * A[1] - b;
    const db = ax * B[0] + ay * B[1] - b;
    if (da <= 0) out.push(A);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) out.push(lerp(A, B, da / (da - db)));
  }
  return out;
}
function powerCells(seeds: Seed[], box: [number, number, number, number]): (P[] | null)[] {
  return seeds.map((si, i) => {
    let poly: P[] = [
      [box[0], box[1]],
      [box[2], box[1]],
      [box[2], box[3]],
      [box[0], box[3]],
    ];
    for (let j = 0; j < seeds.length && poly.length > 2; j++) {
      if (j === i) continue;
      const sj = seeds[j];
      const dx = sj.p[0] - si.p[0];
      const dy = sj.p[1] - si.p[1];
      if (dx * dx + dy * dy < 1e-6) continue;
      const b = (sj.p[0] ** 2 + sj.p[1] ** 2 - si.p[0] ** 2 - si.p[1] ** 2 - sj.w + si.w) / 2;
      poly = clipHalf(poly, dx, dy, b);
    }
    return poly.length > 2 ? poly : null;
  });
}
/** co vảy lồi vào trong đúng một khoảng `gap` (dời từng cạnh) để lộ đường viền màu nền đều nét */
function shrink(poly: P[], gap: number): P[] | null {
  // bỏ đỉnh trùng
  const pts = poly.filter((p, i) => {
    const q = poly[(i + 1) % poly.length];
    return Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.05;
  });
  if (pts.length < 3) return null;
  // chiều quay
  let sg = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    sg += a[0] * b[1] - b[0] * a[1];
  }
  const dir = sg > 0 ? 1 : -1;
  let out = pts;
  for (let i = 0; i < pts.length && out.length > 2; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const l = Math.hypot(ex, ey);
    // pháp tuyến hướng ra ngoài
    const nx = (ey / l) * dir;
    const ny = (-ex / l) * dir;
    out = clipHalf(out, nx, ny, nx * a[0] + ny * a[1] - gap);
  }
  return out.length > 2 && area(out) > 1.5 ? out : null;
}

// ---------- Màu ----------
const INK = '#1f1a0c'; // viền nâu ô liu rất sẫm
const SEAM = '#E2D6A6';
const BORDER = '#E8D28C'; // viền vàng nhạt của vảy đầu

// =====================================================================
// MAI – vòm thấp, mặt bằng hình tim
// =====================================================================
const SH = { cx: 282, yb: 224, A: 178, H: 64, phi: 25 * DEG };
const SIN = Math.sin(SH.phi);
const COS = Math.cos(SH.phi);
/** hệ số bề rộng theo s (-1 đuôi → 1 đầu): vai rộng, hông thuôn dần → dáng tim */
const kW = (s: number) => 0.8 * (1 + 0.08 * s) * (1 - 0.2 * Math.max(0, -s) ** 2);
function h3(s: number, q: number): number {
  const r2 = s * s + q * q;
  if (r2 < 1) return SH.H * Math.pow(Math.max(0, 1 - r2), 0.58) * (1 + 0.1 * s);
  return -(Math.sqrt(r2) - 1) * SH.H * 0.7;
}
const pzOf = (s: number, q: number) => SH.A * kW(s) * q;
const upOf = (s: number, q: number) => h3(s, q) * COS - pzOf(s, q) * SIN;
const proj = (s: number, q: number): P => [SH.cx + SH.A * s, SH.yb - upOf(s, q)];
const foldCache = new Map<number, number>();
function foldQ(s: number): number {
  const key = Math.round(s * 2000);
  const c = foldCache.get(key);
  if (c !== undefined) return c;
  const lim = Math.sqrt(Math.max(0, 1 - s * s));
  let best = 0;
  let bu = -Infinity;
  for (let i = 0; i <= 64; i++) {
    const q = -lim * 1.08 + (lim * 1.08 * i) / 64;
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

/** bán kính mép mai theo góc (0 = mũi, 180 = đuôi): vai phồng nhẹ (dáng tim), lõm khẽ ở tấm gáy, mép TRƠN */
function edgeR(betaDeg: number): number {
  const b = Math.abs(((betaDeg + 540) % 360) - 180); // 0..180, đối xứng
  const bb = 180 - b; // 0 = mũi
  const shoulder = 0.07 * Math.max(0, Math.sin(Math.min(Math.PI, (bb / 100) * Math.PI))) ** 1.3;
  const notch = 0.02 * Math.exp(-((bb / 9) ** 2));
  const tail = 0.03 * Math.exp(-(((180 - bb) / 14) ** 2)); // đuôi mai hơi nhọn ra
  return 1 + shoulder - notch + tail;
}
const RING = 0.875; // vòng trong của tấm viền (tỉ lệ theo edgeR)
const ell = (beta: number, rho: number): P => [rho * Math.cos(beta * DEG), rho * Math.sin(beta * DEG)];
const ringP = (beta: number): P => ell(beta, RING * edgeR(beta));
function arc(b0: number, b1: number, kind: 'ring' | 'edge', step = 1.5): P[] {
  const out: P[] = [];
  const n = Math.max(2, Math.ceil(Math.abs(b1 - b0) / step));
  for (let i = 0; i < n; i++) {
    const b = b0 + ((b1 - b0) * i) / n;
    out.push(kind === 'ring' ? ringP(b) : ell(b, edgeR(b)));
  }
  return out;
}
function seg(a: P, b: P, n = 6): P[] {
  const out: P[] = [];
  for (let i = 0; i < n; i++) out.push(lerp(a, b, i / n));
  return out;
}

interface Scute {
  pts: P[];
  g: P; // tâm sinh trưởng (areola)
  kind: 'm' | 'c' | 'v';
  far: boolean;
}

// tấm sống: 5 tấm rộng, lục giác
const V_FRONT = 13; // góc (độ) chỗ tấm sống 1 chạm vòng viền
const V_BACK = 167;
const VS = [0, 0.53, 0.19, -0.15, -0.49, 0];
const VQ = [0, 0.29, 0.32, 0.3, 0.24, 0];
const VL = [0.35, 0.42, 0.43, 0.39, 0.31];
const VLS = [0.68, 0.36, 0.02, -0.32, -0.66]; // vị trí s của đỉnh bên
const corner = (i: number, side: 1 | -1): P => {
  if (i === 0) {
    const p = ringP(V_FRONT);
    return [p[0], p[1] * side];
  }
  if (i === 5) {
    const p = ringP(V_BACK);
    return [p[0], p[1] * side];
  }
  return [VS[i], VQ[i] * side];
};
const lat = (i: number, side: 1 | -1): P => [VLS[i], VL[i] * side];

function vertebral(i: number): Scute {
  const pts: P[] = [];
  if (i === 0) pts.push(...arc(-V_FRONT, V_FRONT, 'ring', 2));
  else pts.push(...seg(corner(i, -1), corner(i, 1), 6));
  pts.push(...seg(corner(i, 1), lat(i, 1), 5), ...seg(lat(i, 1), corner(i + 1, 1), 5));
  if (i === 4) pts.push(...arc(V_BACK, 360 - V_BACK, 'ring', 2));
  else pts.push(...seg(corner(i + 1, 1), corner(i + 1, -1), 6));
  pts.push(...seg(corner(i + 1, -1), lat(i, -1), 5), ...seg(lat(i, -1), corner(i, -1), 5));
  const s0 = i === 0 ? corner(0, 1)[0] : VS[i];
  const s1 = i === 4 ? corner(5, 1)[0] : VS[i + 1];
  return { pts, g: [s1 + (s0 - s1) * 0.22, 0], kind: 'v', far: false };
}

const C_ANG = [V_FRONT, 60, 95, 129, V_BACK];
function costalsNear(): { pts: P[]; g: P }[] {
  const out: { pts: P[]; g: P }[] = [];
  const gs: P[] = [
    [0.4, 0.5],
    [0.04, 0.56],
    [-0.3, 0.55],
    [-0.62, 0.43],
  ];
  for (let k = 0; k < 4; k++) {
    const pts: P[] = [...arc(C_ANG[k], C_ANG[k + 1], 'ring')];
    // từ vòng viền vào cột sống: đỉnh bên của tấm sống k+1 (hoặc góc sau tấm sống 5)
    if (k < 3) {
      pts.push(...seg(ringP(C_ANG[k + 1]), lat(k + 1, 1), 6));
      pts.push(...seg(lat(k + 1, 1), corner(k + 1, 1), 4));
    } else {
      pts.push(...seg(corner(5, 1), lat(4, 1), 4));
      pts.push(...seg(lat(4, 1), corner(4, 1), 4));
    }
    pts.push(...seg(corner(k + 1, 1), lat(k, 1), 4));
    if (k > 0) pts.push(...seg(lat(k, 1), ringP(C_ANG[k]), 6));
    else pts.push(...seg(lat(0, 1), corner(0, 1), 4));
    out.push({ pts, g: gs[k] });
  }
  return out;
}

const MB = [V_FRONT, 27, 41, 55, 69, 83, 97, 111, 125, 139, 153, V_BACK, 180];
function marginal(b0: number, b1: number): P[] {
  return [...arc(b0, b1, 'ring', 2), ringP(b1), ...arc(b1, b0, 'edge', 1), ell(b0, edgeR(b0))];
}

function buildScutes(): Scute[] {
  const list: Scute[] = [];
  list.push({ pts: marginal(-V_FRONT, V_FRONT), g: [0.95, 0], kind: 'm', far: false });
  for (let k = 0; k < MB.length - 1; k++) {
    const b0 = MB[k];
    const b1 = MB[k + 1];
    const gb = b0 + (b1 - b0) * 0.8;
    list.push({ pts: marginal(b0, b1), g: ell(gb, 0.95), kind: 'm', far: false });
    list.push({ pts: marginal(-b1, -b0), g: ell(-gb, 0.95), kind: 'm', far: true });
  }
  costalsNear().forEach(({ pts, g }) => {
    list.push({ pts, g, kind: 'c', far: false });
    list.push({ pts: pts.map(([s, q]) => [s, -q] as P).reverse(), g: [g[0], -g[1]], kind: 'c', far: true });
  });
  for (let i = 0; i < 5; i++) list.push(vertebral(i));
  return list;
}

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
  const L = [0.35, 1, 0.4];
  const ll = Math.hypot(L[0], L[1], L[2]);
  return (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / (ln * ll);
}

// vân tia rùa xanh: nan quạt mềm (vàng nâu / nâu sẫm) xen kẽ, tỏa từ tâm sinh trưởng
const RAY = [
  { c: '#D6AC52', o: 0.62 },
  { c: '#A8803A', o: 0.5 },
  { c: '#1E190B', o: 0.55 },
  { c: '#F2D98A', o: 0.36 },
];

function carapace(): { fills: string; rays: string; streaks: string; seams: string; light: string } {
  const scutes = buildScutes();
  scutes.sort((a, b) => (a.far !== b.far ? (a.far ? -1 : 1) : (a.kind === 'v' ? 1 : 0) - (b.kind === 'v' ? 1 : 0)));
  const r = rng(5203);
  let fills = '';
  let seams = '';
  let light = '';
  const rays = RAY.map(() => '');
  let streaks = '';
  let blot = '';
  scutes.forEach((sc, idx) => {
    if (sc.far && sc.kind === 'm') {
      const vis = sc.pts.filter(([s, q]) => q > foldQ(s) + 0.01).length;
      if (vis < 3) return;
    }
    const scr = sc.pts.map(([s, q]) => projC(s, q));
    const d = pathOf(scr);
    const G = projC(sc.g[0], sc.g[1]);
    const grad = sc.kind === 'm' ? ['m0', 'm1'][idx % 2] : ['g0', 'g1', 'g2', 'g3'][(idx * 3) % 4];
    fills += `<path d="${d}" fill="${u.url(grad)}"/>`;
    // nan quạt
    const n = scr.length;
    const nr = sc.kind === 'm' ? 5 : sc.kind === 'v' ? 15 : 17;
    for (let k = 0; k < nr; k++) {
      const i0 = Math.floor(((k + r() * 0.5) / nr) * n) % n;
      const span = Math.max(1, Math.round((n / nr) * (0.35 + r() * 0.35)));
      const reach = 0.72 + r() * 0.26; // tia dài ngắn không đều
      const B1 = lerp(G, scr[i0], reach);
      const B2 = lerp(G, scr[(i0 + span) % n], reach);
      const S = lerp(G, lerp(B1, B2, 0.5), 0.04 + r() * 0.08);
      const kk = k % 2 === 0 ? (r() < 0.75 ? 0 : 3) : r() < 0.6 ? 2 : 1;
      const M = lerp(S, lerp(B1, B2, 0.5), 0.55);
      rays[kk] += `M${f(S[0])} ${f(S[1])}Q${f(lerp(M, B1, 0.25)[0])} ${f(lerp(M, B1, 0.25)[1])} ${f(B1[0])} ${f(B1[1])}L${f(B2[0])} ${f(B2[1])}Q${f(lerp(M, B2, 0.25)[0])} ${f(lerp(M, B2, 0.25)[1])} ${f(S[0])} ${f(S[1])}Z`;
    }
    // vệt mảnh sắc nét (gân tia)
    const ns = sc.kind === 'm' ? 3 : 10;
    for (let k = 0; k < ns; k++) {
      const B = scr[Math.floor(r() * n)];
      const S = lerp(G, B, 0.08 + r() * 0.1);
      const E = lerp(G, B, 0.75 + r() * 0.2);
      streaks += `M${f(S[0])} ${f(S[1])}L${f(E[0])} ${f(E[1])}`;
    }
    // mảng loang ô liu sẫm
    const nb = sc.kind === 'm' ? 0 : 1 + Math.floor(r() * 2);
    for (let b = 0; b < nb; b++) {
      const c = lerp(G, scr[Math.floor(r() * n)], 0.45 + r() * 0.35);
      const rr = 4 + r() * 6;
      const pts: P[] = [];
      for (let a = 0; a < 7; a++) {
        const ang = (a / 7) * Math.PI * 2;
        const rad = rr * (0.6 + r() * 0.6);
        pts.push([c[0] + Math.cos(ang) * rad * 1.4, c[1] + Math.sin(ang) * rad]);
      }
      blot += softPoly(pts, 0.5);
    }
    // vân tăng trưởng mờ song song mép tấm
    if (sc.kind !== 'm') {
      streaks += '';
      seams += '';
      light += `<path d="${[0.3, 0.6].map((k) => pathOf(scr.map((p) => lerp(p, G, k)))).join('')}" fill="none" stroke="#1d1a0a" stroke-opacity="0.12" stroke-width="0.7"/>`;
    }
    // chiếu sáng theo pháp tuyến
    const cen = centroid(sc.pts);
    const lb = lambert(cen[0], Math.max(cen[1], foldQ(cen[0])));
    const ref = 0.8;
    if (lb > ref) light += `<path d="${d}" fill="#fff6d8" opacity="${Math.min(0.26, (lb - ref) * 1.3).toFixed(3)}"/>`;
    else light += `<path d="${d}" fill="#0d0c03" opacity="${Math.min(0.48, (ref - lb) * 0.95).toFixed(3)}"/>`;
    seams += d;
  });
  const rayOut =
    `<g filter="${u.url('rblur')}">` +
    rays.map((d, k) => (d ? `<path d="${d}" fill="${RAY[k].c}" fill-opacity="${RAY[k].o}"/>` : '')).join('') +
    `<path d="${blot}" fill="#24260f" fill-opacity="0.42"/>` +
    `</g>`;
  return {
    fills,
    rays: rayOut,
    streaks: `<path d="${streaks}" fill="none" stroke="#F3DD96" stroke-opacity="0.22" stroke-width="0.8" stroke-linecap="round"/>`,
    seams,
    light,
  };
}

function silhouette(): { full: string; top: string; nearPts: P[] } {
  const near: P[] = [];
  for (let b = 0; b <= 180; b += 1) {
    const [s, q] = ell(b, edgeR(b));
    near.push(proj(s, q));
  }
  const top: P[] = [];
  for (let b = 180; b <= 360; b += 1) {
    const [s, q] = ell(b, edgeR(b));
    const sc = Math.max(-1, Math.min(1, s));
    const fq = foldQ(sc);
    top.push(upOf(s, q) >= upOf(sc, fq) ? proj(s, q) : proj(sc, fq));
  }
  return { full: pathOf([...near, ...top]), top: pathOf(top.slice(8, -8), false), nearPts: near };
}

// =====================================================================
// CHÂN CHÈO – vảy đa giác nâu tím, lưới viền kem
// =====================================================================
interface FlipOpts {
  name: string;
  pivot: P;
  ang: number; // hướng gốc → ngọn (độ)
  L: number;
  wl: number; // nửa bề rộng phía mép trước
  wt: number; // nửa bề rộng phía mép sau
  curve: number; // độ cong lưỡi liềm (ngọn quét về phía mép sau)
  root: number;
  lead: 1 | -1; // mép trước nằm bên nào của trục
  seed: number;
  claw?: number;
  far?: boolean;
  hind?: boolean;
}

function flipper(o: FlipOpts): { svg: string; clip: string } {
  const a = o.ang * DEG;
  const dv: P = [Math.cos(a), Math.sin(a)];
  const lv: P = [dv[1] * o.lead, -dv[0] * o.lead];
  const W = (x: number, y: number): P => {
    const t = Math.max(0, x / o.L);
    const yc = -o.curve * o.L * t * t;
    return [o.pivot[0] + x * dv[0] + (y + yc) * lv[0], o.pivot[1] + x * dv[1] + (y + yc) * lv[1]];
  };
  const pk = o.hind ? 0.45 : 0.36;
  const shL = (t: number) => {
    if (t <= 0) return 0.72;
    if (t < pk) return 0.72 + 0.28 * Math.sin(((t / pk) * Math.PI) / 2);
    return Math.pow(Math.max(0, Math.cos((((t - pk) / (1 - pk)) * Math.PI) / 2)), o.hind ? 0.42 : 0.5);
  };
  const pt = o.hind ? 0.5 : 0.52;
  const shT = (t: number) => {
    if (t <= 0) return 0.62;
    if (t < pt) return 0.62 + 0.38 * Math.sin(((t / pt) * Math.PI) / 2);
    return Math.pow(Math.max(0, Math.cos((((t - pt) / (1 - pt)) * Math.PI) / 2)), o.hind ? 0.5 : 0.85);
  };
  const E = (t: number, w: number): P => W(t * o.L, w >= 0 ? w * o.wl * shL(t) : w * o.wt * shT(t));
  const lead: P[] = [];
  const trail: P[] = [];
  const N = 36;
  for (let i = 0; i <= N; i++) {
    const t = -o.root + ((1 + o.root) * i) / N;
    lead.push(E(t, 1));
    trail.push(E(t, -1));
  }
  // nắp gốc tròn (khuất dưới da vai)
  const cap: P[] = [];
  const x0 = -o.root * o.L;
  const yl = o.wl * shL(0);
  const yt = -o.wt * shT(0);
  for (let k = 1; k < 8; k++) {
    const th = Math.PI * (k / 8);
    cap.push(W(x0 - Math.sin(th) * (yl - yt) * 0.4, (yl + yt) / 2 - ((yl - yt) / 2) * Math.cos(th)));
  }
  const outline = smoothPath([...lead, ...trail.slice(0, -1).reverse(), ...cap], true, 0.45);

  // hạt vảy theo hàng dọc trục
  const r = rng(o.seed);
  const seeds: Seed[] = [];
  const seedT: number[] = [];
  let t = -o.root * 1.5;
  let row = 0;
  while (t < 0.985) {
    const width = o.wl * shL(Math.max(0, t)) + o.wt * shT(Math.max(0, t));
    // vảy nhỏ ở cổ tay & ngọn, to ở giữa bản chèo
    const base = o.hind ? 12 : 15.5;
    const sz = t < 0.14 ? base * 0.55 : base * (1 - 0.5 * Math.max(0, (t - 0.45) / 0.55) ** 1.2);
    const cnt = Math.max(1, Math.round(width / sz));
    for (let j = 0; j < cnt; j++) {
      const wv = -0.94 + (1.88 * (j + 0.5 + (row % 2 ? 0.25 : -0.25))) / cnt + (r() - 0.5) * 0.12;
      const tw = t + (r() - 0.5) * (sz / o.L) * 0.35;
      // hàng vảy mép trước to và dài hơn
      const edge = wv > 0.62 ? 18 : 0;
      seeds.push({ p: E(Math.max(-o.root * 1.6, tw), Math.max(-0.97, Math.min(0.97, wv))), w: edge + (r() - 0.5) * 8 });
      seedT.push(tw);
    }
    t += (sz / o.L) * 0.95;
    row++;
  }
  const xs = [...lead, ...trail].map((p) => p[0]);
  const ys = [...lead, ...trail].map((p) => p[1]);
  const box: [number, number, number, number] = [Math.min(...xs) - 10, Math.min(...ys) - 10, Math.max(...xs) + 10, Math.max(...ys) + 10];
  const cells = powerCells(seeds, box);
  const pal = o.hind ? ['#33241D', '#3F2C24', '#4D3629', '#5D4430'] : ['#2B1E1E', '#382727', '#463230', '#57403A'];
  const buckets = pal.map(() => '');
  let skinSc = '';
  let hi = '';
  cells.forEach((c, i) => {
    if (!c) return;
    const s = shrink(c, o.hind ? 0.7 : 0.8);
    if (!s) return;
    // gốc chèo (cánh tay): vảy nhỏ màu da vàng nâu, chuyển dần sang vảy sẫm
    if (seedT[i] < 0.07 || (seedT[i] < 0.13 && r() < 0.5)) {
      skinSc += softPoly(s, 0.25);
      return;
    }
    buckets[Math.floor(r() * pal.length)] += softPoly(s, 0.2);
    const h = inset(s, 0.5).map((p) => [p[0] - 0.8, p[1] - 1.2] as P);
    hi += softPoly(h, 0.35);
  });
  const leadEdge = smoothPath(lead.slice(5, -2), false);
  const trailEdge = smoothPath(trail.slice(6, -3), false);
  let claw = '';
  if (o.claw !== undefined) {
    const p = E(o.claw, 1.0);
    const b1: P = [p[0] - dv[0] * 3.5, p[1] - dv[1] * 3.5];
    const b2: P = [p[0] + dv[0] * 3.5, p[1] + dv[1] * 3.5];
    const tip: P = [p[0] + dv[0] * 6.5 + lv[0] * 6, p[1] + dv[1] * 6.5 + lv[1] * 6];
    const c: P = [p[0] + lv[0] * 6.5, p[1] + lv[1] * 6.5];
    claw = `<path d="M${f(b1[0])} ${f(b1[1])}Q${f(c[0])} ${f(c[1])} ${f(tip[0])} ${f(tip[1])}Q${f(p[0] + dv[0] * 2.5 + lv[0] * 1.5)} ${f(p[1] + dv[1] * 2.5 + lv[1] * 1.5)} ${f(b2[0])} ${f(b2[1])}Z" fill="${u.url('claw')}" stroke="${INK}" stroke-width="0.7" stroke-opacity="0.7"/>`;
  }
  const clipId = `flip_${o.name}`;
  const svg =
    `<path d="${outline}" fill="${u.url('flipNet')}"/>` +
    `<g clip-path="${u.url(clipId)}">` +
    buckets.map((d, k) => (d ? `<path d="${d}" fill="${pal[k]}"/>` : '')).join('') +
    `<path d="${skinSc}" fill="#9A7A44"/>` +
    `<path d="${hi}" fill="#E9D8B4" fill-opacity="0.09"/>` +
    // gốc chèo hoà vào da vai
    `<ellipse cx="${f(o.pivot[0] - dv[0] * o.L * 0.02)}" cy="${f(o.pivot[1] - dv[1] * o.L * 0.02)}" rx="${f(o.L * 0.08)}" ry="${f((o.wl + o.wt) * 0.5)}" transform="rotate(${f(o.ang)} ${f(o.pivot[0])} ${f(o.pivot[1])})" fill="${u.url('skin')}" opacity="0.45" filter="${u.url('sblur')}"/>` +
    `<path d="${outline}" fill="${u.url('flipVol')}"/>` +
    `</g>` +
    `<path d="${trailEdge}" fill="none" stroke="#F0E2BC" stroke-opacity="0.5" stroke-width="1.5" stroke-linecap="round"/>` +
    `<path d="${leadEdge}" fill="none" stroke="#FFF4D6" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round"/>` +
    `<path d="${outline}" fill="none" stroke="#24180f" stroke-opacity="0.7" stroke-width="1.3" stroke-linejoin="round"/>` +
    claw +
    (o.far ? `<path d="${outline}" fill="#0a2a3c" fill-opacity="0.34"/>` : '');
  return { svg, clip: `<clipPath id="${u(clipId)}"><path d="${outline}"/></clipPath>` };
}

// =====================================================================
// ĐẦU & CỔ
// =====================================================================
const EYE = { cx: 566, cy: 211, r: 9.5 };
const HEAD_PTS: P[] = [
  [506, 199],
  [523, 189],
  [546, 182],
  [569, 181],
  [588, 186],
  [601, 196],
  [609, 209],
  [611, 222],
  [608, 233],
  [600, 241],
  [580, 248],
  [554, 252],
  [530, 253],
  [511, 248],
  [500, 226],
];
const HEAD = smoothPath(HEAD_PTS, true, 0.5);
const HEAD_TOP = smoothPath(HEAD_PTS.slice(0, 8), false, 0.5);
const NECK = smoothPath(
  [
    [424, 214],
    [458, 204],
    [490, 198],
    [515, 197],
    [522, 226],
    [518, 252],
    [494, 262],
    [462, 270],
    [428, 272],
  ],
  true,
);

/** vảy đầu: power-Voronoi với hạt đặt tay (vảy trước trán to, vảy quanh mắt nhỏ) */
const HEAD_SEEDS: [number, number, number][] = [
  // [x, y, trọng số]
  [590, 196, 260], // vảy trước trán (prefrontal) – 1 tấm lớn thấy từ bên
  [562, 186, 120], // trán (frontal)
  [539, 187, 60], // đỉnh (frontoparietal)
  [519, 194, 30],
  [507, 210, 0],
  [552, 199, 0], // trên mắt (supraocular)
  [575, 198, -20],
  [549, 211, -40], // sau mắt (postocular)
  [553, 223, -40],
  [562, 230, -30],
  [576, 230, -20], // dưới mắt
  [590, 222, 10],
  [598, 210, -10], // má trước mắt
  [530, 216, 140], // tấm màng nhĩ (tympanic) lớn
  [527, 238, 40],
  [512, 230, 0],
  [546, 238, 30],
  [567, 242, -10],
  [585, 238, -30],
  [601, 228, -40],
  [528, 200, -10],
];

function headScales(): string {
  const seeds: Seed[] = HEAD_SEEDS.map(([x, y, w]) => ({ p: [x, y], w }));
  // vòng vảy li ti quanh mắt
  for (let k = 0; k < 9; k++) {
    const a = (-150 + k * 34) * DEG;
    seeds.push({ p: [EYE.cx + Math.cos(a) * (EYE.r + 5), EYE.cy + Math.sin(a) * (EYE.r + 4.5)], w: -60 });
  }
  const cells = powerCells(seeds, [490, 172, 620, 262]);
  const pal = ['#2E1E10', '#3A2614', '#47301A', '#8A6A38'];
  const b = pal.map(() => '');
  let hi = '';
  const r = rng(91);
  cells.forEach((c, i) => {
    if (!c) return;
    const cen = centroid(c);
    if (Math.hypot(cen[0] - EYE.cx, cen[1] - EYE.cy) < EYE.r + 1) return;
    const big = i < HEAD_SEEDS.length && HEAD_SEEDS[i][2] >= 100;
    const s = shrink(c, i >= HEAD_SEEDS.length ? 0.75 : big ? 1.35 : 1.1);
    if (!s) return;
    // vùng hàm dưới/họng nhạt màu: vảy nâu đỏ nhạt hơn
    let k = Math.floor(r() * 3);
    if (cen[1] > 238) k = 3;
    b[k] += softPoly(s, 0.3);
    hi += softPoly(inset(s, 0.45).map((p) => [p[0] + 0.6, p[1] - 1.4] as P), 0.4);
  });
  return (
    b.map((d, k) => (d ? `<path d="${d}" fill="${pal[k]}"/>` : '')).join('') +
    `<path d="${hi}" fill="#F7E7BC" fill-opacity="0.08"/>`
  );
}

function neckSkin(): string {
  const r = rng(303);
  const pal = ['#8C6A34', '#A07A3E', '#6E5228'];
  const b = pal.map(() => '');
  const pts: P[] = [];
  let tries = 0;
  while (pts.length < 170 && tries < 4000) {
    tries++;
    const x = 420 + r() * 104;
    const y = 194 + r() * 82;
    if (pts.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 < 30)) continue;
    pts.push([x, y]);
  }
  for (const [x, y] of pts) {
    const s = Math.max(0, 2.1 + r() * 1.3 - Math.max(0, (y - 236) / 30) * 1.4);
    if (s < 1) continue;
    const poly: P[] = [];
    const rot = r();
    for (let a = 0; a < 6; a++) {
      const ang = ((a + rot) / 6) * Math.PI * 2;
      poly.push([x + Math.cos(ang) * s, y + Math.sin(ang) * s * 0.85]);
    }
    b[Math.floor(r() * 3)] += softPoly(poly, 0.3);
  }
  return b.map((d, k) => (d ? `<path d="${d}" fill="${pal[k]}" fill-opacity="0.34"/>` : '')).join('');
}

const theEye = eye(u, 'eye', {
  cx: EYE.cx,
  cy: EYE.cy,
  r: EYE.r,
  iris: ['#7a5a2a', '#1c1208'],
  look: [0.4, 0.1],
});

function head(): string {
  // nếp gấp da cổ (rùa xanh có cổ nhăn sâu)
  const folds =
    'M444 210Q436 236 442 262M466 204Q458 230 464 258M490 200Q482 224 488 248M508 202Q503 220 506 240' +
    'M432 246Q466 250 508 242M440 262Q474 266 512 254';
  // mỏ sừng ngắn, tù: hàm trên và hàm dưới
  // bao sừng hàm trên (phần trước-dưới mõm) & hàm dưới – cắt theo đường bao đầu
  const upperBeak = 'M584 236C592 232 602 227 610 219L620 212L620 246L584 246Z';
  const lowerBeak = 'M609 233C598 236 586 238 574 241L572 258L614 258Z';
  return (
    `<path d="${NECK}" fill="${u.url('neck')}"/>` +
    `<g clip-path="${u.url('neckClip')}">` +
    neckSkin() +
    `<path d="${folds}" fill="none" stroke="#5c4118" stroke-opacity="0.32" stroke-width="1.4" stroke-linecap="round"/>` +
    `<path d="${folds}" fill="none" stroke="#FFF2C8" stroke-opacity="0.16" stroke-width="1" transform="translate(1.5 0.8)"/>` +
    `<path d="${NECK}" fill="${u.url('vol')}"/>` +
    // da gáy sẫm hơn (đổ bóng ngược)
    `<path d="M424 214C458 204 490 198 515 197L518 214C490 214 458 220 424 230Z" fill="#5a4626" opacity="0.4" filter="${u.url('sblur')}"/>` +
    // bóng mép mai đổ lên gốc cổ
    `<ellipse cx="440" cy="236" rx="26" ry="44" fill="#1a1406" opacity="0.45" filter="${u.url('hblur')}"/>` +
    `</g>` +
    `<path d="${NECK}" fill="none" stroke="${INK}" stroke-opacity="0.45" stroke-width="1.3"/>` +
    // đầu: nền vàng nhạt = viền vảy
    `<path d="${HEAD}" fill="${u.url('headBase')}"/>` +
    `<g clip-path="${u.url('headClip')}">` +
    headScales() +
    `<path d="${lowerBeak}" fill="${u.url('beak')}" opacity="0.9"/>` +
    `<path d="${upperBeak}" fill="${u.url('beak')}"/>` +
    `<path d="M585 236C593 232 602 227 610 219" fill="none" stroke="#6a5226" stroke-opacity="0.55" stroke-width="0.9"/>` +
    `<path d="${HEAD}" fill="${u.url('vol')}"/>` +
    `<ellipse cx="560" cy="188" rx="30" ry="6" fill="#FFF6D6" opacity="0.25" filter="${u.url('sblur')}"/>` +
    `</g>` +
    // răng cưa mảnh mép hàm dưới (rùa xanh ăn cỏ biển)
    `<path d="M604 235L601 238M598 236L595 239M592 237L589 240M586 238L583 241" stroke="#5a4320" stroke-width="0.8" stroke-opacity="0.55"/>` +
    // miệng ngắn, hơi trễ
    `<path d="M609 233C598 236 584 238 572 241C566 242 561 241 557 238" fill="none" stroke="${INK}" stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round"/>` +
    // lỗ mũi
    `<ellipse cx="604" cy="206" rx="1.8" ry="1.2" fill="${INK}" transform="rotate(40 604 206)"/>` +
    // mắt + mí
    `<ellipse cx="${EYE.cx}" cy="${EYE.cy}" rx="${EYE.r + 3.2}" ry="${EYE.r + 2.6}" fill="#2a1c0c"/>` +
    theEye.svg +
    `<path d="M${EYE.cx - EYE.r - 2.5} ${EYE.cy - 0.5}Q${EYE.cx - 1} ${EYE.cy - EYE.r - 6.5} ${EYE.cx + EYE.r + 2.5} ${EYE.cy - 1.5}Q${EYE.cx} ${EYE.cy - EYE.r + 1.2} ${EYE.cx - EYE.r - 2.5} ${EYE.cy - 0.5}Z" fill="#6b4a22"/>` +
    `<path d="M${EYE.cx - EYE.r - 2} ${EYE.cy - 1.5}Q${EYE.cx - 1} ${EYE.cy - EYE.r - 6} ${EYE.cx + EYE.r + 2} ${EYE.cy - 2.5}" fill="none" stroke="${BORDER}" stroke-opacity="0.75" stroke-width="1.1"/>` +
    `<path d="M${EYE.cx - EYE.r - 1} ${EYE.cy + 3}Q${EYE.cx} ${EYE.cy + EYE.r + 4.5} ${EYE.cx + EYE.r + 1} ${EYE.cy + 2.5}" fill="none" stroke="#D9BE78" stroke-width="1.4" stroke-opacity="0.85"/>` +
    // viền & rim light
    `<path d="${HEAD}" fill="none" stroke="${INK}" stroke-opacity="0.55" stroke-width="1.4"/>` +
    `<path d="${HEAD_TOP}" fill="none" stroke="${u.url('rimH')}" stroke-width="2.2" stroke-linecap="round"/>` +
    `<path d="M426 212C452 205 478 200 506 198" fill="none" stroke="#FFF2CC" stroke-opacity="0.45" stroke-width="2" stroke-linecap="round"/>`
  );
}

// =====================================================================
// THÂN (yếm, da, mai)
// =====================================================================
const SIL = silhouette();
const SHOULDER = smoothPath(
  [
    [396, 258],
    [428, 250],
    [456, 258],
    [462, 276],
    [442, 290],
    [410, 290],
    [392, 278],
  ],
  true,
);
const REAR_SKIN = smoothPath(
  [
    [114, 244],
    [144, 254],
    [166, 264],
    [158, 278],
    [132, 278],
    [114, 262],
  ],
  true,
);
const TAIL = 'M114 240C106 243 99 247 94 252C102 254 111 252 120 249Z';

/** yếm vàng kem lộ dưới mép mai phía gần */
function plastron(): { d: string; seams: string } {
  const top: P[] = [];
  const bot: P[] = [];
  const b0 = 34;
  const b1 = 150;
  for (let b = b0; b <= b1; b += 2) {
    const [s, q] = ell(b, edgeR(b));
    const p = proj(s, q);
    const k = Math.sin(((b - b0) / (b1 - b0)) * Math.PI);
    top.push([p[0], p[1] - 8]);
    bot.push([p[0] + 2, p[1] + 2 + 9 * Math.pow(k, 0.7)]);
  }
  const d = smoothPath([...top, ...bot.reverse()], true, 0.4);
  let seams = '';
  for (const b of [56, 78, 100, 122]) {
    const [s, q] = ell(b, edgeR(b));
    const p = proj(s, q);
    const k = Math.sin(((b - b0) / (b1 - b0)) * Math.PI);
    seams += `M${f(p[0])} ${f(p[1])}L${f(p[0] + 3)} ${f(p[1] + 2 + 9 * Math.pow(k, 0.7))}`;
  }
  return { d, seams };
}

function bodySvg(): string {
  const skinScales = (seed: number, x0: number, y0: number, w: number, h: number) => {
    const r = rng(seed);
    let d = '';
    for (let i = 0; i < 46; i++) {
      const x = x0 + r() * w;
      const y = y0 + r() * h;
      const s = 1.5 + r() * 2.2;
      d += `M${f(x - s)} ${f(y)}Q${f(x)} ${f(y - s)} ${f(x + s)} ${f(y)}Q${f(x)} ${f(y + s * 0.9)} ${f(x - s)} ${f(y)}Z`;
    }
    return `<path d="${d}" fill="#7d5e2c" fill-opacity="0.45"/>`;
  };
  const C = carapace();
  const PL = plastron();
  const rp: P[] = [];
  for (let t = -0.5; t <= 0.6; t += 0.04) rp.push(projC(t, -0.12));
  const ridge = pathOf(rp, false);
  const rp2: P[] = [];
  for (let t = 0.05; t <= 0.5; t += 0.03) rp2.push(projC(t, 0.08));
  const ridge2 = pathOf(rp2, false);
  return (
    // đuôi + da hông
    `<path d="${TAIL}" fill="${u.url('skin')}" stroke="${INK}" stroke-opacity="0.45" stroke-width="1"/>` +
    `<path d="${REAR_SKIN}" fill="${u.url('skin')}"/>` +
    `<g clip-path="${u.url('rearClip')}">${skinScales(5, 104, 238, 72, 48)}</g>` +
    `<path d="${REAR_SKIN}" fill="none" stroke="${INK}" stroke-opacity="0.4" stroke-width="1"/>` +
    // da vai
    `<path d="${SHOULDER}" fill="${u.url('skin')}"/>` +
    `<g clip-path="${u.url('shClip')}">${skinScales(9, 386, 246, 80, 48)}</g>` +
    `<path d="${SHOULDER}" fill="none" stroke="${INK}" stroke-opacity="0.4" stroke-width="1"/>` +
    // yếm
    `<path d="${PL.d}" fill="${u.url('plastron')}" stroke="${INK}" stroke-opacity="0.5" stroke-width="1.1"/>` +
    `<path d="${PL.seams}" fill="none" stroke="#9c8448" stroke-opacity="0.55" stroke-width="1"/>` +
    // mép mai mỏng (mặt dưới tấm viền)
    `<path d="${SIL.full}" transform="translate(0 3.2)" fill="#3a3418" stroke="${INK}" stroke-width="1" stroke-opacity="0.6"/>` +
    // mai
    `<g clip-path="${u.url('shell')}">` +
    `<g filter="${u.url('tex')}">` +
    `<path d="${SIL.full}" fill="#4a4424"/>` +
    C.fills +
    C.rays +
    C.streaks +
    C.light +
    `</g>` +
    // đường nối tấm KỀ nhau: viền tối mảnh + lõi kem sáng (không bóng đổ)
    `<path d="${C.seams}" fill="none" stroke="#14120a" stroke-opacity="0.4" stroke-width="2.1" stroke-linejoin="round"/>` +
    `<path d="${C.seams}" fill="none" stroke="${SEAM}" stroke-opacity="0.7" stroke-width="1.05" stroke-linejoin="round"/>` +
    // khối vòm + bóng ướt
    `<path d="${SIL.full}" fill="${u.url('dome')}"/>` +
    `<path d="${ridge}" fill="none" stroke="#FFF8E0" stroke-opacity="0.2" stroke-width="9" stroke-linecap="round" filter="${u.url('hblur')}"/>` +
    `<path d="${ridge2}" fill="none" stroke="#FFFFFF" stroke-opacity="0.32" stroke-width="2.2" stroke-linecap="round" filter="${u.url('sblur')}"/>` +
    `</g>` +
    `<path d="${SIL.full}" fill="none" stroke="${INK}" stroke-opacity="0.75" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="${SIL.top}" fill="none" stroke="${u.url('rim')}" stroke-width="2.4" stroke-linecap="round"/>`
  );
}

// =====================================================================
// CHÂN CHÈO – thông số
// =====================================================================
const FRONT_NEAR: FlipOpts = { name: 'fn', pivot: [440, 270], ang: 154, L: 226, wl: 30, wt: 26, curve: 0.12, root: 0.08, lead: 1, seed: 41, claw: 0.32 };
const FRONT_FAR: FlipOpts = { name: 'ff', pivot: [426, 210], ang: 206, L: 196, wl: 25, wt: 22, curve: 0.11, root: 0.06, lead: -1, seed: 67, far: true };
const HIND_NEAR: FlipOpts = { name: 'hn', pivot: [150, 262], ang: 166, L: 80, wl: 22, wt: 26, curve: 0.06, root: 0.12, lead: -1, seed: 83, hind: true };
const HIND_FAR: FlipOpts = { name: 'hf', pivot: [156, 238], ang: 196, L: 68, wl: 18, wt: 20, curve: 0.06, root: 0.1, lead: -1, seed: 97, far: true, hind: true };
const FN = flipper(FRONT_NEAR);
const FF = flipper(FRONT_FAR);
const HN = flipper(HIND_NEAR);
const HF = flipper(HIND_FAR);

// =====================================================================
// DEFS
// =====================================================================
const scuteGrad = (name: string, c0: string, c1: string, c2: string) =>
  radial(
    u(name),
    [
      [0, c0],
      [0.55, c1],
      [1, c2],
    ],
    { cx: 0.42, cy: 0.42, r: 0.78 },
  );

const defs = joinDefs(
  theEye,
  scuteGrad('g0', '#84703C', '#524427', '#262011'),
  scuteGrad('g1', '#766636', '#4A4024', '#221D0F'),
  scuteGrad('g2', '#8E743A', '#5C4C29', '#302613'),
  scuteGrad('g3', '#726A35', '#464426', '#222111'),
  scuteGrad('m0', '#8A7642', '#5A4D2C', '#382F17'),
  scuteGrad('m1', '#7C6E3C', '#4F4828', '#2F2915'),
  linear(u('dome'), [
    [0, '#FFF6D8', 0.2],
    [0.3, '#FFF6D8', 0.0],
    [0.62, '#0c0b02', 0.0],
    [1, '#0c0b02', 0.4],
  ]),
  rimGradient(u('rim'), '#FFF6DA', 0.85),
  rimGradient(u('rimH'), '#FFF6DA', 0.75),
  linear(u('flipNet'), [
    [0, '#EADBB0'],
    [1, '#C8B07A'],
  ]),
  radial(
    u('flipVol'),
    [
      [0, '#FFF4DA', 0.22],
      [0.5, '#FFF4DA', 0],
      [0.85, '#0d0604', 0],
      [1, '#0d0604', 0.35],
    ],
    { cx: 0.6, cy: 0.35, r: 0.8 },
  ),
  linear(u('claw'), [
    [0, '#E6D3A0'],
    [1, '#9C8150'],
  ]),
  linear(u('skin'), [
    [0, '#7E6438'],
    [1, '#CDB27A'],
  ]),
  linear(u('neck'), [
    [0, '#6E5730'],
    [0.3, '#A88A52'],
    [0.6, '#D4BA7C'],
    [1, '#EBDAA2'],
  ]),
  linear(u('headBase'), [
    [0, '#E6CC82'],
    [1, '#F2E3B0'],
  ]),
  linear(u('plastron'), [
    [0, '#9C8248'],
    [0.45, '#D2BC80'],
    [1, '#E8D8A4'],
  ]),
  linear(
    u('beak'),
    [
      [0, '#E2CE96'],
      [0.6, '#B89C5E'],
      [1, '#5E4622'],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 1 },
  ),
  volumeShade(u('vol'), '#FFF6DC', '#140c02'),
  blurFilter(u('sblur'), 1.6),
  blurFilter(u('hblur'), 5),
  blurFilter(u('rblur'), 0.9),
  organicTexture(u('tex'), { freq: 0.09, octaves: 3, strength: 0.16, seed: 21 }),
  `<clipPath id="${u('shell')}"><path d="${SIL.full}"/></clipPath>`,
  `<clipPath id="${u('headClip')}"><path d="${HEAD}"/></clipPath>`,
  `<clipPath id="${u('neckClip')}"><path d="${NECK}"/></clipPath>`,
  `<clipPath id="${u('shClip')}"><path d="${SHOULDER}"/></clipPath>`,
  `<clipPath id="${u('rearClip')}"><path d="${REAR_SKIN}"/></clipPath>`,
  FN.clip,
  FF.clip,
  HN.clip,
  HF.clip,
);

// =====================================================================
// LỚP – vẽ ở toạ độ gốc rồi dời cả khối vào khung (viewBox gọn, ít khoảng trống)
// =====================================================================
const DX = -49;
const DY = -81;
const T = (svg: string) => `<g transform="translate(${DX} ${DY})">${svg}</g>`;
const at = (p: P): P => [p[0] + DX, p[1] + DY];

const art: CreatureArt = {
  id: ID,
  viewBox: [590, 330],
  lengthUnits: 530,
  spineY: 226 + DY,
  animation: 'turtle',
  cycleHz: 0.4,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'flipperFrontFar',
      role: 'flipper',
      bend: false,
      z: 'back',
      pivot: at(FRONT_FAR.pivot),
      anim: { type: 'rotate', amp: 0.42, phase: 0.3 },
      svg: T(FF.svg),
    },
    {
      name: 'flipperHindFar',
      role: 'flipper',
      bend: false,
      z: 'back',
      pivot: at(HIND_FAR.pivot),
      anim: { type: 'rotate', amp: 0.2, phase: Math.PI / 2 + 0.4 },
      svg: T(HF.svg),
    },
    {
      name: 'flipperHindNear',
      role: 'flipper',
      bend: false,
      z: 'back',
      pivot: at(HIND_NEAR.pivot),
      anim: { type: 'rotate', amp: 0.22, phase: Math.PI / 2 },
      svg: T(HN.svg),
    },
    {
      name: 'head',
      role: 'detail',
      bend: false,
      z: 'back',
      pivot: at([440, 238]),
      anim: { type: 'rotate', amp: 0.025, phase: 1.1 },
      svg: T(head()),
    },
    { name: 'body', role: 'body', svg: T(bodySvg()) },
    {
      name: 'flipperFrontNear',
      role: 'flipper',
      bend: false,
      z: 'front',
      pivot: at(FRONT_NEAR.pivot),
      anim: { type: 'rotate', amp: 0.46 },
      svg: T(FN.svg),
    },
  ],
};

export default art;
