/** In bảng trạng thái hình vẽ từng loài (dùng cho REPORT.md):  npx tsx tools/species-status.ts */
import { readdirSync } from 'node:fs';
import species from '../src/data/species.json';
const have = new Set(readdirSync('src/art/species').map((f) => f.replace(/\.ts$/, '')));
const NAME: Record<string, string> = { bac_bo: 'Vịnh Bắc Bộ', mien_trung: 'Biển miền Trung', mien_nam: 'Biển miền Nam', khoi_xa: 'Vùng khơi xa' };
let out = '';
for (const r of Object.keys(NAME)) {
  const list = species.filter((s) => s.region === r);
  const done = list.filter((s) => have.has(s.id));
  out += `- **${NAME[r]}** (${done.length}/${list.length}): ` + list.map((s) => (have.has(s.id) ? s.nameVi : `_${s.nameVi} (hình tạm)_`)).join(', ') + '\n';
}
const total = species.filter((s) => have.has(s.id)).length;
console.log(`Tổng: ${total}/${species.length} loài có hình riêng.\n\n${out}`);
