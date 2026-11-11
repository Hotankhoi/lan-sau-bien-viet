/**
 * Mực lá – Sepioteuthis lessoniana (Bigfin reef squid)
 * Đặc điểm nhận dạng (nhìn chéo ngang–lưng): áo BẦU DỤC DÀY (dài:cao ≈ 3,2:1), chóp đuôi nhọn tù;
 * ĐẶC TRƯNG: hai VÂY RỘNG chạy gần hết chiều dài áo (≈90%), rộng nhất ở ~40% tính từ đuôi, đầu sau
 * tròn ôm chóp đuôi → áo + vây thành hình "chiếc lá" (vây xa vươn lên trên lưng, vây gần rủ xuống dưới
 * bụng, gốc vây gần có đường trắng sáng). Thân trong mờ hồng nâu / nâu tím nhạt, chấm sắc tố nâu đỏ,
 * VỆT SÁNG NGANG ánh ngũ sắc dọc lưng; MẮT RẤT LỚN ánh xanh lục; 8 tay chụm hình nón + 2 tua chuỳ nhỏ.
 * Vây gợn sóng: mỗi vây chia 6 thuỳ (bend:false, scaleY lệch pha) trên nền vây tĩnh mờ dần.
 * Quy ước hướng như mực ống / mực nang: chóp áo bên trái, đầu và tay bên phải.
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

const u = makeIds('muc_la');

// ---------- Bảng màu (ước lượng từ ảnh tham khảo) ----------
const DORSAL = '#8d6874'; // lưng nâu tím
const FLANK = '#c39ca0'; // hông hồng nâu trong mờ
const BELLY = '#f0e2df'; // bụng ngà
const CHROMA = '#7a3f38'; // chấm sắc tố nâu đỏ
const CHROMA_D = '#4a2328'; // chấm sắc tố co – nâu đen
const PEARL = '#fff6f4';
const OUTLINE = '#5e3a46';
const IRID_G = '#9ff2d4'; // ánh lục
const IRID_B = '#b9c8ff'; // ánh lam tím
const IRID_P = '#ffd2ec'; // ánh hồng
const FIN_TINT = '#d9a3b4'; // vây hồng tím trong

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

// Áo: dài ~340, cao tối đa ~104 (≈3,2:1); to nhất ở ~2/3 phía trước, chóp đuôi nhọn tù (trái)
const TOP_PTS: P[] = [[28, 153], [48, 139], [86, 122], [140, 109], [206, 101], [272, 98], [322, 99], [354, 102], [368, 105]];
const BOT_PTS: P[] = [[28, 156], [50, 170], [92, 186], [150, 198], [216, 204], [280, 205], [326, 202], [352, 198], [362, 196]];
const TOP = sampleCR(TOP_PTS);
const BOT = sampleCR(BOT_PTS);
const topY = (x: number) => yAt(TOP, x);
const botY = (x: number) => yAt(BOT, x);

const MANTLE =
  'M' + TOP.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') +
  // mép áo trước: mấu lưng hơi nhô, vát xuống mép bụng
  `C378 116 374 176 362 196` +
  'L' + [...BOT].reverse().map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') +
  // chóp đuôi nhọn tù
  'C22 155.5 22 153.5 28 153Z';

// Đầu: hẹp hơn mép áo, phình ở mắt to, thu về vành tay
const HEAD = smoothPath(
  [
    [350, 113], [372, 110], [394, 107], [414, 111], [430, 120], [440, 133], [444, 150],
    [441, 166], [431, 178], [413, 186], [392, 189], [370, 189], [350, 188],
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
    const c = r() > 0.7 ? CHROMA_D : CHROMA;
    const op = 0.4 + r() * 0.5;
    for (const [dx, dy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]] as P[]) {
      const cx = x + dx;
      const cy = y + dy;
      if (cx < -rr || cx > size + rr || cy < -rr || cy > size + rr) continue;
      dots += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${rr.toFixed(2)}" fill="${c}" fill-opacity="${op.toFixed(2)}"/>`;
    }
  }
  return `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})">${dots}</pattern>`;
}

// ---------- Vây (đặc trưng: rộng, chạy gần hết thân) ----------
const FX0 = 30; // đầu sau vây ôm chóp đuôi
const FX1 = 346; // đầu trước vây sát mép áo
const NEAR_FRAC = 0.6; // gốc vây gần nằm trên hông (nhìn chéo từ trên)
const FAR_INSET = 10; // gốc vây xa giấu sau áo
const FIN_FAR_H = 44;
const FIN_NEAR_H = 74;
const FIN_SEGS = 6;

/** Độ rộng vây theo vị trí s (0 = đuôi, 1 = trước): rộng nhất ~40% từ đuôi, sau tròn, trước thon dần. */
function finProfile(s: number): number {
  if (s <= 0 || s >= 1) return 0;
  const body = Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(s, 0.7))), 0.55);
  const front = Math.pow(Math.min(1, (1 - s) / 0.45), 0.8);
  return body * front;
}

