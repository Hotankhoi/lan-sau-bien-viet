/**
 * Bọ biển khổng lồ – Bathynomus jamesi (Hiếm, Khơi xa, Tầng 3) – giáp xác chân đều cỡ lớn ("rận gỗ khổng lồ").
 * Góc nhìn ngang hơi từ trên (3/4) khi đang bò trên đáy bùn. Thân dựng bằng mô hình mặt cong theo từng đốt
 * (x dọc thân từ đầu → đuôi, z ngang, h cao) rồi chiếu xiên; mỗi đốt tô bóng theo pháp tuyến (lưới ô nhỏ làm mờ).
 * Đặc điểm nhận dạng (theo ảnh tham khảo B. giganteus cùng chi):
 *  - vòm lưng rất cao, 7 đốt giáp ngực xếp chồng (mép sau nhô cao, có dải hồng nâu + gờ sáng), đốt 1 dài nhất;
 *  - hàng tấm bên (coxal plate) trắng ngà thành thùy tròn chồng ra sau, ngăn với giáp lưng bằng đường khớp dọc;
 *  - 5 đốt bụng hẹp mép bên nhọn; tấm đuôi (pleotelson) rộng có gờ giữa và hàng gai ở mép sau;
 *  - chân đuôi (uropod) mái chèo viền gai; đầu nhỏ thấp có mắt kép tam giác lớn màu nâu tím sẫm, gờ trắng phía trên;
 *  - 2 đôi râu: râu 1 ngắn đốt to, râu 2 dài mảnh nhiều đốt; 7 đôi chân bò ngắn có gai.
 * Không phát quang. Tầng 3 tối: dùng rim light mát + bóng khối rõ để nổi lên khi đèn chiếu.
 * Đầu quay PHẢI. Chân phía gần là các lớp riêng cử động bò luân phiên; râu lắc rất chậm.
 */
import type { CreatureArt, ArtLayer } from '../contract';
import { makeIds, linear, radial, joinDefs, rng, mix, shade, blurFilter, smoothPath } from '../style-bible';

const ID = 'bo_bien_khong_lo';
const u = makeIds(ID);
type P = [number, number];
/** [x dọc thân (0 = mép trước đầu, 1 = mút tấm đuôi), z ngang (+ gần người xem), h cao] – đơn vị chiều dài thân */
type V3 = [number, number, number];
const f = (n: number) => n.toFixed(1);
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const sm = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const pathOf = (pts: P[], close = true) => 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + (close ? 'Z' : '');
const interp = (tab: P[], x: number): number => {
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) {
    if (x <= tab[i][0]) {
      const k = (x - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]);
      // nội suy mượt (smoothstep) giữa các mốc
      const s = k * k * (3 - 2 * k);
      return tab[i - 1][1] + (tab[i][1] - tab[i - 1][1]) * s;
    }
  }
  return tab[tab.length - 1][1];
};
const v3 = {
  sub: (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  mul: (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a: V3): V3 => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  },
};

// ---------- Phép chiếu ----------
const L = 520;
const X0 = 596;
const Y0 = 142;
const SZ = 0.5; // độ nghiêng nhìn từ trên (ngang thân → dọc màn hình)
const CH = 0.84; // chiều cao → dọc màn hình
const YAW = -0.28; // nhìn chéo hơi từ phía trước: phía gần lệch về đuôi
const proj = (p: V3): P => [X0 - p[0] * L + p[1] * YAW * L, Y0 + p[1] * SZ * L - p[2] * CH * L];
const GROUND = -0.078;

// ---------- Màu ----------
const INK = '#4A3040';
const RIMC = '#DCE8FF'; // rim light mát (đèn tàu lặn)
const LIP = '#FFF3F2';

// =====================================================================
// HÌNH KHỐI THÂN
// =====================================================================
/** nửa bề ngang theo x */
const W_TAB: P[] = [
  [0, 0.075],
  [0.025, 0.094],
  [0.05, 0.104],
  [0.064, 0.108],
  [0.08, 0.165],
  [0.11, 0.188],
  [0.16, 0.2],
  [0.26, 0.212],
  [0.36, 0.218],
  [0.45, 0.216],
  [0.52, 0.208],
  [0.575, 0.198],
  [0.64, 0.188],
  [0.74, 0.178],
  [1, 0.15],
];
/** độ cao đỉnh vòm */
const H_TAB: P[] = [
  [0, 0.018],
  [0.03, 0.05],
  [0.062, 0.07],
  [0.078, 0.135],
  [0.13, 0.168],
  [0.22, 0.188],
  [0.33, 0.197],
  [0.43, 0.193],
  [0.52, 0.178],
  [0.58, 0.16],
  [0.66, 0.13],
  [0.74, 0.104],
  [0.79, 0.084],
  [0.86, 0.04],
  [0.93, -0.006],
  [1, -0.04],
];
/** độ cao mép dưới (tấm bên) */
const B_TAB: P[] = [
  [0, -0.022],
  [0.06, -0.03],
  [0.12, -0.042],
  [0.6, -0.044],
  [0.75, -0.04],
  [0.9, -0.056],
  [1, -0.066],
];
const wB = (x: number) => interp(W_TAB, x);
const Hc = (x: number) => interp(H_TAB, x);
const Be = (x: number) => interp(B_TAB, x);
const arch = (a: number) => Math.pow(Math.max(0, 1 - Math.pow(clamp(a), 2.2)), 0.5);

type Kind = 'head' | 'per' | 'pleon' | 'tel';
interface Seg {
  kind: Kind;
  xs: number;
  xe: number;
  n: number; // số cột lưới
}
const OV = 0.014; // mép sau đè lên đốt kế tiếp
const STEP = 0.006; // mép sau nhô cao (xếp chồng)
const PER_X = [0.062, 0.15, 0.22, 0.29, 0.36, 0.43, 0.5, 0.575];
const PLE_X = [0.575, 0.606, 0.637, 0.668, 0.7, 0.74];
const SEGS: Seg[] = [
  { kind: 'head', xs: 0, xe: 0.062, n: 7 },
  ...PER_X.slice(0, 7).map((xs, i): Seg => ({ kind: 'per', xs, xe: PER_X[i + 1], n: i === 0 ? 6 : 5 })),
  ...PLE_X.slice(0, 5).map((xs, i): Seg => ({ kind: 'pleon', xs, xe: PLE_X[i + 1], n: 2 })),
  { kind: 'tel', xs: 0.74, xe: 1, n: 12 },
];

