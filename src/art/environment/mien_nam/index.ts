/**
 * Môi trường Biển miền Nam (Côn Đảo – Phú Quốc): thảm cỏ biển đung đưa, cát trắng,
 * đá granite tròn nhẵn, nước xanh lục ngả vàng ấm áp. Dùng lại các bộ sinh hình tham số
 * của vùng miền Trung (đổi bảng màu, hình dáng) và thêm đá granite, thảm cỏ riêng.
 */
import type { BackdropArt, PropArt, RegionEnvironmentArt } from '../contract-env';
import { brainCoral, branchCoral, tableCoral } from '../mien_trung/corals';
import { redAlgae, sargassum, seagrass, tubeSponge } from '../mien_trung/soft';
import { rubbleDecor, shellsDecor } from '../mien_trung/rocks';
import { fishSchools } from '../mien_trung/backdrops';
import { linear, radial, makeIds, mix, rng, shade, type Ids } from '../../style-bible';

const UP = -Math.PI / 2;
const f = (n: number) => (Math.round(n * 10) / 10).toString();
const ids = (id: string): Ids => makeIds('mn_' + id);
const W_SHALLOW = '#7CC6A4';
const W_DEEP = '#1E6B6B';

/** Đá granite tròn nhẵn xếp chồng (kiểu bãi đá Côn Đảo), lấm tấm hạt khoáng. */
function granite(id: string, seed: number, W: number, H: number, heightPx: number, stones: { cx: number; cy: number; rx: number; ry: number }[], weight = 1): PropArt {
  const r = rng(seed);
  const u = ids(id);
  let defs = '';
  let svg = `<ellipse cx="${W / 2}" cy="${H - 3}" rx="${W * 0.46}" ry="9" fill="#1c3a34" opacity="0.28"/>`;
  stones.forEach((s, i) => {
    const base = mix('#c9b8a6', '#b9a9a0', r());
    defs +=
      radial(u(`g${i}`), [
        [0, shade(base, 0.35)],
        [0.55, base],
        [1, shade(mix(base, W_DEEP, 0.35), -0.3)],
      ], { cx: 0.35, cy: 0.25, r: 0.85 }) + `<clipPath id="${u(`c${i}`)}"><ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}"/></clipPath>`;
    let inner = '';
    for (let k = 0; k < 46; k++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r());
      inner += `<circle cx="${f(s.cx + Math.cos(a) * s.rx * d)}" cy="${f(s.cy + Math.sin(a) * s.ry * d)}" r="${f(0.8 + r() * 1.6)}" fill="${['#5a4a44', '#f4ece0', '#8a6a5a', '#3f3a3a'][k % 4]}" opacity="${f(0.25 + r() * 0.3)}"/>`;
    }
    // vệt rêu tảo ở chân đá + vết nứt
    inner += `<ellipse cx="${s.cx}" cy="${f(s.cy + s.ry * 0.85)}" rx="${f(s.rx * 0.95)}" ry="${f(s.ry * 0.35)}" fill="#6f9a5a" opacity="0.35"/>`;
    inner += `<path d="M${f(s.cx - s.rx * 0.5)} ${f(s.cy - s.ry * 0.2)}q${f(s.rx * 0.3)} ${f(s.ry * 0.25)} ${f(s.rx * 0.2)} ${f(s.ry * 0.7)}" stroke="#4a3d38" stroke-opacity="0.35" stroke-width="1.6" fill="none"/>`;
    svg +=
      `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="${u.url(`g${i}`)}" stroke="#5a4a44" stroke-opacity="0.5" stroke-width="1.6"/>` +
      `<g clip-path="${u.url(`c${i}`)}">${inner}</g>` +
      `<path d="M${f(s.cx - s.rx * 0.7)} ${f(s.cy - s.ry * 0.45)}A${s.rx} ${s.ry} 0 0 1 ${f(s.cx + s.rx * 0.25)} ${f(s.cy - s.ry * 0.96)}" fill="none" stroke="#fffaf0" stroke-opacity="0.55" stroke-width="2.4" stroke-linecap="round"/>`;
  });
  return { id, kind: 'rock', viewBox: [W, H], defs, svg, heightPx, weight };
}

