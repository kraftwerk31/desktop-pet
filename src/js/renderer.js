/**
 * Renderer process entry - wires pet engine with IPC + settings UI
 */

(async function () {
  'use strict';

  // --- Settings persistence ---
  var STORAGE_KEY = 'desktop-pet-settings';

  function loadSettings() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch { return {}; }
  }

  function saveSettings(patch) {
    try {
      var current = loadSettings();
      Object.assign(current, patch);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }

  // --- Element refs ---
  var container = document.getElementById('pet-container');
  var character = document.getElementById('pet-character');
  var settingsPanel = document.getElementById('settings-panel');

  var settingsClose = document.getElementById('settings-close');
  var personalityBtns = document.querySelectorAll('.personality-btn');
  var personalityDesc = document.getElementById('personality-desc');
  var modeBtns = document.querySelectorAll('.mode-btn');
  var modeDesc = document.getElementById('mode-desc');
  var languageSelect = document.getElementById('language-select');
  var i18n = window.DesktopPetI18n;

  // Health reminder sliders
  var breakSlider = document.getElementById('break-interval');
  var breakValue = document.getElementById('break-value');
  var waterSlider = document.getElementById('water-interval');
  var waterValue = document.getElementById('water-value');

  // Auto-start toggle
  var autoStartToggle = document.getElementById('auto-start-toggle');

  // Stats elements
  var statDays = document.getElementById('stat-days');
  var statBond = document.getElementById('stat-bond');
  var statBondTitle = document.getElementById('stat-bond-title');
  var statInteractions = document.getElementById('stat-interactions');
  var statMood = document.getElementById('stat-mood');
  var statMoodLabel = document.getElementById('stat-mood-label');

  // Analytics elements
  var analyticsResponseRate = document.getElementById('analytics-response-rate');
  var analyticsSessionTime = document.getElementById('analytics-session-time');
  var analyticsTodayReminders = document.getElementById('analytics-today-reminders');
  var analyticsTodayInteractions = document.getElementById('analytics-today-interactions');

  function setText(selector, text) {
    var el = document.querySelector(selector);
    if (el) el.textContent = text;
  }

  function modeLabel(mode) {
    return i18n.t(mode);
  }

  function updateSliderLabels() {
    if (breakSlider && breakValue) breakValue.textContent = i18n.formatMinutes(parseInt(breakSlider.value, 10));
    if (waterSlider && waterValue) waterValue.textContent = i18n.formatMinutes(parseInt(waterSlider.value, 10));
  }

  function refreshLocalizedText() {
    document.title = i18n.t('appTitle');
    var closeBtn = document.getElementById('pet-close');
    if (closeBtn) closeBtn.title = i18n.t('closeTitle');

    setText('#settings-title-text', i18n.t('settings'));
    setText('#language-label', '🌐 ' + i18n.t('language'));
    setText('.mode-btn[data-mode="companion"]', modeLabel('companion'));
    setText('.mode-btn[data-mode="reminder"]', modeLabel('reminder'));
    setText('.personality-btn[data-personality="clingy"]', i18n.t('personality.clingy.name'));
    setText('.personality-btn[data-personality="tsundere"]', i18n.t('personality.tsundere.name'));
    setText('.personality-btn[data-personality="energetic"]', i18n.t('personality.energetic.name'));
    setText('.personality-btn[data-personality="dramatic"]', i18n.t('personality.dramatic.name'));

    setText('#mode-label', '🐱 ' + i18n.t('modeSelection'));
    setText('#personality-label', '🐱 ' + i18n.t('personalitySelection'));
    setText('#health-label', '💙 ' + i18n.t('healthReminder') + ' ▾');
    setText('#break-label', '💙 ' + i18n.t('breakActivity'));
    setText('#water-label', '💧 ' + i18n.t('waterReminder'));
    setText('#general-label', '⚙ ' + i18n.t('generalSettings'));

    setText('#auto-start-label', i18n.t('autoStart'));
    setText('#mode-desc', i18n.t('modeDesc.' + pet.mode));
    setText('#personality-desc', PERSONALITIES[pet.personality].desc);
    setText('#stat-bond-title', i18n.bondTitle(pet.growth.getBondLevel()));
    setText('#stat-mood-label', i18n.moodLabel(pet.growth.getMoodLevel()));
    setText('.stat-item:nth-child(1) .stat-label', i18n.t('stats.consecutiveDays'));
    setText('.stat-item:nth-child(3) .stat-label', i18n.t('stats.interactions'));
    setText('#analytics-label', '📊 ' + i18n.t('stats.todayData'));
    setText('.analytics-item:nth-child(1) .analytics-label', i18n.t('stats.responseRate'));
    setText('.analytics-item:nth-child(2) .analytics-label', i18n.t('stats.sessionTime'));
    setText('.analytics-item:nth-child(3) .analytics-label', i18n.t('stats.reminders'));
    setText('.analytics-item:nth-child(4) .analytics-label', i18n.t('stats.interactions'));
    updateSliderLabels();
    refreshUpgradeText();
  }

  // Restore settings before loading GIFs: preload completion must not reset the mode.
  var saved = loadSettings();
  var systemSettings;
  try { systemSettings = await window.petAPI.initializeSettings(saved); saved.mode = systemSettings.mode; }
  catch { document.getElementById('settings-status').textContent = i18n.t('upgrade.error'); }
  if (saved.language) i18n.setLanguage(saved.language);
  if (languageSelect) languageSelect.value = i18n.getLanguage();
  window.petAPI.setLanguage(i18n.getLanguage());
  var pet = new PetEngine(container, character, saved);
  await pet.ready;

  if (saved.breakInterval != null && breakSlider) {
    breakSlider.value = saved.breakInterval;
    breakValue.textContent = i18n.formatMinutes(saved.breakInterval);
    pet.setBreakInterval(saved.breakInterval);
  }
  if (saved.waterInterval != null && waterSlider) {
    waterSlider.value = saved.waterInterval;
    waterValue.textContent = i18n.formatMinutes(saved.waterInterval);
    pet.setWaterInterval(saved.waterInterval);
  }

  if (saved.mode) {
    modeBtns.forEach(function (b) {
      b.classList.toggle('active', b.dataset.mode === saved.mode);
    });
    if (modeDesc) modeDesc.textContent = i18n.t('modeDesc.' + saved.mode);
    // PetEngine already started with the restored mode.
  }

  if (saved.personality && PERSONALITIES[saved.personality]) {
    personalityBtns.forEach(function (b) {
      b.classList.toggle('active', b.dataset.personality === saved.personality);
    });
    if (personalityDesc) personalityDesc.textContent = PERSONALITIES[saved.personality].desc;
    pet.setPersonality(saved.personality);
  }

  // --- Auto-start toggle ---
  if (autoStartToggle) {
    autoStartToggle.checked = !!saved.autoStart;
    if (window.petAPI.getAutoStart) {
      window.petAPI.getAutoStart().then(function (enabled) {
        autoStartToggle.checked = !!enabled;
        saveSettings({ autoStart: !!enabled });
      }).catch(function () {
        autoStartToggle.checked = !!saved.autoStart;
      });
    }
    autoStartToggle.addEventListener('change', function () {
      var enabled = autoStartToggle.checked;
      window.petAPI.autoStart(enabled).then(actual => { autoStartToggle.checked = actual; saveSettings({ autoStart: actual }); }).catch(() => { autoStartToggle.checked = !enabled; reportError(); });
    });
  }

  // --- Stats display ---
  function refreshStats() {
    var stats = pet.growth.getStats();
    if (statDays) statDays.textContent = stats.consecutiveDays;
    if (statBond) statBond.textContent = 'LV.' + stats.bondLevel;
    if (statBondTitle) statBondTitle.textContent = i18n.bondTitle(stats.bondLevel);
    if (statInteractions) statInteractions.textContent = stats.totalInteractions;
    if (statMood) statMood.textContent = stats.moodScore;
    if (statMoodLabel) statMoodLabel.textContent = i18n.moodLabel(pet.growth.getMoodLevel());

    // Analytics
    var analytics = pet.growth.getSessionStats();
    if (analyticsResponseRate) analyticsResponseRate.textContent = analytics.todayResponseRate;
    if (analyticsSessionTime) analyticsSessionTime.textContent = analytics.todaySessionTime;
    if (analyticsTodayReminders) analyticsTodayReminders.textContent = analytics.todayRemindersTotal;
    if (analyticsTodayInteractions) analyticsTodayInteractions.textContent = analytics.todayInteractions;
  }
  refreshLocalizedText();
  refreshStats();

  // Refresh stats when settings panel opens
  window.petAPI.onOpenSettings(function () {
    refreshLocalizedText();
    refreshStats();
  });

  // --- Settings Panel: Open / Close ---

  settingsPanel.addEventListener('mouseenter', function () {
    window.petAPI.setIgnoreMouseEvents(false);
  });
  settingsPanel.addEventListener('mouseleave', function () {
    window.petAPI.setIgnoreMouseEvents(true);
  });

  function closeSettings() {
    settingsPanel.classList.add('hidden');
    window.petAPI.setIgnoreMouseEvents(true);
    window.petAPI.setFocusable(false);
    refreshLocalizedText();
    refreshStats();
  }

  if (settingsClose) {
    settingsClose.addEventListener('click', closeSettings);
  }

  // --- Ripple effect on buttons ---
  settingsPanel.addEventListener('click', function (e) {
    var btn = e.target.closest('.mode-btn, .personality-btn, .settings-close-btn');
    if (!btn) return;
    btn.classList.remove('ripple');
    btn.offsetHeight; // reflow
    btn.classList.add('ripple');
    setTimeout(function () { btn.classList.remove('ripple'); }, 500);
  });

  // --- Collapsible sections ---
  settingsPanel.addEventListener('click', function (e) {
    var toggle = e.target.closest('.setting-label[data-target]');
    if (!toggle) return;
    var targetId = toggle.dataset.target;
    var target = document.getElementById(targetId);
    if (target) {
      target.classList.toggle('collapsed');
      toggle.classList.toggle('open');
    }
  });

  // --- Slider filled track ---
  function updateSliderTrack(slider) {
    if (!slider) return;
    var pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.setProperty('--slider-pct', pct + '%');
  }

  [breakSlider, waterSlider].forEach(function (s) {
    updateSliderTrack(s);
  });

  // --- Personality Buttons ---

  personalityBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pid = btn.dataset.personality;
      personalityBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      if (personalityDesc) personalityDesc.textContent = PERSONALITIES[pid].desc;
      pet.setPersonality(pid);
      saveSettings({ personality: pid });
    });
  });

  // --- Mode Buttons ---

  modeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var mode = btn.dataset.mode;
      modeBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      if (modeDesc) modeDesc.textContent = i18n.t('modeDesc.' + mode);
      window.petAPI.setMode(mode).then(applyMode).catch(() => { applyMode(pet.mode); reportError(); });
    });
  });

  // --- Language Select ---

  if (languageSelect) {
    languageSelect.addEventListener('change', function () {
      var language = languageSelect.value;
      i18n.setLanguage(language);
      saveSettings({ language: language });
      if (window.petAPI.setLanguage) window.petAPI.setLanguage(language);
      refreshLocalizedText();
      refreshStats();
    });
  }

  // --- Health Reminder Sliders ---

  if (breakSlider) {
    breakSlider.addEventListener('input', function () {
      var minutes = parseInt(breakSlider.value, 10);
      breakValue.textContent = i18n.formatMinutes(minutes);
      pet.setBreakInterval(minutes);
      saveSettings({ breakInterval: minutes });
      updateSliderTrack(breakSlider);
    });
  }

  if (waterSlider) {
    waterSlider.addEventListener('input', function () {
      var minutes = parseInt(waterSlider.value, 10);
      waterValue.textContent = i18n.formatMinutes(minutes);
      pet.setWaterInterval(minutes);
      saveSettings({ waterInterval: minutes });
      updateSliderTrack(waterSlider);
    });
  }

  // --- IPC: Open settings from tray ---
  window.petAPI.onOpenSettings(function () {
    settingsPanel.classList.remove('hidden');
    window.petAPI.setFocusable(true);
    refreshLocalizedText();
    refreshStats();
  });

  // --- IPC: Show stats from tray "打卡" ---
  window.petAPI.onShowStats(function () {
    if (pet._showStatsBubble) pet._showStatsBubble();
    refreshStats();
  });

  function reportError() { document.getElementById('settings-status').textContent = i18n.t('upgrade.error'); }
  function applyMode(mode) {
    modeBtns.forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
    modeDesc.textContent = i18n.t('modeDesc.' + mode);
    saveSettings({ mode });
    if (pet.mode !== mode) pet.setMode(mode);
  }
  window.petAPI.onSwitchMode(applyMode);

  function renderDisplays(data) {
    const select = document.getElementById('display-select');
    select.replaceChildren();
    data.displays.forEach((display, index) => {
      const option = document.createElement('option');
      option.value = display.id;
      option.textContent = display.label && !/^显示器 /.test(display.label) ? display.label : i18n.t('upgrade.screen', { n: index + 1 });
      select.appendChild(option);
    });
    select.value = data.displayId;
  }
  function refreshQuietText() {
    document.getElementById('quiet-toggle').textContent = i18n.t('upgrade.' + (pet.isQuiet() ? 'quietEnd' : 'quietStart'));
    document.getElementById('quiet-status').textContent = pet.isQuiet() ? i18n.t('upgrade.quietRemaining', { n: Math.ceil((pet.quietUntil - Date.now()) / 60000) }) : i18n.t('upgrade.quietHelp');
  }
  function refreshUpgradeText() {
    const labels = { 'display-label':'display', 'position-lock-label':'locked', 'size-label':'size', 'reminder-help':'reminderHelp' };
    Object.keys(labels).forEach(id => { document.getElementById(id).textContent = i18n.t('upgrade.' + labels[id]); });
    document.getElementById('settings-close').setAttribute('aria-label', i18n.t('upgrade.close'));
    const actions = document.getElementById('reminder-actions');
    actions.setAttribute('aria-label', i18n.t('upgrade.actions'));
    actions.querySelectorAll('button').forEach(button => { button.textContent = i18n.t('upgrade.' + button.dataset.reminderAction); });
    document.querySelectorAll('.reminder-enable').forEach(input => { input.setAttribute('aria-label', i18n.t('upgrade.' + (input.dataset.reminderType === 'healthBreak' ? 'enabledBreak' : 'enabledWater'))); });
    [breakSlider, waterSlider].forEach(input => input.setAttribute('aria-label', i18n.t('upgrade.interval')));
    refreshQuietText();
    if (systemSettings) renderDisplays(systemSettings);
    pet._positionBubble();
  }
  window.petAPI.onDisplaysChanged(data => { systemSettings = data; renderDisplays(data); });
  document.getElementById('display-select').addEventListener('change', async event => {
    try { systemSettings = await window.petAPI.selectDisplay(Number(event.target.value)); renderDisplays(systemSettings); }
    catch { reportError(); }
  });
  document.querySelectorAll('.reminder-enable').forEach(input => {
    input.checked = pet.reminderEnabled[input.dataset.reminderType] !== false;
    input.addEventListener('change', () => {
      pet.setReminderEnabled(input.dataset.reminderType, input.checked);
      saveSettings({ reminderEnabled: pet.reminderEnabled });
    });
  });
  pet._reminderActions = document.getElementById('reminder-actions');
  pet._reminderActions.addEventListener('click', event => {
    const action = event.target.closest('[data-reminder-action]');
    if (action) { event.stopPropagation(); pet.resolveReminder(action.dataset.reminderAction); refreshStats(); }
  });
  pet._reminderActions.addEventListener('mouseenter', () => window.petAPI.setIgnoreMouseEvents(false));
  pet._reminderActions.addEventListener('mouseleave', () => window.petAPI.setIgnoreMouseEvents(true));
  const lock = document.getElementById('position-lock');
  lock.checked = pet.positionLocked;
  function savePosition() { saveSettings({ positionLocked: pet.positionLocked, petPosition: { x: pet.x, y: pet.y } }); }
  lock.addEventListener('change', () => {
    pet.positionLocked = lock.checked;
    if (pet.positionLocked && !pet.activeReminder) {
      const rect = container.getBoundingClientRect(); pet.x = rect.left; pet.y = rect.top;
      container.style.transition = ''; container.style.left = pet.x + 'px'; container.style.top = pet.y + 'px'; container.style.bottom = 'auto';
      pet._clearTimer('state'); pet.setState(pet.isQuiet() || pet.isPaused ? 'sleeping' : 'sitting'); pet.scheduleNextAction();
    }
    savePosition();
  });
  window.addEventListener('mouseup', () => { if (pet.positionLocked) savePosition(); });
  const size = document.getElementById('pet-size');
  size.value = pet.petScale * 100;
  document.getElementById('size-value').textContent = size.value + '%';
  size.addEventListener('input', () => {
    pet.setSize(Number(size.value) / 100); document.getElementById('size-value').textContent = size.value + '%';
    saveSettings({ petScale: pet.petScale }); if (pet.positionLocked) savePosition();
  });
  document.getElementById('quiet-toggle').addEventListener('click', () => {
    pet.setQuiet(pet.isQuiet() ? 0 : 60); saveSettings({ quietUntil: pet.quietUntil }); refreshUpgradeText();
  });
  const clock = setInterval(() => {
    if (pet.quietUntil && !pet.isQuiet()) { pet.setQuiet(0); saveSettings({ quietUntil: 0 }); }
    if (!settingsPanel.classList.contains('hidden')) { refreshStats(); refreshQuietText(); }
  }, 1000);
  window.addEventListener('beforeunload', () => clearInterval(clock));
  window.addEventListener('keydown', event => { if (event.key === 'Escape') closeSettings(); });
  window.petAPI.onSuspend(() => { pet.growth.endSession(); pet._clearAllTimers(); pet.hideBubble(true); pet._reminderActions.classList.add('hidden'); });
  window.petAPI.onResume(() => { pet.growth.startSession(); pet.growth.ensureDay(); pet._reminderDue = {}; pet.switchMode(pet.mode); refreshUpgradeText(); });
  refreshUpgradeText();

  // --- Expose for debugging ---
  window.pet = pet;
})();
