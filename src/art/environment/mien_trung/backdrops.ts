/**
 * Dải nền xa (parallax) – lặp ngang liền mép trái-phải (W = 2048).
 * Càng xa càng ngả màu nước, ít chi tiết, tương phản thấp.
 */
import type { BackdropArt } from '../contract-env';
import { linear, rng } from '../../style-bible';
import { f, growTree, haze, ids, light, periodicProfile, profileLine, profileShape, wrapX, WATER_DEEP, WATER_SHALLOW } from './common';
import type { Pt } from './common';

const W = 2048;

function yAt(pts: Pt[], x: number): number {
  const xx = ((x % W) + W) % W;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i][0] >= xx) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      return y0 + ((xx - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return pts[pts.length - 1][1];
}

// ---- hình bóng đơn giản ----
const tableSil = (x: number, y: number, s: number) =>
  `M${f(x - s * 0.07)} ${f(y + 4)}L${f(x - s * 0.05)} ${f(y - s * 0.42)}C${f(x - s * 0.2)} ${f(y - s * 0.46)} ${f(x - s * 0.45)} ${f(y - s * 0.48)} ${f(x - s * 0.55)} ${f(y - s * 0.52)}` +
  `C${f(x - s * 0.58)} ${f(y - s * 0.6)} ${f(x - s * 0.4)} ${f(y - s * 0.64)} ${f(x)} ${f(y - s * 0.64)}C${f(x + s * 0.4)} ${f(y - s * 0.64)} ${f(x + s * 0.6)} ${f(y - s * 0.6)} ${f(x + s * 0.55)} ${f(y - s * 0.52)}` +
  `C${f(x + s * 0.45)} ${f(y - s * 0.48)} ${f(x + s * 0.2)} ${f(y - s * 0.46)} ${f(x + s * 0.05)} ${f(y - s * 0.42)}L${f(x + s * 0.07)} ${f(y + 4)}Z`;

const domeSil = (x: number, y: number, s: number) =>
  `M${f(x - s * 0.5)} ${f(y + 4)}C${f(x - s * 0.52)} ${f(y - s * 0.3)} ${f(x - s * 0.3)} ${f(y - s * 0.45)} ${f(x)} ${f(y - s * 0.45)}C${f(x + s * 0.3)} ${f(y - s * 0.45)} ${f(x + s * 0.52)} ${f(y - s * 0.3)} ${f(x + s * 0.5)} ${f(y + 4)}Z`;

const fanSil = (x: number, y: number, s: number, r: () => number) => {
  const pts: string[] = [];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * (1.08 + (0.84 * i) / n);
    const k = 0.85 + r() * 0.2;
    pts.push(`${f(x + Math.cos(a) * s * 0.55 * k)} ${f(y - s * 0.12 + Math.sin(a) * s * 0.8 * k)}`);
  }
  return `M${f(x - 2)} ${f(y + 3)}L${pts.join('L')}L${f(x + 2)} ${f(y + 3)}Z`;
};

function tuftSil(x: number, y: number, s: number, seed: number): string {
  const segs = growTree(
    [
      { x, y: y + 3, a: -Math.PI / 2 - 0.5 },
      { x, y: y + 3, a: -Math.PI / 2 },
      { x, y: y + 3, a: -Math.PI / 2 + 0.5 },
    ],
    { seed, depth: 2, len: s * 0.32, lenDecay: 0.75, w: 1, wDecay: 1, spread: 0.45, wiggle: 0.25, segs: 2 },
  );
  return segs.map((sg) => `M${f(sg.a[0])} ${f(sg.a[1])}L${f(sg.b[0])} ${f(sg.b[1])}`).join('');
}

interface BandOpts {
  id: string;
  seed: number;
  H: number;
  base: number;
  terms: [number, number, number][];
  count: number;
  scale: [number, number];
  top: string;
  bottom: string;
  rim?: string;
  rimOp?: number;
  tint?: string[];
  tintK?: number;
  pinnacles?: number;
}

