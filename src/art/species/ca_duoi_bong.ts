/**
 * Cá đuối bồng (cá đuối đỏ) – Hemitrygon akajei
 * Góc nhìn từ trên xuống, đầu hướng PHẢI.
 * Đặc điểm nhận dạng (theo ảnh tham khảo, chủ yếu ref1 – tranh Kawahara Keiga):
 *  - đĩa thân hình thoi bo tròn, RỘNG hơn dài (≈1.22×), mép trước gần thẳng, mõm nhọn ngắn hơi nhô,
 *    góc ngoài bo tròn rộng, mép sau lồi;
 *  - mặt lưng nâu xám ánh đỏ ở giữa, ra ngoài nâu cam; mép đĩa ánh cam (mặt dưới lộ ra viền sáng);
 *  - mắt nhỏ lồi + lỗ thở (spiracle) to ngay sau mắt; vùng giỏ mang gồ có nếp ngang;
 *  - hàng u gai nhỏ trắng ngà dọc sống lưng, nối xuống gốc đuôi;
 *  - tia sụn mảnh toả ra sát mép đĩa, lấm tấm chấm nâu sẫm thành đám;
 *  - vây bụng cam tròn nhô sau đĩa; đuôi roi dài ≈1.6× đĩa, có GAI NỌC răng cưa (ngạnh ngược)
 *    ở ≈28% chiều dài đuôi, sau gai có nếp da bụng viền vàng.
 * Chuyển động 'ray': hai nửa đĩa (cánh) là lớp tách rời (bend:false) gợn lên xuống bằng scaleY
 * quanh gốc cánh; dải thân giữa (lớp body) vẽ cùng một "bức tranh đĩa" nhưng mờ dần ở hai mép
 * nên che kín đường nối khi cánh cử động.
 */
import type { CreatureArt } from '../contract';
import { makeIds, eye, linear, radial, joinDefs, rng, organicTexture, smoothPath, blurFilter } from '../style-bible';

const u = makeIds('ca_duoi_bong');

// ---------- Hệ toạ độ ----------
const W = 840;
const H = 430;
const S = 215; // trục thân
const WING_PIVOT_X = 668;
const WING_PIVOT_DY = 40;

// ---------- Màu (ước lượng từ ảnh tham khảo, xem references/ca_duoi_bong/notes.md) ----------
const C_CENTER = '#674538';
const C_MID = '#785545';
const C_DISC = '#87664b';
const C_OUTER = '#9b6e49';
const C_EDGE = '#cf8646';
const C_EDGE_HI = '#eab070';
const C_UNDER = '#f3d4a4';
const OUTLINE = '#4a2c1a';
const SPECK = '#4b3227';
const TUBER = '#efe1c2';

type P = [number, number];
const f = (n: number) => n.toFixed(1);

// ---------- Viền đĩa: nửa trên (x, khoảng cách tới trục) từ mõm → gốc đuôi ----------
const HALF: P[] = [
  [812, 0],
  [807, 5],
  [798, 29],
  [782, 65],
  [765, 97],
  [747, 122],
  [728, 145],
  [709, 164],
  [693, 176.5],
  [679, 182.5],
  [665, 182],
  [640, 175.5],
  [611, 164],
  [588, 151],
  [568, 134],
  [552, 116],
  [539.5, 97],
  [530, 76],
  [524.5, 56],
  [521.5, 40],
  [519.5, 27],
  [517, 15],
];
const top = (p: P): P => [p[0], S - p[1]];
const bot = (p: P): P => [p[0], S + p[1]];

/** Viền mép đĩa (đường hở): gốc đuôi trên → mõm → gốc đuôi dưới. */
const MARGIN_PTS: P[] = [...[...HALF].reverse().map(top), ...HALF.slice(1).map(bot)];
const MARGIN_D = smoothPath(MARGIN_PTS, false);
const DISC_D = MARGIN_D + 'Z'; // khép qua gốc đuôi (đoạn này bị thân giữa che, không viền)

/** Lấy mẫu dày theo đúng công thức Catmull-Rom của smoothPath (tension 0.5). */
function sampleCR(pts: P[], perSeg = 16): P[] {
  const p = [pts[0], ...pts, pts[pts.length - 1]];
  const out: P[] = [pts[0]];
  const k = 0.5 / 3;
  for (let i = 1; i < p.length - 2; i++) {
    const p0 = p[i - 1];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2];
    const c1: P = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: P = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    for (let j = 1; j <= perSeg; j++) out.push(cubic(p1, c1, c2, p2, j / perSeg));
  }
  return out;
}