const nearBaseY = (x: number) => topY(x) + (botY(x) - topY(x)) * NEAR_FRAC;
const farBaseY = (x: number) => topY(x) + Math.min(FAR_INSET, (botY(x) - topY(x)) * 0.35);

/** Điểm gốc & mép ngoài của một đoạn vây. dir -1: vây xa (vươn lên), +1: vây gần (rủ xuống). */
function finPoints(dir: -1 | 1, H: number, x0: number, x1: number, lobe: boolean): { base: P[]; outer: P[] } {
  const base: P[] = [];
  const outer: P[] = [];
  const steps = Math.max(8, Math.round((x1 - x0) / 3));
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const loc = i / steps;
    const s = (x - FX0) / (FX1 - FX0);
    const by = dir < 0 ? farBaseY(x) : nearBaseY(x);
    // thuỳ: thấp ở hai mép đoạn → chỗ nối giữa các thuỳ thành "đáy sóng" của mép vây
    const lb = lobe ? 0.9 + 0.1 * Math.sin(Math.PI * loc) : 1;
    const h = H * finProfile(s) * lb;
    base.push([x, by]);
    // mép ngoài hơi ngả về sau (đuôi)
    outer.push([x - h * 0.12, by + dir * h]);
  }
  return { base, outer };
}

function finPath(dir: -1 | 1, H: number, x0: number, x1: number, lobe: boolean): string {
  const { base, outer } = finPoints(dir, H, x0, x1, lobe);
  return smoothPath([...outer, ...[...base].reverse()], true, 0.35);
}

function finSeg(dir: -1 | 1, H: number, x0: number, x1: number): string {
  const far = dir < 0;
  const { base, outer } = finPoints(dir, H, x0, x1, true);
  const d = smoothPath([...outer, ...[...base].reverse()], true, 0.35);
  // thớ cơ vây: đường mảnh từ gốc ra mép, hơi cong về sau
  let rays = '';
  for (let i = 2; i < outer.length - 1; i += 4) {
    const [bx, by] = base[i];
    const [ox, oy] = outer[i];
    if (Math.abs(oy - by) < 4) continue;
    rays += `M${f1(bx)} ${f1(by)}Q${f1(bx + (ox - bx) * 0.5 - 2)} ${f1(by + (oy - by) * 0.5)} ${f1(bx + (ox - bx) * 0.94)} ${f1(by + (oy - by) * 0.94)}`;
  }
  return (
    `<path d="${d}" fill="${u.url(far ? 'finFar' : 'finNear')}"/>` +
    `<path d="${d}" fill="${u.url('chromaS')}" opacity="${far ? 0.4 : 0.45}"/>` +
    `<path d="${rays}" fill="none" stroke="${PEARL}" stroke-opacity="${far ? 0.08 : 0.13}" stroke-width="0.6"/>` +
    // mép vây sáng mảnh + viền sẫm cùng tông
    `<path d="${smoothPath(outer, false, 0.35)}" fill="none" stroke="${PEARL}" stroke-opacity="${far ? 0.3 : 0.55}" stroke-width="1.3" stroke-linecap="round"/>` +
    `<path d="${smoothPath(outer, false, 0.35)}" fill="none" stroke="${OUTLINE}" stroke-opacity="${far ? 0.4 : 0.45}" stroke-width="0.9" stroke-linecap="round"/>`
  );
}

