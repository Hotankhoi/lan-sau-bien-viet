/**
 * Sứa hộp – Chironex sp. (Biển miền Nam) – CỰC KỲ NGUY HIỂM
 * Đặc điểm nhận dạng: chuông hình hộp (khối vuông bo góc, đỉnh vòm thấp) gần như trong suốt ánh xanh nhạt –
 * chỉ thấy nhờ viền sáng, gờ góc phản quang và mép chuông; 4 góc có cuống dẹt (pedalia) như "bàn tay",
 * mỗi cuống thả một chùm xúc tu rất dài, mảnh, kết hạt tế bào gai; giữa mỗi mặt chuông có hốc mắt
 * (rhopalium) với cụm mắt nhỏ sẫm; miệng chuông có diềm velarium thắt vào trong; bên trong lờ mờ ống miệng,
 * túi tuyến sinh dục dạng lá và chùm sợi vị.
 *
 * Cấu trúc lớp (vẽ trong hệ trục "đứng thẳng", gốc ở đỉnh chuông, y hướng xuống, nghiêng TILT độ):
 *  - 2 "bàn tay" phía sau (cuống + chùm xúc tu): bend:false z:'back', xoay quanh gốc cuống.
 *  - 'interior' (ống miệng, túi sinh dục, sợi vị – nhìn xuyên qua chuông): lớp body đứng yên (bendAmp 0).
 *  - 'bell': bend:false z:'front', pivot ở tâm miệng chuông, anim 'pulse' (co bóp đẩy nước).
 *  - 2 "bàn tay" phía trước: bend:false z:'front'.
 *  - sợi xúc tu mảnh phụ: procedural.tentacles (chỉ có trong game, lắc theo vật lý dây).
 */
import type { ArtLayer, CreatureArt } from '../contract';
import { makeIds, linear, radial, blurFilter, rimGradient, rimLight, smoothPath, scatterSpots, rng, joinDefs } from '../style-bible';

const ID = 'sua_hop';
const u = makeIds(ID);
type P = [number, number];
const f1 = (n: number) => n.toFixed(1);
const rad = (d: number) => (d * Math.PI) / 180;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// ---------- Hệ trục ----------
const VB: P = [330, 640];
const AX = 214;
const AY = 30;
const TILT = 8;
const CT = Math.cos(rad(TILT));
const ST = Math.sin(rad(TILT));
const toVB = (x: number, y: number): P => [AX + x * CT - y * ST, AY + x * ST + y * CT];
const wrap = (s: string) => `<g transform="translate(${AX} ${AY}) rotate(${TILT})">${s}</g>`;

// ---------- Bảng màu ----------
const EDGE = '#F2FFFF'; // viền phản quang
const LINE = '#1D5866'; // nét sẫm tách nền
const GLASS = '#BDEFFF';
const TENT = '#F4F0DC'; // xúc tu kem trắng
const TENT_D = '#C9B9D6'; // ánh tím nhạt ở đoạn xa

// ---------- CHUÔNG: hình hộp vuông bo góc ----------
const H = 158; // chiều cao chuông
const S = 64; // nửa cạnh mặt cắt
const THETA = 32; // góc xoay quanh trục đứng (độ) – nhìn 3/4
const PERSP = 0.17; // độ nghiêng nhìn từ trên xuống
const CTH = Math.cos(rad(THETA));
const STH = Math.sin(rad(THETA));

/** hệ số phình theo chiều cao (t = y/H) */
const R_PROF: P[] = [
  [0, 0], [0.03, 0.38], [0.07, 0.56], [0.12, 0.7], [0.19, 0.82], [0.28, 0.91], [0.4, 0.97],
  [0.58, 1.0], [0.76, 1.015], [0.9, 1.01], [0.96, 0.98], [1, 0.94],
];
function rAt(t: number): number {
  const tt = clamp01(t);
  for (let i = 1; i < R_PROF.length; i++) {
    const [t1, r1] = R_PROF[i];
    const [t0, r0] = R_PROF[i - 1];
    if (tt <= t1) return r0 + ((tt - t0) / (t1 - t0)) * (r1 - r0);
  }
  return R_PROF[R_PROF.length - 1][1];
}
/** số mũ siêu elip: đỉnh tròn hơn, thân vuông hơn */
const nAt = (t: number) => 2.2 + 2.2 * clamp01(t / 0.38);
const spow = (c: number, e: number) => Math.sign(c) * Math.pow(Math.abs(c), e);

