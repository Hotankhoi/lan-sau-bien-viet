/**
 * Cá nhám voi – Rhincodon typus
 * Đặc điểm nhận dạng: khổng lồ, đầu dẹt rộng mõm cụt, MIỆNG NGANG RẤT RỘNG Ở MÚT MÕM (không nằm dưới
 * như cá mập thường), mắt rất nhỏ; lưng xám xanh đậm phủ "bàn cờ chấm": vạch dọc kem mảnh + vạch ngang
 * nhạt tạo ô, mỗi ô một chấm trắng; đầu chấm nhỏ dày không theo hàng; bụng trắng; 3 gờ nổi dọc thân;
 * 5 khe mang rất dài; vây ngực to lưỡi liềm; vây lưng 1 to, vây lưng 2 nhỏ; đuôi lưỡi liềm thùy trên lớn.
 * Tham khảo: references/ca_nham_voi (ref1–ref4, Wikimedia Commons) – chỉ để nhìn, vẽ tay hoàn toàn.
 */
import type { CreatureArt } from '../contract';
import {
  makeIds,
  standardBody,
  eye,
  linear,
  radial,
  blurFilter,
  organicTexture,
  joinDefs,
  smoothPath,
  rng,
} from '../style-bible';

const u = makeIds('ca_nham_voi');

const BACK = '#15263a';
const FLANK = '#29434f';
const BELLY = '#e2eaec';
const EDGE = '#14222c';
const SPOT = '#eef4ea';
const LINE = '#c4d6d0';

// ---------- Thân (đầu phải, đuôi trái) ----------
const BODY = smoothPath(
  [
    [980, 183],
    [977, 197],
    [968, 207],
    [948, 216],
    [918, 226],
    [872, 240],
    [820, 252],
    [760, 261],
    [690, 265],
    [610, 265],
    [530, 260],
    [460, 252],
    [400, 242],
    [340, 231],
    [290, 221],
    [245, 212],
    [205, 203],
    [180, 197],
    [166, 194],
    [164, 172],
    [174, 166],
    [210, 157],
    [260, 146],
    [320, 133],
    [380, 120],
    [440, 108],
    [510, 99],
    [590, 93],
    [670, 92],
    [740, 96],
    [800, 104],
    [850, 114],
    [895, 126],
    [932, 136],
    [958, 149],
    [974, 166],
  ],
  true,
);

/** Nội suy tuyến tính theo bảng [x, y] (x tăng dần). */
function lerpTable(tab: [number, number][], x: number): number {
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) {
    if (x <= tab[i][0]) {
      const [x0, y0] = tab[i - 1];
      const [x1, y1] = tab[i];
      return y0 + ((y1 - y0) * (x - x0)) / Math.max(1e-6, x1 - x0);
    }
  }
  return tab[tab.length - 1][1];
}
/** mép lưng */
const TOP: [number, number][] = [
  [170, 168], [210, 157], [260, 146], [320, 133], [380, 120], [440, 108], [510, 99], [590, 93],
  [670, 92], [740, 96], [800, 104], [850, 114], [895, 126], [932, 136], [958, 149], [974, 166],
];
/** ranh giới vùng hoa văn / bụng trắng */
const BELLYLINE: [number, number][] = [
  [170, 192], [250, 205], [340, 221], [440, 233], [540, 240], [640, 242], [740, 238], [820, 231],
  [880, 221], [925, 212], [978, 200],
];
const topY = (x: number) => lerpTable(TOP, x);
const bellyY = (x: number) => lerpTable(BELLYLINE, x);

const BELLY_PATH =
  'M990 ' + bellyY(978).toFixed(1) + ' ' +
  BELLYLINE.slice()
    .reverse()
    .map(([x, y]) => `L${x} ${y}`)
    .join('') +
  'L150 192L150 300L990 300Z';

// ---------- Vây gắn thân (uốn theo thân, vẽ sau thân) ----------
const CAUDAL =
  'M198 160C166 148 128 112 96 76C84 62 70 46 60 36C55 31 49 34 50 41' +
  'C54 74 72 120 98 160C104 170 108 178 108 186' +
  'C102 214 94 252 86 284C84 292 90 296 96 290C126 262 158 226 198 204Z';
