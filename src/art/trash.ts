/** Rác nhựa trôi dưới biển (để người chơi nhặt) – vẽ bằng SVG. */
export interface TrashArt {
  id: string;
  name: string;
  viewBox: [number, number];
  svg: string;
  sizePx: number;
}

export const TRASH: TrashArt[] = [
  {
    id: 'bag',
    name: 'Túi nilon',
    viewBox: [120, 140],
    sizePx: 54,
    svg:
      `<defs><linearGradient id="tr_bag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.75"/><stop offset="1" stop-color="#cfe6f0" stop-opacity="0.45"/></linearGradient></defs>` +
      `<path d="M30 20C26 8 40 6 42 18L44 30C56 26 66 26 78 30L80 18C82 6 96 8 92 20L88 34C104 48 108 80 100 104C92 128 74 136 60 134C40 132 24 122 18 100C12 78 16 48 34 34Z" fill="url(#tr_bag)" stroke="#e8f6ff" stroke-opacity="0.8" stroke-width="2"/>` +
      `<path d="M40 50C44 72 40 98 48 118M70 46C74 70 82 96 76 120" stroke="#ffffff" stroke-opacity="0.5" stroke-width="2" fill="none"/>`,
  },
  {
    id: 'bottle',
    name: 'Chai nhựa',
    viewBox: [160, 60],
    sizePx: 52,
    svg:
      `<defs><linearGradient id="tr_bot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8fbff" stop-opacity="0.85"/><stop offset="0.5" stop-color="#7cc8d8" stop-opacity="0.6"/><stop offset="1" stop-color="#3f8fa8" stop-opacity="0.75"/></linearGradient></defs>` +
      `<path d="M10 22H24V38H10Z" fill="#2f7fd6"/><path d="M24 20C34 20 40 12 54 12H140C150 12 154 18 154 30C154 42 150 48 140 48H54C40 48 34 40 24 40Z" fill="url(#tr_bot)" stroke="#e6fbff" stroke-width="1.5"/>` +
      `<rect x="70" y="16" width="44" height="28" fill="#4fbf7a" opacity="0.7"/><path d="M60 18H148" stroke="#ffffff" stroke-opacity="0.8" stroke-width="2"/>`,
  },
  {
    id: 'net',
    name: 'Lưới ma',
    viewBox: [160, 120],
    sizePx: 76,
    svg:
      `<g fill="none" stroke="#2f8f7a" stroke-width="2.4" stroke-opacity="0.85">` +
      `<path d="M10 30C40 10 80 40 120 18C140 10 150 30 150 30M8 60C50 44 90 70 150 52M14 92C50 78 100 104 146 84"/>` +
      `<path d="M20 20L30 104M50 18L56 110M80 26L84 108M110 20L112 102M140 22L136 92"/></g>` +
      `<circle cx="34" cy="62" r="5" fill="#ffb74d"/><circle cx="112" cy="58" r="5" fill="#ffb74d"/>`,
  },
  {
    id: 'straw',
    name: 'Ống hút nhựa',
    viewBox: [120, 30],
    sizePx: 38,
    svg: `<path d="M6 18L96 10L100 4L114 6L112 20L100 18L8 26Z" fill="#ff6b8a" stroke="#fff" stroke-opacity="0.6" stroke-width="1.5"/><path d="M14 20L94 13" stroke="#fff" stroke-opacity="0.7" stroke-width="2"/>`,
  },
  {
    id: 'cup',
    name: 'Cốc nhựa',
    viewBox: [80, 90],
    sizePx: 40,
    svg:
      `<defs><linearGradient id="tr_cup" x1="0" x2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.7"/><stop offset="1" stop-color="#bfe0ee" stop-opacity="0.45"/></linearGradient></defs>` +
      `<path d="M8 10H72L62 84H18Z" fill="url(#tr_cup)" stroke="#e8f8ff" stroke-width="2"/><path d="M4 8H76V14H4Z" fill="#f2f8ff" opacity="0.9"/>`,
  },
];
