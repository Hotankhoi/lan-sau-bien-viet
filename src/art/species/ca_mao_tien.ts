/**
 * Cá mao tiên – Pterois volitans
 * LOÀI MẪU CHUẨN #2 (do agent điều phối vẽ).
 * Đặc điểm nhận dạng: thân sọc dọc đỏ nâu xen trắng kem; vây ngực cực lớn xòe như quạt lông vũ;
 * vây lưng là các gai dài tách rời có sọc đỏ trắng; tua da trên mắt; vây mềm trong suốt có hàng chấm.
 */
import type { CreatureArt } from '../contract';
import {
  makeIds,
  standardBody,
  eye,
  linear,
  radial,
  joinDefs,
  rng,
  finRays,
} from '../style-bible';

const u = makeIds('ca_mao_tien');

const RED = '#8E2414';
const RED_D = '#5a140a';
const CREAM = '#F7E6D0';
const BROWN_LINE = '#a8553a';

const BODY =
  'M558 214C552 194 532 174 502 162C462 148 404 148 344 154C292 160 248 176 212 194L190 200L190 228L212 232C252 248 300 262 352 266C410 270 472 264 514 248C540 238 558 228 558 214Z';

/** Điểm trên đường lưng (x → y) – xấp xỉ để cắm gai vây lưng. */
function backY(x: number): number {
  // nội suy tuyến tính theo vài mốc của đường lưng
  const pts: [number, number][] = [
    [520, 166], [490, 158], [460, 152], [420, 149], [380, 150], [344, 154], [300, 160], [250, 174], [212, 194],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if (x <= x1 && x >= x2) return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
  }
  return 170;
}

// ---------- Sọc thân ----------
function stripes(): string {
  let dark = '';
  let lines = '';
  const r = rng(77);
  for (let x = 196; x < 560; x += 19 + r() * 9) {
    const head = Math.max(0, x - 450) / 110; // vùng đầu: sọc nghiêng tỏa từ mắt
    const lean = 10 + head * 26;
    const w = 8 + r() * 9;
    const top = 135;
    const bot = 280;
    const mid = 208;
    dark += `<path d="M${x + lean} ${top}Q${x - 8} ${mid} ${x + 4 - head * 18} ${bot}L${x + 4 - head * 18 + w} ${bot}Q${x - 8 + w} ${mid} ${x + lean + w} ${top}Z"/>`;
    const lx = x + w + 5;
    lines += `<path d="M${lx + lean} ${top}Q${lx - 8} ${mid} ${lx + 4 - head * 18} ${bot}"/>`;
  }
  // dải tối chạy dọc qua mắt
  dark += `<path d="M492 150Q488 190 498 236L512 236Q502 190 508 150Z"/>`;
  return (
    `<g fill="${u.url('stripe')}">${dark}</g>` +
    `<g fill="none" stroke="${BROWN_LINE}" stroke-opacity="0.55" stroke-width="1.6">${lines}</g>`
  );
}

