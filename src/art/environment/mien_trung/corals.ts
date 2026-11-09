/**
 * San hô cứng & mềm vùng miền Trung: san hô bàn, sừng hươu, súp lơ, não, nấm, san hô da.
 */
import type { PropArt } from '../contract-env';
import { linear, radial, rng, rimGradient, smoothPath } from '../../style-bible';
import { contactShadow, dark, f, growTree, ids, ink, light, renderTree } from './common';
import type { Pt, TreeOpts } from './common';

// ---------------------------------------------------------------------------
// SAN HÔ BÀN (Acropora dạng bàn): thân trụ, mặt bàn phẳng phủ ngón nhánh nhỏ dựng đứng
// ---------------------------------------------------------------------------

interface Plate {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  thick: number;
  fingerH: number;
  /** chân thân trên đáy */
  trunkX: number;
  trunkW: number;
}
interface TableColors {
  finger: string;
  tip: string;
  top: string;
  under: string;
  trunk: string;
}

export function tableCoral(o: {
  id: string;
  seed: number;
  vb: [number, number];
  heightPx: number;
  plates: Plate[];
  c: TableColors;
  fingerW?: number;
  spacing?: number;
  tiers?: number[];
  weight?: number;
  shade?: number;
}): PropArt {
  const u = ids(o.id);
  const r = rng(o.seed);
  const [W, H] = o.vb;
  const c = o.c;
  const fw = o.fingerW ?? 4;
  const sp = o.spacing ?? 9;
  const olc = ink(c.under);
  const sh = contactShadow(u, W / 2, H - 2, W * 0.32, 7);
  const defs =
    sh.defs +
    linear(u('trunk'), [
      [0, dark(c.trunk, 0.5)],
      [0.32, light(c.trunk, 0.12)],
      [0.62, c.trunk],
      [1, dark(c.trunk, 0.6)],
    ], { x2: 1, y2: 0 }) +
    linear(u('under'), [
      [0, dark(c.under, 0.05)],
      [1, dark(c.under, 0.55)],
    ]) +
    radial(u('top'), [
      [0, light(c.top, 0.3)],
      [0.7, c.top],
      [1, dark(c.top, 0.25)],
    ], { cx: 0.42, cy: 0.35, r: 0.7 });

  let svg = sh.svg;
  o.plates.forEach((p) => {
    // --- thân trụ (loe ra dưới mặt bàn) ---
    const top = p.cy + p.ry * 0.5;
    const bot = H;
    const bx = p.trunkX;
    const tw = p.trunkW;
    const mx = (bx + p.cx) / 2;
    const midY = (top + bot) / 2;
    svg +=
      `<path d="M${f(bx - tw * 1.6)} ${bot}C${f(bx - tw * 0.8)} ${bot - 8} ${f(mx - tw * 0.6)} ${f(midY + 10)} ${f(mx - tw * 0.55)} ${f(midY)}` +
      `C${f(p.cx - tw * 0.55)} ${f(top + 22)} ${f(p.cx - tw * 1.6)} ${f(top + 4)} ${f(p.cx - tw * 3)} ${f(top)}L${f(p.cx + tw * 3)} ${f(top)}` +
      `C${f(p.cx + tw * 1.6)} ${f(top + 4)} ${f(p.cx + tw * 0.55)} ${f(top + 22)} ${f(mx + tw * 0.55)} ${f(midY)}` +
      `C${f(mx + tw * 0.6)} ${f(midY + 10)} ${f(bx + tw * 0.8)} ${bot - 8} ${f(bx + tw * 1.6)} ${bot}Z" fill="${u.url('trunk')}" stroke="${olc}" stroke-opacity="0.5" stroke-width="1.4"/>`;
    // --- mặt dưới bàn ---
    const und = `M${f(p.cx - p.rx)} ${f(p.cy)}A${f(p.rx)} ${f(p.ry + p.thick)} 0 0 0 ${f(p.cx + p.rx)} ${f(p.cy)}Z`;
    svg += `<path d="${und}" fill="${u.url('under')}"/>`;
    // khung nhánh tỏa dưới mặt bàn
    let lat = '';
    const hub: Pt = [p.cx, p.cy + p.ry * 0.55];
    for (let k = 0; k <= 22; k++) {
      const t = Math.PI * (0.04 + (0.92 * k) / 22);
      const ex = p.cx + p.rx * 0.94 * Math.cos(t);
      const ey = p.cy + (p.ry + p.thick) * 0.9 * Math.sin(t);
      lat += `M${f(hub[0])} ${f(hub[1])}Q${f((hub[0] + ex) / 2)} ${f(Math.max(hub[1], ey) + 2)} ${f(ex)} ${f(ey)}`;
    }
    svg += `<path d="${lat}" fill="none" stroke="${light(c.under, 0.25)}" stroke-opacity="0.35" stroke-width="1.6"/>`;
    svg += `<path d="M${f(p.cx - p.rx)} ${f(p.cy)}A${f(p.rx)} ${f(p.ry + p.thick)} 0 0 0 ${f(p.cx + p.rx)} ${f(p.cy)}" fill="none" stroke="${olc}" stroke-opacity="0.55" stroke-width="1.6"/>`;
    // --- mặt trên ---
    svg += `<ellipse cx="${f(p.cx)}" cy="${f(p.cy)}" rx="${f(p.rx)}" ry="${f(p.ry)}" fill="${u.url('top')}"/>`;
    svg += `<path d="M${f(p.cx - p.rx)} ${f(p.cy)}A${f(p.rx)} ${f(p.ry)} 0 0 0 ${f(p.cx + p.rx)} ${f(p.cy)}" fill="none" stroke="${light(c.top, 0.45)}" stroke-width="2.4" stroke-opacity="0.8"/>`;
    // --- ngón nhánh dựng đứng: 3 dải sau → trước ---
    const bands: { seg: string; hi: string; tip: string }[] = [0, 1, 2].map(() => ({ seg: '', hi: '', tip: '' }));
    const dv = (sp * 0.5) / p.ry;
    for (let v = -0.94; v <= 0.99; v += dv) {
      const hw = p.rx * Math.sqrt(Math.max(0, 1 - v * v)) * 0.97;
      const y = p.cy + v * p.ry;
      const band = v < -0.3 ? 0 : v < 0.4 ? 1 : 2;
      for (let x = p.cx - hw + r() * sp * 0.6; x <= p.cx + hw; x += sp * (0.75 + r() * 0.5)) {
        const h = p.fingerH * (0.5 + r() * 0.5) * (0.8 + 0.2 * ((v + 1) / 2));
        const lean = ((x - p.cx) / p.rx) * h * 0.5;
        const by = y + r() * 1.5;
        const tx = x + lean;
        const ty = by - h;
        const B = bands[band];
        B.seg += `M${f(x)} ${f(by)}L${f(tx)} ${f(ty)}`;
        B.hi += `M${f((x + tx) / 2)} ${f((by + ty) / 2)}L${f(tx)} ${f(ty)}`;
        B.tip += `M${f(tx)} ${f(ty)}h0.01`;
      }
    }
    const shadeK = [0.12, 0.04, 0];
    bands.forEach((B, bi) => {
      const fc = bi === 0 ? dark(c.finger, shadeK[0]) : c.finger;
      svg +=
        `<g fill="none" stroke-linecap="round">` +
        `<path d="${B.seg}" stroke="${olc}" stroke-opacity="0.55" stroke-width="${f(fw + 1.5)}"/>` +
        `<path d="${B.seg}" stroke="${fc}" stroke-width="${f(fw)}"/>` +
        `<path d="${B.hi}" stroke="${light(c.finger, 0.4)}" stroke-opacity="0.55" stroke-width="${f(fw * 0.4)}" transform="translate(${f(-fw * 0.18)} 0)"/>` +
        `<path d="${B.tip}" stroke="${c.tip}" stroke-width="${f(fw * 0.95)}"/>` +
        `</g>`;
    });
  });
  return {
    id: o.id,
    kind: 'coral',
    viewBox: o.vb,
    defs,
    svg,
    heightPx: o.heightPx,
    sway: 0.02,
    weight: o.weight ?? 1,
    tiers: o.tiers ?? [1, 2],
  };
}

