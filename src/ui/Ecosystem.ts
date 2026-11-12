/** Bảng tóm tắt một hệ sinh thái Biển Đông (mở từ nhãn hệ sinh thái trong Sổ tay). */
import { ECOSYSTEM_BY_ID, ECOSYSTEM_ICON, type EcosystemId } from '../data/types';
import { Sound } from '../systems/Audio';
import { h } from './dom';

/** Nhãn hệ sinh thái bấm được */
export function ecoChip(id: EcosystemId, onClick: () => void) {
  const e = ECOSYSTEM_BY_ID.get(id);
  return h('button', { class: `eco-chip eco-${id}`, title: 'Bấm để xem tóm tắt hệ sinh thái', onclick: () => (Sound.ui(), onClick()) }, `${ECOSYSTEM_ICON[id]} ${e?.name ?? id}`, h('span', { class: 'chev' }, '›'));
}

/** Mở bảng tóm tắt: summary + threats. `more` (nếu có) là nút phụ, ví dụ mở màn "Biển Đông cần chúng". */
export function ecoPopup(root: HTMLElement, id: EcosystemId, more?: { label: string; run: () => void }) {
  const e = ECOSYSTEM_BY_ID.get(id);
  if (!e) return;
  root.querySelector('.eco-pop')?.remove();
  const close = () => pop.remove();
  const pop: HTMLElement = h(
    'div',
    { class: 'eco-pop', role: 'dialog', 'aria-label': e.name, onclick: (ev: Event) => ev.target === pop && close() },
    h(
      'div',
      { class: `panel glass eco-panel eco-${id}` },
      h('div', { class: 'eco-head' }, h('span', { class: 'eco-ico' }, ECOSYSTEM_ICON[id]), h('h3', {}, e.name), h('button', { class: 'btn icon', title: 'Đóng', onclick: close }, '✕')),
      h('h4', {}, 'Tóm tắt'),
      h('p', {}, e.summary),
      h('div', { class: 'eco-threat' }, h('h4', {}, '⚠ Mối đe dọa'), h('p', {}, e.threats)),
      more ? h('div', { style: 'text-align:right;margin-top:14px' }, h('button', { class: 'btn', onclick: () => (close(), more.run()) }, more.label)) : null,
    ),
  );
  root.appendChild(pop);
}
