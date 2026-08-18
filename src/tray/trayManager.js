// Noir System Tray Manager
// Manages system tray icon, context menu with quick profile switching, and background minimize behavior
// Ref: docs/architecture.md, docs/phases.md (Phase 5)

const { Tray, Menu, nativeImage, app, Notification } = require('electron');

class TrayManager {
  constructor() {
    this.tray = null;
    this.mainWindow = null;
    this.profileManager = null;
    this.audioManager = null;
    this.hasShownTrayNotification = false;
  }

  /**
   * Generates a 32x32 sleek neon patchbay/wave icon as nativeImage
   */
  getTrayIcon() {
    // 32x32 transparent PNG with glowing violet audio wave & jack symbol
    // Base64 encoded 32x32 RGBA PNG
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <defs>
          <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#c084fc"/>
            <stop offset="100%" stop-color="#8b5cf6"/>
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="14" fill="#0a0a12" stroke="url(#glow)" stroke-width="2"/>
        <path d="M7 16 Q 11 9, 16 16 T 25 16" fill="none" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="16" cy="16" r="3.5" fill="#ffffff"/>
      </svg>
    `;

    const iconDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgIcon).toString('base64')}`;
    const img = nativeImage.createFromDataURL(iconDataUrl);
    return img.resize({ width: 18, height: 18 });
  }

  /**
   * Initialize tray
   */
  async init({ mainWindow, profileManager, audioManager, onQuit }) {
    this.mainWindow = mainWindow;
    this.profileManager = profileManager;
    this.audioManager = audioManager;
    this.onQuit = onQuit;

    const icon = this.getTrayIcon();
    this.tray = new Tray(icon);
    this.tray.setToolTip('Noir — Audio Router');

    // Left click toggles window
    this.tray.on('click', () => {
      this.toggleWindow();
    });

    await this.updateMenu();
  }

  /**
   * Toggle window show/hide
   */
  toggleWindow() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    if (this.mainWindow.isVisible() && !this.mainWindow.isMinimized()) {
      if (this.mainWindow.isFocused()) {
        this.mainWindow.hide();
      } else {
        this.mainWindow.focus();
      }
    } else {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  /**
   * Notify user when minimized to tray
   */
  notifyMinimized() {
    if (this.hasShownTrayNotification) return;
    this.hasShownTrayNotification = true;

    if (Notification.isSupported()) {
      const notif = new Notification({
        title: 'Noir is running in the background',
        body: 'Click the tray icon to open audio routing controls anytime.',
        silent: true
      });
      notif.show();
    }
  }

  /**
   * Rebuild tray context menu
   */
  async updateMenu() {
    if (!this.tray) return;

    let profiles = [];
    if (this.profileManager) {
      profiles = await this.profileManager.getProfiles();
    }

    const isLoginItem = app ? app.getLoginItemSettings().openAtLogin : false;

    const profileMenuItems = profiles.map((p) => ({
      label: `${p.icon || '🎛️'}  ${p.name}`,
      type: 'radio',
      checked: Boolean(p.isActive),
      click: async () => {
        if (this.profileManager) {
          await this.profileManager.applyProfile(p.id, this.audioManager);
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            const updatedSessions = this.audioManager ? await this.audioManager.getAudioSessions() : [];
            this.mainWindow.webContents.send('sessions-changed', updatedSessions);
          }
          await this.updateMenu();
        }
      }
    }));

    const template = [
      {
        label: 'Noir Audio Router',
        enabled: false
      },
      { type: 'separator' },
      ...(profileMenuItems.length > 0
        ? [
            { label: 'Audio Profiles', enabled: false },
            ...profileMenuItems,
            { type: 'separator' }
          ]
        : []),
      {
        label: this.mainWindow && this.mainWindow.isVisible() ? 'Hide Window' : 'Show Noir',
        click: () => this.toggleWindow()
      },
      {
        label: 'Start with Windows',
        type: 'checkbox',
        checked: isLoginItem,
        click: (item) => {
          if (app) {
            app.setLoginItemSettings({
              openAtLogin: item.checked,
              openAsHidden: true
            });
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit Noir',
        click: () => {
          if (this.onQuit) {
            this.onQuit();
          } else {
            app.quit();
          }
        }
      }
    ];

    const contextMenu = Menu.buildFromTemplate(template);
    this.tray.setContextMenu(contextMenu);
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = new TrayManager();