// ---------------------------------------------------------------------------
// SAN HÔ SỪNG HƯƠU / SÚP LƠ (nhánh)
// ---------------------------------------------------------------------------

export function branchCoral(o: {
  id: string;
  seed: number;
  vb: [number, number];
  heightPx: number;
  roots: { x: number; a: number; lenK?: number; wK?: number }[];
  tree: Omit<TreeOpts, 'seed'>;
  c: { base: string; mid: string; tip: string };
  polypGap?: number;
  sway?: number;
  tiers?: number[];
  weight?: number;
  kind?: 'coral';
}): PropArt {
  const u = ids(o.id);
  const [W, H] = o.vb;
  const segs = growTree(
    o.roots.map((s) => ({ x: s.x, y: H - 2, a: s.a, lenK: s.lenK, wK: s.wK })),
    { seed: o.seed, ...o.tree, ellipse: { cx: W / 2, cy: H, rx: W / 2 - 6, ry: H - 8 } },
  );
  const sh = contactShadow(u, W / 2, H - 2, W * 0.36, 7);
  const defs =
    sh.defs +
    linear(u('br'), [
      [0, dark(o.c.base, 0.35)],
      [0.45, o.c.mid],
      [1, light(o.c.tip, 0.1)],
    ], { user: true, x1: 0, y1: H, x2: 0, y2: 0 });
  const svg =
    sh.svg +
    renderTree(segs, {
      fill: u.url('br'),
      outline: ink(o.c.mid),
      outlineW: 1.5,
      outlineOp: 0.55,
      hi: light(o.c.mid, 0.55),
      hiOp: 0.5,
      polyp: light(o.c.mid, 0.45),
      polypOp: 0.5,
      polypGap: o.polypGap,
      tip: o.c.tip,
      tipScale: 1.0,
    });
  return {
    id: o.id,
    kind: 'coral',
    viewBox: o.vb,
    defs,
    svg,
    heightPx: o.heightPx,
    sway: o.sway ?? 0.03,
    weight: o.weight ?? 1,
    tiers: o.tiers ?? [1, 2],
  };
}