/** điểm trên mặt chuông: t = độ cao (0 đỉnh → 1 miệng), psiDeg = góc trong mặt bằng; k = hệ số co (velarium) */
function surf(t: number, psiDeg: number, k = 1): { x: number; y: number; z: number } {
  const r = rAt(t) * S * k;
  const e = 2 / nAt(t);
  const a = r * spow(Math.cos(rad(psiDeg)), e);
  const b = r * spow(Math.sin(rad(psiDeg)), e);
  const X = a * CTH - b * STH;
  const Z = a * STH + b * CTH;
  return { x: X, y: t * H + Z * PERSP, z: Z };
}
const sp = (t: number, psi: number, k = 1): P => {
  const q = surf(t, psi, k);
  return [q.x, q.y];
};

/** bao lồi của mọi mặt cắt → đường viền chuông */
const BELL_D = (() => {
  const pts: P[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    for (let j = 0; j < 96; j++) pts.push(sp(t, (360 * j) / 96));
  }
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: P, a: P, b: P) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P[] = [];
  for (const p of pts) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const up: P[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  const hull = [...lo.slice(0, -1), ...up.slice(0, -1)];
  return 'M' + hull.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') + 'Z';
})();

/** vòng mặt cắt ở độ cao t (psi từ a → b) */
function ring(t: number, a: number, b: number, k = 1, closed = false): string {
  const pts: P[] = [];
  const n = Math.max(6, Math.round(Math.abs(b - a) / 6));
  for (let i = 0; i <= n; i++) pts.push(sp(t, a + ((b - a) * i) / n, k));
  return smoothPath(closed ? pts.slice(0, -1) : pts, closed);
}
/** cung phía trước (Z ≥ 0) và phía sau */
const FRONT_A = -THETA;
const FRONT_B = 180 - THETA;
/** đường dọc theo một góc psi trên mặt chuông */
function meridian(psi: number, t0: number, t1: number, k = 1): string {
  const pts: P[] = [];
  for (let i = 0; i <= 14; i++) pts.push(sp(t0 + ((t1 - t0) * i) / 14, psi, k));
  return smoothPath(pts);
}

/** 4 góc (psi) – thứ tự: phải-sau, trước, trái, sau */
const CORNERS = [-45, 45, 135, 225];
const depth = (psi: number) => Math.sin(rad(psi + THETA));
/** 4 mặt (psi giữa mặt) */
const FACES = [0, 90, 180, 270];

/** cụm mắt rhopalium trong hốc giữa mặt */
function rhopalium(psi: number): string {
  const d = depth(psi);
  const vis = 0.35 + 0.65 * clamp01((d + 1) / 2);
  const [x, y] = sp(0.84, psi);
  const [xn, yn] = sp(0.84, psi, 0.9);
  // hướng ngang của mặt ở điểm đó → co bề ngang theo góc nhìn
  const squash = Math.max(0.25, Math.abs(Math.cos(rad(psi + THETA - 90))));
  const cx = d > 0 ? x : xn;
  const cy = d > 0 ? y : yn;
  const w = 7.5 * squash;
  return (
    `<g opacity="${vis.toFixed(2)}">` +
    // hốc (niche) hình chữ U ngược, sáng nhẹ
    `<path d="M${f1(cx - w)} ${f1(cy + 6)}Q${f1(cx - w)} ${f1(cy - 9)} ${f1(cx)} ${f1(cy - 10)}Q${f1(cx + w)} ${f1(cy - 9)} ${f1(cx + w)} ${f1(cy + 6)}" fill="#E8FCFF" fill-opacity="0.16" stroke="${EDGE}" stroke-opacity="0.45" stroke-width="0.7"/>` +
    // cuống mắt
    `<path d="M${f1(cx)} ${f1(cy - 8)}L${f1(cx)} ${f1(cy - 1)}" stroke="#E6F6FA" stroke-opacity="0.7" stroke-width="0.9"/>` +
    // khối mắt + 2 mắt thấu kính + mắt khe nhỏ
    `<ellipse cx="${f1(cx)}" cy="${f1(cy + 1.5)}" rx="${f1(2.6 * squash + 0.8)}" ry="3.2" fill="#DCEFF2" fill-opacity="0.75"/>` +
    `<ellipse cx="${f1(cx)}" cy="${f1(cy + 0.4)}" rx="${f1(1.2 * squash + 0.4)}" ry="1.1" fill="#3A2A22" fill-opacity="0.85"/>` +
    `<ellipse cx="${f1(cx)}" cy="${f1(cy + 2.9)}" rx="${f1(1.5 * squash + 0.5)}" ry="1.35" fill="#2A1E18" fill-opacity="0.9"/>` +
    `<circle cx="${f1(cx + 0.5)}" cy="${f1(cy + 2.4)}" r="0.45" fill="#ffffff" fill-opacity="0.9"/>` +
    `<circle cx="${f1(cx - 1.6 * squash - 0.3)}" cy="${f1(cy + 1.6)}" r="0.45" fill="#3A2A22" fill-opacity="0.7"/>` +
    `<circle cx="${f1(cx + 1.6 * squash + 0.3)}" cy="${f1(cy + 1.6)}" r="0.45" fill="#3A2A22" fill-opacity="0.7"/>` +
    `</g>`
  );
}

