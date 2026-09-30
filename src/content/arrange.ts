import { DEFAULT_PROJECT, type Lane, type Project } from '../features/arrange/project';
import type { BassStyle } from '../theory/bass';
import type { MelodyStyle } from '../theory/song';
import { QUOTE_PIECES, type QuotePieceId } from './quotes';

export interface ArrangeTemplate {
  id: string;
  name: string;
  blurb: string;
  project: Project;
}

const base = DEFAULT_PROJECT;
const mixer = (overrides: Partial<Project['mixer']> = {}): Project['mixer'] => ({ ...base.mixer, ...overrides });

export interface QuoteExcerpt {
  id: string;
  name: string;
  start: number;
  cycles: number;
  help: string;
}

/** Names, explanations and excerpts of the written-out pieces. */
export const QUOTE_COPY: Record<QuotePieceId, { name: string; help: string; excerpts: QuoteExcerpt[] }> = {
  pachelbel: {
    name: '原版卡农',
    help: '帕赫贝尔《D 大调卡农》（约 1680 年，公有领域）第一小提琴的原版旋律。三把小提琴拉同一条旋律，每把晚一段进来。',
    excerpts: [
      { id: 'opening', name: '从头开始', start: 1, cycles: 8, help: '第一把小提琴进来，另外两把依次追上。' },
      { id: 'famous', name: '经典名段', start: 7, cycles: 5, help: '最有名的十六分音符段落（第 9–10 段）和它前后的铺垫。' },
      { id: 'second-half', name: '后半段', start: 15, cycles: 8, help: '重复音、跳音和装饰音，越来越华丽。' },
      { id: 'full', name: '完整版', start: 1, cycles: 27, help: '全部 27 段，大约 4 分钟。' },
    ],
  },
  romance: {
    name: '爱的罗曼史',
    help: '西班牙吉他名曲《爱的罗曼史》（19 世纪，作者不详，公有领域）。3/4 拍，一把吉他同时弹出低音、三连音分解和弦和旋律：每拍第一个音是旋律，后两个是分解和弦。前半段 e 小调，后半段转到 E 大调，豁然开朗。',
    excerpts: [
      { id: 'full', name: '完整（小调 ×2 + 大调 ×2）', start: 0, cycles: 4, help: '按原谱反复：小调段两遍，大调段两遍。' },
      { id: 'minor', name: '小调段', start: 0, cycles: 2, help: '最熟悉的那段忧伤旋律。' },
      { id: 'major', name: '大调段', start: 2, cycles: 2, help: '转到 E 大调，情绪一下变得明亮温暖。' },
    ],
  },
};

/** Song settings plus the default excerpt for a piece, to apply when it's chosen. */
export function quoteSettings(piece: QuotePieceId, excerpt: QuoteExcerpt = QUOTE_COPY[piece].excerpts[0]!) {
  const { song } = QUOTE_PIECES[piece];
  return { ...song, cycles: excerpt.cycles, excerpt: excerpt.start };
}

