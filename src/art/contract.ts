/**
 * HỢP ĐỒNG HÌNH SINH VẬT (chỉ agent điều phối được sửa file này)
 * ----------------------------------------------------------------
 * Mỗi loài là một file `src/art/species/<id>.ts` export default một `CreatureArt`.
 *
 * Quy ước bắt buộc:
 *  - Sinh vật luôn vẽ QUAY ĐẦU SANG PHẢI (engine tự lật khi bơi sang trái).
 *  - Mọi lớp (layer) dùng CHUNG một hệ toạ độ viewBox, nên tự khớp vị trí.
 *  - Mọi id trong <defs> phải có tiền tố là id loài (dùng `makeIds(id)` trong style-bible)
 *    để không trùng khi nhiều loài cùng nằm trên một trang (Sổ tay).
 *  - Lớp `bend: true` (mặc định cho body/tail/pattern/eye/detail) được "nướng" chung thành
 *    một texture và uốn lượn theo sóng sin dọc thân (Phaser Rope). Lớp còn lại là sprite
 *    riêng, xoay/co giãn quanh `pivot` theo `anim`.
 *  - Không nhúng ảnh ngoài (<image href>), không dùng font. Chỉ path/shape/gradient/pattern/filter.
 */

export type AnimationProfile =
  | 'fish'
  | 'jelly'
  | 'ray'
  | 'cephalopod'
  | 'turtle'
  | 'static'
  | 'eel'
  | 'mammal'
  | 'seahorse';

export type LayerRole =
  | 'body' // thân chính
  | 'pattern' // hoa văn nằm trên thân
  | 'tail' // đuôi (nếu bend:false thì quẫy quanh pivot)
  | 'fin' // vây (vẫy quanh pivot)
  | 'wing' // cánh cá đuối (vỗ quanh pivot, thường dùng scaleY)
  | 'flipper' // chân chèo rùa / thú biển
  | 'bell' // chuông sứa (co bóp)
  | 'tentacle' // xúc tu / tay miệng
  | 'arm' // tay bạch tuộc, mực
  | 'eye'
  | 'glow' // điểm phát quang (vẽ cộng sáng, nhấp nháy)
  | 'alarm' // chỉ hiện khi sinh vật hoảng (vd. vòng xanh bạch tuộc)
  | 'detail'; // chi tiết khác

export interface LayerAnim {
  /**
   * rotate: xoay quanh pivot, amp = radian
   * scaleX / scaleY: co giãn quanh pivot, amp = tỉ lệ (0.3 = ±30%)
   * pulse: co giãn đều 2 chiều quanh pivot, amp = tỉ lệ
   * alpha: nhấp nháy độ mờ, amp = 0..1
   * skewY: xô lệch dọc (gợn sóng vây), amp = radian
   * none: đứng yên
   */
  type: 'rotate' | 'scaleX' | 'scaleY' | 'pulse' | 'alpha' | 'skewY' | 'none';
  amp: number;
  /** hệ số nhân với nhịp cơ bản của sinh vật (mặc định 1) */
  speed?: number;
  /** lệch pha (radian) */
  phase?: number;
}

export interface ArtLayer {
  /** tên lớp, duy nhất trong loài: 'body', 'pectoral', 'dorsalSpines'... */
  name: string;
  /** markup SVG (không có thẻ <svg>), toạ độ theo viewBox */
  svg: string;
  role: LayerRole;
  /** uốn theo thân? mặc định true với body/pattern/tail/eye/detail, false với phần còn lại */
  bend?: boolean;
  /** điểm xoay (toạ độ viewBox) cho lớp bend:false */
  pivot?: [number, number];
  anim?: LayerAnim;
  /** lớp tách rời vẽ phía sau ('back') hay phía trước ('front', mặc định) thân */
  z?: 'back' | 'front';
  blend?: 'normal' | 'add';
  /** chỉ vẽ trên thẻ Sổ tay (chi tiết cao, nền...) */
  cardOnly?: boolean;
  /** chỉ vẽ trong game */
  gameOnly?: boolean;
}

