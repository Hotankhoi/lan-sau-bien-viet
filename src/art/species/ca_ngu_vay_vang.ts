/**
 * Cá ngừ vây vàng – Thunnus albacares
 * Đặc điểm nhận dạng: thân hình thoi thủy động (torpedo) chắc khỏe; lưng xanh lam đen ánh kim loại,
 * hông chuyển vàng ánh rồi bạc; một dải vàng ánh kim chạy dọc hông; vây lưng thứ hai và vây hậu môn
 * RẤT DÀI, cong lưỡi liềm, vàng tươi; hàng vây phụ (finlets) vàng viền đen; vây ngực dài mảnh;
 * đuôi lưỡi liềm hẹp cứng, cuống đuôi mảnh có gờ; bụng bạc có các vạch đứt đứng mờ.
 * Tham khảo: references/ca_ngu_vay_vang (ref1 – cá trưởng thành dưới nước là ảnh chính).
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
  joinDefs,
  smoothPath,
  rng,
} from '../style-bible';

const u = makeIds('ca_ngu_vay_vang');

type P = [number, number];
const f = (n: number): string => n.toFixed(1);

/** Toàn bộ hình vẽ trong hệ toạ độ thiết kế (trục thân y≈158), dời lên DY để cân trong viewBox 640×256. */
const DY = -26;
const wrap = (s: string): string => `<g transform="translate(0 ${DY})">${s}</g>`;

const NAVY = '#121b3c';
const BLUE = '#22387a';
const INK = '#141a33';
const GOLD = '#e8c92c';
const YEL = '#f6d41f';
const YEL_L = '#ffe55a';

// ---------- Đường viền thân (mõm bên phải → cuống đuôi bên trái) ----------
const UPPER: P[] = [
  [622, 160], [619, 152], [612, 143], [601, 133], [587, 122.5], [570, 112], [550, 102], [527, 93.5],
  [502, 87], [475, 82], [446, 78.6], [416, 77], [386, 77.4], [356, 80], [326, 84.6], [298, 90.6], [270, 98],
  [242, 106.5], [214, 115.5], [188, 124.5], [164, 132.5], [144, 139], [128, 144], [116, 147.8], [106, 150.6], [99, 152.4],
];
const LOWER: P[] = [
  [99, 163.6], [106, 165.4], [116, 168.2], [128, 172], [144, 177.8], [164, 184.6], [188, 193], [214, 201.5], [242, 209],
  [270, 215.2], [298, 220], [326, 223.2], [356, 224.4], [386, 223.6], [416, 220.6], [446, 215.6], [474, 209],
  [500, 201.8], [524, 194.4], [546, 187.4], [566, 181], [583, 175.6], [597, 171.2], [608, 167.8], [616, 165.4], [622, 163],
];
const BODY = smoothPath([...UPPER, ...LOWER], true, 0.5);

function yAt(pts: P[], x: number): number {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if ((x <= x1 && x >= x2) || (x >= x1 && x <= x2)) {
      if (x1 === x2) return y1;
      return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
    }
  }
  return 158;
}
const topY = (x: number): number => yAt(UPPER, x);
const botY = (x: number): number => yAt(LOWER, x);

// ---------- Đuôi lưỡi liềm hẹp, cứng ----------
const CAUDAL =
  'M106 150C100 128 80 98 30 68C36 75 42 84 48 94C60 116 72 138 86 158' +
  'C72 178 60 200 48 222C42 232 36 241 32 248C80 218 100 188 106 166Z';
const CAUDAL_EDGE = 'M30 68C36 75 42 84 48 94C60 116 72 138 86 158C72 178 60 200 48 222C42 232 36 241 32 248';

// ---------- Vây lưng 2 & vây hậu môn: rất dài, lưỡi liềm vàng tươi ----------
const DORSAL2 =
  'M343 84C339 68 329 56 311 51.5C284 47 238 52 196 62C178 66 162 70 148 74' +
  'C166 71.5 188 69.5 210 69.5C244 70 274 78 292 91Z';
