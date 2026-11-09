/**
 * Hành vi sinh vật (AI) + thanh "độ hoảng".
 * Mỗi loài có trường behavior trong species.json; xem MASTER_PROMPT mục 5.3.
 */
import Phaser from 'phaser';
import type { Species } from '../data/types';
import type { CreatureView } from '../entities/CreatureView';
import type { World } from './World';
import { CONFIG } from '../config';

export interface DiverInfo {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  stillTime: number;
  lampOn: boolean;
  lampAng: number;
  lampRange: number;
  lampCone: number;
}

export class Creature {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  homeX: number;
  homeY: number;
  tx: number;
  ty: number;
  retarget = 0;
  alarm = 0;
  fleeT = 0;
  /** đã trừ Điểm Xanh vì làm hoảng (chỉ 1 lần mỗi con) */
  scaredPenalty = false;
  /** cá ngụy trang đã bị quét lộ */
  revealT = 0;
  /** 0 = lộ hoàn toàn, 1 = vùi kín (buried) */
  hidden = 0;
  /** fast_pass: đang lướt qua? */
  active = true;
  passCooldown = 6 + Math.random() * 10;
  group: Creature[] | null = null;
  /** mức được đèn chiếu (0..1) – cho deep_glow */
  litAmt = 0;
  contactCooldown = 0;
  readonly speed: number;
  readonly radius: number;
  /** id ổn định để tránh trùng */
  readonly uid = Math.random().toString(36).slice(2);

  constructor(
    readonly sp: Species,
    readonly view: CreatureView,
    x: number,
    y: number,
  ) {
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    this.tx = x;
    this.ty = y;
    const L = view.displayLength;
    this.speed = Math.min(150, 28 + L * 0.32);
    this.radius = Math.max(14, Math.min(view.halfW, view.halfH * 1.6) * 0.75);
    if (sp.behavior === 'buried') this.hidden = 1;
    if (sp.behavior === 'fast_pass') this.active = false;
  }

  get bounds(): Phaser.Geom.Rectangle {
    const w = this.view.halfW * 2 * 0.86;
    const h = this.view.halfH * 2 * 0.8;
    return new Phaser.Geom.Rectangle(this.x - w / 2, this.y - h / 2, w, h);
  }

  /** Có thể được nhìn/chụp/nhận diện không? */
  get identifiable(): boolean {
    if (!this.active) return false;
    if (this.sp.behavior === 'camouflage' && this.revealT <= 0) return false;
    if (this.hidden > 0.75) return false;
    if (this.sp.behavior === 'deep_glow' && this.litAmt < 0.25) return false;
    return true;
  }
}

const MOBILE = new Set(['shy', 'school', 'wander', 'curious', 'drift', 'deep_glow']);

