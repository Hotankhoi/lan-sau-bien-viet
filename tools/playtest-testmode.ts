/**
 * Chơi thử Chế độ kiểm thử (?test=1) và xác nhận tiến trình thật không bị đụng tới.
 * Cần `npm run dev` đang chạy.   npx tsx tools/playtest-testmode.ts
 */
import { chromium, type Browser, type Page } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.URL ?? 'http://127.0.0.1:5173/lan-sau-bien-viet/';
const OUT = process.env.PT_OUT ?? join(process.cwd(), 'preview', 'screens');
mkdirSync(OUT, { recursive: true });
const REAL = 'lan-sau-save-v1';
const TEST = REAL + '_test';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errors: string[] = [];
const problems: string[] = [];
const ok = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) problems.push(msg);
};
const species = JSON.parse(readFileSync(join(process.cwd(), 'src/data/species.json'), 'utf8')) as { id: string; region: string; tier: number; nameVi: string }[];

async function launch(): Promise<Browser> {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
    } catch {
      /* thử kênh khác */
    }
  }
  return chromium.launch({ headless: true });
}
const ready = (page: Page, ms = 120000) => page.waitForFunction(`!document.querySelector('.loading')`, null, { timeout: ms });
const shot = async (page: Page, name: string) => {
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log('📸', name);
};
const openPanel = async (page: Page) => {
  if (await page.locator('.test-panel').isHidden()) await page.keyboard.press('F9');
  await sleep(200);
};
/** đếm số con của một loài trong cảnh lặn */
const countOf = (page: Page, id: string) => page.evaluate(`window.__game.scene.getScene('Dive').creatures.filter((c) => c.sp.id === ${JSON.stringify(id)}).length`) as Promise<number>;

/** ngắm vào con vừa gọi rồi chụp (chuột phải giữ để ngắm, chuột trái để chụp) */
async function photograph(page: Page, id: string) {
  await page.evaluate(`(() => {
    const sc = window.__game.scene.getScene('Dive');
    const c = sc.creatures.filter((q) => q.sp.id === ${JSON.stringify(id)}).pop();
    sc.dx = c.x - 230; sc.dy = c.y - 10; sc.dvx = 0; sc.dvy = 0;
    sc.cameras.main.centerOn(sc.dx, sc.dy);
  })()`);
  await sleep(700);
  const pos = (await page.evaluate(`(() => {
    const sc = window.__game.scene.getScene('Dive');
    const c = sc.creatures.filter((q) => q.sp.id === ${JSON.stringify(id)}).pop();
    const cam = sc.cameras.main; const k = sc.scale.width / innerWidth;
    return { x: ((c.x - cam.worldView.x) * cam.zoom) / k, y: ((c.y - cam.worldView.y) * cam.zoom) / k };
  })()`)) as { x: number; y: number };
  await page.mouse.move(pos.x, pos.y);
  await page.mouse.down({ button: 'right' });
  await sleep(1000);
  await page.mouse.down({ button: 'left' });
  await page.mouse.up({ button: 'left' });
  await page.mouse.up({ button: 'right' });
}

