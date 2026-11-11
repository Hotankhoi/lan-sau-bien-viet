/**
 * Sam biển – Tachypleus tridentatus (Hiếm, Vịnh Bắc Bộ) – "hóa thạch sống"
 * Góc nhìn 3/4 từ trên: mai được dựng bằng mô hình mặt cong (x dọc thân, z ngang, h cao) rồi chiếu xiên,
 * tô bóng theo pháp tuyến (lưới ô nhỏ làm mờ) để ra khối vồng bóng loáng.
 * Đặc điểm nhận dạng: mai đầu hình móng ngựa có 2 gai má chĩa về sau, 3 gờ dọc (giữa + 2 bên), mắt kép hạt đậu
 * trên gờ bên; mai bụng lục giác có răng cưa + 6 gai vàng rơm cử động mỗi bên, 2 hàng hố bám cơ;
 * 3 mấu quanh gốc đuôi; đuôi kiếm dài thẳng tiết diện tam giác.
 * Đầu (mai tròn) quay PHẢI, đuôi kiếm chĩa sang trái (lớp riêng, xoay rất nhẹ quanh gốc).
 */
import type { CreatureArt } from '../contract';
import { makeIds, linear, radial, joinDefs, rng, mix, shade, blurFilter, organicTexture } from '../style-bible';

const ID = 'sam_bien';
const u = makeIds(ID);
type P = [number, number];
const f = (n: number) => n.toFixed(1);
const pathOf = (pts: P[], close = true) => 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + (close ? 'Z' : '');
const sm = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
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

// ---------- Phép chiếu: x = khoảng cách từ mép trước mai (đơn vị L), z = ngang (+ gần người xem), h = cao ----------
const L = 345;
const X0 = 688;
const Y0 = 143;
const SZ = 0.68;
const CH = 0.73;
const proj = (x: number, z: number, h: number): P => [X0 - x * L, Y0 + z * SZ * L - h * CH * L];

const INK = '#2B2115';
const RIM = '#DCC489';

// =====================================================================
// MAI ĐẦU (prosoma)
// =====================================================================
const HP = 0.135;
function wPro(x: number): number {
  const xc = Math.max(0, Math.min(0.77, x));
  if (xc < 0.45) {
    const uu = (0.45 - xc) / 0.45;
    return 0.415 * Math.pow(Math.max(0, 1 - Math.pow(uu, 2.3)), 1 / 2.1);
  }
  return 0.415 - 0.045 * Math.pow((xc - 0.45) / 0.32, 1.6);
}
/** gờ bên (gờ mắt): gãy góc ở vị trí mắt kép */
const RIDGE: P[] = [
  [0.05, 0.09],
  [0.12, 0.165],
  [0.31, 0.262],
  [0.495, 0.232],
];
const zr = (x: number) => interp(RIDGE, x);
const aPro = (x: number) => Math.pow(sm(-0.02, 0.24, x), 0.8) * (1 - 0.18 * sm(0.36, 0.5, x) - 0.3 * sm(0.5, 0.77, x));
function hPro(x: number, z: number): number {
  const w = Math.max(0.02, wPro(x));
  const az = Math.abs(z);
  const t = Math.min(1, az / w);
  const r = zr(x);
  const S = 1 - sm(0.5 * r, 1.25 * r, az);
  return 0.012 + HP * aPro(x) * (0.55 * S + 0.45 * (1 - t * t));
}
const pP = (x: number, z: number): P => proj(x, z, hPro(x, z));

const GENAL_IN: P[] = [
  [0.787, 0.366],
  [0.7, 0.34],
  [0.62, 0.316],
  [0.55, 0.3],
  [0.505, 0.288],
];
function proEdge(sign: number): P[] {
  const pts: P[] = [];
  for (let i = 0; i <= 44; i++) {
    const s = i / 44;
    const x = 0.77 * s * s;
    pts.push(proj(x, sign * wPro(x), 0.012));
  }
  return pts;
}
function proRear(): P[] {
  const pts: P[] = [];
  for (let i = 0; i <= 28; i++) {
    const z = 0.288 - (0.576 * i) / 28;
    pts.push(pP(0.5 + 0.006 * Math.cos((z / 0.288) * Math.PI * 0.5), z));
  }
  return pts;
}
const PRO_NEAR = proEdge(1);
const PRO_FAR = proEdge(-1);
const PRO_REAR = proRear();
const PRO_SIL = pathOf([
  ...PRO_NEAR,
  ...GENAL_IN.map(([x, z]) => pP(x, z)),
  ...PRO_REAR,
  ...GENAL_IN.slice()
    .reverse()
    .map(([x, z]) => pP(x, -z)),
  ...PRO_FAR.slice().reverse(),
]);

