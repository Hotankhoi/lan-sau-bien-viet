/**
 * Bạch tuộc đốm xanh – Hapalochlaena sp. (tham khảo chủ yếu H. lunulata)
 * Đặc điểm nhận dạng: con nhỏ, áo hình trứng hướng lên-trái, da sần nhiều nốt gai nhỏ;
 * nền vàng kem → vàng đất; mỗi "đốm" là mảng nâu ô liu có vòng mờ. Khi hoảng (lớp 'alarm'):
 * hàng chục vòng xanh lam ánh kim sáng rực, viền đen, tâm nâu – trên áo, đầu và từng tay.
 * Mắt nhô thành tháp nhỏ, đồng tử ngang. 8 tay thuôn, đầu tay cuộn, giác hút trắng kem.
 *
 * Cấu trúc lớp:
 *  - 8 tay = 8 lớp bend:false role 'arm' (pivot ở gốc tay, xoay lệch pha → uốn lượn);
 *    mỗi tay có 1 lớp 'alarm' đi kèm cùng pivot + anim để vòng xanh bám đúng tay.
 *  - Áo (mantle) là lớp tách rời "thở" nhẹ (pulse) + lớp alarm của áo cùng pivot/anim.
 *  - Đầu + màng gốc tay + phễu là lớp body (uốn, nhưng bendAmp = 0 nên đứng yên); mắt role 'eye'.
 */
import type { ArtLayer, CreatureArt } from '../contract';
import {
  makeIds,
  eye,
  linear,
  radial,
  blurFilter,
  organicTexture,
  rimGradient,
  rimLight,
  volumeShade,
  smoothPath,
  rng,
  mix,
  joinDefs,
} from '../style-bible';

const ID = 'bach_tuoc_dom_xanh';
const u = makeIds(ID);
type P = [number, number];

// ---------- Bảng màu (ước lượng từ ảnh tham khảo) ----------
const SKIN_L = '#EEDFAE'; // kem sáng
const SKIN = '#D2B062'; // vàng đất
const SKIN_D = '#A07A36'; // vùng tối
const PATCH = '#77551F'; // mảng nâu ô liu (tâm vòng)
const LINE = '#5A3B12'; // nét viền cùng tông
const RING_INK = '#0A0A0D'; // viền đen của vòng
const PAPILLA = '#F7EED3';

const f1 = (n: number) => n.toFixed(1);

// ---------- Hệ trục thân: gốc O ở cổ, trục AX hướng về chóp áo (lên-trái), NM là phía lưng ----------
const O: P = [222, 150];
const AX: P = [-0.866, -0.5];
const NM: P = [0.5, -0.866];
const W = (uu: number, vv: number): P => [O[0] + AX[0] * uu + NM[0] * vv, O[1] + AX[1] * uu + NM[1] * vv];

// ---------- ÁO (mantle) ----------
const MANTLE_PROFILE: [number, number][] = [
  [-12, 38], [0, 44], [18, 55], [45, 64], [75, 67], [104, 62], [128, 51], [148, 34], [160, 17],
];
function mantleHW(uu: number): number {
  const p = MANTLE_PROFILE;
  if (uu <= p[0][0]) return p[0][1];
  for (let i = 0; i < p.length - 1; i++) {
    if (uu >= p[i][0] && uu <= p[i + 1][0]) {
      const t = (uu - p[i][0]) / (p[i + 1][0] - p[i][0]);
      return p[i][1] + (p[i + 1][1] - p[i][1]) * t;
    }
  }
  return Math.max(0, 17 - (uu - 160) * 2.5);
}
const MANTLE_D = (() => {
  const up = MANTLE_PROFILE.map(([uu, hw]) => W(uu, hw));
  const low = MANTLE_PROFILE.map(([uu, hw]) => W(uu, -hw * 0.94)).reverse();
  return smoothPath([...up, W(166, 4), ...low], true);
})();
/** đường lưng áo (cho rim light) */
const MANTLE_BACK = smoothPath([W(0, 44), W(18, 55), W(45, 64), W(75, 67), W(104, 62), W(128, 51), W(148, 34), W(160, 17), W(166, 4)]);

