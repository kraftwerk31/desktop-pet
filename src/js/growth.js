/**
 * Growth System - tracks consecutive days, interactions, milestones, mood, analytics
 */

class GrowthManager {
  constructor() {
    this.STORAGE_KEY = 'desktop-pet-growth';
    this.data = this._load();
    this._isNewDay = this._checkNewDay();
  }

  // --- Mood constants ---
  static MOOD_FLOOR = 20;
  static MOOD_CEILING = 100;
  static MOOD_DAILY_START = 60;
  static MOOD_CLICK = 3;
  static MOOD_REMINDER_ACCEPT = 8;
  static MOOD_REMINDER_IGNORE = -8;
  static MOOD_DRAG = 2;
  static MOOD_DECAY_AMOUNT = -3;
  static MOOD_DECAY_IDLE_THRESHOLD = 30 * 60 * 1000;
  static MOOD_DECAY_CHECK_INTERVAL = 10 * 60 * 1000;
  static MOOD_NATURAL_RECOVERY = 1;

  _load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return this._defaultData();
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return this._defaultData();
      // Ensure new fields exist on old data
      if (!saved.mood) saved.mood = { score: 60, lastDecayCheck: null };
      if (!saved.analytics) saved.analytics = { sessions: [], currentSession: null };
      // Validate critical fields
      if (typeof saved.consecutiveDays !== 'number') saved.consecutiveDays = 1;
      if (typeof saved.totalDays !== 'number') saved.totalDays = 1;
      if (typeof saved.mood.score !== 'number') saved.mood.score = 60;
      return saved;
    } catch {
      return this._defaultData();
    }
  }

  _defaultData() {
    return {
      firstLaunchDate: this._today(),
      lastActiveDate: this._today(),
      consecutiveDays: 1,
      totalDays: 1,
      totalInteractions: 0,
      totalRemindersAccepted: 0,
      totalRemindersIgnored: 0,
      milestonesShown: [],
      introComplete: false,
      mood: {
        score: 60,
        lastDecayCheck: null,
      },
      analytics: {
        sessions: [],
        currentSession: null,
      },
    };
  }

  _today() {
    return new Date().toISOString().split('T')[0];
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }

  _checkNewDay() {
    const today = this._today();
    if (this.data.lastActiveDate === today) return false;

    const last = new Date(this.data.lastActiveDate);
    const now = new Date(today);
    const diff = Math.floor((now - last) / (86400000));

    this.data.totalDays++;
    this.data.consecutiveDays = (diff === 1) ? this.data.consecutiveDays + 1 : 1;
    this.data.lastActiveDate = today;

    // Reset daily mood
    this.data.mood.score = GrowthManager.MOOD_DAILY_START;
    this.data.mood.lastDecayCheck = null;

    this.save();
    return true;
  }

  isNewDay() { return this._isNewDay; }

  recordInteraction() {
    this.data.totalInteractions++;
    this.save();
  }

  recordReminderAccepted() {
    this.data.totalRemindersAccepted++;
    this.save();
  }

  recordReminderIgnored() {
    this.data.totalRemindersIgnored++;
    this.save();
  }

  completeIntro() {
    this.data.introComplete = true;
    this.save();
  }

  isIntroComplete() {
    return this.data.introComplete;
  }

  getBondLevel() {
    const d = this.data.consecutiveDays;
    if (d >= 30) return 5;
    if (d >= 14) return 4;
    if (d >= 7) return 3;
    if (d >= 3) return 2;
    return 1;
  }

  getBondTitle() {
    return ['', '\u{1F44B} \u65B0\u670B\u53CB', '\u{1F31F} \u719F\u6089\u7684\u4F19\u4F34', '\u{1F496} \u597D\u670B\u53CB', '\u{1F48E} \u6700\u4F73\u62CD\u6863', '\u{1F9E1} \u7075\u9B42\u4F34\u4FA3'][this.getBondLevel()];
  }

  checkMilestones() {
    const pending = [];
    const shown = this.data.milestonesShown;
    const days = this.data.consecutiveDays;
    const interactions = this.data.totalInteractions;

    const dayMilestones = { 3: 'day3', 7: 'day7', 14: 'day14', 30: 'day30' };
    const interMilestones = { 50: 'inter50', 100: 'inter100', 500: 'inter500' };

    for (const [t, id] of Object.entries(dayMilestones)) {
      if (days >= parseInt(t) && !shown.includes(id)) pending.push(id);
    }
    for (const [t, id] of Object.entries(interMilestones)) {
      if (interactions >= parseInt(t) && !shown.includes(id)) pending.push(id);
    }
    return pending;
  }

  markMilestoneShown(id) {
    if (!this.data.milestonesShown.includes(id)) {
      this.data.milestonesShown.push(id);
      this.save();
    }
  }

  getStats() {
    return {
      consecutiveDays: this.data.consecutiveDays,
      totalDays: this.data.totalDays,
      totalInteractions: this.data.totalInteractions,
      totalRemindersAccepted: this.data.totalRemindersAccepted,
      bondLevel: this.getBondLevel(),
      bondTitle: this.getBondTitle(),
      moodScore: this.getMood(),
      moodLabel: this.getMoodLabel(),
    };
  }

  // ========== MOOD SYSTEM ==========

  adjustMood(delta) {
    this.data.mood.score = Math.max(
      GrowthManager.MOOD_FLOOR,
      Math.min(GrowthManager.MOOD_CEILING, this.data.mood.score + delta)
    );
    this.save();
  }

  getMood() {
    return this.data.mood.score;
  }

  getMoodLevel() {
    const s = this.data.mood.score;
    if (s >= 80) return 'high';
    if (s >= 50) return 'normal';
    return 'low';
  }

  getMoodLabel() {
    const level = this.getMoodLevel();
    return { high: '\u{1F60A} \u8D85\u5F00\u5FC3', normal: '\u{1F642} \u8FD8\u4E0D\u9519', low: '\u{1F622} \u6709\u70B9\u65E0\u804A' }[level];
  }

  checkMoodDecay(lastInteractionTime) {
    const now = Date.now();
    const lastCheck = this.data.mood.lastDecayCheck;

    if (lastCheck && (now - lastCheck < GrowthManager.MOOD_DECAY_CHECK_INTERVAL)) return;

    this.data.mood.lastDecayCheck = now;

    if (now - lastInteractionTime > GrowthManager.MOOD_DECAY_IDLE_THRESHOLD) {
      this.adjustMood(GrowthManager.MOOD_DECAY_AMOUNT);
    } else {
      this.adjustMood(GrowthManager.MOOD_NATURAL_RECOVERY);
    }
  }

  // ========== ANALYTICS SYSTEM ==========

  startSession() {
    this.data.analytics.currentSession = {
      date: this._today(),
      startTimestamp: Date.now(),
      endTimestamp: null,
      modeTime: { companion: 0 },
      interactions: 0,
      remindersAccepted: 0,
      remindersIgnored: 0,
    };
    this.save();
  }

  endSession() {
    const s = this.data.analytics.currentSession;
    if (!s) return;
    s.endTimestamp = Date.now();
    this.data.analytics.sessions.push(s);
    // Keep last 30 sessions
    if (this.data.analytics.sessions.length > 30) {
      this.data.analytics.sessions = this.data.analytics.sessions.slice(-30);
    }
    this.data.analytics.currentSession = null;
    this.save();
  }

  recordModeTime(mode, durationMs) {
    const s = this.data.analytics.currentSession;
    if (!s || !s.modeTime[mode]) return;
    s.modeTime[mode] += durationMs;
  }

  recordAnalyticInteraction() {
    const s = this.data.analytics.currentSession;
    if (s) s.interactions++;
  }

  recordAnalyticReminderAccepted() {
    const s = this.data.analytics.currentSession;
    if (s) s.remindersAccepted++;
  }

  recordAnalyticReminderIgnored() {
    const s = this.data.analytics.currentSession;
    if (s) s.remindersIgnored++;
  }

  getSessionStats() {
    const current = this.data.analytics.currentSession;
    const today = this._today();

    // Find today's completed sessions + current
    const todaySessions = this.data.analytics.sessions.filter(s => s.date === today);
    const allToday = current && current.date === today ? [...todaySessions, current] : todaySessions;

    if (allToday.length === 0) {
      return {
        todayInteractions: 0,
        todayResponseRate: '--',
        todaySessionTime: '--',
        todayRemindersTotal: 0,
      };
    }

    let totalInteractions = 0;
    let totalAccepted = 0;
    let totalIgnored = 0;
    let totalCompanion = 0;
    let sessionStart = Infinity;
    let sessionEnd = 0;

    for (const s of allToday) {
      totalInteractions += s.interactions;
      totalAccepted += s.remindersAccepted;
      totalIgnored += s.remindersIgnored;
      totalCompanion += (s.modeTime.companion || 0);
      if (s.startTimestamp < sessionStart) sessionStart = s.startTimestamp;
      const end = s.endTimestamp || Date.now();
      if (end > sessionEnd) sessionEnd = end;
    }

    const totalReminders = totalAccepted + totalIgnored;
    const responseRate = totalReminders > 0 ? Math.round((totalAccepted / totalReminders) * 100) + '%' : '--';

    const durationMs = sessionEnd - sessionStart;
    const hours = Math.floor(durationMs / 3600000);
    const mins = Math.floor((durationMs % 3600000) / 60000);
    const sessionTime = hours > 0 ? hours + 'h ' + mins + 'm' : mins + 'm';

    return {
      todayInteractions: totalInteractions,
      todayResponseRate: responseRate,
      todaySessionTime: sessionTime,
      todayRemindersTotal: totalReminders,
    };
  }
}