function cubic(p0: P, p1: P, p2: P, p3: P, t: number): P {
  const m = 1 - t;
  const a = m * m * m;
  const b = 3 * m * m * t;
  const c = 3 * m * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

/** Chia đều theo độ dài cung. */
function resample(pts: P[], n: number): P[] {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = acc[acc.length - 1];
  const out: P[] = [];
  let j = 1;
  for (let i = 0; i < n; i++) {
    const s = (total * i) / Math.max(1, n - 1);
    while (j < acc.length - 1 && acc[j] < s) j++;
    const seg = Math.max(1e-6, acc[j] - acc[j - 1]);
    const t = Math.max(0, Math.min(1, (s - acc[j - 1]) / seg));
    out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t]);
  }
  return out;
}

const MARGIN_SAMPLES = sampleCR(MARGIN_PTS);

/** Đoạn viền trước nửa trên (mõm → góc ngoài) cho rim light. */
const LEAD_TOP_D = smoothPath(HALF.slice(0, 10).map(top), false);
const LEAD_BOT_D = smoothPath(HALF.slice(0, 10).map(bot), false);

// ---------- Tia sụn toả ra sát mép đĩa ----------
function radials(): string {
  const c: P = [664, S];
  const pts = resample(MARGIN_SAMPLES, 150);
  let dark = '';
  let light = '';
  for (const p of pts) {
    const dy = Math.abs(p[1] - S);
    if (p[0] < 545 && dy < 50) continue; // gần gốc đuôi
    if (p[0] > 790) continue; // mõm
    const a: P = [c[0] + (p[0] - c[0]) * 0.72, c[1] + (p[1] - c[1]) * 0.72];
    const b: P = [c[0] + (p[0] - c[0]) * 0.985, c[1] + (p[1] - c[1]) * 0.985];
    dark += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
    light += `M${f(a[0] + 1.3)} ${f(a[1] + 0.6)}L${f(b[0] + 1.3)} ${f(b[1] + 0.6)}`;
  }
  return (
    `<path d="${dark}" fill="none" stroke="#4e2f1c" stroke-opacity="0.16" stroke-width="0.9" stroke-linecap="round"/>` +
    `<path d="${light}" fill="none" stroke="#f6c98c" stroke-opacity="0.09" stroke-width="0.7" stroke-linecap="round"/>`
  );
}

// ---------- Đám chấm nâu sẫm ----------
function speckles(): string {
  const r = rng(733);
  // [x, y, bán kính đám, số chấm]
  const clusters: [number, number, number, number][] = [
    [668, S - 82, 34, 60],
    [700, S - 112, 18, 16],
    [604, S - 136, 24, 26],
    [648, S - 152, 14, 10],
    [712, S + 110, 20, 24],
    [740, S + 92, 10, 8],
    [636, S + 148, 14, 10],
    [588, S + 128, 14, 12],
  ];
  let blot = '';
  let dots = '';
  for (const [cx, cy, rad, n] of clusters) {
    blot += `<ellipse cx="${cx}" cy="${cy}" rx="${f(rad * 1.1)}" ry="${f(rad * 0.85)}"/>`;
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const d = rad * Math.sqrt(r()) * (0.4 + 0.6 * r());
      const x = cx + Math.cos(a) * d * 1.15;
      const y = cy + Math.sin(a) * d * 0.9;
      const rr = 0.6 + r() * 1.3;
      dots += `<circle cx="${f(x)}" cy="${f(y)}" r="${rr.toFixed(2)}" fill-opacity="${(0.25 + r() * 0.35).toFixed(2)}"/>`;
    }
  }
  return (
    `<g fill="${SPECK}" fill-opacity="0.13" filter="${u.url('blur6')}">${blot}</g>` +
    `<g fill="${SPECK}">${dots}</g>`
  );
}

