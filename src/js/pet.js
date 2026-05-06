/**
 * Pet Behavior Engine - Orange Tabby Edition
 * v0.5: Sprite-based animation system, merged health reminders
 *
 * Required load order: personalities.js → growth.js → sprite-manager.js → pet.js → pet-movement.js → pet-interaction.js → pet-intro.js → pet-health.js
 */

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

class PetEngine {
  constructor(container, character) {
    this.container = container;
    this.character = character;
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;

    // Position (adjusted for larger sprite size 120x140)
    this.x = this.screenWidth * 0.5;
    this.y = this.screenHeight - 160;
    this.minX = 80;
    this.maxX = this.screenWidth - 80;
    this.minY = 40;
    this.maxY = this.screenHeight - 160;
    this.walkSpeed = 0.14;
    this.verticalSpeed = 0.10;

    // State
    this.state = 'idle';
    this._timers = { state: null, breakReminder: null, waterReminder: null, seek: null, timeGreeting: null, reaction: null, mood: null, analytics: null, intro1: null, intro2: null, introHint: null, introText: null, idleAnim: null };

    // Walk direction (for scaleX)
    this._facingLeft = false;

    // Drag
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.dragMoved = false;
    this._dragRaf = null;
    this._pendingDragX = 0;
    this._pendingDragY = 0;

    // Mode: companion | reminder
    this.mode = 'companion';
    this.isPaused = false;
    this.isPoppedIn = false;

    // Health reminder intervals (ms)
    this.breakInterval = 45 * 60 * 1000;   // 45 min default (combined rest + stand)
    this.waterInterval = 30 * 60 * 1000;  // 30 min default

    // Cached DOM refs
    this.bubble = document.getElementById('speech-bubble');
    this.closeBtn = document.getElementById('pet-close');

    // ===== Sprite Manager =====
    var spriteImg = document.getElementById('pet-sprite');
    this.sprite = new SpriteManager();
    this.sprite.bind(spriteImg);
    this._spritesReady = false;

    // ===== Personality =====
    this.personality = 'clingy';

    // ===== Mouse Proximity =====
    this._mouseX = this.screenWidth / 2;
    this._mouseY = this.screenHeight / 2;
    this._isNearby = false;
    this._proximityRAF = null;

    // ===== Time Awareness =====
    this._timeOfDay = this._getTimeOfDay();
    this._lastTimeCheck = Date.now();
    this._hasShownTimeGreeting = false;

    // ===== Interaction Memory =====
    this._recentClicks = [];
    this._consecutiveIgnores = 0;
    this._consecutiveDismisses = 0;
    this._lastInteractionTime = Date.now();
    this._workStartTime = Date.now();
    this._hasShownLongWork = false;

    // Bubble delay timer
    this._bubbleDelayTimer = null;

    // ===== Growth System =====
    this.growth = new GrowthManager();
    this.growth.startSession();
    this._startMoodCheck();
    this._startAnalyticsTimer();

    // ===== Intro Sequence =====
    this._introPhase = null;

    // ===== Idle Animation System =====
    this._typeInterval = null;

    this.bindEvents();

    // Preload sprites then start
    this.sprite.preloadAll().then(() => {
      this._spritesReady = true;

      if (!this.growth.isIntroComplete()) {
        this._playIntroSequence();
      } else {
        this.switchMode('companion');
        if (this.growth.isNewDay()) {
          this._setTimer('timeGreeting', () => { this._showMilestoneOrGreeting(); }, 2000);
        } else {
          this._setTimer('timeGreeting', () => { this._showTimeGreeting(); }, 2000);
        }
      }
    });
  }

  // ========== TIMER HELPERS ==========

  _clearTimer(key) {
    clearTimeout(this._timers[key]);
    this._timers[key] = null;
  }

  _setTimer(key, fn, delay) {
    clearTimeout(this._timers[key]);
    this._timers[key] = setTimeout(fn, delay);
  }

  _clearAllTimers() {
    Object.keys(this._timers).forEach(k => this._clearTimer(k));
  }

