/**
 * Môi trường Vùng khơi xa (Hoàng Sa – Trường Sa): rạn san hô vòng nguyên sơ (Tầng 1–2),
 * vách đá dốc đứng đổ xuống vực; Tầng 3 là đáy sâu tối với san hô nước lạnh, giun ống,
 * bút biển phát quang. Nước xanh coban đậm. Dùng lại bộ sinh hình tham số của miền Trung
 * với bảng màu riêng, thêm vật thể biển sâu.
 */
import type { BackdropArt, PropArt, RegionEnvironmentArt } from '../contract-env';
import { brainCoral, branchCoral, tableCoral } from '../mien_trung/corals';
import { seaFan, tubeSponge } from '../mien_trung/soft';
import { reefRock, rubbleDecor, shellsDecor } from '../mien_trung/rocks';
import { farReef, fishSchools, reefWall } from '../mien_trung/backdrops';
import { linear, makeIds, mix, rng, shade, glowFilter, type Ids } from '../../style-bible';

const UP = -Math.PI / 2;
const f = (n: number) => (Math.round(n * 10) / 10).toString();
const ids = (id: string): Ids => makeIds('kx_' + id);
const W_SHALLOW = '#1E6FD9';
const W_DEEP = '#031A3D';
const SHALLOW = [1, 2];
const DEEP = [3];
const tiered = (p: PropArt, tiers: number[], weight?: number): PropArt => ({ ...p, tiers, weight: weight ?? p.weight });

/** Cột đá bazan sẫm ở đáy sâu, phủ bùn mịn. */
function deepRock(id: string, seed: number, W: number, H: number, heightPx: number, weight = 1): PropArt {
  const r = rng(seed);
  const u = ids(id);
  const pts: string[] = [`4 ${H}`];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = H - Math.sin(t * Math.PI) ** 0.6 * H * (0.78 + r() * 0.2);
    pts.push(`${f(8 + t * (W - 16))} ${f(y)}`);
  }
  pts.push(`${W - 4} ${H}`);
  const d = 'M' + pts.join('L') + 'Z';
  const defs =
    linear(u('g'), [
      [0, '#55606e'],
      [0.5, '#2f3844'],
      [1, '#10161e'],
    ], { x1: 0.2, y1: 0, x2: 0.8, y2: 1 }) + `<clipPath id="${u('c')}"><path d="${d}"/></clipPath>`;
  let inner = '';
  for (let k = 0; k < 9; k++) inner += `<path d="M${f(10 + r() * (W - 20))} ${f(H * 0.2 + r() * H * 0.3)}l${f((r() - 0.5) * 16)} ${f(30 + r() * 60)}" stroke="#0a0e14" stroke-opacity="0.5" stroke-width="${f(1 + r() * 2)}" fill="none"/>`;
  inner += `<rect x="0" y="${f(H * 0.8)}" width="${W}" height="${f(H * 0.2)}" fill="#8a94a0" opacity="0.18"/>`;
  const svg = `<path d="${d}" fill="${u.url('g')}" stroke="#0a0e14" stroke-width="2"/><g clip-path="${u.url('c')}">${inner}</g><path d="M${pts.slice(1, 5).join('L')}" fill="none" stroke="#9fb4c8" stroke-opacity="0.35" stroke-width="2"/>`;
  return { id, kind: 'rock', viewBox: [W, H], defs, svg, heightPx, weight, tiers: DEEP };
}

/** Bút biển phát quang (sea pen): thân mềm hình lông vũ, chóp sáng xanh lam – giữ sáng trong bóng tối Tầng 3. */
function seaPen(id: string, seed: number, heightPx: number, glow: string): PropArt {
  const r = rng(seed);
  const u = ids(id);
  const defs = glowFilter(u('gl'), 4, 1.8);
  let svg = `<path d="M50 200C48 150 52 90 50 22" stroke="#3a4658" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  let dots = '';
  for (let k = 0; k < 12; k++) {
    const y = 40 + k * 11;
    const L = 30 - Math.abs(k - 5) * 2.4 + r() * 4;
    for (const side of [-1, 1]) {
      svg += `<path d="M50 ${y}q${side * L * 0.6} ${-L * 0.5} ${side * L} ${-L * 0.3}" stroke="#56667c" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      dots += `<circle cx="${f(50 + side * L)}" cy="${f(y - L * 0.3)}" r="2.6" fill="${glow}"/>`;
    }
  }
  svg += `<g filter="${u.url('gl')}">${dots}<circle cx="50" cy="20" r="4" fill="${glow}"/></g>`;
  return { id, kind: 'decor', viewBox: [100, 200], defs, svg, heightPx, sway: 0.2, weight: 1.3, tiers: DEEP };
}

