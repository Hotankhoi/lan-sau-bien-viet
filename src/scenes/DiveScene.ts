/**
 * Cảnh lặn: thợ lặn, sinh vật, máy ảnh, oxy, san hô, rác, sinh vật nguy hiểm.
 * mode 'title' dùng làm nền động cho màn hình tiêu đề (không có thợ lặn, camera tự trôi).
 */
import Phaser from 'phaser';
import { CONFIG } from '../config';
import { SPECIES_BY_ID, RARITY_INFO, DANGER_INFO, speciesOf, type RegionId, type Species, type Tier } from '../data/types';
import { getArt } from '../art/species';
import { displayLengthFor } from '../art/contract';
import { buildCreature, buildStatic } from '../art/rasterize';
import diverArt from '../art/diver';
import subArt from '../art/submarine';
import { TRASH } from '../art/trash';
import { CreatureView } from '../entities/CreatureView';
import { World } from '../systems/World';
import { Creature, updateCreature, type DiverInfo } from '../systems/Behavior';
import { WaterFX } from '../shaders/WaterFX';
import { Save } from '../systems/Save';
import { Sound } from '../systems/Audio';
import { checkAchievements } from '../systems/Achievement';
import { bus, type DiveSummary, type HudState, type PhotoResult } from '../game/bus';
import { Input } from '../game/input';
import { View } from '../game/view';
import { rng } from '../art/style-bible';

export interface DiveParams {
  region: RegionId;
  tier: Tier;
  mode: 'dive' | 'title';
}

interface Trash {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  phase: number;
  taken: boolean;
}

interface Mote {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  par: number;
}

const TUTORIAL = [
  { id: 'move', text: 'Dùng W A S D (hoặc phím mũi tên / joystick) để bơi. Giữ Shift để bơi nhanh – nhưng tốn oxy và làm cá hoảng!' },
  { id: 'aim', text: 'Giữ Space hoặc chuột phải để NGẮM máy ảnh. Khung ngắm hiện ra trước mặt bạn.' },
  { id: 'photo', text: 'Đưa sinh vật vào giữa khung, đủ gần, giữ yên tay rồi nhả Space (hoặc bấm chuột trái) để CHỤP. Thử chụp cá khoang cổ quanh hải quỳ!' },
  { id: 'calm', text: 'Bơi CHẬM khi lại gần sinh vật – nếu lao tới, chúng sẽ hoảng sợ bỏ chạy. Đừng chạm vào san hô nhé!' },
  { id: 'trash', text: 'Thấy rác nhựa trôi? Bơi chạm vào để nhặt và nhận Điểm Xanh ♻️' },
  { id: 'surface', text: 'Theo dõi thanh OXY. Giữ Q một giây để nổi lên khi muốn kết thúc lượt lặn.' },
];

export class DiveScene extends Phaser.Scene {
  params!: DiveParams;
  world!: World;
  ready = false;
  fx: WaterFX | null = null;
  creatures: Creature[] = [];
  trash: Trash[] = [];
  motes: Mote[] = [];
  rays: Phaser.GameObjects.Image[] = [];
  diver: CreatureView | null = null;
  dx = 0;
  dy = 0;
  dvx = 0;
  dvy = 0;
  stillTime = 0;
  oxygen = 1;
  oxygenMax = CONFIG.oxygen.baseSeconds;
  lampOn = false;
  lampAng = 0;
  aiming = false;
  aimFocus = 0;
  photoCooldown = 0;
  scanCooldown = 0;
  surfaceT = 0;
  hurtT = 0;
  slowmo = 1;
  slowmoT = 0;
  elapsed = 0;
  ended = false;
  hudT = 0;
  lowO2Beep = 0;
  bubbleT = 0;
  bubbles!: Phaser.GameObjects.Particles.ParticleEmitter;
  scanRing: Phaser.GameObjects.Graphics | null = null;
  scanR = 0;
  session = { photos: [] as PhotoResult[], newSpecies: [] as string[], research: 0, green: 0, trash: 0, coralHits: 0, dangerHits: [] as string[] };
  tutorialStep = -1;
  tutorialMoved = 0;
  tutorialT = 0;
  camDriftX = 0;
  private offs: (() => void)[] = [];

  constructor() {
    super('Dive');
  }

  init(p: DiveParams) {
    this.params = p;
    this.ready = false;
    this.ended = false;
    this.creatures = [];
    this.trash = [];
    this.motes = [];
    this.rays = [];
    this.diver = null;
    this.oxygen = 1;
    this.elapsed = 0;
    this.surfaceT = 0;
    this.session = { photos: [], newSpecies: [], research: 0, green: 0, trash: 0, coralHits: 0, dangerHits: [] };
    this.lampOn = p.tier >= 2;
    this.slowmo = 1;
    this.tutorialStep = -1;
  }

  create() {
    const cam = this.cameras.main;
    cam.setBackgroundColor('#04182b');
    if (this.game.renderer.type === Phaser.WEBGL) {
      const r = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
      if (!r.pipelines.postPipelineClasses.has('WaterFX')) r.pipelines.addPostPipeline('WaterFX', WaterFX);
      cam.setPostPipeline(WaterFX);
      this.fx = cam.getPostPipeline(WaterFX) as WaterFX;
    }
    this.events.once('shutdown', () => this.cleanup());
    this.setup().catch((e) => {
      console.error(e);
      bus.emit('error', String(e));
    });
  }

  private cleanup() {
    this.offs.forEach((f) => f());
    this.offs = [];
    Sound.stopAmbient();
  }

