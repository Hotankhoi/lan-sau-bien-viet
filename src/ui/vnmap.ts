/**
 * Bản đồ Việt Nam cách điệu (hải đồ cổ pha hiện đại) vẽ bằng SVG.
 * Có quần đảo Hoàng Sa và Trường Sa của Việt Nam, kèm nhãn tên.
 * Toạ độ: kinh độ/vĩ độ gần đúng → px bằng phép chiếu phẳng đơn giản.
 */
import type { RegionId } from '../data/types';

const K = 58;
const LON0 = 101.8;
const LAT0 = 23.6;
export const MAP_W = 900;
export const MAP_H = 920;
export const P = (lon: number, lat: number): [number, number] => [(lon - LON0) * K, (LAT0 - lat) * K];

/** Đường bao lãnh thổ đất liền Việt Nam (theo chiều kim đồng hồ). */
const VN: [number, number][] = [
  [102.14, 22.4], [102.5, 22.75], [103.0, 22.55], [103.5, 22.6], [103.95, 22.5], [104.4, 22.8], [104.85, 22.95], [105.35, 23.3],
  [105.9, 22.95], [106.25, 22.95], [106.7, 22.85], [106.62, 22.35], [106.95, 22.0], [107.4, 21.7], [108.0, 21.55],
  // bờ biển Bắc Bộ → Trung Bộ
  [107.75, 21.3], [107.35, 21.05], [107.05, 20.95], [106.75, 20.75], [106.55, 20.35], [106.15, 19.95], [105.85, 19.45],
  [105.75, 18.95], [106.05, 18.4], [106.45, 17.75], [106.95, 17.15], [107.35, 16.75], [107.75, 16.4], [108.2, 16.05],
  [108.55, 15.6], [108.85, 15.2], [109.05, 14.6], [109.2, 13.95], [109.3, 13.4], [109.45, 12.9], [109.2, 12.55],
  [109.22, 12.2], [109.2, 11.75], [109.0, 11.4], [108.65, 11.1], [108.15, 10.88], [107.65, 10.65], [107.2, 10.42],
  [106.85, 10.25], [106.65, 9.85], [106.35, 9.5], [105.95, 9.2], [105.45, 8.85], [105.05, 8.62], [104.75, 8.58],
  // bờ tây Cà Mau → Hà Tiên
  [104.82, 9.1], [104.85, 9.6], [105.05, 10.0], [104.75, 10.25], [104.45, 10.42],
  // biên giới phía tây
  [104.9, 10.75], [105.3, 10.9], [105.85, 10.95], [106.15, 11.25], [106.45, 11.75], [106.95, 11.95], [107.45, 12.3],
  [107.55, 12.85], [107.5, 13.5], [107.55, 14.1], [107.55, 14.65], [107.4, 15.2], [107.25, 15.8], [106.9, 16.25],
  [106.55, 16.6], [106.3, 17.15], [105.85, 17.65], [105.5, 18.1], [105.15, 18.6], [104.6, 18.95], [104.05, 19.3],
  [104.4, 19.75], [104.65, 20.1], [104.4, 20.45], [103.75, 20.7], [103.3, 20.75], [102.95, 21.15], [102.85, 21.7],
  [102.5, 21.95],
];

/** Đất liền các nước lân cận (tô nhạt, không nhãn) */
const NEIGHBOR: [number, number][] = [
  [80, 40], [130, 40], [117.6, 23.6], [117.5, 23.4], [116.5, 22.95], [115.4, 22.75], [114.3, 22.35], [113.3, 22.15], [112.3, 21.8],
  [111.3, 21.45], [110.45, 21.2], [110.25, 20.35], [109.95, 20.3], [109.7, 21.35], [108.65, 21.65], [108.0, 21.55],
  ...VN.slice(0, 15).reverse(),
  [102.14, 22.4], [102.5, 21.95], [102.85, 21.7], [102.95, 21.15], [103.3, 20.75], [103.75, 20.7], [104.4, 20.45], [104.65, 20.1],
  [104.4, 19.75], [104.05, 19.3], [104.6, 18.95], [105.15, 18.6], [105.5, 18.1], [105.85, 17.65], [106.3, 17.15], [106.55, 16.6],
  [106.9, 16.25], [107.25, 15.8], [107.4, 15.2], [107.55, 14.65], [107.55, 14.1], [107.5, 13.5], [107.55, 12.85], [107.45, 12.3],
  [106.95, 11.95], [106.45, 11.75], [106.15, 11.25], [105.85, 10.95], [105.3, 10.9], [104.9, 10.75], [104.45, 10.42],
  [103.9, 10.6], [103.5, 10.55], [103.1, 10.95], [102.85, 11.6], [102.3, 12.2], [101.5, 12.7], [100.9, 12.6], [100.9, 13.4], [100.3, 13.3], [99.9, 12.2], [99.6, 11.0], [99.2, 9.6],
  [100.3, 8.3], [101.0, 6.9], [102.1, 6.2], [103.4, 4.5], [103.5, 2.8], [104.3, 1.4], [103.4, 1.2], [80, 1],
];

