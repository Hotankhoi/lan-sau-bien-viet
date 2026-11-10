/**
 * Ốc cối địa lý – Conus geographus
 * Đặc điểm nhận dạng: vỏ mỏng PHÌNH HÌNH TRỤ (hai bên gần song song tới ~60% chiều dài rồi mới thuôn,
 * đầu trước cụt chứ không nhọn), tháp xoắn thấp có mấu ở vai (bên trái), miệng vỏ rất rộng loe về
 * phía trước; nền trắng hồng/kem phủ MẠNG LƯỚI đường nâu đỏ mảnh, mắt lưới méo to nhỏ không đều như
 * đường đồng mức bản đồ, 2 dải mảng nâu sẫm loang lổ (KHÔNG phải "lều" tam giác của Conus textile);
 * vỏ bóng sứ. Thân mềm kem hồng lốm đốm, ống siphon nhô ra phía trước (cử động nhẹ), miệng giả
 * (rostrum) loe như phễu/lưới mỏng bán trong để chụp cá, 2 râu mảnh có mắt nhỏ bên sườn.
 */
import type { CreatureArt } from '../contract';
import { makeIds, linear, radial, blurFilter, clip, rng, joinDefs, smoothPath, bezierPoint, rimGradient, scatterSpots } from '../style-bible';

const u = makeIds('oc_coi_dia_ly');

// ---------- Màu ----------
const NET = '#9C4B2A'; // nâu đỏ của mạng lưới
const NET_D = '#5E2112'; // đường lưới trong dải sẫm
const BAND = '#7A2E1B'; // dải nâu đậm
const BAND_M = '#A5502C';
const CLOUD = '#D08F63'; // mảng nâu cam nhạt loang
const OUTLINE = '#5B2617';
const FLESH = '#EBD3C6';
const FLESH_D = '#C99A86';
const MOTTLE = '#8C452B';

// ---------- Hình học vỏ ----------
const APEX_X = 44;
const SHOULDER_X = 90; // tháp thấp: chỉ ~46 đơn vị
const TIP_X = 412;
const W = 90; // nửa bề rộng lớn nhất
const CAP = 6; // độ tròn của đầu trước (cụt)

/** trục vỏ (hơi chúc xuống về phía trước để mép miệng nằm gần song song nền) */
const axisY = (x: number) => 112 + (x - APEX_X) * 0.085;

/** nửa bề rộng vòng thân theo t (0 = vai, 1 = đầu trước): phình trụ, tới ~0.6 mới thuôn, đầu trước còn ~1/3 */
function hw(t0: number): number {
  const t = Math.max(0, Math.min(1, t0));
  const sh = 0.87 + 0.13 * Math.sqrt(Math.min(1, t / 0.2));
  const taper = 0.34 + 0.66 * (1 - Math.pow(t, 3));
  return W * sh * taper;
}
const ux = (t: number) => SHOULDER_X + t * (TIP_X - SHOULDER_X);

/** điểm trên mặt vòng thân: t dọc trục, phi quanh trục (-π/2 mép trên … π/2 mép dưới) */
function P(t: number, phi: number): [number, number] {
  const x = ux(t);
  // mặt trụ: hơi lệch x theo phi để đường đồng mức cong như vỏ thật
  return [x + Math.cos(phi) * 6 * Math.pow(1 - Math.min(1, Math.max(0, t)), 1.5), axisY(x) + hw(t) * Math.sin(phi)];
}
/** điểm trên vành đầu trước (bo tròn nhẹ) */
const capPt = (phi: number): [number, number] => [TIP_X + CAP * Math.cos(phi), axisY(TIP_X) + hw(1) * Math.sin(phi)];

/** nửa bề rộng tháp vỏ, s: 0 = đỉnh, 1 = vai – sườn tháp hơi lõm, vai có mấu */
function spireHw(s: number): number {
  const knob = s > 0.25 ? 2.2 * Math.pow(Math.max(0, Math.sin(s * Math.PI * 5.5)), 2) : 0;
  const crown = 1.3 * Math.exp(-Math.pow((s - 0.92) / 0.06, 2));
  return hw(0) * (0.25 * s + 0.75 * Math.pow(s, 1.7)) + knob * s + crown;
}
const sx = (s: number) => APEX_X + s * (SHOULDER_X - APEX_X);

/** biên trên của miệng vỏ (phần vòng thân phía dưới) – miệng rất rộng, loe dần về trước, mở tới tận đầu */
const apPhi = (t: number) => 1.42 - 1.15 * Math.pow(Math.max(0, Math.min(1, t)), 1.1);

const f = (n: number) => n.toFixed(1);