// ---------------------------------------------------------------------------
// SAN HÔ NÃO (khối vòm, rãnh uốn khúc)
// ---------------------------------------------------------------------------

export function brainCoral(o: {
  id: string;
  seed: number;
  vb: [number, number];
  heightPx: number;
  c: { ridge: string; valley: string; septa: string };
  rows: number;
  wav?: number;
  tiers?: number[];
  weight?: number;
}): PropArt {
  const u = ids(o.id);
  const r = rng(o.seed);
  const [W, H] = o.vb;
  const cx = W / 2;
  const Rx = W / 2 - 4;
  const Ry = H - 6;
  const base = H - 1;
  const dome =
    `M${f(cx - Rx)} ${base}C${f(cx - Rx * 1.02)} ${f(base - Ry * 0.72)} ${f(cx - Rx * 0.62)} ${f(base - Ry)} ${f(cx)} ${f(base - Ry)}` +
    `C${f(cx + Rx * 0.62)} ${f(base - Ry)} ${f(cx + Rx * 1.02)} ${f(base - Ry * 0.72)} ${f(cx + Rx)} ${base}Z`;
  // rãnh uốn khúc theo vĩ tuyến (dồn dày lên đỉnh – phối cảnh vòm)
  let val = '';
  const wav = o.wav ?? 1;
  for (let k = 0; k < o.rows; k++) {
    const phi = ((k + 0.5) / o.rows) * (Math.PI / 2) * 0.97;
    const hw = Rx * Math.cos(phi) * 1.02;
    const yl = base - Ry * Math.sin(phi);
    const bow = Ry * 0.16 * Math.cos(phi);
    const gap = (Ry / o.rows) * 0.9;
    const ph = r() * 6.28;
    const fr = (0.035 + r() * 0.03) * wav;
    let pts: Pt[] = [];
    const flush = () => {
      if (pts.length > 2) val += smoothPath(pts);
      pts = [];
    };
    for (let x = cx - hw; x <= cx + hw; x += 5) {
      const t = (x - cx) / Math.max(1, hw);
      const y = yl + bow * (1 - t * t) + (Math.sin(x * fr + ph) * 0.6 + Math.sin(x * fr * 2.3 + ph * 1.7) * 0.25) * gap * Math.cos(phi * 0.6);
      pts.push([x, y]);
      if (pts.length > 5 && r() < 0.11) {
        flush();
        x += 4 + r() * 6;
      }
    }
    flush();
  }
  const sh = contactShadow(u, cx, H - 2, Rx * 1.05, 6);
  const defs =
    sh.defs +
    `<clipPath id="${u('clip')}"><path d="${dome}"/></clipPath>` +
    radial(u('fill'), [
      [0, light(o.c.ridge, 0.35)],
      [0.55, o.c.ridge],
      [1, dark(o.c.ridge, 0.4)],
    ], { cx: 0.42, cy: 0.12, r: 0.95 }) +
    radial(u('vol'), [
      [0, '#000', 0],
      [0.6, '#000', 0],
      [1, '#06283f', 0.35],
    ], { cx: 0.45, cy: 0.3, r: 0.75 }) +
    rimGradient(u('rim'), '#ffffff', 0.8);
  const vw = Math.max(2.4, (Ry / o.rows) * 0.38);
  const svg =
    sh.svg +
    `<path d="${dome}" fill="${u.url('fill')}"/>` +
    `<g clip-path="${u.url('clip')}" fill="none" stroke-linecap="round">` +
    `<path d="${val}" stroke="${light(o.c.ridge, 0.4)}" stroke-opacity="0.45" stroke-width="${f(vw * 0.5)}" transform="translate(0 ${f(-vw * 0.75)})"/>` +
    `<path d="${val}" stroke="${o.c.valley}" stroke-width="${f(vw)}"/>` +
    `<path d="${val}" stroke="${o.c.septa}" stroke-opacity="0.3" stroke-width="${f(vw * 0.7)}" stroke-dasharray="0.7 1.6" stroke-linecap="butt"/>` +
    `</g>` +
    `<path d="${dome}" fill="${u.url('vol')}"/>` +
    `<path d="${dome}" fill="none" stroke="${ink(o.c.valley)}" stroke-opacity="0.55" stroke-width="1.6"/>` +
    `<path d="${dome}" fill="none" stroke="${u.url('rim')}" stroke-width="2.4"/>`;
  return {
    id: o.id,
    kind: 'coral',
    viewBox: o.vb,
    defs,
    svg,
    heightPx: o.heightPx,
    sway: 0,
    weight: o.weight ?? 1,
    tiers: o.tiers ?? [1, 2],
  };
}

