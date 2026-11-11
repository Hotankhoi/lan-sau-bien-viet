/**
 * Cá đuối manta rạn – Mobula alfredi (dữ liệu loài: Cá đuối manta)
 * Góc nhìn từ trên xuống (đang "bay" ngang), đầu hướng PHẢI.
 * Đặc điểm nhận dạng: đĩa thân hình thoi cực rộng (sải cánh ≈ 2,2 × chiều dài đĩa), chóp cánh nhọn hơi cụp
 * ra sau, mép sau cánh lõm; đầu rộng với miệng ngang ở mút trước, HAI THÙY ĐẦU dài (mặt ngoài sẫm, mặt trong
 * trắng) cuộn cong như sừng; lưng đen than với hai mảng vai trắng (dải sẫm giữa lưng + dải sẫm phía trước
 * tạo hình chữ T, mảng trắng có đuôi móc kéo ra sau); mép sau cánh sẫm; vây lưng nhỏ + đuôi roi ngắn KHÔNG gai.
 * Hai cánh là lớp tách rời (bend:false) vỗ chậm bằng scaleY quanh gần gốc cánh; hai thùy đầu cử động nhẹ.
 */
import type { CreatureArt } from '../contract';
import { makeIds, eye, linear, radial, joinDefs, organicTexture, finRays, rng } from '../style-bible';

const u = makeIds('duoi_manta');

// ---------- Hệ toạ độ ----------
const S = 380; // trục thân (spineY)
const PIV = 92; // gốc khớp cánh cách trục thân (gần chỗ mép trước cánh chui vào thân)

// ---------- Màu (ước lượng từ ảnh tham khảo) ----------
const ROOT = '#1a1d22'; // gốc cánh = mép thân (trùng màu để không lộ đường nối)
const MID = '#171a1f';
const TIP = '#0f1115';
const OUTLINE = '#060708';
const WHITE = '#eaeff0';
const PATCH_EDGE = '#9aa6ac';
const BELLY = '#e9eeef';

type P = [number, number];
type Seg = { c1: P; c2: P; to: P } | { to: P };

const f = (n: number) => n.toFixed(1);
const my = (p: P): P => [p[0], 2 * S - p[1]];
/** Lật một path (chỉ gồm cặp "x y") qua trục thân. */
const mirrorPath = (d: string) =>
  d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_m, x: string, y: string) => `${x} ${f(2 * S - parseFloat(y))}`);

