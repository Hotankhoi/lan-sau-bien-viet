/**
 * Lấy ẢNH THAM KHẢO từ Wikimedia Commons (mục 7.6) – CHỈ ĐỂ NHÌN, KHÔNG ĐƯA VÀO GAME.
 *
 *   npm run refs -- <id>                → tải tối đa 10 ảnh ứng viên vào references/<id>/cand/
 *                                         và ghép references/<id>/_montage.png (đánh số) để xem 1 lần
 *   npm run refs -- <id> --keep 1,4,6   → giữ các ảnh số 1,4,6 (chuyển ra references/<id>/),
 *                                         xoá phần còn lại, ghi references/<id>/credits.md
 *   npm run refs -- --credits           → gộp mọi credits.md thành references/CREDITS.md
 *                                         và bản lưu trong git: docs/THAM_KHAO_ANH.md
 * references/ nằm trong .gitignore và không bao giờ được import vào code game.
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import speciesList from '../src/data/species.json';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REF = join(ROOT, 'references');
const UA = 'LanSauEduGame/0.1 (student educational game project; reference viewing only)';
const API = 'https://commons.wikimedia.org/w/api.php';

export const CATEGORIES: Record<string, string> = {
  sa_sung: 'Sipunculus_nudus',
  sua_ro: 'Rhopilema_esculentum',
  ca_ngua_den: 'Hippocampus_kuda',
  sam_bien: 'Tachypleus_tridentatus',
  bao_ngu_chin_lo: 'Haliotis_diversicolor',
  ca_heo_trang: 'Sousa_chinensis',
  muc_ong: 'Uroteuthis_chinensis',
  ca_duoi_bong: 'Hemitrygon_akajei',
  ca_song_cham_nau: 'Epinephelus_coioides',
  ca_khoang_co: 'Amphiprion_ocellaris',
  sao_bien_gai: 'Acanthaster_planci',
  ca_mao_tien: 'Pterois_volitans',
  ca_mat_quy: 'Synanceia_verrucosa',
  oc_coi_dia_ly: 'Conus_geographus',
  trai_tai_tuong: 'Tridacna_squamosa',
  bach_tuoc_dom_xanh: 'Hapalochlaena',
  ca_map_vay_den: 'Carcharhinus_melanopterus',
  rua_doi_moi: 'Eretmochelys_imbricata',
  muc_nang: 'Sepia_pharaonis',
  ca_vet_dau_gu: 'Bolbometopon_muricatum',
  duoi_o_dom: 'Aetobatus_ocellatus',
  sao_bien_goi: 'Protoreaster_nodosus',
  hai_sam_den: 'Holothuria_atra',
  ca_dia: 'Siganus_guttatus',
  ran_bien_khoanh: 'Hydrophis_cyanocinctus',
  sua_hop: 'Chironex_fleckeri',
  rua_xanh: 'Chelonia_mydas',
  ca_heo_irrawaddy: 'Orcaella_brevirostris',
  bo_bien: 'Dugong_dugon',
  muc_la: 'Sepioteuthis_lessoniana',
  ca_thu_vach: 'Scomberomorus_commerson',
  ca_buom_chi: 'Chaetodon_auriga',
  ca_napoleon: 'Cheilinus_undulatus',
  ca_ngu_vay_vang: 'Thunnus_albacares',
  ca_co: 'Istiophorus_platypterus',
  duoi_manta: 'Mobula_birostris',
  ca_map_dau_bua: 'Sphyrna_lewini',
  ca_nham_voi: 'Rhincodon_typus',
  ca_den_long: 'Myctophidae',
  ca_riu_bien: 'Sternoptychidae',
  ca_can_cau: 'Melanocetus_johnsonii',
  bo_bien_khong_lo: 'Bathynomus',
  ca_map_sau_mang: 'Hexanchus_griseus',
};

interface Cand {
  title: string;
  url: string;
  page: string;
  artist: string;
  license: string;
  licenseUrl: string;
}

async function api(params: Record<string, string>): Promise<any> {
  const q = new URLSearchParams({ format: 'json', origin: '*', ...params });
  const res = await fetch(`${API}?${q}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Commons API ${res.status}`);
  return res.json();
}

const strip = (s: string) => (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function listFiles(category: string, depth = 1): Promise<string[]> {
  const out: string[] = [];
  const d = await api({ action: 'query', list: 'categorymembers', cmtitle: `Category:${category}`, cmtype: 'file', cmlimit: '60' });
  for (const m of d?.query?.categorymembers ?? []) out.push(m.title);
  if (out.length < 12 && depth > 0) {
    const sc = await api({ action: 'query', list: 'categorymembers', cmtitle: `Category:${category}`, cmtype: 'subcat', cmlimit: '15' });
    for (const m of sc?.query?.categorymembers ?? []) {
      if (out.length >= 60) break;
      out.push(...(await listFiles(m.title.replace(/^Category:/, ''), depth - 1)));
    }
  }
  return out;
}

async function searchFiles(term: string): Promise<string[]> {
  const d = await api({ action: 'query', list: 'search', srsearch: term, srnamespace: '6', srlimit: '40' });
  return (d?.query?.search ?? []).map((s: any) => s.title);
}

async function infos(titles: string[]): Promise<Cand[]> {
  const out: Cand[] = [];
  for (let i = 0; i < titles.length; i += 40) {
    const chunk = titles.slice(i, i + 40);
    const d = await api({
      action: 'query',
      titles: chunk.join('|'),
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|mime|size',
      iiurlwidth: '1024',
    });
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      const ii = p.imageinfo?.[0];
      if (!ii || !/image\/(jpeg|png)/.test(ii.mime)) continue;
      if ((ii.width ?? 0) < 400) continue;
      const md = ii.extmetadata ?? {};
      out.push({
        title: p.title,
        url: ii.thumburl ?? ii.url,
        page: ii.descriptionurl,
        artist: strip(md.Artist?.value) || 'không rõ',
        license: strip(md.LicenseShortName?.value) || 'không rõ',
        licenseUrl: strip(md.LicenseUrl?.value) || '',
      });
    }
  }
  return out;
}

/** Ưu tiên ảnh có vẻ chụp dưới nước / ngang thân, tránh bản đồ, sơ đồ, mẫu vật khô. */
function score(c: Cand): number {
  const t = c.title.toLowerCase();
  let s = 0;
  if (/map|distribution|range|diagram|skeleton|stamp|logo|drawing|illustration|plate|museum|specimen|dried|market|food|dish|_svg|\.svg/.test(t)) s -= 5;
  if (/underwater|reef|dive|diving|snorkel|side|lateral|profile|wild/.test(t)) s += 2;
  if (/juvenile|larva|egg/.test(t)) s -= 1;
  return s;
}

