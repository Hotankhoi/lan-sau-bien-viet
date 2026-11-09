/**
 * MÔI TRƯỜNG – BIỂN MIỀN TRUNG: "Rực rỡ, trong vắt".
 * Rạn san hô dày đặc nhiều màu (san hô bàn, sừng hươu, não, nấm), hải quỳ, quạt biển, bọt biển ống,
 * đá rạn, rong mơ, cỏ biển; cát trắng ngả vàng; nước xanh lam ngọc (#3FC1D9 → #0F5C8C).
 * Toàn bộ vẽ SVG bằng code (không ảnh ngoài). id defs có tiền tố "mt_<prop>__".
 */
import type { PropArt, RegionEnvironmentArt } from '../contract-env';
import { branchCoral, brainCoral, leatherCoral, mushroomCoral, tableCoral } from './corals';
import { anemone, redAlgae, sargassum, seaFan, seagrass, tubeSponge } from './soft';
import { reefRock, rubbleDecor, shellsDecor } from './rocks';
import { farReef, fishSchools, nearReef, reefWall } from './backdrops';
import { dark, desat } from './common';

const UP = -Math.PI / 2;

// ---------------------------------------------------------------- san hô bàn
const tableA = tableCoral({
  id: 'table_tan',
  seed: 101,
  vb: [420, 230],
  heightPx: 140,
  plates: [{ cx: 210, cy: 92, rx: 196, ry: 30, thick: 16, fingerH: 13, trunkX: 214, trunkW: 13 }],
  c: { finger: '#C3AD72', tip: '#E9DAF6', top: '#BCA56A', under: '#6E6650', trunk: '#9C8A62' },
  weight: 1.2,
});
const tableB = tableCoral({
  id: 'table_blue_tiers',
  seed: 102,
  vb: [440, 300],
  heightPx: 160,
  plates: [
    { cx: 270, cy: 80, rx: 150, ry: 23, thick: 13, fingerH: 11, trunkX: 238, trunkW: 10 },
    { cx: 190, cy: 160, rx: 176, ry: 27, thick: 15, fingerH: 12, trunkX: 205, trunkW: 13 },
  ],
  c: { finger: '#8EA6CB', tip: '#E4F2FF', top: '#7F98BE', under: '#4E5B78', trunk: '#7D86A0' },
  tiers: [1, 2],
});
const tableC = tableCoral({
  id: 'table_green_low',
  seed: 103,
  vb: [300, 150],
  heightPx: 95,
  plates: [{ cx: 150, cy: 70, rx: 138, ry: 26, thick: 18, fingerH: 16, trunkX: 150, trunkW: 15 }],
  c: { finger: '#9FBE7C', tip: '#F2F6C4', top: '#90AE6C', under: '#56664A', trunk: '#80906A' },
  fingerW: 4.4,
  spacing: 8,
  tiers: [1],
});

