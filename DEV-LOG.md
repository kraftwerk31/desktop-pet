# 宠物名 - 开发记录

**最后更新**: 2026-04-08
**项目路径**: `D:/projects/Desktop Pet`

---

## 项目概况

桌面端注意力陪伴宠物，一只住在你电脑里的小猫咪，在屏幕上走来走去，走神时提醒你专注。

## 技术栈

- **框架**: Electron 41.x（跨 Win/Mac）
- **前端**: 原生 HTML/CSS/JS（零框架依赖）
- **包管理**: npm
- **动画**: 纯 CSS 动画 + JS 行为引擎（MVP阶段，后续可切换 Lottie/Spine2D）
- **设计语言**: 莫兰迪色系（Morandi Palette），暖橘色调

## 项目结构

```
D:/projects/Desktop Pet/
├── main.js               # Electron 主进程
│   ├── 透明全屏覆盖窗口（transparent + alwaysOnTop + frameless）
│   ├── 系统托盘（右键菜单：暂停/模式切换/设置/退出）
│   ├── 双击托盘切换暂停
│   ├── 防多开（requestSingleInstanceLock）
│   └── IPC 通信
│
├── preload.js             # 安全 IPC 桥接（contextBridge）
│   ├── setIgnoreMouseEvents / setFocusable
│   ├── onTogglePause / onSwitchMode / onDismissReminder
│   ├── onOpenSettings / onUpdateSettings
│   └── quitApp
│
├── src/
│   ├── index.html         # 宠物页面 + 设置面板
│   ├── css/pet.css        # 猫咪样式 + 动画 + 设置面板样式
│   ├── js/
│   │   ├── personalities.js # 人设系统（4 种性格文案 + 行为参数）
│   │   ├── pet.js         # 行为引擎（状态机+人设+移动+互动+提醒）
│   │   └── renderer.js    # 渲染进程入口（IPC+人设切换+设置面板逻辑）
│   └── assets/pet/        # 动画资源（待替换 Lottie）
│
├── package.json           # npm start 启动
└── DEV-LOG.md             # 本文件
```

## 当前状态：v0.3

### 已实现

- [x] Electron 透明覆盖窗口（全屏、置顶、无焦点、无阴影）
- [x] 点击穿透（宠物区域可点击，其他区域鼠标穿透）
- [x] **莫兰迪色系 UI** — 整套 CSS 变量系统（暖橘主色 + 奶油白 + 莫兰迪粉）
- [x] **精细橘猫 CSS 绘制** — M字额纹、身体条纹、双高光眼睛、3根胡须/侧、粉色肉垫、奶油胸斑、尾巴条纹+深色尾尖
- [x] **9 种状态动画**（idle / walking / stopping / reminding / happy / sleeping / sitting / blinking / dragging）
- [x] 猫咪在屏幕任意高度自由行走（拖到哪里就从哪里走）
- [x] 点击互动（跳跃/爱心/歪头/旋转/喵叫/扭动 + 随机趣味文案）
- [x] 定时提醒（走到中间 + 气泡提醒文案）
- [x] 对话气泡（13 条调皮提醒文案 + 多种互动文案）
- [x] 系统托盘（暂停/恢复 + **三种模式切换** + 设置 + 退出）
- [x] **拖拽功能** — 按住猫咪可拖到屏幕任意位置，5px 阈值区分点击和拖拽
- [x] **关闭按钮** — 鼠标悬停猫咪时右上角出现圆形关闭按钮，点击退出程序
- [x] **三种模式系统**：
  - **陪伴模式**: 猫咪走来走去、趴着、打哈欠，带摸鱼属性，定时走过来提醒
  - **注意力模式**: 猫咪完全隐藏，到时间从右侧跳出来喊一句调皮提醒，5秒后自动消失
  - **知识提醒**: 猫咪隐藏，到时间跳出并显示知识卡片（费曼学习法），用户点击确认后消失