// =====================================================================
// MAI BỤNG (opisthosoma)
// =====================================================================
const OPW: P[] = [
  [0.49, 0.285],
  [0.52, 0.305],
  [0.56, 0.313],
  [0.6, 0.312],
  [0.68, 0.296],
  [0.76, 0.266],
  [0.84, 0.222],
  [0.91, 0.172],
  [0.96, 0.136],
  [1.0, 0.13],
];
const wOp = (x: number) => interp(OPW, x);
const HOpf = (x: number) => 0.1 - 0.062 * sm(0.52, 0.96, x);
function hOp(x: number, z: number): number {
  const az = Math.abs(z);
  const t = Math.min(1, az / wOp(x));
  const S = 1 - sm(0.04, 0.2, az);
  return 0.012 + HOpf(x) * (0.5 * S + 0.5 * (1 - t * t));
}
const pO = (x: number, z: number): P => proj(x, z, hOp(x, z));
const SOCK = [0.635, 0.69, 0.745, 0.8, 0.855, 0.905];
const SPINE_LEN = [0.1, 0.108, 0.104, 0.094, 0.08, 0.064];
function opEdge(sign: number): P[] {
  const pl: P[] = [
    [0.49, 0.285],
    [0.52, 0.305],
    [0.56, 0.313],
    [0.6, 0.312],
  ];
  SOCK.forEach((xs, i) => {
    const xn = i < SOCK.length - 1 ? SOCK[i + 1] : 0.955;
    pl.push([xs, wOp(xs) - 0.009], [xs + 0.014, wOp(xs + 0.014) - 0.002]);
    const xt = xn - 0.008;
    pl.push([xt, wOp(xt) + 0.012]);
  });
  // gai tận cùng 2 bên gốc đuôi + khuyết gốc đuôi
  pl.push([0.957, 0.126], [1.005, 0.13], [0.968, 0.09], [0.957, 0.06], [0.948, 0.034]);
  return pl.map(([x, z]) => proj(x, z * sign, 0.012));
}
function opFront(): P[] {
  const pts: P[] = [];
  for (let i = 1; i < 16; i++) {
    const z = -0.285 + (0.57 * i) / 16;
    pts.push(pO(0.49, z));
  }
  return pts;
}
const OP_NEAR = opEdge(1);
const OP_FAR = opEdge(-1);
const OP_SIL = pathOf([...OP_NEAR, ...OP_FAR.slice().reverse(), ...opFront()]);

// =====================================================================
// Tô bóng theo pháp tuyến (lưới ô, sau đó làm mờ)
// =====================================================================
const norm = (v: number[]) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return v.map((c) => c / l);
};
const LIGHT = norm([-0.35, 1, -0.5]);
const VIEW = norm([0, SZ, CH]);
const HALF = norm([LIGHT[0] + VIEW[0], LIGHT[1] + VIEW[1], LIGHT[2] + VIEW[2]]);

function shellMesh(o: {
  x0: number;
  x1: number;
  nx: number;
  nt: number;
  w: (x: number) => number;
  h: (x: number, z: number) => number;
  albedo: (x: number, z: number, t: number) => string;
}): string {
  let out = '';
  const T = 1.1;
  const pt = (x: number, t: number): P => {
    const z = t * o.w(x);
    return proj(x, z, o.h(x, z));
  };
  for (let j = 0; j < o.nt; j++) {
    const t0 = -T + (2 * T * j) / o.nt;
    const t1 = -T + (2 * T * (j + 1)) / o.nt;
    for (let i = 0; i < o.nx; i++) {
      const xa = o.x0 + ((o.x1 - o.x0) * i) / o.nx;
      const xb = o.x0 + ((o.x1 - o.x0) * (i + 1)) / o.nx;
      const xc = (xa + xb) / 2;
      const tc = Math.max(-0.97, Math.min(0.97, (t0 + t1) / 2));
      const zc = tc * o.w(xc);
      const e = 0.006;
      const hx = (o.h(xc + e, zc) - o.h(xc - e, zc)) / (2 * e);
      const hz = (o.h(xc, zc + e) - o.h(xc, zc - e)) / (2 * e);
      const n = norm([-hx, 1, -hz]);
      const nl = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
      const nh = Math.max(0, n[0] * HALF[0] + n[1] * HALF[1] + n[2] * HALF[2]);
      const spec = Math.pow(nh, 46);
      const lit = 0.4 + 0.8 * nl;
      let col = shade(o.albedo(xc, zc, Math.abs(tc)), Math.max(-0.85, Math.min(0.3, lit - 1)));
      col = mix(col, '#FFF6DE', Math.min(0.75, spec * 0.85));
      const q = [pt(xa, t0), pt(xb, t0), pt(xb, t1), pt(xa, t1)];
      out += `<path d="${pathOf(q)}" fill="${col}"/>`;
    }
  }
  return out;
}