// ---------- Gai vây lưng ----------
function dorsalSpines(): string {
  const n = 13;
  let membranes = '';
  let spines = '';
  const tips: [number, number][] = [];
  const bases: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const x = 478 - i * 14.5;
    const y = backY(x) + 6;
    const L = 165 - Math.abs(i - 3.5) * 9 - (i > 8 ? (i - 8) * 12 : 0);
    const ang = (-104 - i * 1.6) * (Math.PI / 180);
    const tx = x + Math.cos(ang) * L;
    const ty = y + Math.sin(ang) * L;
    bases.push([x, y]);
    tips.push([tx, ty]);
  }
  // màng nối giữa các gai: chỉ tới ~45% chiều dài
  for (let i = 0; i < n - 1; i++) {
    const [bx1, by1] = bases[i];
    const [bx2, by2] = bases[i + 1];
    const k1 = 0.42 + (i % 2) * 0.05;
    const m1: [number, number] = [bx1 + (tips[i][0] - bx1) * k1, by1 + (tips[i][1] - by1) * k1];
    const m2: [number, number] = [bx2 + (tips[i + 1][0] - bx2) * 0.3, by2 + (tips[i + 1][1] - by2) * 0.3];
    membranes += `<path d="M${bx1} ${by1}L${m1[0].toFixed(1)} ${m1[1].toFixed(1)}Q${((m1[0] + m2[0]) / 2 - 4).toFixed(1)} ${((m1[1] + m2[1]) / 2 + 10).toFixed(1)} ${m2[0].toFixed(1)} ${m2[1].toFixed(1)}L${bx2} ${by2}Z"/>`;
  }
  for (let i = 0; i < n; i++) {
    const [bx, by] = bases[i];
    const [tx, ty] = tips[i];
    const dx = tx - bx;
    const dy = ty - by;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny = dx / len;
    const w0 = 2.6;
    const w1 = 0.5;
    spines += `<path d="M${(bx + nx * w0).toFixed(1)} ${(by + ny * w0).toFixed(1)}L${(tx + nx * w1).toFixed(1)} ${(ty + ny * w1).toFixed(1)}L${(tx - nx * w1).toFixed(1)} ${(ty - ny * w1).toFixed(1)}L${(bx - nx * w0).toFixed(1)} ${(by - ny * w0).toFixed(1)}Z"/>`;
  }
  return (
    `<g fill="#8a2a16" fill-opacity="0.32" stroke="#f3d9bd" stroke-opacity="0.25" stroke-width="0.8">${membranes}</g>` +
    `<g fill="${u.url('bandV')}" stroke="${RED_D}" stroke-width="0.6" stroke-opacity="0.6">${spines}</g>` +
    `<g fill="#fff6ea">${tips.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6"/>`).join('')}</g>`
  );
}

// ---------- Vây ngực xòe quạt ----------
function pectoralFan(base: [number, number], a0: number, a1: number, n: number, Lmax: number, Lmin: number, seed: number, dim = 0): string {
  const r = rng(seed);
  const rays: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const ang = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
    const L = Lmin + (Lmax - Lmin) * Math.sin(Math.PI * (0.15 + 0.85 * t)) + (r() - 0.5) * 14;
    rays.push([ang, L, t]);
  }
  const [bx, by] = base;
  const pt = (ang: number, L: number): [number, number] => [bx + Math.cos(ang) * L, by + Math.sin(ang) * L];
  // màng: tới 62% chiều dài, mép lượn lõm giữa 2 tia
  let mem = `M${bx} ${by}`;
  rays.forEach(([ang, L], i) => {
    const p = pt(ang, L * 0.62);
    if (i === 0) mem += `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    else {
      const [pa, pl] = rays[i - 1];
      const c = pt((pa + ang) / 2, ((pl + L) / 2) * 0.5);
      mem += `Q${c[0].toFixed(1)} ${c[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    }
  });
  mem += 'Z';
  let rayPaths = '';
  let tipsSvg = '';
  rays.forEach(([ang, L]) => {
    const tip = pt(ang, L);
    const mid = pt(ang + 0.05, L * 0.55);
    rayPaths += `M${bx} ${by}Q${mid[0].toFixed(1)} ${mid[1].toFixed(1)} ${tip[0].toFixed(1)} ${tip[1].toFixed(1)}`;
    // tua lông vũ nhỏ ở phần ngọn
    for (let k = 0.74; k < 0.98; k += 0.12) {
      const p = pt(ang + 0.012, L * k);
      const side = k * 10 % 2 > 1 ? 1 : -1;
      const q = pt(ang + side * 0.07, L * (k + 0.05));
      tipsSvg += `M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
    }
  });
  const darken = dim ? `<path d="${mem}" fill="#2a0804" fill-opacity="${dim}"/>` : '';
  return (
    `<path d="${mem}" fill="${u.url('bandR')}" fill-opacity="0.38"/>` +
    `<path d="${mem}" fill="#f6e2c9" fill-opacity="0.12" stroke="#f6e2c9" stroke-opacity="0.3" stroke-width="0.8"/>` +
    darken +
    `<path d="${rayPaths}" fill="none" stroke="${u.url('bandR')}" stroke-width="3.4" stroke-linecap="round"/>` +
    `<path d="${rayPaths}" fill="none" stroke="${RED_D}" stroke-opacity="0.3" stroke-width="0.7"/>` +
    `<path d="${tipsSvg}" fill="none" stroke="${CREAM}" stroke-opacity="0.45" stroke-width="0.8" stroke-linecap="round"/>`
  );
}