- [x] **设置面板玻璃拟态** — backdrop-filter blur + 半透明背景 + 弹性动画
- [x] **模式专属设置** — 陪伴/注意力/知识各有独立间隔设置
- [x] **知识点管理** — 输入添加 + 回车快捷添加 + 列表展示 + 单条删除
- [x] **知识卡片 UI** — 毛玻璃卡片 + 弹性动画 + "知道了" 按钮
- [x] **眨眼动画** — 每 2.5-6 秒自动眨眼（idle/sitting 状态）
- [x] **行走节奏优化** — 3s/5s/7s/11s 随机间隔，更活泼
- [x] 防止多开
- [x] IPC 退出通道（quitApp）
- [x] **鼠标靠近反应** — 瞳孔跟随鼠标方向移动，靠近 120px 范围时偶尔显示"？"气泡
- [x] **时间感知系统** — 7 个时段（早晨/上午/中午/下午/傍晚/晚上/深夜），每时段不同行走速度和行为概率，首次启动和跨时段问候，连续工作 2 小时提醒休息
- [x] **交互记忆系统** — 连续快速点击递进反应（2次→微惊讶 / 3次→大惊讶 / 4+次→生气），提醒被忽略时文案变温柔/委屈，主动接受提醒时鼓励文案，长时间不互动猫咪主动找人
- [x] **人设系统（4 种性格）**：
  - ✨ **元气夸夸** — 快速走向鼠标、8 分钟找人、彩虹屁文案（高情绪价值）
  - 😏 **傲娇毒舌** — 不轻易靠近、15 分钟才找人、嘴硬心软
  - 🥺 **粘人精** — 走向鼠标、8 分钟找人、热情文案
  - 🎭 **戏精** — 快节奏、主动走向鼠标、夸张戏剧化文案
- [x] **暂停过渡动画** — 暂停时先打哈欠 → 1.5 秒后入睡（不再瞬间睡觉）
- [x] **拖拽放下反应** — 被放下后显示人设专属文案

### 待实现（P0 优先级）

- [ ] 开机自启
- [ ] 正式猫咪角色设计（替换 CSS → Lottie/Spine2D 动画）
- [ ] 第一天体验设计（怯怯探头→点击→惊喜→害羞跑开）

### 待实现（P1）

- [x] ~~智能提醒频率（连续忽略→降低频率）~~ → 已通过交互记忆系统实现（2026-04-09）
- [ ] 角色成长系统（使用时长→升级→解锁动作/皮肤）
- [ ] 工作数据统计（用情感化语言展示）
- [ ] 音效系统（可选开关）
- [ ] 快捷键系统（Esc 关闭提醒 + 自定义快捷键）
- [ ] 更多行走路线（不只是左右，偶尔跑到屏幕另一边探索）
- [ ] 用户自定义知识库导入/导出

## 关键设计决策

### 1. 窗口方案
- 全屏透明 BrowserWindow，覆盖所有显示器（多屏支持）
- `setIgnoreMouseEvents(true, { forward: true })` 实现点击穿透
- 宠物 DOM 元素上监听 `mouseenter`/`mouseleave` 动态切换穿透状态
- `focusable: false` 确保不抢焦点；设置面板打开时动态切换为 `focusable: true` 以支持文本输入

### 2. 宠物移动
- CSS `transition: left Xms ease-in-out` 驱动平滑移动
- 移动速度 0.15px/ms（自然漫步感）
- 活动范围：屏幕底部，距边缘各 60px
- 提醒时走到屏幕中间偏左

### 3. 三模式设计
- **陪伴模式 (Companion)**: 猫咪走来走去、坐下、发呆、打哈欠，偶尔提醒你专注。可拖拽互动。摸鱼属性。
- **注意力模式 (Focus)**: 猫咪完全隐藏。到设定时间从屏幕右侧跳出来说一句调皮提醒话，5秒后自动消失。
- **知识提醒 (Knowledge)**: 猫咪完全隐藏。到时间跳出并显示用户输入的知识卡片（费曼学习法），点击确认后消失。
- 每种模式独立计时器，通过系统托盘或设置面板切换
- 设置面板根据当前模式显示专属设置项

### 4. 行为引擎（状态机）
```
Companion 模式:
  idle → walking → idle/sitting/stopping
  idle → companionRemind → happy/dismissed
  idle → sleeping (暂停时)
  任何状态 → happy (点击互动)
  sitting/发呆/张望/打哈欠 随机切换

Focus 模式:
  hidden → popIn (从右侧跳入) → showing message → popOut (消失) → hidden

Knowledge 模式:
  hidden → popIn (跳入) → showKnowledgeCard → 等待用户确认 → popOut → hidden
```

### 5. 角色设计方向
- 橘猫，圆脸大眼
- 性格：有点调皮但很关心你
- 情绪：开心→冒爱心，睡觉→闭眼+zZz，提醒→大眼睛看你
- 后续：正式 Lottie/Spine2D 动画替换 CSS

## 已知问题

1. ~~托盘图标是纯橙色方块（需要设计正式图标）~~ → 已替换为像素猫脸图标（2026-04-08）
2. 设置面板中工作时段功能未接入实际逻辑
3. ~~知识点未持久化存储（关闭程序后丢失）~~ → 已通过 localStorage 持久化（2026-04-08）
4. ~~翻转方向（scaleX(-1)）在提醒状态下可能重置~~ → 已修复，引入 `_facingLeft` 状态追踪（2026-04-08）

## 启动方式