export function updateCreature(c: Creature, d: DiverInfo, world: World, dt: number, time: number): { scaredRare: boolean } {
  const sp = c.sp;
  let scaredRare = false;
  const dx = c.x - d.x;
  const dy = c.y - d.y;
  const dist = Math.hypot(dx, dy);

  // ---- đèn chiếu vào sinh vật? ----
  let lit = 0;
  if (d.lampOn && dist < d.lampRange) {
    const ang = Math.atan2(dy, dx);
    const delta = Math.abs(Phaser.Math.Angle.Wrap(ang - d.lampAng));
    if (delta < d.lampCone) lit = 1 - dist / d.lampRange;
  }
  if (dist < 110) lit = Math.max(lit, d.lampOn ? 0.9 : 0.25);
  c.litAmt += (lit - c.litAmt) * Math.min(1, dt * 4);

  // ---- độ hoảng ----
  const fearR = 240 + c.view.displayLength * 0.6;
  if (c.active && dist < fearR && c.hidden < 0.9) {
    const fast = d.speed > CONFIG.diver.calmSpeed;
    const shyK = sp.behavior === 'shy' ? 1.6 : sp.behavior === 'curious' ? 0.35 : 1;
    if (fast) c.alarm += dt * (d.speed / CONFIG.diver.calmSpeed) * 0.5 * shyK * (1 - dist / fearR + 0.3);
    if (lit > 0.4 && world.tier > 1) c.alarm += dt * 0.22 * shyK;
    if (dist < 70) c.alarm += dt * 0.6 * shyK;
  }
  c.alarm -= dt * 0.22;
  c.alarm = Phaser.Math.Clamp(c.alarm, 0, 1.2);
  c.view.alarm = Math.min(1, c.alarm * 1.2);
  if (c.alarm >= 1 && c.fleeT <= 0 && MOBILE.has(sp.behavior)) {
    c.fleeT = 4 + Math.random() * 2;
    if ((sp.rarity === 'hiem' || sp.rarity === 'huyen_thoai') && !c.scaredPenalty) {
      c.scaredPenalty = true;
      scaredRare = true;
    }
  }
  if (c.fleeT > 0) c.fleeT -= dt;
  if (c.revealT > 0) c.revealT -= dt;
  if (c.contactCooldown > 0) c.contactCooldown -= dt;

  let ax = 0;
  let ay = 0;
  const sp0 = c.speed;
  const steerTo = (tx: number, ty: number, speed: number) => {
    const ddx = tx - c.x;
    const ddy = ty - c.y;
    const l = Math.hypot(ddx, ddy) || 1;
    ax += (ddx / l) * speed - c.vx;
    ay += (ddy / l) * speed - c.vy;
  };

  switch (sp.behavior) {
    case 'static':
    case 'camouflage': {
      // nằm trên đáy, bò rất chậm
      const gy = world.groundY(c.x) - c.view.halfH * 0.55;
      c.retarget -= dt;
      if (c.retarget <= 0) {
        c.retarget = 6 + Math.random() * 8;
        c.tx = c.homeX + (Math.random() - 0.5) * 60;
      }
      c.vx += ((c.tx - c.x) * 0.05 - c.vx) * dt;
      c.x += c.vx * dt;
      c.y += (gy - c.y) * Math.min(1, dt * 3);
      const tint = sp.behavior === 'camouflage' && c.revealT <= 0;
      c.view.setAlpha(tint ? 0.42 : 1);
      if (sp.behavior === 'camouflage') c.view.tintAll(tint ? 0x8a8478 : null);
      c.view.intensity = 0.3;
      return { scaredRare };
    }
    case 'buried': {
      const gy = world.groundY(c.x);
      const near = dist < 190 && d.speed < CONFIG.diver.calmSpeed * 1.4;
      const target = c.alarm > 0.8 ? 1 : near || c.revealT > 0 ? 0.25 : 1;
      c.hidden += (target - c.hidden) * Math.min(1, dt * 1.5);
      c.y = gy - c.view.halfH * 0.3 + c.hidden * c.view.halfH * 0.95;
      c.view.setAlpha(1 - c.hidden * 0.35);
      c.view.intensity = 0.4;
      return { scaredRare };
    }
    case 'fast_pass': {
      if (!c.active) {
        c.passCooldown -= dt;
        if (c.passCooldown <= 0) {
          c.active = true;
          const dir = Math.random() < 0.5 ? 1 : -1;
          c.x = d.x - dir * 1100;
          c.y = Phaser.Math.Clamp(d.y + (Math.random() - 0.5) * 260, 120, world.groundY(d.x) - 120);
          c.vx = dir * (430 + Math.random() * 160);
          c.vy = 0;
          c.view.face(dir as 1 | -1, true);
          c.view.setVisible(true);
        } else {
          c.view.setVisible(false);
          return { scaredRare };
        }
      }
      c.x += c.vx * dt;
      c.y += Math.sin(time * 0.002 + c.homeX) * 10 * dt;
      c.view.intensity = 2;
      if (Math.abs(c.x - d.x) > 1300 || c.x < -200 || c.x > world.W + 200) {
        c.active = false;
        c.passCooldown = 10 + Math.random() * 14;
      }
      return { scaredRare };
    }
    case 'drift': {
      c.retarget -= dt;
      if (c.retarget <= 0) {
        c.retarget = 5 + Math.random() * 5;
        c.tx = c.homeX + (Math.random() - 0.5) * 400;
        c.ty = c.homeY + (Math.random() - 0.5) * 160;
      }
      steerTo(c.tx, c.ty, sp0 * 0.35);
      ay += Math.sin(time * 0.0015 + c.homeX) * 12;
      break;
    }
    case 'deep_glow': {
      c.retarget -= dt;
      if (c.retarget <= 0) {
        c.retarget = 6 + Math.random() * 6;
        c.tx = c.homeX + (Math.random() - 0.5) * 500;
        c.ty = c.homeY + (Math.random() - 0.5) * 220;
      }
      steerTo(c.tx, c.ty, sp0 * 0.4);
      c.view.setAlpha(0.15 + c.litAmt * 0.85);
      break;
    }
    case 'curious': {
      if (d.stillTime > 1.2 && dist < 800 && c.fleeT <= 0) {
        const ang = time * 0.0004 + c.homeX;
        steerTo(d.x + Math.cos(ang) * 210, d.y + Math.sin(ang) * 90, sp0 * 0.8);
      } else {
        wander(c, dt);
        steerTo(c.tx, c.ty, sp0 * 0.5);
      }
      break;
    }
    case 'school': {
      if (c.group && c.group[0] !== c) {
        // boids: tách, gióng hàng, gắn kết + theo con đầu đàn
        const leader = c.group[0];
        let sx = 0;
        let sy = 0;
        let alx = 0;
        let aly = 0;
        let cx = 0;
        let cy = 0;
        let n = 0;
        for (const o of c.group) {
          if (o === c) continue;
          const ox = c.x - o.x;
          const oy = c.y - o.y;
          const od = Math.hypot(ox, oy) || 1;
          const minD = c.view.displayLength * 0.9;
          if (od < minD) {
            sx += (ox / od) * (minD - od);
            sy += (oy / od) * (minD - od);
          }
          alx += o.vx;
          aly += o.vy;
          cx += o.x;
          cy += o.y;
          n++;
        }
        if (n) {
          ax += sx * 2.2 + (alx / n - c.vx) * 0.6 + (cx / n - c.x) * 0.25;
          ay += sy * 2.2 + (aly / n - c.vy) * 0.6 + (cy / n - c.y) * 0.25;
        }
        steerTo(leader.x, leader.y, sp0 * 0.35);
      } else {
        wander(c, dt);
        steerTo(c.tx, c.ty, sp0 * 0.55);
      }
      break;
    }
    case 'shy':
    case 'wander':
    default: {
      wander(c, dt);
      steerTo(c.tx, c.ty, sp0 * (sp.behavior === 'shy' ? 0.35 : 0.5));
      break;
    }
  }

  // ---- bỏ chạy ----
  if (c.fleeT > 0) {
    const l = dist || 1;
    ax += ((dx / l) * sp0 * 2.6 - c.vx) * 2;
    ay += ((dy / l) * sp0 * 1.2 - c.vy) * 2;
  }

  // ---- tránh đáy, mặt nước, biên ----
  const gy = world.groundY(c.x);
  const margin = c.view.halfH + 30;
  if (c.y > gy - margin) ay -= (c.y - (gy - margin)) * 6;
  if (c.y < 100) ay += (100 - c.y) * 4;
  if (c.x < 120) ax += (120 - c.x) * 3;
  if (c.x > world.W - 120) ax -= (c.x - (world.W - 120)) * 3;

  c.vx += ax * dt * 1.6;
  c.vy += ay * dt * 1.6;
  const maxV = sp0 * (c.fleeT > 0 ? 2.8 : 1.2);
  const v = Math.hypot(c.vx, c.vy);
  if (v > maxV) {
    c.vx *= maxV / v;
    c.vy *= maxV / v;
  }
  c.x += c.vx * dt;
  c.y += c.vy * dt;
  c.y = Math.min(c.y, gy - c.view.halfH * 0.5);

  if (Math.abs(c.vx) > 8) c.view.face(c.vx > 0 ? 1 : -1);
  c.view.intensity = 0.7 + Math.min(1.8, v / Math.max(30, sp0) * 0.9);
  // nghiêng nhẹ theo hướng bơi lên/xuống
  const tilt = Phaser.Math.Clamp(Math.atan2(c.vy, Math.abs(c.vx) + 20) * 0.5, -0.4, 0.4);
  c.view.rotation += (tilt * c.view.facing - c.view.rotation) * Math.min(1, dt * 3);
  return { scaredRare };
}

function wander(c: Creature, dt: number) {
  c.retarget -= dt;
  const reached = Math.hypot(c.tx - c.x, c.ty - c.y) < 40;
  if (c.retarget <= 0 || reached) {
    c.retarget = 4 + Math.random() * 5;
    c.tx = c.homeX + (Math.random() - 0.5) * 900;
    c.ty = c.homeY + (Math.random() - 0.5) * 300;
  }
}
