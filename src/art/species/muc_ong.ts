/**
 * Mực ống – Uroteuthis chinensis (Mitre squid)
 * Đặc điểm nhận dạng: áo (mantle) hình ỐNG thon dài (dài:cao ≈ 6:1), chóp sau nhọn; VÂY HÌNH THOI ở đuôi
 * dài ≈ 60% chiều dài áo (nhìn chéo lưng–hông: vây xa vươn lên trên, vây gần rủ xuống dưới);
 * đầu hẹp hơn mép áo, MẮT TO bạc có giác mạc trong; 8 tay ngắn có giác hút + 2 TUA DÀI đầu chuỳ.
 * Da hồng trong mờ phủ dày CHẤM SẮC TỐ đỏ nâu (dày ở lưng, thưa ở bụng); 3 lớp "mây sắc tố"
 * nhấp nháy lệch pha → sóng đổi màu chạy dọc thân. Quy ước hướng như mực nang: chóp áo trái, tay phải.
 */
import type { ArtLayer, CreatureArt } from '../contract';
import {
  makeIds,
  standardBody,
  eye,
  linear,
  radial,
  joinDefs,
  rng,
  smoothPath,
  scatterSpots,
  organicTexture,
  outline,
  rimLight,
  mix,
  shade,
} from '../style-bible';

const u = makeIds('muc_ong');

// ---------- Bảng màu (ước lượng từ ảnh tham khảo) ----------
const DORSAL = '#c07a80';
const FLANK = '#e3aeae';
const BELLY = '#f6e2df';
const CHROMA = '#8e2c2b'; // chấm sắc tố đỏ nâu
const CHROMA_D = '#5e1a1f'; // chấm sắc tố co lại – nâu đen
const PEARL = '#fff4f2'; // ánh ngọc trai
const OUTLINE = '#7b3842';
const IRID_G = '#8fe0b0'; // ánh lục trên mắt

type P = [number, number];
const f1 = (n: number) => n.toFixed(1);

// ---------- Hình học ----------

