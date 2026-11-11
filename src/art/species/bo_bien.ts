/**
 * Bò biển / Dugong – Dugong dugon (Biển miền Nam: Phú Quốc, Côn Đảo)
 * Đặc điểm nhận dạng: thân thoi mập xám nâu–xám hồng, da nhăn có lông tơ thưa và vài vết sẹo nhạt (vết cào song song);
 * KHÔNG có vây lưng; đầu tròn, mõm gập xuống với ĐĨA MÕM to hình móng ngựa úp xuống, phủ lông cứng; lỗ mũi trên đỉnh mõm;
 * mắt rất nhỏ; nếp nhăn cổ sau đầu; vây ngực ngắn như mái chèo; đuôi kiểu cá voi: hai thùy nhọn, mép sau lõm, có KHÍA GIỮA
 * (phân biệt với lợn biển đuôi tròn).
 * Chuyển động: thú biển – thân uốn rất nhẹ, đuôi là lớp rời quạt lên–xuống chậm quanh cuống đuôi, vây ngực khẽ chèo.
 * Tham khảo: references/bo_bien (ref1–ref5, Wikimedia Commons).
 */
import type { CreatureArt } from '../contract';
import {
  makeIds,
  standardBody,
  eye,
  linear,
  radial,
  blurFilter,
  organicTexture,
  joinDefs,
  smoothPath,
  scatterSpots,
  clip,
  rng,
} from '../style-bible';

const u = makeIds('bo_bien');

const BACK = '#625850';
const FLANK = '#9e9083';
const BELLY = '#cbbbab';
const EDGE = '#4f423d';
const DISC = '#88726b';
const SCAR = '#efe5dc';
const PORE = '#4a3e3b';

// ---------- Thân (đầu phải, đuôi trái) ----------
/** Đường lưng: mặt trước mõm → trán → đỉnh đầu → lưng cong đều (không vây lưng) → cuống đuôi. */
const TOP: [number, number][] = [
  [765.5, 154], [761, 131], [749, 113], [731, 98.5], [706, 87], [677, 77], [641, 70], [600, 66], [560, 64],
  [510, 64.5], [460, 67.5], [410, 74.5], [360, 85], [310, 97.5], [262, 109.5], [220, 119.5], [188, 126.5],
  [162, 131], [146, 134],
];
/** Đường bụng: cuống đuôi → bụng phệ → ngực → họng → cằm → dưới đĩa mõm. */
const BOT: [number, number][] = [
  [146, 149], [162, 151], [188, 155], [216, 165], [250, 183], [292, 200], [342, 212], [400, 219], [460, 220.5],
  [516, 217], [566, 210], [612, 201], [648, 192], [676, 184], [698, 181], [714, 181.5], [725, 184.5],
  [737, 187.5], [750, 184.5], [760.5, 172],
];
const BODY = smoothPath([...TOP, ...BOT], true);

const TOP_ASC = [...TOP].sort((a, b) => a[0] - b[0]);
const BOT_ASC = [...BOT].sort((a, b) => a[0] - b[0]);
function interp(pts: [number, number][], x: number): number {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) {
      const a = pts[i - 1];
      const b = pts[i];
      const t = (x - a[0]) / Math.max(0.001, b[0] - a[0]);
      return a[1] + (b[1] - a[1]) * t;
    }
  }
  return pts[pts.length - 1][1];
}
const topY = (x: number) => interp(TOP_ASC, x);
const botY = (x: number) => interp(BOT_ASC, x);

// ---------- Đuôi kiểu cá voi (nhìn chếch: thùy xa phía trên, thùy gần phía dưới, khía giữa) ----------
const FLUKES =
  'M172 130.5C146 121 112 107.5 78 100.5C58 96.5 42 97.5 37 102.5C34 106.5 40 110.5 48 114.5' +
  'C66 123 86 133.5 101 144.5' + // mép sau lõm của thùy trên → khía
  'C96 150 101 170 99 194C98 207 94.5 222 101.5 229' + // mép sau lõm của thùy dưới → chóp
  'C118 224 140 200 156 176C162 166 167 158 172 152.5Z';