  // ========== BUBBLE HELPER ==========

  _bubbleThen(text, immediate, duration, callback) {
    this.showBubble(text, immediate);
    this._setTimer('state', () => {
      this.hideBubble();
      if (callback) callback();
    }, duration);
  }

  // ========== GROWTH SYSTEM ==========

  _showMilestoneOrGreeting() {
    if (this.mode !== 'companion') return;

    // 1. Check milestones first
    var milestones = this.growth.checkMilestones();
    if (milestones.length > 0) {
      var id = milestones[0];
      var texts = this._getTexts();
      var text = texts.milestones[id];
      if (text) {
        this.showBubble(text);
        this.growth.markMilestoneShown(id);
        this._setTimer('timeGreeting', () => { this.hideBubble(); }, 4000);
        return;
      }
    }

    // 2. New day → daily greeting with day count
    if (this.growth.isNewDay()) {
      var texts = this._getTexts();
      var days = this.growth.data.consecutiveDays;
      var template = pickRandom(texts.dailyGreet || ['第{days}天~']);
      this.showBubble(template.replace('{days}', days));
      this._setTimer('timeGreeting', () => { this.hideBubble(); }, 3500);
      return;
    }

    // 3. Fallback to time greeting
    this._showTimeGreeting();
  }

  // ========== PERSONALITY ==========

  _getTexts() {
    return PERSONALITIES[this.personality].texts;
  }

  _getBehavior() {
    return PERSONALITIES[this.personality].behavior;
  }

  setPersonality(id) {
    if (!PERSONALITIES[id] || this.personality === id) return;
    this.personality = id;
    // Clear any pending delayed bubble
    clearTimeout(this._bubbleDelayTimer);
    this._bubbleDelayTimer = null;
    this.hideBubble();
    // Apply personality visual class
    this.container.classList.remove('personality-clingy', 'personality-tsundere', 'personality-energetic', 'personality-dramatic');
    this.container.classList.add('personality-' + id);
    // Refresh current behavior
    if (this.mode === 'companion' && !this.isPaused && this.state === 'idle') {
      this.scheduleNextAction();
    }
  }

  // ========== TIME AWARENESS ==========

  _getTimeOfDay() {
    var h = new Date().getHours();
    if (h >= 7 && h < 10) return 'morning';
    if (h >= 10 && h < 12) return 'forenoon';
    if (h >= 12 && h < 14) return 'noon';
    if (h >= 14 && h < 17) return 'afternoon';
    if (h >= 17 && h < 19) return 'evening';
    if (h >= 19 && h < 23) return 'night';
    return 'lateNight';
  }

  _showTimeGreeting() {
    if (this.mode !== 'companion') return;
    var texts = this._getTexts();
    var greetMap = {
      morning: texts.morningGreet,
      forenoon: texts.morningGreet,
      noon: texts.noonGreet,
      afternoon: null,
      evening: texts.eveningGreet,
      night: texts.nightGreet,
      lateNight: texts.nightGreet,
    };
    var greetTexts = greetMap[this._timeOfDay];
    if (!greetTexts) return;

    this.showBubble(pickRandom(greetTexts));
    this._hasShownTimeGreeting = true;

    this._setTimer('timeGreeting', () => {
      this.hideBubble();
    }, 3500);
  }

  _checkTimeChange() {
    var now = Date.now();
    if (now - this._lastTimeCheck < 60000) return;
    this._lastTimeCheck = now;

    var newTime = this._getTimeOfDay();
    if (newTime !== this._timeOfDay) {
      this._timeOfDay = newTime;
      this._hasShownTimeGreeting = false;
      if (this.mode === 'companion' && (this.state === 'idle' || this.state === 'sitting')) {
        this._showTimeGreeting();
      }
    }

    // Long work session (2 hours)
    if (!this._hasShownLongWork && (now - this._workStartTime > 2 * 60 * 60 * 1000)) {
      this._hasShownLongWork = true;
      if (this.mode === 'companion') {
        this.walkTo(this.screenWidth * 0.45, () => {
          this.setState('reminding');
          this.showBubble(pickRandom(this._getTexts().longWork));
          this._setTimer('state', () => { this._recordReminderIgnore(); this.dismissReminder(); }, 10000);
        });
      }
    }
  }