/** điểm trên mặt đốt: uu = 0 (mép trước) → 1 (mép sau), t = -1 (mép xa) → 1 (mép gần) */
function S(s: Seg, uu: number, t: number): V3 {
  const a = clamp(Math.abs(t));
  let xf: number;
  let xb: number;
  switch (s.kind) {
    case 'head':
      xf = 0.016 * a * a + 0.032 * Math.pow(a, 6);
      xb = s.xe + OV + 0.006 * a * a;
      break;
    case 'per':
      // đốt 1: mép trước ôm lấy đầu (đè lên đầu), góc trước-bên chìa ra trước
      xf = s.xs === PER_X[0] ? s.xs - 0.002 - 0.01 * a * a : s.xs - 0.012 * a * a;
      xb = s.xe + OV - 0.012 * a * a + 0.016 * sm(0.78, 1, a);
      break;
    case 'pleon':
      xf = s.xs - 0.004 * a * a;
      xb = s.xe + OV * 0.8 - 0.004 * a * a + 0.022 * sm(0.72, 1, a);
      break;
    default:
      xf = s.xs - 0.006 * a * a;
      xb = 1 - 0.045 * a * a - 0.025 * Math.pow(a, 6);
  }
  const x = xf + (xb - xf) * uu;
  let w: number;
  if (s.kind === 'tel') w = 0.176 - 0.046 * Math.pow(uu, 1.3);
  else if (s.kind === 'pleon') w = wB(x) * (1 + 0.05 * uu * uu);
  else w = wB(s.xs === PER_X[0] ? Math.max(x, 0.09) : x);
  const z = t * w;
  // đốt 1: mép trước dựng cao ngay (vành vòm ôm sau đầu)
  const xh = s.xs === PER_X[0] ? Math.max(x, 0.1) : x;
  const ar = s.kind === 'tel' ? Math.pow(Math.max(0, 1 - a * a), 0.75) : arch(a);
  let h = Be(xh) + (Hc(xh) - Be(xh)) * ar + STEP * uu * (1 - a * a * a * a);
  if (s.kind === 'per' || s.kind === 'pleon') {
    // thùy tròn của tấm bên: mép dưới cong lên ở góc trước & góc sau
    const edge = sm(0.82, 1, a);
    h += edge * (0.038 * (1 - sm(0, 0.32, uu)) + 0.034 * sm(0.68, 1, uu));
  }
  if (s.kind === 'tel') {
    // gờ giữa dọc tấm đuôi
    h += 0.009 * (1 - sm(0, 0.22, a)) * sm(0.05, 0.45, uu);
  }
  return [x, z, h];
}

const LIGHT = v3.norm([-0.4, 0.85, 1]);
const VIEW = v3.norm([YAW, 1, SZ / CH]);
const HALF = v3.norm(v3.add(LIGHT, VIEW));

function normalAt(s: Seg, uu: number, t: number): V3 {
  const e = 0.012;
  const tt = clamp(t, -0.985, 0.985);
  const A = S(s, clamp(uu + e), tt);
  const B = S(s, clamp(uu - e), tt);
  const C = S(s, uu, tt + e);
  const D = S(s, uu, tt - e);
  let n = v3.norm(v3.cross(v3.sub(A, B), v3.sub(C, D)));
  const p = S(s, uu, tt);
  const out: V3 = [0, p[1], p[2] - (Be(p[0]) - 0.06)];
  if (v3.dot(n, out) < 0) n = v3.mul(n, -1);
  return n;
}

/** màu nền (albedo) của giáp theo vị trí */
function albedo(s: Seg, uu: number, t: number, x: number): string {
  const a = Math.abs(t);
  const wob = 0.5 + 0.5 * Math.sin(x * 57 + t * 6.1 + Math.sin(x * 21 + t * 3) * 1.7);
  let c = mix('#BFA2AE', '#D3BCC2', wob);
  if (s.kind === 'per' || s.kind === 'pleon') {
    // phần trước bị đốt trước che (sẫm), dải hồng nâu ở mép sau
    if (s.xs !== PER_X[0]) c = mix(c, '#8E7086', 0.45 * (1 - sm(0, 0.18, uu)));
    c = mix(c, '#A8737D', 0.55 * sm(0.68, 0.93, uu) * (0.6 + 0.4 * sm(0.3, 0.8, a)));
    // tấm bên trắng ngà
    const cox = sm(0.79, 0.84, a);
    c = mix(c, mix('#E6DAD6', '#D9C4C2', sm(0.5, 1, uu)), 0.78 * cox);
    c = mix(c, '#B58A90', 0.5 * cox * sm(0.82, 1, uu));
  } else if (s.kind === 'head') {
    c = mix(c, '#D6C3C6', 0.5);
    c = mix(c, '#E9DDDC', 0.6 * sm(0.75, 0.95, a));
  } else {
    // tấm đuôi: sáng hơn, loang trắng, mép sau ngả vàng ngà
    c = mix(c, '#E4D4D8', 0.6);
    c = mix(c, '#9C7A8A', 0.35 * (1 - sm(0, 0.16, uu)));
    c = mix(c, '#E2D2CC', 0.5 * sm(0.75, 1, uu));
    c = mix(c, '#A9838F', 0.3 * sm(0.25, 0.55, a) * (1 - sm(0.6, 0.85, a)) * sm(0.15, 0.6, uu));
  }
  return c;
}