/** Lấy mẫu dày đường Catmull-Rom (dùng chung để vẽ áo và đặt vây đúng mép áo). */
function sampleCR(pts: P[], perSeg = 12): P[] {
  const out: P[] = [];
  const p = [pts[0], ...pts, pts[pts.length - 1]];
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    for (let k = 0; k < perSeg; k++) {
      const t = k / perSeg;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function yAt(line: P[], x: number): number {
  for (let i = 0; i < line.length - 1; i++) {
    const [x1, y1] = line[i];
    const [x2, y2] = line[i + 1];
    if (x >= x1 && x <= x2) return x2 === x1 ? y1 : y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
  }
  return x < line[0][0] ? line[0][1] : line[line.length - 1][1];
}

// Áo: ống thon dài ~450, cao tối đa ~73 (≈6:1); to nhất ở 2/3 trước, thon nhọn về chóp sau (trái)
const TOP_PTS: P[] = [[30, 151], [62, 144.5], [112, 134.5], [172, 126], [242, 120], [312, 116.5], [382, 114.5], [440, 114], [466, 115], [482, 116.5]];
const BOT_PTS: P[] = [[30, 152.5], [62, 158.5], [112, 167.5], [172, 176], [242, 182], [312, 185.5], [382, 187.5], [440, 187.5], [468, 186]];
const TOP = sampleCR(TOP_PTS);
const BOT = sampleCR(BOT_PTS);
const topY = (x: number) => yAt(TOP, x);
const botY = (x: number) => yAt(BOT, x);

const MANTLE =
  'M' + TOP.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') +
  // mép áo trước: mấu lưng nhọn trùm lên gáy rồi vát xuống mép bụng
  `C489 121 487 150 482 166C479 176 475 182 468 186` +
  'L' + [...BOT].reverse().map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') +
  // chóp sau nhọn
  'L26 151.8Z';

// Đầu: hẹp hơn mép áo, phình ở mắt, thu dần về vành tay
const HEAD = smoothPath(
  [
    [452, 123], [478, 122], [496, 117.5], [516, 118.5], [533, 124], [546, 132], [552, 143],
    [552, 158], [547, 168], [535, 175.5], [518, 181], [497, 183.5], [474, 183], [452, 182],
  ],
  true,
);

// ---------- Chấm sắc tố (pattern) ----------
function chromaPattern(id: string, size: number, n: number, rMin: number, rMax: number, seed: number, rot: number): string {
  const r = rng(seed);
  let dots = '';
  for (let i = 0; i < n; i++) {
    const x = r() * size;
    const y = r() * size;
    const rr = rMin + r() * (rMax - rMin);
    const c = r() > 0.72 ? CHROMA_D : CHROMA;
    const op = 0.45 + r() * 0.5;
    // vẽ thêm bản sao ở mép ô để chấm không bị cắt
    for (const [dx, dy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]] as P[]) {
      const cx = x + dx;
      const cy = y + dy;
      if (cx < -rr || cx > size + rr || cy < -rr || cy > size + rr) continue;
      dots += `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${(rr * 1.15).toFixed(2)}" ry="${rr.toFixed(2)}" fill="${c}" fill-opacity="${op.toFixed(2)}"/>`;
    }
  }
  return `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})">${dots}</pattern>`;
}

// ---------- Thân (áo) ----------
const body = standardBody(u, MANTLE, {
  dorsal: DORSAL,
  flank: FLANK,
  belly: BELLY,
  outlineColor: OUTLINE,
  scales: false,
  flankAt: 0.48,
  rimOpacity: 0.8,
});

// dải sẫm giữa lưng (ảnh ref2): bám theo đường lưng, mảnh dần về chóp
function dorsalBand(): string {
  const up: P[] = [];
  const dn: P[] = [];
  for (let x = 60; x <= 478; x += 14) {
    const t = topY(x);
    const w = 6 + 12 * Math.min(1, Math.max(0, (x - 60) / 260));
    up.push([x, t - 2]);
    dn.push([x, t + w]);
  }
  return smoothPath([...up, ...dn.reverse()], true);
}

const mantleSvg =
  body.base +
  `<g clip-path="${u.url('bodyClip')}">` +
  `<g filter="${u.url('skin')}"><path d="${MANTLE}" fill="${u.url('bodyFill')}"/></g>` +
  // nội tạng thấp thoáng qua lớp áo trong mờ
  `<ellipse cx="350" cy="158" rx="112" ry="17" fill="${u.url('viscera')}"/>` +
  // ánh ngọc trai dọc hông
  `<path d="M60 157C150 146 300 146 470 156C300 168 150 168 60 157Z" fill="${PEARL}" opacity="0.22"/>` +
  // chấm sắc tố dày (lưng) → thưa (bụng)
  `<g mask="${u.url('dorsalMask')}">` +
  `<rect x="20" y="105" width="470" height="90" fill="${u.url('chromaS')}"/>` +
  `<rect x="20" y="105" width="470" height="90" fill="${u.url('chromaL')}"/>` +
  `</g>` +
  `<path d="${dorsalBand()}" fill="${u.url('band')}"/>` +
  scatterSpots(73, { x: 70, y: 114, w: 400, h: 30 }, { count: 70, rMin: 1.2, rMax: 2.4, color: CHROMA_D, opacity: 0.55, minGap: 7, ellipse: 1.2 }) +
  // bút (gladius) mờ dưới da lưng
  `<path d="${smoothPath(TOP_PTS.slice(1, -1).map(([x, y]) => [x, y + 5] as P))}" fill="none" stroke="${PEARL}" stroke-opacity="0.22" stroke-width="1.6"/>` +
  `<path d="${MANTLE}" fill="${u.url('bodyVol')}"/>` +
  `</g>` +
  outline(MANTLE, OUTLINE, 1.6, 0.7) +
  rimLight(MANTLE, u.url('rim')) +
  // mép áo trước – nét viền sáng của khe áo
  `<path d="M482 118C488 128 486 152 481 168C478 177 474 182 468 186" fill="none" stroke="${PEARL}" stroke-opacity="0.45" stroke-width="1.3"/>`;

// ---------- Đầu ----------
const EX = 507;
const EY = 146;
const ER = 15;
const theEye = eye(u, 'eye', {
  cx: EX,
  cy: EY,
  r: ER,
  iris: ['#d7e2e8', '#5a6a7a'],
  pupil: 'round',
  socket: '#6a2f3a',
  pupilColor: '#06080b',
  look: [0.2, 0.1],
});

const SIPHON = `M456 179C470 181 484 183 496 184.5C499 188 497 192 491 192.5C479 192 466 190 456 188Z`;

const headSvg =
  // phễu (siphon) thò ra dưới mép áo
  `<path d="${SIPHON}" fill="${u.url('siphon')}" stroke="${OUTLINE}" stroke-opacity="0.45" stroke-width="0.9"/>` +
  `<path d="M462 185C476 187 490 188 500 189" fill="none" stroke="${PEARL}" stroke-opacity="0.4" stroke-width="0.9"/>` +
  `<path d="${HEAD}" fill="${u.url('headFill')}"/>` +
  `<g clip-path="${u.url('headClip')}">` +
  `<g filter="${u.url('skin')}"><path d="${HEAD}" fill="${u.url('headFill')}"/></g>` +
  `<g mask="${u.url('headMask')}">` +
  `<rect x="448" y="112" width="110" height="76" fill="${u.url('chromaS')}"/>` +
  `<rect x="448" y="112" width="110" height="76" fill="${u.url('chromaL')}"/>` +
  `</g>` +
  scatterSpots(58, { x: 458, y: 118, w: 92, h: 40 }, { count: 34, rMin: 1, rMax: 2.1, color: CHROMA_D, opacity: 0.5, minGap: 6, ellipse: 1.15 }) +
  scatterSpots(59, { x: 458, y: 150, w: 92, h: 28 }, { count: 14, rMin: 0.8, rMax: 1.6, color: CHROMA, opacity: 0.45, minGap: 7 }) +
  // nếp gáy (vòng cổ) & rãnh sau mắt
  `<path d="M486 121C483 140 484 162 490 182" fill="none" stroke="${OUTLINE}" stroke-opacity="0.22" stroke-width="2"/>` +
  `<path d="M528 126C532 140 532 156 527 172" fill="none" stroke="${OUTLINE}" stroke-opacity="0.18" stroke-width="1.4"/>` +
  `<path d="${HEAD}" fill="${u.url('bodyVol')}"/>` +
  `</g>` +
  outline(HEAD, OUTLINE, 1.4, 0.6) +
  rimLight(HEAD, u.url('rim'));

const eyeSvg =
  // giác mạc trong suốt phồng quanh mắt
  `<circle cx="${EX}" cy="${EY}" r="${f1(ER * 1.5)}" fill="${u.url('cornea')}"/>` +
  `<circle cx="${EX}" cy="${EY}" r="${f1(ER * 1.5)}" fill="none" stroke="${PEARL}" stroke-opacity="0.35" stroke-width="1"/>` +
  // vòng bạc quanh mống mắt
  `<circle cx="${EX}" cy="${EY}" r="${f1(ER * 1.18)}" fill="#e9eef2" opacity="0.5"/>` +
  theEye.svg +
  // ánh lục óng phía trên mắt (ảnh ref4)
  `<path d="M${EX - 17} ${EY - 13}Q${EX} ${EY - 27} ${EX + 17} ${EY - 14}" fill="none" stroke="${IRID_G}" stroke-width="3" stroke-opacity="0.55" stroke-linecap="round"/>` +
  `<path d="M${EX - 14} ${EY - 15}Q${EX} ${EY - 25} ${EX + 14} ${EY - 16}" fill="none" stroke="#e8fff2" stroke-width="0.9" stroke-opacity="0.5" stroke-linecap="round"/>` +
  // phản chiếu cong trên giác mạc
  `<path d="M${EX - 19} ${EY + 4}A${ER * 1.35} ${ER * 1.35} 0 0 1 ${EX - 8} ${EY - 18}" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-opacity="0.55" stroke-linecap="round"/>`;

// ---------- Vây hình thoi ----------
const FIN_X0 = 30; // chóp vây trùng chóp áo
const FIN_X1 = 306; // gốc trước của vây (~60% chiều dài áo)
const FIN_SV = 0.5; // góc bên của hình thoi nằm giữa vây

/** Điểm gốc & mép ngoài của vây. dir = -1: vươn lên (vây xa), +1: rủ xuống (vây gần). */
function finPoints(dir: -1 | 1, H: number, inset: number): { base: P[]; outer: P[] } {
  const base: P[] = [];
  const outer: P[] = [];
  const n = 44;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const x = FIN_X0 + (FIN_X1 - FIN_X0) * s;
    const edgeY = dir < 0 ? topY(x) : botY(x);
    // gốc vây giấu dưới áo; ở chóp đuôi thân mảnh nên lún ít lại
    const ins = Math.min(inset, 0.85 * (botY(x) - topY(x)) * 0.5);
    base.push([x, edgeY - dir * ins]);
    // hình thoi bo tròn (smooth-min hai cạnh): mép sau hơi lõm (mũ >1), mép trước hơi lồi (mũ <1)
    const l = Math.pow(Math.max(1e-4, s / FIN_SV), 1.15);
    const r = Math.pow(Math.max(1e-4, (1 - s) / (1 - FIN_SV)), 0.82);
    const p = 2.2;
    const a = s <= 0 || s >= 1 ? 0 : Math.pow(Math.pow(l, -p) + Math.pow(r, -p), -1 / p) * 1.2;
    // gợn rất nhẹ ở mép (vây viền gợn)
    const ripple = 1 + 0.025 * Math.sin(s * Math.PI * 9);
    const h = H * Math.min(1, a) * ripple;
    // mép ngoài hơi ngả về sau (đuôi) cho cảm giác thuôn
    outer.push([x - h * 0.12, edgeY + dir * h]);
  }
  return { base, outer };
}