function shellOutline(): string {
  const p: [number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    const s = i / 24;
    p.push([sx(s), axisY(sx(s)) - spireHw(s)]);
  }
  // điểm dày ở góc vai để đường cong không vọt thành gai
  p.push(P(0.008, -Math.PI / 2), P(0.016, -Math.PI / 2));
  for (let i = 1; i <= 40; i++) p.push(P(i / 40, -Math.PI / 2));
  for (let k = 1; k < 8; k++) p.push(capPt(-Math.PI / 2 + (Math.PI * k) / 8));
  for (let i = 40; i >= 1; i--) p.push(P(i / 40, Math.PI / 2));
  p.push(P(0.016, Math.PI / 2), P(0.008, Math.PI / 2));
  for (let i = 24; i >= 1; i--) {
    const s = i / 24;
    p.push([sx(s), axisY(sx(s)) + spireHw(s)]);
  }
  return smoothPath(p, true, 0.4);
}

function bodyWhorl(): string {
  const p: [number, number][] = [];
  for (let i = 0; i <= 40; i++) p.push(P(i / 40, -Math.PI / 2));
  const a1 = apPhi(1);
  for (let k = 1; k <= 6; k++) p.push(capPt(-Math.PI / 2 + ((a1 + Math.PI / 2) * k) / 6));
  for (let i = 40; i >= 0; i--) p.push(P(i / 40, apPhi(i / 40)));
  // đi ngược theo vai về điểm đầu (điểm dày để góc không vọt ra ngoài viền vỏ)
  const a0 = apPhi(0);
  for (let k = 1; k < 12; k++) p.push(P(0, a0 + ((-Math.PI / 2 - a0) * k) / 12));
  return smoothPath(p, true, 0.4);
}

function aperture(): string {
  const p: [number, number][] = [];
  for (let i = 1; i <= 40; i++) p.push(P(i / 40, apPhi(i / 40)));
  const a1 = apPhi(1);
  for (let k = 0; k <= 4; k++) p.push(capPt(a1 + ((Math.PI / 2 - 0.02 - a1) * k) / 4));
  for (let i = 40; i >= 1; i--) p.push(P(i / 40, Math.PI / 2 - 0.02));
  return smoothPath(p, true, 0.4);
}

const SHELL = shellOutline();
const WHORL = bodyWhorl();
const APERTURE = aperture();

/** dải hình học trên mặt vỏ, phi từ a → b, t từ t0 → t1 (để vẽ bóng/đốm sáng bám theo độ thuôn) */
function strip(t0: number, t1: number, a: (t: number) => number, b: (t: number) => number, n = 24): string {
  const p: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n;
    p.push(P(t, a(t)));
  }
  for (let i = n; i >= 0; i--) {
    const t = t0 + ((t1 - t0) * i) / n;
    p.push(P(t, b(t)));
  }
  return smoothPath(p, true, 0.4);
}

// ---------- Hoa văn ----------
const BANDS = [
  { c: 0.27, w: 0.075, k: 1.3 },
  { c: 0.66, w: 0.085, k: 4.1 },
];
const bandCenter = (b: (typeof BANDS)[number], phi: number) =>
  b.c + 0.035 * Math.sin(phi * 2.4 + b.k) + 0.016 * Math.sin(phi * 6.3 + b.k * 2);

const smooth = (e0: number, e1: number, x: number) => {
  const k = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return k * k * (3 - 2 * k);
};

/** độ "trắng" của vùng (0 = mảng nâu đặc, 1 = nền trắng chỉ có lưới mảnh) */
function whiteness(t: number, phi: number, jitter: number): number {
  let w = 0.9;
  for (const b of BANDS) {
    const d = Math.abs(t - bandCenter(b, phi));
    w -= 0.8 * (1 - smooth(b.w - 0.03, b.w + 0.07, d));
  }
  w += 0.26 * Math.sin(t * 23 + phi * 2.1) * Math.cos(phi * 4.3 - t * 11);
  w += 0.13 * Math.sin(t * 51 - phi * 7.7);
  // sát vai & đầu trước có mảng nâu loang
  w -= 0.34 * (1 - smooth(0.0, 0.07, t)) * (0.5 + 0.5 * Math.sin(phi * 5 + 1));
  w -= 0.22 * smooth(0.88, 1, t);
  w += jitter;
  return Math.max(0, Math.min(1, w));
}

/** quầng nâu cam mờ dưới các dải (để mép dải loang chứ không sắc) */
function bandShapes(): string {
  let s = '';
  for (const b of BANDS) {
    const p: [number, number][] = [];
    const n = 20;
    for (let i = 0; i <= n; i++) {
      const phi = -Math.PI / 2 + (Math.PI * i) / n;
      p.push(P(bandCenter(b, phi) - b.w - 0.02 * Math.sin(i * 1.7), phi));
    }
    for (let i = n; i >= 0; i--) {
      const phi = -Math.PI / 2 + (Math.PI * i) / n;
      p.push(P(bandCenter(b, phi) + b.w + 0.022 * Math.cos(i * 2.3), phi));
    }
    s += `<path d="${smoothPath(p, true, 0.45)}"/>`;
  }
  return `<g fill="${BAND_M}" fill-opacity="0.5" filter="${u.url('softer')}">${s}</g>`;
}