function shadeColor(alb: string, n: V3): string {
  const nl = Math.max(0, v3.dot(n, LIGHT));
  const nh = Math.max(0, v3.dot(n, HALF));
  const nv = Math.max(0, v3.dot(n, VIEW));
  const lit = 0.42 + 0.74 * nl;
  let col = shade(alb, clamp(lit - 1, -0.78, 0.22));
  col = mix(col, '#FFFFFF', Math.min(0.7, Math.pow(nh, 34) * 0.8));
  col = mix(col, RIMC, 0.34 * Math.pow(1 - nv, 3));
  return col;
}

function mesh(s: Seg, NT = 14): string {
  let out = '';
  for (let j = 0; j < NT; j++) {
    const t0 = -1 + (2 * j) / NT;
    const t1 = -1 + (2 * (j + 1)) / NT;
    for (let i = 0; i < s.n; i++) {
      const u0 = i / s.n;
      const u1 = (i + 1) / s.n;
      const uc = (u0 + u1) / 2;
      const tc = (t0 + t1) / 2;
      const p = S(s, uc, tc);
      const col = shadeColor(albedo(s, uc, tc, p[0]), normalAt(s, uc, tc));
      const q = [S(s, u0, t0), S(s, u1, t0), S(s, u1, t1), S(s, u0, t1)].map(proj);
      out += `<path d="${pathOf(q)}" fill="${col}" stroke="${col}" stroke-width="0.6"/>`;
    }
  }
  return out;
}

interface SegGeom {
  poly: string;
  top: P[];
  back: P[];
  bottom: P[];
  front: P[];
  tTopBack: number;
}
function segGeom(s: Seg): SegGeom {
  const NU = 16;
  const NT = 140;
  const top: P[] = [];
  const bottom: P[] = [];
  const tTop: number[] = [];
  const tBot: number[] = [];
  for (let i = 0; i <= NU; i++) {
    const uu = i / NU;
    let mn: P = [0, 1e9];
    let mx: P = [0, -1e9];
    let tm = 0;
    let tx = 1;
    for (let j = 0; j <= NT; j++) {
      const t = -1 + (2 * j) / NT;
      const p = proj(S(s, uu, t));
      if (p[1] < mn[1]) {
        mn = p;
        tm = t;
      }
      if (p[1] > mx[1]) {
        mx = p;
        tx = t;
      }
    }
    top.push(mn);
    bottom.push(mx);
    tTop.push(tm);
    tBot.push(tx);
  }
  const edge = (uu: number, ta: number, tb: number, n = 24): P[] => {
    const pts: P[] = [];
    for (let k = 0; k <= n; k++) pts.push(proj(S(s, uu, ta + ((tb - ta) * k) / n)));
    return pts;
  };
  const back = edge(1, tTop[NU], tBot[NU]);
  const front = edge(0, tBot[0], tTop[0]);
  const poly = pathOf([...top, ...back, ...bottom.slice().reverse(), ...front]);
  return { poly, top, back, bottom, front, tTopBack: tTop[NU] };
}
const GEOM = SEGS.map(segGeom);
const BODY_UNION = GEOM.map((g) => g.poly).join('');

const shift = (pts: P[], dx: number, dy: number): P[] => pts.map(([x, y]) => [x + dx, y + dy]);

/** đường chạy trên mặt đốt theo t cố định */
function lineU(s: Seg, t: number, ua: number, ub: number, n = 14): P[] {
  const pts: P[] = [];
  for (let k = 0; k <= n; k++) pts.push(proj(S(s, ua + ((ub - ua) * k) / n, t)));
  return pts;
}
function lineT(s: Seg, uu: number, ta: number, tb: number, n = 20): P[] {
  const pts: P[] = [];
  for (let k = 0; k <= n; k++) pts.push(proj(S(s, uu, ta + ((tb - ta) * k) / n)));
  return pts;
}

/** vân loang trắng giữa giáp (ref1) */
function mottles(s: Seg, seed: number): string {
  if (s.kind === 'head') return '';
  const r = rng(seed);
  let out = '';
  const count = s.kind === 'tel' ? 14 : s.kind === 'pleon' ? 2 : 9;
  for (let i = 0; i < count; i++) {
    const uu = 0.2 + r() * 0.62;
    const t = -0.45 + r() * 1.05;
    const p = proj(S(s, uu, t));
    const rx = 2 + r() * 4.5;
    const ry = 1.2 + r() * 2.4;
    out += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(-70 + r() * 40)} ${f(p[0])} ${f(p[1])})"/>`;
  }
  return `<g fill="#F6EEF0" fill-opacity="0.32" filter="${u.url('b1')}">${out}</g>`;
}