const HAINAN: [number, number][] = [
  [108.65, 19.15], [109.1, 18.5], [109.6, 18.2], [110.15, 18.4], [110.55, 18.8], [111.0, 19.6], [110.75, 20.05], [110.2, 20.1],
  [109.6, 20.0], [108.75, 19.65],
];

function smooth(pts: [number, number][], closed = true): string {
  const p = pts.map(([lo, la]) => P(lo, la));
  const n = p.length;
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  const get = (i: number) => p[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + (closed ? 'Z' : '');
}

function islands(list: [number, number, number][], fill: string): string {
  return list
    .map(([lo, la, r]) => {
      const [x, y] = P(lo, la);
      return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r * 1.3).toFixed(1)}" ry="${r.toFixed(1)}" fill="${fill}" stroke="#7a5a2e" stroke-width="0.8"/>`;
    })
    .join('');
}

/** Toạ độ các điểm lặn trên bản đồ. */
export const SPOTS: Record<RegionId, [number, number]> = {
  bac_bo: P(107.55, 20.35),
  mien_trung: P(109.95, 13.2),
  mien_nam: P(107.45, 8.75),
  khoi_xa: P(113.4, 12.6),
};

// Quần đảo Hoàng Sa (một số đảo chính, vị trí gần đúng)
const HOANG_SA: [number, number, number][] = [
  [111.6, 16.53, 3], [111.75, 16.45, 2.2], [112.33, 16.83, 3.2], [112.2, 16.98, 2], [112.55, 16.67, 2.2], [111.2, 15.78, 2.4],
  [111.5, 16.0, 1.8], [112.73, 16.66, 1.8], [111.95, 16.25, 1.6],
];
// Quần đảo Trường Sa (một số đảo chính)
const TRUONG_SA: [number, number, number][] = [
  [111.92, 8.65, 3.2], [114.28, 10.38, 2.8], [114.36, 11.05, 2.2], [114.06, 11.43, 2.4], [113.85, 10.18, 2], [114.65, 10.7, 1.8],
  [115.0, 10.0, 1.6], [112.88, 9.55, 2], [113.25, 8.95, 1.6], [114.9, 9.3, 1.8], [115.5, 9.75, 1.6], [116.1, 10.2, 1.6], [113.6, 9.9, 1.6],
  [112.4, 8.95, 1.6], [114.6, 11.4, 1.6],
];

export function vnMapSvg(): string {
  const land = smooth(VN);
  const neighbor = 'M' + NEIGHBOR.map(([lo, la]) => P(lo, la).map((v) => v.toFixed(1)).join(' ')).join('L') + 'Z';
  const hainan = smooth(HAINAN);
  const [hnX, hnY] = P(105.85, 21.03);
  const [hcmX, hcmY] = P(106.7, 10.78);
  const [dnX, dnY] = P(108.2, 16.05);
  const [hsX, hsY] = P(112.0, 16.5);
  const [tsX, tsY] = P(114.0, 10.0);
  const [pqX, pqY] = P(103.97, 10.22);
  const [cdX, cdY] = P(106.6, 8.7);
  // lưới kinh vĩ độ
  let grid = '';
  for (let lon = 84; lon <= 136; lon += 2) {
    const [x] = P(lon, 0);
    grid += `<line x1="${x}" y1="-600" x2="${x}" y2="${MAP_H + 600}"/>`;
  }
  for (let lat = 0; lat <= 32; lat += 2) {
    const [, y] = P(0, lat);
    grid += `<line x1="-1200" y1="${y}" x2="${MAP_W + 1200}" y2="${y}"/>`;
  }
  const isle = (cx: number, cy: number, rx: number, ry: number, rot = 0) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="url(#mp_land)" stroke="#7a5a2e" stroke-width="1"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP_W} ${MAP_H}" preserveAspectRatio="xMidYMid meet">
<defs>
  <radialGradient id="mp_sea" gradientUnits="userSpaceOnUse" cx="${MAP_W * 0.62}" cy="${MAP_H * 0.55}" r="${MAP_H * 0.9}"><stop offset="0" stop-color="#1c86b4"/><stop offset="0.55" stop-color="#0f5c8c"/><stop offset="1" stop-color="#062a4a"/></radialGradient>
  <linearGradient id="mp_land" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf0d4"/><stop offset="1" stop-color="#e9d3a4"/></linearGradient>
  <pattern id="mp_hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="7" stroke="#b49a6b" stroke-width="0.8" stroke-opacity="0.35"/></pattern>
  <filter id="mp_glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<rect x="-1200" y="-600" width="${MAP_W + 2400}" height="${MAP_H + 1200}" fill="#062a4a"/>
<rect x="-1200" y="-600" width="${MAP_W + 2400}" height="${MAP_H + 1200}" fill="url(#mp_sea)"/>
<g stroke="#bfefff" stroke-opacity="0.1" stroke-width="1">${grid}</g>
<!-- đường đẳng sâu -->
<g fill="none" stroke-linejoin="round">
  <path d="${land}" stroke="#2a9cc4" stroke-opacity="0.35" stroke-width="120"/>
  <path d="${land}" stroke="#3fb4d6" stroke-opacity="0.35" stroke-width="64"/>
  <path d="${land}" stroke="#6fd3e6" stroke-opacity="0.35" stroke-width="26"/>
  <path d="${land}" stroke="#d7fbff" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="2 6" transform="translate(0 0)"/>
