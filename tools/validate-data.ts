/** Kiểm tra dữ liệu sinh vật: npm run validate:data */
import species from '../src/data/species.json';
import achievements from '../src/data/achievements.json';

const REGIONS = ['bac_bo', 'mien_trung', 'mien_nam', 'khoi_xa'];
const RARITY = ['thuong_gap', 'it_gap', 'hiem', 'huyen_thoai'];
const DANGER = ['an_toan', 'can_than', 'nguy_hiem', 'cuc_ky_nguy_hiem'];
const IUCN = ['LC', 'NT', 'VU', 'EN', 'CR', 'NE'];
const BEHAVIOR = ['static', 'buried', 'drift', 'shy', 'school', 'wander', 'fast_pass', 'camouflage', 'curious', 'deep_glow'];
const TIERS: Record<string, number[]> = { bac_bo: [1, 2], mien_trung: [1, 2], mien_nam: [1, 2], khoi_xa: [1, 2, 3] };

const errs: string[] = [];
const warn: string[] = [];
const ids = new Set<string>();
type Sp = (typeof species)[number] & { dangerNote?: string | null; conservation?: string | null; needsVerification?: boolean };
for (const s of species as Sp[]) {
  const p = `[${s.id}]`;
  if (ids.has(s.id)) errs.push(`${p} trùng id`);
  ids.add(s.id);
  if (!/^[a-z0-9_]+$/.test(s.id)) errs.push(`${p} id không hợp lệ`);
  if (!REGIONS.includes(s.region)) errs.push(`${p} region sai: ${s.region}`);
  else if (!TIERS[s.region].includes(s.tier)) errs.push(`${p} vùng ${s.region} không có tầng ${s.tier}`);
  if (!RARITY.includes(s.rarity)) errs.push(`${p} rarity sai`);
  if (!DANGER.includes(s.danger)) errs.push(`${p} danger sai`);
  if (!IUCN.includes(s.iucn)) errs.push(`${p} iucn sai`);
  if (!BEHAVIOR.includes(s.behavior)) errs.push(`${p} behavior sai`);
  if (!(s.sizeCm > 0)) errs.push(`${p} sizeCm phải > 0`);
  for (const k of ['nameVi', 'nameSci', 'nameEn', 'visual', 'description', 'funFact'] as const) if (!String(s[k] ?? '').trim()) errs.push(`${p} thiếu ${k}`);
  if ((s.danger === 'nguy_hiem' || s.danger === 'cuc_ky_nguy_hiem') && !s.dangerNote) errs.push(`${p} loài nguy hiểm cần dangerNote`);
  if (['VU', 'EN', 'CR'].includes(s.iucn) && !s.conservation) warn.push(`${p} loài ${s.iucn} nên có conservation`);
  if (s.tier === 3 && s.behavior !== 'deep_glow') warn.push(`${p} loài tầng 3 nhưng behavior không phải deep_glow`);
  if (s.needsVerification) warn.push(`${p} cần đội dự án kiểm chứng`);
}
const count = (r: string) => (species as Sp[]).filter((s) => s.region === r).length;
const summary = REGIONS.map((r) => `${r}: ${count(r)}`).join(', ');
if (species.length !== 43) errs.push(`Tổng số loài ${species.length} (cần 43)`);
for (const r of REGIONS) for (const t of TIERS[r]) if (!(species as Sp[]).some((s) => s.region === r && s.tier === t)) warn.push(`Vùng ${r} tầng ${t} chưa có loài nào`);
if (!(species as Sp[]).some((s) => s.rarity === 'huyen_thoai')) warn.push('Chưa có loài huyền thoại');
const extreme = (species as Sp[]).filter((s) => s.danger === 'cuc_ky_nguy_hiem').length;
if (extreme < 1) warn.push("Chưa có loài cực kỳ nguy hiểm");
for (const need of ['ca_khoang_co', 'ca_mat_quy', 'sam_bien', 'bo_bien', 'ca_nham_voi']) if (!ids.has(need)) errs.push(`Thành tựu cần loài ${need}`);
console.log(`Số loài: ${species.length} (${summary}); thành tựu: ${achievements.length}`);
warn.forEach((w) => console.log('⚠', w));
errs.forEach((e) => console.log('✗', e));
console.log(errs.length ? `${errs.length} lỗi` : '✓ Dữ liệu hợp lệ');
process.exit(errs.length ? 1 : 0);