  private async setup() {
    const p = this.params;
    const quality = Save.data.settings.quality;
    const seed = (Date.now() & 0xffff) + p.tier * 101;
    this.world = new World(this, p.region, p.tier, seed);
    bus.emit('loading', 0.1);
    await this.world.build(quality);
    bus.emit('loading', 0.45);
    this.makeSharedTextures();
    this.makeRays();
    this.makeMotes();
    await this.spawnCreatures(seed);
    bus.emit('loading', 0.85);
    await this.spawnTrash(seed);
    if (p.mode === 'dive') await this.spawnDiver();
    const cam = this.cameras.main;
    cam.setBounds(0, p.tier === 1 ? -260 : 0, this.world.W, this.world.H + 120);
    this.applyZoom();
    if (p.mode === 'title') {
      this.camDriftX = 600 + Math.random() * 1500;
      cam.centerOn(this.camDriftX, this.world.H * 0.62);
    } else {
      cam.centerOn(this.dx, this.dy);
      Sound.startAmbient((p.tier - 1) / 2);
    }
    const onResize = () => this.applyZoom();
    window.addEventListener('resize', onResize);
    this.offs.push(() => window.removeEventListener('resize', onResize));
    const skip = () => this.setTutorial(TUTORIAL.length);
    bus.on('tutorial:skip', skip);
    this.offs.push(() => bus.off('tutorial:skip', skip));
    const force = () => this.diver && this.endDive('surface');
    bus.on('force:surface', force);
    this.offs.push(() => bus.off('force:surface', force));
    if (p.mode === 'dive' && !Save.data.tutorialDone && Save.data.settings.tutorial && p.region === 'mien_trung' && p.tier === 1) this.setTutorial(0);
    this.ready = true;
    bus.emit('loading', 1);
    bus.emit('dive:ready', p);
  }

  applyZoom() {
    const dpr = View.dpr;
    const w = Math.round(View.cssW * dpr);
    const h = Math.round(View.cssH * dpr);
    if (this.scale.width !== w || this.scale.height !== h) this.scale.resize(w, h);
    this.cameras.main.setZoom(View.baseZoom * dpr * (this.params.mode === 'title' ? 0.9 : 1));
  }

  // ---------------- Dựng ----------------

  private makeSharedTextures() {
    if (!this.textures.exists('dot')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(8, 8, 8);
      g.generateTexture('dot', 16, 16);
      g.clear();
      g.lineStyle(2, 0xffffff, 0.9);
      g.strokeCircle(12, 12, 10);
      g.fillStyle(0xffffff, 0.25);
      g.fillCircle(12, 12, 10);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(8, 8, 3);
      g.generateTexture('bubble', 24, 24);
      g.destroy();
    }
    if (!this.textures.exists('ray')) {
      const c = this.textures.createCanvas('ray', 128, 512)!;
      const ctx = c.getContext();
      const gx = ctx.createLinearGradient(0, 0, 128, 0);
      gx.addColorStop(0, 'rgba(255,255,255,0)');
      gx.addColorStop(0.5, 'rgba(255,255,240,1)');
      gx.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gx;
      ctx.fillRect(0, 0, 128, 512);
      ctx.globalCompositeOperation = 'destination-in';
      const gy = ctx.createLinearGradient(0, 0, 0, 512);
      gy.addColorStop(0, 'rgba(0,0,0,1)');
      gy.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gy;
      ctx.fillRect(0, 0, 128, 512);
      c.refresh();
    }
    this.bubbles = this.add.particles(0, 0, 'bubble', {
      lifespan: 2600,
      speedY: { min: -150, max: -90 },
      speedX: { min: -18, max: 18 },
      scale: { start: 0.25, end: 0.6 },
      alpha: { start: 0.85, end: 0 },
      emitting: false,
    });
    this.bubbles.setDepth(26);
  }

  private makeRays() {
    const t = this.params.tier;
    if (t === 3) return;
    const r = rng(77);
    const n = 9;
    for (let i = 0; i < n; i++) {
      const img = this.add.image(r() * this.world.W, -30, 'ray').setOrigin(0.5, 0);
      img.setBlendMode(Phaser.BlendModes.ADD);
      img.setDisplaySize(140 + r() * 260, (t === 1 ? 1500 : 900) + r() * 600);
      img.setRotation(-0.22 + r() * 0.12);
      img.setAlpha(t === 1 ? 0.11 : 0.05);
      img.setDepth(-40);
      img.setData('phase', r() * 6);
      img.setData('base', img.alpha);
      this.rays.push(img);
    }
  }

  private makeMotes() {
    const t = this.params.tier;
    const n = Save.data.settings.quality === 'high' ? (t === 1 ? 90 : 140) : 50;
    const r = rng(5);
    for (let i = 0; i < n; i++) {
      const par = 0.6 + r() * 0.7;
      const img = this.add.image(0, 0, 'dot').setDepth(par > 1.1 ? 30 : 14);
      const size = t === 1 ? 1.5 + r() * 2.5 : 1.2 + r() * 2.2;
      img.setDisplaySize(size * par, size * par);
      img.setAlpha(t === 1 ? 0.25 + r() * 0.3 : 0.35 + r() * 0.4);
      img.setTint(t === 3 ? 0xcfe8ff : 0xe8fff8);
      this.motes.push({ img, x: r() * 2000, y: r() * 1200, vx: (r() - 0.5) * 6, vy: t === 1 ? (r() - 0.5) * 6 : 6 + r() * 10, par });
    }
  }

