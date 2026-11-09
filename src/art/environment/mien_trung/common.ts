/**
 * Tiện ích dùng chung cho môi trường Biển miền Trung.
 * Phong cách: "tranh minh họa sinh học hiện đại" – vector mềm, gradient, rim light từ trên,
 * bóng ngả lam (nước hấp thụ đỏ), bão hòa thấp hơn sinh vật một chút.
 */
import { makeIds, mix, shade, rng, radial } from '../../style-bible';
import type { Ids } from '../../style-bible';

export type Pt = [number, number];

export const WATER_SHALLOW = '#3FC1D9';
export const WATER_DEEP = '#0F5C8C';
export const HAZE = '#bdf3ff';
/** nắng nhiệt đới hơi ấm */
export const SUN = '#fffbea';

/** làm tròn số cho chuỗi SVG gọn */
export const f = (n: number): string => (Math.round(n * 10) / 10).toString();

/** id có tiền tố vùng: mt_<prop>__<tên> */
export const ids = (id: string): Ids => makeIds('mt_' + id);

/** Bóng: tối hơn và ngả lam nước (đúng quang học dưới nước) */
export function dark(c: string, k: number): string {
  return mix(shade(c, -k), WATER_DEEP, k * 0.35);
}
/** Sáng: pha nắng ấm */
export function light(c: string, k: number): string {
  return mix(c, SUN, k);
}
/** Màu nét viền: sẫm cùng tông, không đen thuần */
export function ink(c: string): string {
  return mix(shade(c, -0.6), '#06283f', 0.3);
}
/** Giảm bão hòa (đẩy về xám cùng độ sáng) */
export function desat(c: string, k: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const l = Math.round(r * 0.3 + g * 0.59 + b * 0.11);
  const grey = '#' + [l, l, l].map((v) => v.toString(16).padStart(2, '0')).join('');
  return mix(c, grey, k);
}
/** Đẩy về màu nước xa (sương nước) */
export function haze(c: string, k: number, toward = WATER_SHALLOW): string {
  return mix(c, toward, k);
}

/** Bóng tiếp xúc mềm dưới chân vật thể (đặt trên cát) */
export function contactShadow(u: Ids, cx: number, cy: number, rx: number, ry: number, op = 0.34): { defs: string; svg: string } {
  const id = u('cshadow');
  return {
    defs: radial(id, [
      [0, '#0b3550', op],
      [0.6, '#0b3550', op * 0.45],
      [1, '#0b3550', 0],
    ]),
    svg: `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${id})"/>`,
  };
}

// ---------------------------------------------------------------------------
// Cây nhánh (san hô sừng hươu, quạt biển, rong đỏ…)
// ---------------------------------------------------------------------------

export interface Seg {
  a: Pt;
  b: Pt;
  w: number;
  tip: boolean;
  depth: number;
}

export interface TreeOpts {
  seed: number;
  /** số thế hệ phân nhánh */
  depth: number;
  len: number;
  lenDecay: number;
  w: number;
  wDecay: number;
  minW?: number;
  /** độ mở nhánh con (rad) */
  spread: number;
  kids?: [number, number];
  /** rung góc mỗi đoạn */
  wiggle?: number;
  /** kéo về hướng thẳng đứng */
  upPull?: number;
  /** số đoạn chia mỗi nhánh */
  segs?: number;
  /** giới hạn khung */
  box?: { x0: number; x1: number; y0: number };
  /** xác suất nhánh dừng sớm */
  stopP?: number;
  /** đường bao elip: nhánh chạm bao thì dừng (tạo tán tròn tự nhiên) */
  ellipse?: { cx: number; cy: number; rx: number; ry: number };
}

export function growTree(starts: { x: number; y: number; a: number; lenK?: number; wK?: number }[], o: TreeOpts): Seg[] {
  const r = rng(o.seed);
  const out: Seg[] = [];
  const n = o.segs ?? 3;
  const minW = o.minW ?? 0.8;
  const [kMin, kMax] = o.kids ?? [2, 2];
  const up = -Math.PI / 2;
  const br = (x: number, y: number, a: number, len: number, w: number, d: number) => {
    let px = x;
    let py = y;
    const w2 = Math.max(minW, w * o.wDecay);
    for (let i = 0; i < n; i++) {
      a += (r() - 0.5) * (o.wiggle ?? 0.3);
      a += (up - a) * (o.upPull ?? 0.05);
      let nx = px + (Math.cos(a) * len) / n;
      let ny = py + (Math.sin(a) * len) / n;
      if (o.box) {
        if (nx < o.box.x0 || nx > o.box.x1) {
          a = up + (up - a) * 0.3;
          nx = Math.max(o.box.x0, Math.min(o.box.x1, nx));
        }
        ny = Math.max(o.box.y0, ny);
      }
      if (o.ellipse) {
        const E = o.ellipse;
        const q = ((nx - E.cx) / E.rx) ** 2 + ((ny - E.cy) / E.ry) ** 2;
        if (q > 1) {
          if (out.length) out[out.length - 1].tip = true;
          return;
        }
      }
      const ww = w + ((w2 - w) * (i + 0.5)) / n;
      out.push({ a: [px, py], b: [nx, ny], w: ww, tip: false, depth: d });
      px = nx;
      py = ny;
    }
    const stop = d <= 0 || (d < o.depth - 1 && r() < (o.stopP ?? 0));
    if (stop) {
      out[out.length - 1].tip = true;
      return;
    }
    const k = kMin + Math.floor(r() * (kMax - kMin + 1));
    for (let j = 0; j < k; j++) {
      const t = k === 1 ? 0 : j / (k - 1) - 0.5;
      const aj = a + t * 2 * o.spread + (r() - 0.5) * o.spread * 0.5;
      br(px, py, aj, len * o.lenDecay * (0.8 + r() * 0.4), w2, d - 1);
    }
  };
  for (const s of starts) br(s.x, s.y, s.a, o.len * (s.lenK ?? 1), o.w * (s.wK ?? 1), o.depth);
  return out;
}

