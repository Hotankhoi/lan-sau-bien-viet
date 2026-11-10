/**
 * Chế độ lớp học: giáo viên chọn vùng → học sinh lặn một lượt → làm 5 câu trắc nghiệm
 * sinh tự động từ các loài vừa ghi nhận → xem điểm và đáp án có giải thích.
 */
import { REGIONS, REGION_BY_ID, SPECIES_BY_ID, TIER_INFO, type RegionId, type Tier } from '../data/types';
import { regionLock, tierLock, regionFound } from '../systems/Progress';
import { makeQuiz, type QuizQuestion } from '../systems/Quiz';
import { Sound } from '../systems/Audio';
import { hasRealArt } from '../art/species';
import type { DiveSummary } from '../game/bus';
import { h, add, clear, artUrl } from './dom';

/** Màn hình chọn vùng cho giáo viên. */
export function classroomSetup(onStart: (region: RegionId, tier: Tier) => void, topbar: HTMLElement): HTMLElement {
  let region: RegionId = 'mien_trung';
  let tier: Tier = 1;
  const regionBox = h('div', { class: 'class-regions' });
  const tierBox = h('div', { class: 'tabs' });
  const info = h('p', { style: 'margin:0;color:#cfe9f2' });
  const render = () => {
    clear(regionBox);
    for (const r of REGIONS) {
      const lock = regionLock(r.id);
      const { found, total } = regionFound(r.id);
      regionBox.appendChild(
        h(
          'button',
          {
            class: `class-region${region === r.id ? ' on' : ''}`,
            disabled: !!lock,
            onclick: () => {
              Sound.ui();
              region = r.id;
              if (tierLock(region, tier)) tier = 1;
              render();
            },
          },
          h('div', { style: 'font-weight:800;font-size:18px' }, (lock ? '🔒 ' : '') + r.name),
          h('div', { style: 'color:#a9c9d6' }, lock ?? `${r.mood} · đã ghi nhận ${found}/${total} loài`),
        ),
      );
    }
    clear(tierBox);
    for (const t of REGION_BY_ID.get(region)!.tiers) {
      const tl = tierLock(region, t);
      tierBox.appendChild(h('button', { class: `tab${tier === t ? ' on' : ''}`, disabled: !!tl, title: tl ?? '', onclick: () => ((tier = t), Sound.ui(), render()) }, `${tl ? '🔒 ' : ''}${TIER_INFO[t].name}`));
    }
    info.textContent = REGION_BY_ID.get(region)!.blurb;
  };
  render();
  return h(
    'div',
    { class: 'screen dim' },
    topbar,
    h(
      'div',
      { class: 'prose scroll' },
      h(
        'section',
        { class: 'glass' },
        h('h3', {}, 'Dành cho giáo viên'),
        h(
          'ol',
          { style: 'margin:0;padding-left:22px' },
          h('li', {}, 'Chọn một vùng biển đã mở và tầng độ sâu.'),
          h('li', {}, 'Học sinh lặn một lượt (khoảng 3–5 phút): quan sát, chụp ảnh sinh vật, nhặt rác, không chạm san hô.'),
          h('li', {}, 'Sau khi nổi lên, học sinh làm 5 câu trắc nghiệm về chính những loài vừa ghi nhận.'),
          h('li', {}, 'Cuối bài hiện điểm và đáp án kèm giải thích để cả lớp cùng thảo luận.'),
        ),
      ),
      h('section', { class: 'glass' }, h('h3', {}, '1. Chọn vùng biển'), regionBox),
      h('section', { class: 'glass' }, h('h3', {}, '2. Chọn tầng độ sâu'), tierBox, h('div', { style: 'height:10px' }), info),
      h('div', { style: 'text-align:center;padding:6px 0 20px' }, h('button', { class: 'btn primary', style: 'min-height:60px;font-size:20px;padding:10px 40px', onclick: () => onStart(region, tier) }, '🤿 Bắt đầu lượt lặn của lớp')),
    ),
  );
}

