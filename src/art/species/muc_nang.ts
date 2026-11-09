/**
 * Mực nang vằn – Sepia pharaonis (Pharaoh cuttlefish)
 * Đặc điểm nhận dạng: thân (áo) bầu dục dẹt, thuôn về phía sau; vây mỏng màu kem viền quanh thân
 * gợn sóng liên tục, gốc vây có đường ánh tím; sọc vằn ngang nâu tím xen kem trên lưng;
 * mắt lớn đồng tử chữ W; 8 tay ngắn chụm thành hình nón + 2 tua bắt mồi có chuỳ giác hút.
 * Hiệu ứng đổi màu: 3 lớp "mây màu" chồng nhau nhấp nháy lệch pha → sóng màu chạy dọc thân.
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

const u = makeIds('muc_nang');

// ---------- Bảng màu (ước lượng từ ảnh tham khảo + mô tả loài) ----------
const PURPLE_D = '#3b2133'; // sọc vằn đậm
const PURPLE = '#5e3a4e';
const BROWN = '#8a6262';
const CREAM = '#efe1c8';
const CREAM_L = '#fbf3e4';
const IRID = '#c27ad0'; // đường ánh tím ở gốc vây
const OUTLINE = '#3a2230';

type P = [number, number];

// ---------- Hình học ----------

/** Lấy mẫu dày đường Catmull-Rom qua các điểm (để vừa vẽ thân vừa đặt vây). */
function sampleCR(pts: P[], perSeg = 14): P[] {
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

const f1 = (n: number) => n.toFixed(1);
const poly = (pts: P[], close = true) => 'M' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') + (close ? 'Z' : '');

// Đường lưng và đường bụng của áo (từ chóp sau → mép trước)
const TOP_PTS: P[] = [[44, 150], [70, 132], [110, 117], [170, 106], [244, 100], [320, 99], [380, 103], [414, 111]];
const BOT_PTS: P[] = [[44, 190], [72, 203], [116, 213], [176, 219], [252, 221], [330, 217], [386, 209], [414, 201]];
const TOP = sampleCR(TOP_PTS);
const BOT = sampleCR(BOT_PTS);

/** Nội suy y theo x trên một đường đã lấy mẫu (x tăng dần). */
function yAt(line: P[], x: number): number {
  for (let i = 0; i < line.length - 1; i++) {
    const [x1, y1] = line[i];
    const [x2, y2] = line[i + 1];
    if (x >= x1 && x <= x2) return x2 === x1 ? y1 : y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
  }
  return x < line[0][0] ? line[0][1] : line[line.length - 1][1];
}
const topY = (x: number) => yAt(TOP, x);
const botY = (x: number) => yAt(BOT, x);

// Mép trước của áo hơi lồi ra trùm lên gáy
const MANTLE =
  poly(TOP, false).replace(/Z$/, '') +
  `C428 126 428 180 414 201` +
  'L' +
  [...BOT].reverse().map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') +
  // chóp sau tròn hơi nhọn
  'C34 184 28 168 44 150Z';

// Đầu: gồ mắt, thu dần về vành tay
const HEAD = smoothPath(
  [
    [398, 115], [426, 110], [452, 109], [476, 115], [498, 126], [514, 140], [523, 158],
    [520, 180], [506, 196], [482, 208], [452, 214], [422, 214], [400, 210],
  ],
  true,
);

// ---------- Thân (áo) ----------
const body = standardBody(u, MANTLE, {
  dorsal: '#7a5560',
  flank: '#b99583',
  belly: '#f1e3cc',
  outlineColor: OUTLINE,
  scales: false,
  flankAt: 0.52,
  rimOpacity: 0.7,
});

/** Sọc vằn ngang (cắt ngang thân) lượn sóng, đậm ở lưng nhạt dần xuống hông. */
function zebra(): string {
  const r = rng(4242);
  let dark = '';
  let light = '';
  let x = 62;
  while (x < 412) {
    const t = topY(x);
    const h = botY(x) - t;
    const edge = Math.min(1, (x - 50) / 50, (420 - x) / 40);
    const depth = h * (0.5 + r() * 0.18) * (0.6 + 0.4 * edge);
    const w = (12 + r() * 7) * (0.55 + 0.45 * edge);
    const n = 5;
    const left: P[] = [];
    const right: P[] = [];
    for (let k = 0; k <= n; k++) {
      const s = k / n;
      const yy = t - 4 + depth * s;
      const wob = Math.sin(s * Math.PI * 2 + x * 0.07) * 2.6 + (r() - 0.5) * 1.6 - s * 7;
      const ww = w * (1 - s * 0.62);
      left.push([x + wob - ww / 2, yy]);
      right.push([x + wob + ww / 2, yy]);
    }
    dark += `<path d="${smoothPath([...left, ...right.reverse()], true)}"/>`;
    // vạch kem sáng giữa hai sọc
    const lx = x + w / 2 + 5 + r() * 3;
    const lt = topY(lx);
    light += `<path d="M${f1(lx + 1)} ${f1(lt + 4)}C${f1(lx + 4)} ${f1(lt + depth * 0.25)} ${f1(lx - 5)} ${f1(lt + depth * 0.45)} ${f1(lx - 4)} ${f1(lt + depth * 0.7)}"/>`;
    // nhánh rẽ nhỏ (sọc vằn hay chẻ đôi)
    if (r() > 0.55) {
      const by = t + depth * (0.35 + r() * 0.2);
      dark += `<path d="M${f1(x - 1)} ${f1(by)}Q${f1(x - 8)} ${f1(by + 8)} ${f1(x - 12)} ${f1(by + 16)}" fill="none" stroke="${u.url('stripe')}" stroke-width="2.6" stroke-linecap="round"/>`;
    }
    x += 14 + r() * 8 + w * 0.75;
  }
  return (
    `<g fill="${u.url('stripe')}">${dark}</g>` +
    `<g fill="none" stroke="${CREAM_L}" stroke-opacity="0.24" stroke-width="2.6" stroke-linecap="round">${light}</g>`
  );
}

/** Đường ánh tím ở gốc vây (trên & dưới) – đặc trưng rõ trên ảnh tham khảo. */
function iridLines(): string {
  const top = TOP.filter(([x]) => x > 58 && x < 410).map(([x, y]) => [x, y + 3.5] as P);
  const bot = BOT.filter(([x]) => x > 58 && x < 410).map(([x, y]) => [x, y - 3.5] as P);
  const line = (pts: P[], w: number, op: number, c: string) =>
    `<path d="${poly(pts, false)}" fill="none" stroke="${c}" stroke-width="${w}" stroke-opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return (
    line(bot, 5, 0.18, IRID) + line(bot, 1.8, 0.85, IRID) + line(bot, 0.7, 0.6, '#ffe8ff') +
    line(top, 4, 0.14, IRID) + line(top, 1.4, 0.6, IRID)
  );
}

const mantleSvg =
  body.base +
  `<g clip-path="${u.url('bodyClip')}">` +
  `<g filter="${u.url('skin')}">` +
  `<path d="${MANTLE}" fill="${u.url('bodyFill')}"/>` +
  zebra() +
  // vệt kem sáng dọc hông (ảnh tham khảo: hông sáng hơn lưng)
  `<path d="M70 196C150 210 260 214 400 196L400 214C260 228 150 226 70 206Z" fill="${CREAM}" opacity="0.35"/>` +
  `</g>` +
  scatterSpots(91, { x: 60, y: 100, w: 350, h: 90 }, { count: 46, rMin: 0.7, rMax: 2.1, color: CREAM_L, opacity: 0.55, minGap: 9 }) +
  scatterSpots(17, { x: 60, y: 104, w: 350, h: 70 }, { count: 30, rMin: 0.6, rMax: 1.4, color: PURPLE_D, opacity: 0.5, minGap: 10 }) +
  iridLines() +
  `</g>` +
  body.overlay +
  // mép áo trước (khe áo) – nét mảnh, sáng phía trước
  `<path d="M414 114C428 128 428 182 414 204" fill="none" stroke="${OUTLINE}" stroke-opacity="0.5" stroke-width="1.6"/>` +
  `<path d="M418 124C426 140 426 170 419 190" fill="none" stroke="${CREAM_L}" stroke-opacity="0.35" stroke-width="1.2"/>`;

// ---------- Đầu ----------
const theEye = eye(u, 'eye', {
  cx: 454,
  cy: 146,
  r: 17,
  iris: ['#d8c89a', '#5e4a32'],
  pupil: 'w',
  socket: '#4a2b3c',
  pupilColor: '#0b0a0e',
  look: [0.1, 0.25],
});

const headSvg =
  `<path d="${HEAD}" fill="${u.url('headFill')}"/>` +
  `<g clip-path="${u.url('headClip')}">` +
  `<g filter="${u.url('skin')}"><path d="${HEAD}" fill="${u.url('headFill')}"/>` +
  // sọc vằn kéo lên đỉnh đầu
  `<g fill="${u.url('stripe')}" opacity="0.85">` +
  `<path d="M402 106L414 104Q408 124 404 140L396 140Z"/>` +
  `<path d="M480 114L492 120Q486 132 480 142L474 138Z"/>` +
  `<path d="M500 126L510 134Q504 146 498 152L492 148Z"/>` +
  `</g>` +
  // mảng loang (mực nang đổi màu loang lổ quanh mắt)
  `<g fill="${PURPLE}" opacity="0.4"><ellipse cx="428" cy="132" rx="12" ry="7"/><ellipse cx="492" cy="166" rx="10" ry="7"/><ellipse cx="470" cy="186" rx="11" ry="6"/><ellipse cx="420" cy="176" rx="8" ry="10"/></g>` +
  // má/hàm kem sáng
  `<path d="M404 190Q450 200 512 184L512 206Q450 226 404 214Z" fill="${CREAM}" opacity="0.5"/>` +
  `</g>` +
  scatterSpots(33, { x: 400, y: 110, w: 118, h: 90 }, { count: 16, rMin: 0.6, rMax: 1.6, color: CREAM_L, opacity: 0.55, minGap: 8 }) +
  `<path d="${HEAD}" fill="${u.url('bodyVol')}"/>` +
  `</g>` +
  outline(HEAD, OUTLINE) +
  rimLight(HEAD, u.url('rim')) +
  // ống phễu (siphon) dưới đầu
  `<path d="M404 204C414 209 426 211 436 209C434 214 426 217 416 216C410 215 406 210 404 204Z" fill="${mix(PURPLE, BROWN, 0.55)}" stroke="${OUTLINE}" stroke-opacity="0.4" stroke-width="0.9"/>` +
  // điểm ánh xanh nhỏ dưới mắt (thấy trên ảnh)
  `<ellipse cx="440" cy="186" rx="2.4" ry="3.6" fill="#7fd6d0" opacity="0.5"/>`;

const eyeSvg =
  theEye.svg +
  // mí trên nhạt màu – tạo nét "lông mày" như ảnh tham khảo
  `<path d="M432 140Q446 120 468 126Q478 130 480 140" fill="none" stroke="${CREAM_L}" stroke-width="2" stroke-opacity="0.45" stroke-linecap="round"/>` +
  `<path d="M434 156Q454 172 476 154" fill="none" stroke="${CREAM_L}" stroke-width="1.4" stroke-opacity="0.3" stroke-linecap="round"/>`;

// ---------- Vây viền quanh thân (gợn sóng) ----------
const FIN_X0 = 52;
const FIN_X1 = 408;

/** Pháp tuyến hướng ra ngoài của đường viền tại x. side = -1 (lưng) | 1 (bụng). */
function normalAt(x: number, side: -1 | 1): P {
  const f = side < 0 ? topY : botY;
  const dy = f(x + 1) - f(x - 1);
  const len = Math.hypot(2, dy);
  // pháp tuyến của (2, dy): (dy, -2) hoặc (-dy, 2)
  let nx = dy / len;
  let ny = -2 / len;
  if (side > 0) {
    nx = -nx;
    ny = -ny;
  }
  return [nx, ny];
}

/** Độ rộng vây thu nhỏ ở hai đầu. */
function finTaper(x: number): number {
  const a = Math.min(1, (x - FIN_X0) / 46);
  const b = Math.min(1, (FIN_X1 - x) / 22);
  return Math.max(0, Math.min(a, b));
}

function finPoints(x0: number, x1: number, side: -1 | 1, H: number, lobe: boolean, inset = 6): { outer: P[]; inner: P[] } {
  const f = side < 0 ? topY : botY;
  const outer: P[] = [];
  const inner: P[] = [];
  const steps = Math.max(6, Math.round((x1 - x0) / 4));
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const s = i / steps;
    const [nx, ny] = normalAt(x, side);
    const y = f(x);
    const prof = lobe ? 0.78 + 0.22 * Math.sin(Math.PI * s) : 1;
    const h = H * prof * finTaper(x);
    outer.push([x + nx * h, y + ny * h]);
    inner.push([x - nx * inset, y - ny * inset]);
  }
  return { outer, inner };
}

function finShape(x0: number, x1: number, side: -1 | 1, H: number, lobe: boolean): string {
  const { outer, inner } = finPoints(x0, x1, side, H, lobe);
  const d = smoothPath([...outer, ...inner.reverse()], true, 0.4);
  // vân mảnh vuông góc với gốc vây
  let striae = '';
  const { outer: o2 } = finPoints(x0, x1, side, H * 0.92, lobe, 0);
  const { outer: base } = finPoints(x0, x1, side, 0.5, false, 0);
  for (let i = 1; i < o2.length - 1; i++) {
    striae += `M${f1(base[i][0])} ${f1(base[i][1])}L${f1(o2[i][0])} ${f1(o2[i][1])}`;
  }
  return (
    `<path d="${d}" fill="${u.url(side < 0 ? 'finTop' : 'finBot')}"/>` +
    `<path d="${striae}" fill="none" stroke="${CREAM_L}" stroke-opacity="0.32" stroke-width="0.6"/>` +
    `<path d="${smoothPath(outer, false, 0.4)}" fill="none" stroke="${CREAM_L}" stroke-opacity="${lobe ? 0.45 : 0.7}" stroke-width="1" stroke-linecap="round"/>`
  );
}

function finLayers(side: -1 | 1, n: number, H: number): ArtLayer[] {
  const layers: ArtLayer[] = [];
  const seg = (FIN_X1 - FIN_X0) / n;
  for (let i = 0; i < n; i++) {
    // thuỳ chồng nhẹ sang hai bên để mép vây liền mạch
    const x0 = Math.max(FIN_X0, FIN_X0 + i * seg - seg * 0.0);
    const x1 = Math.min(FIN_X1, FIN_X0 + (i + 1) * seg + seg * 0.0);
    const xm = FIN_X0 + (i + 0.5) * seg;
    const py = side < 0 ? topY(xm) : botY(xm);
    layers.push({
      name: `fin${side < 0 ? 'Top' : 'Bot'}${i}`,
      role: 'fin',
      bend: false,
      z: 'back',
      pivot: [Math.round(xm), Math.round(py)],
      // sóng chạy từ trước ra sau: thuỳ phía trước lệch pha sớm hơn
      anim: { type: 'scaleY', amp: 0.32, speed: 1.7, phase: i * 0.95 + (side < 0 ? 0 : 0.6) },
      svg: finShape(x0, x1, side, H, true),
    });
  }
  return layers;
}

// ---------- Tay & tua ----------

/** Tay thuôn nhọn theo đường cong bậc 2 từ gốc b tới ngọn t. */
function armPath(b: P, t: P, w0: number, bow: number): { d: string; spine: P[]; under: P[] } {
  const dx = t[0] - b[0];
  const dy = t[1] - b[1];
  const L = Math.hypot(dx, dy);
  const nx = -dy / L;
  const ny = dx / L;
  const c: P = [(b[0] + t[0]) / 2 + nx * bow, (b[1] + t[1]) / 2 + ny * bow];
  const n = 14;
  const upper: P[] = [];
  const lower: P[] = [];
  const spine: P[] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const x = (1 - s) * (1 - s) * b[0] + 2 * (1 - s) * s * c[0] + s * s * t[0];
    const y = (1 - s) * (1 - s) * b[1] + 2 * (1 - s) * s * c[1] + s * s * t[1];
    const tx = 2 * (1 - s) * (c[0] - b[0]) + 2 * s * (t[0] - c[0]);
    const ty = 2 * (1 - s) * (c[1] - b[1]) + 2 * s * (t[1] - c[1]);
    const tl = Math.hypot(tx, ty);
    const ox = -ty / tl;
    const oy = tx / tl;
    const w = (w0 / 2) * Math.pow(1 - s, 0.85) + 0.6;
    spine.push([x, y]);
    upper.push([x - ox * w, y - oy * w]);
    lower.push([x + ox * w, y + oy * w]);
  }
  const d = smoothPath([...upper, ...lower.reverse()], true, 0.45);
  return { d, spine, under: lower.reverse() };
}

function arm(b: P, t: P, w0: number, bow: number, o: { far?: boolean; suckers?: boolean; seed: number }): string {
  const a = armPath(b, t, w0, bow);
  const r = rng(o.seed);
  // dải sẫm ngang tay (tay mực nang vằn có khoang sáng tối)
  let bands = '';
  for (let i = 2; i < a.spine.length - 2; i += 2 + Math.round(r())) {
    const [x, y] = a.spine[i];
    const [x2, y2] = a.spine[i + 1];
    const ang = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
    bands += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="2.2" ry="${f1(w0 * 0.55 * (1 - i / a.spine.length) + 1)}" transform="rotate(${f1(ang)} ${f1(x)} ${f1(y)})"/>`;
  }
  let suck = '';
  if (o.suckers) {
    for (let i = 3; i < a.under.length - 2; i++) {
      const [x, y] = a.under[i];
      const [sx, sy] = a.spine[i];
      const px = x + (sx - x) * 0.3;
      const py = y + (sy - y) * 0.3;
      suck += `<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(Math.max(0.7, 1.7 * (1 - i / a.under.length)))}"/>`;
    }
  }
  const fill = o.far ? u.url('armFar') : u.url('arm');
  return (
    `<path d="${a.d}" fill="${fill}"/>` +
    `<g fill="${PURPLE_D}" opacity="${o.far ? 0.3 : 0.42}">${bands}</g>` +
    (suck ? `<g fill="${CREAM_L}" opacity="0.7" stroke="${PURPLE}" stroke-width="0.4" stroke-opacity="0.6">${suck}</g>` : '') +
    // nét sáng sống tay
    `<path d="${smoothPath(a.spine.slice(1, -3), false)}" fill="none" stroke="${CREAM_L}" stroke-opacity="${o.far ? 0.12 : 0.22}" stroke-width="1.2" transform="translate(0 -2)"/>` +
    outline(a.d, OUTLINE, 1.1, 0.5)
  );
}