export const ARRANGE_TEMPLATES: ArrangeTemplate[] = [
  {
    id: 'romance',
    name: '爱的罗曼史（吉他）',
    blurb: '西班牙吉他名曲原谱：3/4 拍三连音分解和弦，小调段两遍后转到 E 大调。',
    project: {
      ...base,
      ...QUOTE_PIECES.romance.song,
      cycles: 4,
      drums: { on: false, preset: 'pop' },
      bass: { on: false, style: 'root' },
      harmony: { on: false, instrument: 'guitar', pattern: 'pima', strum: 'folk' },
      melody: { on: true, instrument: 'guitar', style: 'quote', seed: 1, double: false, piece: 'romance', excerpt: 0 },
      tricks: { build: false, fill: false, lift: false },
      mixer: mixer(),
    },
  },
  {
    id: 'pachelbel',
    name: '帕赫贝尔原版卡农',
    blurb: '原曲第一小提琴的真实旋律（经典名段），另外两把小提琴依次晚一段追进来——这就是真正的卡农。',
    project: {
      ...base,
      ...QUOTE_PIECES.pachelbel.song,
      bpm: 104,
      cycles: 5,
      drums: { on: false, preset: 'pop' },
      bass: { on: true, style: 'root' },
      harmony: { on: true, instrument: 'pad', pattern: 'pad', strum: 'folk' },
      melody: { on: true, instrument: 'piano', style: 'quote', seed: 1, double: false, piece: 'pachelbel', excerpt: 7 },
      tricks: { build: false, fill: false, lift: false },
      mixer: mixer({ harmony: { volume: 0.4, muted: false } }),
    },
  },
  {
    id: 'canon-piano',
    name: '卡农风钢琴',
    blurb: 'D 大调卡农，8 遍一气呵成：旋律越来越密，第 6 遍冲上高潮（升高八度、全体加倍），再慢慢回落，停在主和弦上。',
    project: {
      ...base,
      keyChroma: 2,
      mode: 'ionian',
      bpm: 66,
      progression: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
      beatsPerChord: 2,
      cycles: 8,
      drums: { on: false, preset: 'pop' },
      bass: { on: true, style: 'root' },
      // Held chords underneath, like Pachelbel's continuo: they support the voices without crowding their register.
      harmony: { on: true, instrument: 'pad', pattern: 'pad', strum: 'folk' },
      melody: { on: true, instrument: 'piano', style: 'canon', seed: 11, double: false, piece: 'pachelbel', excerpt: 1 },
      tricks: { build: false, fill: false, lift: false },
      mixer: mixer({ harmony: { volume: 0.55, muted: false } }),
    },
  },
  {
    id: 'lofi',
    name: 'Lo-fi 电钢',
    blurb: 'ii–V–I 爵士和弦 + 电钢 + 带摇摆的嘻哈鼓，适合学习时循环。',
    project: {
      ...base,
      keyChroma: 5,
      mode: 'ionian',
      bpm: 80,
      progression: ['ii7', 'V7', 'Imaj7', 'vi7'],
      beatsPerChord: 4,
      cycles: 3,
      drums: { on: true, preset: 'boombap' },
      bass: { on: true, style: 'root' },
      harmony: { on: true, instrument: 'epiano', pattern: 'block', strum: 'folk' },
      melody: { on: true, instrument: 'epiano', style: 'generated', seed: 5, double: false, piece: 'pachelbel', excerpt: 1 },
      tricks: { build: true, fill: false, lift: false },
      mixer: mixer({ drums: { volume: 0.7, muted: false } }),
    },
  },
  {
    id: 'flamenco',
    name: '西班牙 Phrygian 吉他',
    blurb: 'E Phrygian：Em → F 只差半步，吉他扫弦立刻有了弗拉门戈的味道。',
    project: {
      ...base,
      keyChroma: 4,
      mode: 'phrygian',
      bpm: 104,
      progression: ['i', 'bII', 'bIII', 'bII'],
      beatsPerChord: 4,
      cycles: 3,
      drums: { on: false, preset: 'pop' },
      bass: { on: true, style: 'root' },
      harmony: { on: true, instrument: 'guitar', pattern: 'strum', strum: 'folk' },
      melody: { on: true, instrument: 'guitar', style: 'generated', seed: 21, double: false, piece: 'pachelbel', excerpt: 1 },
      tricks: { build: true, fill: false, lift: false },
      mixer: mixer(),
    },
  },
  {
    id: 'pop-rock',
    name: '流行摇滚',
    blurb: '1564 四和弦 + 摇滚鼓 + 八分贝斯 + 吉他扫弦，最后一遍升调推高潮。',
    project: {
      ...base,
      keyChroma: 7,
      mode: 'ionian',
      bpm: 116,
      progression: ['I', 'V', 'vi', 'IV'],
      beatsPerChord: 4,
      cycles: 4,
      drums: { on: true, preset: 'rock' },
      bass: { on: true, style: 'pulse' },
      harmony: { on: true, instrument: 'guitar', pattern: 'strum', strum: 'eighths' },
      melody: { on: true, instrument: 'piano', style: 'generated', seed: 8, double: true, piece: 'pachelbel', excerpt: 1 },
      tricks: { build: true, fill: true, lift: true },
      mixer: mixer(),
    },
  },
  {
    id: 'disco-dorian',
    name: 'Dorian 放克',
    blurb: '音阶实验室里的 Dorian i–IV 来回，配上 Disco 四踩和八度贝斯，马上能跳舞。',
    project: {
      ...base,
      keyChroma: 9,
      mode: 'dorian',
      bpm: 116,
      progression: ['i7', 'IV7'],
      beatsPerChord: 4,
      cycles: 4,
      drums: { on: true, preset: 'disco' },
      bass: { on: true, style: 'octave' },
      harmony: { on: true, instrument: 'epiano', pattern: 'block', strum: 'folk' },
      melody: { on: true, instrument: 'organ', style: 'generated', seed: 3, double: false, piece: 'pachelbel', excerpt: 1 },
      tricks: { build: true, fill: true, lift: false },
      mixer: mixer(),
    },
  },
  {
    id: 'bossa',
    name: 'Bossa Nova',
    blurb: '巴西风：七和弦、根音-五音贝斯、慵懒的 Bossa 鼓。',
    project: {
      ...base,
      keyChroma: 0,
      mode: 'ionian',
      bpm: 126,
      progression: ['Imaj7', 'vi7', 'ii7', 'V7'],
      beatsPerChord: 4,
      cycles: 3,
      drums: { on: true, preset: 'bossa' },
      bass: { on: true, style: 'rootFifth' },
      harmony: { on: true, instrument: 'guitar', pattern: 'broken', strum: 'folk' },
      melody: { on: true, instrument: 'epiano', style: 'generated', seed: 14, double: false, piece: 'pachelbel', excerpt: 1 },
      tricks: { build: false, fill: false, lift: false },
      mixer: mixer({ drums: { volume: 0.7, muted: false } }),
    },
  },
];

