/**
 * Pet Health Reminder System - extends PetEngine.prototype
 * Health reminders: break (rest + stand up), drink water
 * Pop-in / pop-out for reminder mode
 */

(function () {
  'use strict';

  var proto = PetEngine.prototype;

  // ========== HEALTH REMINDER LIFECYCLE ==========

  proto.startHealthReminders = function () {
    this._clearTimer('breakReminder');
    this._clearTimer('waterReminder');
    if (this.isPaused) return;

    this._cycleHealthTimer('breakReminder', this.breakInterval, 'healthBreak');
    this._cycleHealthTimer('waterReminder', this.waterInterval, 'healthWater');
  };

  proto._cycleHealthTimer = function (key, interval, textKey) {
    this._setTimer(key, () => {
      if (!this.isPaused) { this._showHealthReminder(textKey); }
      this._cycleHealthTimer(key, interval, textKey);
    }, interval);
  };

  proto._showHealthReminder = function (textKey) {
    if (this.state === 'reminding' || this.state === 'sleeping') return;
    var texts = this._getTexts();
    var pool = texts[textKey];
    if (!pool || pool.length === 0) return;

    if (this.mode === 'reminder') {
      // Reminder mode: pop in from right side
      this._popInForReminder(() => {
        this.showBubble(pickRandom(pool));
        this._setTimer('state', () => {
          this._recordReminderIgnore();
          this._dismissReminderPopOut();
        }, 10000);
      });
    } else {
      // Companion mode: walk to center
      var centerX = this.screenWidth * 0.45;
      this._clearTimer('state');
      this.walkTo(centerX, () => {
        this.setState('reminding');
        this.showBubble(pickRandom(pool));
        this._setTimer('state', () => {
          this._recordReminderIgnore();
          this.dismissReminder();
        }, 12000);
      });
    }
  };

  proto.dismissReminder = function () {
    if (this.state !== 'reminding') return;
    this._clearTimer('state');
    this.hideBubble();
    this.setState('happy');

    var texts = this._getTexts();
    if (this._consecutiveDismisses >= 2) {
      this.showBubble(pickRandom(texts.encourage), true);
    } else {
      this.showBubble(texts.dismissed, true);
    }

    this._setTimer('state', () => {
      this.hideBubble();
      this.setState('idle');
      this.scheduleNextAction();
    }, 1200);
  };

  // ========== POP-IN / POP-OUT (reminder mode) ==========

  proto._popInForReminder = function (onComplete) {
    this.isPoppedIn = true;
    var targetY = this.screenHeight * 0.45;
    this.container.style.transition = 'none';
    this.container.style.left = (this.screenWidth + 20) + 'px';
    this.container.style.top = targetY + 'px';
    this.container.style.bottom = 'auto';
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'auto';
    this.setState('reminding');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.container.style.transition = 'left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        this.container.style.left = (this.screenWidth - 160) + 'px';
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

  // ========== PUBLIC API ==========

  proto.setBreakInterval = function (minutes) {
    this.breakInterval = minutes * 60 * 1000;
    this._clearTimer('breakReminder');
    this._cycleHealthTimer('breakReminder', this.breakInterval, 'healthBreak');
  };

  proto.setWaterInterval = function (minutes) {
    this.waterInterval = minutes * 60 * 1000;
    this._clearTimer('waterReminder');
    this._cycleHealthTimer('waterReminder', this.waterInterval, 'healthWater');
  };

})();