  // ========== MOUSE PROXIMITY ==========

  _updateProximity() {
    if (this.mode !== 'companion' || this.isDragging) return;

    var rect = this.container.getBoundingClientRect();
    var catCenterX = rect.left + rect.width / 2;
    var catCenterY = rect.top + rect.height / 2;
    var dx = this._mouseX - catCenterX;
    var dy = this._mouseY - catCenterY;
    var distance = Math.sqrt(dx * dx + dy * dy);

    var wasNearby = this._isNearby;
    this._isNearby = distance < 140;

    if (this._isNearby && !this.isDragging) {
      // First time entering proximity — say hi
      if (!wasNearby && (this.state === 'idle' || this.state === 'sitting')) {
        if (Math.random() < 0.3 && this.bubble && !this.bubble.classList.contains('show')) {
          this.showBubble(pickRandom(this._getTexts().nearbyGreet), true);
          setTimeout(() => this.hideBubble(), 1200);
        }
      }
    }
  }

  // ========== SEEK ATTENTION ==========

  _startSeekAttention() {
    this._clearTimer('seek');
    if (this.mode !== 'companion' || this.isPaused) return;

    var behavior = this._getBehavior();
    var checkInterval = (behavior.seekCheckInterval || 10) * 60 * 1000;
    var threshold = (behavior.seekTime || 12) * 60 * 1000;

    // Low mood: seek attention more frequently
    if (this.growth.getMoodLevel() === 'low') checkInterval = Math.floor(checkInterval / 2);

    this._setTimer('seek', () => {
      if (this.mode !== 'companion' || this.isPaused) return;
      if (Date.now() - this._lastInteractionTime > threshold) {
        var targetX = Math.max(this.minX, Math.min(this._mouseX - 40, this.maxX));
        this.walkTo(targetX, () => {
          this.setState('sitting');
          // Low mood: mix moodLow texts into seek pool
          var texts = this._getTexts();
          var seekPool = [...texts.seekAttention];
          if (this.growth.getMoodLevel() === 'low' && texts.moodLow) {
            seekPool = seekPool.concat(texts.moodLow);
          }
          this.showBubble(pickRandom(seekPool));
          this._setTimer('state', () => {
            this.hideBubble();
            this.setState('idle');
            this.scheduleNextAction();
            this._startSeekAttention();
          }, 4000);
        });
      } else {
        this._startSeekAttention();
      }
    }, checkInterval);
  }

  // ========== MODE SWITCHING ==========

  switchMode(mode) {
    this.mode = mode;
    this._clearAllTimers();
    this.isPoppedIn = false;
    this.hideBubble();

    // Restart timers that persist across modes
    this._startMoodCheck();
    this._startAnalyticsTimer();

    // Ensure personality visual class is applied
    this.container.classList.remove('personality-clingy', 'personality-tsundere', 'personality-energetic', 'personality-dramatic');
    this.container.classList.add('personality-' + this.personality);

    switch (mode) {
      case 'companion':
        this.container.style.opacity = '1';
        this.container.style.pointerEvents = 'auto';
        this.container.style.bottom = '32px';
        this.container.style.top = '';
        this.container.style.left = this.x + 'px';
        this.setState('idle');
        this.scheduleNextAction();
        this.startHealthReminders();
        this.startBlinkTimer();
        this._startSeekAttention();
        this._startIdleAnimations();
        break;

      case 'reminder':
        this.container.style.opacity = '0';
        this.container.style.pointerEvents = 'none';
        this.startHealthReminders();
        break;
    }
  }

  // ========== STATE ==========

