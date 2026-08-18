// Noir Profile Manager
// Handles profile creation, serialization, disk persistence, and audio batch application
// Ref: docs/architecture.md, docs/phases.md (Phase 4)

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class ProfileManager {
  constructor() {
    this.profiles = [];
    this.storagePath = null;
    this.isInitialized = false;
  }

  /**
   * Get the storage path for profiles.json
   */
  getStoragePath() {
    if (this.storagePath) return this.storagePath;

    try {
      const userDataPath = app ? app.getPath('userData') : path.join(process.cwd(), '.data');
      this.storagePath = path.join(userDataPath, 'profiles.json');
    } catch {
      this.storagePath = path.join(process.cwd(), 'profiles.json');
    }

    return this.storagePath;
  }

  /**
   * Default built-in profiles
   */
  getDefaultProfiles() {
    return [
      {
        id: 'prof-gaming',
        name: 'Gaming',
        icon: '🎮',
        isActive: true,
        isDefault: true,
        createdAt: new Date().toISOString(),
        description: 'Games & Discord to Headphones, Spotify to Speakers',
        rules: [
          { pattern: 'valorant|cs2|steam|cod|game|overwatch|apex', targetType: 'headphones', volume: 0.9, isMuted: false },
          { pattern: 'discord|teamspeak', targetType: 'headphones', volume: 1.0, isMuted: false },
          { pattern: 'spotify|music', targetType: 'speakers', volume: 0.45, isMuted: false },
          { pattern: 'chrome|zen|edge|firefox|brave', targetType: 'speakers', volume: 0.5, isMuted: false }
        ],
        mappings: []
      },
      {
        id: 'prof-music',
        name: 'Music & Focus',
        icon: '🎵',
        isActive: false,
        isDefault: true,
        createdAt: new Date().toISOString(),
        description: 'High-res music to Headphones, communications muted',
        rules: [
          { pattern: 'spotify|music|tidal|apple', targetType: 'headphones', volume: 1.0, isMuted: false },
          { pattern: 'discord|slack|teams', targetType: 'headphones', volume: 0.1, isMuted: true },
          { pattern: '.*', targetType: 'speakers', volume: 0.3, isMuted: false }
        ],
        mappings: []
      },
      {
        id: 'prof-work',
        name: 'Work / Meetings',
        icon: '💼',
        isActive: false,
        isDefault: true,
        createdAt: new Date().toISOString(),
        description: 'Meeting audio clear in Headset, media at low volume',
        rules: [
          { pattern: 'discord|slack|zoom|teams|meet', targetType: 'headphones', volume: 0.95, isMuted: false },
          { pattern: 'spotify|music', targetType: 'speakers', volume: 0.25, isMuted: false },
          { pattern: 'game|valorant|steam', targetType: 'speakers', volume: 0.0, isMuted: true }
        ],
        mappings: []
      },
      {
        id: 'prof-cinema',
        name: 'Cinema / Media',
        icon: '🎬',
        isActive: false,
        isDefault: true,
        createdAt: new Date().toISOString(),
        description: 'Full surround movie audio to Speakers/HDMI',
        rules: [
          { pattern: 'vlc|mpc|netflix|prime|video|chrome|zen', targetType: 'speakers', volume: 1.0, isMuted: false },
          { pattern: 'discord|slack', targetType: 'headphones', volume: 0.3, isMuted: false }
        ],
        mappings: []
      }
    ];
  }

  /**
   * Initialize and load profiles from disk
   */
  async init() {
    if (this.isInitialized) return this.profiles;

    const filePath = this.getStoragePath();
    const dirPath = path.dirname(filePath);

    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.profiles = parsed;
          this.isInitialized = true;
          return this.profiles;
        }
      }
    } catch (err) {
      console.error('[ProfileManager] Failed to read profiles from disk, falling back to defaults:', err);
    }

    // Initialize with defaults if file doesn't exist or failed to load
    this.profiles = this.getDefaultProfiles();
    await this.persist();
    this.isInitialized = true;
    return this.profiles;
  }

  /**
   * Save current profiles to disk
   */
  async persist() {
    try {
      const filePath = this.getStoragePath();
      const dirPath = path.dirname(filePath);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(this.profiles, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[ProfileManager] Failed to persist profiles to disk:', err);
      return false;
    }
  }

  /**
   * Get all profiles
   */
  async getProfiles() {
    if (!this.isInitialized) {
      await this.init();
    }
    return this.profiles;
  }

  /**
   * Get active profile
   */
  async getActiveProfile() {
    const profiles = await this.getProfiles();
    return profiles.find((p) => p.isActive) || profiles[0];
  }

  /**
   * Save a new profile snapshot from current active audio sessions
   */
  async saveProfile({ name, icon, sessions = [] }) {
    await this.init();

    const profileId = `prof-${Date.now()}`;
    const newProfile = {
      id: profileId,
      name: name || 'Custom Profile',
      icon: icon || '🎛️',
      isActive: true,
      isDefault: false,
      createdAt: new Date().toISOString(),
      mappings: sessions.map((s) => ({
        processName: s.processName,
        displayName: s.displayName,
        deviceId: s.deviceId,
        volume: typeof s.volume === 'number' ? s.volume : 1.0,
        isMuted: Boolean(s.isMuted)
      }))
    };

    // Deactivate previous active profiles
    this.profiles.forEach((p) => {
      p.isActive = false;
    });

    this.profiles.push(newProfile);
    await this.persist();

    return { profile: newProfile, profiles: this.profiles };
  }

  /**
   * Delete a profile by ID
   */
  async deleteProfile(profileId) {
    await this.init();

    const targetIndex = this.profiles.findIndex((p) => p.id === profileId);
    if (targetIndex === -1) {
      return { success: false, error: 'Profile not found', profiles: this.profiles };
    }

    const wasActive = this.profiles[targetIndex].isActive;
    this.profiles.splice(targetIndex, 1);

    // If active profile was deleted, activate the first available profile
    if (wasActive && this.profiles.length > 0) {
      this.profiles[0].isActive = true;
    }

    await this.persist();
    return { success: true, profiles: this.profiles };
  }

  /**
   * Apply profile to live audio sessions via audioManager
   */
  async applyProfile(profileId, audioManager) {
    await this.init();

    const targetProfile = this.profiles.find((p) => p.id === profileId);
    if (!targetProfile) {
      return { success: false, error: 'Profile not found' };
    }

    // Mark as active
    this.profiles.forEach((p) => {
      p.isActive = p.id === profileId;
    });
    await this.persist();

    if (!audioManager) {
      return { success: true, profile: targetProfile };
    }

    try {
      const devices = await audioManager.getOutputDevices();
      const sessions = await audioManager.getAudioSessions();
      const defaultDevice = devices.find((d) => d.isDefault) || devices[0];

      const headphonesDev = devices.find((d) => d.type === 'headphones' || d.type === 'bluetooth') || defaultDevice;
      const speakersDev = devices.find((d) => d.type === 'speakers' || d.type === 'hdmi') || defaultDevice;

      // 1. Process explicit snapshot mappings if available
      if (Array.isArray(targetProfile.mappings) && targetProfile.mappings.length > 0) {
        for (const mapping of targetProfile.mappings) {
          const matchingSessions = sessions.filter(
            (s) => s.processName && s.processName.toLowerCase() === (mapping.processName || '').toLowerCase()
          );

          for (const session of matchingSessions) {
            // Find target device (either by ID or fallback to default)
            let targetDev = devices.find((d) => d.id === mapping.deviceId);
            if (!targetDev) {
              targetDev = defaultDevice;
            }

            if (targetDev && targetDev.id !== session.deviceId) {
              await audioManager.routeSession(session.id, targetDev.id);
            }

            if (typeof mapping.volume === 'number') {
              await audioManager.setSessionVolume(session.id, mapping.volume);
            }

            if (typeof mapping.isMuted === 'boolean') {
              await audioManager.muteSession(session.id, mapping.isMuted);
            }
          }
        }
      }

      // 2. Process intelligent rule patterns if defined (for built-in profiles)
      if (Array.isArray(targetProfile.rules) && targetProfile.rules.length > 0) {
        for (const session of sessions) {
          const sessionName = `${session.displayName || ''} ${session.processName || ''}`.toLowerCase();

          for (const rule of targetProfile.rules) {
            const regex = new RegExp(rule.pattern, 'i');
            if (regex.test(sessionName)) {
              const targetDev = rule.targetType === 'headphones' ? headphonesDev : speakersDev;

              if (targetDev && targetDev.id !== session.deviceId) {
                await audioManager.routeSession(session.id, targetDev.id);
              }

              if (typeof rule.volume === 'number') {
                await audioManager.setSessionVolume(session.id, rule.volume);
              }

              if (typeof rule.isMuted === 'boolean') {
                await audioManager.muteSession(session.id, rule.isMuted);
              }
              break; // Stop after first matching rule
            }
          }
        }
      }

      const updatedSessions = await audioManager.getAudioSessions();
      return { success: true, profile: targetProfile, sessions: updatedSessions };
    } catch (err) {
      console.error(`[ProfileManager] Error applying profile ${profileId}:`, err);
      return { success: false, error: err.message, profile: targetProfile };
    }
  }
}

module.exports = new ProfileManager();
