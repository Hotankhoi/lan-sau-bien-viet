/**
 * Sứa rô – Rhopilema esculentum (Vịnh Bắc Bộ)
 * Đặc điểm nhận dạng: chuông bán cầu dày, nhẵn, cam – nâu đỏ trong mờ, mép xẻ thùy nhỏ, không có xúc tu mép;
 * cuống miệng dày có vòng diềm vai (scapulets) ngay dưới chuông; 8 tay miệng xù xì như súp lơ;
 * cuối mỗi tay là các dải phụ hình thoi dài, nhọn, nâu đỏ sẫm.
 *
 * Cấu trúc lớp (vẽ trong hệ trục "đứng thẳng", gốc ở đỉnh chuông, rồi xoay nghiêng TILT độ):
 *  - 4 tay miệng phía xa: bend:false z:'back', xoay quanh gốc tay, lệch pha.
 *  - 'manubrium' (cuống + diềm vai): lớp body đứng yên (bendAmp = 0).
 *  - 4 tay miệng phía gần: bend:false z:'front'.
 *  - 'bell': bend:false z:'front' vẽ sau cùng, pivot ở đỉnh chuông, anim 'pulse' (co bóp).
 *  - sợi phụ mảnh: procedural.tentacles (chỉ có trong game).
 */
import type { ArtLayer, CreatureArt } from '../contract';
import {
  makeIds,
  linear,
  radial,
  blurFilter,
  organicTexture,
  rimGradient,
  rimLight,
  volumeShade,
  smoothPath,
  scatterSpots,
  rng,
  mix,
  joinDefs,
} from '../style-bible';

const ID = 'sua_ro';
const u = makeIds(ID);
type P = [number, number];
const f1 = (n: number) => n.toFixed(1);

// ---------- Hệ trục: gốc ở đỉnh chuông, y hướng xuống; cả con nghiêng TILT độ ----------
const VB: P = [360, 510];
const AX = 210;
const AY = 18;
const TILT = 10;
const CT = Math.cos((TILT * Math.PI) / 180);
const ST = Math.sin((TILT * Math.PI) / 180);
const toVB = (x: number, y: number): P => [AX + x * CT - y * ST, AY + x * ST + y * CT];
const wrap = (s: string) => `<g transform="translate(${AX} ${AY}) rotate(${TILT})">${s}</g>`;

// ---------- Bảng màu ----------
const LINE = '#6B2A12';
const DEEP = '#5A2410';
const BELL_RIM = '#9A3C18';
const STALK_L = '#FBD9A0';
const STALK = '#EDA65A';
const STALK_D = '#C06A2C';
const UNDER = '#A9491C';

// ---------- CHUÔNG ----------
/** [y, nửa bề ngang] của vòm chuông */
const PROFILE: P[] = [
  [0, 0], [1, 20], [4, 40], [10, 58], [22, 78], [35, 92], [50, 104], [66, 113],
  [84, 120], [98, 123], [112, 125], [124, 124], [134, 122], [142, 119], [150, 114],
];
const RIM_Y = 150;
const RIM_RX = 114;
const RIM_RY = 14;
const PERSP = RIM_RY / RIM_RX;

const DOME_PTS: P[] = [
  ...PROFILE.slice(1).map(([y, hw]): P => [-hw, y]).reverse(),
  ...PROFILE.map(([y, hw]): P => [hw, y]),
];
const DOME_D = smoothPath(DOME_PTS);
const N_LAP = 24;
const BELL_D = (() => {
  let s = DOME_D;
  for (let i = 0; i < N_LAP; i++) {
    const tm = (Math.PI * (i + 0.5)) / N_LAP;
    const t1 = (Math.PI * (i + 1)) / N_LAP;
    s += `Q${f1((RIM_RX + 2) * Math.cos(tm))} ${f1(RIM_Y + RIM_RY * Math.sin(tm) + 7.5)} ${f1(RIM_RX * Math.cos(t1))} ${f1(RIM_Y + RIM_RY * Math.sin(t1))}`;
  }
  return s + 'Z';
})();