export interface TreeStyle {
  fill: string;
  outline?: string;
  outlineW?: number;
  outlineOp?: number;
  hi?: string;
  hiOp?: number;
  /** chấm polyp dọc nhánh */
  polyp?: string;
  polypOp?: number;
  polypGap?: number;
  tip?: string;
  tipScale?: number;
  opacity?: number;
}

/** Vẽ cây nhánh: gom đoạn theo độ dày → ít phần tử SVG. Thứ tự: viền → thân → sáng → polyp → ngọn. */
export function renderTree(segs: Seg[], s: TreeStyle): string {
  const buckets = new Map<number, Seg[]>();
  for (const sg of segs) {
    const k = Math.max(0.5, Math.round(sg.w * 2) / 2);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(sg);
  }
  const keys = [...buckets.keys()].sort((a, b) => b - a);
  const line = (sg: Seg) => `M${f(sg.a[0])} ${f(sg.a[1])}L${f(sg.b[0])} ${f(sg.b[1])}`;
  const P = (d: string, stroke: string, w: number, extra = '') =>
    `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
  let ol = '';
  let fl = '';
  let hi = '';
  let po = '';
  let tp = '';
  for (const w of keys) {
    const list = buckets.get(w)!;
    const d = list.map(line).join('');
    if (s.outline) ol += P(d, s.outline, w + (s.outlineW ?? 1.6), ` stroke-opacity="${s.outlineOp ?? 0.6}"`);
    fl += P(d, s.fill, w);
    if (s.hi && w >= 2) hi += P(d, s.hi, w * 0.32, ` stroke-opacity="${s.hiOp ?? 0.5}" transform="translate(${f(-w * 0.16)} ${f(-w * 0.2)})"`);
    if (s.polyp && w >= 2.5) {
      const g = s.polypGap ?? Math.max(3, w * 0.9);
      po += P(d, s.polyp, Math.max(1, w * 0.36), ` stroke-opacity="${s.polypOp ?? 0.45}" stroke-dasharray="0.1 ${f(g)}"`);
    }
    if (s.tip) {
      const td = list
        .filter((sg) => sg.tip)
        .map((sg) => `M${f(sg.b[0])} ${f(sg.b[1])}h0.01`)
        .join('');
      if (td) tp += P(td, s.tip, w * (s.tipScale ?? 1.05));
    }
  }
  return `<g${s.opacity !== undefined ? ` opacity="${s.opacity}"` : ''}>${ol}${fl}${hi}${po}${tp}</g>`;
}

/** Nhân bản các hình gần mép để dải nền nối liền trái-phải (tile). */
export function wrapX(W: number, x: number, hw: number, draw: (x: number) => string): string {
  let s = draw(x);
  if (x - hw < 0) s += draw(x + W);
  if (x + hw > W) s += draw(x - W);
  return s;
}

/** Hồ sơ đường chân trời tuần hoàn (y(0) = y(W)) – tổng các sóng sin bội nguyên. */
export function periodicProfile(W: number, base: number, terms: [amp: number, k: number, phase: number][], step = 16): Pt[] {
  const pts: Pt[] = [];
  for (let x = 0; x <= W; x += step) {
    let y = base;
    for (const [a, k, p] of terms) y += a * Math.sin((x / W) * Math.PI * 2 * k + p);
    pts.push([x, y]);
  }
  return pts;
}

/** Hình kín từ hồ sơ trên cùng tới đáy dải */
export function profileShape(pts: Pt[], bottom: number): string {
  let d = `M${f(pts[0][0])} ${bottom}L${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    d += `Q${f(x0)} ${f(y0)} ${f((x0 + x1) / 2)} ${f((y0 + y1) / 2)}`;
  }
  const last = pts[pts.length - 1];
  d += `L${f(last[0])} ${f(last[1])}L${f(last[0])} ${bottom}Z`;
  return d;
}

/** Đường hồ sơ (để vẽ rim light) */
export function profileLine(pts: Pt[]): string {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    d += `Q${f(x0)} ${f(y0)} ${f((x0 + x1) / 2)} ${f((y0 + y1) / 2)}`;
  }
  return d;
}