/** Nền vây tĩnh (lớp uốn): đậm ở gốc, mờ dần ra mép → các thuỳ co giãn không lộ khe hở. */
function finBase(dir: -1 | 1, H: number): string {
  const d = finPath(dir, H * 0.72, FX0, FX1, false);
  return `<path d="${d}" fill="${u.url(dir < 0 ? 'finBaseFar' : 'finBaseNear')}"/>`;
}

function finLayers(dir: -1 | 1, H: number): ArtLayer[] {
  const layers: ArtLayer[] = [];
  const seg = (FX1 - FX0) / FIN_SEGS;
  for (let i = 0; i < FIN_SEGS; i++) {
    const x0 = FX0 + i * seg;
    const x1 = FX0 + (i + 1) * seg;
    const xm = FX0 + (i + 0.5) * seg;
    const by = dir < 0 ? farBaseY(xm) : nearBaseY(xm);
    layers.push({
      name: `${dir < 0 ? 'finFar' : 'finNear'}${i}`,
      role: 'fin',
      bend: false,
      z: dir < 0 ? 'back' : 'front',
      pivot: [Math.round(xm), Math.round(by)],
      // sóng chạy từ trước ra sau; hai vây lệch pha nửa nhịp
      anim: { type: 'scaleY', amp: 0.22, speed: 1.5, phase: (FIN_SEGS - 1 - i) * -1.05 + (dir < 0 ? Math.PI : 0) },
      // các thuỳ nối mép nhau (không chồng → không lộ vạch đậm)
      svg: finSeg(dir, H, x0, x1),
    });
  }
  return layers;
}

// ---------- Thân (áo) ----------
const body = standardBody(u, MANTLE, {
  dorsal: DORSAL,
  flank: FLANK,
  belly: BELLY,
  outlineColor: OUTLINE,
  scales: false,
  flankAt: 0.5,
  rimOpacity: 0.75,
});

/** Vệt sáng ngang ánh ngũ sắc: các gạch ngắn xếp hàng dọc lưng áo (ref4). */
function iridStreaks(x0: number, x1: number, rows: number, top: (x: number) => number, depth: (x: number) => number, seed: number): string {
  const r = rng(seed);
  const cols = [IRID_G, IRID_B, IRID_P, IRID_G, PEARL];
  let glow = '';
  let core = '';
  for (let row = 0; row < rows; row++) {
    let x = x0 + r() * 14 + row * 5;
    while (x < x1) {
      const fr = (row + 0.5 + (r() - 0.5) * 0.5) / rows;
      const y = top(x) + depth(x) * fr;
      const len = 6 + r() * 9;
      const tilt = -1.8 - r() * 1.6; // gạch hơi xếch lên về phía trước
      const c = cols[Math.floor(r() * cols.length)];
      const d = `M${f1(x)} ${f1(y)}L${f1(x + len)} ${f1(y + tilt)}`;
      glow += `<path d="${d}" stroke="${c}" stroke-opacity="${(0.25 + r() * 0.2).toFixed(2)}"/>`;
      core += `<path d="${d}"/>`;
      x += len + 8 + r() * 16;
    }
  }
  return (
    `<g fill="none" stroke-width="3.4" stroke-linecap="round">${glow}</g>` +
    `<g fill="none" stroke="${PEARL}" stroke-opacity="0.7" stroke-width="1" stroke-linecap="round">${core}</g>`
  );
}

/** Đường trắng sáng ở gốc vây gần (ref3, ref4) + quầng ánh lục. */
function nearFinRootLine(): string {
  const pts: P[] = [];
  for (let x = FX0 + 10; x <= FX1 - 2; x += 6) pts.push([x, nearBaseY(x)]);
  const d = smoothPath(pts, false);
  return (
    `<path d="${d}" fill="none" stroke="${CHROMA_D}" stroke-opacity="0.12" stroke-width="7" transform="translate(0 -3)"/>` +
    `<path d="${d}" fill="none" stroke="${IRID_G}" stroke-opacity="0.25" stroke-width="5"/>` +
    `<path d="${d}" fill="none" stroke="${PEARL}" stroke-opacity="0.85" stroke-width="1.6" stroke-linecap="round"/>`
  );
}