// ---------- ĐẦU ----------
const EYE_C = W(-28, 46);
const HEAD_PTS: P[] = [
  W(10, 41), W(-6, 46), W(-16, 52), W(-28, 60), W(-41, 54), W(-56, 42), W(-70, 30), W(-80, 12),
  W(-82, -6), W(-74, -28), W(-58, -42), W(-36, -49), W(-14, -47), W(4, -42), W(10, -30), W(12, 0),
];
const HEAD_D = smoothPath(HEAD_PTS, true);
const HEAD_BACK = smoothPath([W(10, 41), W(-6, 46), W(-16, 52), W(-28, 60), W(-41, 54), W(-56, 42), W(-70, 30), W(-80, 12)]);

// ---------- TAY ----------
interface ArmSpec {
  name: string;
  base: P;
  /** góc xuất phát (độ, 0 = sang phải, chiều kim đồng hồ) */
  a: number;
  L: number;
  w: number;
  /** độ cong nền & độ cuộn đầu tay (rad / đơn vị) */
  k0: number;
  k1: number;
  back: boolean;
  amp: number;
  ph: number;
}

const ARMS: ArmSpec[] = [
  { name: 'armR4', base: W(-62, 34), a: -38, L: 190, w: 15, k0: 0.0035, k1: 0.02, back: true, amp: 0.1, ph: 0 },
  { name: 'armL1', base: W(-72, 20), a: -14, L: 225, w: 17, k0: 0.0015, k1: 0.021, back: false, amp: 0.11, ph: 0.8 },
  { name: 'armR3', base: W(-78, 6), a: 6, L: 215, w: 15, k0: -0.0008, k1: -0.019, back: true, amp: 0.1, ph: 1.6 },
  { name: 'armL2', base: W(-76, -10), a: 26, L: 230, w: 17, k0: 0.0018, k1: 0.017, back: false, amp: 0.12, ph: 2.4 },
  { name: 'armR2', base: W(-68, -24), a: 50, L: 200, w: 15, k0: -0.002, k1: -0.021, back: true, amp: 0.1, ph: 3.2 },
  { name: 'armL3', base: W(-58, -34), a: 70, L: 195, w: 17, k0: 0.0005, k1: -0.02, back: false, amp: 0.11, ph: 4.0 },
  { name: 'armR1', base: W(-46, -42), a: 98, L: 160, w: 14, k0: 0.003, k1: 0.02, back: true, amp: 0.1, ph: 4.8 },
  { name: 'armL4', base: W(-34, -46), a: 122, L: 150, w: 16, k0: 0.004, k1: 0.024, back: false, amp: 0.12, ph: 5.6 },
];

interface ArmSample {
  x: number;
  y: number;
  th: number;
  w: number;
}
const N_ARM = 72;

function armSamples(s: ArmSpec): ArmSample[] {
  const ds = s.L / N_ARM;
  let th = (s.a * Math.PI) / 180;
  // lùi gốc vào trong đầu một đoạn để khi tay xoay không hở khe
  let x = s.base[0] - Math.cos(th) * 8;
  let y = s.base[1] - Math.sin(th) * 8;
  const out: ArmSample[] = [];
  for (let i = 0; i <= N_ARM; i++) {
    const t = i / N_ARM;
    out.push({ x, y, th, w: s.w * (0.1 + 0.9 * Math.pow(1 - t, 0.85)) });
    th += (s.k0 + s.k1 * t * t * t) * ds;
    x += Math.cos(th) * ds;
    y += Math.sin(th) * ds;
  }
  return out;
}
const off = (p: ArmSample, f: number): P => [p.x - Math.sin(p.th) * p.w * f, p.y + Math.cos(p.th) * p.w * f];