/** "Bức tranh đĩa" dùng chung cho 2 cánh và dải thân giữa (giống hệt nhau → không lộ đường nối). */
const DISC_PAINT =
  `<g filter="${u.url('skin')}"><path d="${DISC_D}" fill="${u.url('discFill')}"/></g>` +
  `<g clip-path="${u.url('discClip')}">` +
  // ánh cam dày dần ra mép (viền đĩa)
  `<path d="${MARGIN_D}" fill="none" stroke="${C_EDGE}" stroke-opacity="0.6" stroke-width="30" filter="${u.url('blur6')}"/>` +
  `<path d="${MARGIN_D}" fill="none" stroke="#dc9750" stroke-opacity="0.45" stroke-width="9" filter="${u.url('blur2')}"/>` +
  speckles() +
  radials() +
  // nắng từ mặt nước rọi xuống (lệch về nửa trên, phía đầu)
  `<path d="${DISC_D}" fill="${u.url('sheen')}"/>` +
  `<path d="${DISC_D}" fill="${u.url('shadow')}"/>` +
  // mặt dưới ánh cam lộ ra ở mép đĩa
  `<path d="${MARGIN_D}" fill="none" stroke="${C_UNDER}" stroke-opacity="0.75" stroke-width="2.6"/>` +
  `<path d="${LEAD_TOP_D}" fill="none" stroke="${u.url('rimTop')}" stroke-width="5" stroke-linecap="round"/>` +
  `<path d="${LEAD_BOT_D}" fill="none" stroke="${u.url('rimBot')}" stroke-width="3" stroke-linecap="round"/>` +
  `</g>` +
  `<path d="${MARGIN_D}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.62" stroke-width="1.5" stroke-linejoin="round"/>`;

function wingSvg(bottom: boolean): string {
  return `<g clip-path="${u.url(bottom ? 'wingBotClip' : 'wingTopClip')}">${DISC_PAINT}</g>`;
}

// ---------- Vây bụng (hai thuỳ cam tròn nhô sau đĩa) ----------
const PELVIC_HALF: P[] = [
  [536, 14],
  [530, 33],
  [520, 52],
  [508, 64],
  [496, 67],
  [488, 61],
  [487, 48],
  [492, 34],
  [501, 22],
  [514, 14],
];
function pelvicSvg(bottom: boolean): string {
  const tr = bottom ? bot : top;
  const d = smoothPath(PELVIC_HALF.map(tr), true);
  const rays: string[] = [];
  const base = tr([532, 22]);
  const edge = resample(sampleCR(PELVIC_HALF.slice(2, 9).map(tr), 10), 11);
  for (const e of edge) {
    const a: P = [base[0] + (e[0] - base[0]) * 0.25, base[1] + (e[1] - base[1]) * 0.25];
    rays.push(`M${f(a[0])} ${f(a[1])}L${f(e[0] + (base[0] - e[0]) * 0.06)} ${f(e[1] + (base[1] - e[1]) * 0.06)}`);
  }
  const id = bottom ? 'pelvicBot' : 'pelvicTop';
  return (
    `<path d="${d}" fill="${u.url(id)}" stroke="${OUTLINE}" stroke-opacity="0.55" stroke-width="1.1" stroke-linejoin="round"/>` +
    `<path d="${rays.join('')}" fill="none" stroke="#6a3a1c" stroke-opacity="0.22" stroke-width="0.7" stroke-linecap="round"/>` +
    `<path d="${smoothPath(PELVIC_HALF.slice(3, 8).map(tr), false)}" fill="none" stroke="${C_UNDER}" stroke-opacity="0.55" stroke-width="1.3" transform="translate(${bottom ? '0.8 -0.8' : '0.8 0.8'})"/>`
  );
}

// ---------- Đuôi roi + gai nọc ----------
const T0: P = [560, S];
const T1: P = [420, S + 1];
const T2: P = [250, S + 18];
const T3: P = [24, S + 6];
const tailAt = (t: number) => cubic(T0, T1, T2, T3, t);
const tailHW = (t: number) => 15.5 * Math.pow(Math.max(0, 1 - t), 1.65) + 0.4;
function tailTFor(x: number): number {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i <= 400; i++) {
    const t = i / 400;
    const d = Math.abs(tailAt(t)[0] - x);
    if (d < bd) {
      bd = d;
      best = t;
    }
  }
  return best;
}
function tailNormal(t: number): P {
  const a = tailAt(Math.max(0, t - 0.002));
  const b = tailAt(Math.min(1, t + 0.002));
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
}

const STING_X = 372; // ≈28% chiều dài đuôi tính từ mép đĩa
const T_STING = tailTFor(STING_X);

