/**
 * Dựng thế giới một lượt lặn: nước nền, nền xa parallax, đáy biển, vật thể (san hô, đá, cỏ...).
 */
import Phaser from 'phaser';
import { CONFIG } from '../config';
import type { RegionId, Tier } from '../data/types';
import { TIER_INFO } from '../data/types';
import { getEnvironment } from '../art/environment';
import type { PropArt } from '../art/environment/contract-env';
import { buildStatic, RasterSettings } from '../art/rasterize';
import { REGION_WATER, mix, rng, hexToRgb } from '../art/style-bible';

export interface PropInstance {
  art: PropArt;
  obj: Phaser.GameObjects.Image | Phaser.GameObjects.Rope;
  x: number;
  y: number;
  w: number;
  h: number;
  /** va chạm ellipse (san hô) */
  ex: number;
  ey: number;
  erx: number;
  ery: number;
  hitT: number;
}

export interface SolidRock {
  x: number;
  y: number;
  r: number;
}

export class World {
  readonly W: number;
  readonly H: number;
  readonly ground: Float32Array;
  readonly step = 16;
  readonly props: PropInstance[] = [];
  readonly corals: PropInstance[] = [];
  readonly anemones: PropInstance[] = [];
  readonly rocks: SolidRock[] = [];
  private backdrops: { ts: Phaser.GameObjects.TileSprite; parallax: number; texW: number; scale: number }[] = [];
  private swayers: { rope: Phaser.GameObjects.Rope; base: number[]; amp: number; phase: number; n: number }[] = [];
  private bg!: Phaser.GameObjects.Image;
  private surface?: Phaser.GameObjects.TileSprite;
  readonly waterTop: string;
  readonly waterBottom: string;
  private rand: () => number;

  constructor(
    private scene: Phaser.Scene,
    readonly region: RegionId,
    readonly tier: Tier,
    seed: number,
  ) {
    this.W = CONFIG.worldWidth;
    this.H = CONFIG.worldHeight[tier];
    this.rand = rng(seed);
    const n = Math.ceil(this.W / this.step) + 2;
    this.ground = new Float32Array(n);
    const r = this.rand;
    const p1 = r() * 6;
    const p2 = r() * 6;
    const p3 = r() * 6;
    const base = tier === 1 ? this.H * 0.8 : tier === 2 ? this.H * 0.84 : this.H * 0.88;
    for (let i = 0; i < n; i++) {
      const x = i * this.step;
      let y = base + 110 * Math.sin(x / 760 + p1) + 55 * Math.sin(x / 270 + p2) + 16 * Math.sin(x / 83 + p3);
      if (tier === 2 && this.region === 'khoi_xa') y += 120 * Math.max(0, Math.sin(x / 1600 + p1));
      // bờ dốc ở hai đầu bản đồ
      const edge = Math.min(x, this.W - x);
      if (edge < 500) y -= (1 - edge / 500) ** 2 * 380;
      this.ground[i] = Math.max(this.H * 0.55, Math.min(this.H - 150, y));
    }
    const w = REGION_WATER[region] ?? REGION_WATER.mien_trung;
    this.waterTop = tier === 1 ? w.shallow : tier === 2 ? mix(w.shallow, w.deep, 0.55) : mix(w.deep, '#000000', 0.6);
    this.waterBottom = tier === 1 ? w.deep : tier === 2 ? mix(w.deep, '#000000', 0.45) : '#000000';
  }

  groundY(x: number): number {
    const fx = Math.max(0, Math.min(this.W, x)) / this.step;
    const i = Math.floor(fx);
    const t = fx - i;
    const a = this.ground[Math.min(i, this.ground.length - 1)];
    const b = this.ground[Math.min(i + 1, this.ground.length - 1)];
    return a + (b - a) * t;
  }

  /** độ sâu (m) tại toạ độ y */
  depthAt(y: number): number {
    const t = TIER_INFO[this.tier];
    const span = this.tier === 3 ? 700 : t.depthBottom - t.depthTop;
    return Math.max(0, t.depthTop + (y / this.H) * span);
  }

  async build(quality: 'high' | 'low'): Promise<void> {
    const s = this.scene;
    // ---- nước nền (gradient bám theo toạ độ thế giới theo trục dọc) ----
    const wkey = `water:${this.region}:${this.tier}`;
    const g = s.textures.exists(wkey) ? null : s.textures.createCanvas(wkey, 4, 512);
    if (g) {
      const ctx = g.getContext();
      const grd = ctx.createLinearGradient(0, 0, 0, 512);
      grd.addColorStop(0, this.waterTop);
      grd.addColorStop(0.7, mix(this.waterTop, this.waterBottom, 0.75));
      grd.addColorStop(1, this.waterBottom);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 4, 512);
      g.refresh();
    }
    this.bg = s.add
      .image(0, -400, `water:${this.region}:${this.tier}`)
      .setOrigin(0, 0)
      .setScrollFactor(0, 1)
      .setDepth(-100);
    this.bg.setDisplaySize(4000, this.H + 800);