const DORSAL2_LEAD = 'M343 84C339 68 329 56 311 51.5C284 47 238 52 196 62C178 66 162 70 148 74';
const ANAL =
  'M337 223C333 238 323 249 305 253.5C278 258 234 253 192 244C174 240 160 236 148 232' +
  'C166 233 188 235 210 235C244 235 274 229 291 220Z';
const ANAL_LEAD = 'M337 223C333 238 323 249 305 253.5C278 258 234 253 192 244C174 240 160 236 148 232';

// ---------- Vây ngực dài mảnh, vây bụng ----------
const PEC_BASE: P = [520, 160];
const PECTORAL =
  'M524 154C512 150 494 151 474 155C440 162 404 172 364 186C402 178 440 172 476 169C496 167.5 512 167 520 166.5C527 165 528 157 524 154Z';
const PELVIC = 'M508 195C502 202 492 208 478 213C484 206 489 200 492 194Z';

// ---------- Vây lưng 1: gai thấp, thường gập nửa chừng ----------
function dorsal1(): string {
  const n = 12;
  const x0 = 474;
  const x1 = 356;
  const bases: P[] = [];
  const tips: P[] = [];
  let spines = '';
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const bx = x0 + (x1 - x0) * t;
    const by = topY(bx) + 1.2;
    const h = 3 + 22 * Math.pow(Math.max(0, 1 - t), 1.15) * Math.min(1, 0.6 + t * 5);
    const lean = (52 + 14 * t) * (Math.PI / 180);
    const tip: P = [bx - Math.sin(lean) * h, by - Math.cos(lean) * h];
    bases.push([bx, by]);
    tips.push(tip);
    spines += `M${f(bx)} ${f(by)}L${f(tip[0])} ${f(tip[1])}`;
  }
  let d = `M${f(bases[0][0])} ${f(bases[0][1])}L${f(tips[0][0])} ${f(tips[0][1])}`;
  for (let i = 1; i < n; i++) {
    const a = tips[i - 1];
    const b = tips[i];
    d += `Q${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2 + 1.8)} ${f(b[0])} ${f(b[1])}`;
  }
  d += `L${f(bases[n - 1][0] - 6)} ${f(bases[n - 1][1] + 0.6)}`;
  for (let i = n - 1; i >= 0; i--) d += `L${f(bases[i][0])} ${f(bases[i][1] + 2.5)}`;
  d += 'Z';
  return (
    `<path d="${d}" fill="${u.url('dorsal1')}" fill-opacity="0.85"/>` +
    `<path d="${spines}" fill="none" stroke="${INK}" stroke-opacity="0.75" stroke-width="1" stroke-linecap="round"/>` +
    `<path d="${spines}" fill="none" stroke="#e2d47a" stroke-opacity="0.3" stroke-width="0.5" transform="translate(0.6 0)"/>`
  );
}

// ---------- Hàng vây phụ (finlets) vàng viền đen ----------
function finlets(): string {
  let top = '';
  let bot = '';
  let hi = '';
  const one = (x: number, s: number, up: boolean): string => {
    const sg = up ? -1 : 1;
    const by = (up ? topY(x) : botY(x)) - sg * 1.4;
    const bx2 = x - 7 * s;
    const by2 = (up ? topY(bx2) : botY(bx2)) - sg * 1.4;
    const tip: P = [x - 11.5 * s, by + sg * 8 * s];
    const d =
      `M${f(x)} ${f(by)}Q${f(x - 4 * s)} ${f(by + sg * 6.5 * s)} ${f(tip[0])} ${f(tip[1])}` +
      `Q${f(x - 7 * s)} ${f((by + by2) / 2 + sg * 3 * s)} ${f(bx2)} ${f(by2)}Z`;
    hi += `M${f(x - 1)} ${f(by + sg * 1.2 * s)}Q${f(x - 4 * s)} ${f(by + sg * 5.2 * s)} ${f(tip[0] + 2 * s)} ${f(tip[1] - sg * 1.2 * s)}`;
    return `<path d="${d}"/>`;
  };
  const nT = 9;
  for (let i = 0; i < nT; i++) {
    const t = i / (nT - 1);
    top += one(288 - t * 168, 1.05 - t * 0.38, true);
  }
  const nB = 8;
  for (let i = 0; i < nB; i++) {
    const t = i / (nB - 1);
    bot += one(282 - t * 158, 1.0 - t * 0.36, false);
  }
  return (
    `<g fill="${u.url('finlet')}" stroke="#16161c" stroke-opacity="0.9" stroke-width="1.05" stroke-linejoin="round">${top}${bot}</g>` +
    `<path d="${hi}" fill="none" stroke="#fff6b8" stroke-opacity="0.55" stroke-width="0.6" stroke-linecap="round"/>`
  );
}

