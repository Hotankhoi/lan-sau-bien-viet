/**
 * Cá đuối ó đốm – Aetobatus ocellatus
 * Góc nhìn từ trên xuống (đang "bay" ngang qua), đầu hướng PHẢI.
 * Đặc điểm nhận dạng: đĩa thân hình thoi rộng như đôi cánh; đầu nhô rõ, mắt lồi hai bên,
 * mõm tròn bè như mỏ vịt; mặt lưng xanh đen/nâu đen phủ đầy đốm trắng nhỏ (nhiều đốm có viền tối,
 * vài đốm dạng vòng); đôi vây bụng tròn ở gốc đuôi; vây lưng nhỏ + gai độc; đuôi rất dài như roi.
 * Hai cánh là lớp tách rời (bend:false) vỗ bằng scaleY quanh gốc cánh, đối xứng qua trục thân.
 */
import type { CreatureArt } from '../contract';
import { makeIds, eye, linear, radial, joinDefs, rng, mix, organicTexture, finRays } from '../style-bible';

const u = makeIds('duoi_o_dom');

// ---------- Hệ toạ độ ----------
const S = 260; // trục thân (spineY)
const PIVOT_OFF = 24; // gốc cánh cách trục thân

// ---------- Màu (ước lượng từ ảnh tham khảo) ----------
const ROOT = '#37353a'; // gốc cánh / mép thân – phải trùng nhau để không lộ đường nối
const MID = '#2c2e34';
const TIP = '#1f2329';
const RIDGE = '#4b4139'; // sống lưng nâu ấm
const SPOT = '#f3f0e6';
const RING = '#121418';
const OUTLINE = '#0e1013';
const BELLY = '#eef2ee';

type P = [number, number];
type Seg = { c1: P; c2: P; to: P } | { to: P };

const my = (p: P): P => [p[0], 2 * S - p[1]];

// ---------- Hình học ----------
function cubic(p0: P, p1: P, p2: P, p3: P, t: number): P {
  const m = 1 - t;
  const a = m * m * m;
  const b = 3 * m * m * t;
  const c = 3 * m * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

const f = (n: number) => n.toFixed(1);

/** Dựng path + đa giác xấp xỉ từ danh sách đoạn (đoạn thẳng hoặc Bezier bậc 3). */
function build(start: P, segs: Seg[], mirror = false) {
  const tr = (p: P) => (mirror ? my(p) : p);
  const s0 = tr(start);
  let d = `M${f(s0[0])} ${f(s0[1])}`;
  const poly: P[] = [s0];
  const outer: P[] = []; // điểm thuộc mép cong (để tính khoảng cách tới mép)
  let cur = s0;
  for (const s of segs) {
    const to = tr(s.to);
    if ('c1' in s) {
      const c1 = tr(s.c1);
      const c2 = tr(s.c2);
      d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(to[0])} ${f(to[1])}`;
      for (let i = 1; i <= 18; i++) {
        const p = cubic(cur, c1, c2, to, i / 18);
        poly.push(p);
        outer.push(p);
      }
    } else {
      d += `L${f(to[0])} ${f(to[1])}`;
      poly.push(to);
    }
    cur = to;
  }
  return { d: d + 'Z', poly, outer };
}

function inside(p: P, poly: P[]): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function distTo(p: P, pts: P[]): number {
  let m = Infinity;
  for (const q of pts) m = Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1]));
  return m;
}

// ---------- Cánh (vây ngực) – nửa trên; nửa dưới lấy đối xứng ----------
const WING_START: P = [772, S - 4];
const WING_SEGS: Seg[] = [
  { to: [762, S - 31] },
  // mép trước: dày, hơi lồi, quét ra sau tới chóp nhọn
  { c1: [753, S - 72], c2: [716, S - 152], to: [674, S - 210] },
  // chóp → mép sau lõm (hình lưỡi liềm)
  { c1: [662, S - 150], c2: [618, S - 92], to: [582, S - 64] },
  { c1: [560, S - 44], c2: [541, S - 26], to: [530, S - 10] },
  { to: [528, S - 4] },
];
const LEAD_TOP = `M762 ${S - 31}C753 ${S - 72} 716 ${S - 152} 674 ${S - 210}`;
const TRAIL_TOP = `M674 ${S - 210}C662 ${S - 150} 618 ${S - 92} 582 ${S - 64}C560 ${S - 44} 541 ${S - 26} 530 ${S - 10}`;
const mirrorPath = (d: string) =>
  d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_m, x: string, y: string) => `${x} ${f(2 * S - parseFloat(y))}`);

const wingTop = build(WING_START, WING_SEGS);
const wingBot = build(WING_START, WING_SEGS, true);

// ---------- Thân giữa (đầu + sống lưng), nửa trên rồi đối xứng ----------
const TRUNK_HALF: Seg[] = [
  // mõm mỏ vịt: bè, tròn
  { c1: [855, S - 10], c2: [850, S - 19], to: [840, S - 22] },
  { c1: [830, S - 25], c2: [818, S - 25], to: [808, S - 27] },
  // u mắt
  { c1: [800, S - 29], c2: [794, S - 33], to: [784, S - 33] },
  { c1: [775, S - 33], c2: [768, S - 31], to: [760, S - 33] },
  // vai (nằm trên cánh – không viền)
  { c1: [745, S - 37], c2: [725, S - 44], to: [700, S - 45] },
  { c1: [660, S - 46], c2: [625, S - 42], to: [602, S - 37] },
  { c1: [572, S - 30], c2: [548, S - 19], to: [530, S - 10] },
  { to: [520, S - 5] },
];
function trunkPath(): { d: string; poly: P[] } {
  const top = build([855, S], TRUNK_HALF);
  // nửa dưới: đi ngược các đoạn, đối xứng
  const pts: P[] = [[855, S]];
  let cur: P = [855, S];
  const ends: P[] = [cur, ...TRUNK_HALF.map((s) => s.to)];
  let d = top.d.replace(/Z$/, '');
  d += `L520 ${S + 5}`;
  for (let i = TRUNK_HALF.length - 1; i >= 0; i--) {
    const s = TRUNK_HALF[i];
    const to = my(ends[i]);
    if ('c1' in s) {
      const c1 = my(s.c2);
      const c2 = my(s.c1);
      d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(to[0])} ${f(to[1])}`;
    } else d += `L${f(to[0])} ${f(to[1])}`;
  }
  // đa giác thô cho việc rải đốm
  cur = [520, S + 5];
  for (const p of top.poly) pts.push(p);
  for (const p of [...top.poly].reverse()) pts.push(my(p));
  return { d: d + 'Z', poly: pts };
}
const TRUNK = trunkPath();

