/**
 * Sprite Manager - GIF-based animation system for the pet
 * Each state is a single animated GIF file that plays automatically
 * Supports both GIF (auto-playing) and static PNG/SVG fallback
 */

class SpriteManager {
  constructor() {
    /** @type {HTMLImageElement} */
    this.img = null;

    // State → file path mapping (subdirectory/same-name.gif)
    this._states = {
      idle:      'idle/idle.gif',
      walk:      'walk/walk.gif',
      sit:       'sit/sit.gif',
      sleep:     'sleep/sleep.gif',
      happy:     'happy/happy.gif',
      reminding: 'remind/remind.gif',
      annoyed:   'annoyed/annoyed.gif',
      surprised: 'surprised/surprised.gif',
      stopping:  'idle/idle.gif',
      drag:      'drag/drag.gif',
    };

    // Preloaded cache: state → Image object
    this._cache = {};
    this._loaded = false;

    // Current state
    this._currentState = null;
    this._flipX = false;
  }

  // ========== INITIALIZATION ==========

  bind(imgElement) {
    this.img = imgElement;
    this.img.draggable = false;
    this.img.style.imageRendering = 'auto';
  }

  async preloadAll() {
    var basePath = 'assets/pet';
    var promises = [];

    for (var state in this._states) {
      var filepath = this._states[state];
      var candidates = [
        basePath + '/' + filepath,
        basePath + '/' + filepath.replace('.gif', '.png'),
        basePath + '/' + filepath.replace('.gif', '.svg'),
      ];
      promises.push(this._loadWithFallback(state, candidates));
    }

    await Promise.all(promises);
    this._loaded = true;
  }

  _loadWithFallback(state, candidates) {
    var self = this;
    return new Promise(function (resolve) {
      function tryNext(index) {
        if (index >= candidates.length) {
          self._cache[state] = self._createFallback();
          resolve();
          return;
        }
        var img = new Image();
        img.onload = function () {
          self._cache[state] = img;
          resolve();
        };
        img.onerror = function () {
          tryNext(index + 1);
        };
        img.src = candidates[index];
      }
      tryNext(0);
    });
  }

  _createFallback() {
    var c = document.createElement('canvas');
    c.width = 120;
    c.height = 140;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#D4A574';
    ctx.beginPath(); ctx.ellipse(60, 90, 35, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(60, 55, 25, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(38, 40); ctx.lineTo(32, 18); ctx.lineTo(50, 35); ctx.fill();
    ctx.beginPath(); ctx.moveTo(82, 40); ctx.lineTo(88, 18); ctx.lineTo(70, 35); ctx.fill();
    ctx.fillStyle = '#4A3F35';
    ctx.beginPath(); ctx.ellipse(50, 52, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(70, 52, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(52, 50, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(72, 50, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#D4918A';
    ctx.beginPath(); ctx.ellipse(60, 60, 3, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#E8C9A8';
    ctx.beginPath(); ctx.ellipse(42, 118, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(78, 118, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    return c;
  }

  // ========== PLAYBACK ==========

  play(state) {
    var resolvedState = state;
    if (!this._cache[state]) {
      resolvedState = this._states[state] ? state : 'idle';
    }
    if (!this._cache[resolvedState]) {
      resolvedState = 'idle';
    }
    if (this._currentState === resolvedState) return;
    this._currentState = resolvedState;

    if (!this.img) return;

    var cached = this._cache[resolvedState];
    if (!cached) return;

    if (cached instanceof HTMLCanvasElement) {
      this.img.src = cached.toDataURL();
    } else {
      var cleanSrc = cached.src.split('?')[0];
      this.img.src = cleanSrc + '?t=' + Date.now();
    }
  }

  stop() {
    // GIF auto-loops, nothing to stop
  }

  setFlip(left) {
    this._flipX = left;
    if (this.img) {
      this.img.style.transform = left ? 'scaleX(-1)' : '';
    }
  }

  getState() {
    return this._currentState;
  }
}