  setState(newState) {
    if (this.state === newState) return;
    var wasSleeping = this.state === 'sleeping';
    this.state = newState;

    // Map internal states to sprite states
    var spriteState = newState;
    if (newState === 'stopping') spriteState = 'idle';
    if (newState === 'reminding') spriteState = 'remind';
    if (newState === 'sitting') spriteState = 'sit';

    if (this._spritesReady) {
      this.sprite.play(spriteState);
    }

    // CSS class for stopping head tilt
    this.character.classList.remove('head-tilt', 'paw-stretch');
    if (newState === 'stopping') {
      this.character.classList.add('head-tilt');
    }

    // Wake-up stretch
    if (wasSleeping && newState !== 'sleeping') {
      this.character.classList.add('paw-stretch');
      this._setTimer('idleAnim', () => {
        this.character.classList.remove('paw-stretch');
      }, 800);
    }
  }

  // ========== BLINK (now handled by sprite animation frames) ==========

  startBlinkTimer() {
    // Blinking is built into sprite idle frames, no separate timer needed
  }

  // ========== DRAG (companion only) ==========

  startDrag(e) {
    if (this.mode !== 'companion') return;
    this.isDragging = true;
    this.dragMoved = false;
    var rect = this.container.getBoundingClientRect();
    this.dragOffsetX = e.clientX - rect.left;
    this.dragOffsetY = e.clientY - rect.top;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
  }

  onDrag(e) {
    if (!this.isDragging) return;
    var dx = e.clientX - this.dragStartX;
    var dy = e.clientY - this.dragStartY;
    if (!this.dragMoved && Math.abs(dx) + Math.abs(dy) > 5) {
      this.dragMoved = true;
      this._clearTimer('state');
      this._clearTimer('blink');
      this.container.style.transition = '';
      this.character.style.cursor = 'grabbing';
      this.character.style.transition = 'none';
    }
    if (!this.dragMoved) return;
    var clampedX = Math.max(10, Math.min(e.clientX - this.dragOffsetX, this.screenWidth - 100));
    var clampedY = Math.max(10, Math.min(e.clientY - this.dragOffsetY, this.screenHeight - 110));
    this._pendingDragX = clampedX;
    this._pendingDragY = clampedY;
    if (!this._dragRaf) {
      this._dragRaf = requestAnimationFrame(() => {
        this.container.style.left = this._pendingDragX + 'px';
        this.container.style.top = this._pendingDragY + 'px';
        this.container.style.bottom = 'auto';
        this.x = this._pendingDragX;
        this._dragRaf = null;
      });
    }
  }