/** Viền đầu (chỉ phần đầu nhô ra trước cánh, nửa trên) */
const HEAD_EDGE_TOP = `M760 ${S - 33}C768 ${S - 31} 775 ${S - 33} 784 ${S - 33}C794 ${S - 33} 800 ${S - 29} 808 ${S - 27}C818 ${S - 25} 830 ${S - 25} 840 ${S - 22}C850 ${S - 19} 855 ${S - 10} 855 ${S}`;
const HEAD_EDGE_BOT = mirrorPath(HEAD_EDGE_TOP);

// ---------- Đốm ----------
interface SpotOpts {
  seed: number;
  poly: P[];
  outer: P[];
  count: number;
  box: { x: number; y: number; w: number; h: number };
  accept: (p: P, edge: number) => number; // xác suất nhận
  rBig: number;
  rSmall: number;
}
function spots(o: SpotOpts): string {
  const r = rng(o.seed);
  const placed: [number, number, number][] = [];
  let tries = 0;
  while (placed.length < o.count && tries < o.count * 60) {
    tries++;
    const p: P = [o.box.x + r() * o.box.w, o.box.y + r() * o.box.h];
    if (!inside(p, o.poly)) continue;
    const dEdge = distTo(p, o.outer);
    const edge = Math.max(0, Math.min(1, 1 - dEdge / 55)); // 1 = sát mép
    if (r() > o.accept(p, edge)) continue;
    const rad = (o.rBig + (o.rSmall - o.rBig) * edge) * (0.75 + r() * 0.5);
    if (dEdge < rad * 1.6) continue;
    if (placed.some(([x, y, rr]) => Math.hypot(x - p[0], y - p[1]) < (rr + rad) * 1.9 + 1.2)) continue;
    placed.push([p[0], p[1], rad]);
  }
  let rings = '';
  let whites = '';
  let ocelli = '';
  for (const [x, y, rad] of placed) {
    const k = r();
    const rx = rad * (0.85 + r() * 0.4);
    const ry = rad * (0.75 + r() * 0.35);
    const rot = (r() * 180).toFixed(0);
    const tf = `transform="rotate(${rot} ${f(x)} ${f(y)})"`;
    if (k < 0.07 && rad > 2.2) {
      // đốm dạng vòng: vòng trắng, tâm tối
      ocelli += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${(rx * 1.25).toFixed(2)}" ry="${(ry * 1.25).toFixed(2)}" ${tf} fill="${RING}" fill-opacity="0.75" stroke="${SPOT}" stroke-width="${(rad * 0.5).toFixed(2)}"/>`;
      continue;
    }
    if (k < 0.72) rings += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${(rx * 1.5).toFixed(2)}" ry="${(ry * 1.5).toFixed(2)}" ${tf}/>`;
    whites += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" ${tf}/>`;
  }
  return (
    `<g fill="${RING}" fill-opacity="0.62">${rings}</g>` +
    `<g fill="${SPOT}" fill-opacity="0.93">${whites}</g>` +
    ocelli
  );
}