// ---------- Dải vàng ánh kim dọc hông ----------
function goldBand(): string {
  const upper: P[] = [];
  const lower: P[] = [];
  for (let x = 566; x >= 104; x -= 22) {
    const T = topY(x);
    const B = botY(x);
    const D = B - T;
    const t = (566 - x) / 462;
    const c = T + D * (0.47 + 0.05 * t);
    const head = Math.min(1, 0.25 + (566 - x) / 60);
    const w = (D * (0.16 - 0.07 * t) + 1.4) * head;
    upper.push([x, c - w * 0.55]);
    lower.push([x, c + w * 0.45]);
  }
  const d = smoothPath([...upper, ...lower.reverse()], true, 0.5);
  return (
    // quầng ánh vàng – lục lan lên hông trên (ánh kim ở ref1)
    `<path d="${d}" fill="#b8c24a" opacity="0.32" filter="${u.url('soft4')}" transform="translate(0 -5) scale(1 1)"/>` +
    `<path d="${d}" fill="${u.url('gold')}" opacity="0.8" filter="${u.url('soft')}"/>` +
    `<path d="${d}" fill="${u.url('goldCore')}" opacity="0.9" filter="${u.url('soft1')}" transform="translate(0 -0.5) scale(1 0.995)"/>`
  );
}

// ---------- Vạch đứt đứng mờ trên bụng (chuỗi chấm sáng) ----------
function bellyLines(): string {
  const r = rng(9031);
  let s = '';
  let x = 470;
  while (x > 176) {
    const T = topY(x);
    const B = botY(x);
    const D = B - T;
    const y0 = T + D * (0.64 + r() * 0.04);
    const y1 = B - D * (0.06 + r() * 0.03);
    const lean = -2.5 - r() * 2;
    let y = y0;
    while (y < y1) {
      const len = 2.2 + r() * 3.2;
      const gap = 1.4 + r() * 1.8;
      const tt = (y - y0) / Math.max(1, y1 - y0);
      const cx = x + lean * tt + (r() - 0.5) * 0.8;
      const w = 0.8 + r() * 0.5;
      s += `<rect x="${f(cx - w / 2)}" y="${f(y)}" width="${f(w)}" height="${f(Math.min(len, y1 - y))}" rx="${f(w / 2)}"/>`;
      y += len + gap;
    }
    x -= 12.5 + r() * 2.5;
  }
  return `<g fill="#ffffff" fill-opacity="0.42">${s}</g>`;
}

// ---------- Lốm đốm ánh kim trên lưng ----------
function backMottle(): string {
  const r = rng(5117);
  let s = '';
  for (let i = 0; i < 46; i++) {
    const x = 150 + r() * 440;
    const T = topY(x);
    const D = botY(x) - T;
    const y = T + D * (0.06 + r() * 0.3);
    const rx = 4 + r() * 12;
    const ry = rx * (0.22 + r() * 0.2);
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f((r() - 0.5) * 30)} ${f(x)} ${f(y)})"/>`;
  }
  return `<g fill="#7d9be0" fill-opacity="0.1" filter="${u.url('soft1')}">${s}</g>`;
}

