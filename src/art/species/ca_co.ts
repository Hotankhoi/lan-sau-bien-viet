/**
 * Cá cờ (cá buồm) – Istiophorus platypterus
 * Đặc điểm nhận dạng: thân thon dài dẹt bên, hàm trên kéo dài thành mỏ nhọn như cây kiếm
 * (hàm dưới ngắn hơn nhiều); vây lưng thứ nhất khổng lồ như cánh buồm (cao gần gấp đôi
 * chiều cao thân), màu xanh lam cô-ban, rải chấm đen nhỏ, mép trên lởm chởm đầu tia;
 * lưng xanh đen, hông bạc với ~20 vạch đứng là các chấm xanh nhạt ánh kim;
 * vây ngực hẹp dài lưỡi liềm; vây bụng là hai sợi rất dài mảnh; vây hậu môn 1 hình
 * lưỡi liềm nhỏ; vây lưng 2 & hậu môn 2 tí hon sát cuống đuôi; cuống đuôi có 2 gờ;
 * đuôi lưỡi liềm chẻ rất sâu.
 *
 * Chuyển động: cánh buồm là lớp tách rời (bend:false, z:'back') co giãn scaleY quanh gốc –
 * "dựng/hạ" chậm, biên độ vừa phải. Gốc buồm vùi sâu ~24 đơn vị sau thân (thân đục) nên khi
 * thân uốn, chân buồm không bao giờ hở ra. Thân cá cờ cứng (kiểu cá ngừ) → bendAmp nhỏ.
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
  clip,
} from '../style-bible';

const u = makeIds('ca_co');

type P = [number, number];
const f = (n: number): string => n.toFixed(1);

const INK = '#0c1630';
const NAVY = '#13264a';
const COBALT = '#2142b4';
const SPOT = '#070b1c';

// ---------- Đường viền thân (mỏ bên phải → cuống đuôi bên trái) ----------
const UPPER: P[] = [
  [800, 202.2], [770, 201.2], [735, 199.8], [700, 198], [674, 196], [654, 193], [637, 188.5], [621, 182.5],
  [605, 176], [588, 170], [570, 165], [550, 161.5], [525, 159], [500, 158], [470, 158.2], [440, 159.4],
  [410, 161.6], [380, 164.6], [350, 168.2], [320, 172.2], [290, 176.4], [260, 180.6], [230, 184.8],
  [200, 188.6], [175, 191.6], [150, 194.4], [130, 196.4], [114, 197.6], [100, 198.4],
];
const LOWER: P[] = [
  [100, 208], [114, 208.8], [130, 210], [150, 212], [175, 215], [200, 218.4], [230, 222.6], [260, 226.6],
  [290, 230.4], [320, 233.8], [350, 236.4], [380, 238.2], [410, 239.2], [440, 239.4], [470, 238.6],
  [500, 236.8], [530, 233.8], [560, 229.4], [588, 223.4], [612, 216.6], [632, 211.4], [650, 207.8],
  [666, 205.8], [678, 205], [700, 204.4], [740, 203.6], [775, 203], [800, 202.6],
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
  return 203;
}
const topY = (x: number): number => yAt(UPPER, x);
const botY = (x: number): number => yAt(LOWER, x);

// ---------- Đuôi lưỡi liềm chẻ rất sâu ----------
const CAUDAL =
  'M108 197C94 174 64 130 24 96C35 125 47 162 64 203' +
  'C47 244 35 281 26 312C64 278 94 232 108 209Z';

// ---------- Cánh buồm (vây lưng 1) ----------
const SAIL_N = 44;
const SAIL_X0 = 594; // gốc tia đầu (trên nắp mang)
const SAIL_X1 = 252; // gốc tia cuối
const SAIL_HMAX = 150;
const BURY = 24; // phần gốc vùi sau thân
/** hồ sơ chiều cao buồm theo t (0 = đầu → 1 = cuối) */
const SAIL_PROFILE: P[] = [
  [0, 0.56], [0.04, 0.8], [0.1, 0.93], [0.2, 0.99], [0.3, 1], [0.42, 0.96], [0.54, 0.85], [0.66, 0.67],
  [0.78, 0.46], [0.89, 0.27], [1, 0.1],
];
function sailH(t: number): number {
  for (let i = 0; i < SAIL_PROFILE.length - 1; i++) {
    const [a, ha] = SAIL_PROFILE[i];
    const [b, hb] = SAIL_PROFILE[i + 1];
    if (t >= a && t <= b) {
      const k = (t - a) / (b - a);
      const s = k * k * (3 - 2 * k);
      return ha + (hb - ha) * s;
    }
  }
  return 0.07;
}