const proAlbedo = (x: number, z: number, t: number): string => {
  const r = zr(x);
  const S = 1 - sm(0.55 * r, 1.05 * r, Math.abs(z));
  let c = mix('#6F6B48', '#93602F', 0.8 * S * sm(0.04, 0.2, x));
  c = mix(c, '#5A6480', 0.7 * sm(0.5, 0.92, t));
  c = mix(c, '#7C5C38', 0.45 * sm(0.93, 1, t));
  return c;
};
const opAlbedo = (x: number, z: number, t: number): string => {
  const S = 1 - sm(0.05, 0.16, Math.abs(z));
  let c = mix('#77704A', '#94895A', 0.6 * S);
  c = mix(c, '#84552D', 0.75 * sm(0.5, 1, t));
  c = mix(c, '#6E4A2C', 0.4 * sm(0.75, 1, x));
  return c;
};

/** đường chạy trên mặt mai */
function surfLine(p: (x: number, z: number) => P, xa: number, xb: number, zf: (x: number) => number, n = 24): P[] {
  const pts: P[] = [];
  for (let i = 0; i <= n; i++) {
    const x = xa + ((xb - xa) * i) / n;
    pts.push(p(x, zf(x)));
  }
  return pts;
}
const shift = (pts: P[], dx: number, dy: number): P[] => pts.map(([x, y]) => [x + dx, y + dy]);
/** gai nhỏ trên gờ (nhọn, chĩa về sau-lên) */
function thorn(p: P, s: number): string {
  return `M${f(p[0] + s * 0.9)} ${f(p[1] + 0.4)}L${f(p[0] - s * 1.1)} ${f(p[1] - s * 1.25)}L${f(p[0] - s * 0.9)} ${f(p[1] + 0.6)}Z`;
}

// ---------- gai mép cử động ----------
function spines(sign: number): string {
  let fill = '';
  let hi = '';
  SOCK.forEach((xs, i) => {
    const w = wOp(xs) - 0.006;
    const len = SPINE_LEN[i];
    const b0 = proj(xs - 0.008, sign * w, 0.014);
    const b1 = proj(xs + 0.017, sign * (w - 0.004), 0.014);
    const tip = proj(xs + 0.006 + len * 0.76, sign * (w + len * 0.66), 0.003);
    const mid: P = [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2];
    fill += `M${f(b0[0])} ${f(b0[1])}L${f(tip[0])} ${f(tip[1])}L${f(b1[0])} ${f(b1[1])}Z`;
    hi += `M${f(mid[0] + 0.8)} ${f(mid[1] - 0.4)}L${f(tip[0] + (mid[0] - tip[0]) * 0.25)} ${f(tip[1] + (mid[1] - tip[1]) * 0.25)}`;
  });
  return (
    `<path d="${fill}" fill="${u.url(sign > 0 ? 'spineN' : 'spineF')}" stroke="#6E4A1E" stroke-opacity="0.75" stroke-width="0.8" stroke-linejoin="round"/>` +
    `<path d="${hi}" fill="none" stroke="#FFF3C8" stroke-opacity="0.7" stroke-width="0.9" stroke-linecap="round"/>`
  );
}

