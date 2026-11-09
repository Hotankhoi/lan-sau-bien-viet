/**
 * Đá rạn (bám tảo vôi hồng, cỏ tảo, san hô nhỏ, giun cây thông) và đồ trang trí đáy (vỏ ốc, sỏi, san hô vụn).
 */
import type { PropArt } from '../contract-env';
import { linear, organicTexture, radial, rimGradient, rng, smoothPath } from '../../style-bible';
import { contactShadow, dark, f, ids, ink, light } from './common';
import type { Pt } from './common';

function blob(r: () => number, cx: number, cy: number, rx: number, ry: number, n = 7, jag = 0.3): string {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 - jag / 2 + r() * jag;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smoothPath(pts, true);
}

// ---------------------------------------------------------------------------
// ĐÁ RẠN
// ---------------------------------------------------------------------------

export function reefRock(o: {
  id: string;
  seed: number;
  vb: [number, number];
  heightPx: number;
  /** các khối đá con: tâm x, bán kính ngang, cao */
  lumps: { cx: number; rx: number; h: number }[];
  c: { lit: string; body: string; base: string; coralline: string; turf: string };
  worms?: number;
  encrust?: number;
  weight?: number;
  tiers?: number[];
}): PropArt {
  const u = ids(o.id);
  const r = rng(o.seed);
  const [W, H] = o.vb;
  let bodies = '';
  let tops = '';
  let clipD = '';
  const topPts: Pt[] = [];
  for (const L of o.lumps) {
    const n = 11;
    const pts: Pt[] = [[L.cx + L.rx, H]];
    for (let i = 1; i < n; i++) {
      const a = (i / n) * Math.PI;
      const k = 0.85 + r() * 0.25;
      const x = L.cx + Math.cos(a) * L.rx * (0.95 + r() * 0.1);
      const y = H - Math.pow(Math.sin(a), 0.7) * L.h * k;
      pts.push([x, y]);
      if (i > 1 && i < n - 1) topPts.push([x, y]);
    }
    pts.push([L.cx - L.rx, H]);
    const d = smoothPath(pts, true, 0.55);
    clipD += d;
    bodies += `<path d="${d}"/>`;
    tops += smoothPath(pts.slice(1, -1), false, 0.55);
  }
  // vết nứt
  let cracks = '';
  for (let i = 0; i < 3; i++) {
    const L = o.lumps[i % o.lumps.length];
    const x = L.cx + (r() - 0.5) * L.rx * 1.2;
    const y = H - L.h * (0.2 + r() * 0.5);
    cracks += smoothPath([
      [x, y],
      [x + (r() - 0.5) * 18, y + 8 + r() * 8],
      [x + (r() - 0.5) * 26, y + 20 + r() * 14],
    ]);
  }
  // tảo vôi hồng loang
  let coral = '';
  for (let i = 0; i < 16; i++) {
    const L = o.lumps[Math.floor(r() * o.lumps.length)];
    coral += blob(r, L.cx + (r() - 0.5) * L.rx * 1.3, H - L.h * (0.25 + r() * 0.6), 3 + r() * 8, 2 + r() * 5, 8, 0.5);
  }
  // cỏ tảo trên mép trên
  let turf = '';
  for (const [x, y] of topPts) {
    for (let k = 0; k < 4; k++) {
      const xx = x + (r() - 0.5) * 10;
      turf += `M${f(xx)} ${f(y + 3)}l${f((r() - 0.5) * 3)} ${f(-3 - r() * 4)}`;
    }
  }
  // san hô nhỏ bám + polyp zoanthid
  let enc = '';
  let zo = '';
  const nEnc = o.encrust ?? 2;
  for (let i = 0; i < nEnc; i++) {
    const p = topPts[Math.floor(r() * topPts.length)];
    const rr = 6 + r() * 7;
    enc += `<path d="M${f(p[0] - rr)} ${f(p[1] + 3)}A${f(rr)} ${f(rr * 0.8)} 0 0 1 ${f(p[0] + rr)} ${f(p[1] + 3)}Z" fill="${u.url('enc')}" stroke="${ink('#9a8a4a')}" stroke-opacity="0.45" stroke-width="0.9"/>`;
    enc += `<path d="M${f(p[0] - rr * 0.6)} ${f(p[1] + 1)}Q${f(p[0])} ${f(p[1] - rr * 0.7)} ${f(p[0] + rr * 0.6)} ${f(p[1] + 1)}" fill="none" stroke="#6f6230" stroke-opacity="0.5" stroke-width="1" stroke-dasharray="1.2 1.4"/>`;
    const q = topPts[Math.floor(r() * topPts.length)];
    for (let k = 0; k < 7; k++) zo += `M${f(q[0] + (r() - 0.5) * 14)} ${f(q[1] + 2 + r() * 8)}h0.01`;
  }
  // giun cây thông (Spirobranchus) – nón xoắn nhiều màu
  let worms = '';
  const wc = ['#e8a33c', '#4f86d6', '#d35a6a', '#f2f2e0'];
  for (let i = 0; i < (o.worms ?? 0); i++) {
    const p = topPts[Math.floor(r() * topPts.length)];
    const col = wc[Math.floor(r() * wc.length)];
    const h = 10 + r() * 5;
    const x = p[0] + (r() - 0.5) * 6;
    const y = p[1] + 2;
    for (const dx of [-3.6, 3.6]) {
      const bx = x + dx;
      let rings = '';
      for (let k = 1; k < 5; k++) {
        const yy = y - (h * k) / 5;
        const ww = 3.6 * (1 - k / 5.5);
        rings += `M${f(bx - ww)} ${f(yy + 1)}Q${f(bx)} ${f(yy - 1)} ${f(bx + ww)} ${f(yy + 1)}`;
      }
      worms +=
        `<path d="M${f(bx - 4)} ${f(y)}L${f(bx)} ${f(y - h)}L${f(bx + 4)} ${f(y)}Z" fill="${col}" stroke="${ink(col)}" stroke-opacity="0.5" stroke-width="0.7"/>` +
        `<path d="${rings}" fill="none" stroke="${light(col, 0.55)}" stroke-width="0.8" stroke-opacity="0.8"/>`;
    }
  }
  const sh = contactShadow(u, W / 2, H - 2, W * 0.5, 8, 0.4);
  const defs =
    sh.defs +
    `<clipPath id="${u('clip')}"><path d="${clipD}"/></clipPath>` +
    linear(u('fill'), [
      [0, light(o.c.lit, 0.15)],
      [0.3, o.c.lit],
      [0.65, o.c.body],
      [1, o.c.base],
    ], { user: true, x1: 0, y1: H - Math.max(...o.lumps.map((l) => l.h)), x2: 0, y2: H }) +
    radial(u('vol'), [
      [0, '#ffffff', 0.18],
      [0.45, '#ffffff', 0],
      [0.8, '#06283f', 0.04],
      [1, '#06283f', 0.28],
    ], { cx: 0.4, cy: 0.15, r: 0.85 }) +
    radial(u('enc'), [
      [0, '#d9cf86'],
      [1, '#9a8a4a'],
    ], { cy: 0.3 }) +
    rimGradient(u('rim'), '#fffbe8', 0.85) +
    organicTexture(u('tex'), { freq: 0.13, octaves: 2, strength: 0.16, seed: o.seed % 50 });
  const svg =
    sh.svg +
    `<g fill="${u.url('fill')}" filter="${u.url('tex')}">${bodies}</g>` +
    `<g clip-path="${u.url('clip')}">` +
    `<path d="${coral}" fill="${o.c.coralline}" fill-opacity="0.45" stroke="${light(o.c.coralline, 0.5)}" stroke-opacity="0.5" stroke-width="0.8"/>` +
    `<path d="${cracks}" fill="none" stroke="${dark(o.c.base, 0.45)}" stroke-opacity="0.35" stroke-width="1.3" stroke-linecap="round"/>` +
    `<g fill="${u.url('vol')}">${bodies}</g>` +
    `</g>` +
    `<g fill="none" stroke="${ink(o.c.body)}" stroke-opacity="0.55" stroke-width="1.6">${bodies}</g>` +
    `<path d="${tops}" fill="none" stroke="${u.url('rim')}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="${turf}" fill="none" stroke="${o.c.turf}" stroke-opacity="0.8" stroke-width="1.3" stroke-linecap="round"/>` +
    enc +
    `<path d="${zo}" fill="none" stroke="#c46aa6" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="${zo}" fill="none" stroke="#f7c7e4" stroke-width="1.2" stroke-linecap="round"/>` +
    worms;
  return { id: o.id, kind: 'rock', viewBox: [W, H], defs, svg, heightPx: o.heightPx, sway: 0, weight: o.weight ?? 1, tiers: o.tiers ?? [1, 2] };
}