/** Tua bắt mồi: cuống mảnh + chuỳ dẹt có giác hút. */
function tentacle(b: P, c: P, e: P, clubTip: P, o: { far?: boolean }): string {
  const stalk = `M${b[0]} ${b[1]}Q${c[0]} ${c[1]} ${e[0]} ${e[1]}`;
  const dx = clubTip[0] - e[0];
  const dy = clubTip[1] - e[1];
  const L = Math.hypot(dx, dy);
  const nx = -dy / L;
  const ny = dx / L;
  const m: P = [e[0] + dx * 0.45, e[1] + dy * 0.45];
  const club =
    `M${f1(e[0] + nx * 2)} ${f1(e[1] + ny * 2)}` +
    `Q${f1(m[0] + nx * 6.5)} ${f1(m[1] + ny * 6.5)} ${clubTip[0]} ${clubTip[1]}` +
    `Q${f1(m[0] - nx * 5)} ${f1(m[1] - ny * 5)} ${f1(e[0] - nx * 2)} ${f1(e[1] - ny * 2)}Z`;
  let suck = '';
  for (let i = 1; i < 6; i++) {
    const s = 0.12 + i * 0.13;
    suck += `<circle cx="${f1(e[0] + dx * s + nx * 1.5)}" cy="${f1(e[1] + dy * s + ny * 1.5)}" r="${f1(1.3 - i * 0.12)}"/>`;
  }
  const col = o.far ? shade(PURPLE, -0.15) : mix(PURPLE, BROWN, 0.5);
  return (
    `<path d="${stalk}" fill="none" stroke="${OUTLINE}" stroke-opacity="0.55" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="${stalk}" fill="none" stroke="${col}" stroke-width="3.6" stroke-linecap="round"/>` +
    `<path d="${stalk}" fill="none" stroke="${CREAM_L}" stroke-opacity="0.25" stroke-width="1" stroke-linecap="round" transform="translate(0 -0.8)"/>` +
    `<path d="${club}" fill="${col}" stroke="${OUTLINE}" stroke-opacity="0.6" stroke-width="0.9"/>` +
    `<g fill="${CREAM_L}" opacity="${o.far ? 0.45 : 0.75}">${suck}</g>`
  );
}

