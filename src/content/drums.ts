import type { DrumPattern, DrumPiece } from '../theory/drums';

export const DRUM_PIECE_COPY: Record<DrumPiece, { name: string; key: string; help: string }> = {
  kick: { name: '底鼓', key: 'A', help: '最低沉的“咚”，乐曲的心跳' },
  snare: { name: '军鼓', key: 'S', help: '清脆的“啪”，通常在第 2、4 拍' },
  clap: { name: '拍手', key: 'D', help: '电子乐里常用来代替军鼓' },
  hat: { name: '闭镲', key: 'F', help: '细碎的“嚓”，负责数拍子' },
  openHat: { name: '开镲', key: 'G', help: '拖长的“嚓——”，制造推动感' },
  tomLow: { name: '低音通鼓', key: 'H', help: '过门（fill）时用' },
  tomHigh: { name: '高音通鼓', key: 'J', help: '过门（fill）时用' },
  crash: { name: '吊镲', key: 'K', help: '段落开头“嚓——”地一下' },
};

export interface DrumPreset {
  id: string;
  name: string;
  bpm: number;
  swing: number;
  /** Which note value gets swung: eighths for a shuffle, sixteenths for hip-hop. */
  swingSubdivision: '8n' | '16n';
  pattern: DrumPattern;
  help: string;
}

export const DRUM_PRESETS: DrumPreset[] = [
  {
    id: 'pop',
    name: '流行',
    bpm: 100,
    swing: 0,
    swingSubdivision: '16n',
    pattern: { kick: 'X.....x.X.......', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' },
    help: '底鼓在 1、3 拍附近，军鼓在 2、4 拍，闭镲数八分音符——绝大多数流行歌的骨架。',
  },
  {
    id: 'rock',
    name: '摇滚',
    bpm: 120,
    swing: 0,
    swingSubdivision: '16n',
    pattern: {
      crash: 'X...............',
      kick: 'X.......X.x.....',
      snare: '....X.......X...',
      hat: 'X.x.x.x.X.x.x.x.',
    },
    help: '和流行很像，但更用力：重音更多，开头一下吊镲。',
  },
  {
    id: 'disco',
    name: 'Disco 四踩',
    bpm: 118,
    swing: 0,
    swingSubdivision: '16n',
    pattern: {
      kick: 'X...X...X...X...',
      clap: '....X.......X...',
      hat: 'x...x...x...x...',
      openHat: '..x...x...x...x.',
    },
    help: '每一拍都踩底鼓（four on the floor），开镲在反拍“嚓”——一听就想跳舞。',
  },
  {
    id: 'bossa',
    name: 'Bossa Nova',
    bpm: 128,
    swing: 0,
    swingSubdivision: '16n',
    pattern: {
      kick: 'X..xX..xX..xX..x',
      snare: 'x..x..x...x..x..',
      hat: 'x.x.x.x.x.x.x.x.',
    },
    help: '巴西的慵懒节奏：底鼓像心跳“咚—咚”，军鼓敲出一个不规则的循环（clave）。',
  },
  {
    id: 'shuffle',
    name: 'Shuffle 摇摆',
    bpm: 96,
    swing: 0.65,
    swingSubdivision: '8n',
    pattern: { kick: 'X.......X.x.....', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' },
    help: '八分音符“长-短-长-短”地走，布鲁斯和爵士的摇摆感。试着把“摇摆”滑块拉到 0 对比一下。',
  },
  {
    id: 'boombap',
    name: '嘻哈 Boom Bap',
    bpm: 88,
    swing: 0.3,
    swingSubdivision: '16n',
    pattern: {
      kick: 'X......x..X.....',
      snare: '....X.......X...',
      hat: 'x.x.x.x.x.xxx.x.',
    },
    help: '“Boom（底鼓）- Bap（军鼓）”，带一点十六分音符的摇摆，90 年代嘻哈的味道。',
  },
  {
    id: 'dembow',
    name: '雷鬼动 Dembow',
    bpm: 95,
    swing: 0,
    swingSubdivision: '16n',
    pattern: {
      kick: 'X...X...X...X...',
      snare: '...x..x....x..x.',
      hat: 'x.x.x.x.x.x.x.x.',
    },
    help: '拉丁流行的招牌：“咚—嗒 咚—嗒”，军鼓落在 3+3+2 的位置。',
  },
];

export const DRUMS_COPY = {
  title: '鼓机',
  intro: '点格子放鼓点：每一横行是一种鼓，每一列是一个十六分音符，4 列 = 1 拍。点一次 = 普通，两次 = 重音，三次 = 清除。',
  presets: '节奏型',
  bpm: '速度',
  swing: '摇摆',
  swingHelp: '把反拍往后推一点，节奏就从“直”变成“晃”。',
  play: '▶ 播放',
  stop: '■ 停止',
  clear: '清空',
  pads: '鼓垫（也可以用电脑键盘）',
  beat: (n: number) => `第 ${n} 拍`,
};
