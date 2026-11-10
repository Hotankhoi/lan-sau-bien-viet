/** Sổ tay sinh vật: lưới thẻ theo vùng + bộ lọc + thẻ chi tiết. */
import { SPECIES, SPECIES_BY_ID, REGIONS, REGION_LABEL, TIER_INFO, RARITY_INFO, DANGER_INFO, IUCN_INFO, BEHAVIOR_HINT, type Species, type RegionId } from '../data/types';
import { getArt } from '../art/species';
import { Save } from '../systems/Save';
import { Sound } from '../systems/Audio';
import { h, clear, artUrl, stars } from './dom';
import { rarityBadge, dangerBadge } from './Hud';

type Tab = RegionId | 'all';

export class Journal {
  el: HTMLElement;
  private grid: HTMLElement;
  private progress: HTMLElement;
  private tabsEl: HTMLElement;
  private tab: Tab = 'all';
  private f = { tier: '', rarity: '', danger: '', iucn: '' };

  constructor(
    private root: HTMLElement,
    private onClose: () => void,
    initial?: string,
  ) {
    this.grid = h('div', { class: 'grid scroll' });
    this.progress = h('div', { class: 'progress-row' });
    this.tabsEl = h('div', { class: 'tabs' });
    const sel = (key: keyof Journal['f'], label: string, opts: [string, string][]) => {
      const s = h('select', { 'aria-label': label, onchange: (e: Event) => ((this.f[key] = (e.target as HTMLSelectElement).value), this.render()) }, h('option', { value: '' }, label), opts.map(([v, t]) => h('option', { value: v }, t)));
      return s;
    };
    const filters = h(
      'div',
      { class: 'filters' },
      sel('tier', 'Mọi tầng', [['1', TIER_INFO[1].name], ['2', TIER_INFO[2].name], ['3', TIER_INFO[3].name]]),
      sel('rarity', 'Mọi độ hiếm', Object.entries(RARITY_INFO).map(([k, v]) => [k, v.name])),
      sel('danger', 'Mọi mức nguy hiểm', Object.entries(DANGER_INFO).map(([k, v]) => [k, v.name])),
      sel('iucn', 'Mọi bậc bảo tồn', Object.entries(IUCN_INFO).map(([k, v]) => [k, v.name])),
    );
    this.el = h(
      'div',
      { class: 'screen dim solid' },
      h('div', { class: 'topbar' }, h('button', { class: 'btn icon', title: 'Đóng', onclick: () => this.close() }, '✕'), h('h2', {}, '📖 Sổ tay Biển Việt'), h('div', { class: 'spacer' }), this.progress),
      h('div', { class: 'journal' }, this.tabsEl, filters, this.grid),
    );
    root.appendChild(this.el);
    this.render();
    if (initial) {
      const sp = SPECIES_BY_ID.get(initial);
      if (sp) this.tab = sp.region;
      this.render();
      if (sp) this.detail(sp);
    }
  }

  close() {
    this.el.remove();
    this.root.querySelector('.detail')?.remove();
    this.onClose();
  }

  private render() {
    clear(this.tabsEl);
    const tabs: [Tab, string][] = [['all', 'Tất cả'], ...REGIONS.map((r) => [r.id, r.short] as [Tab, string])];
    for (const [id, name] of tabs) {
      const list = id === 'all' ? SPECIES : SPECIES.filter((s) => s.region === id);
      const n = list.filter((s) => Save.discovered(s.id)).length;
      this.tabsEl.appendChild(h('button', { class: `tab${this.tab === id ? ' on' : ''}`, onclick: () => ((this.tab = id), Sound.ui(), this.render()) }, `${name} · ${n}/${list.length}`));
    }
    const all = this.tab === 'all' ? SPECIES : SPECIES.filter((s) => s.region === this.tab);
    const found = all.filter((s) => Save.discovered(s.id)).length;
    clear(this.progress);
    const pct = Math.round((found / all.length) * 100);
    this.progress.append(h('span', { class: 'pill' }, `${found}/${all.length} loài · ${pct}%`), h('div', { class: 'bar', style: 'width:200px' }, h('i', { style: `width:${pct}%` })));
    const list = all.filter(
      (s) =>
        (!this.f.tier || String(s.tier) === this.f.tier) &&
        (!this.f.rarity || s.rarity === this.f.rarity) &&
        (!this.f.danger || s.danger === this.f.danger) &&
        (!this.f.iucn || s.iucn === this.f.iucn),
    );
    clear(this.grid);
    list.forEach((sp, i) => this.grid.appendChild(this.card(sp, i)));
    if (!list.length) this.grid.appendChild(h('div', { style: 'color:#a9c9d6;padding:20px' }, 'Không có loài nào khớp bộ lọc.'));
  }