// ---------- Mây màu (đổi màu sóng chạy dọc thân) ----------
function cloudLayer(i: number): ArtLayer {
  let shapes = '';
  for (let k = 0; k < 4; k++) {
    const x = 96 + k * 96 + i * 32;
    if (x > 404) continue;
    const t = topY(x);
    shapes += `<ellipse cx="${x}" cy="${f1(t + 44)}" rx="24" ry="64" transform="rotate(-14 ${x} ${f1(t + 44)})"/>`;
  }
  return {
    name: `colorWave${i}`,
    role: 'pattern',
    bend: false,
    z: 'front',
    pivot: [230, 160],
    // pha tăng dần theo vị trí → vùng tối chạy từ đầu về đuôi
    anim: { type: 'alpha', amp: 1, speed: 0.55, phase: i * 2.094 },
    svg: `<g clip-path="${u.url('bodyClip')}" fill="${u.url('cloud')}">${shapes}</g>`,
  };
}

// ---------- Defs ----------
const defs = joinDefs(
  body,
  theEye,
  linear(u('headFill'), [
    [0, shade('#7a5560', -0.1)],
    [0.25, '#86606a'],
    [0.6, '#b99583'],
    [1, '#ecdcc4'],
  ]),
  `<clipPath id="${u('headClip')}"><path d="${HEAD}"/></clipPath>`,
  organicTexture(u('skin'), { freq: 0.07, octaves: 3, strength: 0.15, seed: 11 }),
  linear(
    u('stripe'),
    [
      [0, PURPLE_D, 0.95],
      [0.5, PURPLE, 0.85],
      [0.85, BROWN, 0.4],
      [1, BROWN, 0],
    ],
    { user: true, x1: 0, y1: 96, x2: 0, y2: 202 },
  ),
  linear(
    u('finTop'),
    [
      [0, '#fff6e8', 0.5],
      [0.6, '#f1e2c8', 0.62],
      [1, '#d9bfae', 0.75],
    ],
  ),
  linear(
    u('finBot'),
    [
      [0, '#e3c9b6', 0.78],
      [0.45, '#f1e2c8', 0.66],
      [1, '#fff6e8', 0.5],
    ],
  ),
  linear(u('arm'), [
    [0, '#6e4a58'],
    [0.5, '#9a7470'],
    [1, '#e2cdb3'],
  ]),
  linear(u('armFar'), [
    [0, '#4a2e3c'],
    [1, '#7a5a5c'],
  ]),
  radial(u('cloud'), [
    [0, '#2c1526', 0.55],
    [0.55, '#3b2133', 0.3],
    [1, '#3b2133', 0],
  ]),
);