function wingSpots(seed: number, w: { poly: P[]; outer: P[] }, bottom: boolean): string {
  const box = bottom ? { x: 525, y: S + 26, w: 250, h: 190 } : { x: 525, y: S - 216, w: 250, h: 190 };
  return spots({
    seed,
    poly: w.poly,
    outer: w.outer,
    count: 175,
    box,
    rBig: 3.6,
    rSmall: 1.7,
    accept: (p, edge) => {
      const lat = Math.abs(p[1] - S);
      if (lat < 30) return 0; // dưới thân giữa
      const rear = Math.max(0, Math.min(1, (690 - p[0]) / 140)); // nửa sau cánh dày hơn
      return 0.18 + 0.55 * edge + 0.3 * rear;
    },
  });
}

// ---------- Đuôi roi ----------
function tail() {
  const p0: P = [536, S];
  const p1: P = [400, S + 3];
  const p2: P = [230, S + 40];
  const p3: P = [34, S + 20];
  const n = 60;
  const left: P[] = [];
  const right: P[] = [];
  const center: P[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = cubic(p0, p1, p2, p3, t);
    const q = cubic(p0, p1, p2, p3, Math.min(1, t + 0.002));
    const pp = cubic(p0, p1, p2, p3, Math.max(0, t - 0.002));
    const dx = q[0] - pp[0];
    const dy = q[1] - pp[1];
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L;
    const ny = dx / L;
    const w = 7.5 * Math.pow(1 - t, 1.4) + 0.7;
    left.push([p[0] + nx * w, p[1] + ny * w]);
    right.push([p[0] - nx * w, p[1] - ny * w]);
    center.push(p);
  }
  const pts = [...left, ...right.reverse()];
  const d = `M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`;
  // nét sáng chạy dọc mép trên của roi
  const hi = left.slice(2, 44);
  const hiD = `M${hi.map((p) => `${f(p[0])} ${f(p[1] + 0.9)}`).join('L')}`;
  // vài chấm trắng nhỏ ở gốc đuôi
  const r = rng(91);
  let dots = '';
  for (let i = 0; i < 9; i++) {
    const t = 0.03 + i * 0.012 + r() * 0.006;
    const p = cubic(p0, p1, p2, p3, t);
    dots += `<circle cx="${f(p[0])}" cy="${f(p[1] + (r() - 0.5) * 6)}" r="${(0.9 + r() * 0.7).toFixed(2)}"/>`;
  }
  // gai độc (răng cưa nhỏ) nằm dọc gốc đuôi sau vây lưng
  let spine = `M500 ${S - 0.6}L462 ${S + 0.2}L500 ${S + 1.6}Z`;
  for (let x = 468; x < 498; x += 4) spine += `M${x} ${S - 0.2}l2 -1.6l1 1.6Z`;
  return (
    `<path d="${d}" fill="${u.url('tail')}" stroke="${OUTLINE}" stroke-opacity="0.5" stroke-width="0.8" stroke-linejoin="round"/>` +
    `<path d="${hiD}" fill="none" stroke="#c9d6dc" stroke-opacity="0.28" stroke-width="1.1" stroke-linecap="round"/>` +
    `<g fill="${SPOT}" fill-opacity="0.8">${dots}</g>` +
    // vây lưng nhỏ (nhìn từ trên: lá hẹp dọc sống đuôi)
    `<path d="M534 ${S}Q520 ${S - 6.5} 501 ${S - 1.5}Q518 ${S + 4.5} 534 ${S}Z" fill="#3b3534" stroke="#8d8a86" stroke-opacity="0.45" stroke-width="0.6"/>` +
    `<path d="${spine}" fill="#b8aa92" fill-opacity="0.85" stroke="#6d6252" stroke-opacity="0.5" stroke-width="0.4"/>`
  );
}

