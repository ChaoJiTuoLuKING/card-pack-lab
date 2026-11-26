import type { Pull } from '../cards';
import whaleSnack from '../assets/whale-snack.webp';
import whaleToken from '../assets/whale-token.webp';
import whaleDance from '../assets/whale-dance.webp';
import whaleHeadphones from '../assets/whale-headphones.webp';
import whaleChef from '../assets/whale-chef.webp';
import whaleNap from '../assets/whale-nap.webp';

export const whaleSeries: Pull[] = [
  {
    card: {
      id: 'whale-snack',
      title: '私房零食',
      sheep: '大肥鱼',
      art: whaleSnack,
      alt: '大肥鱼抱着自己的私房零食',
      hint: '慢慢靠近她的零食袋，看看她会把它藏在哪儿',
      edge: '#f5d39d',
      dark: '#352a3a',
    },
    finish: 'amber',
  },
  {
    card: {
      id: 'whale-token',
      title: '给点Token嘛',
      sheep: '大肥鱼',
      art: whaleToken,
      alt: '大肥鱼向你讨要 Token',
      hint: '左右移动让她递碗，向下滑把金币送到碗里',
      edge: '#acdede',
      dark: '#142f42',
    },
    finish: 'dew',
  },
  {
    card: {
      id: 'whale-dance',
      title: '毛线帽跳舞',
      sheep: '大肥鱼',
      art: whaleDance,
      alt: '戴毛线帽的大肥鱼跳起了舞',
      hint: '左右划换舞步，往上移让她跳起；点卡面重看整支舞',
      edge: '#d6b8ff',
      dark: '#2e1747',
    },
    finish: 'astral',
  },
  {
    card: {
      id: 'whale-headphones',
      title: '耳机里的军师',
      sheep: '大肥鱼',
      art: whaleHeadphones,
      alt: '大肥鱼按住珊瑚色耳机，一手拿着摊开的作战笔记',
      hint: '左右移动，让她侧耳听两边的信号',
      edge: '#a9cce7',
      dark: '#233b59',
    },
    finish: 'dew',
  },
  {
    card: {
      id: 'whale-chef',
      title: '深夜小厨',
      sheep: '大肥鱼',
      art: whaleChef,
      alt: '戴厨师帽的大肥鱼守着小铜锅，用木勺尝汤',
      hint: '向上移让她抬勺尝汤，左右划让热气飘开',
      edge: '#edc47b',
      dark: '#47301c',
    },
    finish: 'amber',
  },
  {
    card: {
      id: 'whale-nap',
      title: '抱鲸午睡',
      sheep: '大肥鱼',
      art: whaleNap,
      alt: '大肥鱼穿着淡紫色睡衣，抱着蓝鲸玩偶蜷成一团',
      hint: '轻抚蓝鲸的脸，看她低头抱紧玩偶',
      edge: '#d1b9e3',
      dark: '#363052',
    },
    finish: 'dew',
  },
];