// ---------- Lưng xanh đen kim loại: các dải chồng theo đường lưng (đậm dần lên trên) ----------
function backShade(): string {
  const band = (k: number): string => {
    const lo: P[] = [];
    for (let x = 626; x >= 94; x -= 16) {
      const T = topY(Math.min(622, Math.max(99, x)));
      const D = botY(Math.min(622, Math.max(99, x))) - T;
      lo.push([x, T + D * k]);
    }
    const top: P[] = lo.map(([x]) => [x, topY(Math.min(622, Math.max(99, x))) - 8]);
    return smoothPath([...top.reverse(), ...lo], true, 0.5);
  };
  return (
    `<path d="${band(0.5)}" fill="#1d2f6a" opacity="0.55" filter="${u.url('soft4')}"/>` +
    `<path d="${band(0.36)}" fill="${NAVY}" opacity="0.8" filter="${u.url('soft4')}"/>` +
    `<path d="${band(0.18)}" fill="#0a0f26" opacity="0.85" filter="${u.url('soft')}"/>`
  );
}

// ---------- Đường bên lượn nhẹ, cao gần lưng ----------
function lateralLine(): string {
  const pts: P[] = [];
  for (let x = 532; x >= 108; x -= 18) {
    const T = topY(x);
    const D = botY(x) - T;
    const k = (532 - x) / 424;
    pts.push([x, T + D * (0.2 + 0.26 * k * k) + Math.sin(x * 0.07) * 1.2]);
  }
  const d = smoothPath(pts, false, 0.6);
  return (
    `<path d="${d}" fill="none" stroke="${NAVY}" stroke-opacity="0.4" stroke-width="1.3" transform="translate(0 0.8)"/>` +
    `<path d="${d}" fill="none" stroke="#c9d8ff" stroke-opacity="0.2" stroke-width="0.6" stroke-dasharray="2.6 1.6"/>`
  );
}

// ---------- Defs ----------
const body = standardBody(u, BODY, {
  dorsal: BLUE,
  flank: '#9fb4d8',
  belly: '#f1f4f8',
  outlineColor: INK,
  scales: { size: 4, color: '#ffffff', opacity: 0.08, stroke: 0.4 },
  flankAt: 0.5,
  rimOpacity: 0.75,
});

// overlay riêng: bỏ bóng khối sáng chuẩn (làm lưng nhạt), thay bằng bóng tối nhẹ phía bụng – sau
const overlay = body.overlay.replace(`<path d="${BODY}" fill="${u.url('bodyVol')}"/>`, `<path d="${BODY}" fill="${u.url('vol')}"/>`);

const theEye = eye(u, 'eye', {
  cx: 586,
  cy: 148,
  r: 9.4,
  iris: ['#d8c98a', '#2a2f3a'],
  socket: '#3e4c6e',
  look: [0.25, 0.05],
});

