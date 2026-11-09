/**
 * Xem trước môi trường một vùng:  npx tsx tools/env-preview.ts mien_trung
 * → preview/env/<region>.png : dải cảnh ghép (nền xa + đáy + vật thể theo đúng kích thước game) + bảng từng vật thể.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { BackdropArt, PropArt, RegionEnvironmentArt } from '../src/art/environment/contract-env';
import { REGION_WATER, rng } from '../src/art/style-bible';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const svgOf = (a: { viewBox: [number, number]; defs: string; svg: string }, w: number, h: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${a.viewBox[0]} ${a.viewBox[1]}" width="${w}" height="${h}" preserveAspectRatio="none"><defs>${a.defs}</defs>${a.svg}</svg>`;

async function main() {
  const region = process.argv[2] ?? 'mien_trung';
  const mod = await import(pathToFileURL(join(ROOT, 'src/art/environment', region, 'index.ts')).href + `?t=${Date.now()}`);
  const env: RegionEnvironmentArt = mod.default;
  const water = REGION_WATER[region];
  const W = 1600;
  const H = 820;
  const groundY = 640;
  const r = rng(9);
  // nền xa
  const backs = env.backdrops
    .map((b: BackdropArt) => {
      const w = (b.viewBox[0] / b.viewBox[1]) * b.heightPx;
      const y = b.anchor === 'bottom' ? groundY + 30 - b.heightPx : 200;
      return `<div style="position:absolute;left:${-r() * 200}px;top:${y}px;opacity:${b.opacity ?? 0.6};filter:blur(${(1 - b.parallax) * 2}px)">${svgOf(b, w, b.heightPx)}${svgOf(b, w, b.heightPx)}</div>`;
    })
    .join('');
  // vật thể trên đáy
  let x = 20;
  let props = '';
  const list = [...env.props];
  for (let i = 0; x < W - 60; i++) {
    const p = list[i % list.length];
    const h = p.heightPx;
    const w = (p.viewBox[0] / p.viewBox[1]) * h;
    props += `<div style="position:absolute;left:${x}px;top:${groundY - h + 8}px">${svgOf(p, w, h)}</div>`;
    x += w * 0.7 + 10;
  }
  const diver = `<div style="position:absolute;left:700px;top:${groundY - 300}px;width:150px;height:46px;border:2px dashed #fff;border-radius:20px;color:#fff;font:12px sans-serif;text-align:center;line-height:46px">thợ lặn ~150px</div>`;
  const seabed = `<div style="position:absolute;left:0;top:${groundY}px;width:${W}px;height:${H - groundY}px;background:linear-gradient(${env.seabed.top},${env.seabed.bottom})"></div>`;
  const table = [...env.props, ...(env.foreground ?? [])]
    .map((p: PropArt) => {
      const h = 150;
      const w = Math.min(260, (p.viewBox[0] / p.viewBox[1]) * h);
      return `<div style="background:#0d2a40;border-radius:8px;padding:6px;color:#cde;font:12px sans-serif">${svgOf(p, w, h)}<br>${p.id} · ${p.kind} · ${p.heightPx}px${p.sway ? ' · sway ' + p.sway : ''}</div>`;
    })
    .join('');
  const html = `<!doctype html><html><body style="margin:0;background:#061524;width:${W}px">
  <div style="position:relative;width:${W}px;height:${H}px;overflow:hidden;background:linear-gradient(${water.shallow},${water.deep})">${backs}${seabed}${props}${diver}</div>
  <div style="display:flex;flex-wrap:wrap;gap:8px;padding:10px">${table}</div></body></html>`;
  let browser;
  for (const channel of ['msedge', 'chrome']) {
    try {
      browser = await chromium.launch({ channel, headless: true });
      break;
    } catch {
      /* thử kênh khác */
    }
  }
  if (!browser) browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: 900 } });
  await page.setContent(html, { waitUntil: 'load' });
  mkdirSync(join(ROOT, 'preview/env'), { recursive: true });
  const out = join(ROOT, 'preview/env', `${region}.png`);
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log('✔', out);
}
main();
