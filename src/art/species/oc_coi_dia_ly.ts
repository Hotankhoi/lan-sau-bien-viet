/**
 * Ốc cối địa lý – Conus geographus
 * Đặc điểm nhận dạng: vỏ nón thuôn mỏng, tháp xoắn thấp có mấu ở vai (bên trái), miệng vỏ rất rộng
 * loe về phía trước; nền trắng hồng phủ mạng lưới "lều" tam giác nâu đỏ như bản đồ địa hình,
 * 2 dải nâu đậm loang lổ; vỏ bóng sứ. Thân mềm kem hồng lốm đốm, ống siphon nhô ra phía trước
 * (cử động nhẹ), vòi miệng loe hình phễu, 2 xúc tu mắt.
 */
import type { CreatureArt } from '../contract';
import { makeIds, linear, radial, blurFilter, clip, rng, joinDefs, smoothPath, bezierPoint, rimGradient, scatterSpots } from '../style-bible';

const u = makeIds('oc_coi_dia_ly');

// ---------- Màu ----------
const NET = '#B05E38'; // nâu đỏ của mạng lưới
const BAND = '#7A2E1B'; // dải nâu đậm
const TENT = '#F7E9E3'; // lều trắng hồng
const TENT2 = '#EFD6CD';
const OUTLINE = '#5B2617';
const FLESH = '#EBD3C6';
const FLESH_D = '#C99A86';
const MOTTLE = '#8C452B';

// ---------- Hình học vỏ ----------
const APEX_X = 30;
const SHOULDER_X = 98;
const TIP_X = 410;
const W = 86; // nửa bề rộng lớn nhất

/** trục vỏ (hơi chúc xuống về phía trước để mép miệng nằm gần song song nền) */
const axisY = (x: number) => 110 + (x - APEX_X) * 0.1;

/** nửa bề rộng vòng thân theo u (0 = vai, 1 = đầu trước) */
function hw(t0: number): number {
  const t = Math.max(0, Math.min(1, t0));
  const sh = 0.9 + 0.1 * Math.sqrt(Math.min(1, t / 0.08));
  const taper = Math.pow(Math.max(0, 1 - Math.pow(t, 2.1)), 0.7);
  return W * sh * (0.11 + 0.89 * taper);
}
const ux = (t: number) => SHOULDER_X + t * (TIP_X - SHOULDER_X);

/** điểm trên mặt vòng thân: t dọc trục, phi quanh trục (-π/2 mép trên … π/2 mép dưới) */
function P(t: number, phi: number): [number, number] {
  const x = ux(t);
  // mặt trụ: hơi lệch x theo phi để đường đồng mức cong như vỏ thật
  return [x + Math.cos(phi) * 2.5 * (1 - t), axisY(x) + hw(t) * Math.sin(phi)];
}

/** nửa bề rộng tháp vỏ, s: 0 = đỉnh, 1 = vai */
function spireHw(s: number): number {
  const knob = s > 0.25 ? 2.6 * Math.pow(Math.max(0, Math.sin(s * Math.PI * 6.5)), 2) : 0;
  return hw(0) * Math.pow(s, 1.25) + knob;
}
const sx = (s: number) => APEX_X + s * (SHOULDER_X - APEX_X);

/** biên trên của miệng vỏ (phần vòng thân phía dưới) – miệng loe dần về trước */
const apPhi = (t: number) => 1.42 - 0.85 * Math.pow(Math.min(1, t / 0.94), 1.1) + (t > 0.94 ? (t - 0.94) * 14 : 0);

const f = (n: number) => n.toFixed(1);

function shellOutline(): string {
  const p: [number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    const s = i / 24;
    p.push([sx(s), axisY(sx(s)) - spireHw(s)]);
  }
  for (let i = 1; i <= 40; i++) p.push(P(i / 40, -Math.PI / 2));
  // đầu trước tròn (ống siphon của vỏ)
  p.push([TIP_X + 5, axisY(TIP_X) - 3], [TIP_X + 6, axisY(TIP_X) + 3]);
  for (let i = 40; i >= 1; i--) p.push(P(i / 40, Math.PI / 2));
  for (let i = 24; i >= 1; i--) {
    const s = i / 24;
    p.push([sx(s), axisY(sx(s)) + spireHw(s)]);
  }
  return smoothPath(p, true, 0.4);
}

function bodyWhorl(): string {
  const p: [number, number][] = [];
  for (let i = 0; i <= 40; i++) p.push(P(i / 40, -Math.PI / 2));
  for (let i = 40; i >= 0; i--) p.push(P(i / 40, apPhi(i / 40)));
  return smoothPath(p, true, 0.4);
}