  private card(sp: Species, i: number) {
    const known = Save.discovered(sp.id);
    const rec = Save.data.species[sp.id];
    const img = h('img', { src: artUrl(sp.id), alt: known ? sp.nameVi : 'Loài chưa ghi nhận', loading: 'lazy', decoding: 'async' });
    const open = () => {
      Sound.ui();
      if (known) this.detail(sp);
    };
    return h(
      'div',
      {
        class: `scard${known ? '' : ' unknown'}`,
        role: 'button',
        tabindex: 0,
        'aria-label': known ? sp.nameVi : 'Loài chưa ghi nhận',
        style: `animation-delay:${Math.min(i, 20) * 25}ms`,
        onclick: open,
        onkeydown: (e: Event) => (e as KeyboardEvent).key === 'Enter' && open(),
      },
      h('span', { class: 'rdot', style: `background:${RARITY_INFO[sp.rarity].color};box-shadow:0 0 8px ${RARITY_INFO[sp.rarity].color}` }),
      h('div', { class: 'thumb' }, img),
      known
        ? [h('div', { class: 'nm' }, sp.nameVi), h('div', { class: 'sci', style: 'font-size:16px' }, sp.nameSci), stars(rec?.bestStars ?? 0)]
        : [h('div', { class: 'nm' }, '???'), h('div', { class: 'hint' }, `${REGION_LABEL[sp.region]} · Tầng ${sp.tier}`), h('div', { class: 'hint' }, BEHAVIOR_HINT[sp.behavior])],
    );
  }

  private detail(sp: Species) {
    this.root.querySelector('.detail')?.remove();
    const rec = Save.data.species[sp.id];
    const iu = IUCN_INFO[sp.iucn];
    const iucnText = h('div', { class: 'box-warn', style: `display:none;border-color:${iu.color};background:rgba(255,255,255,0.06)` }, h('b', {}, iu.name + ': '), iu.text);
    const iucnBadge = h(
      'button',
      { class: 'badge', style: `color:${iu.color}`, title: 'Bấm để xem giải thích', onclick: () => (iucnText.style.display = iucnText.style.display === 'none' ? '' : 'none') },
      `IUCN: ${iu.name} ⓘ`,
    );
    const cons = ['VU', 'EN', 'CR'].includes(sp.iucn);
    const close = () => d.remove();
    const d: HTMLElement = h(
      'div',
      { class: 'detail', onclick: (e: Event) => e.target === d && close() },
      h(
        'div',
        { class: 'sheet glass' },
        h(
          'div',
          { class: 'left' },
          h('div', { class: 'bigart' }, h('img', { src: artUrl(sp.id), alt: sp.nameVi })),
          rec?.photo
            ? h('div', { class: 'best-photo' }, h('img', { src: rec.photo, alt: 'Ảnh đẹp nhất của bạn' }), h('div', {}, h('div', { style: 'font-weight:700' }, 'Ảnh đẹp nhất của bạn'), stars(rec.bestStars), h('div', { style: 'color:#a9c9d6' }, `Đã chụp ${rec.count} lần`)))
            : null,
          h('div', { class: 'size-cmp', html: sizeCompare(sp) }),
        ),
        h(
          'div',
          { class: 'right scroll' },
          h('div', { style: 'display:flex;gap:10px;align-items:flex-start' }, h('div', { style: 'flex:1' }, h('h2', {}, sp.nameVi), h('div', { class: 'sci', style: 'font-size:18px' }, sp.nameSci), h('div', { style: 'color:#a9c9d6' }, sp.nameEn)), h('button', { class: 'btn icon', title: 'Đóng', onclick: close }, '✕')),
          h('div', { class: 'badges', style: 'justify-content:flex-start' }, rarityBadge(sp), dangerBadge(sp), iucnBadge),
          iucnText,
          h(
            'div',
            { class: 'facts' },
            'Kích thước tối đa',
            h('b', {}, sp.sizeCm >= 100 ? `${(sp.sizeCm / 100).toLocaleString('vi-VN')} m` : `${sp.sizeCm} cm`),
            'Vùng biển',
            h('b', {}, REGION_LABEL[sp.region]),
            'Tầng độ sâu',
            h('b', {}, `${TIER_INFO[sp.tier].name} (${TIER_INFO[sp.tier].range})`),
          ),
          h('div', {}, h('h4', {}, 'Mô tả'), h('p', {}, sp.description)),
          h('div', {}, h('h4', {}, '💡 Bạn có biết?'), h('p', {}, sp.funFact)),
          sp.dangerNote ? h('div', { class: 'box-warn' }, h('h4', { style: 'color:#ff8f8f' }, '⚠ Vì sao nguy hiểm?'), h('p', {}, sp.dangerNote)) : null,
          cons ? h('div', { class: 'box-cons' }, h('h4', {}, '🛡️ Thông điệp bảo tồn'), h('p', {}, sp.conservation ?? 'Loài đang bị đe dọa. Hãy nói không với sản phẩm từ loài này và bảo vệ nơi sống của chúng.')) : null,
          sp.needsVerification ? h('div', { class: 'verify' }, '✎ Một số thông tin của loài này đang được nhóm kiểm chứng thêm.') : null,
        ),
      ),
    );
    this.root.appendChild(d);
  }
}

