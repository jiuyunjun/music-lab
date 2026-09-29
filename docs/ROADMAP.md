# ROADMAP

完成一项就勾选，并在提交信息里引用。

## M0 立项与脚手架
- [x] git init，基础文档（README / AGENTS / DESIGN / ROADMAP / CURRICULUM）
- [x] Vite + React + TS 脚手架，ESLint / Vitest
- [ ] Prettier
- [x] 安装 Tone.js、tonal、Zustand
- [x] `audio/engine.ts`：`ensureAudioStarted()`、主输出链（音量 + limiter）
- [x] 设计 token（颜色、级数色轮）；浅色/深色跟随系统

## M1 钢琴 + 音阶实验室（最小可玩版本）
- [x] 屏幕钢琴键盘组件（多点触控 + 滑奏 + 电脑键盘映射 + 切八度）
- [x] 音色：合成钢琴兜底 → Salamander 采样钢琴
- [x] 电钢（FM）、电子管风琴（drawbar，可调拉杆 + 预设）、合成器铺底
- [x] `theory/modes`：7 种调式 + 特征音 + 相对/平行关系，附单测
- [x] 调式明暗条 + 平行/相对对比模式
- [x] Drone 即兴模式 + “只允许按调内音”锁定
- [x] 每种调式的原创示范旋律
- [x] 示范改为 旋律 + 铺底和弦 + 贝斯 三层编排；每个调式配“标志和弦”（Dorian i–IV 等），可关伴奏对比
- [x] 主总线轻混响；各音色音量平衡（旋律比伴奏高约 6–8 dB）
- [ ] 真机验证：桌面 Chrome、iOS Safari、Android Chrome 发声与延迟
- [ ] 代码分包（Tone.js 单独 chunk，当前主包约 578 KB / gzip 167 KB）

## M2 和弦与进行
- [x] `theory/chords`（罗马数字 → 和弦、调内和弦、功能、声部连接）、`theory/patterns`（伴奏织体），附单测
- [x] 调内 7 和弦（可切七和弦）+ 主/下属/属 功能标签
- [x] 和弦换色：大/小/减/增/sus2/sus4/maj7/7/m7/add9
- [x] 经典进行预设：卡农、4536（王道）、1564、1645、12 小节布鲁斯、安达卢西亚终止
- [x] 5 种伴奏织体：柱式、长音铺底、分解、琶音、Alberti；循环播放、当前和弦高亮
- [x] 全局调 / BPM（播放中实时变速）
- [ ] 自定义进行：自己拖和弦排序
- [ ] 顶栏全局播放/停止

## M3 吉他 + 打击乐
- [ ] 吉他指板组件 + 常用和弦按法
- [ ] Karplus-Strong 吉他音色，扫弦（弦间延迟）
- [ ] 鼓采样（CC0）+ 鼓垫
- [ ] 16 步音序器

## M4 编曲工作台
- [ ] Project / Track / PatternSpec 数据模型
- [ ] Pattern 生成器：柱式、琶音、Alberti、扫弦型、贝斯型、鼓点型
- [ ] 卡农式模仿、调内约束随机旋律
- [ ] 转调、调式替换
- [ ] 轨道 Mute / Solo / 音量
- [ ] 风格模板（卡农风钢琴、Lo-fi 电钢、Phrygian 西班牙吉他…）

## M5 学习路径与分享
- [ ] 课程框架（听 → 试 → 总结 → 去用）
- [ ] 按 CURRICULUM 实现前 6 课
- [ ] localStorage 保存工程；URL 分享
- [ ] 导出 MIDI

## 以后再说
- Web MIDI 输入（接实体 MIDI 键盘）
- 导出 WAV
- 五声音阶 / 布鲁斯 / 和声小调等扩展音阶
- 听力训练小游戏
- PWA 离线
