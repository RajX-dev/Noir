const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const audioManager = require('./audio/audioManager');
const deviceMonitor = require('./audio/deviceMonitor');

let mainWindow = null;

// Mock profiles for now (Phase 4 will build persistent profiles)
let mockProfiles = [
  {
    id: 'prof-1',
    name: 'Gaming',
    icon: '🎮',
    isActive: true,
    isDefault: true,
    mappings: []
  },
  {
    id: 'prof-2',
    name: 'Music & Focus',
    icon: '🎵',
    isActive: false,
    isDefault: true,
    mappings: []
  },
  {
    id: 'prof-3',
    name: 'Work / Meetings',
    icon: '💼',
    isActive: false,
    isDefault: true,
    mappings: []
  }
];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 880,
    height: 680,
    minWidth: 720,
    minHeight: 520,
    maxWidth: 1400,
    maxHeight: 1000,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0f',
    resizable: true,
    show: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    deviceMonitor.start(1500);
  });

  mainWindow.on('closed', () => {
    deviceMonitor.stop();
    mainWindow = null;
  });
}

// Window control IPC handlers
ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});

// Real Audio Engine IPC Handlers
ipcMain.handle('get-devices', async () => {
  return audioManager.getOutputDevices();
});

ipcMain.handle('get-sessions', async () => {
  return audioManager.getAudioSessions();
});

ipcMain.handle('route-session', async (event, { sessionId, deviceId }) => {
  const success = await audioManager.routeSession(sessionId, deviceId);
  const sessions = await audioManager.getAudioSessions();
  const session = sessions.find((s) => s.id === sessionId);
  return { success, session };
});

ipcMain.handle('set-volume', async (event, { sessionId, volume }) => {
  const success = await audioManager.setSessionVolume(sessionId, volume);
  return { success };
});

ipcMain.handle('mute-session', async (event, { sessionId, isMuted }) => {
  const success = await audioManager.muteSession(sessionId, isMuted);
  return { success };
});

// Profile IPC Handlers (Phase 4 mock/in-memory)
ipcMain.handle('get-profiles', async () => {
  return mockProfiles;
});

ipcMain.handle('apply-profile', async (event, profileId) => {
  mockProfiles.forEach((p) => {
    p.isActive = p.id === profileId;
  });
  const activeProfile = mockProfiles.find((p) => p.id === profileId);
  const sessions = await audioManager.getAudioSessions();
  return { success: true, profile: activeProfile, sessions };
});

ipcMain.handle('save-profile', async (event, newProfile) => {
  const sessions = await audioManager.getAudioSessions();
  const profile = {
    id: `prof-${Date.now()}`,
    name: newProfile.name || 'Custom Profile',
    icon: newProfile.icon || '🎛️',
    isActive: true,
    isDefault: false,
    mappings: sessions.map((s) => ({
      processName: s.processName,
      deviceId: s.deviceId,
      volume: s.volume,
      isMuted: s.isMuted
    }))
  };
  mockProfiles.forEach((p) => {
    p.isActive = false;
  });
  mockProfiles.push(profile);
  return { success: true, profile, profiles: mockProfiles };
});

ipcMain.handle('delete-profile', async (event, profileId) => {
  mockProfiles = mockProfiles.filter((p) => p.id !== profileId);
  return { success: true, profiles: mockProfiles };
});

// Device and Session Change Notifications
deviceMonitor.on('devices-changed', (devices) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('devices-changed', devices);
  }
});

deviceMonitor.on('sessions-changed', (sessions) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('sessions-changed', sessions);
  }
});

// App Lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
