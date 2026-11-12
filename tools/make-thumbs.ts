/**
 * Tạo ảnh nhỏ (WebP, nền trong suốt) của mọi loài vào public/thumbs/<id>.webp cho các lưới dày đặc
 * (màn "Biển Đông cần chúng"). Vẽ sẵn lúc build nên màn hình mở ra là có ảnh ngay, không phải dựng
 * hàng chục hình SVG phức tạp trên máy người chơi.
 *   npm run art:thumbs            → tạo lại toàn bộ
 *   npm run art:thumbs -- rua_da  → chỉ một loài
 * Chạy lại sau khi sửa hình vẽ của loài.
 */
import { chromium, type Browser } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { composeSvg, type CreatureArt } from '../src/art/contract';
import speciesList from '../src/data/species.json';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'thumbs');
/** cạnh dài nhất của ảnh nhỏ (px) – ô hiển thị ~100×58 px, gấp đôi cho màn hình mật độ cao */
const BOX = 200;

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

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const ids = speciesList.map((s) => s.id).filter((id) => !only.length || only.includes(id));
  mkdirSync(OUT, { recursive: true });
  const browser = await launch();
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');
  let total = 0;
  for (const id of ids) {
    const mod = await import(pathToFileURL(join(ROOT, 'src', 'art', 'species', `${id}.ts`)).href);
    const art = (mod.default ?? mod.art) as CreatureArt;
    const [vw, vh] = art.viewBox;
    const k = Math.min(BOX / vw, BOX / vh);
    const w = Math.max(1, Math.round(vw * k));
    const hgt = Math.max(1, Math.round(vh * k));
    // vẽ to gấp 2 rồi thu nhỏ cho mịn cạnh
    const svg = composeSvg(art, { mode: 'game', alarm: 0, width: w * 2, height: hgt * 2 });
    const b64: string = await page.evaluate(
      `(async () => {
        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(${JSON.stringify(svg)});
        await img.decode();
        const c = document.createElement('canvas');
        c.width = ${w}; c.height = ${hgt};
        const g = c.getContext('2d');
        g.imageSmoothingQuality = 'high';
        g.drawImage(img, 0, 0, ${w}, ${hgt});
        return c.toDataURL('image/webp', 0.86).split(',')[1];
      })()`,
    );
    const buf = Buffer.from(b64, 'base64');
    writeFileSync(join(OUT, `${id}.webp`), buf);
    total += buf.length;
    console.log(`✓ ${id}.webp ${w}×${hgt} ${(buf.length / 1024).toFixed(1)} KB`);
  }
  await browser.close();
  console.log(`Xong ${ids.length} ảnh, tổng ${(total / 1024).toFixed(0)} KB → public/thumbs/`);
}
main();
