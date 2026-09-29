# AGENTS.md

本文件写给参与本项目的 AI 编码助手（Claude Code、Codex、Cursor 等）和人类协作者。开始任何改动前先读完本文件和 [DESIGN.md](DESIGN.md)。

## 项目一句话

面向**零基础用户**的网页音乐实验室：弹乐器、听音阶/调式、玩和弦进行、用编曲手法拼出自己的音乐。核心原则是 **“先听见，再理解，再创造”**。

## 技术栈

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 构建 | Vite | 纯前端 SPA，无后端 |
| 框架 | React 19 + TypeScript（strict） | |
| 路由 | react-router（`HashRouter`） | Hash 路由，静态托管无需服务器重写配置 |
| 音频 | [Tone.js](https://tonejs.github.io/) | 统一的 Transport / 调度 / 合成器 / 采样器 |
| 乐理 | [tonal](https://github.com/tonaljs/tonal) **固定 6.4.3** | 音名、音程、音阶、和弦、罗马数字级数。6.5.0 发布包的 `main`/`types` 指向不存在的文件，升级前先验证 |
| 状态 | Zustand | 全局播放状态、编曲工程 |
| 样式 | CSS Modules + CSS 变量（设计 token） | 不引入重型 UI 库 |
| 测试 | Vitest（+ Testing Library） | `src/theory` 必须有单元测试 |

> 如需引入新依赖，先在 PR / 对话中说明理由；音频和乐理相关优先复用 Tone.js 与 tonal，不要手写一套。

## 常用命令

```bash
npm install
npm run dev        # 本地开发（http://localhost:5173）
npm run build      # 类型检查 + 生产构建
npm run test       # Vitest
npm run lint       # ESLint + tsc --noEmit
```

## 已有的关键模块

- `audio/engine.ts`：`ensureAudioStarted()` / `withAudio(fn)` / `getMasterBus()`，所有乐器都连到主总线
- `audio/instruments/`：`getInstrument(id)` 懒加载并缓存；`piano`（Salamander 采样，加载前用合成音兜底）、`epiano`（FM + tremolo）、`organ`（9 根拉杆加法合成，振荡器低一个八度以容纳 16' 拉杆）、`pad`（也用作 Drone）
- `audio/sequencer.ts`：`playPhrase(instrument, NoteEvent[])` 用 `Tone.Part` 在 Transport 上播放，`Tone.Draw` 同步高亮
- `theory/`：`modes.ts`（调式、特征音、相对/平行关系、根音拼写）、`events.ts`（级数旋律 → `NoteEvent[]`）、`keyboard.ts`（键位、电脑键盘映射）
- `components/PianoKeyboard`：多点触控 + 滑奏，`markFor` 按级数着色，`lockToScale` 锁定调内音
- 文案：`content/ui.ts`、`content/modes.ts`

## 目录结构（约定）

```
src/
  audio/         # 音频引擎：AudioContext 启动、乐器工厂、效果链、Transport 封装
    instruments/ # piano.ts, epiano.ts, organ.ts, guitar.ts, drums.ts ...
  theory/        # 纯函数乐理层（不依赖 DOM / Tone），100% 可单测
  features/
    instruments/ # 乐器房：键盘、指板、鼓垫
    scales/      # 音阶 / 调式实验室
    chords/      # 和弦与和弦进行
    arrange/     # 编曲工作台（轨道、编曲手法积木）
  components/    # 通用 UI 组件（Keyboard、Fretboard、StepGrid、DegreeBadge…）
  content/       # 课程文案、示例曲目数据（JSON/TS，数据与代码分离）
  styles/        # 设计 token、全局样式
public/samples/  # 音频采样（注意许可证，见下文）
docs/            # 项目文档
```

## 编码约定

- **代码、标识符、注释用英文；UI 文案用简体中文**，文案集中放在 `src/content/`，不要散落在组件里。
- 分层依赖方向：`features → components/audio/theory`，`audio → theory`，**`theory` 不依赖任何其他层**。
- 音符在内部统一用 **科学音高记法字符串**（`"C4"`, `"F#3"`）或 MIDI 数字；换算一律走 `tonal`，禁止手写 `+12`/音名数组之类的临时换算。
- 升降号拼写要正确：F 大调里是 `Bb` 不是 `A#`。用 tonal 的调内拼写，而不是 chromatic 数组取模。
- 时间统一用 Tone.js 的 Transport 时间（`"4n"`, `"0:2:0"`）调度，不要用 `setTimeout` 播放音符。

## 音频规则（重要）

1. **AudioContext 只能在用户手势后启动**：所有入口通过 `audio/engine.ts` 的 `ensureAudioStarted()`（内部调用 `Tone.start()`）。
2. 全局只有一个 Tone 上下文与一条主输出链（master volume → limiter → destination），防止爆音。
3. 乐器实例懒加载、复用；组件卸载或切换音色时调用 `.dispose()`，避免内存与节点泄漏。
4. 采样加载要有 loading 状态；加载前可以先用合成音色兜底，保证“点了就有声音”。
5. 延迟敏感：键盘/鼓垫触发走 `triggerAttack` 立即发声，不要等待 React 状态更新后再发声。

## 版权 / 许可证

- 采样只使用明确允许再分发的资源（如 Salamander Grand Piano CC-BY、CC0 鼓采样），在 `public/samples/LICENSES.md` 中记录来源与许可证。
- **不要**内置受版权保护的游戏/流行歌曲原曲旋律全文（如塞尔达配乐）。可以：
  - 讲解其使用的调式/手法，并用**自创的同风格短旋律**演示；
  - 使用公有领域作品（如帕赫贝尔《D 大调卡农》）。

## 乐理正确性

- `src/theory` 的每个导出函数都要有测试，测试用例写真实音乐例子（如 “D Dorian = D E F G A B C”）。
- 教学文案中的乐理说法要准确；不确定时宁可简化，也不要说错。给小白的比喻可以放在文案里，但数据层要严谨。

## 提交与协作

- Commit message：`<type>: <简短描述>`，type ∈ `feat | fix | docs | refactor | test | chore | style`，描述可用中文。
- 一次提交只做一件事；新增功能同步更新 `docs/ROADMAP.md` 的勾选状态。
- 改动交互或架构时，同步更新 `DESIGN.md`。

## 完成定义（Definition of Done）

- `npm run lint` 与 `npm run test` 通过
- 新交互在桌面 Chrome 与移动端 Safari/Chrome 下能发声
- 新 UI 文案无乐理术语“裸奔”：出现术语时要有一句大白话解释或悬浮提示
