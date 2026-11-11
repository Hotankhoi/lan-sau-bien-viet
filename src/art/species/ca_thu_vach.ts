/**
 * Cá thu vạch (cá thu Nhật) – Scomberomorus commerson
 * Đặc điểm nhận dạng: thân thon dài hình thoi dẹt bên; lưng xanh lam thép, hông – bụng bạc ánh;
 * 40+ vạch đứng mảnh lượn sóng xám xanh sẫm trên hông; đường bên gãy xuống đột ngột dưới
 * vây lưng thứ hai; vây lưng 1 gai thấp dài, vây lưng 2 nhỏ nhọn lưỡi liềm + vây hậu môn đối xứng;
 * hàng vây phụ (finlets) trên lưng và dưới bụng; cuống đuôi hẹp có gờ; đuôi chẻ sâu lưỡi liềm;
 * miệng lớn, hàm dưới hơi nhô, răng nhỏ sắc.
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

const u = makeIds('ca_thu_vach');

type P = [number, number];
const f = (n: number): string => n.toFixed(1);
const poly = (pts: P[]): string => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join('') + 'Z';

const BLUE_D = '#1d3350';
const STEEL = '#29466a';
const BAR = '#34465e';
const INK = '#16263a';

// ---------- Đường viền thân (mõm bên phải → cuống đuôi bên trái) ----------
const UPPER: P[] = [
  [622, 135], [613, 127], [599, 117], [581, 107], [559, 98], [533, 90], [501, 84], [466, 80], [431, 78],
  [396, 78], [361, 80], [326, 84], [291, 90], [256, 97], [221, 104], [186, 111], [151, 117], [121, 121],
  [99, 124], [83, 126], [68, 128.5], [55, 133],
];
const LOWER: P[] = [
  [55, 134], [68, 138.5], [83, 140], [99, 142], [121, 145], [151, 150], [186, 157], [221, 164], [256, 171], [291, 176],
  [326, 180], [361, 182], [396, 182], [431, 180], [466, 176], [501, 170], [533, 163], [559, 156], [581, 150],
  [599, 145], [612, 141], [623, 138],
];

const BODY = smoothPath([...UPPER, ...LOWER], true, 0.5);

/** nội suy tuyến tính theo x trên một đường điểm (x giảm dần hoặc tăng dần) */
function yAt(pts: P[], x: number): number {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if ((x <= x1 && x >= x2) || (x >= x1 && x <= x2)) {
      if (x1 === x2) return y1;
      return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
    }
  }
  return 130;
}
const topY = (x: number): number => yAt(UPPER, x);
const botY = (x: number): number => yAt(LOWER, x);

// ---------- Đuôi chẻ sâu lưỡi liềm ----------
const CAUDAL =
  'M86 124C80 108 52 70 20 44C23 50 25 56 27 62C30 88 42 114 62 133' +
  'C42 152 30 178 27 204C25 210 23 216 20 222C52 196 80 158 86 142Z';
const CAUDAL_EDGE = 'M20 44C23 50 25 56 27 62C30 88 42 114 62 133C42 152 30 178 27 204C25 210 23 216 20 222';

// ---------- Vây lưng 2 & vây hậu môn (nhỏ, nhọn, cong lưỡi liềm) ----------
const DORSAL2 = 'M362 82C356 70 342 58 318 50C322 56 326 66 326 76C326 80 325 83 324 86Z';
const ANAL = 'M350 183C344 194 330 204 306 211C311 204 314 196 314 188C314 184 313 181 312 179Z';

// ---------- Vây bụng, vây ngực ----------
const PELVIC = 'M492 170C486 177 478 182 468 185C472 180 476 175 480 170Z';
const PEC_BASE: P = [515, 127];
const PECTORAL = 'M516 122C500 116 482 121 468 132C464 136 460 141 456 148C470 143 488 139 502 136C510 134.5 515 133 517 131C519.5 128.5 519 124.5 516 122Z';

