/**
 * Sao biển gối – Protoreaster nodosus (chocolate chip / horned sea star)
 * Đặc điểm nhận dạng: 5 cánh ngắn, dày, gốc rất rộng, mút tù sẫm đen; đĩa giữa phồng như cái gối;
 * hàng "sừng" hình nón đen bóng dọc sống mỗi cánh + vòng sừng lớn quanh đĩa; nền đỏ cam với lưới gân
 * sáng mảnh giữa các tấm xương; da sần.
 * Biến thể màu: đỏ cam (tiêu biểu ở Phú Quốc, tương phản mạnh với cát/cỏ biển, nhận ra ngay khi thu nhỏ).
 *
 * Hình học: trường khoảng cách (SDF) trên mặt đáy – đĩa ∪ 5 "viên nang thuôn" (cánh) hợp mềm (smooth-min)
 * → đường viền, các đường đồng mức độ sâu (đổ bóng khối), trường chiều cao (vòm gối) để đặt sừng/lưới lên mặt cong.
 * Phép chiếu xiên nhẹ (gần như nhìn thẳng từ trên xuống): mặt đáy (X, Z) + chiều cao H → toạ độ viewBox.
 */
import type { CreatureArt } from '../contract';
import { makeIds, linear, radial, joinDefs, rng, smoothPath, mix, blurFilter, organicTexture, dotPattern } from '../style-bible';

const u = makeIds('sao_bien_goi');

// ---------- Bảng màu (biến thể đỏ cam) ----------
const DEEP = '#761A0A';
const DARK = '#AE2E14';
const MAIN = '#D9441E';
const MID = '#E85A28';
const LIGHT = '#F2753E';
const HI = '#FF9E68';
const MARGIN = '#F6B896'; // tấm viền mép cánh nhạt hồng kem
const NET = '#FFDDBF'; // lưới gân sáng
const OUT = '#5E1A0B';
const TIP = '#1E120E';
const CONE_HI = '#7A5E52';
const CONE_LIT = '#45312A';
const CONE_MID = '#211512';
const CONE_CORE = '#0C0706';

// ---------- Phép chiếu ----------
const CX = 262;
const CY = 238;
const K = 0.9; // nén trục sâu (Z)
const KH = 0.42; // nén chiều cao (H)
type V3 = [number, number, number];
const P = (x: number, z: number, h: number): [number, number] => [CX + x, CY + z * K - h * KH];
const f = (n: number) => n.toFixed(1);

// ---------- Hình dạng (SDF trên mặt đáy) ----------
interface Arm {
  th: number;
  L: number;
  r1: number;
  r2: number;
  curv: number;
}
const DEG = Math.PI / 180;
const ARMS: Arm[] = [
  { th: -90 * DEG, L: 192, r1: 57, r2: 20, curv: 0 },
  { th: -16 * DEG, L: 186, r1: 58, r2: 19.5, curv: 0.0006 },
  { th: 52 * DEG, L: 196, r1: 56, r2: 20.5, curv: -0.001 },
  { th: 128 * DEG, L: 184, r1: 58, r2: 19.5, curv: 0.0013 },
  { th: 197 * DEG, L: 190, r1: 57, r2: 20, curv: -0.0005 },
];
const R_DISC = 52;
const K_SMOOTH = 26;

function sdCapsule(px: number, py: number, r1: number, r2: number, h: number): number {
  px = Math.abs(px);
  const b = (r1 - r2) / h;
  const a = Math.sqrt(Math.max(0, 1 - b * b));
  const k = -b * px + a * py;
  if (k < 0) return Math.hypot(px, py) - r1;
  if (k > a * h) return Math.hypot(px, py - h) - r2;
  return a * px + b * py - r1;
}
function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
/** toạ độ cục bộ theo cánh: s dọc trục (đã tính độ cong), d ngang trục */
function armLocal(a: Arm, x: number, z: number): [number, number] {
  const ux = Math.cos(a.th);
  const uz = Math.sin(a.th);
  const s = x * ux + z * uz;
  const d = -x * uz + z * ux;
  return [s, d - a.curv * s * Math.max(0, s)];
}
/** điểm trên mặt đáy theo toạ độ cánh */
function armPoint(a: Arm, s: number, d: number): [number, number] {
  const ux = Math.cos(a.th);
  const uz = Math.sin(a.th);
  const dd = d + a.curv * s * s;
  return [ux * s - uz * dd, uz * s + ux * dd];
}
const armRadius = (a: Arm, s: number) => a.r1 + (a.r2 - a.r1) * Math.max(0, Math.min(1, s / a.L));