// ---------- Vây bụng tròn ở gốc đuôi ----------
const PELVIC_TOP = `M548 ${S - 6}C541 ${S - 22} 522 ${S - 29} 509 ${S - 23}C500 ${S - 18} 502 ${S - 8} 514 ${S - 4}Z`;
const PELVIC_BOT = mirrorPath(PELVIC_TOP);

// ---------- Cánh: lắp ráp ----------
function wingSvg(bottom: boolean): string {
  const w = bottom ? wingBot : wingTop;
  const id = bottom ? 'wingBot' : 'wingTop';
  const lead = bottom ? mirrorPath(LEAD_TOP) : LEAD_TOP;
  const trail = bottom ? mirrorPath(TRAIL_TOP) : TRAIL_TOP;
  const sgn = bottom ? 1 : -1;
  // gân sụn tỏa từ gốc cánh ra mép (rất mờ)
  const bases: P[] = [];
  const tips: P[] = [];
  const outerPts = w.outer.filter((p) => Math.abs(p[1] - S) > 40);
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    bases.push([548 + t * 206, S + sgn * 30]);
    const q = outerPts[Math.round((1 - t) * (outerPts.length - 1))];
    tips.push([q[0], q[1] - sgn * 4]);
  }
  return (
    `<g filter="${u.url('skin')}"><path d="${w.d}" fill="${u.url(id + 'Fill')}"/></g>` +
    `<g clip-path="${u.url(id + 'Clip')}">` +
    finRays(bases, tips, { color: '#0b0d10', opacity: 0.14, width: 1.6, bend: 0.03 }) +
    finRays(bases.map((b) => [b[0] + 3, b[1]] as P), tips.map((t) => [t[0] + 3, t[1]] as P), { color: '#9aa7ad', opacity: 0.05, width: 1.2, bend: 0.03 }) +
    // ánh sáng mềm trên mặt cánh (nắng từ trên, lệch về đầu)
    `<path d="${w.d}" fill="${u.url(id + 'Sheen')}"/>` +
    // mép sau mỏng hơi sáng
    `<path d="${trail}" fill="none" stroke="#8a7a68" stroke-opacity="0.35" stroke-width="5"/>` +
    wingSpots(bottom ? 404 : 202, w, bottom) +
    // mép trước dày: dải tối mảnh bên trong
    `<path d="${lead}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.35" stroke-width="7"/>` +
    (bottom ? `<path d="${lead}" fill="none" stroke="${BELLY}" stroke-opacity="0.35" stroke-width="2.2" transform="translate(0 1.2)"/>` : '') +
    `</g>` +
    `<path d="${lead}${trail.replace(/^M[^C]+/, '')}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.6" stroke-width="1.8" stroke-linejoin="round"/>` +
    `<path d="${lead}" fill="none" stroke="${u.url(id + 'Rim')}" stroke-width="${bottom ? 1.6 : 2.4}" stroke-linecap="round" transform="translate(0 ${bottom ? 0 : 1.2})"/>`
  );
}

// ---------- Mắt (lồi hai bên đầu) ----------
const eyeTop = eye(u, 'eyeTop', { cx: 790, cy: S - 32, r: 6.2, iris: ['#9c7a44', '#2b1e10'], socket: '#16171a', look: [0.4, -0.2] });
const eyeBot = eye(u, 'eyeBot', { cx: 790, cy: S + 32, r: 6.2, iris: ['#8a6c3c', '#241a0e'], socket: '#16171a', look: [0.4, 0.2] });