function cubic(p0: P, p1: P, p2: P, p3: P, t: number): P {
  const m = 1 - t;
  const a = m * m * m;
  const b = 3 * m * m * t;
  const c = 3 * m * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

function build(start: P, segs: Seg[], mirror = false) {
  const tr = (p: P) => (mirror ? my(p) : p);
  const s0 = tr(start);
  let d = `M${f(s0[0])} ${f(s0[1])}`;
  const outer: P[] = [];
  let cur = s0;
  for (const s of segs) {
    const to = tr(s.to);
    if ('c1' in s) {
      const c1 = tr(s.c1);
      const c2 = tr(s.c2);
      d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(to[0])} ${f(to[1])}`;
      for (let i = 1; i <= 16; i++) outer.push(cubic(cur, c1, c2, to, i / 16));
    } else d += `L${f(to[0])} ${f(to[1])}`;
    cur = to;
  }
  return { d: d + 'Z', outer };
}

// ---------- Cánh (vây ngực) – nửa trên; nửa dưới đối xứng ----------
const WING_START: P = [424, S - 46];
const WING_SEGS: Seg[] = [
  { to: [419.5, S - 72] },
  // mép trước: gần vuông góc trục thân ở gốc, lồi nhẹ, quét ra sau ở 1/3 ngoài
  { c1: [414, S - 122], c2: [401, S - 198], to: [380, S - 254] },
  { c1: [368, S - 287], c2: [355, S - 314], to: [336, S - 336] },
  // chóp → mép sau LÕM (phồng về phía đầu) → góc sau đĩa
  { c1: [335, S - 300], c2: [323, S - 248], to: [305, S - 210] },
  { c1: [285, S - 166], c2: [254, S - 120], to: [212, S - 94] },
  { c1: [205, S - 90], c2: [200, S - 85], to: [200, S - 77] },
  { to: [240, S - 46] },
];
const LEAD_TOP = `M419.5 ${S - 72}C414 ${S - 122} 401 ${S - 198} 380 ${S - 254}C368 ${S - 287} 355 ${S - 314} 336 ${S - 336}`;
const TRAIL_TOP = `M336 ${S - 336}C335 ${S - 300} 323 ${S - 248} 305 ${S - 210}C285 ${S - 166} 254 ${S - 120} 212 ${S - 94}C205 ${S - 90} 200 ${S - 85} 200 ${S - 77}`;
const wingTop = build(WING_START, WING_SEGS);
const wingBot = build(WING_START, WING_SEGS, true);

// ---------- Thân giữa (đầu + lưng + thùy sau), nửa trên rồi đối xứng ----------
const TRUNK_HALF: Seg[] = [
  // mép trước đầu (miệng ngang)
  { c1: [450.6, S - 14], c2: [449.6, S - 28], to: [447.6, S - 40] },
  // góc đầu → hốc mắt
  { c1: [446, S - 50], c2: [442, S - 58], to: [436, S - 64] },
  // đoạn mép trước cánh nằm trên thân
  { c1: [428.5, S - 69], c2: [421, S - 76], to: [418.6, S - 90] },
  // (nằm trên cánh – không viền) vai rộng để chứa mảng trắng
  { c1: [413, S - 114], c2: [390, S - 130], to: [356, S - 131] },
  { c1: [316, S - 133], c2: [276, S - 125], to: [242, S - 104] },
  { c1: [222, S - 93], c2: [207, S - 85], to: [200, S - 77] },
  // thùy sau đĩa (lộ ra sau mép cánh)
  { c1: [192, S - 70], c2: [186, S - 60], to: [185.5, S - 48] },
  { c1: [185, S - 37], c2: [187.5, S - 27], to: [190, S - 20] },
  { c1: [192.5, S - 14], c2: [189, S - 8], to: [185, S - 5] },
];
function trunkPath(): string {
  const ends: P[] = [[450.6, S], ...TRUNK_HALF.map((s) => s.to)];
  let d = `M450.6 ${S}`;
  TRUNK_HALF.forEach((s, i) => {
    if ('c1' in s) d += `C${f(s.c1[0])} ${f(s.c1[1])} ${f(s.c2[0])} ${f(s.c2[1])} ${f(s.to[0])} ${f(s.to[1])}`;
    else d += `L${f(s.to[0])} ${f(s.to[1])}`;
    void i;
  });
  d += `L185 ${S + 5}`;
  for (let i = TRUNK_HALF.length - 1; i >= 0; i--) {
    const s = TRUNK_HALF[i];
    const to = my(ends[i]);
    if ('c1' in s) {
      const c1 = my(s.c2);
      const c2 = my(s.c1);
      d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(to[0])} ${f(to[1])}`;
    } else d += `L${f(to[0])} ${f(to[1])}`;
  }
  return d + 'Z';
}
const TRUNK = trunkPath();

/** Viền phần thân lộ ra: đầu (mép trước + góc mắt + đoạn mép trước cánh) */
const HEAD_EDGE_TOP = `M450.6 ${S}C450.6 ${S - 14} 449.6 ${S - 28} 447.6 ${S - 40}C446 ${S - 50} 442 ${S - 58} 436 ${S - 64}C428.5 ${S - 69} 421 ${S - 76} 418.6 ${S - 90}`;
/** Viền thùy sau đĩa (phần lộ ra sau mép cánh) */
const LOBE_EDGE_TOP = `M200 ${S - 77}C192 ${S - 70} 186 ${S - 60} 185.5 ${S - 48}C185 ${S - 37} 187.5 ${S - 27} 190 ${S - 20}C192.5 ${S - 14} 189 ${S - 8} 185 ${S - 5}`;

// ---------- Mảng vai trắng (hình móc câu; khoảng sẫm giữa tạo chữ T) ----------
const PATCH_TOP =
  `M396 ${S - 30}C395 ${S - 52} 389 ${S - 74} 377 ${S - 92}` +
  `C371 ${S - 100} 362 ${S - 106} 350 ${S - 109}` +
  `C330 ${S - 113} 306 ${S - 116} 284 ${S - 122}` +
  `C278 ${S - 124} 272.5 ${S - 123} 276 ${S - 119}` +
  `C292 ${S - 106} 312 ${S - 96} 326 ${S - 86}` +
  `C338 ${S - 76} 344 ${S - 60} 348 ${S - 46}` +
  `C351 ${S - 36} 356 ${S - 30} 364 ${S - 28}` +
  `C376 ${S - 26} 388 ${S - 27} 396 ${S - 30}Z`;