/** Bài trắc nghiệm sau lượt lặn. */
export function classroomQuiz(summary: DiveSummary, onAgain: () => void, onExit: () => void): HTMLElement {
  const region = summary.region as RegionId;
  // loài đã chụp trong lượt (kể cả loài cũ) – ưu tiên loài mới
  const seen = [...summary.newSpecies, ...summary.photos.map((p) => p.speciesId).filter((x): x is string => !!x)];
  const questions = makeQuiz(seen, region, 5, Math.random, hasRealArt);
  const answers: number[] = [];
  const body = h('div', { class: 'quiz-body' });
  const root = h('div', { class: 'screen dim solid' }, h('div', { class: 'quiz glass scroll' }, body));
  const LETTERS = ['A', 'B', 'C', 'D'];

  const intro = () => {
    clear(body);
    const names = [...new Set(seen)].map((id) => SPECIES_BY_ID.get(id)?.nameVi).filter(Boolean);
    add(body, 
      h('div', { class: 'new-tag', style: 'color:#4FE3D3;font-weight:800;letter-spacing:.2em' }, 'CHẾ ĐỘ LỚP HỌC'),
      h('h2', { style: 'margin:6px 0' }, '📝 Bài trắc nghiệm sau lượt lặn'),
      h(
        'p',
        { style: 'margin:0;color:#cfe9f2' },
        names.length ? `Trong lượt lặn vừa rồi em đã ghi nhận: ${names.join(', ')}. ` : 'Lượt này em chưa chụp được loài nào – các câu hỏi sẽ về những loài sống ở vùng biển em vừa lặn. ',
        `Hãy trả lời ${questions.length} câu hỏi dưới đây nhé!`,
      ),
      h('div', { class: 'sum-stats', style: 'margin:14px 0' }, [
        [String(summary.newSpecies.length), 'Loài mới'],
        [String(summary.photos.filter((p) => p.speciesId).length), 'Ảnh chụp được'],
        [String(summary.trash), 'Rác đã nhặt'],
        [String(summary.coralHits), 'Lần chạm san hô'],
      ].map(([v, k]) => h('div', { class: 'stat' }, h('div', { class: 'v' }, v), h('div', { class: 'k' }, k)))),
      h('div', { style: 'text-align:right' }, h('button', { class: 'btn primary', onclick: () => (Sound.ui(), ask(0)) }, 'Bắt đầu làm bài ▶')),
    );
  };

  const ask = (i: number) => {
    clear(body);
    const q = questions[i];
    const explain = h('div', { class: 'science', style: 'display:none' });
    const next = h('button', { class: 'btn primary', style: 'display:none', onclick: () => (Sound.ui(), i + 1 < questions.length ? ask(i + 1) : result()) }, i + 1 < questions.length ? 'Câu tiếp theo ▶' : 'Xem kết quả ▶');
    const opts = h('div', { class: 'quiz-opts' });
    q.options.forEach((o, k) => {
      const b = h(
        'button',
        {
          class: 'quiz-opt',
          onclick: () => {
            if (answers[i] !== undefined) return;
            answers[i] = k;
            const ok = k === q.correct;
            if (ok) Sound.discover(false);
            else Sound.coral();
            [...opts.children].forEach((c, j) => {
              c.classList.add('done');
              if (j === q.correct) c.classList.add('right');
              else if (j === k) c.classList.add('wrong');
            });
            explain.style.display = '';
            explain.replaceChildren(h('b', {}, ok ? '✅ Chính xác! ' : '❌ Chưa đúng. '), q.explain);
            next.style.display = '';
            next.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          },
        },
        h('span', { class: 'ql' }, LETTERS[k]),
        h('span', {}, o),
      );
      opts.appendChild(b);
    });
    add(body, 
      h('div', { class: 'quiz-head' }, h('span', { class: 'pill' }, `Câu ${i + 1}/${questions.length}`), h('div', { class: 'bar', style: 'flex:1' }, h('i', { style: `width:${(i / questions.length) * 100}%` }))),
      q.showArt && q.speciesId ? h('div', { class: 'quiz-art' }, h('img', { src: artUrl(q.speciesId), alt: 'Hình minh họa loài được hỏi' })) : null,
      h('h3', { class: 'quiz-q' }, q.text),
      opts,
      explain,
      h('div', { style: 'text-align:right;margin-top:12px' }, next),
    );
  };

  const result = () => {
    clear(body);
    const score = questions.filter((q, i) => answers[i] === q.correct).length;
    const pct = score / questions.length;
    const msg = pct === 1 ? 'Xuất sắc! Em là nhà hải dương học nhí thực thụ.' : pct >= 0.6 ? 'Rất tốt! Em đã quan sát khá kỹ.' : 'Cố lên! Lặn thêm một lượt, quan sát thật kỹ rồi thử lại nhé.';
    add(body, 
      h('div', { class: 'new-tag', style: 'color:#4FE3D3;font-weight:800;letter-spacing:.2em' }, 'KẾT QUẢ'),
      h('div', { class: 'quiz-score' }, h('span', {}, String(score)), `/${questions.length}`),
      h('p', { style: 'text-align:center;margin:0 0 14px;font-weight:600;color:#ffc75f' }, msg),
      h('h3', { style: 'margin:0 0 8px' }, 'Đáp án và giải thích'),
      questions.map((q: QuizQuestion, i) => {
        const ok = answers[i] === q.correct;
        return h(
          'div',
          { class: `quiz-review ${ok ? 'ok' : 'bad'}` },
          h('div', { style: 'font-weight:700' }, `${ok ? '✅' : '❌'} Câu ${i + 1}. ${q.text}`),
          h('div', {}, h('b', {}, 'Đáp án đúng: '), q.options[q.correct]),
          !ok && answers[i] !== undefined ? h('div', { style: 'color:#ffb3b3' }, h('b', {}, 'Em đã chọn: '), q.options[answers[i]]) : null,
          h('div', { style: 'color:#cfe9f2' }, q.explain),
        );
      }),
      h(
        'div',
        { style: 'display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px' },
        h('button', { class: 'btn', onclick: onExit }, 'Về màn hình chính'),
        h('button', { class: 'btn primary', onclick: onAgain }, '🤿 Lượt lặn mới'),
      ),
    );
    body.parentElement?.scrollTo({ top: 0 });
  };

  intro();
  return root;
}
