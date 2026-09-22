/** Reliable reminder queue and explicit user actions. */
(function () {
  'use strict';
  const proto = PetEngine.prototype;
  const kinds = {
    healthBreak: { timer: 'breakReminder', interval: 'breakInterval', label: 'breakActivity' },
    healthWater: { timer: 'waterReminder', interval: 'waterInterval', label: 'waterReminder' },
  };
  proto.startHealthReminders = function () {
    for (const [type, spec] of Object.entries(kinds)) {
      this._clearTimer(spec.timer);
      if (!this.isPaused && !this.isQuiet() && this.reminderEnabled[type] !== false)
        this._cycleHealthTimer(spec.timer, this[spec.interval], type);
    }
  };
  proto._cycleHealthTimer = function (key, interval, type) {
    if (this.isPaused || this.isQuiet() || this.reminderEnabled[type] === false) return;
    this._reminderDue = this._reminderDue || {};
    if (!Number.isFinite(this._reminderDue[type])) this._reminderDue[type] = Date.now() + interval;
    this._setTimer(key, () => {
      this._reminderDue[type] = Date.now() + interval;
      this._showHealthReminder(type);
      this._cycleHealthTimer(key, interval, type);
    }, Math.max(0, this._reminderDue[type] - Date.now()));
  };
  proto._showHealthReminder = function (type) {
    if (!kinds[type] || this.isPaused || this.quietUntil > Date.now()) return;
    this._pendingReminders = this._pendingReminders || [];
    if (!this._pendingReminders.includes(type) && !this.activeReminder?.types.includes(type)) this._pendingReminders.push(type);
    if (this.activeReminder) return;
    this._setTimer('reminderQueue', () => this._flushReminders(), 300);
  };
  proto._flushReminders = function () {
    if (this.activeReminder || !this._pendingReminders.length || this.isPaused || this.isQuiet()) return;
    if (this.isDragging || this._introPhase || this._spritesReady === false) {
      this._setTimer('reminderQueue', () => this._flushReminders(), 1000); return;
    }
    const types = this._pendingReminders.splice(0).filter(type => this.reminderEnabled[type] !== false);
    if (!types.length) return;
    this.hideBubble(true);
    this.activeReminder = { types };
    this._clearTimer('state'); this._clearTimer('reaction'); this._clearTimer('seek');
    this.sprite?.setFlip(this._facingLeft);
    const show = () => {
      this.setState('reminding');
      const text = types.length > 1 ? window.DesktopPetI18n.t('upgrade.combined') : pickRandom(this._getTexts()[types[0]]);
      this.showBubble(text, true);
      this._reminderActions?.classList.remove('hidden');
      this._positionBubble();
      this._setTimer('reminderTimeout', () => this.resolveReminder('skipped'), 30000);
    };
    if (this.mode === 'reminder') this._popInForReminder(show);
    else {
      // Show in place so reminders do not cross or obscure the user's work.
      const rect = this.container.getBoundingClientRect();
      this.container.style.transition = '';
      this.x = rect.left; this.y = rect.top;
      this.container.style.left = this.x + 'px'; this.container.style.top = this.y + 'px'; this.container.style.bottom = 'auto';
      show();
    }
  };
  proto.resolveReminder = function (action) {
    if (!this.activeReminder || !['accepted','snoozed','skipped'].includes(action)) return;
    const types = this.activeReminder.types;
    this.activeReminder = null;
    this._clearTimer('reminderTimeout'); this._clearTimer('state');
    this._reminderActions?.classList.add('hidden');
    if (action === 'accepted') this._recordReminderDismiss();
    else if (action === 'skipped') this._recordReminderIgnore();
    if (action === 'snoozed') {
      for (const type of types) {
        const spec = kinds[type];
        this._reminderDue = this._reminderDue || {};
        this._reminderDue[type] = Date.now() + 5 * 60000;
        this._cycleHealthTimer(spec.timer, this[spec.interval], type);
      }
    }
    this.hideBubble();
    const finish = () => {
      this.setState('idle');
      this.scheduleNextAction(); this._startSeekAttention();
      this._setTimer('reminderQueue', () => this._flushReminders(), 800);
      window.petAPI.setIgnoreMouseEvents(true);
    };
    if (this.mode === 'reminder') this._popOutAfterReminder(finish); else finish();
  };
  proto.dismissReminder = function () { this.resolveReminder('skipped'); };
  proto.setReminderEnabled = function (type, enabled) {
    if (!kinds[type]) return;
    this.reminderEnabled[type] = !!enabled;
    this._pendingReminders = this._pendingReminders.filter(item => item !== type);
    if (this.activeReminder?.types.includes(type)) this.resolveReminder('skipped');
    const spec = kinds[type];
    this._clearTimer(spec.timer);
    this._reminderDue = this._reminderDue || {};
    delete this._reminderDue[type];
    if (enabled) this._cycleHealthTimer(spec.timer, this[spec.interval], type);
  };
  proto._setHealthInterval = function (type, minutes, min, max) {
    if (!Number.isFinite(Number(minutes))) return;
    const spec = kinds[type];
    this[spec.interval] = Math.max(min, Math.min(max, Number(minutes))) * 60000;
    this._clearTimer(spec.timer);
    this._reminderDue = this._reminderDue || {};
    this._reminderDue[type] = Date.now() + this[spec.interval];
    this._cycleHealthTimer(spec.timer, this[spec.interval], type);
  };
  proto.setBreakInterval = function (m) { this._setHealthInterval('healthBreak', m, 15, 120); };
  proto.setWaterInterval = function (m) { this._setHealthInterval('healthWater', m, 10, 90); };
  proto._popInForReminder = function (onComplete) {
    this.isPoppedIn = true;
    var targetY = Math.max(10, Math.min(this.screenHeight * 0.45, this.screenHeight - (this.petHeight || 160) - 64));
    this.container.style.transition = 'none';
    this.container.style.left = (this.screenWidth + 20) + 'px';
    this.container.style.top = targetY + 'px';
    this.container.style.bottom = 'auto';
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'auto';
    this.setState('reminding');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!this.isPoppedIn || this.mode !== 'reminder' || this.isPaused || this.isQuiet()) return;
        this.container.style.transition = 'left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        this.container.style.left = Math.max(10, this.screenWidth - (this.petWidth || 120) - 24) + 'px';
      });
    });

    this._setTimer('state', () => {
      this.container.style.transition = '';
      if (onComplete) onComplete();
    }, 550);
  };

  proto._popOutAfterReminder = function (onComplete) {
    this.isPoppedIn = false;
    this.hideBubble();
    this.container.style.transition = 'left 0.4s ease-in, opacity 0.4s ease-in';
    this.container.style.left = (this.screenWidth + 20) + 'px';

    this._setTimer('state', () => {
      this.container.style.opacity = '0';
      this.container.style.pointerEvents = 'none';
      this.container.style.transition = '';
      this.setState('idle');
      if (onComplete) onComplete();
    }, 450);
  };

  proto._dismissReminderPopOut = function () {
    this._clearTimer('state');
    this.hideBubble();
    this._popOutAfterReminder();
  };

})();
