import type { CardDesign } from '../cards';
import cloud from '../assets/cloud.webp';
import malt from '../assets/malt.webp';
import ash from '../assets/ash.webp';

import snow from '../assets/snow.webp';
import cotton from '../assets/cotton.webp';
import peach from '../assets/peach.webp';
export const cards: readonly CardDesign[] = [
  {
    id: 'snow',
    title: '雪山小羊',
    sheep: '小满',
    art: snow,
    alt: '头戴花冠的小满站在牧场的雪峰前',
    edge: '#c9dde4',
    dark: '#101f2d',
  },
  {
    id: 'cotton',
    title: '溪边草帽',
    sheep: '棉花',
    art: cotton,
    alt: '戴草帽的棉花站在牧场溪边的草地上',
    edge: '#d6dfb2',
    dark: '#1a2924',
  },
  {
    id: 'peach',
    title: '野花桃酥',
    sheep: '桃酥',
    art: peach,
    alt: '粉色小羊桃酥站在牧场的花丛和树荫里',
    edge: '#e8cedb',
    dark: '#2d1d2e',
  },
  {
    id: 'cloud',
    title: '踏风一跃',
    sheep: '云朵',
    art: cloud,
    alt: '云朵腾起前蹄，跃过林边的野花草地',
    edge: '#c2ddbd',
    dark: '#19332d',
  },
  {
    id: 'malt',
    title: '水车慢转',
    sheep: '麦芽',
    art: malt,
    alt: '米色的麦芽在木水车与小溪前停下脚步',
    edge: '#e4c38e',
    dark: '#382a20',
  },
  {
    id: 'ash',
    title: '瀑边听水',
    sheep: '灰豆',
    art: ash,
    alt: '灰豆立在瀑布下游的草地上，身后飞过蝴蝶',
    edge: '#c1c8e3',
    dark: '#232a3f',
  },
];