const bellSvg = (() => {
  // gờ góc: phía trước sáng rõ, phía sau mờ
  let ridgesFront = '';
  let ridgesBack = '';
  let ridgesGlow = '';
  for (const c of CORNERS) {
    const d = meridian(c, 0.07, 0.985);
    if (depth(c) > -0.1) {
      ridgesFront += `<path d="${d}"/>`;
      ridgesGlow += `<path d="${d}"/>`;
    } else ridgesBack += `<path d="${d}"/>`;
  }
  // đường giữa mặt rất mờ (vách trong)
  let faceLines = '';
  for (const f of FACES) faceLines += `<path d="${meridian(f, 0.16, 0.8, 0.97)}"/>`;
  // velarium: diềm thắt vào trong ở miệng chuông, có kênh tỏa nhánh
  const velOuterF = ring(0.985, FRONT_A, FRONT_B);
  const velOuterB = ring(0.985, FRONT_B, 360 + FRONT_A);
  const velInner = ring(1, 0, 360, 0.6, true);
  const velBand = (() => {
    const o: P[] = [];
    const i: P[] = [];
    for (let j = 0; j <= 72; j++) {
      o.push(sp(0.985, j * 5));
      i.push(sp(1, j * 5, 0.6));
    }
    return smoothPath(o.slice(0, -1), true) + smoothPath(i.slice(0, -1).reverse(), true);
  })();
  let canals = '';
  const r = rng(808);
  for (let j = 0; j < 32; j++) {
    const psi = j * 11.25 + 4;
    const a = sp(0.985, psi, 0.97);
    const m = sp(0.995, psi + (r() - 0.5) * 6, 0.8);
    const b = sp(1, psi + (r() - 0.5) * 10, 0.64);
    const vis = clamp01((depth(psi) + 1.1) / 2);
    canals += `<path d="M${f1(a[0])} ${f1(a[1])}Q${f1(m[0])} ${f1(m[1])} ${f1(b[0])} ${f1(b[1])}" stroke-opacity="${(0.12 + 0.3 * vis).toFixed(2)}"/>`;
  }
  // khung (frenula) ở 4 góc giữ velarium
  let frenula = '';
  for (const c of CORNERS) {
    const a = sp(0.9, c, 0.98);
    const b = sp(1, c, 0.66);
    frenula += `<path d="M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}"/>`;
  }
  // vòng vai (đỉnh vòm chuyển sang thân hộp)
  const shoulderF = ring(0.16, FRONT_A, FRONT_B);
  const [hx, hy] = sp(0.28, 60);
  return (
    // ---- nền thủy tinh
    `<path d="${BELL_D}" fill="${u.url('glass')}"/>` +
    `<g clip-path="${u.url('bellClip')}">` +
    // các mặt phía sau nhìn xuyên
    `<g fill="none" stroke="${EDGE}" stroke-opacity="0.22" stroke-width="1.1">${ridgesBack}<path d="${velOuterB}"/></g>` +
    `<g fill="none" stroke="#DDF7FF" stroke-opacity="0.07" stroke-width="5" filter="${u.url('blur2')}">${faceLines}</g>` +
    // velarium
    `<path d="${velBand}" fill="#E4FAFF" fill-opacity="0.16" fill-rule="evenodd"/>` +
    `<g fill="none" stroke="#F2FFFF" stroke-width="0.6" stroke-linecap="round">${canals}</g>` +
    `<g fill="none" stroke="${EDGE}" stroke-opacity="0.35" stroke-width="1.2">${frenula}</g>` +
    `<path d="${velInner}" fill="none" stroke="${EDGE}" stroke-opacity="0.55" stroke-width="0.9"/>` +
    // tia nắng khúc xạ: mặt trước – sáng hơn phía đối diện nguồn sáng
    `<ellipse cx="-30" cy="96" rx="34" ry="54" fill="#E9FDFF" fill-opacity="0.12" filter="${u.url('blur12')}"/>` +
    // hiệu ứng Fresnel: mép sáng lên
    `<path d="${BELL_D}" fill="none" stroke="#EFFFFF" stroke-opacity="0.3" stroke-width="14" filter="${u.url('blur4')}"/>` +
    // gờ góc phía trước: quầng + nét
    `<g fill="none" stroke="#E8FFFF" stroke-opacity="0.32" stroke-width="5" filter="${u.url('blur2')}">${ridgesGlow}</g>` +
    `<g fill="none" stroke="${EDGE}" stroke-opacity="0.7" stroke-width="1.1" stroke-linecap="round">${ridgesFront}</g>` +
    // vòng vai và mép chuông phía trước
    `<path d="${shoulderF}" fill="none" stroke="${EDGE}" stroke-opacity="0.1" stroke-width="0.8"/>` +
    `<path d="${velOuterF}" fill="none" stroke="#DDF8FF" stroke-opacity="0.35" stroke-width="5" filter="${u.url('blur2')}"/>` +
    `<path d="${velOuterF}" fill="none" stroke="${EDGE}" stroke-opacity="0.85" stroke-width="1.3"/>` +
    // nốt tế bào gai li ti trên mặt chuông
    scatterSpots(91, { x: -80, y: 8, w: 160, h: 160 }, { count: 70, rMin: 0.4, rMax: 0.9, color: '#F4FFFF', opacity: 0.32, minGap: 9 }) +
    // mắt
    FACES.filter((f) => depth(f) < 0).map(rhopalium).join('') +
    FACES.filter((f) => depth(f) >= 0).map(rhopalium).join('') +
    // phản chiếu
    `<ellipse cx="${f1(hx + 6)}" cy="${f1(hy - 22)}" rx="22" ry="8" transform="rotate(-28 ${f1(hx + 6)} ${f1(hy - 22)})" fill="#ffffff" fill-opacity="0.38" filter="${u.url('blur4')}"/>` +
    `<ellipse cx="${f1(hx + 10)}" cy="${f1(hy - 25)}" rx="10" ry="2.6" transform="rotate(-30 ${f1(hx + 10)} ${f1(hy - 25)})" fill="#ffffff" fill-opacity="0.7" filter="${u.url('blur1')}"/>` +
    `<path d="${meridian(62, 0.3, 0.78, 0.92)}" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="3.5" stroke-linecap="round" filter="${u.url('blur1')}"/>` +
    `<path d="${meridian(150, 0.25, 0.7, 0.95)}" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2.5" stroke-linecap="round" filter="${u.url('blur1')}"/>` +
    `</g>` +
    // viền: nét sẫm rất mảnh tách khỏi nền + nét sáng
    `<path d="${BELL_D}" fill="none" stroke="${LINE}" stroke-opacity="0.32" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="${BELL_D}" fill="none" stroke="${EDGE}" stroke-opacity="0.62" stroke-width="1.1" stroke-linejoin="round"/>` +
    rimLight(BELL_D, u.url('rim'), 1.8)
  );
})();