// ---------- Vây lưng 1: gai thấp, dài ----------
function dorsal1(): string {
  const n = 16;
  const x0 = 528;
  const x1 = 372;
  let spines = '';
  const tips: P[] = [];
  const bases: P[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const bx = x0 + (x1 - x0) * t;
    const by = topY(bx) + 1.5;
    const h = 4 + 20 * Math.pow(Math.max(0, 1 - t), 0.9) * Math.min(1, 0.55 + t * 4);
    const lean = (38 + 12 * t) * (Math.PI / 180);
    const tip: P = [bx - Math.sin(lean) * h, by - Math.cos(lean) * h];
    tips.push(tip);
    bases.push([bx, by]);
    spines += `M${f(bx)} ${f(by)}L${f(tip[0])} ${f(tip[1])}`;
  }
  // màng: đi theo đỉnh gai, mép lõm nhẹ giữa hai gai
  let d = `M${f(bases[0][0])} ${f(bases[0][1])}L${f(tips[0][0])} ${f(tips[0][1])}`;
  for (let i = 1; i < n; i++) {
    const a = tips[i - 1];
    const b = tips[i];
    d += `Q${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2 + 2.2)} ${f(b[0])} ${f(b[1])}`;
  }
  d += `L${f(bases[n - 1][0] - 4)} ${f(bases[n - 1][1] + 1)}`;
  for (let i = n - 1; i >= 0; i--) d += `L${f(bases[i][0])} ${f(bases[i][1] + 3)}`;
  d += 'Z';
  return (
    `<path d="${d}" fill="${u.url('dorsal1')}" fill-opacity="0.82"/>` +
    `<path d="${spines}" fill="none" stroke="${INK}" stroke-opacity="0.7" stroke-width="1.1" stroke-linecap="round"/>` +
    `<path d="${spines}" fill="none" stroke="#9fb2c8" stroke-opacity="0.25" stroke-width="0.5" transform="translate(0.6 0)"/>`
  );
}

// ---------- Hàng vây phụ (finlets) ----------
function finlets(): string {
  let top = '';
  let bot = '';
  let edge = '';
  const nT = 9;
  for (let i = 0; i < nT; i++) {
    const t = i / (nT - 1);
    const x = 304 - t * 198;
    const s = 1 - t * 0.35;
    const y = topY(x) + 1.2;
    const yb = topY(x - 9 * s) + 1.2;
    const tip: P = [x - 12 * s, yb - 7.5 * s];
    top += `<path d="${poly([[x, y], [x - 3 * s, y - 4.5 * s], tip, [x - 9 * s, yb + 0.4]])}"/>`;
    edge += `M${f(x - 3 * s)} ${f(y - 4.5 * s)}L${f(tip[0])} ${f(tip[1])}`;
  }
  const nB = 9;
  for (let i = 0; i < nB; i++) {
    const t = i / (nB - 1);
    const x = 298 - t * 192;
    const s = 1 - t * 0.35;
    const y = botY(x) - 1.2;
    const yb = botY(x - 9 * s) - 1.2;
    const tip: P = [x - 12 * s, yb + 7.5 * s];
    bot += `<path d="${poly([[x, y], [x - 3 * s, y + 4.5 * s], tip, [x - 9 * s, yb - 0.4]])}"/>`;
    edge += `M${f(x - 3 * s)} ${f(y + 4.5 * s)}L${f(tip[0])} ${f(tip[1])}`;
  }
  return (
    `<g fill="${u.url('finletTop')}" stroke="${INK}" stroke-opacity="0.45" stroke-width="0.6" stroke-linejoin="round">${top}</g>` +
    `<g fill="${u.url('finletBot')}" stroke="${INK}" stroke-opacity="0.4" stroke-width="0.6" stroke-linejoin="round">${bot}</g>` +
    `<path d="${edge}" fill="none" stroke="#c9d6e4" stroke-opacity="0.4" stroke-width="0.6" stroke-linecap="round"/>`
  );
}

// ---------- Vạch đứng lượn sóng trên hông ----------
function bars(): string {
  const r = rng(2401);
  let main = '';
  let faint = '';
  let x = 474;
  while (x > 92) {
    const T = topY(x);
    const B = botY(x);
    const depth = B - T;
    const tt = (474 - x) / 382; // 0 = sau đầu → 1 = cuống đuôi
    const yTop = T + depth * (0.06 + (r() - 0.5) * 0.04);
    const reach = 0.56 + 0.26 * tt + (r() - 0.5) * 0.14; // về phía đuôi vạch dài hơn
    const yBot = T + depth * Math.min(0.88, reach);
    const L = yBot - yTop;
    const waves = 1.3 + r() * 1.2;
    const ph = r() * Math.PI * 2;
    const amp = 0.5 + r() * 0.75;
    const lean = -1 - r() * 2.5; // chân vạch hơi lệch về phía đuôi
    const hw = (0.7 + r() * 0.45) * (1 - tt * 0.25);
    // vạch phía trước: đứt đoạn thành chấm / gạch ngắn
    const segs: [number, number][] =
      tt < 0.18 ? [[0, 0.3 + r() * 0.15], [0.45 + r() * 0.1, 0.72 + r() * 0.2]] : r() < 0.18 ? [[0, 0.45 + r() * 0.2], [0.7, 1]] : [[0, 1]];
    for (const [s0, s1] of segs) {
      const left: P[] = [];
      const right: P[] = [];
      const N = 10;
      for (let k = 0; k <= N; k++) {
        const s = s0 + ((s1 - s0) * k) / N;
        const y = yTop + L * s;
        const cx = x + lean * s + amp * Math.sin(s * Math.PI * 2 * waves + ph);
        const loc = (k / N) * Math.PI;
        const w = hw * Math.pow(Math.max(0, Math.sin(loc)), 0.45) * (1.1 - 0.35 * s) + 0.15;
        left.push([cx - w, y]);
        right.push([cx + w, y]);
      }
      const d = poly([...left, ...right.reverse()]);
      if (r() < 0.15) faint += `<path d="${d}"/>`;
      else main += `<path d="${d}"/>`;
    }
    x -= 6.2 + r() * 2.4 - tt * 1.8;
  }
  return (
    `<g fill="${u.url('bar')}" fill-opacity="0.85">${main}</g>` +
    `<g fill="${u.url('bar')}" fill-opacity="0.45">${faint}</g>`
  );
}