const FLUKE_FAR =
  'M172 130.5C146 121 112 107.5 78 100.5C58 96.5 42 97.5 37 102.5C34 106.5 40 110.5 48 114.5' +
  'C66 123 86 133.5 101 144.5L172 141.5Z';
const FLUKE_TRAIL =
  'M37 102.5C34 106.5 40 110.5 48 114.5C66 123 86 133.5 101 144.5C96 150 101 170 99 194C98 207 94.5 222 101.5 229';

// ---------- Vây ngực mái chèo ----------
const PECT_NEAR =
  'M634 137C634.5 160 628 186 614 208C604 224 590 233 575 232C560 231 551 220 550 204' +
  'C549 184 554 162 566 146C578 134 606 128 634 137Z';
const PECT_NEAR_EDGE =
  'M633 152C631 172 626 190 614 208C604 224 590 233 575 232C560 231 551 220 550 204C549.2 187 552.5 170 560 156';
const PECT_FAR =
  'M616 188C614 211 604 234 588 248C578 256 564 259 558 251C553 243 556 228 562 214C568 202 574 194 582 186Z';

// ---------- Đĩa mõm ----------
/** Vùng đĩa mõm (cắt theo thân): mặt trước–dưới của mõm gập xuống. */
const DISC_AREA = 'M764 133C751 141 738 154 731 167C727.5 174 726 180 726.5 187L790 200L790 120Z';
/** Mép trên đĩa mõm (hình móng ngựa nhìn nghiêng). */
const DISC_RIM = 'M763.5 134C751 142 738.5 154.5 731.5 167.5C728 174 726.6 179.5 727 185';
/** Đường miệng dưới đĩa mõm. */
const MOUTH = 'M729.5 184.2C723 182.6 716 181.4 708.5 180.8';

// ---------- Tiện ích ----------
/** Lỗ chân lông / gốc lông tơ: chấm sẫm rất nhỏ rải khắp thân, thưa dần xuống bụng. */
function pores(seed: number, count: number, x0: number, x1: number): string {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < count; i++) {
    const x = x0 + r() * (x1 - x0);
    const ty = topY(x);
    const by = botY(x);
    const t = Math.pow(Math.max(0, r()), 1.3);
    const y = ty + 2 + t * Math.max(0, by - ty - 4);
    const rad = 0.35 + r() * 0.5;
    const op = (0.25 + r() * 0.35) * (1 - 0.5 * t);
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}" opacity="${op.toFixed(2)}"/>`;
  }
  return `<g fill="${PORE}">${s}</g>`;
}

/** Lông tơ thưa: sợi rất ngắn, mảnh, chủ yếu thấy được ở mép lưng (ngược sáng). */
function hairs(seed: number, count: number, x0: number, x1: number): string {
  const r = rng(seed);
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = x0 + r() * (x1 - x0);
    const y = topY(x) + 0.6;
    const len = 2.2 + r() * 2.4;
    const a = (-100 - r() * 50) * (Math.PI / 180); // chĩa lên, hơi ngả về sau
    d += `M${x.toFixed(1)} ${y.toFixed(1)}l${(Math.cos(a) * len).toFixed(2)} ${(Math.sin(a) * len).toFixed(2)}`;
  }
  return `<path d="${d}" fill="none" stroke="#d9cfc8" stroke-opacity="0.55" stroke-width="0.45" stroke-linecap="round"/>`;
}