// ---------- BÊN TRONG (nhìn xuyên qua chuông) ----------
const interiorSvg = (() => {
  // ống miệng (manubrium) treo từ đỉnh
  const manu = smoothPath(
    [[-5, 26], [-6.5, 60], [-7, 92], [-8.5, 106], [-10, 113], [-4, 111], [0, 115], [4, 111], [10, 113], [8.5, 106], [7, 92], [6.5, 60], [5, 26]],
    true,
  );
  // túi sinh dục dạng lá dọc 4 vách góc
  let gonads = '';
  let gonadLines = '';
  for (const c of CORNERS) {
    const d = depth(c);
    const op = 0.5 + 0.5 * clamp01((d + 1) / 2);
    for (const side of [-1, 1]) {
      const pts: P[] = [];
      const pts2: P[] = [];
      for (let i = 0; i <= 10; i++) {
        const t = 0.22 + 0.62 * (i / 10);
        const bulge = Math.sin(Math.PI * (i / 10));
        pts.push(sp(t, c + side * 2, 0.86));
        pts2.push(sp(t, c + side * (8 + 16 * bulge), 0.84 - 0.06 * bulge));
      }
      const leaf = smoothPath([...pts, ...pts2.reverse()], true);
      gonads += `<path d="${leaf}" fill-opacity="${(0.16 * op).toFixed(3)}"/>`;
      gonadLines += `<path d="${smoothPath(pts2)}" stroke-opacity="${(0.32 * op).toFixed(3)}"/>`;
    }
  }
  // chùm sợi vị (phacellae) ở 4 góc trên
  let phac = '';
  const r = rng(515);
  for (const c of CORNERS) {
    const [x, y] = sp(0.2, c, 0.62);
    for (let i = 0; i < 7; i++) {
      const a = rad(70 + r() * 40);
      const l = 7 + r() * 9;
      const x0 = x + (r() - 0.5) * 8;
      phac += `M${f1(x0)} ${f1(y)}q${f1(Math.cos(a) * l * 0.5 + (r() - 0.5) * 6)} ${f1(Math.sin(a) * l * 0.5)} ${f1(Math.cos(a) * l + (r() - 0.5) * 3)} ${f1(Math.sin(a) * l)}`;
    }
  }
  return (
    `<g filter="${u.url('blur1')}">` +
    `<g fill="#F3EEDC" stroke="none">${gonads}</g>` +
    `<g fill="none" stroke="#FFF8E6" stroke-width="0.8">${gonadLines}</g>` +
    `</g>` +
    `<path d="${phac}" fill="none" stroke="#FFF4DE" stroke-opacity="0.26" stroke-width="0.6" stroke-linecap="round"/>` +
    `<path d="${manu}" fill="${u.url('manu')}" stroke="${EDGE}" stroke-opacity="0.35" stroke-width="0.7"/>` +
    `<path d="M0 30L0 106" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="1.6" stroke-linecap="round"/>` +
    // dạ dày trung tâm mờ
    `<ellipse cx="0" cy="26" rx="26" ry="8" fill="#E8F8FF" fill-opacity="0.12" filter="${u.url('blur2')}"/>`
  );
})();