function sdf(x: number, z: number): number {
  let v = Math.hypot(x, z) - R_DISC;
  for (const a of ARMS) {
    const [s, d] = armLocal(a, x, z);
    v = smin(v, sdCapsule(d, s, a.r1, a.r2, a.L), K_SMOOTH);
  }
  return v;
}

// ---------- Trường chiều cao (vòm gối) ----------
const E = 7; // độ cao mép
const HA = 17; // độ phồng thiết diện cánh
const HD = 20; // vòm đĩa
function height(x: number, z: number): number {
  const depth = Math.max(0, -sdf(x, z));
  const prof = 1 - Math.pow(Math.max(0, 1 - depth / 30), 2);
  const r = Math.hypot(x, z);
  const dome = Math.pow(Math.max(0, 1 - (r / 108) ** 2), 1.4);
  return E + HA * prof + HD * dome;
}
function normalAt(x: number, z: number): V3 {
  const e = 1.5;
  const hx = (height(x + e, z) - height(x - e, z)) / (2 * e);
  const hz = (height(x, z + e) - height(x, z - e)) / (2 * e);
  const l = Math.hypot(hx, hz, 1);
  return [-hx / l, -hz / l, 1 / l];
}

// ---------- Đường đồng mức (dò theo tia từ tâm – hình sao "star-shaped") ----------
const NPHI = 540;
function levelPts(level: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < NPHI; i++) {
    const phi = (i / NPHI) * Math.PI * 2;
    const c = Math.cos(phi);
    const s = Math.sin(phi);
    let r0 = 0;
    let r1 = 0;
    let found = false;
    for (let r = 2; r < 280; r += 2) {
      if (sdf(c * r, s * r) >= level) {
        r0 = r - 2;
        r1 = r;
        found = true;
        break;
      }
    }
    if (!found) continue;
    for (let k = 0; k < 14; k++) {
      const m = (r0 + r1) / 2;
      if (sdf(c * m, s * m) >= level) r1 = m;
      else r0 = m;
    }
    out.push([c * r1, s * r1]);
  }
  return out;
}
const proj = (pts: [number, number][], h?: number) =>
  pts.map(([x, z]) => P(x, z, h ?? height(x, z)));
/** smoothPath cho đường đồng mức đã chiếu (lấy thưa 1/2 điểm để path gọn) */
const contourD = (pts: [number, number][]) => smoothPath(pts.filter((_, i) => i % 2 === 0), true, 0.5);

const outlineGround = levelPts(0);
const TOP = contourD(proj(outlineGround, E));
const FOOT = contourD(proj(levelPts(1.5), 0));
const C = (d: number, dx = 0, dy = 0) =>
  contourD(proj(levelPts(-d)).map(([x, y]) => [x + dx, y + dy] as [number, number]));

// rim light: các đoạn viền có pháp tuyến hướng lên (hứng nắng)
const RIM_D = (() => {
  const pts = proj(outlineGround, E);
  const n = pts.length;
  let d = '';
  let run: [number, number][] = [];
  const flush = () => {
    if (run.length > 4) d += smoothPath(run.filter((_, i) => i % 2 === 0 || i === run.length - 1), false);
    run = [];
  };
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 2 + n) % n];
    const b = pts[(i + 2) % n];
    // hướng tiếp tuyến (đi ngược chiều kim đồng hồ trên màn hình vì Z hướng xuống) → pháp tuyến ngoài
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    const ny = -tx / l; // pháp tuyến ngoài (x: ty/l)
    if (ny < -0.3) run.push(pts[i]);
    else flush();
  }
  flush();
  return d;
})();