/** Cụm giun ống (tube worm): ống trắng xám, mang đỏ thẫm. */
function tubeWorms(id: string, seed: number, heightPx: number): PropArt {
  const r = rng(seed);
  let svg = '';
  for (let k = 0; k < 9; k++) {
    const x = 20 + r() * 100;
    const h = 60 + r() * 80;
    const lean = (r() - 0.5) * 24;
    svg +=
      `<path d="M${f(x)} 160L${f(x + lean)} ${f(160 - h)}" stroke="#aeb6bd" stroke-width="7" stroke-linecap="round"/>` +
      `<path d="M${f(x)} 160L${f(x + lean)} ${f(160 - h)}" stroke="#5c6670" stroke-width="2" stroke-dasharray="1 7"/>` +
      `<ellipse cx="${f(x + lean)}" cy="${f(156 - h)}" rx="5" ry="8" fill="#b02a3a" transform="rotate(${f(lean)} ${f(x + lean)} ${f(156 - h)})"/>`;
  }
  return { id, kind: 'decor', viewBox: [140, 162], defs: '', svg, heightPx, sway: 0.12, weight: 0.8, tiers: DEEP };
}

/** Bọt biển thủy tinh hình bình (glass sponge) trắng mờ. */
function glassSponge(id: string, heightPx: number): PropArt {
  const u = ids(id);
  const defs = linear(u('g'), [
    [0, '#e8f2f6', 0.75],
    [1, '#8fa6b4', 0.55],
  ], { x1: 0, y1: 0, x2: 1, y2: 1 });
  let mesh = '';
  for (let k = 0; k < 8; k++) mesh += `<path d="M${22 + k * 9} 24Q${18 + k * 10} 80 ${34 + k * 6} 138" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1" fill="none"/>`;
  for (let k = 0; k < 7; k++) mesh += `<path d="M${18 + k} ${36 + k * 15}Q60 ${44 + k * 15} ${102 - k} ${36 + k * 15}" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1" fill="none"/>`;
  const svg = `<path d="M14 24C10 70 30 120 44 140H76C90 120 110 70 106 24Z" fill="${u.url('g')}" stroke="#dbe9f0" stroke-opacity="0.7" stroke-width="1.6"/>${mesh}<ellipse cx="60" cy="24" rx="46" ry="10" fill="#22303c" opacity="0.7"/><ellipse cx="60" cy="23" rx="46" ry="10" fill="none" stroke="#f2fbff" stroke-opacity="0.7" stroke-width="1.6"/>`;
  return { id, kind: 'sponge', viewBox: [120, 142], defs, svg, heightPx, weight: 0.7, tiers: DEEP };
}

/** Hạt kết hạch mangan và sỏi tối rải trên bùn đáy sâu. */
function nodules(id: string, seed: number): PropArt {
  const r = rng(seed);
  let svg = '';
  for (let k = 0; k < 9; k++) {
    const x = 12 + r() * 130;
    const s = 4 + r() * 6;
    svg += `<ellipse cx="${f(x)}" cy="${f(30 - s * 0.5)}" rx="${f(s)}" ry="${f(s * 0.7)}" fill="#1c2026" stroke="#4a545e" stroke-width="0.8"/>`;
  }
  return { id, kind: 'decor', viewBox: [150, 32], defs: '', svg, heightPx: 16, weight: 1.6, tiers: DEEP };
}

/** Vách đá dốc đứng của rạn san hô vòng (nền xa), có gờ và hốc. */
function cliff(id: string, seed: number, H: number, color: string, parallax: number, heightPx: number, opacity: number, tiers: number[]): BackdropArt {
  const r = rng(seed);
  const W = 2048;
  const u = ids(id);
  let svg = '';
  const cols = 7;
  for (let i = 0; i < cols; i++) {
    const cx = ((i + 0.5) / cols) * W + (r() - 0.5) * 90;
    const w = 220 + r() * 260;
    const top = H * (0.02 + r() * 0.45);
    const jag = Array.from({ length: 7 }, () => r());
    const draw = (x: number) => {
      let d = `M${f(x - w / 2)} ${H}`;
      for (let k = 0; k <= 6; k++) d += `L${f(x - w / 2 + (w * 0.18 * k) / 6 + jag[k] * 26)} ${f(H - ((H - top) * k) / 6)}`;
      d += `L${f(x + w * 0.1)} ${f(top + jag[3] * 30)}`;
      for (let k = 6; k >= 0; k--) d += `L${f(x + w / 2 - (w * 0.2 * k) / 6 - jag[6 - k] * 30)} ${f(H - ((H - top) * k) / 6)}`;
      return `<path d="${d}Z" fill="${u.url('g')}"/>`;
    };
    svg += draw(cx);
    if (cx - w / 2 < 0) svg += draw(cx + W);
    if (cx + w / 2 > W) svg += draw(cx - W);
  }
  const defs = linear(u('g'), [
    [0, mix(color, '#bfe0ff', 0.18)],
    [0.6, color],
    [1, shade(color, -0.35)],
  ], { x1: 0, y1: 0, x2: 0, y2: 1 });
  return { id, viewBox: [W, H], defs, svg, parallax, heightPx, anchor: 'bottom', opacity, tiers };
}

