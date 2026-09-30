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

export const DRUM_GROUPS = [
  { id: 'pop', name: '流行 / 摇滚' },
  { id: 'groove', name: '律动 / 爵士' },
  { id: 'dance', name: '电子 / 舞曲' },
  { id: 'world', name: '拉丁 / 世界' },
  { id: 'other', name: '其他' },
] as const;
export type DrumGroup = (typeof DRUM_GROUPS)[number]['id'];

export interface DrumPreset {
  id: string;
  name: string;
  group: DrumGroup;
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
    group: 'pop',
    name: '流行',
    bpm: 100,
    swing: 0,
    swingSubdivision: '16n',
    pattern: { kick: 'X.....x.X.......', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' },
    help: '底鼓在 1、3 拍附近，军鼓在 2、4 拍，闭镲数八分音符——绝大多数流行歌的骨架。',
  },
  {
    id: 'rock',
    group: 'pop',
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
    group: 'dance',
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
    group: 'world',
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
    group: 'groove',
    name: 'Shuffle 摇摆',
    bpm: 96,
    swing: 0.65,
    swingSubdivision: '8n',
    pattern: { kick: 'X.......X.x.....', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' },
    help: '八分音符“长-短-长-短”地走，布鲁斯和爵士的摇摆感。试着把“摇摆”滑块拉到 0 对比一下。',
  },
  {
    id: 'boombap',
    group: 'groove',
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
    group: 'world',
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

  // --- pop / rock ---
  {
    id: 'punk',
    group: 'pop',
    name: '朋克',
    bpm: 176,
    swing: 0,
    swingSubdivision: '16n',
    pattern: {
      crash: 'X...............',
      kick: 'X...X...X...X...',
      snare: '..X...X...X...X.',
      hat: 'x.x.x.x.x.x.x.x.',
    },
    help: '又快又直：底鼓踩正拍、军鼓打反拍，“动-次-动-次”一路冲。',
  },
  {
    id: 'halftime',
    group: 'pop',
    name: '半拍慢歌',
    bpm: 72,
    swing: 0,
    swingSubdivision: '16n',
    pattern: {
      kick: 'X.....x...X.....',
      snare: '........X.......',
      hat: 'x.x.x.x.x.x.x...',
      openHat: '..............x.',
    },
    help: '军鼓只在第 3 拍打一下，感觉速度慢了一半，适合抒情歌和副歌前的蓄力。',
  },
  {
    id: 'motown',
    group: 'pop',
    name: '摩城 Motown',
    bpm: 116,
    swing: 0,
    swingSubdivision: '16n',
    pattern: {
      kick: 'X.x...x.X.x...x.',
      snare: 'x...X...x...X...',
      hat: 'x.x.x.x.x.x.x.x.',
    },
    help: '60 年代灵魂乐：军鼓每一拍都敲（2、4 拍重），轻快又有弹性。',
  },

  // --- groove / jazz ---
  {
    id: 'funk',
    group: 'groove',
    name: '放克 Funk',
    bpm: 100,
    swing: 0.1,
    swingSubdivision: '16n',
    pattern: {
      kick: 'X.x...x...X..x..',
      snare: '....X..x.x..X..x',
      hat: 'XxxxXxxxXxxxXx.x',
      openHat: '..............x.',
    },
    help: '十六分音符的闭镲 + 切分的底鼓 + 轻轻的“鬼音”军鼓（小写 x），身体会自己跟着晃。',
  },
  {
    id: 'swing',
    group: 'groove',
    name: '爵士摇摆 Swing',
    bpm: 132,
    swing: 0.66,
    swingSubdivision: '8n',
    pattern: {
      hat: 'x...X.x.x...X.x.',
      kick: 'x.......x.......',
      snare: '..........x...x.',
    },
    help: '镲片打“叮—叮嗒—叮—叮嗒”（ride 节奏），八分音符长短交替，爵士乐的心跳。',
  },

  // --- dance / electronic ---
  {
    id: 'house',
    group: 'dance',
    name: 'House',
    bpm: 124,
    swing: 0,
    swingSubdivision: '16n',
    pattern: {
      kick: 'X...X...X...X...',
      clap: '....X.......X...',
      hat: 'xx.xxx.xxx.xxx.x',
      openHat: '..X...X...X...X.',
    },
    help: '和 Disco 一样四踩，但闭镲更密、开镲在反拍“嚓”，俱乐部舞曲的标准律动。',
  },
  {
    id: 'trap',
    group: 'dance',
    name: 'Trap',
    bpm: 140,
    swing: 0,
    swingSubdivision: '16n',
    pattern: {
      kick: 'X.....x...X.x...',
      clap: '........X.......',
      hat: 'x.x.x.xxx.x.xxxx',
    },
    help: '现代说唱：拍手只在第 3 拍（半拍感），闭镲时不时连打成一串。',
  },
  {
    id: 'dnb',
    group: 'dance',
    name: 'Drum & Bass',
    bpm: 172,
    swing: 0,
    swingSubdivision: '16n',
    pattern: {
      kick: 'X.........X.....',
      snare: '....X.......X...',
      hat: 'x.x.x.x.x.x.x.x.',
    },
    help: '非常快的“两步”节奏：底鼓在 1 和第 3 拍后半，军鼓在 2、4 拍，速度感十足。',
  },

  // --- latin / world ---
  {
    id: 'samba',
    group: 'world',
    name: '桑巴 Samba',
    bpm: 100,
    swing: 0,
    swingSubdivision: '16n',
    pattern: {
      kick: 'x...X...x...X...',
      hat: 'XxxxXxxxXxxxXxxx',
      tomHigh: 'X.x.x.X.x.X.x.x.',
    },
    help: '巴西狂欢节：低音鼓在第 2、4 拍加重，十六分音符不停，高音鼓敲出跳跃的花样。',
  },
  {
    id: 'reggae',
    group: 'world',
    name: '雷鬼 One Drop',
    bpm: 76,
    swing: 0.55,
    swingSubdivision: '8n',
    pattern: {
      kick: '........X.......',
      snare: '........X.......',
      hat: 'x.X.x.X.x.X.x.X.',
    },
    help: '牙买加雷鬼：第 1 拍什么都不打，底鼓和军鼓一起落在第 3 拍（“One Drop”），悠闲又有空间。',
  },

  // --- other ---
  {
    id: 'march',
    group: 'other',
    name: '进行曲',
    bpm: 112,
    swing: 0,
    swingSubdivision: '16n',
    pattern: {
      crash: 'X.......X.......',
      kick: 'X.......X.......',
      snare: 'X.xxX.x.X.xxX.x.',
    },
    help: '军乐队的步伐：底鼓“左—右”，军鼓不停地滚动小花，吊镲在 1、3 拍。',
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
