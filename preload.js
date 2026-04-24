const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  // Renderer → Main
  setIgnoreMouseEvents: (ignore) => ipcRenderer.send('set-ignore-mouse-events', ignore),
  setFocusable: (focusable) => ipcRenderer.send('set-focusable', focusable),

  // Main → Renderer
  onTogglePause: (callback) => {
    ipcRenderer.on('toggle-pause', (event, paused) => callback(paused));
  },
  onSwitchMode: (callback) => {
    ipcRenderer.on('switch-mode', (event, mode) => callback(mode));
  },
  onDismissReminder: (callback) => {
    ipcRenderer.on('dismiss-reminder', () => callback());
  },
  onUpdateSettings: (callback) => {
    ipcRenderer.on('update-settings', (event, settings) => callback(settings));
  },

  // Main → Renderer: open settings panel
  onOpenSettings: (callback) => {
    ipcRenderer.on('open-settings', () => callback());
  },

  // Main → Renderer: show stats bubble
  onShowStats: (callback) => {
    ipcRenderer.on('show-stats', () => callback());
  },

  // Quit app
  quitApp: () => ipcRenderer.send('quit-app'),

  // Auto-start
  setAutoStart: (enabled) => ipcRenderer.send('set-auto-start', enabled),
});
