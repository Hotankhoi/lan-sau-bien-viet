/**
 * Môi trường Vịnh Bắc Bộ: chân núi đá vôi (karst) Hạ Long nhô xuống nước, vòm hang,
 * đáy bùn cát có ụ sá sùng, rong mơ nâu, hàu bám đá. Không khí huyền ảo, hơi sương.
 * Mọi hình vẽ bằng SVG trong code.
 */
import type { BackdropArt, PropArt, RegionEnvironmentArt } from '../contract-env';
import { linear, makeIds, mix, rng, shade, smoothPath, blurFilter, type Ids } from '../../style-bible';

type Pt = [number, number];
const f = (n: number) => (Math.round(n * 10) / 10).toString();
const ids = (id: string): Ids => makeIds('bb_' + id);
const W_SHALLOW = '#3E8E7E';
const W_DEEP = '#1F4E4A';
const STONE = '#8f9c90';
const STONE_WARM = '#a39f88';

/** Một "ngón" đá vôi: cột thuôn, đỉnh lởm chởm. Trả về các điểm đường bao (đáy tại y = H). */
function finger(r: () => number, x: number, w: number, top: number, H: number): Pt[] {
  const pts: Pt[] = [[x - w * 0.5, H]];
  const steps = 5;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const y = H - (H - top) * t * (0.86 + r() * 0.1);
    pts.push([x - w * (0.5 - 0.28 * t) + (r() - 0.5) * w * 0.12, y]);
  }
  // đỉnh răng cưa
  const peaks = 2 + Math.floor(r() * 3);
  for (let i = 0; i < peaks; i++) {
    const px = x - w * 0.2 + (i / Math.max(1, peaks - 1)) * w * 0.4 + (r() - 0.5) * w * 0.06;
    pts.push([px - w * 0.04, top + 14 + r() * 22], [px, top + r() * 16], [px + w * 0.05, top + 16 + r() * 24]);
  }
  for (let i = steps; i >= 1; i--) {
    const t = i / steps;
    const y = H - (H - top) * t * (0.84 + r() * 0.1);
    pts.push([x + w * (0.5 - 0.3 * t) + (r() - 0.5) * w * 0.12, y]);
  }
  pts.push([x + w * 0.5, H]);
  return pts;
}

const poly = (pts: Pt[]) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';

