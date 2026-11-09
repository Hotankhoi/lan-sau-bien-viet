/** Hình TẠM cho loài chưa được vẽ (đặt tên rõ để thay sau). */
import type { CreatureArt } from './contract';
import type { Species } from '../data/types';
import { makeIds, counterShade, eye, joinDefs } from './style-bible';

export function placeholderArt(sp: Species): CreatureArt {
  const u = makeIds(`tam_${sp.id}`);
  const e = eye(u, 'eye', { cx: 420, cy: 118, r: 12, iris: ['#9ad', '#246'] });
  const body = 'M470 130C440 70 330 60 250 70C170 80 120 110 90 128C120 150 170 180 250 188C330 196 440 190 470 130Z';
  const tail = 'M100 128L30 70L46 128L30 190Z';
  return {
    id: sp.id,
    viewBox: [512, 256],
    lengthUnits: 440,
    animation: 'fish',
    cardDetailLevel: 'hi',
    placeholder: true,
    defs: joinDefs(counterShade(u('fill'), { dorsal: '#4b6478', flank: '#7f98a8', belly: '#c9d6de' }), e),
    layers: [
      { name: 'tail', role: 'tail', svg: `<path d="${tail}" fill="#5d7688" opacity="0.8"/>` },
      { name: 'body', role: 'body', svg: `<path d="${body}" fill="${u.url('fill')}" stroke="#2c3e4c" stroke-width="2"/>` },
      { name: 'eye', role: 'eye', svg: e.svg },
    ],
  };
}