// ---------------------------------------------------------------------------
// TRANG TRÍ: vỏ ốc + sò + sỏi
// ---------------------------------------------------------------------------

function pebbles(u: ReturnType<typeof ids>, r: () => number, W: number, H: number, n: number, cols: string[]): string {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = 8 + r() * (W - 16);
    const rx = 3 + r() * 6;
    const ry = rx * (0.5 + r() * 0.25);
    const c = cols[Math.floor(r() * cols.length)];
    s += `<ellipse cx="${f(x)}" cy="${f(H - ry - 1)}" rx="${f(rx)}" ry="${f(ry)}" fill="${c}" stroke="${ink(c)}" stroke-opacity="0.35" stroke-width="0.7"/>`;
  }
  return s;
}

export function shellsDecor(o: { id: string; seed: number; heightPx: number; weight?: number }): PropArt {
  const u = ids(o.id);
  const r = rng(o.seed);
  const W = 160;
  const H = 52;
  // ốc xoắn (conch) nằm nghiêng, đỉnh xoắn hướng trái
  // ốc đụn (Trochus) dựng đứng: nón xoắn, vạch lửa nâu đỏ
  const conch = 'M16 47C15 40 20 33 27 27L45 6L63 27C70 33 75 40 74 47C62 51 28 51 16 47Z';
  let whorls = '';
  let flames = '';
  for (let i = 0; i < 4; i++) {
    const y = 15 + i * 9;
    const hw = 8 + i * 7.5;
    whorls += `M${f(45 - hw)} ${f(y + 3)}Q45 ${f(y + 6)} ${f(45 + hw)} ${f(y + 1)}`;
    for (let k = -2; k <= 2; k++) {
      const x = 45 + (k * hw) / 2.6;
      flames += `M${f(x)} ${f(y - 4)}L${f(x + 2.5)} ${f(y)}L${f(x - 1)} ${f(y + 4)}`;
    }
  }
  // ốc bảo bối (cowrie)
  const cowrie = 'M98 46C96 36 106 28 120 28C134 28 142 36 140 46Z';
  // vỏ sò quạt
  let ribs = '';
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI * (1.12 + (0.76 * i) / 8);
    ribs += `M146 49L${f(146 + Math.cos(a) * 12)} ${f(49 + Math.sin(a) * 12)}`;
  }
  const sh = contactShadow(u, W / 2, H - 3, W * 0.48, 5, 0.3);
  const defs =
    sh.defs +
    linear(u('conch'), [
      [0, '#f6e7cf'],
      [0.6, '#e6c6a0'],
      [1, '#b08460'],
    ], { x2: 1, y2: 0.4 }) +
    radial(u('ap'), [
      [0, '#ffd9cf'],
      [0.7, '#f2a99a'],
      [1, '#c97a6a'],
    ]) +
    radial(u('cow'), [
      [0, '#fff4e0'],
      [0.5, '#d9a066'],
      [1, '#7a4a2a'],
    ], { cx: 0.42, cy: 0.25, r: 0.8 }) +
    radial(u('peb'), [
      [0, '#ffffff', 0.4],
      [1, '#ffffff', 0],
    ]);
  let spots = '';
  for (let i = 0; i < 14; i++) spots += `M${f(104 + r() * 30)} ${f(33 + r() * 10)}h0.01`;
  const svg =
    sh.svg +
    pebbles(u, r, W, H, 7, ['#c9bfa6', '#a8a08a', '#ddd3bb', '#8f9a9a']) +
    `<path d="${conch}" fill="${u.url('conch')}" stroke="#7a5236" stroke-opacity="0.55" stroke-width="1"/>` +
    `<path d="${flames}" fill="none" stroke="#a5503a" stroke-opacity="0.55" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="${whorls}" fill="none" stroke="#6e3e28" stroke-opacity="0.5" stroke-width="1.3"/>` +
    `<path d="M22 46Q45 52 68 46Q45 48 22 46Z" fill="${u.url('ap')}" opacity="0.8"/>` +
    `<path d="M27 27L45 6" fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1.6" stroke-linecap="round"/>` +
    `<path d="${cowrie}" fill="${u.url('cow')}" stroke="#5a3418" stroke-opacity="0.5" stroke-width="1"/>` +
    `<path d="${spots}" fill="none" stroke="#fff3dc" stroke-opacity="0.8" stroke-width="2.2" stroke-linecap="round"/>` +
    `<ellipse cx="114" cy="33" rx="9" ry="2.5" fill="#ffffff" opacity="0.55"/>` +
    `<path d="M134 49A12 12 0 0 1 158 49Z" fill="#e9a58c" stroke="#9a5a48" stroke-opacity="0.55" stroke-width="0.9"/>` +
    `<path d="${ribs}" fill="none" stroke="#b86a56" stroke-opacity="0.55" stroke-width="0.9"/>`;
  return { id: o.id, kind: 'decor', viewBox: [W, H], defs, svg, heightPx: o.heightPx, sway: 0, weight: o.weight ?? 1.4, tiers: [1, 2] };
}

