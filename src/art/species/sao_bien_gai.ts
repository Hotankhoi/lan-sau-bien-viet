/**
 * Sao biển gai – Acanthaster planci (crown-of-thorns starfish)
 * Đặc điểm nhận dạng: đĩa trung tâm to phồng như vòm; 16 cánh ngắn gốc rộng; toàn thân phủ gai
 * nhọn dài (gốc xám tím nhạt, đầu đỏ cam); da đỏ tía / tím mận lấm tấm hạt papulae; sống cánh xanh tím.
 * Góc nhìn 3/4 từ trên xuống (nằm trên đáy). Hình học dựng bằng phép chiếu xiên đơn giản:
 * mặt phẳng đáy (X, Z) + chiều cao H → toạ độ viewBox.
 */
import type { CreatureArt } from '../contract';
import { makeIds, linear, radial, joinDefs, rng, smoothPath, dotPattern, rimGradient, mix, shade } from '../style-bible';

const u = makeIds('sao_bien_gai');

// ---------- Bảng màu ----------
const SKIN = '#6B2348';
const SKIN_D = '#45122F';
const SKIN_L = '#8E4A7C';
const RIDGE = '#A39AD0';
const RIDGE_L = '#CFC6EC';
const OUT = '#2E0C22';
const PAPULA = '#2F0A1D';
const SPINE = '#CDB9C9';
const SPINE_FAR = '#A98DA5';
const SPINE_MID = '#D98B5E';
const TIP = '#E5552B';
const TIP_FAR = '#B9452A';

// ---------- Phép chiếu ----------
const CX = 290;
const CY = 196;
const K = 0.68; // nén trục sâu (Z)
const KH = 0.74; // nén chiều cao (H)
type V3 = [number, number, number]; // X, Z (sâu, + = gần người xem), H (cao)
const P = (v: V3): [number, number] => [CX + v[0], CY + v[1] * K - v[2] * KH];
const f = (n: number) => n.toFixed(1);
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

// ---------- Đĩa ----------
const R = 100; // bán kính đĩa (mặt đáy)
const HC = 38; // chiều cao đỉnh vòm
const HE = 13; // chiều cao mép đĩa
const hDisc = (r: number) => HE + (HC - HE) * Math.max(0, 1 - (r / R) ** 2);

// ---------- Spine ----------
interface SpineBuf {
  body: string;
  base: string;
  mid: string;
  tip: string;
  hi: string;
}
const newBuf = (): SpineBuf => ({ body: '', base: '', mid: '', tip: '', hi: '' });

/** Một gai: thân thuôn nhọn (xám tím) + đoạn chuyển cam + đầu đỏ cam. */
function spine(buf: SpineBuf, base: V3, dir: V3, len: number, w: number, curve = 0) {
  const b = P(base);
  const t = P(add(base, norm(dir), len));
  const dx = t[0] - b[0];
  const dy = t[1] - b[1];
  const L = Math.hypot(dx, dy);
  if (L < 3) return;
  const nx = -dy / L;
  const ny = dx / L;
  const at = (k: number, side: number, wk: number): string => {
    const bow = Math.sin(Math.PI * k) * curve * L;
    return `${f(b[0] + dx * k + nx * (side * wk + bow))} ${f(b[1] + dy * k + ny * (side * wk + bow))}`;
  };
  const poly = (k0: number) => {
    const w0 = w * (1 - k0);
    const km = (k0 + 1) / 2;
    const wm = w * (1 - km);
    return `M${at(k0, 1, w0)}L${at(km, 1, wm)}L${f(t[0])} ${f(t[1])}L${at(km, -1, wm)}L${at(k0, -1, w0)}Z`;
  };
  // đoạn gốc (0 → k1) để gai "mọc" ra từ da
  const seg = (k0: number, k1: number) =>
    `M${at(k0, 1, w * (1 - k0))}L${at(k1, 1, w * (1 - k1))}L${at(k1, -1, w * (1 - k1))}L${at(k0, -1, w * (1 - k0))}Z`;
  buf.body += poly(0);
  buf.base += seg(0, 0.2);
  buf.mid += poly(0.4);
  buf.tip += poly(0.62);
  // nét sáng phía hứng nắng (phía trên màn hình)
  const up = ny < 0 ? 1 : -1;
  if (L > 10) buf.hi += `M${at(0.12, up, w * 0.45)}L${at(0.5, up, w * 0.25)}`;
}