/** Cụm đá vôi gồm nhiều ngón chồng nhau, có rãnh dọc, mảng rêu tảo, hàu bám chân. */
function karst(id: string, seed: number, W: number, H: number, heightPx: number, o: { fingers: number; kind?: PropArt['kind']; weight?: number; tiers?: number[]; warm?: boolean } = { fingers: 3 }): PropArt {
  const r = rng(seed);
  const u = ids(id);
  const base = o.warm ? STONE_WARM : STONE;
  let defs =
    linear(u('g'), [
      [0, shade(base, 0.32)],
      [0.45, base],
      [1, shade(mix(base, W_DEEP, 0.35), -0.35)],
    ], { x1: 0.2, y1: 0, x2: 0.8, y2: 1 }) +
    linear(u('algae'), [
      [0, '#6f9a5a', 0],
      [0.5, '#5d8a55', 0.55],
      [1, '#3d6a4a', 0.75],
    ], { x1: 0, y1: 0, x2: 0, y2: 1 });
  let svg = `<ellipse cx="${W / 2}" cy="${H - 4}" rx="${W * 0.46}" ry="10" fill="#0c2a26" opacity="0.3"/>`;
  const n = o.fingers;
  const order = Array.from({ length: n }, (_, i) => i).sort(() => r() - 0.5);
  for (const i of order) {
    const x = W * (0.2 + (0.6 * (i + 0.5)) / n) + (r() - 0.5) * W * 0.06;
    const w = (W * 0.62) / Math.sqrt(n) * (0.75 + r() * 0.4);
    const top = H * (0.04 + r() * 0.34) + (Math.abs(i - (n - 1) / 2) / n) * H * 0.3;
    const pts = finger(r, x, w, top, H);
    const cid = u(`c${i}`);
    defs += `<clipPath id="${cid}"><path d="${poly(pts)}"/></clipPath>`;
    let inner = '';
    // rãnh dọc do nước mưa bào mòn (lapies)
    for (let k = 0; k < 7; k++) {
      const fx = x - w * 0.4 + r() * w * 0.8;
      const fy = top + r() * (H - top) * 0.5;
      const len = 40 + r() * (H - top) * 0.5;
      inner += `<path d="M${f(fx)} ${f(fy)}q${f((r() - 0.5) * 8)} ${f(len * 0.5)} ${f((r() - 0.5) * 6)} ${f(len)}" stroke="${shade(base, -0.42)}" stroke-opacity="${f(0.18 + r() * 0.2)}" stroke-width="${f(1.5 + r() * 2.5)}" fill="none" stroke-linecap="round"/>`;
    }
    // hốc nhỏ
    for (let k = 0; k < 4; k++) inner += `<ellipse cx="${f(x - w * 0.3 + r() * w * 0.6)}" cy="${f(top + 30 + r() * (H - top - 60))}" rx="${f(3 + r() * 6)}" ry="${f(2 + r() * 4)}" fill="#10231f" opacity="${f(0.25 + r() * 0.25)}"/>`;
    // mảng sáng phía trên-trái, bóng phía phải
    inner += `<path d="M${f(x - w * 0.5)} ${H}L${f(x - w * 0.24)} ${f(top)}L${f(x - w * 0.02)} ${f(top)}L${f(x - w * 0.22)} ${H}Z" fill="#f1f5e6" opacity="0.13"/>`;
    inner += `<path d="M${f(x + w * 0.5)} ${H}L${f(x + w * 0.2)} ${f(top)}L${f(x + w * 0.02)} ${f(top + 30)}L${f(x + w * 0.24)} ${H}Z" fill="#0c2a26" opacity="0.2"/>`;
    // rêu tảo phủ nửa dưới
    inner += `<rect x="${f(x - w)}" y="${f(H * 0.55)}" width="${f(w * 2)}" height="${f(H * 0.45)}" fill="${u.url('algae')}"/>`;
    for (let k = 0; k < 6; k++) inner += `<ellipse cx="${f(x - w * 0.4 + r() * w * 0.8)}" cy="${f(H * 0.5 + r() * H * 0.45)}" rx="${f(8 + r() * 16)}" ry="${f(5 + r() * 9)}" fill="${['#6f9a5a', '#8aa35c', '#7a5a7a', '#b0806a'][k % 4]}" opacity="${f(0.22 + r() * 0.2)}"/>`;
    svg +=
      `<path d="${poly(pts)}" fill="${u.url('g')}" stroke="${shade(base, -0.55)}" stroke-opacity="0.55" stroke-width="2" stroke-linejoin="round"/>` +
      `<g clip-path="url(#${cid})">${inner}</g>` +
      `<path d="M${pts.slice(0, 7).map(([px, py]) => `${f(px)} ${f(py)}`).join('L')}" fill="none" stroke="#f4fbe9" stroke-opacity="0.4" stroke-width="2" stroke-linejoin="round"/>`;
  }
  // hàu, hà bám chân đá
  for (let k = 0; k < 16; k++) {
    const bx = W * 0.14 + r() * W * 0.72;
    const by = H - 6 - r() * H * 0.16;
    const s = 3 + r() * 4;
    svg += `<path d="M${f(bx - s)} ${f(by + s * 0.6)}Q${f(bx)} ${f(by - s)} ${f(bx + s)} ${f(by + s * 0.6)}Z" fill="${['#d9d6c2', '#bdb8a2', '#e6e0cc'][k % 3]}" stroke="#5a5a4a" stroke-width="0.6" opacity="0.9"/>`;
  }
  return { id, kind: o.kind ?? 'rock', viewBox: [W, H], defs, svg, heightPx, weight: o.weight ?? 1, tiers: o.tiers };
}