const PATCH_BOT = mirrorPath(PATCH_TOP);

// ---------- Đuôi roi ngắn + vây lưng nhỏ (không gai) ----------
function tail(): string {
  const p0: P = [192, S];
  const p1: P = [130, S + 1];
  const p2: P = [72, S + 14];
  const p3: P = [22, S + 9];
  const n = 48;
  const left: P[] = [];
  const right: P[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = cubic(p0, p1, p2, p3, t);
    const q = cubic(p0, p1, p2, p3, Math.min(1, t + 0.002));
    const pp = cubic(p0, p1, p2, p3, Math.max(0, t - 0.002));
    const dx = q[0] - pp[0];
    const dy = q[1] - pp[1];
    const L = Math.hypot(dx, dy) || 1;
    const w = 5.6 * Math.pow(Math.max(0, 1 - t), 1.3) + 0.55;
    left.push([p[0] - (dy / L) * w, p[1] + (dx / L) * w]);
    right.push([p[0] + (dy / L) * w, p[1] - (dx / L) * w]);
  }
  const pts = [...left, ...right.reverse()];
  const d = `M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`;
  const hi = right.slice().reverse().slice(1, 34);
  const hiD = `M${hi.map((p) => `${f(p[0])} ${f(p[1] + 1)}`).join('L')}`;
  return (
    `<path d="${d}" fill="${u.url('tail')}" stroke="${OUTLINE}" stroke-opacity="0.55" stroke-width="0.8" stroke-linejoin="round"/>` +
    `<path d="${hiD}" fill="none" stroke="#b7c6cf" stroke-opacity="0.3" stroke-width="1" stroke-linecap="round"/>`
  );
}

// ---------- Vây bụng tròn hai bên gốc đuôi ----------
const PELVIC_TOP = `M190 ${S - 10}C185 ${S - 21} 176 ${S - 24} 171 ${S - 20.5}C168 ${S - 15.5} 175 ${S - 9} 186 ${S - 6}Z`;
const PELVIC_BOT = mirrorPath(PELVIC_TOP);
const DORSAL = `M197 ${S}C186 ${S - 6.5} 171 ${S - 6} 157 ${S - 1.2}C171 ${S + 4} 186 ${S + 5} 197 ${S}Z`;

// ---------- Thùy đầu (cephalic fins) – cuộn cong như sừng ----------
const CEPH_TOP =
  `M439 ${S - 60}C456 ${S - 67} 476 ${S - 64} 490 ${S - 53}` +
  `C498 ${S - 46} 500.5 ${S - 36} 496 ${S - 27.5}` +
  `C494 ${S - 24} 490 ${S - 23.5} 488.5 ${S - 27}` +
  `C488 ${S - 34} 485 ${S - 38} 477 ${S - 40}` +
  `C467 ${S - 42} 455 ${S - 41} 448 ${S - 42}` +
  `C445.5 ${S - 43} 444 ${S - 45} 443.5 ${S - 48}Z`;
const CEPH_INNER_TOP = `M496 ${S - 27.5}C494 ${S - 24} 490 ${S - 23.5} 488.5 ${S - 27}C488 ${S - 34} 485 ${S - 38} 477 ${S - 40}C467 ${S - 42} 455 ${S - 41} 448 ${S - 42}`;
const CEPH_CURL_TOP = `M495.5 ${S - 40}C490 ${S - 45} 482 ${S - 47} 470 ${S - 47.5}C460 ${S - 48} 452 ${S - 49} 446 ${S - 51}`;
const CEPH_OUTER_TOP = `M439 ${S - 60}C456 ${S - 67} 476 ${S - 64} 490 ${S - 53}C498 ${S - 46} 500.5 ${S - 36} 496 ${S - 27.5}`;