/** kinh tuyến trên mặt vòm (phi = 0 hướng về người xem) */
function meridian(phiDeg: number): string {
  const s = Math.sin((phiDeg * Math.PI) / 180);
  const c = Math.cos((phiDeg * Math.PI) / 180);
  return smoothPath(PROFILE.map(([y, hw]): P => [hw * s, y + hw * c * PERSP]));
}
/** cung song song với mép chuông, lùi lên trên `up` đơn vị */
function rimArc(up: number, rx: number): string {
  const pts: P[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = (Math.PI * i) / 16;
    pts.push([rx * Math.cos(t), RIM_Y - up + RIM_RY * Math.sin(t)]);
  }
  return smoothPath(pts);
}

const bellSvg = (() => {
  let canals = '';
  let canalsL = '';
  for (let phi = -78; phi <= 78; phi += 13) {
    canals += `<path d="${meridian(phi)}"/>`;
    canalsL += `<path d="${meridian(phi + 2)}"/>`;
  }
  let notches = '';
  for (let i = 1; i < N_LAP; i++) {
    const t = (Math.PI * i) / N_LAP;
    notches += `M${f1(120 * Math.cos(t))} ${f1(139 + 120 * PERSP * Math.sin(t))}L${f1(RIM_RX * Math.cos(t))} ${f1(RIM_Y + RIM_RY * Math.sin(t))}`;
  }
  return (
    `<g filter="${u.url('tex')}"><path d="${BELL_D}" fill="${u.url('bellFill')}"/></g>` +
    `<g clip-path="${u.url('bellClip')}">` +
    // cuống miệng & túi vị nhìn xuyên qua chuông
    `<g filter="${u.url('blur8')}">` +
    `<ellipse cx="0" cy="138" rx="64" ry="26" fill="#8F3716" fill-opacity="0.3"/>` +
    `<ellipse cx="-36" cy="90" rx="30" ry="19" fill="#B24A1C" fill-opacity="0.3"/>` +
    `<ellipse cx="32" cy="86" rx="32" ry="20" fill="#B24A1C" fill-opacity="0.26"/>` +
    `<ellipse cx="-2" cy="66" rx="24" ry="14" fill="#B24A1C" fill-opacity="0.22"/>` +
    `</g>` +
    // ánh sáng xuyên qua: phía đối diện nguồn sáng rực lên
    `<ellipse cx="-52" cy="108" rx="58" ry="30" fill="#FFD592" fill-opacity="0.42" filter="${u.url('blur12')}"/>` +
    `<path d="${rimArc(24, 112)}" fill="none" stroke="#FFDCA6" stroke-opacity="0.3" stroke-width="9" filter="${u.url('blur4')}"/>` +
    // kênh tỏa tia
    `<g fill="none" stroke="#8F3A18" stroke-opacity="0.14" stroke-width="1">${canals}</g>` +
    `<g fill="none" stroke="#FFEACB" stroke-opacity="0.13" stroke-width="0.9">${canalsL}</g>` +
    // nốt sần nhỏ trên mặt chuông
    scatterSpots(77, { x: -125, y: 4, w: 250, h: 160 }, { count: 150, rMin: 0.35, rMax: 0.95, color: '#FFE9C8', opacity: 0.22, minGap: 8 }) +
    // mép chuông dày, sẫm màu + rãnh giữa các thùy
    `<path d="${rimArc(6, 115)}" fill="none" stroke="${BELL_RIM}" stroke-opacity="0.4" stroke-width="13" filter="${u.url('blur2')}"/>` +
    `<path d="${notches}" fill="none" stroke="${LINE}" stroke-opacity="0.38" stroke-width="1" stroke-linecap="round"/>` +
    // khối
    `<path d="${BELL_D}" fill="${u.url('bellVol')}"/>` +
    // bóng phản chiếu
    `<ellipse cx="50" cy="40" rx="36" ry="14" transform="rotate(24 50 40)" fill="#ffffff" fill-opacity="0.42" filter="${u.url('blur4')}"/>` +
    `<ellipse cx="64" cy="33" rx="15" ry="4.2" transform="rotate(27 64 33)" fill="#ffffff" fill-opacity="0.6" filter="${u.url('blur1')}"/>` +
    `<ellipse cx="-70" cy="62" rx="5" ry="16" transform="rotate(32 -70 62)" fill="#ffffff" fill-opacity="0.22" filter="${u.url('blur2')}"/>` +
    `</g>` +
    `<path d="${BELL_D}" fill="none" stroke="${LINE}" stroke-width="1.6" stroke-opacity="0.5" stroke-linejoin="round"/>` +
    rimLight(DOME_D, u.url('rim'), 2.6)
  );
})();