const DORSAL1 = 'M508 114C490 92 464 62 440 46C424 35 406 34 402 44C398 64 392 94 358 120L380 128Z';
const DORSAL2 = 'M274 150C264 137 251 123 241 115C235 111 229 113 229 119C228 131 223 143 207 155L224 160Z';
const PELVIC = 'M444 242C436 258 422 274 405 287C399 291 395 289 396 283C397 272 393 258 378 247L402 238Z';
const ANAL = 'M264 212C258 226 249 238 237 247C232 250 229 248 230 243C231 235 227 225 214 214L232 207Z';

// ---------- Vây ngực (tách lớp) ----------
const PECT_NEAR =
  'M796 228C786 262 754 304 714 336C682 360 648 374 622 377C610 378 607 370 615 363' +
  'C644 339 668 305 680 277C686 265 690 257 692 250C720 240 760 230 796 228Z';
const PECT_NEAR_LEAD = 'M796 228C786 262 754 304 714 336C682 360 648 374 622 377';
const PECT_FAR = 'M808 232C800 260 780 292 754 318C746 326 737 328 737 321C739 300 743 276 736 254C760 244 786 236 808 232Z';

// ---------- Hoa văn ----------
/** Bàn cờ chấm: vạch dọc kem + vạch ngang nhạt, mỗi ô một chấm trắng (có rung lệch cho tự nhiên). */
function checkerboard(): { stripes: string; hlines: string; spots: string } {
  const r = rng(1801);
  const xs: number[] = [];
  let x = 184;
  while (x < 748) {
    xs.push(x);
    x += 13 + ((x - 180) / 590) * 10 + (r() - 0.5) * 3; // ô hẹp dần về đuôi
  }
  const ROWS = 7;
  /** độ cong vạch dọc: phía vai (gần mang) cong mạnh, về đuôi gần thẳng */
  const bowAt = (sx: number) => 2 + Math.max(0, (sx - 520) / 250) * 7;
  let stripes = '';
  let spots = '';
  for (let i = 0; i < xs.length; i++) {
    const sx = xs[i];
    const t0 = topY(sx) - 4;
    const b0 = bellyY(sx) + 3;
    const bow = bowAt(sx) * (0.8 + r() * 0.4);
    const pts: [number, number][] = [];
    for (let k = 0; k <= 4; k++) {
      const f = k / 4;
      const y = t0 + (b0 - t0) * f;
      // cung lồi về phía đầu ở giữa hông + rung nhẹ
      const xx = sx + bow * Math.sin(f * Math.PI) - f * 2 + (k > 0 && k < 4 ? (r() - 0.5) * 2.2 : 0);
      pts.push([xx, y]);
    }
    stripes += smoothPath(pts);
    if (i === xs.length - 1) break;
    const nx = xs[i + 1];
    const tt = topY((sx + nx) / 2);
    const bb = bellyY((sx + nx) / 2);
    const depth = Math.max(1, bb - tt);
    const rad = 1.7 + Math.max(0, ((sx + nx) / 2 - 180) / 590) * 2.2;
    for (let k = 0; k < ROWS; k++) {
      if (r() < 0.06) continue; // đôi khi thiếu chấm
      const fy = (k + 0.5) / ROWS;
      // chấm nằm giữa hai vạch dọc (theo độ cong của vạch tại độ cao đó)
      const cx = (sx + nx) / 2 + (bowAt(sx) + bowAt(nx)) * 0.5 * Math.sin(fy * Math.PI) - fy * 2;
      const y = tt + depth * fy + (r() - 0.5) * depth * 0.06;
      const xx = cx + (r() - 0.5) * 3;
      const rr = rad * (0.72 + r() * 0.5) * (k === ROWS - 1 ? 0.8 : 1);
      spots += `<ellipse cx="${xx.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(rr * 0.92).toFixed(2)}" ry="${rr.toFixed(2)}"/>`;
      // thỉnh thoảng thêm một chấm nhỏ phụ trong ô
      if (r() < 0.12) {
        spots += `<circle cx="${(xx + (r() - 0.5) * 6).toFixed(1)}" cy="${(y + depth / ROWS / 2.6).toFixed(1)}" r="${(rr * 0.45).toFixed(2)}"/>`;
      }
    }
  }
  // vạch ngang rất nhạt (ranh giới hàng), lượn nhẹ
  let hlines = '';
  for (let k = 1; k < ROWS; k++) {
    const fy = k / ROWS;
    const pts: [number, number][] = [];
    for (let px = 180; px <= 780; px += 40) {
      pts.push([px, topY(px) + (bellyY(px) - topY(px)) * fy + (r() - 0.5) * 2]);
    }
    hlines += smoothPath(pts);
  }
  return { stripes, hlines, spots };
}

