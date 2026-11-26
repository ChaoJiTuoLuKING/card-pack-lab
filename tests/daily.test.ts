import { describe, expect, it, vi } from 'vitest';
import { newRound, openingRound, readTheme } from '../src/rounds';

vi.mock('../src/card-pools/meals.json', () => ({ default: [{ name: '面' }, { name: '饭' }] }));
vi.mock('../src/card-pools/english.json', () => ({
  default: [
    { word: 'cat', meaning: '猫' },
    { word: 'dog', meaning: '狗' },
  ],
}));

describe('可替换的单卡卡池', () => {
  it('菜单随机抽取，词卡按文件顺序出卡并循环', () => {
    expect(newRound('meal', () => 0)).toEqual({ theme: 'meal', entry: { name: '面' } });
    expect(newRound('meal', () => 0.999)).toEqual({ theme: 'meal', entry: { name: '饭' } });
    expect(newRound('english', () => 0.1)).toEqual({
      theme: 'english',
      entry: { word: 'cat', meaning: '猫' },
    });
    expect(newRound('english', () => 0, 'cat')).toEqual({
      theme: 'english',
      entry: { word: 'dog', meaning: '狗' },
    });
    expect(newRound('english', () => 0, 'dog')).toMatchObject({ entry: { word: 'cat' } });
  });
  it('指定单词只影响分享链接的首包，找不到时仍从词库抽取', () => {
    expect(openingRound('?pack=english&word=dog')).toEqual({
      theme: 'english', entry: { word: 'dog', meaning: '狗' },
    });
    expect(openingRound('?pack=english&word=missing')).toMatchObject({
      theme: 'english', entry: { word: expect.stringMatching(/^(cat|dog)$/) },
    });
    expect(openingRound('?pack=meal&word=dog').theme).toBe('meal');
  });
  it('四种分享链接打开相应卡包，旧地址和未知包回到牧场', () => {
    for (const theme of ['meal', 'english', 'meadow', 'whale'])
      expect(readTheme('?pack=' + theme)).toBe(theme);
    for (const query of ['', '?pack=unknown', '?pack=constructor'])
      expect(readTheme(query)).toBe('meadow');
  });
});