/** Vòm hang đá vôi (bơi chui qua được – không chặn đường). */
function arch(id: string, seed: number, heightPx: number): PropArt {
  const r = rng(seed);
  const u = ids(id);
  const W = 420;
  const H = 300;
  const outer: Pt[] = [[10, H], [26, 210], [40, 120], [78, 60], [130, 26], [200, 12], [270, 22], [330, 52], [374, 110], [396, 200], [410, H]];
  const hole = `M110 ${H}C104 210 130 130 205 124C282 130 312 214 306 ${H}Z`;
  const defs =
    linear(u('g'), [
      [0, shade(STONE, 0.3)],
      [0.5, STONE],
      [1, shade(mix(STONE, W_DEEP, 0.4), -0.35)],
    ], { x1: 0.2, y1: 0, x2: 0.8, y2: 1 }) +
    `<mask id="${u('m')}"><rect width="${W}" height="${H}" fill="#fff"/><path d="${hole}" fill="#000"/></mask>`;
  let inner = '';
  for (let k = 0; k < 16; k++) {
    const fx = 30 + r() * 360;
    const fy = 20 + r() * 120;
    inner += `<path d="M${f(fx)} ${f(fy)}q${f((r() - 0.5) * 10)} ${f(40 + r() * 50)} ${f((r() - 0.5) * 8)} ${f(80 + r() * 90)}" stroke="${shade(STONE, -0.42)}" stroke-opacity="${f(0.16 + r() * 0.2)}" stroke-width="${f(1.5 + r() * 3)}" fill="none" stroke-linecap="round"/>`;
  }
  for (let k = 0; k < 10; k++) inner += `<ellipse cx="${f(30 + r() * 360)}" cy="${f(170 + r() * 120)}" rx="${f(10 + r() * 20)}" ry="${f(6 + r() * 10)}" fill="${['#6f9a5a', '#8aa35c', '#7a5a7a'][k % 3]}" opacity="${f(0.22 + r() * 0.2)}"/>`;
  // nhũ đá nhỏ trên vòm
  let stal = '';
  for (let k = 0; k < 7; k++) {
    const sx = 135 + k * 24 + r() * 8;
    const sy = 128 + Math.abs(k - 3) * 9;
    stal += `<path d="M${f(sx - 5)} ${f(sy - 4)}L${f(sx)} ${f(sy + 14 + r() * 16)}L${f(sx + 5)} ${f(sy - 4)}Z" fill="${shade(STONE, -0.25)}"/>`;
  }
  const svg =
    `<ellipse cx="${W / 2}" cy="${H - 4}" rx="${W * 0.47}" ry="10" fill="#0c2a26" opacity="0.3"/>` +
    `<g mask="${u.url('m')}"><path d="${smoothPath(outer, true, 0.45)}" fill="${u.url('g')}" stroke="${shade(STONE, -0.55)}" stroke-opacity="0.55" stroke-width="2"/>${inner}` +
    `<path d="M26 210L40 120L78 60L130 26L200 12" fill="none" stroke="#f4fbe9" stroke-opacity="0.45" stroke-width="2.5"/></g>` +
    `<path d="${hole}" fill="none" stroke="#0c2a26" stroke-opacity="0.55" stroke-width="5"/>` +
    stal;
  return { id, kind: 'karst', viewBox: [W, H], defs, svg, heightPx, weight: 0.35 };
}

