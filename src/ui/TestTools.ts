/**
 * Chế độ kiểm thử (?test=1): dải cam "CHẾ ĐỘ KIỂM THỬ" + bảng công cụ (phím F9 hoặc nút trên dải cam).
 * Chỉ được tải khi bật chế độ kiểm thử; mọi thay đổi chỉ nằm trong bộ lưu kiểm thử.
 */
import { REGIONS, SPECIES, SPECIES_BY_ID, TIER_INFO, isProtected, type RegionId, type Tier } from '../data/types';
import { Save } from '../systems/Save';
import { TestOpts } from '../systems/testFlag';
import { fullSave, emptySave, fillTestPhotos, cancelTestPhotos } from '../systems/TestData';
import { Flow } from '../game/flow';
import { bus } from '../game/bus';
import { h } from './dom';
import { toast } from './Hud';
import type { DiveScene } from '../scenes/DiveScene';

export interface TestApi {
  root: HTMLElement;
  isDiving: () => boolean;
  dive: (region: RegionId, tier: Tier) => void;
  title: () => void;
  refresh: () => void;
}

const OPTS_KEY = 'lan-sau-test-opts';

export function installTestTools(api: TestApi) {
  try {
    Object.assign(TestOpts, JSON.parse(localStorage.getItem(OPTS_KEY) ?? '{}'));
  } catch {
    /* bỏ qua */
  }
  const saveOpts = () => {
    try {
      localStorage.setItem(OPTS_KEY, JSON.stringify(TestOpts));
    } catch {
      /* bỏ qua */
    }
  };

  const progress = h('span', { class: 'tb-progress' });
  const status = h('div', { class: 'tt-status', role: 'status' });
  const say = (t: string) => {
    status.textContent = t;
  };

  const startPhotos = () =>
    fillTestPhotos((done, total) => {
      progress.textContent = done < total ? ` · đang tạo ảnh ${done}/${total}` : '';
    });

  // lần đầu mở ?test=1: tạo bộ lưu "đã có tất cả"
  if (!Save.hadStored) {
    Save.replace(fullSave(Save.data));
    api.refresh();
  }
  startPhotos();

  // ---------- gọi loài ----------
  const scene = () => Flow.scene<DiveScene>();
  const summon = async (id: string) => {
    const sp = SPECIES_BY_ID.get(id);
    if (!sp) return;
    const sc = scene();
    if (api.isDiving() && sc?.ready) {
      const ok = await sc.spawnTest(id);
      say(ok ? `Đã gọi ${sp.nameVi} ra trước mặt thợ lặn.` : 'Chưa gọi được – đợi lượt lặn tải xong rồi thử lại.');
      if (ok) close();
      return;
    }
    // chưa lặn: vào đúng vùng/tầng của loài rồi gọi ra khi lượt lặn sẵn sàng
    say(`Đang lặn xuống ${REGIONS.find((r) => r.id === sp.region)?.short} · Tầng ${sp.tier} để gọi ${sp.nameVi}…`);
    bus.once('dive:ready', () => setTimeout(() => scene()?.spawnTest(id), 400));
    close();
    api.dive(sp.region, sp.tier);
  };
  /** Gọi một loài và xóa nó khỏi Sổ tay kiểm thử để khi chụp hiện thẻ ghi nhận đặc biệt */
  const summonFresh = (list: string[], label: string) => {
    if (!list.length) return;
    const id = list[Math.floor(Math.random() * list.length)];
    Save.update((d) => {
      delete d.species[id];
    });
    toast(api.root, `${label}: ${SPECIES_BY_ID.get(id)!.nameVi} (đã xóa khỏi Sổ tay kiểm thử – hãy chụp để xem thẻ ghi nhận)`, 'info');
    summon(id);
  };

  // ---------- bảng ----------
  const jump = h(
    'div',
    { class: 'tt-jump' },
    REGIONS.map((r) =>
      h(
        'div',
        { class: 'tt-row' },
        h('span', { class: 'tt-reg' }, r.short),
        r.tiers.map((t) => h('button', { class: 'btn tt-btn', 'data-jump': `${r.id}:${t}`, title: `${r.name} · ${TIER_INFO[t].name}`, onclick: () => (close(), api.dive(r.id, t)) }, `Tầng ${t}`)),
      ),
    ),
  );

  const o2 = h('input', { type: 'checkbox', class: 'tt-o2' }) as HTMLInputElement;
  o2.checked = TestOpts.infiniteO2;
  o2.addEventListener('change', () => {
    TestOpts.infiniteO2 = o2.checked;
    saveOpts();
    say(o2.checked ? 'Oxy vô hạn: BẬT' : 'Oxy vô hạn: TẮT');
  });

  const select = h(
    'select',
    { class: 'tt-select', 'aria-label': 'Chọn loài để gọi' },
    REGIONS.map((r) =>
      h(
        'optgroup',
        { label: r.name },
        SPECIES.filter((s) => s.region === r.id).map((s) => h('option', { value: s.id }, `${s.nameVi} · T${s.tier}${s.rarity === 'huyen_thoai' ? ' ★' : ''}${s.redBookVN ? ' 📕' : ''}`)),
      ),
    ),
  ) as HTMLSelectElement;

  // ưu tiên loài huyền thoại KHÔNG thuộc nhóm cần bảo vệ để thấy đúng thẻ vàng "★ LOÀI HUYỀN THOẠI ★"
  // (loài vừa huyền thoại vừa cần bảo vệ sẽ hiện thẻ viền đỏ son, giống nút Sách Đỏ)
  const legendAll = SPECIES.filter((s) => s.rarity === 'huyen_thoai');
  const legendPlain = legendAll.filter((s) => !isProtected(s));
  const legends = (legendPlain.length ? legendPlain : legendAll).map((s) => s.id);
  const redbook = SPECIES.filter((s) => s.redBookVN && s.rarity !== 'huyen_thoai' && isProtected(s)).map((s) => s.id);

  const panel = h(
    'div',
    { class: 'test-panel glass scroll', role: 'dialog', 'aria-label': 'Công cụ kiểm thử', hidden: true },
    h('div', { class: 'tt-head' }, h('h3', {}, '🧰 Công cụ kiểm thử'), h('span', { class: 'tt-key' }, 'F9'), h('button', { class: 'btn icon tt-close', title: 'Đóng', onclick: () => close() }, '✕')),
    h('h4', {}, 'Nhảy nhanh đến vùng / tầng'),
    jump,
    h('h4', {}, 'Lượt lặn'),
    h('label', { class: 'tt-toggle' }, o2, ' Oxy vô hạn'),
    h('div', { class: 'tt-summon' }, select, h('button', { class: 'btn primary tt-call', onclick: () => summon(select.value) }, 'Gọi ra')),
    h('p', { class: 'tt-note' }, 'Loài xuất hiện ngay trước mặt thợ lặn. Nếu chưa lặn, game sẽ lặn xuống đúng vùng/tầng của loài đó.'),
    h('h4', {}, 'Hiệu ứng ghi nhận đặc biệt'),
    h(
      'div',
      { class: 'tt-grid' },
      h('button', { class: 'btn gold tt-legend', onclick: () => summonFresh(legends, '★ Loài Huyền thoại') }, '★ Gọi loài Huyền thoại'),
      h('button', { class: 'btn tt-redbook', onclick: () => summonFresh(redbook, '📕 Loài Sách Đỏ') }, '📕 Gọi loài Sách Đỏ'),
    ),
    h('p', { class: 'tt-note' }, 'Loài được gọi sẽ bị xóa khỏi Sổ tay kiểm thử; chụp nó (giữ Space/chuột phải để ngắm, bấm để chụp) để xem thẻ ghi nhận.'),
    h('h4', {}, 'Bộ lưu kiểm thử'),
    h(
      'div',
      { class: 'tt-grid' },
      h(
        'button',
        {
          class: 'btn tt-reset-empty',
          onclick: () => {
            cancelTestPhotos();
            progress.textContent = '';
            Save.replace(emptySave(Save.data));
            close();
            api.title();
            toast(api.root, 'Bộ lưu kiểm thử: chưa có gì (người chơi mới)', 'info');
          },
        },
        '↺ Đặt lại: chưa có gì',
      ),
      h(
        'button',
        {
          class: 'btn tt-reset-full',
          onclick: () => {
            Save.replace(fullSave(Save.data));
            startPhotos();
            close();
            api.title();
            toast(api.root, 'Bộ lưu kiểm thử: đã có tất cả', 'info');
          },
        },
        '★ Đặt lại: đã có tất cả',
      ),
    ),
    status,
    h('p', { class: 'tt-note' }, 'Chế độ kiểm thử dùng bộ lưu riêng; tiến trình thật không bị đọc hay ghi đè.'),
  );

  const open = () => {
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  };
  function close() {
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }
  const toggle = () => (panel.hidden ? open() : close());

  const btn = h('button', { class: 'tb-tools', title: 'Bảng công cụ kiểm thử (F9)', 'aria-expanded': 'false', onclick: () => toggle() }, '🧰');
  const banner = h('div', { class: 'test-banner' }, h('span', {}, 'CHẾ ĐỘ KIỂM THỬ'), progress, btn);

  document.body.append(banner, panel);
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'F9') {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }
    },
    true,
  );
  // phím trong bảng (chọn loài…) không được điều khiển thợ lặn
  panel.addEventListener('keydown', (e) => e.key !== 'F9' && e.key !== 'Escape' && e.stopPropagation());
}