// ---------- Đường bên: cao gần lưng, gãy xuống dưới cuối vây lưng 2 ----------
function lateralLine(): string {
  const pts: P[] = [];
  for (let x = 540; x >= 336; x -= 12.75) pts.push([x, topY(x) + 14 + (540 - x) * 0.016]);
  // gãy xuống đột ngột
  pts.push([326, topY(326) + 19]);
  pts.push([314, topY(314) + 27]);
  pts.push([304, topY(304) + 34]);
  for (let x = 292; x >= 86; x -= 16) {
    const T = topY(x);
    const B = botY(x);
    const mid = T + (B - T) * (0.4 + 0.08 * ((292 - x) / 206));
    pts.push([x, mid + Math.sin(x * 0.11) * 1.4]);
  }
  const d = smoothPath(pts, false, 0.6);
  return (
    `<path d="${d}" fill="none" stroke="${BLUE_D}" stroke-opacity="0.45" stroke-width="2" stroke-linecap="round" transform="translate(0 0.9)"/>` +
    `<path d="${d}" fill="none" stroke="#e8f0f7" stroke-opacity="0.7" stroke-width="1" stroke-linecap="round" stroke-dasharray="3.2 1.4"/>`
  );
}

// ---------- Răng nhỏ sắc dọc khe miệng ----------
function teeth(): string {
  let s = '';
  const r = rng(77);
  for (let i = 0; i < 7; i++) {
    const t = (i + r() * 0.5) / 7;
    const x = 618 - t * 28;
    const y = 137.6 + t * 4.4;
    const h = 1.7 - t * 0.6 + r() * 0.4;
    s += `<path d="M${f(x - 0.7)} ${f(y - 0.2)}L${f(x - 0.25)} ${f(y + h)}L${f(x + 0.5)} ${f(y - 0.2)}Z"/>`;
  }
  return `<g fill="#f6f8f5" fill-opacity="0.9">${s}</g>`;
}

// ---------- Defs ----------
const body = standardBody(u, BODY, {
  dorsal: STEEL,
  flank: '#8295aa',
  belly: '#e8eef3',
  outlineColor: INK,
  scales: { size: 4.5, color: '#ffffff', opacity: 0.09, stroke: 0.45 },
  flankAt: 0.52,
  rimOpacity: 0.8,
});

const theEye = eye(u, 'eye', {
  cx: 589,
  cy: 120,
  r: 7.4,
  iris: ['#ece6c6', '#5c6150'],
  socket: '#40566e',
  look: [0.2, 0],
});