const ROCK = { lit: '#a9b4c2', body: '#6f7c8c', base: '#2f3f56', coralline: '#c084b0', turf: '#5f9a8a' };

const props: PropArt[] = [
  // ---- rạn san hô vòng nguyên sơ (Tầng 1–2)
  tableCoral({
    id: 'table_cobalt_big',
    seed: 11,
    vb: [480, 300],
    heightPx: 190,
    plates: [
      { cx: 300, cy: 76, rx: 164, ry: 24, thick: 14, fingerH: 12, trunkX: 262, trunkW: 11 },
      { cx: 200, cy: 164, rx: 190, ry: 28, thick: 16, fingerH: 13, trunkX: 216, trunkW: 14 },
    ],
    c: { finger: '#7f9fd6', tip: '#e6f1ff', top: '#7090c8', under: '#3f4f78', trunk: '#6a7aa0' },
    weight: 1.3,
    tiers: SHALLOW,
  }),
  tableCoral({
    id: 'table_rose',
    seed: 12,
    vb: [420, 230],
    heightPx: 150,
    plates: [{ cx: 210, cy: 92, rx: 196, ry: 30, thick: 16, fingerH: 13, trunkX: 214, trunkW: 13 }],
    c: { finger: '#d79aa8', tip: '#ffe9ee', top: '#c98a9a', under: '#74505c', trunk: '#a07884' },
    weight: 1.1,
    tiers: SHALLOW,
  }),
  tiered(
    branchCoral({
      id: 'staghorn_electric',
      seed: 13,
      vb: [300, 260],
      heightPx: 150,
      roots: [
        { x: 122, a: UP - 0.8, lenK: 0.8 },
        { x: 134, a: UP - 0.4 },
        { x: 147, a: UP - 0.05, lenK: 1.15 },
        { x: 160, a: UP + 0.35 },
        { x: 174, a: UP + 0.8, lenK: 0.8 },
      ],
      tree: { depth: 3, len: 68, lenDecay: 0.76, w: 13, wDecay: 0.84, minW: 7, spread: 0.4, kids: [2, 3], wiggle: 0.22, upPull: 0.07, segs: 3 },
      c: { base: '#3f5a9a', mid: '#6f9be6', tip: '#d6ecff' },
    }),
    SHALLOW,
    1.3,
  ),
  tiered(
    branchCoral({
      id: 'staghorn_lime',
      seed: 14,
      vb: [260, 230],
      heightPx: 118,
      roots: [
        { x: 110, a: UP - 0.7, lenK: 0.85 },
        { x: 124, a: UP - 0.25 },
        { x: 138, a: UP + 0.2, lenK: 1.1 },
        { x: 152, a: UP + 0.7, lenK: 0.85 },
      ],
      tree: { depth: 3, len: 60, lenDecay: 0.76, w: 12, wDecay: 0.84, minW: 6.5, spread: 0.42, kids: [2, 3], wiggle: 0.25, upPull: 0.06, segs: 3 },
      c: { base: '#5a7a4a', mid: '#a6cf7a', tip: '#f2ffc8' },
    }),
    SHALLOW,
  ),
  tiered(brainCoral({ id: 'brain_violet', seed: 15, vb: [260, 140], heightPx: 88, rows: 14, wav: 1.2, c: { ridge: '#b79ad6', valley: '#4a3a72', septa: '#eadcff' } }), SHALLOW),
  tiered(brainCoral({ id: 'brain_gold', seed: 16, vb: [220, 130], heightPx: 70, rows: 15, c: { ridge: '#d9c070', valley: '#6e6230', septa: '#f6ebb0' } }), SHALLOW, 0.8),
  seaFan({ id: 'fan_crimson_giant', seed: 17, vb: [400, 340], heightPx: 240, c: { branch: '#c4423a', polyp: '#ffd9b0' }, primaries: 5, arc: [UP - 1.0, UP + 1.0], depth: 6, len: 64, w: 7, spread: 0.3, tiers: SHALLOW, weight: 1 }),
  seaFan({ id: 'fan_orange', seed: 18, vb: [300, 300], heightPx: 170, c: { branch: '#e0863a', polyp: '#fff0c0' }, primaries: 4, arc: [UP - 0.8, UP + 0.8], depth: 6, len: 60, w: 6, spread: 0.3, tiers: SHALLOW, weight: 0.9 }),
  tubeSponge({
    id: 'sponge_tube_azure',
    seed: 19,
    vb: [180, 210],
    heightPx: 130,
    tubes: [
      { x: 64, tx: 50, ty: 70, rb: 16, rt: 18 },
      { x: 120, tx: 134, ty: 54, rb: 15, rt: 17 },
      { x: 92, tx: 92, ty: 26, rb: 19, rt: 21 },
    ],
    c: { body: '#5aa0d8', inner: '#1c3a66' },
    tiers: SHALLOW,
  }),
  tiered(reefRock({ id: 'rock_atoll_big', seed: 21, vb: [380, 280], heightPx: 200, lumps: [{ cx: 140, rx: 120, h: 240 }, { cx: 270, rx: 100, h: 170 }], c: ROCK, worms: 3, encrust: 3 }), SHALLOW, 0.7),
  tiered(reefRock({ id: 'rock_atoll_mid', seed: 22, vb: [260, 150], heightPx: 100, lumps: [{ cx: 130, rx: 118, h: 130 }], c: ROCK, worms: 1, encrust: 2 }), SHALLOW, 0.9),
  tiered(shellsDecor({ id: 'decor_shells', seed: 23, heightPx: 26 }), SHALLOW),
  tiered(rubbleDecor({ id: 'decor_rubble', seed: 24, heightPx: 20 }), SHALLOW),
  // ---- đáy sâu (Tầng 3)
  deepRock('deep_rock_spire', 31, 200, 320, 240, 0.6),
  deepRock('deep_rock_mid', 32, 260, 170, 120, 0.9),
  deepRock('deep_rock_low', 33, 220, 80, 56, 1.1),
  seaPen('sea_pen_cyan', 41, 120, '#7CF7FF'),
  seaPen('sea_pen_green', 42, 96, '#5BFFB0'),
  seaPen('sea_pen_blue', 43, 140, '#6FB6FF'),
  tubeWorms('tube_worms', 44, 96),
  glassSponge('glass_sponge', 104),
  tiered(
    branchCoral({
      id: 'coldwater_coral_white',
      seed: 45,
      vb: [260, 230],
      heightPx: 110,
      roots: [
        { x: 112, a: UP - 0.6, lenK: 0.9 },
        { x: 128, a: UP - 0.1, lenK: 1.1 },
        { x: 146, a: UP + 0.5, lenK: 0.9 },
      ],
      tree: { depth: 3, len: 58, lenDecay: 0.76, w: 9, wDecay: 0.82, minW: 5, spread: 0.5, kids: [2, 3], wiggle: 0.3, upPull: 0.04, segs: 3 },
      c: { base: '#8a94a0', mid: '#cfd8e0', tip: '#f4fbff' },
    }),
    DEEP,
    0.9,
  ),
  nodules('nodules', 46),
  nodules('nodules_b', 47),
];

