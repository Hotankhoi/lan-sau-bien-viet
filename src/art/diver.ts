/**
 * Thợ lặn nghiên cứu (nhìn ngang, bơi sang phải) – vẽ bằng SVG, cùng hợp đồng CreatureArt.
 * Bộ đồ lặn xanh đậm có sọc xanh ngọc của "Trạm Nghiên cứu Biển Việt", bình khí vàng,
 * mặt nạ, ống thở, máy ảnh dưới nước có đèn flash 2 bên.
 */
import type { CreatureArt } from './contract';
import { makeIds, linear, radial, joinDefs, rimGradient, rimLight } from './style-bible';

const u = makeIds('diver');
const SUIT = '#17354d';
const SUIT_L = '#2a5674';
const ACCENT = '#4FE3D3';
const SKIN = '#e9b48f';

const TORSO = 'M330 112C334 96 360 88 400 88C450 88 500 92 530 100C548 106 556 118 552 132C548 146 532 152 508 152C460 152 400 152 360 148C340 146 328 132 330 112Z';
const HEAD = 'M532 104C534 84 552 72 572 74C594 76 606 92 604 110C602 128 588 140 568 140C548 138 530 124 532 104Z';
const TANK = 'M352 66C352 58 358 54 366 54L488 54C500 54 506 60 506 68L506 84C506 92 500 96 488 96L366 96C358 96 352 92 352 84Z';

function leg(dy: number, shade: number): string {
  const c = shade ? '#11283a' : SUIT;
  const fin = shade ? '#2a8f86' : ACCENT;
  return (
    // đùi + bắp chân
    `<path d="M342 ${118 + dy}C320 ${112 + dy} 280 ${116 + dy} 250 ${124 + dy}C228 ${130 + dy} 200 ${134 + dy} 182 ${136 + dy}L180 ${152 + dy}C204 ${152 + dy} 236 ${150 + dy} 260 ${146 + dy}C292 ${142 + dy} 326 ${142 + dy} 344 ${140 + dy}Z" fill="${c}"/>` +
    // gối
    `<ellipse cx="254" cy="${136 + dy}" rx="12" ry="9" fill="${shade ? '#0d2030' : '#10283b'}" opacity="0.7"/>` +
    // chân vịt
    `<path d="M186 ${134 + dy}C150 ${126 + dy} 92 ${112 + dy} 40 ${116 + dy}C52 ${132 + dy} 54 ${146 + dy} 44 ${166 + dy}C96 ${168 + dy} 150 ${158 + dy} 186 ${154 + dy}Z" fill="${fin}" fill-opacity="${shade ? 0.75 : 0.92}"/>` +
    `<path d="M186 ${140 + dy}L60 ${124 + dy}M186 ${148 + dy}L58 ${158 + dy}" stroke="#0b1d2b" stroke-opacity="0.35" stroke-width="2.4"/>` +
    `<path d="M196 ${132 + dy}L196 ${156 + dy}" stroke="#0b1d2b" stroke-width="6" stroke-linecap="round" opacity="0.8"/>`
  );
}

const defs = joinDefs(
  linear(u('suit'), [
    [0, SUIT_L],
    [0.5, SUIT],
    [1, '#0d2233'],
  ]),
  linear(u('tank'), [
    [0, '#ffe08a'],
    [0.45, '#f2b93b'],
    [1, '#a8741a'],
  ]),
  linear(u('glass'), [
    [0, '#bff6ff', 0.95],
    [0.5, '#4fc7e0', 0.8],
    [1, '#16506a', 0.9],
  ]),
  radial(u('dome'), [
    [0, '#e8fbff', 0.9],
    [0.6, '#6fb9d6', 0.7],
    [1, '#1b4459', 0.9],
  ]),
  rimGradient(u('rim'), '#dff8ff', 0.7),
);