function cephSvg(bottom: boolean): string {
  const m = (d: string) => (bottom ? mirrorPath(d) : d);
  const id = bottom ? 'cephBot' : 'cephTop';
  return (
    `<path d="${m(CEPH_TOP)}" fill="${u.url(id)}" stroke="${OUTLINE}" stroke-opacity="0.6" stroke-width="1.1" stroke-linejoin="round"/>` +
    `<g clip-path="${u.url(id + 'Clip')}">` +
    // mặt trong trắng lộ ra ở mép cuộn
    `<path d="${m(CEPH_INNER_TOP)}" fill="none" stroke="${BELLY}" stroke-opacity="0.82" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="${m(CEPH_CURL_TOP)}" fill="none" stroke="#9aa6ac" stroke-opacity="0.55" stroke-width="1.6"/>` +
    `<path d="${m(CEPH_CURL_TOP)}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.45" stroke-width="1" transform="translate(0 ${bottom ? 1.6 : -1.6})"/>` +
    `</g>` +
    `<path d="${m(CEPH_OUTER_TOP)}" fill="none" stroke="#c8d7df" stroke-opacity="${bottom ? 0.18 : 0.4}" stroke-width="1.3" stroke-linecap="round" transform="translate(-0.6 ${bottom ? -0.9 : 0.9})"/>`
  );
}

// ---------- Cánh: lắp ráp ----------
function wingSvg(bottom: boolean): string {
  const w = bottom ? wingBot : wingTop;
  const id = bottom ? 'wingBot' : 'wingTop';
  const lead = bottom ? mirrorPath(LEAD_TOP) : LEAD_TOP;
  const trail = bottom ? mirrorPath(TRAIL_TOP) : TRAIL_TOP;
  const sgn = bottom ? 1 : -1;
  // gân sụn tỏa từ gốc cánh ra mép (rất mờ)
  const outerPts = w.outer.filter((p) => Math.abs(p[1] - S) > 165);
  const bases: P[] = [];
  const tips: P[] = [];
  const N = 22;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    bases.push([240 + t * 150, S + sgn * (150 + Math.sin(t * Math.PI) * 14)]);
    const q = outerPts[Math.round((1 - t) * (outerPts.length - 1))];
    tips.push([q[0], q[1] - sgn * 5]);
  }
  return (
    `<g filter="${u.url('skin')}"><path d="${w.d}" fill="${u.url(id + 'Fill')}"/></g>` +
    `<g clip-path="${u.url(id + 'Clip')}">` +
    `<path d="${w.d}" fill="${u.url(id + 'Sheen')}"/>` +
    `<g mask="${u.url(id + 'Fade')}">` +
    finRays(bases, tips, { color: '#000000', opacity: 0.13, width: 2, bend: 0.04 }) +
    finRays(bases.map((b) => [b[0] + 4, b[1]] as P), tips.map((t) => [t[0] + 4, t[1]] as P), { color: '#7d93a3', opacity: 0.06, width: 1.4, bend: 0.04 }) +
    // mép sau sẫm
    `<path d="${trail}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.6" stroke-width="18" filter="${u.url('soft2')}"/>` +
    `<path d="${trail}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.5" stroke-width="5"/>` +
    `</g>` +
    // mép trước dày
    `<path d="${lead}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.3" stroke-width="7"/>` +
    (bottom ? `<path d="${lead}" fill="none" stroke="${BELLY}" stroke-opacity="0.32" stroke-width="2.2" transform="translate(0 1.4)"/>` : '') +
    `</g>` +
    `<path d="${lead}${trail.replace(/^M[^C]+/, '')}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.7" stroke-width="1.8" stroke-linejoin="round"/>` +
    `<path d="${lead}" fill="none" stroke="${u.url(id + 'Rim')}" stroke-width="${bottom ? 1.6 : 2.6}" stroke-linecap="round" transform="translate(${bottom ? 0 : -0.6} ${bottom ? 0 : 1.3})"/>`
  );
}

// ---------- Mắt (hai bên đầu, sau gốc thùy đầu) ----------
const eyeTop = eye(u, 'eyeTop', { cx: 435.5, cy: S - 63.5, r: 4.2, iris: ['#6b5a40', '#1d160e'], socket: '#0b0c0f', look: [0.3, -0.5] });
const eyeBot = eye(u, 'eyeBot', { cx: 435.5, cy: S + 63.5, r: 4.2, iris: ['#5e4f38', '#19130c'], socket: '#0b0c0f', look: [0.3, 0.5] });

