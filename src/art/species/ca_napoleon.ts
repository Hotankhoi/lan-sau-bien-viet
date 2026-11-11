/**
 * Cá Napoleon (cá mó đầu khum) – Cheilinus undulatus
 * Đặc điểm nhận dạng: cá khổng lồ thân rất dày; bướu trán to (con trưởng thành), môi dày mọng;
 * thân xanh lục – xanh lam ô liu, mỗi vảy có vạch sẫm dọc nhỏ tạo vân lưới gợn sóng;
 * đầu phủ đường mê cung xanh lam viền vàng cam như hình xăm, hai vạch sẫm chéo sau mắt;
 * vây lưng & hậu môn dài, thùy sau tròn; vây đuôi tròn mép sáng; vây ngực lớn như quạt.
 * Bơi chậm uy nghi, chủ yếu lướt bằng vây ngực.
 */
import type { CreatureArt } from '../contract';
import {
  makeIds,
  standardBody,
  eye,
  finRays,
  linear,
  radial,
  blurFilter,
  scatterSpots,
  smoothPath,
  joinDefs,
  rng,
  clip,
} from '../style-bible';

const u = makeIds('ca_napoleon');

const INK = '#163a36';
const DASH = '#1b3a32';
const PALE = '#d8f2e2';
const BLUE_LINE = '#2a8ad8';
const GOLD_LINE = '#e3a634';

// ---------- Đường viền thân ----------
/** Đường lưng: cuống đuôi → lưng → bướu trán → mặt dốc → môi trên */
const TOP: [number, number][] = [
  [132, 130], [154, 122], [184, 108], [222, 92], [268, 77], [322, 65], [380, 56], [432, 50],
  [462, 45], [482, 36], [502, 25], [522, 18], [540, 16], [555, 21], [564, 33], [567, 48],
  [568, 63], [573, 78], [582, 97], [591, 117], [598, 133], [603, 142],
  // môi trên dày (thuộc khối đầu)
  [610, 149], [615.5, 159], [615, 169.5], [608.5, 176.5], [603, 179.3],
];
/** Đường bụng: dưới môi → cằm → họng → bụng → cuống đuôi */
const BOTTOM: [number, number][] = [
  // môi dưới
  [603, 180.8], [609.5, 184], [612.5, 192], [607.5, 201], [596, 207], [578, 216], [552, 228], [518, 244], [474, 256], [424, 264], [376, 263],
  [328, 257], [280, 246], [232, 231], [190, 214], [158, 201], [132, 192],
];

const BODY = smoothPath(TOP) + smoothPath(BOTTOM).replace(/^M/, 'L') + 'C126 172 126 146 132 126Z';

function interp(pts: [number, number][], x: number): number {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if ((x >= x1 && x <= x2) || (x <= x1 && x >= x2)) return y1 + ((x - x1) / (x2 - x1 || 1)) * (y2 - y1);
  }
  return pts[pts.length - 1][1];
}
const backY = (x: number) => interp(TOP, x);
const bellyY = (x: number) => interp(BOTTOM, x);

const EYE: [number, number] = [522, 106];

// ---------- Vạch vảy dọc (vân lưới) ----------
/** Mỗi vảy một vạch sẫm dọc ngắn hơi lượn; các cột so le → vân lưới gợn sóng. */
function scaleDashes(x0: number, x1: number, step: number, rows: number, seed: number): { dark: string; pale: string } {
  const r = rng(seed);
  let dark = '';
  let pale = '';
  let col = 0;
  for (let x = x0; x <= x1; x += step, col++) {
    const top = backY(x) + 2;
    const bot = bellyY(x) - 2;
    const span = Math.max(1, bot - top);
    const rh = span / rows;
    const off = col % 2 ? rh / 2 : 0;
    for (let j = 0; j < rows + 1; j++) {
      const cy = top + off + j * rh;
      if (cy < top || cy > bot) continue;
      const h = rh * (0.78 + r() * 0.12);
      const bow = (col % 2 ? 1 : -1) * (0.9 + r() * 0.5);
      const jx = x + (r() - 0.5) * 1.2;
      dark += `M${jx.toFixed(1)} ${(cy - h / 2).toFixed(1)}q${bow.toFixed(1)} ${(h / 2).toFixed(1)} 0 ${h.toFixed(1)}`;
      pale += `M${(jx + 2.1).toFixed(1)} ${(cy - h / 2 + 0.6).toFixed(1)}q${bow.toFixed(1)} ${(h / 2).toFixed(1)} 0 ${(h - 1.2).toFixed(1)}`;
    }
  }
  return { dark, pale };
}
const DASHES = scaleDashes(142, 500, 7.8, 17, 17);