/** Đầu: chấm nhỏ dày, không theo hàng, nhỏ dần về mõm. */
function headSpots(): string {
  const r = rng(77);
  const pts: [number, number, number][] = [];
  let tries = 0;
  while (pts.length < 190 && tries < 7000) {
    tries++;
    const x = 742 + r() * 234;
    const y = 96 + r() * 130;
    if (y < topY(x) + 2 || y > bellyY(x) - 1) continue;
    // tránh mắt + khóe miệng
    if ((x - 905) ** 2 + (y - 186) ** 2 < 11 * 11) continue;
    // tránh khe miệng + môi dưới
    if (x > 896 && y > 182 + ((980 - x) * 20) / 70 - 5) continue;
    const f = Math.max(0, (x - 742) / 234);
    const rad = 2.6 - f * 1.25 + r() * 0.5;
    const gap = 6.4 - f * 1.6;
    if (pts.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 < gap * gap)) continue;
    pts.push([x, y, rad]);
  }
  return pts.map(([x, y, rr]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(2)}"/>`).join('');
}

/** Rải chấm trong khung (cắt theo vây bằng clip). */
function finSpots(seed: number, area: { x: number; y: number; w: number; h: number }, count: number, rMin: number, rMax: number, gap: number): string {
  const r = rng(seed);
  const pts: [number, number, number][] = [];
  let tries = 0;
  while (pts.length < count && tries < count * 40) {
    tries++;
    const x = area.x + r() * area.w;
    const y = area.y + r() * area.h;
    const rad = rMin + r() * (rMax - rMin);
    if (pts.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 < gap * gap)) continue;
    pts.push([x, y, rad]);
  }
  return pts.map(([x, y, rr]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(2)}"/>`).join('');
}

// 3 gờ dọc thân (gờ trên, giữa, dưới) – hội tụ về gờ cuống đuôi
const RIDGES: [number, number][][] = [
  [[868, 128], [800, 118], [720, 112], [640, 111], [560, 113], [470, 121], [380, 134], [300, 148], [230, 162], [176, 174]],
  [[812, 158], [740, 152], [660, 151], [580, 153], [500, 157], [420, 163], [340, 170], [270, 177], [205, 182], [168, 182]],
  [[752, 199], [680, 203], [600, 206], [520, 206], [440, 203], [360, 198], [290, 193], [230, 189], [168, 186]],
];

function ridges(): string {
  let s = '';
  for (const pts of RIDGES) {
    const d = smoothPath(pts);
    // bóng phía dưới gờ + sáng ở sống gờ
    s +=
      `<path d="${d}" fill="none" stroke="#0e1a22" stroke-opacity="0.42" stroke-width="5" transform="translate(0 2.6)" filter="${u.url('soft2')}"/>` +
      `<path d="${d}" fill="none" stroke="${LINE}" stroke-opacity="0.5" stroke-width="1.6" stroke-linecap="round"/>` +
      `<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="3.4" transform="translate(0 -1.4)" filter="${u.url('soft1')}"/>`;
  }
  return s;
}

/** 5 khe mang rất dài, cong nhẹ, khe sau nằm trên gốc vây ngực. */
function gills(): string {
  let dark = '';
  let lite = '';
  for (let i = 0; i < 5; i++) {
    const x = 830 - i * 17;
    const top = topY(x) + 26 + i * 1.5;
    const bot = bellyY(x) + 4 - i * 1.5;
    const mid = (top + bot) / 2;
    dark += `M${x + 3} ${top.toFixed(1)}Q${x - 6} ${mid.toFixed(1)} ${x + 1} ${bot.toFixed(1)}`;
    lite += `M${x + 6} ${(top + 2).toFixed(1)}Q${x - 2.6} ${mid.toFixed(1)} ${x + 4} ${(bot - 1).toFixed(1)}`;
  }
  return (
    `<path d="${lite}" fill="none" stroke="#dbe7e6" stroke-opacity="0.4" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="${dark}" fill="none" stroke="#08121a" stroke-opacity="0.75" stroke-width="2.4" stroke-linecap="round"/>`
  );
}