/** Lông cứng trên đĩa mõm: chấm gốc + sợi ngắn. */
function bristles(seed: number): string {
  const r = rng(seed);
  let dots = '';
  let d = '';
  for (let i = 0; i < 200; i++) {
    const x = 726 + r() * 42;
    const y = 132 + r() * 58;
    // chỉ giữ điểm trong đĩa (gần đúng: phía trước–dưới mép móng ngựa)
    const rimX = 763.5 - (Math.max(0, Math.min(51, y - 134)) / 51) * 36.5;
    if (x < rimX + 2.5) continue;
    const rad = 0.35 + r() * 0.45;
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}" opacity="${(0.25 + r() * 0.35).toFixed(2)}"/>`;
    if (r() < 0.45) {
      const len = 1.6 + r() * 2.2;
      const a = (40 + r() * 70) * (Math.PI / 180); // chĩa xuống–ra trước
      d += `M${x.toFixed(1)} ${y.toFixed(1)}l${(Math.cos(a) * len).toFixed(2)} ${(Math.sin(a) * len).toFixed(2)}`;
    }
  }
  return `<g fill="#3e322f">${dots}</g><path d="${d}" fill="none" stroke="#efe3da" stroke-opacity="0.55" stroke-width="0.5" stroke-linecap="round"/>`;
}

/** Sợi lông cứng thò ra dưới mép đĩa mõm. */
function lipBristles(seed: number): string {
  const r = rng(seed);
  let d = '';
  for (let i = 0; i < 30; i++) {
    const t = r();
    // dọc mặt dưới–trước đĩa mõm (mặt úp xuống để gặm cỏ)
    const x = 728 + t * 34;
    const y = botY(x) - 0.8;
    const len = 2 + r() * 2.8;
    const a = (60 + r() * 50 - t * 45) * (Math.PI / 180);
    d += `M${x.toFixed(1)} ${y.toFixed(1)}l${(Math.cos(a) * len).toFixed(2)} ${(Math.sin(a) * len).toFixed(2)}`;
  }
  return `<path d="${d}" fill="none" stroke="#e6d9cf" stroke-opacity="0.7" stroke-width="0.55" stroke-linecap="round"/>`;
}

/** Lá cỏ biển dạng dải (Halodule/Enhalus) – chỉ cho thẻ Sổ tay. */
function blade(x: number, h: number, lean: number, w: number, fill: string, op: number): string {
  const b = 292;
  const tx = x + lean;
  const ty = b - h;
  return (
    `<path d="M${(x - w / 2).toFixed(1)} ${b}C${(x - w / 2 + lean * 0.15).toFixed(1)} ${(b - h * 0.45).toFixed(1)} ${(tx - w * 0.6).toFixed(1)} ${(ty + h * 0.2).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}` +
    `C${(tx + w * 0.3).toFixed(1)} ${(ty + h * 0.25).toFixed(1)} ${(x + w / 2 + lean * 0.2).toFixed(1)} ${(b - h * 0.45).toFixed(1)} ${(x + w / 2).toFixed(1)} ${b}Z" fill="${fill}" fill-opacity="${op}"/>`
  );
}
function seagrass(): string {
  const r = rng(91);
  let s = '';
  const clusters: [number, number, number][] = [
    // [tâm x, độ rộng cụm, chiều cao tối đa]
    [722, 150, 92],
    [610, 80, 58],
    [480, 110, 42],
    [340, 90, 36],
    [216, 60, 30],
    [96, 150, 72],
  ];
  for (const [cx, spread, hMax] of clusters) {
    const n = Math.round(spread / 6);
    for (let i = 0; i < n; i++) {
      const x = cx - spread / 2 + r() * spread;
      const h = hMax * (0.45 + r() * 0.55);
      const lean = (r() - 0.35) * h * 0.45;
      const w = 2.8 + r() * 2.4;
      const tone = r();
      const fill = tone < 0.33 ? u.url('grassA') : tone < 0.66 ? u.url('grassB') : u.url('grassC');
      s += blade(x, h, lean, w, fill, 0.72 + r() * 0.2);
    }
  }
  // lá Halophila hình bầu dục (thức ăn ưa thích của dugong), từng cặp trên cuống ngắn
  let hal = '';
  const pairs: [number, number][] = [[640, 280], [664, 284], [688, 279], [520, 283], [548, 281], [390, 284], [180, 282], [210, 285]];
  for (const [x, y] of pairs) {
    const rot = Math.round((r() - 0.5) * 40);
    hal +=
      `<path d="M${x} 292L${x} ${y}" stroke="#5c7f45" stroke-width="0.8" stroke-opacity="0.8"/>` +
      `<ellipse cx="${x - 4}" cy="${y - 3}" rx="4.2" ry="2.2" transform="rotate(${-30 + rot} ${x - 4} ${y - 3})"/>` +
      `<ellipse cx="${x + 4}" cy="${y - 3.5}" rx="4.2" ry="2.2" transform="rotate(${30 + rot} ${x + 4} ${y - 3.5})"/>`;
  }
  return (
    `<g opacity="0.88">${s}</g>` +
    `<g fill="${u.url('halo')}" fill-opacity="0.9">${hal}</g>`
  );
}