// ---------- Lưới gân sáng giữa các tấm xương ----------
const hash = (x: number, z: number) => {
  const s = Math.sin(Math.round(x * 10) * 12.9898 + Math.round(z * 10) * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const NETWORK = (() => {
  const S = 12;
  const R = S / Math.sqrt(3);
  const rows = Math.ceil(520 / (S * 0.866));
  let net = '';
  let pores = '';
  let plates = '';
  const jit = (x: number, z: number): [number, number] => [
    x + (hash(x, z) - 0.5) * S * 0.45,
    z + (hash(z + 3.1, x - 7.7) - 0.5) * S * 0.45,
  ];
  for (let j = 0; j <= rows; j++) {
    const z = -260 + j * S * 0.866;
    for (let i = 0; i <= Math.ceil(520 / S); i++) {
      const x = -260 + i * S + (j % 2 ? S / 2 : 0);
      if (sdf(x, z) > -3) continue;
      const vs: [number, number][] = [];
      for (let k = 0; k < 6; k++) {
        const a = (30 + 60 * k) * DEG;
        const vx = Math.round((x + Math.cos(a) * R) * 100) / 100;
        const vz = Math.round((z + Math.sin(a) * R) * 100) / 100;
        vs.push(jit(vx, vz));
      }
      const sp = vs.map(([vx, vz]) => P(vx, vz, height(vx, vz)));
      net += `M${sp.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`;
      // tấm xương: khối bo tròn hơi sáng ở nửa trên (hứng nắng)
      const c = P(x, z, height(x, z));
      const inner = sp.map(([px, py]) => [c[0] + (px - c[0]) * 0.62, c[1] + (py - c[1]) * 0.62 - 0.6] as [number, number]);
      plates += smoothPath(inner, true, 0.9);
      const p0 = sp[0];
      pores += `M${f(p0[0])} ${f(p0[1])}m-0.9 0a0.9 0.9 0 1 0 1.8 0a0.9 0.9 0 1 0 -1.8 0`;
    }
  }
  return { net, pores, plates };
})();

// ---------- Tấm viền mép (hàng tấm lớn dọc mép cánh) ----------
const MARGINALS = (() => {
  const pts = levelPts(-4.5);
  let d = '';
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, z0] = pts[i - 1];
    const [x1, z1] = pts[i];
    acc += Math.hypot(x1 - x0, z1 - z0);
    if (acc < 10.5) continue;
    acc = 0;
    const [sx, sy] = P(x1, z1, height(x1, z1));
    const tx = x1 - x0;
    const tz = (z1 - z0) * K;
    const ang = (Math.atan2(tz, tx) * 180) / Math.PI;
    d += `<ellipse cx="${f(sx)}" cy="${f(sy)}" rx="5" ry="3.4" transform="rotate(${ang.toFixed(1)} ${f(sx)} ${f(sy)})"/>`;
  }
  return d;
})();

// ---------- Sừng (núm nón đen bóng) ----------
interface Cone {
  x: number;
  z: number;
  rb: number;
  hc: number;
}
const CONES: Cone[] = [];
{
  const r = rng(5151);
  // vòng 5 sừng lớn quanh tâm (giữa các cánh)
  for (let i = 0; i < 5; i++) {
    const a0 = ARMS[i].th;
    const a1 = ARMS[(i + 1) % 5].th + (i === 4 ? Math.PI * 2 : 0);
    const a = (a0 + a1) / 2 + (r() - 0.5) * 0.12;
    const rr = 29 + r() * 4;
    const rb = 9.4 + r() * 1.0;
    CONES.push({ x: Math.cos(a) * rr, z: Math.sin(a) * rr, rb, hc: rb * (1.7 + r() * 0.2) });
  }
  for (const a of ARMS) {
    // hàng dọc sống cánh – nhỏ dần ra mút
    const ss = [60, 87, 112, 135, 156, 175];
    ss.forEach((s0, k) => {
      const s = s0 * (a.L / 190) + (r() - 0.5) * 4;
      const t = k / (ss.length - 1);
      const [x, z] = armPoint(a, s, (r() - 0.5) * 3);
      const rb = 9.6 - t * 4.4 + (r() - 0.5) * 0.8;
      CONES.push({ x, z, rb, hc: rb * (1.65 - t * 0.2) });
    });
    // cặp sừng nhỏ hai bên gốc cánh (không đều, như ngoài tự nhiên)
    for (const side of [1, -1]) {
      for (const [s, frac, rb0] of [
        [72, 0.56, 6.6],
        [101, 0.5, 5.2],
      ] as const) {
        if (r() < 0.28) continue;
        const ss = s + (r() - 0.5) * 6;
        const [x, z] = armPoint(a, ss, side * armRadius(a, ss) * (frac + (r() - 0.5) * 0.08));
        const rb = rb0 + (r() - 0.5) * 0.8;
        CONES.push({ x, z, rb, hc: rb * 1.45 });
      }
    }
  }
}