// ---------------------------------------------------------------------------
// SAN HÔ NẤM (Fungia – đĩa nằm trên cát, vách ngăn tỏa tròn)
// ---------------------------------------------------------------------------

export function mushroomCoral(o: {
  id: string;
  seed: number;
  heightPx: number;
  c: { center: string; mid: string; rim: string };
  weight?: number;
}): PropArt {
  const u = ids(o.id);
  const r = rng(o.seed);
  const W = 150;
  const H = 46;
  const cx = 75;
  const cy = 24;
  const rx = 68;
  const ry = 15;
  const th = 7;
  let sa = '';
  let sb = '';
  const N = 64;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2 + r() * 0.03;
    const inner = 0.12 + (i % 2) * 0.18;
    const x1 = cx + Math.cos(t) * rx * inner;
    const y1 = cy + Math.sin(t) * ry * inner;
    const x2 = cx + Math.cos(t) * rx * 0.97;
    const y2 = cy + Math.sin(t) * ry * 0.97;
    const d = `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`;
    if (i % 2) sb += d;
    else sa += d;
  }
  // xúc tu nhỏ thò ra ở mép
  let tent = '';
  for (let i = 0; i < 26; i++) {
    const t = Math.PI * (0.02 + (0.96 * i) / 25);
    const x = cx + Math.cos(t + Math.PI) * rx * (0.55 + r() * 0.4);
    const y = cy + Math.sin(t + Math.PI) * ry * (0.55 + r() * 0.4);
    tent += `M${f(x)} ${f(y)}l${f((r() - 0.5) * 2)} ${f(-2 - r() * 2.5)}`;
  }
  const sh = contactShadow(u, cx, H - 3, rx * 1.02, 5, 0.38);
  const defs =
    sh.defs +
    radial(u('top'), [
      [0, light(o.c.center, 0.3)],
      [0.25, o.c.center],
      [0.7, o.c.mid],
      [1, o.c.rim],
    ]) +
    linear(u('side'), [
      [0, dark(o.c.rim, 0.15)],
      [1, dark(o.c.mid, 0.6)],
    ]);
  const svg =
    sh.svg +
    `<path d="M${cx - rx} ${cy}A${rx} ${ry + th} 0 0 0 ${cx + rx} ${cy}Z" fill="${u.url('side')}" stroke="${ink(o.c.mid)}" stroke-opacity="0.5" stroke-width="1.2"/>` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${u.url('top')}"/>` +
    `<g fill="none" stroke-linecap="round">` +
    `<path d="${sa}" stroke="${dark(o.c.mid, 0.45)}" stroke-opacity="0.55" stroke-width="1.5"/>` +
    `<path d="${sb}" stroke="${light(o.c.mid, 0.55)}" stroke-opacity="0.7" stroke-width="1.1"/>` +
    `<path d="${tent}" stroke="${light(o.c.rim, 0.4)}" stroke-opacity="0.75" stroke-width="1.6"/>` +
    `</g>` +
    `<ellipse cx="${cx}" cy="${cy}" rx="9" ry="2.2" fill="${dark(o.c.center, 0.6)}"/>` +
    `<path d="M${cx - 9} ${cy - 1}Q${cx} ${cy - 3.4} ${cx + 9} ${cy - 1}" fill="none" stroke="${light(o.c.center, 0.6)}" stroke-width="1" opacity="0.8"/>` +
    `<path d="M${cx - rx} ${cy}A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1.3"/>`;
  return { id: o.id, kind: 'coral', viewBox: [W, H], defs, svg, heightPx: o.heightPx, sway: 0, weight: o.weight ?? 1, tiers: [1] };
}

