/** Luật mở khóa vùng/tầng (MASTER_PROMPT mục 6.2). */
import { SPECIES, type RegionId, type Tier } from '../data/types';
import { Save } from './Save';

export function totalFound(): number {
  return SPECIES.filter((s) => Save.discovered(s.id)).length;
}

export function regionFound(r: RegionId): { found: number; total: number } {
  const list = SPECIES.filter((s) => s.region === r);
  return { found: list.filter((s) => Save.discovered(s.id)).length, total: list.length };
}

/** null = đã mở; chuỗi = lý do còn khóa */
export function regionLock(r: RegionId): string | null {
  const n = totalFound();
  if (r === 'mien_trung') return null;
  if (r === 'bac_bo') return n >= 6 ? null : `Ghi nhận 6 loài bất kỳ để mở (${n}/6)`;
  if (r === 'mien_nam') return n >= 14 ? null : `Ghi nhận 14 loài để mở (${n}/14)`;
  const need: string[] = [];
  if (n < 24) need.push(`ghi nhận 24 loài (${n}/24)`);
  if (Save.level('tank') < 2) need.push('Bình oxy lớn cấp 2');
  return need.length ? `Cần ${need.join(' và ')}` : null;
}

export function tierLock(r: RegionId, t: Tier): string | null {
  const rl = regionLock(r);
  if (rl) return rl;
  if (t === 3) {
    const need: string[] = [];
    if (!Save.level('sub')) need.push('Tàu lặn mini “Hải Âu”');
    if (!Save.level('lamp')) need.push('Đèn lặn công suất cao');
    return need.length ? `Cần ${need.join(' + ')}` : null;
  }
  return null;
}