function aperture(): string {
  const p: [number, number][] = [];
  for (let i = 1; i <= 40; i++) p.push(P(i / 40, apPhi(i / 40)));
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

/** độ "trắng" của vùng (0 = nâu đặc, 1 = trắng có lưới mảnh) */
function whiteness(t: number, phi: number, jitter: number): number {
  let w = 0.74;
  for (const b of BANDS) {
    const d = Math.abs(t - bandCenter(b, phi));
    w -= 0.6 * (1 - smooth(b.w - 0.02, b.w + 0.05, d));
  }
  w += 0.24 * Math.sin(t * 23 + phi * 2.1) * Math.cos(phi * 4.3 - t * 11);
  w += 0.12 * Math.sin(t * 51 - phi * 7.7);
  // đầu trước & sát vai nhiều nâu loang hơn
  w -= 0.18 * smooth(0.86, 1, t);
  w += jitter;
  return Math.max(0, Math.min(1, w));
}

function bandShapes(): string {
  let s = '';
  for (const b of BANDS) {
    const p: [number, number][] = [];
    const n = 20;
    for (let i = 0; i <= n; i++) {
      const phi = -Math.PI / 2 + (Math.PI * i) / n;
      p.push(P(bandCenter(b, phi) - b.w - 0.012 * Math.sin(i * 1.7), phi));
    }
    for (let i = n; i >= 0; i--) {
      const phi = -Math.PI / 2 + (Math.PI * i) / n;
      p.push(P(bandCenter(b, phi) + b.w + 0.014 * Math.cos(i * 2.3), phi));
    }
    s += `<path d="${smoothPath(p, true, 0.45)}"/>`;
  }
  return `<g fill="${BAND}" fill-opacity="0.78">${s}</g>`;
}

/** mạng lưới "lều" tam giác – đỉnh tam giác chĩa về tháp vỏ (bên trái) */
function tents(): string {
  const r = rng(1758);
  const NU = 46;
  const NP = 22;
  let a = '';
  let b = '';
  for (let j = 0; j < NP; j++) {
    for (let i = 0; i < NU; i++) {
      const t = (i + 0.5 + (j % 2) * 0.5 + (r() - 0.5) * 0.5) / NU;
      if (t > 0.995) continue;
      const phi = -Math.PI / 2 + (Math.PI * (j + 0.5 + (r() - 0.5) * 0.4)) / NP;
      const w = whiteness(t, phi, (r() - 0.5) * 0.22);
      if (w < 0.14) continue;
      const sc = 0.22 + 0.95 * w;
      const L = (1.5 / NU) * sc;
      const H = (Math.PI / NP) * 1.15 * sc;
      const skew = (r() - 0.5) * H * 0.4;
      const p1 = P(t - L * 0.55, phi + skew);
      const p2 = P(t + L * 0.45, phi - H / 2);
      const p3 = P(t + L * 0.45, phi + H / 2);
      const m = P(t + L * 0.3, phi);
      // cạnh đáy hơi lõm cho mềm
      const d = `M${f(p1[0])} ${f(p1[1])}L${f(p2[0])} ${f(p2[1])}Q${f(m[0])} ${f(m[1])} ${f(p3[0])} ${f(p3[1])}Z`;
      if (r() < 0.7) a += d;
      else b += d;
    }
  }
  return `<path d="${a}" fill="${TENT}"/><path d="${b}" fill="${TENT2}"/>`;
}

/** mảng trắng lớn loang (vùng "đồng bằng" trên bản đồ) */
function whiteBlobs(): string {
  const r = rng(91);
  let s = '';
  let n = 0;
  let tries = 0;
  while (n < 16 && tries < 400) {
    tries++;
    const t = 0.03 + r() * 0.9;
    const phi = -1.35 + r() * 2.5;
    if (whiteness(t, phi, 0) < 0.72) continue;
    n++;
    const rt = 0.012 + r() * 0.022;
    const rp = 0.08 + r() * 0.16;
    const p: [number, number][] = [];
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      const rr = 0.65 + r() * 0.5;
      p.push(P(t + Math.cos(a) * rt * rr, phi + Math.sin(a) * rp * rr));
    }
    s += `<path d="${smoothPath(p, true, 0.6)}"/>`;
  }
  return `<g fill="${TENT}" fill-opacity="0.85">${s}</g>`;
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
  return `<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="0.7"/>`;
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
    const bow = 10 + s0 * 8;
    sut += `M${f(top[0])} ${f(top[1])}Q${f(x0 + bow)} ${f(axisY(x0))} ${f(bot[0])} ${f(bot[1])}`;
    // mấu dọc đường khâu
    const nk = Math.round(4 + s0 * 7);
    for (let k = 1; k < nk; k++) {
      const tt = k / nk;
      const bx = (1 - tt) * (1 - tt) * top[0] + 2 * (1 - tt) * tt * (x0 + bow) + tt * tt * bot[0];
      const by = (1 - tt) * (1 - tt) * top[1] + 2 * (1 - tt) * tt * axisY(x0) + tt * tt * bot[1];
      const rr = 1.6 + s0 * 1.6 + r() * 0.6;
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
    `<g fill="${TENT}" stroke="${OUTLINE}" stroke-opacity="0.25" stroke-width="0.6">${knobs}</g>` +
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
    const rr = 2.2 + Math.cos(phi) * 1.6 + r() * 0.5;
    knobs += `<ellipse cx="${f(x - 3)}" cy="${f(y)}" rx="${f(rr * 0.9)}" ry="${f(rr * 1.3 * Math.max(0.35, Math.cos(phi)))}"/>`;
  }
  const p: [number, number][] = [];
  for (let k = 0; k <= 10; k++) p.push(P(0, -Math.PI / 2 + (Math.PI * k) / 10));
  return (
    `<path d="${smoothPath(p)}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.5" stroke-width="1.4"/>` +
    `<g fill="${TENT}" stroke="${OUTLINE}" stroke-opacity="0.3" stroke-width="0.6">${knobs}</g>`
  );
}

