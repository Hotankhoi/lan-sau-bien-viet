/** HUD khi lặn: oxy, độ sâu, áp suất, điểm, minimap, khung ngắm, cảnh báo, kết quả ảnh. */
import { bus, type HudState, type PhotoResult } from '../game/bus';
import { Input } from '../game/input';
import { SPECIES_BY_ID, RARITY_INFO, DANGER_INFO, REDBOOK_COLOR, CONSERVATION_FALLBACK, isProtected, type Species } from '../data/types';
import { Save } from '../systems/Save';
import { h, artUrl, stars, fmt } from './dom';
import { touchLayer } from './controls';
import type { AchievementDef } from '../systems/Achievement';

const REAL_LIFE = 'Ngoài đời thật: tuyệt đối không chạm vào. Nếu bị chích/đốt, lên bờ ngay, báo người lớn và gọi cấp cứu 115.';

export function toast(root: HTMLElement, text: string, kind = 'info') {
  let box = root.querySelector('.toasts') as HTMLElement | null;
  if (!box) {
    box = h('div', { class: 'toasts' });
    root.appendChild(box);
  }
  const t = h('div', { class: `toast ${kind}` }, text);
  box.appendChild(t);
  while (box.children.length > 4) box.firstChild!.remove();
  setTimeout(() => t.remove(), 3600);
}

export function rarityBadge(sp: Species) {
  const r = RARITY_INFO[sp.rarity];
  return h('span', { class: `badge r-${sp.rarity}`, style: `color:${r.color}` }, r.name);
}
/** Biểu tượng cuốn sách (đỏ son) cho huy hiệu Sách Đỏ Việt Nam */
export const BOOK_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 4.5C4 3.7 4.7 3 5.5 3H19v15H6a2 2 0 0 0-2 2z" fill="currentColor"/><path d="M4 20a2 2 0 0 0 2 2h13v-4H6a2 2 0 0 0-2 2z" fill="currentColor" opacity=".55"/><path d="M8 7h8M8 10h6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>';
/** Huy hiệu Sách Đỏ Việt Nam; onClick (nếu có) để hiện giải thích */
export function redBookBadge(onClick?: () => void) {
  const attrs = { class: 'badge redbook', style: `color:${REDBOOK_COLOR}`, title: onClick ? 'Bấm để xem Sách Đỏ Việt Nam là gì' : 'Sách Đỏ Việt Nam', onclick: onClick };
  const b = onClick ? h('button', attrs) : h('span', attrs);
  b.innerHTML = BOOK_ICON + `<span>Sách Đỏ Việt Nam${onClick ? ' ⓘ' : ''}</span>`;
  return b;
}
export function dangerBadge(sp: Species) {
  const d = DANGER_INFO[sp.danger];
  return h('span', { class: 'badge', style: `color:${d.color}` }, (sp.danger === 'an_toan' ? '✓ ' : '⚠ ') + d.name);
}

export class Hud {
  el: HTMLElement;
  private o2: HTMLElement;
  private o2Bar: HTMLElement;
  private o2Txt: HTMLElement;
  private depthM: HTMLElement;
  private atm: HTMLElement;
  private green: HTMLElement;
  private research: HTMLElement;
  private newc: HTMLElement;
  private vf: HTMLElement;
  private vfLabel: HTMLElement;
  private vfFocus: HTMLElement;
  private markers: HTMLElement;
  private surf: HTMLElement;
  private flash: HTMLElement;
  private mini: HTMLCanvasElement;
  private lampBtn: HTMLElement;
  private scanBtn: HTMLElement;
  private scanCd: HTMLElement;
  private tut: HTMLElement | null = null;
  private popT: number | undefined;
  private offs: (() => void)[] = [];
  private queue: (() => void)[] = [];
  private modalOpen = false;