function spineSvg(buf: SpineBuf, far: boolean): string {
  if (!buf.body) return '';
  return (
    `<path d="${buf.body}" fill="${far ? SPINE_FAR : SPINE}" stroke="${OUT}" stroke-width="0.5" stroke-opacity="${far ? 0.5 : 0.38}" stroke-linejoin="round"/>` +
    `<path d="${buf.base}" fill="${SKIN_L}" fill-opacity="${far ? 0.7 : 0.55}"/>` +
    `<path d="${buf.mid}" fill="${SPINE_MID}" fill-opacity="${far ? 0.55 : 0.8}"/>` +
    (far ? '' : `<path d="${buf.hi}" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="0.45" stroke-linecap="round"/>`) +
    `<path d="${buf.tip}" fill="${far ? TIP_FAR : TIP}"/>`
  );
}

// ---------- Cánh ----------
interface Arm {
  i: number;
  theta: number;
  len: number;
  w0: number;
  wig: number;
  ph: number;
  r0: number;
  curl: number;
  seed: number;
}

const N_ARMS = 16;
const ARMS: Arm[] = (() => {
  const r = rng(4242);
  const out: Arm[] = [];
  for (let i = 0; i < N_ARMS; i++) {
    const theta = (i / N_ARMS) * Math.PI * 2 + 0.11 + (r() - 0.5) * 0.14;
    const front = Math.sin(theta) > 0.2;
    out.push({
      i,
      theta,
      len: 162 + r() * 26,
      w0: 25 + r() * 4,
      wig: (r() - 0.5) * 16,
      ph: r() * 2,
      r0: front ? 70 : 48,
      curl: r() < 0.35 ? 6 + r() * 8 : 0,
      seed: 100 + i * 17,
    });
  }
  return out;
})();

/** Điểm trên trục cánh (t: 0 gốc → 1 mút) */
function armFrame(a: Arm, t: number) {
  const ux = Math.cos(a.theta);
  const uz = Math.sin(a.theta);
  const n: V3 = [-uz, ux, 0];
  const dist = a.r0 + (a.len - a.r0) * t;
  const off = a.wig * Math.sin(Math.PI * t * 0.9 + a.ph) * t;
  const H0 = hDisc(a.r0) - 2;
  const H = 3 + (H0 - 3) * Math.pow(1 - t, 2.1) + a.curl * Math.pow(Math.max(0, t - 0.7) / 0.3, 2);
  const c: V3 = [ux * dist + n[0] * off, uz * dist + n[1] * off, H];
  const w = a.w0 * (1 - 0.82 * Math.pow(t, 0.85)) + 1.5;
  return { c, n, u: [ux, uz, 0] as V3, w, H };
}