// ---------- Lấm tấm xám trên mảng trắng ----------
function patchSpeckles(seed: number, bottom: boolean): string {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < 18; i++) {
    const x = 285 + r() * 110;
    const dy = 26 + r() * 82;
    const y = bottom ? S + dy : S - dy;
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${(0.8 + r() * 1.8).toFixed(2)}" ry="${(0.6 + r() * 1.1).toFixed(2)}" transform="rotate(${(r() * 180).toFixed(0)} ${f(x)} ${f(y)})"/>`;
  }
  return `<g fill="#6d7a82" fill-opacity="0.28">${s}</g>`;
}

// ---------- defs ----------
const defs = joinDefs(
  eyeTop,
  eyeBot,
  organicTexture(u('skin'), { freq: 0.045, octaves: 3, strength: 0.14, seed: 23 }),
  `<clipPath id="${u('wingTopClip')}"><path d="${wingTop.d}"/></clipPath>`,
  `<clipPath id="${u('wingBotClip')}"><path d="${wingBot.d}"/></clipPath>`,
  `<mask id="${u('wingTopFade')}" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="${S}"><rect x="0" y="0" width="512" height="${S}" fill="${u.url('fadeTop')}"/></mask>`,
  `<mask id="${u('wingBotFade')}" maskUnits="userSpaceOnUse" x="0" y="${S}" width="512" height="${S}"><rect x="0" y="${S}" width="512" height="${S}" fill="${u.url('fadeBot')}"/></mask>`,
  linear(u('fadeTop'), [[0, '#ffffff'], [1, '#000000']], { user: true, x1: 0, y1: S - 215, x2: 0, y2: S - 148 }),
  linear(u('fadeBot'), [[0, '#ffffff'], [1, '#000000']], { user: true, x1: 0, y1: S + 215, x2: 0, y2: S + 148 }),
  `<clipPath id="${u('trunkClip')}"><path d="${TRUNK}"/></clipPath>`,
  `<clipPath id="${u('cephTopClip')}"><path d="${CEPH_TOP}"/></clipPath>`,
  `<clipPath id="${u('cephBotClip')}"><path d="${mirrorPath(CEPH_TOP)}"/></clipPath>`,
  linear(u('wingTopFill'), [[0, ROOT], [0.3, ROOT], [0.65, MID], [1, TIP]], { user: true, x1: 0, y1: S - PIV, x2: 0, y2: S - 336 }),
  linear(u('wingBotFill'), [[0, ROOT], [0.3, ROOT], [0.65, MID], [1, '#0c0e11']], { user: true, x1: 0, y1: S + PIV, x2: 0, y2: S + 336 }),
  radial(u('wingTopSheen'), [[0, '#9fb6c6', 0.2], [0.55, '#9fb6c6', 0.06], [1, '#9fb6c6', 0]], { user: true, cx: 352, cy: S - 238, r: 104 }),
  radial(u('wingBotSheen'), [[0, '#9fb6c6', 0.09], [0.6, '#9fb6c6', 0.025], [1, '#9fb6c6', 0]], { user: true, cx: 352, cy: S + 238, r: 100 }),
  linear(u('wingTopRim'), [[0, '#e4f2f8', 0.7], [0.7, '#e4f2f8', 0.38], [1, '#e4f2f8', 0.12]], { user: true, x1: 419, y1: S - 72, x2: 336, y2: S - 336 }),
  linear(u('wingBotRim'), [[0, '#e4f2f8', 0.25], [1, '#e4f2f8', 0.05]], { user: true, x1: 419, y1: S + 72, x2: 336, y2: S + 336 }),
  `<filter id="${u('soft')}" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="8"/></filter>`,
  `<filter id="${u('soft2')}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>`,
  `<filter id="${u('feather')}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8"/></filter>`,
  linear(u('patch'), [[0, '#f4f7f7', 0.97], [0.45, WHITE, 0.95], [0.8, '#c3ccd0', 0.8], [1, '#8f9ca3', 0.45]], { user: true, x1: 400, y1: 0, x2: 280, y2: 0 }),
  radial(u('ridgeHi'), [[0, '#8fa4b4', 0.16], [0.6, '#8fa4b4', 0.05], [1, '#8fa4b4', 0]], { user: true, cx: 330, cy: S, r: 120, transform: `translate(330 ${S}) scale(1.25 0.2) translate(-330 ${-S})` }),
  radial(u('headHi'), [[0, '#c4d3dc', 0.2], [1, '#c4d3dc', 0]], { user: true, cx: 432, cy: S - 10, r: 34 }),
  linear(u('headRim'), [[0, '#ffffff', 0.12], [0.5, '#ffffff', 0.4], [1, '#ffffff', 0.18]], { user: true, x1: 418, y1: 0, x2: 451, y2: 0 }),
  linear(u('tail'), [[0, '#202329'], [0.35, '#16181c'], [1, '#101114']], { user: true, x1: 192, y1: 0, x2: 22, y2: 0 }),
  linear(u('pelvic'), [[0, '#22262c'], [1, '#14161a']], { user: true, x1: 191, y1: 0, x2: 162, y2: 0 }),
  linear(u('cephTop'), [[0, '#1d2127'], [0.7, '#262b33'], [1, '#30363f']], { user: true, x1: 440, y1: 0, x2: 500, y2: 0 }),
  linear(u('cephBot'), [[0, '#1b1f25'], [0.7, '#22272e'], [1, '#2a3038']], { user: true, x1: 440, y1: 0, x2: 492, y2: 0 }),
);

