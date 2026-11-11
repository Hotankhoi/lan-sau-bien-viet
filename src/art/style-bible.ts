/**
 * STYLE BIBLE – "Tranh minh họa sinh học hiện đại"
 * (chỉ agent điều phối được sửa file này; agent khác đề xuất qua báo cáo)
 *
 * Nguyên tắc chung cho mọi loài:
 *  1. Thân: gradient ĐỔ BÓNG NGƯỢC (lưng đậm → bụng sáng) – dùng `counterShade`.
 *  2. Hoa văn: path/pattern riêng, CẮT theo thân bằng clipPath (`clip`), khớp đặc điểm thật.
 *  3. Vảy: `scalePattern` opacity 0.08–0.15 phủ lên thân (loài có vảy).
 *  4. Vây: bán trong suốt 0.5–0.8 + TIA VÂY mảnh (`finRays`).
 *  5. Mắt: `eye()` – tròng gradient, đồng tử, chấm phản chiếu. Mắt là linh hồn.
 *  6. Rim light: `rimLight()` – nét sáng mảnh ở mép lưng (nắng từ trên).
 *  7. Nét viền: màu sẫm cùng tông thân (không dùng đen thuần), dày `STROKE.outline`.
 *  8. Chiều sáng: nguồn sáng từ phía trên, hơi lệch về phía đầu.
 * Kích thước: viewBox cá tối thiểu 512×256. Vẽ đầu quay sang PHẢI.
 */

// ---------- ID ----------

/** Tạo id duy nhất theo loài: const u = makeIds('ca_mao_tien'); u('body') → 'ca_mao_tien__body'; u.url('body') → 'url(#ca_mao_tien__body)' */
export function makeIds(prefix: string) {
  const fn = (name: string) => `${prefix}__${name}`;
  fn.url = (name: string) => `url(#${prefix}__${name})`;
  fn.ref = (name: string) => `#${prefix}__${name}`;
  return fn;
}
export type Ids = ReturnType<typeof makeIds>;

// ---------- Nét & kích thước chuẩn (đơn vị viewBox, cho viewBox ~512 rộng) ----------

export const STROKE = {
  /** viền ngoài thân */
  outline: 1.8,
  outlineOpacity: 0.55,
  /** chi tiết (đường mang, vạch) */
  detail: 1.0,
  /** tia vây */
  ray: 0.9,
  rayOpacity: 0.45,
  /** rim light */
  rim: 2.2,
};

// ---------- Màu ----------

/** Bảng màu nước theo vùng (bảng 6.3) – [nông, sâu] */
export const REGION_WATER: Record<string, { shallow: string; deep: string; abyss?: string; haze: string }> = {
  bac_bo: { shallow: '#3E8E7E', deep: '#1F4E4A', haze: '#9ccfbf' },
  mien_trung: { shallow: '#3FC1D9', deep: '#0F5C8C', haze: '#bdf3ff' },
  mien_nam: { shallow: '#7CC6A4', deep: '#1E6B6B', haze: '#e9f5c8' },
  khoi_xa: { shallow: '#1E6FD9', deep: '#031A3D', abyss: '#01060f', haze: '#8fc1ff' },
};

/** Màu giao diện */
export const UI = {
  teal: '#4FE3D3',
  coral: '#FFC75F',
  danger: '#FF6B6B',
  panel: 'rgba(6, 28, 48, 0.62)',
  ink: '#EAF6FF',
};

export const RARITY_COLORS: Record<string, string> = {
  thuong_gap: '#C9D3DC',
  it_gap: '#6BE28B',
  hiem: '#52B6FF',
  huyen_thoai: '#FFC94A',
};