```bash
cd "D:/projects/Desktop Pet"
npm start
```

---

## 变更历史

### 2026-04-07 — UI 全面升级 + 三模式系统

**UI/视觉重构**：
- 从简陋的 64x72 CSS 猫 → 88x100px 精细橘猫（莫兰迪色系）
- 新增：M字额纹、身体条纹、双高光眼睛、粉色肉垫、3根胡须/侧、奶油胸斑、深色尾尖
- 全套莫兰迪色系 CSS 变量（暖橘 #D4A574 + 莫兰迪粉 #E8B4B8 + 奶油白 #F5EDE4）
- 设置面板改为玻璃拟态（backdrop-filter blur + 半透明）
- 按钮改为药丸形（border-radius: 9999px）
- 对话气泡改为弹性动画 + 毛玻璃

**动画增强**：
- 眨眼系统（每 2.5-6s 自动眨眼）
- 行走时左右爪交替抬起
- 提醒时尾巴竖起 + 耳朵前倾
- 开心时弯弯眼 (^ ^) + 爱心粒子
- 睡觉时慢呼吸 + zZz 浮动
- 新增 sitting 状态（猫咪坐下发呆）
- 新增 wiggle 互动反应（扭动身体）

**拖拽 + 退出**：
- 猫咪可拖拽到屏幕任意位置
- 拖到上方后行走保持该高度
- 鼠标悬停猫咪时右上角显示关闭按钮（×）
- 新增 quitApp IPC 通道（preload.js → main.js）

**三模式系统**（核心功能重构）：
- **陪伴模式**: 猫咪走动、坐下、发呆、互动，定时走过来提醒
- **注意力模式**: 猫咪完全隐藏，到时间从右侧跳出来喊一句，5s后自动消失
- **知识提醒**: 猫咪隐藏，到时间跳出显示知识卡片，用户确认后消失
- 系统托盘三模式单选切换
- 设置面板根据模式显示专属设置
- 知识点管理（输入/回车添加/删除）

**Bug 修复**：
- 修复拖拽打断自动行为的问题（只在真正拖动 >5px 时才打断）
- 修复猫咪拖到上方后自动行走时跳回底部（保持当前高度）
- 修复设置面板无法点击（给面板加 mouseenter/mouseleave 切换穿透）
- 修复 settings 面板 pointer-events 在 focus/knowledge 模式下的问题

**文案升级**：
- 提醒文本 13 条（"干嘛呢？别瞎想！"、"再不专心我挠你哦！"等调皮风格）
- 点击互动每种反应 3-4 条随机文案
- 闲逛行为（发呆/张望/打哈欠）各有多条随机文案

### 2026-04-08 — 全面优化：Timer 修复 + 持久化 + 多屏 + 语言统一

**严重 Bug 修复（Timer 管理不一致）**：
- 原代码混用 `this._timers` 对象与 `this.stateTimer` / `this.reminderTimer` / `this.blinkTimer` 三个独立属性
- `_clearAllTimers()` 只清 `_timers` 里的空引用，实际运行的定时器永远清不掉
- 切换模式时旧定时器继续运行 → 行为错乱、内存泄漏
- **修复**：全部统一为 `_setTimer(key, fn, delay)` / `_clearTimer(key)` / `_clearAllTimers()`，删除三个游离属性
- 影响方法：`walkTo`、`scheduleNextAction`、`startReminderTimer`、`startFocusTimer`、`startKnowledgeTimer`、`popIn`、`popOut`、`dismissReminder`、`dismissKnowledge`、`handleClick`、`onTogglePause`

**点击互动 Transform 累积 Bug 修复**：
- 原代码用 `style.transform += ' translateY(-20px)'` 追加变换
- 猫咪朝左时 `scaleX(-1)` 会被后续动画叠加覆盖
- **修复**：新增 `this._facingLeft` 状态追踪朝向，所有反应使用 `baseTransform + 变换` 组合

**设置面板输入框无法打字 Bug 修复**：
- 根因：窗口 `focusable: false` → 操作系统不传递键盘事件到渲染进程
- 输入框始终为空 → 点击添加按钮 → `addKnowledgePoint()` 因空字符串直接 return
- **修复**：
  - `preload.js` 新增 `setFocusable` IPC 通道
  - `main.js` 新增 `set-focusable` 处理（动态切换 `win.setFocusable()` + 自动 `focus()`）
  - `renderer.js` 打开设置面板时 `setFocusable(true)`，关闭时 `setFocusable(false)`

**设置持久化**：
- 使用 `localStorage` 存储所有用户配置（零依赖）
- 保存内容：模式选择、提醒间隔、专注间隔、知识间隔、知识点列表
- 启动时自动恢复上次配置（slider 值、模式按钮、知识点列表）
- 每次操作实时保存