// ---------------------------------------------------------------------------
// SAN HÔ DA dạng nấm (Sarcophyton – san hô mềm, mũ diềm gợn sóng, polyp lông tơ)
// ---------------------------------------------------------------------------

export function leatherCoral(o: {
  id: string;
  seed: number;
  heightPx: number;
  c: { stalk: string; cap: string; polyp: string };
  weight?: number;
  tiers?: number[];
}): PropArt {
  const u = ids(o.id);
  const r = rng(o.seed);
  const W = 200;
  const H = 170;
  const cx = 100;
  const capY = 66;
  // mũ: viền gợn sóng quanh elip
  const capPts: Pt[] = [];
  for (let i = 0; i < 36; i++) {
    const t = (i / 36) * Math.PI * 2;
    const k = 1 + 0.07 * Math.sin(t * 7 + 0.6) + 0.03 * Math.sin(t * 13);
    capPts.push([cx + Math.cos(t) * 90 * k, capY + Math.sin(t) * 26 * k - (Math.sin(t * 5) * 4)]);
  }
  const cap = smoothPath(capPts, true);
  const capUnder = smoothPath(
    capPts.map(([x, y]) => [x, y + 12 + Math.max(0, y - capY) * 0.2] as Pt),
    true,
  );
  const stalk =
    `M${cx - 52} ${H}C${cx - 38} ${H - 18} ${cx - 34} ${H - 50} ${cx - 30} ${capY + 42}C${cx - 28} ${capY + 24} ${cx - 50} ${capY + 18} ${cx - 62} ${capY + 10}` +
    `L${cx + 62} ${capY + 10}C${cx + 50} ${capY + 18} ${cx + 28} ${capY + 24} ${cx + 30} ${capY + 42}C${cx + 34} ${H - 50} ${cx + 38} ${H - 18} ${cx + 52} ${H}Z`;
  // polyp lông tơ trên mặt mũ
  let fuzz = '';
  let dots = '';
  for (let i = 0; i < 190; i++) {
    const t = r() * Math.PI * 2;
    const rr = Math.sqrt(r()) * 0.93;
    const x = cx + Math.cos(t) * 88 * rr;
    const y = capY + Math.sin(t) * 24 * rr;
    const len = 2.5 + r() * 3.5;
    fuzz += `M${f(x)} ${f(y)}l${f((x - cx) * 0.02 + (r() - 0.5) * 1.5)} ${f(-len)}`;
    if (i % 3 === 0) dots += `M${f(x)} ${f(y - len)}h0.01`;
  }
  const sh = contactShadow(u, cx, H - 3, 70, 7);
  const defs =
    sh.defs +
    linear(u('stalk'), [
      [0, dark(o.c.stalk, 0.4)],
      [0.35, light(o.c.stalk, 0.2)],
      [0.65, o.c.stalk],
      [1, dark(o.c.stalk, 0.5)],
    ], { x2: 1, y2: 0 }) +
    radial(u('cap'), [
      [0, light(o.c.cap, 0.3)],
      [0.7, o.c.cap],
      [1, dark(o.c.cap, 0.2)],
    ], { cx: 0.45, cy: 0.4, r: 0.65 }) +
    linear(u('under'), [
      [0, dark(o.c.cap, 0.25)],
      [1, dark(o.c.cap, 0.55)],
    ]) +
    // nếp gấp thẳng đứng trên thân
    linear(u('fold'), [
      [0, '#000', 0],
      [1, '#06283f', 0.25],
    ]);
  let folds = '';
  for (let i = 0; i < 6; i++) {
    const x = cx - 22 + i * 9 + (r() - 0.5) * 3;
    folds += `M${f(x)} ${capY + 30}Q${f(x + (x - cx) * 0.25)} ${f(capY + 70)} ${f(x + (x - cx) * 0.6)} ${H - 4}`;
  }
  const svg =
    sh.svg +
    `<path d="${stalk}" fill="${u.url('stalk')}" stroke="${ink(o.c.stalk)}" stroke-opacity="0.45" stroke-width="1.4"/>` +
    `<path d="${folds}" fill="none" stroke="${dark(o.c.stalk, 0.3)}" stroke-opacity="0.4" stroke-width="1.6"/>` +
    `<path d="${capUnder}" fill="${u.url('under')}" stroke="${ink(o.c.cap)}" stroke-opacity="0.5" stroke-width="1.4"/>` +
    `<path d="${cap}" fill="${u.url('cap')}" stroke="${ink(o.c.cap)}" stroke-opacity="0.45" stroke-width="1.3"/>` +
    `<g fill="none" stroke-linecap="round">` +
    `<path d="${fuzz}" stroke="${o.c.polyp}" stroke-opacity="0.75" stroke-width="1.3"/>` +
    `<path d="${dots}" stroke="${light(o.c.polyp, 0.5)}" stroke-width="2.4"/>` +
    `</g>`;
  return { id: o.id, kind: 'coral', viewBox: [W, H], defs, svg, heightPx: o.heightPx, sway: 0.12, weight: o.weight ?? 1, tiers: o.tiers ?? [1, 2] };
}