  constructor(
    private root: HTMLElement,
    private openJournal: (id?: string) => void,
  ) {
    this.o2Bar = h('i');
    this.o2Txt = h('span', {}, '100%');
    this.o2 = h('div', { class: 'o2' }, h('span', {}, 'O₂'), h('div', { class: 'o2-bar' }, this.o2Bar), this.o2Txt);
    this.green = h('span', { class: 'pill', title: 'Điểm Xanh' }, '♻️ 0');
    this.research = h('span', { class: 'pill', title: 'Điểm Nghiên cứu lượt này' }, '🔬 0');
    this.newc = h('span', { class: 'pill', title: 'Loài mới trong lượt' }, '🆕 0');
    this.depthM = h('div', { class: 'm' }, '0');
    this.atm = h('div', { class: 'atm' }, '1.0 atm');
    this.mini = h('canvas', { width: 420, height: 184 });
    this.vfLabel = h('div', { class: 'vf-label' });
    this.vfFocus = h('i');
    this.vf = h('div', { class: 'viewfinder', style: 'opacity:0' }, this.vfLabel, h('div', { class: 'vf-focus' }, this.vfFocus));
    this.markers = h('div', { class: 'passthru' });
    this.surf = h('div', { class: 'surfacing glass', style: 'display:none' });
    this.flash = h('div', { class: 'flash' });
    this.lampBtn = h('button', { class: 'tool', title: 'Đèn lặn (F)', onclick: () => (Input.lampToggle = true) }, '🔦', h('span', { class: 'key' }, 'F'));
    this.scanCd = h('div', { class: 'cd', style: 'transform:scaleY(0)' });
    this.scanBtn = h('button', { class: 'tool', title: 'Quét sinh học (E)', onclick: () => (Input.scan = true) }, '📡', this.scanCd, h('span', { class: 'key' }, 'E'));
    const tools = h(
      'div',
      { class: 'hud-tools' },
      this.lampBtn,
      this.scanBtn,
      h('button', { class: 'tool', title: 'Sổ tay (Tab)', onclick: () => this.openJournal() }, '📖', h('span', { class: 'key' }, 'Tab')),
    );
    this.el = h(
      'div',
      { class: 'hud' },
      this.markers,
      this.vf,
      h('div', { class: 'hud-tl glass' }, this.o2, h('div', { class: 'hud-stats' }, this.green, this.research, this.newc)),
      h('div', { class: 'hud-tr' }, h('div', { class: 'minimap glass' }, this.mini), h('div', { class: 'depth glass' }, this.depthM, this.atm)),
      tools,
      this.surf,
      this.flash,
    );
    const touch = touchLayer(() => this.openJournal());
    if (touch) {
      this.el.appendChild(touch);
      this.el.classList.add('has-touch');
    }
    root.appendChild(this.el);

    const on = <T>(ev: string, fn: (a: T) => void) => {
      bus.on(ev, fn);
      this.offs.push(() => bus.off(ev, fn));
    };
    on<HudState>('hud', (s) => this.update(s));
    on('flash', () => {
      this.flash.classList.remove('go');
      void this.flash.offsetWidth;
      this.flash.classList.add('go');
    });
    on<PhotoResult>('photo', (r) => this.photo(r));
    on<{ text: string; kind: string }>('toast', (t) => toast(this.root, t.text, t.kind));
    on<{ id: string; loss: number }>('danger', (d) => this.enqueue(() => this.danger(d.id, d.loss)));
    on<{ step: number; total: number; text: string } | null>('tutorial', (t) => this.tutorial(t));
    on<AchievementDef>('achievement', (a) => toast(this.root, `${a.icon} Thành tựu mới: ${a.name}`, 'ach'));
  }

  destroy() {
    this.offs.forEach((f) => f());
    this.el.remove();
    this.tut?.remove();
    this.root.querySelectorAll('.discover, .modal.warn').forEach((n) => n.remove());
    clearTimeout(this.popT);
  }

  private enqueue(fn: () => void) {
    if (this.modalOpen) this.queue.push(fn);
    else fn();
  }
  private closeModal() {
    this.modalOpen = false;
    Input.paused = false;
    const next = this.queue.shift();
    if (next) next();
  }