// ---------- Lắp ráp ----------
const ARM_PIV: P = [500, 168];

const nearArms: { b: P; t: P; w: number; bow: number; suckers?: boolean; amp: number; ph: number }[] = [
  { b: [500, 138], t: [598, 174], w: 21, bow: -5, amp: 0.04, ph: 0 },
  { b: [508, 154], t: [612, 182], w: 23, bow: -3, amp: 0.035, ph: 0.9 },
  { b: [508, 172], t: [607, 190], w: 23, bow: 2, amp: 0.04, ph: 1.8, suckers: true },
  { b: [500, 190], t: [594, 199], w: 21, bow: 4, amp: 0.05, ph: 2.7, suckers: true },
];

const layers: ArtLayer[] = [
  // --- phía sau thân ---
  ...finLayers(-1, 6, 10),
  ...finLayers(1, 6, 17),
  {
    name: 'armsFar',
    role: 'arm',
    bend: false,
    z: 'back',
    pivot: ARM_PIV,
    anim: { type: 'rotate', amp: 0.035, speed: 0.7, phase: 2.2 },
    svg:
      arm([496, 146], [602, 170], 17, -6, { far: true, seed: 5 }) +
      arm([498, 186], [603, 196], 17, 3, { far: true, seed: 6 }),
  },
  {
    name: 'tentacleFar',
    role: 'tentacle',
    bend: false,
    z: 'back',
    pivot: [500, 186],
    anim: { type: 'rotate', amp: 0.05, speed: 0.8, phase: 1.1 },
    svg: tentacle([500, 186], [540, 206], [572, 208], [600, 205], { far: true }),
  },
  {
    name: 'tentacleNear',
    role: 'tentacle',
    bend: false,
    z: 'back',
    pivot: [500, 192],
    anim: { type: 'rotate', amp: 0.06, speed: 0.8, phase: 0.2 },
    svg: tentacle([500, 192], [534, 218], [564, 219], [592, 216], {}),
  },
  // --- lớp "uốn" (bendAmp 0 → đứng yên cùng thân) ---
  {
    name: 'finBase',
    role: 'detail',
    svg: finShape(FIN_X0, FIN_X1, -1, 6, false) + finShape(FIN_X0, FIN_X1, 1, 10, false),
  },
  { name: 'head', role: 'body', svg: headSvg },
  { name: 'eye', role: 'eye', svg: eyeSvg },
  { name: 'mantle', role: 'body', svg: mantleSvg },
  // --- phía trước ---
  cloudLayer(0),
  cloudLayer(1),
  cloudLayer(2),
  ...nearArms.map(
    (a, i): ArtLayer => ({
      name: `arm${i + 1}`,
      role: 'arm',
      bend: false,
      z: 'front',
      pivot: a.b,
      anim: { type: 'rotate', amp: a.amp, speed: 0.7, phase: a.ph },
      svg: arm(a.b, a.t, a.w, a.bow, { suckers: a.suckers, seed: 20 + i }),
    }),
  ),
];

const art: CreatureArt = {
  id: 'muc_nang',
  viewBox: [640, 320],
  lengthUnits: 576,
  spineY: 165,
  animation: 'cephalopod',
  cycleHz: 0.9,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers,
};

export default art;