const body = standardBody(u, BODY, {
  dorsal: BACK,
  flank: FLANK,
  belly: BELLY,
  outlineColor: EDGE,
  scales: false,
  flankAt: 0.55,
  rimOpacity: 0.75,
});

const theEye = eye(u, 'eye', {
  cx: 905,
  cy: 186,
  r: 4.6,
  iris: ['#6c7a72', '#232c2a'],
  pupil: 'small',
  socket: '#1a2a34',
  look: [0.3, 0],
});

const finGrad = (id: string, a: string, b: string, c: string, x1: number, y1: number, x2: number, y2: number) =>
  linear(u(id), [[0, a], [0.55, b], [1, c]], { user: true, x1, y1, x2, y2 });

const defs = joinDefs(
  body,
  theEye,
  organicTexture(u('skin'), { freq: 0.35, octaves: 2, strength: 0.1, seed: 12 }),
  blurFilter(u('soft1'), 1.0),
  blurFilter(u('soft2'), 2.2),
  blurFilter(u('soft5'), 5),
  linear(u('belly'), [
    [0, BELLY],
    [0.6, '#d6e1e4'],
    [1, '#b8c8cd'],
  ], { user: true, x1: 0, y1: 200, x2: 0, y2: 262 }),
  radial(u('dusk'), [
    [0, '#3b3a33', 0.55],
    [1, '#3b3a33', 0],
  ], { cx: 0.5, cy: 0.5, r: 0.5 }),
  finGrad('caudal', '#14222f', '#1f3445', '#33505f', 0, 36, 0, 296),
  finGrad('dorsal', '#22394a', BACK, '#132331', 0, 36, 0, 128),
  finGrad('low', '#41606d', '#748d96', '#a3b7bd', 0, 205, 0, 292),
  finGrad('pect', '#1d3242', '#2a4555', '#3a5a68', 796, 230, 640, 370),
  radial(u('pectGloss'), [
    [0, '#ffffff', 0.2],
    [1, '#ffffff', 0],
  ], { cx: 0.7, cy: 0.2, r: 0.55 }),
  `<clipPath id="${u('caudalClip')}"><path d="${CAUDAL}"/></clipPath>`,
  `<clipPath id="${u('d1Clip')}"><path d="${DORSAL1}"/></clipPath>`,
  `<clipPath id="${u('d2Clip')}"><path d="${DORSAL2}"/></clipPath>`,
  `<clipPath id="${u('pectClip')}"><path d="${PECT_NEAR}"/></clipPath>`,
  `<clipPath id="${u('pectFarClip')}"><path d="${PECT_FAR}"/></clipPath>`,
  `<clipPath id="${u('dorsalArea')}"><path d="M150 0L990 0L990 ${bellyY(978).toFixed(1)}${BELLYLINE.slice().reverse().map(([x, y]) => `L${x} ${y}`).join('')}L150 192Z"/></clipPath>`,
  // cá dẫn đường nhỏ (chỉ thẻ)
  linear(u('pilot'), [
    [0, '#c9a24a'],
    [0.5, '#e8d38a'],
    [1, '#f4efd8'],
  ]),
);

/** Sợi mờ toả từ gốc vây (sụn vây nhìn qua da – cá sụn không có tia vây xương). */
function striae(base: [number, number][], tips: [number, number][]): string {
  return base
    .map((b, i) => {
      const t = tips[i];
      const mx = (b[0] + t[0]) / 2 + (t[1] - b[1]) * 0.05;
      const my = (b[1] + t[1]) / 2 - (t[0] - b[0]) * 0.05;
      return `M${b[0]} ${b[1]}Q${mx.toFixed(1)} ${my.toFixed(1)} ${t[0]} ${t[1]}`;
    })
    .join('');
}

