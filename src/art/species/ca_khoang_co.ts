/**
 * Cá khoang cổ (cá hề) – Amphiprion ocellaris
 * LOÀI MẪU CHUẨN #1 (do agent điều phối vẽ) – thước đo phong cách cho mọi loài khác.
 * Đặc điểm nhận dạng: thân cam rực thuôn tròn, 3 dải trắng viền đen (sau mắt, giữa thân có
 * mấu nhô về phía đầu, gốc đuôi), vây cam viền đen, mắt nâu cam.
 */
import type { CreatureArt } from '../contract';
import {
  makeIds,
  standardBody,
  eye,
  finRays,
  linear,
  radial,
  blurFilter,
  rng,
  joinDefs,
} from '../style-bible';

const u = makeIds('ca_khoang_co');

const ORANGE = '#FF7F1F';
const ORANGE_D = '#E4500B';
const ORANGE_L = '#FFB566';
const INK = '#160a05';

const BODY =
  'M472 152C470 128 452 104 424 88C392 70 340 60 292 62C236 64 180 88 140 114L118 122C112 138 112 160 118 176L140 184C182 212 238 236 296 238C352 240 404 222 440 196C458 184 470 168 472 152Z';

const TAIL =
  'M128 124C106 104 80 84 52 80C34 94 26 126 27 150C27 174 35 206 53 220C80 218 106 198 128 176Z';
const TAIL_EDGE = 'M52 80C34 94 26 126 27 150C27 174 35 206 53 220';

const DORSAL =
  'M414 92L406 72Q400 66 394 56Q386 54 378 46Q368 47 360 42Q350 45 342 42Q332 47 324 46Q314 52 306 54L298 62' +
  'C290 50 276 42 254 40C228 38 204 46 186 62C170 76 156 96 142 114L170 128L300 96L414 104Z';
const DORSAL_EDGE =
  'M406 72Q400 66 394 56Q386 54 378 46Q368 47 360 42Q350 45 342 42Q332 47 324 46Q314 52 306 54L298 62C290 50 276 42 254 40C228 38 204 46 186 62C170 76 156 96 142 114';

const ANAL = 'M262 232C254 250 238 262 218 262C198 260 180 238 164 202L210 200Z';
const ANAL_EDGE = 'M262 232C254 250 238 262 218 262C198 260 180 238 164 202';

const PELVIC = 'M384 220C376 244 354 264 330 270C333 250 344 232 360 220Z';
const PELVIC_EDGE = 'M384 220C376 244 354 264 330 270';

const PECTORAL = 'M396 164C376 148 346 150 332 166C330 186 358 194 396 182Z';

const HEAD_BAND = 'M402 74C378 116 380 184 410 234L440 216C416 178 414 124 434 84Z';
const MID_BAND = 'M272 58C256 110 256 192 280 244L318 244C330 214 342 176 352 152C340 128 328 96 316 58Z';
const TAIL_BAND = 'M122 114C134 138 134 162 122 186L150 192C162 164 162 136 150 108Z';

const body = standardBody(u, BODY, {
  dorsal: ORANGE_D,
  flank: ORANGE,
  belly: ORANGE_L,
  outlineColor: '#7a2a05',
  scales: { size: 8, color: '#8a3200', opacity: 0.13, stroke: 0.6 },
  flankAt: 0.45,
});

const theEye = eye(u, 'eye', {
  cx: 444,
  cy: 128,
  r: 13,
  iris: ['#F08A3A', '#6b2608'],
  socket: '#b4430a',
});

// ---------- Hải quỳ (chỉ vẽ trên thẻ Sổ tay) ----------
function anemone(): string {
  const r = rng(42);
  let s = '';
  for (let i = 0; i < 46; i++) {
    const x = 20 + r() * 472;
    const len = 70 + r() * 90;
    const lean = (r() - 0.5) * 80 + (x - 256) * 0.18;
    const x2 = x + lean;
    const y2 = 312 - len;
    const cx = x + lean * 0.2 + (r() - 0.5) * 30;
    const w = 7 + r() * 5;
    s += `<path d="M${x.toFixed(1)} 312Q${cx.toFixed(1)} ${(312 - len * 0.6).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${u.url('tent')}" stroke-width="${w.toFixed(1)}" stroke-linecap="round" fill="none"/>`;
    s += `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="${(w * 0.48).toFixed(1)}" fill="#ffd2f1" opacity="0.85"/>`;
  }
  return `<g opacity="0.92">${s}</g>`;
}