// ---------- defs ----------
const defs = joinDefs(
  eyeTop,
  eyeBot,
  organicTexture(u('skin'), { freq: 0.05, octaves: 3, strength: 0.16, seed: 11 }),
  `<clipPath id="${u('wingTopClip')}"><path d="${wingTop.d}"/></clipPath>`,
  `<clipPath id="${u('wingBotClip')}"><path d="${wingBot.d}"/></clipPath>`,
  `<clipPath id="${u('trunkClip')}"><path d="${TRUNK.d}"/></clipPath>`,
  linear(u('wingTopFill'), [[0, ROOT], [0.1, ROOT], [0.5, MID], [1, TIP]], { user: true, x1: 0, y1: S - PIVOT_OFF, x2: 0, y2: S - 210 }),
  linear(u('wingBotFill'), [[0, ROOT], [0.1, ROOT], [0.5, MID], [1, shade2(TIP)]], { user: true, x1: 0, y1: S + PIVOT_OFF, x2: 0, y2: S + 210 }),
  radial(u('wingTopSheen'), [[0, '#d8e6ea', 0.16], [0.55, '#d8e6ea', 0.05], [1, '#d8e6ea', 0]], { user: true, cx: 700, cy: S - 120, r: 120 }),
  radial(u('wingBotSheen'), [[0, '#d8e6ea', 0.08], [0.6, '#d8e6ea', 0.02], [1, '#d8e6ea', 0]], { user: true, cx: 700, cy: S + 110, r: 110 }),
  linear(u('wingTopRim'), [[0, '#e4f2f6', 0.75], [0.7, '#e4f2f6', 0.35], [1, '#e4f2f6', 0.1]], { user: true, x1: 762, y1: S - 31, x2: 674, y2: S - 210 }),
  linear(u('wingBotRim'), [[0, '#e4f2f6', 0.3], [1, '#e4f2f6', 0.05]], { user: true, x1: 762, y1: S + 31, x2: 674, y2: S + 210 }),
  // thân giữa: mép trùng màu gốc cánh, sống lưng nâu ấm
  linear(
    u('trunkFill'),
    [
      [0, ROOT],
      [0.18, ROOT],
      [0.42, mix(ROOT, RIDGE, 0.85)],
      [0.5, RIDGE],
      [0.6, mix(ROOT, RIDGE, 0.7)],
      [0.82, ROOT],
      [1, ROOT],
    ],
    { user: true, x1: 0, y1: S - 48, x2: 0, y2: S + 48 },
  ),
  radial(u('ridgeHi'), [[0, '#efe2cf', 0.2], [0.6, '#efe2cf', 0.05], [1, '#efe2cf', 0]], { user: true, cx: 720, cy: S - 4, r: 70, transform: `translate(720 ${S - 4}) scale(2.4 0.32) translate(-720 ${-(S - 4)})` }),
  radial(u('headHi'), [[0, '#e9eef0', 0.22], [1, '#e9eef0', 0]], { user: true, cx: 826, cy: S - 8, r: 26 }),
  linear(u('headRim'), [[0, '#ffffff', 0.15], [0.6, '#ffffff', 0.55], [1, '#ffffff', 0.6]], { user: true, x1: 762, y1: 0, x2: 855, y2: 0 }),
  linear(u('tail'), [[0, '#2b2a2c'], [0.3, '#1c1d21'], [1, '#141518']], { user: true, x1: 536, y1: 0, x2: 34, y2: 0 }),
  linear(u('pelvic'), [[0, '#3a3433'], [1, '#26272b']], { user: true, x1: 548, y1: 0, x2: 502, y2: 0 }),
);

function shade2(c: string): string {
  return mix(c, '#000000', 0.12);
}

// ---------- Thân giữa: đốm + chi tiết ----------
const trunkSpots = spots({
  seed: 57,
  poly: TRUNK.poly,
  outer: TRUNK.poly.filter((p) => p[0] < 760),
  count: 34,
  box: { x: 530, y: S - 46, w: 260, h: 92 },
  rBig: 3.4,
  rSmall: 2.2,
  accept: (p) => (p[0] > 770 ? 0.15 : 0.6),
});

