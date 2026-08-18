const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

const os = require('os');

let SoundMixer = null;
try {
  const nsm = require('native-sound-mixer');
  SoundMixer = nsm.default || nsm;
} catch (err) {
  console.warn('[NativeBridge] native-sound-mixer not available:', err.message);
}

function getSVVPath() {
  const devPath = path.join(__dirname, '..', '..', 'assets', 'tools', 'SoundVolumeView.exe');
  if (fs.existsSync(devPath)) return devPath;

  if (process.resourcesPath) {
    const prodPath = path.join(process.resourcesPath, 'assets', 'tools', 'SoundVolumeView.exe');
    if (fs.existsSync(prodPath)) return prodPath;
  }

  return devPath;
}

const NativeBridge = {
  isAvailable() {
    return Boolean(SoundMixer);
  },

  /**
   * Run SoundVolumeView.exe with arguments
   * @param {string[]} args
   * @returns {Promise<void>}
   */
  execSVV(args) {
    return new Promise((resolve, reject) => {
      const svvPath = getSVVPath();
      if (!fs.existsSync(svvPath)) {
        return reject(new Error(`SoundVolumeView not found at ${svvPath}`));
      }

      execFile(svvPath, args, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  },

  /**
   * Dump audio configuration snapshot from SoundVolumeView
   * @returns {Promise<Array>}
   */
  async getSystemAudioSnapshot() {
    const tempFile = path.join(os.tmpdir(), `noir_audio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.json`);
    try {
      await this.execSVV(['/sjson', tempFile]);
      if (!fs.existsSync(tempFile)) {
        return [];
      }

      const raw = fs.readFileSync(tempFile, 'utf16le').replace(/^\uFEFF/, '');
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('[NativeBridge] Failed to get system audio snapshot:', err.message);
      return [];
    } finally {
      if (fs.existsSync(tempFile)) {
        try {
          fs.unlinkSync(tempFile);
        } catch (cleanupErr) {
          console.warn('[NativeBridge] Cleanup warning:', cleanupErr.message);
        }
      }
    }
  },

  /**
   * Get all render (playback) audio devices
   */
  getDevices() {
    if (!SoundMixer) return [];
    try {
      return SoundMixer.devices || [];
    } catch (err) {
      console.error('[NativeBridge] Error reading devices:', err.message);
      return [];
    }
  },

  /**
   * Set volume of a session or device using native-sound-mixer
   * @param {string} processName
   * @param {number} volume - 0.0 to 1.0
   */
  setSessionVolume(processName, volume) {
    if (!SoundMixer) return false;
    try {
      const devs = SoundMixer.devices || [];
      const clamped = Math.max(0, Math.min(1, volume));
      let updated = false;

      for (const dev of devs) {
        if (dev.sessions) {
          for (const s of dev.sessions) {
            if (s.name && s.name.toLowerCase() === processName.toLowerCase()) {
              s.volume = clamped;
              updated = true;
            }
          }
        }
      }
      return updated;
    } catch (err) {
      console.error('[NativeBridge] Error setting session volume:', err.message);
      return false;
    }
  },

  /**
   * Set mute state of a session using native-sound-mixer
   * @param {string} processName
   * @param {boolean} isMuted
   */
  setSessionMute(processName, isMuted) {
    if (!SoundMixer) return false;
    try {
      const devs = SoundMixer.devices || [];
      let updated = false;

      for (const dev of devs) {
        if (dev.sessions) {
          for (const s of dev.sessions) {
            if (s.name && s.name.toLowerCase() === processName.toLowerCase()) {
              s.mute = Boolean(isMuted);
              updated = true;
            }
          }
        }
      }
      return updated;
    } catch (err) {
      console.error('[NativeBridge] Error setting session mute:', err.message);
      return false;
    }
  },

  /**
   * Route an application to a specific audio output device via SoundVolumeView
   * @param {string} appTarget - Process name (e.g. "Spotify.exe") or PID
   * @param {string} deviceTarget - Device name or Item ID
   */
  async routeAppToDevice(appTarget, deviceTarget) {
    try {
      // /SetAppDefault <Device Name> <Default Type: 0=All, 1=Multimedia, 2=Communications> <Process Name/PID>
      await this.execSVV(['/SetAppDefault', deviceTarget, '0', appTarget]);
      return true;
    } catch (err) {
      console.error(`[NativeBridge] Failed to route ${appTarget} to ${deviceTarget}:`, err.message);
      return false;
    }
  }
};

module.exports = NativeBridge;
