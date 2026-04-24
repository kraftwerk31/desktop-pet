/**
 * Pet Intro Sequence - extends PetEngine.prototype
 * Enhanced first-launch experience: peek, cautious walk, hint ring, personality showcase
 */

(function () {
  'use strict';

  var proto = PetEngine.prototype;

  proto._playIntroSequence = function () {
    this._introPhase = 'peeking';
    this.container.style.transition = 'none';
    this.container.style.left = '-50px';
    this.container.style.bottom = '32px';
    this.container.style.top = '';
    this.container.style.opacity = '0';
    this.container.style.pointerEvents = 'none';
    this.setState('idle');

    // Phase 1: peek from left edge (slower, more cautious)
    this._setTimer('intro1', () => {
      this.container.style.transition = 'left 1.5s ease-out, opacity 1s ease';
      this.container.style.left = '30px';
      this.container.style.opacity = '0.5';
    }, 1200);

    // Phase 2: cautiously walk to center
    this._setTimer('intro2', () => {
      this._introPhase = 'walking_in';
      this.container.style.opacity = '0.8';
      this.container.style.pointerEvents = 'auto';
      this.container.style.transition = 'none';
      var centerX = this.screenWidth * 0.4;

      // Slower walk during intro
      var origSpeed = this.walkSpeed;
      this.walkSpeed = origSpeed * 0.6;
      this.walkTo(centerX, () => {
        this.walkSpeed = origSpeed;
        this.container.style.opacity = '1';
        this.setState('sitting');
        this.showBubble('...', true);
        this._introPhase = 'waiting_for_click';

        // Show hint ring after 1.5s
        this._setTimer('introHint', () => {
          this.container.classList.add('intro-hint');
        }, 1500);

        // Show "click me" hint after 3.5s
        this._setTimer('introText', () => {
          if (this._introPhase === 'waiting_for_click') {
            this.showBubble('...!', true);
          }
        }, 3500);
      });
    }, 3200);
  };

  proto._introClicked = function () {
    this._clearTimer('intro1');
    this._clearTimer('intro2');
    this._clearTimer('introHint');
    this._clearTimer('introText');
    this.container.classList.remove('intro-hint');
    this.hideBubble();

    // Startled jump
    this._introPhase = 'startled';
    var baseTransform = this._facingLeft ? 'scaleX(-1)' : '';
    this.character.style.transform = baseTransform + ' translateY(-30px) scale(1.1)';
    this.character.classList.add('surprised');
    this.showBubble('\uFF01\uFF01', true);

    this._setTimer('state', () => {
      this.character.style.transform = baseTransform;
      this.character.classList.remove('surprised');
      this.hideBubble();

      // Run away to the right
      this._introPhase = 'running_away';
      var rightX = this.screenWidth - 120;
      this.walkTo(rightX, () => {
        // Peek back
        this._introPhase = 'peeking_back';
        this._facingLeft = true;
        this.character.style.transform = 'scaleX(-1)';
        this.setState('sitting');
        this.showBubble(this._getTexts().introText);

        this._setTimer('state', () => {
          this.hideBubble();
          this._introPhase = 'showing_personalities';
          this._showPersonalityShowcase();
        }, 2500);
      });
    }, 600);
  };

  // Brief personality showcase carousel
  proto._showPersonalityShowcase = function () {
    var personalities = Object.keys(PERSONALITIES);
    var idx = 0;
    var self = this;

    function showNext() {
      if (idx >= personalities.length) {
        // Done — settle on default and start
        self.hideBubble();
        self._introPhase = null;
        self.growth.completeIntro();
        self.switchMode('companion');
        return;
      }
      var p = PERSONALITIES[personalities[idx]];
      self.showBubble(p.emoji + ' ' + p.name, true);
      idx++;
      self._setTimer('state', showNext, 800);
    }

    showNext();
  };

})();