/**
 * MẠNG LƯỚI đặc trưng của C. geographus: lưới tổ ong méo trong không gian (t, phi) rồi chiếu lên mặt trụ
 * (mắt lưới tự co lại ở hai mép → có khối). Mật độ bị "kéo giãn" bằng nhiễu sin nên mắt to nhỏ không đều;
 * một số cạnh bị bỏ để mắt lưới nhập vào nhau như đường đồng mức. Các dải sẫm = những mắt lưới tô nâu.
 */
function netPattern(): string {
  const NC = 78;
  const NR = 34;
  const r = rng(1758);
  type V = { t: number; phi: number; x: number; y: number };
  const grid: V[][] = [];
  for (let j = 0; j <= NR; j++) {
    const row: V[] = [];
    for (let i = -1; i <= NC + 1; i++) {
      const sN = i / NC;
      const pN = j / NR;
      const t = sN + 0.02 * Math.sin(sN * 25 + pN * 7) + 0.006 * Math.sin(sN * 61 - pN * 13) + ((r() - 0.5) * 0.8) / NC;
      let ph = pN + 0.022 * Math.sin(pN * 17 + sN * 11 + 2) + ((r() - 0.5) * 0.55) / NR + (((i + j) & 1) === 0 ? 0.2 : -0.2) / NR;
      if (j === 0) ph = 0;
      if (j === NR) ph = 1;
      const phi = -Math.PI / 2 + Math.PI * ph;
      const [x, y] = P(t, phi);
      row.push({ t, phi, x, y });
    }
    grid.push(row);
  }
  const at = (i: number, j: number) => grid[j][i + 1];

  // --- mắt lưới tô màu (mảng nâu loang lổ) ---
  let cDark = '';
  let cMid = '';
  let cTan = '';
  let cPale = '';
  for (let j = 0; j < NR; j++) {
    for (let i = -1; i <= NC - 1; i++) {
      if (((i + j) & 1) !== 0) continue;
      const vs = [at(i, j), at(i + 1, j), at(i + 2, j), at(i + 2, j + 1), at(i + 1, j + 1), at(i, j + 1)];
      const ct = vs.reduce((a, v) => a + v.t, 0) / 6;
      const cp = vs.reduce((a, v) => a + v.phi, 0) / 6;
      const w = whiteness(ct, cp, (r() - 0.5) * 0.3);
      const k = r();
      const d = 'M' + vs.map((v) => `${f(v.x)} ${f(v.y)}`).join('L') + 'Z';
      if (w < 0.24) cDark += d;
      else if (w < 0.42) cMid += d;
      else if (w < 0.58) {
        if (k < 0.65) cTan += d;
      } else if (k < 0.07) cPale += d;
    }
  }

  // --- đường lưới ---
  type E = { a: V; b: V; ka: string; kb: string };
  const edges: E[] = [];
  const deg = new Map<string, number>();
  const bump = (k: string) => deg.set(k, (deg.get(k) ?? 0) + 1);
  for (let j = 0; j <= NR; j++) {
    for (let i = -1; i <= NC + 1; i++) {
      if (i <= NC) edges.push({ a: at(i, j), b: at(i + 1, j), ka: `${i},${j}`, kb: `${i + 1},${j}` });
      if (j < NR && ((i + j) & 1) === 0) edges.push({ a: at(i, j), b: at(i, j + 1), ka: `${i},${j}`, kb: `${i},${j + 1}` });
    }
  }
  for (const e of edges) {
    bump(e.ka);
    bump(e.kb);
  }
  let thin = '';
  let med = '';
  let dark = '';
  for (const e of edges) {
    const w = whiteness((e.a.t + e.b.t) / 2, (e.a.phi + e.b.phi) / 2, 0);
    // bỏ bớt cạnh ở vùng trắng → mắt lưới nhập lại thành ô to méo (không để đầu cụt)
    if (w > 0.6 && r() < 0.3 && (deg.get(e.ka) ?? 0) >= 3 && (deg.get(e.kb) ?? 0) >= 3) {
      deg.set(e.ka, (deg.get(e.ka) ?? 0) - 1);
      deg.set(e.kb, (deg.get(e.kb) ?? 0) - 1);
      continue;
    }
    // cạnh hơi cong cho mềm
    const mx = (e.a.x + e.b.x) / 2;
    const my = (e.a.y + e.b.y) / 2;
    const bow = (r() - 0.5) * 0.36;
    const d = `M${f(e.a.x)} ${f(e.a.y)}Q${f(mx - (e.b.y - e.a.y) * bow)} ${f(my + (e.b.x - e.a.x) * bow)} ${f(e.b.x)} ${f(e.b.y)}`;
    if (w < 0.36) dark += d;
    else if (r() < 0.45) med += d;
    else thin += d;
  }
  return (
    `<path d="${cPale}" fill="#E7BC9A" fill-opacity="0.5"/>` +
    `<path d="${cTan}" fill="${CLOUD}" fill-opacity="0.62"/>` +
    `<path d="${cMid}" fill="${BAND_M}" fill-opacity="0.7"/>` +
    `<path d="${cDark}" fill="${BAND}" fill-opacity="0.8"/>` +
    `<g fill="none" stroke-linecap="round">` +
    `<path d="${thin}" stroke="${NET}" stroke-opacity="0.74" stroke-width="0.6"/>` +
    `<path d="${med}" stroke="${NET}" stroke-opacity="0.8" stroke-width="0.85"/>` +
    `<path d="${dark}" stroke="${NET_D}" stroke-opacity="0.45" stroke-width="0.7"/>` +
    `</g>`
  );
}