const mantleSvg =
  body.base +
  `<g clip-path="${u.url('bodyClip')}">` +
  `<g filter="${u.url('skin')}"><path d="${MANTLE}" fill="${u.url('bodyFill')}"/></g>` +
  // nội tạng & túi mực thấp thoáng qua lớp áo trong mờ
  `<ellipse cx="250" cy="160" rx="118" ry="24" fill="${u.url('viscera')}"/>` +
  `<ellipse cx="300" cy="166" rx="34" ry="10" fill="${u.url('inkSac')}"/>` +
  // ánh ngọc trai dọc hông
  `<path d="M50 162C140 150 270 150 360 160C270 174 140 174 50 162Z" fill="${PEARL}" opacity="0.2"/>` +
  // chấm sắc tố: dày ở lưng → thưa ở bụng
  `<g mask="${u.url('dorsalMask')}">` +
  `<rect x="20" y="90" width="360" height="120" fill="${u.url('chromaS')}"/>` +
  `<rect x="20" y="90" width="360" height="120" fill="${u.url('chromaL')}"/>` +
  `</g>` +
  scatterSpots(41, { x: 60, y: 104, w: 300, h: 30 }, { count: 46, rMin: 1.1, rMax: 2.2, color: CHROMA_D, opacity: 0.45, minGap: 8 }) +
  // bút (gladius) mờ dưới da lưng
  `<path d="${smoothPath(TOP_PTS.slice(1, -1).map(([x, y]) => [x, y + 6] as P))}" fill="none" stroke="${PEARL}" stroke-opacity="0.2" stroke-width="1.6"/>` +
  iridStreaks(70, 352, 3, (x) => topY(x) + 6, (x) => (botY(x) - topY(x)) * 0.36, 77) +
  `<path d="${MANTLE}" fill="${u.url('bodyVol')}"/>` +
  `</g>` +
  outline(MANTLE, OUTLINE, 1.5, 0.65) +
  rimLight(MANTLE, u.url('rim')) +
  // mép áo trước – nét sáng của khe áo
  `<path d="M368 106C377 118 373 174 362 195" fill="none" stroke="${PEARL}" stroke-opacity="0.45" stroke-width="1.3"/>`;

// ---------- Đầu & mắt ----------
const EX = 396;
const EY = 145;
const ER = 19;
const theEye = eye(u, 'eye', {
  cx: EX,
  cy: EY,
  r: ER,
  iris: ['#d3ece6', '#35586a'],
  pupil: 'round',
  socket: '#6b4350',
  pupilColor: '#05080a',
  look: [0.25, 0.05],
});

const SIPHON = `M352 184C366 187 380 189 392 190C396 193 394 198 388 198.5C376 198 362 196 352 194Z`;

const headSvg =
  `<path d="${SIPHON}" fill="${u.url('siphon')}" stroke="${OUTLINE}" stroke-opacity="0.45" stroke-width="0.9"/>` +
  `<path d="M358 190C372 192 384 193 394 194" fill="none" stroke="${PEARL}" stroke-opacity="0.4" stroke-width="0.9"/>` +
  `<path d="${HEAD}" fill="${u.url('headFill')}"/>` +
  `<g clip-path="${u.url('headClip')}">` +
  `<g filter="${u.url('skin')}"><path d="${HEAD}" fill="${u.url('headFill')}"/></g>` +
  // ánh vàng nâu quanh mắt & đỉnh đầu (ref2, ref4)
  `<ellipse cx="404" cy="136" rx="40" ry="26" fill="${u.url('goldWash')}"/>` +
  `<g mask="${u.url('headMask')}"><rect x="345" y="100" width="105" height="95" fill="${u.url('chromaS')}"/></g>` +
  scatterSpots(52, { x: 352, y: 110, w: 88, h: 34 }, { count: 22, rMin: 0.9, rMax: 1.8, color: CHROMA_D, opacity: 0.45, minGap: 6 }) +
  // vệt sáng ngang trên đầu
  iridStreaks(356, 436, 2, (x) => 108 + (x - 356) * 0.08, () => 16, 5) +
  // nếp gáy & rãnh sau mắt
  `<path d="M372 112C368 134 369 162 375 186" fill="none" stroke="${OUTLINE}" stroke-opacity="0.2" stroke-width="2"/>` +
  `<path d="M426 122C431 138 431 158 425 174" fill="none" stroke="${OUTLINE}" stroke-opacity="0.16" stroke-width="1.4"/>` +
  `<path d="${HEAD}" fill="${u.url('bodyVol')}"/>` +
  `</g>` +
  outline(HEAD, OUTLINE, 1.3, 0.6) +
  rimLight(HEAD, u.url('rim'));

