/** Dữ liệu cho chế độ kiểm thử: bộ lưu "đã có tất cả" và ảnh 3★ dựng từ hình vẽ của loài. */
import { SPECIES, SPECIES_BY_ID, REGIONS } from '../data/types';
import { UPGRADES } from '../config';
import { composeSvg } from '../art/contract';
import { getArt } from '../art/species';
import { REGION_WATER } from '../art/style-bible';
import { ACHIEVEMENTS } from './Achievement';
import { Save, defaultSave, type SaveData } from './Save';

/** Bộ lưu "đã có tất cả": mọi vùng/tầng, nâng cấp tối đa, đủ loài 3★, đủ thành tựu, nhiều điểm. */
export function fullSave(prev?: SaveData): SaveData {
  const d = defaultSave();
  const now = Date.now();
  d.tutorialDone = true;
  d.research = 99999;
  d.researchTotal = 99999;
  d.green = 9999;
  d.upgrades = Object.fromEntries(UPGRADES.map((u) => [u.id, u.costs.length]));
  d.achievements = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, now]));
  d.species = Object.fromEntries(SPECIES.map((s) => [s.id, { count: 3, bestStars: 3, firstSeen: now, photo: photoCache.get(s.id) }]));
  d.stats = {
    dives: 50,
    divesByRegion: Object.fromEntries(REGIONS.map((r) => [r.id, 10])),
    trashTotal: 60,
    noCoralStreak: 12,
    touchedDanger: [],
    scanned: SPECIES.filter((s) => s.behavior === 'camouflage' || s.behavior === 'buried').map((s) => s.id),
    deepestTier: 3,
    photos: SPECIES.length * 3,
  };
  if (prev) d.settings = { ...prev.settings };
  return d;
}

/** Bộ lưu "chưa có gì" (người chơi mới, có cả hướng dẫn lượt đầu). */
export function emptySave(prev?: SaveData): SaveData {
  const d = defaultSave();
  if (prev) d.settings = { ...prev.settings, tutorial: true };
  return d;
}

const photoCache = new Map<string, string>();

/** Ảnh 300×210 giống ảnh chụp trong game: hình vẽ của loài trên nền nước của vùng/tầng tương ứng. */
export async function makeTestPhoto(id: string): Promise<string> {
  const hit = photoCache.get(id);
  if (hit) return hit;
  const sp = SPECIES_BY_ID.get(id)!;
  const art = getArt(id);
  const W = 300;
  const H = 210;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d')!;
  const w = REGION_WATER[sp.region] ?? REGION_WATER.mien_trung;
  const top = sp.tier === 1 ? w.shallow : sp.tier === 2 ? w.deep : '#020814';
  const bot = sp.tier === 1 ? w.deep : sp.tier === 2 ? '#04101f' : '#000000';
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, top);
  bg.addColorStop(1, bot);
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // quầng sáng (nắng ở tầng nông, đèn lặn ở tầng sâu)
  const glow = g.createRadialGradient(W * 0.5, H * 0.45, 10, W * 0.5, H * 0.45, W * 0.6);
  glow.addColorStop(0, sp.tier === 1 ? 'rgba(255,255,255,0.22)' : 'rgba(255,240,210,0.16)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  const [vw, vh] = art.viewBox;
  const k = Math.min((W * 0.84) / vw, (H * 0.8) / vh);
  const dw = Math.round(vw * k);
  const dh = Math.round(vh * k);
  const svg = composeSvg(art, { mode: 'game', alarm: 0, width: dw * 2, height: dh * 2 });
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  g.drawImage(img, (W - dw) / 2, (H - dh) / 2 + 4, dw, dh);
  const url = cv.toDataURL('image/jpeg', 0.8);
  photoCache.set(id, url);
  return url;
}

let fillToken = 0;
/**
 * Dựng ảnh cho các loài đã ghi nhận mà chưa có ảnh (chạy nền, từng loài một).
 * onProgress(done, total) được gọi sau mỗi ảnh; dừng nếu bộ lưu bị đặt lại giữa chừng.
 */
export async function fillTestPhotos(onProgress: (done: number, total: number) => void): Promise<void> {
  const token = ++fillToken;
  const todo = SPECIES.filter((s) => Save.data.species[s.id] && !Save.data.species[s.id].photo).map((s) => s.id);
  let done = 0;
  onProgress(0, todo.length);
  for (const id of todo) {
    let url = '';
    try {
      url = await makeTestPhoto(id);
    } catch {
      /* bỏ qua loài lỗi, vẫn giữ bản ghi */
    }
    if (token !== fillToken) return;
    const rec = Save.data.species[id];
    if (rec && url) rec.photo = url;
    done++;
    if (done % 8 === 0 || done === todo.length) Save.persist();
    onProgress(done, todo.length);
    await new Promise((r) => setTimeout(r, 0));
  }
}

/** Hủy việc dựng ảnh đang chạy (khi đặt lại bộ lưu) */
export function cancelTestPhotos() {
  fillToken++;
}