/** đường tăng trưởng mảnh (song song mép miệng) */
function growthLines(): string {
  const r = rng(33);
  let d = '';
  for (let t = 0.04; t < 0.97; t += 0.025 + r() * 0.035) {
    const p: [number, number][] = [];
    for (let k = 0; k <= 8; k++) {
      const phi = -Math.PI / 2 + (Math.PI * k) / 8;
      p.push(P(t - 0.012 * Math.cos(phi) + 0.006 * Math.sin(phi * 2), phi));
    }
    d += smoothPath(p);
  }
  return `<path d="${d}" fill="none" stroke="#5B2617" stroke-opacity="0.13" stroke-width="0.8"/>`;
}

/** sợi xoắn rất mảnh chạy dọc vỏ */
function spiralThreads(): string {
  let d = '';
  for (let k = 1; k < 14; k++) {
    const phi = -Math.PI / 2 + (Math.PI * k) / 14;
    const p: [number, number][] = [];
    for (let i = 0; i <= 16; i++) p.push(P(0.02 + (0.96 * i) / 16, phi));
    d += smoothPath(p);
  }
  return `<path d="${d}" fill="none" stroke="#8a4a30" stroke-opacity="0.07" stroke-width="0.7"/>`;
}

// ---------- Tháp vỏ ----------
function spire(): string {
  const r = rng(7);
  // vòng xoắn: các đường khâu cong ")" lồng nhau
  let sut = '';
  let knobs = '';
  const whorls = [0.3, 0.52, 0.72, 0.9];
  for (const s0 of whorls) {
    const x0 = sx(s0);
    const h0 = spireHw(s0) - 0.5;
    const top: [number, number] = [x0, axisY(x0) - h0];
    const bot: [number, number] = [x0 + 1, axisY(x0) + h0];
    const bow = 6 + s0 * 6;
    sut += `M${f(top[0])} ${f(top[1])}Q${f(x0 + bow)} ${f(axisY(x0))} ${f(bot[0])} ${f(bot[1])}`;
    // mấu dọc đường khâu
    const nk = Math.round(3 + s0 * 5);
    for (let k = 1; k < nk; k++) {
      const tt = k / nk;
      const bx = (1 - tt) * (1 - tt) * top[0] + 2 * (1 - tt) * tt * (x0 + bow) + tt * tt * bot[0];
      const by = (1 - tt) * (1 - tt) * top[1] + 2 * (1 - tt) * tt * axisY(x0) + tt * tt * bot[1];
      const rr = 1.1 + s0 * 1.2 + r() * 0.5;
      knobs += `<ellipse cx="${f(bx - rr * 0.8)}" cy="${f(by)}" rx="${f(rr)}" ry="${f(rr * 1.2)}"/>`;
    }
  }
  // vệt nâu trên tháp
  let streaks = '';
  for (let i = 0; i < 26; i++) {
    const s = 0.15 + r() * 0.85;
    const x = sx(s);
    const h = spireHw(s);
    const y = axisY(x) + (r() * 2 - 1) * h * 0.9;
    streaks += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1.5 + r() * 3)}" ry="${f(2 + r() * 4)}"/>`;
  }
  return (
    `<g fill="${NET}" fill-opacity="0.7">${streaks}</g>` +
    `<g fill="#fbefe9" fill-opacity="0.85">${knobs}</g>` +
    `<path d="${sut}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.55" stroke-width="1.1"/>`
  );
}

/** vai vỏ: gờ tròn có mấu */
function shoulder(): string {
  const r = rng(12);
  let knobs = '';
  const n = 13;
  for (let k = 1; k < n; k++) {
    const phi = -Math.PI / 2 + (Math.PI * k) / n;
    const [x, y] = P(0.004, phi);
    const rr = 2.1 + Math.cos(phi) * 1.5 + r() * 0.5;
    knobs += `<ellipse cx="${f(x - 3)}" cy="${f(y)}" rx="${f(rr * 0.9)}" ry="${f(rr * 1.3 * Math.max(0.35, Math.cos(phi)))}"/>`;
  }
  const p: [number, number][] = [];
  for (let k = 0; k <= 10; k++) p.push(P(0, -Math.PI / 2 + (Math.PI * k) / 10));
  return (
    `<path d="${smoothPath(p)}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.5" stroke-width="1.4"/>` +
    `<g fill="#fffaf6" fill-opacity="0.6" stroke="${OUTLINE}" stroke-opacity="0.22" stroke-width="0.5">${knobs}</g>`
  );
}