// ---------------------------------------------------------- san hô sừng hươu
const stagTan = branchCoral({
  id: 'staghorn_tan',
  seed: 201,
  vb: [300, 260],
  heightPx: 140,
  roots: [
    { x: 122, a: UP - 0.8, lenK: 0.8 },
    { x: 132, a: UP - 0.45 },
    { x: 145, a: UP - 0.15, lenK: 1.1 },
    { x: 155, a: UP + 0.15, lenK: 1.05 },
    { x: 166, a: UP + 0.45 },
    { x: 176, a: UP + 0.85, lenK: 0.8 },
  ],
  tree: { depth: 3, len: 66, lenDecay: 0.76, w: 13, wDecay: 0.84, minW: 7, spread: 0.4, kids: [2, 3], wiggle: 0.22, upPull: 0.07, segs: 3 },
  c: { base: '#8A7550', mid: '#CDB685', tip: '#C8B6F0' },
  weight: 1.2,
});
const stagPurple = branchCoral({
  id: 'staghorn_purple',
  seed: 202,
  vb: [260, 240],
  heightPx: 120,
  roots: [
    { x: 112, a: UP - 0.7, lenK: 0.85 },
    { x: 122, a: UP - 0.3 },
    { x: 134, a: UP + 0.05, lenK: 1.15 },
    { x: 146, a: UP + 0.4 },
    { x: 154, a: UP + 0.8, lenK: 0.85 },
  ],
  tree: { depth: 3, len: 62, lenDecay: 0.76, w: 12, wDecay: 0.84, minW: 6.5, spread: 0.42, kids: [2, 3], wiggle: 0.25, upPull: 0.06, segs: 3 },
  c: { base: '#5E3F6E', mid: '#A877B8', tip: '#F2C9EE' },
});
const pocillopora = branchCoral({
  id: 'cauliflower_pink',
  seed: 203,
  vb: [220, 150],
  heightPx: 80,
  roots: [
    { x: 95, a: UP - 0.7, lenK: 0.9 },
    { x: 105, a: UP - 0.25 },
    { x: 115, a: UP + 0.2 },
    { x: 125, a: UP + 0.7, lenK: 0.9 },
  ],
  tree: { depth: 3, len: 40, lenDecay: 0.78, w: 11, wDecay: 0.82, minW: 6, spread: 0.6, kids: [2, 3], wiggle: 0.3, upPull: 0.03, segs: 2 },
  c: { base: '#8E5B5A', mid: '#E0A39A', tip: '#FBE0D6' },
  polypGap: 3,
  tiers: [1],
});

// ---------------------------------------------------------------- san hô não
const brainA = brainCoral({
  id: 'brain_olive',
  seed: 301,
  vb: [220, 130],
  heightPx: 72,
  rows: 15,
  c: { ridge: '#CDBB72', valley: '#6E6A35', septa: '#E9DC9A' },
});
const brainB = brainCoral({
  id: 'brain_teal_wide',
  seed: 302,
  vb: [300, 130],
  heightPx: 82,
  rows: 12,
  wav: 1.3,
  c: { ridge: '#8EC0A4', valley: '#2F6A5E', septa: '#D4F0D0' },
});

// ------------------------------------------------- san hô nấm / san hô da nấm
const fungia = mushroomCoral({ id: 'mushroom_disc', seed: 401, heightPx: 28, c: { center: '#D8C88E', mid: '#AFC47F', rim: '#C49BD8' }, weight: 0.8 });
const leather = leatherCoral({ id: 'mushroom_leather', seed: 402, heightPx: 72, c: { stalk: '#E2D7AE', cap: '#BFB980', polyp: '#EEF3C8' } });

// ---------------------------------------------------------------- hải quỳ
const anemMagnifica = anemone({
  id: 'anemone_magnifica',
  seed: 501,
  vb: [240, 180],
  heightPx: 76,
  n: 64,
  disc: { cx: 120, cy: 112, rx: 74, ry: 12 },
  column: { wTop: 132, wBot: 104, color: '#8E3C8C' },
  tent: { len: [34, 62], w: 8, base: '#7C3C82', mid: '#D58FC2', tip: '#FFD8F0', splay: 0.85, curl: 0.25 },
  weight: 1.3,
});
const anemBubble = anemone({
  id: 'anemone_bubble',
  seed: 502,
  vb: [200, 150],
  heightPx: 62,
  n: 46,
  disc: { cx: 100, cy: 104, rx: 56, ry: 10 },
  column: { wTop: 96, wBot: 80, color: '#9C6A6E' },
  tent: { len: [30, 48], w: 7, base: '#8B4A6E', mid: '#E28DB4', tip: '#F6E4F2', splay: 0.7, curl: 0.18, bulb: true },
  chunk: 2,
});
const anemCarpet = anemone({
  id: 'anemone_carpet',
  seed: 503,
  vb: [280, 110],
  heightPx: 50,
  n: 120,
  disc: { cx: 140, cy: 80, rx: 120, ry: 16 },
  tent: { len: [14, 28], w: 5, base: '#6E3A78', mid: '#C27BC8', tip: '#F4CFF0', splay: 1.1, curl: 0.35 },
  chunk: 5,
  sway: 0.22,
});