/** Hex → [r,g,b] */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(r: number, g: number, b: number): string {
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
/** Trộn 2 màu, t=0 → a, t=1 → b */
export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
/** amount > 0 sáng hơn, < 0 tối hơn (-1..1) */
export function shade(hex: string, amount: number): string {
  return amount >= 0 ? mix(hex, '#ffffff', amount) : mix(hex, '#000000', -amount);
}

// ---------- Ngẫu nhiên tất định (để rải đốm, vảy... giống nhau mỗi lần) ----------

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

// ---------- Gradient ----------

export type Stop = [offset: number, color: string, opacity?: number];

function stopsSvg(stops: Stop[]): string {
  return stops
    .map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op !== undefined ? ` stop-opacity="${op}"` : ''}/>`)
    .join('');
}

export function linear(
  id: string,
  stops: Stop[],
  o: { x1?: number; y1?: number; x2?: number; y2?: number; user?: boolean; spread?: 'pad' | 'repeat' | 'reflect'; transform?: string } = {},
): string {
  return `<linearGradient id="${id}" x1="${o.x1 ?? 0}" y1="${o.y1 ?? 0}" x2="${o.x2 ?? 0}" y2="${o.y2 ?? 1}"${o.user ? ' gradientUnits="userSpaceOnUse"' : ''}${o.spread ? ` spreadMethod="${o.spread}"` : ''}${o.transform ? ` gradientTransform="${o.transform}"` : ''}>${stopsSvg(stops)}</linearGradient>`;
}

export function radial(
  id: string,
  stops: Stop[],
  o: { cx?: number; cy?: number; r?: number; fx?: number; fy?: number; user?: boolean; spread?: 'pad' | 'repeat' | 'reflect'; transform?: string } = {},
): string {
  return `<radialGradient id="${id}" cx="${o.cx ?? 0.5}" cy="${o.cy ?? 0.5}" r="${o.r ?? 0.5}"${o.fx !== undefined ? ` fx="${o.fx}"` : ''}${o.fy !== undefined ? ` fy="${o.fy}"` : ''}${o.user ? ' gradientUnits="userSpaceOnUse"' : ''}${o.spread ? ` spreadMethod="${o.spread}"` : ''}${o.transform ? ` gradientTransform="${o.transform}"` : ''}>${stopsSvg(stops)}</radialGradient>`;
}

/**
 * Gradient ĐỔ BÓNG NGƯỢC chuẩn: lưng đậm → hông → bụng sáng (dọc theo bbox của hình).
 * `belly` ở 0.85–1.0 để phần bụng sáng rõ.
 */
export function counterShade(id: string, c: { dorsal: string; flank: string; belly: string; flankAt?: number }): string {
  const f = c.flankAt ?? 0.5;
  return linear(id, [
    [0, shade(c.dorsal, -0.12)],
    [0.18, c.dorsal],
    [f, c.flank],
    [Math.min(0.92, f + 0.3), mix(c.flank, c.belly, 0.75)],
    [1, c.belly],
  ]);
}

/** Bóng khối mềm phủ lên thân (sáng ở vai trên-trước, tối dần về bụng-sau). Dùng như lớp overlay opacity thấp. */
export function volumeShade(id: string, light = '#ffffff', dark = '#000000'): string {
  return radial(
    id,
    [
      [0, light, 0.35],
      [0.45, light, 0.0],
      [0.8, dark, 0.0],
      [1, dark, 0.28],
    ],
    { cx: 0.62, cy: 0.3, r: 0.75 },
  );
}

/** Gradient nét rim light: trắng ở mép trên, tắt dần xuống dưới (theo bbox của path). */
export function rimGradient(id: string, color = '#ffffff', opacity = 0.9): string {
  return linear(id, [
    [0, color, opacity],
    [0.22, color, opacity * 0.35],
    [0.4, color, 0],
  ]);
}

// ---------- Pattern ----------

/**
 * Vảy cá: các cung tròn xếp so le. size = đường kính vảy (đơn vị viewBox).
 * Dùng: <path d={body} fill={u.url('scales')} opacity="1"/> (opacity đã nằm trong pattern)
 */
export function scalePattern(id: string, o: { size?: number; color?: string; opacity?: number; stroke?: number } = {}): string {
  const s = o.size ?? 9;
  const c = o.color ?? '#ffffff';
  const op = o.opacity ?? 0.12;
  const sw = o.stroke ?? 0.7;
  const h = s * 0.8;
  const arc = (x: number, y: number) => `M${x - s / 2} ${y} A ${s / 2} ${s / 2} 0 0 0 ${x + s / 2} ${y}`;
  // vảy nhìn từ bên: cung mở về phía đuôi (bên trái)
  return `<pattern id="${id}" width="${s}" height="${h * 2}" patternUnits="userSpaceOnUse" patternTransform="rotate(90)"><g fill="none" stroke="${c}" stroke-width="${sw}" stroke-opacity="${op}"><path d="${arc(s / 2, 0)}${arc(0, h)}${arc(s, h)}${arc(s / 2, h * 2)}"/></g></pattern>`;
}

/** Pattern chấm tròn đều (đốm). */
export function dotPattern(id: string, o: { gap: number; r: number; color: string; opacity?: number; offset?: boolean }): string {
  const g = o.gap;
  const op = o.opacity ?? 1;
  const dots = o.offset !== false
    ? `<circle cx="${g / 4}" cy="${g / 4}" r="${o.r}"/><circle cx="${(3 * g) / 4}" cy="${(3 * g) / 4}" r="${o.r}"/>`
    : `<circle cx="${g / 2}" cy="${g / 2}" r="${o.r}"/>`;
  return `<pattern id="${id}" width="${g}" height="${g}" patternUnits="userSpaceOnUse"><g fill="${o.color}" fill-opacity="${op}">${dots}</g></pattern>`;
}

/** Lưới mảnh (sá sùng, vảy lưới...) */
export function gridPattern(id: string, o: { size: number; color: string; opacity?: number; width?: number; angle?: number }): string {
  const s = o.size;
  return `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse"${o.angle ? ` patternTransform="rotate(${o.angle})"` : ''}><path d="M0 0H${s}M0 0V${s}" stroke="${o.color}" stroke-opacity="${o.opacity ?? 0.2}" stroke-width="${o.width ?? 0.6}" fill="none"/></pattern>`;
}