const defs = joinDefs(
  body,
  theEye,
  // lưng xanh thép đậm phủ thêm (dải trên cùng)
  linear(
    u('back'),
    [
      [0, '#132544', 0.95],
      [0.35, '#1f3b62', 0.8],
      [0.7, '#2c4d77', 0.35],
      [1, '#36587f', 0],
    ],
    { user: true, x1: 0, y1: 78, x2: 0, y2: 128 },
  ),
  // ánh xà cừ (lục lam → tím nhạt) dọc giữa hông
  linear(
    u('iris'),
    [
      [0, '#7fd8d2', 0],
      [0.3, '#7fd8d2', 0.32],
      [0.55, '#b5a9e6', 0.22],
      [0.8, '#d8e6f2', 0.1],
      [1, '#ffffff', 0],
    ],
    { user: true, x1: 0, y1: 96, x2: 0, y2: 160 },
  ),
  linear(
    u('bar'),
    [
      [0, '#22334c'],
      [0.6, BAR],
      [1, '#5a6c84'],
    ],
    { user: true, x1: 0, y1: 88, x2: 0, y2: 170 },
  ),
  radial(
    u('cheek'),
    [
      [0, '#c9d98a', 0.38],
      [0.55, '#8fc4a8', 0.18],
      [1, '#8fc4a8', 0],
    ],
    { user: true, cx: 566, cy: 132, r: 46 },
  ),
  radial(
    u('sheen'),
    [
      [0, '#ffffff', 0.75],
      [1, '#ffffff', 0],
    ],
  ),
  linear(
    u('caudal'),
    [
      [0, '#24303f', 0.92],
      [0.5, '#3a4859', 0.86],
      [1, '#24303f', 0.92],
    ],
    { user: true, x1: 0, y1: 46, x2: 0, y2: 220 },
  ),
  linear(
    u('dorsal1'),
    [
      [0, '#121d2e'],
      [1, '#2a3e5a'],
    ],
  ),
  linear(
    u('fin2'),
    [
      [0, '#1c2838', 0.9],
      [1, '#46566c', 0.78],
    ],
  ),
  linear(
    u('anal'),
    [
      [0, '#9fadbc', 0.8],
      [1, '#55657a', 0.72],
    ],
  ),
  linear(
    u('finletTop'),
    [
      [0, '#3e5068'],
      [1, '#25344a'],
    ],
  ),
  linear(
    u('finletBot'),
    [
      [0, '#8c9bad'],
      [1, '#5b6b80'],
    ],
  ),
  linear(
    u('pec'),
    [
      [0, '#1e2a3a', 0.92],
      [1, '#3b4b61', 0.8],
    ],
    { x1: 1, y1: 0, x2: 0, y2: 1 },
  ),
  blurFilter(u('soft'), 3),
);