// ---------- Thân mềm ----------
/** ống mềm theo đường cong bezier, bề rộng w0 → w1 */
function tube(c: [[number, number], [number, number], [number, number], [number, number]], w0: number, w1: number, n = 14) {
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
    const w = (w0 + (w1 - w0) * (i / n)) / 2;
    L.push([ctr[i][0] + nx * w, ctr[i][1] + ny * w]);
    R.push([ctr[i][0] - nx * w, ctr[i][1] - ny * w]);
  }
  const end = ctr[n];
  const pe = ctr[n - 1];
  const ang = (Math.atan2(end[1] - pe[1], end[0] - pe[0]) * 180) / Math.PI;
  return { d: smoothPath([...L, ...R.reverse()], true, 0.45), ctr, L, R: R.reverse(), end, ang };
}

const SIPHON = tube([[410, 134], [446, 132], [478, 112], [510, 78]], 17, 13);
const ROSTRUM = tube([[414, 178], [438, 180], [458, 186], [490, 196]], 13, 30);
const TENT_NEAR = tube([[424, 168], [438, 160], [450, 152], [466, 147]], 5, 2.6);
const TENT_FAR = tube([[418, 166], [430, 156], [440, 150], [452, 141]], 4.4, 2.4);

const FOOT = smoothPath(
  [
    [118, 204], [170, 200], [240, 196], [310, 188], [370, 176], [408, 166], [440, 176], [462, 196], [476, 214],
    [474, 232], [452, 240], [380, 242], [280, 242], [190, 240], [136, 232], [112, 220],
  ],
  true,
  0.5,
);
const HEAD = smoothPath(
  [[388, 170], [412, 160], [432, 164], [444, 178], [440, 198], [420, 206], [396, 200]],
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
    scatterSpots(404, { x: 110, y: 186, w: 370, h: 56 }, { count: 70, rMin: 1.2, rMax: 3.6, color: MOTTLE, opacity: 0.45, ellipse: 1.8 }) +
    scatterSpots(808, { x: 110, y: 186, w: 370, h: 56 }, { count: 40, rMin: 0.8, rMax: 1.8, color: '#5f2a18', opacity: 0.4 })
  );
}

// ---------- Nền thẻ (cát) ----------
function seabed(): string {
  const r = rng(64);
  let pebbles = '';
  for (let i = 0; i < 26; i++) {
    const x = 20 + r() * 520;
    const y = 244 + r() * 20;
    const rr = 1.5 + r() * 4;
    const c = ['#d9c7a3', '#c7b28a', '#e9dcc0', '#b9a07a'][Math.floor(r() * 4)];
    pebbles += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rr * 1.4)}" ry="${f(rr)}" fill="${c}" opacity="0.85"/>`;
  }
  return (
    `<path d="M0 252C120 236 260 238 380 240C460 241 520 246 560 250V268H0Z" fill="${u.url('sand')}"/>` +
    pebbles
  );
}