function finSvg(dir: -1 | 1, H: number, far: boolean): string {
  const { base, outer } = finPoints(dir, H, 12);
  const d = smoothPath([...outer, ...[...base].reverse()], true, 0.35);
  let rays = '';
  for (let i = 2; i < outer.length - 2; i++) {
    const [bx, by] = base[i];
    const [ox, oy] = outer[i];
    if (i % 3) continue;
    // thớ cơ cong nhẹ, ngả về sau
    const mx = bx + (ox - bx) * 0.5 - 3;
    const my = by + (oy - by) * 0.5;
    rays += `M${f1(bx)} ${f1(by)}Q${f1(mx)} ${f1(my)} ${f1(bx + (ox - bx) * 0.92)} ${f1(by + (oy - by) * 0.92)}`;
  }
  const fill = far ? u.url('finFar') : u.url('finNear');
  return (
    `<path d="${d}" fill="${fill}"/>` +
    // chấm sắc tố thưa trên vây
    `<g clip-path="${u.url(far ? 'finFarClip' : 'finNearClip')}" opacity="${far ? 0.45 : 0.5}"><rect x="0" y="40" width="330" height="220" fill="${u.url('chromaS')}"/></g>` +
    // thớ cơ vây
    `<path d="${rays}" fill="none" stroke="${PEARL}" stroke-opacity="${far ? 0.07 : 0.1}" stroke-width="0.6"/>` +
    // bóng dày ở gốc vây (chỗ vây bám vào áo)
    `<path d="${smoothPath(base.slice(1, -1), false)}" fill="none" stroke="${far ? CHROMA_D : CHROMA}" stroke-opacity="${far ? 0.22 : 0.16}" stroke-width="5" stroke-linecap="round"/>` +
    // mép vây sáng mảnh + viền
    `<path d="${smoothPath(outer, false, 0.35)}" fill="none" stroke="${PEARL}" stroke-opacity="${far ? 0.35 : 0.6}" stroke-width="1.3" stroke-linecap="round"/>` +
    `<path d="${smoothPath(outer, false, 0.35)}" fill="none" stroke="${OUTLINE}" stroke-opacity="${far ? 0.45 : 0.5}" stroke-width="1" stroke-linejoin="round"/>`
  );
}