function armOutline(sm: ArmSample[]): string {
  const left = sm.map((p) => off(p, 0.5));
  const right = sm.map((p) => off(p, -0.5)).reverse();
  const e = sm[sm.length - 1];
  const tip: P = [e.x + Math.cos(e.th) * e.w * 0.7, e.y + Math.sin(e.th) * e.w * 0.7];
  return smoothPath([...left, tip, ...right], true);
}
/** dải dọc tay giữa hai độ lệch fa..fb (tính theo bề ngang), từ mẫu i0..i1 */
function armBand(sm: ArmSample[], fa: number, fb: number, i0 = 0, i1 = sm.length - 1): string {
  const seg = sm.slice(i0, i1 + 1);
  return smoothPath([...seg.map((p) => off(p, fa)), ...seg.map((p) => off(p, fb)).reverse()], true);
}

/** vị trí các đốm vòng dọc tay (chỉ số mẫu + bán kính ngoài) */
function armRingSpots(s: ArmSpec, sm: ArmSample[]): { i: number; c: P; R: number }[] {
  const out: { i: number; c: P; R: number }[] = [];
  let t = 0.15;
  while (t < 0.87) {
    const i = Math.round(t * N_ARM);
    const p = sm[i];
    const R = p.w * 0.43;
    out.push({ i, c: off(p, 0.04), R });
    t += (p.w * 1.55) / s.L;
  }
  return out;
}

// ---------- Vòng xanh (trạng thái hoảng) ----------
function ringAlarm(c: P, R: number, rot = 0): string {
  const [x, y] = c;
  const hx = x - R * 0.48;
  const hy = y - R * 0.5;
  return (
    `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R)}" fill="${RING_INK}"/>` +
    `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R * 0.8)}" fill="${u.url('blue')}"/>` +
    `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R * 0.57)}" fill="#1c1206"/>` +
    `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R * 0.5)}" fill="${u.url('ringCore')}"/>` +
    `<ellipse cx="${f1(hx)}" cy="${f1(hy)}" rx="${f1(R * 0.22)}" ry="${f1(R * 0.1)}" fill="#ffffff" opacity="0.75" transform="rotate(${-45 + rot} ${f1(hx)} ${f1(hy)})"/>`
  );
}
function ringHalo(c: P, R: number): string {
  return `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(R * 1.15)}"/>`;
}
/** Đốm ở trạng thái thường: mảng nâu + vòng xanh xỉn mờ */
function ringCalm(c: P, R: number): string {
  return (
    `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(R * 1.18)}" fill="${PATCH}" fill-opacity="0.42"/>` +
    `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(R * 0.66)}" fill="none" stroke="#6E8C8E" stroke-opacity="0.42" stroke-width="${f1(R * 0.2)}"/>`
  );
}