// ---------- mắt kép hạt đậu ----------
function compoundEye(sign: number): string {
  const c = pP(0.312, sign * 0.268);
  const rx = sign > 0 ? 8.2 : 7.4;
  const ry = sign > 0 ? 4.3 : 3.3;
  const rot = sign > 0 ? 8 : -9;
  const cy = c[1] + (sign > 0 ? 1.5 : -0.5);
  return (
    `<g transform="rotate(${rot} ${f(c[0])} ${f(cy)})">` +
    `<ellipse cx="${f(c[0])}" cy="${f(cy)}" rx="${rx + 2}" ry="${ry + 1.8}" fill="#3A2A18" opacity="0.55"/>` +
    `<ellipse cx="${f(c[0])}" cy="${f(cy)}" rx="${rx}" ry="${ry}" fill="${u.url('eye')}" stroke="#C9A86A" stroke-opacity="0.75" stroke-width="0.9"/>` +
    `<ellipse cx="${f(c[0] + 1.5)}" cy="${f(cy - ry * 0.35)}" rx="${f(rx * 0.55)}" ry="${f(ry * 0.3)}" fill="#D8E6F0" opacity="0.5"/>` +
    `<ellipse cx="${f(c[0] + 3.2)}" cy="${f(cy - ry * 0.4)}" rx="1.5" ry="0.9" fill="#FFFFFF" opacity="0.95"/>` +
    `</g>`
  );
}

// =====================================================================
// THÂN
// =====================================================================
function opisthosoma(): string {
  const mid = surfLine(pO, 0.5, 0.94, () => 0, 20);
  // 2 hàng 6 hố bám cơ
  let pits = '';
  let pitHi = '';
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const x = 0.565 + i * 0.057;
      const p = pO(x, s * (0.088 - i * 0.004));
      const rx = 3.6 - i * 0.2;
      pits += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(rx)}" ry="${f(rx * 0.5)}"/>`;
      pitHi += `M${f(p[0] - rx)} ${f(p[1] + 1.6)}Q${f(p[0])} ${f(p[1] + rx * 0.5 + 2.2)} ${f(p[0] + rx)} ${f(p[1] + 1.6)}`;
    }
  }
  // rãnh đốt mờ tỏa ra mép
  let grooves = '';
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const x = 0.59 + i * 0.057;
      const a = pO(x, s * 0.1);
      const m = pO(x + 0.02, s * wOp(x + 0.02) * 0.62);
      const b = pO(x + 0.045, s * wOp(x + 0.045) * 0.97);
      grooves += `M${f(a[0])} ${f(a[1])}Q${f(m[0])} ${f(m[1])} ${f(b[0])} ${f(b[1])}`;
    }
  }
  const thorns = [0.555, 0.7, 0.88].map((x, i) => thorn(pO(x, 0), 3.4 - i * 0.5)).join('') + thorn(proj(0.955, 0, 0.05), 3.6);
  const nearEdge = pathOf(OP_NEAR, false);
  const farEdge = pathOf(OP_FAR, false);
  return (
    `<path d="${OP_SIL}" transform="translate(0 3)" fill="#33230F"/>` +
    `<path d="${OP_SIL}" fill="#70603C"/>` +
    `<g clip-path="${u.url('opClip')}">` +
    `<g filter="${u.url('tex')}"><g filter="${u.url('b3')}">${shellMesh({ x0: 0.47, x1: 1.01, nx: 15, nt: 14, w: wOp, h: hOp, albedo: opAlbedo })}</g></g>` +
    `<path d="${OP_SIL}" fill="${u.url('crackle')}"/>` +
    `<path d="${grooves}" fill="none" stroke="#2F200F" stroke-opacity="0.22" stroke-width="1.1" stroke-linecap="round"/>` +
    `<path d="${grooves}" fill="none" stroke="#FFF1CC" stroke-opacity="0.14" stroke-width="0.8" transform="translate(-1.2 0.9)"/>` +
    // gờ giữa
    `<path d="${pathOf(shift(mid, 0, 2.6), false)}" fill="none" stroke="#2A1C0E" stroke-opacity="0.35" stroke-width="3.4" filter="${u.url('b1')}"/>` +
    `<path d="${pathOf(shift(mid, 0, -0.8), false)}" fill="none" stroke="#FFF4D6" stroke-opacity="0.5" stroke-width="1.5" stroke-linecap="round"/>` +
    `<path d="${pathOf(surfLine(pO, 0.52, 0.86, () => -0.03, 14), false)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="5" stroke-linecap="round" filter="${u.url('b3')}"/>` +
    `<g fill="#1F140A" fill-opacity="0.78">${pits}</g>` +
    `<path d="${pitHi}" fill="none" stroke="#FFF1CC" stroke-opacity="0.4" stroke-width="0.8" stroke-linecap="round"/>` +
    // bóng của mai đầu đổ lên khớp bản lề
    `<path d="${pathOf(shift(PRO_REAR, -5, 1), false)}" fill="none" stroke="#1A1108" stroke-opacity="0.6" stroke-width="9" filter="${u.url('b3')}"/>` +
    `</g>` +
    `<path d="${thorns}" fill="#D9BC7C" stroke="${INK}" stroke-opacity="0.6" stroke-width="0.6" stroke-linejoin="round"/>` +
    `<path d="${OP_SIL}" fill="none" stroke="${INK}" stroke-opacity="0.65" stroke-width="1.3" stroke-linejoin="round"/>` +
    `<path d="${nearEdge}" fill="none" stroke="${RIM}" stroke-opacity="0.7" stroke-width="1" stroke-linejoin="round" transform="translate(0 -0.9)"/>` +
    `<path d="${farEdge}" fill="none" stroke="#FFF6DD" stroke-opacity="0.45" stroke-width="1.1" stroke-linejoin="round" transform="translate(0 0.9)"/>`
  );
}