interface Ray {
  base: P;
  root: P;
  tip: P;
  over: P;
}
const RAYS: Ray[] = (() => {
  const r = rng(5150);
  const out: Ray[] = [];
  for (let i = 0; i < SAIL_N; i++) {
    const t = i / (SAIL_N - 1);
    const bx = SAIL_X0 + (SAIL_X1 - SAIL_X0) * t;
    const by = topY(bx) + 1;
    const h = SAIL_HMAX * sailH(t) * (0.97 + r() * 0.06);
    const lean = (14 + 34 * Math.pow(t, 1.1)) * (Math.PI / 180);
    const dx = -Math.sin(lean);
    const dy = -Math.cos(lean);
    out.push({
      base: [bx, by],
      root: [bx - dx * BURY * 0.4, by + BURY],
      tip: [bx + dx * h, by + dy * h],
      over: [bx + dx * (h + 5 + 4 * (1 - t)), by + dy * (h + 5 + 4 * (1 - t))],
    });
  }
  return out;
})();

const SAIL_PATH = (() => {
  let d = `M${f(RAYS[0].root[0])} ${f(RAYS[0].root[1])}L${f(RAYS[0].base[0] + 0.5)} ${f(RAYS[0].base[1])}`;
  d += `L${f(RAYS[0].tip[0])} ${f(RAYS[0].tip[1])}`;
  for (let i = 1; i < RAYS.length; i++) {
    const a = RAYS[i - 1].tip;
    const b = RAYS[i].tip;
    // mép buồm lõm nhẹ giữa hai tia → đầu tia nhọn lởm chởm
    d += `Q${f((a[0] + b[0]) / 2 + 0.8)} ${f((a[1] + b[1]) / 2 + 4.6)} ${f(b[0])} ${f(b[1])}`;
  }
  const last = RAYS[RAYS.length - 1];
  d += `C${f(last.tip[0] - 6)} ${f(last.tip[1] + 2)} ${f(last.base[0] - 10)} ${f(last.base[1] - 1)} ${f(last.base[0] - 14)} ${f(last.base[1] + 1)}`;
  d += `L${f(last.root[0] - 14)} ${f(last.root[1])}`;
  for (let i = RAYS.length - 1; i >= 0; i--) d += `L${f(RAYS[i].root[0])} ${f(RAYS[i].root[1])}`;
  return d + 'Z';
})();