    const env = getEnvironment(this.region);

    // ---- nền xa parallax ----
    for (const b of env.backdrops) {
      if (b.tiers && !b.tiers.includes(this.tier)) continue;
      const texW = 2048;
      const texH = Math.min(1024, Math.round((texW * b.viewBox[1]) / b.viewBox[0]));
      const key = await buildStatic(s, `bd:${this.region}:${b.id}`, b, texW, texH);
      const scale = b.heightPx / texH;
      const avgGround = this.H * (this.tier === 1 ? 0.8 : 0.84);
      const y = b.anchor === 'bottom' ? avgGround - b.heightPx + 80 : this.H * 0.35;
      const ts = s.add.tileSprite(0, y, 3000, texH, key).setOrigin(0, 0).setScrollFactor(0, 1);
      ts.setTileScale(scale, scale);
      ts.setScale(1, 1);
      ts.height = texH * scale;
      ts.setDisplaySize(3000, b.heightPx);
      ts.setAlpha(b.opacity ?? 0.6);
      ts.setDepth(-90 + b.parallax * 10);
      ts.setTint(Phaser.Display.Color.HexStringToColor(mix(this.waterTop, '#ffffff', 0.1)).color);
      this.backdrops.push({ ts, parallax: b.parallax, texW, scale });
    }

