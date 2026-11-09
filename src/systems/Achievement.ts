/** Thành tựu: kiểm tra điều kiện sau mỗi sự kiện quan trọng. */
import achievementsJson from '../data/achievements.json';
import { SPECIES, type RegionId } from '../data/types';
import { Save, type SaveData } from './Save';
import { bus } from '../game/bus';

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = achievementsJson as AchievementDef[];

const has = (d: SaveData, id: string) => !!d.species[id];
const regionDone = (d: SaveData, r: RegionId) => SPECIES.filter((s) => s.region === r).every((s) => has(d, s.id));

const CHECKS: Record<string, (d: SaveData) => boolean> = {
  first_dive: (d) => d.stats.dives >= 1,
  photo_3star: (d) => Object.values(d.species).some((s) => s.bestStars >= 3),
  anemone_friend: (d) => has(d, 'ca_khoang_co'),
  shadow_hunter: (d) => d.stats.scanned.includes('ca_mat_quy'),
  wise_fear: (d) => {
    const list = SPECIES.filter((s) => s.danger === 'cuc_ky_nguy_hiem');
    return list.length > 0 && list.every((s) => has(d, s.id)) && !list.some((s) => d.stats.touchedDanger.includes(s.id));
  },
  reef_keeper: (d) => d.stats.noCoralStreak >= 10,
  clean_sea: (d) => d.stats.trashTotal >= 50,
  living_fossil: (d) => has(d, 'sam_bien'),
  mermaid: (d) => has(d, 'bo_bien'),
  gentle_giant: (d) => has(d, 'ca_nham_voi'),
  abyss: (d) => d.stats.deepestTier >= 3,
  light_in_dark: (d) => SPECIES.filter((s) => s.tier === 3).every((s) => has(d, s.id)),
  protector: (d) => SPECIES.filter((s) => ['VU', 'EN', 'CR'].includes(s.iucn)).every((s) => has(d, s.id)),
  explorer_bac_bo: (d) => regionDone(d, 'bac_bo'),
  explorer_mien_trung: (d) => regionDone(d, 'mien_trung'),
  explorer_mien_nam: (d) => regionDone(d, 'mien_nam'),
  explorer_khoi_xa: (d) => regionDone(d, 'khoi_xa'),
  notebook: (d) => SPECIES.every((s) => has(d, s.id)),
};

export function checkAchievements(): void {
  const d = Save.data;
  const fresh: AchievementDef[] = [];
  for (const a of ACHIEVEMENTS) {
    if (d.achievements[a.id]) continue;
    const fn = CHECKS[a.id];
    if (fn && fn(d)) fresh.push(a);
  }
  if (!fresh.length) return;
  Save.update((s) => {
    for (const a of fresh) s.achievements[a.id] = Date.now();
  });
  for (const a of fresh) bus.emit('achievement', a);
}