function drawSeg(s: Seg, k: number): string {
  const g = GEOM[k];
  const back = g.back;
  let out = '';
  if (k === 1) {
    // bóng mép trước đốt 1 đổ lên đầu
    out += `<g clip-path="${u.url('c0')}"><path d="${pathOf(shift(g.front, 3.4, 0.6), false)}" fill="none" stroke="#2A1622" stroke-opacity="0.5" stroke-width="5" stroke-linecap="round" filter="${u.url('b2')}"/></g>`;
  }
  // bóng mép sau đổ lên đốt phía sau
  if (s.kind !== 'tel' && s.kind !== 'head') {
    out +=
      `<g clip-path="${u.url('bodyClip')}">` +
      `<path d="${pathOf(shift(back, -3.2, 0.8), false)}" fill="none" stroke="#2A1622" stroke-opacity="0.55" stroke-width="5.5" stroke-linecap="round" filter="${u.url('b2')}"/>` +
      `</g>`;
  }
  const mid = shadeColor(albedo(s, 0.5, 0.2, (s.xs + s.xe) / 2), [0, 0.3, 1]);
  out += `<path d="${g.poly}" fill="${mid}"/>`;
  let inner = `<g filter="${u.url('b2')}">${mesh(s)}</g>`;
  inner += mottles(s, 4100 + k * 37);
  if (s.kind === 'per') {
    // đường khớp dọc tách tấm bên (phía gần)
    const sut = lineU(s, 0.805, 0.02, 1);
    inner +=
      `<path d="${pathOf(shift(sut, 0, 1.2), false)}" fill="none" stroke="#FFF6F4" stroke-opacity="0.45" stroke-width="1.1" stroke-linecap="round"/>` +
      `<path d="${pathOf(sut, false)}" fill="none" stroke="#5E3E50" stroke-opacity="0.55" stroke-width="1" stroke-linecap="round"/>`;
  }
  if (s.kind === 'tel') {
    // gờ giữa + 2 rãnh nông hai bên
    const keel = lineU(s, 0.02, 0.08, 0.92, 16);
    const grooveN = lineU(s, 0.36, 0.12, 0.85, 14);
    const grooveF = lineU(s, -0.3, 0.12, 0.85, 14);
    inner +=
      `<path d="${pathOf(shift(keel, 0, 2), false)}" fill="none" stroke="#5A3A4C" stroke-opacity="0.3" stroke-width="2.4" stroke-linecap="round" filter="${u.url('b1')}"/>` +
      `<path d="${pathOf(shift(keel, 0, -0.4), false)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="1.2" stroke-linecap="round"/>` +
      `<path d="${pathOf(grooveN, false)}${pathOf(grooveF, false)}" fill="none" stroke="#6A4658" stroke-opacity="0.22" stroke-width="3.2" stroke-linecap="round" filter="${u.url('b2')}"/>` +
      `<path d="${pathOf(lineU(s, 0.9, 0.05, 0.97, 16), false)}" fill="none" stroke="#FFF4F2" stroke-opacity="0.5" stroke-width="1.2" stroke-linecap="round"/>` +
      `<path d="${pathOf(lineU(s, 0.86, 0.05, 0.97, 16), false)}" fill="none" stroke="#6A4658" stroke-opacity="0.3" stroke-width="1" stroke-linecap="round"/>`;
  }
  // rỗ li ti
  inner += `<path d="${g.poly}" fill="${u.url('pits')}"/>`;
  out += `<g clip-path="${u.url('c' + k)}">${inner}</g>`;
  // viền
  out += `<path d="${g.poly}" fill="none" stroke="${INK}" stroke-opacity="0.6" stroke-width="1.1" stroke-linejoin="round"/>`;
  // gờ sáng ở mép sau (mép đốt xếp chồng)
  if (s.kind !== 'tel' && s.kind !== 'head') {
    out += `<path d="${pathOf(shift(back, 1.3, 0), false)}" fill="none" stroke="${LIP}" stroke-opacity="0.75" stroke-width="1.3" stroke-linecap="round"/>`;
  }
  if (k === 1) {
    out += `<path d="${pathOf(shift(g.front, -1.2, 0), false)}" fill="none" stroke="${LIP}" stroke-opacity="0.85" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  // rim light mép trên
  out += `<path d="${pathOf(shift(g.top, 0, 1.1), false)}" fill="none" stroke="${RIMC}" stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round"/>`;
  return out;
}

// =====================================================================
// MẮT KÉP, GỜ TRÁN, RÂU 1, MẶT DƯỚI ĐẦU
// =====================================================================
const HEAD = SEGS[0];
function compoundEye(sign: number): string {
  // tam giác bo tròn trên mặt đầu (uu dọc đầu, t ngang)
  const tri: [number, number][] = [
    [0.06, 0.6],
    [0.36, 0.56],
    [0.66, 0.6],
    [0.5, 0.8],
    [0.32, 0.95],
    [0.14, 0.84],
  ];
  const pts = tri.map(([uu, t]) => {
    const p = S(HEAD, uu, sign * t);
    return proj([p[0], p[1], p[2] + 0.004]);
  });
  // phía xa: chỉ vẽ nếu mặt mắt quay về người xem
  const n = normalAt(HEAD, 0.36, sign * 0.75);
  if (v3.dot(n, VIEW) < 0.12) return '';
  const d = smoothPath(pts, true, 0.42);
  const c = proj(S(HEAD, 0.34, sign * 0.72));
  const sh = proj(S(HEAD, 0.26, sign * 0.64));
  const eid = sign > 0 ? 'eyeN' : 'eyeF';
  return (
    `<path d="${d}" fill="#3A2A34" opacity="0.6" transform="translate(0 1.2)" filter="${u.url('b1')}"/>` +
    `<path d="${d}" fill="${u.url('eye')}"/>` +
    `<g clip-path="${u.url(eid)}"><rect x="${f(c[0] - 30)}" y="${f(c[1] - 30)}" width="60" height="60" fill="${u.url('facets')}"/>` +
    `<ellipse cx="${f(sh[0])}" cy="${f(sh[1])}" rx="7" ry="3" fill="#C9B8E0" opacity="0.38" transform="rotate(-8 ${f(sh[0])} ${f(sh[1])})" filter="${u.url('b1')}"/></g>` +
    `<path d="${d}" fill="none" stroke="#1E1219" stroke-opacity="0.85" stroke-width="0.9"/>` +
    `<ellipse cx="${f(sh[0] + 1.5)}" cy="${f(sh[1] - 0.5)}" rx="2.3" ry="1.1" fill="#FFFFFF" opacity="0.92" transform="rotate(-12 ${f(sh[0] + 1.5)} ${f(sh[1] - 0.5)})"/>` +
    `<circle cx="${f(c[0] + 4)}" cy="${f(c[1] + 2.4)}" r="0.7" fill="#FFFFFF" opacity="0.6"/>`
  );
}
function eyeClip(sign: number): string {
  const tri: [number, number][] = [
    [0.06, 0.6],
    [0.36, 0.56],
    [0.66, 0.6],
    [0.5, 0.8],
    [0.32, 0.95],
    [0.14, 0.84],
  ];
  const pts = tri.map(([uu, t]) => {
    const p = S(HEAD, uu, sign * t);
    return proj([p[0], p[1], p[2] + 0.004]);
  });
  return `<clipPath id="${u(sign > 0 ? 'eyeN' : 'eyeF')}"><path d="${smoothPath(pts, true, 0.42)}"/></clipPath>`;
}

function headDetails(): string {
  // gờ trắng mép trước đầu, vòng qua trên mắt (ref5)
  const ridge = lineT(HEAD, 0.06, -0.56, 0.6, 24);
  const browN = [
    [0.05, 0.56],
    [0.3, 0.52],
    [0.55, 0.53],
    [0.85, 0.57],
  ].map(([uu, t]) => proj(S(HEAD, uu, t)));
  return (
    `<path d="${pathOf(shift(ridge, 0, 1.4), false)}" fill="none" stroke="#5A3A4A" stroke-opacity="0.4" stroke-width="1.6" stroke-linecap="round" filter="${u.url('b1')}"/>` +
    `<path d="${pathOf(ridge, false)}" fill="none" stroke="#F7EEEC" stroke-opacity="0.85" stroke-width="1.8" stroke-linecap="round"/>` +
    `<path d="${smoothPath(browN)}" fill="none" stroke="#F7EEEC" stroke-opacity="0.7" stroke-width="1.4" stroke-linecap="round"/>` +
    compoundEye(-1) +
    compoundEye(1)
  );
}

/** mặt dưới đầu: khe tối dưới mép trán (ref5) */
function face(): string {
  const front = lineT(HEAD, 0, -0.3, 1, 16);
  const low = front.map(([x, y], i): P => [x + 1.5 - i * 0.2, y + 5 + i * 0.25]);
  const dark = pathOf([...front, ...low.reverse()]);
  return `<path d="${dark}" fill="#3A2532" opacity="0.85" filter="${u.url('b1')}"/>`;
}

// =====================================================================
// CHI: chân bò, râu, chân đuôi, gai đuôi
// =====================================================================
/** Catmull-Rom 3D rồi chiếu */
function spline3(pts: V3[], n: number): P[] {
  const out: P[] = [];
  const seg = pts.length - 1;
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * seg;
    const k = Math.min(seg - 1, Math.floor(s));
    const t = s - k;
    const p0 = pts[Math.max(0, k - 1)];
    const p1 = pts[k];
    const p2 = pts[k + 1];
    const p3 = pts[Math.min(seg, k + 2)];
    const t2 = t * t;
    const t3 = t2 * t;
    const c = (j: number) =>
      0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
    out.push(proj([c(0), c(1), c(2)]));
  }
  return out;
}

