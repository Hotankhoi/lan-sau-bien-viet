/**
 * Tàu lặn mini "Hải Âu" (Tầng 3) – vỏ chịu áp lực hình giọt nước, vòm kính phía trước,
 * đèn pha, chân vịt sau, cánh tay robot dưới bụng.
 */
import type { CreatureArt } from './contract';
import { makeIds, linear, radial, rimLight, joinDefs } from './style-bible';

const u = makeIds('sub');
const HULL = 'M120 150C120 98 182 70 280 66L452 64C548 62 616 104 622 150C616 198 548 236 452 236L280 234C182 230 120 202 120 150Z';

const defs = joinDefs(
  linear(u('hull'), [
    [0, '#fff3c4'],
    [0.35, '#ffd25a'],
    [0.75, '#e2a52a'],
    [1, '#8a5a12'],
  ], { x1: 0, y1: 0, x2: 0, y2: 1 }),
  linear(u('band'), [
    [0, '#5b6b78'],
    [1, '#22303b'],
  ], { x1: 0, y1: 0, x2: 0, y2: 1 }),
  radial(u('glass'), [
    [0, '#c9f6ff', 0.9],
    [0.45, '#3a9cc4', 0.75],
    [1, '#0b2c45', 0.95],
  ], { cx: 0.38, cy: 0.32, r: 0.75 }),
  radial(u('lamp'), [
    [0, '#ffffff'],
    [0.4, '#fff3c0'],
    [1, '#ffd25a', 0],
  ]),
  `<clipPath id="${u('clip')}"><path d="${HULL}"/></clipPath>`,
  `<filter id="${u('blur')}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>`,
);

const body =
  `<path d="${HULL}" fill="${u.url('hull')}" stroke="#5a3a08" stroke-width="3"/>` +
  `<g clip-path="${u.url('clip')}">` +
  `<rect x="100" y="176" width="540" height="70" fill="#000" opacity="0.12"/>` +
  `<path d="M150 186H600" stroke="${u.url('band')}" stroke-width="16" opacity="0.85"/>` +
  `<path d="M150 186H600" stroke="#4FE3D3" stroke-width="3" opacity="0.9"/>` +
  // đinh tán
  Array.from({ length: 14 }, (_, i) => `<circle cx="${190 + i * 28}" cy="${110 - Math.sin((i / 13) * Math.PI) * 18}" r="2.6" fill="#8a5a12" opacity="0.7"/>`).join('') +
  `<path d="M330 66V234M420 64V236" stroke="#8a5a12" stroke-width="2" opacity="0.45"/>` +
  `</g>` +
  // vây đuôi đứng
  `<path d="M150 112L104 70L96 78L128 128Z" fill="#e2a52a" stroke="#5a3a08" stroke-width="2.5"/>` +
  `<path d="M150 188L104 230L96 222L128 172Z" fill="#c98d1c" stroke="#5a3a08" stroke-width="2.5"/>` +
  // vòm kính
  `<path d="M470 76C548 70 612 108 614 150C612 182 590 200 560 204C520 206 486 190 470 160Z" fill="${u.url('glass')}" stroke="#2a3a44" stroke-width="5"/>` +
  `<path d="M500 92C540 88 576 104 590 128" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.65"/>` +
  // người lái trong vòm
  `<circle cx="532" cy="142" r="20" fill="#17354d" opacity="0.8"/><path d="M510 176C514 160 552 160 556 176" fill="#17354d" opacity="0.8"/>` +
  `<path d="M196 78C260 70 380 66 452 66" fill="none" stroke="#fffbe8" stroke-width="4" stroke-linecap="round" opacity="0.8"/>` +
  rimLight(`M190 82C260 72 380 68 450 68`, "#ffffff", 3) +
  // tên tàu
  `<text x="300" y="150" font-family="Be Vietnam Pro, sans-serif" font-weight="800" font-size="26" fill="#5a3a08" opacity="0.75">HẢI ÂU</text>` +
  // đèn pha
  `<rect x="590" y="196" width="36" height="22" rx="6" fill="#2a3a44"/><circle cx="626" cy="207" r="9" fill="#fff9e0"/>`;

const prop =
  `<rect x="96" y="140" width="28" height="20" rx="4" fill="#2a3a44"/>` +
  `<ellipse cx="90" cy="150" rx="8" ry="44" fill="#9aa7b2" stroke="#2a3a44" stroke-width="3"/>` +
  `<ellipse cx="90" cy="150" rx="5" ry="8" fill="#2a3a44"/>`;

const arm =
  `<path d="M470 228L500 262L540 270" fill="none" stroke="#3c4a55" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="M470 228L500 262L540 270" fill="none" stroke="#7d8d99" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<circle cx="500" cy="262" r="8" fill="#22303b"/><circle cx="470" cy="228" r="9" fill="#22303b"/>` +
  `<path d="M540 270L562 258M540 270L564 282" stroke="#22303b" stroke-width="6" stroke-linecap="round"/>`;

const art: CreatureArt = {
  id: 'sub',
  viewBox: [700, 300],
  defs,
  lengthUnits: 560,
  spineY: 150,
  animation: 'static',
  bendAmp: 0,
  cardDetailLevel: 'hi',
  layers: [
    { name: 'prop', role: 'fin', bend: false, z: 'back', pivot: [90, 150], anim: { type: 'scaleY', amp: 0.85, speed: 9 } },
    { name: 'body', role: 'body', svg: body },
    { name: 'arm', role: 'arm', bend: false, z: 'front', pivot: [470, 228], anim: { type: 'rotate', amp: 0.08, speed: 0.6 } },
    { name: 'lampGlow', role: 'glow', bend: false, z: 'front', blend: 'add', pivot: [626, 207], anim: { type: 'pulse', amp: 0.05, speed: 1.2 }, svg: `<circle cx="626" cy="207" r="26" fill="${u.url('lamp')}" filter="${u.url('blur')}"/>` },
  ].map((l) => ({ svg: l.name === 'prop' ? prop : l.name === 'arm' ? arm : '', ...l })) as CreatureArt['layers'],
};

export default art;