/** Rong mơ nâu (Sargassum) – dải dài có phao khí nhỏ. */
function kelp(id: string, seed: number, heightPx: number, color: string, blades: number): PropArt {
  const r = rng(seed);
  const W = 140;
  const H = 300;
  let svg = '';
  for (let b = 0; b < blades; b++) {
    const x0 = 40 + r() * 60;
    const lean = (r() - 0.5) * 60;
    const top = 10 + r() * 90;
    const col = mix(color, '#c9b56a', r() * 0.3);
    const midX = x0 + lean * 0.4 + (r() - 0.5) * 20;
    const midY = (H + top) / 2;
    svg += `<path d="M${f(x0)} ${H}Q${f(midX)} ${f(midY)} ${f(x0 + lean)} ${f(top)}" stroke="${shade(col, -0.25)}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    const leaves = 9;
    for (let k = 1; k <= leaves; k++) {
      const t = k / (leaves + 1);
      const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * midX + t * t * (x0 + lean);
      const py = (1 - t) * (1 - t) * H + 2 * (1 - t) * t * midY + t * t * top;
      const side = k % 2 ? 1 : -1;
      const L = 16 + r() * 14;
      svg += `<path d="M${f(px)} ${f(py)}q${f(side * L * 0.5)} ${f(-L * 0.55)} ${f(side * L)} ${f(-L * 0.25)}q${f(-side * L * 0.4)} ${f(L * 0.4)} ${f(-side * L)} ${f(L * 0.25)}Z" fill="${col}" opacity="0.92"/>`;
      if (k % 3 === 0) svg += `<circle cx="${f(px + side * 5)}" cy="${f(py - 3)}" r="3" fill="${shade(col, 0.3)}" stroke="${shade(col, -0.3)}" stroke-width="0.6"/>`;
    }
  }
  return { id, kind: 'seaweed', viewBox: [W, H], defs: '', svg, heightPx, sway: 0.5, weight: 1.2 };
}

/** Rau diếp biển xanh (Ulva) thấp. */
function lettuce(id: string, seed: number, heightPx: number): PropArt {
  const r = rng(seed);
  let svg = '';
  for (let k = 0; k < 9; k++) {
    const x = 20 + r() * 110;
    const h = 30 + r() * 60;
    const w = 14 + r() * 16;
    const col = mix('#6faf58', '#b7d76a', r());
    svg += `<path d="M${f(x)} 100C${f(x - w)} ${f(100 - h * 0.5)} ${f(x - w * 0.6)} ${f(100 - h)} ${f(x + (r() - 0.5) * 10)} ${f(100 - h)}C${f(x + w * 0.8)} ${f(100 - h * 0.9)} ${f(x + w)} ${f(100 - h * 0.4)} ${f(x + 3)} 100Z" fill="${col}" opacity="0.85" stroke="${shade(col, -0.3)}" stroke-width="0.8"/>`;
  }
  return { id, kind: 'seagrass', viewBox: [150, 100], defs: '', svg, heightPx, sway: 0.4, weight: 1 };
}

/** San hô roi đỏ cam (sea whip) mảnh, vươn cao. */
function whip(id: string, seed: number, heightPx: number, color: string): PropArt {
  const r = rng(seed);
  let svg = '';
  for (let k = 0; k < 9; k++) {
    const x0 = 60 + (r() - 0.5) * 22;
    const lean = (r() - 0.5) * 90;
    const top = 8 + r() * 60;
    svg += `<path d="M${f(x0)} 240C${f(x0 + lean * 0.2)} ${f(170)} ${f(x0 + lean * 0.7)} ${f(100)} ${f(x0 + lean)} ${f(top)}" stroke="${mix(color, '#ffd0a0', r() * 0.35)}" stroke-width="${f(2.4 + r() * 1.6)}" fill="none" stroke-linecap="round"/>`;
  }
  svg += `<ellipse cx="60" cy="238" rx="18" ry="6" fill="${shade(color, -0.4)}"/>`;
  return { id, kind: 'fan', viewBox: [120, 240], defs: '', svg, heightPx, sway: 0.28, weight: 0.5 };
}

/** Bọt biển thùng nâu tím. */
function barrel(id: string, heightPx: number): PropArt {
  const u = ids(id);
  const defs = linear(u('g'), [
    [0, '#8a5f6a'],
    [0.5, '#b08a80'],
    [1, '#5a3f4a'],
  ], { x1: 0, y1: 0, x2: 1, y2: 0 });
  let ribs = '';
  for (let k = 0; k < 9; k++) ribs += `<path d="M${22 + k * 12} 22Q${18 + k * 12.5} 70 ${26 + k * 11} 118" stroke="#3d2a33" stroke-opacity="0.35" stroke-width="2" fill="none"/>`;
  const svg =
    `<path d="M16 26C6 60 12 104 30 120H110C128 104 134 60 124 26Z" fill="${u.url('g')}" stroke="#3d2a33" stroke-width="2"/>${ribs}` +
    `<ellipse cx="70" cy="26" rx="54" ry="14" fill="#2a1a22"/><ellipse cx="70" cy="24" rx="54" ry="13" fill="none" stroke="#d9b8a8" stroke-opacity="0.6" stroke-width="2"/>`;
  return { id, kind: 'sponge', viewBox: [140, 122], defs, svg, heightPx, weight: 0.5 };
}

/** Ụ bùn cát của sá sùng và lỗ hang – đặc trưng bãi triều Quan Lạn, Vân Đồn. */
function mounds(id: string, seed: number): PropArt {
  const r = rng(seed);
  let svg = '';
  for (let k = 0; k < 4; k++) {
    const x = 24 + k * 36 + r() * 10;
    const h = 6 + r() * 7;
    svg += `<path d="M${f(x - 16)} 40Q${f(x - 5)} ${f(40 - h)} ${f(x)} ${f(40 - h)}Q${f(x + 5)} ${f(40 - h)} ${f(x + 16)} 40Z" fill="#a9a586" stroke="#6f6c55" stroke-width="0.8"/>` + `<ellipse cx="${f(x)}" cy="${f(40 - h + 1)}" rx="3.2" ry="1.6" fill="#2f3028"/>`;
    // vệt phân cát xoắn
    svg += `<path d="M${f(x + 9)} 38q3 -4 6 0t6 0" stroke="#8d8a70" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }
  return { id, kind: 'decor', viewBox: [170, 42], defs: '', svg, heightPx: 22, weight: 1.6 };
}

