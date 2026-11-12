/**
 * Lưu tiến trình vào localStorage. Mọi thao tác có try/catch: nếu trình duyệt chặn storage,
 * game vẫn chạy bình thường, chỉ không lưu.
 */
import type { RegionId, Tier } from '../data/types';
import { TEST_MODE } from './testFlag';

/** Chế độ kiểm thử (?test=1) dùng khóa riêng – tiến trình thật không bị đọc hay ghi đè. */
export const SAVE_KEY_REAL = 'lan-sau-save-v1';
const KEY = TEST_MODE ? SAVE_KEY_REAL + '_test' : SAVE_KEY_REAL;

export interface SpeciesRecord {
  count: number;
  bestStars: number;
  photo?: string; // dataURL JPEG nhỏ
  firstSeen: number;
}

export interface SaveData {
  version: 1;
  research: number;
  researchTotal: number;
  green: number;
  species: Record<string, SpeciesRecord>;
  upgrades: Record<string, number>;
  achievements: Record<string, number>;
  stats: {
    dives: number;
    divesByRegion: Partial<Record<RegionId, number>>;
    trashTotal: number;
    noCoralStreak: number;
    touchedDanger: string[];
    scanned: string[];
    deepestTier: Tier;
    photos: number;
  };
  settings: { volume: number; music: number; quality: 'high' | 'low'; tutorial: boolean };
  tutorialDone: boolean;
}

export function defaultSave(): SaveData {
  return {
    version: 1,
    research: 0,
    researchTotal: 0,
    green: 0,
    species: {},
    upgrades: {},
    achievements: {},
    stats: {
      dives: 0,
      divesByRegion: {},
      trashTotal: 0,
      noCoralStreak: 0,
      touchedDanger: [],
      scanned: [],
      deepestTier: 1,
      photos: 0,
    },
    settings: { volume: 0.8, music: 0.6, quality: 'high', tutorial: true },
    tutorialDone: false,
  };
}

let storageOk = true;
/** đã có dữ liệu lưu từ trước (false = lần đầu mở) */
let hadStored = false;
let data: SaveData = load();
const listeners = new Set<() => void>();

function load(): SaveData {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    hadStored = true;
    const parsed = JSON.parse(raw);
    const base = defaultSave();
    return {
      ...base,
      ...parsed,
      stats: { ...base.stats, ...(parsed.stats ?? {}) },
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      species: parsed.species ?? {},
      upgrades: parsed.upgrades ?? {},
      achievements: parsed.achievements ?? {},
    };
  } catch {
    storageOk = false;
    return defaultSave();
  }
}

export const Save = {
  get data(): SaveData {
    return data;
  },
  get available(): boolean {
    return storageOk;
  },
  /** true nếu lúc mở game đã có dữ liệu lưu */
  get hadStored(): boolean {
    return hadStored;
  },
  /** Thay toàn bộ dữ liệu (chỉ dùng cho chế độ kiểm thử) */
  replace(d: SaveData): void {
    data = d;
    Save.persist();
  },
  persist(): void {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
      storageOk = true;
    } catch {
      // có thể đầy bộ nhớ vì ảnh: thử bỏ bớt ảnh cũ rồi lưu lại
      try {
        const lite = { ...data, species: Object.fromEntries(Object.entries(data.species).map(([k, v]) => [k, { ...v, photo: undefined }])) };
        window.localStorage.setItem(KEY, JSON.stringify(lite));
      } catch {
        storageOk = false;
      }
    }
    listeners.forEach((fn) => fn());
  },
  update(fn: (d: SaveData) => void): void {
    fn(data);
    Save.persist();
  },
  reset(): void {
    data = defaultSave();
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* bỏ qua */
    }
    listeners.forEach((fn) => fn());
  },
  onChange(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  level(upgrade: string): number {
    return data.upgrades[upgrade] ?? 0;
  },
  discovered(id: string): boolean {
    return !!data.species[id];
  },
  discoveredCount(filter?: (id: string) => boolean): number {
    return Object.keys(data.species).filter((k) => !filter || filter(k)).length;
  },
};
