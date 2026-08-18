const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const audioManager = require('./audio/audioManager');
const deviceMonitor = require('./audio/deviceMonitor');

const profileManager = require('./profiles/profileManager');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    minWidth: 900,
    minHeight: 520,
    maxWidth: 1600,
    maxHeight: 1080,
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

// Profile IPC Handlers (Phase 4 Persistent Profile Engine)
ipcMain.handle('get-profiles', async () => {
  return profileManager.getProfiles();
});

ipcMain.handle('apply-profile', async (event, profileId) => {
  return profileManager.applyProfile(profileId, audioManager);
});

ipcMain.handle('save-profile', async (event, newProfile) => {
  const sessions = await audioManager.getAudioSessions();
  const res = await profileManager.saveProfile({
    name: newProfile.name,
    icon: newProfile.icon,
    sessions
  });
  return { success: true, profile: res.profile, profiles: res.profiles };
});

ipcMain.handle('delete-profile', async (event, profileId) => {
  return profileManager.deleteProfile(profileId);
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