function prosoma(): string {
  const mid = surfLine(pP, 0.1, 0.5, () => 0, 26);
  const ridgeN = surfLine(pP, 0.05, 0.497, (x) => zr(x), 30);
  const ridgeF = surfLine(pP, 0.05, 0.497, (x) => -zr(x), 30);
  // vùng tim giữa 2 gờ bên – vân lưới nâu gỉ
  const cardiac = pathOf([
    ...surfLine(pP, 0.07, 0.497, (x) => zr(x) * 0.9, 24),
    ...surfLine(pP, 0.07, 0.497, (x) => -zr(x) * 0.9, 24).reverse(),
  ]);
  const band = (s: number) =>
    pathOf([...surfLine(pP, 0.16, 0.49, () => s * 0.035, 14), ...surfLine(pP, 0.16, 0.49, (x) => s * (0.06 + 0.1 * sm(0.16, 0.34, x)), 14).reverse()]);
  const thorns =
    thorn(pP(0.135, 0), 3.2) + thorn(pP(0.3, 0), 2.4) + thorn(pP(0.47, 0), 3.8) + thorn(pP(0.47, zr(0.47)), 3.2) + thorn(pP(0.47, -zr(0.47)), 2.8);
  const oc = [pP(0.118, 0.02), pP(0.118, -0.02)];
  const nearEdge = pathOf(PRO_NEAR, false);
  const farEdge = pathOf(PRO_FAR.slice(6), false);
  return (
    // bề dày mép mai (phía gần)
    `<path d="${PRO_SIL}" transform="translate(-0.5 4.2)" fill="#2E1F10"/>` +
    `<path d="${PRO_SIL}" transform="translate(0 2)" fill="#A98B52"/>` +
    `<path d="${PRO_SIL}" fill="#6A6344"/>` +
    `<g clip-path="${u.url('proClip')}">` +
    `<g filter="${u.url('tex')}"><g filter="${u.url('b3')}">${shellMesh({ x0: 0, x1: 0.8, nx: 28, nt: 20, w: (x) => wPro(Math.max(0.004, x)), h: hPro, albedo: proAlbedo })}</g></g>` +
    `<path d="${PRO_SIL}" fill="${u.url('crackle')}"/>` +
    `<path d="${cardiac}" fill="${u.url('net')}"/>` +
    `<path d="${band(1)}${band(-1)}" fill="#5A2E12" fill-opacity="0.3" filter="${u.url('b3')}"/>` +
    // ánh bóng ướt: vệt lớn trên vành gần + vệt trên vai vòm phía xa
    `<path d="${pathOf(surfLine(pP, 0.1, 0.62, (x) => wPro(x) * 0.8, 20), false)}" fill="none" stroke="#DCE4FF" stroke-opacity="0.2" stroke-width="13" stroke-linecap="round" filter="${u.url('b6')}"/>` +
    `<path d="${pathOf(surfLine(pP, 0.12, 0.44, () => -0.075, 16), false)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.42" stroke-width="6" stroke-linecap="round" filter="${u.url('b3')}"/>` +
    `<path d="${pathOf(surfLine(pP, 0.17, 0.36, () => -0.085, 10), false)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="1.8" stroke-linecap="round" filter="${u.url('b1')}"/>` +
    `<path d="${pathOf(surfLine(pP, 0.2, 0.55, (x) => -wPro(x) * 0.78, 14), false)}" fill="none" stroke="#C9CFF2" stroke-opacity="0.28" stroke-width="9" stroke-linecap="round" filter="${u.url('b6')}"/>` +
    // 3 gờ dọc: bóng phía gần + nét sáng trên đỉnh
    `<path d="${pathOf(shift(ridgeN, 0, 3), false)}" fill="none" stroke="#20150A" stroke-opacity="0.42" stroke-width="4.2" stroke-linejoin="round" filter="${u.url('b1')}"/>` +
    `<path d="${pathOf(shift(mid, 0, 2.6), false)}" fill="none" stroke="#20150A" stroke-opacity="0.36" stroke-width="3.4" filter="${u.url('b1')}"/>` +
    `<path d="${pathOf(shift(ridgeF, 0, 2.2), false)}" fill="none" stroke="#20150A" stroke-opacity="0.3" stroke-width="3" stroke-linejoin="round" filter="${u.url('b1')}"/>` +
    `<path d="${pathOf(shift(ridgeN, 0, -0.6), false)}" fill="none" stroke="#FFF2D0" stroke-opacity="0.62" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<path d="${pathOf(shift(mid, 0, -0.8), false)}" fill="none" stroke="#FFF6DE" stroke-opacity="0.6" stroke-width="1.5" stroke-linecap="round"/>` +
    `<path d="${pathOf(shift(ridgeF, 0, -0.6), false)}" fill="none" stroke="#FFF2D0" stroke-opacity="0.5" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/>` +
    // bóng tối dưới mép sau (bản lề)
    `<path d="${pathOf(shift(PRO_REAR, 2.5, 0), false)}" fill="none" stroke="#1A1108" stroke-opacity="0.35" stroke-width="4" filter="${u.url('b1')}"/>` +
    `</g>` +
    // mắt đơn nhỏ phía trước + mắt kép 2 bên
    oc.map((p) => `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="1.5" ry="1.1" fill="#140C06"/><circle cx="${f(p[0] + 0.5)}" cy="${f(p[1] - 0.4)}" r="0.4" fill="#fff" opacity="0.8"/>`).join('') +
    compoundEye(-1) +
    compoundEye(1) +
    `<path d="${thorns}" fill="#DCC084" stroke="${INK}" stroke-opacity="0.6" stroke-width="0.6" stroke-linejoin="round"/>` +
    `<path d="${PRO_SIL}" fill="none" stroke="${INK}" stroke-opacity="0.7" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="${pathOf(PRO_REAR, false)}" fill="none" stroke="${RIM}" stroke-opacity="0.55" stroke-width="1.1" transform="translate(0.8 0)"/>` +
    `<path d="${nearEdge}" fill="none" stroke="${RIM}" stroke-opacity="0.9" stroke-width="1.5" stroke-linecap="round" transform="translate(0 -0.6)"/>` +
    `<path d="${farEdge}" fill="none" stroke="#FFF8E4" stroke-opacity="0.7" stroke-width="1.7" stroke-linecap="round" transform="translate(0 1)"/>`
  );
}

