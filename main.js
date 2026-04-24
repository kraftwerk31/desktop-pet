const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isPaused = false;
let currentMode = 'companion';

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
  // Compute bounds that cover all displays
  const displays = screen.getAllDisplays();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const d of displays) {
    const b = d.bounds;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }
  const totalWidth = maxX - minX;
  const totalHeight = maxY - minY;

  mainWindow = new BrowserWindow({
    width: totalWidth,
    height: totalHeight,
    x: minX,
    y: minY,
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
  return Menu.buildFromTemplate([
    { label: '\u{1F43E} 桌面宠物', enabled: false },
    { type: 'separator' },
    {
      label: isPaused ? '\u25B6 恢复' : '\u23F8 暂停',
      click: () => {
        isPaused = !isPaused;
        if (mainWindow) mainWindow.webContents.send('toggle-pause', isPaused);
        updateTray();
      },
    },
    { type: 'separator' },
    {
      label: '\u{1F43E} 陪伴模式',
      type: 'radio',
      checked: currentMode === 'companion',
      click: () => { setMode('companion'); },
    },
    {
      label: '\u{1F514} 提醒模式',
      type: 'radio',
      checked: currentMode === 'reminder',
      click: () => { setMode('reminder'); },
    },
    { type: 'separator' },
    {
      label: '\u2699 设置...',
      click: () => { openSettings(); },
    },
    {
      label: '\u{1F4CA} 打卡',
      click: () => {
        if (mainWindow) mainWindow.webContents.send('show-stats');
      },
    },
    { type: 'separator' },
    {
      label: '\u{1F44B} 再见~',
      click: () => { app.quit(); },
    },
  ]);
}

function updateTray() {
  if (tray) tray.setContextMenu(buildTrayMenu());
}

function setMode(mode) {
  currentMode = mode;
  if (mainWindow) mainWindow.webContents.send('switch-mode', mode);
  updateTray();
}

function openSettings() {
  if (mainWindow) {
    mainWindow.webContents.send('open-settings');
  }
}

// --- IPC ---

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
  app.setLoginItemSettings({ openAtLogin: enabled });
});

ipcMain.on('quit-app', () => {
  app.quit();
});

// --- App Lifecycle ---

app.whenReady().then(() => {
  createPetWindow();

  tray = new Tray(createTrayIcon());
  tray.setToolTip('桌面宠物 - 你的小伙伴');
  tray.setContextMenu(buildTrayMenu());

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
