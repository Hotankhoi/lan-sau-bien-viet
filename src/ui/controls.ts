/** Bàn phím, chuột và điều khiển cảm ứng (joystick ảo + nút). */
import { Input } from '../game/input';
import { Sound } from '../systems/Audio';
import { h } from './dom';

const keys = new Set<string>();

function recompute() {
  const l = keys.has('KeyA') || keys.has('ArrowLeft');
  const r = keys.has('KeyD') || keys.has('ArrowRight');
  const u = keys.has('KeyW') || keys.has('ArrowUp');
  const d = keys.has('KeyS') || keys.has('ArrowDown');
  Input.moveX = (r ? 1 : 0) - (l ? 1 : 0);
  Input.moveY = (d ? 1 : 0) - (u ? 1 : 0);
  Input.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight') || touchSprint;
  Input.surfaceHold = keys.has('KeyQ') || touchSurface;
  Input.aim = keys.has('Space') || mouseAim || touchAim;
}

let mouseAim = false;
let touchAim = false;
let touchSprint = false;
let touchSurface = false;
let installed = false;
let onHotkey: (k: 'journal' | 'pause') => void = () => {};

export function installControls(hotkey: (k: 'journal' | 'pause') => void) {
  onHotkey = hotkey;
  if (installed) return;
  installed = true;
  const isTyping = (e: KeyboardEvent) => (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'SELECT';
  window.addEventListener('keydown', (e) => {
    if (isTyping(e)) return;
    Sound.unlock();
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    Input.usingTouch = false;
    keys.add(e.code);
    if (e.code === 'Space') Input.aimFromSpace = true;
    if (e.code === 'KeyF') Input.lampToggle = true;
    if (e.code === 'KeyE') Input.scan = true;
    if (e.code === 'Tab' || e.code === 'KeyJ') onHotkey('journal');
    if (e.code === 'Escape' || e.code === 'KeyP') onHotkey('pause');
    recompute();
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
    if (e.code === 'Space') {
      // nhả Space = chụp
      if (Input.aim && !mouseAim) Input.shoot = true;
      Input.aimFromSpace = false;
    }
    recompute();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    mouseAim = false;
    recompute();
  });
  const canvasHost = document.getElementById('game')!;
  canvasHost.addEventListener('contextmenu', (e) => e.preventDefault());
  canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') {
      Input.pointerX = e.clientX;
      Input.pointerY = e.clientY;
      Input.pointerMovedAt = performance.now();
    }
  });
  canvasHost.addEventListener('pointerdown', (e) => {
    Sound.unlock();
    if (e.pointerType !== 'mouse') Input.usingTouch = true;
  });
  // Dùng mousedown/mouseup: khi đang giữ chuột phải mà bấm thêm chuột trái,
  // trình duyệt KHÔNG phát pointerdown lần hai (chỉ phát pointermove).
  canvasHost.addEventListener('mousedown', (e) => {
    Input.usingTouch = false;
    Input.pointerX = e.clientX;
    Input.pointerY = e.clientY;
    Input.pointerMovedAt = performance.now();
    if (e.button === 2) {
      mouseAim = true;
      recompute();
    } else if (e.button === 0 && Input.aim) {
      Input.shoot = true;
    }
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 2 && mouseAim) {
      mouseAim = false;
      recompute();
    }
  });
}

export function resetControls() {
  keys.clear();
  mouseAim = touchAim = touchSprint = touchSurface = false;
  Input.stickX = Input.stickY = 0;
  recompute();
}

const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

/** Lớp điều khiển cảm ứng (chỉ hiện trên thiết bị cảm ứng). */
export function touchLayer(onJournal: () => void): HTMLElement | null {
  if (!isTouchDevice()) return null;
  const knob = h('i');
  const joy = h('div', { class: 'joy' }, knob);
  let jid: number | null = null;
  const R = 60;
  const moveJoy = (e: PointerEvent) => {
    const r = joy.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const l = Math.hypot(dx, dy);
    if (l > R) {
      dx = (dx / l) * R;
      dy = (dy / l) * R;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    Input.stickX = dx / R;
    Input.stickY = dy / R;
  };
  joy.addEventListener('pointerdown', (e) => {
    Sound.unlock();
    Input.usingTouch = true;
    jid = e.pointerId;
    joy.setPointerCapture(e.pointerId);
    moveJoy(e);
  });
  joy.addEventListener('pointermove', (e) => {
    if (e.pointerId === jid) moveJoy(e);
  });
  const endJoy = (e: PointerEvent) => {
    if (e.pointerId !== jid) return;
    jid = null;
    knob.style.transform = '';
    Input.stickX = Input.stickY = 0;
  };
  joy.addEventListener('pointerup', endJoy);
  joy.addEventListener('pointercancel', endJoy);

  const hold = (label: string, icon: string, cls: string, down: () => void, up: () => void) => {
    const b = h('button', { class: `tbtn ${cls}` }, h('b', {}, icon), label);
    b.addEventListener('pointerdown', (e) => {
      Sound.unlock();
      Input.usingTouch = true;
      b.setPointerCapture(e.pointerId);
      b.classList.add('held');
      down();
      recompute();
    });
    const release = () => {
      if (!b.classList.contains('held')) return;
      b.classList.remove('held');
      up();
      recompute();
    };
    b.addEventListener('pointerup', release);
    b.addEventListener('pointercancel', release);
    return b;
  };
  const tap = (label: string, icon: string, fn: () => void) => hold(label, icon, '', fn, () => {});
  const btns = h(
    'div',
    { class: 'tbtns' },
    tap('Đèn', '🔦', () => (Input.lampToggle = true)),
    tap('Quét', '📡', () => (Input.scan = true)),
    hold('Tăng tốc', '💨', '', () => (touchSprint = true), () => (touchSprint = false)),
    hold('Nổi lên', '⬆️', '', () => (touchSurface = true), () => (touchSurface = false)),
    tap('Sổ tay', '📖', onJournal),
    hold(
      'Chụp',
      '📷',
      'cam',
      () => (touchAim = true),
      () => {
        touchAim = false;
        Input.shoot = true;
      },
    ),
  );
  return h('div', { class: 'touch' }, joy, btns);
}
