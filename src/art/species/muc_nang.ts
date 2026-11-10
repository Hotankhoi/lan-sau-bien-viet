/**
 * Mực nang vằn – Sepia pharaonis (Pharaoh cuttlefish)
 * Đặc điểm nhận dạng (nhìn ngang): áo bầu dục dày (dài:cao ≈ 2,2:1), chóp sau tròn hơi nhọn;
 * vây là MỘT dải mỏng màu kem chạy dọc sườn (≈68% chiều cao thân tính từ lưng), gợn sóng liên tục,
 * gốc vây có đường ánh tím; sọc vằn ngang nâu tím xen kem trên lưng; mắt lớn đồng tử chữ W, mí trên
 * che ~1/3; các tay chụm thành một khối nón liền + 2 tua bắt mồi thò nhẹ.
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
// Áo dài ~300, cao ~137 (≈2,2:1) – bầu dục dày kiểu mực nang, không thuôn dài như mực ống
const TOP_PTS: P[] = [[44, 152], [62, 128], [96, 108], [146, 94], [206, 88], [266, 89], [312, 95], [340, 104]];
const BOT_PTS: P[] = [[44, 186], [66, 204], [104, 216], [156, 223], [214, 225], [272, 222], [316, 215], [340, 208]];
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

// Vây: một dải dọc sườn (nhìn ngang), gốc vây nằm ở ~68% chiều cao thân tính từ lưng
const FIN_X0 = 50;
const FIN_X1 = 339;
const FIN_FRAC = 0.68;
const FIN_H = 23;
const finBaseY = (x: number) => topY(x) + (botY(x) - topY(x)) * FIN_FRAC;
/** Độ rộng vây thu nhỏ (bo tròn) ở hai đầu. */
function finTaper(x: number): number {
  const a = Math.min(1, (x - FIN_X0) / 46);
  const b = Math.min(1, (FIN_X1 - x) / 32);
  return Math.sqrt(Math.max(0, Math.min(a, b)));
}

// Mép trước của áo hơi lồi ra trùm lên gáy
const MANTLE =
  poly(TOP, false).replace(/Z$/, '') +
  `C354 122 354 190 340 208` +
  'L' +
  [...BOT].reverse().map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L') +
  // chóp sau tròn hơi nhọn
  'C32 180 30 164 44 152Z';