function sail(): string {
  // nếp gấp màng giữa các tia (dải tối – sáng xen kẽ)
  let folds = '';
  for (let i = 0; i < RAYS.length - 1; i++) {
    const a = RAYS[i];
    const b = RAYS[i + 1];
    const d = `M${f(a.root[0])} ${f(a.root[1])}L${f(a.tip[0])} ${f(a.tip[1])}L${f(b.tip[0])} ${f(b.tip[1])}L${f(b.root[0])} ${f(b.root[1])}Z`;
    folds += `<path d="${d}" fill="${i % 2 ? '#ffffff' : '#000000'}" fill-opacity="${i % 2 ? 0.035 : 0.09}"/>`;
  }
  // tia: thân tia sẫm + nét sáng mảnh bên cạnh, thò nhẹ khỏi mép
  let rays = '';
  let hi = '';
  for (const ry of RAYS) {
    const mx = (ry.base[0] + ry.over[0]) / 2;
    const my = (ry.base[1] + ry.over[1]) / 2;
    rays += `M${f(ry.root[0])} ${f(ry.root[1])}L${f(ry.base[0])} ${f(ry.base[1])}Q${f(mx + 1.2)} ${f(my)} ${f(ry.over[0])} ${f(ry.over[1])}`;
    hi += `M${f(ry.base[0] + 1.2)} ${f(ry.base[1] - 4)}Q${f(mx + 2.3)} ${f(my)} ${f(ry.tip[0] + 1)} ${f(ry.tip[1] + 4)}`;
  }
  // chấm đen nhỏ: rải dọc theo các tia (như ảnh thật), dày hơn ở nửa dưới
  const r = rng(808);
  let spots = '';
  for (let i = 0; i < RAYS.length - 1; i++) {
    const a = RAYS[i];
    const b = RAYS[i + 1];
    const n = 3 + Math.floor(r() * 4);
    for (let k = 0; k < n; k++) {
      const s = 0.12 + r() * 0.8;
      const w = 0.25 + r() * 0.5;
      const x = (a.base[0] + (a.tip[0] - a.base[0]) * s) * (1 - w) + (b.base[0] + (b.tip[0] - b.base[0]) * s) * w;
      const y = (a.base[1] + (a.tip[1] - a.base[1]) * s) * (1 - w) + (b.base[1] + (b.tip[1] - b.base[1]) * s) * w;
      const rr = 1.1 + r() * 1.3;
      spots += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${(rr * 0.8).toFixed(2)}" ry="${rr.toFixed(2)}"/>`;
    }
  }
  return (
    `<path d="${SAIL_PATH}" fill="${u.url('sail')}" fill-opacity="0.84"/>` +
    `<g clip-path="${u.url('sailClip')}">` +
    `<path d="${SAIL_PATH}" fill="${u.url('sailSheen')}"/>` +
    folds +
    `<g fill="${SPOT}" fill-opacity="0.78">${spots}</g>` +
    `<path d="${hi}" fill="none" stroke="#8fb2ff" stroke-opacity="0.22" stroke-width="0.7" stroke-linecap="round"/>` +
    `</g>` +
    `<path d="${rays}" fill="none" stroke="#0a1440" stroke-opacity="0.85" stroke-width="1.25" stroke-linecap="round"/>` +
    `<path d="${SAIL_PATH}" fill="none" stroke="${INK}" stroke-opacity="0.55" stroke-width="1" stroke-linejoin="round"/>` +
    // tia đầu (gai cứng) dày hơn, mép trước sẫm
    `<path d="M${f(RAYS[0].root[0])} ${f(RAYS[0].root[1])}L${f(RAYS[0].base[0])} ${f(RAYS[0].base[1])}L${f(RAYS[0].over[0])} ${f(RAYS[0].over[1])}" fill="none" stroke="#08103a" stroke-opacity="0.9" stroke-width="2.4" stroke-linecap="round"/>` +
    // ánh nắng trên mép buồm
    `<path d="${smoothPath(RAYS.map((x) => [x.tip[0], x.tip[1] + 1.2] as P), false, 0.5)}" fill="none" stroke="#b9d0ff" stroke-opacity="0.3" stroke-width="1.1"/>`
  );
}

// ---------- Vây lưng 2, hậu môn 1 & 2 ----------
const DORSAL2 = 'M146 195C143 189 137 184 127 181C130 186 131 191 131 197Z';
const ANAL2 = 'M146 212C143 218 137 223 127 226C130 221 131 216 131 211Z';
const ANAL1 = 'M318 233C314 245 302 258 282 266C286 257 287 247 286 236C286 233 286 231 285 229Z';

// ---------- Vây ngực: hẹp dài lưỡi liềm ----------
const PEC_BASE: P = [576, 220];
const PECTORAL =
  'M579 214C560 210 528 214 498 224C488 228 478 233 470 238C486 236 512 232 534 229C552 226.5 568 225 576 224.5C582 222.5 583.5 216 579 214Z';

// ---------- Vây bụng: hai sợi rất dài mảnh ----------
const PELV_BASE: P = [566, 232];
const pelvicRay = (dx: number, dy: number, w: number): string =>
  `M${566 + dx} ${231 + dy}C${540 + dx} ${244 + dy} ${505 + dx} ${262 + dy} ${452 + dx} ${291 + dy}C${504 + dx} ${265 + dy + w} ${540 + dx} ${248 + dy + w} ${564 + dx} ${236 + dy}Z`;