</g>
<path d="${neighbor}" fill="#5b7a86" fill-opacity="0.55" stroke="#9fc3cc" stroke-opacity="0.3" stroke-width="1.2"/>
<path d="${hainan}" fill="#5b7a86" fill-opacity="0.55" stroke="#9fc3cc" stroke-opacity="0.3" stroke-width="1.2"/>
<path d="${land}" fill="url(#mp_land)" stroke="#7a5a2e" stroke-width="2"/>
<path d="${land}" fill="url(#mp_hatch)"/>
${isle(pqX, pqY, 7, 13, 10)}${isle(cdX, cdY, 4, 3)}
<!-- Hoàng Sa & Trường Sa -->
<g>
  <ellipse cx="${hsX}" cy="${hsY}" rx="70" ry="44" fill="#ffc75f" fill-opacity="0.08" stroke="#ffc75f" stroke-opacity="0.6" stroke-dasharray="5 5"/>
  ${islands(HOANG_SA, '#f6e6bf')}
  <ellipse cx="${tsX + 10}" cy="${tsY + 6}" rx="135" ry="80" fill="#ffc75f" fill-opacity="0.08" stroke="#ffc75f" stroke-opacity="0.6" stroke-dasharray="5 5"/>
  ${islands(TRUONG_SA, '#f6e6bf')}
</g>
<g font-family="Be Vietnam Pro, sans-serif" font-weight="700" text-anchor="middle">
  <text x="${hsX}" y="${hsY - 56}" font-size="17" fill="#fff4d6">Quần đảo Hoàng Sa</text>
  <text x="${hsX}" y="${hsY - 37}" font-size="14" fill="#ffc75f">(Việt Nam)</text>
  <text x="${tsX + 10}" y="${tsY + 106}" font-size="17" fill="#fff4d6">Quần đảo Trường Sa</text>
  <text x="${tsX + 10}" y="${tsY + 125}" font-size="14" fill="#ffc75f">(Việt Nam)</text>
  <text x="${P(112.4, 14)[0]}" y="${P(112.4, 14)[1]}" font-size="34" font-style="italic" font-weight="600" fill="#bff3ff" fill-opacity="0.55" letter-spacing="8">BIỂN ĐÔNG</text>
  <text x="${P(107.1, 19.6)[0]}" y="${P(107.1, 19.6)[1]}" font-size="15" font-style="italic" font-weight="600" fill="#d6f8ff" fill-opacity="0.8">Vịnh Bắc Bộ</text>
  <text x="${P(104.55, 21.75)[0]}" y="${P(104.55, 21.75)[1]}" font-size="21" font-weight="800" fill="#7a5a2e" fill-opacity="0.8" letter-spacing="4">VIỆT NAM</text>
</g>
<g font-family="Be Vietnam Pro, sans-serif" font-size="13" font-weight="600" fill="#4a3518">
  <circle cx="${hnX}" cy="${hnY}" r="5" fill="#e5484d" stroke="#fff" stroke-width="1.5"/><text x="${hnX - 10}" y="${hnY - 8}" text-anchor="end">Hà Nội</text>
  <circle cx="${dnX}" cy="${dnY}" r="3.5" fill="#4a3518"/><text x="${dnX - 8}" y="${dnY + 4}" text-anchor="end">Đà Nẵng</text>
  <circle cx="${hcmX}" cy="${hcmY}" r="3.5" fill="#4a3518"/><text x="${hcmX - 8}" y="${hcmY - 6}" text-anchor="end">TP. Hồ Chí Minh</text>
  <text x="${pqX}" y="${pqY + 30}" text-anchor="middle" fill="#d6f8ff" font-size="12">Phú Quốc</text>
  <text x="${cdX}" y="${cdY + 20}" text-anchor="middle" fill="#d6f8ff" font-size="12">Côn Đảo</text>
</g>
<!-- la bàn -->
<g transform="translate(${MAP_W - 70} 80)" opacity="0.85">
  <circle r="40" fill="none" stroke="#fff4d6" stroke-opacity="0.5"/>
  <circle r="30" fill="none" stroke="#fff4d6" stroke-opacity="0.3" stroke-dasharray="2 4"/>
  <path d="M0 -44L8 0L0 44L-8 0Z" fill="#fff4d6" fill-opacity="0.85"/>
  <path d="M-44 0L0 -6L44 0L0 6Z" fill="#fff4d6" fill-opacity="0.45"/>
  <path d="M0 -44L8 0L-8 0Z" fill="#ffc75f"/>
  <text y="-50" text-anchor="middle" font-family="Be Vietnam Pro, sans-serif" font-weight="800" font-size="15" fill="#ffc75f">B</text>
</g>
</svg>`;
}