function bodySvg(): string {
  return (
    `<ellipse cx="${f(X0 - 0.5 * L)}" cy="${Y0 + 16}" rx="${f(0.53 * L)}" ry="${f(0.415 * SZ * L + 2)}" fill="${u.url('shadow')}"/>` +
    opisthosoma() +
    spines(-1) +
    spines(1) +
    prosoma()
  );
}

// =====================================================================
// ĐUÔI KIẾM (telson) – lớp riêng
// =====================================================================
const TB: P = proj(0.925, 0, 0.034);
const TT: P = [34, Y0 + 30];
function telson(): string {
  const dx = TT[0] - TB[0];
  const dy = TT[1] - TB[1];
  const len = Math.hypot(dx, dy);
  const d: P = [dx / len, dy / len];
  const n: P = [-d[1], d[0]]; // chĩa lên màn hình (y giảm) vì d hướng trái
  const wt = (s: number) => 6.8 * Math.pow(Math.max(0, 1 - s), 0.85) + 0.45 + 1.6 * Math.exp(-Math.pow(s / 0.05, 2));
  const at = (s: number, k: number): P => [TB[0] + d[0] * s * len + n[0] * wt(s) * k, TB[1] + d[1] * s * len + n[1] * wt(s) * k];
  const up: P[] = [];
  const lo: P[] = [];
  const keel: P[] = [];
  const N = 36;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    up.push(at(s, 0.95));
    lo.push(at(s, -1));
    keel.push(at(s, 0.3));
  }
  const whole = pathOf([...up, ...lo.slice().reverse()]);
  const top = pathOf([...up, ...keel.slice().reverse()]);
  let teeth = '';
  for (let i = 2; i < 34; i++) {
    const s = 0.04 + i * 0.021;
    const p = at(s, 0.3);
    const sz = 1.5 * (1 - s * 0.6);
    teeth += `M${f(p[0] + sz)} ${f(p[1])}L${f(p[0] - sz * 0.8)} ${f(p[1] - sz * 1.1)}L${f(p[0] - sz)} ${f(p[1] + 0.2)}Z`;
  }
  return (
    `<path d="${pathOf(shift(lo, -4, 7), false)}" fill="none" stroke="#14100A" stroke-opacity="0.3" stroke-width="5" stroke-linecap="round" filter="${u.url('b3')}"/>` +
    `<path d="${whole}" fill="${u.url('telLo')}"/>` +
    `<path d="${top}" fill="${u.url('telUp')}"/>` +
    `<path d="${teeth}" fill="#C9A470" fill-opacity="0.8"/>` +
    `<path d="${pathOf(keel.slice(1), false)}" fill="none" stroke="#F4DDB0" stroke-opacity="0.55" stroke-width="0.9"/>` +
    `<path d="${pathOf(shift(up.slice(1, -2), 0, 0.9), false)}" fill="none" stroke="#FFF2D2" stroke-opacity="0.4" stroke-width="0.9"/>` +
    `<path d="${whole}" fill="none" stroke="${INK}" stroke-opacity="0.7" stroke-width="1.1" stroke-linejoin="round"/>`
  );
}