  private pickSpecies(seed: number): { sp: Species; n: number }[] {
    const p = this.params;
    const r = rng(seed * 7 + 3);
    const pool = speciesOf(p.region, p.tier);
    if (!pool.length) return [];
    const total = CONFIG.spawn.creaturesPerDive[p.tier];
    const picks: { sp: Species; n: number }[] = [];
    // bảo đảm mỗi loài thường/ít gặp xuất hiện ít nhất 1 lần; loài hiếm 65%
    for (const sp of pool) {
      if (sp.rarity === 'thuong_gap' || sp.rarity === 'it_gap') picks.push({ sp, n: 1 });
      else if (sp.rarity === 'hiem' && r() < 0.65) picks.push({ sp, n: 1 });
    }
    const legend = pool.filter((s) => s.rarity === 'huyen_thoai');
    const dives = Save.data.stats.divesByRegion[p.region] ?? 0;
    const chance = CONFIG.spawn.legendaryChance + Math.min(0.35, dives * 0.06);
    if (legend.length && (r() < chance || p.mode === 'title')) picks.push({ sp: legend[Math.floor(r() * legend.length)], n: 1 });
    const nonLegend = pool.filter((s) => s.rarity !== 'huyen_thoai');
    const wsum = nonLegend.reduce((a, s) => a + RARITY_INFO[s.rarity].weight, 0);
    while (picks.reduce((a, q) => a + q.n, 0) < total && nonLegend.length) {
      let k = r() * wsum;
      let chosen = nonLegend[0];
      for (const s of nonLegend) {
        k -= RARITY_INFO[s.rarity].weight;
        if (k <= 0) {
          chosen = s;
          break;
        }
      }
      picks.push({ sp: chosen, n: 1 });
    }
    return picks;
  }

  private async spawnCreatures(seed: number) {
    const picks = this.pickSpecies(seed);
    const r = rng(seed + 99);
    const W = this.world.W;
    const anemones = [...this.world.anemones];
    let ai = 0;
    for (const { sp } of picks) {
      const art = getArt(sp.id);
      const built = await buildCreature(this, art, displayLengthFor(sp.sizeCm, art));
      const groupSize = sp.behavior === 'school' ? 4 + Math.floor(r() * 4) : sp.id === 'ca_khoang_co' ? 2 + Math.floor(r() * 2) : 1;
      let x = 400 + r() * (W - 800);
      if (sp.id === 'ca_khoang_co' && anemones.length) {
        const a = anemones[ai++ % anemones.length];
        x = a.x;
      }
      if (sp.behavior === 'camouflage' && this.world.rocks.length) {
        const rock = this.world.rocks[Math.floor(r() * this.world.rocks.length)];
        x = rock.x + (r() < 0.5 ? -1 : 1) * (rock.r + 30);
      }
      const gy = this.world.groundY(x);
      const group: Creature[] = [];
      for (let i = 0; i < groupSize; i++) {
        const gx = x + (r() - 0.5) * 160;
        let y: number;
        const ground = this.world.groundY(gx);
        if (sp.behavior === 'static' || sp.behavior === 'camouflage' || sp.behavior === 'buried') y = ground - 10;
        else if (sp.id === 'ca_khoang_co') y = gy - 70 - r() * 60;
        else y = Phaser.Math.Clamp(ground - 130 - r() * Math.min(700, ground * 0.6), 160, ground - 110);
        const view = new CreatureView(this, gx, y, built);
        view.setDepth(sp.behavior === 'buried' ? 9 : 15 + r() * 2);
        const c = new Creature(sp, view, gx, y);
        if (sp.id === 'ca_khoang_co') {
          c.homeX = x;
          c.homeY = gy - 80;
        }
        if (groupSize > 1 && sp.behavior === 'school') {
          c.group = group;
          group.push(c);
        }
        view.face(r() < 0.5 ? 1 : -1, true);
        this.creatures.push(c);
      }
    }
  }

  private async spawnTrash(seed: number) {
    const r = rng(seed + 5);
    const n = this.params.tier === 3 ? 4 : CONFIG.spawn.trashPerDive;
    for (let i = 0; i < n; i++) {
      const t = TRASH[Math.floor(r() * TRASH.length)];
      const key = await buildStatic(this, `trash:${t.id}`, { viewBox: t.viewBox, defs: '', svg: t.svg }, t.sizePx * 2.2, (t.sizePx * 2.2 * t.viewBox[1]) / t.viewBox[0]);
      const x = 300 + r() * (this.world.W - 600);
      const gy = this.world.groundY(x);
      const onBottom = t.id === 'net' || r() < 0.3;
      const y = onBottom ? gy - 18 : 160 + r() * (gy - 380);
      const img = this.add.image(x, y, key).setDepth(18);
      img.setDisplaySize(t.sizePx, (t.sizePx * t.viewBox[1]) / t.viewBox[0]);
      img.setData('name', t.name);
      this.trash.push({ img, x, y, vx: onBottom ? 0 : (r() - 0.5) * 12, phase: r() * 6, taken: false });
    }
  }

  private async spawnDiver() {
    const sub = this.params.tier === 3;
    const built = await buildCreature(this, sub ? subArt : diverArt, sub ? 230 : 156);
    this.diver = new CreatureView(this, 0, 0, built);
    this.diver.setDepth(20);
    this.dx = 700;
    this.dy = Math.max(120, this.world.groundY(700) - 520);
    this.dvx = 0;
    this.dvy = 40;
    const tankLv = Save.level('tank');
    this.oxygenMax = CONFIG.oxygen.baseSeconds + tankLv * CONFIG.oxygen.perTankLevel;
  }

  // ---------------- Hướng dẫn ----------------

  private setTutorial(step: number) {
    this.tutorialStep = step;
    this.tutorialT = 0;
    if (step >= TUTORIAL.length) {
      bus.emit('tutorial', null);
      if (!Save.data.tutorialDone) Save.update((d) => (d.tutorialDone = true));
      return;
    }
    bus.emit('tutorial', { step, total: TUTORIAL.length, text: TUTORIAL[step].text });
  }

