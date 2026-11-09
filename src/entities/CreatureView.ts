/**
 * Hiển thị một sinh vật trong Phaser từ CreatureArt:
 *  - các lớp "uốn theo thân" được nướng thành 1 texture vẽ trên Phaser Rope → thân uốn sóng sin
 *  - các lớp tách rời là Image, xoay/co giãn quanh pivot theo layerPose() (giống hệt preview)
 *  - lật hướng mượt bằng tween scaleX
 */
import Phaser from 'phaser';
import { layerPose, PROFILE_DEFAULTS, type TentacleSpec } from '../art/contract';
import type { BuiltCreature, BuiltPart } from '../art/rasterize';

interface PartView {
  part: BuiltPart;
  img: Phaser.GameObjects.Image;
}

interface Tentacle {
  spec: TentacleSpec;
  root: Phaser.Math.Vector2; // local px
  pts: { x: number; y: number; px: number; py: number }[];
  seg: number;
  phase: number;
  width: number;
}

export class CreatureView extends Phaser.GameObjects.Container {
  readonly built: BuiltCreature;
  private rope: Phaser.GameObjects.Rope | null = null;
  private bodyImg: Phaser.GameObjects.Image | null = null;
  private ropeBase: { x: number; y: number }[] = [];
  private parts: PartView[] = [];
  private tentacles: Tentacle[] = [];
  private tentGfx: Phaser.GameObjects.Graphics | null = null;
  private t = Math.random() * 10;
  private bendAmpPx: number;
  private hz: number;
  /** 1 = phải, -1 = trái */
  facing = 1;
  private flipTween: Phaser.Tweens.Tween | null = null;
  /** hệ số quẫy (bơi nhanh > 1) */
  intensity = 1;
  alarm = 0;
  /** 0..1 – đang lật (để chấm ảnh "không quay ngang") */
  flipping = false;
  readonly halfW: number;
  readonly halfH: number;

  constructor(scene: Phaser.Scene, x: number, y: number, built: BuiltCreature) {
    super(scene, x, y);
    this.built = built;
    const { art, scale, res } = built;
    const [vw] = art.viewBox;
    const spineY = art.spineY ?? art.viewBox[1] / 2;
    const prof = PROFILE_DEFAULTS[art.animation];
    this.hz = art.cycleHz ?? prof.cycleHz;
    this.bendAmpPx = (art.bendAmp ?? prof.bendAmpRatio * art.lengthUnits) * scale;
    const local = (vx: number, vy: number) => new Phaser.Math.Vector2((vx - vw / 2) * scale, (vy - spineY) * scale);

    const addPart = (p: BuiltPart) => {
      const [cx, cy, cw, ch] = p.crop;
      const pv = p.layer.pivot ?? [cx + cw / 2, cy + ch / 2];
      const img = scene.add.image(0, 0, p.key);
      img.setOrigin((pv[0] - cx) / cw, (pv[1] - cy) / ch);
      const pos = local(pv[0], pv[1]);
      img.setPosition(pos.x, pos.y);
      img.setScale(1 / res);
      if (p.layer.blend === 'add') img.setBlendMode(Phaser.BlendModes.ADD);
      if (p.layer.role === 'alarm') img.setAlpha(0);
      this.add(img);
      this.parts.push({ part: p, img });
    };

    built.back.forEach(addPart);

    // xúc tu mô phỏng (vẽ sau lớp back, trước thân)
    if (art.procedural?.tentacles?.length) {
      this.tentGfx = scene.add.graphics();
      this.add(this.tentGfx);
      for (const spec of art.procedural.tentacles) {
        const n = spec.count ?? 1;
        for (let i = 0; i < n; i++) {
          const off = n > 1 ? ((i / (n - 1)) - 0.5) * (spec.spread ?? 0) : 0;
          const root = local(spec.from[0] + off, spec.from[1]);
          const seg = 10;
          const len = spec.length * scale * (0.8 + Math.random() * 0.4);
          const pts = Array.from({ length: seg + 1 }, (_, k) => ({ x: root.x, y: root.y + (k * len) / seg, px: root.x, py: root.y + (k * len) / seg }));
          this.tentacles.push({ spec, root, pts, seg: len / seg, phase: Math.random() * 6, width: spec.width * scale });
        }
      }
    }

    if (built.body) {
      const [cx, cy, cw, ch] = built.body.crop;
      const center = local(cx + cw / 2, cy + ch / 2);
      const tw = cw * scale * res;
      if (this.bendAmpPx > 0.3) {
        const N = 14;
        const pts: Phaser.Math.Vector2[] = [];
        for (let i = 0; i <= N; i++) pts.push(new Phaser.Math.Vector2(-tw / 2 + (tw * i) / N, 0));
        this.ropeBase = pts.map((p) => ({ x: p.x, y: p.y }));
        this.rope = scene.add.rope(center.x, center.y, built.body.key, undefined, pts as unknown as Phaser.Types.Math.Vector2Like[], true);
        this.rope.setScale(1 / res);
        this.add(this.rope);
      } else {
        this.bodyImg = scene.add.image(center.x, center.y, built.body.key).setScale(1 / res);
        this.add(this.bodyImg);
      }
    }

    built.front.forEach(addPart);

    const [, , cw, ch] = built.body?.crop ?? [0, 0, art.viewBox[0], art.viewBox[1]];
    this.halfW = (cw * scale) / 2;
    this.halfH = (ch * scale) / 2;
    this.setSize(cw * scale, ch * scale);
    scene.add.existing(this);
  }