// ---------- Vẽ một tay ----------
function armSvg(s: ArmSpec, idx: number): { arm: string; alarm: string; defs: string } {
  const sm = armSamples(s);
  const d = armOutline(sm);
  const clipId = u(`clip_${s.name}`);
  const gradId = u(`fill_${s.name}`);
  const first = sm[0];
  const last = sm[sm.length - 1];
  const dark = s.back ? 0.2 : 0;
  const defs =
    `<clipPath id="${clipId}"><path d="${d}"/></clipPath>` +
    linear(
      gradId,
      [
        [0, mix(SKIN_D, '#000000', dark)],
        [0.35, mix(SKIN, '#000000', dark)],
        [1, mix(SKIN_L, '#000000', dark * 0.8)],
      ],
      { user: true, x1: first.x, y1: first.y, x2: last.x, y2: last.y },
    );
  // phía giác hút = phía trong của vòng cuộn đầu tay
  const side = s.k0 + s.k1 >= 0 ? 1 : -1;
  const hs = -side;
  let suckers = '';
  for (let i = 6; i < sm.length - 2; i += 3) {
    const p = sm[i];
    const c = off(p, side * 0.45);
    const r = Math.max(0.9, p.w * 0.2);
    suckers += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(r)}"/>`;
  }
  const spots = armRingSpots(s, sm);
  // dải nâu ngang tay (mỗi dải mang một vòng)
  let bands = '';
  let calm = '';
  for (const sp of spots) {
    const span = Math.max(2, Math.round((sm[sp.i].w * 0.62) / (s.L / N_ARM)));
    const i0 = Math.max(0, sp.i - span);
    const i1 = Math.min(sm.length - 1, sp.i + span);
    bands += `<path d="${armBand(sm, 0.56, -0.56, i0, i1)}"/>`;
    calm += ringCalm(sp.c, sp.R * 0.92);
  }
  // nốt gai nhỏ
  const r = rng(101 + idx * 17);
  let pap = '';
  for (let i = 4; i < sm.length - 8; i += 2) {
    if (r() < 0.45) continue;
    const p = sm[i];
    const c = off(p, (r() - 0.5) * 0.8);
    pap += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(0.5 + r() * p.w * 0.06)}"/>`;
  }
  const arm =
    `<g fill="#F3E7C6" stroke="#8A6A3A" stroke-width="0.6" stroke-opacity="0.7">${suckers}</g>` +
    `<path d="${d}" fill="${u.url(`fill_${s.name}`)}"/>` +
    `<g clip-path="${u.url(`clip_${s.name}`)}">` +
    `<g fill="${PATCH}" fill-opacity="0.32">${bands}</g>` +
    calm +
    // mặt bụng tay nhạt hơn, sống tay có vệt sáng
    `<path d="${armBand(sm, side * 0.3, side * 0.56, 2, sm.length - 3)}" fill="${SKIN_L}" fill-opacity="0.38"/>` +
    `<path d="${armBand(sm, hs * 0.14, hs * 0.36, 3, Math.round(sm.length * 0.8))}" fill="#ffffff" fill-opacity="0.2"/>` +
    `<path d="${armBand(sm, side * 0.02, side * 0.22, 2, sm.length - 3)}" fill="#3a2508" fill-opacity="0.1"/>` +
    `<g fill="${PAPILLA}" fill-opacity="0.75">${pap}</g>` +
    (s.back ? `<path d="${d}" fill="#24170a" fill-opacity="0.16"/>` : '') +
    `</g>` +
    `<path d="${d}" fill="none" stroke="${LINE}" stroke-width="1.3" stroke-opacity="0.6" stroke-linejoin="round"/>`;
  const alarm =
    `<g clip-path="${u.url(`clip_${s.name}`)}">` +
    `<g fill="#3fd0ff" fill-opacity="0.5" filter="${u.url('halo')}">${spots.map((sp) => ringHalo(sp.c, sp.R)).join('')}</g>` +
    spots.map((sp) => ringAlarm(sp.c, sp.R, (sm[sp.i].th * 180) / Math.PI)).join('') +
    (s.back ? `<path d="${d}" fill="#0a0a14" fill-opacity="0.12"/>` : '') +
    `</g>`;
  return { arm, alarm, defs };
}

// ---------- Đốm trên áo ----------
function mantleSpots(): { c: P; R: number }[] {
  const r = rng(2024);
  const pts: { uu: number; vv: number; R: number }[] = [];
  let tries = 0;
  while (pts.length < 22 && tries < 3000) {
    tries++;
    const uu = 6 + r() * 156;
    const hw = mantleHW(uu);
    const vv = (r() * 2 - 1) * hw * 0.98;
    // vòng nhỏ dần về mép (phối cảnh)
    const edge = 1 - Math.abs(vv) / Math.max(1, hw);
    const R = 8 + 6 * Math.sqrt(Math.max(0, edge)) * (0.8 + r() * 0.3);
    if (pts.some((p) => (p.uu - uu) ** 2 + (p.vv - vv) ** 2 < ((p.R + R) * 1.12) ** 2)) continue;
    pts.push({ uu, vv, R });
  }
  return pts.map((p) => ({ c: W(p.uu, p.vv), R: p.R }));
}
const M_SPOTS = mantleSpots();