/** Hình so sánh kích thước với người thợ lặn cao 1,7 m. */
function sizeCompare(sp: Species): string {
  const W = 460;
  const H = 96;
  const human = 170;
  const art = getArt(sp.id);
  const [vw, vh] = art.viewBox;
  const imgWcm = sp.sizeCm * (vw / art.lengthUnits);
  const imgHcm = (imgWcm * vh) / vw;
  const avail = H - 20;
  // một tỉ lệ chung cho cả người và sinh vật
  const k = Math.min((W - 150) / imgWcm, avail / human, avail / imgHcm);
  const ph = human * k;
  const pw = ph * 0.32;
  const px = 30;
  const py = H - 16;
  const dw = Math.max(5, imgWcm * k);
  const dh = Math.max(4, imgHcm * k);
  const humanSvg = `<g transform="translate(${px} ${py - ph}) scale(${pw / 32} ${ph / 100})" fill="#9fd8e6" fill-opacity="0.85">
    <circle cx="16" cy="9" r="8"/><path d="M6 20Q16 15 26 20L28 56L23 56L22 98L17 98L16 62L15 98L10 98L9 56L4 56Z"/></g>`;
  const note = sp.sizeCm > human ? `dài gấp ${(sp.sizeCm / human).toFixed(1).replace('.', ',')} lần chiều cao người` : sp.sizeCm < 20 ? 'nhỏ cỡ bàn tay' : `bằng ${Math.round((sp.sizeCm / human) * 100)}% chiều cao người`;
  const ix = px + pw + 40;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Be Vietnam Pro, sans-serif">
  <line x1="0" y1="${py}" x2="${W}" y2="${py}" stroke="#a9c9d6" stroke-opacity="0.4"/>
  ${humanSvg}
  <text x="${px + pw / 2}" y="${H - 2}" font-size="13" fill="#a9c9d6" text-anchor="middle">Người 1,7 m</text>
  <image href="${artUrl(sp.id)}" x="${ix}" y="${py - dh}" width="${dw}" height="${dh}" preserveAspectRatio="none"/>
  <text x="${ix}" y="${H - 2}" font-size="13" fill="#a9c9d6">${note}</text>
</svg>`;
}

export { REGIONS };