/** Dải rạn: sống rạn tuần hoàn + bóng san hô cắm trên đỉnh */
function reefBand(o: BandOpts): { defs: string; svg: string } {
  const u = ids(o.id);
  const r = rng(o.seed);
  const pts = periodicProfile(W, o.base, o.terms, 16);
  // khối nhô (bommie) – hồ sơ cộng thêm hình chuông, nhân bản qua mép
  if (o.pinnacles) {
    for (let k = 0; k < o.pinnacles; k++) {
      const px = r() * W;
      const pw = 80 + r() * 120;
      const ph = 50 + r() * 90;
      for (const p of pts) {
        for (const off of [-W, 0, W]) {
          const dx = (p[0] - px - off) / pw;
          p[1] -= ph * Math.exp(-dx * dx * 2.2) * (1 + 0.15 * Math.sin(p[0] * 0.08));
        }
      }
    }
    pts[pts.length - 1][1] = pts[0][1];
  }
  const ridge = profileShape(pts, o.H);
  const groups: Map<number, string> = new Map();
  let tufts = '';
  const tufC: Map<number, string> = new Map();
  for (let i = 0; i < o.count; i++) {
    const x = (i / o.count) * W + r() * (W / o.count) * 0.8;
    const s = o.scale[0] + r() * (o.scale[1] - o.scale[0]);
    const kind = r();
    const ci = o.tint ? Math.floor(r() * o.tint.length) : 0;
    const add = (d: string) => groups.set(ci, (groups.get(ci) ?? '') + d);
    const y0 = (xx: number) => yAt(pts, xx) + 2;
    if (kind < 0.3) add(wrapX(W, x, s * 0.6, (xx) => tableSil(xx, y0(xx), s)));
    else if (kind < 0.5) add(wrapX(W, x, s * 0.55, (xx) => domeSil(xx, y0(xx), s * 0.7)));
    else if (kind < 0.72) add(wrapX(W, x, s * 0.6, (xx) => fanSil(xx, y0(xx), s, r)));
    else {
      const seed = o.seed * 31 + i;
      const d = wrapX(W, x, s * 0.6, (xx) => tuftSil(xx, y0(xx), s, seed));
      tufts += d;
      tufC.set(ci, (tufC.get(ci) ?? '') + d);
    }
  }
  const top = Math.min(...pts.map((p) => p[1])) - o.scale[1] * 0.7;
  let defs = linear(u('g'), [
    [0, o.top],
    [1, o.bottom],
  ], { user: true, x1: 0, y1: top, x2: 0, y2: o.H });
  let svg = `<path d="${ridge}" fill="${u.url('g')}"/>`;
  if (o.tint) {
    o.tint.forEach((c, i) => {
      defs += linear(u('t' + i), [
        [0, haze(c, o.tintK ?? 0.6, o.top)],
        [1, o.bottom],
      ], { user: true, x1: 0, y1: top, x2: 0, y2: o.H });
    });
  }
  for (const [ci, d] of groups) svg += `<path d="${d}" fill="${o.tint ? u.url('t' + ci) : u.url('g')}"/>`;
  if (tufts) {
    const sw = o.scale[0] * 0.07;
    if (o.tint) for (const [ci, d] of tufC) svg += `<path d="${d}" fill="none" stroke="${u.url('t' + ci)}" stroke-width="${f(sw)}" stroke-linecap="round"/>`;
    else svg += `<path d="${tufts}" fill="none" stroke="${u.url('g')}" stroke-width="${f(sw)}" stroke-linecap="round"/>`;
  }
  if (o.rim) svg += `<path d="${profileLine(pts)}" fill="none" stroke="${o.rim}" stroke-opacity="${o.rimOp ?? 0.4}" stroke-width="3"/>`;
  return { defs, svg };
}

// ---------------------------------------------------------------------------

export function farReef(): BackdropArt {
  const H = 400;
  const a = reefBand({
    id: 'bd_far_a',
    seed: 11,
    H,
    base: 250,
    terms: [
      [30, 1, 0.4],
      [22, 3, 1.7],
      [12, 7, 0.2],
      [6, 13, 2.2],
    ],
    count: 26,
    scale: [40, 90],
    top: haze('#9fe2f0', 0.2),
    bottom: haze(WATER_SHALLOW, 0.3, WATER_DEEP),
  });
  const b = reefBand({
    id: 'bd_far_b',
    seed: 12,
    H,
    base: 315,
    terms: [
      [18, 2, 2.4],
      [14, 5, 0.9],
      [6, 11, 1.3],
    ],
    count: 22,
    scale: [36, 70],
    top: haze('#78cde3', 0.15),
    bottom: haze(WATER_SHALLOW, 0.45, WATER_DEEP),
  });
  return { id: 'bd_far_reef', viewBox: [W, H], defs: a.defs + b.defs, svg: a.svg + b.svg, parallax: 0.18, heightPx: 300, anchor: 'bottom', opacity: 0.55, tiers: [1, 2] };
}