// Đầu: to gần bằng mép trước áo, gồ mắt, thu dần về vành tay
const HEAD = smoothPath(
  [
    [324, 108], [350, 102], [378, 100], [406, 105], [430, 116], [446, 130], [454, 152],
    [452, 178], [440, 196], [416, 205], [386, 209], [352, 209], [326, 206],
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
  let x = 60;
  while (x < 338) {
    const t = topY(x);
    const h = botY(x) - t;
    const edge = Math.max(0.1, Math.min(1, (x - 44) / 50, (348 - x) / 36));
    const depth = h * (0.45 + r() * 0.18) * (0.6 + 0.4 * edge);
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
    x += 12 + r() * 7 + w * 0.7;
  }
  return (
    `<g fill="${u.url('stripe')}">${dark}</g>` +
    `<g fill="none" stroke="${CREAM_L}" stroke-opacity="0.24" stroke-width="2.6" stroke-linecap="round">${light}</g>`
  );
}

/** Đường ánh tím ở gốc vây (dọc sườn) + bóng vây đổ nhẹ xuống bụng – đặc trưng rõ trên ảnh tham khảo. */
function iridLines(): string {
  const base: P[] = [];
  for (let x = FIN_X0 + 3; x <= FIN_X1 - 1; x += 6) base.push([x, finBaseY(x)]);
  const shadow = base.map(([x, y]) => [x, y + FIN_H * 0.95 * finTaper(x)] as P);
  const line = (pts: P[], w: number, op: number, c: string) =>
    `<path d="${smoothPath(pts, false)}" fill="none" stroke="${c}" stroke-width="${w}" stroke-opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return (
    line(shadow, 8, 0.1, PURPLE) +
    line(base, 5.5, 0.22, IRID) + line(base, 2, 0.9, IRID) + line(base, 0.7, 0.6, '#ffe8ff')
  );
}

const mantleSvg =
  body.base +
  `<g clip-path="${u.url('bodyClip')}">` +
  `<g filter="${u.url('skin')}">` +
  `<path d="${MANTLE}" fill="${u.url('bodyFill')}"/>` +
  zebra() +
  // vệt kem sáng dọc hông (ảnh tham khảo: hông sáng hơn lưng)
  `<path d="M56 174C130 158 250 158 342 170C250 186 130 186 56 174Z" fill="${CREAM}" opacity="0.26"/>` +
  `</g>` +
  scatterSpots(91, { x: 54, y: 90, w: 290, h: 88 }, { count: 42, rMin: 0.7, rMax: 2.1, color: CREAM_L, opacity: 0.55, minGap: 9 }) +
  scatterSpots(17, { x: 54, y: 92, w: 290, h: 72 }, { count: 28, rMin: 0.6, rMax: 1.4, color: PURPLE_D, opacity: 0.5, minGap: 10 }) +
  iridLines() +
  `</g>` +
  body.overlay +
  // mép áo trước (khe áo) – nét mảnh, sáng phía trước
  `<path d="M340 107C354 124 354 190 340 210" fill="none" stroke="${OUTLINE}" stroke-opacity="0.5" stroke-width="1.6"/>` +
  `<path d="M344 118C351 134 351 176 345 196" fill="none" stroke="${CREAM_L}" stroke-opacity="0.35" stroke-width="1.2"/>`;

// ---------- Đầu ----------
const EX = 388;
const EY = 141;
const ER = 17;
const theEye = eye(u, 'eye', {
  cx: EX,
  cy: EY,
  r: ER,
  iris: ['#b8974a', '#4c3519'],
  pupil: 'w',
  socket: '#4a2b3c',
  pupilColor: '#0b0a0e',
  look: [0.1, 0.6],
});

const headSvg =
  `<path d="${HEAD}" fill="${u.url('headFill')}"/>` +
  `<g clip-path="${u.url('headClip')}">` +
  `<g filter="${u.url('skin')}"><path d="${HEAD}" fill="${u.url('headFill')}"/>` +
  // sọc vằn kéo lên đỉnh đầu
  `<g fill="${u.url('stripe')}" opacity="0.85">` +
  `<path d="M330 99L342 97Q336 119 332 136L324 136Z"/>` +
  `<path d="M410 105L422 111Q416 124 410 134L404 130Z"/>` +
  `<path d="M430 116L441 125Q435 138 429 144L423 140Z"/>` +
  `</g>` +
  // mảng loang (mực nang đổi màu loang lổ quanh mắt)
  `<g fill="${PURPLE}" opacity="0.4"><ellipse cx="358" cy="126" rx="12" ry="7"/><ellipse cx="424" cy="160" rx="10" ry="7"/><ellipse cx="402" cy="182" rx="11" ry="6"/><ellipse cx="350" cy="172" rx="8" ry="10"/></g>` +
  // má/hàm kem sáng
  `<path d="M330 186Q380 196 446 178L446 204Q380 222 330 212Z" fill="${CREAM}" opacity="0.5"/>` +
  `</g>` +
  scatterSpots(33, { x: 328, y: 104, w: 120, h: 92 }, { count: 16, rMin: 0.6, rMax: 1.6, color: CREAM_L, opacity: 0.55, minGap: 8 }) +
  `<path d="${HEAD}" fill="${u.url('bodyVol')}"/>` +
  `</g>` +
  outline(HEAD, OUTLINE) +
  rimLight(HEAD, u.url('rim')) +
  // ống phễu (siphon) dưới đầu
  `<path d="M336 200C346 205 358 207 368 205C366 210 358 213 348 212C342 211 338 206 336 200Z" fill="${mix(PURPLE, BROWN, 0.55)}" stroke="${OUTLINE}" stroke-opacity="0.4" stroke-width="0.9"/>` +
  // điểm ánh xanh nhỏ dưới mắt (thấy trên ảnh)
  `<ellipse cx="368" cy="180" rx="2.4" ry="3.6" fill="#7fd6d0" opacity="0.5"/>`;

// Mí trên che ~1/3 mắt (mép mí võng nhẹ ở giữa như ảnh tham khảo)
const LID =
  `M${f1(EX - ER * 1.22)} ${f1(EY - ER * 0.18)}` +
  `C${f1(EX - ER * 1.1)} ${f1(EY - ER * 1.5)} ${f1(EX + ER * 1.1)} ${f1(EY - ER * 1.5)} ${f1(EX + ER * 1.22)} ${f1(EY - ER * 0.18)}`;
const LID_EDGE = `Q${f1(EX)} ${f1(EY - ER * 0.66)} ${f1(EX - ER * 1.22)} ${f1(EY - ER * 0.18)}`;
const LID_EDGE_OPEN = `M${f1(EX + ER * 1.22)} ${f1(EY - ER * 0.18)}${LID_EDGE}`;

const eyeSvg =
  theEye.svg +
  // bóng mí đổ lên mắt
  `<path d="${LID_EDGE_OPEN}" fill="none" stroke="#1a0f16" stroke-width="2.6" stroke-opacity="0.24" stroke-linecap="round" transform="translate(0 1.5)"/>` +
  `<path d="${LID}${LID_EDGE}Z" fill="${u.url('lid')}"/>` +
  // chấm phản chiếu ngay dưới mí (chấm chuẩn của eye() bị mí che)
  `<circle cx="${f1(EX - ER * 0.42)}" cy="${f1(EY - ER * 0.12)}" r="${f1(ER * 0.13)}" fill="#ffffff" opacity="0.85"/>` +
  // mép mí nhạt màu – nét "lông mày" như ảnh tham khảo
  `<path d="${LID_EDGE_OPEN}" fill="none" stroke="${CREAM_L}" stroke-width="1.5" stroke-opacity="0.5" stroke-linecap="round"/>` +
  `<path d="${LID}" fill="none" stroke="${CREAM_L}" stroke-width="1.1" stroke-opacity="0.2" stroke-linecap="round"/>` +
  `<path d="M${EX - 20} ${EY + 11}Q${EX} ${EY + 27} ${EX + 22} ${EY + 9}" fill="none" stroke="${CREAM_L}" stroke-width="1.4" stroke-opacity="0.3" stroke-linecap="round"/>`;

// ---------- Vây dọc sườn (một dải, gợn sóng) ----------

function finPoints(x0: number, x1: number, H: number, lobe: boolean): { outer: P[]; inner: P[] } {
  const outer: P[] = [];
  const inner: P[] = [];
  const steps = Math.max(6, Math.round((x1 - x0) / 4));
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const s = i / steps;
    const y = finBaseY(x);
    // thuỳ: thấp ở hai mép đoạn, cao ở giữa → chỗ nối giữa các đoạn thành "đáy sóng"
    const prof = lobe ? 0.62 + 0.38 * Math.sin(Math.PI * s) : 1;
    const ripple = 1 + 0.07 * Math.sin(x * 0.23);
    const h = H * prof * ripple * finTaper(x);
    // vây rủ xuống, hơi ngả về sau
    outer.push([x - h * 0.14, y + h]);
    inner.push([x, y + 0.8]);
  }
  return { outer, inner };
}

function finShape(x0: number, x1: number, H: number, lobe: boolean): string {
  const { outer, inner } = finPoints(x0, x1, H, lobe);
  const d = smoothPath([...outer, ...[...inner].reverse()], true, 0.4);
  // vân mảnh từ gốc vây ra mép
  let striae = '';
  const { outer: o2 } = finPoints(x0, x1, H * 0.92, lobe);
  for (let i = 1; i < o2.length - 1; i++) {
    striae += `M${f1(inner[i][0])} ${f1(inner[i][1])}L${f1(o2[i][0])} ${f1(o2[i][1])}`;
  }
  return (
    `<path d="${d}" fill="${u.url('finBot')}"/>` +
    `<path d="${striae}" fill="none" stroke="${CREAM_L}" stroke-opacity="0.32" stroke-width="0.6"/>` +
    `<path d="${smoothPath(outer, false, 0.4)}" fill="none" stroke="${CREAM_L}" stroke-opacity="${lobe ? 0.5 : 0.6}" stroke-width="1" stroke-linecap="round"/>`
  );
}

function finLayers(n: number, H: number): ArtLayer[] {
  const layers: ArtLayer[] = [];
  const seg = (FIN_X1 - FIN_X0) / n;
  for (let i = 0; i < n; i++) {
    const x0 = FIN_X0 + i * seg;
    const x1 = FIN_X0 + (i + 1) * seg;
    const xm = FIN_X0 + (i + 0.5) * seg;
    layers.push({
      name: `finBot${i}`,
      role: 'fin',
      bend: false,
      z: 'front',
      pivot: [Math.round(xm), Math.round(finBaseY(xm))],
      // sóng chạy từ trước ra sau: thuỳ phía trước lệch pha sớm hơn
      anim: { type: 'scaleY', amp: 0.3, speed: 1.7, phase: (n - 1 - i) * -1.15 },
      svg: finShape(x0, x1, H, true),
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
    const w = (w0 / 2) * Math.pow(Math.max(0, 1 - s), 0.75) + 0.6;
    spine.push([x, y]);
    upper.push([x - ox * w, y - oy * w]);
    lower.push([x + ox * w, y + oy * w]);
  }
  const d = smoothPath([...upper, ...lower.reverse()], true, 0.45);
  return { d, spine, under: lower.reverse() };
}

function arm(b: P, t: P, w0: number, bow: number, o: { far?: boolean; seed: number }): string {
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
  const fill = o.far ? u.url('armFar') : u.url('arm');
  return (
    `<path d="${a.d}" fill="${fill}"/>` +
    `<g fill="${PURPLE_D}" opacity="${o.far ? 0.2 : 0.15}">${bands}</g>` +
    // nét sáng sống tay
    `<path d="${smoothPath(a.spine.slice(1, -3), false)}" fill="none" stroke="${CREAM_L}" stroke-opacity="${o.far ? 0.12 : 0.22}" stroke-width="1.2" transform="translate(0 -2)"/>` +
    // viền mảnh, mờ → các tay đọc thành một khối
    outline(a.d, OUTLINE, 1, 0.38)
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
    const x = 76 + k * 81 + i * 27;
    if (x > 336) continue;
    const t = topY(x);
    shapes += `<ellipse cx="${x}" cy="${f1(t + 46)}" rx="22" ry="66" transform="rotate(-14 ${x} ${f1(t + 46)})"/>`;
  }
  return {
    name: `colorWave${i}`,
    role: 'pattern',
    bend: false,
    z: 'front',
    pivot: [192, 156],
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
    { user: true, x1: 0, y1: 84, x2: 0, y2: 188 },
  ),
  linear(u('lid'), [
    [0, '#6d4b57'],
    [1, '#a27e78'],
  ]),
  // tay hiện dần từ trong đầu ra → không lộ mép gốc tay
  linear(u('armFadeG'), [[0, '#ffffff', 0], [1, '#ffffff', 1]], { user: true, x1: 434, y1: 0, x2: 462, y2: 0 }),
  `<mask id="${u('armFade')}" maskUnits="userSpaceOnUse" x="400" y="80" width="188" height="170"><rect x="400" y="80" width="188" height="170" fill="${u.url('armFadeG')}"/></mask>`,
  linear(u('bundle'), [
    [0, '#553643'],
    [0.55, '#7a585c'],
    [1, '#b39484'],
  ]),
  linear(
    u('finBot'),
    [
      [0, '#e3c9b6', 0.72],
      [0.45, '#f1e2c8', 0.58],
      [1, '#fff6e8', 0.42],
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
const ARM_PIV: P = [440, 162];

// Khối "bó tay" liền: nón nhọn nối từ đầu ra, hơi chúc xuống – các tay vẽ đè lên trên
const BUNDLE = smoothPath(
  [
    [426, 120], [452, 127], [482, 141], [512, 159], [540, 176], [553, 185.5],
    [540, 195], [510, 200], [478, 203], [450, 204], [428, 201],
  ],
  true,
  0.45,
);
const bundleSvg = `<path d="${BUNDLE}" fill="${u.url('bundle')}"/>` + outline(BUNDLE, OUTLINE, 1.2, 0.55);

// Thứ tự vẽ: tay lưng, tay bụng (ở mép) trước; hai tay bên (gần người xem) đè lên sau
const nearArms: { name: string; b: P; t: P; w: number; bow: number; amp: number; ph: number }[] = [
  { name: 'arm1', b: [432, 139], t: [541, 178], w: 27, bow: -8, amp: 0.03, ph: 0 },
  { name: 'arm4', b: [433, 185], t: [538, 196], w: 27, bow: 5, amp: 0.035, ph: 2.7 },
  { name: 'arm2', b: [440, 151], t: [552, 184], w: 31, bow: -4, amp: 0.025, ph: 0.9 },
  { name: 'arm3', b: [440, 170], t: [550, 189], w: 31, bow: 2, amp: 0.03, ph: 1.8 },
];

const layers: ArtLayer[] = [
  // --- phía sau thân ---
  {
    name: 'armsFar',
    role: 'arm',
    bend: false,
    z: 'back',
    pivot: ARM_PIV,
    anim: { type: 'rotate', amp: 0.03, speed: 0.7, phase: 2.2 },
    svg:
      arm([436, 131], [536, 170], 20, -9, { far: true, seed: 5 }) +
      arm([440, 190], [541, 201], 18, 5, { far: true, seed: 6 }),
  },
  {
    name: 'tentacleFar',
    role: 'tentacle',
    bend: false,
    z: 'back',
    pivot: [470, 196],
    anim: { type: 'rotate', amp: 0.04, speed: 0.8, phase: 1.1 },
    svg: tentacle([470, 196], [506, 212], [530, 211], [553, 206], { far: true }),
  },
  {
    name: 'tentacleNear',
    role: 'tentacle',
    bend: false,
    z: 'back',
    pivot: [462, 198],
    anim: { type: 'rotate', amp: 0.05, speed: 0.8, phase: 0.2 },
    svg: tentacle([462, 198], [494, 219], [518, 219], [542, 215], {}),
  },
  // --- lớp "uốn" (bendAmp 0 → đứng yên cùng thân) ---
  { name: 'armBundle', role: 'detail', svg: bundleSvg },
  { name: 'head', role: 'body', svg: headSvg },
  { name: 'eye', role: 'eye', svg: eyeSvg },
  { name: 'mantle', role: 'body', svg: mantleSvg },
  // nền vây đứng yên (thấp hơn các thuỳ) → thuỳ co giãn không bao giờ hở
  { name: 'finBase', role: 'detail', svg: `<g opacity="0.85">${finShape(FIN_X0, FIN_X1, FIN_H * 0.6, false)}</g>` },
  // --- phía trước ---
  cloudLayer(0),
  cloudLayer(1),
  cloudLayer(2),
  ...finLayers(5, FIN_H),
  ...nearArms.map(
    (a, i): ArtLayer => ({
      name: a.name,
      role: 'arm',
      bend: false,
      z: 'front',
      pivot: a.b,
      anim: { type: 'rotate', amp: a.amp, speed: 0.7, phase: a.ph },
      svg: `<g mask="${u.url('armFade')}">${arm(a.b, a.t, a.w, a.bow, { seed: 20 + i })}</g>`,
    }),
  ),
];

const art: CreatureArt = {
  id: 'muc_nang',
  viewBox: [588, 308],
  lengthUnits: 520,
  spineY: 156,
  animation: 'cephalopod',
  cycleHz: 0.9,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers,
};

export default art;