const art: CreatureArt = {
  id: 'ca_thu_vach',
  viewBox: [640, 256],
  lengthUnits: 602,
  spineY: 131,
  animation: 'fish',
  cycleHz: 2.7,
  bendAmp: 16,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'caudal',
      role: 'tail',
      svg:
        `<path d="${CAUDAL}" fill="${u.url('caudal')}"/>` +
        finRays(
          [[78, 125], [74, 127], [70, 129], [66, 131], [66, 135], [70, 137], [74, 139], [78, 141]],
          [[27, 60], [32, 84], [42, 108], [58, 129], [58, 137], [42, 158], [32, 182], [27, 206]],
          { color: '#a9bccf', opacity: 0.3, width: 0.7, bend: 0.03 },
        ) +
        `<path d="${CAUDAL_EDGE}" fill="none" stroke="${INK}" stroke-opacity="0.6" stroke-width="1.4" stroke-linejoin="round"/>` +
        `<path d="M84 123C77 108 51 72 22 47M84 143C77 158 51 194 22 219" fill="none" stroke="#b9cadb" stroke-opacity="0.3" stroke-width="0.9"/>`,
    },
    { name: 'dorsal1', role: 'detail', svg: dorsal1() },
    {
      name: 'dorsal2',
      role: 'detail',
      svg:
        `<path d="${DORSAL2}" fill="${u.url('fin2')}" stroke="${INK}" stroke-opacity="0.5" stroke-width="0.8" stroke-linejoin="round"/>` +
        finRays([[358, 82], [352, 83], [346, 84], [340, 85], [334, 85], [329, 86]], [[336, 58], [328, 55], [324, 58], [324, 64], [325, 72], [325, 80]], {
          color: '#b8c8da',
          opacity: 0.3,
          width: 0.6,
          bend: 0.04,
        }),
    },
    {
      name: 'anal',
      role: 'detail',
      svg:
        `<path d="${ANAL}" fill="${u.url('anal')}" stroke="${INK}" stroke-opacity="0.4" stroke-width="0.8" stroke-linejoin="round"/>` +
        finRays([[346, 181], [340, 180], [334, 180], [328, 180], [322, 179], [316, 179]], [[326, 203], [316, 207], [312, 204], [313, 198], [314, 192], [314, 186]], {
          color: '#e6eef6',
          opacity: 0.35,
          width: 0.6,
          bend: -0.04,
        }),
    },
    { name: 'finlets', role: 'detail', svg: finlets() },
    {
      name: 'pelvic',
      role: 'detail',
      svg: `<path d="${PELVIC}" fill="#8f9eb0" fill-opacity="0.75" stroke="${INK}" stroke-opacity="0.35" stroke-width="0.7"/>`,
    },
    {
      name: 'body',
      role: 'body',
      svg:
        body.base +
        `<g clip-path="${u.url('bodyClip')}">` +
        `<rect x="0" y="70" width="640" height="60" fill="${u.url('iris')}"/>` +
        `<rect x="0" y="70" width="640" height="60" fill="${u.url('back')}"/>` +
        bars() +
        // dải lưng sẫm chạy theo mép lưng (cả trên đầu và cuống đuôi)
        `<path d="${smoothPath(UPPER, false, 0.5)}" fill="none" stroke="${BLUE_D}" stroke-opacity="0.75" stroke-width="16" filter="${u.url('soft')}"/>` +
        // vệt phản quang bạc dọc giữa hông
        `<ellipse cx="380" cy="136" rx="190" ry="9" fill="${u.url('sheen')}" opacity="0.55" filter="${u.url('soft')}"/>` +
        `<ellipse cx="470" cy="131" rx="60" ry="6" fill="${u.url('sheen')}" opacity="0.5" filter="${u.url('soft')}"/>` +
        // ánh lục – đồng trên má
        `<ellipse cx="566" cy="132" rx="50" ry="36" fill="${u.url('cheek')}"/>` +
        lateralLine() +
        `</g>` +
        body.overlay,
    },
    {
      name: 'keel',
      role: 'detail',
      svg:
        // gờ cuống đuôi
        `<path d="M70 133.4C80 131.8 94 131.8 112 133.2C94 135 80 135.2 70 134.4Z" fill="#1c2a3c" fill-opacity="0.7"/>` +
        `<path d="M72 132.6C84 131.2 96 131.3 110 132.4" fill="none" stroke="#dbe6f0" stroke-opacity="0.4" stroke-width="0.6"/>` +
        // 2 gờ nhỏ ở gốc đuôi
        `<path d="M62 127.5C66 129 70 129.5 74 129M62 139.5C66 138 70 137.5 74 138" fill="none" stroke="#1c2a3c" stroke-opacity="0.6" stroke-width="1"/>`,
    },
    {
      name: 'face',
      role: 'detail',
      svg:
        `<g clip-path="${u.url('bodyClip')}">` +
        // mép nắp mang & gờ trước nắp mang
        `<path d="M549 97C535 118 533 146 545 169" fill="none" stroke="${INK}" stroke-opacity="0.45" stroke-width="1.5" stroke-linecap="round"/>` +
        `<path d="M551.5 98C538 119 536 146 548 168" fill="none" stroke="#eef4f9" stroke-opacity="0.45" stroke-width="0.8"/>` +
        `<path d="M571 106C562 121 560 139 566 156" fill="none" stroke="${INK}" stroke-opacity="0.25" stroke-width="1.1" stroke-linecap="round"/>` +
        // xương hàm trên (maxilla)
        `<path d="M608 129C600 133 592 137 584 141.5" fill="none" stroke="${INK}" stroke-opacity="0.3" stroke-width="1" stroke-linecap="round"/>` +
        // khe miệng lớn tới dưới mắt, hàm dưới hơi nhô
        `<path d="M623 137.4C612 138.6 598 140.6 585 143.2" fill="none" stroke="${INK}" stroke-opacity="0.85" stroke-width="1.1" stroke-linecap="round"/>` +
        teeth() +
        `<path d="M621 139.5C610 141 598 143 588 145.5" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="0.8" stroke-linecap="round"/>` +
        // lỗ mũi
        `<ellipse cx="604" cy="121.5" rx="1.6" ry="1.1" fill="${INK}" fill-opacity="0.6"/>` +
        `<circle cx="599" cy="122.5" r="0.9" fill="${INK}" fill-opacity="0.45"/>` +
        `</g>`,
    },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    {
      name: 'pectoral',
      role: 'fin',
      z: 'front',
      pivot: PEC_BASE,
      anim: { type: 'rotate', amp: 0.1, speed: 0.5 },
      svg:
        `<path d="${PECTORAL}" fill="${u.url('pec')}" stroke="${INK}" stroke-opacity="0.55" stroke-width="0.9" stroke-linejoin="round"/>` +
        finRays([515, 127], [[484, 120], [472, 128], [463, 139], [468, 142], [482, 139], [497, 136.5]], {
          color: '#a7b9cc',
          opacity: 0.35,
          width: 0.6,
          bend: 0.04,
        }) +
        `<path d="M516 122C500 116 482 121 468 132C464 136 460 141 456 148" fill="none" stroke="#c9d7e6" stroke-opacity="0.35" stroke-width="0.8"/>`,
    },
  ],
};

export default art;