// ---------- Lớp ----------
const caudalSvg =
  `<path d="${CAUDAL}" fill="${u.url('caudal')}"/>` +
  `<g clip-path="${u.url('caudalClip')}">` +
  `<path d="${striae(
    [[190, 160], [186, 166], [180, 172], [176, 180], [180, 190], [186, 198], [192, 204]],
    [[58, 44], [74, 84], [92, 130], [104, 170], [100, 222], [94, 260], [90, 286]],
  )}" fill="none" stroke="#0e1a22" stroke-opacity="0.14" stroke-width="1"/>` +
  // sống thùy trên sáng nhẹ
  `<path d="M192 158C160 140 122 104 64 42" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2.4"/>` +
  `<g fill="${SPOT}" fill-opacity="0.78">${finSpots(31, { x: 60, y: 46, w: 135, h: 240 }, 46, 1.0, 1.8, 9)}</g>` +
  // mép sau thẫm
  `<path d="M50 41C54 74 72 120 98 160C104 170 108 178 108 186C102 214 94 252 86 284" fill="none" stroke="#0c1820" stroke-opacity="0.45" stroke-width="4" filter="${u.url('soft1')}"/>` +
  `</g>` +
  `<path d="${CAUDAL}" fill="none" stroke="${EDGE}" stroke-width="1.4" stroke-opacity="0.55" stroke-linejoin="round"/>`;

function dorsalFin(d: string, clipId: string, spots: string, rays: string, lead: string): string {
  return (
    `<path d="${d}" fill="${u.url('dorsal')}"/>` +
    `<g clip-path="${u.url(clipId)}">` +
    `<path d="${rays}" fill="none" stroke="#0e1a22" stroke-opacity="0.14" stroke-width="1"/>` +
    `<g fill="${SPOT}" fill-opacity="0.8">${spots}</g>` +
    `</g>` +
    `<path d="${lead}" fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1.8" stroke-linecap="round"/>` +
    `<path d="${d}" fill="none" stroke="${EDGE}" stroke-width="1.4" stroke-opacity="0.55" stroke-linejoin="round"/>`
  );
}

const dorsal1Svg = dorsalFin(
  DORSAL1,
  'd1Clip',
  finSpots(53, { x: 372, y: 40, w: 130, h: 82 }, 26, 1.4, 2.4, 11),
  striae([[496, 110], [470, 112], [446, 114], [420, 116], [396, 118]], [[446, 52], [428, 42], [412, 40], [402, 62], [380, 108]]),
  'M500 104C482 84 460 58 440 46C426 37 410 36 404 42',
);
const dorsal2Svg = dorsalFin(
  DORSAL2,
  'd2Clip',
  finSpots(59, { x: 212, y: 112, w: 60, h: 44 }, 9, 1.0, 1.6, 7),
  striae([[262, 150], [248, 152], [234, 154]], [[242, 120], [232, 116], [226, 136]]),
  'M268 143C259 132 249 122 241 116',
);

function lowFin(d: string, rays: string): string {
  return (
    `<path d="${d}" fill="${u.url('low')}"/>` +
    `<path d="${rays}" fill="none" stroke="#0e1a22" stroke-opacity="0.12" stroke-width="0.9"/>` +
    `<path d="${d}" fill="none" stroke="${EDGE}" stroke-width="1.2" stroke-opacity="0.5" stroke-linejoin="round"/>`
  );
}
const pelvicSvg = lowFin(PELVIC, striae([[430, 248], [414, 248], [398, 248]], [[408, 280], [400, 284], [396, 268]]));
const analSvg = lowFin(ANAL, striae([[254, 218], [242, 216], [230, 214]], [[240, 242], [234, 244], [231, 232]]));

const pat = checkerboard();

const bodySvg =
  `<g filter="${u.url('skin')}">` +
  body.base +
  `<g clip-path="${u.url('bodyClip')}">` +
  // ánh nâu sẫm giữa thân (thấy rõ ở ref1)
  `<ellipse cx="560" cy="170" rx="230" ry="60" fill="${u.url('dusk')}"/>` +
  // dải thẫm ngay trên ranh giới bụng
  `<path d="${smoothPath(BELLYLINE.slice().reverse().map(([x, y]) => [x, y - 3] as [number, number]))}" fill="none" stroke="#162630" stroke-opacity="0.4" stroke-width="10" filter="${u.url('soft5')}"/>` +
  // bụng trắng
  `<path d="${BELLY_PATH}" fill="${u.url('belly')}" filter="${u.url('soft2')}"/>` +
  // bóng dưới đầu dẹt
  `<path d="M975 200C940 210 900 220 860 232L860 260L975 260Z" fill="#9fb2b8" fill-opacity="0.3" filter="${u.url('soft5')}"/>` +
  `</g>` +
  `</g>` +
  body.overlay;

