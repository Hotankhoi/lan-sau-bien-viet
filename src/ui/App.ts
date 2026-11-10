/** Điều phối các màn hình giao diện (DOM) trên nền cảnh Phaser. */
import credits from '../data/credits.json';
import { REGIONS, REGION_BY_ID, SPECIES, SPECIES_BY_ID, TIER_INFO, type RegionId, type Tier } from '../data/types';
import { UPGRADES } from '../config';
import { Save } from '../systems/Save';
import { Sound } from '../systems/Audio';
import { ACHIEVEMENTS, checkAchievements } from '../systems/Achievement';
import { regionFound, regionLock, tierLock, totalFound } from '../systems/Progress';
import { bus, type DiveSummary } from '../game/bus';
import { Flow } from '../game/flow';
import { Input } from '../game/input';
import { h, clear, stars, fmt } from './dom';
import { Hud, toast } from './Hud';
import { Journal } from './Journal';
import { installControls, resetControls } from './controls';
import { vnMapSvg, SPOTS, MAP_W, MAP_H } from './vnmap';

type Screen = 'title' | 'map' | 'dive' | 'summary' | 'upgrades' | 'achievements' | 'credits' | 'settings';

const TIPS = [
  'Nước hấp thụ ánh sáng đỏ trước tiên – xuống sâu, mọi thứ ngả xanh lam.',
  'Cứ xuống sâu thêm 10 m, áp suất nước tăng thêm khoảng 1 atm.',
  'Bơi chậm và nhẹ nhàng: sinh vật sẽ không hoảng sợ bỏ chạy.',
  'Đừng chạm vào san hô – nhiều rạn cần hàng chục năm để phục hồi.',
  'Rác nhựa có thể tồn tại hàng trăm năm dưới biển. Hãy nhặt khi thấy!',
];

export class App {
  private root: HTMLElement;
  private screen: Screen = 'title';
  private view: HTMLElement | null = null;
  private hud: Hud | null = null;
  private journal: Journal | null = null;
  private pauseEl: HTMLElement | null = null;
  private loadingEl: HTMLElement | null = null;
  private selRegion: RegionId = 'mien_trung';

  constructor(root: HTMLElement) {
    this.root = root;
    installControls((k) => this.hotkey(k));
    bus.on('loading', (p: number) => this.loading(p));
    bus.on('dive:end', (s: DiveSummary) => this.summary(s));
    bus.on('error', (e: string) => toast(this.root, `Lỗi: ${e}`, 'bad'));
    bus.on('achievement', (a: { icon: string; name: string }) => {
      if (this.screen !== 'dive') toast(this.root, `${a.icon} Thành tựu mới: ${a.name}`, 'ach');
    });
    if (!Save.available) setTimeout(() => toast(this.root, 'Trình duyệt đang chặn lưu dữ liệu – game vẫn chơi được nhưng tiến trình sẽ không được lưu.', 'info'), 1500);
    checkAchievements();
  }

  // ---------- tiện ích ----------
  private set(screen: Screen, el: HTMLElement | null) {
    this.view?.remove();
    this.view = el;
    this.screen = screen;
    if (el) this.root.appendChild(el);
  }

  private topbar(title: string, back: () => void, ...extra: (HTMLElement | null)[]) {
    return h(
      'div',
      { class: 'topbar' },
      h('button', { class: 'btn icon', title: 'Quay lại', onclick: () => (Sound.ui(), back()) }, '←'),
      h('h2', {}, title),
      h('div', { class: 'spacer' }),
      ...extra,
    );
  }

  private points() {
    return h('span', { class: 'pill', title: 'Điểm Nghiên cứu' }, `🔬 ${fmt(Save.data.research)} điểm`);
  }