// ---------- Vây mềm trong suốt có hàng chấm ----------
function dottedFin(d: string, seed: number, area: { x: number; y: number; w: number; h: number }, clipId: string): string {
  const r = rng(seed);
  let dots = '';
  for (let i = 0; i < 60; i++) {
    const x = area.x + r() * area.w;
    const y = area.y + r() * area.h;
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.6 + r() * 1.6).toFixed(1)}"/>`;
  }
  return (
    `<path d="${d}" fill="${u.url('clear')}"/>` +
    `<g clip-path="${u.url(clipId)}" fill="${RED_D}" fill-opacity="0.75">${dots}</g>` +
    `<path d="${d}" fill="none" stroke="${CREAM}" stroke-opacity="0.45" stroke-width="1"/>`
  );
}

const SOFT_DORSAL = 'M306 160C290 126 262 112 236 122C222 140 214 166 206 196L250 186Z';
const CAUDAL = 'M196 198C172 176 130 166 98 172C84 194 82 236 98 258C130 262 172 252 196 230Z';
const ANAL = 'M306 262C300 292 278 312 252 310C240 294 230 270 226 244Z';
const PELVIC = 'M442 258C432 292 404 326 362 342C366 316 392 284 420 258Z';
const TENTACLE = 'M494 174C486 156 490 138 503 128C511 144 509 160 502 176Z';

const body = standardBody(u, BODY, {
  dorsal: '#E7C3A0',
  flank: CREAM,
  belly: '#FFF7EC',
  outlineColor: '#5a1a0c',
  scales: { size: 7, color: '#6b2410', opacity: 0.1 },
  flankAt: 0.5,
});

const theEye = eye(u, 'eye', {
  cx: 500,
  cy: 188,
  r: 13,
  iris: ['#e0543a', '#4a0e08'],
  socket: '#7a1c10',
});

const defs = joinDefs(
  body,
  theEye,
  // sọc thân: lưng đậm hơn bụng
  linear(
    u('stripe'),
    [
      [0, RED_D],
      [0.45, RED],
      [1, '#b84a2e'],
    ],
    { user: true, x1: 0, y1: 140, x2: 0, y2: 275 },
  ),
  // sọc dọc gai vây lưng (lặp theo trục y)
  linear(
    u('bandV'),
    [
      [0, RED],
      [0.42, RED],
      [0.5, CREAM],
      [0.92, CREAM],
      [1, RED],
    ],
    { user: true, x1: 0, y1: 0, x2: 0, y2: 22, spread: 'repeat' },
  ),
  // vòng sọc đồng tâm cho vây ngực (lặp theo bán kính)
  radial(
    u('bandR'),
    [
      [0, '#9b2a17'],
      [0.46, '#7c1d10'],
      [0.52, CREAM],
      [0.86, '#f3d9bd'],
      [0.92, '#9b2a17'],
      [1, '#9b2a17'],
    ],
    { user: true, cx: 440, cy: 226, r: 30, spread: 'repeat' },
  ),
  radial(
    u('bandRfar'),
    [
      [0, '#9b2a17'],
      [0.5, CREAM],
      [1, '#9b2a17'],
    ],
    { user: true, cx: 452, cy: 222, r: 30, spread: 'repeat' },
  ),
  linear(u('clear'), [
    [0, '#f5e9da', 0.42],
    [1, '#e8d2bb', 0.3],
  ]),
  `<clipPath id="${u('softClip')}"><path d="${SOFT_DORSAL}"/></clipPath>`,
  `<clipPath id="${u('caudalClip')}"><path d="${CAUDAL}"/></clipPath>`,
  `<clipPath id="${u('analClip')}"><path d="${ANAL}"/></clipPath>`,
  linear(u('pelvic'), [
    [0, '#3a0d06'],
    [1, '#6e1a0d'],
  ]),
);