const eyeSvg =
  // quầng vàng cam nhạt quanh mắt (ref2)
  `<circle cx="${EX}" cy="${EY}" r="${f1(ER * 1.75)}" fill="${u.url('eyeHalo')}"/>` +
  // giác mạc trong suốt phồng
  `<circle cx="${EX}" cy="${EY}" r="${f1(ER * 1.45)}" fill="${u.url('cornea')}"/>` +
  `<circle cx="${EX}" cy="${EY}" r="${f1(ER * 1.45)}" fill="none" stroke="${PEARL}" stroke-opacity="0.3" stroke-width="1"/>` +
  // vòng ánh xanh lục quanh mống mắt
  `<circle cx="${EX}" cy="${EY}" r="${f1(ER * 1.16)}" fill="none" stroke="${IRID_G}" stroke-opacity="0.5" stroke-width="3"/>` +
  theEye.svg +
  // ánh lục óng trên tròng
  `<path d="M${EX - 12} ${EY + 9}A${ER * 0.8} ${ER * 0.8} 0 0 0 ${EX + 13} ${EY + 8}" fill="none" stroke="${IRID_G}" stroke-width="2.4" stroke-opacity="0.55" stroke-linecap="round"/>` +
  // phản chiếu cong trên giác mạc
  `<path d="M${EX - 24} ${EY + 4}A${ER * 1.3} ${ER * 1.3} 0 0 1 ${EX - 10} ${EY - 22}" fill="none" stroke="#ffffff" stroke-width="1.7" stroke-opacity="0.6" stroke-linecap="round"/>`;

// ---------- Tay & tua ----------

/** Tay thuôn nhọn chạy theo đường cong qua các điểm (gốc → ngọn). */
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
    const w = (w0 / 2) * Math.pow(Math.max(0, 1 - s), 0.85) + 0.5;
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
  // giác hút ở mặt trong (hướng về trục giữa khối tay)
  const inner = (b[1] + t[1]) / 2 < 150 ? g.lo : g.up;
  let suck = '';
  for (let i = 3; i < inner.length - 3; i++) {
    const [x, y] = inner[i];
    const [sx, sy] = g.spine[i];
    const rr = Math.max(0.45, 1.15 * (1 - i / inner.length));
    suck += `<circle cx="${f1(x + (sx - x) * 0.3)}" cy="${f1(y + (sy - y) * 0.3)}" r="${rr.toFixed(2)}"/>`;
  }
  return (
    `<path d="${g.d}" fill="${far ? u.url('armFar') : u.url('arm')}"/>` +
    `<path d="${g.d}" fill="${u.url('chromaS')}" opacity="${far ? 0.4 : 0.6}"/>` +
    `<g fill="${PEARL}" fill-opacity="${far ? 0.3 : 0.55}" stroke="${OUTLINE}" stroke-opacity="0.25" stroke-width="0.4">${suck}</g>` +
    `<path d="${smoothPath(g.spine.slice(1, -3), false)}" fill="none" stroke="${PEARL}" stroke-opacity="${far ? 0.12 : 0.3}" stroke-width="1" transform="translate(0 -1.3)"/>` +
    outline(g.d, OUTLINE, 0.9, far ? 0.35 : 0.5)
  );
}