function renderArm(a: Arm): string {
  const STEPS = 14;
  const top: [number, number][] = [];
  const topR: [number, number][] = [];
  const foot: [number, number][] = [];
  const footR: [number, number][] = [];
  const ridge: [number, number][] = [];
  const ridgeR: [number, number][] = [];
  const ridgeLine: [number, number][] = [];
  for (let s = 0; s <= STEPS; s++) {
    const t = s / STEPS;
    const { c, n, w, H } = armFrame(a, t);
    const edgeH = Math.max(1.5, H - w * 0.3);
    top.push(P([c[0] + n[0] * w, c[1] + n[1] * w, edgeH]));
    topR.push(P([c[0] - n[0] * w, c[1] - n[1] * w, edgeH]));
    foot.push(P([c[0] + n[0] * w * 1.02, c[1] + n[1] * w * 1.02, Math.max(0, H * 0.25 - 1)]));
    footR.push(P([c[0] - n[0] * w * 1.02, c[1] - n[1] * w * 1.02, Math.max(0, H * 0.25 - 1)]));
    const rw = w * 0.3 * (1 - t * 0.4) * Math.min(1, 0.25 + t * 6);
    ridge.push(P([c[0] + n[0] * rw, c[1] + n[1] * rw, H - 0.5]));
    ridgeR.push(P([c[0] - n[0] * rw, c[1] - n[1] * rw, H - 0.5]));
    ridgeLine.push(P([c[0], c[1], H + 0.6]));
  }
  const tipF = armFrame(a, 1.04);
  const tipTop = P(tipF.c);
  const tipFoot = P([tipF.c[0], tipF.c[1], 0]);
  const ring = [...top, tipTop, ...topR.reverse()];
  const topD = smoothPath(ring, true, 0.45);
  // viền chỉ hai bên + mút (không viền ngang gốc để cánh liền với đĩa)
  const skip = a.r0 >= 60 ? 2 : 1;
  const outlineD = smoothPath(ring.slice(skip, ring.length - skip), false, 0.45);
  const footD = smoothPath([...foot, tipFoot, ...footR.reverse()], true, 0.45);
  const ridgeD = smoothPath([...ridge, ...ridgeR.reverse()], true, 0.45);
  const ridgeLineD = smoothPath(ridgeLine.slice(0, -1), false);

  // gradient ngang cánh (mép tối – sống sáng), sáng hơn ở phía mép hứng nắng (phía trên màn hình)
  const g0 = top[3];
  const g1 = topR[topR.length - 1 - 3];
  const lightFirst = g0[1] < g1[1];
  const gid = `arm${a.i}`;
  const grad = linear(
    u(gid),
    [
      [0, lightFirst ? SKIN : SKIN_D],
      [0.3, lightFirst ? SKIN_L : SKIN],
      [0.5, mix(SKIN_L, RIDGE, 0.15)],
      [0.72, lightFirst ? SKIN : SKIN_L],
      [1, lightFirst ? SKIN_D : SKIN],
    ],
    { user: true, x1: +g0[0].toFixed(1), y1: +g0[1].toFixed(1), x2: +g1[0].toFixed(1), y2: +g1[1].toFixed(1) },
  );
  ARM_DEFS.push(grad);

  // gai
  const r = rng(a.seed);
  const far = newBuf();
  const near = newBuf();
  const ridgeSp = newBuf();
  for (const side of [1, -1]) {
    // mép phía xa người xem (Z nhỏ) thì gai vẽ sau thân cánh
    const isFar = side * Math.cos(a.theta) < 0.05;
    const buf = isFar ? far : near;
    // hàng mép: xòe ngang
    for (let k = 0; k < 14; k++) {
      const t = 0.03 + k * 0.07 + (side > 0 ? 0 : 0.035) + (r() - 0.5) * 0.025;
      if (t > 0.97) continue;
      const fr = armFrame(a, t);
      const base = add(fr.c, fr.n, side * fr.w * 0.92);
      base[2] = Math.max(1.5, fr.H - fr.w * 0.4);
      const el = 0.32 + r() * 0.25;
      const fwd = 0.35 + r() * 0.25;
      const dir: V3 = [
        fr.n[0] * side * Math.cos(el) + fr.u[0] * fwd,
        fr.n[1] * side * Math.cos(el) + fr.u[1] * fwd,
        Math.sin(el),
      ];
      const len = (34 + r() * 12) * (1 - t * 0.42);
      spine(buf, base, dir, len, 1.75 * (1 - t * 0.3), (r() - 0.5) * 0.06);
    }
    // hàng sườn trên: dựng hơn, ngắn hơn
    for (let k = 0; k < 12; k++) {
      const t = 0.05 + k * 0.075 + (side > 0 ? 0.035 : 0) + (r() - 0.5) * 0.025;
      if (t > 0.92) continue;
      const fr = armFrame(a, t);
      const base = add(fr.c, fr.n, side * fr.w * 0.55);
      base[2] = fr.H - fr.w * 0.12;
      const el = 0.7 + r() * 0.3;
      const fwd = 0.3 + r() * 0.2;
      const dir: V3 = [
        fr.n[0] * side * Math.cos(el) + fr.u[0] * fwd,
        fr.n[1] * side * Math.cos(el) + fr.u[1] * fwd,
        Math.sin(el),
      ];
      const len = (28 + r() * 10) * (1 - t * 0.4);
      spine(buf, base, dir, len, 1.6, (r() - 0.5) * 0.08);
    }
  }
  // gai sống cánh
  for (let k = 0; k < 9; k++) {
    const t = 0.05 + k * 0.1 + (r() - 0.5) * 0.04;
    const fr = armFrame(a, t);
    const base: V3 = [fr.c[0], fr.c[1], fr.H];
    const sd = (r() - 0.5) * 0.6;
    const dir: V3 = [fr.u[0] * 0.45 + fr.n[0] * sd, fr.u[1] * 0.45 + fr.n[1] * sd, 1];
    spine(ridgeSp, base, dir, (20 + r() * 9) * (1 - t * 0.4), 1.5, (r() - 0.5) * 0.08);
  }

  return (
    `<g>` +
    spineSvg(far, true) +
    // thành bên cánh (phần chân chạm đáy)
    `<path d="${footD}" fill="${mix(SKIN, SKIN_D, 0.5)}" stroke="${OUT}" stroke-width="1.2" stroke-opacity="0.55"/>` +
    `<path d="${footD}" fill="${u.url('sideShade')}"/>` +
    // mặt lưng cánh
    `<path d="${topD}" fill="${u.url(gid)}"/>` +
    `<path d="${topD}" fill="${u.url('papulae')}"/>` +
    `<path d="${topD}" fill="${u.url('papulae2')}"/>` +
    `<path d="${ridgeD}" fill="${RIDGE}" fill-opacity="0.5"/>` +
    `<path d="${ridgeLineD}" fill="none" stroke="${RIDGE_L}" stroke-opacity="0.55" stroke-width="1.2" stroke-linecap="round"/>` +
    `<path d="${outlineD}" fill="none" stroke="${OUT}" stroke-width="1.2" stroke-opacity="0.5" stroke-linejoin="round"/>` +
    spineSvg(near, false) +
    spineSvg(ridgeSp, false) +
    `</g>`
  );
}