// ---------- Filter ----------

export function blurFilter(id: string, std: number): string {
  return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${std}"/></filter>`;
}

/** Hào quang phát sáng (phát quang sinh học, mồi câu...) */
export function glowFilter(id: string, std = 4, strength = 1.6): string {
  return `<filter id="${id}" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur in="SourceGraphic" stdDeviation="${std}" result="b"/><feComponentTransfer in="b" result="b2"><feFuncA type="linear" slope="${strength}"/></feComponentTransfer><feMerge><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
}

/**
 * Vân hữu cơ (da sần, đá, san hô): nhiễu feTurbulence pha màu vào hình.
 * Áp: <g filter={u.url('tex')}>...</g>. Nặng hơn gradient – dùng tiết kiệm.
 */
export function organicTexture(id: string, o: { freq?: number; octaves?: number; strength?: number; seed?: number } = {}): string {
  const k = Math.max(0, Math.min(1, o.strength ?? 0.3));
  return (
    `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${o.freq ?? 0.06}" numOctaves="${o.octaves ?? 3}" seed="${o.seed ?? 3}" result="n"/>` +
    `<feColorMatrix in="n" type="saturate" values="0" result="g0"/>` +
    `<feComponentTransfer in="g0" result="g"><feFuncR type="linear" slope="1.6" intercept="-0.1"/><feFuncG type="linear" slope="1.6" intercept="-0.1"/><feFuncB type="linear" slope="1.6" intercept="-0.1"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer>` +
    `<feBlend in="SourceGraphic" in2="g" mode="multiply" result="m"/>` +
    `<feComposite in="m" in2="SourceGraphic" operator="arithmetic" k1="0" k2="${k}" k3="${1 - k}" k4="0" result="mx"/>` +
    `<feComposite in="mx" in2="SourceGraphic" operator="in"/></filter>`
  );
}

/** clipPath từ một path */
export function clip(id: string, d: string): string {
  return `<clipPath id="${id}"><path d="${d}"/></clipPath>`;
}

// ---------- Thành phần vẽ ----------

/**
 * Mắt chuẩn. Trả về { defs, svg }.
 * pupil: 'round' (cá), 'w' (mực nang), 'slit' (ngang – bạch tuộc), 'vslit' (dọc – cá mập, cá đuối), 'small'.
 */
