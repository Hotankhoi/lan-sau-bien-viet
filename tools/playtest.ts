/**
 * Chơi thử tự động bằng trình duyệt không giao diện (Edge/Chrome có sẵn trên máy).
 * Cần dev server đang chạy (npm run dev). Ảnh chụp lưu vào preview/screens/.
 *   npx tsx tools/playtest.ts [kịch bản]   (mặc định: all)
 */
import { chromium, type Browser, type Page } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const URL = process.env.URL ?? 'http://127.0.0.1:5173/';
const OUT = process.env.PT_OUT ?? join(process.cwd(), 'preview', 'screens');
mkdirSync(OUT, { recursive: true });

async function launch(): Promise<Browser> {
  const args = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'];
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless: true, args });
    } catch {
      /* thử kênh khác */
    }
  }
  return chromium.launch({ headless: true, args });
}

const errors: string[] = [];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function shot(page: Page, name: string) {
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log('📸', name);
}

async function waitReady(page: Page, timeout = 60000) {
  await page.waitForFunction(() => !document.querySelector('.loading'), null, { timeout });
  await sleep(600);
}

async function hold(page: Page, key: string, ms: number) {
  await page.keyboard.down(key);
  await sleep(ms);
  await page.keyboard.up(key);
}

async function main() {
  const which = process.argv[2] ?? 'all';
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(URL);
  // bỏ hướng dẫn cho ảnh chụp sạch (trừ kịch bản tutorial); REGION=khoi_xa mở khoá mọi thứ để thử
  if (which !== 'tutorial') {
    await page.evaluate((unlock) => {
      const k = 'lan-sau-save-v1';
      const d = JSON.parse(localStorage.getItem(k) ?? '{}');
      const extra = unlock
        ? { upgrades: { tank: 3, fins: 2, macro: 1, scanner: 1, lamp: 1, sub: 1 }, research: 5000, species: Object.fromEntries(Array.from({ length: 30 }, (_, i) => ['test_' + i, { count: 1, bestStars: 1, firstSeen: 0 }])) }
        : {};
      localStorage.setItem(k, JSON.stringify({ ...d, tutorialDone: true, ...extra }));
    }, !!process.env.REGION);
    await page.reload();
  }
  await waitReady(page);
  await sleep(1500);
  await shot(page, '01-title');

  if (which === 'all' || which === 'ui') {
    await page.getByText('📖 Sổ tay').first().click();
    await sleep(800);
    await shot(page, '02-journal');
    await page.keyboard.press('Escape');
    await sleep(400);
    await page.getByText('🤿 Lặn ngay').click();
    await sleep(800);
    await shot(page, '03-map');
    await page.locator('.topbar .btn.icon').first().click();
    await sleep(300);
    await page.getByText('🛠️ Nâng cấp').click();
    await sleep(500);
    await shot(page, '04-upgrades');
    await page.locator('.topbar .btn.icon').first().click();
    await page.getByText('📚 Nguồn dữ liệu').click();
    await sleep(400);
    await shot(page, '05-credits');
    await page.locator('.topbar .btn.icon').first().click();
    await sleep(300);
  }

  if (which === 'all' || which === 'dive' || which === 'tutorial') {
    const tier = process.env.TIER ?? '1';
    await page.getByText('🤿 Lặn ngay').click();
    await sleep(500);
    if (process.env.REGION) {
      const names: Record<string, string> = { bac_bo: 'Bắc Bộ', mien_nam: 'Miền Nam', khoi_xa: 'Khơi xa', mien_trung: 'Miền Trung' };
      await page.locator('.spot').filter({ hasText: names[process.env.REGION] }).click();
      await sleep(300);
    }
    const t0 = Date.now();
    await page.locator('.tier-btn').nth(Number(tier) - 1).click();
    await waitReady(page, 120000);
    console.log(`Thời gian tải lượt lặn: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    await sleep(800);
    await shot(page, `10-dive-t${tier}-start`);
    await hold(page, 'KeyD', 1600);
    await hold(page, 'KeyS', 1400);
    await sleep(800);
    await shot(page, `11-dive-t${tier}-swim`);
    await hold(page, 'KeyD', 2500);
    await sleep(500);
    await shot(page, `12-dive-t${tier}-reef`);
    await page.keyboard.down('Space');
    await sleep(900);
    await shot(page, `13-dive-t${tier}-aim`);
    await page.keyboard.up('Space');
    await sleep(700);
    await shot(page, `14-dive-t${tier}-photo`);
    const fps = await page.evaluate(() => (window as unknown as { __game: { loop: { actualFps: number } } }).__game.loop.actualFps);
    console.log('FPS (headless, tham khảo):', fps.toFixed(1));
    await page.keyboard.press('KeyF');
    await sleep(600);
    await shot(page, `15-dive-t${tier}-lamp`);
    await page.keyboard.down('KeyQ');
    await sleep(1300);
    await page.keyboard.up('KeyQ');
    await sleep(2500);
    await shot(page, `16-summary`);
  }
  if (errors.length) {
    console.log('\n⚠ Lỗi trong trang:');
    for (const e of [...new Set(errors)].slice(0, 20)) console.log(' -', e.slice(0, 400));
  } else console.log('Không có lỗi trong trang.');
  await browser.close();
}

main().catch((e) => {
  console.error(String(e).slice(0, 300));
  for (const x of [...new Set(errors)].slice(0, 20)) console.log(' -', x.slice(0, 400));
  process.exit(1);
});
