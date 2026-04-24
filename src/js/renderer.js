/**
 * Renderer process entry - wires pet engine with IPC + settings UI
 */

(function () {
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

  // Mode descriptions
  var modeDescs = {
    companion: '猫咪在桌面上走来走去，到时间走过来提醒你。',
    reminder: '猫咪平时隐藏，到时间才弹出来提醒，提醒完缩回去。',
  };

  // Health reminder sliders
  var restSlider = document.getElementById('rest-interval');
  var restValue = document.getElementById('rest-value');
  var standSlider = document.getElementById('stand-interval');
  var standValue = document.getElementById('stand-value');
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

  // --- Create Pet Engine ---
  var pet = new PetEngine(container, character);

  // --- Restore saved settings ---
  var saved = loadSettings();

  // If saved settings exist but intro hasn't completed, skip intro
  if (Object.keys(saved).length > 0 && !pet.growth.isIntroComplete()) {
    pet.growth.completeIntro();
    pet._clearTimer('intro1');
    pet._clearTimer('intro2');
    var restoreMode = saved.mode || 'companion';
    pet.switchMode(restoreMode);
    if (pet.growth.isNewDay()) {
      pet._setTimer('timeGreeting', function () { pet._showMilestoneOrGreeting(); }, 2000);
    } else {
      pet._setTimer('timeGreeting', function () { pet._showTimeGreeting(); }, 2000);
    }
  }

  if (saved.restInterval != null && restSlider) {
    restSlider.value = saved.restInterval;
    restValue.textContent = saved.restInterval + '\u5206\u949F';
    pet.setRestInterval(saved.restInterval);
  }
  if (saved.standInterval != null && standSlider) {
    standSlider.value = saved.standInterval;
    standValue.textContent = saved.standInterval + '\u5206\u949F';
    pet.setStandInterval(saved.standInterval);
  }
  if (saved.waterInterval != null && waterSlider) {
    waterSlider.value = saved.waterInterval;
    waterValue.textContent = saved.waterInterval + '\u5206\u949F';
    pet.setWaterInterval(saved.waterInterval);
  }

  if (saved.mode) {
    modeBtns.forEach(function (b) {
      b.classList.toggle('active', b.dataset.mode === saved.mode);
    });
    if (modeDesc) modeDesc.textContent = modeDescs[saved.mode] || '';
    pet.setMode(saved.mode);
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
    autoStartToggle.addEventListener('change', function () {
      var enabled = autoStartToggle.checked;
      window.petAPI.setAutoStart(enabled);
      saveSettings({ autoStart: enabled });
    });
  }

  // --- Stats display ---
  function refreshStats() {
    var stats = pet.growth.getStats();
    if (statDays) statDays.textContent = stats.consecutiveDays;
    if (statBond) statBond.textContent = 'LV.' + stats.bondLevel;
    if (statBondTitle) statBondTitle.textContent = stats.bondTitle;
    if (statInteractions) statInteractions.textContent = stats.totalInteractions;
    if (statMood) statMood.textContent = stats.moodScore;
    if (statMoodLabel) statMoodLabel.textContent = stats.moodLabel;

    // Analytics
    var analytics = pet.growth.getSessionStats();
    if (analyticsResponseRate) analyticsResponseRate.textContent = analytics.todayResponseRate;
    if (analyticsSessionTime) analyticsSessionTime.textContent = analytics.todaySessionTime;
    if (analyticsTodayReminders) analyticsTodayReminders.textContent = analytics.todayRemindersTotal;
    if (analyticsTodayInteractions) analyticsTodayInteractions.textContent = analytics.todayInteractions;
  }
  refreshStats();

  // Refresh stats when settings panel opens
  window.petAPI.onOpenSettings(function () {
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
    window.petAPI.setFocusable(false);
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

  [restSlider, standSlider, waterSlider].forEach(function (s) {
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
      if (modeDesc) modeDesc.textContent = modeDescs[mode] || '';
      pet.setMode(mode);
      saveSettings({ mode: mode });
    });
  });

  // --- Health Reminder Sliders ---

  if (restSlider) {
    restSlider.addEventListener('input', function () {
      var minutes = parseInt(restSlider.value, 10);
      restValue.textContent = minutes + '\u5206\u949F';
      pet.setRestInterval(minutes);
      saveSettings({ restInterval: minutes });
      updateSliderTrack(restSlider);
    });
  }

  if (standSlider) {
    standSlider.addEventListener('input', function () {
      var minutes = parseInt(standSlider.value, 10);
      standValue.textContent = minutes + '\u5206\u949F';
      pet.setStandInterval(minutes);
      saveSettings({ standInterval: minutes });
      updateSliderTrack(standSlider);
    });
  }

  if (waterSlider) {
    waterSlider.addEventListener('input', function () {
      var minutes = parseInt(waterSlider.value, 10);
      waterValue.textContent = minutes + '\u5206\u949F';
      pet.setWaterInterval(minutes);
      saveSettings({ waterInterval: minutes });
      updateSliderTrack(waterSlider);
    });
  }

  // --- IPC: Open settings from tray ---
  window.petAPI.onOpenSettings(function () {
    settingsPanel.classList.remove('hidden');
    window.petAPI.setFocusable(true);
    refreshStats();
  });

  // --- IPC: Show stats from tray "打卡" ---
  window.petAPI.onShowStats(function () {
    if (pet._showStatsBubble) pet._showStatsBubble();
    refreshStats();
  });

  // --- Expose for debugging ---
  window.pet = pet;
})();
