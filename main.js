const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
let selectedDisplay = null;
let preferencesLoaded = false;
function savePreferences() {
  fs.writeFileSync(path.join(app.getPath('userData'), 'preferences.json'), JSON.stringify({ mode: currentMode, displayId: selectedDisplay }));
}
function displayState() {
  return { mode: currentMode, displayId: selectedDisplay, autoStart: app.getLoginItemSettings({ path: process.execPath }).openAtLogin, displays: screen.getAllDisplays().map((d, i) => ({ id: d.id, label: d.label || ('显示器 ' + (i + 1)) })) };
}
function placeOnDisplay() {
  const display = screen.getAllDisplays().find(d => d.id === selectedDisplay) || screen.getPrimaryDisplay();
  selectedDisplay = display.id;
  if (mainWindow) mainWindow.setBounds(display.workArea);
}




let mainWindow = null;
let tray = null;
let isPaused = false;
let currentMode = 'companion';
let currentLanguage = 'zh-CN';

const TRAY_I18N = {
  'zh-CN': {
    title: '🐾 桌面宠物',
    pause: '⏸ 暂停',
    resume: '▶ 恢复',
    companion: '🐾 陪伴模式',
    reminder: '🔔 提醒模式',
    settings: '⚙ 设置...',
    stats: '📊 打卡',
    quit: '👋 再见~',
    tooltip: '桌面宠物 - 你的小伙伴',
  },
  en: {
    title: '🐾 Desktop Pet',
    pause: '⏸ Pause',
    resume: '▶ Resume',
    companion: '🐾 Companion mode',
    reminder: '🔔 Reminder mode',
    settings: '⚙ Settings...',
    stats: '📊 Check-in',
    quit: '👋 Bye~',
    tooltip: 'Desktop Pet - Your little companion',
  },
  ja: {
    title: '🐾 デスクトップペット',
    pause: '⏸ 一時停止',
    resume: '▶ 再開',
    companion: '🐾 相棒モード',
    reminder: '🔔 通知モード',
    settings: '⚙ 設定...',
    stats: '📊 記録',
    quit: '👋 またね~',
    tooltip: 'デスクトップペット - 小さな相棒',
  },
  es: {
    title: '🐾 Mascota de escritorio',
    pause: '⏸ Pausar',
    resume: '▶ Reanudar',
    companion: '🐾 Modo compañía',
    reminder: '🔔 Modo recordatorio',
    settings: '⚙ Ajustes...',
    stats: '📊 Registro',
    quit: '👋 Adiós~',
    tooltip: 'Mascota de escritorio - Tu pequeña compañía',
  },
};

function trayText() {
  return TRAY_I18N[currentLanguage] || TRAY_I18N['zh-CN'];
}

// Tray icon: simple cat face (16x16)
function createTrayIcon() {
  const size = 16;
  const pixels = Buffer.alloc(size * size * 4, 0);

  function setPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
    pixels[i + 3] = a;
  }

  // Orange: 212,165,116  Dark: 74,63,53  Pink: 232,180,184
  const OR = 212, OG = 165, OB = 116;
  const DR = 74,  DG = 63,  DB = 53;
  const PR = 232, PG = 180, PB = 184;

  // Left ear (triangle: rows 1-4)
  setPixel(3, 1, OR, OG, OB, 255); setPixel(4, 1, OR, OG, OB, 255);
  setPixel(3, 2, OR, OG, OB, 255); setPixel(4, 2, OR, OG, OB, 255);
  setPixel(2, 3, OR, OG, OB, 255); setPixel(3, 3, PR, PG, PB, 255); setPixel(4, 3, OR, OG, OB, 255); setPixel(5, 3, OR, OG, OB, 255);
  setPixel(2, 4, OR, OG, OB, 255); setPixel(3, 4, OR, OG, OB, 255); setPixel(4, 4, OR, OG, OB, 255); setPixel(5, 4, OR, OG, OB, 255);

  // Right ear (triangle: rows 1-4)
  setPixel(11, 1, OR, OG, OB, 255); setPixel(12, 1, OR, OG, OB, 255);
  setPixel(11, 2, OR, OG, OB, 255); setPixel(12, 2, OR, OG, OB, 255);
  setPixel(10, 3, OR, OG, OB, 255); setPixel(11, 3, OR, OG, OB, 255); setPixel(12, 3, PR, PG, PB, 255); setPixel(13, 3, OR, OG, OB, 255);
  setPixel(10, 4, OR, OG, OB, 255); setPixel(11, 4, OR, OG, OB, 255); setPixel(12, 4, OR, OG, OB, 255); setPixel(13, 4, OR, OG, OB, 255);

  // Head (rows 4-11): rounded rectangle
  for (let y = 4; y <= 11; y++) {
    for (let x = 2; x <= 13; x++) {
      // Skip corners for rounding
      if ((y === 4 || y === 11) && (x === 2 || x === 13)) continue;
      setPixel(x, y, OR, OG, OB, 255);
    }
  }

  // Eyes (rows 6-8)
  // Left eye
  setPixel(4, 6, DR, DG, DB, 255); setPixel(5, 6, DR, DG, DB, 255);
  setPixel(4, 7, DR, DG, DB, 255); setPixel(5, 7, 255, 255, 255, 255);
  setPixel(4, 8, DR, DG, DB, 255); setPixel(5, 8, DR, DG, DB, 255);
  // Right eye
  setPixel(10, 6, DR, DG, DB, 255); setPixel(11, 6, DR, DG, DB, 255);
  setPixel(10, 7, 255, 255, 255, 255); setPixel(11, 7, DR, DG, DB, 255);
  setPixel(10, 8, DR, DG, DB, 255); setPixel(11, 8, DR, DG, DB, 255);

  // Nose (row 9)
  setPixel(7, 9, PR, PG, PB, 255); setPixel(8, 9, PR, PG, PB, 255);

  // Mouth (row 10)
  setPixel(6, 10, DR, DG, DB, 255);
  setPixel(7, 10, DR, DG, DB, 255); setPixel(8, 10, DR, DG, DB, 255);
  setPixel(9, 10, DR, DG, DB, 255);

  return nativeImage.createFromBuffer(pixels, {
    width: size,
    height: size,
    scaleFactor: 1.0,
  });
}