function coneSvg(c: Cone): { halo: string; body: string } {
  const h0 = height(c.x, c.z) - 0.5;
  const n = normalAt(c.x, c.z);
  // sừng nghiêng theo pháp tuyến mặt (độ nghiêng phóng đại nhẹ cho rõ khối)
  // đỉnh sừng: chiều cao chiếu mạnh hơn thân (KH_C) để thấy rõ dáng nón khi nhìn gần thẳng từ trên
  const KH_C = 0.95;
  const ax = c.x + n[0] * c.hc * 1.5;
  const az = c.z + n[1] * c.hc * 1.5;
  const B = P(c.x, c.z, h0);
  const A: [number, number] = [CX + ax, CY + az * K - h0 * KH - c.hc * KH_C];
  const rx = c.rb;
  const ry = c.rb * K;
  const nx = (A[0] - B[0]) / rx;
  const ny = (A[1] - B[1]) / ry;
  const D = Math.hypot(nx, ny);
  let body: string;
  let specD: string;
  if (D < 1.08) {
    // nhìn gần thẳng đỉnh → vòm tròn
    body = `M${f(B[0] - rx)} ${f(B[1])}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`;
    specD = `M${f(B[0] - rx * 0.45)} ${f(B[1] - ry * 0.2)}Q${f(B[0] - rx * 0.4)} ${f(B[1] - ry * 0.6)} ${f(B[0])} ${f(B[1] - ry * 0.65)}`;
  } else {
    const al = Math.atan2(ny, nx);
    const be = Math.acos(Math.min(1, 1 / D));
    const t0 = al + be;
    const t1 = al + Math.PI * 2 - be;
    const ep = (t: number): [number, number] => [B[0] + rx * Math.cos(t), B[1] + ry * Math.sin(t)];
    const T1 = ep(t0);
    const T2 = ep(t1);
    const arc: string[] = [];
    const M = 12;
    for (let k = 1; k <= M; k++) {
      const p = ep(t0 + ((t1 - t0) * k) / M);
      arc.push(`${f(p[0])} ${f(p[1])}`);
    }
    const q = 0.2;
    const A1: [number, number] = [A[0] + (T1[0] - A[0]) * q, A[1] + (T1[1] - A[1]) * q];
    const A2: [number, number] = [A[0] + (T2[0] - A[0]) * q, A[1] + (T2[1] - A[1]) * q];
    body = `M${f(T1[0])} ${f(T1[1])}L${arc.join('L')}L${f(A2[0])} ${f(A2[1])}Q${f(A[0])} ${f(A[1])} ${f(A1[0])} ${f(A1[1])}Z`;
    // vệt phản chiếu dọc sườn hứng sáng (trên-trái)
    const lit = ep(Math.PI * 1.22);
    const s0: [number, number] = [A[0] + (lit[0] - A[0]) * 0.22, A[1] + (lit[1] - A[1]) * 0.22];
    const s1: [number, number] = [A[0] + (lit[0] - A[0]) * 0.7 + rx * 0.12, A[1] + (lit[1] - A[1]) * 0.7];
    specD = `M${f(s0[0])} ${f(s0[1])}L${f(s1[0])} ${f(s1[1])}`;
  }
  const halo =
    `<ellipse cx="${f(B[0])}" cy="${f(B[1])}" rx="${f(rx * 2.1)}" ry="${f(ry * 2.1)}" fill="${u.url('halo')}"/>` +
    `<ellipse cx="${f(B[0] + rx * 0.4)}" cy="${f(B[1] + ry * 0.45)}" rx="${f(rx * 1.15)}" ry="${f(ry * 1.0)}" fill="#2A0C05" fill-opacity="0.38"/>`;
  const sw = Math.max(0.8, rx * 0.2);
  const bodySvg =
    `<path d="${body}" fill="${u.url('cone')}" stroke="${CONE_CORE}" stroke-width="0.6" stroke-opacity="0.7" stroke-linejoin="round"/>` +
    `<path d="${body}" fill="${u.url('coneRim')}"/>` +
    `<path d="${specD}" fill="none" stroke="#FFF1E2" stroke-opacity="0.5" stroke-width="${f(sw)}" stroke-linecap="round"/>` +
    `<circle cx="${f(A[0] - rx * 0.06)}" cy="${f(A[1] + ry * 0.3)}" r="${f(Math.max(0.5, rx * 0.09))}" fill="#FFFFFF" fill-opacity="0.5"/>`;
  return { halo, body: bodySvg };
}

