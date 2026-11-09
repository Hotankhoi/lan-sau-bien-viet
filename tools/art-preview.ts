/**
 * Công cụ xem trước hình sinh vật.
 *   npm run art:preview                 → render mọi loài đã có file + ghép preview/contact-sheet.png
 *   npm run art:preview -- ca_mao_tien  → chỉ render preview/species/ca_mao_tien.png (KHÔNG ghi contact sheet)
 *   npm run art:preview -- --sheet      → chỉ ghép contact sheet
 * Dùng trình duyệt Edge/Chrome có sẵn trên máy (playwright-core, không tải trình duyệt).
 */
import { chromium, type Browser } from 'playwright-core';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { composeSvg, displayLengthFor, isBending, orderLayers, type CreatureArt } from '../src/art/contract';
import { REGION_WATER } from '../src/art/style-bible';
import speciesList from '../src/data/species.json';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SPECIES_DIR = join(ROOT, 'src', 'art', 'species');
const OUT_DIR = join(ROOT, 'preview');
const OUT_SPECIES = join(OUT_DIR, 'species');

type Species = (typeof speciesList)[number];
const byId = new Map<string, Species>(speciesList.map((s) => [s.id, s]));

async function loadArt(id: string): Promise<CreatureArt | null> {
  const file = join(SPECIES_DIR, `${id}.ts`);
  if (!existsSync(file)) return null;
  const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
  return (mod.default ?? mod.art) as CreatureArt;
}

async function launch(): Promise<Browser> {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      /* thử kênh khác */
    }
  }
  return chromium.launch({ headless: true });
}