/** dải thuôn dọc polyline; trả về path + 2 mép + pháp tuyến */
function taper(pts: P[], wf: (s: number) => number) {
  const n = pts.length;
  const cum: number[] = [0];
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[n - 1] || 1;
  const left: P[] = [];
  const right: P[] = [];
  const nrm: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    const nx = -ty / l;
    const ny = tx / l;
    const w = Math.max(0.3, wf(cum[i] / total)) / 2;
    left.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
    right.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    nrm.push([nx, ny]);
  }
  const d = pathOf([...left, ...right.slice().reverse()]);
  return { d, left, right, nrm, cum, total };
}
const at = (arr: P[], cum: number[], total: number, s: number) => {
  const target = s * total;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < target) i++;
  return i;
};

const LEG_X = [0.11, 0.188, 0.258, 0.327, 0.397, 0.466, 0.536];
const LEG_DK = [-0.026, -0.018, -0.01, 0.0, 0.008, 0.016, 0.022];
const LEG_DT = [-0.07, -0.05, -0.03, -0.006, 0.02, 0.04, 0.058];
const LEG_LIFT = [0.004, 0, 0.002, 0, 0.003, 0, 0.002];

function legGeom(i: number) {
  const xc = LEG_X[i];
  const w = wB(xc);
  const base: V3 = [xc, w * 0.62, -0.012];
  const knee: V3 = [xc + LEG_DK[i], w + 0.024, -0.026];
  const ank: V3 = [xc + LEG_DK[i] + (LEG_DT[i] - LEG_DK[i]) * 0.62, w + 0.05, -0.058 + LEG_LIFT[i]];
  const tip: V3 = [xc + LEG_DT[i], w + 0.058, GROUND + LEG_LIFT[i]];
  return { base, knee, ank, tip };
}

function legSvg(i: number): string {
  const g = legGeom(i);
  const pts = spline3([g.base, g.knee, g.ank, g.tip], 30);
  const sK = 0.42;
  const sA = 0.74;
  const wf = (s: number) => {
    const core = s < sK ? 11.5 - 1.5 * (s / sK) : s < sA ? 9.6 - 2.6 * ((s - sK) / (sA - sK)) : 6.8 - 5.4 * Math.pow((s - sA) / (1 - sA), 0.9);
    const dip = 1 - 0.22 * Math.exp(-Math.pow((s - sK) / 0.035, 2)) - 0.22 * Math.exp(-Math.pow((s - sA) / 0.03, 2));
    return core * dip;
  };
  const T = taper(pts, wf);
  // mép "trước" (hướng đầu, sáng) / "sau" (tối)
  const frontIsLeft = T.left[Math.floor(T.left.length / 2)][0] > T.right[Math.floor(T.right.length / 2)][0];
  const lit = frontIsLeft ? T.left : T.right;
  const dk = frontIsLeft ? T.right : T.left;
  const kI = at(pts, T.cum, T.total, sK);
  const aI = at(pts, T.cum, T.total, sA);
  const clawI = at(pts, T.cum, T.total, 0.86);
  const joint = (idx: number) => `M${f(T.left[idx][0])} ${f(T.left[idx][1])}L${f(T.right[idx][0])} ${f(T.right[idx][1])}`;
  // gai mảnh ở mép sau đốt chân
  let spines = '';
  for (const s of [0.5, 0.58, 0.66, 0.79]) {
    const idx = at(pts, T.cum, T.total, s);
    const p = dk[idx];
    const nn = T.nrm[idx];
    const sg = frontIsLeft ? -1 : 1;
    const ox = nn[0] * sg;
    const oy = nn[1] * sg;
    spines += `M${f(p[0] - oy * 0.9)} ${f(p[1] + ox * 0.9)}L${f(p[0] + ox * 3.2 + oy * 0.6)} ${f(p[1] + oy * 3.2 - ox * 0.6 + 0.8)}L${f(p[0] + oy * 0.9)} ${f(p[1] - ox * 0.9)}Z`;
  }
  const claw = pathOf([...T.left.slice(clawI), ...T.right.slice(clawI).reverse()]);
  return (
    `<path d="${T.d}" fill="${u.url('leg')}" stroke="${INK}" stroke-opacity="0.55" stroke-width="0.8" stroke-linejoin="round"/>` +
    `<path d="${claw}" fill="#8A5E62"/>` +
    `<path d="${spines}" fill="#E8D8D2" stroke="${INK}" stroke-opacity="0.4" stroke-width="0.4"/>` +
    `<path d="${joint(kI)}${joint(aI)}" stroke="#7E4E5C" stroke-opacity="0.75" stroke-width="1.3" fill="none"/>` +
    `<path d="${pathOf(shift(lit.slice(2, clawI), 0, 0), false)}" fill="none" stroke="#FFF6F2" stroke-opacity="0.65" stroke-width="0.9" stroke-linecap="round"/>` +
    `<path d="${pathOf(dk.slice(2, clawI), false)}" fill="none" stroke="#6E4252" stroke-opacity="0.45" stroke-width="1" stroke-linecap="round"/>`
  );
}