/** Gai nọc dẹt hình mác, mép răng cưa ngạnh ngược (chĩa về gốc). */
function sting(base: P, len: number, hw: number, ang: number, opacity: number, withTeeth: boolean, gid: string): string {
  const d: P = [Math.cos(ang), Math.sin(ang)]; // hướng mũi gai
  const n: P = [-d[1], d[0]];
  const at = (s: number, side: number): P => {
    const w = s < 0.12 ? hw * (0.55 + 3.75 * s) : hw * Math.max(0, (1 - s) / 0.88) ** 0.85;
    return [base[0] + d[0] * len * s + n[0] * w * side, base[1] + d[1] * len * s + n[1] * w * side];
  };
  const N = 24;
  const left: P[] = [];
  const right: P[] = [];
  for (let i = 0; i <= N; i++) {
    left.push(at(i / N, 1));
    right.push(at(i / N, -1));
  }
  const body = `M${[...left, ...right.reverse()].map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`;
  let teeth = '';
  if (withTeeth) {
    for (let s = 0.17; s < 0.92; s += 0.052) {
      for (const side of [1, -1]) {
        const a = at(s, side);
        const b = at(s + 0.045, side);
        // đỉnh răng nhô ra ngoài và ngả về phía GỐC gai (ngạnh ngược)
        const tipLen = 2.5 * (1 - s * 0.5);
        const apex: P = [a[0] + n[0] * side * tipLen - d[0] * 2.2, a[1] + n[1] * side * tipLen - d[1] * 2.2];
        teeth += `M${f(b[0])} ${f(b[1])}L${f(apex[0])} ${f(apex[1])}L${f(a[0])} ${f(a[1])}Z`;
      }
    }
  }
  const ridgeA = at(0.05, 0);
  const ridgeB = at(0.9, 0);
  const hiA = at(0.1, 0.45);
  const hiB = at(0.8, 0.3);
  return (
    `<g opacity="${opacity}">` +
    (teeth ? `<path d="${teeth}" fill="#b49a72" stroke="#3a2a1c" stroke-opacity="0.6" stroke-width="0.35" stroke-linejoin="round"/>` : '') +
    `<path d="${body}" fill="${u.url(gid)}" stroke="#2e2016" stroke-opacity="0.75" stroke-width="0.6" stroke-linejoin="round"/>` +
    `<path d="M${f(ridgeA[0])} ${f(ridgeA[1])}L${f(ridgeB[0])} ${f(ridgeB[1])}" stroke="#5e4a34" stroke-opacity="0.55" stroke-width="0.9" stroke-linecap="round"/>` +
    `<path d="M${f(hiA[0])} ${f(hiA[1])}L${f(hiB[0])} ${f(hiB[1])}" stroke="#fbf0d6" stroke-opacity="0.7" stroke-width="0.7" stroke-linecap="round"/>` +
    `</g>`
  );
}

