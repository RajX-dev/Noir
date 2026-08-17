const nativeBridge = require('./nativeBridge');

class AudioManager {
  constructor() {
    this.cachedDevices = [];
    this.cachedSessions = [];
    this.lastSnapshot = [];
  }

  /**
   * Helper to infer device type from its friendly name
   * @param {string} name
   * @returns {'speakers' | 'headphones' | 'bluetooth' | 'hdmi' | 'usb'}
   */
  inferDeviceType(name = '') {
    const lower = name.toLowerCase();
    if (lower.includes('bluetooth') || lower.includes(' bt ') || lower.includes('wireless') || lower.includes('flip') || lower.includes('airpods')) {
      return 'bluetooth';
    }
    if (lower.includes('headphone') || lower.includes('headset') || lower.includes('earphone') || lower.includes('wh-') || lower.includes('wf-') || lower.includes('buds')) {
      return 'headphones';
    }
    if (lower.includes('hdmi') || lower.includes('displayport') || lower.includes('monitor') || lower.includes('tv') || lower.includes('nvidia') || lower.includes('amd high definition')) {
      return 'hdmi';
    }
    if (lower.includes('usb') || lower.includes('dac') || lower.includes('mic3')) {
      return 'usb';
    }
    return 'speakers';
  }

  /**
   * Refresh and return normalized audio playback devices
   */
  async getOutputDevices() {
    try {
      const snapshot = await nativeBridge.getSystemAudioSnapshot();
      this.lastSnapshot = snapshot;

      // Filter only playback (Render) devices
      const deviceItems = snapshot.filter(
        (item) => item.Type === 'Device' && item.Direction === 'Render'
      );

      this.cachedDevices = deviceItems.map((item, index) => {
        const id = item['Command-Line Friendly ID'] || item['Item ID'] || `dev-${index}`;
        const name = item.Name || 'Audio Endpoint';
        const isDefault = item.Default === 'Render' || item['Default Multimedia'] === 'Yes';
        const isActive = item['Device State'] === 'Active' || item['Device State'] === 'Enabled';

        return {
          id,
          name,
          displayName: name,
          type: this.inferDeviceType(name),
          isDefault,
          isActive,
          commandId: item['Command-Line Friendly ID'] || item.Name
        };
      });

      return this.cachedDevices;
    } catch (err) {
      console.error('[AudioManager] Failed to get output devices:', err);
      return this.cachedDevices;
    }
  }

  /**
   * Refresh and return active application audio sessions
   */
  async getAudioSessions() {
    try {
      let snapshot = this.lastSnapshot;
      if (!snapshot || snapshot.length === 0) {
        snapshot = await nativeBridge.getSystemAudioSnapshot();
        this.lastSnapshot = snapshot;
      }

      // Filter applications that are rendering audio
      const appItems = snapshot.filter(
        (item) => item.Type === 'Application' && item.Direction === 'Render'
      );

      const devices = this.cachedDevices.length > 0 ? this.cachedDevices : await this.getOutputDevices();
      const defaultDevice = devices.find((d) => d.isDefault) || devices[0];

      const seen = new Set();
      const filteredSessions = [];

      for (let index = 0; index < appItems.length; index++) {
        const item = appItems[index];
        const processName = item['Process Path'] ? item['Process Path'].split('\\').pop() : item.Name;
        const displayName = item.Name && item.Name.trim() ? item.Name : (processName || 'System Sounds');
        const processId = parseInt(item['Process ID'], 10) || 0;

        // Deduplicate system sounds or duplicate instances by key
        const uniqueKey = displayName === 'System Sounds' ? 'System Sounds' : `${processName || displayName}-${processId}`;
        if (seen.has(uniqueKey)) {
          continue;
        }
        seen.add(uniqueKey);

        // Parse volume percent e.g. "75.5%" -> 0.755
        let vol = 1.0;
        if (item['Volume Percent']) {
          const parsed = parseFloat(item['Volume Percent'].replace('%', ''));
          if (!isNaN(parsed)) {
            vol = parsed / 100.0;
          }
        }

        const isMuted = item.Muted === 'Yes';

        // Match assigned device from snapshot
        let assignedDevId = defaultDevice ? defaultDevice.id : 'default';
        if (item['Device Name']) {
          const matchedDev = devices.find((d) => d.name.includes(item['Device Name']) || item['Device Name'].includes(d.name));
          if (matchedDev) {
            assignedDevId = matchedDev.id;
          }
        }

        filteredSessions.push({
          id: `ses-${processId || index}`,
          processId,
          processName,
          displayName,
          volume: vol,
          isMuted,
          peakLevel: 0.6,
          deviceId: assignedDevId,
          commandId: item['Command-Line Friendly ID'] || item['Item ID'] || processName
        });
      }

      this.cachedSessions = filteredSessions;
      return this.cachedSessions;
    } catch (err) {
      console.error('[AudioManager] Failed to get audio sessions:', err);
      return this.cachedSessions;
    }
  }

  /**
   * Route an application's audio session to a target output device
   * @param {string} sessionId
   * @param {string} deviceId
   */
  async routeSession(sessionId, deviceId) {
    const session = this.cachedSessions.find((s) => s.id === sessionId);
    const targetDev = this.cachedDevices.find((d) => d.id === deviceId);

    if (!session || !targetDev) {
      console.warn(`[AudioManager] Invalid session (${sessionId}) or device (${deviceId})`);
      return false;
    }

    const appTarget = session.processName || session.processId.toString();
    const devTarget = targetDev.commandId || targetDev.name;

    const success = await nativeBridge.routeAppToDevice(appTarget, devTarget);
    if (success) {
      session.deviceId = deviceId;
      // Invalidate snapshot cache to refresh on next poll
      this.lastSnapshot = [];
    }
    return success;
  }

  /**
   * Set per-app session volume
   * @param {string} sessionId
   * @param {number} volume - 0.0 to 1.0
   */
  async setSessionVolume(sessionId, volume) {
    const session = this.cachedSessions.find((s) => s.id === sessionId);
    if (!session) return false;

    session.volume = Math.max(0, Math.min(1, volume));
    const targetName = session.processName || session.displayName;
    return nativeBridge.setSessionVolume(targetName, session.volume);
  }

  /**
   * Mute / Unmute a session
   * @param {string} sessionId
   * @param {boolean} isMuted
   */
  async muteSession(sessionId, isMuted) {
    const session = this.cachedSessions.find((s) => s.id === sessionId);
    if (!session) return false;

    session.isMuted = typeof isMuted === 'boolean' ? isMuted : !session.isMuted;
    const targetName = session.processName || session.displayName;
    return nativeBridge.setSessionMute(targetName, session.isMuted);
  }
}

module.exports = new AudioManager();