const H_SPOTS: { c: P; R: number }[] = [
  { c: W(-52, 24), R: 8.5 },
  { c: W(-6, 28), R: 8 },
  { c: W(-60, -10), R: 9 },
  { c: W(-36, -30), R: 9.5 },
  { c: W(-12, -10), R: 9 },
  { c: W(-36, 6), R: 8 },
  { c: W(-74, 8), R: 6 },
  { c: W(2, -36), R: 6.5 },
];

function papillae(seed: number, n: number, inside: (x: number, y: number) => boolean, box: [number, number, number, number]): string {
  const r = rng(seed);
  let s = '';
  let k = 0;
  let tries = 0;
  while (k < n && tries < n * 20) {
    tries++;
    const x = box[0] + r() * box[2];
    const y = box[1] + r() * box[3];
    if (!inside(x, y)) continue;
    const rr = 0.6 + r() * 1.5;
    s += `<circle cx="${f1(x + 0.5)}" cy="${f1(y + 0.7)}" r="${f1(rr)}" fill="#5a3d12" fill-opacity="0.22"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rr)}" fill="${PAPILLA}" fill-opacity="0.8"/>`;
    k++;
  }
  return s;
}
const toLocal = (x: number, y: number): [number, number] => {
  const dx = x - O[0];
  const dy = y - O[1];
  return [dx * AX[0] + dy * AX[1], dx * NM[0] + dy * NM[1]];
};
const inMantle = (x: number, y: number) => {
  const [uu, vv] = toLocal(x, y);
  return uu > 8 && uu < 160 && Math.abs(vv) < mantleHW(uu) * 0.9;
};
const inHead = (x: number, y: number) => {
  const [uu, vv] = toLocal(x, y);
  return uu < 6 && uu > -76 && Math.abs(vv) < 42 && (EYE_C[0] - x) ** 2 + (EYE_C[1] - y) ** 2 > 260;
};

// ---------- Mắt ----------
const theEye = eye(u, 'eye', {
  cx: EYE_C[0],
  cy: EYE_C[1],
  r: 9.5,
  iris: ['#EBCB72', '#7E5418'],
  pupil: 'slit',
  look: [0.35, 0.05],
});

// ---------- Màng gốc tay (web) ----------
const ARM_DATA = ARMS.map((s, i) => ({ s, ...armSvg(s, i) }));
const WEB_D = (() => {
  const pts: P[] = [W(-50, 44)];
  ARMS.forEach((s, i) => {
    const th = (s.a * Math.PI) / 180;
    const ext = 20 - i * 0.8;
    pts.push([s.base[0] + Math.cos(th) * ext, s.base[1] + Math.sin(th) * ext]);
    if (i < ARMS.length - 1) {
      const n = ARMS[i + 1];
      const th2 = (n.a * Math.PI) / 180;
      const e2 = 10;
      pts.push([
        (s.base[0] + Math.cos(th) * e2 + n.base[0] + Math.cos(th2) * e2) / 2,
        (s.base[1] + Math.sin(th) * e2 + n.base[1] + Math.sin(th2) * e2) / 2,
      ]);
    }
  });
  pts.push(W(-20, -48), W(-40, 0));
  return smoothPath(pts, true);
})();

// ---------- Phễu (siphon) ----------
const SIPHON_D = smoothPath([W(4, -38), W(-6, -50), W(-22, -58), W(-30, -56), W(-30, -48), W(-18, -44), W(-6, -36)], true);
const SIPHON_MOUTH = (() => {
  const c = W(-29, -52);
  return `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="2.6" ry="4.4" transform="rotate(-60 ${f1(c[0])} ${f1(c[1])})" fill="#3b2608" fill-opacity="0.7"/>`;
})();