const body = standardBody(u, BODY, {
  dorsal: BACK,
  flank: FLANK,
  belly: BELLY,
  outlineColor: EDGE,
  scales: false,
  flankAt: 0.46,
  rimOpacity: 0.75,
});

const theEye = eye(u, 'eye', {
  cx: 703,
  cy: 99,
  r: 3.1,
  iris: ['#5b3d2f', '#21150f'],
  pupil: 'round',
  socket: '#5f4d48',
  look: [0.35, 0.1],
});

const defs = joinDefs(
  body,
  theEye,
  organicTexture(u('skin'), { freq: 0.045, octaves: 3, strength: 0.16, seed: 23 }),
  blurFilter(u('soft1'), 1.0),
  blurFilter(u('soft2'), 2.2),
  blurFilter(u('soft5'), 5),
  linear(u('fluke'), [
    [0, '#93857b'],
    [0.55, '#85776d'],
    [1, '#8a7c71'],
  ], { user: true, x1: 36, y1: 0, x2: 172, y2: 0 }),
  linear(u('pect'), [
    [0, '#7a6d66', 0],
    [0.16, '#7a6d66', 0.97],
    [0.55, '#8f8079'],
    [1, '#a3938a'],
  ], { user: true, x1: 604, y1: 132, x2: 572, y2: 232 }),
  linear(u('pectFar'), [
    [0, '#5c514c'],
    [1, '#786a63'],
  ]),
  radial(u('pectGloss'), [
    [0, '#ffffff', 0.26],
    [1, '#ffffff', 0],
  ], { cx: 0.62, cy: 0.35, r: 0.5 }),
  radial(u('disc'), [
    [0, '#a08a82', 0.85],
    [0.6, DISC, 0.75],
    [1, '#6e5c56', 0.6],
  ], { cx: 0.7, cy: 0.6, r: 0.7 }),
  linear(u('grassA'), [
    [0, '#9cc56e'],
    [1, '#3f6e3a'],
  ]),
  linear(u('grassB'), [
    [0, '#b7cf74'],
    [1, '#5a7f3c'],
  ]),
  linear(u('grassC'), [
    [0, '#7fae64'],
    [1, '#2f5a36'],
  ]),
  linear(u('halo'), [
    [0, '#a9d07a'],
    [1, '#5f8f4a'],
  ]),
  clip(u('flukeClip'), FLUKES),
  clip(u('pectClip'), PECT_NEAR),
  // mép cuống đuôi mờ dần vào gốc vây đuôi (vây đuôi nằm phía sau) → không lộ đường nối
  linear(u('tailFadeGrad'), [
    [0, '#000000'],
    [1, '#ffffff'],
  ], { user: true, x1: 142, y1: 0, x2: 170, y2: 0 }),
  `<mask id="${u('tailFade')}" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="288"><rect x="0" y="0" width="800" height="288" fill="${u.url('tailFadeGrad')}"/></mask>`,
);