// ---------------------------------------------------------------------------
// TRANG TRÍ: san hô vụn trắng + sỏi
// ---------------------------------------------------------------------------

export function rubbleDecor(o: { id: string; seed: number; heightPx: number; weight?: number }): PropArt {
  const u = ids(o.id);
  const r = rng(o.seed);
  const W = 180;
  const H = 40;
  let segs = '';
  let tips = '';
  for (let i = 0; i < 7; i++) {
    const x = 12 + r() * (W - 24);
    const y = H - 4 - r() * 6;
    const a = (r() - 0.5) * 0.8 + (r() < 0.5 ? 0 : Math.PI);
    const L = 12 + r() * 12;
    const x2 = x + Math.cos(a) * L;
    const y2 = Math.min(H - 3, y + Math.sin(a) * L * 0.4);
    segs += `M${f(x)} ${f(y)}L${f(x2)} ${f(y2)}`;
    const b = a - 0.7;
    const fx = x + (x2 - x) * 0.6;
    const fy = y + (y2 - y) * 0.6;
    segs += `M${f(fx)} ${f(fy)}l${f(Math.cos(b) * 7)} ${f(Math.sin(b) * 3)}`;
    tips += `M${f(fx + Math.cos(b) * 7)} ${f(fy + Math.sin(b) * 3)}h0.01`;
    tips += `M${f(x2)} ${f(y2)}h0.01`;
  }
  const sh = contactShadow(u, W / 2, H - 3, W * 0.48, 4, 0.28);
  const defs =
    sh.defs +
    linear(u('peb'), [
      [0, '#efe4d2'],
      [1, '#b8a892'],
    ]);
  const svg =
    sh.svg +
    pebbles(u, r, W, H, 8, ['#d8ccb0', '#b9b098', '#9aa3a0', '#e6dcc4']) +
    `<g fill="none" stroke-linecap="round">` +
    `<path d="${segs}" stroke="#8a7f70" stroke-opacity="0.5" stroke-width="5.4"/>` +
    `<path d="${segs}" stroke="${u.url('peb')}" stroke-width="4"/>` +
    `<path d="${segs}" stroke="#b3a88c" stroke-opacity="0.45" stroke-width="1.6" stroke-dasharray="0.1 3.5"/>` +
    `<path d="${segs}" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1.1" transform="translate(-0.5 -0.9)"/>` +
    `<path d="${tips}" stroke="#ecd6cc" stroke-width="4.4"/>` +
    `</g>`;
  return { id: o.id, kind: 'decor', viewBox: [W, H], defs, svg, heightPx: o.heightPx, sway: 0, weight: o.weight ?? 1.2, tiers: [1, 2] };
}