// ---------- Thân giữa ----------
const bodySvg =
  // vây bụng + vây lưng nhỏ (nằm dưới thùy sau đĩa)
  `<path d="${PELVIC_TOP}" fill="${u.url('pelvic')}" stroke="${OUTLINE}" stroke-opacity="0.6" stroke-width="1.1"/>` +
  `<path d="${PELVIC_BOT}" fill="${u.url('pelvic')}" stroke="${OUTLINE}" stroke-opacity="0.6" stroke-width="1.1"/>` +
  `<path d="M186 ${S - 8.5}C179 ${S - 13} 175 ${S - 17} 172 ${S - 19.5}" fill="none" stroke="#b5c3cb" stroke-opacity="0.2" stroke-width="1"/>` +
  `<g filter="${u.url('skin')}"><path d="${TRUNK}" fill="${ROOT}"/></g>` +
  `<g clip-path="${u.url('trunkClip')}">` +
  // sống lưng hơi gồ, ánh bóng xanh xám
  `<path d="${TRUNK}" fill="${u.url('ridgeHi')}"/>` +
  `<path d="M206 ${S}C260 ${S - 9} 380 ${S - 11} 440 ${S - 4}" fill="none" stroke="#7f95a6" stroke-opacity="0.09" stroke-width="6" filter="${u.url('soft2')}"/>` +
  `<path d="${TRUNK}" fill="${u.url('headHi')}"/>` +
  // mảng vai trắng (mép nhoè, xám dần về đuôi móc)
  `<g filter="${u.url('feather')}">` +
  `<path d="${PATCH_TOP}" fill="${u.url('patch')}"/>` +
  `<path d="${PATCH_BOT}" fill="${u.url('patch')}" fill-opacity="0.92"/>` +
  `</g>` +
  `<path d="${PATCH_TOP}" fill="none" stroke="${PATCH_EDGE}" stroke-opacity="0.45" stroke-width="3" filter="${u.url('feather')}"/>` +
  `<path d="${PATCH_BOT}" fill="none" stroke="${PATCH_EDGE}" stroke-opacity="0.45" stroke-width="3" filter="${u.url('feather')}"/>` +
  `<g clip-path="${u.url('patchClip')}">${patchSpeckles(71, false)}${patchSpeckles(72, true)}</g>` +
  // bóng nhẹ đổ lên mảng trắng từ gờ lưng
      `</g>` +
  // viền thân lộ ra + rim light đầu
  `<path d="${HEAD_EDGE_TOP}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.7" stroke-width="1.8"/>` +
  `<path d="${mirrorPath(HEAD_EDGE_TOP)}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.7" stroke-width="1.8"/>` +
  `<path d="${LOBE_EDGE_TOP}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.65" stroke-width="1.6"/>` +
  `<path d="${mirrorPath(LOBE_EDGE_TOP)}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.65" stroke-width="1.6"/>` +
  `<path d="${HEAD_EDGE_TOP}" fill="none" stroke="${u.url('headRim')}" stroke-width="2.2" transform="translate(-0.8 1.2)"/>`;