// ---------- "BÀN TAY": cuống (pedalium) + chùm xúc tu ----------
interface Hand {
  name: string;
  corner: number;
  back: boolean;
  /** số xúc tu */
  n: number;
  /** độ dài xúc tu cơ bản */
  L: number;
  /** hướng xòe sang ngang (+ = phải) */
  splay: number;
  amp: number;
  ph: number;
  seed: number;
}
const HANDS: Hand[] = [
  { name: 'handBack', corner: 225, back: true, n: 7, L: 330, splay: -0.15, amp: 0.035, ph: 1.0, seed: 31 },
  { name: 'handRight', corner: -45, back: true, n: 8, L: 350, splay: 0.35, amp: 0.04, ph: 2.6, seed: 47 },
  { name: 'handLeft', corner: 135, back: false, n: 9, L: 365, splay: -0.45, amp: 0.045, ph: 4.1, seed: 59 },
  { name: 'handFront', corner: 45, back: false, n: 9, L: 380, splay: 0.1, amp: 0.04, ph: 5.4, seed: 73 },
];

interface Seg {
  x: number;
  y: number;
  th: number;
}
const offp = (p: Seg, d: number): P => [p.x - Math.sin(p.th) * d, p.y + Math.cos(p.th) * d];

function handGeom(h: Hand) {
  const root = sp(0.975, h.corner, 0.95);
  const out = Math.sign(root[0]) || 1;
  const d = depth(h.corner);
  // cuống dẹt: từ gốc chạy xuống, hơi chĩa ra ngoài
  const spread = Math.abs(Math.cos(rad(h.corner + THETA)));
  const lean = rad(90 - out * (6 + 6 * spread));
  const lean0 = rad(90 - out * (8 + 38 * spread));
  const len = 54;
  const axis: Seg[] = [];
  let x = root[0];
  let y = root[1];
  const NA = 12;
  for (let i = 0; i <= NA; i++) {
    const s = (i / NA) * len;
    const th = lean + (lean0 - lean) * Math.exp(-s / 16);
    axis.push({ x, y, th });
    x += Math.cos(th) * (len / NA);
    y += Math.sin(th) * (len / NA);
  }
  const tip: P = [axis[NA].x, axis[NA].y];
  return { root, tip, lean, lean0, len, d, out, axis };
}