const patternSvg =
  `<g clip-path="${u.url('bodyClip')}"><g clip-path="${u.url('dorsalArea')}">` +
  // vạch ngang nhạt (ô lưới)
  `<path d="${pat.hlines}" fill="none" stroke="${LINE}" stroke-opacity="0.13" stroke-width="1.1"/>` +
  // vạch dọc kem
  `<path d="${pat.stripes}" fill="none" stroke="${LINE}" stroke-opacity="0.4" stroke-width="1.6" stroke-linecap="round"/>` +
  // chấm trắng mỗi ô (quầng mờ + lõi sắc)
  `<g fill="${SPOT}" fill-opacity="0.3" filter="${u.url('soft1')}">${pat.spots}</g>` +
  `<g fill="${SPOT}" fill-opacity="0.92">${pat.spots}</g>` +
  // chấm đầu
  `<g fill="${SPOT}" fill-opacity="0.88">${headSpots()}</g>` +
  `</g></g>` +
  `<g clip-path="${u.url('bodyClip')}">${ridges()}</g>`;

const faceSvg =
  gills() +
  // miệng ngang rất rộng ở MÚT mõm: khe miệng tối + môi trên/dưới
  `<path d="M980 182Q952 191 911 203Q952 196 980 188Z" fill="#0b141b" fill-opacity="0.85"/>` +
  `<path d="M980 182Q952 190 910 202" fill="none" stroke="#0a1218" stroke-opacity="0.8" stroke-width="1.6" stroke-linecap="round"/>` +
  `<path d="M978 179Q950 187 914 199" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.4"/>` +
  `<path d="M979 191Q952 198 914 205" fill="none" stroke="#f2f6f4" stroke-opacity="0.55" stroke-width="1.6"/>` +
  // khóe miệng
  `<path d="M913 202Q906 204 902 210" fill="none" stroke="#0a1218" stroke-opacity="0.45" stroke-width="1.2" stroke-linecap="round"/>` +
  // lỗ mũi + râu ngắn ở mép mõm
  `<ellipse cx="966" cy="177" rx="3.4" ry="1.4" transform="rotate(-20 966 177)" fill="#0b141b" fill-opacity="0.7"/>` +
  `<path d="M963 179Q962 183 958 185" fill="none" stroke="#0b141b" stroke-opacity="0.5" stroke-width="1" stroke-linecap="round"/>` +
  // lỗ thở (spiracle) sau mắt
  `<ellipse cx="886" cy="180" rx="2" ry="1.3" fill="#0b141b" fill-opacity="0.6"/>` +
  // mép đầu dẹt: đường gờ sáng chạy từ mõm qua trên mắt
  `<path d="M968 166Q940 168 900 172Q870 174 846 170" fill="none" stroke="#ffffff" stroke-opacity="0.14" stroke-width="2.4" filter="${u.url('soft1')}"/>` +
  // gờ cuống đuôi (keel)
  `<path d="M262 190Q214 186 166 183" fill="none" stroke="${LINE}" stroke-opacity="0.45" stroke-width="2"/>`;

const pectFarSvg =
  `<path d="${PECT_FAR}" fill="#1c2f3c"/>` +
  `<g clip-path="${u.url('pectFarClip')}"><g fill="${SPOT}" fill-opacity="0.45">${finSpots(67, { x: 736, y: 236, w: 72, h: 90 }, 14, 1.0, 1.6, 9)}</g></g>` +
  `<path d="${PECT_FAR}" fill="none" stroke="${EDGE}" stroke-width="1.2" stroke-opacity="0.5"/>`;

const pectNearSvg =
  `<path d="${PECT_NEAR}" fill="${u.url('pect')}"/>` +
  `<g clip-path="${u.url('pectClip')}">` +
  `<path d="${striae(
    [[790, 232], [770, 236], [748, 240], [726, 244], [704, 248]],
    [[700, 340], [660, 364], [630, 372], [622, 368], [646, 330]],
  )}" fill="none" stroke="#0e1a22" stroke-opacity="0.13" stroke-width="1"/>` +
  `<g fill="${SPOT}" fill-opacity="0.85">${finSpots(71, { x: 612, y: 228, w: 186, h: 148 }, 70, 1.2, 2.3, 10)}</g>` +
  `<path d="${PECT_NEAR}" fill="${u.url('pectGloss')}"/>` +
  // mép sau sáng nhẹ
  `<path d="M615 363C644 339 668 305 680 277C686 265 690 257 692 250" fill="none" stroke="#b9cbd0" stroke-opacity="0.4" stroke-width="2.4"/>` +
  `</g>` +
  `<path d="${PECT_NEAR_LEAD}" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1.6"/>` +
  `<path d="${PECT_NEAR}" fill="none" stroke="${EDGE}" stroke-width="1.4" stroke-opacity="0.55" stroke-linejoin="round"/>`;

