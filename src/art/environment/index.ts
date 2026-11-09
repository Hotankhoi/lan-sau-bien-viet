/**
 * Registry môi trường (chỉ agent điều phối sửa). Nạp src/art/environment/<region>/index.ts nếu có,
 * nếu chưa có thì dùng môi trường dự phòng vẽ đơn giản bằng code.
 */
import type { BackdropArt, PropArt, RegionEnvironmentArt } from './contract-env';
import { linear, makeIds, rng, smoothPath, mix, shade, REGION_WATER } from '../style-bible';

const modules = import.meta.glob<{ default: RegionEnvironmentArt }>('./*/index.ts', { eager: true });
const registry = new Map<string, RegionEnvironmentArt>();
for (const mod of Object.values(modules)) if (mod?.default?.region) registry.set(mod.default.region, mod.default);

const FALLBACK_COLORS: Record<string, { sandTop: string; sandBot: string; rock: string; plant: string; coral: string[] }> = {
  bac_bo: { sandTop: '#9c9a7c', sandBot: '#4c5446', rock: '#6f7a72', plant: '#5f8a4a', coral: ['#c98a6a', '#9fb38a'] },
  mien_trung: { sandTop: '#efe2bf', sandBot: '#8fa39a', rock: '#7d8a8c', plant: '#3f9a6b', coral: ['#f08a6c', '#c86bd0', '#f2c14e', '#68c3a9'] },
  mien_nam: { sandTop: '#f3e9c8', sandBot: '#9cae92', rock: '#9a9488', plant: '#5aa04a', coral: ['#e9a06b', '#d6c35a'] },
  khoi_xa: { sandTop: '#dfe6e8', sandBot: '#4d6a86', rock: '#5c6b7c', plant: '#3f8c8c', coral: ['#ff8a7a', '#9a7bf0', '#5ad1c8', '#ffd166'] },
};

function rockProp(id: string, seed: number, color: string, h: number): PropArt {
  const r = rng(seed);
  const u = makeIds(`fb_${id}`);
  const pts: [number, number][] = [];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI;
    const rad = 0.75 + r() * 0.3;
    pts.push([100 + Math.cos(a) * 95 * rad, 100 + Math.sin(a) * 90 * rad]);
  }
  pts.push([196, 100], [4, 100]);
  return {
    id,
    kind: 'rock',
    viewBox: [200, 104],
    heightPx: h,
    defs: linear(u('g'), [
      [0, shade(color, 0.25)],
      [0.6, color],
      [1, shade(color, -0.45)],
    ]),
    svg: `<path d="${smoothPath(pts, true, 0.6)}" fill="${u.url('g')}" stroke="${shade(color, -0.5)}" stroke-opacity="0.4" stroke-width="2"/>`,
  };
}

function grassProp(id: string, seed: number, color: string, h: number): PropArt {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < 9; i++) {
    const x = 20 + r() * 60;
    const lean = (r() - 0.5) * 50;
    const top = 10 + r() * 60;
    s += `<path d="M${x} 200Q${x + lean * 0.3} ${(200 + top) / 2} ${x + lean} ${top}Q${x + lean + 6} ${top + 8} ${x + 7} 200Z" fill="${mix(color, '#d8f0a0', r() * 0.3)}" opacity="0.9"/>`;
  }
  return { id, kind: 'seagrass', viewBox: [100, 200], heightPx: h, sway: 0.5, defs: '', svg: s };
}

function coralProp(id: string, seed: number, color: string, h: number): PropArt {
  const r = rng(seed);
  let s = '';
  const branch = (x: number, y: number, ang: number, len: number, w: number, depth: number) => {
    const x2 = x + Math.cos(ang) * len;
    const y2 = y + Math.sin(ang) * len;
    s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${shade(color, -0.1 + depth * 0.08)}" stroke-width="${w.toFixed(1)}" stroke-linecap="round"/>`;
    if (depth < 3) {
      branch(x2, y2, ang - 0.4 - r() * 0.3, len * 0.72, w * 0.72, depth + 1);
      branch(x2, y2, ang + 0.4 + r() * 0.3, len * 0.72, w * 0.72, depth + 1);
    } else s += `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="${(w * 0.7).toFixed(1)}" fill="${shade(color, 0.35)}"/>`;
  };
  branch(100, 200, -Math.PI / 2, 60, 16, 0);
  return { id, kind: 'coral', viewBox: [200, 200], heightPx: h, sway: 0.03, defs: '', svg: s };
}

function hillsBackdrop(id: string, seed: number, color: string, parallax: number, h: number, opacity: number): BackdropArt {
  const r = rng(seed);
  const pts: [number, number][] = [[0, 512]];
  let y = 300;
  for (let x = 0; x <= 2048; x += 128) {
    y = x === 2048 ? pts[1]?.[1] ?? 300 : 220 + r() * 200;
    pts.push([x, y]);
  }
  pts.push([2048, 512]);
  return {
    id,
    viewBox: [2048, 512],
    parallax,
    heightPx: h,
    anchor: 'bottom',
    opacity,
    defs: '',
    svg: `<path d="${smoothPath(pts, true, 0.5)}" fill="${color}"/>`,
  };
}

function fallback(region: string): RegionEnvironmentArt {
  const c = FALLBACK_COLORS[region] ?? FALLBACK_COLORS.mien_trung;
  const w = REGION_WATER[region] ?? REGION_WATER.mien_trung;
  const props: PropArt[] = [
    rockProp('rock1', 3, c.rock, 90),
    rockProp('rock2', 7, c.rock, 150),
    grassProp('grass1', 11, c.plant, 110),
    grassProp('grass2', 13, c.plant, 80),
    ...c.coral.map((col, i) => coralProp(`coral${i}`, 20 + i, col, 100 + i * 10)),
  ];
  return {
    region: region as RegionEnvironmentArt['region'],
    props,
    backdrops: [
      hillsBackdrop('far', 5, mix(w.deep, w.shallow, 0.35), 0.2, 420, 0.55),
      hillsBackdrop('mid', 9, mix(w.deep, '#000000', 0.15), 0.45, 300, 0.6),
    ],
    seabed: { top: c.sandTop, bottom: c.sandBot, speckle: shade(c.sandTop, -0.25) },
  };
}

export function getEnvironment(region: string): RegionEnvironmentArt {
  return registry.get(region) ?? fallback(region);
}