// =====================================================================
// NỀN CÁT BÙN (chỉ trên thẻ Sổ tay)
// =====================================================================
function ground(): string {
  const r = rng(5107);
  let ripples = '';
  for (let i = 0; i < 9; i++) {
    const y = 150 + (i - 4) * 24 + (r() - 0.5) * 8;
    const x = 70 + r() * 330;
    const w = 150 + r() * 170;
    const k = Math.max(0, 1 - Math.abs(y - 160) / 125);
    if (k < 0.12) continue;
    ripples += `M${f(x)} ${f(y)}Q${f(x + w * 0.3)} ${f(y - 5 - r() * 3)} ${f(x + w * 0.55)} ${f(y)}T${f(x + w)} ${f(y + 1)}`;
  }
  let grains = '';
  let lights = '';
  for (let i = 0; i < 90; i++) {
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r());
    const x = 360 + Math.cos(a) * rad * 320;
    const y = 160 + Math.sin(a) * rad * 108;
    const s = 0.7 + r() * 1.5;
    const e = `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * 1.4)}" ry="${f(s * 0.7)}"/>`;
    if (i % 3) grains += e;
    else lights += e;
  }
  // rãnh đuôi kéo lê trên cát
  const drag = `M${f(TT[0] + 4)} ${f(TT[1] + 5)}Q${f(TT[0] + 120)} ${f(TT[1] + 2)} ${f(TT[0] + 250)} ${f(TT[1] - 6)}`;
  return (
    `<ellipse cx="360" cy="160" rx="354" ry="124" fill="${u.url('sand')}"/>` +
    `<path d="${ripples}" fill="none" stroke="#6E6348" stroke-opacity="0.28" stroke-width="2.2" stroke-linecap="round" filter="${u.url('b1')}"/>` +
    `<path d="${ripples}" fill="none" stroke="#F3E8C6" stroke-opacity="0.3" stroke-width="1.2" stroke-linecap="round" transform="translate(0 2.6)"/>` +
    `<g fill="#5E543C" fill-opacity="0.4">${grains}</g><g fill="#F7EED2" fill-opacity="0.45">${lights}</g>` +
    `<path d="${drag}" fill="none" stroke="#5E543C" stroke-opacity="0.3" stroke-width="2.4" stroke-linecap="round" filter="${u.url('b1')}"/>`
  );
}

