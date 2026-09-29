import type { MelodyStep } from '../theory/events';
import type { ModeId } from '../theory/modes';

export interface ModeCopy {
  name: string;
  zh: string;
  mood: string;
  /** Plain-language explanation of the characteristic note. */
  colour: string;
  /** Where a listener may have heard it. Text references only, no original melodies. */
  heardIn: string;
  /**
   * The mode's signature two-chord vamp (roman numerals from the tonic). The
   * second chord contains the characteristic note, so rocking between them
   * makes the mode's colour obvious.
   */
  vamp: [home: string, colour: string];
  /** Plain-language note on the vamp. */
  vampNote: string;
  /**
   * Self-composed demo melody in degrees, 5 bars of 16 sixteenths:
   * bars 1-4 over home / colour / home / colour, bar 5 back home.
   */
  demo: MelodyStep[];
}

export const MODE_COPY: Record<ModeId, ModeCopy> = {
  ionian: {
    name: 'Ionian',
    zh: '伊奥尼亚（就是大调）',
    mood: '明亮、开心、稳稳的',
    colour: '第 7 个音离“家”只差半步，总想往上回到主音——这种“想回家”的感觉就是大调的底色。',
    heardIn: '《小星星》、大多数儿歌和欢快的流行歌',
    vamp: ['I', 'V'],
    vampNote: 'I → V：V 和弦里有第 7 音，一听就想回到 I。',
    demo: [
      [1, 0, 4], [3, 0, 4], [5, 0, 6], [4, 0, 2],
      [2, 0, 4], [7, -1, 4], [2, 0, 4], [5, 0, 4],
      [3, 0, 4], [5, 0, 4], [1, 1, 6], [7, 0, 2],
      [6, 0, 4], [5, 0, 4], [4, 0, 2], [2, 0, 2], [7, -1, 4],
      [1, 0, 16],
    ],
  },
  dorian: {
    name: 'Dorian',
    zh: '多利亚',
    mood: '有点忧郁，但不沉重；酷、带点民谣和爵士味',
    colour: '它是小调，但第 6 个音比普通小调高了半音（大六度）。就是这一个音，让“伤感”里透出一丝光。',
    heardIn: '英国民谣《斯卡布罗集市》、Santana《Oye Como Va》，很多游戏配乐的解析里也会提到它',
    vamp: ['i', 'IV'],
    vampNote: 'i → IV：小和弦走到一个“意外明亮”的大和弦，那个亮就来自第 6 音。',
    demo: [
      [5, 0, 4], [3, 0, 2], [4, 0, 2], [5, 0, 4], [1, 1, 4],
      [6, 0, 6], [5, 0, 2], [4, 0, 4], [2, 0, 4],
      [3, 0, 4], [4, 0, 2], [5, 0, 2], [7, 0, 4], [5, 0, 4],
      [4, 0, 2], [5, 0, 2], [6, 0, 12],
      [1, 0, 16],
    ],
  },
  phrygian: {
    name: 'Phrygian',
    zh: '弗里几亚',
    mood: '神秘、异域、带西班牙弗拉门戈的味道',
    colour: '第 2 个音紧贴着主音，只高半步（小二度）。旋律一在这两个音之间来回，就有强烈的异域张力。',
    heardIn: '弗拉门戈吉他、很多金属乐 riff、电影里的沙漠/神殿场景',
    vamp: ['i', 'bII'],
    vampNote: 'i → ♭II：整个和弦只往上挪半步，就是西班牙味的来源。',
    demo: [
      [5, 0, 4], [4, 0, 2], [3, 0, 2], [2, 0, 4], [1, 0, 4],
      [2, 0, 6], [4, 0, 2], [6, 0, 4], [4, 0, 4],
      [3, 0, 4], [2, 0, 2], [1, 0, 2], [7, -1, 4], [1, 0, 4],
      [4, 0, 4], [3, 0, 2], [2, 0, 10],
      [1, 0, 16],
    ],
  },
  lydian: {
    name: 'Lydian',
    zh: '利底亚',
    mood: '梦幻、飘浮、像在飞',
    colour: '它是大调，但第 4 个音被升高了半音（增四度）。这个音不肯“落地”，听起来就像悬在空中。',
    heardIn: '《辛普森一家》主题曲、许多电影里“飞起来”“看到奇景”的配乐段落',
    vamp: ['I', 'II'],
    vampNote: 'I → II：两个大和弦只差一个全音，第二个和弦里藏着那个升高的第 4 音。',
    demo: [
      [1, 0, 4], [3, 0, 4], [5, 0, 4], [3, 0, 4],
      [4, 0, 6], [5, 0, 2], [6, 0, 4], [4, 0, 4],
      [5, 0, 4], [3, 0, 2], [2, 0, 2], [1, 0, 4], [3, 0, 4],
      [2, 0, 4], [6, 0, 4], [4, 0, 8],
      [1, 0, 16],
    ],
  },
  mixolydian: {
    name: 'Mixolydian',
    zh: '混合利底亚',
    mood: '阳光、随性、摇滚和布鲁斯的感觉',
    colour: '它是大调，但第 7 个音降低了半音（小七度），少了“急着回家”的紧张，多了一份松弛和痞气。',
    heardIn: 'Lynyrd Skynyrd《Sweet Home Alabama》、披头士《Norwegian Wood》',
    vamp: ['I', 'bVII'],
    vampNote: 'I → ♭VII：摇滚乐最爱的“往下退一步”，♭VII 的根音就是降低的第 7 音。',
    demo: [
      [1, 0, 2], [3, 0, 2], [5, 0, 4], [3, 0, 2], [5, 0, 2], [1, 1, 4],
      [7, 0, 6], [6, 0, 2], [4, 0, 4], [2, 0, 4],
      [3, 0, 4], [5, 0, 4], [6, 0, 2], [5, 0, 2], [3, 0, 4],
      [4, 0, 4], [2, 0, 4], [7, -1, 8],
      [1, 0, 16],
    ],
  },
  aeolian: {
    name: 'Aeolian',
    zh: '爱奥利亚（就是自然小调）',
    mood: '伤感、深沉、抒情',
    colour: '第 6 个音是小六度——和 Dorian 只差这一个音，却暗了不少。试试在两者之间来回切换！',
    heardIn: '大多数“小调”的抒情流行歌和影视悲伤配乐',
    vamp: ['i', 'bVI'],
    vampNote: 'i → ♭VI：♭VI 的根音就是那个“更暗”的第 6 音，和 Dorian 的 i → IV 对比一下。',
    demo: [
      [1, 0, 4], [3, 0, 4], [5, 0, 6], [4, 0, 2],
      [3, 0, 4], [1, 0, 4], [6, -1, 8],
      [5, -1, 4], [1, 0, 4], [3, 0, 4], [2, 0, 4],
      [1, 0, 4], [6, -1, 4], [3, 0, 8],
      [1, 0, 16],
    ],
  },
  locrian: {
    name: 'Locrian',
    zh: '洛克利亚',
    mood: '不安、悬疑、站不稳',
    colour: '连第 5 个音都降了半音（减五度），主和弦本身就不稳定，所以很少有整首歌用它，但做悬疑气氛一流。',
    heardIn: '恐怖/悬疑配乐、部分金属乐片段',
    vamp: ['i°', 'bV'],
    vampNote: 'i° → ♭V：两个和弦的根音隔着“三全音”（魔鬼音程），连“家”都是个减和弦，怎么听都站不稳。',
    demo: [
      [1, 0, 4], [3, 0, 2], [5, 0, 6], [3, 0, 4],
      [5, 0, 6], [7, 0, 2], [2, 1, 8],
      [5, 0, 4], [4, 0, 2], [3, 0, 2], [2, 0, 4], [1, 0, 4],
      [7, 0, 4], [5, 0, 4], [2, 0, 8],
      [1, 0, 16],
    ],
  },
};

