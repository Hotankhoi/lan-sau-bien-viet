/**
 * Chế độ lớp học: sinh 5 câu trắc nghiệm tiếng Việt từ dữ liệu các loài học sinh vừa ghi nhận.
 * Không có nội dung viết tay cho từng loài – mọi câu hỏi lấy từ species.json nên luôn khớp dữ liệu.
 */
import { SPECIES, SPECIES_BY_ID, DANGER_INFO, IUCN_INFO, BEHAVIOR_HINT, REGION_LABEL, TIER_INFO, type Species, type RegionId, type Danger, type Iucn } from '../data/types';

export interface QuizQuestion {
  kind: 'name' | 'danger' | 'iucn' | 'fact' | 'behavior' | 'safety' | 'habitat';
  /** loài được hỏi (để hiện hình minh họa) – null với câu hỏi chung */
  speciesId: string | null;
  /** có hiện hình loài cạnh câu hỏi không (câu "đây là loài nào" thì hiện hình nhưng giấu tên) */
  showArt: boolean;
  text: string;
  options: string[];
  correct: number;
  explain: string;
}

function shuffle<T>(a: T[], r: () => number): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function build(q: Omit<QuizQuestion, 'options' | 'correct'>, right: string, wrong: string[], r: () => number, keepOrder = false): QuizQuestion {
  const uniq = [...new Set(wrong.filter((w) => w && w !== right))].slice(0, 3);
  const opts = keepOrder ? [right, ...uniq] : shuffle([right, ...uniq], r);
  return { ...q, options: opts, correct: opts.indexOf(right) };
}

const DANGER_ORDER: Danger[] = ['an_toan', 'can_than', 'nguy_hiem', 'cuc_ky_nguy_hiem'];
const SAFETY = 'Lên bờ ngay, báo người lớn và gọi cấp cứu 115';

/**
 * @param seenIds các loài vừa ghi nhận trong lượt lặn (ưu tiên hỏi về chúng)
 * @param region vùng vừa lặn (dùng làm nguồn dự phòng và đáp án nhiễu)
 */
