/**
 * Pet Movement System - extends PetEngine.prototype
 * Handles walking, wandering, 2D routes, and time-based speed profiles
 */

(function () {
  'use strict';

  var proto = PetEngine.prototype;

  // ========== TIME PROFILES ==========

  proto._getTimeProfile = function () {
    var profiles = {
      morning:    { speedMul: 1.25, walk: 0.55, sit: 0.15, look: 0.20, yawn: 0.10 },
      forenoon:   { speedMul: 1.0,  walk: 0.45, sit: 0.20, look: 0.20, yawn: 0.15 },
      noon:       { speedMul: 0.7,  walk: 0.20, sit: 0.35, look: 0.15, yawn: 0.30 },
      afternoon:  { speedMul: 1.0,  walk: 0.45, sit: 0.20, look: 0.20, yawn: 0.15 },
      evening:    { speedMul: 0.85, walk: 0.35, sit: 0.25, look: 0.20, yawn: 0.20 },
      night:      { speedMul: 0.6,  walk: 0.20, sit: 0.30, look: 0.15, yawn: 0.35 },
      lateNight:  { speedMul: 0.5,  walk: 0.10, sit: 0.35, look: 0.10, yawn: 0.45 },
    };
    return profiles[this._timeOfDay] || profiles.afternoon;
  };

  // ========== EFFECTIVE SPEED ==========

  proto._getEffectiveSpeed = function () {
    var profile = this._getTimeProfile();
    var pBehavior = this._getBehavior();
    var moodLevel = this.growth.getMoodLevel();
    var moodSpeedMul = 1.0;
    if (moodLevel === 'high') moodSpeedMul = 1.1;
    else if (moodLevel === 'low') moodSpeedMul = 0.8;
    return this.walkSpeed * profile.speedMul * pBehavior.speedMul * moodSpeedMul;
  };

  // ========== HORIZONTAL WALK (original) ==========

  proto.walkTo = function (targetX, onArrive) {
    this.setState('walking');
    var effectiveSpeed = this._getEffectiveSpeed();
    var distance = Math.abs(targetX - this.x);
    var duration = Math.max(distance / effectiveSpeed, 600);
    this._facingLeft = targetX < this.x;
    this.character.style.transform = this._facingLeft ? 'scaleX(-1)' : '';
    this.container.style.transition = 'left ' + duration + 'ms ease-in-out';
    this.container.style.left = targetX + 'px';
    this.x = targetX;
    this._clearTimer('state');
    this._setTimer('state', () => {
      this.container.style.transition = '';
      if (onArrive) onArrive();
      else { this.setState('idle'); this.scheduleNextAction(); }
    }, duration);
  };

  // ========== 2D WALK ==========

  proto.walkToPoint = function (targetX, targetY, onArrive) {
    this.setState('walking');
    var effectiveSpeed = this._getEffectiveSpeed();
    var dx = Math.abs(targetX - this.x);
    var dy = Math.abs(targetY - this.y);
    var distance = Math.sqrt(dx * dx + dy * dy);
    var duration = Math.max(distance / effectiveSpeed, 600);
    this._facingLeft = targetX < this.x;
    this.character.style.transform = this._facingLeft ? 'scaleX(-1)' : '';
    this.container.style.transition = 'left ' + duration + 'ms ease-in-out, top ' + duration + 'ms ease-in-out';
    this.container.style.left = targetX + 'px';
    this.container.style.top = targetY + 'px';
    this.container.style.bottom = 'auto';
    this.x = targetX;
    this.y = targetY;
    this._clearTimer('state');
    this._setTimer('state', () => {
      this.container.style.transition = '';
      if (onArrive) onArrive();
      else { this.setState('idle'); this.scheduleNextAction(); }
    }, duration);
  };

  // ========== JUMP TO Y ==========

  proto.jumpToY = function (targetY, onArrive) {
    var dy = Math.abs(targetY - this.y);
    var duration = Math.max(dy / (this.verticalSpeed * 4), 300);
    // Brief jump arc
    this.character.style.transform = (this._facingLeft ? 'scaleX(-1) ' : '') + 'translateY(-10px)';
    this.container.style.transition = 'top ' + duration + 'ms cubic-bezier(0.34, 1.56, 0.64, 1)';
    this.container.style.top = targetY + 'px';
    this.container.style.bottom = 'auto';
    this.y = targetY;
    this._clearTimer('state');
    this._setTimer('state', () => {
      this.character.style.transform = this._facingLeft ? 'scaleX(-1)' : '';
      this.container.style.transition = '';
      if (onArrive) onArrive();
      else { this.setState('idle'); this.scheduleNextAction(); }
    }, duration + 100);
  };

  // ========== RETURN TO GROUND ==========

  proto._returnToGround = function (onArrive) {
    var groundY = this.maxY;
    if (Math.abs(this.y - groundY) < 20) {
      // Already near ground
      this.container.style.bottom = '32px';
      this.container.style.top = '';
      this.y = groundY;
      if (onArrive) onArrive();
      return;
    }
    this.jumpToY(groundY, () => {
      this.container.style.bottom = '32px';
      this.container.style.top = '';
      this.y = groundY;
      if (onArrive) onArrive();
    });
  };

  // ========== WANDERING (5 route types) ==========

  proto.wander = function () {
    if (this.isPaused) return;

    var routeType = this._pickRoute();
    switch (routeType) {
      case 'horizontal':    this._wanderHorizontal(); break;
      case 'corner':        this._wanderToCorner(); break;
      case 'edge-explore':  this._wanderEdge(); break;
      case 'vertical-hop':  this._wanderVerticalHop(); break;
      case 'top-walk':      this._wanderTopWalk(); break;
    }
  };

  proto._pickRoute = function () {
    var r = Math.random();
    if (r < 0.55) return 'horizontal';
    if (r < 0.70) return 'corner';
    if (r < 0.80) return 'edge-explore';
    if (r < 0.90) return 'vertical-hop';
    return 'top-walk';
  };

  // --- Route: horizontal (original behavior) ---
  proto._wanderHorizontal = function () {
    var behavior = this._getBehavior();
    var targetX;
    if (behavior.walkTowardMouse && Math.random() < 0.4) {
      targetX = Math.max(this.minX, Math.min(this._mouseX - 40, this.maxX));
    } else {
      targetX = this.minX + Math.random() * (this.maxX - this.minX);
    }
    // Make sure we're on the ground
    this.container.style.bottom = '32px';
    this.container.style.top = '';
    this.y = this.maxY;
    this.walkTo(targetX);
  };

  // --- Route: corner exploration ---
  proto._wanderToCorner = function () {
    var corners = [
      { x: this.minX + 20, y: this.minY + 20 },
      { x: this.maxX - 20, y: this.minY + 20 },
      { x: this.minX + 20, y: this.maxY * 0.4 },
      { x: this.maxX - 20, y: this.maxY * 0.4 },
    ];
    var corner = corners[Math.floor(Math.random() * corners.length)];
    var texts = this._getTexts();

    this.walkToPoint(corner.x, corner.y, () => {
      this.setState('sitting');
      var lookPool = texts.lookAround.concat(texts.sit);
      this._bubbleThen(pickRandom(lookPool), false, 3000, () => {
        this.setState('idle');
        this._returnToGround(() => {
          this.scheduleNextAction();
        });
      });
    });
  };

  // --- Route: edge exploration ---
  proto._wanderEdge = function () {
    var goLeft = Math.random() < 0.5;
    var edgeX = goLeft ? this.minX + 10 : this.maxX - 10;
    var midY = this.maxY * 0.5 + Math.random() * this.maxY * 0.3;
    var texts = this._getTexts();

    // Walk to edge first (horizontal only)
    this.container.style.bottom = '32px';
    this.container.style.top = '';
    this.y = this.maxY;
    this.walkTo(edgeX, () => {
      // Then walk up along the edge
      this.walkToPoint(edgeX, midY, () => {
        this.setState('stopping');
        this._bubbleThen(pickRandom(texts.lookAround), true, 2500, () => {
          this._returnToGround(() => {
            this.scheduleNextAction();
          });
        });
      });
    });
  };

  // --- Route: vertical hop ---
  proto._wanderVerticalHop = function () {
    var targetY = this.minY + Math.random() * (this.maxY * 0.5);
    var texts = this._getTexts();

    this.jumpToY(targetY, () => {
      this.setState('stopping');
      var pool = texts.lookAround;
      if (texts.yawn) pool = pool.concat(texts.yawn);
      this._bubbleThen(pickRandom(pool), true, 2500, () => {
        this.setState('idle');
        this._returnToGround(() => {
          this.scheduleNextAction();
        });
      });
    });
  };

  // --- Route: top walk ---
  proto._wanderTopWalk = function () {
    var topY = this.minY + Math.random() * 40;
    var fromLeft = Math.random() < 0.5;
    var startX = fromLeft ? this.minX + 20 : this.maxX - 20;
    var endX = fromLeft ? this.maxX - 20 : this.minX + 20;
    var texts = this._getTexts();

    // Jump up to the top
    this.walkToPoint(startX, topY, () => {
      this.setState('walking');
      // Walk across the top
      this._bubbleThen(pickRandom(texts.seekAttention), true, 2000, () => {
        this.hideBubble();
      });
      this._facingLeft = endX < startX;
      this.character.style.transform = this._facingLeft ? 'scaleX(-1)' : '';
      var effectiveSpeed = this._getEffectiveSpeed();
      var distance = Math.abs(endX - startX);
      var duration = Math.max(distance / effectiveSpeed, 600);
      this.container.style.transition = 'left ' + duration + 'ms ease-in-out';
      this.container.style.left = endX + 'px';
      this.x = endX;
      this._clearTimer('state');
      this._setTimer('state', () => {
        this.container.style.transition = '';
        this.setState('idle');
        this._returnToGround(() => {
          this.scheduleNextAction();
        });
      }, duration);
    });
  };

})();