// ---------------------------------------------------------------- quạt biển
const fanRed = seaFan({
  id: 'fan_red',
  seed: 601,
  vb: [340, 320],
  heightPx: 190,
  c: { branch: '#C9573F', polyp: '#F7D9A0' },
  primaries: 4,
  arc: [UP - 0.85, UP + 0.85],
  depth: 6,
  len: 62,
  w: 6.5,
  spread: 0.32,
  weight: 1.1,
});
const fanPurple = seaFan({
  id: 'fan_purple',
  seed: 602,
  vb: [260, 300],
  heightPx: 150,
  c: { branch: '#9A5BB0', polyp: '#F3D2F7' },
  primaries: 3,
  arc: [UP - 0.55, UP + 0.55],
  depth: 6,
  len: 62,
  w: 5.5,
  spread: 0.3,
  tiers: [1, 2],
});
const fanYellow = seaFan({
  id: 'fan_yellow_deep',
  seed: 603,
  vb: [380, 300],
  heightPx: 210,
  c: { branch: '#D9A93E', polyp: '#FFF2C2' },
  primaries: 5,
  arc: [UP - 1.05, UP + 1.0],
  depth: 6,
  len: 58,
  w: 6,
  spread: 0.3,
  tiers: [2],
  weight: 0.9,
});

// ---------------------------------------------------------------- bọt biển ống
const spongePurple = tubeSponge({
  id: 'sponge_tube_purple',
  seed: 701,
  vb: [180, 210],
  heightPx: 120,
  tubes: [
    { x: 64, tx: 50, ty: 70, rb: 16, rt: 18 },
    { x: 120, tx: 134, ty: 54, rb: 15, rt: 17 },
    { x: 92, tx: 92, ty: 26, rb: 19, rt: 21 },
    { x: 100, tx: 112, ty: 112, rb: 14, rt: 15 },
  ],
  c: { body: '#9C7CC6', inner: '#3E2A5C' },
});
const spongeYellow = tubeSponge({
  id: 'sponge_tube_yellow',
  seed: 702,
  vb: [150, 170],
  heightPx: 95,
  tubes: [
    { x: 55, tx: 40, ty: 60, rb: 13, rt: 12 },
    { x: 95, tx: 108, ty: 40, rb: 14, rt: 13 },
    { x: 76, tx: 74, ty: 22, rb: 15, rt: 14 },
  ],
  c: { body: '#D9B64E', inner: '#6A4A1C' },
  tiers: [1, 2],
});

// ---------------------------------------------------------------- đá rạn
const ROCK = { lit: '#BDB59A', body: '#8A8676', base: '#4C5A66', coralline: '#C97A9A', turf: '#7E9A52' };
const rockBig = reefRock({
  id: 'rock_reef_big',
  seed: 801,
  vb: [380, 280],
  heightPx: 185,
  lumps: [
    { cx: 140, rx: 120, h: 230 },
    { cx: 270, rx: 100, h: 160 },
  ],
  c: ROCK,
  worms: 3,
  encrust: 3,
  weight: 0.8,
});
const rockMid = reefRock({
  id: 'rock_reef_mid',
  seed: 802,
  vb: [260, 150],
  heightPx: 100,
  lumps: [{ cx: 130, rx: 118, h: 130 }],
  c: { ...ROCK, lit: '#C2B9A0', body: '#908A78' },
  worms: 1,
  encrust: 2,
});
const rockSmall = reefRock({
  id: 'rock_cluster_small',
  seed: 803,
  vb: [220, 100],
  heightPx: 60,
  lumps: [
    { cx: 70, rx: 60, h: 80 },
    { cx: 150, rx: 55, h: 58 },
    { cx: 112, rx: 30, h: 40 },
  ],
  c: { ...ROCK, coralline: '#B98AA8' },
  encrust: 1,
  weight: 1.2,
});