function handSvg(h: Hand): string {
  const g = handGeom(h);
  const r = rng(h.seed);
  const vis = h.back ? 0.62 : 1;
  // ---- cuống: bản dẹt, gốc hẹp, phình dần, đầu tròn
  const N = 12;
  const axis = g.axis;
  // bản dẹt: gốc hẹp, phình giữa, đầu hơi thu lại
  const wAt = (t: number) => 2.2 + 5.6 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.66)), 0.8);
  const L: P[] = axis.map((p, i) => offp(p, wAt(i / N)));
  const Rr: P[] = axis.map((p, i) => offp(p, -wAt(i / N))).reverse();
  const ped = smoothPath([...L, ...Rr], true);
  const mid = smoothPath(axis.map((p): P => [p.x, p.y]));
  const faceL: P[] = axis.map((p, i) => offp(p, -g.out * wAt(i / N) * 0.85));
  const faceR: P[] = axis.map((p, i) => offp(p, -g.out * wAt(i / N) * 0.15)).reverse();
  const face = smoothPath([...faceL, ...faceR], true);

  // ---- xúc tu: mọc thành hàng dọc mép dưới cuống, xòe như ngón tay rồi buông dài
  let ribbons = '';
  let glow = '';
  let beads = '';
  let tips = '';
  let knuckles = '';
  for (let k = 0; k < h.n; k++) {
    const f = h.n > 1 ? k / (h.n - 1) : 0.5;
    const a = axis[Math.round(N * (0.72 + 0.28 * f))];
    // mọc ở mép dưới-trong của cuống, xếp thành hàng như răng lược
    const [sx, sy] = offp(a, g.out * (2.5 - f * 4));
    const len = h.L * (0.78 + r() * 0.3) * (h.back ? 0.92 : 1);
    const fan = (f - 0.5) * 1.1 + h.splay * 0.6;
    const wob = 0.1 + r() * 0.12;
    const lam = 70 + r() * 50;
    const ph = r() * 6.28;
    const M = 40;
    const ds = len / M;
    let th = rad(90) - fan;
    let x = sx;
    let y = sy;
    const c: Seg[] = [];
    for (let i = 0; i <= M; i++) {
      const s = i * ds;
      c.push({ x, y, th });
      // buông dần về thẳng đứng + gợn sóng mềm
      const target = rad(90) - h.splay * 0.12 + wob * Math.sin(s / lam * 6.28 + ph) * Math.min(1, s / 60);
      th += (target - th) * Math.min(1, ds / 45);
      x += Math.cos(th) * ds;
      y += Math.sin(th) * ds;
    }
    const w0 = (h.back ? 1.0 : 1.2) + r() * 0.35;
    const wt = (t: number) => w0 * (1 - 0.68 * t);
    const lp = c.map((p, i) => offp(p, wt(i / M)));
    const rp = c.map((p, i) => offp(p, -wt(i / M))).reverse();
    const rib = smoothPath([...lp, ...rp], true);
    ribbons += `<path d="${rib}"/>`;
    glow += `<path d="${smoothPath(c.map((p): P => [p.x, p.y]))}"/>`;
    // hạt tế bào gai (dày ở đoạn gần, thưa dần)
    beads += `<path d="${smoothPath(c.slice(2).map((p): P => [p.x, p.y]))}" stroke-dasharray="${f1(0.9 + r() * 0.8)} ${f1(5 + r() * 4)}" stroke-width="${f1(w0 * 1.25)}"/>`;
    knuckles += `<ellipse cx="${f1(sx)}" cy="${f1(sy + 1)}" rx="2.1" ry="2.8" transform="rotate(${f1((c[1].th * 180) / Math.PI - 90)} ${f1(sx)} ${f1(sy + 1)})"/>`;
    const e = c[M];
    tips += `<circle cx="${f1(e.x)}" cy="${f1(e.y)}" r="${f1(wt(1) * 0.9)}"/>`;
  }

  return (
    `<g opacity="${vis}">` +
    // quầng sáng mờ quanh xúc tu (để nhìn thấy trên nền nước)
    `<g fill="none" stroke="#EFFFF8" stroke-opacity="0.22" stroke-width="4.5" stroke-linecap="round" filter="${u.url('blur2')}">${glow}</g>` +
    `<g fill="${u.url('tent')}" stroke="#7E7A8E" stroke-opacity="0.25" stroke-width="0.35">${ribbons}</g>` +
    `<g fill="none" stroke="#FFFDF4" stroke-opacity="0.5" stroke-linecap="round">${beads}</g>` +
    `<g fill="${TENT_D}" fill-opacity="0.6">${tips}</g>` +
    // cuống: bản thịt trong mờ xanh nhạt, viền sáng
    `<path d="${ped}" fill="${u.url('ped')}" stroke="${LINE}" stroke-opacity="0.22" stroke-width="1.4"/>` +
    `<path d="${ped}" fill="none" stroke="${EDGE}" stroke-opacity="0.6" stroke-width="0.8"/>` +
    `<path d="${face}" fill="#F4FFFF" fill-opacity="0.16"/>` +
    `<path d="${mid}" fill="none" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="0.7" stroke-linecap="round"/>` +
    // "đốt ngón" – gốc mỗi xúc tu phình nhẹ trên mép cuống
    `<g fill="#E9FBFF" fill-opacity="0.35" stroke="${EDGE}" stroke-opacity="0.55" stroke-width="0.5">${knuckles}</g>` +
    `<path d="${mid}" fill="none" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="5" stroke-linecap="round" filter="${u.url('blur2')}"/>` +
    `</g>`
  );
}