// ---------- Lớp ----------
const flukesSvg =
  `<path d="${FLUKES}" fill="${u.url('fluke')}"/>` +
  `<g clip-path="${u.url('flukeClip')}">` +
  // thùy xa (trên) tối hơn → gợi mặt phẳng nằm ngang
  `<path d="${FLUKE_FAR}" fill="#3f3431" fill-opacity="0.22"/>` +
  // mép sau sáng nhẹ (da mỏng)
  `<path d="${FLUKE_TRAIL}" fill="none" stroke="#cbbcb3" stroke-opacity="0.55" stroke-width="5" filter="${u.url('soft2')}"/>` +
  // gờ giữa từ cuống đuôi tới khía
  `<path d="M172 142C146 142.6 120 143.8 101 145" fill="none" stroke="#3f3431" stroke-opacity="0.3" stroke-width="2.6" filter="${u.url('soft1')}"/>` +
  `<path d="M172 139.6C146 140.2 120 141.6 102 143.2" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.1"/>` +
  // ánh sáng mép trước thùy trên & bóng mép trước thùy dưới
  `<path d="M166 128.5C140 119 108 106.5 76 100.5C60 97.6 46 98.5 40 101.6" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1.6" stroke-linecap="round"/>` +
  `<path d="M168 156C156 176 136 204 108 226" fill="none" stroke="#3f3431" stroke-opacity="0.25" stroke-width="5" filter="${u.url('soft2')}"/>` +
  // vài vết sẹo nhỏ trên thùy đuôi
  `<path d="M128 175C122 181 118 188 116 195M64 109C72 114 80 118 88 121" fill="none" stroke="${SCAR}" stroke-opacity="0.4" stroke-width="0.9" stroke-linecap="round"/>` +
  scatterSpots(41, { x: 36, y: 98, w: 136, h: 132 }, { count: 60, rMin: 0.35, rMax: 0.75, color: PORE, opacity: 0.35, minGap: 5 }) +
  `</g>` +
  `<path d="${FLUKES}" fill="none" stroke="${EDGE}" stroke-width="1.3" stroke-opacity="0.55" stroke-linejoin="round"/>`;

