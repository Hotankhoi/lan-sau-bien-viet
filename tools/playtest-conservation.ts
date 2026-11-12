/**
 * Chơi thử phần bảo tồn: Sổ tay (tab Cần bảo vệ, thẻ loài thường + loài Sách Đỏ, bảng hệ sinh thái)
 * và thẻ ghi nhận loài cần bảo vệ. Cần `npm run dev` đang chạy.
 *   npx tsx tools/playtest-conservation.ts        (W=, H= để đổi kích thước màn hình; TAG= hậu tố tên ảnh)
 */
import { chromium, type Browser, type Page } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const URL = process.env.URL ?? 'http://127.0.0.1:5173/lan-sau-bien-viet/';
const OUT = process.env.PT_OUT ?? join(process.cwd(), 'preview', 'screens');
const W = Number(process.env.W ?? 1366);
const H = Number(process.env.H ?? 768);
const TAG = process.env.TAG ?? '';
mkdirSync(OUT, { recursive: true });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errors: string[] = [];
const problems: string[] = [];

const SEED = ['ca_khoang_co', 'ca_buom_chi', 'ca_mao_tien', 'ca_ngua_den', 'trai_tai_tuong', 'ca_napoleon', 'rua_doi_moi', 'sam_bien', 'hai_sam_den', 'rua_da', 'hai_sam_vu', 'oc_anh_vu'];

async function shot(page: Page, name: string) {
  await page.screenshot({ path: join(OUT, `${name}${TAG}.png`) });
  console.log('📸', name + TAG);
}

/** Tìm chữ bị tràn khỏi khung: phần tử chữ vượt mép trái/phải khung chứa, hoặc khung bị cuộn ngang. */
async function overflow(page: Page, sel: string, label: string) {
  const res = await page.evaluate((sel) => {
    const box = document.querySelector(sel) as HTMLElement | null;
    if (!box) return ['không thấy ' + sel];
    const out: string[] = [];
    for (const e of [box, ...Array.from(box.querySelectorAll<HTMLElement>('*'))]) {
      const cs = getComputedStyle(e);
      if (/(auto|scroll|hidden)/.test(cs.overflowX) && e.scrollWidth > e.clientWidth + 2 && !e.matches('.thumb, .bigart, .p-photo, .bar')) out.push(`tràn ngang: <${e.tagName.toLowerCase()} class="${e.className}"> ${e.scrollWidth}>${e.clientWidth}`);
    }
    const b = box.getBoundingClientRect();
    for (const e of Array.from(box.querySelectorAll<HTMLElement>('p,h2,h3,h4,b,span,button,div'))) {
      if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())) continue;
      const r = e.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.right > b.right + 1 || r.left < b.left - 1) out.push(`vượt khung: "${e.textContent!.trim().slice(0, 40)}"`);
    }
    return out;
  }, sel);
  if (res.length) problems.push(...res.map((r) => `[${label}] ${r}`));
  console.log(res.length ? `✗ ${label}: ${res.length} chỗ tràn` : `✓ ${label}: không tràn khung`);
}

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