  private update(s: HudState) {
    const pct = Math.max(0, s.oxygen) * 100;
    this.o2Bar.style.width = `${pct}%`;
    this.o2Txt.textContent = `${Math.ceil(pct)}%`;
    this.o2.classList.toggle('low', s.oxygen < 0.25);
    this.depthM.innerHTML = `${s.depth.toFixed(0)}<small> m</small>`;
    this.atm.textContent = `Áp suất ${s.pressure.toFixed(1)} atm`;
    this.green.textContent = `♻️ ${fmt(s.green)}`;
    this.research.textContent = `🔬 +${fmt(s.research)}`;
    this.newc.textContent = `🆕 ${s.newCount} loài mới`;
    this.lampBtn.classList.toggle('on', s.lamp);
    this.scanBtn.classList.toggle('locked', !s.hasScanner);
    this.scanCd.style.transform = `scaleY(${s.hasScanner ? 1 - s.scanReady : 0})`;
    if (s.frame) {
      const f = s.frame;
      this.vf.style.cssText = `opacity:1;left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px`;
      this.vfLabel.textContent = f.label;
      this.vfFocus.style.width = `${f.focus * 100}%`;
    } else this.vf.style.opacity = '0';
    // markers
    const ms = this.markers;
    while (ms.children.length < s.markers.length) ms.appendChild(h('div', { class: 'marker' }));
    while (ms.children.length > s.markers.length) ms.lastChild!.remove();
    s.markers.forEach((m, i) => {
      const el = ms.children[i] as HTMLElement;
      el.className = `marker ${m.kind}${m.label && m.label !== 'Cẩn thận' ? ' d' : ''}`;
      el.style.left = `${m.x}px`;
      el.style.top = `${m.y}px`;
      el.textContent = m.kind === 'warn' ? `⚠ ${m.label ?? ''}` : '';
    });
    if (s.surfacing > 0.02) {
      this.surf.style.display = '';
      this.surf.textContent = `⬆️ Đang nổi lên… ${Math.round(s.surfacing * 100)}%`;
    } else this.surf.style.display = 'none';
    this.drawMini(s);
  }