export interface TentacleSpec {
  /** gốc xúc tu (toạ độ viewBox) */
  from: [number, number];
  /** chiều dài (đơn vị viewBox) */
  length: number;
  /** độ dày ở gốc */
  width: number;
  color: string;
  /** độ mờ 0..1 */
  opacity?: number;
  /** số xúc tu tỏa ra từ gốc này */
  count?: number;
  /** khoảng rải gốc theo chiều ngang khi count > 1 */
  spread?: number;
}

export interface CreatureArt {
  /** khớp id trong species.json */
  id: string;
  /** kích thước viewBox [rộng, cao]; tối thiểu 512×256 cho cá */
  viewBox: [number, number];
  /** <defs> dùng chung cho mọi lớp (gradient, pattern, filter, clipPath) */
  defs: string;
  /** các lớp, vẽ theo thứ tự mảng (lớp sau đè lớp trước) */
  layers: ArtLayer[];
  /** chiều dài con vật tính bằng đơn vị viewBox (đầu đến đuôi) – để quy đổi kích thước trong game */
  lengthUnits: number;
  /** trục sống lưng (toạ độ y) – đường thân uốn quanh; mặc định giữa viewBox */
  spineY?: number;
  animation: AnimationProfile;
  /** nhịp cơ bản (Hz) – mặc định theo animation profile */
  cycleHz?: number;
  /** biên độ uốn thân (đơn vị viewBox) ở đuôi – mặc định theo profile; 0 = không uốn */
  bendAmp?: number;
  /** ép kích thước hiển thị trong game (px chiều dài) thay cho công thức theo sizeCm */
  displayLengthPx?: number;
  /** góc xoay mặc định khi vẽ (vd. cá ngựa đứng thẳng: vẽ đứng sẵn, để 0) */
  cardDetailLevel: 'hi';
  /** xúc tu sinh bằng code, mô phỏng vật lý dây (sứa, mực...) */
  procedural?: { tentacles?: TentacleSpec[] };
  /** true = hình tạm, chưa vẽ thật */
  placeholder?: boolean;
}

/** Nhịp & biên độ mặc định theo kiểu chuyển động. */
export const PROFILE_DEFAULTS: Record<AnimationProfile, { cycleHz: number; bendAmpRatio: number }> = {
  fish: { cycleHz: 1.6, bendAmpRatio: 0.035 },
  eel: { cycleHz: 0.9, bendAmpRatio: 0.09 },
  mammal: { cycleHz: 0.7, bendAmpRatio: 0.02 },
  seahorse: { cycleHz: 2.2, bendAmpRatio: 0.0 },
  jelly: { cycleHz: 0.6, bendAmpRatio: 0.0 },
  ray: { cycleHz: 0.45, bendAmpRatio: 0.0 },
  cephalopod: { cycleHz: 1.0, bendAmpRatio: 0.0 },
  turtle: { cycleHz: 0.45, bendAmpRatio: 0.0 },
  static: { cycleHz: 0.3, bendAmpRatio: 0.0 },
};

export function isBending(layer: ArtLayer): boolean {
  if (layer.bend !== undefined) return layer.bend;
  return (
    layer.role === 'body' ||
    layer.role === 'pattern' ||
    layer.role === 'tail' ||
    layer.role === 'eye' ||
    layer.role === 'detail'
  );
}

export interface LayerPose {
  rotation: number;
  scaleX: number;
  scaleY: number;
  skewY: number;
  alpha: number;
}

/**
 * Tư thế của một lớp tại thời điểm t (giây). Dùng chung cho game và công cụ preview,
 * nên những gì agent thấy trong preview giống hệt trong game.
 * @param intensity hệ số (1 = bình thường, >1 khi bơi nhanh / hoảng)
 * @param alarm 0..1 mức hoảng (cho lớp role 'alarm')
 */