// ---------- Thân mềm ----------
/** ống mềm theo đường cong bezier, bề rộng w0 → w1 */
function tube(c: [[number, number], [number, number], [number, number], [number, number]], w0: number, w1: number, n = 14, ex = 1) {
  const ctr: [number, number][] = [];
  for (let i = 0; i <= n; i++) ctr.push(bezierPoint(c[0], c[1], c[2], c[3], i / n));
  const L: [number, number][] = [];
  const R: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = ctr[Math.max(0, i - 1)];
    const b = ctr[Math.min(n, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = (w0 + (w1 - w0) * Math.pow(i / n, ex)) / 2;
    L.push([ctr[i][0] + nx * w, ctr[i][1] + ny * w]);
    R.push([ctr[i][0] - nx * w, ctr[i][1] - ny * w]);
  }
  const end = ctr[n];
  const pe = ctr[n - 1];
  const ang = (Math.atan2(end[1] - pe[1], end[0] - pe[0]) * 180) / Math.PI;
  return { d: smoothPath([...L, ...R.reverse()], true, 0.45), ctr, L, R: R.reverse(), end, ang };
}

const SIPHON = tube([[402, 146], [442, 146], [476, 126], [502, 92]], 16, 13.5, 16);
const TENT_NEAR = tube([[428, 188], [440, 180], [452, 174], [468, 169]], 5, 2);
const TENT_FAR = tube([[422, 186], [432, 177], [442, 170], [454, 162]], 4.4, 1.8);

// miệng giả (rostrum): cổ ngắn rồi loe rộng thành phễu mỏng, mép gợn
const RIM_C: [number, number] = [488, 203];
const RIM_ROT = -0.14;
function rimPt(a: number, scale = 1): [number, number] {
  const wob = 1 + 0.07 * Math.sin(a * 7 + 0.6) + 0.045 * Math.sin(a * 12 + 2);
  const ex = 10.5 * scale * wob * Math.cos(a);
  const ey = 27 * scale * wob * Math.sin(a);
  return [RIM_C[0] + ex * Math.cos(RIM_ROT) - ey * Math.sin(RIM_ROT), RIM_C[1] + ex * Math.sin(RIM_ROT) + ey * Math.cos(RIM_ROT)];
}
function rimPath(scale = 1): string {
  const p: [number, number][] = [];
  for (let k = 0; k < 30; k++) p.push(rimPt((k / 30) * Math.PI * 2, scale));
  return smoothPath(p, true, 0.5);
}
const RIM = rimPath();
const RIM_TOP = rimPt(-Math.PI / 2);
const RIM_BOT = rimPt(Math.PI / 2);
/** mặt ngoài của phễu (nhìn nghiêng) */
const FUNNEL = smoothPath(
  [[416, 189], [436, 188], [456, 185], [472, 180], RIM_TOP, [RIM_C[0] + 2, RIM_C[1]], RIM_BOT, [474, 224], [456, 215], [436, 208], [416, 205]],
  true,
  0.45,
);

function funnelDetail(): string {
  // nếp mảnh tỏa từ cổ ra mép (mặt ngoài) và từ họng ra mép (mặt trong) – gợi màng mỏng như lưới
  let outer = '';
  for (let k = 0; k < 7; k++) {
    const q = (k + 0.5) / 7;
    const y0 = 191 + q * 12;
    const [ex, ey] = [RIM_TOP[0] + (RIM_BOT[0] - RIM_TOP[0]) * q, RIM_TOP[1] + (RIM_BOT[1] - RIM_TOP[1]) * q];
    outer += `M424 ${f(y0)}Q${f(452)} ${f(y0 + (ey - y0) * 0.25)} ${f(ex - 4)} ${f(ey)}`;
  }
  let inner = '';
  const throat: [number, number] = [RIM_C[0] - 2.5, RIM_C[1] + 1];
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2 + 0.2;
    const [x, y] = rimPt(a, 0.93);
    const [x0, y0] = [throat[0] + (x - throat[0]) * 0.3, throat[1] + (y - throat[1]) * 0.3];
    inner += `M${f(x0)} ${f(y0)}L${f(x)} ${f(y)}`;
  }
  return (
    `<path d="${FUNNEL}" fill="${u.url('funnelFill')}"/>` +
    `<g clip-path="${u.url('funnelClip')}">` +
    scatterSpots(333, { x: 416, y: 186, w: 44, h: 24 }, { count: 12, rMin: 0.7, rMax: 1.6, color: '#b0563a', opacity: 0.42 }) +
    `<path d="${outer}" fill="none" stroke="#a8644f" stroke-opacity="0.32" stroke-width="0.7"/>` +
    `<path d="M416 190C440 189 462 186 ${f(RIM_TOP[0])} ${f(RIM_TOP[1] + 1)}" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1.6"/>` +
    `</g>` +
    `<path d="${FUNNEL}" fill="none" stroke="#7d4636" stroke-opacity="0.38" stroke-width="1"/>` +
    // lòng phễu bán trong
    `<path d="${RIM}" fill="${u.url('rimFill')}"/>` +
    `<path d="${inner}" fill="none" stroke="#a45a50" stroke-opacity="0.3" stroke-width="0.6"/>` +
    `<ellipse cx="${f(throat[0])}" cy="${f(throat[1])}" rx="2.6" ry="7" fill="#8a4a48" fill-opacity="0.32" transform="rotate(-8 ${f(throat[0])} ${f(throat[1])})" filter="${u.url('soft')}"/>` +
    // mép phễu mỏng, gợn
    `<path d="${RIM}" fill="none" stroke="#8a5040" stroke-opacity="0.4" stroke-width="2"/>` +
    `<path d="${RIM}" fill="none" stroke="#fff4ee" stroke-opacity="0.9" stroke-width="1.1"/>`
  );
}