  private tutorialTick(dt: number) {
    if (this.tutorialStep < 0 || this.tutorialStep >= TUTORIAL.length) return;
    this.tutorialT += dt;
    const id = TUTORIAL[this.tutorialStep].id;
    let done = false;
    if (id === 'move') done = this.tutorialMoved > 350;
    else if (id === 'aim') done = this.aiming && this.tutorialT > 0.5;
    else if (id === 'photo') done = this.session.photos.length > 0;
    else done = this.tutorialT > 7;
    if (done) this.setTutorial(this.tutorialStep + 1);
  }

  // ---------------- Vòng lặp ----------------

  update(time: number, deltaMs: number) {
    if (!this.ready) return;
    const realDt = Math.min(0.05, deltaMs / 1000);
    if (Input.paused && this.params.mode === 'dive') {
      this.updateFx(time);
      return;
    }
    if (this.slowmoT > 0) {
      this.slowmoT -= realDt;
      if (this.slowmoT <= 0) this.slowmo = 1;
    }
    const dt = realDt * this.slowmo;
    this.elapsed += dt;
    const cam = this.cameras.main;

    if (this.params.mode === 'dive' && this.diver && !this.ended) this.updateDiver(dt);
    if (this.params.mode === 'title') {
      this.camDriftX += dt * 28;
      if (this.camDriftX > this.world.W - 900) this.camDriftX = 600;
      cam.centerOn(this.camDriftX, this.world.H * 0.62 + Math.sin(time * 0.0002) * 80);
    }

    const info: DiverInfo = this.diver
      ? { x: this.dx, y: this.dy, vx: this.dvx, vy: this.dvy, speed: Math.hypot(this.dvx, this.dvy), stillTime: this.stillTime, lampOn: this.lampOn, lampAng: this.lampAng, lampRange: this.lampRange(), lampCone: this.lampCone() }
      : { x: -9999, y: -9999, vx: 0, vy: 0, speed: 0, stillTime: 0, lampOn: false, lampAng: 0, lampRange: 0, lampCone: 0 };

    const viewL = cam.worldView.x - 300;
    const viewR = cam.worldView.right + 300;
    for (const c of this.creatures) {
      const near = c.x > viewL - 600 && c.x < viewR + 600;
      if (!near && c.sp.behavior !== 'fast_pass') {
        c.view.setVisible(false);
        continue;
      }
      const res = updateCreature(c, info, this.world, dt, time);
      if (res.scaredRare && this.params.mode === 'dive') {
        this.addGreen(CONFIG.green.scareRare, `Bạn làm ${c.sp.nameVi} hoảng sợ`);
      }
      c.view.setPosition(c.x, c.y);
      const onScreen = c.x > viewL && c.x < viewR;
      if (c.sp.behavior !== 'fast_pass') c.view.setVisible(onScreen);
      if (c.view.visible) c.view.tick(dt);
      if (this.diver && !this.ended) this.checkDanger(c);
    }

    this.updateTrash(dt, time);
    this.world.update(cam, time, dt);
    this.updateMotes(dt, cam);
    for (const ray of this.rays) {
      ray.alpha = (ray.getData('base') as number) * (0.6 + 0.4 * Math.sin(time * 0.0004 + (ray.getData('phase') as number)));
    }
    if (this.scanRing) {
      this.scanR += dt * 900;
      this.scanRing.clear();
      this.scanRing.lineStyle(4, 0x4fe3d3, Math.max(0, 1 - this.scanR / 560));
      this.scanRing.strokeCircle(this.dx, this.dy, this.scanR);
      if (this.scanR > 560) {
        this.scanRing.destroy();
        this.scanRing = null;
      }
    }
    this.updateFx(time);
    if (this.params.mode === 'dive') {
      this.tutorialTick(realDt);
      this.hudT -= realDt;
      if (this.hudT <= 0) {
        this.hudT = 1 / 20;
        this.emitHud();
      }
    }
  }

  lampRange() {
    return Save.level('lamp') ? CONFIG.lamp.rangeHi : CONFIG.lamp.range;
  }
  lampCone() {
    return Save.level('lamp') ? CONFIG.lamp.coneHi : CONFIG.lamp.cone;
  }