/** Dải nền: bãi đá tròn và thảm cỏ biển xa (lặp ngang liền mép). */
function meadowBackdrop(id: string, seed: number, H: number, color: string, parallax: number, heightPx: number, opacity: number, boulders: number, grass: boolean): BackdropArt {
  const r = rng(seed);
  const W = 2048;
  const u = ids(id);
  let svg = `<rect x="0" y="${H * 0.82}" width="${W}" height="${H * 0.18}" fill="${u.url('g')}"/>`;
  for (let i = 0; i < boulders; i++) {
    const cx = ((i + 0.5) / boulders) * W + (r() - 0.5) * 80;
    const rx = 70 + r() * 150;
    const ry = rx * (0.5 + r() * 0.3);
    const draw = (x: number) => `<ellipse cx="${f(x)}" cy="${f(H * 0.86)}" rx="${f(rx)}" ry="${f(ry)}" fill="${u.url('g')}"/>`;
    svg += draw(cx);
    if (cx - rx < 0) svg += draw(cx + W);
    if (cx + rx > W) svg += draw(cx - W);
  }
  if (grass) {
    let d = '';
    for (let x = 0; x < W; x += 9) {
      const h = 30 + r() * 70;
      const lean = (r() - 0.5) * 26;
      d += `M${x} ${f(H * 0.84)}q${f(lean * 0.4)} ${f(-h * 0.6)} ${f(lean)} ${f(-h)}`;
    }
    svg += `<path d="${d}" stroke="${shade(color, -0.12)}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }
  const defs = linear(u('g'), [
    [0, mix(color, '#f2ffd8', 0.2)],
    [1, shade(color, -0.2)],
  ], { x1: 0, y1: 0, x2: 0, y2: 1 });
  return { id, viewBox: [W, H], defs, svg, parallax, heightPx, anchor: 'bottom', opacity, tiers: [1, 2] };
}

const GRASS = [
  seagrass({ id: 'seagrass_tall', seed: 11, vb: [170, 260], heightPx: 150, blades: 20, c: { base: '#3c6e34', mid: '#6fae4c', tip: '#c6e07a' }, sway: 0.62, weight: 2.4 }),
  seagrass({ id: 'seagrass_mid', seed: 12, vb: [160, 200], heightPx: 105, blades: 18, c: { base: '#4a7a3a', mid: '#86b85a', tip: '#d9ea90' }, sway: 0.6, weight: 2.6 }),
  seagrass({ id: 'seagrass_short', seed: 13, vb: [150, 130], heightPx: 62, blades: 16, c: { base: '#567f3c', mid: '#95be62', tip: '#e2efa0' }, bladeW: 7, sway: 0.5, weight: 2.2 }),
  seagrass({ id: 'seagrass_olive', seed: 14, vb: [180, 230], heightPx: 128, blades: 22, c: { base: '#4e6a2e', mid: '#8a9e48', tip: '#cdd884' }, bladeW: 5, sway: 0.65, weight: 1.6 }),
];

const props: PropArt[] = [
  ...GRASS,
  granite('granite_stack_big', 21, 360, 250, 190, [
    { cx: 120, cy: 170, rx: 112, ry: 78 },
    { cx: 262, cy: 188, rx: 92, ry: 60 },
    { cx: 190, cy: 84, rx: 84, ry: 60 },
  ], 0.7),
  granite('granite_pair', 22, 300, 150, 112, [
    { cx: 100, cy: 92, rx: 92, ry: 56 },
    { cx: 214, cy: 104, rx: 80, ry: 44 },
  ], 0.9),
  granite('granite_egg', 23, 180, 110, 76, [{ cx: 90, cy: 62, rx: 84, ry: 46 }], 1),
  granite('granite_pebbles', 24, 220, 60, 34, [
    { cx: 50, cy: 38, rx: 44, ry: 20 },
    { cx: 126, cy: 42, rx: 36, ry: 16 },
    { cx: 186, cy: 44, rx: 28, ry: 13 },
  ], 1.2),
  brainCoral({ id: 'brain_honey', seed: 31, vb: [220, 130], heightPx: 66, rows: 14, c: { ridge: '#d9b86a', valley: '#7a5a2e', septa: '#f4e2a6' }, weight: 0.5 }),
  branchCoral({
    id: 'staghorn_cream',
    seed: 32,
    vb: [260, 220],
    heightPx: 104,
    roots: [
      { x: 108, a: UP - 0.7, lenK: 0.85 },
      { x: 122, a: UP - 0.25 },
      { x: 138, a: UP + 0.2, lenK: 1.1 },
      { x: 152, a: UP + 0.7, lenK: 0.85 },
    ],
    tree: { depth: 3, len: 56, lenDecay: 0.76, w: 11, wDecay: 0.84, minW: 6, spread: 0.42, kids: [2, 3], wiggle: 0.24, upPull: 0.06, segs: 3 },
    c: { base: '#8a7a52', mid: '#d8c690', tip: '#fff2c8' },
    weight: 0.5,
  }),
  tableCoral({
    id: 'table_sand',
    seed: 33,
    vb: [300, 150],
    heightPx: 88,
    plates: [{ cx: 150, cy: 70, rx: 136, ry: 25, thick: 17, fingerH: 15, trunkX: 150, trunkW: 14 }],
    c: { finger: '#c9b27a', tip: '#f6eccf', top: '#bca56c', under: '#6e6248', trunk: '#8f8060' },
    weight: 0.35,
    tiers: [1],
  }),
  tubeSponge({
    id: 'sponge_tube_orange',
    seed: 34,
    vb: [150, 170],
    heightPx: 92,
    tubes: [
      { x: 55, tx: 42, ty: 62, rb: 13, rt: 12 },
      { x: 95, tx: 106, ty: 42, rb: 14, rt: 13 },
      { x: 76, tx: 74, ty: 24, rb: 15, rt: 14 },
    ],
    c: { body: '#e08a4a', inner: '#6a3416' },
    tiers: [1, 2],
  }),
  { ...sargassum({ id: 'sargassum_gold', seed: 35, vb: [220, 300], heightPx: 160, stems: 5, c: { stem: '#7a6428', leaf: '#b89c3e', tip: '#e6cf6c', bladder: '#c2a444' }, sway: 0.55 }), weight: 0.6 },
  { ...redAlgae({ id: 'red_algae', seed: 36, vb: [160, 170], heightPx: 70, c: { base: '#a8485a', tip: '#f4b0b0' } }), weight: 0.5 },
  shellsDecor({ id: 'decor_shells', seed: 41, heightPx: 26, weight: 1.2 }),
  rubbleDecor({ id: 'decor_rubble', seed: 42, heightPx: 18 }),
];

const dim = (c: string) => shade(mix(c, W_DEEP, 0.45), -0.3);
const env: RegionEnvironmentArt = {
  region: 'mien_nam',
  props,
  backdrops: [
    meadowBackdrop('bd_far_boulders', 5, 420, mix(W_DEEP, W_SHALLOW, 0.55), 0.16, 380, 0.5, 9, false),
    meadowBackdrop('bd_mid_meadow', 7, 360, mix(W_DEEP, W_SHALLOW, 0.3), 0.36, 300, 0.62, 6, true),
    fishSchools(),
    meadowBackdrop('bd_near_meadow', 9, 260, mix(W_DEEP, '#0e3a38', 0.3), 0.58, 210, 0.8, 4, true),
  ],
  foreground: [
    seagrass({ id: 'fg_seagrass', seed: 51, vb: [260, 420], heightPx: 400, blades: 18, c: { base: dim('#3c6e34'), mid: dim('#6fae4c'), tip: dim('#c6e07a') }, bladeW: 12, sway: 0.5 }),
    granite('fg_granite', 52, 300, 200, 260, [
      { cx: 110, cy: 130, rx: 104, ry: 70 },
      { cx: 226, cy: 150, rx: 74, ry: 50 },
    ]),
  ],
  seabed: { top: '#F6EFD6', bottom: '#CDBE98', speckle: '#B5A57C', rim: '#FFFBEA' },
};

export default env;