/** râu: mắt nhỏ nằm bên sườn ngoài, khoảng giữa chiều dài (trên một chỗ hơi phồng) */
function tentacleSvg(tn: ReturnType<typeof tube>, fill: string, strokeOp: number): string {
  const i = Math.round(tn.ctr.length * 0.52);
  const c = tn.ctr[i];
  const o = tn.L[i];
  const ex = c[0] + (o[0] - c[0]) * 0.75;
  const ey = c[1] + (o[1] - c[1]) * 0.75;
  return (
    `<path d="${tn.d}" fill="${fill}" stroke="#7d4636" stroke-opacity="${strokeOp}" stroke-width="0.8"/>` +
    `<ellipse cx="${f(ex)}" cy="${f(ey)}" rx="2.3" ry="1.7" fill="${fill}" stroke="#7d4636" stroke-opacity="${strokeOp * 0.7}" stroke-width="0.5" transform="rotate(${f(tn.ang)} ${f(ex)} ${f(ey)})"/>` +
    `<circle cx="${f(ex)}" cy="${f(ey)}" r="1.2" fill="#1c0d09"/>`
  );
}

const FOOT = smoothPath(
  [
    [140, 204], [200, 200], [270, 198], [330, 192], [370, 182], [404, 174], [432, 184], [456, 200], [474, 216],
    [472, 230], [450, 236], [380, 238], [280, 238], [200, 236], [156, 228], [138, 216],
  ],
  true,
  0.5,
);
const HEAD = smoothPath(
  [[392, 180], [414, 172], [432, 176], [442, 190], [436, 206], [416, 212], [396, 206]],
  true,
  0.55,
);

function siphonMarks(): string {
  const r = rng(5);
  let s = '';
  // vằn nâu ngang ống
  for (let i = 1; i < SIPHON.ctr.length - 2; i++) {
    if (r() < 0.25) continue;
    const [x, y] = SIPHON.ctr[i];
    const ang = SIPHON.ang - 10 + (i / SIPHON.ctr.length) * 10;
    s += `<ellipse cx="${f(x + (r() - 0.5) * 3)}" cy="${f(y + (r() - 0.5) * 4)}" rx="${f(1.4 + r() * 1.6)}" ry="${f(4 + r() * 4)}" transform="rotate(${f(ang)} ${f(x)} ${f(y)})"/>`;
  }
  return `<g fill="${MOTTLE}" fill-opacity="0.55">${s}</g>`;
}

function footMottle(): string {
  return (
    scatterSpots(404, { x: 136, y: 176, w: 344, h: 62 }, { count: 60, rMin: 1, rMax: 3, color: MOTTLE, opacity: 0.4, ellipse: 1.9 }) +
    scatterSpots(808, { x: 136, y: 176, w: 344, h: 62 }, { count: 36, rMin: 0.7, rMax: 1.5, color: '#5f2a18', opacity: 0.35 })
  );
}

// ---------- Nền thẻ (cát) ----------
function seabed(): string {
  const r = rng(64);
  let pebbles = '';
  for (let i = 0; i < 26; i++) {
    const x = 60 + r() * 450;
    const y = 242 + r() * 18;
    const rr = 1.5 + r() * 4;
    const c = ['#d9c7a3', '#c7b28a', '#e9dcc0', '#b9a07a'][Math.floor(r() * 4)];
    pebbles += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rr * 1.4)}" ry="${f(rr)}" fill="${c}" opacity="0.85"/>`;
  }
  return (
    `<ellipse cx="290" cy="262" rx="290" ry="30" fill="${u.url('sand')}"/>` +
    pebbles
  );
}

