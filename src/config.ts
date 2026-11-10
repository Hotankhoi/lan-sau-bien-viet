/** Hằng số cân bằng game (chỉ agent điều phối sửa). */
export const CONFIG = {
  /** chiều rộng thế giới mỗi lượt lặn (px) */
  worldWidth: 6400,
  /** chiều cao thế giới theo tầng (px) */
  worldHeight: { 1: 1800, 2: 2400, 3: 2400 } as Record<number, number>,
  /** độ dày lớp đáy dưới đường đáy */
  seabedThickness: 420,

  diver: {
    accel: 620,
    maxSpeed: 205,
    sprintSpeed: 340,
    drag: 2.1,
    /** tốc độ coi là "bơi chậm" khi tiếp cận sinh vật nhút nhát */
    calmSpeed: 70,
    radius: 30,
  },
  oxygen: {
    /** giây oxy cơ bản */
    baseSeconds: 200,
    perTankLevel: 50,
    sprintMul: 2.2,
    tierMul: { 1: 1, 2: 1.25, 3: 1 } as Record<number, number>,
    lowThreshold: 0.25,
  },
  photo: {
    frameW: 300,
    frameH: 210,
    /** sao theo điểm chất lượng */
    star3: 0.76,
    star2: 0.5,
    starMul: { 1: 1, 2: 1.5, 3: 2 } as Record<number, number>,
    repeatFactor: 0.25,
    cooldown: 0.55,
  },
  spawn: {
    creaturesPerDive: { 1: 22, 2: 18, 3: 16 } as Record<number, number>,
    trashPerDive: 9,
    legendaryChance: 0.12,
  },
  green: {
    trash: 5,
    coralHit: -3,
    scareRare: -5,
  },
  lamp: {
    range: 560,
    cone: 0.5,
    rangeHi: 800,
    coneHi: 0.62,
  },
  /** Loài sống sát đáy/rạn: chiều cao tối đa trên đáy khi sinh ra và khi lượn (px). Loài không ghi = bơi tự do. */
  habitat: {
    bach_tuoc_dom_xanh: 60,
    ca_mao_tien: 220,
    muc_nang: 260,
    ca_vet_dau_gu: 420,
    ca_ngua_den: 90,
    ca_song_cham_nau: 200,
    ran_bien_khoanh: 260,
    ca_buom_chi: 260,
    ca_dia: 320,
    ca_napoleon: 380,
    muc_la: 320,
    muc_ong: 380,
  } as Record<string, number>,
  danger: {
    contactCooldown: 3,
    knockback: 420,
  },
};

export interface UpgradeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  costs: number[];
  science?: string;
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'tank', name: 'Bình oxy lớn', desc: 'Mỗi cấp tăng thời gian lặn thêm 50 giây.', icon: '🫧', costs: [80, 200, 420] },
  { id: 'fins', name: 'Chân vịt carbon', desc: 'Bơi nhanh hơn, tốn ít oxy hơn khi tăng tốc.', icon: '🦶', costs: [120, 320] },
  { id: 'macro', name: 'Ống kính macro', desc: 'Chụp sinh vật nhỏ (cá ngựa, bạch tuộc, ốc cối...) dễ đạt 3★ hơn.', icon: '🔬', costs: [150] },
  { id: 'scanner', name: 'Máy quét sinh học', desc: 'Mở khả năng Quét (E): làm lộ sinh vật ngụy trang và vùi trong cát.', icon: '📡', costs: [60] },
  { id: 'lamp', name: 'Đèn lặn công suất cao', desc: 'Chùm sáng xa và rộng hơn. Bắt buộc để thấy rõ Tầng 3.', icon: '🔦', costs: [220] },
  {
    id: 'sub',
    name: 'Tàu lặn mini “Hải Âu”',
    desc: 'Bắt buộc cho Tầng 3 (> 200 m).',
    icon: '🚤',
    costs: [600],
    science:
      'Ở độ sâu 200 m, áp suất nước khoảng 21 atm – gấp 21 lần trên mặt đất. Thợ lặn tự do thể thao chỉ an toàn trong khoảng 30–40 m; xuống sâu hơn cần thiết bị chuyên dụng. Vì vậy các nhà khoa học dùng tàu lặn có vỏ chịu áp lực để thám hiểm biển sâu.',
  },
];