function shells(id: string, seed: number): PropArt {
  const r = rng(seed);
  let svg = '';
  for (let k = 0; k < 6; k++) {
    const x = 14 + r() * 110;
    const s = 5 + r() * 6;
    const col = ['#e9e2cf', '#cdbfa5', '#b8a8b0', '#efe9da'][k % 4];
    svg += `<path d="M${f(x - s)} 30Q${f(x)} ${f(30 - s * 1.6)} ${f(x + s)} 30Z" fill="${col}" stroke="#6a6453" stroke-width="0.7"/><path d="M${f(x)} ${f(30 - s * 0.8)}L${f(x - s * 0.6)} 30M${f(x)} ${f(30 - s * 0.8)}L${f(x + s * 0.6)} 30M${f(x)} ${f(30 - s * 0.8)}V30" stroke="#6a6453" stroke-opacity="0.5" stroke-width="0.5"/>`;
  }
  return { id, kind: 'decor', viewBox: [140, 32], defs: '', svg, heightPx: 16, weight: 1 };
}

/** San hô khối nhỏ màu nâu (rạn Cô Tô, Bạch Long Vĩ). */
function massive(id: string, seed: number, heightPx: number, color: string): PropArt {
  const r = rng(seed);
  const u = ids(id);
  const defs = linear(u('g'), [
    [0, shade(color, 0.35)],
    [1, shade(color, -0.4)],
  ], { x1: 0.3, y1: 0, x2: 0.7, y2: 1 });
  let dots = '';
  for (let k = 0; k < 60; k++) {
    const a = Math.PI + r() * Math.PI;
    const rad = Math.sqrt(r()) * 0.92;
    dots += `<circle cx="${f(80 + Math.cos(a) * 74 * rad)}" cy="${f(78 + Math.sin(a) * 66 * rad)}" r="${f(1.6 + r() * 1.6)}" fill="${shade(color, -0.35)}" opacity="0.6"/>`;
  }
  const svg = `<path d="M6 80C6 30 40 8 80 8C122 8 154 30 154 80Z" fill="${u.url('g')}" stroke="${shade(color, -0.5)}" stroke-width="1.6"/>${dots}<path d="M22 44C40 20 70 12 96 14" stroke="#fff6de" stroke-opacity="0.4" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return { id, kind: 'coral', viewBox: [160, 82], defs, svg, heightPx, sway: 0.02, weight: 0.45 };
}

/** Dải núi đá vôi xa – nhiều tháp cao thấp, lặp ngang liền mép. */
function karstBackdrop(id: string, seed: number, H: number, color: string, parallax: number, heightPx: number, opacity: number, caves: boolean): BackdropArt {
  const r = rng(seed);
  const W = 2048;
  const u = ids(id);
  let svg = '';
  const towers = 9;
  const tower = (cx: number, w: number, top: number) => {
    const pts = finger(r, cx, w, top, H);
    let s = `<path d="${poly(pts)}" fill="${u.url('g')}"/>`;
    if (caves && r() < 0.6) {
      const cw = w * (0.18 + r() * 0.12);
      const ch = 60 + r() * 80;
      s += `<path d="M${f(cx - cw)} ${H}C${f(cx - cw)} ${f(H - ch)} ${f(cx + cw)} ${f(H - ch)} ${f(cx + cw)} ${H}Z" fill="${shade(color, -0.45)}" opacity="0.7"/>`;
    }
    return s;
  };
  for (let i = 0; i < towers; i++) {
    const cx = ((i + 0.5) / towers) * W + (r() - 0.5) * 60;
    const w = 150 + r() * 190;
    const top = H * (0.03 + r() * 0.5);
    const seedState = r(); // cố định hình cho cả bản sao nối mép
    const rr = rng(Math.floor(seedState * 1e6));
    const draw = (x: number) => {
      const pts = finger(rng(Math.floor(seedState * 1e6) + 1), x, w, top, H);
      let s = `<path d="${poly(pts)}" fill="${u.url('g')}"/>`;
      if (caves && rr() < 0.6) {
        const cw = w * 0.22;
        const ch = 90;
        s += `<path d="M${f(x - cw)} ${H}C${f(x - cw)} ${f(H - ch)} ${f(x + cw)} ${f(H - ch)} ${f(x + cw)} ${H}Z" fill="${shade(color, -0.45)}" opacity="0.7"/>`;
      }
      return s;
    };
    svg += draw(cx);
    if (cx - w / 2 < 0) svg += draw(cx + W);
    if (cx + w / 2 > W) svg += draw(cx - W);
  }
  void tower;
  const defs = linear(u('g'), [
    [0, mix(color, '#dff5ea', 0.22)],
    [0.5, color],
    [1, shade(color, -0.25)],
  ], { x1: 0, y1: 0, x2: 0, y2: 1 });
  return { id, viewBox: [W, H], defs, svg, parallax, heightPx, anchor: 'bottom', opacity, tiers: [1, 2] };
}

/** Tiền cảnh: bụi rong mơ sẫm. */
function fgKelp(): PropArt {
  const p = kelp('fg_kelp', 91, 430, '#3a4a3a', 5);
  const u = ids('fg_kelp');
  return { ...p, id: 'fg_kelp', defs: blurFilter(u('b'), 1.2), svg: `<g filter="${u.url('b')}">${p.svg}</g>` };
}

const env: RegionEnvironmentArt = {
  region: 'bac_bo',
  props: [
    karst('karst_tower_big', 11, 300, 420, 300, { fingers: 4, weight: 0.7 }),
    karst('karst_tower_tall', 23, 220, 460, 340, { fingers: 2, weight: 0.5 }),
    karst('karst_rock_mid', 37, 260, 220, 150, { fingers: 3, weight: 1 }),
    karst('karst_rock_warm', 41, 240, 180, 110, { fingers: 3, weight: 0.9, warm: true }),
    karst('karst_rock_low', 53, 220, 120, 64, { fingers: 2, weight: 1.1, kind: 'karst' }),
    arch('karst_arch', 61, 250),
    kelp('kelp_brown', 71, 190, '#8a6a3a', 4),
    kelp('kelp_olive', 73, 150, '#6f7a3f', 3),
    kelp('kelp_tall_deep', 79, 230, '#5a5a3a', 3),
    lettuce('ulva_green', 83, 46),
    lettuce('ulva_green_b', 85, 62),
    whip('sea_whip_red', 97, 150, '#d9603c'),
    whip('sea_whip_yellow', 99, 120, '#d9a03c'),
    barrel('sponge_barrel', 78),
    massive('coral_massive_brown', 101, 62, '#9a7a52'),
    massive('coral_massive_green', 103, 48, '#6f8a5a'),
    mounds('mud_mounds', 107),
    mounds('mud_mounds_b', 109),
    shells('shells', 113),
  ],
  backdrops: [
    karstBackdrop('bd_karst_far', 5, 900, mix(W_DEEP, W_SHALLOW, 0.5), 0.14, 1100, 0.5, false),
    karstBackdrop('bd_karst_mid', 9, 700, mix(W_DEEP, W_SHALLOW, 0.22), 0.34, 760, 0.62, true),
    karstBackdrop('bd_karst_near', 15, 360, mix(W_DEEP, '#0a1f1c', 0.25), 0.56, 330, 0.8, true),
  ],
  foreground: [fgKelp(), { ...karst('fg_rock', 131, 260, 200, 260, { fingers: 3 }), id: 'fg_rock' }],
  seabed: { top: '#b7b394', bottom: '#565c4c', speckle: '#77755c', rim: '#e4e0c2' },
};

export default env;