  private updateDiver(dt: number) {
    const d = CONFIG.diver;
    const finsLv = Save.level('fins');
    // ---- điều khiển ----
    let ix = Input.moveX + Input.stickX;
    let iy = Input.moveY + Input.stickY;
    const il = Math.hypot(ix, iy);
    if (il > 1) {
      ix /= il;
      iy /= il;
    }
    const sprint = Input.sprint && il > 0.1 && !this.aiming;
    const maxSpeed = (sprint ? d.sprintSpeed : d.maxSpeed) * (1 + finsLv * 0.12) * (this.aiming ? 0.55 : 1);
    this.dvx += ix * d.accel * (sprint ? 1.4 : 1) * dt;
    this.dvy += iy * d.accel * (sprint ? 1.4 : 1) * dt;
    const drag = Math.exp(-d.drag * dt * (il > 0.1 ? 0.6 : 1));
    this.dvx *= drag;
    this.dvy *= drag;
    const sp = Math.hypot(this.dvx, this.dvy);
    if (sp > maxSpeed) {
      this.dvx *= maxSpeed / sp;
      this.dvy *= maxSpeed / sp;
    }
    // trôi nhẹ khi đứng yên
    this.dvy += Math.sin(this.elapsed * 0.9) * 2 * dt;
    this.dx += this.dvx * dt;
    this.dy += this.dvy * dt;
    this.tutorialMoved += sp * dt;
    // ---- va chạm biên, mặt nước, đáy, đá ----
    const W = this.world.W;
    this.dx = Phaser.Math.Clamp(this.dx, 80, W - 80);
    const minY = this.params.tier === 1 ? 40 : 60;
    if (this.dy < minY) {
      this.dy = minY;
      this.dvy = Math.max(0, this.dvy);
    }
    const gy = this.world.groundY(this.dx) - 34;
    if (this.dy > gy) {
      this.dy = gy;
      this.dvy = Math.min(0, this.dvy) * 0.3;
    }
    for (const rock of this.world.rocks) {
      const ox = this.dx - rock.x;
      const oy = this.dy - rock.y;
      const dd = Math.hypot(ox, oy);
      const minD = rock.r + d.radius;
      if (dd < minD && dd > 0.01) {
        this.dx = rock.x + (ox / dd) * minD;
        this.dy = rock.y + (oy / dd) * minD;
        const vn = (this.dvx * ox + this.dvy * oy) / dd;
        if (vn < 0) {
          this.dvx -= (vn * ox) / dd;
          this.dvy -= (vn * oy) / dd;
        }
      }
    }
    // ---- san hô ----
    for (const c of this.world.corals) {
      const nx = (this.dx - c.ex) / (c.erx + d.radius * 0.6);
      const ny = (this.dy - c.ey) / (c.ery + d.radius * 0.6);
      if (nx * nx + ny * ny < 1 && c.hitT <= 0) {
        c.hitT = 2.5;
        this.session.coralHits++;
        this.addGreen(CONFIG.green.coralHit, 'San hô cần hàng chục năm để phục hồi');
        Sound.coral();
        bus.emit('coral');
        this.dvx *= -0.4;
        this.dvy *= -0.4;
      }
    }
    // ---- hướng & tư thế ----
    const speedNow = Math.hypot(this.dvx, this.dvy);
    this.stillTime = speedNow < 25 ? this.stillTime + dt : 0;
    if (!this.aiming && Math.abs(this.dvx) > 15) this.diver!.face(this.dvx > 0 ? 1 : -1);
    if (this.aiming) {
      const ax = this.aimPoint().x;
      if (Math.abs(ax - this.dx) > 30) this.diver!.face(ax > this.dx ? 1 : -1);
    }
    const tilt = Phaser.Math.Clamp(Math.atan2(this.dvy, Math.abs(this.dvx) + 60) * 0.7, -0.6, 0.6);
    this.diver!.rotation += (tilt * this.diver!.facing - this.diver!.rotation) * Math.min(1, dt * 4);
    this.diver!.intensity = 0.4 + Math.min(2, speedNow / 150);
    this.diver!.setPosition(this.dx, this.dy);
    this.diver!.tick(dt);
    // ---- camera ----
    const cam = this.cameras.main;
    const lead = this.dvx * 0.5;
    const tx = this.dx + lead;
    const ty = this.dy + this.dvy * 0.3;
    const cx = cam.midPoint.x + (tx - cam.midPoint.x) * Math.min(1, dt * 3);
    const cy = cam.midPoint.y + (ty - cam.midPoint.y) * Math.min(1, dt * 3);
    cam.centerOn(cx, cy);
    // ---- bong bóng thở ----
    this.bubbleT -= dt;
    if (this.bubbleT <= 0) {
      this.bubbleT = sprint ? 1.2 : 2.6 + Math.random();
      const hx = this.dx + this.diver!.facing * (this.params.tier === 3 ? -120 : 66);
      this.bubbles.explode(4 + Math.floor(Math.random() * 4), hx, this.dy - 8);
      if (Math.random() < 0.5) Sound.bubble();
    }
    // ---- đèn ----
    if (Input.lampToggle) {
      Input.lampToggle = false;
      this.lampOn = !this.lampOn;
      Sound.ui();
    }
    const aimP = this.aiming ? this.aimPoint() : null;
    const targetAng = aimP ? Math.atan2(aimP.y - this.dy, aimP.x - this.dx) : this.diver!.facing > 0 ? Math.atan2(this.dvy * 0.3, 1) : Math.atan2(this.dvy * 0.3, -1);
    this.lampAng = Phaser.Math.Angle.RotateTo(this.lampAng, targetAng, dt * 5);
    // ---- quét ----
    if (this.scanCooldown > 0) this.scanCooldown -= dt;
    if (Input.scan) {
      Input.scan = false;
      this.doScan();
    }
    // ---- máy ảnh ----
    this.photoCooldown -= dt;
    const wasAiming = this.aiming;
    this.aiming = Input.aim;
    if (this.aiming) this.aimFocus = Math.min(1, this.aimFocus + dt * 2.2 * (speedNow < 60 ? 1 : 0.4));
    else this.aimFocus = 0;
    if (Input.shoot && (wasAiming || this.aiming) && this.photoCooldown <= 0) this.takePhoto();
    Input.shoot = false;
    // ---- oxy ----
    const mul = (sprint ? CONFIG.oxygen.sprintMul * (1 - finsLv * 0.12) : 1) * CONFIG.oxygen.tierMul[this.params.tier];
    this.oxygen -= (dt * mul) / this.oxygenMax;
    if (this.oxygen < CONFIG.oxygen.lowThreshold) {
      this.lowO2Beep -= dt;
      if (this.lowO2Beep <= 0) {
        this.lowO2Beep = 1.6;
        Sound.lowOxygen();
      }
    }
    if (this.hurtT > 0) this.hurtT -= dt;
    // ---- nổi lên ----
    if (Input.surfaceHold) this.surfaceT += dt;
    else this.surfaceT = Math.max(0, this.surfaceT - dt * 2);
    if (this.surfaceT >= 1) this.endDive('surface');
    else if (this.oxygen <= 0) {
      this.oxygen = 0;
      this.endDive('oxygen');
    }
  }