const defs = joinDefs(
  body,
  theEye,
  // ánh lam ngọc kim loại ở rìa giữa lưng và dải vàng
  linear(
    u('sheenBlue'),
    [
      [0, '#4f7fe0', 0],
      [0.5, '#5d8ef0', 0.35],
      [1, '#5d8ef0', 0],
    ],
    { user: true, x1: 0, y1: 118, x2: 0, y2: 150 },
  ),
  // bạc ánh xanh hông dưới
  linear(
    u('silver'),
    [
      [0, '#ffffff', 0],
      [0.3, '#cfe0ff', 0.3],
      [0.6, '#ffffff', 0.12],
      [1, '#ffffff', 0],
    ],
    { user: true, x1: 0, y1: 160, x2: 0, y2: 222 },
  ),
  linear(
    u('gold'),
    [
      [0, '#7fae5a', 0.0],
      [0.18, '#a8bf48', 0.75],
      [0.5, GOLD, 0.95],
      [0.8, '#e6c83a', 0.65],
      [1, '#e4c432', 0],
    ],
    { x1: 0, y1: 0, x2: 0, y2: 1 },
  ),
  linear(
    u('goldCore'),
    [
      [0, '#fff3a0', 0],
      [0.4, '#fff19a', 0.5],
      [0.6, '#f2dc55', 0.4],
      [1, '#f2dc55', 0],
    ],
    { x1: 0, y1: 0, x2: 0, y2: 1 },
  ),
  radial(
    u('cheek'),
    [
      [0, '#e8d8df', 0.5],
      [0.5, '#c6b8d2', 0.25],
      [1, '#c6b8d2', 0],
    ],
    { user: true, cx: 560, cy: 172, r: 44 },
  ),
  linear(
    u('vol'),
    [
      [0, '#000000', 0],
      [0.7, '#000000', 0],
      [1, '#0a1430', 0.22],
    ],
  ),
  radial(u('spec'), [
    [0, '#ffffff', 0.8],
    [1, '#ffffff', 0],
  ]),
  // vây lưng 2 / hậu môn: gốc vàng xỉn → chóp vàng tươi
  linear(
    u('sickleTop'),
    [
      [0, YEL_L],
      [0.45, YEL],
      [0.85, '#d2b21a'],
      [1, '#8d7f2a'],
    ],
    { user: true, x1: 170, y1: 62, x2: 330, y2: 90 },
  ),
  linear(
    u('sickleBot'),
    [
      [0, YEL_L],
      [0.45, YEL],
      [0.85, '#d6b51c'],
      [1, '#a8a24a'],
    ],
    { user: true, x1: 172, y1: 244, x2: 330, y2: 222 },
  ),
  linear(u('finlet'), [
    [0, '#ffe443'],
    [1, '#f0c512'],
  ]),
  linear(u('dorsal1'), [
    [0, '#5b5a3a'],
    [0.6, '#2d3350'],
    [1, '#1b2340'],
  ]),
  linear(
    u('caudal'),
    [
      [0, '#1a2240', 0.97],
      [0.35, '#2b3658', 0.94],
      [0.5, '#3a4560', 0.92],
      [0.65, '#2b3658', 0.94],
      [1, '#1a2240', 0.97],
    ],
    { user: true, x1: 0, y1: 68, x2: 0, y2: 248 },
  ),
  linear(
    u('caudalGold'),
    [
      [0, '#c9b84a', 0],
      [0.6, '#c9b84a', 0.08],
      [1, '#c9b84a', 0.16],
    ],
    { user: true, x1: 30, y1: 0, x2: 104, y2: 0 },
  ),
  linear(
    u('pec'),
    [
      [0, '#1a2440', 0.95],
      [0.6, '#2c3a5e', 0.88],
      [1, '#56648a', 0.8],
    ],
    { x1: 1, y1: 0, x2: 0, y2: 1 },
  ),
  blurFilter(u('soft'), 2.6),
  blurFilter(u('soft1'), 1.2),
  blurFilter(u('soft4'), 5),
);