export function makeQuiz(seenIds: string[], region: RegionId, count = 5, r: () => number = Math.random, hasArt: (id: string) => boolean = () => true): QuizQuestion[] {
  const regionPool = SPECIES.filter((s) => s.region === region);
  const seen = [...new Set(seenIds)].map((id) => SPECIES_BY_ID.get(id)).filter((s): s is Species => !!s);
  // chưa ghi nhận đủ loài → bổ sung loài của vùng để vẫn đủ câu hỏi
  const subjects = shuffle(seen, r);
  for (const s of shuffle(regionPool, r)) if (subjects.length < count && !subjects.includes(s)) subjects.push(s);
  const others = (sp: Species) => shuffle(SPECIES.filter((s) => s.id !== sp.id), r);
  const near = (sp: Species) => [...shuffle(regionPool.filter((s) => s.id !== sp.id), r), ...others(sp)];

  const makers: Record<string, (sp: Species) => QuizQuestion | null> = {
    name: (sp) =>
      !hasArt(sp.id)
        ? null
        : build(
        { kind: 'name', speciesId: sp.id, showArt: true, text: 'Đây là loài sinh vật nào?', explain: `Đây là ${sp.nameVi} (${sp.nameSci}). ${sp.description}` },
        sp.nameVi,
        near(sp).map((s) => s.nameVi),
        r,
      ),
    danger: (sp) =>
      build(
        {
          kind: 'danger',
          speciesId: sp.id,
          showArt: true,
          text: `Khi gặp ${sp.nameVi} dưới biển, mức độ nguy hiểm với con người là gì?`,
          explain: `${sp.nameVi}: ${DANGER_INFO[sp.danger].name}. ${sp.dangerNote ?? 'Loài này không gây hại nếu ta chỉ quan sát và không chạm vào.'}`,
        },
        DANGER_INFO[sp.danger].name,
        DANGER_ORDER.filter((d) => d !== sp.danger).map((d) => DANGER_INFO[d].name),
        r,
      ),
    iucn: (sp) => {
      if (sp.iucn === 'NE') return null;
      const all = (Object.keys(IUCN_INFO) as Iucn[]).filter((k) => k !== 'NE');
      return build(
        {
          kind: 'iucn',
          speciesId: sp.id,
          showArt: true,
          text: `Theo Sách Đỏ IUCN, tình trạng bảo tồn của ${sp.nameVi} là gì?`,
          explain: `${IUCN_INFO[sp.iucn].name}: ${IUCN_INFO[sp.iucn].text}${sp.conservation ? ' ' + sp.conservation : ''}`,
        },
        IUCN_INFO[sp.iucn].name,
        shuffle(all.filter((k) => k !== sp.iucn), r).map((k) => IUCN_INFO[k].name),
        r,
      );
    },
    fact: (sp) =>
      build(
        { kind: 'fact', speciesId: sp.id, showArt: true, text: `Điều nào sau đây đúng về ${sp.nameVi}?`, explain: `Bạn có biết? ${sp.funFact}` },
        sp.funFact,
        near(sp).map((s) => s.funFact),
        r,
      ),
    behavior: (sp) =>
      build(
        { kind: 'behavior', speciesId: sp.id, showArt: true, text: `Muốn tìm và chụp được ${sp.nameVi}, cách nào phù hợp nhất?`, explain: `${sp.nameVi}: ${BEHAVIOR_HINT[sp.behavior]}` },
        BEHAVIOR_HINT[sp.behavior],
        shuffle(Object.entries(BEHAVIOR_HINT).filter(([k]) => k !== sp.behavior).map(([, v]) => v), r),
        r,
      ),
    habitat: (sp) =>
      build(
        {
          kind: 'habitat',
          speciesId: sp.id,
          showArt: true,
          text: `Trong game, ${sp.nameVi} sống ở vùng biển nào?`,
          explain: `${sp.nameVi} được ghi nhận ở ${REGION_LABEL[sp.region]}, ${TIER_INFO[sp.tier].name} (${TIER_INFO[sp.tier].range}).`,
        },
        REGION_LABEL[sp.region],
        (Object.keys(REGION_LABEL) as RegionId[]).filter((k) => k !== sp.region).map((k) => REGION_LABEL[k]),
        r,
      ),
  };

  const out: QuizQuestion[] = [];
  // thứ tự loại câu hỏi: đa dạng, ưu tiên nội dung giáo dục chính
  const order = ['name', 'danger', 'fact', 'iucn', 'behavior', 'habitat'];
  let si = 0;
  for (const kind of order) {
    if (out.length >= count - 1) break;
    // tìm loài phù hợp với loại câu hỏi (vd. câu IUCN cần loài đã được đánh giá; câu nguy hiểm ưu tiên loài nguy hiểm)
    let pick: Species | undefined;
    const cand = [...subjects.slice(si), ...subjects.slice(0, si)];
    const isSeen = (x: Species) => seen.includes(x);
    const unused = (x: Species) => !out.some((q) => q.speciesId === x.id);
    // ưu tiên: loài vừa ghi nhận & chưa hỏi → loài vừa ghi nhận → loài bổ sung của vùng
    const prefer = (ok: (x: Species) => boolean) => cand.find((x) => isSeen(x) && unused(x) && ok(x)) ?? cand.find((x) => isSeen(x) && ok(x)) ?? cand.find((x) => unused(x) && ok(x)) ?? cand.find(ok);
    if (kind === 'danger') pick = (seen.length ? cand.find((x) => isSeen(x) && unused(x) && x.danger !== 'an_toan') ?? cand.find((x) => isSeen(x) && unused(x)) : undefined) ?? prefer((x) => x.danger !== 'an_toan') ?? cand[0];
    else if (kind === 'iucn') pick = prefer((x) => ['VU', 'EN', 'CR'].includes(x.iucn)) && isSeen(prefer((x) => ['VU', 'EN', 'CR'].includes(x.iucn))!) ? prefer((x) => ['VU', 'EN', 'CR'].includes(x.iucn)) : (cand.find((x) => isSeen(x) && x.iucn !== 'NE') ?? prefer((x) => ['VU', 'EN', 'CR'].includes(x.iucn)) ?? prefer((x) => x.iucn !== 'NE'));
    else pick = prefer(() => true);
    if (!pick) continue;
    const q = makers[kind](pick);
    if (q && q.options.length >= 3) {
      out.push(q);
      si = (si + 1) % Math.max(1, subjects.length);
    }
  }
  // câu cuối: kỹ năng an toàn – luôn có
  out.push(
    build(
      {
        kind: 'safety',
        speciesId: null,
        showArt: false,
        text: 'Ngoài đời thật, nếu bị sinh vật biển chích hoặc đốt, em nên làm gì?',
        explain: 'Ngoài đời thật: tuyệt đối không chạm vào sinh vật biển. Nếu bị chích/đốt, lên bờ ngay, báo người lớn và gọi cấp cứu 115.',
      },
      SAFETY,
      ['Tiếp tục bơi cho quen rồi sẽ hết đau', 'Tự nặn vết thương rồi giấu không cho ai biết', 'Bắt con vật đó mang về để mọi người xem'],
      r,
    ),
  );
  return out.slice(0, count).map((q) => ({ ...q, showArt: q.showArt && !!q.speciesId && hasArt(q.speciesId) }));
}