// ---------- Thùy xù (dùng chung cho diềm vai & tay miệng) ----------
function lobe(x: number, y: number, r: number, grad: string): string {
  return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${u.url(grad)}"/>`;
}
const lobeGroup = (s: string) => `<g stroke="#8A3A16" stroke-opacity="0.26" stroke-width="0.5">${s}</g>`;

// ---------- CUỐNG MIỆNG + DIỀM VAI ----------
const STALK_D_PATH = smoothPath(
  [
    [-62, 138], [-58, 160], [-50, 186], [-50, 206], [-60, 226], [-34, 236], [-8, 232], [18, 236], [44, 233],
    [62, 224], [52, 204], [50, 186], [58, 160], [62, 138],
  ],
  true,
);
const stalkSvg = (() => {
  let folds = '';
  let foldsL = '';
  for (const x0 of [-38, -23, -8, 8, 24, 38]) {
    folds += `<path d="${smoothPath([[x0 * 1.2, 150], [x0 * 0.92, 190], [x0 * 1.1, 230]])}"/>`;
    foldsL += `<path d="${smoothPath([[x0 * 1.2 + 3, 150], [x0 * 0.92 + 3, 190], [x0 * 1.1 + 3, 230]])}"/>`;
  }
  const r = rng(404);
  const items: { x: number; y: number; rr: number; g: string }[] = [];
  for (let k = 0; k < 13; k++) {
    const cx = -60 + k * 10;
    const cy = 173 + 7 * Math.cos((cx / 62) * (Math.PI / 2));
    for (let j = 0; j < 8; j++) {
      const a = r() * Math.PI * 2;
      const d = r() * 6.5;
      const sc = r();
      items.push({
        x: cx + Math.cos(a) * d,
        y: cy + Math.sin(a) * d * 0.8,
        rr: 1.8 + r() * 2.2,
        g: sc > 0.8 ? 'lf1' : sc > 0.4 ? 'lf2' : 'lb2',
      });
    }
  }
  items.sort((a, b) => a.y - b.y);
  return (
    `<path d="${STALK_D_PATH}" fill="${u.url('stalkFill')}"/>` +
    `<g clip-path="${u.url('stalkClip')}">` +
    `<g fill="none" stroke="#B25A22" stroke-opacity="0.38" stroke-width="1.3" stroke-linecap="round">${folds}</g>` +
    `<g fill="none" stroke="#FFEBC8" stroke-opacity="0.4" stroke-width="1.1" stroke-linecap="round">${foldsL}</g>` +
    `<path d="${STALK_D_PATH}" fill="${u.url('stalkShade')}"/>` +
    `</g>` +
    `<path d="${STALK_D_PATH}" fill="none" stroke="${LINE}" stroke-width="1.3" stroke-opacity="0.4" stroke-linejoin="round"/>` +
    // diềm vai
    `<ellipse cx="0" cy="178" rx="64" ry="10" fill="${UNDER}" fill-opacity="0.75"/>` +
    lobeGroup(items.map((it) => lobe(it.x, it.y, it.rr, it.g)).join('')) +
    `<ellipse cx="0" cy="166" rx="70" ry="12" fill="${DEEP}" fill-opacity="0.3" filter="${u.url('blur4')}"/>`
  );
})();

// ---------- TAY MIỆNG ----------
interface ArmSpec {
  name: string;
  /** gốc tay (hệ trục đứng thẳng) */
  base: P;
  /** độ nghiêng (độ, dương = lệch sang phải) */
  lean: number;
  /** chiều dài khối súp lơ / cả tay */
  Lf: number;
  L: number;
  /** nửa bề ngang khối súp lơ */
  Wf: number;
  k: number;
  back: boolean;
  amp: number;
  ph: number;
  seed: number;
}
const ARMS: ArmSpec[] = [
  { name: 'armB1', base: [-58, 196], lean: -16, Lf: 88, L: 205, Wf: 18, k: -0.0013, back: true, amp: 0.055, ph: 0.6, seed: 11 },
  { name: 'armB2', base: [-26, 198], lean: -7, Lf: 98, L: 246, Wf: 19, k: -0.0006, back: true, amp: 0.05, ph: 2.1, seed: 23 },
  { name: 'armB3', base: [8, 198], lean: 3, Lf: 96, L: 236, Wf: 19, k: 0.0004, back: true, amp: 0.05, ph: 3.5, seed: 37 },
  { name: 'armB4', base: [42, 196], lean: 13, Lf: 88, L: 208, Wf: 18, k: 0.0012, back: true, amp: 0.055, ph: 5.0, seed: 41 },
  { name: 'armF1', base: [-44, 204], lean: -12, Lf: 96, L: 226, Wf: 21, k: -0.001, back: false, amp: 0.06, ph: 1.3, seed: 53 },
  { name: 'armF2', base: [-13, 206], lean: -3, Lf: 106, L: 250, Wf: 22, k: -0.0003, back: false, amp: 0.05, ph: 2.9, seed: 67 },
  { name: 'armF3', base: [19, 206], lean: 6, Lf: 102, L: 240, Wf: 22, k: 0.0005, back: false, amp: 0.05, ph: 4.3, seed: 79 },
  { name: 'armF4', base: [51, 203], lean: 15, Lf: 92, L: 214, Wf: 20, k: 0.0012, back: false, amp: 0.06, ph: 5.7, seed: 97 },
];