async function fetchCandidates(id: string) {
  const cat = CATEGORIES[id];
  const sp = speciesList.find((s) => s.id === id);
  if (!cat || !sp) throw new Error(`Không biết loài ${id}`);
  let titles = await listFiles(cat);
  if (titles.length < 5) titles = [...titles, ...(await searchFiles(sp.nameSci))];
  titles = [...new Set(titles)];
  let cands = await infos(titles);
  cands = cands.sort((a, b) => score(b) - score(a)).slice(0, 10);
  const dir = join(REF, id, 'cand');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const meta: (Cand & { file: string })[] = [];
  let n = 0;
  for (const c of cands) {
    try {
      const res = await fetch(c.url, { headers: { 'User-Agent': UA } });
      if (!res.ok) continue;
      n++;
      const ext = c.url.toLowerCase().includes('.png') ? 'png' : 'jpg';
      const file = `${n}.${ext}`;
      writeFileSync(join(dir, file), Buffer.from(await res.arrayBuffer()));
      meta.push({ ...c, file });
    } catch {
      /* bỏ qua ảnh lỗi */
    }
  }
  writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
  if (!meta.length) {
    console.log(`Không tìm được ảnh cho ${id} (Category:${cat}). Vẽ theo trường visual và ghi DECISIONS.md.`);
    return;
  }
  // ghép montage đánh số để xem một lần
  const cells = meta
    .map((m, i) => {
      const b64 = readFileSync(join(dir, m.file)).toString('base64');
      return `<div class="c"><img src="data:image/${m.file.endsWith('png') ? 'png' : 'jpeg'};base64,${b64}"><b>${i + 1}</b></div>`;
    })
    .join('');
  const html = `<!doctype html><html><body style="margin:0;background:#111;width:1500px"><style>.g{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px}.c{position:relative;height:260px;background:#000;display:flex;align-items:center;justify-content:center}.c img{max-width:100%;max-height:100%}.c b{position:absolute;left:6px;top:4px;color:#ff0;font:bold 34px sans-serif;text-shadow:0 0 4px #000}</style><div class="g">${cells}</div></body></html>`;
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 800 } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: join(REF, id, '_montage.png'), fullPage: true });
  await browser.close();
  console.log(`✔ ${meta.length} ảnh ứng viên → references/${id}/_montage.png`);
  meta.forEach((m, i) => console.log(`  ${i + 1}. ${m.title} — ${m.artist} — ${m.license}`));
}

