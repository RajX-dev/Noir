const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;

// Mock data for Phase 1 UI Demonstration
const mockDevices = [
  {
    id: 'dev-1',
    name: 'Realtek High Definition Audio',
    displayName: 'Laptop Speakers',
    type: 'speakers',
    isDefault: true,
    isActive: true,
    appCount: 2
  },
  {
    id: 'dev-2',
    name: 'Sony WH-1000XM5 (Stereo)',
    displayName: 'Sony Headphones',
    type: 'headphones',
    isDefault: false,
    isActive: true,
    appCount: 1
  },
  {
    id: 'dev-3',
    name: 'JBL Flip 6 Bluetooth',
    displayName: 'JBL Bluetooth Speaker',
    type: 'bluetooth',
    isDefault: false,
    isActive: true,
    appCount: 1
  }
];

let mockSessions = [
  {
    id: 'ses-1',
    processId: 10420,
    processName: 'Spotify.exe',
    displayName: 'Spotify',
    iconName: 'spotify',
    volume: 0.72,
    isMuted: false,
    peakLevel: 0.65,
    deviceId: 'dev-3'
  },
  {
    id: 'ses-2',
    processId: 14890,
    processName: 'VALORANT.exe',
    displayName: 'VALORANT',
    iconName: 'gamepad',
    volume: 0.95,
    isMuted: false,
    peakLevel: 0.88,
    deviceId: 'dev-2'
  },
  {
    id: 'ses-3',
    processId: 8320,
    processName: 'chrome.exe',
    displayName: 'Google Chrome',
    iconName: 'chrome',
    volume: 0.35,
    isMuted: false,
    peakLevel: 0.25,
    deviceId: 'dev-1'
  },
  {
    id: 'ses-4',
    processId: 6512,
    processName: 'Discord.exe',
    displayName: 'Discord',
    iconName: 'discord',
    volume: 0.80,
    isMuted: false,
    peakLevel: 0.40,
    deviceId: 'dev-2'
  }
];

let mockProfiles = [
  {
    id: 'prof-1',
    name: 'Gaming',
    icon: '🎮',
    isActive: true,
    isDefault: true,
    mappings: [
      { processName: 'VALORANT.exe', deviceId: 'dev-2', volume: 0.95, isMuted: false },
      { processName: 'Discord.exe', deviceId: 'dev-2', volume: 0.80, isMuted: false },
      { processName: 'Spotify.exe', deviceId: 'dev-3', volume: 0.60, isMuted: false },
      { processName: 'chrome.exe', deviceId: 'dev-1', volume: 0.20, isMuted: false }
    ]
  },
  {
    id: 'prof-2',
    name: 'Music & Focus',
    icon: '🎵',
    isActive: false,
    isDefault: true,
    mappings: [
      { processName: 'Spotify.exe', deviceId: 'dev-2', volume: 0.85, isMuted: false },
      { processName: 'Discord.exe', deviceId: 'dev-1', volume: 0.30, isMuted: true }
    ]
  },
  {
    id: 'prof-3',
    name: 'Work / Meetings',
    icon: '💼',
    isActive: false,
    isDefault: true,
    mappings: [
      { processName: 'Discord.exe', deviceId: 'dev-2', volume: 0.90, isMuted: false },
      { processName: 'Spotify.exe', deviceId: 'dev-1', volume: 0.15, isMuted: false }
    ]
  },
  {
    id: 'prof-4',
    name: 'Cinema',
    icon: '🎬',
    isActive: false,
    isDefault: false,
    mappings: [
      { processName: 'chrome.exe', deviceId: 'dev-1', volume: 0.90, isMuted: false }
    ]
  }
];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 680,
    minWidth: 420,
    minHeight: 520,
    maxWidth: 600,
    maxHeight: 900,
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
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
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

// Audio & Profile IPC handlers (Mock Phase 1)
ipcMain.handle('get-devices', async () => {
  return mockDevices;
});

ipcMain.handle('get-sessions', async () => {
  return mockSessions;
});

ipcMain.handle('route-session', async (event, { sessionId, deviceId }) => {
  const session = mockSessions.find((s) => s.id === sessionId);
  if (session) {
    session.deviceId = deviceId;
    return { success: true, session };
  }
  return { success: false, error: 'Session not found' };
});

ipcMain.handle('set-volume', async (event, { sessionId, volume }) => {
  const session = mockSessions.find((s) => s.id === sessionId);
  if (session) {
    session.volume = Math.max(0, Math.min(1, volume));
    return { success: true, session };
  }
  return { success: false, error: 'Session not found' };
});

ipcMain.handle('mute-session', async (event, { sessionId, isMuted }) => {
  const session = mockSessions.find((s) => s.id === sessionId);
  if (session) {
    session.isMuted = typeof isMuted === 'boolean' ? isMuted : !session.isMuted;
    return { success: true, session };
  }
  return { success: false, error: 'Session not found' };
});

ipcMain.handle('get-profiles', async () => {
  return mockProfiles;
});

ipcMain.handle('apply-profile', async (event, profileId) => {
  mockProfiles.forEach((p) => {
    p.isActive = p.id === profileId;
  });
  const activeProfile = mockProfiles.find((p) => p.id === profileId);
  if (activeProfile && activeProfile.mappings) {
    activeProfile.mappings.forEach((m) => {
      const session = mockSessions.find((s) => s.processName === m.processName);
      if (session) {
        session.deviceId = m.deviceId;
        session.volume = m.volume;
        session.isMuted = m.isMuted;
      }
    });
  }
  return { success: true, profile: activeProfile, sessions: mockSessions };
});

ipcMain.handle('save-profile', async (event, newProfile) => {
  const profile = {
    id: `prof-${Date.now()}`,
    name: newProfile.name || 'Custom Profile',
    icon: newProfile.icon || '🎛️',
    isActive: true,
    isDefault: false,
    mappings: mockSessions.map((s) => ({
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