interface S {
  x: number;
  y: number;
  th: number;
}
function centerline(x0: number, y0: number, thDeg: number, L: number, k: number, n: number): S[] {
  const ds = L / n;
  let th = (thDeg * Math.PI) / 180;
  let x = x0;
  let y = y0;
  const out: S[] = [];
  for (let i = 0; i <= n; i++) {
    out.push({ x, y, th });
    th += k * ds;
    x += Math.cos(th) * ds;
    y += Math.sin(th) * ds;
  }
  return out;
}
/** lệch ngang d khỏi trục (d > 0 = bên trái khi trục hướng xuống) */
const offp = (p: S, d: number): P => [p.x - Math.sin(p.th) * d, p.y + Math.cos(p.th) * d];
/** bề ngang dải phụ hình thoi: nhọn ở hai đầu, phình ở ~1/4 */
const spindleW = (t: number) => Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(Math.max(0, Math.min(1, t)), 0.5))), 0.85);

function spindle(sm: S[], wmax: number): string {
  const n = sm.length - 1;
  const left = sm.map((p, i) => offp(p, 0.5 * wmax * spindleW(i / n)));
  const right = sm.map((p, i) => offp(p, -0.5 * wmax * spindleW(i / n))).reverse();
  return smoothPath([...left, ...right.slice(1, -1)], true);
}
function spindleBand(sm: S[], wmax: number, fa: number, fb: number, t0: number, t1: number): string {
  const n = sm.length - 1;
  const i0 = Math.round(t0 * n);
  const i1 = Math.round(t1 * n);
  const a: P[] = [];
  const b: P[] = [];
  for (let i = i0; i <= i1; i++) {
    const w = wmax * spindleW(i / n);
    a.push(offp(sm[i], fa * w));
    b.push(offp(sm[i], fb * w));
  }
  return smoothPath([...a, ...b.reverse()], true);
}
/** một dải phụ hoàn chỉnh (thân + vệt sáng + vệt tối) */
function club(sm: S[], wmax: number, back: boolean): string {
  const d = spindle(sm, wmax);
  return (
    `<path d="${d}" fill="${u.url(back ? 'clubB' : 'club')}" stroke="${DEEP}" stroke-opacity="0.45" stroke-width="0.9" stroke-linejoin="round"/>` +
    `<path d="${spindleBand(sm, wmax, -0.12, -0.34, 0.04, 0.72)}" fill="#FFC890" fill-opacity="${back ? 0.2 : 0.4}"/>` +
    `<path d="${spindleBand(sm, wmax, 0.16, 0.46, 0.03, 0.85)}" fill="#3A1206" fill-opacity="0.2"/>`
  );
}

const N_ARM = 48;
const ARM_TOP = 14; // đoạn gốc tay giấu vào trong cuống
const frillEnv = (t: number) => (0.5 + 0.5 * Math.sin(Math.PI * Math.pow(Math.max(0, Math.min(1, t)), 0.7))) * (1 - 0.22 * t);