export function reefWall(): BackdropArt {
  const H = 512;
  const a = reefBand({
    id: 'bd_wall',
    seed: 23,
    H,
    base: 300,
    terms: [
      [40, 1, 2.1],
      [26, 2, 0.3],
      [14, 5, 1.1],
      [7, 11, 0.6],
    ],
    count: 30,
    scale: [50, 110],
    top: '#5fb9d4',
    bottom: '#1d6f9a',
    rim: '#c8f4ff',
    rimOp: 0.22,
    pinnacles: 5,
    tint: ['#5fb9d4', '#8fa0c8', '#c99a9a', '#a8b98a'],
    tintK: 0.72,
  });
  // mảng màu san hô rất nhạt trên vách
  const r = rng(29);
  let blobs = '';
  for (let i = 0; i < 26; i++) {
    const x = 60 + r() * (W - 120);
    const y = 330 + r() * 140;
    blobs += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(20 + r() * 40)}" ry="${f(8 + r() * 14)}" fill="${['#e0a0b4', '#e8c87a', '#a6d0a0', '#b8a8e0'][i % 4]}" opacity="0.1"/>`;
  }
  return { id: 'bd_reef_wall', viewBox: [W, H], defs: a.defs, svg: a.svg + blobs, parallax: 0.38, heightPx: 380, anchor: 'bottom', opacity: 0.65, tiers: [1, 2] };
}

export function nearReef(): BackdropArt {
  const H = 360;
  const a = reefBand({
    id: 'bd_near',
    seed: 41,
    H,
    base: 300,
    terms: [
      [16, 1, 0.9],
      [12, 3, 2.6],
      [8, 7, 1.2],
      [4, 15, 0.4],
    ],
    count: 34,
    scale: [60, 130],
    top: '#4aa9c6',
    bottom: '#1a6990',
    rim: '#e6fbff',
    rimOp: 0.28,
    pinnacles: 3,
    tint: ['#c98bb8', '#d9b56a', '#7fb7a0', '#8aa6d8', '#d98a7a'],
    tintK: 0.6,
  });
  return { id: 'bd_near_reef', viewBox: [W, H], defs: a.defs, svg: a.svg, parallax: 0.58, heightPx: 250, anchor: 'bottom', opacity: 0.85, tiers: [1, 2] };
}

/** Đàn cá nhỏ xa – dạng bóng, lơ lửng giữa nước */
export function fishSchools(): BackdropArt {
  const u = ids('bd_fish');
  const H = 300;
  const r = rng(57);
  const schools = [
    { x: 340, y: 150, rx: 200, ry: 75, n: 80, dir: 1, l: 22 },
    { x: 1050, y: 110, rx: 140, ry: 55, n: 50, dir: -1, l: 19 },
    { x: 1640, y: 180, rx: 240, ry: 85, n: 95, dir: 1, l: 21 },
  ];
  let bodies = '';
  let glints = '';
  for (const s of schools) {
    for (let i = 0; i < s.n; i++) {
      // phân bố dạng dải cong (đàn đang uốn)
      const t = r() * 2 - 1;
      const band = (r() - 0.5) * 2;
      const x = s.x + t * s.rx;
      const y = s.y + Math.sin(t * 2.2) * s.ry * 0.45 + band * s.ry * 0.45 * (1 - t * t * 0.5);
      const l = s.l * (0.75 + r() * 0.5);
      const h = l * 0.22;
      const a = Math.cos(t * 2.2) * 0.25 * s.dir + (r() - 0.5) * 0.15;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const P = (dx: number, dy: number) => `${f(x + (dx * ca - dy * sa) * s.dir)} ${f(y + dx * sa + dy * ca)}`;
      bodies += `M${P(-l / 2, 0)}Q${P(0, -h * 1.6)} ${P(l / 2, 0)}Q${P(0, h * 1.6)} ${P(-l / 2, 0)}Z`;
      bodies += `M${P(-l * 0.42, 0)}L${P(-l * 0.72, -h * 1.1)}L${P(-l * 0.62, 0)}L${P(-l * 0.72, h * 1.1)}Z`;
      if (r() < 0.35) glints += `M${P(-l * 0.2, -h * 0.3)}L${P(l * 0.3, -h * 0.4)}`;
    }
  }
  const defs = linear(u('g'), [
    [0, haze('#2d7fa8', 0.1, '#bdf3ff')],
    [1, '#1c5f86'],
  ], { user: true, x1: 0, y1: 40, x2: 0, y2: 280 });
  const svg =
    `<path d="${bodies}" fill="${u.url('g')}"/>` +
    `<path d="${glints}" fill="none" stroke="${light('#bdf3ff', 0.3)}" stroke-opacity="0.55" stroke-width="1.1" stroke-linecap="round"/>`;
  return { id: 'bd_fish_school', viewBox: [W, H], defs, svg, parallax: 0.3, heightPx: 170, anchor: 'mid', opacity: 0.6, tiers: [1, 2] };
}
