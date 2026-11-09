import speciesJson from './species.json';

export type RegionId = 'bac_bo' | 'mien_trung' | 'mien_nam' | 'khoi_xa';
export type Tier = 1 | 2 | 3;
export type Rarity = 'thuong_gap' | 'it_gap' | 'hiem' | 'huyen_thoai';
export type Danger = 'an_toan' | 'can_than' | 'nguy_hiem' | 'cuc_ky_nguy_hiem';
export type Iucn = 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'NE';
export type Behavior =
  | 'static'
  | 'buried'
  | 'drift'
  | 'shy'
  | 'school'
  | 'wander'
  | 'fast_pass'
  | 'camouflage'
  | 'curious'
  | 'deep_glow';

export interface Species {
  id: string;
  nameVi: string;
  nameSci: string;
  nameEn: string;
  region: RegionId;
  tier: Tier;
  rarity: Rarity;
  danger: Danger;
  iucn: Iucn;
  sizeCm: number;
  behavior: Behavior;
  visual: string;
  description: string;
  funFact: string;
  dangerNote?: string | null;
  conservation?: string | null;
  needsVerification?: boolean;
}

export const SPECIES: Species[] = speciesJson as Species[];
export const SPECIES_BY_ID = new Map(SPECIES.map((s) => [s.id, s]));

export const REGIONS: { id: RegionId; name: string; short: string; tiers: Tier[]; mood: string; blurb: string }[] = [
  { id: 'bac_bo', name: 'Vịnh Bắc Bộ', short: 'Bắc Bộ', tiers: [1, 2], mood: 'Huyền ảo, hơi sương', blurb: 'Chân núi đá vôi Hạ Long nhô xuống nước, hang đá, đáy bùn cát và bãi sá sùng.' },
  { id: 'mien_trung', name: 'Biển miền Trung', short: 'Miền Trung', tiers: [1, 2], mood: 'Rực rỡ, trong vắt', blurb: 'Rạn san hô dày đặc nhiều màu, hải quỳ, quạt biển, nắng chiếu xuyên làn nước trong.' },
  { id: 'mien_nam', name: 'Biển miền Nam', short: 'Miền Nam', tiers: [1, 2], mood: 'Ấm áp, nắng vàng', blurb: 'Thảm cỏ biển đung đưa, cát trắng, đá granite tròn của Côn Đảo – Phú Quốc.' },
  { id: 'khoi_xa', name: 'Vùng khơi xa (Hoàng Sa – Trường Sa)', short: 'Khơi xa', tiers: [1, 2, 3], mood: 'Bao la, sâu thẳm', blurb: 'Rạn san hô vòng nguyên sơ, vách đá dốc đứng đổ xuống vực sâu, đại dương mở.' },
];
export const REGION_BY_ID = new Map(REGIONS.map((r) => [r.id, r]));

export const TIER_INFO: Record<Tier, { name: string; range: string; depthTop: number; depthBottom: number }> = {
  1: { name: 'Tầng 1 – Nắng', range: '0–30 m', depthTop: 0, depthBottom: 30 },
  2: { name: 'Tầng 2 – Chạng vạng', range: '30–200 m', depthTop: 30, depthBottom: 200 },
  3: { name: 'Tầng 3 – Vực thẳm', range: '> 200 m', depthTop: 200, depthBottom: 900 },
};

export const RARITY_INFO: Record<Rarity, { name: string; points: number; weight: number; color: string }> = {
  thuong_gap: { name: 'Thường gặp', points: 10, weight: 60, color: '#C9D3DC' },
  it_gap: { name: 'Ít gặp', points: 25, weight: 25, color: '#6BE28B' },
  hiem: { name: 'Hiếm', points: 60, weight: 12, color: '#52B6FF' },
  huyen_thoai: { name: 'Huyền thoại', points: 150, weight: 3, color: '#FFC94A' },
};

