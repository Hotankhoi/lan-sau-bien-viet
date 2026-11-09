/**
 * Registry hình sinh vật (chỉ agent điều phối sửa).
 * Tự động nạp mọi file src/art/species/<id>.ts; loài chưa có hình dùng hình tạm.
 */
import type { CreatureArt } from '../contract';
import { placeholderArt } from '../placeholder';
import { SPECIES_BY_ID } from '../../data/types';

const modules = import.meta.glob<{ default: CreatureArt }>(['./*.ts', '!./index.ts'], { eager: true });

const registry = new Map<string, CreatureArt>();
for (const mod of Object.values(modules)) {
  if (mod?.default?.id) registry.set(mod.default.id, mod.default);
}

export function getArt(id: string): CreatureArt {
  const art = registry.get(id);
  if (art) return art;
  const sp = SPECIES_BY_ID.get(id);
  if (!sp) throw new Error(`Không có loài ${id}`);
  const ph = placeholderArt(sp);
  registry.set(id, ph);
  return ph;
}

export function hasRealArt(id: string): boolean {
  const a = registry.get(id);
  return !!a && !a.placeholder;
}