/** Tua bắt mồi: cuống mảnh + chuỳ nhỏ hình mũi mác có giác hút. */
function tentacle(b: P, c1: P, c2: P, e: P, tip: P, far = false): string {
  const stalk = `M${b[0]} ${b[1]}C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${e[0]} ${e[1]}`;
  const dx = tip[0] - e[0];
  const dy = tip[1] - e[1];
  const L = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / L;
  const ny = dx / L;
  const pt = (s: number, o: number): P => [e[0] + dx * s + nx * o, e[1] + dy * s + ny * o];
  const a = pt(0, 1.7);
  const b2 = pt(0, -1.7);
  const m1 = pt(0.45, 5.5);
  const m2 = pt(0.45, -4.5);
  const club = `M${f1(a[0])} ${f1(a[1])}Q${f1(m1[0])} ${f1(m1[1])} ${tip[0]} ${tip[1]}Q${f1(m2[0])} ${f1(m2[1])} ${f1(b2[0])} ${f1(b2[1])}Z`;
  let suck = '';
  for (let i = 0; i < 8; i++) {
    const s = 0.12 + i * 0.1;
    const wid = Math.sin(Math.PI * Math.min(1, s + 0.05)) * 2.8;
    for (const side of [-1, 1]) {
      const [x, y] = pt(s, side * wid * 0.45 + 0.5);
      suck += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${Math.max(0.4, 1 - i * 0.07).toFixed(2)}"/>`;
    }
  }
  const col = far ? shade(DORSAL, -0.2) : mix(DORSAL, FLANK, 0.4);
  return (
    `<path d="${stalk}" fill="none" stroke="${OUTLINE}" stroke-opacity="${far ? 0.45 : 0.55}" stroke-width="4.4" stroke-linecap="round"/>` +
    `<path d="${stalk}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="${stalk}" fill="none" stroke="${PEARL}" stroke-opacity="${far ? 0.15 : 0.3}" stroke-width="0.9" stroke-linecap="round" transform="translate(0 -0.8)"/>` +
    `<path d="${club}" fill="${col}" stroke="${OUTLINE}" stroke-opacity="0.6" stroke-width="0.9"/>` +
    `<path d="${club}" fill="${u.url('chromaS')}" opacity="${far ? 0.4 : 0.6}"/>` +
    `<g fill="${PEARL}" opacity="${far ? 0.5 : 0.8}">${suck}</g>`
  );
}

// ---------- Mây sắc tố (sóng đổi màu chạy dọc thân) ----------
function cloudLayer(i: number): ArtLayer {
  const r = rng(500 + i);
  let shapes = '';
  let spots = '';
  for (let k = 0; k < 4; k++) {
    const x = 70 + k * 92 + i * 31;
    if (x > 360) continue;
    const cy = topY(x) + 30;
    const rx = 30 + r() * 10;
    const ry = 26 + r() * 8;
    shapes += `<ellipse cx="${x}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}"/>`;
    for (let j = 0; j < 24; j++) {
      const ang = r() * Math.PI * 2;
      const rad = Math.sqrt(r());
      const sx = x + Math.cos(ang) * rad * rx * 0.9;
      const sy = cy + Math.sin(ang) * rad * ry * 0.9;
      spots += `<circle cx="${f1(sx)}" cy="${f1(sy)}" r="${(1.2 + r() * 1.5 * (1 - rad * 0.6)).toFixed(2)}"/>`;
    }
  }
  return {
    name: `chromaWave${i}`,
    role: 'pattern',
    bend: false,
    z: 'front',
    pivot: [200, 152],
    // pha lệch dần → vùng sẫm chạy từ đầu về đuôi
    anim: { type: 'alpha', amp: 1, speed: 0.55, phase: i * 2.094 },
    svg:
      `<g clip-path="${u.url('bodyClip')}">` +
      `<g fill="${u.url('cloud')}">${shapes}</g>` +
      `<g fill="${CHROMA_D}" fill-opacity="0.5">${spots}</g>` +
      `</g>`,
  };
}