  endDrag() {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (this._dragRaf) {
      cancelAnimationFrame(this._dragRaf);
      this._dragRaf = null;
    }
    if (this.dragMoved) {
      this._lastInteractionTime = Date.now();
      this.growth.adjustMood(GrowthManager.MOOD_DRAG);
      this.growth.recordAnalyticInteraction();
      this.character.style.cursor = 'grab';
      this.character.style.transition = 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)';
      this.setState('idle');
      this.showBubble(this._getTexts().dropReaction, true);
      this._setTimer('state', () => {
        this.hideBubble();
        this.scheduleNextAction();
      }, 800);
    }
  }

  // ========== COMPANION MODE — ACTION SCHEDULER ==========

  scheduleNextAction() {
    if (this.mode !== 'companion' || this.isPaused) return;
    var intervals = [3000, 5000, 7000, 11000];
    var delay = intervals[Math.floor(Math.random() * intervals.length)];
    this._clearTimer('state');
    this._setTimer('state', () => {
      if (this.isPaused || this.mode !== 'companion') return;

      this._checkTimeChange();

      var texts = this._getTexts();
      var profile = this._getTimeProfile();
      var moodLevel = this.growth.getMoodLevel();

      // === Performance animations (happy / surprised / annoyed) ===
      // Personality-driven rates
      var expr = this._getBehavior().expressions || {};
      var perfRoll = Math.random();
      var happyThreshold = expr.happy || 0;
      var surprisedThreshold = happyThreshold + (expr.surprised || 0);
      var annoyedThreshold = surprisedThreshold + (expr.annoyed || 0);

      if (perfRoll < happyThreshold && texts.moodHigh) {
        this.setState('happy');
        this.showBubble(pickRandom(texts.moodHigh), true);
        this._setTimer('state', () => {
          this.hideBubble();
          this.setState('idle');
          this.scheduleNextAction();
        }, 1200);
        return;
      }
      if (perfRoll < surprisedThreshold) {
        this.setState('surprised');
        var surprisePool = [
          '？！',
          '（竖起耳朵）',
          '（突然警觉）',
        ];
        this.showBubble(pickRandom(surprisePool), true);
        this._setTimer('state', () => {
          this.hideBubble();
          this.setState('idle');
          this.scheduleNextAction();
        }, 1000);
        return;
      }
      if (perfRoll < annoyedThreshold) {
        this.setState('annoyed');
        var annoyPool = [
          '啧。',
          '（甩尾巴）',
          '（撇头）',
        ];
        this.showBubble(pickRandom(annoyPool), true);
        this._setTimer('state', () => {
          this.hideBubble();
          this.setState('idle');
          this.scheduleNextAction();
        }, 800);
        return;
      }

      // === Normal action probabilities ===
      var walk = profile.walk, sit = profile.sit, look = profile.look, yawn = profile.yawn;
      if (moodLevel === 'high') {
        walk *= 1.3; sit *= 0.6; yawn *= 0.5;
      } else if (moodLevel === 'low') {
        walk *= 0.5; sit *= 1.5; yawn *= 2.0;
      }
      // Renormalize
      var total = walk + sit + look + yawn;
      walk /= total; sit /= total; look /= total; yawn /= total;

      var r = Math.random();
      var wEnd = walk;
      var sEnd = wEnd + sit;
      var lEnd = sEnd + look;

      if (r < wEnd) {
        this.wander();
      } else if (r < sEnd) {
        this.setState('sitting');
        // Blend mood texts for sitting
        var sitPool = [...texts.sit];
        if (moodLevel === 'low' && texts.moodLow && Math.random() < 0.5) {
          sitPool = texts.moodLow;
        } else if (moodLevel === 'high' && texts.moodHigh && Math.random() < 0.4) {
          sitPool = texts.moodHigh;
        }
        this._bubbleThen(pickRandom(sitPool), false, 3500, () => {
          // Random expression break: personality-driven rate
          var behavior = this._getBehavior();
          if (Math.random() < (behavior.sitBreak || 0.2)) {
            this._playRandomExpression(() => {
              this.setState('idle');
              this.scheduleNextAction();
            });
          } else {
            this.setState('idle');
            this.scheduleNextAction();
          }
        });
      } else if (r < lEnd) {
        this.setState('stopping');
        this._bubbleThen(pickRandom(texts.lookAround), false, 2500, () => {
          this.setState('idle');
          this.scheduleNextAction();
        });
      } else {
        var yawnPool = [...texts.yawn];
        if (moodLevel === 'low' && texts.moodLow && Math.random() < 0.4) {
          yawnPool = texts.moodLow;
        }
        this._bubbleThen(pickRandom(yawnPool), false, 2000, () => {
          this.setState('idle');
          this.scheduleNextAction();
        });
      }
    }, delay);
  }

  // ========== BUBBLE ==========

  showBubble(text, immediate) {
    clearTimeout(this._bubbleDelayTimer);
    this._bubbleDelayTimer = null;

    var delay = immediate ? 0 : (this._getBehavior().bubbleDelay || 0);

    if (delay > 0) {
      var capturedText = text;
      this._bubbleDelayTimer = setTimeout(() => {
        this._bubbleDelayTimer = null;
        this._applyBubble(capturedText);
      }, delay);
    } else {
      this._applyBubble(text);
    }
  }

  _applyBubble(text) {
    if (!this.bubble) return;
    // Clear any ongoing typewriter
    clearInterval(this._typeInterval);
    this._typeInterval = null;

    if (text.length > 8) {
      // Typewriter effect for longer texts
      this.bubble.textContent = '';
      this.bubble.classList.add('show');
      var i = 0;
      var self = this;
      this._typeInterval = setInterval(function () {
        if (i < text.length) {
          self.bubble.textContent += text[i];
          i++;
        } else {
          clearInterval(self._typeInterval);
          self._typeInterval = null;
        }
      }, 35);
    } else {
      this.bubble.textContent = text;
      this.bubble.classList.add('show');
    }
  }

  hideBubble() {
    clearTimeout(this._bubbleDelayTimer);
    this._bubbleDelayTimer = null;
    clearInterval(this._typeInterval);
    this._typeInterval = null;
    if (this.bubble) this.bubble.classList.remove('show');
  }

  // ========== EVENTS ==========

  bindEvents() {
    this.character.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.startDrag(e);
    });
    window.addEventListener('mousemove', (e) => {
      this.onDrag(e);
      this._mouseX = e.clientX;
      this._mouseY = e.clientY;
      if (!this._proximityRAF && this.mode === 'companion') {
        this._proximityRAF = requestAnimationFrame(() => {
          this._updateProximity();
          this._proximityRAF = null;
        });
      }
    });

    // Cleanup proximity RAF on page unload
    window.addEventListener('beforeunload', () => {
      if (this._proximityRAF) {
        cancelAnimationFrame(this._proximityRAF);
        this._proximityRAF = null;
      }
    });
    window.addEventListener('mouseup', () => { this.endDrag(); });

    this.character.addEventListener('click', (e) => {
      if (this.dragMoved) {
        this.dragMoved = false;
        return;
      }
      if (this.isDragging) return; // Guard: drag still in progress
      e.stopPropagation();
      this.handleClick();
    });

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._playFarewell();
      });
    }

    this.character.addEventListener('mouseenter', () => {
      window.petAPI.setIgnoreMouseEvents(false);
    });
    this.character.addEventListener('mouseleave', () => {
      window.petAPI.setIgnoreMouseEvents(true);
    });

    var resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        var oldX = this.x;
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.minX = 70;
        this.maxX = this.screenWidth - 70;
        // Clamp position to new bounds
        this.x = Math.max(this.minX, Math.min(oldX, this.maxX));
        if (this.mode === 'companion' && !this.isDragging) {
          this.container.style.transition = '';
          this.container.style.left = this.x + 'px';
        }
      }, 150);
    });

    // IPC
    window.addEventListener('beforeunload', () => {
      this.growth.endSession();
    });

    window.petAPI.onTogglePause((paused) => {
      this.isPaused = paused;
      if (paused) {
        this._clearAllTimers();
        if (this.mode === 'companion') {
          this.showBubble(pickRandom(this._getTexts().yawn));
          this._setTimer('state', () => {
            this.hideBubble();
            this.setState('sleeping');
          }, 1500);
        }
      } else {
        this.switchMode(this.mode);
      }
    });

    window.petAPI.onDismissReminder(() => {
      this._recordReminderDismiss();
      this.dismissReminder();
    });

    window.petAPI.onSwitchMode((mode) => {
      this.switchMode(mode);
    });

    window.petAPI.onUpdateSettings((settings) => {
      if (settings.breakInterval) {
        this.breakInterval = settings.breakInterval;
        this._clearTimer('breakReminder');
        this._cycleHealthTimer('breakReminder', this.breakInterval, 'healthBreak');
      }
      if (settings.waterInterval) {
        this.waterInterval = settings.waterInterval;
        this._clearTimer('waterReminder');
        this._cycleHealthTimer('waterReminder', this.waterInterval, 'healthWater');
      }
    });
  }

  // ========== PUBLIC API ==========

  setMode(mode) {
    this.switchMode(mode);
  }

  // ========== RANDOM EXPRESSION FLASH ==========

  _playRandomExpression(callback) {
    var bias = this._getBehavior().exprBias || ['happy', 'surprised', 'annoyed'];
    var expr = bias[Math.floor(Math.random() * bias.length)];
    this.setState(expr);
    this._setTimer('state', () => {
      if (callback) callback();
    }, 600);
  }

  // ========== IDLE MICRO-ANIMATIONS ==========

  _startIdleAnimations() {
    this._clearTimer('idleAnim');
    if (this.mode !== 'companion' || this.isPaused) return;
    var delay = 4000 + Math.random() * 8000; // 4-12s between idle animations
    this._setTimer('idleAnim', () => {
      if (this.state === 'idle' || this.state === 'sitting') {
        this._playIdleAnimation();
      }
      this._startIdleAnimations();
    }, delay);
  }

  _playIdleAnimation() {
    // Personality-driven expression during idle
    var behavior = this._getBehavior();
    if (Math.random() < (behavior.idleExpr || 0.15)) {
      var bias = behavior.exprBias || ['happy', 'surprised'];
      var chosen = bias[Math.floor(Math.random() * bias.length)];
      this.setState(chosen);
      this._setTimer('idleAnim', () => {
        this.setState(this.state === 'walking' ? 'walking' : 'idle');
      }, 500);
      return;
    }
    // Wiggle as fallback micro-animation
    if (Math.random() < 0.4) {
      this.character.style.animation = 'none';
      this.character.offsetHeight; // force reflow
      this.character.style.animation = 'wiggle 0.5s ease';
      setTimeout(() => { this.character.style.animation = ''; }, 600);
    }
  }

  // ========== FAREWELL ==========

  _playFarewell() {
    this._clearAllTimers();
    this.setState('sitting');
    var texts = this._getTexts();
    this.showBubble(pickRandom(texts.nightGreet || ['Bye~']), true);
    this.container.classList.add('farewell');
    this._setTimer('state', () => {
      window.petAPI.quitApp();
    }, 1800);
  }

  // ========== MOOD CHECK (periodic) ==========

  _startMoodCheck() {
    this._clearTimer('mood');
    this._setTimer('mood', () => {
      try {
        this.growth.checkMoodDecay(this._lastInteractionTime);
        // Update CSS class based on mood
        var level = this.growth.getMoodLevel();
        this.container.classList.remove('mood-high', 'mood-low');
        if (level === 'high') this.container.classList.add('mood-high');
        if (level === 'low') this.container.classList.add('mood-low');

        // Update mood bar
        var mood = this.growth.getMood();
        var pct = ((mood - GrowthManager.MOOD_FLOOR) / (GrowthManager.MOOD_CEILING - GrowthManager.MOOD_FLOOR)) * 100;
        this.container.style.setProperty('--mood-pct', pct + '%');
      } catch {
        // Ensure chain continues even on error
      }
      this._startMoodCheck();
    }, GrowthManager.MOOD_DECAY_CHECK_INTERVAL);
  }

  // ========== ANALYTICS TIMER ==========

  _startAnalyticsTimer() {
    this._clearTimer('analytics');
    this._setTimer('analytics', () => {
      try {
        if (this.mode === 'companion') {
          this.growth.recordModeTime(this.mode, 60000);
        }
        this.growth.save();
      } catch {
        // Ensure chain continues even on error
      }
      this._startAnalyticsTimer();
    }, 60000);
  }

  // ========== STATS BUBBLE (tray "打卡") ==========

  _showStatsBubble() {
    var stats = this.growth.getStats();
    var text = '\u{1F4C5} ' + stats.consecutiveDays + '\u5929 \u00B7 ' + stats.bondTitle + ' \u00B7 ' + stats.totalInteractions + '\u6B21';

    if (this.mode === 'reminder') {
      this._popInForReminder(() => {
        this.showBubble(text, true);
        this._setTimer('state', () => {
          this.hideBubble();
          this._popOutAfterReminder();
        }, 4500);
      });
    } else {
      this._clearTimer('state');
      var centerX = this.screenWidth * 0.4;
      this.walkTo(centerX, () => {
        this.setState('sitting');
        this.showBubble(text, true);
        this._setTimer('state', () => {
          this.hideBubble();
          this.setState('idle');
          this.scheduleNextAction();
        }, 4500);
      });
    }
  }
}