// ---------- defs ----------
const defs = joinDefs(
  theEye,
  ...ARM_DATA.map((a) => a.defs),
  linear(u('mantleFill'), [
    [0, '#B08A3E'],
    [0.3, SKIN],
    [0.72, '#E1C77F'],
    [1, '#CFB06A'],
  ]),
  linear(u('headFill'), [
    [0, '#BC9645'],
    [0.4, SKIN],
    [1, '#DCC07A'],
  ]),
  volumeShade(u('vol'), '#fff6dc', '#2a1a05'),
  rimGradient(u('rim'), '#fff8e2', 0.85),
  `<clipPath id="${u('mantleClip')}"><path d="${MANTLE_D}"/></clipPath>`,
  `<clipPath id="${u('headClip')}"><path d="${HEAD_D}"/></clipPath>`,
  linear(u('blue'), [
    [0, '#C8FAFF'],
    [0.3, '#4FDcff'],
    [0.65, '#1FA2FF'],
    [1, '#1150E6'],
  ], { x1: 0, y1: 0, x2: 1, y2: 1 }),
  radial(u('ringCore'), [
    [0, '#8A6428'],
    [0.75, '#6A4818'],
    [1, '#3e2a0c'],
  ], { cx: 0.42, cy: 0.38, r: 0.65 }),
  radial(u('turret'), [
    [0, '#E6CD8A'],
    [0.7, SKIN],
    [1, SKIN_D],
  ], { cx: 0.45, cy: 0.3, r: 0.7 }),
  blurFilter(u('halo'), 2.6),
  blurFilter(u('soft'), 5),
  organicTexture(u('tex'), { freq: 0.11, octaves: 3, strength: 0.28, seed: 9 }),
);

// ---------- Lớp ----------
const mantleSvg =
  `<g filter="${u.url('tex')}"><path d="${MANTLE_D}" fill="${u.url('mantleFill')}"/></g>` +
  `<g clip-path="${u.url('mantleClip')}">` +
  M_SPOTS.map((s) => ringCalm(s.c, s.R)).join('') +
  // nếp nhăn da mềm
  `<g fill="none" stroke="${LINE}" stroke-opacity="0.14" stroke-width="1.2" stroke-linecap="round">` +
  `<path d="${smoothPath([W(30, -40), W(60, -30), W(95, -34), W(125, -26)])}"/>` +
  `<path d="${smoothPath([W(24, 30), W(58, 40), W(96, 38)])}"/>` +
  `</g>` +
  papillae(31, 70, inMantle, [40, 10, 220, 200]) +
  `<path d="${MANTLE_D}" fill="${u.url('vol')}"/>` +
  `</g>` +
  `<path d="${MANTLE_D}" fill="none" stroke="${LINE}" stroke-width="1.8" stroke-opacity="0.55" stroke-linejoin="round"/>` +
  rimLight(MANTLE_BACK, u.url('rim'), 2.4);

const mantleAlarm =
  `<g clip-path="${u.url('mantleClip')}">` +
  `<g fill="#3fd0ff" fill-opacity="0.5" filter="${u.url('halo')}">${M_SPOTS.map((s) => ringHalo(s.c, s.R)).join('')}</g>` +
  M_SPOTS.map((s) => ringAlarm(s.c, s.R)).join('') +
  `</g>`;

const eyeTurret = (() => {
  const [x, y] = EYE_C;
  return (
    `<ellipse cx="${f1(x - 1)}" cy="${f1(y + 1)}" rx="16" ry="14.5" fill="${u.url('turret')}" stroke="${LINE}" stroke-opacity="0.5" stroke-width="1.3"/>` +
    // mí trên & nếp mí dưới
    `<path d="M${f1(x - 13)} ${f1(y - 2)}Q${f1(x - 2)} ${f1(y - 15)} ${f1(x + 12)} ${f1(y - 4)}" fill="none" stroke="${LINE}" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round"/>` +
    `<path d="M${f1(x - 11)} ${f1(y + 7)}Q${f1(x)} ${f1(y + 14)} ${f1(x + 11)} ${f1(y + 6)}" fill="none" stroke="${LINE}" stroke-opacity="0.3" stroke-width="1.1" stroke-linecap="round"/>` +
    `<circle cx="${f1(x - 6)}" cy="${f1(y - 13)}" r="1.6" fill="${PAPILLA}"/><circle cx="${f1(x + 4)}" cy="${f1(y - 13.5)}" r="1.3" fill="${PAPILLA}"/>`
  );
})();