// ---------- Vạch đứng chấm xanh nhạt trên hông ----------
function bars(): string {
  const r = rng(3131);
  let dots = '';
  let haze = '';
  let x = 540;
  let i = 0;
  while (x > 225) {
    const T = topY(x);
    const B = botY(x);
    const depth = B - T;
    const y0 = T + depth * 0.14;
    const y1 = T + depth * (0.6 + r() * 0.1);
    const lean = 5 + r() * 3; // chân vạch lệch nhẹ về phía đuôi
    haze += `M${f(x)} ${f(y0)}L${f(x - lean)} ${f(y1)}`;
    const step = 4.4 + r() * 0.8;
    for (let y = y0; y <= y1; y += step) {
      const s = (y - y0) / (y1 - y0);
      const cx = x - lean * s + (r() - 0.5) * 0.9;
      const rr = (1.45 + r() * 0.6) * (1 - 0.25 * s) * (x < 300 ? 0.85 : 1);
      if (r() < 0.08) continue;
      dots += `<ellipse cx="${f(cx)}" cy="${f(y)}" rx="${(rr * 0.85).toFixed(2)}" ry="${rr.toFixed(2)}"/>`;
    }
    i++;
    x -= 15.5 + r() * 2 - (i > 14 ? 1.5 : 0);
  }
  return (
    `<path d="${haze}" fill="none" stroke="#86c8ff" stroke-opacity="0.16" stroke-width="5.5" stroke-linecap="round" filter="${u.url('soft')}"/>` +
    `<g fill="${u.url('dot')}" fill-opacity="0.85">${dots}</g>`
  );
}

// ---------- Thành phần chung ----------
const body = standardBody(u, BODY, {
  dorsal: NAVY,
  flank: '#86a0c0',
  belly: '#eef2f6',
  outlineColor: INK,
  scales: { size: 4.2, color: '#ffffff', opacity: 0.08, stroke: 0.4 },
  flankAt: 0.42,
  rimOpacity: 0.8,
});

const theEye = eye(u, 'eye', {
  cx: 621,
  cy: 191.5,
  r: 8.2,
  iris: ['#3a4a5e', '#141c28'],
  socket: '#4a6380',
  look: [0.25, 0],
});

const defs = joinDefs(
  body,
  theEye,
  clip(u('sailClip'), SAIL_PATH),
  blurFilter(u('soft'), 2.2),
  linear(
    u('sail'),
    [
      [0, '#1a1c66'],
      [0.12, '#22289a'],
      [0.4, COBALT],
      [0.75, '#1b3596'],
      [1, '#0c1a50'],
    ],
    { user: true, x1: 0, y1: 14, x2: 0, y2: 190 },
  ),
  radial(
    u('sailSheen'),
    [
      [0, '#6fa0ff', 0.22],
      [0.6, '#4a78f0', 0.05],
      [1, '#4a78f0', 0],
    ],
    { user: true, cx: 470, cy: 70, r: 170 },
  ),
  // lưng xanh đen phủ thêm
  linear(
    u('back'),
    [
      [0, '#08132b', 0.95],
      [0.4, '#112650', 0.75],
      [0.75, '#21406f', 0.25],
      [1, '#2b4a78', 0],
    ],
    { user: true, x1: 0, y1: 156, x2: 0, y2: 200 },
  ),
  // ánh xà cừ lục lam – tím dọc hông
  linear(
    u('iris'),
    [
      [0, '#6fd0ff', 0],
      [0.35, '#6fd0ff', 0.25],
      [0.6, '#a9a2ee', 0.16],
      [1, '#ffffff', 0],
    ],
    { user: true, x1: 0, y1: 178, x2: 0, y2: 236 },
  ),
  linear(
    u('dot'),
    [
      [0, '#9fe2ff'],
      [0.6, '#7cc6ff'],
      [1, '#b9e4ff'],
    ],
    { user: true, x1: 0, y1: 165, x2: 0, y2: 225 },
  ),
  radial(
    u('sheen'),
    [
      [0, '#ffffff', 0.8],
      [1, '#ffffff', 0],
    ],
  ),
  linear(
    u('bill'),
    [
      [0, '#0e1830'],
      [0.55, '#26324a'],
      [1, '#5d6a80'],
    ],
    { user: true, x1: 0, y1: 195, x2: 0, y2: 206 },
  ),
  linear(
    u('billFade'),
    [
      [0, '#ffffff', 0],
      [0.5, '#ffffff', 0.8],
      [1, '#ffffff', 1],
    ],
    { user: true, x1: 645, y1: 0, x2: 712, y2: 0 },
  ),
  `<mask id="${u('billMask')}" maskUnits="userSpaceOnUse" x="600" y="180" width="220" height="40"><rect x="600" y="180" width="220" height="40" fill="${u.url('billFade')}"/></mask>`,
  linear(
    u('caudal'),
    [
      [0, '#0b1530', 0.94],
      [0.5, '#1f2d4c', 0.86],
      [1, '#0b1530', 0.94],
    ],
    { user: true, x1: 0, y1: 96, x2: 0, y2: 312 },
  ),
  linear(
    u('pec'),
    [
      [0, '#0f1b36', 0.9],
      [1, '#2c3b5c', 0.78],
    ],
  ),
  linear(
    u('anal'),
    [
      [0, '#a9b8ca', 0.82],
      [1, '#2a3a58', 0.8],
    ],
  ),
);