// ---------- defs ----------
const defs = joinDefs(
  clip(u('shellClip'), SHELL),
  clip(u('whorlClip'), WHORL),
  clip(u('siphonClip'), SIPHON.d),
  clip(u('footClip'), FOOT),
  clip(u('funnelClip'), FUNNEL),
  clip(u('headClip'), HEAD),
  rimGradient(u('rim'), '#ffffff', 0.85),
  linear(u('shellBase'), [
    [0, '#FDF5EF'],
    [0.5, '#F9E8DF'],
    [1, '#EFD3C8'],
  ]),
  linear(u('spireFill'), [
    [0, '#f2ddd3'],
    [0.5, '#e7c3b2'],
    [1, '#c48f78'],
  ]),
  linear(u('apertureFill'), [
    [0, '#c9a7b4'],
    [0.35, '#f1e3ea'],
    [0.8, '#fff8f6'],
    [1, '#e8d3d6'],
  ]),
  // bóng khối hình trụ (đè lên vỏ)
  linear(u('cyl'), [
    [0, '#2a0d05', 0.35],
    [0.12, '#ffffff', 0.0],
    [0.24, '#ffffff', 0.28],
    [0.38, '#ffffff', 0.0],
    [0.62, '#2a0d05', 0.08],
    [0.9, '#2a0d05', 0.3],
    [1, '#2a0d05', 0.22],
  ]),
  linear(u('fleshFill'), [
    [0, '#f6e4d9'],
    [0.5, FLESH],
    [1, FLESH_D],
  ]),
  linear(
    u('siphonFill'),
    [
      [0, '#f8e6dc'],
      [0.5, '#ecc9b8'],
      [1, '#c9917a'],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 1 },
  ),
  linear(
    u('funnelFill'),
    [
      [0, '#EBD3C6', 0.96],
      [0.55, '#F3DCD0', 0.8],
      [1, '#FBEBE2', 0.58],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 0 },
  ),
  radial(
    u('rimFill'),
    [
      [0, '#C98A80', 0.62],
      [0.45, '#EDC3B6', 0.5],
      [0.85, '#FBE9E1', 0.56],
      [1, '#FFF6F1', 0.72],
    ],
    { cx: 0.42, cy: 0.52, r: 0.6 },
  ),
  radial(u('siphonIn'), [
    [0, '#3d1410'],
    [0.7, '#8a3a26'],
    [1, '#e0a07c'],
  ]),
  radial(u('sand'), [
    [0, '#e9dbbb', 0.95],
    [0.7, '#cdb88f', 0.75],
    [1, '#b79f78', 0],
  ]),
  radial(u('shadow'), [
    [0, '#1b2a2e', 0.45],
    [1, '#1b2a2e', 0],
  ]),
  blurFilter(u('soft'), 2.4),
  blurFilter(u('softer'), 5),
);

// ---------- Đốm sáng sứ ----------
const HL_BROAD = strip(0.02, 0.9, () => -1.18, (t) => -0.72 + t * 0.12);
const HL_SHARP = strip(0.06, 0.72, () => -1.02, () => -0.9);
const SHADOW = strip(0.0, 1.0, (t) => 0.55 - t * 0.1, () => Math.PI / 2);
const BOUNCE = strip(0.1, 0.85, () => 0.98, () => 1.12);