const FIN_FAR_H = 52;
const FIN_NEAR_H = 60;
const finFarPath = (() => {
  const { base, outer } = finPoints(-1, FIN_FAR_H, 12);
  return smoothPath([...outer, ...[...base].reverse()], true, 0.35);
})();
const finNearPath = (() => {
  const { base, outer } = finPoints(1, FIN_NEAR_H, 12);
  return smoothPath([...outer, ...[...base].reverse()], true, 0.35);
})();

// ---------- Tay & tua ----------

/** Tay thuôn nhọn chạy theo đường cong qua các điểm (gốc → ngọn), ngọn hơi cuộn. */
function armGeom(pts: P[], w0: number): { d: string; spine: P[]; up: P[]; lo: P[] } {
  const spine = sampleCR(pts, 6);
  const n = spine.length - 1;
  const up: P[] = [];
  const lo: P[] = [];
  for (let i = 0; i <= n; i++) {
    const a = spine[Math.max(0, i - 1)];
    const c = spine[Math.min(n, i + 1)];
    const tx = c[0] - a[0];
    const ty = c[1] - a[1];
    const tl = Math.max(1e-6, Math.hypot(tx, ty));
    const ox = -ty / tl;
    const oy = tx / tl;
    const s = i / n;
    // gốc dày, thon đều, ngọn nhọn
    const w = (w0 / 2) * Math.pow(Math.max(0, 1 - s), 0.9) + 0.45;
    const [x, y] = spine[i];
    up.push([x - ox * w, y - oy * w]);
    lo.push([x + ox * w, y + oy * w]);
  }
  const d = smoothPath([...up, ...[...lo].reverse()], true, 0.45);
  return { d, spine, up, lo };
}