function armSvg(a: ArmSpec): string {
  const r = rng(a.seed);
  const Ltot = a.L + ARM_TOP;
  const ds = Ltot / N_ARM;
  const th0 = 90 - a.lean;
  const startX = a.base[0] - Math.cos((th0 * Math.PI) / 180) * ARM_TOP;
  const main = centerline(startX, a.base[1] - ARM_TOP, th0, Ltot, a.k, N_ARM);
  const iF0 = Math.round((ARM_TOP + 2) / ds);
  const iF1 = Math.round((ARM_TOP + a.Lf) / ds);
  const set = a.back ? 'lb' : 'lf';
  const at = (t: number) => main[Math.max(0, Math.min(N_ARM, Math.round(iF0 + t * (iF1 - iF0))))];

  // dải phụ chính (nối tiếp trục tay) + 2 dải phụ ngắn tỏa hai bên
  const iC = Math.round((ARM_TOP + a.Lf * 0.68) / ds);
  let clubs = '';
  for (const side of [-1, 1]) {
    const p = at(0.5 + r() * 0.3);
    const th = (p.th * 180) / Math.PI + side * (10 + r() * 12);
    const len = (a.back ? 95 : 70) + r() * 45;
    const sm = centerline(p.x, p.y, th, len, -side * 0.0022, 22);
    clubs += club(sm, 9 + r() * 3, a.back);
  }
  clubs += club(main.slice(iC), a.back ? 15 : 17, a.back);

  // đoạn gốc tay trơn
  const topL: P[] = [];
  const topR: P[] = [];
  for (let i = 0; i <= iF0 + 5; i++) {
    topL.push(offp(main[i], 13));
    topR.push(offp(main[i], -13));
  }
  const top = !a.back ? '' : `<path d="${smoothPath([...topL, ...topR.reverse()], true)}" fill="${u.url(a.back ? 'armTopB' : 'armTop')}"/>`;

  // nền sẫm của khối súp lơ
  const envL: P[] = [];
  const envR: P[] = [];
  for (let i = iF0; i <= iF1; i++) {
    const t = (i - iF0) / (iF1 - iF0);
    const hw = frillEnv(t) * a.Wf * 0.82;
    envL.push(offp(main[i], hw));
    envR.push(offp(main[i], -hw));
  }
  const under = `<path d="${smoothPath([...envL, ...envR.reverse()], true)}" fill="${a.back ? mix(UNDER, DEEP, 0.35) : UNDER}"/>`;

  // các thùy xù
  const n = Math.round(a.Lf * (a.back ? 0.6 : 0.9));
  const items: { x: number; y: number; rr: number; g: string; af: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = r();
    const p = at(t);
    const raw = r() * 2 - 1;
    const f = Math.sign(raw) * Math.pow(Math.abs(raw), 0.8);
    const hw = frillEnv(t) * a.Wf;
    const [x, y] = offp(p, f * hw);
    const score = -f * 0.6 + (r() - 0.5) * 0.8;
    items.push({
      x: x + (r() - 0.5) * 2,
      y: y + (r() - 0.5) * 3,
      rr: (2.3 + r() * r() * 4.4) * (0.82 + 0.28 * Math.sin(Math.PI * t)),
      g: `${set}${score > 0.25 ? 0 : score < -0.3 ? 2 : 1}`,
      af: Math.abs(f),
    });
  }
  items.sort((p, q) => q.af - p.af);
  const lobes = lobeGroup(items.map((it) => lobe(it.x, it.y, it.rr, it.g)).join(''));

  // hạt li ti (miệng phụ) + kẽ tối
  let crumbs = '';
  let gaps = '';
  for (let i = 0; i < 46; i++) {
    const t = r();
    const p = at(t);
    const [x, y] = offp(p, (r() * 2 - 1) * frillEnv(t) * a.Wf * 0.95);
    if (i % 3 === 0) gaps += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(0.9 + r() * 0.9)}"/>`;
    else crumbs += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(0.7 + r() * 1.1)}"/>`;
  }
  return (
    clubs +
    top +
    under +
    lobes +
    `<g fill="#6A2A10" fill-opacity="0.4">${gaps}</g>` +
    `<g fill="#FFF2D8" fill-opacity="${a.back ? 0.4 : 0.75}">${crumbs}</g>`
  );
}

// ---------- defs ----------
const lobeGrad = (id: string, c0: string, c1: string, c2: string, dark: number) =>
  radial(
    u(id),
    [
      [0, mix(c0, DEEP, dark)],
      [0.55, mix(c1, DEEP, dark)],
      [1, mix(c2, DEEP, dark)],
    ],
    { cx: 0.62, cy: 0.3, r: 0.72 },
  );

