# GIF companion upgrade plan

Goal: Upgrade GitHub b6bf11c while preserving all original GIF assets, four personalities, four languages and two reminder types.
Architecture: Main owns mode/display preferences. Renderer restores preferences before starting the GIF engine. SpriteManager owns aliases and per-action presentation. Reminder queue separates health actions from ambient behaviors. Existing growth regression fixes are ported with tests.
Stack: Electron 41, vanilla JavaScript/CSS, Node test runner.

1. Port regression tests and add failing GIF state tests; run node --test.
2. Repair sprite aliases, preload/startup ordering, expression timing, image presentation.
3. Port growth-only fixes and centralized mode/display IPC while retaining translated tray and auto-start path handling.
4. Adapt reminder queue to healthBreak/healthWater, explicit localized actions, quiet deadline and locked position.
5. Localize new controls in zh-CN/en/ja/es; add pet size and viewport clamping.
6. Run tests, native Electron offscreen interaction and GIF screenshots in two sizes and four languages. Build distinct 0.4.0 GIF package and verify archive source/assets. No push or installation.