const headSvg =
  // màng gốc tay
  `<path d="${WEB_D}" fill="${u.url('headFill')}"/>` +
  `<path d="${WEB_D}" fill="#2a1a05" fill-opacity="0.12"/>` +
  `<path d="${WEB_D}" fill="none" stroke="${LINE}" stroke-opacity="0.4" stroke-width="1.2"/>` +
  // phễu
  `<path d="${SIPHON_D}" fill="${SKIN_D}" stroke="${LINE}" stroke-opacity="0.55" stroke-width="1.2"/>` +
  SIPHON_MOUTH +
  // đầu
  `<g filter="${u.url('tex')}"><path d="${HEAD_D}" fill="${u.url('headFill')}"/></g>` +
  `<g clip-path="${u.url('headClip')}">` +
  H_SPOTS.map((s) => ringCalm(s.c, s.R)).join('') +
  papillae(57, 30, inHead, [180, 110, 140, 120]) +
  `<path d="${HEAD_D}" fill="${u.url('vol')}"/>` +
  // rãnh cổ (ranh giới áo – đầu)
  `<path d="${smoothPath([W(8, 38), W(12, 10), W(10, -24), W(6, -40)])}" fill="none" stroke="${LINE}" stroke-opacity="0.3" stroke-width="1.4"/>` +
  `</g>` +
  `<path d="${HEAD_D}" fill="none" stroke="${LINE}" stroke-width="1.7" stroke-opacity="0.55" stroke-linejoin="round"/>` +
  rimLight(HEAD_BACK, u.url('rim'), 2.2) +
  eyeTurret;

const headAlarm =
  `<g clip-path="${u.url('headClip')}">` +
  `<g fill="#3fd0ff" fill-opacity="0.5" filter="${u.url('halo')}">${H_SPOTS.map((s) => ringHalo(s.c, s.R)).join('')}</g>` +
  H_SPOTS.map((s) => ringAlarm(s.c, s.R)).join('') +
  `</g>`;

function armLayers(a: (typeof ARM_DATA)[number]): ArtLayer[] {
  const { s } = a;
  const anim = { type: 'rotate' as const, amp: s.amp, speed: 1, phase: s.ph };
  const z = s.back ? ('back' as const) : ('front' as const);
  return [
    { name: s.name, role: 'arm', bend: false, z, pivot: s.base, anim, svg: a.arm },
    { name: `${s.name}_alarm`, role: 'alarm', bend: false, z, pivot: s.base, anim, svg: a.alarm },
  ];
}

const backArms = ARM_DATA.filter((a) => a.s.back).flatMap(armLayers);
const frontArms = ARM_DATA.filter((a) => !a.s.back).flatMap(armLayers);
const mantleAnim = { type: 'pulse' as const, amp: 0.025, speed: 0.5 };

const art: CreatureArt = {
  id: ID,
  viewBox: [512, 384],
  lengthUnits: 440,
  spineY: 180,
  animation: 'cephalopod',
  cycleHz: 0.7,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    ...backArms,
    { name: 'mantle', role: 'body', bend: false, z: 'back', pivot: O, anim: mantleAnim, svg: mantleSvg },
    { name: 'mantle_alarm', role: 'alarm', bend: false, z: 'back', pivot: O, anim: mantleAnim, svg: mantleAlarm },
    { name: 'head', role: 'body', svg: headSvg },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    { name: 'head_alarm', role: 'alarm', bend: false, z: 'front', svg: headAlarm },
    ...frontArms,
  ],
};

export default art;
