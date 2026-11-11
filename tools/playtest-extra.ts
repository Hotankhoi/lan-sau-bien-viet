/**
 * Kiểm tra phụ: máy tính bảng cảm ứng, trình duyệt chặn localStorage, chất lượng Thấp.
 *   npx tsx tools/playtest-extra.ts      (cần npm run dev đang chạy)
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const URL = process.env.URL ?? 'http://127.0.0.1:5173/lan-sau-bien-viet/';
const OUT = process.env.PT_OUT ?? join(process.cwd(), 'preview', 'screens');
mkdirSync(OUT, { recursive: true });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  let browser;
  const args = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'];
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true, args });
  } catch {
    browser = await chromium.launch({ channel: 'chrome', headless: true, args });
  }
  const errors: string[] = [];
  const ready = async (page: import('playwright-core').Page) => {
    await page.waitForFunction(() => !document.querySelector('.loading') && !!document.querySelector('#ui')?.textContent, null, { timeout: 90000 });
    await sleep(900);
  };

  // 1) Máy tính bảng cảm ứng 1024×768
  {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push('[tablet] ' + e));
    await page.addInitScript(() => localStorage.setItem('lan-sau-save-v1', JSON.stringify({ tutorialDone: true })));
    await page.goto(URL);
    await ready(page);
    await page.getByText('🤿 Lặn ngay').tap();
    await sleep(500);
    await page.screenshot({ path: join(OUT, '40-tablet-map.png') });
    await page.locator('.tier-btn').first().tap();
    await ready(page);
    const hasJoy = await page.locator('.joy').count();
    const hasCam = await page.locator('.tbtn.cam').count();
    console.log('Cảm ứng: joystick =', hasJoy > 0, '· nút chụp =', hasCam > 0);
    // kéo joystick sang phải-xuống 1,5 giây
    const box = await page.locator('.joy').boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      const x0 = await page.evaluate(() => (window as any).__game.scene.getScene('Dive').dx);
      await page.locator('.joy').dispatchEvent('pointerdown', { pointerId: 5, pointerType: 'touch', clientX: cx, clientY: cy, bubbles: true });
      await page.locator('.joy').dispatchEvent('pointermove', { pointerId: 5, pointerType: 'touch', clientX: cx + 55, clientY: cy + 30, bubbles: true });
      await sleep(1600);
      const x1 = await page.evaluate(() => (window as any).__game.scene.getScene('Dive').dx);
      console.log('Joystick làm thợ lặn di chuyển:', x1 - x0 > 40, `(${Math.round(x1 - x0)} px)`);
      await page.locator('.tbtn.cam').dispatchEvent('pointerdown', { pointerId: 6, pointerType: 'touch', bubbles: true });
      await sleep(700);
      await page.screenshot({ path: join(OUT, '41-tablet-dive-aim.png') });
      await page.locator('.tbtn.cam').dispatchEvent('pointerup', { pointerId: 6, pointerType: 'touch', bubbles: true });
      await page.locator('.joy').dispatchEvent('pointerup', { pointerId: 5, pointerType: 'touch', bubbles: true });
      await sleep(600);
      const photos = await page.evaluate(() => (window as any).__game.scene.getScene('Dive').session.photos.length);
      console.log('Thả nút chụp → đã chụp:', photos > 0);
    }
    await ctx.close();
  }

  // 2) Trình duyệt chặn localStorage
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push('[no-storage] ' + e));
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('SecurityError: storage blocked');
        },
      });
    });
    await page.goto(URL);
    await ready(page);
    const ok = (await page.getByText('🤿 Lặn ngay').count()) > 0;
    console.log('Chặn localStorage → game vẫn khởi động:', ok);
    await page.getByText('🤿 Lặn ngay').click();
    await sleep(400);
    await page.locator('.tier-btn').first().click();
    await ready(page);
    await sleep(800);
    await page.screenshot({ path: join(OUT, '42-no-storage-dive.png') });
    await ctx.close();
  }

  // 3) Chất lượng Thấp
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push('[low] ' + e));
    await page.addInitScript(() => localStorage.setItem('lan-sau-save-v1', JSON.stringify({ tutorialDone: true, settings: { volume: 0.8, music: 0.6, quality: 'low', tutorial: false } })));
    await page.goto(URL);
    await ready(page);
    await page.getByText('🤿 Lặn ngay').click();
    await sleep(400);
    await page.locator('.tier-btn').first().click();
    await ready(page);
    await sleep(2500);
    const fps = await page.evaluate(() => (window as any).__game.loop.actualFps);
    console.log('Chất lượng Thấp – FPS (headless, tham khảo):', fps.toFixed(1));
    await page.screenshot({ path: join(OUT, '43-low-quality-dive.png') });
    await ctx.close();
  }
  if (errors.length) for (const e of [...new Set(errors)].slice(0, 15)) console.log(' ✗', e.slice(0, 300));
  else console.log('Không có lỗi trong trang.');
  await browser.close();
}
main().catch((e) => {
  console.error(String(e).slice(0, 500));
  process.exit(1);
});
