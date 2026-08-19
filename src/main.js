const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const audioManager = require('./audio/audioManager');
const deviceMonitor = require('./audio/deviceMonitor');
const profileManager = require('./profiles/profileManager');
const trayManager = require('./tray/trayManager');
const WindowStateManager = require('./utils/windowState');

app.setName('noir');

let mainWindow = null;
let isQuitting = false;
const windowState = new WindowStateManager({ defaultWidth: 1080, defaultHeight: 720 });

// Ensure single-instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Noir] Another instance is already running. Focusing active window.');
  app.quit();
  process.exit(0);
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  const savedState = windowState.loadState();

  mainWindow = new BrowserWindow({
    width: savedState.width,
    height: savedState.height,
    x: savedState.x,
    y: savedState.y,
    minWidth: 900,
    minHeight: 520,
    maxWidth: 1600,
    maxHeight: 1080,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0f',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
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

  windowState.track(mainWindow);
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', async () => {
    mainWindow.show();
    deviceMonitor.start(1500);

    // Initialize System Tray
    await trayManager.init({
      mainWindow,
      profileManager,
      audioManager,
      onQuit: () => {
        isQuitting = true;
        app.quit();
      }
    });

    // Auto-apply active profile on startup
    try {
      const activeProfile = await profileManager.getActiveProfile();
      if (activeProfile) {
        await profileManager.applyProfile(activeProfile.id, audioManager);
      }
    } catch (err) {
      console.error('[Noir] Auto-apply startup profile error:', err);
    }
  });

  // Minimize to tray on close
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      trayManager.notifyMinimized();
      trayManager.updateMenu();
      return false;
    }
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
  if (mainWindow) {
    mainWindow.close(); // Triggers the close-to-tray listener
  }
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

// Profile IPC Handlers (Phase 4 & 5 Persistent Engine + Tray Sync)
ipcMain.handle('get-profiles', async () => {
  return profileManager.getProfiles();
});

ipcMain.handle('apply-profile', async (event, profileId) => {
  const res = await profileManager.applyProfile(profileId, audioManager);
  await trayManager.updateMenu();
  return res;
});

ipcMain.handle('save-profile', async (event, newProfile) => {
  const sessions = await audioManager.getAudioSessions();
  const res = await profileManager.saveProfile({
    name: newProfile.name,
    icon: newProfile.icon,
    sessions
  });
  await trayManager.updateMenu();
  return { success: true, profile: res.profile, profiles: res.profiles };
});

ipcMain.handle('delete-profile', async (event, profileId) => {
  const res = await profileManager.deleteProfile(profileId);
  await trayManager.updateMenu();
  return res;
});

// System Settings IPC
ipcMain.handle('get-autostart-status', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('set-autostart-status', (event, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true
  });
  trayManager.updateMenu();
  return { success: true, enabled };
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
    } else if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit();
  }
});