/** Ảnh tham khảo (references/<id>/ref*.jpg) để đặt cạnh hình vẽ – chỉ dùng trong preview. */
function refImages(id: string): string {
  const dir = join(ROOT, 'references', id);
  if (!existsSync(dir)) return '';
  return readdirSync(dir)
    .filter((f) => /^ref\d+\.(jpg|png)$/.test(f))
    .slice(0, 5)
    .map((f) => {
      const b64 = readFileSync(join(dir, f)).toString('base64');
      return `<img src="data:image/${f.endsWith('png') ? 'png' : 'jpeg'};base64,${b64}">`;
    })
    .join('');
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function waterBg(region: string, tier: number) {
  const w = REGION_WATER[region] ?? REGION_WATER.mien_trung;
  const top = tier === 1 ? w.shallow : tier === 2 ? w.deep : '#020814';
  const bot = tier === 1 ? w.deep : tier === 2 ? '#04101f' : '#000000';
  return `linear-gradient(180deg, ${top}, ${bot})`;
}

function speciesPage(art: CreatureArt, sp: Species | undefined): string {
  const [vw, vh] = art.viewBox;
  const big = composeSvg(art, { mode: 'card', width: 980, height: Math.round((980 * vh) / vw) });
  const alarmed = art.layers.some((l) => l.role === 'alarm')
    ? composeSvg(art, { mode: 'card', width: 480, height: Math.round((480 * vh) / vw), alarm: 1 })
    : '';
  const hz = art.cycleHz ?? 1;
  const frames = [0, 0.25, 0.5, 0.75]
    .map((f) => composeSvg(art, { mode: 'game', width: 230, height: Math.round((230 * vh) / vw), animate: true, t: f / hz }))
    .map((s) => `<div class="frame">${s}</div>`)
    .join('');
  const gameLen = displayLengthFor(sp?.sizeCm ?? 40, art);
  const gameW = Math.round((gameLen / art.lengthUnits) * vw);
  const gameH = Math.round((gameW * vh) / vw);
  const game1 = composeSvg(art, { mode: 'game', width: gameW, height: gameH });
  const layers = orderLayers(art, 'card')
    .map((l) => {
      const one: CreatureArt = { ...art, layers: [l] };
      let svg = composeSvg(one, { mode: 'card', width: 150, height: Math.round((150 * vh) / vw), alarm: 1 });
      if (l.pivot) {
        const dot = `<circle cx="${l.pivot[0]}" cy="${l.pivot[1]}" r="${vw / 70}" fill="#ff2d55" stroke="#fff" stroke-width="${vw / 300}"/>`;
        svg = svg.replace(/<\/svg>$/, dot + '</svg>');
      }
      return `<div class="layer"><div class="lw">${svg}</div><div class="ln">${esc(l.name)} · ${l.role}${isBending(l) ? ' · uốn' : ''}${l.anim ? ' · ' + l.anim.type : ''}${l.cardOnly ? ' · thẻ' : ''}${l.gameOnly ? ' · game' : ''}</div></div>`;
    })
    .join('');
  const bg = waterBg(sp?.region ?? 'mien_trung', sp?.tier ?? 1);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;font-family:'Segoe UI',system-ui,sans-serif;background:#071a2b;color:#eaf6ff;width:1280px}
  .hd{padding:18px 26px 6px}.hd h1{margin:0;font-size:30px}.hd i{color:#9fd8ff}
  .vis{font-size:15px;color:#cfe6f5;max-width:1200px;line-height:1.45;margin:6px 0 0}
  .stage{margin:12px 26px;border-radius:18px;background:${bg};display:flex;justify-content:center;padding:10px;position:relative}
  .row{display:flex;gap:14px;margin:0 26px 12px;align-items:flex-end;flex-wrap:wrap}
  .frame,.g1{background:${bg};border-radius:12px;padding:6px}
  .lbl{font-size:13px;color:#8fb8d0;margin:4px 26px}
  .layers{display:flex;flex-wrap:wrap;gap:8px;margin:0 26px 20px}
  .layer{background:#0d2a40;border-radius:8px;padding:4px;width:158px}
  .lw{background:repeating-conic-gradient(#183a54 0 25%,#123049 0 50%) 0 0/16px 16px;border-radius:6px}
  .ln{font-size:11px;color:#b9d6e8;padding:2px}
  .refs{display:flex;gap:8px;margin:0 26px 12px;flex-wrap:wrap}.refs img{height:200px;border-radius:8px}
  </style></head><body>
  <div class="hd"><h1>${esc(sp?.nameVi ?? art.id)} <i>${esc(sp?.nameSci ?? '')}</i></h1>
  <p class="vis">${esc(sp?.visual ?? '')}</p></div>
  <div class="stage">${big}</div>
  <div class="lbl">Khung hình động (4 pha) · kích thước trong game ≈ ${gameLen}px · đỏ = pivot</div>
  <div class="row">${frames}<div class="g1">${game1}</div>${alarmed ? `<div class="g1">${alarmed}</div>` : ''}</div>
  ${refImages(art.id) ? `<div class="lbl">Ảnh tham khảo (Wikimedia Commons – chỉ để so sánh, không dùng trong game)</div><div class="refs">${refImages(art.id)}</div>` : ''}
  <div class="lbl">Các lớp (thứ tự vẽ thật)</div>
  <div class="layers">${layers}</div>
  </body></html>`;
}

function sheetPage(items: { art: CreatureArt; sp?: Species }[]): string {
  const cells = items
    .map(({ art, sp }) => {
      const [vw, vh] = art.viewBox;
      const h = 170;
      const w = Math.min(280, Math.round((h * vw) / vh));
      const svg = composeSvg(art, { mode: 'card', width: w, height: Math.round((w * vh) / vw) });
      return `<div class="c" style="background:${waterBg(sp?.region ?? 'mien_trung', sp?.tier ?? 1)}"><div class="s">${svg}</div><div class="n">${esc(sp?.nameVi ?? art.id)}${art.placeholder ? ' (TẠM)' : ''}</div><div class="m">${sp?.region ?? ''} · T${sp?.tier ?? ''}</div></div>`;
    })
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#061524;font-family:'Segoe UI',system-ui,sans-serif;color:#eaf6ff;width:1840px;padding:20px;box-sizing:border-box}
  h1{margin:0 0 14px;font-size:26px}
  .g{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}
  .c{border-radius:14px;padding:8px;height:250px;display:flex;flex-direction:column;align-items:center;justify-content:space-between}
  .s{flex:1;display:flex;align-items:center;justify-content:center}
  .n{font-weight:600;font-size:16px;text-shadow:0 1px 3px #000}.m{font-size:12px;color:#cde}
  </style></head><body><h1>Lặn Sâu – Sổ tay Biển Việt · Contact sheet (${items.length} loài)</h1><div class="g">${cells}</div></body></html>`;
}

async function main() {
  const args = process.argv.slice(2);
  const sheetOnly = args.includes('--sheet');
  const ids = args.filter((a) => !a.startsWith('--'));
  mkdirSync(OUT_SPECIES, { recursive: true });
  const allFiles = readdirSync(SPECIES_DIR)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .map((f) => f.replace(/\.ts$/, ''));
  const targets = ids.length ? ids : allFiles;
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const loaded: { art: CreatureArt; sp?: Species }[] = [];
  for (const id of targets) {
    try {
      const art = await loadArt(id);
      if (!art) {
        console.warn(`[bỏ qua] chưa có src/art/species/${id}.ts`);
        continue;
      }
      if (art.id !== id) console.warn(`[CẢNH BÁO] ${id}.ts có art.id = "${art.id}"`);
      const sp = byId.get(id);
      if (!sp) console.warn(`[CẢNH BÁO] ${id} không có trong species.json`);
      loaded.push({ art, sp });
      if (!sheetOnly) {
        await page.setContent(speciesPage(art, sp), { waitUntil: 'load' });
        const out = join(OUT_SPECIES, `${id}.png`);
        await page.screenshot({ path: out, fullPage: true });
        console.log(`✔ ${out}`);
      }
    } catch (e) {
      console.error(`✘ ${id}:`, e);
      process.exitCode = 1;
    }
  }
  if (!ids.length || sheetOnly) {
    // sắp theo thứ tự trong species.json
    const order = new Map(speciesList.map((s, i) => [s.id, i]));
    loaded.sort((a, b) => (order.get(a.art.id) ?? 999) - (order.get(b.art.id) ?? 999));
    await page.setViewportSize({ width: 1840, height: 1000 });
    await page.setContent(sheetPage(loaded), { waitUntil: 'load' });
    const out = join(OUT_DIR, 'contact-sheet.png');
    await page.screenshot({ path: out, fullPage: true });
    console.log(`✔ ${out}`);
  }
  await browser.close();
}

main();
