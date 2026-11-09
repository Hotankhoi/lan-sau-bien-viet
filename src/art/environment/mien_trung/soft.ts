/**
 * Sinh vật mềm & thực vật: hải quỳ, quạt biển (gorgonian), bọt biển ống, rong mơ, cỏ biển, rong đỏ.
 */
import type { PropArt } from '../contract-env';
import { linear, radial, rng, smoothPath } from '../../style-bible';
import { contactShadow, dark, f, growTree, ids, ink, light, renderTree } from './common';
import type { Pt } from './common';

// ---------------------------------------------------------------------------
// HẢI QUỲ – cột thân + đĩa miệng + rừng xúc tu (cá hề bơi quanh)
// ---------------------------------------------------------------------------

export function anemone(o: {
  id: string;
  seed: number;
  vb: [number, number];
  heightPx: number;
  n: number;
  disc: { cx: number; cy: number; rx: number; ry: number };
  column?: { wTop: number; wBot: number; color: string };
  tent: { len: [number, number]; w: number; base: string; mid: string; tip: string; splay: number; curl?: number; bulb?: boolean };
  chunk?: number;
  sway?: number;
  weight?: number;
  tiers?: number[];
}): PropArt {
  const u = ids(o.id);
  const r = rng(o.seed);
  const [W, H] = o.vb;
  const { cx, cy, rx, ry } = o.disc;
  const T = o.tent;
  type Tn = { bx: number; by: number; qx: number; qy: number; tx: number; ty: number; back: boolean };
  const list: Tn[] = [];
  for (let i = 0; i < o.n; i++) {
    const t = r() * Math.PI * 2;
    const rr = 0.35 + Math.sqrt(r()) * 0.65;
    const bx = cx + Math.cos(t) * rx * rr;
    const by = cy + Math.sin(t) * ry * rr;
    const L = T.len[0] + r() * (T.len[1] - T.len[0]);
    const off = (bx - cx) / rx;
    const a = -Math.PI / 2 + off * T.splay + (r() - 0.5) * 0.5;
    const tx = bx + Math.cos(a) * L;
    const ty = by + Math.sin(a) * L;
    const curl = (T.curl ?? 0.25) * L * (r() - 0.5) * 2;
    const qx = (bx + tx) / 2 - Math.sin(a) * curl;
    const qy = (by + ty) / 2 + Math.cos(a) * curl * 0.5;
    list.push({ bx, by, qx, qy, tx, ty, back: Math.sin(t) < 0 });
  }
  list.sort((a, b) => a.by - b.by);
  const chunk = o.chunk ?? 2;
  const olc = ink(T.base);
  const drawGroup = (arr: Tn[], back: boolean) => {
    let s = '';
    for (let i = 0; i < arr.length; i += chunk) {
      const c = arr.slice(i, i + chunk);
      const d = c.map((t) => `M${f(t.bx)} ${f(t.by)}Q${f(t.qx)} ${f(t.qy)} ${f(t.tx)} ${f(t.ty)}`).join('');
      const pt = (t: Tn, k: number): Pt => {
        const m = 1 - k;
        return [m * m * t.bx + 2 * m * k * t.qx + k * k * t.tx, m * m * t.by + 2 * m * k * t.qy + k * k * t.ty];
      };
      const hi = c
        .map((t) => {
          const a = pt(t, 0.45);
          const b = pt(t, 0.85);
          return `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
        })
        .join('');
      const tip = c.map((t) => `M${f(t.tx)} ${f(t.ty)}h0.01`).join('');
      s += `<path d="${d}" stroke="${olc}" stroke-opacity="${back ? 0.45 : 0.6}" stroke-width="${f(T.w + 1.6)}"/>`;
      s += `<path d="${d}" stroke="${back ? u.url('tentB') : u.url('tent')}" stroke-width="${f(T.w)}"/>`;
      if (T.bulb) {
        const bd = c
          .map((t) => {
            const p = pt(t, 0.8);
            return `M${f(p[0])} ${f(p[1])}h0.01`;
          })
          .join('');
        s += `<path d="${bd}" stroke="${olc}" stroke-opacity="0.5" stroke-width="${f(T.w * 1.75 + 1.4)}"/>`;
        s += `<path d="${bd}" stroke="${back ? dark(T.mid, 0.12) : T.mid}" stroke-width="${f(T.w * 1.75)}"/>`;
        s += `<path d="${bd}" stroke="${light(T.tip, 0.4)}" stroke-opacity="0.6" stroke-width="${f(T.w * 0.6)}" transform="translate(${f(-T.w * 0.3)} ${f(-T.w * 0.35)})"/>`;
      }
      if (!back) s += `<path d="${hi}" stroke="${light(T.tip, 0.5)}" stroke-opacity="0.45" stroke-width="${f(T.w * 0.3)}" transform="translate(${f(-T.w * 0.18)} 0)"/>`;
      s += `<path d="${tip}" stroke="${back ? dark(T.tip, 0.1) : T.tip}" stroke-width="${f(T.w * (T.bulb ? 0.75 : 1.05))}"/>`;
    }
    return `<g fill="none" stroke-linecap="round">${s}</g>`;
  };
  const topY = cy - T.len[1];
  const sh = contactShadow(u, cx, H - 2, Math.max(rx, (o.column?.wBot ?? 0) / 2) * 1.1, 6);
  let defs =
    sh.defs +
    linear(u('tent'), [
      [0, dark(T.base, 0.2)],
      [0.45, T.mid],
      [1, light(T.tip, 0.15)],
    ], { user: true, x1: 0, y1: cy + ry, x2: 0, y2: topY }) +
    linear(u('tentB'), [
      [0, dark(T.base, 0.45)],
      [0.5, dark(T.mid, 0.25)],
      [1, dark(T.tip, 0.12)],
    ], { user: true, x1: 0, y1: cy + ry, x2: 0, y2: topY }) +
    radial(u('disc'), [
      [0, dark(T.base, 0.5)],
      [1, T.base],
    ]);
  let column = '';
  if (o.column) {
    const C = o.column;
    defs += linear(u('col'), [
      [0, dark(C.color, 0.5)],
      [0.3, light(C.color, 0.15)],
      [0.6, C.color],
      [1, dark(C.color, 0.6)],
    ], { x2: 1, y2: 0 });
    const d =
      `M${f(cx - C.wBot / 2)} ${H}C${f(cx - C.wBot * 0.42)} ${f(H - (H - cy) * 0.5)} ${f(cx - C.wTop * 0.45)} ${f(cy + 10)} ${f(cx - C.wTop / 2)} ${f(cy)}` +
      `L${f(cx + C.wTop / 2)} ${f(cy)}C${f(cx + C.wTop * 0.45)} ${f(cy + 10)} ${f(cx + C.wBot * 0.42)} ${f(H - (H - cy) * 0.5)} ${f(cx + C.wBot / 2)} ${H}Z`;
    let ribs = '';
    for (let i = 1; i < 6; i++) {
      const k = i / 6 - 0.5;
      ribs += `M${f(cx + k * C.wTop)} ${f(cy + 4)}Q${f(cx + k * C.wTop * 1.05)} ${f((cy + H) / 2)} ${f(cx + k * C.wBot * 0.95)} ${H - 2}`;
    }
    column =
      `<path d="${d}" fill="${u.url('col')}" stroke="${ink(C.color)}" stroke-opacity="0.5" stroke-width="1.4"/>` +
      `<path d="${ribs}" fill="none" stroke="${light(C.color, 0.3)}" stroke-opacity="0.25" stroke-width="1.4"/>`;
  }
  const svg =
    sh.svg +
    drawGroup(
      list.filter((t) => t.back),
      true,
    ) +
    column +
    `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx * 0.9)}" ry="${f(ry * 0.8)}" fill="${u.url('disc')}"/>` +
    drawGroup(
      list.filter((t) => !t.back),
      false,
    );
  return {
    id: o.id,
    kind: 'anemone',
    viewBox: [W, H],
    defs,
    svg,
    heightPx: o.heightPx,
    sway: o.sway ?? 0.32,
    weight: o.weight ?? 1,
    tiers: o.tiers ?? [1],
  };
}

// ---------------------------------------------------------------------------
// QUẠT BIỂN (gorgonian) – nhánh phẳng tỏa quạt + lưới mảnh nối nhánh
// ---------------------------------------------------------------------------

export function seaFan(o: {
  id: string;
  seed: number;
  vb: [number, number];
  heightPx: number;
  c: { branch: string; polyp: string };
  primaries: number;
  arc: [number, number];
  depth: number;
  len: number;
  w: number;
  spread: number;
  sway?: number;
  weight?: number;
  tiers?: number[];
}): PropArt {
  const u = ids(o.id);
  const r = rng(o.seed + 1);
  const [W, H] = o.vb;
  const bx = W / 2;
  const trunkTop = H - 22;
  const starts = Array.from({ length: o.primaries }, (_, i) => {
    const t = o.primaries === 1 ? 0.5 : i / (o.primaries - 1);
    return { x: bx + (r() - 0.5) * 4, y: trunkTop, a: o.arc[0] + (o.arc[1] - o.arc[0]) * t, lenK: 0.8 + r() * 0.4 };
  });
  const segs = growTree(starts, {
    seed: o.seed,
    depth: o.depth,
    len: o.len,
    lenDecay: 0.86,
    w: o.w,
    wDecay: 0.72,
    minW: 1.1,
    spread: o.spread,
    kids: [2, 2],
    wiggle: 0.35,
    upPull: 0.025,
    segs: 3,
    ellipse: { cx: bx, cy: trunkTop + 4, rx: W / 2 - 8, ry: trunkTop - 4 },
  });
  segs.unshift({ a: [bx, H - 1], b: [bx, trunkTop], w: o.w * 1.3, tip: false, depth: 99 });
  // mặt nạ lưới: dải rộng quanh mọi nhánh (lưới chỉ nằm giữa các nhánh, không tràn ra ngoài tán)
  const maskD = segs
    .filter((sg) => sg.depth !== 99)
    .map((sg) => `M${f(sg.a[0])} ${f(sg.a[1])}L${f(sg.b[0])} ${f(sg.b[1])}`)
    .join('');
  const net = `M0 4L7 0L15 6L20 4M15 6L9 11L0 4M9 11L0 14M9 11L14 17L20 14M14 17L7 20M15 6L20 14`;
  const sh = contactShadow(u, bx, H - 2, 18, 4);
  const defs =
    sh.defs +
    `<mask id="${u('mask')}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><path d="${maskD}" fill="none" stroke="#fff" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/></mask>` +
    `<pattern id="${u('net')}" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(${f(r() * 60 - 30)}) scale(0.9)"><path d="${net}" fill="none" stroke="${o.c.branch}" stroke-width="1.1" stroke-linecap="round"/></pattern>` +
    linear(u('br'), [
      [0, dark(o.c.branch, 0.35)],
      [0.4, o.c.branch],
      [1, light(o.c.branch, 0.12)],
    ], { user: true, x1: 0, y1: H, x2: 0, y2: 0 }) +
    radial(u('glow'), [
      [0, light(o.c.branch, 0.3), 0.22],
      [1, o.c.branch, 0.05],
    ], { cx: 0.5, cy: 0.35, r: 0.7 });
  const svg =
    sh.svg +
    `<g mask="${u.url('mask')}"><rect width="${W}" height="${H}" fill="${u.url('glow')}"/><rect width="${W}" height="${H}" fill="${u.url('net')}" opacity="0.65"/></g>` +
    renderTree(segs, {
      fill: u.url('br'),
      outline: ink(o.c.branch),
      outlineW: 1.1,
      outlineOp: 0.45,
      hi: light(o.c.branch, 0.5),
      hiOp: 0.45,
      polyp: o.c.polyp,
      polypOp: 0.85,
      polypGap: 4.5,
      tip: light(o.c.polyp, 0.2),
      tipScale: 1.4,
    });
  return {
    id: o.id,
    kind: 'fan',
    viewBox: [W, H],
    defs,
    svg,
    heightPx: o.heightPx,
    sway: o.sway ?? 0.22,
    weight: o.weight ?? 1,
    tiers: o.tiers ?? [1, 2],
  };
}

// ---------------------------------------------------------------------------
// BỌT BIỂN ỐNG
// ---------------------------------------------------------------------------

export function tubeSponge(o: {
  id: string;
  seed: number;
  vb: [number, number];
  heightPx: number;
  tubes: { x: number; tx: number; ty: number; rb: number; rt: number }[];
  c: { body: string; inner: string };
  weight?: number;
  tiers?: number[];
}): PropArt {
  const u = ids(o.id);
  const [W, H] = o.vb;
  const sh = contactShadow(u, W / 2, H - 2, W * 0.42, 6);
  const C = o.c.body;
  const defs =
    sh.defs +
    linear(u('body'), [
      [0, dark(C, 0.5)],
      [0.28, light(C, 0.18)],
      [0.55, C],
      [1, dark(C, 0.55)],
    ], { x2: 1, y2: 0 }) +
    linear(u('shade'), [
      [0, '#06283f', 0],
      [0.7, '#06283f', 0.05],
      [1, '#06283f', 0.35],
    ]) +
    radial(u('inner'), [
      [0, dark(o.c.inner, 0.65)],
      [0.75, dark(o.c.inner, 0.35)],
      [1, o.c.inner],
    ], { cy: 0.7 }) +
    `<pattern id="${u('pore')}" width="7" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="${dark(C, 0.4)}" fill-opacity="0.45"/><circle cx="5.5" cy="5" r="0.8" fill="${dark(C, 0.4)}" fill-opacity="0.35"/></pattern>`;
  let svg = sh.svg;
  for (const t of o.tubes) {
    const ry = t.rt * 0.34;
    const midY = (H + t.ty) / 2;
    const mx = (t.x + t.tx) / 2;
    const d =
      `M${f(t.x - t.rb)} ${H}Q${f(mx - (t.rb + t.rt) / 2 - 2)} ${f(midY)} ${f(t.tx - t.rt)} ${f(t.ty)}` +
      `A${f(t.rt)} ${f(ry)} 0 0 1 ${f(t.tx + t.rt)} ${f(t.ty)}` +
      `Q${f(mx + (t.rb + t.rt) / 2 + 2)} ${f(midY)} ${f(t.x + t.rb)} ${H}Z`;
    svg +=
      `<path d="${d}" fill="${u.url('body')}"/>` +
      `<path d="${d}" fill="${u.url('pore')}"/>` +
      `<path d="${d}" fill="${u.url('shade')}"/>` +
      `<path d="${d}" fill="none" stroke="${ink(C)}" stroke-opacity="0.5" stroke-width="1.4"/>` +
      `<ellipse cx="${f(t.tx)}" cy="${f(t.ty)}" rx="${f(t.rt * 0.8)}" ry="${f(ry * 0.72)}" fill="${u.url('inner')}"/>` +
      `<ellipse cx="${f(t.tx)}" cy="${f(t.ty)}" rx="${f(t.rt * 0.9)}" ry="${f(ry * 0.85)}" fill="none" stroke="${light(C, 0.45)}" stroke-width="${f(Math.max(1.6, t.rt * 0.16))}"/>` +
      `<path d="M${f(t.tx - t.rt * 0.95)} ${f(t.ty)}A${f(t.rt * 0.95)} ${f(ry * 0.95)} 0 0 1 ${f(t.tx + t.rt * 0.95)} ${f(t.ty)}" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="1.4"/>` +
      `<path d="M${f(t.tx - t.rt * 0.45)} ${f(t.ty + ry + 4)}Q${f(mx - (t.rb + t.rt) * 0.22)} ${f(midY)} ${f(t.x - t.rb * 0.45)} ${H - 6}" fill="none" stroke="${light(C, 0.6)}" stroke-opacity="0.3" stroke-width="${f(Math.max(1.5, t.rt * 0.22))}" stroke-linecap="round"/>`;
  }
  return { id: o.id, kind: 'sponge', viewBox: [W, H], defs, svg, heightPx: o.heightPx, sway: 0.03, weight: o.weight ?? 1, tiers: o.tiers ?? [1, 2] };
}

// ---------------------------------------------------------------------------
// RONG MƠ (Sargassum) – thân mảnh, lá thuôn xen kẽ, phao khí tròn
// ---------------------------------------------------------------------------

export function sargassum(o: {
  id: string;
  seed: number;
  vb: [number, number];
  heightPx: number;
  stems: number;
  c: { stem: string; leaf: string; tip: string; bladder: string };
  sway?: number;
  weight?: number;
  tiers?: number[];
}): PropArt {
  const u = ids(o.id);
  const r = rng(o.seed);
  const [W, H] = o.vb;
  const sh = contactShadow(u, W / 2, H - 2, W * 0.3, 5);
  const defs =
    sh.defs +
    linear(u('leaf'), [
      [0, dark(o.c.leaf, 0.4)],
      [0.55, o.c.leaf],
      [1, light(o.c.tip, 0.1)],
    ], { user: true, x1: 0, y1: H, x2: 0, y2: 0 });
  let svg = sh.svg;
  for (let s = 0; s < o.stems; s++) {
    const x0 = W / 2 + (r() - 0.5) * W * 0.3;
    const top = H * (0.04 + r() * 0.3);
    const lean = (s / Math.max(1, o.stems - 1) - 0.5) * W * 0.7 + (r() - 0.5) * W * 0.15;
    const pts: Pt[] = [];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      pts.push([x0 + lean * k * k + Math.sin(k * 6 + s) * 6 * k, H - 2 - (H - 2 - top) * k]);
    }
    const stem = smoothPath(pts);
    let leaves = '';
    let blad = '';
    let bulbs = '';
    let mids = '';
    const nl = 20 + Math.floor(r() * 6);
    for (let i = 1; i < nl; i++) {
      const k = i / nl;
      const seg = Math.min(n - 1, Math.floor(k * n));
      const lk = k * n - seg;
      const P = pts[seg];
      const Q = pts[seg + 1];
      const px = P[0] + (Q[0] - P[0]) * lk;
      const py = P[1] + (Q[1] - P[1]) * lk;
      const side = i % 2 ? 1 : -1;
      const a = -Math.PI / 2 + side * (0.7 + r() * 0.4);
      const L = (22 + r() * 14) * (1.1 - k * 0.45) * (W / 170);
      const lw = L * 0.26;
      const tx = px + Math.cos(a) * L;
      const ty = py + Math.sin(a) * L;
      const mx = (px + tx) / 2;
      const my = (py + ty) / 2;
      const nx = -Math.sin(a) * lw;
      const ny = Math.cos(a) * lw;
      leaves += `M${f(px)} ${f(py)}Q${f(mx + nx)} ${f(my + ny)} ${f(tx)} ${f(ty)}Q${f(mx - nx)} ${f(my - ny)} ${f(px)} ${f(py)}Z`;
      mids += `M${f(px)} ${f(py)}L${f(mx + (tx - mx) * 0.7)} ${f(my + (ty - my) * 0.7)}`;
      if (r() < 0.45) {
        const ba = a + side * 0.9;
        const bl = 5 + r() * 3;
        const bxp = px + Math.cos(ba) * bl;
        const byp = py + Math.sin(ba) * bl;
        blad += `M${f(px)} ${f(py)}L${f(bxp)} ${f(byp)}`;
        bulbs += `M${f(bxp)} ${f(byp)}h0.01`;
      }
    }
    svg +=
      `<path d="${stem}" fill="none" stroke="${ink(o.c.stem)}" stroke-opacity="0.5" stroke-width="3.6" stroke-linecap="round"/>` +
      `<path d="${stem}" fill="none" stroke="${o.c.stem}" stroke-width="2.2" stroke-linecap="round"/>` +
      `<path d="${blad}" fill="none" stroke="${o.c.bladder}" stroke-width="1.2"/>` +
      `<path d="${bulbs}" fill="none" stroke="${ink(o.c.bladder)}" stroke-opacity="0.5" stroke-width="6.6" stroke-linecap="round"/>` +
      `<path d="${bulbs}" fill="none" stroke="${o.c.bladder}" stroke-width="5.2" stroke-linecap="round"/>` +
      `<path d="${bulbs}" fill="none" stroke="${light(o.c.bladder, 0.6)}" stroke-opacity="0.7" stroke-width="1.8" stroke-linecap="round" transform="translate(-1 -1)"/>` +
      `<path d="${leaves}" fill="${u.url('leaf')}" stroke="${ink(o.c.leaf)}" stroke-opacity="0.45" stroke-width="0.9"/>` +
      `<path d="${mids}" fill="none" stroke="${light(o.c.leaf, 0.45)}" stroke-opacity="0.45" stroke-width="0.7"/>`;
  }
  return {
    id: o.id,
    kind: 'seaweed',
    viewBox: [W, H],
    defs,
    svg,
    heightPx: o.heightPx,
    sway: o.sway ?? 0.5,
    weight: o.weight ?? 1,
    tiers: o.tiers ?? [1],
  };
}

// ---------------------------------------------------------------------------
// CỎ BIỂN (dải lá dài)
// ---------------------------------------------------------------------------

export function seagrass(o: {
  id: string;
  seed: number;
  vb: [number, number];
  heightPx: number;
  blades: number;
  c: { base: string; mid: string; tip: string };
  bladeW?: number;
  sway?: number;
  weight?: number;
  tiers?: number[];
}): PropArt {
  const u = ids(o.id);
  const r = rng(o.seed);
  const [W, H] = o.vb;
  const bw = o.bladeW ?? 6;
  const sh = contactShadow(u, W / 2, H - 2, W * 0.32, 5);
  const defs =
    sh.defs +
    linear(u('blade'), [
      [0, dark(o.c.base, 0.3)],
      [0.5, o.c.mid],
      [1, light(o.c.tip, 0.1)],
    ], { user: true, x1: 0, y1: H, x2: 0, y2: 0 }) +
    linear(u('bladeB'), [
      [0, dark(o.c.base, 0.5)],
      [0.5, dark(o.c.mid, 0.25)],
      [1, dark(o.c.tip, 0.15)],
    ], { user: true, x1: 0, y1: H, x2: 0, y2: 0 });
  let back = '';
  let front = '';
  let epi = '';
  for (let i = 0; i < o.blades; i++) {
    const isBack = i % 3 === 0;
    const x = W / 2 + (r() - 0.5) * W * 0.4;
    const len = H * (0.55 + r() * 0.42);
    const lean = (r() - 0.5) * W * 0.65;
    const tx = x + lean;
    const ty = H - len;
    const cx = x + lean * 0.15;
    const cy = H - len * 0.6;
    const w = bw * (0.8 + r() * 0.4);
    const d = `M${f(x - w / 2)} ${H}Q${f(cx - w / 2)} ${f(cy)} ${f(tx - w * 0.25)} ${f(ty + 3)}Q${f(tx)} ${f(ty - 2)} ${f(tx + w * 0.25)} ${f(ty + 3)}Q${f(cx + w / 2)} ${f(cy)} ${f(x + w / 2)} ${H}Z`;
    const mid = `M${f(x)} ${H - 2}Q${f(cx)} ${f(cy)} ${f(tx)} ${f(ty + 5)}`;
    const blade =
      `<path d="${d}" fill="${isBack ? u.url('bladeB') : u.url('blade')}" stroke="${ink(o.c.mid)}" stroke-opacity="0.4" stroke-width="0.9"/>` +
      `<path d="${mid}" fill="none" stroke="${light(o.c.mid, 0.5)}" stroke-opacity="${isBack ? 0.15 : 0.35}" stroke-width="0.9"/>`;
    if (isBack) back += blade;
    else front += blade;
    if (r() < 0.5) {
      for (let k = 0; k < 3; k++) {
        const t = 0.75 + r() * 0.2;
        const m = 1 - t;
        const px = m * m * x + 2 * m * t * cx + t * t * tx;
        const py = m * m * H + 2 * m * t * cy + t * t * ty;
        epi += `M${f(px + (r() - 0.5) * 2)} ${f(py)}h0.01`;
      }
    }
  }
  const svg =
    sh.svg + back + front + `<path d="${epi}" fill="none" stroke="#b39a62" stroke-opacity="0.6" stroke-width="2.2" stroke-linecap="round"/>`;
  return {
    id: o.id,
    kind: 'seagrass',
    viewBox: [W, H],
    defs,
    svg,
    heightPx: o.heightPx,
    sway: o.sway ?? 0.6,
    weight: o.weight ?? 1,
    tiers: o.tiers ?? [1],
  };
}

// ---------------------------------------------------------------------------
// RONG ĐỎ dạng bụi (Gracilaria) – nhánh tròn mảnh phân nhiều
// ---------------------------------------------------------------------------

export function redAlgae(o: {
  id: string;
  seed: number;
  vb: [number, number];
  heightPx: number;
  c: { base: string; tip: string };
  sway?: number;
  weight?: number;
  tiers?: number[];
}): PropArt {
  const u = ids(o.id);
  const [W, H] = o.vb;
  const r = rng(o.seed + 5);
  const starts = Array.from({ length: 5 }, (_, i) => ({ x: W / 2 + (i - 2) * 5, y: H - 2, a: -Math.PI / 2 + (i - 2) * 0.32 + (r() - 0.5) * 0.2 }));
  const segs = growTree(starts, {
    seed: o.seed,
    depth: 4,
    len: H * 0.3,
    lenDecay: 0.74,
    w: 4.2,
    wDecay: 0.78,
    minW: 1.4,
    spread: 0.5,
    kids: [2, 3],
    wiggle: 0.45,
    upPull: 0.04,
    segs: 3,
    ellipse: { cx: W / 2, cy: H * 0.62, rx: W / 2 - 6, ry: H * 0.6 },
    stopP: 0.1,
  });
  const sh = contactShadow(u, W / 2, H - 2, W * 0.25, 4);
  const defs =
    sh.defs +
    linear(u('br'), [
      [0, dark(o.c.base, 0.35)],
      [0.5, o.c.base],
      [1, o.c.tip],
    ], { user: true, x1: 0, y1: H, x2: 0, y2: 0 });
  const svg =
    sh.svg +
    renderTree(segs, {
      fill: u.url('br'),
      outline: ink(o.c.base),
      outlineW: 1.2,
      outlineOp: 0.5,
      hi: light(o.c.tip, 0.4),
      hiOp: 0.4,
      tip: light(o.c.tip, 0.25),
      tipScale: 1.1,
    });
  return {
    id: o.id,
    kind: 'seaweed',
    viewBox: [W, H],
    defs,
    svg,
    heightPx: o.heightPx,
    sway: o.sway ?? 0.42,
    weight: o.weight ?? 1,
    tiers: o.tiers ?? [1, 2],
  };
}
