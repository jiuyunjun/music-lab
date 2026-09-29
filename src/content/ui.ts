import type { InstrumentId } from '../audio/instruments';

export const APP_COPY = {
  brand: 'Music Lab',
  brandSub: '音乐实验室',
  nav: {
    home: '首页',
    play: '乐器房',
    scales: '音阶实验室',
    chords: '和弦与进行',
    arrange: '编曲工作台',
  },
  volume: '音量',
  audioGate: '点一下任意位置，开启声音 🔈',
  comingSoon: '即将上线',
  comingSoonBody: '这个模块正在制作中，先去乐器房或音阶实验室玩玩吧。',
  errorTitle: '哎呀，这里出了点问题 😵',
  errorBody: '这个模块遇到了错误，其他页面不受影响。可以点“重试”，或者换个页面再回来。',
  errorRetry: '重试',
  footer:
    '钢琴采样：Salamander Grand Piano（Alexander Holm，CC-BY 3.0）· 吉他采样：tonejs-instruments / University of Iowa（CC-BY 3.0）',
};

export const HOME_COPY = {
  heroTitle: '先听见，再理解，再创造',
  heroBody: '不用会乐理。先在下面的键盘上随便按按——用鼠标、手指，或者电脑键盘的 A S D F…',
  cards: [
    { to: '/play', title: '乐器房', body: '三角钢琴、电钢、电子管风琴、合成器', ready: true },
    { to: '/scales', title: '音阶实验室', body: 'Dorian、Phrygian……一键听出每种调式的味道', ready: true },
    { to: '/chords', title: '和弦与进行', body: '卡农进行、4536，点一下就响', ready: true },
    { to: '/arrange', title: '编曲工作台', body: '琶音、扫弦、鼓点……像搭积木一样编曲', ready: false },
  ],
};

export const INSTRUMENT_COPY: Record<InstrumentId, { name: string; blurb: string }> = {
  piano: { name: '三角钢琴', blurb: '真实钢琴采样，最百搭的音色。' },
  epiano: { name: '电钢琴', blurb: 'Rhodes 风格，温暖圆润，Lo-fi 和 R&B 的灵魂。' },
  organ: { name: '电子管风琴', blurb: 'Hammond 风格。拉杆越往上，对应的泛音越响——试着调出你自己的音色。' },
  pad: { name: '合成器铺底', blurb: '柔和绵长的合成器音色，适合按住和弦慢慢听。' },
  bass: { name: '合成贝斯', blurb: '低沉圆润的贝斯，编曲里的“地基”。往低八度弹效果最好。' },
  guitar: { name: '吉他', blurb: '真实录音的钢弦木吉他，适合扫弦。' },
};

export const PLAY_COPY = {
  title: '乐器房',
  instrument: '音色',
  octave: '八度',
  octaveHelp: '电脑键盘：A W S E D F T G Y H U J K 弹奏，Z / X 切换八度',
  loading: '钢琴采样加载中，先用合成音色顶上…',
  drawbars: '音栓拉杆',
  drawbarsHelp: '每根拉杆控制一个泛音（“脚”数越小，音越高）。0 = 关，8 = 最响。',
  presets: '预设',
  organPresets: [
    { name: '经典爵士', value: '888000000' },
    { name: '福音全开', value: '888888888' },
    { name: '柔和长笛', value: '008000000' },
    { name: '摇滚', value: '888800000' },
    { name: '空灵', value: '800000888' },
  ],
};