const bodySvg =
  `<g mask="${u.url('tailFade')}">` +
  `<g filter="${u.url('skin')}">` +
  body.base +
  `<g clip-path="${u.url('bodyClip')}">` +
  // mảng sẫm loang trên lưng (xám nâu)
  `<g fill="#6b5f5a" filter="${u.url('soft5')}">` +
  `<ellipse cx="640" cy="80" rx="46" ry="11" fill-opacity="0.32" transform="rotate(10 640 80)"/>` +
  `<ellipse cx="540" cy="72" rx="70" ry="12" fill-opacity="0.3"/>` +
  `<ellipse cx="420" cy="80" rx="64" ry="12" fill-opacity="0.26" transform="rotate(8 420 80)"/>` +
  `<ellipse cx="300" cy="104" rx="60" ry="11" fill-opacity="0.3" transform="rotate(14 300 104)"/>` +
  `<ellipse cx="200" cy="126" rx="50" ry="9" fill-opacity="0.34" transform="rotate(12 200 126)"/>` +
  `</g>` +
  // ánh hồng nhạt ở hông & bụng
  `<g filter="${u.url('soft5')}">` +
  `<ellipse cx="470" cy="152" rx="120" ry="22" fill="#c4a596" fill-opacity="0.16"/>` +
  `<ellipse cx="330" cy="168" rx="90" ry="16" fill="#c4a596" fill-opacity="0.14" transform="rotate(10 330 168)"/>` +
  `<path d="M676 186C600 206 500 224 400 224C320 222 250 198 190 162L190 240L676 240Z" fill="#d8c4b4" fill-opacity="0.4"/>` +
  `</g>` +
  // bóng khối dưới bụng (thân tròn, mập)
  `<path d="M650 196C560 214 460 226 380 224C300 220 240 196 196 166" fill="none" stroke="#5a4c48" stroke-opacity="0.22" stroke-width="10" filter="${u.url('soft5')}"/>` +
  // sống lưng sáng (da ướt bắt nắng)
  `<path d="M690 86C640 74 580 69 520 69C460 70 400 78 340 94" fill="none" stroke="#ffffff" stroke-opacity="0.24" stroke-width="7" stroke-linecap="round" filter="${u.url('soft2')}"/>` +
  `<path d="M330 98C290 108 250 118 210 126" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="4" stroke-linecap="round" filter="${u.url('soft2')}"/>` +
  `<path d="M748 112C738 102 724 94 708 89" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="4" stroke-linecap="round" filter="${u.url('soft2')}"/>` +
  // đĩa mõm: tông riêng, hơi hồng nâu
  `<path d="${DISC_AREA}" fill="${u.url('disc')}" filter="${u.url('soft1')}"/>` +
  `<path d="M760 128C752 140 746 152 742 166" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="5" stroke-linecap="round" filter="${u.url('soft2')}"/>` +
  // nếp nhăn đồng tâm quanh đĩa mõm (da dày)
  `<path d="M756 120C744 129 732 142 725 157C721 167 720 175 721 183M744 108C730 118 718 134 712 152C709 162 709 172 710 181" fill="none" stroke="#3f3431" stroke-opacity="0.2" stroke-width="1" stroke-linecap="round"/>` +
  `<path d="M757 121.5C745 130.5 733 143.5 726.5 158M745 109.5C731 119.5 719.5 135.5 713.5 153" fill="none" stroke="#ffffff" stroke-opacity="0.14" stroke-width="0.8" stroke-linecap="round"/>` +
  // vết sẹo nhạt: các vệt cào song song (vết ngà) + mảng loang nhạt
  `<g fill="none" stroke="${SCAR}" stroke-linecap="round">` +
  `<path d="M528 68C520 86 510 102 498 118M538 69C530 87 520 104 509 119M547 71C540 86 532 99 524 110" stroke-opacity="0.42" stroke-width="1.3"/>` +
  `<path d="M612 72C596 88 582 100 566 110" stroke-opacity="0.32" stroke-width="2.6" filter="${u.url('soft1')}"/>` +
  `<path d="M408 80C402 96 394 110 386 120M416 81C411 94 405 106 398 115" stroke-opacity="0.36" stroke-width="1.1"/>` +
  `<path d="M300 128C290 136 284 144 280 152M470 140C482 146 492 150 504 152M660 126C652 132 648 140 646 146" stroke-opacity="0.3" stroke-width="0.9"/>` +
  `</g>` +
  `<g fill="${SCAR}" filter="${u.url('soft2')}">` +
  `<ellipse cx="452" cy="94" rx="15" ry="4.5" fill-opacity="0.32" transform="rotate(-12 452 94)"/>` +
  `<ellipse cx="248" cy="132" rx="11" ry="3.5" fill-opacity="0.28" transform="rotate(20 248 132)"/>` +
  `<ellipse cx="594" cy="160" rx="7" ry="3" fill-opacity="0.26"/>` +
  `</g>` +
  // nếp nhăn cổ (nếp gấp đứng sau đầu) – rãnh sẫm + mép sáng
  `<g fill="none" stroke-linecap="round">` +
  `<path d="M688 82C683 108 682 140 688 181" stroke="#3f3431" stroke-opacity="0.34" stroke-width="2.4" filter="${u.url('soft1')}"/>` +
  `<path d="M691 83C686 108 685.5 140 691 180" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1"/>` +
  `<path d="M664 76C657 100 656 124 660 146" stroke="#3f3431" stroke-opacity="0.26" stroke-width="2" filter="${u.url('soft1')}"/>` +
  `<path d="M667 77C660 100 659 124 663 145" stroke="#ffffff" stroke-opacity="0.18" stroke-width="0.9"/>` +
  `<path d="M676 150C672 162 672 172 676 184M652 156C650 166 651 176 655 189" stroke="#3f3431" stroke-opacity="0.22" stroke-width="1.2"/>` +
  `</g>` +
  // nếp da quanh gốc vây ngực
  `<path d="M556 150C576 134 610 128 640 134" fill="none" stroke="#3f3431" stroke-opacity="0.3" stroke-width="2.2" filter="${u.url('soft1')}"/>` +
  `<path d="M556 147C576 131.5 610 125.5 640 131.5" fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1"/>` +
  `<path d="M548 160C554 150 562 142 572 136M642 146C646 156 646 168 644 178" fill="none" stroke="#3f3431" stroke-opacity="0.18" stroke-width="1.1"/>` +
  // lỗ chân lông / gốc lông tơ
  pores(11, 430, 150, 760) +
  pores(12, 50, 600, 730) +
  `</g>` +
  `</g>` +
  // gờ cuống đuôi mờ
  `<path d="M250 150C214 146 180 143 150 142" fill="none" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1.2"/>` +
  body.overlay +
  hairs(5, 70, 160, 750) +
  `</g>`;

