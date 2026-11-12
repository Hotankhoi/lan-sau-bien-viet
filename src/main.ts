/** Điểm khởi động: tạo Phaser (cảnh lặn) + giao diện DOM. */
import Phaser from 'phaser';
import './ui/ui.css';
import { DiveScene } from './scenes/DiveScene';
import { View } from './game/view';
import { Flow } from './game/flow';
import { App } from './ui/App';
import { bus } from './game/bus';

function boot() {
  const dpr = View.dpr;
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#04182b',
    width: Math.round(View.cssW * dpr),
    height: Math.round(View.cssH * dpr),
    scale: { mode: Phaser.Scale.NONE, zoom: 1 / dpr },
    render: { antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false },
    fps: { target: 60 },
    scene: [],
    audio: { noAudio: true },
    banner: false,
  });
  game.scene.add('Dive', DiveScene, false);
  Flow.attach(game);
  window.addEventListener('resize', () => {
    const d = View.dpr;
    game.scale.resize(Math.round(View.cssW * d), Math.round(View.cssH * d));
  });
  const app = new App(document.getElementById('ui')!);
  game.events.once('ready', () => app.title());
  (window as unknown as { __game: Phaser.Game }).__game = game;
  // chỉ khi chạy dev: cho công cụ chơi thử tự động phát sự kiện giả
  if (import.meta.env.DEV) (window as unknown as { __bus: typeof bus }).__bus = bus;
}

if (document.fonts?.ready) document.fonts.ready.then(boot, boot);
else boot();
