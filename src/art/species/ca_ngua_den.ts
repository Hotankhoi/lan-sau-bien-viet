/**
 * Cá ngựa đen – Hippocampus kuda (Vịnh Bắc Bộ, hiếm)
 * Dáng dựng đứng, đầu quay phải. Thân dựng từ một "đường sống" (spline) + nửa bề rộng lưng/bụng,
 * nên các đốt vòng xương, gờ dọc và nốt sần luôn bám đúng theo thân kể cả ở đoạn đuôi cuộn xoắn.
 * Đặc điểm nhận dạng: mõm ống dài chúc xuống, vành "mũ miện" thấp trên đỉnh đầu, cổ cong, bụng phệ ra trước,
 * 11 đốt thân + chuỗi đốt đuôi nhỏ dần, đuôi cuộn tròn về phía bụng; màu nâu đen – vàng nâu lấm tấm chấm sáng;
 * vây lưng nhỏ trong suốt (rung rất nhanh), vây ngực nhỏ sau nắp mang.
 * Trên thẻ Sổ tay: đuôi quấn vào một cọng cỏ biển (lớp cardOnly).
 */
import type { CreatureArt } from '../contract';
import { makeIds, eye, linear, radial, joinDefs, rng, blurFilter, smoothPath } from '../style-bible';

const ID = 'ca_ngua_den';
const u = makeIds(ID);
type P = [number, number];
const DEG = Math.PI / 180;
const f = (n: number): string => n.toFixed(1);
const poly = (pts: P[], close = true): string => 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + (close ? 'Z' : '');

// ---------- Màu ----------
const INK = '#0d0805';
const OCHRE = '#b8975a';
const PALE = '#efe3b8';

// =====================================================================
// ĐƯỜNG SỐNG: cổ → thân → đuôi → vòng xoắn
// =====================================================================
interface St {
  x: number;
  y: number;
  wd: number; // nửa bề rộng phía lưng (bên trái)
  wv: number; // nửa bề rộng phía bụng (bên phải)
}
interface Sm extends St {
  s: number;
  tx: number;
  ty: number;
}

/** vòng xoắn đuôi: xoắn logarit, cuộn về phía bụng */
const SP = { cx: 220, cy: 474, r0: 66, r1: 10, sweep: 450 };
const KK = Math.log(SP.r0 / SP.r1) / (SP.sweep * DEG);

const KEYS: St[] = [
  { x: 188, y: 60, wd: 18, wv: 18 }, // trong đầu
  { x: 150, y: 88, wd: 20, wv: 24 }, // gáy
  { x: 140, y: 120, wd: 26, wv: 27 }, // cổ
  { x: 140, y: 158, wd: 31, wv: 38 }, // ngực
  { x: 146, y: 200, wd: 36, wv: 55 },
  { x: 154, y: 240, wd: 38, wv: 61 }, // bụng phệ nhất
  { x: 160, y: 275, wd: 34, wv: 50 },
  { x: 158, y: 306, wd: 24, wv: 25 }, // hết thân
  { x: 155, y: 340, wd: 19, wv: 19 },
  { x: 152, y: 385, wd: 16, wv: 16 },
  { x: 150, y: 425, wd: 13.5, wv: 13.5 },
  { x: 151, y: 452, wd: 12, wv: 12 },
];
const TRUNK_END_KEY = 7;
for (let phi = 0; phi <= SP.sweep + 0.01; phi += 25) {
  const p = phi / SP.sweep;
  const R = SP.r0 * Math.exp(-KK * phi * DEG);
  const th = (180 - phi) * DEG;
  const w = 9.5 * Math.pow(Math.max(0, 1 - p), 0.85) + 2.4;
  KEYS.push({ x: SP.cx + R * Math.cos(th), y: SP.cy + R * Math.sin(th), wd: w, wv: w });
}