function tailSvg(): string {
  const n = 90;
  const TOP: P[] = [];
  const BOT: P[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = tailAt(t);
    const nm = tailNormal(t); // pháp tuyến hướng lên trên màn hình
    const w = tailHW(t);
    TOP.push([p[0] + nm[0] * w, p[1] + nm[1] * w]);
    BOT.push([p[0] - nm[0] * w, p[1] - nm[1] * w]);
  }
  const outline = `M${[...TOP, ...[...BOT].reverse()].map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`;
  /** đường chạy dọc mép đuôi, lùi vào trong `inset` đơn vị (side 1 = mép trên, -1 = mép dưới) */
  const edgeLine = (side: number, inset: number, a: number, b: number) => {
    const pts: string[] = [];
    for (let i = Math.round(a * n); i <= Math.round(b * n); i++) {
      const t = i / n;
      const p = tailAt(t);
      const nm = tailNormal(t);
      const w = Math.max(0, tailHW(t) - inset);
      pts.push(`${f(p[0] + nm[0] * w * side)} ${f(p[1] + nm[1] * w * side)}`);
    }
    return `M${pts.join('L')}`;
  };
  // hàng u gai trên gốc đuôi (từ mép đĩa tới trước gai) – nhỏ dần, khoảng cách không đều
  let tub = '';
  let tubSh = '';
  const rt = rng(57);
  const tStart = tailTFor(514);
  for (let t = tStart; t < T_STING - 0.025; t += 0.014 + rt() * 0.012) {
    const p = tailAt(t);
    const rr = Math.max(0.6, 1.35 - (t - tStart) * 2.2) * (0.8 + rt() * 0.35);
    tubSh += `<circle cx="${f(p[0] + 0.4)}" cy="${f(p[1] + 0.8)}" r="${(rr * 1.1).toFixed(2)}"/>`;
    tub += `<ellipse cx="${f(p[0])}" cy="${f(p[1] + (rt() - 0.5))}" rx="${(rr * 1.2).toFixed(2)}" ry="${rr.toFixed(2)}"/>`;
  }
  // gai nọc: gốc trên sống đuôi, mũi chếch lên để lộ hẳn ra ngoài mép đuôi
  const sb = tailAt(T_STING);
  const tan = tailAt(T_STING + 0.01);
  const baseAng = Math.atan2(tan[1] - sb[1], tan[0] - sb[0]);
  const spine2 = sting([sb[0] + 5, sb[1] + 1.5], 72, 3.0, baseAng - 0.06, 0.85, false, 'sting2');
  const spine1 = sting([sb[0] + 2, sb[1] - 0.8], 102, 4.6, baseAng - 0.13, 1, true, 'sting');
  return (
    `<path d="${outline}" fill="${u.url('tail')}" stroke="${OUTLINE}" stroke-opacity="0.55" stroke-width="0.8" stroke-linejoin="round"/>` +
    // nếp da bụng viền vàng lộ ra hai bên roi (rõ sau gai), nắng rọi mép trên gốc đuôi
    `<path d="${edgeLine(-1, 0.9, 0.06, 0.93)}" fill="none" stroke="#d9a35c" stroke-opacity="0.55" stroke-width="1.2" stroke-linecap="round"/>` +
    `<path d="${edgeLine(1, 0.8, T_STING + 0.04, 0.9)}" fill="none" stroke="#d9a35c" stroke-opacity="0.5" stroke-width="1.1" stroke-linecap="round"/>` +
    `<path d="${edgeLine(1, 2.4, 0.07, T_STING)}" fill="none" stroke="#e7b77a" stroke-opacity="0.28" stroke-width="2" stroke-linecap="round"/>` +
    // rãnh sống đuôi sẫm (inset vô hạn = đường giữa)
    `<path d="${edgeLine(1, 1e9, 0.04, 0.95)}" fill="none" stroke="#24170f" stroke-opacity="0.45" stroke-width="1.4" stroke-linecap="round"/>` +
    `<g fill="#1e130c" fill-opacity="0.35">${tubSh}</g>` +
    `<g fill="${TUBER}" fill-opacity="0.85">${tub}</g>` +
    spine2 +
    spine1 +
    // bao da sẫm phủ gốc gai (gai mọc ra từ túi da trên sống đuôi)
    `<ellipse cx="${f(sb[0] + 5)}" cy="${f(sb[1] - 0.3)}" rx="7.5" ry="4" fill="#4a3020" fill-opacity="0.85" filter="${u.url('blur1')}" transform="rotate(${((baseAng * 180) / Math.PI).toFixed(1)} ${f(sb[0] + 5)} ${f(sb[1] - 0.3)})"/>` +
    `<path d="M${f(sb[0] - 3)} ${f(sb[1] - 3.6)}Q${f(sb[0] + 5)} ${f(sb[1] - 5.6)} ${f(sb[0] + 13)} ${f(sb[1] - 3)}" fill="none" stroke="#c99a68" stroke-opacity="0.35" stroke-width="0.9" stroke-linecap="round"/>`
  );
}

// ---------- Dải thân giữa (body): bức tranh đĩa + chi tiết sống lưng ----------
function tubercles(): string {
  let sh = '';
  let tb = '';
  const r = rng(29);
  // hàng hạt gai rõ ngay sau vùng mang (như ref1), sau đó nhỏ & thưa dần về gốc đuôi
  let x = 709;
  while (x > 516) {
    const front = x > 660;
    const rr = front ? 1.85 + r() * 0.45 - (709 - x) * 0.006 : 1.05 + r() * 0.4;
    const y = S + (r() - 0.5) * (front ? 0.8 : 1.8);
    sh += `<circle cx="${f(x + 0.5)}" cy="${f(y + 1)}" r="${(rr * 1.1).toFixed(2)}"/>`;
    tb += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${(rr * 1.25).toFixed(2)}" ry="${rr.toFixed(2)}"${front ? '' : ` fill-opacity="${(0.55 + r() * 0.25).toFixed(2)}"`}/>`;
    x -= front ? 7.2 : 8 + r() * 7;
  }
  return `<g fill="#1e130c" fill-opacity="0.35">${sh}</g><g fill="${TUBER}" fill-opacity="0.9">${tb}</g>`;
}

