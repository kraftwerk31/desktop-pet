/**
 * Pet Interaction Handler - extends PetEngine.prototype
 * Handles click reactions, progressive click counting, and reminder dismiss/ignore recording
 */

(function () {
  'use strict';

  var proto = PetEngine.prototype;

  // ========== CLICK MEMORY ==========

  proto._getRecentClickCount = function () {
    var now = Date.now();
    this._recentClicks = this._recentClicks.filter(function (t) { return now - t < 3000; });
    return this._recentClicks.length;
  };

  proto._recordClick = function () {
    this._recentClicks.push(Date.now());
    this._lastInteractionTime = Date.now();
    this.growth.recordInteraction();
    this.growth.adjustMood(GrowthManager.MOOD_CLICK);
    this.growth.recordAnalyticInteraction();
  };

  proto._recordReminderDismiss = function () {
    this._consecutiveDismisses++;
    this._consecutiveIgnores = 0;
    this._lastInteractionTime = Date.now();
    this.growth.recordReminderAccepted();
    this.growth.adjustMood(GrowthManager.MOOD_REMINDER_ACCEPT);
    this.growth.recordAnalyticReminderAccepted();
  };

  proto._recordReminderIgnore = function () {
    this._consecutiveIgnores++;
    this._consecutiveDismisses = 0;
    this.growth.recordReminderIgnored();
    this.growth.adjustMood(GrowthManager.MOOD_REMINDER_IGNORE);
    this.growth.recordAnalyticReminderIgnored();
  };

  proto._getReminderTexts = function (textKey) {
    var texts = this._getTexts();
    var pool = [].concat(texts[textKey] || texts.companionRemind);

    if (this._consecutiveIgnores >= 2) {
      var n = Math.min(this._consecutiveIgnores, 4);
      for (var i = 0; i < n; i++) pool.push(pickRandom(texts.companionSad));
    }

    if (this._consecutiveDismisses >= 2) {
      var m = Math.min(this._consecutiveDismisses, 3);
      for (var j = 0; j < m; j++) pool.push(pickRandom(texts.companionEncourage));
    }

    // Late night — always gentle
    if (this._timeOfDay === 'lateNight' || this._timeOfDay === 'night') {
      pool = pool.concat(texts.companionEncourage);
    }

    return pool;
  };

  // ========== CLICK HANDLER ==========

  proto.handleClick = function () {
    // Intro sequence click
    if (this._introPhase === 'waiting_for_click') {
      this._recordClick();
      this._introClicked();
      return;
    }

    this._recordClick();

    // Reminder mode: dismiss pop-in on click
    if (this.mode === 'reminder' && this.isPoppedIn) {
      this._clearTimer('state');
      this._recordReminderDismiss();
      this.setState('happy');
      var texts = this._getTexts();
      this.showBubble(pickRandom(texts.encourage), true);
      this._setTimer('state', () => {
        this.hideBubble();
        this.setState('idle');
        this._popOutAfterReminder();
      }, 800);
      return;
    }

    if (this.state === 'reminding') {
      this._recordReminderDismiss();
      this.dismissReminder();
      return;
    }

    this._clearTimer('state');
    this._clearTimer('reaction');

    var self = this;
    var texts = this._getTexts();
    var clickCount = this._getRecentClickCount();

    // Progressive click reactions
    if (clickCount >= 4) {
      this.setState('annoyed');
      this.showBubble(pickRandom(texts.click4Plus), true);
      this._setTimer('reaction', function () {
        self.hideBubble();
        self.setState('idle');
        self.scheduleNextAction();
      }, 1500);
      return;
    }

    if (clickCount === 3) {
      this.setState('surprised');
      this.showBubble(pickRandom(texts.click3), true);
      this._setTimer('reaction', function () {
        self.hideBubble();
        self.setState('idle');
        self.scheduleNextAction();
      }, 800);
      return;
    }

    if (clickCount === 2) {
      this.showBubble(pickRandom(texts.click2), true);
      this._setTimer('reaction', function () {
        self.hideBubble();
        self.scheduleNextAction();
      }, 500);
      return;
    }

    // Normal single-click reaction
    var reactions = ['jump', 'heart', 'tilt', 'spin', 'meow', 'wiggle'];
    var reaction = reactions[Math.floor(Math.random() * reactions.length)];

    switch (reaction) {
      case 'jump': {
        this.setState('surprised');
        this.showBubble(pickRandom(texts.jump), true);
        this._setTimer('reaction', function () {
          self.hideBubble();
          self.setState('idle');
          self.scheduleNextAction();
        }, 400);
        break;
      }
      case 'heart': {
        this.setState('happy');
        this.showBubble('\u2661', true);
        this._setTimer('reaction', function () {
          self.hideBubble();
          self.setState('idle');
          self.scheduleNextAction();
        }, 1200);
        break;
      }
      case 'tilt': {
        this.showBubble(pickRandom(texts.tilt), true);
        this.character.classList.add('head-tilt');
        this._setTimer('reaction', function () {
          self.character.classList.remove('head-tilt');
          self.hideBubble();
          self.scheduleNextAction();
        }, 900);
        break;
      }
      case 'spin': {
        this.character.style.transition = 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)';
        this.character.style.transform = 'rotate(360deg)';
        this.showBubble(pickRandom(texts.spin), true);
        this._setTimer('reaction', function () {
          self.character.style.transform = '';
          self.character.style.transition = 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)';
          self.hideBubble();
          self.scheduleNextAction();
        }, 550);
        break;
      }
      case 'meow': {
        this.setState('happy');
        this.showBubble(pickRandom(texts.meow), true);
        this._setTimer('reaction', function () {
          self.hideBubble();
          self.setState('idle');
          self.scheduleNextAction();
        }, 1100);
        break;
      }
      case 'wiggle': {
        this.character.style.animation = 'none';
        this.character.offsetHeight;
        this.character.style.animation = 'wiggle 0.5s ease';
        this.showBubble(texts.wiggle, true);
        this._setTimer('reaction', function () {
          self.character.style.animation = '';
          self.hideBubble();
          self.scheduleNextAction();
        }, 600);
        break;
      }
    }
  };

})();