  private drawMini(s: HudState) {
    const c = this.mini;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = c.width;
    const H = c.height;
    const mm = s.minimap;
    const sx = W / mm.W;
    const sy = H / (mm.H + 100);
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(63,193,217,0.35)');
    g.addColorStop(1, 'rgba(6,40,70,0.5)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    ctx.moveTo(0, H);
    mm.ground.forEach((y, i) => ctx.lineTo((i / (mm.ground.length - 1)) * W, y * sy));
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = 'rgba(236,226,194,0.75)';
    ctx.fill();
    for (const d of mm.dots) {
      ctx.fillStyle = d.c;
      ctx.fillRect(d.x * sx - 3, d.y * sy - 3, 6, 6);
    }
    ctx.fillStyle = '#ffc75f';
    ctx.strokeStyle = '#03263a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(mm.diverX * sx, mm.diverY * sy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  private photo(r: PhotoResult) {
    const old = this.root.querySelector('.photo-pop');
    old?.remove();
    clearTimeout(this.popT);
    const sp = r.speciesId ? SPECIES_BY_ID.get(r.speciesId) : null;
    const pop = h(
      'div',
      { class: 'photo-pop glass' },
      r.photo ? h('img', { src: r.photo, alt: 'Ảnh vừa chụp' }) : null,
      sp
        ? [h('div', { class: 'pp-name' }, sp.nameVi), h('div', {}, stars(r.stars), ' ', h('b', {}, `+${r.points} điểm`), r.isNew ? h('span', { class: 'pill', style: 'margin-left:8px;color:#4FE3D3' }, 'MỚI') : null)]
        : h('div', { class: 'pp-name', style: 'font-size:17px' }, r.reason ?? 'Không có sinh vật nào trong khung'),
    );
    this.el.appendChild(pop);
    this.popT = window.setTimeout(() => pop.remove(), 3200);
    if (sp && r.isNew) {
      const delay = sp.rarity === 'huyen_thoai' ? 1700 : 500;
      setTimeout(() => this.enqueue(() => (isProtected(sp) ? this.discoverProtected(sp, r.photo) : this.discover(sp))), delay);
    }
  }

  private discover(sp: Species) {
    this.modalOpen = true;
    Input.paused = true;
    Input.aim = false;
    const legend = sp.rarity === 'huyen_thoai';
    const close = () => {
      wrap.remove();
      this.closeModal();
    };
    const wrap = h(
      'div',
      { class: `discover${legend ? ' legend' : ''}` },
      h(
        'div',
        { class: 'card3d' },
        h(
          'div',
          { class: 'dcard glass shine' },
          h('div', { class: 'new-tag' }, legend ? '★ LOÀI HUYỀN THOẠI ★' : 'GHI NHẬN LOÀI MỚI'),
          h('div', { class: 'art' }, h('img', { src: artUrl(sp.id), alt: sp.nameVi })),
          h('h3', {}, sp.nameVi),
          h('div', { class: 'sci' }, sp.nameSci),
          h('div', { class: 'badges', style: 'margin:10px 0' }, rarityBadge(sp), dangerBadge(sp)),
          h('p', { style: 'margin:0 0 14px;color:#cfe9f2' }, sp.funFact),
          h(
            'div',
            { style: 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap' },
            h('button', { class: 'btn primary', onclick: close }, 'Tiếp tục lặn'),
            h('button', {
              class: 'btn',
              onclick: () => {
                close();
                this.openJournal(sp.id);
              },
            }, '📖 Xem trong Sổ tay'),
          ),
        ),
      ),
    );
    this.root.appendChild(wrap);
  }

  /** Thẻ đặc biệt viền đỏ son khi ghi nhận lần đầu một loài "Cần bảo vệ". */
  private discoverProtected(sp: Species, photo?: string | null) {
    this.modalOpen = true;
    Input.paused = true;
    Input.aim = false;
    const legend = sp.rarity === 'huyen_thoai';
    const close = () => {
      wrap.remove();
      this.closeModal();
    };
    const wrap = h(
      'div',
      { class: `discover protect${legend ? ' legend' : ''}` },
      h(
        'div',
        { class: 'card3d' },
        h(
          'div',
          { class: 'dcard pcard glass' },
          h('div', { class: 'new-tag' }, 'LOÀI CẦN ĐƯỢC BẢO VỆ'),
          h('div', { class: 'p-photo' }, h('img', { src: photo || artUrl(sp.id), alt: photo ? `Ảnh bạn vừa chụp ${sp.nameVi}` : sp.nameVi })),
          h('h3', {}, sp.nameVi),
          h('div', { class: 'sci' }, sp.nameSci),
          h('div', { class: 'badges', style: 'margin:10px 0' }, rarityBadge(sp), sp.redBookVN ? redBookBadge() : null),
          h('div', { class: 'p-sec' }, h('h4', {}, '🌏 Vai trò trong hệ sinh thái'), h('p', {}, sp.ecoRole)),
          h('div', { class: 'p-sec cons' }, h('h4', {}, '🛡️ Thông điệp bảo tồn'), h('p', {}, sp.conservation ?? CONSERVATION_FALLBACK)),
          h('div', { class: 'p-actions' }, h('button', { class: 'btn primary pledge', onclick: close }, '🤝 Tôi sẽ bảo vệ loài này')),
        ),
      ),
    );
    this.root.appendChild(wrap);
  }

  private danger(id: string, loss: number) {
    const sp = SPECIES_BY_ID.get(id);
    if (!sp) return;
    this.modalOpen = true;
    Input.paused = true;
    Input.aim = false;
    const close = () => {
      m.remove();
      this.closeModal();
    };
    const m = h(
      'div',
      { class: 'modal warn' },
      h(
        'div',
        { class: 'panel glass warn-card' },
        h('h3', {}, `⚠ Bạn đã chạm vào ${sp.nameVi}!`),
        h('div', { style: 'margin:6px 0 10px;color:#ffb3b3;font-weight:700' }, `Mất ${Math.round(loss * 100)}% oxy · ${DANGER_INFO[sp.danger].name}`),
        h('p', { style: 'margin:0' }, h('b', {}, 'Vì sao nguy hiểm? '), sp.dangerNote ?? sp.description),
        h('div', { class: 'real-life' }, REAL_LIFE),
        h('div', { style: 'margin-top:16px;text-align:right' }, h('button', { class: 'btn primary', onclick: close }, 'Đã hiểu')),
      ),
    );
    this.root.appendChild(m);
  }

  private tutorial(t: { step: number; total: number; text: string } | null) {
    this.tut?.remove();
    this.tut = null;
    if (!t) return;
    this.tut = h(
      'div',
      { class: 'tutorial glass' },
      h('span', { class: 'step' }, `Hướng dẫn ${t.step + 1}/${t.total}`),
      h('span', {}, t.text),
      h('button', { class: 'btn ghost', style: 'min-height:40px;padding:6px 14px', onclick: () => bus.emit('tutorial:skip') }, 'Bỏ qua'),
    );
    this.root.appendChild(this.tut);
  }
}

export function speciesFound(): number {
  return Object.keys(Save.data.species).length;
}