const art: CreatureArt = {
  id: 'ca_mao_tien',
  viewBox: [640, 400],
  lengthUnits: 470,
  spineY: 212,
  animation: 'fish',
  cycleHz: 0.9,
  bendAmp: 8,
  cardDetailLevel: 'hi',
  defs,
  layers: [
    {
      name: 'pectoralFar',
      role: 'fin',
      z: 'back',
      pivot: [452, 222],
      anim: { type: 'rotate', amp: 0.09, speed: 0.6, phase: 1.2 },
      svg: pectoralFan([452, 222], 196, 112, 13, 222, 120, 7, 0.35).replace(/ca_mao_tien__bandR\)/g, 'ca_mao_tien__bandRfar)'),
    },
    {
      name: 'caudal',
      role: 'tail',
      svg: dottedFin(CAUDAL, 11, { x: 84, y: 166, w: 112, h: 96 }, 'caudalClip') +
        finRays([196, 214], [[104, 176], [94, 192], [90, 214], [94, 236], [104, 254]], { color: CREAM, opacity: 0.35 }),
    },
    {
      name: 'softDorsal',
      role: 'detail',
      svg: dottedFin(SOFT_DORSAL, 5, { x: 206, y: 112, w: 100, h: 84 }, 'softClip'),
    },
    {
      name: 'anal',
      role: 'detail',
      svg:
        dottedFin(ANAL, 9, { x: 226, y: 244, w: 80, h: 68 }, 'analClip') +
        `<g stroke="${u.url('bandV')}" stroke-width="2.4" stroke-linecap="round"><path d="M300 262L282 304"/><path d="M290 258L268 298"/><path d="M280 254L256 292"/></g>`,
    },
    {
      name: 'dorsalSpines',
      role: 'detail',
      svg: dorsalSpines(),
    },
    {
      name: 'body',
      role: 'body',
      svg:
        body.base +
        `<g clip-path="${u.url('bodyClip')}">${stripes()}` +
        // vùng má/ hàm sáng hơn
        `<ellipse cx="528" cy="232" rx="30" ry="16" fill="${CREAM}" opacity="0.35"/>` +
        `</g>` +
        body.overlay,
    },
    {
      name: 'face',
      role: 'detail',
      svg:
        // miệng rộng hếch
        `<path d="M557 218Q540 232 514 228" fill="none" stroke="${RED_D}" stroke-width="2.2" stroke-linecap="round"/>` +
        `<path d="M556 212Q546 206 536 208" fill="none" stroke="#fff3e3" stroke-width="1.3" opacity="0.6"/>` +
        // gờ nắp mang
        `<path d="M472 170C462 196 464 230 478 252" fill="none" stroke="${RED_D}" stroke-opacity="0.45" stroke-width="1.6"/>` +
        // tua da dưới hàm
        `<path d="M520 246Q516 258 508 262M532 242Q530 254 524 258" fill="none" stroke="${RED}" stroke-width="2.4" stroke-linecap="round" opacity="0.8"/>`,
    },
    {
      name: 'tentacle',
      role: 'detail',
      svg: `<path d="${TENTACLE}" fill="${u.url('bandV')}" stroke="${RED_D}" stroke-width="0.8" stroke-opacity="0.6"/>`,
    },
    { name: 'eye', role: 'eye', svg: theEye.svg },
    {
      name: 'pelvic',
      role: 'fin',
      pivot: [432, 260],
      anim: { type: 'rotate', amp: 0.08, speed: 0.6, phase: 2 },
      svg:
        `<path d="${PELVIC}" fill="${u.url('pelvic')}" fill-opacity="0.85"/>` +
        `<g fill="#fff3e3" opacity="0.85"><circle cx="418" cy="282" r="2.4"/><circle cx="404" cy="300" r="2.2"/><circle cx="388" cy="316" r="2"/><circle cx="426" cy="270" r="2"/><circle cx="398" cy="290" r="1.8"/><circle cx="380" cy="326" r="1.8"/></g>`,
    },
    {
      name: 'pectoralNear',
      role: 'fin',
      z: 'front',
      pivot: [440, 226],
      anim: { type: 'rotate', amp: 0.1, speed: 0.6 },
      svg: pectoralFan([440, 226], 204, 104, 15, 236, 128, 3),
    },
  ],
};

export default art;
