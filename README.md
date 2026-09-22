About The Project

As a landscape architect, my work requires long hours in front of a computer. I found myself remaining seated for too long, frequently forgetting to take standing breaks or stay hydrated.

To address this, I developed this desktop reminder utility. It uses animated pop-ups featuring four distinctively quirky kittens to prompt me to drink water and take breaks. While it is currently a basic personal application, I plan to iterate on it gradually, refining the features over time to make it more robust and highly personalized.

I don't know how to code; I rely entirely on "Vibe Coding" to get things done.


## 0.4.0 — 真实猫咪 GIF 本地升级版

基于 GitHub main 提交 b6bf11c（2026-06-04）。保留所有原始 GIF、四种性格、中英日西四种语言，以及休息活动/喝水两类提醒。此版本在本地分支 improve-gif-companion 开发，未自动推送到 GitHub。

### 本次升级

- 修复走路、睡觉、提醒映射到错误 GIF，以及初始待机图片不显示的问题。
- GIF 加载完成后遵循保存的模式；托盘和设置面板共用模式状态。
- 原始图片不改写，以相同底部基线显示；表情停留时长按素材动画调整。
- 提醒提供完成、5分钟后、跳过，30秒未处理自动收起。同一时刻到期的两类提醒合并，其余排队；普通点击不算完成提醒。
- 休息活动和喝水各自开关，切换模式保留稍后提醒的截止时间。
- 新增一小时安静陪伴、固定位置、75%～175%大小、活动屏幕选择；新增文案支持四种语言。
- 安静时间暂停提醒和主动对话，结束后重新计时；仍可拖动猫咪。
- 使用时长按运行会话累计，本地午夜分日；亲密等级按累计陪伴天数，忙碌和跳过提醒不扣心情。
- 设置滚动适配小屏，气泡自动换行并限制在可见区域；显示器断开后回到主屏工作区。

### 本地使用与验证

源码位于当前文件所在文件夹。首次在独立环境使用时运行 npm install；npm start 启动。

- npm test：运行 Node 回归测试。
- npm run test:ui：隐藏的 Electron 离屏交互测试，使用 out/verification/test-profile 独立存档。
- npm run build：标准 Windows 安装包。
- npm run build:local：用于本机的无签名构建，跳过 Windows 可执行文件资源编辑，避免工具解压时的符号链接权限问题；程序 EXE 的图标/版本资源可能保留 Electron 默认值。

安装包名称为 Desktop-Pet-GIF-Setup-0.4.0.exe，位于 dist。运行免安装目录时需保留 dist/win-unpacked 整个目录，不能只复制其中一个 EXE。

自动验证覆盖 GIF 资源加载、四语言按钮、两种窗口尺寸、设置重新加载，以及模拟的显示器插拔。真实多屏混合缩放、系统鼠标穿透、开机启动和物理休眠仍需目标电脑体验确认。应用日常存档与测试存档隔离；测试不修改 GitHub 远端。