const ARM_DEFS: string[] = [];

// ---------- Phân nhóm cánh theo độ sâu ----------
const depth = (a: Arm) => Math.sin(a.theta);
const sorted = [...ARMS].sort((p, q) => depth(p) - depth(q));
const animBack = sorted[0]; // cánh xa nhất – cử động nhẹ, vẽ sau cùng phía sau
const animFrontA = sorted[sorted.length - 1]; // gần nhất
const animFrontB = sorted[sorted.length - 2];
const staticArms = sorted.filter((a) => a !== animBack && a !== animFrontA && a !== animFrontB);
const backArms = staticArms.filter((a) => a.r0 < 60);
const frontArms = staticArms.filter((a) => a.r0 >= 60);

const armsBackSvg = backArms.map(renderArm).join('');
const armsFrontSvg = frontArms.map(renderArm).join('');
const animBackSvg = renderArm(animBack);
const animFrontASvg = renderArm(animFrontA);
const animFrontBSvg = renderArm(animFrontB);

const pivotOf = (a: Arm): [number, number] => {
  const r = R * 0.85;
  const p = P([Math.cos(a.theta) * r, Math.sin(a.theta) * r, hDisc(r)]);
  return [+p[0].toFixed(1), +p[1].toFixed(1)];
};

// ---------- Đĩa ----------
function discPath(): string {
  const pts: [number, number][] = [];
  const M = 48;
  for (let i = 0; i < M; i++) {
    const phi = (i / M) * Math.PI * 2;
    const lobe = 1 + 0.05 * Math.cos(phi * N_ARMS - 0.11 * N_ARMS);
    const s = Math.sin(phi);
    const rr = R * lobe * (1 + 0.06 * Math.max(0, s));
    const h = s < 0 ? HE + (HC - HE) * 0.62 * Math.pow(-s, 0.8) : HE - (HE - 2) * Math.pow(s, 0.7);
    pts.push(P([Math.cos(phi) * rr, s * rr, h]));
  }
  return smoothPath(pts, true, 0.5);
}
const DISC = discPath();

