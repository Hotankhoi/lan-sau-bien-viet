/** Màn "Biển Đông cần chúng": 4 hệ sinh thái, mỗi hệ có tóm tắt, mối đe dọa và lưới các loài thuộc hệ. */
import { SPECIES, ECOSYSTEMS, ECOSYSTEM_ICON, REDBOOK_COLOR, type EcosystemId, type Species } from '../data/types';
import { Save } from '../systems/Save';
import { Sound } from '../systems/Audio';
import { h, thumbSvgUrl, thumbUrl } from './dom';
import { BOOK_ICON } from './Hud';

export const CHAIN_QUOTE = 'Mỗi loài là một mắt xích. Mất một mắt xích, cả chuỗi sẽ lung lay.';

export class SeaNeeds {
  el: HTMLElement;

  constructor(
    root: HTMLElement,
    private onOpenSpecies: (sp: Species) => void,
    focus?: EcosystemId,
  ) {
    const cards = ECOSYSTEMS.map((e) => {
      const list = SPECIES.filter((s) => s.ecosystem === e.id);
      const found = list.filter((s) => Save.discovered(s.id)).length;
      return h(
        'section',
        { class: `eco-card glass eco-${e.id}`, id: `eco-${e.id}` },
        h(
          'div',
          { class: 'ec-head' },
          h('span', { class: 'eco-ico' }, ECOSYSTEM_ICON[e.id]),
          h('h3', {}, e.name),
          h('span', { class: 'pill' }, `Đã gặp ${found}/${list.length} loài`),
        ),
        h('p', { class: 'ec-sum' }, e.summary),
        h('div', { class: 'eco-threat' }, h('h4', {}, '⚠ Mối đe dọa'), h('p', {}, e.threats)),
        h('div', { class: 'ec-grid' }, list.map((s) => this.tile(s))),
      );
    });
    this.el = h(
      'div',
      { class: 'screen dim solid seaneeds' },
      h('div', { class: 'topbar' }, h('button', { class: 'btn icon', title: 'Đóng', onclick: () => this.close() }, '✕'), h('h2', {}, '🌏 Biển Đông cần chúng')),
      h(
        'div',
        { class: 'sn-body scroll' },
        h('p', { class: 'sn-intro' }, 'Bốn hệ sinh thái của Biển Đông nối với nhau thành một mạng sống. Mỗi thẻ cho biết vì sao hệ đó quan trọng, điều gì đang đe dọa nó và những loài bạn đã gặp ở đó.'),
        h(
          'div',
          { class: 'sn-legend' },
          h('span', {}, h('i', { class: 'lg-red' }), 'Có tên trong Sách Đỏ Việt Nam'),
          h('span', {}, h('i', { class: 'lg-unk' }), 'Loài chưa gặp (bóng đen)'),
        ),
        h('div', { class: 'sn-cards' }, cards),
        h('blockquote', { class: 'sn-quote' }, CHAIN_QUOTE),
      ),
    );
    root.appendChild(this.el);
    if (focus) requestAnimationFrame(() => this.el.querySelector(`#eco-${focus}`)?.scrollIntoView({ block: 'start' }));
  }

  private tile(sp: Species) {
    const known = Save.discovered(sp.id);
    // ảnh nhỏ vẽ sẵn (public/thumbs); thiếu file thì dựng tạm từ hình vẽ SVG
    const img = h('img', { alt: '', decoding: 'async', loading: 'lazy', src: thumbUrl(sp.id) });
    img.addEventListener('error', () => (img.src = thumbSvgUrl(sp.id)), { once: true });
    const open = () => {
      Sound.ui();
      if (known) this.onOpenSpecies(sp);
    };
    return h(
      'div',
      {
        class: `ec-tile${known ? '' : ' unknown'}${sp.redBookVN ? ' redbook' : ''}`,
        role: known ? 'button' : 'img',
        tabindex: known ? 0 : -1,
        title: known ? sp.nameVi : 'Loài chưa gặp',
        'aria-label': known ? sp.nameVi : 'Loài chưa gặp',
        onclick: open,
        onkeydown: (e: Event) => (e as KeyboardEvent).key === 'Enter' && open(),
      },
      sp.redBookVN ? h('span', { class: 'rb-mark', style: `color:${REDBOOK_COLOR}`, html: BOOK_ICON }) : null,
      h('div', { class: 'et-img' }, img),
      h('div', { class: 'et-name' }, known ? sp.nameVi : '???'),
    );
  }

  close() {
    this.el.remove();
  }
}