  /** Khung bao (px game) quanh vị trí – dùng chấm ảnh & va chạm. */
  get displayLength(): number {
    return this.built.art.lengthUnits * this.built.scale;
  }

  face(dir: 1 | -1, instant = false): void {
    if (dir === this.facing) return;
    this.facing = dir;
    this.flipTween?.stop();
    if (instant) {
      this.scaleX = dir * Math.abs(this.scaleY);
      return;
    }
    this.flipping = true;
    this.flipTween = this.scene.tweens.add({
      targets: this,
      scaleX: dir * Math.abs(this.scaleY),
      duration: 340,
      ease: 'Sine.easeInOut',
      onComplete: () => (this.flipping = false),
    });
  }

  tick(dt: number): void {
    this.t += dt * (0.6 + 0.4 * this.intensity);
    const t = this.t;
    const art = this.built.art;
    if (this.rope) {
      const n = this.ropeBase.length;
      const amp = (this.bendAmpPx * this.built.res * Math.min(2.2, this.intensity)) / 1;
      const w = Math.PI * 2 * this.hz;
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1); // 0 = trái (đuôi), 1 = phải (đầu)
        const env = Math.pow(1 - u, 1.6) * 0.92 + 0.08 * Math.pow(u, 3);
        const y = Math.sin(u * Math.PI * 1.6 - t * w) * amp * env;
        this.rope.points[i].y = y;
      }
      this.rope.setDirty();
    } else if (this.bodyImg && art.animation !== 'static') {
      // nhấp nhô nhẹ cho loài không uốn thân
      this.bodyImg.y += 0;
    }
    for (const { part, img } of this.parts) {
      const pose = layerPose(art, part.layer, t, this.intensity, this.alarm);
      img.rotation = pose.rotation;
      img.scaleX = pose.scaleX / this.built.res;
      img.scaleY = pose.scaleY / this.built.res;
      img.alpha = pose.alpha;
    }
    if (this.tentGfx) this.updateTentacles(dt);
  }

  private updateTentacles(dt: number) {
    const g = this.tentGfx!;
    g.clear();
    const sway = Math.sin(this.t * 1.3);
    for (const tc of this.tentacles) {
      const p = tc.pts;
      p[0].x = tc.root.x;
      p[0].y = tc.root.y;
      for (let k = 1; k < p.length; k++) {
        const q = p[k];
        const vx = (q.x - q.px) * 0.9;
        const vy = (q.y - q.py) * 0.9;
        q.px = q.x;
        q.py = q.y;
        q.x += vx + Math.sin(this.t * 2 + tc.phase + k * 0.5) * 0.25 * k * 0.15 + sway * 0.05;
        q.y += vy + 0.25 * dt * 60; // trôi xuống nhẹ (giống trọng lực/kéo dòng)
      }
      for (let iter = 0; iter < 3; iter++) {
        for (let k = 1; k < p.length; k++) {
          const a = p[k - 1];
          const b = p[k];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 1;
          const diff = (d - tc.seg) / d;
          if (k === 1) {
            b.x -= dx * diff;
            b.y -= dy * diff;
          } else {
            a.x += dx * diff * 0.5;
            a.y += dy * diff * 0.5;
            b.x -= dx * diff * 0.5;
            b.y -= dy * diff * 0.5;
          }
        }
        p[0].x = tc.root.x;
        p[0].y = tc.root.y;
      }
      const color = Phaser.Display.Color.HexStringToColor(tc.spec.color).color;
      const op = tc.spec.opacity ?? 0.7;
      for (let k = 1; k < p.length; k++) {
        const wdt = Math.max(0.6, tc.width * (1 - k / p.length));
        g.lineStyle(wdt, color, op * (1 - (k / p.length) * 0.6));
        g.lineBetween(p[k - 1].x, p[k - 1].y, p[k].x, p[k].y);
      }
    }
  }

  /** Nhuộm màu toàn bộ (ngụy trang / san hô...). null = bỏ nhuộm. */
  tintAll(color: number | null): void {
    for (const { img } of this.parts) {
      if (color === null) img.clearTint();
      else img.setTint(color);
    }
    if (this.bodyImg) {
      if (color === null) this.bodyImg.clearTint();
      else this.bodyImg.setTint(color);
    }
    if (this.rope) this.rope.setColors(color ?? 0xffffff);
  }
}