function branchial(bottom: boolean): string {
  const sg = bottom ? 1 : -1;
  let dark = '';
  let light = '';
  for (let i = 0; i < 6; i++) {
    const x = 712 - i * 9;
    const y0 = S + sg * 15;
    const y1 = S + sg * (44 - Math.abs(i - 2.5) * 2.2);
    const bow = x - 5;
    dark += `M${x} ${f(y0)}Q${bow} ${f((y0 + y1) / 2)} ${x - 1} ${f(y1)}`;
    light += `M${x + 3} ${f(y0 + sg * 1)}Q${bow + 3} ${f((y0 + y1) / 2)} ${x + 2} ${f(y1 - sg * 1)}`;
  }
  return (
    `<ellipse cx="688" cy="${S + sg * 31}" rx="31" ry="18" fill="#c7aa82" fill-opacity="0.2" filter="${u.url('blur4')}"/>` +
    `<path d="${light}" fill="none" stroke="#efd9ad" stroke-opacity="0.17" stroke-width="2.2" stroke-linecap="round" filter="${u.url('blur1')}"/>` +
    `<path d="${dark}" fill="none" stroke="#4a3022" stroke-opacity="0.2" stroke-width="1.3" stroke-linecap="round"/>`
  );
}

const BAND_PAINT = `<g mask="${u.url('bandMask')}">${DISC_PAINT}</g>`;

const bodySvg =
  BAND_PAINT +
  `<g clip-path="${u.url('discClip')}">` +
  // vùng sọ giữa hai mắt ửng đỏ
  `<ellipse cx="732" cy="${S}" rx="34" ry="18" fill="#8e4c40" fill-opacity="0.32" filter="${u.url('blur6')}"/>` +
  // dải thân giữa nâu đỏ chạy tới gốc đuôi
  `<path d="M770 ${S}C740 ${S - 16} 600 ${S - 20} 505 ${S - 12}L505 ${S + 12}C600 ${S + 20} 740 ${S + 16} 770 ${S}Z" fill="#664032" fill-opacity="0.38" filter="${u.url('blur6')}"/>` +
  // hai khối cơ thuôn dọc hai bên sống lưng (nửa sau đĩa)
  `<ellipse cx="590" cy="${S - 21}" rx="58" ry="11" fill="#6c4436" fill-opacity="0.34" filter="${u.url('blur4')}"/>` +
  `<ellipse cx="590" cy="${S + 21}" rx="58" ry="11" fill="#6c4436" fill-opacity="0.34" filter="${u.url('blur4')}"/>` +
  // sụn mõm: hình chữ V mờ từ mõm toả về giữa hai mắt
  `<path d="M800 ${S}C780 ${S - 2} 760 ${S - 6} 738 ${S - 13}M800 ${S}C780 ${S + 2} 760 ${S + 6} 738 ${S + 13}" fill="none" stroke="#4a2c20" stroke-opacity="0.22" stroke-width="3" filter="${u.url('blur1')}"/>` +
  `<path d="M640 ${S - 31}C610 ${S - 34} 565 ${S - 31} 532 ${S - 22}M640 ${S + 31}C610 ${S + 34} 565 ${S + 31} 532 ${S + 22}" fill="none" stroke="#d6b089" stroke-opacity="0.16" stroke-width="2.4" filter="${u.url('blur2')}"/>` +
  branchial(false) +
  branchial(true) +
  // ánh sáng gờ sọ / vai
  `<ellipse cx="700" cy="${S - 6}" rx="70" ry="9" fill="#f2dcc0" fill-opacity="0.08" filter="${u.url('blur4')}"/>` +
  // gốc đuôi hoà vào đuôi
  `<ellipse cx="515" cy="${S}" rx="18" ry="15" fill="#7a5442" fill-opacity="0.75" filter="${u.url('blur4')}"/>` +
  `</g>` +
  // rãnh sống lưng sẫm
  `<path d="M748 ${S}C700 ${S - 0.6} 600 ${S - 0.4} 505 ${S}" fill="none" stroke="#3a2419" stroke-opacity="0.5" stroke-width="1.5" stroke-linecap="round"/>` +
  `<path d="M740 ${S - 2.2}C700 ${S - 2.8} 600 ${S - 2.6} 512 ${S - 2}" fill="none" stroke="#f0d9b8" stroke-opacity="0.12" stroke-width="1.1" stroke-linecap="round"/>` +
  tubercles();