function discSurface(): { ridges: string; spines: string; plates: string } {
  // rãnh xanh tím chạy từ tâm ra mỗi cánh
  let ridges = '';
  for (const a of ARMS) {
    const pts: [number, number][] = [];
    for (let k = 0; k <= 6; k++) {
      const rr = 58 + (k / 6) * (R * 0.96 - 58);
      pts.push(P([Math.cos(a.theta) * rr, Math.sin(a.theta) * rr, hDisc(rr) + 0.5]));
    }
    ridges += smoothPath(pts, false);
  }
  // gai trên đĩa, chia 3 dải sâu để vẽ xa trước gần sau
  const r = rng(909);
  const bins = [newBuf(), newBuf(), newBuf()];
  const items: { base: V3; dir: V3; len: number; z: number }[] = [];
  for (let i = 0; i < 190; i++) {
    const rr = Math.sqrt(r()) * R * 0.97;
    const ang = r() * Math.PI * 2;
    const X = Math.cos(ang) * rr;
    const Z = Math.sin(ang) * rr;
    const el = 1.4 - (rr / R) * 0.7 + (r() - 0.5) * 0.35;
    const dir: V3 = [Math.cos(ang) * Math.cos(el), Math.sin(ang) * Math.cos(el), Math.sin(el)];
    items.push({ base: [X, Z, hDisc(rr) - 0.5], dir, len: 22 + r() * 12 - (rr / R) * 3, z: Z });
  }
  items.sort((p, q) => p.z - q.z);
  items.forEach((it, idx) => {
    const b = bins[Math.min(2, Math.floor((idx / items.length) * 3))];
    spine(b, it.base, it.dir, it.len, 1.7, (r() - 0.5) * 0.08);
  });
  const spines = bins.map((b) => spineSvg(b, false)).join('');
  // tấm madreporite & lỗ hậu môn ở tâm
  const c = P([4, -6, HC]);
  const plates =
    `<ellipse cx="${f(c[0] + 16)}" cy="${f(c[1] + 6)}" rx="5.5" ry="3.2" fill="${RIDGE_L}" fill-opacity="0.75" stroke="${OUT}" stroke-opacity="0.4" stroke-width="0.6"/>` +
    `<ellipse cx="${f(c[0] - 12)}" cy="${f(c[1] + 3)}" rx="4.2" ry="2.5" fill="${RIDGE_L}" fill-opacity="0.65" stroke="${OUT}" stroke-opacity="0.4" stroke-width="0.6"/>` +
    `<ellipse cx="${f(c[0] + 2)}" cy="${f(c[1] - 4)}" rx="2.6" ry="1.6" fill="${SKIN_D}"/>`;
  return { ridges, spines, plates };
}
const surf = discSurface();

// rim light chỉ ở nửa trên của đĩa
const RIM_D = (() => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 20; i++) {
    const phi = Math.PI * 1.08 + (i / 20) * Math.PI * 0.84;
    const s = Math.sin(phi);
    pts.push(P([Math.cos(phi) * R, s * R, HE + (HC - HE) * 0.62 * Math.pow(Math.max(0, -s), 0.8)]));
  }
  return smoothPath(pts, false);
})();

const [scx, scy] = P([0, 10, 0]);
const discTop = P([0, -10, HC]);

