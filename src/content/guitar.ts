export const INSTRUMENT_TABS = [
  { to: '/play', label: '🎹 键盘', end: true },
  { to: '/play/guitar', label: '🎸 吉他', end: false },
  { to: '/play/drums', label: '🥁 鼓机', end: false },
];

export const STRUM_PATTERN_COPY: Record<string, { name: string; help: string }> = {
  folk: { name: '民谣', help: '下 · 下上 · 上下上——最经典的扫弦节奏，几乎所有民谣都能用。' },
  pop: { name: '流行', help: '下 · 下 · 下上下上，前稳后密，副歌常用。' },
  eighths: { name: '八分下扫', help: '每个八分音符都往下扫，摇滚味十足。' },
  ballad: { name: '慢歌', help: '留出空间让和弦响，适合抒情歌。' },
  whole: { name: '一小节一下', help: '只扫一下，让和弦完整地响完。' },
};

export const GUITAR_COPY = {
  title: '吉他',
  intro: '左手在指板上按住和弦，右手扫弦。点下面的和弦看按法，再点“下扫 / 上扫”或者按键盘 ↓ ↑ 来扫。',
  chords: '和弦',
  keyChords: (key: string) => `${key} 调里的和弦`,
  openChords: '常用开放和弦',
  strumDown: '↓ 下扫',
  strumUp: '↑ 上扫',
  rhythm: '扫弦节奏型',
  rhythmHelp: 'D = 下扫，U = 上扫，- = 让和弦继续响。每个字母是一个八分音符。',
  play: '▶ 循环扫弦',
  stop: '■ 停止',
  showScale: '在指板上显示调内音',
  fretboardHelp: '竖线是品丝，点任意位置可以单独拨响那个音。x = 这根弦不弹，o = 空弦。',
  noShape: '这个和弦暂时没有吉他按法，会用钢琴的排列来弹。',
  strumHint: '键盘 ↓ 下扫，↑ 上扫',
};

export const OPEN_CHORD_NAMES = ['C', 'G', 'D', 'A', 'E', 'Am', 'Em', 'Dm', 'F', 'G7', 'E7', 'A7', 'Cmaj7', 'Dsus4', 'Asus2'];