export function eye(
  u: Ids,
  name: string,
  o: {
    cx: number;
    cy: number;
    r: number;
    iris: [inner: string, outer: string];
    pupil?: 'round' | 'w' | 'slit' | 'vslit' | 'small';
    socket?: string; // màu viền da quanh mắt
    pupilColor?: string;
    look?: [number, number]; // lệch đồng tử -1..1
  },
): { defs: string; svg: string } {
  const { cx, cy, r } = o;
  const gid = u(`${name}_iris`);
  const shid = u(`${name}_shine`);
  const defs =
    radial(gid, [
      [0, shade(o.iris[0], 0.25)],
      [0.45, o.iris[0]],
      [0.85, o.iris[1]],
      [1, shade(o.iris[1], -0.45)],
    ]) +
    radial(shid, [
      [0, '#ffffff', 0.95],
      [1, '#ffffff', 0],
    ]);
  const [lx, ly] = o.look ?? [0.12, 0];
  const px = cx + lx * r * 0.25;
  const py = cy + ly * r * 0.25;
  const pc = o.pupilColor ?? '#07090c';
  let pupil = '';
  switch (o.pupil ?? 'round') {
    case 'round':
      pupil = `<circle cx="${px}" cy="${py}" r="${r * 0.5}" fill="${pc}"/>`;
      break;
    case 'small':
      pupil = `<circle cx="${px}" cy="${py}" r="${r * 0.32}" fill="${pc}"/>`;
      break;
    case 'slit':
      pupil = `<rect x="${px - r * 0.62}" y="${py - r * 0.14}" width="${r * 1.24}" height="${r * 0.28}" rx="${r * 0.14}" fill="${pc}"/>`;
      break;
    case 'vslit':
      pupil = `<ellipse cx="${px}" cy="${py}" rx="${r * 0.16}" ry="${r * 0.62}" fill="${pc}"/>`;
      break;
    case 'w': {
      // đồng tử chữ W mảnh (dải cong mềm) – tránh trông như đang "cau mày"
      const w = r * 0.6;
      const h = r * 0.4;
      pupil = `<path d="M${px - w} ${py - h * 0.45}C${px - w * 0.92} ${py + h * 0.8} ${px - w * 0.25} ${py + h * 0.8} ${px} ${py - h * 0.05}C${px + w * 0.25} ${py + h * 0.8} ${px + w * 0.92} ${py + h * 0.8} ${px + w} ${py - h * 0.45}" fill="none" stroke="${pc}" stroke-width="${(r * 0.2).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      break;
    }
  }
  const socket = o.socket
    ? `<circle cx="${cx}" cy="${cy}" r="${r * 1.28}" fill="${o.socket}" opacity="0.55"/>`
    : '';
  const svg =
    `<g>` +
    socket +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${gid})"/>` +
    pupil +
    `<circle cx="${cx}" cy="${cy}" r="${r * 0.97}" fill="none" stroke="#05070a" stroke-opacity="0.75" stroke-width="${Math.max(0.6, r * 0.09)}"/>` +
    `<ellipse cx="${cx - r * 0.34}" cy="${cy - r * 0.38}" rx="${r * 0.34}" ry="${r * 0.24}" fill="url(#${shid})" transform="rotate(-25 ${cx - r * 0.34} ${cy - r * 0.38})"/>` +
    `<circle cx="${cx + r * 0.36}" cy="${cy + r * 0.34}" r="${r * 0.1}" fill="#ffffff" opacity="0.55"/>` +
    `</g>`;
  return { defs, svg };
}

/**
 * Tia vây: các đường mảnh hơi cong từ gốc tới mép.
 * base: các điểm gốc (hoặc 1 điểm cho vây quạt), tips: điểm mép (cùng số lượng hoặc base 1 điểm).
 */
export function finRays(
  base: [number, number][] | [number, number],
  tips: [number, number][],
  o: { color?: string; opacity?: number; width?: number; bend?: number } = {},
): string {
  const color = o.color ?? '#ffffff';
  const op = o.opacity ?? STROKE.rayOpacity;
  const w = o.width ?? STROKE.ray;
  const bend = o.bend ?? 0.08;
  const isSingle = typeof base[0] === 'number';
  const paths = tips.map((t, i) => {
    const b = (isSingle ? base : (base as [number, number][])[i]) as [number, number];
    const mx = (b[0] + t[0]) / 2;
    const my = (b[1] + t[1]) / 2;
    const dx = t[0] - b[0];
    const dy = t[1] - b[1];
    const cx = mx - dy * bend;
    const cy = my + dx * bend;
    return `M${b[0].toFixed(1)} ${b[1].toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${t[0].toFixed(1)} ${t[1].toFixed(1)}`;
  });
  return `<path d="${paths.join('')}" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round"/>`;
}

/** Màng vây bán trong suốt + nét mép. */
export function finMembrane(d: string, fill: string, o: { opacity?: number; edge?: string; edgeWidth?: number; edgeOpacity?: number } = {}): string {
  return `<path d="${d}" fill="${fill}" fill-opacity="${o.opacity ?? 0.7}"${o.edge ? ` stroke="${o.edge}" stroke-width="${o.edgeWidth ?? 1.2}" stroke-opacity="${o.edgeOpacity ?? 0.6}" stroke-linejoin="round"` : ''}/>`;
}

/** Nét rim light chạy theo một path (dùng rimGradient trong defs). */
export function rimLight(d: string, gradientUrl: string, width = STROKE.rim): string {
  return `<path d="${d}" fill="none" stroke="${gradientUrl}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
}

/** Viền ngoài thân chuẩn. */
export function outline(d: string, color: string, width = STROKE.outline, opacity = STROKE.outlineOpacity): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-opacity="${opacity}" stroke-linejoin="round"/>`;
}

/**
 * Bộ "thân chuẩn": fill gradient + vảy + bóng khối + viền + rim light.
 * Trả về { defs, svg }. Hoa văn riêng của loài vẽ thêm giữa (dùng clip u('bodyClip')).
 */
export function standardBody(
  u: Ids,
  d: string,
  o: {
    dorsal: string;
    flank: string;
    belly: string;
    outlineColor: string;
    scales?: { size?: number; color?: string; opacity?: number; stroke?: number } | false;
    flankAt?: number;
    rimOpacity?: number;
  },
): { defs: string; base: string; overlay: string } {
  const defs =
    counterShade(u('bodyFill'), { dorsal: o.dorsal, flank: o.flank, belly: o.belly, flankAt: o.flankAt }) +
    volumeShade(u('bodyVol')) +
    rimGradient(u('rim'), '#ffffff', o.rimOpacity ?? 0.85) +
    clip(u('bodyClip'), d) +
    (o.scales !== false ? scalePattern(u('scales'), o.scales || {}) : '');
  const base = `<path d="${d}" fill="${u.url('bodyFill')}"/>`;
  const overlay =
    (o.scales !== false ? `<path d="${d}" fill="${u.url('scales')}"/>` : '') +
    `<path d="${d}" fill="${u.url('bodyVol')}"/>` +
    outline(d, o.outlineColor) +
    rimLight(d, u.url('rim'));
  return { defs, base, overlay };
}

/** Ghép nhiều {defs, svg} con thành một. */
export function joinDefs(...parts: ({ defs: string } | string)[]): string {
  return parts.map((p) => (typeof p === 'string' ? p : p.defs)).join('');
}

/** Đường cong mượt qua các điểm (Catmull-Rom → Bezier). closed=true tạo hình kín. */
export function smoothPath(pts: [number, number][], closed = false, tension = 0.5): string {
  if (pts.length < 2) return '';
  const p = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < p.length - 2; i++) {
    const p0 = p[i - 1];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2];
    const k = tension / 3;
    const c1x = p1[0] + (p2[0] - p0[0]) * k;
    const c1y = p1[1] + (p2[1] - p0[1]) * k;
    const c2x = p2[0] - (p3[0] - p1[0]) * k;
    const c2y = p2[1] - (p3[1] - p1[1]) * k;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return closed ? d + 'Z' : d;
}

/** Rải đốm ngẫu nhiên tất định bên trong một hình chữ nhật (nên cắt bằng clipPath thân). */
export function scatterSpots(
  seed: number,
  area: { x: number; y: number; w: number; h: number },
  o: { count: number; rMin: number; rMax: number; color: string; opacity?: number; minGap?: number; ellipse?: number },
): string {
  const r = rng(seed);
  const pts: [number, number, number][] = [];
  let tries = 0;
  while (pts.length < o.count && tries < o.count * 30) {
    tries++;
    const x = area.x + r() * area.w;
    const y = area.y + r() * area.h;
    const rad = o.rMin + r() * (o.rMax - o.rMin);
    const gap = o.minGap ?? rad * 1.6;
    if (pts.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 < gap * gap)) continue;
    pts.push([x, y, rad]);
  }
  const e = o.ellipse ?? 1;
  return `<g fill="${o.color}"${o.opacity !== undefined ? ` fill-opacity="${o.opacity}"` : ''}>${pts
    .map(([x, y, rr]) => (e === 1 ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(2)}"/>` : `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(rr * e).toFixed(2)}" ry="${rr.toFixed(2)}"/>`))
    .join('')}</g>`;
}

/** Điểm trên đường cong Bezier bậc 3 (để đặt vây/đốm dọc theo đường lưng). */
export function bezierPoint(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number,
): [number, number] {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}