const art: CreatureArt = {
  id: 'ca_co',
  viewBox: [820, 324],
  lengthUnits: 776,
  spineY: 203,
  animation: 'fish',
  cycleHz: 1.9,
  bendAmp: 15,
  // Công thức theo sizeCm (340 cm, tính cả mỏ) cho ~353px – quá to so với thợ lặn và cánh buồm
  // làm hình cao gấp ~2,5 lần thân; 260px giữ cá nổi bật (cỡ cá heo) mà vẫn lướt qua màn hình gọn.
  displayLengthPx: 260,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'sail',
      role: 'fin',
      bend: false,
      z: 'back',
      pivot: [430, 166],
      anim: { type: 'scaleY', amp: 0.07, speed: 0.35 },
      svg: sail(),
    },
    {
      name: 'pelvicFar',
      role: 'fin',
      bend: false,
      z: 'back',
      pivot: PELV_BASE,
      anim: { type: 'rotate', amp: 0.05, speed: 0.6, phase: 1.2 },
      svg: `<path d="${pelvicRay(4, -1, 0.6)}" fill="#1a2846" fill-opacity="0.75"/>`,
    },
    {
      name: 'caudal',
      role: 'tail',
      svg:
        `<path d="${CAUDAL}" fill="${u.url('caudal')}" stroke="${INK}" stroke-opacity="0.6" stroke-width="1.1" stroke-linejoin="round"/>` +
        finRays(
          [[106, 196], [104, 196], [101, 197], [98, 198], [96, 199], [96, 207], [98, 208], [101, 209], [104, 210], [106, 211]],
          [[32, 105], [43, 134], [52, 162], [60, 182], [64, 198], [64, 208], [60, 226], [52, 246], [43, 274], [33, 302]],
          { color: '#8fa3c4', opacity: 0.28, width: 0.7, bend: 0.03 },
        ) +
        `<path d="M108 197C94 174 64 130 24 96M108 209C94 232 64 278 26 312" fill="none" stroke="#a9bfe0" stroke-opacity="0.3" stroke-width="1"/>`,
    },
    {
      name: 'smallFins',
      role: 'detail',
      svg:
        `<path d="${DORSAL2}" fill="#14213d" fill-opacity="0.85" stroke="${INK}" stroke-opacity="0.5" stroke-width="0.7"/>` +
        `<path d="${ANAL2}" fill="#3a4a66" fill-opacity="0.8" stroke="${INK}" stroke-opacity="0.45" stroke-width="0.7"/>` +
        `<path d="${ANAL1}" fill="${u.url('anal')}" stroke="${INK}" stroke-opacity="0.45" stroke-width="0.8" stroke-linejoin="round"/>` +
        finRays([[314, 234], [308, 233], [302, 232.5], [296, 232], [290, 231.5]], [[298, 254], [290, 260], [286, 262], [287, 252], [287, 242]], {
          color: '#e6eef6',
          opacity: 0.3,
          width: 0.6,
          bend: -0.04,
        }),
    },
    {
      name: 'body',
      role: 'body',
      svg:
        body.base +
        `<g clip-path="${u.url('bodyClip')}">` +
        `<rect x="0" y="150" width="820" height="100" fill="${u.url('iris')}"/>` +
        `<rect x="0" y="150" width="820" height="60" fill="${u.url('back')}"/>` +
        `<path d="${smoothPath(UPPER.slice(4), false, 0.5)}" fill="none" stroke="#0a1838" stroke-opacity="0.7" stroke-width="12" filter="${u.url('soft')}"/>` +
        bars() +
        // vệt phản quang bạc giữa hông
        `<ellipse cx="400" cy="212" rx="200" ry="8" fill="${u.url('sheen')}" opacity="0.45" filter="${u.url('soft')}"/>` +
        `<ellipse cx="560" cy="206" rx="40" ry="6" fill="${u.url('sheen')}" opacity="0.4" filter="${u.url('soft')}"/>` +
        // mỏ sẫm (hàm trên kéo dài)
        `<path d="M624 180C660 192 730 199.4 802 202.2L802 203.6C760 203.4 716 203.6 676 204.6C660 205.2 640 206 618 208Z" fill="${u.url('bill')}" opacity="0.92" mask="${u.url('billMask')}"/>` +
        `</g>` +
        body.overlay,
    },
    {
      name: 'keel',
      role: 'detail',
      svg:
        `<path d="M104 202.6C116 201.4 132 201.4 150 202.8C132 204.8 116 205 104 204Z" fill="#14203a" fill-opacity="0.75"/>` +
        `<path d="M106 202C118 200.8 132 200.9 148 202" fill="none" stroke="#dbe6f0" stroke-opacity="0.35" stroke-width="0.6"/>` +
        `<path d="M112 199.4C120 200.6 128 200.8 136 200.4M112 207.4C120 206.4 128 206.2 136 206.6" fill="none" stroke="#14203a" stroke-opacity="0.55" stroke-width="0.9"/>`,
    },
    {
      name: 'face',
      role: 'detail',
      svg:
        `<g clip-path="${u.url('bodyClip')}">` +
        // mép nắp mang
        `<path d="M596 172C580 188 576 208 588 226" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="1.5" stroke-linecap="round"/>` +
        `<path d="M598.5 173C583 189 579.5 208 591 225" fill="none" stroke="#eef4f9" stroke-opacity="0.4" stroke-width="0.8"/>` +
        // gờ trước nắp mang
        `<path d="M610 182C602 194 601 208 607 219" fill="none" stroke="${INK}" stroke-opacity="0.25" stroke-width="1.1" stroke-linecap="round"/>` +
        // khe miệng: hàm dưới ngắn nhọn, miệng kéo tới dưới mắt
        `<path d="M679 204.6C662 205.2 646 205.8 628 207.4" fill="none" stroke="${INK}" stroke-opacity="0.8" stroke-width="1.1" stroke-linecap="round"/>` +
        `<path d="M676 206.4C662 207.2 648 208.4 634 210" fill="none" stroke="#ffffff" stroke-opacity="0.4" stroke-width="0.7" stroke-linecap="round"/>` +
        // ánh trên mỏ
        `<path d="M660 192.6C700 197.4 750 200 798 202" fill="none" stroke="#c4d2e6" stroke-opacity="0.45" stroke-width="0.8" stroke-linecap="round"/>` +
        // lỗ mũi
        `<ellipse cx="636" cy="189.5" rx="1.5" ry="1" fill="${INK}" fill-opacity="0.6"/>` +
        `</g>`,
    },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    {
      name: 'pelvic',
      role: 'fin',
      bend: false,
      z: 'front',
      pivot: PELV_BASE,
      anim: { type: 'rotate', amp: 0.05, speed: 0.6 },
      svg:
        `<path d="${pelvicRay(0, 0, 0)}" fill="#22325a" fill-opacity="0.82" stroke="${INK}" stroke-opacity="0.5" stroke-width="0.6"/>` +
        `<path d="M564 232.5C538 246 504 264 456 289.5" fill="none" stroke="#b8c8e6" stroke-opacity="0.3" stroke-width="0.6"/>`,
    },
    {
      name: 'pectoral',
      role: 'fin',
      bend: false,
      z: 'front',
      pivot: PEC_BASE,
      anim: { type: 'rotate', amp: 0.08, speed: 0.5 },
      svg:
        `<path d="${PECTORAL}" fill="${u.url('pec')}" stroke="${INK}" stroke-opacity="0.55" stroke-width="0.9" stroke-linejoin="round"/>` +
        finRays([577, 219], [[540, 215], [510, 221], [486, 230], [474, 237], [500, 233], [530, 229], [556, 226]], {
          color: '#a7b9d6',
          opacity: 0.32,
          width: 0.6,
          bend: 0.03,
        }) +
        `<path d="M579 214C560 210 528 214 498 224C488 228 478 233 470 238" fill="none" stroke="#c9d7ee" stroke-opacity="0.35" stroke-width="0.8"/>`,
    },
  ],
};

export default art;