const SUB = 10;
function cr(a: number, b: number, c: number, d: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
}
const DENSE: Sm[] = [];
{
  const K = KEYS.length;
  const key = (i: number): St => KEYS[Math.max(0, Math.min(K - 1, i))];
  for (let i = 0; i < K - 1; i++) {
    for (let j = 0; j < SUB; j++) {
      const t = j / SUB;
      const g = (k: keyof St): number => cr(key(i - 1)[k], key(i)[k], key(i + 1)[k], key(i + 2)[k], t);
      DENSE.push({ x: g('x'), y: g('y'), wd: Math.max(1.5, g('wd')), wv: Math.max(1.5, g('wv')), s: 0, tx: 0, ty: 1 });
    }
  }
  DENSE.push({ ...KEYS[K - 1], s: 0, tx: 0, ty: 1 });
  for (let i = 1; i < DENSE.length; i++) DENSE[i].s = DENSE[i - 1].s + Math.hypot(DENSE[i].x - DENSE[i - 1].x, DENSE[i].y - DENSE[i - 1].y);
  for (let i = 0; i < DENSE.length; i++) {
    const a = DENSE[Math.max(0, i - 1)];
    const b = DENSE[Math.min(DENSE.length - 1, i + 1)];
    const n = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    DENSE[i].tx = (b.x - a.x) / n;
    DENSE[i].ty = (b.y - a.y) / n;
  }
}
const S_END = DENSE[DENSE.length - 1].s;

function at(s: number): Sm {
  const ss = Math.max(0, Math.min(S_END, s));
  let lo = 0;
  let hi = DENSE.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (DENSE[mid].s <= ss) lo = mid;
    else hi = mid;
  }
  const a = DENSE[lo];
  const b = DENSE[hi];
  const k = b.s > a.s ? (ss - a.s) / (b.s - a.s) : 0;
  const L = (p: number, q: number): number => p + (q - p) * k;
  const tx = L(a.tx, b.tx);
  const ty = L(a.ty, b.ty);
  const n = Math.hypot(tx, ty) || 1;
  return { x: L(a.x, b.x), y: L(a.y, b.y), wd: L(a.wd, b.wd), wv: L(a.wv, b.wv), s: ss, tx: tx / n, ty: ty / n };
}
/** điểm lệch ngang thân: t = 1 mép lưng, 0 đường sống, −1 mép bụng; extra = cộng thêm (đơn vị viewBox) ra phía ngoài */
function lat(m: Sm, t: number, extra = 0): P {
  const off = t >= 0 ? t * m.wd + (t > 0 ? extra : 0) : t * m.wv - extra;
  return [m.x - m.ty * off, m.y + m.tx * off];
}

// ---------- vị trí các đốt ----------
const S_A = DENSE[SUB].s + 8; // đốt thân đầu tiên (sau gáy)
const S_B = DENSE[TRUNK_END_KEY * SUB].s; // hết thân
const TRUNK_RINGS = 11;
const RINGS: number[] = [];
for (let i = 0; i <= TRUNK_RINGS; i++) RINGS.push(S_A + ((S_B - S_A) * i) / TRUNK_RINGS);
{
  let s = S_B;
  for (;;) {
    const m = at(s);
    s += Math.max(4.2, Math.min(13, 0.42 * (m.wd + m.wv)));
    if (s > S_END - 5) break;
    RINGS.push(s);
  }
}

// ---------- đường bao thân (gồ lên ở mỗi đốt) ----------
const D_PTS: P[] = [];
const V_PTS: P[] = [];
for (let s = 0; s < RINGS[0] - 4; s += 8) {
  const m = at(s);
  D_PTS.push(lat(m, 1));
  V_PTS.push(lat(m, -1));
}
RINGS.forEach((s, i) => {
  const m = at(s);
  const trunk = i <= TRUNK_RINGS;
  D_PTS.push(lat(m, 1, trunk ? 2.8 : 0.6 + 0.07 * m.wd));
  V_PTS.push(lat(m, -1, trunk ? 1.5 : 0.5 + 0.06 * m.wv));
  if (i < RINGS.length - 1) {
    const mm = at((s + RINGS[i + 1]) / 2);
    D_PTS.push(lat(mm, 1, trunk ? -0.8 : -0.3));
    V_PTS.push(lat(mm, -1, trunk ? -0.4 : -0.3));
  }
});
const TIP_M = at(S_END);
const TIP: P = [TIP_M.x + TIP_M.tx * 2.5, TIP_M.y + TIP_M.ty * 2.5];
const BODY = smoothPath([...D_PTS, TIP, ...V_PTS.slice().reverse()], true, 0.5);