const bodySvg =
  `<g filter="${u.url('skin')}"><path d="${TRUNK.d}" fill="${u.url('trunkFill')}"/></g>` +
  `<g clip-path="${u.url('trunkClip')}">` +
  `<path d="${TRUNK.d}" fill="${u.url('ridgeHi')}"/>` +
  `<path d="${TRUNK.d}" fill="${u.url('headHi')}"/>` +
  trunkSpots +
  // bụng trắng lộ ở mép dưới đầu (nhìn hơi chếch)
  `<path d="M764 ${S + 33}C786 ${S + 37} 800 ${S + 30} 808 ${S + 27}C820 ${S + 24} 838 ${S + 27} 848 ${S + 15}C842 ${S + 22} 828 ${S + 22} 812 ${S + 23}C798 ${S + 25} 784 ${S + 30} 764 ${S + 30}Z" fill="${BELLY}" fill-opacity="0.55"/>` +
  `</g>` +
  // vây bụng
  `<path d="${PELVIC_TOP}" fill="${u.url('pelvic')}" stroke="${OUTLINE}" stroke-opacity="0.55" stroke-width="1.2"/>` +
  `<path d="${PELVIC_BOT}" fill="${u.url('pelvic')}" stroke="${OUTLINE}" stroke-opacity="0.55" stroke-width="1.2"/>` +
  `<g fill="${SPOT}" fill-opacity="0.85"><circle cx="520" cy="${S - 18}" r="1.4"/><circle cx="530" cy="${S - 13}" r="1.1"/><circle cx="512" cy="${S - 13}" r="1"/><circle cx="521" cy="${S + 19}" r="1.3"/><circle cx="531" cy="${S + 13}" r="1.1"/><circle cx="511" cy="${S + 12}" r="1"/></g>` +
  `<path d="M548 ${S - 6}C541 ${S - 22} 522 ${S - 29} 509 ${S - 23}" fill="none" stroke="#d6dfe2" stroke-opacity="0.25" stroke-width="1"/>` +
  // viền đầu + rim light
  `<path d="${HEAD_EDGE_TOP}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.6" stroke-width="1.8"/>` +
  `<path d="${HEAD_EDGE_BOT}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.6" stroke-width="1.8"/>` +
  `<path d="${HEAD_EDGE_TOP}" fill="none" stroke="${u.url('headRim')}" stroke-width="2.2" transform="translate(0 1.3)"/>`;

const faceSvg =
  // nếp ngăn thùy mõm (mỏ vịt)
  `<path d="M818 ${S - 24}Q829 ${S} 818 ${S + 24}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.32" stroke-width="1.4"/>` +
  `<path d="M821 ${S - 22}Q831 ${S} 821 ${S + 22}" fill="none" stroke="#dfe7ea" stroke-opacity="0.14" stroke-width="1"/>` +
  // gờ sọ giữa hai mắt
  `<path d="M760 ${S - 14}Q790 ${S - 20} 812 ${S - 14}" fill="none" stroke="#e9dcc8" stroke-opacity="0.16" stroke-width="2"/>` +
  `<path d="M760 ${S + 14}Q790 ${S + 20} 812 ${S + 14}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.18" stroke-width="2"/>` +
  // lỗ thở (spiracle) sau mắt
  `<g fill="#0b0c0e" fill-opacity="0.85"><ellipse cx="771" cy="${S - 25}" rx="4.6" ry="2" transform="rotate(-12 771 ${S - 25})"/><ellipse cx="771" cy="${S + 25}" rx="4.6" ry="2" transform="rotate(12 771 ${S + 25})"/></g>` +
  `<g fill="none" stroke="#c9d3d6" stroke-opacity="0.3" stroke-width="0.8"><path d="M767 ${S - 27.5}Q771 ${S - 28.5} 775 ${S - 27.5}"/><path d="M767 ${S + 22.5}Q771 ${S + 21.5} 775 ${S + 22.5}"/></g>`;

const art: CreatureArt = {
  id: 'duoi_o_dom',
  viewBox: [880, 520],
  lengthUnits: 821,
  spineY: S,
  animation: 'ray',
  cycleHz: 0.42,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'tail',
      role: 'tail',
      bend: false,
      z: 'back',
      pivot: [536, S],
      anim: { type: 'rotate', amp: 0.03, phase: -1.3 },
      svg: tail(),
    },
    {
      name: 'wingTop',
      role: 'wing',
      bend: false,
      z: 'back',
      pivot: [650, S - PIVOT_OFF],
      anim: { type: 'scaleY', amp: 0.24 },
      svg: wingSvg(false),
    },
    {
      name: 'wingBottom',
      role: 'wing',
      bend: false,
      z: 'back',
      pivot: [650, S + PIVOT_OFF],
      anim: { type: 'scaleY', amp: 0.24 },
      svg: wingSvg(true),
    },
    { name: 'body', role: 'body', svg: bodySvg },
    { name: 'face', role: 'detail', svg: faceSvg },
    { name: 'eyes', role: 'eye', svg: eyeTop.svg + eyeBot.svg },
  ],
};

export default art;
