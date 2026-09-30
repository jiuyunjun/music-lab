# Music Lab 🎹🎸🥁

> 让音乐小白 **先听见，再理解，最后自己创造** 的网页音乐实验室。

看完一段《时之笛》的配乐解析，听到 “D Dorian”“E Phrygian” 觉得好好听，却不知道它们到底是什么？
听到卡农的和弦进行觉得很治愈，想自己也拼一段出来？

Music Lab 就是为这一刻准备的：

- **乐器房**：在浏览器里弹钢琴（三角钢琴 / 电钢 / 电子管风琴 / 合成器）、吉他、鼓机
- **音阶实验室**：同一个根音切换 Ionian → Dorian → Phrygian…，立刻听出每种调式的“味道”
- **和弦与进行**：卡农进行、4536、王道进行……点一下就能听，看懂 I–V–vi–IV 是什么意思
- **编曲工作台**：把「琶音」「分解和弦」「扫弦」「鼓点型」「卡农式模仿」等编曲手法当积木拼起来，做出自己的小曲子

## 文档

| 文档 | 内容 |
| --- | --- |
| [AGENTS.md](AGENTS.md) | 给 AI 编码助手 / 协作者的开发约定 |
| [DESIGN.md](DESIGN.md) | 产品与技术设计：模块、交互、架构 |
| [docs/ROADMAP.md](docs/ROADMAP.md) | 里程碑与待办 |
| [docs/CURRICULUM.md](docs/CURRICULUM.md) | 乐理内容大纲（教什么、按什么顺序教） |

## 快速开始

Windows 下直接双击 `start.bat`：首次运行会自动安装依赖，然后启动并打开浏览器。

或者手动：

```bash
npm install
npm run dev     # 打开 http://localhost:5173
```

电脑键盘弹奏：`A W S E D F T G Y H U J K`，`Z / X` 切换八度。

## 素材与许可

| 素材 | 来源 | 许可 |
| --- | --- | --- |
| 钢琴采样 `public/samples/salamander/` | Salamander Grand Piano，Alexander Holm | CC BY 3.0 |
| 吉他采样 `public/samples/guitar-acoustic/` | tonejs-instruments / University of Iowa | CC BY 3.0 |
| 帕赫贝尔卡农原谱数据 `src/content/pachelbel.ts` | Mutopia Project，Michael Fischer v. Mollard 制谱 | CC BY 4.0 |
| 爱的罗曼史原谱数据 `src/content/romance.ts` | Mutopia Project，Jeff Covey 制谱 | **CC BY-SA 2.5**（该文件同样以 CC BY-SA 2.5 发布） |

乐曲本身（帕赫贝尔《D 大调卡农》、《爱的罗曼史》）均为公有领域。详见 [public/samples/LICENSES.md](public/samples/LICENSES.md)。

## 状态

✅ M1 最小可玩版本：乐器房（钢琴 / 电钢 / 电子管风琴 / 合成器）+ 音阶实验室（7 种调式、平行/相对对比、Drone 即兴）。
🚧 下一步：和弦与进行（卡农进行等），见 [ROADMAP](docs/ROADMAP.md)。

技术栈：Vite + React 19 + TypeScript + Tone.js + tonal + Zustand。
