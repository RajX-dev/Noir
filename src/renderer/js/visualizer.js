// Noir Audio Level Visualizer Module
// Animates VU audio activity bars for running applications

const Visualizer = {
  activeMeters: new Map(),
  animationFrameId: null,
  isRunning: false,

  registerMeter(sessionId, meterElement, initialPeak = 0.5) {
    this.activeMeters.set(sessionId, {
      el: meterElement,
      current: initialPeak * 100,
      target: initialPeak * 100,
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

  setMute(sessionId, isMuted) {
    const item = this.activeMeters.get(sessionId);
    if (item) {
      item.isMuted = isMuted;
    }
  },

  start() {
    this.isRunning = true;
    let lastUpdate = performance.now();

    const loop = (time) => {
      if (!this.isRunning) return;

      const delta = time - lastUpdate;

      // Update target periodically to simulate live music/game audio dynamics
      if (delta > 120) {
        lastUpdate = time;
        this.activeMeters.forEach((item) => {
          if (item.isMuted) {
            item.target = 0;
          } else {
            // Dynamic fluctuating audio waveform simulation
            const variance = Math.random() * 50 - 25;
            item.target = Math.max(10, Math.min(95, item.target + variance));
          }
        });
      }

      // Smooth lerp interpolation
      this.activeMeters.forEach((item) => {
        if (item.el) {
          item.current += (item.target - item.current) * 0.15;
          const displayVal = item.isMuted ? 0 : Math.round(item.current);
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