// ---------------------------------------------------------------- rong & cỏ
const sargA = sargassum({
  id: 'seaweed_sargassum',
  seed: 901,
  vb: [220, 300],
  heightPx: 170,
  stems: 5,
  c: { stem: '#6E5A2A', leaf: '#A8913E', tip: '#D9C46A', bladder: '#B89A44' },
  sway: 0.55,
});
const grass = seagrass({
  id: 'seagrass_ribbon',
  seed: 902,
  vb: [150, 220],
  heightPx: 110,
  blades: 16,
  c: { base: '#3E6E3A', mid: '#6FA352', tip: '#B9D77A' },
  sway: 0.6,
  weight: 0.9,
});
const redWeed = redAlgae({ id: 'seaweed_red_bush', seed: 903, vb: [160, 170], heightPx: 85, c: { base: '#9A3A4A', tip: '#F0A0A8' } });

// ---------------------------------------------------------------- trang trí
const shells = shellsDecor({ id: 'decor_shells', seed: 1001, heightPx: 26 });
const rubble = rubbleDecor({ id: 'decor_rubble', seed: 1002, heightPx: 20 });

// ---------------------------------------------------------------- tiền cảnh (game tự làm mờ)
const FG_TINT = (c: string) => dark(desat(c, 0.35), 0.35);
const fgStag = branchCoral({
  id: 'fg_staghorn',
  seed: 1101,
  vb: [420, 360],
  heightPx: 320,
  roots: [
    { x: 170, a: UP - 0.6 },
    { x: 200, a: UP - 0.2, lenK: 1.15 },
    { x: 225, a: UP + 0.25 },
    { x: 250, a: UP + 0.65 },
  ],
  tree: { depth: 3, len: 96, lenDecay: 0.76, w: 20, wDecay: 0.84, minW: 11, spread: 0.42, kids: [2, 3], wiggle: 0.2, upPull: 0.06, segs: 3 },
  c: { base: FG_TINT('#6E5A7A'), mid: FG_TINT('#9A7BA8'), tip: FG_TINT('#D6B8E8') },
});
const fgWeed = sargassum({
  id: 'fg_sargassum',
  seed: 1102,
  vb: [300, 460],
  heightPx: 420,
  stems: 7,
  c: { stem: FG_TINT('#5E4A22'), leaf: FG_TINT('#8E7A34'), tip: FG_TINT('#BBA554'), bladder: FG_TINT('#9A8238') },
  sway: 0.45,
});
const fgTable = tableCoral({
  id: 'fg_table',
  seed: 1103,
  vb: [460, 260],
  heightPx: 240,
  plates: [{ cx: 230, cy: 104, rx: 215, ry: 34, thick: 20, fingerH: 16, trunkX: 236, trunkW: 16 }],
  c: { finger: FG_TINT('#A89A6E'), tip: FG_TINT('#D8CCE8'), top: FG_TINT('#9C8E64'), under: FG_TINT('#5A5444'), trunk: FG_TINT('#827456') },
  fingerW: 5,
  spacing: 10,
});

const props: PropArt[] = [
  tableA,
  tableB,
  tableC,
  stagTan,
  stagPurple,
  pocillopora,
  brainA,
  brainB,
  fungia,
  leather,
  anemMagnifica,
  anemBubble,
  anemCarpet,
  fanRed,
  fanPurple,
  fanYellow,
  spongePurple,
  spongeYellow,
  rockBig,
  rockMid,
  rockSmall,
  sargA,
  grass,
  redWeed,
  shells,
  rubble,
];

const env: RegionEnvironmentArt = {
  region: 'mien_trung',
  props,
  backdrops: [farReef(), reefWall(), fishSchools(), nearReef()],
  foreground: [fgStag, fgWeed, fgTable],
  seabed: { top: '#ECE2C2', bottom: '#C2B38C', speckle: '#A3936C', rim: '#FFF8E2' },
};

export default env;