function latLine(t: (s: number) => number, s0: number, s1: number, step = 6): P[] {
  const pts: P[] = [];
  for (let s = s0; s < s1; s += step) pts.push(lat(at(s), t(s)));
  pts.push(lat(at(s1), t(s1)));
  return pts;
}
function band(t0: number, t1: number, s0: number, s1: number): string {
  return poly([...latLine(() => t0, s0, s1), ...latLine(() => t1, s0, s1).reverse()]);
}

const ridge1T = (s: number): number => (s < S_B ? 0.46 : Math.max(0.1, 0.46 - ((s - S_B) / 110) * 0.36));
const RIDGE2_T = -0.5;

function bodySvg(): string {
  // --- đốt vòng xương: gờ sáng + rãnh tối ngay dưới ---
  let ringL = '';
  let ringD = '';
  let nodes = '';
  let nodeHi = '';
  let edgeDots = '';
  const node = (p: P, r: number): void => {
    nodes += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${r.toFixed(2)}"/>`;
    nodeHi += `<circle cx="${f(p[0] - r * 0.3)}" cy="${f(p[1] - r * 0.35)}" r="${(r * 0.45).toFixed(2)}"/>`;
  };
  RINGS.forEach((s, i) => {
    const m = at(s);
    const trunk = i <= TRUNK_RINGS;
    const k = 0.15 * (m.wd + m.wv);
    const A = lat(m, 1);
    const B = lat(m, -1);
    const C: P = [m.x + m.tx * k, m.y + m.ty * k];
    ringL += `M${f(A[0])} ${f(A[1])}Q${f(C[0])} ${f(C[1])} ${f(B[0])} ${f(B[1])}`;
    const o = trunk ? 1.6 : 1.1;
    ringD += `M${f(A[0] + m.tx * o)} ${f(A[1] + m.ty * o)}Q${f(C[0] + m.tx * o)} ${f(C[1] + m.ty * o)} ${f(B[0] + m.tx * o)} ${f(B[1] + m.ty * o)}`;
    // nốt sần ở chỗ đốt cắt gờ dọc
    const t1 = ridge1T(s);
    const q = (tt: number): P => {
      // điểm trên cung đốt (Bezier bậc 2 A–C–B) ứng với vị trí ngang tt
      const w = tt >= 0 ? 0.5 - 0.5 * tt : 0.5 + 0.5 * -tt;
      const a = 1 - w;
      return [a * a * A[0] + 2 * a * w * C[0] + w * w * B[0], a * a * A[1] + 2 * a * w * C[1] + w * w * B[1]];
    };
    node(q(t1), Math.max(0.9, Math.min(2.7, 0.085 * m.wd + 0.5)));
    if (trunk && i > 0 && i < TRUNK_RINGS) node(q(RIDGE2_T), Math.max(1.2, Math.min(2.4, 0.045 * m.wv + 0.5)));
    const e = lat(m, 1, -1.6);
    edgeDots += `<circle cx="${f(e[0])}" cy="${f(e[1])}" r="${trunk ? 1.5 : Math.max(0.6, 0.09 * m.wd).toFixed(2)}"/>`;
  });

  // --- gờ dọc ---
  const ridge1 = smoothPath(latLine(ridge1T, S_A - 6, S_END - 26, 7));
  const ridge2 = smoothPath(latLine(() => RIDGE2_T, S_A + 14, S_B - 2, 7));

  // --- lấm tấm chấm sáng + chấm sẫm ---
  const r = rng(1907);
  let pale = '';
  let dark = '';
  for (let i = 0; i < 230; i++) {
    const m = at(S_A - 14 + r() * (S_END - S_A - 6));
    const p = lat(m, (r() * 2 - 1) * 0.9);
    const rr = Math.min(1.25, 0.45 + r() * 0.035 * (m.wd + m.wv));
    if (i % 4 === 3) dark += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${(rr * 1.1).toFixed(2)}"/>`;
    else pale += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${rr.toFixed(2)}"/>`;
  }

  // --- vây hậu môn bé xíu dưới bụng ---
  const am = at(S_B + 5);
  const ab = lat(am, -1, -3);
  const anal = `<path d="M${f(ab[0] - 3)} ${f(ab[1] - 5)}Q${f(ab[0] + 11)} ${f(ab[1] + 1)} ${f(ab[0] + 9)} ${f(ab[1] + 11)}Q${f(ab[0] + 2)} ${f(ab[1] + 8)} ${f(ab[0] - 3)} ${f(ab[1] + 5)}Z" fill="#cdbb86" fill-opacity="0.6" stroke="${PALE}" stroke-opacity="0.5" stroke-width="0.6"/>`;

  const rim = smoothPath(D_PTS.filter((_, i) => i > 2 && i < 46));
  return (
    anal +
    `<path d="${BODY}" fill="${u.url('bodyFill')}"/>` +
    `<g clip-path="${u.url('bodyClip')}">` +
    // bụng vàng nâu sáng hơn, sườn lưng hắt sáng, mép tối tạo khối
    `<path d="${band(-0.2, -0.92, S_A + 6, S_B + 6)}" fill="#a07f46" fill-opacity="0.55" filter="${u.url('b6')}"/>` +
    `<path d="${band(0.08, 0.6, S_A - 20, S_END - 10)}" fill="#8a7046" fill-opacity="0.5" filter="${u.url('b3')}"/>` +
    `<path d="${BODY}" fill="none" stroke="#060302" stroke-opacity="0.75" stroke-width="9" filter="${u.url('b3')}"/>` +
    `<path d="${ringD}" fill="none" stroke="#070402" stroke-opacity="0.6" stroke-width="1.5"/>` +
    `<path d="${ringL}" fill="none" stroke="${OCHRE}" stroke-opacity="0.6" stroke-width="1.2"/>` +
    `<path d="${ridge1}" fill="none" stroke="#070402" stroke-opacity="0.4" stroke-width="2.6" transform="translate(1.2 0.8)"/>` +
    `<path d="${ridge1}" fill="none" stroke="${OCHRE}" stroke-opacity="0.7" stroke-width="1.5" stroke-linecap="round"/>` +
    `<path d="${ridge2}" fill="none" stroke="#d9bd7c" stroke-opacity="0.55" stroke-width="1.3" stroke-linecap="round"/>` +
    `<g fill="#090503" fill-opacity="0.55">${dark}</g>` +
    `<g fill="${PALE}" fill-opacity="0.8">${pale}</g>` +
    `<g fill="#cdae6c">${nodes}</g>` +
    `<g fill="#fff4d0" fill-opacity="0.85">${nodeHi}</g>` +
    `<g fill="#d8c084" fill-opacity="0.6">${edgeDots}</g>` +
    `</g>` +
    `<path d="${BODY}" fill="none" stroke="${INK}" stroke-opacity="0.85" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="${rim}" fill="none" stroke="#e6d19a" stroke-opacity="0.45" stroke-width="1.2" stroke-linecap="round"/>`
  );
}

