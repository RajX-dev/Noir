const EventEmitter = require('events');
const audioManager = require('./audioManager');

class DeviceMonitor extends EventEmitter {
  constructor() {
    super();
    this.pollInterval = null;
    this.isPolling = false;
    this.lastDevicesHash = '';
    this.lastSessionsHash = '';
  }

  start(intervalMs = 2000) {
    if (this.isPolling) return;
    this.isPolling = true;

    this.poll();
    this.pollInterval = setInterval(() => {
      this.poll();
    }, intervalMs);
  }

  stop() {
    this.isPolling = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  async poll() {
    try {
      const devices = await audioManager.getOutputDevices();
      const devHash = JSON.stringify(devices.map((d) => ({ id: d.id, isDefault: d.isDefault, isActive: d.isActive })));

      if (this.lastDevicesHash && devHash !== this.lastDevicesHash) {
        this.emit('devices-changed', devices);
      }
      this.lastDevicesHash = devHash;

      const sessions = await audioManager.getAudioSessions();
      const sessHash = JSON.stringify(sessions.map((s) => ({ id: s.id, deviceId: s.deviceId, volume: Math.round(s.volume * 100), isMuted: s.isMuted })));

      if (this.lastSessionsHash && sessHash !== this.lastSessionsHash) {
        this.emit('sessions-changed', sessions);
      }
      this.lastSessionsHash = sessHash;
    } catch (err) {
      console.warn('[DeviceMonitor] Poll error:', err.message);
    }
  }
}

module.exports = new DeviceMonitor();