function arm(pts: P[], w0: number, far = false): string {
  const g = armGeom(pts, w0);
  const b = pts[0];
  const t = pts[pts.length - 1];
  // giác hút ở mặt trong (hướng về trục giữa vành tay)
  const inner = (b[1] + t[1]) / 2 < 152 ? g.lo : g.up;
  let suck = '';
  for (let i = 3; i < inner.length - 3; i++) {
    const [x, y] = inner[i];
    const [sx, sy] = g.spine[i];
    const k = 0.3;
    const rr = Math.max(0.45, 1.1 * (1 - i / inner.length));
    suck += `<circle cx="${f1(x + (sx - x) * k)}" cy="${f1(y + (sy - y) * k)}" r="${rr.toFixed(2)}"/>`;
  }
  return (
    `<path d="${g.d}" fill="${far ? u.url('armFar') : u.url('arm')}"/>` +
    `<g opacity="${far ? 0.35 : 0.55}"><path d="${g.d}" fill="${u.url('chromaS')}"/></g>` +
    `<g fill="${PEARL}" fill-opacity="${far ? 0.3 : 0.55}" stroke="${OUTLINE}" stroke-opacity="0.25" stroke-width="0.4">${suck}</g>` +
    `<path d="${smoothPath(g.spine.slice(1, -3), false)}" fill="none" stroke="${PEARL}" stroke-opacity="${far ? 0.12 : 0.28}" stroke-width="1" transform="translate(0 -1.2)"/>` +
    outline(g.d, OUTLINE, 0.9, far ? 0.35 : 0.5)
  );
}