// =====================================================================
// ĐẦU: mõm ống dài chúc xuống, mũ miện, nắp mang có vân tỏa tia
// =====================================================================
const HEAD_PTS: P[] = [
  [168, 46],
  [184, 40],
  [198, 42],
  [212, 52],
  [224, 68],
  [233, 84],
  [243, 101],
  [256, 115],
  [272, 131],
  [287, 146],
  [296, 151],
  [303, 156],
  [304, 164],
  [297, 169],
  [288, 162],
  [272, 147],
  [257, 133],
  [245, 126],
  [232, 130],
  [216, 136],
  [200, 133],
  [185, 125],
  [173, 111],
  [165, 92],
  [162, 70],
  [163, 54],
];
const HEAD = smoothPath(HEAD_PTS, true, 0.5);
const CORONET_PTS: P[] = [
  [164, 53],
  [161, 42],
  [165, 33],
  [170, 37],
  [174, 28],
  [180, 35],
  [185, 27],
  [190, 34],
  [196, 30],
  [200, 40],
  [198, 49],
  [182, 52],
];
const CORONET = smoothPath(CORONET_PTS, true, 0.55);
const EYE: P = [228, 100];

const theEye = eye(u, 'eye', {
  cx: EYE[0],
  cy: EYE[1],
  r: 8.4,
  iris: ['#d2a94e', '#3c2610'],
  socket: '#0b0704',
  look: [0.35, 0.25],
});