  /** Tâm khung ngắm (toạ độ thế giới). */
  aimPoint(): Phaser.Math.Vector2 {
    const cam = this.cameras.main;
    const recentMouse = !Input.usingTouch && performance.now() - Input.pointerMovedAt < 2500;
    if (recentMouse) {
      const dpr = View.dpr;
      return cam.getWorldPoint(Input.pointerX * dpr, Input.pointerY * dpr);
    }
    const f = this.diver?.facing ?? 1;
    return new Phaser.Math.Vector2(this.dx + f * 250, this.dy - 10);
  }

  /** Khung ngắm theo px CSS (cho DOM) và theo thế giới. */
  frameRects() {
    const cam = this.cameras.main;
    const p = this.aimPoint();
    const dpr = View.dpr;
    const fw = CONFIG.photo.frameW;
    const fh = CONFIG.photo.frameH;
    // toạ độ màn hình (CSS px) của tâm
    const sx = ((p.x - cam.worldView.x) * cam.zoom) / dpr;
    const sy = ((p.y - cam.worldView.y) * cam.zoom) / dpr;
    const cx = Phaser.Math.Clamp(sx, fw / 2 + 8, View.cssW - fw / 2 - 8);
    const cy = Phaser.Math.Clamp(sy, fh / 2 + 8, View.cssH - fh / 2 - 8);
    const screen = { x: cx - fw / 2, y: cy - fh / 2, w: fw, h: fh };
    const k = dpr / cam.zoom;
    const world = new Phaser.Geom.Rectangle(cam.worldView.x + screen.x * k, cam.worldView.y + screen.y * k, fw * k, fh * k);
    return { screen, world };
  }

  private grade(frame: Phaser.Geom.Rectangle): { c: Creature | null; q: number; reason?: string } {
    let best: Creature | null = null;
    let bestQ = 0;
    let reason = 'Không có sinh vật nào trong khung';
    const macro = Save.level('macro') > 0;
    const fArea = frame.width * frame.height;
    const speed = Math.hypot(this.dvx, this.dvy);
    for (const c of this.creatures) {
      if (!c.view.visible || !c.identifiable) continue;
      const b = c.bounds;
      const inter = Phaser.Geom.Rectangle.Intersection(frame, b);
      const bArea = b.width * b.height;
      const frac = (inter.width * inter.height) / bArea;
      const covers = (inter.width * inter.height) / fArea;
      if (frac < 0.4 && covers < 0.5) continue;
      const fr = Math.min(1, frac / 0.92);
      const dc = Math.hypot(b.centerX - frame.centerX, b.centerY - frame.centerY);
      const center = 1 - Math.min(1, dc / (0.5 * Math.hypot(frame.width, frame.height)));
      const fill = bArea / fArea;
      const small = c.sp.sizeCm < 25;
      const lo = small ? (macro ? 0.05 : 0.14) : 0.12;
      let fillS = fill < lo ? fill / lo : fill > 1.6 ? 0.75 : 1;
      if (small && !macro) fillS *= 0.85;
      const motion = Math.abs(c.vy) / (Math.abs(c.vx) + Math.abs(c.vy) + 1);
      const side = (c.view.flipping ? 0.35 : 1) * (1 - motion * 0.5);
      let occl = 1;
      for (const o of this.creatures) {
        if (o === c || !o.view.visible || o.sp.id === c.sp.id) continue;
        if (o.view.depth < c.view.depth) continue;
        const ob = Phaser.Geom.Rectangle.Intersection(b, o.bounds);
        occl -= ((ob.width * ob.height) / bArea) * 0.8;
      }
      occl = Math.max(0, occl);
      const steady = speed < 45 ? 1 : speed < 140 ? 1 - (speed - 45) / 190 : 0.45;
      const light = this.params.tier > 1 ? 0.55 + 0.45 * Math.min(1, c.litAmt * 1.6) : 1;
      const focus = 0.75 + 0.25 * this.aimFocus;
      const q = (center * 0.27 + fillS * 0.27 + fr * 0.14 + side * 0.1 + occl * 0.1 + steady * 0.12) * light * focus;
      if (q > bestQ) {
        bestQ = q;
        best = c;
      }
    }
    if (!best && this.creatures.some((c) => c.sp.behavior === 'camouflage' && c.revealT <= 0 && frame.contains(c.x, c.y))) reason = 'Có gì đó lạ lẫn trong đá… thử dùng máy quét (E)';
    return { c: best, q: bestQ, reason };
  }

