/**
 * Chuyển SVG viết bằng code thành texture Phaser (rasterize một lần, cache lại).
 * Mỗi lớp được CẮT theo khung bao (getBBox) để tiết kiệm bộ nhớ GPU.
 */
import Phaser from 'phaser';
import { composeSvg, isBending, orderLayers, type ArtLayer, type CreatureArt } from './contract';

export type Crop = [number, number, number, number];

const SVGNS = 'http://www.w3.org/2000/svg';
let measureRoot: SVGSVGElement | null = null;

function measurer(): SVGSVGElement {
  if (!measureRoot) {
    measureRoot = document.createElementNS(SVGNS, 'svg');
    measureRoot.setAttribute('width', '10');
    measureRoot.setAttribute('height', '10');
    measureRoot.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden';
    document.body.appendChild(measureRoot);
  }
  return measureRoot;
}

/** Khung bao (đơn vị viewBox) của một đoạn SVG, có chừa lề cho nét/filter. */
export function measure(defs: string, inner: string, viewBox: [number, number], padRatio = 0.05): Crop {
  const root = measurer();
  root.setAttribute('viewBox', `0 0 ${viewBox[0]} ${viewBox[1]}`);
  root.innerHTML = `<defs>${defs}</defs><g id="m">${inner}</g>`;
  const g = root.querySelector('#m') as SVGGElement;
  let b: DOMRect;
  try {
    b = g.getBBox();
  } catch {
    return [0, 0, viewBox[0], viewBox[1]];
  }
  root.innerHTML = '';
  if (!b || b.width === 0 || b.height === 0) return [0, 0, viewBox[0], viewBox[1]];
  const pad = Math.max(viewBox[0], viewBox[1]) * padRatio + 4;
  const x = Math.max(-pad, b.x - pad);
  const y = Math.max(-pad, b.y - pad);
  const x2 = Math.min(viewBox[0] + pad, b.x + b.width + pad);
  const y2 = Math.min(viewBox[1] + pad, b.y + b.height + pad);
  return [x, y, x2 - x, y2 - y];
}

/** Vẽ chuỗi SVG hoàn chỉnh lên canvas kích thước w×h. */
export function svgToCanvas(svg: string, w: number, h: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w));
    canvas.height = Math.max(1, Math.round(h));
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    img.onload = () => {
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      console.warn('Không rasterize được SVG');
      resolve(canvas);
    };
    img.src = url;
  });
}

export interface BuiltPart {
  layer: ArtLayer;
  key: string;
  crop: Crop;
}

export interface BuiltCreature {
  art: CreatureArt;
  /** px game / đơn vị viewBox */
  scale: number;
  /** độ phân giải texture so với px game */
  res: number;
  body: { key: string; crop: Crop } | null;
  back: BuiltPart[];
  front: BuiltPart[];
}

const cache = new Map<string, Promise<BuiltCreature>>();

/** Độ phân giải texture mặc định (đặt theo chất lượng đồ họa). */
export const RasterSettings = { res: Math.min(2, window.devicePixelRatio || 1) * 1.15, maxTex: 4096 };

async function addTexture(scene: Phaser.Scene, key: string, svg: string, w: number, h: number) {
  if (scene.textures.exists(key)) return;
  const canvas = await svgToCanvas(svg, w, h);
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, canvas);
}

/**
 * Dựng texture cho một loài ở một tỉ lệ hiển thị. Kết quả được cache.
 * @param displayLengthPx chiều dài hiển thị trong game
 */
export function buildCreature(scene: Phaser.Scene, art: CreatureArt, displayLengthPx: number, variant = ''): Promise<BuiltCreature> {
  const scale = displayLengthPx / art.lengthUnits;
  const cacheKey = `${art.id}@${scale.toFixed(4)}${variant}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  const p = (async () => {
    const [vw, vh] = art.viewBox;
    let res = RasterSettings.res;
    const maxDim = Math.max(vw, vh) * scale * res;
    if (maxDim > RasterSettings.maxTex) res *= RasterSettings.maxTex / maxDim;
    const ordered = orderLayers(art, 'game');
    const bendLayers = ordered.filter(isBending);
    const result: BuiltCreature = { art, scale, res, body: null, back: [], front: [] };
    const k = (n: string) => `cr:${cacheKey}:${n}`;
    if (bendLayers.length) {
      const inner = bendLayers.map((l) => l.svg).join('');
      const crop = measure(art.defs, inner, art.viewBox);
      const svg = composeSvg({ ...art, layers: bendLayers }, { mode: 'game', crop, width: crop[2] * scale * res, height: crop[3] * scale * res });
      await addTexture(scene, k('body'), svg, crop[2] * scale * res, crop[3] * scale * res);
      result.body = { key: k('body'), crop };
    }
    for (const layer of ordered) {
      if (isBending(layer)) continue;
      const crop = measure(art.defs, layer.svg, art.viewBox, 0.03);
      const svg = composeSvg({ ...art, layers: [layer] }, { mode: 'game', crop, width: crop[2] * scale * res, height: crop[3] * scale * res, alarm: 1 });
      const key = k(layer.name);
      await addTexture(scene, key, svg, crop[2] * scale * res, crop[3] * scale * res);
      (layer.z === 'back' ? result.back : result.front).push({ layer, key, crop });
    }
    return result;
  })();
  cache.set(cacheKey, p);
  return p;
}

/** Rasterize một SVG tĩnh (môi trường, nền) – cache theo key. */
export async function buildStatic(
  scene: Phaser.Scene,
  key: string,
  a: { viewBox: [number, number]; defs: string; svg: string },
  w: number,
  h: number,
): Promise<string> {
  if (scene.textures.exists(key)) return key;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${a.viewBox[0]} ${a.viewBox[1]}" width="${Math.round(w)}" height="${Math.round(h)}" preserveAspectRatio="none"><defs>${a.defs}</defs>${a.svg}</svg>`;
  await addTexture(scene, key, svg, w, h);
  return key;
}