function headSvg(): string {
  // vân tỏa tia trên nắp mang
  const O: P = [211, 106];
  let fan = '';
  for (let a = 92; a <= 222; a += 11) {
    const c = Math.cos(a * DEG);
    const s = Math.sin(a * DEG);
    const r1 = 21 + 5 * Math.sin((a - 92) * DEG * 1.38);
    fan += `M${f(O[0] + c * 9)} ${f(O[1] + s * 9)}L${f(O[0] + c * r1)} ${f(O[1] + s * r1)}`;
  }
  // vòng xương quanh mắt: vạch ngắn tỏa tia
  let orbit = '';
  for (let a = 0; a < 360; a += 30) {
    const c = Math.cos(a * DEG);
    const s = Math.sin(a * DEG);
    orbit += `M${f(EYE[0] + c * 11.4)} ${f(EYE[1] + s * 11.4)}L${f(EYE[0] + c * 14.2)} ${f(EYE[1] + s * 14.2)}`;
  }
  const knobs: P[] = [
    [165.5, 35],
    [174.5, 30.5],
    [185, 29.5],
    [195.5, 32.5],
  ];
  const spines: [number, number, number][] = [
    [224, 82, 2.1], // gai trên mắt
    [240, 101, 1.6], // gai mũi
    [216, 133, 2.3], // gai má
    [200, 130, 1.8],
    [166, 74, 2.2], // gai gáy
    [170, 100, 1.9],
  ];
  return (
    // mũ miện
    `<path d="${CORONET}" fill="${u.url('coronet')}" stroke="${INK}" stroke-opacity="0.8" stroke-width="1.3" stroke-linejoin="round"/>` +
    `<path d="M167 38L170 50M176 33L178 50M186 32L186 50M195 35L193 49" fill="none" stroke="${INK}" stroke-opacity="0.4" stroke-width="1"/>` +
    `<g fill="#d9c084">${knobs.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.1"/>`).join('')}</g>` +
    `<g fill="#fff4d0" fill-opacity="0.8">${knobs.map(([x, y]) => `<circle cx="${x - 0.6}" cy="${y - 0.7}" r="0.9"/>`).join('')}</g>` +
    // đầu
    `<path d="${HEAD}" fill="${u.url('headFill')}"/>` +
    `<g clip-path="${u.url('headClip')}">` +
    `<ellipse cx="204" cy="110" rx="24" ry="17" fill="#9a7d48" fill-opacity="0.5" filter="${u.url('b6')}"/>` +
    `<path d="M178 44C196 44 214 56 226 74" fill="none" stroke="#a88c58" stroke-opacity="0.5" stroke-width="7" stroke-linecap="round" filter="${u.url('b3')}"/>` +
    // mõm: sống mõm sáng, mặt dưới tối
    `<path d="M246 106L296 154" fill="none" stroke="#b79a62" stroke-opacity="0.55" stroke-width="5" stroke-linecap="round" filter="${u.url('b3')}"/>` +
    `<path d="M242 127L292 168" fill="none" stroke="#050302" stroke-opacity="0.55" stroke-width="6" stroke-linecap="round" filter="${u.url('b3')}"/>` +
    `<path d="${HEAD}" fill="none" stroke="#060302" stroke-opacity="0.6" stroke-width="7" filter="${u.url('b3')}"/>` +
    `<path d="${fan}" fill="none" stroke="${OCHRE}" stroke-opacity="0.42" stroke-width="0.9" stroke-linecap="round"/>` +
    // mép nắp mang
    `<path d="M182 76C173 91 173 109 185 121C191 127 199 130 207 130" fill="none" stroke="#050302" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round"/>` +
    `<path d="M184 77C175.5 91 175.5 108 187 119.500C193 125 200 128 208 128" fill="none" stroke="${OCHRE}" stroke-opacity="0.5" stroke-width="1" stroke-linecap="round"/>` +
    // gờ từ mắt xuống mõm + vòng ngấn trên mõm
    `<path d="M238 110C248 119 262 133 286 156" fill="none" stroke="#070402" stroke-opacity="0.35" stroke-width="1"/>` +
    `<path d="M290 148Q286 156 289 164" fill="none" stroke="#070402" stroke-opacity="0.45" stroke-width="1.1"/>` +
    `<path d="M292 149Q288 157 291 165" fill="none" stroke="${OCHRE}" stroke-opacity="0.4" stroke-width="0.8"/>` +
    scatterHead() +
    `</g>` +
    // miệng nhỏ ở đầu mõm, lỗ mũi
    `<path d="M304 158Q299 161 298 167" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>` +
    `<circle cx="246.500" cy="108" r="1.1" fill="${INK}" opacity="0.8"/>` +
    `<g fill="#cdae6c">${spines.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>` +
    `<g fill="#fff4d0" fill-opacity="0.8">${spines.map(([x, y, r]) => `<circle cx="${x - r * 0.3}" cy="${y - r * 0.35}" r="${(r * 0.45).toFixed(2)}"/>`).join('')}</g>` +
    `<path d="${HEAD}" fill="none" stroke="${INK}" stroke-opacity="0.85" stroke-width="1.5" stroke-linejoin="round"/>` +
    // rim light dọc trán – sống mõm
    `<path d="M200 43C214 52 224 68 233 84C240 97 250 109 262 121" fill="none" stroke="#f0dca4" stroke-opacity="0.5" stroke-width="1.2" stroke-linecap="round"/>` +
    // vòng xương quanh mắt
    `<circle cx="${EYE[0]}" cy="${EYE[1]}" r="11" fill="#1a120b" stroke="${OCHRE}" stroke-opacity="0.6" stroke-width="1.1"/>` +
    `<path d="${orbit}" fill="none" stroke="${OCHRE}" stroke-opacity="0.4" stroke-width="0.9" stroke-linecap="round"/>`
  );
}