// =====================================================================
// DEFS
// =====================================================================
const defs = joinDefs(
  radial(u('sand'), [
    [0, '#CDBE97', 0.95],
    [0.55, '#B9AB85', 0.85],
    [0.85, '#9C9374', 0.4],
    [1, '#8C8668', 0],
  ]),
  radial(u('shadow'), [
    [0, '#0E0B06', 0.5],
    [0.7, '#0E0B06', 0.34],
    [1, '#0E0B06', 0],
  ]),
  radial(
    u('eye'),
    [
      [0, '#6A4A2A'],
      [0.5, '#2A1A0E'],
      [1, '#0E0805'],
    ],
    { cx: 0.6, cy: 0.3, r: 0.75 },
  ),
  linear(
    u('spineN'),
    [
      [0, '#F0D488'],
      [0.6, '#D9AE56'],
      [1, '#A87A30'],
    ],
    { x1: 1, y1: 0, x2: 0, y2: 1 },
  ),
  linear(
    u('spineF'),
    [
      [0, '#F3DC98'],
      [0.6, '#DDB764'],
      [1, '#B48A40'],
    ],
    { x1: 1, y1: 1, x2: 0, y2: 0 },
  ),
  linear(
    u('telUp'),
    [
      [0, '#6B4B34'],
      [0.6, '#8C6848'],
      [1, '#9C7650'],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 0 },
  ),
  linear(
    u('telLo'),
    [
      [0, '#33231A'],
      [0.6, '#4A3222'],
      [1, '#5C4029'],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 0 },
  ),
  blurFilter(u('b1'), 1.2),
  blurFilter(u('b3'), 3),
  blurFilter(u('b6'), 6),
  organicTexture(u('tex'), { freq: 0.09, octaves: 3, strength: 0.22, seed: 23 }),
  // vân lưới rỗ (ô tròn so le, ép dẹt theo phối cảnh)
  `<pattern id="${u('net')}" width="9" height="8" patternUnits="userSpaceOnUse" patternTransform="scale(1 0.7) rotate(-6)">` +
    `<g fill="#F3D9A0" fill-opacity="0.1" stroke="#4A2812" stroke-opacity="0.36" stroke-width="0.7"><circle cx="2.4" cy="2.2" r="2"/><circle cx="6.9" cy="6.1" r="2.2"/><circle cx="6.8" cy="1.6" r="1.1"/><circle cx="2.2" cy="6.2" r="1.3"/></g></pattern>`,
  // rạn chân chim rất mảnh trên toàn mai
  `<pattern id="${u('crackle')}" width="11" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">` +
    `<path d="M0 3L3 1.5L6 3.5L9 2L11 3M3 1.5L2.5 0M6 3.5L6.5 6.5L3.5 9M6.5 6.5L10 7.5L11 9M9 2L9.5 0" fill="none" stroke="#1E160C" stroke-opacity="0.11" stroke-width="0.5"/></pattern>`,
  `<clipPath id="${u('proClip')}"><path d="${PRO_SIL}"/></clipPath>`,
  `<clipPath id="${u('opClip')}"><path d="${OP_SIL}"/></clipPath>`,
);

// =====================================================================
// LỚP
// =====================================================================
const art: CreatureArt = {
  id: ID,
  viewBox: [720, 290],
  lengthUnits: 654,
  spineY: Y0,
  animation: 'static',
  cycleHz: 0.25,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'ground',
      role: 'detail',
      bend: false,
      z: 'back',
      cardOnly: true,
      pivot: [360, 160],
      anim: { type: 'none', amp: 0 },
      svg: ground(),
    },
    {
      name: 'telson',
      role: 'tail',
      bend: false,
      z: 'back',
      pivot: [Math.round(TB[0]), Math.round(TB[1])],
      anim: { type: 'rotate', amp: 0.022 },
      svg: telson(),
    },
    { name: 'body', role: 'body', svg: bodySvg() },
  ],
};

export default art;