const art: CreatureArt = {
  id: 'ca_ngu_vay_vang',
  viewBox: [640, 256],
  lengthUnits: 595,
  spineY: 158 + DY,
  animation: 'fish',
  // bơi kiểu thunniform: nhịp nhanh, thân gần như cứng – biên độ nhỏ, dồn về cuống đuôi/đuôi
  cycleHz: 3.2,
  bendAmp: 10,
  // 240 cm → công thức mặc định ~288 px: quá to cho loài bơi đàn (nhiều con cùng màn hình).
  // 200 px vẫn lớn hơn hẳn thợ lặn nhưng đàn 5–8 con không che kín màn hình.
  displayLengthPx: 200,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'caudal',
      role: 'tail',
      svg: wrap(
        `<path d="${CAUDAL}" fill="${u.url('caudal')}"/>` +
          `<path d="${CAUDAL}" fill="${u.url('caudalGold')}"/>` +
          finRays(
            [[100, 152], [96, 153], [92, 155], [92, 161], [96, 163], [100, 164]],
            [[36, 74], [52, 100], [70, 134], [70, 182], [52, 216], [38, 242]],
            { color: '#b9c6e0', opacity: 0.28, width: 0.7, bend: 0.025 },
          ) +
          `<path d="${CAUDAL_EDGE}" fill="none" stroke="${INK}" stroke-opacity="0.7" stroke-width="1.4" stroke-linejoin="round"/>` +
          // mép trước cứng sáng
          `<path d="M104 149C98 128 78 99 32 69.5M104 167C98 188 78 217 34 246.5" fill="none" stroke="#c8d4ee" stroke-opacity="0.4" stroke-width="1"/>`,
      ),
    },
    {
      name: 'dorsal2',
      role: 'detail',
      svg: wrap(
        `<path d="${DORSAL2}" fill="${u.url('sickleTop')}" fill-opacity="0.95" stroke="#6b5a12" stroke-opacity="0.55" stroke-width="0.9" stroke-linejoin="round"/>` +
          finRays(
            [[339, 85], [331, 86.5], [323, 87.5], [315, 88.5], [307, 89.5], [299, 90.5]],
            [[322, 57], [296, 51.5], [262, 52.5], [228, 57.5], [196, 63.5], [170, 68.5]],
            { color: '#8a7414', opacity: 0.35, width: 0.7, bend: 0.06 },
          ) +
          `<path d="${DORSAL2_LEAD}" fill="none" stroke="#fff6b0" stroke-opacity="0.6" stroke-width="0.9" transform="translate(0 1)"/>`,
      ),
    },
    {
      name: 'anal',
      role: 'detail',
      svg: wrap(
        `<path d="${ANAL}" fill="${u.url('sickleBot')}" fill-opacity="0.95" stroke="#6b5a12" stroke-opacity="0.55" stroke-width="0.9" stroke-linejoin="round"/>` +
          finRays(
            [[333, 223], [325, 222.5], [317, 222], [309, 221.5], [301, 220.5], [295, 220]],
            [[318, 250], [292, 255], [258, 254], [226, 249], [196, 243], [172, 237]],
            { color: '#8a7414', opacity: 0.32, width: 0.7, bend: -0.06 },
          ) +
          `<path d="${ANAL_LEAD}" fill="none" stroke="#fff6b0" stroke-opacity="0.45" stroke-width="0.8" transform="translate(0 -1)"/>`,
      ),
    },
    { name: 'dorsal1', role: 'detail', svg: wrap(dorsal1()) },
    { name: 'finlets', role: 'detail', svg: wrap(finlets()) },
    {
      name: 'pelvic',
      role: 'detail',
      svg: wrap(
        `<path d="${PELVIC}" fill="#c9cfdc" fill-opacity="0.8" stroke="${INK}" stroke-opacity="0.4" stroke-width="0.7"/>` +
          finRays([[504, 196], [499, 196], [494, 195.5]], [[484, 210], [482, 211], [481, 212]], { color: '#5a6480', opacity: 0.3, width: 0.5 }),
      ),
    },
    {
      name: 'body',
      role: 'body',
      svg: wrap(
        body.base +
          `<g clip-path="${u.url('bodyClip')}">` +
          `<rect x="0" y="150" width="640" height="80" fill="${u.url('silver')}"/>` +
          bellyLines() +
          backShade() +
          backMottle() +
          `<rect x="0" y="110" width="640" height="45" fill="${u.url('sheenBlue')}"/>` +
          // đỉnh đầu sẫm tới tận mõm
          `<path d="M622 158C606 136 584 118 556 104C566 118 580 132 600 146C610 152 616 156 622 160Z" fill="${NAVY}" opacity="0.55" filter="${u.url('soft')}"/>` +
          goldBand() +
          // ánh hồng – bạc trên má, nắp mang
          `<ellipse cx="560" cy="170" rx="46" ry="26" fill="${u.url('cheek')}"/>` +
          // vệt phản quang bạc dọc thân dưới dải vàng
          `<ellipse cx="380" cy="172" rx="170" ry="7" fill="${u.url('spec')}" opacity="0.5" filter="${u.url('soft')}"/>` +
          // vệt sáng lưng (nắng từ trên)
          `<ellipse cx="440" cy="92" rx="110" ry="6" fill="#9fb8ff" opacity="0.22" filter="${u.url('soft4')}"/>` +
          lateralLine() +
          `</g>` +
          overlay,
      ),
    },
    {
      name: 'keel',
      role: 'detail',
      svg: wrap(
        // gờ ngang lớn ở cuống đuôi
        `<path d="M98 157.2C110 154.6 128 154.4 150 156.6C128 159.8 110 160.4 98 159Z" fill="#141c34" fill-opacity="0.75"/>` +
          `<path d="M100 156.6C114 154.6 130 154.8 146 156" fill="none" stroke="#d9e3ff" stroke-opacity="0.45" stroke-width="0.6"/>` +
          // 2 gờ nhỏ ở gốc đuôi (trong phạm vi cuống)
          `<path d="M100 153.6C103 154.4 106 154.6 110 154.4M100 162.4C103 161.6 106 161.4 110 161.6" fill="none" stroke="#141c34" stroke-opacity="0.45" stroke-width="0.8" stroke-linecap="round"/>`,
      ),
    },
    {
      name: 'face',
      role: 'detail',
      svg: wrap(
        `<g clip-path="${u.url('bodyClip')}">` +
          // mép nắp mang & gờ trước nắp mang
          `<path d="M532 106C518 128 516 160 526 186" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="1.5" stroke-linecap="round"/>` +
          `<path d="M534.5 107C521 129 519 160 529 185" fill="none" stroke="#eef2ff" stroke-opacity="0.45" stroke-width="0.8"/>` +
          `<path d="M556 116C546 132 544 152 550 172" fill="none" stroke="${INK}" stroke-opacity="0.25" stroke-width="1.1" stroke-linecap="round"/>` +
          // rãnh vây ngực (corselet) sau nắp mang
          `<path d="M524 150C506 140 480 136 456 138" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2.4" filter="${u.url('soft1')}"/>` +
          // xương hàm trên
          `<path d="M612 156C606 159 600 161.5 594 164" fill="none" stroke="${INK}" stroke-opacity="0.35" stroke-width="1" stroke-linecap="round"/>` +
          // khe miệng nhỏ
          `<path d="M621 162.6C614 163.4 604 164.6 595 166.2" fill="none" stroke="${INK}" stroke-opacity="0.85" stroke-width="1.1" stroke-linecap="round"/>` +
          `<path d="M619 164.8C611 165.8 603 167 597 168.4" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="0.7" stroke-linecap="round"/>` +
          // lỗ mũi
          `<ellipse cx="606" cy="146" rx="1.5" ry="1" fill="${INK}" fill-opacity="0.6"/>` +
          `<circle cx="601" cy="147" r="0.8" fill="${INK}" fill-opacity="0.45"/>` +
          `</g>`,
      ),
    },
    { name: 'eye', role: 'eye', svg: wrap(theEye.svg) },
    {
      name: 'pectoral',
      role: 'fin',
      z: 'front',
      pivot: [PEC_BASE[0], PEC_BASE[1] + DY],
      anim: { type: 'rotate', amp: 0.06, speed: 0.5 },
      svg: wrap(
        `<path d="${PECTORAL}" fill="${u.url('pec')}" stroke="${INK}" stroke-opacity="0.6" stroke-width="0.9" stroke-linejoin="round"/>` +
          finRays(
            [[522, 156], [521, 158], [520, 160], [520, 162], [520, 164]],
            [[470, 157], [430, 166], [372, 184], [420, 176], [470, 170]],
            { color: '#a9b8d8', opacity: 0.3, width: 0.6, bend: 0.03 },
          ) +
          `<path d="M524 154C512 150 494 151 474 155C440 162 404 172 364 186" fill="none" stroke="#d2dcf4" stroke-opacity="0.4" stroke-width="0.8"/>`,
      ),
    },
  ],
};

export default art;