**多显示器支持**：
- 原 `screen.getPrimaryDisplay()` 只覆盖主屏，拖到副屏越界
- **修复**：遍历 `screen.getAllDisplays()` 计算所有显示器的总 bounds，创建覆盖全屏的窗口

**托盘图标优化**：
- 从 16×16 纯色方块 → 像素猫脸图标（三角耳朵 + 圆脸 + 眼睛高光 + 粉色鼻子 + 嘴巴）
- 使用莫兰迪配色（橘色脸 + 深色眼 + 粉色鼻子）

**UI 全文中文化**：
- 标题、设置面板标签、按钮文案、占位符、模式描述全部统一为中文
- 知识卡片确认按钮 "Got it" → "知道了"
- Slider 显示单位 "min" → "分钟"

**代码清理**：
- 删除未使用的 CSS `@keyframes pop-in` / `pop-out`（~30 行）
- Speech bubble 增加 `max-width: 220px` + `text-overflow: ellipsis` 防溢出
- Window resize 事件增加 150ms 防抖

**涉及文件**：
- `main.js` — 多屏窗口创建 + 托盘图标重绘 + `set-focusable` IPC
- `preload.js` — 新增 `setFocusable` 暴露
- `src/js/pet.js` — Timer 统一管理 + Transform 修复 + resize 防抖
- `src/js/renderer.js` — localStorage 持久化 + focusable 联动
- `src/css/pet.css` — 删除死代码 + bubble 溢出修复
- `src/index.html` — 全文中文化

### 2026-04-03 — MVP v0.1 初始版本

- Electron 透明覆盖窗口
- CSS 绘制基础橘猫
- 6 种状态动画
- 点击互动 + 定时提醒
- 系统托盘 + 设置面板
- 双模式（陪伴/自律）

### 2026-04-09 — v0.3 情感陪伴升级：人设系统 + 鼠标感知 + 时间感知 + 交互记忆

**人设系统（核心新功能）**：
- 新增 `personalities.js` — 4 种完整人设定义（粘人精/傲娇毒舌/社恐温柔/戏精）
- 每种人设：25+ 文案类别、独立行为参数（行走速度/关注频率/说话延迟/是否走向鼠标）
- 设置面板 2x2 网格选择人设 + 人设描述文字
- 人设选择持久化到 localStorage
- 猫咪行为随人设实时变化

**鼠标靠近感知**：
- 瞳孔通过 CSS 变量 `--pupil-dx/--pupil-dy` 平滑追踪鼠标方向
- 进入 120px 范围时 30% 概率显示"？"反应气泡
- 使用 rAF 节流，零性能影响

**时间感知 + 日程行为**：
- 7 个时段（早晨/上午/中午/下午/傍晚/晚上/深夜）
- 每时段独立行走速度倍率和行为概率（走/坐/张望/打哈欠）
- 启动 2 秒后根据时段问候；每分钟检测跨时段自动问候
- 连续工作 2 小时主动走到中间提醒休息

**交互记忆**：
- 3 秒内快速点击递进反应：1 次→正常 / 2 次→微惊讶 / 3 次→大惊讶(耳朵竖起) / 4+次→生气(耳朵压平+眯眯眼)
- 连续忽略提醒→文案自动混入温柔/委屈版
- 连续接受提醒→文案混入鼓励版
- 深夜→提醒总是温柔
- 12 分钟不互动→猫咪走到鼠标附近找人（"你怎么不理我..."）
- 暂停时先打哈欠 → 1.5 秒过渡到睡觉
- 被放下后显示人设专属反应文案

**新增 CSS 状态**：
- `.annoyed` — 耳朵压平 + 眯眯眼 + 尾巴快速甩动
- `.surprised` — 大眼睛 + 耳朵竖起
- 瞳孔追踪 `transform` 平滑过渡

**代码架构变更**：
- `setState` 改用 `classList` 替代 `className`（保留 blink/proximity 等附加类）
- `showBubble` 支持延迟参数（社恐人设 600ms 说话犹豫）
- `walkTo` 速度 = 基础速度 × 时段倍率 × 人设倍率（三重叠加）
- Timer 系统新增 `seek`/`timeGreeting`/`reaction` 三个 key

**涉及文件**：
- `src/js/personalities.js` — 新建，4 种人设完整定义
- `src/js/pet.js` — 全面重构，接入人设/时间/感知/记忆系统
- `src/js/renderer.js` — 人设按钮处理 + 持久化
- `src/index.html` — 人设选择 UI + script 加载顺序
- `src/css/pet.css` — 瞳孔追踪 + 新状态样式 + 人设按钮样式