export function layerPose(
  art: CreatureArt,
  layer: ArtLayer,
  t: number,
  intensity = 1,
  alarm = 0,
): LayerPose {
  const pose: LayerPose = { rotation: 0, scaleX: 1, scaleY: 1, skewY: 0, alpha: 1 };
  const hz = art.cycleHz ?? PROFILE_DEFAULTS[art.animation].cycleHz;
  if (layer.role === 'alarm') {
    const flick = 0.75 + 0.25 * Math.sin(t * Math.PI * 2 * 3);
    pose.alpha = Math.max(0, Math.min(1, alarm)) * flick;
  }
  const a = layer.anim;
  if (!a || a.type === 'none') return pose;
  const w = Math.PI * 2 * hz * (a.speed ?? 1);
  const s = Math.sin(t * w + (a.phase ?? 0));
  const amp = a.amp * (a.type === 'alpha' ? 1 : intensity);
  switch (a.type) {
    case 'rotate':
      pose.rotation = s * amp;
      break;
    case 'scaleX':
      pose.scaleX = 1 + s * amp;
      break;
    case 'scaleY':
      pose.scaleY = 1 + s * amp;
      break;
    case 'pulse':
      pose.scaleX = 1 + s * amp;
      pose.scaleY = 1 - s * amp * 0.6;
      break;
    case 'skewY':
      pose.skewY = s * amp;
      break;
    case 'alpha':
      pose.alpha *= 1 - amp * (0.5 + 0.5 * s);
      break;
  }
  return pose;
}

/** Ghép toàn bộ lớp thành một chuỗi SVG hoàn chỉnh (dùng cho thẻ Sổ tay, preview). */
export function composeSvg(
  art: CreatureArt,
  opts: { mode?: 'card' | 'game'; width?: number; height?: number; t?: number; animate?: boolean; alarm?: number; extraBack?: string; crop?: [number, number, number, number] } = {},
): string {
  const mode = opts.mode ?? 'card';
  const [vw, vh] = art.viewBox;
  const vb = opts.crop ?? [0, 0, vw, vh];
  const w = opts.width ?? vb[2];
  const h = opts.height ?? vb[3];
  const parts: string[] = [];
  const ordered = orderLayers(art, mode);
  for (const layer of ordered) {
    let g = layer.svg;
    let attrs = '';
    if (layer.role === 'alarm' && !opts.animate) {
      attrs += ` opacity="${(opts.alarm ?? 0).toFixed(3)}"`;
    }
    if (opts.animate && opts.t !== undefined && !isBending(layer)) {
      const p = layerPose(art, layer, opts.t, 1, opts.alarm ?? 0);
      const [px, py] = layer.pivot ?? [vw / 2, vh / 2];
      const skew = (p.skewY * 180) / Math.PI;
      attrs += ` transform="translate(${px} ${py}) rotate(${((p.rotation * 180) / Math.PI).toFixed(3)}) skewY(${skew.toFixed(3)}) scale(${p.scaleX.toFixed(4)} ${p.scaleY.toFixed(4)}) translate(${-px} ${-py})" opacity="${p.alpha.toFixed(3)}"`;
    }
    if (layer.blend === 'add') attrs += ` style="mix-blend-mode:screen"`;
    g = `<g data-layer="${layer.name}"${attrs}>${g}</g>`;
    parts.push(g);
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" width="${w}" height="${h}">` +
    `<defs>${art.defs}</defs>${opts.extraBack ?? ''}${parts.join('')}</svg>`
  );
}

/**
 * Thứ tự vẽ thật: lớp tách rời z='back' → mọi lớp uốn theo thân (theo thứ tự khai báo)
 * → lớp tách rời z='front'. Game và preview dùng chung thứ tự này.
 */
export function orderLayers(art: CreatureArt, mode: 'card' | 'game'): ArtLayer[] {
  const visible = art.layers.filter((l) => (mode === 'card' ? !l.gameOnly : !l.cardOnly));
  const back = visible.filter((l) => !isBending(l) && l.z === 'back');
  const bend = visible.filter((l) => isBending(l));
  const front = visible.filter((l) => !isBending(l) && l.z !== 'back');
  return [...back, ...bend, ...front];
}

/** Kích thước hiển thị trong game (px chiều dài) theo kích thước thật. */
export function displayLengthFor(sizeCm: number, art?: CreatureArt): number {
  if (art?.displayLengthPx) return art.displayLengthPx;
  return Math.round(12 * Math.pow(sizeCm, 0.58));
}
