// Noir Window State Manager
// Persists window bounds, maximized state, and position across sessions
// Ref: docs/architecture.md, docs/phases.md (Phase 5)

const fs = require('fs');
const path = require('path');
const { app, screen } = require('electron');

class WindowStateManager {
  constructor(options = {}) {
    this.defaultWidth = options.defaultWidth || 1080;
    this.defaultHeight = options.defaultHeight || 720;
    this.state = {
      width: this.defaultWidth,
      height: this.defaultHeight,
      x: undefined,
      y: undefined,
      isMaximized: false
    };
    this.storagePath = null;
    this.saveTimeout = null;
  }

  getStoragePath() {
    if (this.storagePath) return this.storagePath;
    try {
      const userData = app ? app.getPath('userData') : path.join(process.cwd(), '.data');
      this.storagePath = path.join(userData, 'window-state.json');
    } catch {
      this.storagePath = path.join(process.cwd(), 'window-state.json');
    }
    return this.storagePath;
  }

  loadState() {
    try {
      const filePath = this.getStoragePath();
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (this.validateBounds(data)) {
          this.state = { ...this.state, ...data };
        }
      }
    } catch (err) {
      console.error('[WindowStateManager] Failed to load window state:', err);
    }
    return this.state;
  }

  validateBounds(state) {
    if (!state || typeof state.x !== 'number' || typeof state.y !== 'number') {
      return true; // Use default positioning
    }

    // Verify coordinates are on a valid connected display
    const displays = screen ? screen.getAllDisplays() : [];
    if (displays.length === 0) return true;

    return displays.some((display) => {
      const { x, y, width, height } = display.bounds;
      return (
        state.x >= x - 20 &&
        state.y >= y - 20 &&
        state.x + (state.width || 100) <= x + width + 20 &&
        state.y + (state.height || 100) <= y + height + 20
      );
    });
  }

  saveState(win) {
    if (!win || win.isDestroyed()) return;

    try {
      this.state.isMaximized = win.isMaximized();
      if (!this.state.isMaximized) {
        const bounds = win.getBounds();
        this.state.x = bounds.x;
        this.state.y = bounds.y;
        this.state.width = bounds.width;
        this.state.height = bounds.height;
      }

      const filePath = this.getStoragePath();
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (err) {
      console.error('[WindowStateManager] Failed to save window state:', err);
    }
  }

  debounceSave(win) {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.saveState(win), 500);
  }

  track(win) {
    if (!win) return;

    if (this.state.isMaximized) {
      win.maximize();
    }

    win.on('resize', () => this.debounceSave(win));
    win.on('move', () => this.debounceSave(win));
    win.on('close', () => this.saveState(win));
  }
}

module.exports = WindowStateManager;