const coneSorted = [...CONES].sort((a, b) => P(a.x, a.z, 0)[1] - P(b.x, b.z, 0)[1]);
const coneParts = coneSorted.map(coneSvg);
const CONE_HALOS = coneParts.map((c) => c.halo).join('');
const CONE_BODIES = coneParts.map((c) => c.body).join('');

// ---------- Mút cánh sẫm đen ----------
const TIP_DEFS: string[] = [];
const TIPS = ARMS.map((a, i) => {
  const [x, z] = armPoint(a, a.L + 3, 0);
  const [sx, sy] = P(x, z, height(x, z));
  TIP_DEFS.push(
    radial(
      u(`tip${i}`),
      [
        [0, TIP, 0.97],
        [0.36, '#2B1610', 0.9],
        [0.62, DEEP, 0.45],
        [1, DEEP, 0],
      ],
      { user: true, cx: +f(sx), cy: +f(sy), r: 44 },
    ),
  );
  return `<circle cx="${f(sx)}" cy="${f(sy)}" r="44" fill="${u.url(`tip${i}`)}"/>`;
}).join('');

// ---------- Tấm sàng (madreporite) ----------
const MADRE = (() => {
  const a = (ARMS[0].th + ARMS[4].th - Math.PI * 2) / 2 + Math.PI * 2;
  const [x, z] = [Math.cos(a) * 15, Math.sin(a) * 15];
  const [sx, sy] = P(x, z, height(x, z));
  let lines = '';
  for (let k = -2; k <= 2; k++) lines += `M${f(sx - 3.4)} ${f(sy + k * 1.2)}Q${f(sx)} ${f(sy + k * 1.2 - 0.9)} ${f(sx + 3.4)} ${f(sy + k * 1.2)}`;
  return (
    `<ellipse cx="${f(sx)}" cy="${f(sy)}" rx="5" ry="4.2" fill="#F7CFAE" stroke="${OUT}" stroke-opacity="0.45" stroke-width="0.6"/>` +
    `<path d="${lines}" fill="none" stroke="#B5694A" stroke-opacity="0.6" stroke-width="0.45"/>`
  );
})();
const [ax0, ay0] = P(0, 0, height(0, 0));
const ANUS = `<circle cx="${f(ax0 + 1.5)}" cy="${f(ay0 + 1)}" r="1.5" fill="${DEEP}" fill-opacity="0.8"/>`;