/** râu 2 (dài, nhiều đốt) */
function antenna(pts3: V3[], wBase: number, far: boolean): string {
  const pts = spline3(pts3, 80);
  const PED = 0.3;
  const wf = (s: number) => (s < PED ? wBase * (1 - 0.38 * (s / PED)) : wBase * 0.5 * Math.pow(1 - (s - PED) / (1 - PED), 0.8) + 0.5);
  const T = taper(pts, wf);
  let rings = '';
  // khớp các đốt cuống râu
  for (const s of [0.06, 0.12, 0.2, PED]) {
    const i = at(pts, T.cum, T.total, s);
    rings += `M${f(T.left[i][0])} ${f(T.left[i][1])}L${f(T.right[i][0])} ${f(T.right[i][1])}`;
  }
  // các vòng đốt roi râu
  const step = 4.2;
  for (let d = PED * T.total + step; d < T.total - 2; d += step) {
    const i = at(pts, T.cum, T.total, d / T.total);
    rings += `M${f(T.left[i][0])} ${f(T.left[i][1])}L${f(T.right[i][0])} ${f(T.right[i][1])}`;
  }
  const fill = far ? '#A98A8A' : '#DDB8AE';
  const hi = far ? '#E2CFCB' : '#FFF4EE';
  return (
    `<path d="${T.d}" fill="${fill}" stroke="${INK}" stroke-opacity="0.55" stroke-width="0.7" stroke-linejoin="round"/>` +
    `<path d="${rings}" fill="none" stroke="#7A4F58" stroke-opacity="0.6" stroke-width="0.6"/>` +
    `<path d="${pathOf(T.left.slice(1, -3), false)}" fill="none" stroke="${hi}" stroke-opacity="0.6" stroke-width="0.7" stroke-linecap="round"/>`
  );
}
const A2_NEAR: V3[] = [
  [0.006, 0.05, 0.004],
  [-0.022, 0.09, -0.004],
  [-0.052, 0.13, -0.01],
  [-0.1, 0.17, -0.034],
  [-0.15, 0.215, -0.064],
  [-0.19, 0.25, -0.078],
  [-0.205, 0.29, -0.078],
];
const A2_FAR: V3[] = [
  [0.006, -0.05, 0.006],
  [-0.022, -0.09, 0.008],
  [-0.055, -0.12, 0.01],
  [-0.11, -0.15, 0.0],
  [-0.165, -0.18, -0.03],
  [-0.21, -0.21, -0.06],
  [-0.235, -0.24, -0.074],
];

/** râu 1 (ngắn, đốt to trắng) */
function antennule(sign: number): string {
  const pts = spline3(
    [
      [0.01, sign * 0.026, 0.006],
      [-0.012, sign * 0.036, 0.016],
      [-0.03, sign * 0.046, 0.01],
      [-0.044, sign * 0.054, -0.004],
    ],
    24,
  );
  const T = taper(pts, (s) => (s < 0.7 ? 4.6 - 1.6 * s : 3.5 - 7 * (s - 0.7)));
  let rings = '';
  for (const s of [0.28, 0.55, 0.72, 0.85]) {
    const i = at(pts, T.cum, T.total, s);
    rings += `M${f(T.left[i][0])} ${f(T.left[i][1])}L${f(T.right[i][0])} ${f(T.right[i][1])}`;
  }
  const far = sign < 0;
  return (
    `<path d="${T.d}" fill="${far ? '#B39A9E' : '#DCC8C6'}" stroke="${INK}" stroke-opacity="0.55" stroke-width="0.7"/>` +
    `<path d="${rings}" fill="none" stroke="#7A4F58" stroke-opacity="0.55" stroke-width="0.7"/>` +
    `<path d="${pathOf(T.left.slice(1, -2), false)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="0.8"/>`
  );
}

