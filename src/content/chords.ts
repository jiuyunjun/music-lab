import type { KeyMode } from '../store';
import type { HarmonicFunction } from '../theory/chords';
import type { PatternId } from '../theory/patterns';

export interface ProgressionPreset {
  id: string;
  name: string;
  /** Roman numerals relative to the tonic. */
  romans: string[];
  /** Suggested key (tonic pitch class) and mode. */
  key: string;
  mode: KeyMode;
  bpm: number;
  beatsPerChord: number;
  pattern: PatternId;
  story: string;
  heardIn: string;
}

export const PROGRESSIONS: ProgressionPreset[] = [
  {
    id: 'canon',
    name: '卡农进行',
    romans: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
    key: 'D',
    mode: 'ionian',
    bpm: 72,
    beatsPerChord: 2,
    pattern: 'arpeggio',
    story: '来自帕赫贝尔《D 大调卡农》（约 1700 年，公有领域）。低音一路往下走，像慢慢走下楼梯，温柔又治愈。',
    heardIn: '婚礼音乐的常客；Maroon 5《Memories》等许多流行歌都借用过它',
  },
  {
    id: 'royal-road',
    name: '4536（王道进行）',
    romans: ['IVmaj7', 'V', 'iii7', 'vi'],
    key: 'C',
    mode: 'ionian',
    bpm: 88,
    beatsPerChord: 4,
    pattern: 'broken',
    story: '日本流行乐里的“王道进行”：从 IV 出发，在 V 推高情绪，最后落到小和弦 vi，又甜又带点伤感。',
    heardIn: '大量动漫歌曲和 J-Pop 副歌',
  },
  {
    id: 'axis',
    name: '1564（流行四和弦）',
    romans: ['I', 'V', 'vi', 'IV'],
    key: 'C',
    mode: 'ionian',
    bpm: 100,
    beatsPerChord: 4,
    pattern: 'block',
    story: '可能是流行乐里用得最多的四个和弦，循环起来怎么都顺。',
    heardIn: "Journey《Don't Stop Believin'》、Jason Mraz《I'm Yours》",
  },
  {
    id: 'fifties',
    name: '1645（50 年代进行）',
    romans: ['I', 'vi', 'IV', 'V'],
    key: 'C',
    mode: 'ionian',
    bpm: 96,
    beatsPerChord: 4,
    pattern: 'alberti',
    story: '50 年代 Doo-wop 的招牌，复古、甜美，最后的 V 总让人想回到开头。',
    heardIn: 'Ben E. King《Stand By Me》等老歌',
  },
  {
    id: 'blues',
    name: '12 小节布鲁斯',
    romans: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'],
    key: 'A',
    mode: 'ionian',
    bpm: 100,
    beatsPerChord: 4,
    pattern: 'block',
    story: '布鲁斯的骨架：12 小节一轮，全用属七和弦，摇滚乐就是从这里长出来的。',
    heardIn: '几乎所有布鲁斯和早期摇滚乐',
  },
  {
    id: 'andalusian',
    name: '安达卢西亚终止',
    romans: ['i', 'bVII', 'bVI', 'V'],
    key: 'A',
    mode: 'aeolian',
    bpm: 96,
    beatsPerChord: 4,
    pattern: 'arpeggio',
    story: '从主和弦一路往下走到 V，是弗拉门戈和西班牙风的标志。最后的 V 是大和弦，借用了“和声小调”升高的第 7 音。',
    heardIn: 'Ray Charles《Hit the Road Jack》',
  },
];

export const PATTERN_COPY: Record<PatternId, { name: string; help: string }> = {
  block: { name: '柱式', help: '所有音一起按下，最直接有力。' },
  pad: { name: '长音铺底', help: '按住不放，适合慢歌和氛围。' },
  broken: { name: '分解和弦', help: '一个一个音往上再往下，流动感强。' },
  arpeggio: { name: '琶音', help: '一路往上爬到高八度，像竖琴。' },
  alberti: { name: 'Alberti 低音', help: '低-高-中-高，古典钢琴（莫扎特）最爱的伴奏型。' },
  strum: { name: '吉他扫弦', help: '用吉他按法“下 · 下上 · 上下上”地扫，配吉他音色最像。' },
};

export const FUNCTION_COPY: Record<HarmonicFunction, { name: string; help: string }> = {
  T: { name: '主', help: '家：稳定，有结束感' },
  SD: { name: '下属', help: '出发：离开家去走走' },
  D: { name: '属', help: '紧张：很想回家' },
};

export const CHORD_COLOURS: { type: string; name: string; mood: string }[] = [
  { type: '', name: '大三和弦', mood: '明亮、开心' },
  { type: 'm', name: '小三和弦', mood: '柔和、忧伤' },
  { type: 'dim', name: '减三和弦', mood: '紧张、不安' },
  { type: 'aug', name: '增三和弦', mood: '悬疑、梦幻、没着落' },
  { type: 'sus2', name: '挂二和弦', mood: '空灵、开放（没有三音，不分大小调）' },
  { type: 'sus4', name: '挂四和弦', mood: '悬着，很想落回大三和弦' },
  { type: 'maj7', name: '大七和弦', mood: '温柔、高级、都市感' },
  { type: '7', name: '属七和弦', mood: '想回家的张力，布鲁斯味' },
  { type: 'm7', name: '小七和弦', mood: '慵懒、R&B 感' },
  { type: 'add9', name: '加九和弦', mood: '明亮里带一点闪光' },
];

export const CHORDS_COPY = {
  title: '和弦与进行',
  intro: '三个或更多的音同时响，就是和弦。先点点看这个调里的 7 个和弦，再听听经典的和弦进行。',
  key: '调',
  keyHelp: '调 = 这首歌以哪个音为“家”。换调只是整体变高变低，味道不变。',
  major: '大调',
  minor: '小调',
  bpm: '速度',
  bpmUnit: '拍/分钟',
  instrument: '和弦音色',
  diatonicTitle: '这个调里的 7 个和弦',
  diatonicHelp: '把音阶里的音“隔一个取一个”叠起来，就得到这 7 个和弦。罗马数字表示它从第几个音开始：大写 = 大和弦，小写 = 小和弦。',
  sevenths: '加上第 4 个音（七和弦）',
  functionLegend: '和弦的角色',
  colourTitle: '给和弦换个颜色',
  colourHelp: (root: string) => `同样以 ${root} 为根音，只改变上面的音，情绪就完全不同。`,
  progressionsTitle: '经典和弦进行',
  progressionsHelp: '和弦按顺序连起来就是“和弦进行”，它是一首歌的骨架。点一个试试：',
  pattern: '伴奏织体',
  patternHelp: '同一组和弦，换一种“弹法”，听起来就像另一首歌。',
  play: '▶ 循环播放',
  stop: '■ 停止',
  heardIn: '在哪听过',
  pickChord: '点一个和弦听听看',
};