  private loading(p: number) {
    if (p >= 1) {
      const el = this.loadingEl;
      this.loadingEl = null;
      if (el) {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 600);
      }
      return;
    }
    if (!this.loadingEl) {
      this.loadingEl = h(
        'div',
        { class: 'loading' },
        h('div', { style: 'font-size:28px;font-weight:800' }, Flow.params?.mode === 'dive' ? 'Đang lặn xuống…' : 'LẶN SÂU'),
        h('div', { class: 'bar' }, h('i', { style: 'width:5%' })),
        h('div', { class: 'tip' }, '💡 ' + TIPS[Math.floor(Math.random() * TIPS.length)]),
      );
      this.root.appendChild(this.loadingEl);
    }
    (this.loadingEl.querySelector('.bar i') as HTMLElement).style.width = `${Math.round(p * 100)}%`;
  }

  private hotkey(k: 'journal' | 'pause') {
    if (k === 'journal') {
      if (this.journal) this.journal.close();
      else if (this.screen === 'dive' || this.screen === 'title' || this.screen === 'map') this.openJournal();
      return;
    }
    if (this.journal) {
      this.journal.close();
      return;
    }
    if (this.screen === 'dive') this.togglePause();
  }

  openJournal(id?: string) {
    if (this.journal) return;
    const wasPaused = Input.paused;
    Input.paused = true;
    resetControls();
    this.journal = new Journal(
      this.root,
      () => {
        this.journal = null;
        if (this.screen === 'dive' && !this.pauseEl && !wasPaused) Input.paused = false;
        if (this.screen === 'title') this.title();
      },
      id,
    );
  }

  private togglePause() {
    if (this.pauseEl) {
      this.pauseEl.remove();
      this.pauseEl = null;
      Input.paused = false;
      return;
    }
    Input.paused = true;
    resetControls();
    const resume = () => this.togglePause();
    this.pauseEl = h(
      'div',
      { class: 'modal' },
      h(
        'div',
        { class: 'panel glass pause-menu' },
        h('h2', { style: 'margin:0 0 6px' }, 'Tạm dừng'),
        h('button', { class: 'btn primary', onclick: resume }, 'Tiếp tục lặn'),
        h('button', { class: 'btn', onclick: () => this.openJournal() }, '📖 Sổ tay'),
        h('button', {
          class: 'btn',
          onclick: () => {
            resume();
            Input.surfaceHold = false;
            const sc = Flow.params;
            if (sc) bus.emit('force:surface');
          },
        }, '⬆️ Nổi lên ngay'),
        h('div', { style: 'color:#a9c9d6;margin-top:6px' }, 'WASD: bơi · Shift: tăng tốc · Space/chuột phải: ngắm · Thả Space/click: chụp · F: đèn · E: quét · Q (giữ): nổi lên · Tab: Sổ tay'),
      ),
    );
    this.root.appendChild(this.pauseEl);
  }

  // ---------- Màn hình tiêu đề ----------
  title() {
    this.hud?.destroy();
    this.hud = null;
    if (Flow.params?.mode !== 'title') Flow.title(this.selRegion);
    const n = totalFound();
    const el = h(
      'div',
      { class: 'screen' },
      h(
        'div',
        { class: 'title-wrap' },
        h('div', { class: 'logo' }, h('div', { class: 'kicker' }, 'Game giáo dục'), h('h1', {}, 'LẶN SÂU'), h('div', { class: 'sub' }, 'SỔ TAY BIỂN VIỆT')),
        h(
          'div',
          { class: 'menu' },
          h('button', { class: 'btn primary', onclick: () => (Sound.unlock(), Sound.ui(), this.map()) }, '🤿 Lặn ngay'),
          h('button', { class: 'btn', onclick: () => (Sound.unlock(), this.openJournal()) }, '📖 Sổ tay'),
          h('button', { class: 'btn', onclick: () => (Sound.unlock(), this.upgrades()) }, '🛠️ Nâng cấp'),
          h('button', { class: 'btn', onclick: () => (Sound.unlock(), this.achievements()) }, '🏆 Thành tựu'),
          h('button', { class: 'btn', onclick: () => (Sound.unlock(), this.settings()) }, '⚙️ Cài đặt'),
          h('button', { class: 'btn ghost', style: 'grid-column:1/-1', onclick: () => (Sound.unlock(), this.credits()) }, '📚 Nguồn dữ liệu & Kê khai AI'),
        ),
        h('div', { class: 'title-foot' }, h('span', { class: 'pill' }, `📖 ${n}/${SPECIES.length} loài đã ghi nhận`), h('span', { class: 'pill' }, `🔬 ${fmt(Save.data.research)} điểm`), h('span', { class: 'pill' }, `♻️ ${fmt(Save.data.green)} Điểm Xanh`)),
      ),
    );
    this.set('title', el);
  }

  // ---------- Bản đồ ----------
  map() {
    const side = h('div', { class: 'map-side glass scroll' });
    const box = h('div', { class: 'map-box glass', html: vnMapSvg() });
    const svg = box.querySelector('svg')!;
    const NS = 'http://www.w3.org/2000/svg';
    const spots: Record<string, SVGGElement> = {};
    for (const r of REGIONS) {
      const [x, y] = SPOTS[r.id];
      const locked = !!regionLock(r.id);
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'spot');
      g.setAttribute('transform', `translate(${x} ${y})`);
      const col = locked ? '#9aa7b2' : '#4FE3D3';
      const { found, total } = regionFound(r.id);
      g.innerHTML = `<circle class="halo" r="26" fill="${col}" fill-opacity="0.35"/><circle class="core" r="15" fill="${col}" stroke="#03263a" stroke-width="3"/>
        <text y="6" text-anchor="middle" font-size="16">${locked ? '🔒' : '🤿'}</text>
        <g transform="translate(0 ${r.id === 'mien_nam' ? 42 : -34})"><rect x="-74" y="-16" width="148" height="26" rx="13" fill="#04182b" fill-opacity="0.82" stroke="${col}" stroke-opacity="0.7"/>
        <text y="3" text-anchor="middle" font-family="Be Vietnam Pro, sans-serif" font-weight="700" font-size="14" fill="#eafcff">${r.short} · ${found}/${total}</text></g>`;
      g.addEventListener('click', () => {
        Sound.ui();
        this.selRegion = r.id;
        renderSide();
      });
      g.addEventListener('mouseenter', () => {
        this.selRegion = r.id;
        renderSide();
      });
      svg.appendChild(g);
      spots[r.id] = g;
    }
    svg.setAttribute('viewBox', `0 0 ${MAP_W} ${MAP_H}`);
    const renderSide = () => {
      Object.entries(spots).forEach(([id, g]) => g.classList.toggle('sel', id === this.selRegion));
      const r = REGION_BY_ID.get(this.selRegion)!;
      const lock = regionLock(r.id);
      const { found, total } = regionFound(r.id);
      clear(side);
      side.append(...([
        h('h3', { class: 'region-title' }, r.name),
        h('div', { class: 'mood' }, r.mood),
        h('p', { style: 'margin:0;color:#cfe9f2' }, r.blurb),
        h('div', { class: 'progress-row' }, h('span', {}, `Đã ghi nhận ${found}/${total} loài`), h('div', { class: 'bar' }, h('i', { style: `width:${(found / total) * 100}%` }))),
        lock ? h('div', { class: 'box-warn' }, '🔒 ', lock) : null,
        h(
          'div',
          { class: 'tier-btns' },
          r.tiers.map((t: Tier) => {
            const tl = tierLock(r.id, t);
            const n = SPECIES.filter((s) => s.region === r.id && s.tier === t);
            const f = n.filter((s) => Save.discovered(s.id)).length;
            return h(
              'button',
              { class: 'tier-btn', disabled: !!tl, onclick: () => (Sound.ui(), this.dive(r.id, t)) },
              h('div', {}, h('div', { class: 'tb-name' }, `${TIER_INFO[t].name}`), h('div', { class: 'tb-sub' }, tl ? `🔒 ${tl}` : `${TIER_INFO[t].range} · ${f}/${n.length} loài${t === 3 ? ' · Tàu lặn “Hải Âu”' : ''}`)),
              h('span', { class: 'tb-go' }, tl ? '🔒' : '▶'),
            );
          }),
        ),
      ].filter(Boolean) as HTMLElement[]));
    };
    renderSide();
    const el = h('div', { class: 'screen dim' }, this.topbar('🗺️ Bản đồ biển Việt Nam', () => this.title(), this.points()), h('div', { class: 'map-layout' }, box, side));
    this.set('map', el);
  }

  dive(region: RegionId, tier: Tier) {
    this.set('dive', null);
    resetControls();
    this.hud?.destroy();
    this.hud = new Hud(this.root, (id) => this.openJournal(id));
    Flow.dive(region, tier);
  }

  // ---------- Tổng kết ----------
  private summary(s: DiveSummary) {
    this.hud?.destroy();
    this.hud = null;
    Input.paused = false;
    resetControls();
    Flow.title(s.region as RegionId);
    const reason = s.reason === 'oxygen' ? 'Hết oxy – bạn đã tự động nổi lên an toàn. Các ảnh đã chụp vẫn được giữ lại.' : 'Bạn đã nổi lên an toàn.';
    const best = new Map<string, (typeof s.photos)[number]>();
    for (const p of s.photos) if (p.speciesId && (!best.has(p.speciesId) || best.get(p.speciesId)!.quality < p.quality)) best.set(p.speciesId, p);
    const el = h(
      'div',
      { class: 'screen dim' },
      h(
        'div',
        { class: 'summary glass scroll' },
        h('h2', { style: 'margin:0;font-size:30px' }, '🌊 Tổng kết lượt lặn'),
        h('div', { style: 'color:#a9c9d6' }, `${REGION_BY_ID.get(s.region as RegionId)?.name} · ${TIER_INFO[s.tier as Tier].name} · ${Math.floor(s.seconds / 60)} phút ${s.seconds % 60} giây. ${reason}`),
        h(
          'div',
          { class: 'sum-stats' },
          [
            [String(s.newSpecies.length), 'Loài mới'],
            [`+${fmt(s.research)}`, 'Điểm Nghiên cứu'],
            [`${s.green >= 0 ? '+' : ''}${s.green}`, 'Điểm Xanh'],
            [String(s.trash), 'Rác đã nhặt'],
          ].map(([v, k]) => h('div', { class: 'stat' }, h('div', { class: 'v' }, v), h('div', { class: 'k' }, k))),
        ),
        s.coralHits ? h('div', { class: 'box-warn' }, `🪸 Bạn đã va vào san hô ${s.coralHits} lần. San hô cần hàng chục năm để phục hồi – lần sau hãy bơi cẩn thận hơn nhé!`) : h('div', { class: 'science' }, '🪸 Tuyệt vời! Bạn không va vào san hô lần nào.'),
        best.size
          ? h(
              'div',
              { class: 'photos' },
              [...best.values()].map((p) => {
                const sp = SPECIES_BY_ID.get(p.speciesId!)!;
                return h('figure', {}, p.photo ? h('img', { src: p.photo, alt: sp.nameVi }) : null, p.isNew ? h('span', { class: 'newtag' }, 'MỚI') : null, h('figcaption', {}, sp.nameVi, ' ', stars(p.stars)));
              }),
            )
          : h('div', { style: 'color:#a9c9d6' }, 'Lượt này bạn chưa chụp được sinh vật nào. Hãy giữ Space để ngắm và đưa sinh vật vào giữa khung nhé!'),
        h(
          'div',
          { style: 'display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end' },
          h('button', { class: 'btn', onclick: () => this.openJournal(s.newSpecies[0]) }, '📖 Sổ tay'),
          h('button', { class: 'btn', onclick: () => this.upgrades() }, '🛠️ Nâng cấp'),
          h('button', { class: 'btn', onclick: () => this.map() }, '🗺️ Bản đồ'),
          h('button', { class: 'btn primary', onclick: () => this.dive(s.region as RegionId, s.tier as Tier) }, '🤿 Lặn tiếp'),
        ),
      ),
    );
    this.set('summary', el);
  }

  // ---------- Nâng cấp ----------
  upgrades() {
    const grid = h('div', { class: 'cards scroll' });
    const pts = this.points();
    const render = () => {
      clear(grid);
      pts.textContent = `🔬 ${fmt(Save.data.research)} điểm`;
      for (const u of UPGRADES) {
        const lv = Save.level(u.id);
        const max = u.costs.length;
        const cost = u.costs[lv];
        const can = lv < max && Save.data.research >= cost;
        grid.appendChild(
          h(
            'div',
            { class: 'ucard glass' },
            h('div', { class: 'ic' }, u.icon),
            h('h3', {}, u.name),
            h('div', { class: 'lv' }, Array.from({ length: max }, (_, i) => h('i', { class: i < lv ? 'on' : '' }))),
            h('p', { style: 'margin:0;color:#cfe9f2' }, u.desc),
            u.science && lv > 0 ? h('div', { class: 'science' }, '🔬 ', u.science) : u.science ? h('div', { style: 'color:#a9c9d6' }, 'Mở khóa để đọc giải thích khoa học.') : null,
            h('div', { style: 'flex:1' }),
            lv >= max
              ? h('button', { class: 'btn', disabled: true }, '✓ Đã tối đa')
              : h(
                  'button',
                  {
                    class: `btn ${can ? 'gold' : ''}`,
                    disabled: !can,
                    onclick: () => {
                      Save.update((d) => {
                        d.research -= cost;
                        d.upgrades[u.id] = lv + 1;
                      });
                      Sound.discover(false);
                      toast(this.root, `${u.icon} Đã nâng cấp: ${u.name}`, 'good');
                      if (u.science) toast(this.root, '🔬 ' + u.science, 'info');
                      render();
                    },
                  },
                  `Nâng cấp · ${fmt(cost)} điểm`,
                ),
          ),
        );
      }
    };
    render();
    this.set('upgrades', h('div', { class: 'screen dim' }, this.topbar('🛠️ Nâng cấp thiết bị', () => this.title(), pts), grid));
  }

  // ---------- Thành tựu ----------
  achievements() {
    const got = Object.keys(Save.data.achievements).length;
    const grid = h(
      'div',
      { class: 'cards scroll' },
      ACHIEVEMENTS.map((a) => {
        const t = Save.data.achievements[a.id];
        return h('div', { class: `acard glass ${t ? 'got' : 'locked'}` }, h('div', { class: 'ic' }, a.icon), h('div', {}, h('div', { style: 'font-weight:800;font-size:18px' }, a.name), h('div', { style: 'color:#cfe9f2' }, a.desc), t ? h('div', { style: 'color:#ffc75f;font-size:16px' }, `Đạt ngày ${new Date(t).toLocaleDateString('vi-VN')}`) : null));
      }),
    );
    this.set('achievements', h('div', { class: 'screen dim' }, this.topbar('🏆 Thành tựu', () => this.title(), h('span', { class: 'pill' }, `${got}/${ACHIEVEMENTS.length}`)), grid));
  }

  // ---------- Nguồn & AI ----------
  credits() {
    const c = credits as { teamName: string; school: string; members: string[]; advisor: string };
    const members = c.members.filter((m) => m.trim());
    const el = h(
      'div',
      { class: 'screen dim' },
      this.topbar('📚 Nguồn dữ liệu & Kê khai AI', () => this.title()),
      h(
        'div',
        { class: 'prose scroll' },
        h(
          'section',
          { class: 'glass' },
          h('h3', {}, 'Nguồn dữ liệu sinh vật'),
          h('ul', {}, h('li', {}, 'IUCN Red List (iucnredlist.org)'), h('li', {}, 'FishBase (fishbase.se)'), h('li', {}, 'World Register of Marine Species – WoRMS (marinespecies.org)'), h('li', {}, 'Sách Đỏ Việt Nam')),
        ),
        h('section', { class: 'glass' }, h('h3', {}, 'Hình ảnh'), h('p', { style: 'margin:0' }, 'Toàn bộ hình minh họa sinh vật và môi trường được vẽ bằng mã (SVG/WebGL), không sử dụng ảnh chụp hay hình vẽ của bên thứ ba. Âm thanh được tạo trực tiếp bằng Web Audio. Phông chữ Be Vietnam Pro (Google Fonts, giấy phép SIL Open Font License).')),
        h(
          'section',
          { class: 'glass' },
          h('h3', {}, 'Kê khai sử dụng AI'),
          h('p', { style: 'margin:0' }, '“Mã nguồn và hình minh họa của game được xây dựng với sự hỗ trợ của công cụ AI (Claude). Ý tưởng, thiết kế lối chơi, lựa chọn và kiểm chứng dữ liệu khoa học do nhóm học sinh thực hiện.”'),
        ),
        h(
          'section',
          { class: 'glass' },
          h('h3', {}, 'Nhóm thực hiện'),
          h(
            'div',
            { class: 'facts' },
            'Tên nhóm',
            h('b', {}, c.teamName || '(chưa điền)'),
            'Trường',
            h('b', {}, c.school || '(chưa điền)'),
            'Thành viên',
            h('b', {}, members.length ? members.join(', ') : '(chưa điền)'),
            'Giáo viên hướng dẫn',
            h('b', {}, c.advisor || '(chưa điền)'),
          ),
        ),
      ),
    );
    this.set('credits', el);
  }

  // ---------- Cài đặt ----------
  settings() {
    const s = Save.data.settings;
    const range = (val: number, on: (v: number) => void) =>
      h('input', {
        type: 'range',
        min: 0,
        max: 100,
        value: Math.round(val * 100),
        oninput: (e: Event) => on(Number((e.target as HTMLInputElement).value) / 100),
      });
    const qBtn = (q: 'high' | 'low', label: string) =>
      h('button', {
        class: `tab${s.quality === q ? ' on' : ''}`,
        onclick: () => {
          if (Save.data.settings.quality === q) return;
          Save.update((d) => (d.settings.quality = q));
          toast(this.root, 'Đã đổi chất lượng đồ họa – đang tải lại cảnh…', 'info');
          setTimeout(() => location.reload(), 600);
        },
      }, label);
    let confirmReset = false;
    const resetBtn = h('button', {
      class: 'btn',
      style: 'border-color:#ff6b6b',
      onclick: () => {
        if (!confirmReset) {
          confirmReset = true;
          resetBtn.textContent = 'Bấm lần nữa để xóa vĩnh viễn';
          return;
        }
        Save.reset();
        toast(this.root, 'Đã xóa toàn bộ dữ liệu lưu.', 'info');
        setTimeout(() => location.reload(), 500);
      },
    }, '🗑️ Xóa dữ liệu lưu');
    const el = h(
      'div',
      { class: 'screen dim' },
      this.topbar('⚙️ Cài đặt', () => this.title()),
      h(
        'div',
        { class: 'prose scroll' },
        h(
          'section',
          { class: 'glass' },
          h('div', { class: 'setting-row' }, h('label', {}, '🔊 Âm lượng chung'), range(s.volume, (v) => (Save.update((d) => (d.settings.volume = v)), Sound.setVolume(v, Save.data.settings.music)))),
          h('div', { class: 'setting-row' }, h('label', {}, '🎵 Âm nền'), range(s.music, (v) => (Save.update((d) => (d.settings.music = v)), Sound.setVolume(Save.data.settings.volume, v)))),
          h('div', { class: 'setting-row' }, h('label', {}, '🖥️ Chất lượng đồ họa'), qBtn('low', 'Thấp'), qBtn('high', 'Cao')),
          h('div', { style: 'color:#a9c9d6;padding-top:8px' }, 'Chế độ Thấp tắt các hiệu ứng nặng (caustics, gợn nước, độ phân giải cao) cho máy yếu.'),
          h(
            'div',
            { class: 'setting-row' },
            h('label', {}, '🎓 Hướng dẫn ở lượt lặn đầu'),
            h('button', { class: 'tab', onclick: (e: Event) => (Save.update((d) => ((d.settings.tutorial = true), (d.tutorialDone = false))), ((e.target as HTMLElement).textContent = '✓ Sẽ hiện lại')) }, 'Hiện lại hướng dẫn'),
          ),
          h('div', { class: 'setting-row', style: 'border:none' }, h('label', {}, 'Dữ liệu lưu'), resetBtn),
        ),
      ),
    );
    this.set('settings', el);
  }
}
