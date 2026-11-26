import { cards } from './card-pools/meadow';
import { whaleSeries } from './card-pools/whale';
export { cards };

export const cardsPerPack = 5;
export type PackTheme = 'meadow' | 'whale';

export interface CardDesign {
  id: string;
  title: string;
  sheep: string;
  art: string;
  alt: string;
  edge: string;
  dark: string;
  hint?: string;
}

export const finishes = {
  dew: { name: '晨露', color: '#91eed4' },
  amber: { name: '夕金', color: '#ffcb69' },
  astral: { name: '星夜', color: '#b9a4ff' },
} as const;

export type Finish = keyof typeof finishes;
export interface Pull {
  card: CardDesign;
  finish: Finish;
}
export const collectionId = ({ card, finish }: Pull) => card.id + '/' + finish;
export const allPrints = cards.flatMap((card) =>
  (Object.keys(finishes) as Finish[]).map((finish) => ({ card, finish })),
);

export const themes = {
  meadow: { name: '绵绵牧场', album: '牧场收藏册', cards, prints: allPrints },
  whale: {
    name: '大肥鱼',
    album: '大肥鱼收藏册',
    cards: whaleSeries.map(({ card }) => card),
    prints: whaleSeries,
  },
};

export function drawPack(theme: PackTheme, random = Math.random): Pull[] {
  if (theme === 'meadow') return rollPack(random);
  return [...whaleSeries];
}

export function rollPack(random = Math.random): Pull[] {
  const candidates = [...cards];
  return Array.from({ length: Math.min(cardsPerPack, candidates.length) }, () => {
    const index = Math.floor(random() * candidates.length);
    const [card] = candidates.splice(index, 1);
    const roll = random();
    const finish: Finish = roll < 0.1 ? 'astral' : roll < 0.4 ? 'amber' : 'dew';
    return { card, finish };
  });
}

export function awakenPack(pulls: Pull[], random = Math.random): Pull[] {
  if (pulls.some((pull) => pull.finish === 'astral')) return pulls;
  const star = Math.floor(random() * pulls.length);
  return pulls.map((pull, i) => (i === star ? { ...pull, finish: 'astral' } : pull));
}

const storagePrefix = 'meadow-card-pack:collection:v1:';
export function readCollection() {
  try {
    return new Set(
      [...allPrints, ...themes.whale.prints]
        .map(collectionId)
        .filter((id) => localStorage.getItem(storagePrefix + id) === '1'),
    );
  } catch {
    return new Set<string>();
  }
}
export function recordPrint(id: string) {
  try {
    localStorage.setItem(storagePrefix + id, '1');
  } catch {
    /* Available for this session. */
  }
}