// ---------- Defs ----------
const defs = joinDefs(
  body,
  theEye,
  organicTexture(u('skin'), { freq: 0.08, octaves: 2, strength: 0.1, seed: 31 }),
  chromaPattern(u('chromaS'), 30, 24, 0.45, 1.2, 13, 0),
  chromaPattern(u('chromaL'), 58, 12, 1.0, 2.0, 29, 21),
  linear(u('dorsalMaskG'), [[0, '#ffffff', 1], [0.4, '#ffffff', 0.75], [0.75, '#ffffff', 0.3], [1, '#ffffff', 0.12]], { user: true, x1: 0, y1: 100, x2: 0, y2: 205 }),
  `<mask id="${u('dorsalMask')}" maskUnits="userSpaceOnUse" x="0" y="85" width="400" height="130"><rect x="0" y="85" width="400" height="130" fill="${u.url('dorsalMaskG')}"/></mask>`,
  linear(u('headMaskG'), [[0, '#ffffff', 1], [0.55, '#ffffff', 0.7], [1, '#ffffff', 0.2]], { user: true, x1: 0, y1: 108, x2: 0, y2: 190 }),
  `<mask id="${u('headMask')}" maskUnits="userSpaceOnUse" x="340" y="98" width="115" height="100"><rect x="340" y="98" width="115" height="100" fill="${u.url('headMaskG')}"/></mask>`,
  radial(u('viscera'), [[0, '#7a3a4a', 0.16], [0.7, '#7a3a4a', 0.06], [1, '#7a3a4a', 0]]),
  radial(u('inkSac'), [[0, '#2a1820', 0.28], [0.6, '#3a2028', 0.12], [1, '#3a2028', 0]]),
  linear(u('headFill'), [
    [0, shade(DORSAL, -0.25)],
    [0.35, shade(DORSAL, -0.04)],
    [0.68, FLANK],
    [1, BELLY],
  ]),
  `<clipPath id="${u('headClip')}"><path d="${HEAD}"/></clipPath>`,
  linear(u('siphon'), [[0, mix(DORSAL, FLANK, 0.5)], [1, BELLY]]),
  radial(u('cornea'), [[0, '#ffffff', 0], [0.7, '#ffffff', 0.04], [0.92, '#eefff8', 0.22], [1, '#ffffff', 0.05]]),
  radial(u('goldWash'), [[0, '#d8a75e', 0.3], [0.6, '#c99a5c', 0.14], [1, '#c99a5c', 0]]),
  radial(u('eyeHalo'), [[0, '#e8b46a', 0], [0.6, '#e8b46a', 0], [0.8, '#e8b46a', 0.2], [1, '#e8b46a', 0]]),
  // vây: trong hơn thân (bán trong suốt), vây xa sẫm hơn
  linear(u('finFar'), [[0, mix(FLANK, FIN_TINT, 0.4), 0.5], [0.6, mix(DORSAL, FIN_TINT, 0.35), 0.58], [1, DORSAL, 0.66]]),
  linear(u('finNear'), [[0, mix(FLANK, DORSAL, 0.2), 0.64], [0.5, mix(FLANK, FIN_TINT, 0.4), 0.54], [1, mix(FIN_TINT, PEARL, 0.4), 0.44]]),
  // nền vây: đậm ở gốc, mờ dần ra mép
  linear(u('finBaseFar'), [[0, DORSAL, 0], [0.5, DORSAL, 0.25], [1, shade(DORSAL, -0.1), 0.6]]),
  linear(u('finBaseNear'), [[0, mix(FLANK, DORSAL, 0.25), 0.7], [0.5, FLANK, 0.3], [1, FLANK, 0]]),
  linear(u('arm'), [[0, shade(DORSAL, -0.06)], [0.5, mix(DORSAL, FLANK, 0.5)], [1, BELLY]]),
  linear(u('armFar'), [[0, shade(DORSAL, -0.3)], [1, shade(DORSAL, -0.12)]]),
  // tay hiện dần từ trong đầu ra → không lộ mép gốc tay
  linear(u('armFadeG'), [[0, '#ffffff', 0], [1, '#ffffff', 1]], { user: true, x1: 430, y1: 0, x2: 444, y2: 0 }),
  `<mask id="${u('armFade')}" maskUnits="userSpaceOnUse" x="420" y="90" width="180" height="130"><rect x="420" y="90" width="180" height="130" fill="${u.url('armFadeG')}"/></mask>`,
  radial(u('cloud'), [[0, '#5e2430', 0.42], [0.6, CHROMA, 0.2], [1, CHROMA, 0]]),
);