const defs = joinDefs(
  radial(
    u('bellFill'),
    [
      [0, '#FFE9C0', 0.8],
      [0.28, '#FBB26A', 0.84],
      [0.6, '#EE7C34', 0.9],
      [0.87, '#C04A1C', 0.94],
      [1, '#8E3014', 0.96],
    ],
    { cx: 0.6, cy: 0.3, r: 0.82 },
  ),
  volumeShade(u('bellVol'), '#FFF3DC', '#7A2408'),
  rimGradient(u('rim'), '#FFF6E4', 0.9),
  `<clipPath id="${u('bellClip')}"><path d="${BELL_D}"/></clipPath>`,
  `<clipPath id="${u('stalkClip')}"><path d="${STALK_D_PATH}"/></clipPath>`,
  linear(
    u('stalkFill'),
    [
      [0, STALK_D],
      [0.24, STALK],
      [0.62, STALK_L],
      [0.86, STALK],
      [1, STALK_D],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 0 },
  ),
  linear(u('stalkShade'), [
    [0, DEEP, 0.6],
    [0.3, DEEP, 0.2],
    [0.55, DEEP, 0],
    [1, '#C06A2C', 0.25],
  ]),
  linear(
    u('armTop'),
    [
      [0, STALK_D],
      [0.5, STALK],
      [1, mix(STALK, STALK_L, 0.5)],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 0 },
  ),
  linear(
    u('armTopB'),
    [
      [0, mix(STALK_D, DEEP, 0.4)],
      [1, mix(STALK, DEEP, 0.3)],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 0 },
  ),
  linear(u('club'), [
    [0, '#E58A3E'],
    [0.2, '#B8501F'],
    [0.65, '#8A3316'],
    [1, '#5A1F0E'],
  ]),
  linear(u('clubB'), [
    [0, '#B5622C'],
    [0.2, '#8C3C18'],
    [0.65, '#672511'],
    [1, '#45170A'],
  ]),
  lobeGrad('lf0', '#FFDDAA', '#F6A85C', '#CC6A2C', 0),
  lobeGrad('lf1', '#FFD097', '#EC8E40', '#B4521F', 0),
  lobeGrad('lf2', '#F5B06A', '#D46F2B', '#93401A', 0),
  lobeGrad('lb0', '#FFDDAA', '#F6A85C', '#CC6A2C', 0.28),
  lobeGrad('lb1', '#FFD097', '#EC8E40', '#B4521F', 0.32),
  lobeGrad('lb2', '#F5B06A', '#D46F2B', '#93401A', 0.36),
  blurFilter(u('blur1'), 1),
  blurFilter(u('blur2'), 2.2),
  blurFilter(u('blur4'), 4.5),
  blurFilter(u('blur8'), 8),
  blurFilter(u('blur12'), 12),
  organicTexture(u('tex'), { freq: 0.045, octaves: 3, strength: 0.09, seed: 21 }),
);

// ---------- Lớp ----------
function armLayer(a: ArmSpec): ArtLayer {
  return {
    name: a.name,
    role: 'tentacle',
    bend: false,
    z: a.back ? 'back' : 'front',
    pivot: toVB(a.base[0], a.base[1]),
    anim: { type: 'rotate', amp: a.amp, speed: 1, phase: a.ph },
    svg: wrap(armSvg(a)),
  };
}

const art: CreatureArt = {
  id: ID,
  viewBox: VB,
  lengthUnits: 300,
  spineY: 255,
  animation: 'jelly',
  cycleHz: 0.5,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    ...ARMS.filter((a) => a.back).map(armLayer),
    { name: 'manubrium', role: 'body', svg: wrap(stalkSvg) },
    ...ARMS.filter((a) => !a.back).map(armLayer),
    {
      name: 'bell',
      role: 'bell',
      bend: false,
      z: 'front',
      pivot: toVB(0, 0),
      anim: { type: 'pulse', amp: 0.055, speed: 1 },
      svg: wrap(bellSvg),
    },
  ],
  procedural: {
    tentacles: [
      { from: toVB(-26, 288), length: 140, width: 1.6, color: '#C8622C', opacity: 0.5, count: 4, spread: 84 },
      { from: toVB(14, 296), length: 110, width: 1.2, color: '#E9A060', opacity: 0.45, count: 3, spread: 60 },
    ],
  },
};

export default art;
