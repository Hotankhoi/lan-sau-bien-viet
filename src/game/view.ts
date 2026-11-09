/** Quản lý độ phân giải màn hình (HiDPI) và mức phóng to camera. */
import { Save } from '../systems/Save';

export const View = {
  get dpr(): number {
    return Save.data.settings.quality === 'high' ? Math.min(2, window.devicePixelRatio || 1) : 1;
  },
  get cssW(): number {
    return Math.max(320, window.innerWidth || 0);
  },
  get cssH(): number {
    return Math.max(240, window.innerHeight || 0);
  },
  /** px thế giới / px CSS */
  get baseZoom(): number {
    const z = Math.min(this.cssW / 1360, this.cssH / 780);
    return Math.max(0.55, Math.min(1.25, z));
  },
};