function scatterHead(): string {
  const r = rng(77);
  let pale = '';
  for (let i = 0; i < 60; i++) {
    const x = 164 + r() * 138;
    const y = 42 + r() * 126;
    pale += `<circle cx="${f(x)}" cy="${f(y)}" r="${(0.5 + r() * 0.6).toFixed(2)}"/>`;
  }
  return `<g fill="${PALE}" fill-opacity="0.7">${pale}</g>`;
}

// =====================================================================
// VÂY
// =====================================================================
/** vây quạt: gốc là dãy điểm, tia tỏa theo góc a0→a1 (độ), dài theo hàm len(t) */
function fan(bases: P[], a0: number, a1: number, len: (t: number) => number, fill: string): string {
  const n = bases.length;
  const tips: P[] = [];
  const subs: P[] = [];
  let rays = '';
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = (a0 + (a1 - a0) * t) * DEG;
    const L = len(t);
    const b = bases[i];
    tips.push([b[0] + Math.cos(a) * L, b[1] + Math.sin(a) * L]);
    subs.push([b[0] + Math.cos(a) * L * 0.78, b[1] + Math.sin(a) * L * 0.78]);
    rays += `M${f(b[0])} ${f(b[1])}L${f(tips[i][0])} ${f(tips[i][1])}`;
  }
  let d = `M${f(bases[0][0])} ${f(bases[0][1])}L${f(tips[0][0])} ${f(tips[0][1])}`;
  let edge = `M${f(tips[0][0])} ${f(tips[0][1])}`;
  for (let i = 1; i < n; i++) {
    const a = tips[i - 1];
    const b = tips[i];
    const bm: P = [(bases[i - 1][0] + bases[i][0]) / 2, (bases[i - 1][1] + bases[i][1]) / 2];
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const c: P = [mx + (bm[0] - mx) * 0.1, my + (bm[1] - my) * 0.1];
    const seg = `Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`;
    d += seg;
    edge += seg;
  }
  for (let i = n - 1; i >= 0; i--) d += `L${f(bases[i][0])} ${f(bases[i][1])}`;
  d += 'Z';
  return (
    `<path d="${d}" fill="${fill}"/>` +
    `<path d="${poly(subs, false)}" fill="none" stroke="#3a2a16" stroke-opacity="0.3" stroke-width="2.6" stroke-linejoin="round"/>` +
    `<path d="${rays}" fill="none" stroke="#4a3820" stroke-opacity="0.55" stroke-width="0.75" stroke-linecap="round"/>` +
    `<path d="${edge}" fill="none" stroke="#fff6d8" stroke-opacity="0.7" stroke-width="0.9" stroke-linejoin="round"/>`
  );
}