const faceSvg =
  // hàm dưới nhô nhẹ trước mép đầu (miệng ngang, viền môi nhạt)
  `<path d="M447.6 ${S - 40}C452.5 ${S - 27} 454.6 ${S - 13} 454.6 ${S}C454.6 ${S + 13} 452.5 ${S + 27} 447.6 ${S + 40}C449.6 ${S + 28} 450.6 ${S + 14} 450.6 ${S}C450.6 ${S - 14} 449.6 ${S - 28} 447.6 ${S - 40}Z" fill="#cdd6d9" fill-opacity="0.85" stroke="${OUTLINE}" stroke-opacity="0.55" stroke-width="0.9"/>` +
  `<path d="M448.6 ${S - 36}C451 ${S - 24} 451.6 ${S - 12} 451.6 ${S}C451.6 ${S + 12} 451 ${S + 24} 448.6 ${S + 36}" fill="none" stroke="#0a0b0d" stroke-opacity="0.75" stroke-width="1.3"/>` +
  // gờ sọ giữa hai mắt
  `<path d="M418 ${S - 44}Q436 ${S - 30} 444 ${S - 12}" fill="none" stroke="#b9cbd6" stroke-opacity="0.12" stroke-width="2.2"/>` +
  `<path d="M418 ${S + 44}Q436 ${S + 30} 444 ${S + 12}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.25" stroke-width="2.2"/>` +
  // lỗ thở nhỏ sau mắt
  `<g fill="#050607" fill-opacity="0.8"><ellipse cx="424" cy="${S - 56}" rx="3.2" ry="1.4" transform="rotate(-30 424 ${S - 56})"/><ellipse cx="424" cy="${S + 56}" rx="3.2" ry="1.4" transform="rotate(30 424 ${S + 56})"/></g>`;

const art: CreatureArt = {
  id: 'duoi_manta',
  viewBox: [512, 760],
  lengthUnits: 478,
  spineY: S,
  animation: 'ray',
  cycleHz: 0.3,
  bendAmp: 0,
  // dài 230px → sải cánh ≈ 325px: to gấp ~1,7 lần thợ lặn (190px) nhưng vẫn gọn trong màn hình/khung ảnh
  displayLengthPx: 230,
  cardDetailLevel: 'hi',
  defs: defs + `<clipPath id="${u('patchClip')}"><path d="${PATCH_TOP}${PATCH_BOT}"/></clipPath>`,
  layers: [
    {
      name: 'tail',
      role: 'tail',
      bend: false,
      z: 'back',
      pivot: [192, S],
      anim: { type: 'rotate', amp: 0.035, phase: -1.4 },
      svg: tail() + `<path d="${DORSAL}" fill="#1b1e23" stroke="${OUTLINE}" stroke-opacity="0.6" stroke-width="0.8"/><path d="M166 ${S - 2.6}C162 ${S - 2} 159 ${S - 1.6} 157 ${S - 1.2}C160 ${S + 0.6} 163 ${S + 1.4} 167 ${S + 1.6}Z" fill="#c9d3d8" fill-opacity="0.55"/>`,
    },
    {
      name: 'wingTop',
      role: 'wing',
      bend: false,
      z: 'back',
      pivot: [300, S - PIV],
      anim: { type: 'scaleY', amp: 0.15 },
      svg: wingSvg(false),
    },
    {
      name: 'wingBottom',
      role: 'wing',
      bend: false,
      z: 'back',
      pivot: [300, S + PIV],
      anim: { type: 'scaleY', amp: 0.15 },
      svg: wingSvg(true),
    },
    { name: 'body', role: 'body', svg: bodySvg },
    { name: 'face', role: 'detail', svg: faceSvg },
    { name: 'eyes', role: 'eye', svg: eyeTop.svg + eyeBot.svg },
    {
      name: 'cephalicTop',
      role: 'fin',
      bend: false,
      z: 'front',
      pivot: [443, S - 52],
      anim: { type: 'rotate', amp: 0.07, speed: 0.5, phase: 0.6 },
      svg: cephSvg(false),
    },
    {
      name: 'cephalicBottom',
      role: 'fin',
      bend: false,
      z: 'front',
      pivot: [443, S + 52],
      anim: { type: 'rotate', amp: 0.07, speed: 0.5, phase: 0.6 + Math.PI },
      svg: cephSvg(true),
    },
  ],
};

export default art;