/** Tua bắt mồi: cuống mảnh dài + chuỳ dẹt hình mũi mác có nhiều giác hút. */
function tentacle(b: P, c1: P, c2: P, e: P, tip: P, far = false): string {
  const stalk = `M${b[0]} ${b[1]}C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${e[0]} ${e[1]}`;
  const dx = tip[0] - e[0];
  const dy = tip[1] - e[1];
  const L = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / L;
  const ny = dx / L;
  const pt = (s: number, o: number): P => [e[0] + dx * s + nx * o, e[1] + dy * s + ny * o];
  const a = pt(0.0, 1.8);
  const b2 = pt(0.0, -1.8);
  const m1 = pt(0.45, 6.5);
  const m2 = pt(0.45, -5);
  const club =
    `M${f1(a[0])} ${f1(a[1])}Q${f1(m1[0])} ${f1(m1[1])} ${tip[0]} ${tip[1]}` +
    `Q${f1(m2[0])} ${f1(m2[1])} ${f1(b2[0])} ${f1(b2[1])}Z`;
  let suck = '';
  for (let i = 0; i < 9; i++) {
    const s = 0.1 + i * 0.09;
    const wid = Math.sin(Math.PI * Math.min(1, s + 0.05)) * 3.2;
    for (const side of [-1, 1]) {
      const [x, y] = pt(s, side * wid * 0.45 + 0.6);
      suck += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${(1.05 - i * 0.07).toFixed(2)}"/>`;
    }
  }
  const col = far ? shade(DORSAL, -0.22) : mix(DORSAL, FLANK, 0.35);
  return (
    `<path d="${stalk}" fill="none" stroke="${OUTLINE}" stroke-opacity="${far ? 0.45 : 0.55}" stroke-width="4.6" stroke-linecap="round"/>` +
    `<path d="${stalk}" fill="none" stroke="${col}" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="${stalk}" fill="none" stroke="${PEARL}" stroke-opacity="${far ? 0.15 : 0.3}" stroke-width="0.9" stroke-linecap="round" transform="translate(0 -0.8)"/>` +
    `<path d="${club}" fill="${col}" stroke="${OUTLINE}" stroke-opacity="0.6" stroke-width="0.9"/>` +
    `<g opacity="${far ? 0.4 : 0.6}"><path d="${club}" fill="${u.url('chromaS')}"/></g>` +
    `<g fill="${PEARL}" opacity="${far ? 0.5 : 0.8}">${suck}</g>`
  );
}

// ---------- Mây sắc tố (sóng đổi màu chạy dọc thân) ----------
function cloudLayer(i: number): ArtLayer {
  const r = rng(300 + i);
  let shapes = '';
  let spots = '';
  for (let k = 0; k < 4; k++) {
    const x = 92 + k * 112 + i * 37;
    if (x > 470) continue;
    const cy = topY(x) + 26;
    const rx = 30 + r() * 10;
    const ry = 24 + r() * 8;
    shapes += `<ellipse cx="${x}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}"/>`;
    // chấm sắc tố nở to trong vùng mây
    for (let j = 0; j < 26; j++) {
      const ang = r() * Math.PI * 2;
      const rad = Math.sqrt(r());
      const sx = x + Math.cos(ang) * rad * rx * 0.9;
      const sy = cy + Math.sin(ang) * rad * ry * 0.9;
      spots += `<circle cx="${f1(sx)}" cy="${f1(sy)}" r="${(1.3 + r() * 1.6 * (1 - rad * 0.6)).toFixed(2)}"/>`;
    }
  }
  return {
    name: `chromaWave${i}`,
    role: 'pattern',
    bend: false,
    z: 'front',
    pivot: [256, 150],
    // pha lệch dần → vùng sẫm chạy từ đầu về đuôi
    anim: { type: 'alpha', amp: 1, speed: 0.6, phase: i * 2.094 },
    svg:
      `<g clip-path="${u.url('bodyClip')}">` +
      `<g fill="${u.url('cloud')}">${shapes}</g>` +
      `<g fill="${CHROMA_D}" fill-opacity="0.55">${spots}</g>` +
      `</g>`,
  };
}