const DORSAL_BASES: P[] = [];
{
  const n = 17;
  for (let i = 0; i < n; i++) DORSAL_BASES.push(lat(at(S_B - 47 + (59 * i) / (n - 1)), 1, -4.5));
}
const DORSAL_PIVOT: P = DORSAL_BASES[8];
const dorsalFin = fan(DORSAL_BASES, 214, 150, (t) => 25 + 12 * Math.sin(Math.PI * Math.pow(t, 0.85)), u.url('finD'));

const PEC: P = [165, 105];
const PEC_BASES: P[] = [];
for (let i = 0; i < 11; i++) PEC_BASES.push([PEC[0] - 1 + i * 0.25, PEC[1] + 6 - i * 1.2]);
const pectoralFin = fan(PEC_BASES, 128, 236, (t) => 19 + 6 * Math.sin(Math.PI * t), u.url('finP'));

// =====================================================================
// CỎ BIỂN (chỉ trên thẻ Sổ tay) – đuôi quấn quanh lá chính
// =====================================================================
interface Blade {
  x0: number;
  yBase: number;
  yTip: number;
  lean: number;
  hw: number;
}
const MAIN_BLADE: Blade = { x0: 232, yBase: 562, yTip: 206, lean: 31, hw: 5.6 };
function blade(b: Blade, y0 = b.yBase, y1 = b.yTip, fill = u.url('grass'), rib = true): string {
  const H = b.yBase - b.yTip;
  const cx = (y: number): number => b.x0 + b.lean * Math.pow((b.yBase - y) / H, 2);
  const w = (y: number): number => b.hw * Math.min(1, Math.pow(Math.max(0, (y - b.yTip) / H) * 3.4, 0.6));
  const L: P[] = [];
  const R: P[] = [];
  const mid: P[] = [];
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const y = y0 + ((y1 - y0) * i) / n;
    L.push([cx(y) - w(y), y]);
    R.push([cx(y) + w(y), y]);
    mid.push([cx(y) - w(y) * 0.15, y]);
  }
  return (
    `<path d="${poly([...L, ...R.reverse()])}" fill="${fill}"/>` +
    (rib
      ? `<path d="${poly(mid, false)}" fill="none" stroke="#d7efa8" stroke-opacity="0.35" stroke-width="1"/>` +
        `<path d="${poly(L, false)}" fill="none" stroke="#143a2a" stroke-opacity="0.5" stroke-width="0.9"/>`
      : '')
  );
}
const grassBack =
  `<g opacity="0.55">` +
  blade({ x0: 96, yBase: 562, yTip: 372, lean: -30, hw: 5 }, undefined, undefined, u.url('grassFar'), false) +
  blade({ x0: 300, yBase: 562, yTip: 318, lean: 44, hw: 5.4 }, undefined, undefined, u.url('grassFar'), false) +
  blade({ x0: 268, yBase: 562, yTip: 410, lean: -14, hw: 4.4 }, undefined, undefined, u.url('grassFar'), false) +
  `</g>` +
  blade({ x0: 122, yBase: 562, yTip: 300, lean: -46, hw: 5.2 }) +
  blade({ x0: 326, yBase: 562, yTip: 262, lean: 30, hw: 5.6 }) +
  blade(MAIN_BLADE);