const faceSvg =
  // mép trên đĩa mõm hình móng ngựa
  `<path d="${DISC_RIM}" fill="none" stroke="#3f3431" stroke-opacity="0.32" stroke-width="1.5" stroke-linecap="round"/>` +
  `<path d="${DISC_RIM}" fill="none" stroke="#ffffff" stroke-opacity="0.26" stroke-width="0.9" transform="translate(-1.6 -1.2)"/>` +
  `<g clip-path="${u.url('bodyClip')}">` +
  bristles(77) +
  `</g>` +
  lipBristles(78) +
  // đường miệng + môi dưới (cằm nhỏ phía sau đĩa mõm)
  `<path d="${MOUTH}" fill="none" stroke="#3a2e2b" stroke-opacity="0.75" stroke-width="1.5" stroke-linecap="round"/>` +
  `<path d="${MOUTH}" fill="none" stroke="#ead9cf" stroke-opacity="0.4" stroke-width="1" transform="translate(0 1.6)"/>` +
  // lỗ mũi (van lưỡi liềm) trên đỉnh mõm, sát mặt trước
  `<path d="M733 111.2C736.6 109.6 740.2 110.2 742.6 112.6" fill="none" stroke="#2f2522" stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round"/>` +
  `<path d="M733.6 113.2C736.8 112.2 739.6 112.6 741.8 114.4" fill="none" stroke="#ffffff" stroke-opacity="0.28" stroke-width="0.8" stroke-linecap="round"/>` +
  // nếp da quanh mắt nhỏ
  `<ellipse cx="703" cy="99" rx="6.6" ry="5" fill="#4e403c" fill-opacity="0.28" filter="${u.url('soft1')}"/>` +
  `<path d="M697 97.4Q703 92.4 709.4 96.8M697.6 101.6Q703 105 708.8 101.2" fill="none" stroke="#4e403c" stroke-opacity="0.5" stroke-width="0.9" stroke-linecap="round"/>` +
  `<path d="M695 103C699 108 705 110 711 108" fill="none" stroke="#3f3431" stroke-opacity="0.22" stroke-width="0.8" stroke-linecap="round"/>` +
  // lỗ tai bé sau mắt
  `<circle cx="680" cy="106" r="0.9" fill="#3a2e2b" fill-opacity="0.75"/>`;

const pectFarSvg =
  `<path d="${PECT_FAR}" fill="${u.url('pectFar')}"/>` +
  `<path d="M582 190C578 210 572 230 562 246" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1.2" stroke-linecap="round"/>` +
  `<path d="${PECT_FAR}" fill="none" stroke="${EDGE}" stroke-width="1.1" stroke-opacity="0.5" stroke-linejoin="round"/>`;