const dim = (c: string) => shade(mix(c, W_DEEP, 0.5), -0.25);
const env: RegionEnvironmentArt = {
  region: 'khoi_xa',
  props,
  backdrops: [
    cliff('bd_cliff_far', 3, 1000, mix(W_DEEP, W_SHALLOW, 0.5), 0.14, 1300, 0.5, SHALLOW),
    { ...farReef(), id: 'kx_bd_far_reef', tiers: [1] },
    cliff('bd_cliff_mid', 5, 800, mix(W_DEEP, W_SHALLOW, 0.25), 0.34, 900, 0.6, SHALLOW),
    { ...reefWall(), id: 'kx_bd_reef_wall', tiers: [1] },
    { ...fishSchools(), id: 'kx_bd_fish', tiers: SHALLOW },
    cliff('bd_abyss_far', 7, 700, '#0a1626', 0.16, 900, 0.7, DEEP),
    cliff('bd_abyss_mid', 9, 500, '#060d18', 0.4, 560, 0.85, DEEP),
  ],
  foreground: [
    tiered(
      branchCoral({
        id: 'fg_staghorn',
        seed: 51,
        vb: [420, 360],
        heightPx: 320,
        roots: [
          { x: 170, a: UP - 0.6 },
          { x: 200, a: UP - 0.2, lenK: 1.15 },
          { x: 225, a: UP + 0.25 },
          { x: 250, a: UP + 0.65 },
        ],
        tree: { depth: 3, len: 96, lenDecay: 0.76, w: 20, wDecay: 0.84, minW: 11, spread: 0.42, kids: [2, 3], wiggle: 0.2, upPull: 0.06, segs: 3 },
        c: { base: dim('#3f5a9a'), mid: dim('#6f9be6'), tip: dim('#d6ecff') },
      }),
      SHALLOW,
    ),
    { ...deepRock('fg_deep_rock', 52, 260, 220, 280), tiers: DEEP },
  ],
  seabed: { top: '#DCE6EA', bottom: '#54708a', speckle: '#8ea2b0', rim: '#F4FBFF' },
};

export default env;