const art: CreatureArt = {
  id: 'diver',
  viewBox: [660, 220],
  lengthUnits: 600,
  spineY: 120,
  animation: 'fish',
  cycleHz: 1.4,
  bendAmp: 0,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'legFar',
      role: 'fin',
      z: 'back',
      pivot: [338, 126],
      anim: { type: 'rotate', amp: 0.16, speed: 1, phase: Math.PI },
      svg: leg(-6, 1),
    },
    {
      name: 'body',
      role: 'body',
      svg:
        // ống khí nối bình
        `<path d="M500 70C540 60 580 84 590 112" fill="none" stroke="#1c2a33" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="${TANK}" fill="${u.url('tank')}" stroke="#7a5310" stroke-width="1.5"/>` +
        `<rect x="500" y="62" width="14" height="26" rx="4" fill="#9aa8b2" stroke="#4a5660"/>` +
        `<path d="M366 58L486 58" stroke="#fff6cc" stroke-opacity="0.6" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="${TORSO}" fill="${u.url('suit')}"/>` +
        // sọc nhận diện trạm nghiên cứu
        `<path d="M352 132C420 136 480 136 540 128" fill="none" stroke="${ACCENT}" stroke-width="5" stroke-linecap="round"/>` +
        // áo phao BCD
        `<path d="M410 92C440 90 480 92 506 98L500 146C470 148 440 148 414 146Z" fill="#0b1f2e" opacity="0.75"/>` +
        `<rect x="440" y="104" width="22" height="12" rx="3" fill="#ffc75f" opacity="0.9"/>` +
        rimLight(TORSO, u.url('rim')) +
        // tay (cánh tay xa)
        `<path d="M500 116C530 120 560 130 592 136L590 146C560 144 528 138 498 132Z" fill="#10283b"/>` +
        // đầu + mũ trùm
        `<path d="${HEAD}" fill="#122a3c"/>` +
        `<path d="M560 106C560 96 570 90 584 90L600 92C606 94 608 102 606 112C604 122 596 126 586 126L570 124C562 122 560 116 560 106Z" fill="#1e2a30"/>` +
        // kính mặt nạ
        `<path d="M566 102C566 96 572 94 582 94L598 96C602 98 603 104 602 110C600 118 594 120 586 120L574 118C568 116 566 110 566 102Z" fill="${u.url('glass')}"/>` +
        `<ellipse cx="584" cy="108" rx="5" ry="4" fill="${SKIN}" opacity="0.55"/>` +
        `<path d="M572 99L590 98" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.8"/>` +
        // ống thở
        `<circle cx="594" cy="128" r="7" fill="#26323a"/><circle cx="596" cy="128" r="3" fill="#5c6a73"/>` +
        rimLight(HEAD, u.url('rim')),
    },
    {
      name: 'legNear',
      role: 'fin',
      z: 'front',
      pivot: [338, 130],
      anim: { type: 'rotate', amp: 0.16, speed: 1 },
      svg: leg(4, 0),
    },
    {
      name: 'camera',
      role: 'detail',
      bend: false,
      z: 'front',
      svg:
        // cánh tay gần
        `<path d="M500 124C532 130 562 138 596 142L594 154C560 152 528 146 498 140Z" fill="${SUIT_L}"/>` +
        `<circle cx="598" cy="148" r="7" fill="#0d1f2c"/>` +
        // vỏ máy ảnh + đèn flash
        `<path d="M610 112L610 96L640 84" fill="none" stroke="#3a4650" stroke-width="3"/>` +
        `<path d="M610 178L610 192L640 202" fill="none" stroke="#3a4650" stroke-width="3"/>` +
        `<rect x="636" y="76" width="12" height="16" rx="3" fill="#dfe7ec" stroke="#56636c"/>` +
        `<rect x="636" y="196" width="12" height="14" rx="3" fill="#dfe7ec" stroke="#56636c"/>` +
        `<rect x="596" y="118" width="40" height="52" rx="8" fill="#26343e" stroke="#0e161c" stroke-width="2"/>` +
        `<rect x="600" y="122" width="14" height="6" rx="2" fill="${ACCENT}" opacity="0.8"/>` +
        `<path d="M636 128C654 130 660 158 636 160Z" fill="${u.url('dome')}" stroke="#0e161c" stroke-width="1.5"/>`,
    },
  ],
};

export default art;