/** Vạch lượn trong vùng chữ nhật (cho vây đuôi / vây lưng). */
function boxDashes(x0: number, x1: number, y0: number, y1: number, step: number, rh: number, seed: number): string {
  const r = rng(seed);
  let d = '';
  let col = 0;
  for (let x = x0; x <= x1; x += step, col++) {
    const off = col % 2 ? rh / 2 : 0;
    for (let y = y0 + off; y <= y1; y += rh) {
      const h = rh * 0.62;
      const bow = (col % 2 ? 1 : -1) * (0.8 + r() * 0.5);
      d += `M${x.toFixed(1)} ${(y - h / 2).toFixed(1)}q${bow.toFixed(1)} ${(h / 2).toFixed(1)} 0 ${h.toFixed(1)}`;
    }
  }
  return d;
}

// ---------- Hoa văn "hình xăm" mê cung trên đầu ----------
/**
 * Mê cung tất định: các "con giun" bò từ hạt giống rải lưới, không cắt nhau (lưới chiếm chỗ),
 * hướng ban đầu tỏa ra từ mắt → đường ngoằn ngoèo kín mặt như hình xăm.
 */
function headMaze(seed: number): { main: string; fine: string } {
  const r = rng(seed);
  const CELL = 2.2;
  const occ = new Map<string, number>();
  const key = (x: number, y: number) => `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;
  /** ô (và 8 ô kề) chưa bị con giun khác chiếm → các đường giữ khoảng cách đều */
  const free = (x: number, y: number, id: number) => {
    const cx = Math.floor(x / CELL);
    const cy = Math.floor(y / CELL);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const o = occ.get(`${cx + dx},${cy + dy}`);
        if (o !== undefined && o !== id) return false;
      }
    return true;
  };
  const inHead = (x: number, y: number) =>
    x > 488 && x < 614 && y > backY(x) + 16 && y < bellyY(x) - 3 && Math.hypot(x - EYE[0], y - EYE[1]) > 11.5;
  const worms: string[] = [];
  const seeds: [number, number][] = [];
  // vòng tia quanh mắt trước, rồi lưới hạt giống so le
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2;
    seeds.push([EYE[0] + Math.cos(a) * 13, EYE[1] + Math.sin(a) * 13]);
  }
  for (let gy = 30; gy < 260; gy += 5.5) {
    for (let gx = 490; gx < 614; gx += 5.5) {
      seeds.push([gx + (r() - 0.5) * 5, gy + (r() - 0.5) * 5]);
    }
  }
  let wid = 0;
  for (const [sx, sy] of seeds) {
    let x = sx;
    let y = sy;
    wid++;
    if (!inHead(x, y) || !free(x, y, wid)) continue;
    let ang = Math.atan2(y - EYE[1], x - EYE[0]) + (r() - 0.5) * 0.7;
    let curv = (r() - 0.5) * 0.3;
    const pts: [number, number][] = [[x, y]];
    occ.set(key(x, y), wid);
    const steps = 18 + Math.floor(r() * 36);
    for (let st = 0; st < steps; st++) {
      curv = Math.max(-0.32, Math.min(0.32, curv * 0.86 + (r() - 0.5) * 0.3));
      // kéo nhẹ về hướng tỏa ra từ mắt → đường uốn lượn chứ không cuộn tròn
      const target = Math.atan2(y - EYE[1], x - EYE[0]);
      const diff = Math.atan2(Math.sin(target - ang), Math.cos(target - ang));
      ang += diff * 0.14;
      let moved = false;
      for (const tryTurn of [0, 0.55, -0.55, 1.1, -1.1]) {
        const na = ang + curv + tryTurn * (curv >= 0 ? 1 : -1);
        const nx = x + Math.cos(na) * 2.4;
        const ny = y + Math.sin(na) * 2.4;
        const k2 = key(nx, ny);
        if (inHead(nx, ny) && free(nx, ny, wid)) {
          x = nx;
          y = ny;
          ang = na;
          if (tryTurn !== 0) curv = -curv * 0.5;
          occ.set(k2, wid);
          pts.push([x, y]);
          moved = true;
          break;
        }
      }
      if (!moved) break;
    }
    if (pts.length > 2) worms.push(smoothPath(pts, false, 0.5));
  }
  // mê cung mảnh sẫm trên má sau mắt / nắp mang
  const fine: string[] = [];
  for (let k = 0; k < 46; k++) {
    let x = 478 + r() * 50;
    let y = 120 + r() * 120;
    if (!(y > backY(x) + 40 && y < bellyY(x) - 6)) continue;
    let ang = r() * Math.PI * 2;
    const pts: [number, number][] = [[x, y]];
    for (let s = 0; s < 9 + Math.floor(r() * 8); s++) {
      ang += (r() - 0.5) * 1.6;
      x += Math.cos(ang) * 2.4;
      y += Math.sin(ang) * 2.4;
      if (y > bellyY(x) - 4 || x < 470) break;
      pts.push([x, y]);
    }
    if (pts.length > 3) fine.push(smoothPath(pts, false, 0.5));
  }
  return { main: worms.join(''), fine: fine.join('') };
}
const MAZE = headMaze(71);

// ---------- Vây lưng dài: phần gai thấp phía trước, thùy mềm tròn phía sau ----------
function dorsalFin(): { d: string; edge: string; rays: string; clipD: string } {
  const top: [number, number][] = [];
  const base: [number, number][] = [];
  const x0 = 468;
  const x1 = 140;
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    let h: number;
    if (t < 0.46) h = (8 + (i % 2 === 0 ? 1.4 : -0.4) + t * 4) * Math.min(1, 0.25 + t * 12);
    else if (t < 0.8) {
      const e = (t - 0.46) / 0.34;
      h = 10 + 15 * (e * e * (3 - 2 * e));
    } else h = 25 * Math.sqrt(Math.max(0, 1 - ((t - 0.8) / 0.2) ** 2));
    const lean = t > 0.8 ? 10 * Math.sin((Math.PI * (t - 0.8)) / 0.2) : 0; // thùy sau hơi tràn về phía đuôi
    const y = backY(x);
    top.push([x - lean, y - h]);
    base.push([x, y + 9]);
  }
  const topD = smoothPath(top, false, 0.35);
  const d = topD + [...base].reverse().map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join('') + 'Z';
  const rays = finRays(
    base.filter((_, i) => i % 2 === 0 && i < n).map(([x, y]) => [x, y - 8] as [number, number]),
    top.filter((_, i) => i % 2 === 0 && i < n),
    { color: '#cfe9dc', opacity: 0.3, width: 0.8, bend: 0.03 },
  );
  return { d, edge: topD, rays, clipD: d };
}

// ---------- Vây hậu môn dài, thùy sau tròn ----------
function analFin(): { d: string; edge: string; rays: string } {
  const bot: [number, number][] = [];
  const base: [number, number][] = [];
  const x0 = 336;
  const x1 = 144;
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    let h: number;
    if (t < 0.72) {
      const e = t / 0.72;
      h = 5 + 21 * (e * e * (3 - 2 * e));
    } else h = 26 * Math.sqrt(Math.max(0, 1 - ((t - 0.72) / 0.28) ** 2));
    const lean = t > 0.72 ? 9 * Math.sin((Math.PI * (t - 0.72)) / 0.28) : 0;
    const y = bellyY(x);
    bot.push([x - lean - h * 0.15, y + h]);
    base.push([x, y - 8]);
  }
  const edge = smoothPath(bot, false, 0.4);
  const d = edge + [...base].reverse().map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join('') + 'Z';
  const rays = finRays(
    base.filter((_, i) => i % 2 === 0 && i < n).map(([x, y]) => [x, y + 7] as [number, number]),
    bot.filter((_, i) => i % 2 === 0 && i < n),
    { color: '#cfe9dc', opacity: 0.3, width: 0.8, bend: 0.03 },
  );
  return { d, edge, rays };
}

const DORSAL = dorsalFin();
const ANAL = analFin();

// ---------- Đuôi tròn, mép sáng ----------
const CAUDAL =
  'M142 130C118 119 90 101 62 88C44 90 31 108 26 130C22 150 22 170 26 190C31 212 44 230 62 234C90 222 118 204 142 191Z';
const CAUDAL_EDGE = 'M62 88C44 90 31 108 26 130C22 150 22 170 26 190C31 212 44 230 62 234';
const CAUDAL_TIPS: [number, number][] = [
  [60, 90], [47, 97], [37, 108], [30, 121], [26, 135], [24, 149], [23.5, 161], [24, 173], [26, 187], [30, 201], [37, 214], [47, 225], [60, 232],
];

// ---------- Vây ngực lớn tròn như quạt ----------
const PEC_BASE: [number, number] = [476, 196];
const PECTORAL =
  'M478 186C458 170 428 158 406 160C391 165 385 180 388 196C392 211 410 222 434 223C452 223 466 216 476 208C481 202 482 192 478 186Z';
const PEC_TIPS: [number, number][] = [
  [408, 160], [397, 165], [390, 174], [387, 185], [388, 196], [392, 206], [401, 215], [414, 220], [430, 223], [446, 222], [460, 217],
];

// ---------- Vây bụng nhỏ ----------
const PELVIC_BASE: [number, number] = [458, 252];
const PELVIC = 'M462 249C452 263 437 273 418 279C422 269 431 258 444 250C450 246 457 245 462 249Z';

// ---------- Môi dày mọng ----------
const LIP_UP =
  'M556 152C568 138 596 136 612 147C621 156 621 173 609 178.6C594 181 574 180 560 176C552 170 551 160 556 152Z';
const LIP_LO =
  'M562 181.5C580 180.5 600 179.6 611 182C618 190 614 205 597 207.5C582 208 566 203 560 195C557 190 558 184 562 181.5Z';

const body = standardBody(u, BODY, {
  dorsal: '#2a5d53',
  flank: '#4f9c88',
  belly: '#aedcc6',
  outlineColor: INK,
  scales: false,
  flankAt: 0.5,
  rimOpacity: 0.75,
});

const theEye = eye(u, 'eye', {
  cx: EYE[0],
  cy: EYE[1],
  r: 7.6,
  iris: ['#e4ecc4', '#4f7c6a'],
  socket: '#2b6f78',
  look: [0.35, 0.1],
});

/** Vảy lớn: cung tròn so le (mép tự do cong về phía đuôi). */
function bigScales(id: string, color: string, op: number, sw: number): string {
  const H = 12.6;
  const W = 7.4;
  const rx = H * 0.4;
  const arc = (x: number, y: number) => `M${x} ${y}A${rx} ${H / 2} 0 0 0 ${x} ${y + H}`;
  const d = [arc(0, 0), arc(W, 0), arc(W / 2, -H / 2), arc(W / 2, H / 2), arc(W * 1.5, -H / 2), arc(W * 1.5, H / 2)].join('');
  return `<pattern id="${id}" width="${W}" height="${H}" patternUnits="userSpaceOnUse"><path d="${d}" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="${sw}"/></pattern>`;
}

const defs = joinDefs(
  body,
  theEye,
  bigScales(u('scaleDark'), '#0f2a24', 0.14, 0.8),
  bigScales(u('scaleLight'), '#ecfff4', 0.1, 0.7),
  clip(u('caudalClip'), CAUDAL),
  clip(u('dorsalClip'), DORSAL.d),
  clip(u('analClip'), ANAL.d),
  linear(u('finV'), [
    [0, '#3a7064', 0.86],
    [1, '#4f8a7a', 0.9],
  ]),
  linear(u('finA'), [
    [0, '#5c9e8a', 0.85],
    [1, '#3a6f64', 0.88],
  ]),
  radial(
    u('caudalFill'),
    [
      [0, '#5aa08c', 0.92],
      [0.7, '#457f71', 0.88],
      [0.92, '#3c7064', 0.86],
      [1, '#a8e2cc', 0.9],
    ],
    { user: true, cx: 146, cy: 160, r: 124 },
  ),
  radial(
    u('pecFill'),
    [
      [0, '#2c5e54', 0.9],
      [0.45, '#5c9a80', 0.62],
      [0.9, '#8fbf98', 0.55],
      [1, '#577f6a', 0.7],
    ],
    { user: true, cx: PEC_BASE[0], cy: PEC_BASE[1], r: 92 },
  ),
  linear(u('pelvicFill'), [
    [0, '#7fb8a8', 0.85],
    [1, '#3f7568', 0.8],
  ]),
  // đầu ngả xanh lam ngọc
  linear(
    u('headBlue'),
    [
      [0, '#3a9fbf', 0],
      [0.3, '#3a9fbf', 0.5],
      [0.75, '#3c9fc3', 0.72],
      [1, '#45a8c8', 0.8],
    ],
    { user: true, x1: 478, y1: 0, x2: 612, y2: 0 },
  ),
  // bướu ngả ô liu vàng + bóng sáng
  radial(u('humpOlive'), [
    [0, '#a8b46e', 0.55],
    [0.6, '#8aa06a', 0.3],
    [1, '#8aa06a', 0],
  ]),
  radial(u('humpGloss'), [
    [0, '#f6fff0', 0.45],
    [1, '#f6fff0', 0],
  ]),
  linear(u('lip'), [
    [0, '#58b6cc'],
    [0.5, '#3a98b4'],
    [1, '#2a7490'],
  ]),
  radial(u('lipGloss'), [
    [0, '#ffffff', 0.55],
    [1, '#ffffff', 0],
  ]),
  // mặt nạ: vạch vảy chỉ ở thân, mờ dần qua nắp mang; hoa văn xăm chỉ ở đầu
  linear(
    u('bodyMaskGrad'),
    [
      [0, '#ffffff'],
      [1, '#000000'],
    ],
    { user: true, x1: 466, y1: 0, x2: 500, y2: 0 },
  ),
  linear(
    u('headMaskGrad'),
    [
      [0, '#000000'],
      [1, '#ffffff'],
    ],
    { user: true, x1: 478, y1: 0, x2: 504, y2: 0 },
  ),
  `<mask id="${u('bodyMask')}" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="300"><rect width="640" height="300" fill="${u.url('bodyMaskGrad')}"/></mask>`,
  `<mask id="${u('headMask')}" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="300"><rect width="640" height="300" fill="${u.url('headMaskGrad')}"/></mask>`,
  blurFilter(u('soft'), 5),
  blurFilter(u('softS'), 1.6),
);

const art: CreatureArt = {
  id: 'ca_napoleon',
  viewBox: [640, 300],
  lengthUnits: 592,
  spineY: 158,
  animation: 'fish',
  cycleHz: 0.7,
  bendAmp: 9,
  // Cá dài ~2 m nhưng thân rất dày (cao ≈ 0,37 chiều dài) nên trông đồ sộ hơn cá cùng chiều dài;
  // 240px (hơi nhỏ hơn công thức ~259px) vẫn to hơn cá vẹt đầu gù (~202px) và nhỏ hơn cá heo (~260px).
  displayLengthPx: 240,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'caudal',
      role: 'tail',
      svg:
        `<path d="${CAUDAL}" fill="${u.url('caudalFill')}"/>` +
        `<g clip-path="${u.url('caudalClip')}">` +
        `<path d="${boxDashes(34, 138, 86, 236, 7, 9.5, 5)}" fill="none" stroke="${DASH}" stroke-width="1.1" stroke-opacity="0.42" stroke-linecap="round"/>` +
        `</g>` +
        finRays(CAUDAL_TIPS.map((_, i) => [150, 138 + (i * 44) / (CAUDAL_TIPS.length - 1)] as [number, number]), CAUDAL_TIPS, { color: '#d6f2e6', opacity: 0.26, width: 0.8, bend: 0.02 }) +
        `<path d="${CAUDAL_EDGE}" fill="none" stroke="#c9f0de" stroke-width="3.2" stroke-linecap="round" stroke-opacity="0.55"/>` +
        `<path d="${CAUDAL_EDGE}" fill="none" stroke="${INK}" stroke-width="0.9" stroke-opacity="0.4"/>`,
    },
    {
      name: 'dorsal',
      role: 'detail',
      svg:
        `<path d="${DORSAL.d}" fill="${u.url('finV')}"/>` +
        `<g clip-path="${u.url('dorsalClip')}">` +
        `<path d="${boxDashes(136, 300, 60, 112, 6.6, 8.5, 9)}" fill="none" stroke="${DASH}" stroke-width="1" stroke-opacity="0.45" stroke-linecap="round"/>` +
        `<path d="${boxDashes(138.4, 302, 60, 112, 6.6, 8.5, 9)}" fill="none" stroke="${PALE}" stroke-width="0.8" stroke-opacity="0.32" stroke-linecap="round"/>` +
        `</g>` +
        DORSAL.rays +
        `<path d="${DORSAL.edge}" fill="none" stroke="#b9e6d4" stroke-width="1.6" stroke-opacity="0.45"/>`,
    },
    {
      name: 'anal',
      role: 'detail',
      svg:
        `<path d="${ANAL.d}" fill="${u.url('finA')}"/>` +
        `<g clip-path="${u.url('analClip')}">` +
        `<path d="${boxDashes(130, 330, 206, 272, 6.6, 8.5, 13)}" fill="none" stroke="${DASH}" stroke-width="1" stroke-opacity="0.4" stroke-linecap="round"/>` +
        `</g>` +
        ANAL.rays +
        `<path d="${ANAL.edge}" fill="none" stroke="#b9e6d4" stroke-width="1.5" stroke-opacity="0.45"/>`,
    },
    {
      name: 'body',
      role: 'body',
      svg:
        body.base +
        `<g clip-path="${u.url('bodyClip')}">` +
        // vảy lớn (rất mờ) + vạch sẫm dọc mỗi vảy → vân lưới
        `<g mask="${u.url('bodyMask')}">` +
        `<path d="${BODY}" fill="${u.url('scaleDark')}"/>` +
        `<g transform="translate(1.2 0.5)"><path d="${BODY}" fill="${u.url('scaleLight')}"/></g>` +
        `<path d="${DASHES.pale}" fill="none" stroke="${PALE}" stroke-width="0.9" stroke-opacity="0.36" stroke-linecap="round"/>` +
        `<path d="${DASHES.dark}" fill="none" stroke="${DASH}" stroke-width="1.1" stroke-opacity="0.4" stroke-linecap="round"/>` +
        `</g>` +
        // đầu xanh lam ngọc
        `<rect x="470" y="0" width="170" height="300" fill="${u.url('headBlue')}"/>` +
        // bướu trán ô liu + bóng sáng
        `<ellipse cx="524" cy="44" rx="48" ry="32" fill="${u.url('humpOlive')}"/>` +
        `<ellipse cx="530" cy="30" rx="28" ry="11" fill="${u.url('humpGloss')}"/>` +
        // hoa văn xăm mê cung: viền vàng cam + lõi xanh lam
        `<g mask="${u.url('headMask')}">` +
        `<path d="${MAZE.fine}" fill="none" stroke="#2a3f2e" stroke-width="0.8" stroke-opacity="0.38" stroke-linecap="round"/>` +
        `<path d="${MAZE.main}" fill="none" stroke="${GOLD_LINE}" stroke-width="2.7" stroke-opacity="0.78" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="${MAZE.main}" fill="none" stroke="${BLUE_LINE}" stroke-width="1.55" stroke-opacity="0.92" stroke-linecap="round" stroke-linejoin="round"/>` +
        `</g>` +
        // chấm xanh lam trên bướu
        scatterSpots(33, { x: 480, y: 24, w: 80, h: 56 }, { count: 26, rMin: 1.2, rMax: 2.3, color: '#3f9be8', opacity: 0.9 }) +
        // bóng dưới họng / sau má cho khối đầu nặng
        `<ellipse cx="540" cy="232" rx="60" ry="18" fill="#123a3a" opacity="0.18" filter="${u.url('soft')}"/>` +
        `</g>` +
        body.overlay,
    },
    {
      name: 'face',
      role: 'detail',
      svg:
        // rãnh nối bướu với lưng
        `<path d="M474 46C470 60 470 74 474 86" fill="none" stroke="${INK}" stroke-width="1.2" stroke-opacity="0.25" stroke-linecap="round" filter="${u.url('softS')}"/>` +
        // mép nắp mang (viền sẫm + viền sáng)
        `<path d="M488 70C472 104 466 150 472 196C476 224 488 244 504 254" fill="none" stroke="${INK}" stroke-width="2" stroke-opacity="0.45" stroke-linecap="round"/>` +
        `<path d="M492 72C476 106 470 150 476 194C480 222 491 241 507 251" fill="none" stroke="#e8fbf3" stroke-width="1" stroke-opacity="0.28" stroke-linecap="round"/>` +
        // gờ tiền nắp mang
        `<path d="M512 136C504 164 506 196 522 226" fill="none" stroke="${INK}" stroke-width="1.1" stroke-opacity="0.25" stroke-linecap="round"/>` +
        // hai vạch sẫm chéo sau mắt
        `<path d="M513 102C502 97 490 94 478 94" fill="none" stroke="#1d2620" stroke-width="2" stroke-opacity="0.72" stroke-linecap="round"/>` +
        `<path d="M513 112C502 114 490 118 480 124" fill="none" stroke="#1d2620" stroke-width="1.8" stroke-opacity="0.66" stroke-linecap="round"/>` +
        `<path d="M513 104.5C502 100 490 97 479 97M513 114.5C502 116.5 491 120.5 481.5 126.5" fill="none" stroke="${GOLD_LINE}" stroke-width="0.8" stroke-opacity="0.55" stroke-linecap="round"/>` +
        // lỗ mũi
        `<ellipse cx="560" cy="112" rx="1.8" ry="1.3" fill="${INK}" opacity="0.6"/>` +
        `<ellipse cx="565" cy="119" rx="1.3" ry="1" fill="${INK}" opacity="0.5"/>` +
        // mép trước bướu sáng
        `<path d="M542 18C556 22 564 34 566 52" fill="none" stroke="#f2ffe6" stroke-width="1.6" stroke-opacity="0.45" stroke-linecap="round"/>` +
        // khóe miệng lùi sâu vào má
        `<path d="M606 179.5C594 180 578 181 562 182.5C556 183 552 182 549 180" fill="none" stroke="#0f2a2c" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.85"/>` +
        // môi dưới rồi môi trên (môi trên nhô hơn, đè lên) – cắt theo viền thân để liền khối đầu
        `<g clip-path="${u.url('bodyClip')}">` +
        `<path d="${LIP_LO}" fill="${u.url('lip')}" fill-opacity="0.78"/>` +
        `<ellipse cx="594" cy="189" rx="10" ry="3.5" fill="${u.url('lipGloss')}" opacity="0.45"/>` +
        `<path d="${LIP_UP}" fill="${u.url('lip')}" fill-opacity="0.8"/>` +
        // rãnh sau môi trên (nếp gấp thịt)
        `<path d="M560 150C552 158 552 170 560 177" fill="none" stroke="#174b56" stroke-width="1.6" stroke-opacity="0.45" stroke-linecap="round" filter="${u.url('softS')}"/>` +
        `<ellipse cx="590" cy="150" rx="15" ry="5" fill="${u.url('lipGloss')}" opacity="0.5" transform="rotate(14 590 150)"/>` +
        `<path d="M566 145C584 139 602 145 611 156" fill="none" stroke="#d8f6ff" stroke-width="0.9" stroke-opacity="0.3" stroke-linecap="round"/>` +
        `<path d="M562 173C578 177 594 178 607 177" fill="none" stroke="#14424f" stroke-width="0.9" stroke-opacity="0.45" stroke-linecap="round"/>` +
        `</g>` +
        // khe miệng giữa hai môi
        `<path d="M604 180C590 180.6 574 181.4 562 182.4" fill="none" stroke="#0f2a2c" stroke-width="1.4" stroke-linecap="round" stroke-opacity="0.8"/>`,
    },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    {
      name: 'pelvic',
      role: 'fin',
      bend: false,
      z: 'front',
      pivot: PELVIC_BASE,
      anim: { type: 'rotate', amp: 0.08, speed: 1, phase: 1.6 },
      svg:
        `<path d="${PELVIC}" fill="${u.url('pelvicFill')}" stroke="#2c5a50" stroke-width="0.9" stroke-opacity="0.6"/>` +
        finRays(PELVIC_BASE, [[421, 277], [430, 270], [440, 262]], { color: '#e6f6f0', opacity: 0.35, width: 0.7 }),
    },
    {
      name: 'pectoral',
      role: 'fin',
      bend: false,
      z: 'front',
      pivot: PEC_BASE,
      anim: { type: 'rotate', amp: 0.22, speed: 1 },
      svg:
        `<path d="${PECTORAL}" fill="${u.url('pecFill')}" stroke="#2c5146" stroke-width="1.1" stroke-opacity="0.5" stroke-linejoin="round"/>` +
        finRays(PEC_BASE, PEC_TIPS, { color: '#2a4a3c', opacity: 0.28, width: 1.4, bend: 0.05 }) +
        finRays(PEC_BASE, PEC_TIPS, { color: '#eef5c8', opacity: 0.45, width: 0.7, bend: 0.05 }) +
        `<path d="M478 186C458 170 428 158 406 160" fill="none" stroke="#f0f7d0" stroke-width="1" stroke-opacity="0.4" stroke-linecap="round"/>`,
    },
  ],
};

export default art;