export const SCALE_LAB_COPY = {
  title: '音阶实验室',
  intro: '选一个根音，点下面的调式。每换一种调式，听听“情绪”有什么变化。',
  zeldaHint:
    '你在视频里听到的 D Dorian 和 E Phrygian，其实用的是同一组白键——只是“家”（主音）不同。切到“相对”模式试试看。',
  rootLabel: '根音',
  rootHelp: '根音 = 这段音乐的“家”，旋律最后回到这里会觉得踏实。',
  compareLabel: '对比方式',
  parallel: '平行：同一个家，换调式',
  parallelHelp: '根音不变，只换调式，最容易听出每种调式的“情绪”。',
  relative: '相对：同一组音，换起点',
  relativeHelp: '一组音不变（比如全部白键），从不同的音开始当“家”，就得到不同的调式。',
  sharesKeysWith: (major: string) => `这组音和 ${major} 大调完全一样`,
  playScale: '▶ 听音阶',
  playDemo: '▶ 听示范',
  stop: '■ 停止',
  backing: '带伴奏（贝斯 + 和弦）',
  backingHelp:
    '调式的味道来自旋律和“家”的关系。关掉伴奏再听一遍——D Dorian 的旋律会变得像普通的 C 大调，因为耳朵找不到“家”了。',
  vamp: '标志和弦',
  droneOn: '开启持续低音（Drone）',
  droneOff: '关闭持续低音',
  droneHelp: '底下一直响着根音，你只管按亮着的键即兴——怎么按都好听。',
  lockLabel: '只允许按调内音',
  mood: '情绪',
  colourNote: '灵魂音',
  heardIn: '在哪听过',
  brightness: '从明亮到暗淡',
  demoNote: '示范旋律为本站原创，用来演示调式的味道。',
};