// ---------- Lắp ráp ----------
type ArmSpec = { name: string; pts: P[]; w: number; amp: number; ph: number };
// 4 tay phía gần (lưng → bụng), chụm thành khối nón chĩa về trước, hơi chúc xuống
const nearArms: ArmSpec[] = [
  { name: 'arm1', pts: [[432, 128], [462, 127], [492, 131], [514, 137], [522, 142]], w: 15, amp: 0.045, ph: 0 },
  { name: 'arm4', pts: [[432, 172], [458, 177], [486, 179], [508, 176], [516, 170]], w: 14, amp: 0.045, ph: 2.6 },
  { name: 'arm2', pts: [[437, 140], [470, 142], [502, 146], [526, 151], [534, 155]], w: 17, amp: 0.04, ph: 0.9 },
  { name: 'arm3', pts: [[437, 159], [470, 162], [502, 163], [526, 160], [533, 156]], w: 17, amp: 0.04, ph: 1.8 },
];

const layers: ArtLayer[] = [
  // --- phía sau thân ---
  ...finLayers(-1, FIN_FAR_H),
  {
    name: 'armsFar',
    role: 'arm',
    bend: false,
    z: 'back',
    pivot: [438, 150],
    anim: { type: 'rotate', amp: 0.035, speed: 0.7, phase: 2.2 },
    svg:
      `<g mask="${u.url('armFade')}">` +
      arm([[434, 133], [464, 133], [494, 137], [516, 142], [523, 147]], 13, true) +
      arm([[436, 147], [470, 150], [504, 153], [526, 155], [532, 152]], 14, true) +
      arm([[434, 166], [464, 171], [494, 172], [514, 169], [520, 164]], 12, true) +
      `</g>`,
  },
  {
    name: 'tentacleFar',
    role: 'tentacle',
    bend: false,
    z: 'back',
    pivot: [438, 156],
    anim: { type: 'rotate', amp: 0.05, speed: 0.8, phase: 1.1 },
    svg: `<g mask="${u.url('armFade')}">${tentacle([438, 156], [480, 150], [512, 158], [536, 152], [560, 146], true)}</g>`,
  },
  // --- lớp "uốn" (bendAmp 0 → đứng yên cùng thân) ---
  { name: 'finFarBase', role: 'detail', svg: finBase(-1, FIN_FAR_H) },
  { name: 'head', role: 'body', svg: headSvg },
  { name: 'eye', role: 'eye', svg: eyeSvg },
  { name: 'mantle', role: 'body', svg: mantleSvg },
  { name: 'finNearBase', role: 'detail', svg: finBase(1, FIN_NEAR_H) + nearFinRootLine() },
  // --- phía trước ---
  cloudLayer(0),
  cloudLayer(1),
  cloudLayer(2),
  ...finLayers(1, FIN_NEAR_H),
  {
    name: 'tentacleNear',
    role: 'tentacle',
    bend: false,
    z: 'front',
    pivot: [438, 162],
    anim: { type: 'rotate', amp: 0.06, speed: 0.8, phase: 0.2 },
    svg: `<g mask="${u.url('armFade')}">${tentacle([438, 162], [482, 172], [516, 168], [542, 162], [568, 156])}</g>`,
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

// Dựng hình trong hệ toạ độ cao ~310 rồi dời lên DY để viewBox ôm sát (vây vỗ vẫn còn lề ~4%).
const DY = -54;
const shifted: ArtLayer[] = layers.map((l) => ({
  ...l,
  svg: `<g transform="translate(0 ${DY})">${l.svg}</g>`,
  ...(l.pivot ? { pivot: [l.pivot[0], l.pivot[1] + DY] as P } : {}),
}));

const art: CreatureArt = {
  id: 'muc_la',
  viewBox: [590, 210],
  lengthUnits: 535,
  spineY: 152 + DY,
  animation: 'cephalopod',
  cycleHz: 0.9,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: shifted,
};

export default art;
