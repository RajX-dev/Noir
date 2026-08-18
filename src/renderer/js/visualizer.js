// Noir Audio Level Visualizer Module
// Animates dynamic VU audio activity bars for running applications

const Visualizer = {
  activeMeters: new Map(),
  animationFrameId: null,
  isRunning: false,

  registerMeter(sessionId, meterElement, initialPeak = 0.6, initialVolume = 1.0) {
    this.activeMeters.set(sessionId, {
      el: meterElement,
      current: initialPeak * 100 * initialVolume,
      target: initialPeak * 100 * initialVolume,
      volume: initialVolume,
      isMuted: false
    });

    if (!this.isRunning) {
      this.start();
    }
  },

  unregisterMeter(sessionId) {
    this.activeMeters.delete(sessionId);
    if (this.activeMeters.size === 0) {
      this.stop();
    }
  },

  setVolume(sessionId, volume) {
    const item = this.activeMeters.get(sessionId);
    if (item) {
      item.volume = Math.max(0, Math.min(1, volume));
      if (item.volume === 0) {
        item.target = 0;
      }
    }
  },

  setMute(sessionId, isMuted) {
    const item = this.activeMeters.get(sessionId);
    if (item) {
      item.isMuted = isMuted;
      if (isMuted) {
        item.target = 0;
      }
    }
  },

  start() {
    this.isRunning = true;
    let lastUpdate = performance.now();

    const loop = (time) => {
      if (!this.isRunning) return;

      const delta = time - lastUpdate;

      // Update target periodically to simulate live music/game audio dynamics
      if (delta > 100) {
        lastUpdate = time;
        this.activeMeters.forEach((item) => {
          if (item.isMuted || item.volume <= 0.01) {
            item.target = 0;
          } else {
            // Dynamic fluctuating audio waveform scaled by session volume
            const ceiling = item.volume * 100;
            const variance = (Math.random() * 0.45 + 0.55) * ceiling;
            item.target = Math.max(4, Math.min(ceiling, variance));
          }
        });
      }

      // Smooth lerp interpolation
      this.activeMeters.forEach((item) => {
        if (item.el) {
          item.current += (item.target - item.current) * 0.22;
          const displayVal = item.isMuted || item.volume <= 0.01 ? 0 : Math.round(item.current);
          item.el.style.width = `${displayVal}%`;
        }
      });

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  },

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
};

window.Visualizer = Visualizer;