const TEL = SEGS[SEGS.length - 1];
/** chân đuôi (uropod): 2 nhánh mái chèo, viền gai */
function uropod(sign: number): string {
  const wT = (x: number) => 0.176 - 0.046 * Math.pow(clamp((x - 0.74) / 0.18), 1.3);
  const ramus = (pts: [number, number][], drop: number): P[] =>
    pts.map(([x, dz]) => proj([x, sign * (wT(x) - 0.012 + dz * 0.8), -0.03 - drop * dz - 0.06 * (x - 0.76)]));
  // nhánh ngoài (exopod) – hẹp; nhánh trong (endopod) – rộng, tròn
  const exo = ramus(
    [
      [0.762, 0.012],
      [0.79, 0.05],
      [0.85, 0.068],
      [0.91, 0.066],
      [0.945, 0.05],
      [0.93, 0.03],
      [0.86, 0.026],
      [0.8, 0.018],
    ],
    0.3,
  );
  const endo = ramus(
    [
      [0.77, -0.006],
      [0.82, 0.02],
      [0.89, 0.034],
      [0.955, 0.03],
      [0.975, 0.006],
      [0.95, -0.02],
      [0.87, -0.024],
      [0.8, -0.02],
    ],
    0.3,
  );
  const far = sign < 0;
  const fringe = (pts: P[], from: number, to: number) => {
    let d = '';
    const c = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length] as P, [0, 0] as P);
    for (let i = from; i < to; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      for (let k = 0; k < 4; k++) {
        const s = (k + 0.5) / 4;
        const p: P = [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
        const dx = p[0] - c[0];
        const dy = p[1] - c[1];
        const l = Math.hypot(dx, dy) || 1;
        d += `M${f(p[0])} ${f(p[1])}l${f((dx / l) * 3.2)} ${f((dy / l) * 3.2)}`;
      }
    }
    return d;
  };
  const fr = fringe(endo, 1, 6) + fringe(exo, 1, 5);
  return (
    `<path d="${fr}" fill="none" stroke="${far ? '#B79A98' : '#EADCD6'}" stroke-opacity="0.85" stroke-width="0.8" stroke-linecap="round"/>` +
    `<path d="${smoothPath(endo, true, 0.45)}" fill="${u.url(far ? 'uroF' : 'uroN')}" stroke="${INK}" stroke-opacity="0.6" stroke-width="0.9"/>` +
    `<path d="${smoothPath(exo, true, 0.45)}" fill="${u.url(far ? 'uroF' : 'uroN')}" stroke="${INK}" stroke-opacity="0.6" stroke-width="0.9"/>` +
    (far
      ? ''
      : `<path d="${smoothPath(exo.slice(1, 5))}" fill="none" stroke="#FFF2EE" stroke-opacity="0.5" stroke-width="1"/>` +
        `<path d="${smoothPath(endo.slice(1, 5))}" fill="none" stroke="#FFF2EE" stroke-opacity="0.45" stroke-width="1"/>`)
  );
}

/** hàng gai ở mép sau tấm đuôi */
function telSpines(): string {
  let d = '';
  let hi = '';
  const N = 11;
  for (let k = 0; k < N; k++) {
    const t = -0.82 + (1.64 * k) / (N - 1);
    const B = S(TEL, 1, t);
    const Bp = S(TEL, 1, t + 0.02);
    const Bm = S(TEL, 1, t - 0.02);
    const T = v3.norm(v3.sub(Bp, Bm));
    // pháp tuyến ra ngoài trong mặt phẳng x-z
    let nx = T[1];
    let nz = -T[0];
    if (nx < 0) {
      nx = -nx;
      nz = -nz;
    }
    const len = 0.024 - 0.008 * Math.abs(t);
    const hw = 0.0055;
    const b0 = proj([B[0] - T[0] * hw, B[1] - T[1] * hw, B[2]]);
    const b1 = proj([B[0] + T[0] * hw, B[1] + T[1] * hw, B[2]]);
    const tip = proj([B[0] + nx * len, B[1] + nz * len, B[2] + 0.006]);
    d += `M${f(b0[0])} ${f(b0[1])}L${f(tip[0])} ${f(tip[1])}L${f(b1[0])} ${f(b1[1])}Z`;
    const m: P = [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2];
    hi += `M${f(m[0])} ${f(m[1] - 0.3)}L${f(m[0] + (tip[0] - m[0]) * 0.7)} ${f(m[1] + (tip[1] - m[1]) * 0.7 - 0.3)}`;
  }
  return (
    `<path d="${d}" fill="${u.url('spine')}" stroke="${INK}" stroke-opacity="0.6" stroke-width="0.6" stroke-linejoin="round"/>` +
    `<path d="${hi}" fill="none" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="0.6" stroke-linecap="round"/>`
  );
}

// =====================================================================
// THÂN (lớp uốn – với bendAmp 0 thì đứng yên)
// =====================================================================
function bodySvg(): string {
  let out = uropod(-1) + uropod(1) + telSpines();
  out += face();
  // từ đuôi lên; đầu vẽ trước đốt ngực 1 (mép trước đốt 1 ôm đè lên đầu)
  const order = [...SEGS.map((_, k) => k).slice(2).reverse(), 0, 1];
  for (const k of order) out += drawSeg(SEGS[k], k);
  out += headDetails();
  out += antennule(-1) + antennule(1);
  // bóng khối tổng: tối dần về phía đuôi & bụng, ánh sáng đèn từ phía trước
  out += `<g clip-path="${u.url('bodyClip')}"><path d="${BODY_UNION}" fill="${u.url('vol')}"/></g>`;
  return out;
}

// =====================================================================
// NỀN BÙN BIỂN SÂU (chỉ trên thẻ Sổ tay)
// =====================================================================
function ground(): string {
  const c = proj([0.46, 0.06, GROUND]);
  const r = rng(9031);
  let grains = '';
  let lights = '';
  for (let i = 0; i < 110; i++) {
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r());
    const x = c[0] + Math.cos(a) * rad * 330;
    const y = c[1] + 6 + Math.sin(a) * rad * 70;
    const s = 0.6 + r() * 1.4;
    const e = `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * 1.5)}" ry="${f(s * 0.65)}"/>`;
    if (i % 3) grains += e;
    else lights += e;
  }
  // tuyết biển trôi lơ lửng
  let snow = '';
  for (let i = 0; i < 46; i++) {
    const x = 20 + r() * 690;
    const y = 12 + r() * 230;
    snow += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.5 + r() * 1.1)}"/>`;
  }
  // vết chân bò để lại phía sau
  let tracks = '';
  for (let i = 0; i < 9; i++) {
    const x = proj([1.02 + i * 0.035, 0, 0])[0];
    for (const z of [0.26, -0.2]) {
      const p = proj([1.0 + i * 0.035, z, GROUND]);
      if (x < 22) continue;
      tracks += `<ellipse cx="${f(p[0] - (i % 2) * 6)}" cy="${f(p[1])}" rx="2.4" ry="1"/>`;
    }
  }
  return (
    `<ellipse cx="${f(c[0])}" cy="${f(c[1] + 4)}" rx="350" ry="80" fill="${u.url('mud')}"/>` +
    `<g fill="#1E1A20" fill-opacity="0.45">${grains}</g><g fill="#A9A0A4" fill-opacity="0.35">${lights}</g>` +
    `<g fill="#1A1418" fill-opacity="0.5">${tracks}</g>` +
    `<ellipse cx="${f(c[0] + 6)}" cy="${f(c[1] - 2)}" rx="${f(0.5 * L)}" ry="34" fill="${u.url('shadow')}"/>` +
    `<g fill="#DDE8FF" fill-opacity="0.35">${snow}</g>`
  );
}