// ---------- Defs ----------
const defs = joinDefs(
  body,
  theEye,
  organicTexture(u('skin'), { freq: 0.09, octaves: 2, strength: 0.1, seed: 23 }),
  chromaPattern(u('chromaS'), 34, 26, 0.45, 1.25, 7, 0),
  chromaPattern(u('chromaL'), 62, 14, 1.0, 2.1, 19, 23),
  linear(u('dorsalMaskG'), [[0, '#ffffff', 1], [0.4, '#ffffff', 0.75], [0.75, '#ffffff', 0.3], [1, '#ffffff', 0.12]], { user: true, x1: 0, y1: 112, x2: 0, y2: 190 }),
  `<mask id="${u('dorsalMask')}" maskUnits="userSpaceOnUse" x="0" y="90" width="500" height="120"><rect x="0" y="90" width="500" height="120" fill="${u.url('dorsalMaskG')}"/></mask>`,
  linear(u('headMaskG'), [[0, '#ffffff', 1], [0.55, '#ffffff', 0.7], [1, '#ffffff', 0.2]], { user: true, x1: 0, y1: 116, x2: 0, y2: 184 }),
  `<mask id="${u('headMask')}" maskUnits="userSpaceOnUse" x="440" y="105" width="125" height="90"><rect x="440" y="105" width="125" height="90" fill="${u.url('headMaskG')}"/></mask>`,
  linear(u('band'), [[0, CHROMA_D, 0.35], [0.5, CHROMA, 0.22], [1, CHROMA, 0]]),
  radial(u('viscera'), [[0, '#8a3a46', 0.16], [0.7, '#8a3a46', 0.06], [1, '#8a3a46', 0]]),
  linear(u('headFill'), [
    [0, shade(DORSAL, -0.3)],
    [0.35, shade(DORSAL, -0.08)],
    [0.65, FLANK],
    [1, BELLY],
  ]),
  `<clipPath id="${u('headClip')}"><path d="${HEAD}"/></clipPath>`,
  linear(u('siphon'), [[0, mix(DORSAL, FLANK, 0.5)], [1, BELLY]]),
  radial(u('cornea'), [[0, '#ffffff', 0], [0.7, '#ffffff', 0.04], [0.92, '#f2f8ff', 0.22], [1, '#ffffff', 0.05]]),
  linear(u('finFar'), [[0, mix(DORSAL, FLANK, 0.3), 0.6], [0.6, DORSAL, 0.68], [1, shade(DORSAL, -0.08), 0.75]]),
  linear(u('finNear'), [[0, mix(FLANK, DORSAL, 0.3), 0.86], [0.6, FLANK, 0.8], [1, mix(FLANK, PEARL, 0.3), 0.72]]),
  `<clipPath id="${u('finFarClip')}"><path d="${finFarPath}"/></clipPath>`,
  `<clipPath id="${u('finNearClip')}"><path d="${finNearPath}"/></clipPath>`,
  linear(u('arm'), [[0, shade(DORSAL, -0.08)], [0.5, mix(DORSAL, FLANK, 0.5)], [1, BELLY]]),
  linear(u('armFar'), [[0, shade(DORSAL, -0.3)], [1, shade(DORSAL, -0.12)]]),
  // tay hiện dần từ trong đầu ra → không lộ mép gốc tay
  linear(u('armFadeG'), [[0, '#ffffff', 0], [1, '#ffffff', 1]], { user: true, x1: 536, y1: 0, x2: 552, y2: 0 }),
  `<mask id="${u('armFade')}" maskUnits="userSpaceOnUse" x="520" y="80" width="240" height="160"><rect x="520" y="80" width="240" height="160" fill="${u.url('armFadeG')}"/></mask>`,
  radial(u('cloud'), [[0, '#6e1d22', 0.42], [0.6, CHROMA, 0.22], [1, CHROMA, 0]]),
);

// ---------- Lắp ráp ----------
type ArmSpec = { name: string; pts: P[]; w: number; amp: number; ph: number };
// 4 tay phía gần (từ lưng xuống bụng); tay lưng ngắn nhất, ngọn hơi cuộn vào trong
const nearArms: ArmSpec[] = [
  { name: 'arm1', pts: [[539, 133], [566, 125], [594, 121], [610, 124], [614, 129]], w: 13, amp: 0.05, ph: 0 },
  { name: 'arm4', pts: [[540, 168], [568, 176], [598, 182], [618, 181], [624, 176]], w: 14, amp: 0.05, ph: 2.6 },
  { name: 'arm2', pts: [[544, 141], [576, 136], [608, 133], [628, 135], [634, 140]], w: 15, amp: 0.045, ph: 0.9 },
  { name: 'arm3', pts: [[545, 157], [580, 161], [614, 162], [634, 158], [640, 152]], w: 16, amp: 0.045, ph: 1.8 },
];