// ---------- Mặt: u mắt + lỗ thở ----------
const EYE_X = 741;
const EYE_DY = 29;
const SPI_X = 724;
const SPI_DY = 32;

function faceHalf(bottom: boolean): string {
  const sg = bottom ? 1 : -1;
  const ey = S + sg * EYE_DY;
  const sy = S + sg * SPI_DY;
  const rot = bottom ? 12 : -12;
  return (
    // u mắt gồ (sáng phía trên-trước, bóng phía ngoài-sau)
    `<ellipse cx="${EYE_X - 1}" cy="${ey + sg * 1.5}" rx="11.5" ry="9.5" fill="#2e1d14" fill-opacity="0.35" filter="${u.url('blur2')}"/>` +
    `<ellipse cx="${EYE_X}" cy="${ey}" rx="9.6" ry="8.2" fill="${u.url('orbit')}"/>` +
    // lỗ thở: hố bầu dục sẫm, mép trước vàng, nắp da phía sau
    `<ellipse cx="${SPI_X}" cy="${sy}" rx="9" ry="5.4" fill="#5a3a28" fill-opacity="0.55" transform="rotate(${rot} ${SPI_X} ${sy})" filter="${u.url('blur1')}"/>` +
    `<ellipse cx="${SPI_X}" cy="${sy}" rx="7" ry="3.9" fill="#1c110b" fill-opacity="0.85" transform="rotate(${rot} ${SPI_X} ${sy})"/>` +
    // nắp van lỗ thở (nếp da sáng phía sau, như ref1) + mép trước bắt sáng
    `<path d="M${SPI_X - 6.8} ${f(sy - sg * 0.4)}C${SPI_X - 3} ${f(sy + sg * 4.4)} ${SPI_X + 3} ${f(sy + sg * 4.2)} ${SPI_X + 6.6} ${f(sy + sg * 1.4)}C${SPI_X + 2} ${f(sy + sg * 1.8)} ${SPI_X - 3} ${f(sy + sg * 1.4)} ${SPI_X - 6.8} ${f(sy - sg * 0.4)}Z" fill="#c9a874" fill-opacity="0.55"/>` +
    `<path d="M${SPI_X + 6.4} ${f(sy - sg * 2)}C${SPI_X + 3} ${f(sy - sg * 4.4)} ${SPI_X - 4} ${f(sy - sg * 4.4)} ${SPI_X - 7} ${f(sy - sg * 1.2)}" fill="none" stroke="#e6cfa0" stroke-opacity="0.38" stroke-width="1" stroke-linecap="round"/>`
  );
}

const eyeTop = eye(u, 'eyeTop', { cx: EYE_X, cy: S - EYE_DY, r: 5.2, iris: ['#e6c76c', '#8c6a2c'], socket: '#3a2618', look: [0.25, -0.35] });
const eyeBot = eye(u, 'eyeBot', { cx: EYE_X, cy: S + EYE_DY, r: 5.2, iris: ['#d9b85e', '#7c5c24'], socket: '#3a2618', look: [0.25, 0.35] });