const defs = joinDefs(
  ...ARM_DEFS,
  linear(u('spine'), [
    [0, shade(SPINE, 0.12)],
    [1, SPINE],
  ]),
  linear(u('sideShade'), [
    [0, '#000000', 0],
    [1, '#000000', 0.35],
  ]),
  dotPattern(u('papulae'), { gap: 5.2, r: 1.05, color: PAPULA, opacity: 0.55 }),
  dotPattern(u('papulae2'), { gap: 7.4, r: 0.8, color: '#C47A9E', opacity: 0.22, offset: false }),
  radial(
    u('disc'),
    [
      [0, mix(SKIN_L, RIDGE, 0.25)],
      [0.35, SKIN_L],
      [0.7, SKIN],
      [1, SKIN_D],
    ],
    { user: true, cx: +discTop[0].toFixed(1), cy: +discTop[1].toFixed(1), r: 118 },
  ),
  radial(
    u('discVol'),
    [
      [0, '#ffffff', 0.22],
      [0.4, '#ffffff', 0],
      [0.75, '#000000', 0],
      [1, '#000000', 0.32],
    ],
    { cx: 0.47, cy: 0.3, r: 0.72 },
  ),
  radial(
    u('shadow'),
    [
      [0, '#06141c', 0.5],
      [0.65, '#06141c', 0.28],
      [1, '#06141c', 0],
    ],
    { user: true, cx: scx, cy: scy, r: 250, transform: `translate(${scx} ${scy}) scale(1 0.56) translate(${-scx} ${-scy})` },
  ),
  rimGradient(u('rim'), '#ffe6f4', 0.8),
);

const art: CreatureArt = {
  id: 'sao_bien_gai',
  viewBox: [580, 380],
  lengthUnits: 420,
  spineY: CY,
  animation: 'static',
  cycleHz: 0.3,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'shadow',
      role: 'detail',
      bend: false,
      z: 'back',
      pivot: [scx, scy],
      svg: `<ellipse cx="${scx}" cy="${scy}" rx="250" ry="140" fill="${u.url('shadow')}"/>`,
    },
    {
      name: 'armBackSway',
      role: 'arm',
      bend: false,
      z: 'back',
      pivot: pivotOf(animBack),
      anim: { type: 'rotate', amp: 0.035, speed: 0.8, phase: 0.6 },
      svg: animBackSvg,
    },
    { name: 'armsBack', role: 'detail', svg: armsBackSvg },
    {
      name: 'disc',
      role: 'body',
      svg:
        `<path d="${DISC}" fill="${u.url('disc')}"/>` +
        `<path d="${DISC}" fill="${u.url('papulae')}"/>` +
        `<path d="${DISC}" fill="${u.url('papulae2')}"/>` +
        `<path d="${surf.ridges}" fill="none" stroke="${RIDGE}" stroke-opacity="0.3" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="${surf.ridges}" fill="none" stroke="${RIDGE_L}" stroke-opacity="0.3" stroke-width="1" stroke-linecap="round"/>` +
        `<path d="${DISC}" fill="${u.url('discVol')}"/>` +
        `<path d="${DISC}" fill="none" stroke="${OUT}" stroke-width="1.6" stroke-opacity="0.5"/>` +
        `<path d="${RIM_D}" fill="none" stroke="#ffe6f4" stroke-opacity="0.35" stroke-width="2"/>` +
        surf.plates,
    },
    { name: 'armsFront', role: 'detail', svg: armsFrontSvg },
    { name: 'discSpines', role: 'detail', svg: surf.spines },
    {
      name: 'armFrontSwayB',
      role: 'arm',
      bend: false,
      z: 'front',
      pivot: pivotOf(animFrontB),
      anim: { type: 'rotate', amp: 0.03, speed: 0.9, phase: 2.1 },
      svg: animFrontBSvg,
    },
    {
      name: 'armFrontSwayA',
      role: 'arm',
      bend: false,
      z: 'front',
      pivot: pivotOf(animFrontA),
      anim: { type: 'rotate', amp: 0.035, speed: 0.7, phase: 0 },
      svg: animFrontASvg,
    },
  ],
};

export default art;
