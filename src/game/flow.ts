/** Điều hướng giữa cảnh nền tiêu đề và lượt lặn. */
import type Phaser from 'phaser';
import type { RegionId, Tier } from '../data/types';
import type { DiveParams } from '../scenes/DiveScene';
import { Input } from './input';

let game: Phaser.Game | null = null;
let current: DiveParams | null = null;

export const Flow = {
  attach(g: Phaser.Game) {
    game = g;
  },
  get params(): DiveParams | null {
    return current;
  },
  run(p: DiveParams) {
    if (!game) return;
    current = p;
    Input.paused = false;
    Input.aim = false;
    Input.shoot = false;
    const sc = game.scene.getScene('Dive');
    if (sc && sc.scene.isActive()) sc.scene.restart(p);
    else game.scene.start('Dive', p);
  },
  dive(region: RegionId, tier: Tier) {
    Flow.run({ region, tier, mode: 'dive' });
  },
  title(region: RegionId = 'mien_trung') {
    Flow.run({ region, tier: 1, mode: 'title' });
  },
};
