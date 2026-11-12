/** Tiện ích DOM nhỏ gọn (không dùng framework). */
import { composeSvg } from '../art/contract';
import { getArt } from '../art/species';

type Attrs = Record<string, string | number | boolean | ((e: Event) => void) | undefined | null>;
type Child = Node | string | number | null | undefined | false | Child[];

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else if (k === 'html') el.innerHTML = String(v);
    else if (k === 'style') el.setAttribute('style', String(v));
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  append(el, children);
  return el;
}

function append(el: Node, children: Child[]) {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
}

/** Thêm nhiều phần tử con (bỏ qua null/false, nhận cả mảng lồng). */
export function add(el: HTMLElement, ...children: Child[]) {
  append(el, children);
}

export function clear(el: HTMLElement) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

const artCache = new Map<string, string>();
/** Ảnh minh họa của loài dạng data URL SVG (bản chi tiết cho Sổ tay). */
export function artUrl(id: string): string {
  let u = artCache.get(id);
  if (!u) {
    const art = getArt(id);
    const svg = composeSvg(art, { mode: 'card', alarm: 0 });
    u = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    artCache.set(id, u);
  }
  return u;
}

/**
 * Ảnh nhỏ của loài cho các lưới dày đặc: file WebP vẽ sẵn lúc build (`npm run art:thumbs` → public/thumbs/),
 * tải ngay không tốn công dựng SVG trên máy người chơi.
 */
export function thumbUrl(id: string): string {
  return `${import.meta.env.BASE_URL}thumbs/${id}.webp`;
}

/** Dự phòng khi thiếu file ảnh nhỏ: bản vẽ trong game cỡ nhỏ, bỏ filter (ở cỡ ~60 px gần như không thấy). */
export function thumbSvgUrl(id: string, px = 168): string {
  const art = getArt(id);
  const [vw, vh] = art.viewBox;
  const k = Math.min(px / vw, px / vh);
  const svg = composeSvg(art, { mode: 'game', alarm: 0, width: Math.max(1, Math.round(vw * k)), height: Math.max(1, Math.round(vh * k)) }).replace(/\sfilter="url\(#[^)"]+\)"/g, '');
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export function stars(n: number, max = 3): HTMLElement {
  const s = h('span', { class: 'stars' });
  for (let i = 0; i < max; i++) s.appendChild(h('span', { class: i < n ? '' : 'off' }, '★'));
  return s;
}

export function fmt(n: number): string {
  return Math.round(n).toLocaleString('vi-VN');
}
