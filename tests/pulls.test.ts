import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  allPrints,
  awakenPack,
  cards,
  cardsPerPack,
  collectionId,
  drawPack,
  readCollection,
  recordPrint,
  rollPack,
  themes,
} from '../src/cards';

describe('牧场闪卡', () => {
  it('六只羊中抽五张，每包角色不重复，所有卡位都能抽到三个版本', () => {
    const rolls = [0.99, 0.04, 0, 0.1, 0, 0.4, 0, 0.8, 0, 0.5];
    const pack = rollPack(() => rolls.shift()!);
    expect(pack).toHaveLength(cardsPerPack);
    expect(new Set(pack.map((p) => p.card.id)).size).toBe(5);
    expect(pack.map((p) => p.finish)).toEqual(['astral', 'amber', 'dew', 'dew', 'dew']);
    expect(pack[0].card.id).toBe('ash');
    expect(new Set(allPrints.map(collectionId)).size).toBe(18);
    expect(allPrints.map(collectionId)).toEqual(
      expect.arrayContaining(['snow/dew', 'peach/astral', 'cotton/amber']),
    );
  });

  it('觉醒只升级一个卡位，保留五只羊和本包顺序', () => {
    const pack = rollPack(() => 0.7);
    const upgraded = awakenPack(pack, () => 0.51);
    expect(upgraded.map((p) => p.finish)).toEqual(['dew', 'dew', 'astral', 'dew', 'dew']);
    expect(upgraded.map((p) => p.card)).toEqual(pack.map((p) => p.card));
    expect(pack.every((p) => p.finish === 'dew')).toBe(true);
  });

  it('已经抽出星夜卡时，验光与觉醒保留原来的结果', () => {
    const pack = cards.map((card) => ({ card, finish: 'astral' as const }));
    expect(awakenPack(pack)).toBe(pack);
  });
});

describe('大肥鱼卡包', () => {
  const complete = [
    'whale-snack/amber',
    'whale-token/dew',
    'whale-dance/astral',
    'whale-headphones/dew',
    'whale-chef/amber',
    'whale-nap/dew',
  ];

  afterEach(() => vi.unstubAllGlobals());

  it('每包完整展示六张，毛线帽跳舞固定在第三位', () => {
    expect(themes.whale.prints.map(collectionId)).toEqual(complete);
    for (const roll of [0, 0.25, 0.99999]) {
      expect(drawPack('whale', () => roll).map(collectionId)).toEqual(complete);
    }
  });

  it('另开一包使用独立的六张卡列', () => {
    const first = drawPack('whale');
    first.pop();
    expect(drawPack('whale').map(collectionId)).toEqual(complete);
  });

  it('读取旧小羊收藏，分别统计两个主题，重复收藏仅计一次', () => {
    const stored = new Map([['meadow-card-pack:collection:v1:snow/dew', '1']]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value),
    });
    complete.forEach(recordPrint);
    recordPrint(complete[0]);
    const found = readCollection();
    expect(found.size).toBe(7);
    expect(themes.meadow.prints.map(collectionId).filter((id) => found.has(id))).toEqual([
      'snow/dew',
    ]);
    expect(themes.whale.prints.map(collectionId).filter((id) => found.has(id))).toEqual(complete);
  });
});
