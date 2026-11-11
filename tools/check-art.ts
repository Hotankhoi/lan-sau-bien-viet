/** Kiểm tra nhanh mọi hình SVG: tìm NaN/undefined trong mã sinh ra. npx tsx tools/check-art.ts */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { composeSvg } from '../src/art/contract';

const BAD = /NaN|undefined|Infinity|d="[^"MmZz]*<|\sd="\s*[^"MmZz\s]/;
const bad = (s: string) => BAD.test(s);
let problems = 0;
const spDir = join(process.cwd(), 'src/art/species');
for (const f of readdirSync(spDir)) {
  if (!f.endsWith('.ts') || f === 'index.ts') continue;
  const mod = await import(pathToFileURL(join(spDir, f)).href);
  const art = mod.default;
  if (!art) continue;
  for (const mode of ['card', 'game'] as const) {
    const svg = composeSvg(art, { mode });
    if (bad(svg)) {
      problems++;
      const i = svg.search(BAD);
      const layer = art.layers.find((l: { svg: string }) => bad(l.svg))?.name ?? (bad(art.defs) ? 'defs' : '?');
      console.log(`✗ ${f} [${mode}] lớp "${layer}": …${svg.slice(Math.max(0, i - 80), i + 20)}…`);
      break;
    }
  }
}
const envDir = join(process.cwd(), 'src/art/environment');
for (const d of readdirSync(envDir, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const mod = await import(pathToFileURL(join(envDir, d.name, 'index.ts')).href);
  const env = mod.default;
  for (const p of [...env.props, ...env.backdrops, ...(env.foreground ?? [])]) {
    if (bad(p.svg) || bad(p.defs)) {
      problems++;
      console.log(`✗ env ${d.name}/${p.id}`);
    }
  }
}
console.log(problems ? `${problems} vấn đề` : 'Mọi hình đều sạch (không NaN/undefined).');