const pectNearSvg =
  `<path d="${PECT_NEAR}" fill="${u.url('pect')}"/>` +
  `<g clip-path="${u.url('pectClip')}">` +
  `<path d="${PECT_NEAR}" fill="${u.url('pectGloss')}"/>` +
  // mép trước sáng, mép sau và chóp sẫm (da dày, mái chèo)
  `<path d="M630 150C628 176 620 196 608 214" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="5" filter="${u.url('soft2')}"/>` +
  `<path d="M552 200C552 216 560 228 574 231C590 232 604 222 612 210" fill="none" stroke="#4a3e3b" stroke-opacity="0.32" stroke-width="7" filter="${u.url('soft2')}"/>` +
  // nếp nhăn ngang trên mái chèo (khớp ngón bên trong)
  `<path d="M558 176C576 178 600 176 626 168M556 192C574 196 598 194 620 186M562 208C578 212 596 210 610 204" fill="none" stroke="#4a3e3b" stroke-opacity="0.18" stroke-width="1" stroke-linecap="round"/>` +
  `<path d="M590 214C584 218 578 220 570 220" fill="none" stroke="${SCAR}" stroke-opacity="0.35" stroke-width="0.9" stroke-linecap="round"/>` +
  scatterSpots(53, { x: 550, y: 150, w: 84, h: 82 }, { count: 40, rMin: 0.35, rMax: 0.75, color: PORE, opacity: 0.32, minGap: 5 }) +
  `</g>` +
  `<path d="M626 160C624 180 616 200 604 216" fill="none" stroke="#ffffff" stroke-opacity="0.32" stroke-width="1.2" stroke-linecap="round"/>` +
  `<path d="${PECT_NEAR_EDGE}" fill="none" stroke="${EDGE}" stroke-width="1.3" stroke-opacity="0.55" stroke-linejoin="round" stroke-linecap="round"/>`;

const art: CreatureArt = {
  id: 'bo_bien',
  viewBox: [800, 288],
  lengthUnits: 728,
  spineY: 141,
  animation: 'mammal',
  cycleHz: 0.45,
  bendAmp: 5,
  // 300 cm theo công thức sẽ ~330px – quá to so với khung hình; 260px (ngang cá heo) vẫn to gấp ~1.7 lần thợ lặn,
  // đủ thấy rõ đĩa mõm & đuôi hai thùy mà không che kín màn hình khi nó bơi qua chậm rãi.
  displayLengthPx: 260,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      // cỏ biển (thức ăn của dugong) – chỉ trên thẻ Sổ tay
      name: 'seagrass',
      role: 'detail',
      bend: false,
      z: 'back',
      cardOnly: true,
      pivot: [400, 288],
      anim: { type: 'none', amp: 0 },
      svg: seagrass(),
    },
    {
      name: 'pectoralFar',
      role: 'flipper',
      bend: false,
      z: 'back',
      pivot: [596, 192],
      anim: { type: 'rotate', amp: 0.06, speed: 0.5, phase: 1.4 },
      svg: pectFarSvg,
    },
    {
      // đuôi nằm ngang kiểu cá voi: quạt lên–xuống chậm quanh cuống đuôi, trễ 1/4 nhịp so với thân
      name: 'flukes',
      role: 'tail',
      bend: false,
      z: 'back',
      pivot: [162, 141],
      anim: { type: 'rotate', amp: 0.16, phase: -Math.PI / 2 },
      svg: flukesSvg,
    },
    { name: 'body', role: 'body', svg: bodySvg },
    { name: 'face', role: 'detail', svg: faceSvg },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    {
      name: 'pectoralNear',
      role: 'flipper',
      bend: false,
      z: 'front',
      pivot: [604, 142],
      anim: { type: 'rotate', amp: 0.07, speed: 0.5 },
      svg: pectNearSvg,
    },
  ],
};

export default art;