export const DANGER_INFO: Record<Danger, { name: string; color: string; oxygenLoss: number }> = {
  an_toan: { name: 'An toàn', color: '#6BE28B', oxygenLoss: 0 },
  can_than: { name: 'Cẩn thận', color: '#FFC75F', oxygenLoss: 0 },
  nguy_hiem: { name: 'Nguy hiểm', color: '#FF9F5A', oxygenLoss: 0.15 },
  cuc_ky_nguy_hiem: { name: 'Cực kỳ nguy hiểm', color: '#FF6B6B', oxygenLoss: 0.3 },
};

/** Giải thích các bậc IUCN (hiện khi bấm huy hiệu) */
export const IUCN_INFO: Record<Iucn, { name: string; color: string; text: string }> = {
  LC: { name: 'Ít lo ngại (LC)', color: '#5FBF77', text: 'Loài còn phổ biến, chưa bị đe dọa đáng kể. Dù vậy vẫn cần khai thác có trách nhiệm để giữ được như hiện nay.' },
  NT: { name: 'Sắp bị đe dọa (NT)', color: '#B9D35A', text: 'Loài gần đạt ngưỡng bị đe dọa. Nếu các mối nguy (đánh bắt, mất môi trường sống) tiếp diễn, loài có thể trở thành Sẽ nguy cấp.' },
  VU: { name: 'Sẽ nguy cấp (VU)', color: '#F2C14E', text: 'Loài đối mặt nguy cơ tuyệt chủng cao ngoài tự nhiên. Số lượng đang giảm hoặc vùng sống bị thu hẹp.' },
  EN: { name: 'Nguy cấp (EN)', color: '#F28C38', text: 'Loài đối mặt nguy cơ tuyệt chủng rất cao ngoài tự nhiên. Cần hành động bảo tồn khẩn cấp.' },
  CR: { name: 'Cực kỳ nguy cấp (CR)', color: '#E5484D', text: 'Bậc nguy hiểm nhất trước khi tuyệt chủng ngoài tự nhiên. Số lượng còn lại cực kỳ ít.' },
  NE: { name: 'Chưa đánh giá (NE)', color: '#9AA7B2', text: 'Loài chưa được IUCN đánh giá đầy đủ. "Chưa đánh giá" không có nghĩa là an toàn – cần thêm nghiên cứu.' },
};

export const BEHAVIOR_HINT: Record<Behavior, string> = {
  static: 'Thường nằm yên trên đáy hoặc bám đá – hãy nhìn kỹ dưới chân.',
  buried: 'Sống vùi trong cát ở vùng đáy – lại gần chậm rãi để nó nhô lên.',
  drift: 'Trôi lững lờ theo dòng nước giữa tầng nước.',
  shy: 'Rất nhút nhát – phải bơi thật chậm mới tiếp cận được.',
  school: 'Bơi theo đàn – tìm những đám cá chuyển động cùng nhau.',
  wander: 'Bơi lượn quanh rạn – kiên nhẫn quan sát.',
  fast_pass: 'Lướt qua rất nhanh rồi biến mất – chuẩn bị máy ảnh sẵn.',
  camouflage: 'Bậc thầy ngụy trang giữa đá – cần máy quét sinh học để phát hiện.',
  curious: 'Tò mò – đứng yên một lúc, có thể nó sẽ tự bơi lại gần.',
  deep_glow: 'Sống trong bóng tối sâu thẳm – cần đèn mạnh và tàu lặn.',
};

export const REGION_LABEL: Record<RegionId, string> = {
  bac_bo: 'Vịnh Bắc Bộ',
  mien_trung: 'Biển miền Trung',
  mien_nam: 'Biển miền Nam',
  khoi_xa: 'Vùng khơi xa',
};

export function speciesOf(region: RegionId, tier?: Tier): Species[] {
  return SPECIES.filter((s) => s.region === region && (tier === undefined || s.tier === tier));
}
