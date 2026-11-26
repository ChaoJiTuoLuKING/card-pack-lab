import meals from './card-pools/meals.json';
import english from './card-pools/english.json';
import { drawPack, themes, type PackTheme, type Pull } from './cards';

export const packNames = {
  meadow: themes.meadow.name,
  whale: themes.whale.name,
  meal: '今天吃啥',
  english: '背单词',
};
export type Theme = keyof typeof packNames;
export interface Meal {
  name: string;
  note?: string;
}
export interface Word {
  word: string;
  meaning: string;
  example?: string;
  translation?: string;
  audio?: string;
  exampleAudio?: string;
  exampleWordStart?: number;
}
export type DailyRound =
  { theme: 'meal'; entry: Meal | undefined } | { theme: 'english'; entry: Word | undefined };
export type Round = DailyRound | { theme: PackTheme; pulls: Pull[] };

export function readTheme(search: string): Theme {
  const pack = new URLSearchParams(search).get('pack');
  return pack && Object.hasOwn(packNames, pack) ? (pack as Theme) : 'meadow';
}

function sample<T>(entries: readonly T[], random: () => number): T | undefined {
  return entries[Math.floor(random() * entries.length)];
}

export function newRound(theme: Theme, random = Math.random, previousWord?: string): Round {
  if (theme === 'meal') return { theme, entry: sample<Meal>(meals, random) };
  if (theme === 'english') {
    const previous = english.findIndex((entry) => entry.word === previousWord);
    return { theme, entry: english.length ? english[(previous + 1) % english.length] : undefined };
  }
  return { theme, pulls: drawPack(theme, random) };
}

// A shared word link selects only the first card. Subsequent packs follow the word list.
export function openingRound(search: string): Round {
  const theme = readTheme(search);
  if (theme === 'english') {
    const word = new URLSearchParams(search).get('word');
    const entry = english.find((item) => item.word === word);
    if (entry) return { theme, entry };
  }
  return newRound(theme);
}