function createPetWindow() {
  const area = screen.getPrimaryDisplay().workArea;
  mainWindow = new BrowserWindow({
    ...area,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    focusable: false,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.setVisibleOnAllWorkspaces(true);
  mainWindow.on('closed', () => { mainWindow = null; });
}

function buildTrayMenu() {
  const t = trayText();
  return Menu.buildFromTemplate([
    { label: t.title, enabled: false },
    { type: 'separator' },
    {
      label: isPaused ? t.resume : t.pause,
      click: () => {
        isPaused = !isPaused;
        if (mainWindow) mainWindow.webContents.send('toggle-pause', isPaused);
        updateTray();
      },
    },
    { type: 'separator' },
    {
      label: t.companion,
      type: 'radio',
      checked: currentMode === 'companion',
      click: () => { setMode('companion'); },
    },
    {
      label: t.reminder,
      type: 'radio',
      checked: currentMode === 'reminder',
      click: () => { setMode('reminder'); },
    },
    { type: 'separator' },
    {
      label: t.settings,
      click: () => { openSettings(); },
    },
    {
      label: t.stats,
      click: () => {
        if (mainWindow) mainWindow.webContents.send('show-stats');
      },
    },
    { type: 'separator' },
    {
      label: t.quit,
      click: () => { app.quit(); },
    },
  ]);
}

function updateTray() {
  if (tray) {
    tray.setToolTip(trayText().tooltip);
    tray.setContextMenu(buildTrayMenu());
  }
}

function setMode(mode) {
  if (!['companion', 'reminder'].includes(mode)) return;
  currentMode = mode;
  if (mainWindow) mainWindow.webContents.send('switch-mode', mode);
  savePreferences();
  updateTray();
}

function openSettings() {
  if (mainWindow) {
    mainWindow.webContents.send('open-settings');
  }
}

// --- IPC ---
ipcMain.handle('initialize-settings', (_event, legacy) => {
  if (!preferencesLoaded) {
    if (legacy && ['companion', 'reminder'].includes(legacy.mode)) currentMode = legacy.mode;
    preferencesLoaded = true;
  }
  placeOnDisplay();
  savePreferences();
  updateTray();
  return displayState();
});
ipcMain.handle('set-mode', (_event, mode) => { setMode(mode); return currentMode; });
ipcMain.handle('select-display', (_event, id) => {
  if (screen.getAllDisplays().some(d => d.id === id)) selectedDisplay = id;
  placeOnDisplay(); savePreferences(); return displayState();
});
ipcMain.handle('auto-start', (_event, enabled) => {
  if (typeof enabled === 'boolean') app.setLoginItemSettings({ openAtLogin: enabled, path: process.execPath });
  return app.getLoginItemSettings({ path: process.execPath }).openAtLogin;
});




ipcMain.on('set-ignore-mouse-events', (_event, ignore) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

ipcMain.on('set-focusable', (_event, focusable) => {
  if (mainWindow) {
    mainWindow.setFocusable(focusable);
    if (focusable) mainWindow.focus();
  }
});

ipcMain.on('set-auto-start', (_event, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: !!enabled,
    path: process.execPath,
  });
});

ipcMain.handle('get-auto-start', () => {
  return app.getLoginItemSettings({
    path: process.execPath,
  }).openAtLogin;
});

ipcMain.on('set-language', (_event, language) => {
  if (TRAY_I18N[language]) {
    currentLanguage = language;
    updateTray();
  }
});

ipcMain.on('quit-app', () => {
  app.quit();
});

// --- App Lifecycle ---

app.whenReady().then(() => {
  try {
    const saved = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'preferences.json'), 'utf8'));
    if (['companion', 'reminder'].includes(saved.mode)) { currentMode = saved.mode; preferencesLoaded = true; }
    selectedDisplay = saved.displayId;
  } catch { /* First launch or invalid preferences: safe defaults. */ }
  createPetWindow();
  placeOnDisplay();
  for (const event of ['display-added', 'display-removed', 'display-metrics-changed']) {
    screen.on(event, () => {
      placeOnDisplay(); savePreferences();
      if (mainWindow) mainWindow.webContents.send('displays-changed', displayState());
    });
  }
  powerMonitor.on('suspend', () => mainWindow?.webContents.send('system-suspend'));
  powerMonitor.on('resume', () => mainWindow?.webContents.send('system-resume'));


  tray = new Tray(createTrayIcon());
  updateTray();

  // Double-click tray to toggle pause
  tray.on('double-click', () => {
    isPaused = !isPaused;
    if (mainWindow) mainWindow.webContents.send('toggle-pause', isPaused);
    updateTray();
  });
});

app.on('window-all-closed', () => {
  // Don't quit - keep running in tray
});

app.on('before-quit', () => {
  // Cleanup
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
}