    // ---- mặt nước (Tầng 1) ----
    if (this.tier === 1) {
      const key = 'surfaceband';
      if (!s.textures.exists(key)) {
        const c = s.textures.createCanvas(key, 256, 64)!;
        const ctx = c.getContext();
        const grd = ctx.createLinearGradient(0, 0, 0, 64);
        grd.addColorStop(0, 'rgba(230,255,255,0.9)');
        grd.addColorStop(0.25, 'rgba(180,245,255,0.45)');
        grd.addColorStop(1, 'rgba(180,245,255,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(0, 10);
        for (let x = 0; x <= 256; x += 8) ctx.lineTo(x, 8 + Math.sin((x / 256) * Math.PI * 4) * 5);
        ctx.lineTo(256, 64);
        ctx.lineTo(0, 64);
        ctx.fill();
        c.refresh();
      }
      this.surface = s.add.tileSprite(0, -12, this.W, 64, key).setOrigin(0, 0).setDepth(-50).setAlpha(0.8);
      // bầu trời phía trên mặt nước
      s.add.rectangle(0, -600, this.W, 590, 0xbfe9f5).setOrigin(0, 0).setDepth(-60).setAlpha(0.9);
    }

    // ---- đáy biển: cắt thành từng mảnh 1024px ----
    const chunk = 1024;
    // đáy thay đổi theo seed → xoá texture đáy của lượt trước
    for (const k of s.textures.getTextureKeys()) if (k.startsWith('sb:')) s.textures.remove(k);
    let minG = Infinity;
    for (const v of this.ground) minG = Math.min(minG, v);
    const top = Math.floor(minG - 20);
    let avgG = 0;
    for (const v of this.ground) avgG += v / this.ground.length;
    const bottom = this.H + CONFIG.seabedThickness;
    const sb = env.seabed;
    for (let cx = 0; cx < this.W; cx += chunk) {
      const r = rng(cx + 17);
      const pts: string[] = [];
      for (let x = 0; x <= chunk; x += this.step) pts.push(`${x} ${(this.groundY(cx + x) - top).toFixed(1)}`);
      const h = bottom - top;
      let speck = '';
      for (let i = 0; i < 140; i++) {
        const x = r() * chunk;
        const gy = this.groundY(cx + x) - top;
        const y = gy + 6 + r() * Math.min(260, h - gy);
        speck += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.8 + r() * 2.2).toFixed(1)}"/>`;
      }
      let ripples = '';
      for (let i = 0; i < 26; i++) {
        const x = r() * chunk;
        const gy = this.groundY(cx + x) - top + 10 + r() * 50;
        ripples += `<path d="M${x.toFixed(0)} ${gy.toFixed(0)}q14 -5 28 0t28 0" />`;
      }
      const svg = {
        viewBox: [chunk, h] as [number, number],
        defs: `<linearGradient id="sb${cx}" gradientUnits="userSpaceOnUse" x1="0" y1="${(avgG - top - 120).toFixed(0)}" x2="0" y2="${h}"><stop offset="0" stop-color="${sb.top}"/><stop offset="0.35" stop-color="${mix(sb.top, sb.bottom, 0.5)}"/><stop offset="1" stop-color="${sb.bottom}"/></linearGradient>`,
        svg:
          `<path d="M0 ${h}L${pts.join('L')}L${chunk} ${h}Z" fill="url(#sb${cx})"/>` +
          `<g fill="${sb.speckle}" opacity="0.55">${speck}</g>` +
          `<g fill="none" stroke="${sb.speckle}" stroke-opacity="0.35" stroke-width="2">${ripples}</g>` +
          `<path d="M${pts.join('L')}" fill="none" stroke="${sb.rim ?? '#ffffff'}" stroke-opacity="0.45" stroke-width="5"/>`,
      };
      const res = quality === 'high' ? 1 : 0.6;
      const key = await buildStatic(s, `sb:${this.region}:${this.tier}:${cx}`, svg, chunk * res, h * res);
      s.add.image(cx, top, key).setOrigin(0, 0).setDisplaySize(chunk + 1, h).setDepth(10);
    }

    // ---- vật thể trên đáy ----
    const props = env.props.filter((p) => !p.tiers || p.tiers.includes(this.tier));
    if (props.length) await this.placeProps(props, quality);

    // ---- tiền cảnh mờ (gần mắt hơn → trôi nhanh hơn) ----
    const fg = (env.foreground ?? []).filter((p) => !p.tiers || p.tiers.includes(this.tier));
    if (fg.length && quality === 'high') {
      const r = this.rand;
      let x = 300 + r() * 600;
      while (x < this.W + 1800) {
        const p = fg[Math.floor(r() * fg.length)];
        const h = p.heightPx * (0.9 + r() * 0.5);
        const w = (p.viewBox[0] / p.viewBox[1]) * h;
        // vẽ ở độ phân giải thấp rồi phóng to → mờ tự nhiên như ngoài vùng lấy nét
        const key = await buildStatic(s, `fg:${this.region}:${p.id}`, p, Math.max(8, w * 0.3), Math.max(8, h * 0.3));
        const img = s.add.image(x, 0, key).setOrigin(0.5, 1).setDisplaySize(w, h).setDepth(30).setScrollFactor(1.3, 1).setTint(0x4a6a8c);
        this.fgItems.push({ img, h });
        x += 1100 + r() * 1300;
      }
    }
  }

  private fgItems: { img: Phaser.GameObjects.Image; h: number }[] = [];

  private async placeProps(props: PropArt[], quality: 'high' | 'low') {
    const r = this.rand;
    const total = props.reduce((a, p) => a + (p.weight ?? 1), 0);
    const pick = (filter?: (p: PropArt) => boolean) => {
      const list = filter ? props.filter(filter) : props;
      if (!list.length) return props[Math.floor(r() * props.length)];
      const tot = filter ? list.reduce((a, p) => a + (p.weight ?? 1), 0) : total;
      let k = r() * tot;
      for (const p of list) {
        k -= p.weight ?? 1;
        if (k <= 0) return p;
      }
      return list[list.length - 1];
    };
    // vùng rạn dày đặc xen bãi cát trống
    const reefFactor = this.tier === 3 ? 0.25 : this.tier === 2 ? 0.55 : 1;
    let x = 160;
    let anemoneCount = 0;
    while (x < this.W - 160) {
      const zone = Math.sin(x / 900 + 1.3) * 0.5 + 0.5; // 0 = bãi cát, 1 = rạn
      const dense = zone > 0.38;
      let p: PropArt;
      if (anemoneCount < 6 && dense && r() < 0.14) p = pick((q) => q.kind === 'anemone');
      else p = pick(dense ? undefined : (q) => q.kind !== 'coral' || r() < 0.25);
      if (p.kind === 'anemone') anemoneCount++;
      const sizeVar = 0.8 + r() * 0.45;
      const h = p.heightPx * sizeVar;
      const w = (p.viewBox[0] / p.viewBox[1]) * h;
      const gy = this.groundY(x) + 8;
      await this.addProp(p, x, gy, w, h, quality);
      const gap = dense ? (w * 0.45 + 10 + r() * 50) / reefFactor : 90 + r() * 260;
      x += Math.max(30, gap);
    }
  }

  private async addProp(p: PropArt, x: number, gy: number, w: number, h: number, quality: 'high' | 'low') {
    const s = this.scene;
    const res = (quality === 'high' ? RasterSettings.res : 1) * 1.0;
    // một texture cho mỗi loại vật thể, vẽ ở cỡ lớn nhất (tiết kiệm thời gian tải)
    const th = p.heightPx * 1.25 * res;
    const tw = (p.viewBox[0] / p.viewBox[1]) * th;
    const key = await buildStatic(s, `pr:${this.region}:${p.id}`, p, Math.max(8, tw), Math.max(8, th));
    let obj: Phaser.GameObjects.Image | Phaser.GameObjects.Rope;
    const sway = p.sway ?? 0;
    const tex = s.textures.get(key).getSourceImage() as HTMLCanvasElement;
    if (sway > 0.06) {
      const n = 8;
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i <= n; i++) pts.push(new Phaser.Math.Vector2(0, -tex.height + (tex.height * i) / n));
      const rope = s.add.rope(x, gy, key, undefined, pts as unknown as Phaser.Types.Math.Vector2Like[], false);
      rope.setScale(w / tex.width, h / tex.height);
      this.swayers.push({ rope, base: pts.map((q) => q.x), amp: sway * tex.width * 0.25, phase: x * 0.004, n });
      obj = rope;
    } else {
      obj = s.add.image(x, gy, key).setOrigin(0.5, 1).setDisplaySize(w, h);
    }
    obj.setDepth(p.kind === 'rock' ? 11 : 12 + this.rand() * 0.5);
    const inst: PropInstance = {
      art: p,
      obj,
      x,
      y: gy,
      w,
      h,
      ex: x,
      ey: gy - h * 0.45,
      erx: w * 0.38,
      ery: h * 0.42,
      hitT: 0,
    };
    this.props.push(inst);
    if (p.kind === 'coral' || p.kind === 'fan') this.corals.push(inst);
    if (p.kind === 'anemone') this.anemones.push(inst);
    if (p.kind === 'rock' && h > 70) this.rocks.push({ x, y: gy - h * 0.38, r: Math.min(w, h) * 0.46 });
  }

  update(cam: Phaser.Cameras.Scene2D.Camera, time: number, dt: number): void {
    const viewW = cam.width / cam.zoom;
    // vật có scrollFactor 0 được phóng to quanh tâm camera → đặt lệch để phủ kín khung nhìn
    const left = cam.width / 2 - viewW / 2 - 20;
    for (const b of this.backdrops) {
      b.ts.setDisplaySize(viewW + 40, b.ts.displayHeight);
      b.ts.x = left;
      b.ts.tilePositionX = (cam.scrollX * b.parallax) / b.scale;
    }
    if (this.bg) {
      this.bg.setDisplaySize(viewW + 40, this.H + 800);
      this.bg.x = left;
    }
    if (this.surface) this.surface.tilePositionX = time * 0.02;
    // tiền cảnh: bám theo đáy tại vị trí nó đang hiện ra trên màn hình
    for (const f of this.fgItems) {
      // nhô lên từ mép dưới màn hình, chỉ hiện khi camera ở sát đáy
      const apparentX = f.img.x - cam.scrollX * 0.3;
      const bottom = cam.worldView.bottom;
      f.img.y = bottom + f.h * 0.45;
      const near = (bottom - (this.groundY(apparentX) - 40)) / 260;
      f.img.setAlpha(Math.max(0, Math.min(1, near)) * 0.8);
    }
    const vl = cam.worldView.x - 200;
    const vr = cam.worldView.right + 200;
    for (const sw of this.swayers) {
      if (sw.rope.x < vl || sw.rope.x > vr) continue;
      for (let i = 0; i <= sw.n; i++) {
        const u = 1 - i / sw.n; // 1 = ngọn
        sw.rope.points[i].x = sw.base[i] + Math.sin(time * 0.0012 + sw.phase + u * 1.4) * sw.amp * u * u;
      }
      sw.rope.setDirty();
    }
    for (const c of this.corals) {
      if (c.hitT > 0) {
        c.hitT -= dt;
        const k = Math.max(0, c.hitT / 2.5);
        const col = Phaser.Display.Color.Interpolate.ColorWithColor(
          new Phaser.Display.Color(255, 255, 255),
          new Phaser.Display.Color(236, 236, 228),
          100,
          Math.round(k * 100),
        );
        const tint = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
        if ('setTint' in c.obj) (c.obj as Phaser.GameObjects.Image).setTint(tint);
        (c.obj as Phaser.GameObjects.Image).setAlpha(1 - k * 0.35);
        if (c.hitT <= 0) {
          if (c.obj instanceof Phaser.GameObjects.Image) c.obj.clearTint();
          c.obj.setAlpha(1);
        }
      }
    }
  }

  /** màu nước (0..1) để làm sương trong shader */
  waterRGB(): [number, number, number] {
    const [r, g, b] = hexToRgb(mix(this.waterTop, this.waterBottom, 0.5));
    return [r / 255, g / 255, b / 255];
  }
}