async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      /* thử kênh khác */
    }
  }
  return chromium.launch({ headless: true });
}

function keep(id: string, nums: number[]) {
  const dir = join(REF, id, 'cand');
  const meta: (Cand & { file: string })[] = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
  const kept = nums.map((n) => meta[n - 1]).filter(Boolean);
  for (const f of readdirSync(join(REF, id))) {
    if (/^ref\d+\.(jpg|png)$/.test(f)) rmSync(join(REF, id, f));
  }
  const lines = [`## ${id}`, ''];
  kept.forEach((m, i) => {
    const out = `ref${i + 1}.${m.file.split('.').pop()}`;
    renameSync(join(dir, m.file), join(REF, id, out));
    lines.push(`- \`${out}\`: [${m.title}](${m.page}) — Tác giả: ${m.artist} — Giấy phép: ${m.license}${m.licenseUrl ? ` (${m.licenseUrl})` : ''}`);
  });
  writeFileSync(join(REF, id, 'credits.md'), lines.join('\n') + '\n');
  rmSync(dir, { recursive: true, force: true });
  rmSync(join(REF, id, '_montage.png'), { force: true });
  console.log(`✔ giữ ${kept.length} ảnh: references/${id}/ref1..${kept.length}, credits.md đã ghi`);
}

function mergeCredits() {
  const parts: string[] = [
    '# Ảnh tham khảo đã xem khi vẽ (Wikimedia Commons)',
    '',
    'Các ảnh dưới đây CHỈ được dùng để quan sát hình dáng, tỉ lệ, hoa văn khi vẽ tay lại bằng mã SVG.',
    'Không ảnh nào được nhúng, chuyển đổi tự động hay đóng gói vào game.',
    '',
  ];
  for (const s of speciesList) {
    const f = join(REF, s.id, 'credits.md');
    if (existsSync(f)) parts.push(readFileSync(f, 'utf8').replace(`## ${s.id}`, `## ${s.nameVi} (${s.id})`));
  }
  const text = parts.join('\n');
  writeFileSync(join(REF, 'CREDITS.md'), text);
  mkdirSync(join(ROOT, 'docs'), { recursive: true });
  writeFileSync(join(ROOT, 'docs', 'THAM_KHAO_ANH.md'), text);
  console.log('✔ references/CREDITS.md + docs/THAM_KHAO_ANH.md');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--credits')) return mergeCredits();
  const id = args.find((a) => !a.startsWith('--'));
  if (!id) throw new Error('Cần id loài');
  const k = args.indexOf('--keep');
  if (k >= 0) return keep(id, args[k + 1].split(',').map(Number));
  await fetchCandidates(id);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