// ---------- Ghép toàn bộ thân ----------
const CONTENT =
  // thành bên (phần sườn chạm cát)
  `<path d="${FOOT}" fill="${mix(DEEP, '#3A1208', 0.35)}" stroke="${OUT}" stroke-width="1.2" stroke-opacity="0.5"/>` +
  `<g clip-path="${u.url('clipTop')}">` +
  `<g filter="${u.url('tex')}">` +
  `<g filter="${u.url('soft')}">` +
  `<path d="${TOP}" fill="${DARK}"/>` +
  `<path d="${C(3)}" fill="${MAIN}"/>` +
  `<path d="${C(9)}" fill="${MID}"/>` +
  `<path d="${C(17)}" fill="${mix(MID, LIGHT, 0.6)}"/>` +
  `<path d="${C(28)}" fill="${LIGHT}"/>` +
  `<path d="${C(42, -2, -3)}" fill="${HI}" fill-opacity="0.75"/>` +
  `</g>` +
  // bóng khối theo hướng sáng (trên-trái sáng, dưới-phải tối)
  `<g filter="${u.url('soft2')}">` +
  `<path d="${TOP}" fill="none" stroke="${DEEP}" stroke-opacity="0.5" stroke-width="16" transform="translate(-4 -5)"/>` +
  `<path d="${TOP}" fill="none" stroke="#FFD2B0" stroke-opacity="0.2" stroke-width="10" transform="translate(4 5)"/>` +
  `</g>` +
  `</g>` +
  // tấm viền mép nhạt
  `<g fill="${MARGIN}" fill-opacity="0.24">${MARGINALS}</g>` +
  // tấm xương sần + lưới gân sáng + lỗ da
  `<path d="${NETWORK.plates}" fill="#FFE6D0" fill-opacity="0.07"/>` +
  `<path d="${TOP}" fill="${u.url('gran')}"/>` +
  `<path d="${NETWORK.net}" fill="none" stroke="${NET}" stroke-opacity="0.27" stroke-width="1" stroke-linejoin="round"/>` +
  `<path d="${NETWORK.pores}" fill="${DEEP}" fill-opacity="0.35"/>` +
  // quầng sẫm quanh chân sừng
  CONE_HALOS +
  // mút cánh sẫm
  TIPS +
  `</g>` +
  // viền & rim light
  `<path d="${TOP}" fill="none" stroke="${OUT}" stroke-width="1.4" stroke-opacity="0.55" stroke-linejoin="round"/>` +
  `<path d="${RIM_D}" fill="none" stroke="#FFE9D6" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round"/>` +
  MADRE +
  ANUS +
  CONE_BODIES;

// ---------- Cắt đầu cánh trên (cử động nhẹ, nhấc mút cánh) ----------
const TIP_ARM = ARMS[0];
const seamPt = armPoint(TIP_ARM, 148, 0);
const SEAM_Y = +P(seamPt[0], seamPt[1], height(seamPt[0], seamPt[1]))[1].toFixed(1);
const TIP_X0 = CX - 72;
const TIP_X1 = CX + 72;

// ---------- Nền thẻ: cát + cỏ biển ----------
const VB: [number, number] = [524, 470];
const [scx, scy] = P(0, 14, 0);
function blade(x0: number, y0: number, ang: number, len: number, w: number, bend: number): string {
  const pts: [number, number][] = [];
  const ptsR: [number, number][] = [];
  const N = 10;
  for (let k = 0; k <= N; k++) {
    const t = k / N;
    const a = ang + bend * t;
    const x = x0 + Math.cos(ang) * len * t + Math.cos(a + Math.PI / 2) * bend * len * 0.25 * t * t;
    const y = y0 + Math.sin(ang) * len * t + Math.sin(a + Math.PI / 2) * bend * len * 0.25 * t * t;
    const ww = (w / 2) * (t < 0.85 ? 1 : Math.sqrt(Math.max(0, (1 - t) / 0.15)));
    const nx = Math.cos(a + Math.PI / 2);
    const ny = Math.sin(a + Math.PI / 2);
    pts.push([x + nx * ww, y + ny * ww]);
    ptsR.push([x - nx * ww, y - ny * ww]);
  }
  return smoothPath([...pts, ...ptsR.reverse()], true, 0.5);
}
// cỏ biển (Thalassia/Enhalus) mọc thành cụm từ thân ngầm, lá dải nằm toả trên cát
const BLADES = (() => {
  const r = rng(808);
  const out: string[] = [];
  const clumps: [number, number, number, number][] = [
    // x, y, hướng chính, số lá
    [-14, 486, -0.95, 4],
    [540, 488, -2.2, 4],
    [540, -14, 2.45, 3],
    [-18, 150, -0.15, 3],
  ];
  for (const [bx, by, dir, n] of clumps) {
    for (let k = 0; k < n; k++) {
      const a = dir + (k - (n - 1) / 2) * 0.32 + (r() - 0.5) * 0.15;
      out.push(blade(bx + (r() - 0.5) * 8, by + (r() - 0.5) * 8, a, 150 + r() * 80, 6.5 + r() * 2, (r() - 0.5) * 0.6));
    }
  }
  return out;
})();
const SEABED =
  `<ellipse cx="${f(scx)}" cy="${f(scy)}" rx="262" ry="236" fill="${u.url('sand')}"/>` +
  `<ellipse cx="${f(scx)}" cy="${f(scy)}" rx="262" ry="236" fill="${u.url('grains')}" opacity="0.8"/>` +
  BLADES.map((d, i) => `<path d="${d}" fill="${u.url(i % 2 ? 'grassA' : 'grassB')}" stroke="#2F5A26" stroke-opacity="0.45" stroke-width="0.8"/>`).join('') +
  `<ellipse cx="${f(scx + 6)}" cy="${f(scy + 8)}" rx="222" ry="192" fill="${u.url('shadow')}"/>`;