  private takePhoto() {
    this.photoCooldown = CONFIG.photo.cooldown;
    const { screen, world } = this.frameRects();
    const g = this.grade(world);
    Sound.shutter();
    bus.emit('flash');
    const dpr = View.dpr;
    const cap = (cb: (url: string) => void) => {
      this.game.renderer.snapshotArea(Math.round(screen.x * dpr), Math.round(screen.y * dpr), Math.round(screen.w * dpr), Math.round(screen.h * dpr), (img) => {
        try {
          const cv = document.createElement('canvas');
          cv.width = 300;
          cv.height = 210;
          const ctx = cv.getContext('2d')!;
          ctx.drawImage(img as HTMLImageElement, 0, 0, 300, 210);
          cb(cv.toDataURL('image/jpeg', 0.78));
        } catch {
          cb('');
        }
      });
    };
    cap((photo) => {
      const res: PhotoResult = { speciesId: null, stars: 0, points: 0, isNew: false, photo, quality: g.q, reason: g.reason };
      if (g.c) {
        const sp = g.c.sp;
        const stars = g.q >= CONFIG.photo.star3 ? 3 : g.q >= CONFIG.photo.star2 ? 2 : 1;
        const known = Save.discovered(sp.id) || this.session.newSpecies.includes(sp.id);
        const base = RARITY_INFO[sp.rarity].points * CONFIG.photo.starMul[stars];
        const points = Math.round(known ? base * CONFIG.photo.repeatFactor : base);
        res.speciesId = sp.id;
        res.stars = stars;
        res.points = points;
        res.isNew = !Save.discovered(sp.id);
        this.session.research += points;
        if (res.isNew) this.session.newSpecies.push(sp.id);
        Save.update((d) => {
          d.research += points;
          d.researchTotal += points;
          d.stats.photos++;
          const rec = d.species[sp.id];
          if (!rec) d.species[sp.id] = { count: 1, bestStars: stars, photo, firstSeen: Date.now() };
          else {
            rec.count++;
            if (stars >= rec.bestStars) {
              rec.bestStars = stars;
              rec.photo = photo;
            }
          }
        });
        if (res.isNew && sp.rarity === 'huyen_thoai') {
          this.slowmo = 0.25;
          this.slowmoT = 2.2;
        }
        if (res.isNew) Sound.discover(sp.rarity === 'huyen_thoai');
      }
      this.session.photos.push(res);
      bus.emit('photo', res);
      checkAchievements();
    });
  }

  private doScan() {
    if (!Save.level('scanner')) {
      bus.emit('toast', { text: 'Cần nâng cấp “Máy quét sinh học” để dùng Quét (E).', kind: 'info' });
      return;
    }
    if (this.scanCooldown > 0) return;
    this.scanCooldown = 6;
    Sound.scan();
    this.scanR = 0;
    this.scanRing?.destroy();
    this.scanRing = this.add.graphics().setDepth(27);
    let found = 0;
    for (const c of this.creatures) {
      const dist = Math.hypot(c.x - this.dx, c.y - this.dy);
      if (dist > 560) continue;
      if (c.sp.behavior === 'camouflage' && c.revealT <= 0) {
        c.revealT = 25;
        found++;
        if (!Save.data.stats.scanned.includes(c.sp.id)) Save.update((d) => d.stats.scanned.push(c.sp.id));
      }
      if (c.sp.behavior === 'buried') {
        c.revealT = 10;
        found++;
      }
    }
    bus.emit('toast', { text: found ? `Máy quét phát hiện ${found} sinh vật ẩn mình!` : 'Không phát hiện sinh vật ẩn mình gần đây.', kind: found ? 'good' : 'info' });
    checkAchievements();
  }

  private checkDanger(c: Creature) {
    const sp = c.sp;
    const dist = Math.hypot(c.x - this.dx, c.y - this.dy);
    if (sp.danger === 'nguy_hiem' || sp.danger === 'cuc_ky_nguy_hiem') {
      if (dist < c.radius + CONFIG.diver.radius * 0.7 && c.contactCooldown <= 0 && c.active) {
        c.contactCooldown = CONFIG.danger.contactCooldown;
        const loss = DANGER_INFO[sp.danger].oxygenLoss;
        this.oxygen = Math.max(0.001, this.oxygen - loss);
        const l = dist || 1;
        this.dvx = ((this.dx - c.x) / l) * CONFIG.danger.knockback;
        this.dvy = ((this.dy - c.y) / l) * CONFIG.danger.knockback;
        this.hurtT = 0.8;
        this.cameras.main.shake(260, 0.006);
        Sound.warn();
        this.session.dangerHits.push(sp.id);
        if (!Save.data.stats.touchedDanger.includes(sp.id)) Save.update((d) => d.stats.touchedDanger.push(sp.id));
        bus.emit('danger', { id: sp.id, loss });
        c.alarm = 1.2;
      }
    }
  }

  private updateTrash(dt: number, time: number) {
    for (const t of this.trash) {
      if (t.taken) continue;
      t.x += t.vx * dt;
      const bob = Math.sin(time * 0.001 + t.phase) * 6;
      t.img.setPosition(t.x, t.y + bob);
      t.img.rotation = Math.sin(time * 0.0007 + t.phase) * 0.25;
      if (this.diver && !this.ended && Math.hypot(t.x - this.dx, t.y + bob - this.dy) < 60) {
        t.taken = true;
        this.session.trash++;
        Save.update((d) => d.stats.trashTotal++);
        this.addGreen(CONFIG.green.trash, `Đã nhặt ${t.img.getData('name')}`);
        Sound.pickup();
        this.tweens.add({ targets: t.img, scale: 0, alpha: 0, y: t.y - 40, duration: 380, onComplete: () => t.img.destroy() });
        checkAchievements();
      }
    }
  }

  private addGreen(v: number, text: string) {
    if (this.params.mode !== 'dive') return;
    this.session.green += v;
    Save.update((d) => (d.green = Math.max(0, d.green + v)));
    bus.emit('toast', { text: `${v > 0 ? '+' : ''}${v} Điểm Xanh · ${text}`, kind: v > 0 ? 'good' : 'bad' });
  }