async function main() {
  const browser = await launch();
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  // ---- 1. tiến trình "thật" mẫu ----
  await page.goto(BASE);
  const realSave = JSON.stringify({
    version: 1, research: 4321, researchTotal: 5000, green: 17, tutorialDone: true, upgrades: { tank: 1 }, achievements: { first_dive: 1, anemone_friend: 1 },
    species: { ca_khoang_co: { count: 2, bestStars: 2, firstSeen: 1 }, ca_mao_tien: { count: 1, bestStars: 1, firstSeen: 2 } },
    stats: { dives: 3, divesByRegion: { mien_trung: 3 }, trashTotal: 4, noCoralStreak: 1, touchedDanger: [], scanned: [], deepestTier: 1, photos: 3 },
  });
  await page.evaluate(([k, t, v]) => {
    localStorage.setItem(k, v);
    localStorage.removeItem(t);
    localStorage.removeItem('lan-sau-test-opts');
  }, [REAL, TEST, realSave]);
  const realBefore = (await page.evaluate((k) => localStorage.getItem(k), REAL))!;

  // ---- 2. mở ?test=1 ----
  const t0 = Date.now();
  await page.goto(BASE + '?test=1');
  await ready(page);
  await sleep(800);
  ok(await page.locator('.test-banner', { hasText: 'CHẾ ĐỘ KIỂM THỬ' }).isVisible(), 'Có dải cam “CHẾ ĐỘ KIỂM THỬ”');
  ok((await page.locator('.title-foot').textContent())!.includes(`${species.length}/${species.length} loài`), `Màn tiêu đề: ${species.length}/${species.length} loài đã ghi nhận`);
  await shot(page, '90-test-title');
  await page.waitForFunction(`(() => { const d = JSON.parse(localStorage.getItem('${TEST}') || '{}'); return d.species && Object.values(d.species).filter((r) => r.photo).length >= ${species.length}; })()`, null, { timeout: 180000 });
  console.log(`  ảnh 3★ của ${species.length} loài tạo xong sau ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  const st = (await page.evaluate(`(async () => {
    const d = JSON.parse(localStorage.getItem('${TEST}'));
    const recs = Object.values(d.species);
    let good = 0;
    for (const r of recs) { const i = new Image(); i.src = r.photo; try { await i.decode(); if (i.naturalWidth === 300) good++; } catch {} }
    return { n: recs.length, three: recs.filter((r) => r.bestStars === 3).length, good, ach: Object.keys(d.achievements).length, up: d.upgrades, research: d.research, green: d.green };
  })()`)) as { n: number; three: number; good: number; ach: number; up: Record<string, number>; research: number; green: number };
  ok(st.n === species.length && st.three === species.length, `Bộ lưu kiểm thử: ${st.n} loài, ${st.three} loài 3★`);
  ok(st.good === species.length, `Ảnh hợp lệ (300×210): ${st.good}/${species.length}`);
  ok(st.ach === 18, `Thành tựu mở khóa: ${st.ach}/18`);
  ok(st.up.tank === 3 && st.up.fins === 2 && st.up.macro === 1 && st.up.scanner === 1 && st.up.lamp === 1 && st.up.sub === 1, 'Nâng cấp tối đa: ' + JSON.stringify(st.up));
  ok(st.research >= 99999 && st.green >= 9999, `Điểm Nghiên cứu ${st.research}, Điểm Xanh ${st.green}`);
  ok((await page.evaluate((k) => localStorage.getItem(k), REAL)) === realBefore, 'Tiến trình thật không bị đổi khi mở ?test=1');

  // ---- 3. Sổ tay ----
  await page.getByText('📖 Sổ tay').first().click();
  await sleep(1200);
  const cards = await page.locator('.journal .scard').count();
  const unknown = await page.locator('.journal .scard.unknown').count();
  ok(cards === species.length && unknown === 0, `Sổ tay: ${cards} thẻ, ${unknown} thẻ chưa gặp`);
  await shot(page, '91-test-journal');
  for (const name of ['Rùa da', 'Cá nhám voi', 'Hải sâm vú']) {
    await page.locator(`.scard[aria-label="${name}"]`).click();
    await sleep(900);
    const w = await page.locator('.detail .best-photo img').evaluate((i: HTMLImageElement) => i.naturalWidth).catch(() => 0);
    ok(w === 300, `Thẻ ${name} có “Ảnh đẹp nhất của bạn” (3★)`);
    if (name === 'Rùa da') await shot(page, '92-test-detail-photo');
    await page.keyboard.press('Escape');
    await sleep(300);
  }
  await page.keyboard.press('Escape');
  await sleep(400);

  // ---- 4. chế độ lớp học: mọi vùng dùng được ----
  await page.getByText('🏫 Chế độ lớp học').click();
  await sleep(500);
  const regs = await page.locator('.class-region').count();
  const regsOff = await page.locator('.class-region[disabled]').count();
  ok(regs === 4 && regsOff === 0, `Chế độ lớp học: ${regs - regsOff}/4 vùng dùng được`);
  await page.locator('.topbar .btn.icon').first().click();
  await sleep(400);

  // ---- 5. nhảy đến từng vùng/tầng + gọi loài ----
  const combos: [string, number][] = [['bac_bo', 1], ['bac_bo', 2], ['mien_trung', 1], ['mien_trung', 2], ['mien_nam', 1], ['mien_nam', 2], ['khoi_xa', 1], ['khoi_xa', 2], ['khoi_xa', 3]];
  for (const [r, t] of combos) {
    await openPanel(page);
    await page.locator(`[data-jump="${r}:${t}"]`).click();
    await page.waitForFunction(`(() => { const sc = window.__game.scene.getScene('Dive'); return sc.params.region === '${r}' && sc.params.tier === ${t} && sc.ready && !!sc.diver; })()`, null, { timeout: 120000 }).catch(() => null);
    await ready(page);
    await sleep(1000);
    const p = (await page.evaluate(`(() => { const sc = window.__game.scene.getScene('Dive'); return { region: sc.params.region, tier: sc.params.tier, mode: sc.params.mode, ready: sc.ready, diver: !!sc.diver }; })()`)) as { region: string; tier: number; mode: string; ready: boolean; diver: boolean };
    const id = species.find((s) => s.region === r && s.tier === t)!.id;
    const before = await countOf(page, id);
    await openPanel(page);
    await page.locator('.tt-select').selectOption(id);
    await page.locator('.tt-call').click();
    await sleep(1500);
    const after = await countOf(page, id);
    ok(p.region === r && p.tier === t && p.mode === 'dive' && p.ready && p.diver && after === before + 1, `Vào ${r} Tầng ${t}, gọi được ${id} (${before} → ${after})`);
    if (r === 'khoi_xa' && t === 3) await shot(page, '93-test-summon-t3');
  }

  // ---- 6. oxy vô hạn ----
  await openPanel(page);
  await page.locator('.tt-o2').check();
  await page.keyboard.press('F9');
  await page.evaluate(`window.__game.scene.getScene('Dive').oxygen = 0.3`);
  await sleep(600);
  const o2 = (await page.evaluate(`window.__game.scene.getScene('Dive').oxygen`)) as number;
  ok(o2 === 1, `Oxy vô hạn: oxy giữ ở ${Math.round(o2 * 100)}%`);
  await openPanel(page);
  await page.locator('.tt-o2').uncheck();
  await page.keyboard.press('F9');

  // ---- 7. gọi loài Huyền thoại / Sách Đỏ → chụp → thẻ ghi nhận đặc biệt ----
  for (const [btn, cls, label, shotName] of [
    ['.tt-legend', '.discover.legend:not(.protect)', 'Huyền thoại', '94-test-legend-card'],
    ['.tt-redbook', '.discover.protect', 'Sách Đỏ', '95-test-redbook-card'],
  ] as const) {
    const ids = await page.evaluate((k) => Object.keys(JSON.parse(localStorage.getItem(k)!).species), TEST);
    await openPanel(page);
    await page.locator(btn).click();
    await sleep(2000);
    const ids2 = await page.evaluate((k) => Object.keys(JSON.parse(localStorage.getItem(k)!).species), TEST);
    const removed = ids.filter((x) => !ids2.includes(x));
    ok(removed.length === 1, `Gọi loài ${label}: ${removed[0]} được xóa khỏi Sổ tay kiểm thử`);
    if (!removed.length) continue;
    ok((await countOf(page, removed[0])) >= 1, `  ${removed[0]} xuất hiện trong lượt lặn`);
    await photograph(page, removed[0]);
    await page.waitForSelector(cls, { timeout: 8000 }).catch(() => null);
    await sleep(900);
    ok((await page.locator(cls).count()) > 0, `  chụp xong hiện thẻ ghi nhận đặc biệt (${cls})`);
    await shot(page, shotName);
    const closeBtn = page.locator(`${cls} .pledge, ${cls} .btn.primary`).first();
    if (await closeBtn.count()) await closeBtn.click();
    await sleep(600);
  }

  // ---- 8. đặt lại bộ lưu kiểm thử ----
  await openPanel(page);
  await page.locator('.tt-reset-empty').click();
  await ready(page);
  await sleep(1000);
  const empty = (await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), TEST)) as { species: object; tutorialDone: boolean; research: number };
  ok(Object.keys(empty.species).length === 0 && !empty.tutorialDone && empty.research === 0, 'Đặt lại “chưa có gì”: 0 loài, chưa xem hướng dẫn, 0 điểm');
  ok((await page.locator('.title-foot').textContent())!.includes(`0/${species.length} loài`), 'Màn tiêu đề hiện 0 loài');
  await page.getByText('🤿 Lặn ngay').click();
  await sleep(600);
  const spots = await page.locator('.spot').allTextContents();
  const locked = spots.filter((t) => t.includes('🔒')).length;
  ok(spots.length === 4 && locked === 3 && !spots.find((t) => t.includes('Miền Trung'))!.includes('🔒'), `Người chơi mới: Miền Trung mở, ${locked}/3 vùng còn lại khóa như thường`);
  await shot(page, '96-test-empty-map');
  await page.locator('.topbar .btn.icon').first().click();
  await sleep(400);
  await openPanel(page);
  await page.locator('.tt-reset-full').click();
  await sleep(800);
  ok((await page.locator('.title-foot').textContent())!.includes(`${species.length}/${species.length} loài`), 'Đặt lại “đã có tất cả”: đủ loài');
  ok((await page.evaluate((k) => localStorage.getItem(k), REAL)) === realBefore, 'Tiến trình thật vẫn nguyên sau mọi thao tác kiểm thử');

  // ---- 9. mở không có ?test=1 ----
  await page.goto(BASE);
  await ready(page);
  await sleep(1200);
  ok((await page.locator('.test-banner').count()) === 0, 'Không có ?test=1: không thấy dải cam');
  await page.keyboard.press('F9');
  await sleep(300);
  ok((await page.locator('.test-panel').count()) === 0, 'Không có ?test=1: F9 không mở bảng công cụ');
  ok((await page.locator('.title-foot').textContent())!.includes(`2/${species.length} loài`) && (await page.locator('.title-foot').textContent())!.includes('4.321'), 'Màn tiêu đề hiện đúng tiến trình thật (2 loài, 4.321 điểm)');
  const realAfter = (await page.evaluate((k) => localStorage.getItem(k), REAL))!;
  const ra = JSON.parse(realAfter);
  ok(Object.keys(ra.species).length === 2 && ra.research === 4321 && ra.upgrades.tank === 1 && Object.keys(ra.achievements).length === 2 && realAfter === realBefore, 'Tiến trình thật nguyên vẹn (2 loài, 4321 điểm, 2 thành tựu – giống hệt trước khi kiểm thử)');
  await shot(page, '97-normal-title');

  await browser.close();
  // các cảnh báo WebGL của trình duyệt không giao diện không phải lỗi game
  const real = errors.filter((e) => !/GL Driver Message|WebGL: too many errors/.test(e));
  real.forEach((e) => console.log('Lỗi console:', e));
  problems.forEach((p) => console.log('✗', p));
  console.log(real.length || problems.length ? `${real.length} lỗi console, ${problems.length} vấn đề` : 'Không có lỗi console, không có vấn đề.');
  process.exit(real.length || problems.length ? 1 : 0);
}
main();