export const LANE_COPY: Record<Lane, { name: string; icon: string; help: string }> = {
  drums: { name: '鼓', icon: '🥁', help: '节奏的骨架：决定这首歌是“走”还是“跳”。' },
  bass: { name: '贝斯', icon: '🎸', help: '连接鼓和和弦的地基：弹根音，让和弦站稳。' },
  harmony: { name: '和声', icon: '🎹', help: '和弦用什么“织体”弹出来，决定了整首歌的质感。' },
  melody: { name: '旋律', icon: '🎵', help: '大家会哼出来的那条线。' },
};

export const BASS_STYLE_COPY: Record<BassStyle, { name: string; help: string }> = {
  root: { name: '根音长音', help: '每个和弦只弹一下根音，最稳。' },
  pulse: { name: '八分律动', help: '根音连续八分音符，摇滚的推动力。' },
  octave: { name: '八度跳跃', help: '低-高-低-高，Disco 和放克的标志。' },
  rootFifth: { name: '根音-五音', help: '第 1 拍根音、第 3 拍五音，乡村和 Bossa 常用。' },
  walking: { name: '行走贝斯', help: '每拍一个音，最后半音滑向下一个和弦——爵士的走路感。' },
};

export const MELODY_STYLE_COPY: Record<MelodyStyle, { name: string; help: string }> = {
  generated: { name: '自动旋律', help: '强拍落在和弦音上、其他音按音阶一步步走，每小节节奏重复。每一遍旋律相同，好记。' },
  quote: {
    name: '名曲原谱',
    help: '照原谱演奏一首名曲（见下方曲目）。选中时会自动换成原曲的和弦、拍子和速度。',
  },
  canon: {
    name: '卡农（自动生成）',
    help: '像帕赫贝尔的卡农：每一遍的旋律都比上一遍更密（二分 → 四分 → 八分 → 十六分音符），前两遍的旋律会依次“追”进来。每一拍都落在和弦音上，所以几个声部叠在一起也和谐。重复 6 遍以上时会自动安排高潮（分解和弦 → 升高八度、全体加倍、最响），然后回落，最后停在主和弦上。',
  },
};

export const TRICK_COPY = {
  build: { name: '逐层进入', help: '第 1 遍只有和声，第 2 遍加入贝斯和鼓，第 3 遍旋律进来。让歌曲慢慢“长”起来。' },
  fill: { name: '鼓过门', help: '每遍最后一拍用通鼓“咚咚咚咚”过渡，下一遍开头一声吊镲——告诉听众“新段落来了”。' },
  lift: { name: '最后一遍升调', help: '最后一遍整体升高半音，流行歌最后一段副歌的经典“提气”手法。' },
};

export const ARRANGE_COPY = {
  title: '编曲工作台',
  intro: '一首歌 = 和弦进行 × 四条轨道 × 编曲手法。先点一个模板听听，再一样一样改，听每个改动带来的变化。',
  templates: '从模板开始',
  song: '歌曲',
  key: '调',
  mode: '调式',
  modeHelp: '换调式时，和弦会按同样的级数换成新调式里的和弦（“调式替换”），旋律也会跟着换音阶。',
  bpm: '速度',
  beatsPerChord: '每个和弦',
  beats: (n: number) => `${n} 拍`,
  cycles: '重复',
  times: (n: number) => `${n} 遍`,
  progression: '和弦进行',
  progressionHelp: '每个格子是一个和弦，下拉可以换成调内的其他和弦。',
  addChord: '+ 和弦',
  removeChord: '− 和弦',
  loadProgression: '载入经典进行…',
  tracks: '轨道',
  on: '开',
  mute: '静音',
  solo: '独奏',
  volume: '音量',
  instrument: '音色',
  texture: '织体',
  strum: '扫弦型',
  drumPreset: '鼓型',
  bassStyle: '贝斯型',
  melodyStyle: '旋律',
  reroll: '🎲 换一段旋律',
  double: '八度加厚',
  doubleHelp: '再叠一个低八度，旋律更厚、更有力量。',
  tricks: '编曲技巧',
  play: '▶ 播放整首',
  stop: '■ 停止',
  position: (cycle: number, cycles: number) => `第 ${cycle} / ${cycles} 遍`,
  ending: '尾声',
  excerpt: '从哪里开始',
  quoteNeedsOriginal: '原谱是按原曲的和弦和拍子写的，改了会不和谐或对不上拍。',
  useOriginalSong: '恢复原曲设置',
  threeFour: '（3/4 拍）',
  seekHelp: '点击时间轴上的某一遍，直接跳到那里播放。',
  share: '🔗 复制分享链接',
  copied: '已复制！发给朋友，打开就是这首歌。',
  copyFailed: '复制失败，请手动复制地址栏里的链接。',
  reset: '重置',
  loadedFromLink: '已从分享链接载入这首歌。',
  badLink: '这个分享链接好像不完整，没能载入。',
  timeline: '整首歌一览',
  timelineHelp: '横轴是时间，每一行是一条轨道。开关编曲技巧，看看画面怎么变。',
};