const defs = joinDefs(
  body,
  theEye,
  linear(u('fin'), [
    [0, '#FF9A3C', 0.95],
    [1, '#FF6A10', 0.85],
  ]),
  linear(
    u('band'),
    [
      [0, '#ffffff'],
      [0.7, '#f6fbff'],
      [1, '#dfe8ef'],
    ],
  ),
  linear(
    u('tent'),
    [
      [0, '#5a1f57'],
      [0.55, '#b14a9a'],
      [1, '#f2a3dc'],
    ],
    { user: true, x1: 0, y1: 312, x2: 0, y2: 160 },
  ),
  radial(u('gloss'), [
    [0, '#FFE3C2', 0.55],
    [1, '#FFE3C2', 0],
  ]),
  blurFilter(u('soft'), 6),
);

const finEdge = (d: string, w = 3.4) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

const art: CreatureArt = {
  id: 'ca_khoang_co',
  viewBox: [512, 300],
  lengthUnits: 446,
  spineY: 152,
  animation: 'fish',
  cycleHz: 2.4,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'anemone',
      role: 'detail',
      bend: false,
      z: 'back',
      cardOnly: true,
      svg: anemone(),
    },
    {
      name: 'tail',
      role: 'tail',
      svg:
        `<path d="${TAIL}" fill="${u.url('fin')}"/>` +
        finRays([128, 150], [
          [54, 84], [44, 100], [36, 118], [31, 136], [29, 152], [31, 168], [36, 186], [44, 202], [54, 216],
        ], { color: '#7a2a05', opacity: 0.35, width: 1 }) +
        finEdge(TAIL_EDGE, 3.8),
    },
    {
      name: 'dorsal',
      role: 'detail',
      svg:
        `<path d="${DORSAL}" fill="${u.url('fin')}"/>` +
        finRays(
          [[404, 96], [390, 90], [374, 84], [358, 80], [342, 76], [326, 74], [312, 72]],
          [[394, 58], [378, 48], [360, 44], [342, 44], [324, 48], [306, 56], [298, 62]],
          { color: '#7a2a05', opacity: 0.4, width: 1.2, bend: 0.02 },
        ) +
        finRays([250, 110], [[276, 47], [254, 43], [230, 43], [208, 49], [188, 61], [170, 79], [154, 100]], {
          color: '#7a2a05',
          opacity: 0.3,
          width: 1,
        }) +
        finEdge(DORSAL_EDGE),
    },
    {
      name: 'anal',
      role: 'detail',
      svg:
        `<path d="${ANAL}" fill="${u.url('fin')}"/>` +
        finRays([224, 214], [[252, 246], [236, 258], [216, 260], [196, 252], [178, 232]], { color: '#7a2a05', opacity: 0.3 }) +
        finEdge(ANAL_EDGE),
    },
    {
      name: 'pelvic',
      role: 'detail',
      svg: `<path d="${PELVIC}" fill="${u.url('fin')}"/>` + finEdge(PELVIC_EDGE, 3.4),
    },
    {
      name: 'body',
      role: 'body',
      svg:
        body.base +
        `<g clip-path="${u.url('bodyClip')}">` +
        // vệt sáng bóng lưng
        `<ellipse cx="330" cy="104" rx="120" ry="30" fill="${u.url('gloss')}" filter="${u.url('soft')}"/>` +
        // 3 dải trắng viền đen
        `<g fill="${u.url('band')}" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round">` +
        `<path d="${HEAD_BAND}"/><path d="${MID_BAND}"/><path d="${TAIL_BAND}"/></g>` +
        `</g>` +
        body.overlay,
    },
    {
      name: 'face',
      role: 'detail',
      svg:
        // mép nắp mang mảnh ngay trước dải đầu
        `<path d="M432 92C420 124 420 176 440 210" fill="none" stroke="#9a3a06" stroke-opacity="0.35" stroke-width="1.4"/>` +
        // miệng & môi
        `<path d="M472 158Q465 160.5 458 159" fill="none" stroke="#5a1e04" stroke-width="1.7" stroke-linecap="round"/>` +
        `<path d="M469 150Q466 145 460 145" fill="none" stroke="#ffc58e" stroke-width="1.2" opacity="0.7"/>` +
        `<circle cx="460" cy="134" r="1.8" fill="#5a1e04" opacity="0.7"/>`,
    },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    {
      name: 'pectoral',
      role: 'fin',
      pivot: [394, 172],
      anim: { type: 'rotate', amp: 0.38, speed: 1.3 },
      svg:
        `<path d="${PECTORAL}" fill="#FF8A2A" fill-opacity="0.93" stroke="${INK}" stroke-opacity="0.8" stroke-width="1.8" stroke-linejoin="round"/>` +
        finRays([394, 172], [[352, 152], [340, 160], [334, 170], [336, 180], [346, 188]], { color: '#8a3200', opacity: 0.35 }),
    },
  ],
};

export default art;