async function main() {
  const browser = await launch();
  const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(URL);
  await page.evaluate((ids) => {
    const k = 'lan-sau-save-v1';
    const d = JSON.parse(localStorage.getItem(k) ?? '{}');
    localStorage.setItem(k, JSON.stringify({ ...d, tutorialDone: true, species: Object.fromEntries(ids.map((id) => [id, { count: 2, bestStars: 2, firstSeen: 0 }])) }));
  }, SEED);
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('.loading'), null, { timeout: 60000 });
  await sleep(1500);

  // phông Việt đã tải đủ dấu?
  const font = await page.evaluate(() => document.fonts.check('16px "Be Vietnam Pro"', 'Nhận dạng Vai trò hệ sinh thái Biển Đông Sách Đỏ ệẫỡựữ'));
  console.log(font ? '✓ Phông Be Vietnam Pro đã tải (đủ dấu tiếng Việt)' : '✗ Phông Be Vietnam Pro CHƯA tải');
  if (!font) problems.push('phông chưa tải');

  await page.getByText('📖 Sổ tay').first().click();
  await sleep(900);
  await shot(page, '70-journal-all');

  await page.locator('.tab.protect').click();
  await sleep(700);
  const banner = (await page.locator('.protect-banner b').textContent()) ?? '';
  console.log('Thanh tiến độ:', banner);
  if (!/^Đã ghi nhận \d+\/\d+ loài cần được bảo vệ$/.test(banner)) problems.push('sai chữ thanh tiến độ: ' + banner);
  await shot(page, '71-journal-protect');
  await overflow(page, '.journal', 'tab Cần bảo vệ');

  // loài thường
  await page.locator('.tab').first().click();
  await sleep(500);
  await page.locator('.scard[aria-label="Cá khoang cổ (cá hề)"]').click();
  await sleep(1100);
  if (await page.locator('.detail .badge.redbook').count()) problems.push('loài thường lại có huy hiệu Sách Đỏ');
  for (const t of ['🔎 Nhận dạng', '🌏 Vai trò trong hệ sinh thái Biển Đông']) if (!(await page.locator('.detail h4', { hasText: t }).count())) problems.push('thiếu mục ' + t);
  await shot(page, '72-detail-normal');
  await overflow(page, '.detail .sheet', 'thẻ cá khoang cổ');
  await page.locator('.detail .right .btn.icon').click();
  await sleep(300);

  // loài Sách Đỏ
  await page.locator('.scard[aria-label="Cá ngựa đen"]').click();
  await sleep(1100);
  await page.locator('.detail .badge.redbook').click();
  await sleep(300);
  const rb = await page.locator('.box-redbook').isVisible();
  console.log(rb ? '✓ Bấm huy hiệu Sách Đỏ hiện giải thích' : '✗ Giải thích Sách Đỏ không hiện');
  if (!rb) problems.push('giải thích Sách Đỏ không hiện');
  await shot(page, '73-detail-redbook');
  await overflow(page, '.detail .sheet', 'thẻ cá ngựa đen');
  await page.locator('.detail .eco-chip').click();
  await sleep(500);
  await shot(page, '74-eco-popup');
  await overflow(page, '.eco-panel', 'bảng hệ sinh thái');
  // nút phụ của bảng hệ sinh thái → màn "Biển Đông cần chúng" cuộn tới hệ đó
  await page.getByText('Xem các loài của hệ này').click();
  await sleep(700);
  if (!(await page.locator('.seaneeds').count())) problems.push('nút “Xem các loài của hệ này” không mở màn Biển Đông');
  await page.keyboard.press('Escape');
  await sleep(300);

  // màn "Biển Đông cần chúng" mở từ Sổ tay
  await page.locator('.sea-btn').click();
  await sleep(800);
  const cards = await page.locator('.eco-card').count();
  const quote = (await page.locator('.sn-quote').textContent()) ?? '';
  console.log(`Màn Biển Đông: ${cards} thẻ hệ sinh thái; câu cuối: “${quote}”`);
  if (cards !== 4) problems.push(`màn Biển Đông có ${cards} thẻ (cần 4)`);
  if (quote !== 'Mỗi loài là một mắt xích. Mất một mắt xích, cả chuỗi sẽ lung lay.') problems.push('sai câu cuối màn Biển Đông');
  const red = await page.locator('.ec-tile.redbook').count();
  const unk = await page.locator('.ec-tile.unknown').count();
  console.log(`  ô Sách Đỏ (viền đỏ son): ${red}; ô chưa gặp (bóng đen): ${unk}`);
  await shot(page, '76-sea-needs');
  await overflow(page, '.sn-body', 'màn Biển Đông cần chúng');
  await page.locator('.sn-body').evaluate((e) => e.scrollTo(0, e.scrollHeight));
  await sleep(400);
  await shot(page, '77-sea-needs-end');
  await page.locator('.ec-tile.redbook:not(.unknown)').first().click();
  await sleep(900);
  if (!(await page.locator('.detail').count())) problems.push('bấm ô loài đã gặp không mở thẻ chi tiết');
  await page.keyboard.press('Escape');
  await sleep(300);
  if (await page.locator('.detail').count()) problems.push('Esc không đóng thẻ chi tiết');
  await page.keyboard.press('Escape');
  await sleep(300);
  if (await page.locator('.seaneeds').count()) problems.push('Esc không đóng màn Biển Đông');
  if (!(await page.locator('.journal').count())) problems.push('Esc đóng luôn cả Sổ tay (cần quay về Sổ tay)');
  else console.log('✓ Esc đóng lần lượt: thẻ chi tiết → màn Biển Đông → còn Sổ tay');

  // thẻ loài mới (rùa da, có trong Sách Đỏ)
  await page.locator('.tab').first().click();
  await sleep(400);
  await page.locator('.scard[aria-label="Rùa da"]').click();
  await sleep(1100);
  await shot(page, '78-detail-rua-da');
  await overflow(page, '.detail .sheet', 'thẻ rùa da');
  await page.keyboard.press('Escape');
  await page.locator('.topbar .btn.icon').first().click();
  await sleep(400);

  // thẻ ghi nhận loài cần bảo vệ (giả lập một bức ảnh vừa chụp)
  await page.getByText('🤿 Lặn ngay').click();
  await sleep(500);
  await page.locator('.tier-btn').first().click();
  await page.waitForFunction(() => !document.querySelector('.loading'), null, { timeout: 120000 });
  await sleep(1200);
  await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = 180;
    const g = c.getContext('2d')!;
    const gr = g.createLinearGradient(0, 0, 0, 180);
    gr.addColorStop(0, '#3fc1d9');
    gr.addColorStop(1, '#064066');
    g.fillStyle = gr;
    g.fillRect(0, 0, 320, 180);
    const w = window as unknown as { __bus: { emit: (e: string, p: unknown) => void } };
    w.__bus.emit('photo', { speciesId: 'ca_vet_dau_gu', stars: 3, points: 60, isNew: true, photo: c.toDataURL('image/jpeg', 0.8), quality: 1 });
  });
  await sleep(2600);
  const pc = await page.locator('.discover.protect').count();
  console.log(pc ? '✓ Hiện thẻ đặc biệt viền đỏ son' : '✗ Không thấy thẻ loài cần bảo vệ');
  if (!pc) problems.push('không hiện thẻ bảo vệ');
  await shot(page, '75-protect-card');
  await overflow(page, '.pcard', 'thẻ loài cần bảo vệ');
  await page.getByText('Tôi sẽ bảo vệ loài này').click();
  await sleep(400);
  if (await page.locator('.discover.protect').count()) problems.push('nút “Tôi sẽ bảo vệ loài này” không đóng thẻ');
  else console.log('✓ Nút “Tôi sẽ bảo vệ loài này” đóng thẻ');

  await browser.close();
  errors.forEach((e) => console.log('Lỗi trang:', e));
  problems.forEach((p) => console.log('✗', p));
  console.log(errors.length || problems.length ? `${errors.length} lỗi trang, ${problems.length} vấn đề` : 'Không có lỗi trong trang, không có vấn đề.');
  process.exit(errors.length || problems.length ? 1 : 0);
}
main();