  private updateMotes(dt: number, cam: Phaser.Cameras.Scene2D.Camera) {
    const v = cam.worldView;
    for (const m of this.motes) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      const wx = v.x + (((m.x - v.x * (m.par - 1)) % (v.width + 100)) + (v.width + 100)) % (v.width + 100) - 50;
      const wy = v.y + (((m.y - v.y * (m.par - 1)) % (v.height + 100)) + (v.height + 100)) % (v.height + 100) - 50;
      m.img.setPosition(wx, wy);
    }
  }

  private updateFx(time: number) {
    const fx = this.fx;
    if (!fx) return;
    const cam = this.cameras.main;
    const p = fx.params;
    const t = this.params.tier;
    const focusY = this.diver ? this.dy : cam.midPoint.y;
    const depth = this.world.depthAt(focusY);
    const absorb = t === 1 ? Math.min(0.35, depth / 90) : t === 2 ? Math.min(0.92, 0.35 + (depth - 30) / 140) : 0.95;
    p.absorb = absorb;
    p.dark = t === 1 ? 0 : t === 2 ? Math.min(0.55, (depth - 30) / 260) : 0.86;
    p.emissive = t === 3 ? 1 : 0;
    p.water = this.world.waterRGB();
    p.fog = t === 1 ? 0.06 : t === 2 ? 0.18 : 0.12;
    p.lampOn = this.diver && this.lampOn ? 1 : 0;
    const zoom = cam.zoom;
    p.lampX = (this.dx - cam.worldView.x) * zoom;
    p.lampY = (this.dy - cam.worldView.y) * zoom;
    p.lampAng = this.lampAng;
    p.lampRange = this.lampRange() * zoom;
    p.lampCone = this.lampCone();
    p.caustic = Save.data.settings.quality === 'high' ? (t === 1 ? Math.max(0.05, 0.42 - depth / 70) : t === 2 ? 0.05 : 0) : 0;
    p.scrollX = cam.worldView.x * zoom;
    p.scrollY = cam.worldView.y * zoom;
    p.zoom = zoom;
    p.wobble = Save.data.settings.quality === 'high' ? 1 : 0;
    p.vignette = this.params.mode === 'title' ? 0.35 : 0.5;
    p.hurt = Math.max(0, this.hurtT);
    p.lowO2 = this.diver && this.oxygen < CONFIG.oxygen.lowThreshold ? 0.5 + 0.5 * Math.sin(time * 0.008) : 0;
    p.aim = this.aiming ? 1 : 0;
  }

  private emitHud() {
    const cam = this.cameras.main;
    const dpr = View.dpr;
    const toScreen = (x: number, y: number) => ({ x: ((x - cam.worldView.x) * cam.zoom) / dpr, y: ((y - cam.worldView.y) * cam.zoom) / dpr });
    const depth = this.world.depthAt(this.dy);
    const markers: HudState['markers'] = [];
    for (const c of this.creatures) {
      if (!c.view.visible || !c.identifiable) continue;
      const dist = Math.hypot(c.x - this.dx, c.y - this.dy);
      if (c.sp.danger !== 'an_toan' && dist < 300) {
        const s = toScreen(c.x, c.y - c.view.halfH - 18);
        markers.push({ x: s.x, y: s.y, kind: 'warn', label: DANGER_INFO[c.sp.danger].name });
      }
      if (c.sp.behavior === 'camouflage' && c.revealT > 0) {
        const s = toScreen(c.x, c.y);
        markers.push({ x: s.x, y: s.y, kind: 'scan' });
      }
    }
    let frame: HudState['frame'];
    if (this.aiming) {
      const fr = this.frameRects();
      const g = this.grade(fr.world);
      frame = { ...fr.screen, focus: this.aimFocus, label: g.c ? (Save.discovered(g.c.sp.id) ? g.c.sp.nameVi : '??? Loài mới!') : '' };
    }
    const ground: number[] = [];
    for (let i = 0; i < 64; i++) ground.push(this.world.groundY((i / 63) * this.world.W));
    const hud: HudState = {
      oxygen: this.oxygen,
      depth,
      pressure: 1 + depth / 10,
      green: Save.data.green,
      research: this.session.research,
      newCount: this.session.newSpecies.length,
      lamp: this.lampOn,
      scanReady: this.scanCooldown > 0 ? 1 - this.scanCooldown / 6 : 1,
      hasScanner: Save.level('scanner') > 0,
      aiming: this.aiming,
      surfacing: this.surfaceT,
      sprint: Input.sprint,
      frame,
      markers,
      minimap: {
        diverX: this.dx,
        diverY: this.dy,
        W: this.world.W,
        H: this.world.H,
        ground,
        dots: this.trash.filter((t) => !t.taken).map((t) => ({ x: t.x, y: t.y, c: '#7CFFB2' })),
      },
    };
    bus.emit('hud', hud);
  }

  private endDive(reason: 'surface' | 'oxygen') {
    if (this.ended) return;
    this.ended = true;
    Input.aim = false;
    const p = this.params;
    Save.update((d) => {
      d.stats.dives++;
      d.stats.divesByRegion[p.region] = (d.stats.divesByRegion[p.region] ?? 0) + 1;
      d.stats.noCoralStreak = this.session.coralHits === 0 ? d.stats.noCoralStreak + 1 : 0;
      if (p.tier > d.stats.deepestTier) d.stats.deepestTier = p.tier;
    });
    checkAchievements();
    const summary: DiveSummary = { region: p.region, tier: p.tier, ...this.session, reason, seconds: Math.round(this.elapsed) };
    // hiệu ứng nổi lên
    this.bubbles.explode(30, this.dx, this.dy);
    this.tweens.add({ targets: this.diver, y: this.dy - 400, alpha: 0, duration: 1400, ease: 'Sine.easeIn' });
    this.cameras.main.fadeOut(1400, 220, 245, 255);
    Sound.stopAmbient();
    this.time.delayedCall(1450, () => bus.emit('dive:end', summary));
  }
}

export function speciesName(id: string): string {
  return SPECIES_BY_ID.get(id)?.nameVi ?? id;
}