const art: CreatureArt = {
  id: 'oc_coi_dia_ly',
  viewBox: [560, 268],
  lengthUnits: 400,
  spineY: 140,
  animation: 'static',
  cycleHz: 0.35,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'seabed',
      role: 'detail',
      bend: false,
      z: 'back',
      cardOnly: true,
      svg: seabed(),
    },
    {
      name: 'siphon',
      role: 'detail',
      bend: false,
      z: 'back',
      pivot: [406, 146],
      anim: { type: 'rotate', amp: 0.09, speed: 1 },
      svg:
        `<path d="${SIPHON.d}" fill="${u.url('siphonFill')}"/>` +
        `<g clip-path="${u.url('siphonClip')}">` +
        siphonMarks() +
        // vòng sẫm & viền cam ở chóp
        `<ellipse cx="${f(SIPHON.end[0] - 4)}" cy="${f(SIPHON.end[1] + 4)}" rx="5" ry="10" fill="#7a3220" fill-opacity="0.75" transform="rotate(${f(SIPHON.ang)} ${f(SIPHON.end[0] - 4)} ${f(SIPHON.end[1] + 4)})"/>` +
        `<path d="${smoothPath(SIPHON.L)}" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="2.2" filter="${u.url('soft')}"/>` +
        `</g>` +
        `<path d="${SIPHON.d}" fill="none" stroke="#7a3a26" stroke-opacity="0.55" stroke-width="1.3"/>` +
        `<ellipse cx="${f(SIPHON.end[0])}" cy="${f(SIPHON.end[1])}" rx="3.4" ry="6.8" fill="${u.url('siphonIn')}" stroke="#f0a76f" stroke-width="1.4" transform="rotate(${f(SIPHON.ang)} ${f(SIPHON.end[0])} ${f(SIPHON.end[1])})"/>`,
    },
    {
      name: 'tentacleFar',
      role: 'detail',
      svg:
        tentacleSvg(TENT_FAR, FLESH_D, 0.4),
    },
    {
      name: 'foot',
      role: 'body',
      svg:
        `<ellipse cx="300" cy="238" rx="186" ry="9" fill="${u.url('shadow')}" filter="${u.url('soft')}"/>` +
        `<path d="${FOOT}" fill="${u.url('fleshFill')}"/>` +
        `<g clip-path="${u.url('footClip')}">` +
        footMottle() +
        // mép đế chân sẫm
        `<path d="M136 222C170 234 230 238 300 238C380 238 440 236 474 226" fill="none" stroke="#8d5a46" stroke-opacity="0.45" stroke-width="5" filter="${u.url('soft')}"/>` +
        `</g>` +
        `<path d="${FOOT}" fill="none" stroke="#7d4636" stroke-opacity="0.5" stroke-width="1.4"/>`,
    },
    {
      name: 'head',
      role: 'body',
      svg:
        `<path d="${HEAD}" fill="${u.url('fleshFill')}" stroke="#7d4636" stroke-opacity="0.45" stroke-width="1.2"/>` +
        `<g clip-path="${u.url('headClip')}">` +
        scatterSpots(222, { x: 392, y: 170, w: 52, h: 44 }, { count: 14, rMin: 0.9, rMax: 2.2, color: MOTTLE, opacity: 0.45 }) +
        `</g>` +
        // miệng giả loe hình phễu (rostrum) – để chụp cá
        funnelDetail(),
    },
    {
      name: 'shell',
      role: 'body',
      svg:
        // tháp vỏ
        `<path d="${SHELL}" fill="${u.url('spireFill')}"/>` +
        // vòng thân: nền trắng hồng + quầng nâu mờ + mắt lưới tô nâu + mạng lưới mảnh
        `<g clip-path="${u.url('shellClip')}"><g clip-path="${u.url('whorlClip')}">` +
        `<path d="${WHORL}" fill="${u.url('shellBase')}"/>` +
        bandShapes() +
        netPattern() +
        growthLines() +
        spiralThreads() +
        `</g></g>` +
        // miệng vỏ rộng: trắng sứ hồng tím
        `<path d="${APERTURE}" fill="${u.url('apertureFill')}"/>` +
        `<path d="${smoothPath(Array.from({ length: 33 }, (_, i) => P((i + 4) / 40, apPhi((i + 4) / 40) + 0.03)))}" fill="none" stroke="#5b2617" stroke-opacity="0.35" stroke-width="2.2" filter="${u.url('soft')}"/>` +
        spire() +
        shoulder(),
    },
    {
      name: 'gloss',
      role: 'detail',
      svg:
        `<g clip-path="${u.url('shellClip')}">` +
        `<path d="${WHORL}" fill="${u.url('cyl')}"/>` +
        `<path d="${SHADOW}" fill="#2a0d05" fill-opacity="0.16" filter="${u.url('softer')}"/>` +
        `<path d="${BOUNCE}" fill="#ffe9e2" fill-opacity="0.18" filter="${u.url('soft')}"/>` +
        `<path d="${HL_BROAD}" fill="#ffffff" fill-opacity="0.3" filter="${u.url('softer')}"/>` +
        `<path d="${HL_SHARP}" fill="#ffffff" fill-opacity="0.75" filter="${u.url('soft')}"/>` +
        // đốm sáng sứ nhỏ
        `<ellipse cx="150" cy="70" rx="14" ry="5" fill="#ffffff" fill-opacity="0.85" transform="rotate(-8 150 70)" filter="${u.url('soft')}"/>` +
        `<ellipse cx="70" cy="96" rx="6" ry="3" fill="#ffffff" fill-opacity="0.6" transform="rotate(-30 70 96)" filter="${u.url('soft')}"/>` +
        `</g>` +
        `<path d="${SHELL}" fill="none" stroke="${OUTLINE}" stroke-width="1.8" stroke-opacity="0.6" stroke-linejoin="round"/>` +
        `<path d="${SHELL}" fill="none" stroke="${u.url('rim')}" stroke-width="2.2" stroke-linejoin="round"/>` +
        // môi ngoài mỏng sáng
        `<path d="${smoothPath(Array.from({ length: 37 }, (_, i) => P((i + 2) / 40, Math.PI / 2 - 0.05)))}" fill="none" stroke="#fff6f2" stroke-opacity="0.7" stroke-width="1.2"/>`,
    },
    {
      name: 'tentacleNear',
      role: 'detail',
      svg:
        tentacleSvg(TENT_NEAR, u.url('fleshFill'), 0.5),
    },
  ],
};

export default art;