// =====================================================================
// DEFS
// =====================================================================
const defs = joinDefs(
  blurFilter(u('b1'), 0.9),
  blurFilter(u('b2'), 1.8),
  ...GEOM.map((g, k) => `<clipPath id="${u('c' + k)}"><path d="${g.poly}"/></clipPath>`),
  `<clipPath id="${u('bodyClip')}">${GEOM.map((g) => `<path d="${g.poly}"/>`).join('')}</clipPath>`,
  eyeClip(1),
  eyeClip(-1),
  // rỗ li ti trên giáp (ref4)
  `<pattern id="${u('pits')}" width="3.6" height="3.1" patternUnits="userSpaceOnUse" patternTransform="rotate(12)"><circle cx="0.9" cy="0.8" r="0.42" fill="#4A2C3C" fill-opacity="0.1"/><circle cx="2.7" cy="2.3" r="0.36" fill="#4A2C3C" fill-opacity="0.07"/><circle cx="2.5" cy="0.4" r="0.3" fill="#FFFFFF" fill-opacity="0.12"/></pattern>`,
  // ô mắt kép
  `<pattern id="${u('facets')}" width="2.2" height="1.9" patternUnits="userSpaceOnUse" patternTransform="rotate(-10)"><circle cx="0.55" cy="0.5" r="0.62" fill="#8E7C96" fill-opacity="0.32"/><circle cx="1.65" cy="1.45" r="0.62" fill="#8E7C96" fill-opacity="0.32"/></pattern>`,
  radial(
    u('eye'),
    [
      [0, '#5A4654'],
      [0.55, '#3A2A36'],
      [1, '#1F151C'],
    ],
    { cx: 0.42, cy: 0.35, r: 0.75 },
  ),
  linear(
    u('leg'),
    [
      [0, '#F0E6E1'],
      [0.55, '#DCC6C1'],
      [1, '#BE9FA2'],
    ],
    { x1: 0, y1: 0, x2: 0, y2: 1 },
  ),
  linear(
    u('uroN'),
    [
      [0, '#CDB0AE'],
      [0.5, '#B8979A'],
      [1, '#8E6F7E'],
    ],
    { x1: 0, y1: 0, x2: 0.3, y2: 1 },
  ),
  linear(
    u('uroF'),
    [
      [0, '#9E7C82'],
      [1, '#6E5060'],
    ],
  ),
  linear(
    u('spine'),
    [
      [0, '#F2E6DE'],
      [1, '#BE9C96'],
    ],
  ),
  // bóng khối tổng (đèn chiếu từ phía trước-trên): sáng nhẹ đầu-vai, tối dần về đuôi & mép dưới
  linear(
    u('vol'),
    [
      [0, '#000000', 0.32],
      [0.35, '#000000', 0.08],
      [0.7, '#FFFFFF', 0],
      [1, '#FFFFFF', 0.06],
    ],
    { x1: X0 - L, y1: 0, x2: X0, y2: 0, user: true },
  ),
  radial(
    u('mud'),
    [
      [0, '#5C5458', 0.95],
      [0.55, '#4A4448', 0.8],
      [0.85, '#3A353A', 0.4],
      [1, '#2E2A30', 0],
    ],
  ),
  radial(
    u('shadow'),
    [
      [0, '#08050A', 0.7],
      [0.65, '#08050A', 0.45],
      [1, '#08050A', 0],
    ],
  ),
);

// =====================================================================
// LỚP
// =====================================================================
const legLayers: ArtLayer[] = LEG_X.map((_, i) => {
  const k = proj(legGeom(i).knee);
  return {
    name: `leg${i + 1}`,
    role: 'detail',
    bend: false,
    z: 'back',
    pivot: [Math.round(k[0]), Math.round(k[1])] as [number, number],
    // bò luân phiên: chân chẵn/lẻ ngược pha, thêm sóng lan nhẹ từ trước ra sau
    anim: { type: 'rotate', amp: 0.13, phase: (i % 2) * Math.PI + i * 0.35 },
    svg: legSvg(i),
  };
});
const a2nBase = proj(A2_NEAR[0]);
const a2fBase = proj(A2_FAR[0]);

const art: CreatureArt = {
  id: ID,
  viewBox: [730, 256],
  lengthUnits: L,
  spineY: Y0,
  animation: 'static',
  cycleHz: 0.35,
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
      pivot: [365, 200],
      anim: { type: 'none', amp: 0 },
      svg: ground(),
    },
    {
      name: 'antennaFar',
      role: 'tentacle',
      bend: false,
      z: 'back',
      pivot: [Math.round(a2fBase[0]), Math.round(a2fBase[1])],
      anim: { type: 'rotate', amp: 0.035, speed: 0.55, phase: 1.3 },
      svg: antenna(A2_FAR, 4.6, true),
    },
    ...legLayers,
    { name: 'body', role: 'body', svg: bodySvg() },
    {
      name: 'antennaNear',
      role: 'tentacle',
      bend: false,
      z: 'front',
      pivot: [Math.round(a2nBase[0]), Math.round(a2nBase[1])],
      anim: { type: 'rotate', amp: 0.03, speed: 0.55 },
      svg: antenna(A2_NEAR, 5.4, false),
    },
  ],
};

export default art;
