/**
 * HỢP ĐỒNG HÌNH MÔI TRƯỜNG (chỉ agent điều phối được sửa file này)
 * Mỗi vùng: `src/art/environment/<region>/index.ts` export default một `RegionEnvironmentArt`.
 * Mọi hình vẽ SVG bằng tay trong code, không ảnh ngoài. id trong defs có tiền tố riêng (makeIds).
 */

export type PropKind =
  | 'coral' // san hô (mong manh: va vào bị trừ Điểm Xanh)
  | 'anemone' // hải quỳ (cá hề bơi quanh)
  | 'rock' // đá (chặn đường bơi)
  | 'seagrass' // cỏ biển
  | 'seaweed' // rong
  | 'sponge' // bọt biển
  | 'fan' // quạt biển (gorgonian)
  | 'karst' // chân núi đá vôi
  | 'decor'; // vỏ ốc, sỏi, sao biển trang trí...

export interface PropArt {
  /** duy nhất trong vùng */
  id: string;
  kind: PropKind;
  /** kích thước viewBox; điểm GIỮA CẠNH DƯỚI viewBox đặt đúng trên mặt đáy */
  viewBox: [number, number];
  defs: string;
  svg: string;
  /** chiều cao hiển thị trong game (px). Thợ lặn cao ≈ 130px khi bơi ngang dài ≈ 150px */
  heightPx: number;
  /** 0..1 biên độ đung đưa theo dòng chảy (ngọn lắc, gốc đứng yên). San hô cứng ~0.02, cỏ biển ~0.5 */
  sway?: number;
  /** tần suất xuất hiện tương đối (mặc định 1) */
  weight?: number;
  /** tầng xuất hiện (mặc định [1,2]) */
  tiers?: number[];
}

export interface BackdropArt {
  id: string;
  /** dải nền ngang lặp lại (tile) – viewBox rộng, ví dụ 2048×512 */
  viewBox: [number, number];
  defs: string;
  svg: string;
  /** hệ số parallax: 0 = đứng yên (rất xa), 1 = theo camera như lớp chơi. Lớp xa ~0.15–0.5 */
  parallax: number;
  /** chiều cao hiển thị (px) */
  heightPx: number;
  /** neo: 'bottom' = đặt sát đáy (bóng vách đá, rạn xa), 'mid' = lơ lửng giữa nước (đàn cá xa) */
  anchor: 'bottom' | 'mid';
  /** độ mờ (sương nước) 0..1 */
  opacity?: number;
  tiers?: number[];
}

export interface RegionEnvironmentArt {
  region: 'bac_bo' | 'mien_trung' | 'mien_nam' | 'khoi_xa';
  /** vật thể trên đáy ở lớp chơi */
  props: PropArt[];
  /** nền xa parallax (lớp 2–3) */
  backdrops: BackdropArt[];
  /** tiền cảnh mờ (lớp 5) – game tự làm mờ, giảm alpha */
  foreground?: PropArt[];
  /** màu đáy biển (cát/bùn): mặt trên, sâu bên dưới, đốm hạt */
  seabed: { top: string; bottom: string; speckle: string; rim?: string };
}