/** Cá dẫn đường nhỏ (cá khế vàng non) bơi theo dưới bụng – chỉ trên thẻ Sổ tay. */
function pilotFish(x: number, y: number, s: number, tilt: number): string {
  const body = `M${x + 14 * s} ${y}C${x + 10 * s} ${y - 5 * s} ${x - 4 * s} ${y - 6 * s} ${x - 10 * s} ${y - 1.5 * s}L${x - 16 * s} ${y - 6 * s}L${x - 15 * s} ${y}L${x - 16 * s} ${y + 6 * s}L${x - 10 * s} ${y + 1.5 * s}C${x - 4 * s} ${y + 5 * s} ${x + 10 * s} ${y + 4 * s} ${x + 14 * s} ${y}Z`;
  let bars = '';
  for (let i = 0; i < 4; i++) {
    const bx = x + 8 * s - i * 5 * s;
    bars += `M${bx} ${y - 4.5 * s}L${bx - 0.6 * s} ${y + 4 * s}`;
  }
  return (
    `<g transform="rotate(${tilt} ${x} ${y})">` +
    `<path d="${body}" fill="${u.url('pilot')}" stroke="#6b5420" stroke-opacity="0.5" stroke-width="0.6"/>` +
    `<path d="${bars}" stroke="#2a2a26" stroke-opacity="0.55" stroke-width="${(1.6 * s).toFixed(2)}" stroke-linecap="round"/>` +
    `<circle cx="${x + 10 * s}" cy="${y - 1 * s}" r="${1.3 * s}" fill="#0b0b0b"/>` +
    `<circle cx="${x + 10.3 * s}" cy="${y - 1.4 * s}" r="${0.45 * s}" fill="#ffffff"/>` +
    `</g>`
  );
}
const followersSvg =
  pilotFish(560, 286, 1.1, -3) +
  pilotFish(518, 298, 1.0, 2) +
  pilotFish(586, 312, 0.95, -1) +
  pilotFish(476, 284, 0.9, 4) +
  pilotFish(536, 324, 0.85, 0);


const art: CreatureArt = {
  id: 'ca_nham_voi',
  viewBox: [1024, 400],
  lengthUnits: 925,
  spineY: 180,
  animation: 'fish',
  // cá khổng lồ bơi rất chậm, uốn thân vừa phải (biên độ chủ yếu ở đuôi)
  cycleHz: 0.32,
  bendAmp: 30,
  // theo công thức sizeCm=1800 ra ~930px (quá cỡ màn hình); 520px vẫn "to hơn mọi loài khác" nhưng
  // nằm gọn trong khung nhìn để người chơi thấy được toàn bộ bàn cờ chấm khi chụp ảnh.
  displayLengthPx: 520,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'pectoralFar',
      role: 'fin',
      z: 'back',
      pivot: [790, 236],
      anim: { type: 'rotate', amp: 0.02, speed: 0.5, phase: 1.3 },
      svg: pectFarSvg,
    },
    { name: 'caudal', role: 'tail', svg: caudalSvg },
    { name: 'dorsal2', role: 'detail', svg: dorsal2Svg },
    { name: 'anal', role: 'detail', svg: analSvg },
    { name: 'pelvic', role: 'detail', svg: pelvicSvg },
    { name: 'dorsal1', role: 'detail', svg: dorsal1Svg },
    { name: 'body', role: 'body', svg: bodySvg },
    { name: 'pattern', role: 'pattern', svg: patternSvg },
    { name: 'face', role: 'detail', svg: faceSvg },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    {
      name: 'pectoralNear',
      role: 'fin',
      z: 'front',
      pivot: [770, 236],
      anim: { type: 'rotate', amp: 0.025, speed: 0.5 },
      svg: pectNearSvg,
    },
    {
      name: 'followers',
      role: 'detail',
      bend: false,
      z: 'back',
      cardOnly: true,
      pivot: [530, 300],
      anim: { type: 'none', amp: 0 },
      svg: followersSvg,
    },
  ],
};

export default art;