// ---------- defs ----------
const defs = joinDefs(
  eyeTop,
  eyeBot,
  organicTexture(u('skin'), { freq: 0.045, octaves: 3, strength: 0.17, seed: 23 }),
  blurFilter(u('blur1'), 1),
  blurFilter(u('blur2'), 2),
  blurFilter(u('blur4'), 4),
  blurFilter(u('blur6'), 6),
  `<clipPath id="${u('discClip')}"><path d="${DISC_D}"/></clipPath>`,
  `<clipPath id="${u('wingTopClip')}"><rect x="0" y="0" width="${W}" height="${S + 14}"/></clipPath>`,
  `<clipPath id="${u('wingBotClip')}"><rect x="0" y="${S - 14}" width="${W}" height="${H - S + 14}"/></clipPath>`,
  // dải thân giữa: đặc ở |dy| < 36, mờ dần tới 0 ở |dy| = 54
  linear(
    u('bandGrad'),
    [
      [0, '#000000'],
      [2 / 112, '#000000'],
      [20 / 112, '#ffffff'],
      [92 / 112, '#ffffff'],
      [110 / 112, '#000000'],
      [1, '#000000'],
    ],
    { user: true, x1: 0, y1: S - 56, x2: 0, y2: S + 56 },
  ),
  `<mask id="${u('bandMask')}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect x="0" y="${S - 56}" width="${W}" height="112" fill="${u.url('bandGrad')}"/></mask>`,
  radial(
    u('discFill'),
    [
      [0, C_CENTER],
      [0.35, C_MID],
      [0.68, C_DISC],
      [0.9, C_OUTER],
      [1, '#a8744a'],
    ],
    { user: true, cx: 668, cy: S, r: 190, transform: `translate(668 ${S}) scale(0.82 1) translate(-668 ${-S})` },
  ),
  radial(u('sheen'), [[0, '#fff1dc', 0.16], [0.55, '#fff1dc', 0.05], [1, '#fff1dc', 0]], { user: true, cx: 712, cy: S - 70, r: 150 }),
  radial(u('shadow'), [[0, '#1c0f08', 0], [0.6, '#1c0f08', 0], [1, '#1c0f08', 0.16]], { user: true, cx: 690, cy: S - 40, r: 230 }),
  linear(u('rimTop'), [[0, '#fff4e0', 0.15], [0.35, '#fff4e0', 0.7], [1, '#fff4e0', 0.2]], { user: true, x1: 812, y1: S, x2: 659, y2: S - 185 }),
  linear(u('rimBot'), [[0, '#fff4e0', 0.05], [0.5, '#fff4e0', 0.18], [1, '#fff4e0', 0.04]], { user: true, x1: 812, y1: S, x2: 659, y2: S + 185 }),
  radial(u('orbit'), [[0, '#a7866a'], [0.6, '#8d6c55'], [1, '#6d5040', 0.6]], { cx: 0.42, cy: 0.38, r: 0.65 }),
  linear(u('pelvicTop'), [[0, '#a8744a'], [0.55, C_EDGE], [1, C_EDGE_HI]], { user: true, x1: 520, y1: S - 20, x2: 484, y2: S - 70 }),
  linear(u('pelvicBot'), [[0, '#a8744a'], [0.55, C_EDGE], [1, C_EDGE_HI]], { user: true, x1: 520, y1: S + 20, x2: 484, y2: S + 70 }),
  linear(
    u('tail'),
    [
      [0, '#7a5644'],
      [0.1, '#80583f'],
      [0.3, '#5e4232'],
      [0.5, '#3e2b22'],
      [1, '#261a14'],
    ],
    { user: true, x1: 560, y1: 0, x2: 24, y2: 0 },
  ),
  linear(u('sting'), [[0, '#5b4532'], [0.12, '#cdb48a'], [0.6, '#bfa57c'], [0.88, '#6e5a44'], [1, '#22170f']], { x1: 1, y1: 0, x2: 0, y2: 0 }),
  linear(u('sting2'), [[0, '#4f3c2c'], [0.2, '#a8916c'], [0.85, '#5e4c3a'], [1, '#22170f']], { x1: 1, y1: 0, x2: 0, y2: 0 }),
);

const art: CreatureArt = {
  id: 'ca_duoi_bong',
  viewBox: [W, H],
  lengthUnits: 812 - 24,
  spineY: S,
  animation: 'ray',
  cycleHz: 0.38,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'tail',
      role: 'tail',
      bend: false,
      z: 'back',
      pivot: [512, S],
      anim: { type: 'rotate', amp: 0.03, phase: -1.4 },
      svg: tailSvg(),
    },
    {
      name: 'pelvic',
      role: 'fin',
      bend: false,
      z: 'back',
      pivot: [512, S],
      anim: { type: 'scaleY', amp: 0.07, phase: -0.9 },
      svg: pelvicSvg(false) + pelvicSvg(true),
    },
    {
      name: 'discTop',
      role: 'wing',
      bend: false,
      z: 'back',
      pivot: [WING_PIVOT_X, S - WING_PIVOT_DY],
      anim: { type: 'scaleY', amp: 0.075 },
      svg: wingSvg(false),
    },
    {
      name: 'discBottom',
      role: 'wing',
      bend: false,
      z: 'back',
      pivot: [WING_PIVOT_X, S + WING_PIVOT_DY],
      anim: { type: 'scaleY', amp: 0.075 },
      svg: wingSvg(true),
    },
    { name: 'body', role: 'body', svg: bodySvg },
    { name: 'face', role: 'detail', svg: faceHalf(false) + faceHalf(true) },
    { name: 'eyes', role: 'eye', svg: eyeTop.svg + eyeBot.svg },
  ],
};

export default art;
