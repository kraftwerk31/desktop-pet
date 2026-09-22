const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  initializeSettings: (legacy) => ipcRenderer.invoke('initialize-settings', legacy),
  setMode: (mode) => ipcRenderer.invoke('set-mode', mode),
  selectDisplay: (id) => ipcRenderer.invoke('select-display', id),
  autoStart: (enabled) => ipcRenderer.invoke('auto-start', enabled),
  onDisplaysChanged: (callback) => ipcRenderer.on('displays-changed', (_event, data) => callback(data)),
  onSuspend: (callback) => ipcRenderer.on('system-suspend', () => callback()),
  onResume: (callback) => ipcRenderer.on('system-resume', () => callback()),
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
  getAutoStart: () => ipcRenderer.invoke('get-auto-start'),

  // Language
  setLanguage: (language) => ipcRenderer.send('set-language', language),
});