const layers: ArtLayer[] = [
  // --- phía sau thân ---
  {
    name: 'finFar',
    role: 'fin',
    bend: false,
    z: 'back',
    // trục vỗ = trục giữa áo → gốc vây gần như không xê dịch, chóp đuôi đứng yên
    pivot: [170, 151],
    anim: { type: 'scaleY', amp: 0.2, speed: 1.4, phase: 0 },
    svg: finSvg(-1, FIN_FAR_H, true),
  },
  {
    name: 'armsFar',
    role: 'arm',
    bend: false,
    z: 'back',
    pivot: [544, 150],
    anim: { type: 'rotate', amp: 0.04, speed: 0.7, phase: 2.2 },
    svg:
      `<g mask="${u.url('armFade')}">` +
      arm([[540, 137], [570, 131], [600, 128], [618, 131], [621, 136]], 12, true) +
      arm([[543, 148], [578, 146], [612, 146], [630, 149], [632, 154]], 13, true) +
      arm([[543, 162], [576, 168], [606, 172], [626, 171], [630, 166]], 13, true) +
      arm([[539, 171], [564, 180], [590, 187], [608, 189], [614, 185]], 11, true) +
      `</g>`,
  },
  {
    name: 'tentacleFar',
    role: 'tentacle',
    bend: false,
    z: 'back',
    pivot: [544, 150],
    anim: { type: 'rotate', amp: 0.05, speed: 0.8, phase: 1.1 },
    svg: tentacle([544, 150], [590, 138], [630, 150], [676, 140], [720, 126], true),
  },
  // --- lớp "uốn" (bendAmp 0 → đứng yên cùng thân) ---
  { name: 'head', role: 'body', svg: headSvg },
  { name: 'eye', role: 'eye', svg: eyeSvg },
  { name: 'mantle', role: 'body', svg: mantleSvg },
  // --- phía trước ---
  cloudLayer(0),
  cloudLayer(1),
  cloudLayer(2),
  {
    name: 'finNear',
    role: 'fin',
    bend: false,
    z: 'back',
    pivot: [170, 151],
    // hai vây vỗ ngược pha → cặp vây cùng nâng/hạ như cánh
    anim: { type: 'scaleY', amp: 0.2, speed: 1.4, phase: Math.PI },
    svg: finSvg(1, FIN_NEAR_H, false),
  },
  {
    name: 'tentacleNear',
    role: 'tentacle',
    bend: false,
    z: 'front',
    pivot: [544, 160],
    anim: { type: 'rotate', amp: 0.06, speed: 0.8, phase: 0.2 },
    svg: `<g mask="${u.url('armFade')}">${tentacle([544, 160], [596, 178], [640, 176], [688, 163], [736, 152])}</g>`,
  },
  ...nearArms.map(
    (a): ArtLayer => ({
      name: a.name,
      role: 'arm',
      bend: false,
      z: 'front',
      pivot: a.pts[0],
      anim: { type: 'rotate', amp: a.amp, speed: 0.7, phase: a.ph },
      svg: `<g mask="${u.url('armFade')}">${arm(a.pts, a.w)}</g>`,
    }),
  ),
];

// Dựng hình trong hệ toạ độ cao 300 rồi dời lên DY để viewBox ôm sát (vây vỗ vẫn còn lề ~4%).
const DY = -48;
const shifted: ArtLayer[] = layers.map((l) => ({
  ...l,
  svg: `<g transform="translate(0 ${DY})">${l.svg}</g>`,
  ...(l.pivot ? { pivot: [l.pivot[0], l.pivot[1] + DY] as P } : {}),
}));

const art: CreatureArt = {
  id: 'muc_ong',
  viewBox: [760, 210],
  lengthUnits: 610,
  spineY: 151 + DY,
  animation: 'cephalopod',
  cycleHz: 1.0,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: shifted,
};

export default art;