const defs = joinDefs(
  ...TIP_DEFS,
  `<clipPath id="${u('clipTop')}"><path d="${TOP}"/></clipPath>`,
  `<clipPath id="${u('clipBody')}"><path clip-rule="evenodd" d="M-60 -60H${VB[0] + 60}V${VB[1] + 60}H-60Z M${TIP_X0} -60H${TIP_X1}V${SEAM_Y}H${TIP_X0}Z"/></clipPath>`,
  `<clipPath id="${u('clipTip')}"><path d="M${TIP_X0} -60H${TIP_X1}V${SEAM_Y + 3}H${TIP_X0}Z"/></clipPath>`,
  blurFilter(u('soft'), 4.5),
  blurFilter(u('soft2'), 5),
  organicTexture(u('tex'), { freq: 0.11, octaves: 3, strength: 0.22, seed: 11 }),
  dotPattern(u('gran'), { gap: 4.2, r: 0.75, color: '#FFE2C8', opacity: 0.12 }),
  radial(
    u('cone'),
    [
      [0, CONE_HI],
      [0.22, CONE_LIT],
      [0.58, CONE_MID],
      [1, CONE_CORE],
    ],
    { cx: 0.36, cy: 0.3, r: 0.78 },
  ),
  linear(
    u('coneRim'),
    [
      [0, '#000000', 0],
      [0.7, '#000000', 0],
      [1, '#000000', 0.35],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 1 },
  ),
  radial(u('halo'), [
    [0, '#3A120A', 0.75],
    [0.5, '#6A1F0E', 0.4],
    [1, DEEP, 0],
  ]),
  radial(u('sand'), [
    [0, '#E3D3AE', 0.95],
    [0.7, '#D7C49B', 0.75],
    [1, '#C9B68C', 0],
  ]),
  dotPattern(u('grains'), { gap: 6.5, r: 0.7, color: '#9C8A64', opacity: 0.35 }),
  linear(u('grassA'), [
    [0, '#3E7A33'],
    [1, '#86B55A'],
  ]),
  linear(u('grassB'), [
    [0, '#2F6A30'],
    [1, '#6FA24C'],
  ], { x1: 0, y1: 0, x2: 1, y2: 0 }),
  radial(u('shadow'), [
    [0, '#3A2A12', 0.5],
    [0.6, '#3A2A12', 0.3],
    [1, '#3A2A12', 0],
  ]),
);

const art: CreatureArt = {
  id: 'sao_bien_goi',
  viewBox: VB,
  lengthUnits: 420,
  spineY: CY,
  animation: 'static',
  cycleHz: 0.25,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'seabed',
      role: 'detail',
      cardOnly: true, // nền cát + cỏ biển Phú Quốc chỉ hiện trên thẻ
      bend: false,
      z: 'back',
      pivot: [scx, scy],
      svg: SEABED,
    },
    {
      name: 'body',
      role: 'body',
      svg: `<g clip-path="${u.url('clipBody')}">${CONTENT}</g>`,
    },
    {
      // mút cánh trên nhấc lên rất chậm (sao biển dò đường bằng mắt điểm ở mút cánh)
      name: 'armTipLift',
      role: 'arm',
      bend: false,
      z: 'front',
      pivot: [CX, SEAM_Y],
      anim: { type: 'scaleY', amp: 0.05, speed: 1, phase: 0 },
      svg: `<g clip-path="${u.url('clipTip')}">${CONTENT}</g>`,
    },
  ],
};

export default art;