// ---------- defs ----------
const defs = joinDefs(
  clip(u('shellClip'), SHELL),
  clip(u('whorlClip'), WHORL),
  clip(u('siphonClip'), SIPHON.d),
  clip(u('footClip'), FOOT),
  rimGradient(u('rim'), '#ffffff', 0.85),
  linear(u('shellBase'), [
    [0, '#9b4a2a'],
    [0.5, NET],
    [1, '#8a3f24'],
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
    [0.62, '#2a0d05', 0.12],
    [0.9, '#2a0d05', 0.42],
    [1, '#2a0d05', 0.3],
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
  radial(u('rostrumIn'), [
    [0, '#5a1a1c'],
    [0.6, '#9a4a46'],
    [1, '#d79a8e'],
  ]),
  radial(u('siphonIn'), [
    [0, '#3d1410'],
    [0.7, '#8a3a26'],
    [1, '#e0a07c'],
  ]),
  linear(u('sand'), [
    [0, '#e7d7b4', 0.95],
    [1, '#b79f78', 0.95],
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
      pivot: [414, 134],
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
        `<path d="${TENT_FAR.d}" fill="${FLESH_D}" stroke="#8a5040" stroke-opacity="0.4" stroke-width="0.7"/>` +
        `<circle cx="${f(TENT_FAR.end[0] - 3)}" cy="${f(TENT_FAR.end[1] + 2.4)}" r="1.7" fill="#120806"/>`,
    },
    {
      name: 'foot',
      role: 'body',
      svg:
        `<ellipse cx="300" cy="244" rx="190" ry="10" fill="${u.url('shadow')}" filter="${u.url('soft')}"/>` +
        `<path d="${FOOT}" fill="${u.url('fleshFill')}"/>` +
        `<g clip-path="${u.url('footClip')}">` +
        footMottle() +
        // mép đế chân sẫm
        `<path d="M112 222C150 236 220 240 300 240C380 240 440 238 474 228" fill="none" stroke="#8d5a46" stroke-opacity="0.45" stroke-width="5" filter="${u.url('soft')}"/>` +
        `</g>` +
        `<path d="${FOOT}" fill="none" stroke="#7d4636" stroke-opacity="0.5" stroke-width="1.4"/>`,
    },
    {
      name: 'head',
      role: 'body',
      svg:
        `<path d="${HEAD}" fill="${u.url('fleshFill')}" stroke="#7d4636" stroke-opacity="0.45" stroke-width="1.2"/>` +
        scatterSpots(222, { x: 392, y: 164, w: 50, h: 38 }, { count: 12, rMin: 0.9, rMax: 2.2, color: MOTTLE, opacity: 0.45 }) +
        // vòi miệng loe hình phễu (rostrum) – để nuốt cá
        `<path d="${ROSTRUM.d}" fill="${u.url('fleshFill')}" stroke="#7d4636" stroke-opacity="0.5" stroke-width="1.2"/>` +
        `<path d="${smoothPath(ROSTRUM.L)}" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1.6"/>` +
        scatterSpots(333, { x: 430, y: 178, w: 52, h: 24 }, { count: 10, rMin: 0.8, rMax: 1.8, color: '#b0563a', opacity: 0.5 }) +
        `<ellipse cx="${f(ROSTRUM.end[0])}" cy="${f(ROSTRUM.end[1])}" rx="5.5" ry="15" fill="${u.url('rostrumIn')}" stroke="#f3c9b8" stroke-width="1.6" transform="rotate(${f(ROSTRUM.ang)} ${f(ROSTRUM.end[0])} ${f(ROSTRUM.end[1])})"/>`,
    },
    {
      name: 'shell',
      role: 'body',
      svg:
        // tháp vỏ
        `<path d="${SHELL}" fill="${u.url('spireFill')}"/>` +
        // vòng thân: nền nâu đỏ + dải + lưới lều
        `<g clip-path="${u.url('whorlClip')}">` +
        `<path d="${WHORL}" fill="${u.url('shellBase')}"/>` +
        bandShapes() +
        whiteBlobs() +
        tents() +
        growthLines() +
        spiralThreads() +
        `</g>` +
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
        `<path d="${TENT_NEAR.d}" fill="${u.url('fleshFill')}" stroke="#7d4636" stroke-opacity="0.5" stroke-width="0.8"/>` +
        `<circle cx="${f(TENT_NEAR.end[0] - 3.5)}" cy="${f(TENT_NEAR.end[1] + 1.6)}" r="2.1" fill="#120806"/>` +
        `<circle cx="${f(TENT_NEAR.end[0] - 4.1)}" cy="${f(TENT_NEAR.end[1] + 1)}" r="0.7" fill="#ffffff" opacity="0.85"/>`,
    },
  ],
};

export default art;
