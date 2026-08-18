const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),

  // Audio Device and Session APIs
  getDevices: () => ipcRenderer.invoke('get-devices'),
  getSessions: () => ipcRenderer.invoke('get-sessions'),
  routeSession: (sessionId, deviceId) =>
    ipcRenderer.invoke('route-session', { sessionId, deviceId }),
  setVolume: (sessionId, volume) =>
    ipcRenderer.invoke('set-volume', { sessionId, volume }),
  muteSession: (sessionId, isMuted) =>
    ipcRenderer.invoke('mute-session', { sessionId, isMuted }),

  // Profile APIs
  getProfiles: () => ipcRenderer.invoke('get-profiles'),
  applyProfile: (profileId) => ipcRenderer.invoke('apply-profile', profileId),
  saveProfile: (profile) => ipcRenderer.invoke('save-profile', profile),
  deleteProfile: (profileId) => ipcRenderer.invoke('delete-profile', profileId),

  // System Integration APIs
  getAutostartStatus: () => ipcRenderer.invoke('get-autostart-status'),
  setAutostartStatus: (enabled) => ipcRenderer.invoke('set-autostart-status', enabled),

  // Push Event Listeners
  onDevicesChanged: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('devices-changed', handler);
    return () => ipcRenderer.removeListener('devices-changed', handler);
  },
  onSessionsChanged: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('sessions-changed', handler);
    return () => ipcRenderer.removeListener('sessions-changed', handler);
  },
  onVolumeChanged: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('volume-changed', handler);
    return () => ipcRenderer.removeListener('volume-changed', handler);
  }
});