// đoạn lá chính đè lên đuôi ở chỗ giao phía trên vòng cuộn → trông như đuôi quấn quanh lá
const grassFront = blade(MAIN_BLADE, 469, 440);

// =====================================================================
// DEFS
// =====================================================================
const defs = joinDefs(
  theEye,
  linear(u('bodyFill'), [
    [0, '#4a3a27'],
    [0.5, '#35281b'],
    [1, '#3d2f1f'],
  ]),
  linear(
    u('headFill'),
    [
      [0, '#55432c'],
      [0.5, '#35281b'],
      [1, '#4a3a25'],
    ],
    { x1: 0.2, y1: 0, x2: 0.8, y2: 1 },
  ),
  linear(u('coronet'), [
    [0, '#8a7044'],
    [1, '#3a2c1d'],
  ]),
  linear(
    u('finD'),
    [
      [0, '#9c8450', 0.85],
      [0.55, '#d8c690', 0.62],
      [1, '#f3ead0', 0.5],
    ],
    { user: true, x1: 134, y1: 0, x2: 86, y2: 0 },
  ),
  radial(
    u('finP'),
    [
      [0, '#a8905c', 0.9],
      [0.6, '#dccb98', 0.68],
      [1, '#f5edd4', 0.55],
    ],
    { user: true, cx: PEC[0], cy: PEC[1], r: 27 },
  ),
  linear(
    u('grass'),
    [
      [0, '#24583f'],
      [0.55, '#3f8552'],
      [1, '#93bd66'],
    ],
    { user: true, x1: 0, y1: 562, x2: 0, y2: 206 },
  ),
  linear(
    u('grassFar'),
    [
      [0, '#1d4a3c'],
      [1, '#4f8f62'],
    ],
    { user: true, x1: 0, y1: 562, x2: 0, y2: 300 },
  ),
  blurFilter(u('b3'), 3),
  blurFilter(u('b6'), 6),
  `<clipPath id="${u('bodyClip')}"><path d="${BODY}"/></clipPath>`,
  `<clipPath id="${u('headClip')}"><path d="${HEAD}"/></clipPath>`,
);

const art: CreatureArt = {
  id: ID,
  viewBox: [400, 560],
  lengthUnits: 504,
  spineY: 280,
  animation: 'seahorse',
  cycleHz: 2.2,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    { name: 'seagrassBack', role: 'detail', bend: false, z: 'back', cardOnly: true, pivot: [232, 560], svg: grassBack },
    {
      name: 'dorsalFin',
      role: 'fin',
      z: 'back',
      pivot: DORSAL_PIVOT,
      anim: { type: 'skewY', amp: 0.2, speed: 5 },
      svg: dorsalFin,
    },
    { name: 'body', role: 'body', svg: bodySvg() },
    { name: 'head', role: 'detail', svg: headSvg() },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    {
      name: 'pectoralFin',
      role: 'fin',
      z: 'front',
      pivot: PEC,
      anim: { type: 'scaleX', amp: 0.24, speed: 4.3, phase: 1 },
      svg: pectoralFin,
    },
    { name: 'seagrassFront', role: 'detail', bend: false, z: 'front', cardOnly: true, pivot: [232, 560], svg: grassFront },
  ],
};

export default art;