// ---------- defs ----------
const defs = joinDefs(
  radial(
    u('glass'),
    [
      [0, '#E6FBFF', 0.05],
      [0.55, GLASS, 0.1],
      [0.85, '#9EDFF2', 0.2],
      [1, '#D6FAFF', 0.36],
    ],
    { cx: 0.45, cy: 0.42, r: 0.62 },
  ),
  rimGradient(u('rim'), '#FFFFFF', 0.75),
  `<clipPath id="${u('bellClip')}"><path d="${BELL_D}"/></clipPath>`,
  linear(u('manu'), [
    [0, '#F2FBFF', 0.12],
    [0.6, '#E9F4F2', 0.22],
    [1, '#FFF6E2', 0.38],
  ]),
  linear(
    u('ped'),
    [
      [0, '#CDF4FF', 0.3],
      [0.5, '#E8FDFF', 0.42],
      [1, '#BFE8F6', 0.32],
    ],
    { x1: 0, y1: 0, x2: 1, y2: 0 },
  ),
  linear(
    u('tent'),
    [
      [0, TENT, 0.95],
      [0.45, TENT, 0.85],
      [0.8, TENT_D, 0.7],
      [1, TENT_D, 0.35],
    ],
  ),
  blurFilter(u('blur1'), 1),
  blurFilter(u('blur2'), 2.2),
  blurFilter(u('blur4'), 4.5),
  blurFilter(u('blur12'), 12),
);

// ---------- Lớp ----------
function handLayer(h: Hand): ArtLayer {
  const g = handGeom(h);
  return {
    name: h.name,
    role: 'tentacle',
    bend: false,
    z: h.back ? 'back' : 'front',
    pivot: toVB(g.root[0], g.root[1]),
    anim: { type: 'rotate', amp: h.amp, speed: 1, phase: h.ph },
    svg: wrap(handSvg(h)),
  };
}
const tipVB = (h: Hand): P => {
  const g = handGeom(h);
  return toVB(g.tip[0], g.tip[1]);
};

const art: CreatureArt = {
  id: ID,
  viewBox: VB,
  lengthUnits: 220,
  spineY: 120,
  animation: 'jelly',
  cycleHz: 0.85, // sứa hộp bơi chủ động, nhịp co bóp nhanh hơn sứa thường
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    ...HANDS.filter((h) => h.back).map(handLayer),
    { name: 'interior', role: 'body', svg: wrap(interiorSvg) },
    {
      name: 'bell',
      role: 'bell',
      bend: false,
      z: 'front',
      pivot: toVB(0, H),
      anim: { type: 'pulse', amp: 0.045, speed: 1 },
      svg: wrap(bellSvg),
    },
    ...HANDS.filter((h) => !h.back).map(handLayer),
  ],
  procedural: {
    tentacles: HANDS.map((h) => ({
      from: tipVB(h),
      length: 240,
      width: 1.1,
      color: '#F1EEDD',
      opacity: h.back ? 0.25 : 0.35,
      count: 2,
      spread: 8,
    })),
  },
};

export default art;
