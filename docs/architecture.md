# Architecture — SoundFlow

> **Last Updated**: 2026-08-16
> **Status**: Pre-Implementation — Architecture Defined

---

## High-Level Architecture

SoundFlow follows Electron's **two-process architecture** with a clear separation between the backend (audio control) and frontend (UI):

```
┌─────────────────────────────────────────────────────────────────┐
│                        SoundFlow App                            │
│                                                                 │
│  ┌──────────────────────┐    IPC     ┌───────────────────────┐ │
│  │    MAIN PROCESS      │◄──────────►│   RENDERER PROCESS    │ │
│  │    (Node.js)         │            │   (Chromium)          │ │
│  │                      │            │                       │ │
│  │  ┌────────────────┐  │            │  ┌─────────────────┐  │ │
│  │  │ Audio Manager  │  │            │  │   UI Layer      │  │ │
│  │  │                │  │            │  │   (HTML/CSS/JS) │  │ │
│  │  │ • Enumerate    │  │  Events    │  │                 │  │ │
│  │  │ • Route        │──────────────►│  │ • Device Cards  │  │ │
│  │  │ • Volume       │  │            │  │ • App Cards     │  │ │
│  │  │ • Monitor      │  │            │  │ • Sliders       │  │ │
│  │  └────────────────┘  │            │  │ • Profiles      │  │ │
│  │                      │            │  │ • Visualizers   │  │ │
│  │  ┌────────────────┐  │            │  └─────────────────┘  │ │
│  │  │ Profile Mgr    │  │            │                       │ │
│  │  │ • Save/Load    │  │            └───────────────────────┘ │
│  │  │ • Apply        │  │                                      │
│  │  └────────────────┘  │                                      │
│  │                      │                                      │
│  │  ┌────────────────┐  │                                      │
│  │  │ Tray Manager   │  │                                      │
│  │  │ • Icon         │  │                                      │
│  │  │ • Context Menu │  │                                      │
│  │  └────────────────┘  │                                      │
│  │                      │                                      │
│  │  ┌────────────────┐  │                                      │
│  │  │ Native Bridge  │──────► Windows Core Audio API (WASAPI)  │
│  │  │ (PowerShell +  │  │                                      │
│  │  │  N-API Addon)  │  │                                      │
│  │  └────────────────┘  │                                      │
│  └──────────────────────┘                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
          │                                    │
          ▼                                    ▼
   ┌──────────────┐                  ┌──────────────────┐
   │  File System  │                  │  Windows Audio   │
   │  %APPDATA%/   │                  │  Subsystem       │
   │  SoundFlow/   │                  │  (WASAPI/MMDev)  │
   │  • profiles/  │                  └──────────────────┘
   │  • settings/  │
   └──────────────┘
```

---

## Major Components

### 1. Main Process (`main.js`)

**Responsibility**: Application lifecycle, window management, IPC routing, system tray, and orchestrating all backend modules.

**Key duties**:
- Create and manage the BrowserWindow
- Register IPC handlers for all audio operations
- Initialize the Audio Manager, Profile Manager, and Tray Manager
- Handle app lifecycle events (ready, window-all-closed, activate)
- Manage system tray
- Handle startup registration

**Runs in**: Node.js (full system access)

---

### 2. Audio Manager (`src/audio/audioManager.js`)

**Responsibility**: Central controller for all audio operations. Provides a clean JavaScript API over the native audio bridge.

**Public API**:
```javascript
class AudioManager {
  // Device operations
  async getOutputDevices()              // → Device[]
  async getDefaultDevice()              // → Device
  
  // Session operations
  async getAudioSessions()             // → Session[]
  
  // Routing
  async routeSession(sessionId, deviceId)  // → boolean
  async getSessionDevice(sessionId)         // → Device
  
  // Volume
  async getSessionVolume(sessionId)     // → number (0-1)
  async setSessionVolume(sessionId, volume) // → boolean
  async muteSession(sessionId)          // → boolean
  async unmuteSession(sessionId)        // → boolean
  
  // Events
  on('devices-changed', callback)
  on('sessions-changed', callback)
  on('volume-changed', callback)
}
```

**Data Models**:
```javascript
// Device
{
  id: string,          // Windows device ID
  name: string,        // Friendly name ("Speakers", "JBL Go")
  type: string,        // 'speakers' | 'headphones' | 'bluetooth' | 'hdmi' | 'usb'
  isDefault: boolean,  // Is the system default device
  isActive: boolean,   // Is currently connected and available
  iconPath: string     // Path to device icon (optional)
}

// Session (Audio App)
{
  id: string,          // Session ID
  processId: number,   // Windows process ID
  processName: string, // e.g., "Spotify.exe"
  displayName: string, // e.g., "Spotify"
  iconPath: string,    // Path to extracted app icon
  volume: number,      // 0.0 - 1.0
  isMuted: boolean,
  peakLevel: number,   // Current audio level (0.0 - 1.0) for visualization
  deviceId: string     // Currently assigned output device ID
}
```

---

### 3. Device Monitor (`src/audio/deviceMonitor.js`)

**Responsibility**: Continuously monitors the Windows audio subsystem for device and session changes. Emits events when the audio landscape changes.

**Monitoring approach**: Poll-based with configurable interval (default 1000ms for devices, 500ms for sessions).

**Events emitted**:
| Event | Payload | When |
|-------|---------|------|
| `device-added` | `Device` | New audio device detected |
| `device-removed` | `Device` | Audio device disconnected |
| `device-default-changed` | `Device` | Default device changed |
| `session-added` | `Session` | New app started producing audio |
| `session-removed` | `Session` | App stopped / closed |
| `session-volume-changed` | `{ sessionId, volume }` | Volume changed externally |

**Why polling instead of native events**:
- Native device change notifications require COM event sinks (complex C++)
- Polling at 500-1000ms provides adequate responsiveness
- Simpler to implement, debug, and maintain
- CPU cost is negligible (< 0.5% for polling)

---

### 4. Native Bridge (`src/audio/nativeBridge.js`)

**Responsibility**: Interface between JavaScript and Windows Core Audio API. Uses two strategies:

#### Strategy A: PowerShell Scripts (Non-Performance-Critical)
Used for: Device enumeration, session listing, initial state loading

```javascript
// Executes PowerShell to enumerate audio devices
async function enumerateDevices() {
  const script = `
    Get-AudioDevice -List | Select-Object Name, ID, Type, Default
  `;
  return execPowerShell(script);
}
```

#### Strategy B: Native N-API Addon (Performance-Critical)
Used for: Volume control, audio routing, peak level monitoring

The native addon wraps these Windows COM interfaces:
- `IMMDeviceEnumerator` — enumerate audio endpoints
- `IAudioSessionManager2` — access per-app audio sessions
- `IAudioSessionControl` — control individual sessions
- `ISimpleAudioVolume` — get/set volume per session
- `IAudioMeterInformation` — get real-time audio levels
- `IPolicyConfig` (undocumented) — route app to specific device

---

### 5. Profile Manager (`src/profiles/profileManager.js`)

**Responsibility**: CRUD operations for audio profiles. Handles persistence to disk.

**Storage location**: `%APPDATA%/SoundFlow/profiles/`

**Profile schema**:
```javascript
{
  id: string,           // UUID
  name: string,         // "Gaming"
  icon: string,         // Emoji or icon identifier
  createdAt: string,    // ISO timestamp
  updatedAt: string,    // ISO timestamp
  mappings: [
    {
      processName: string,  // "Spotify.exe" — matches by process name
      deviceId: string,     // Target output device ID
      volume: number,       // 0.0 - 1.0
      isMuted: boolean
    }
  ],
  isDefault: boolean    // Is a built-in default profile
}
```

**File structure**:
```
%APPDATA%/SoundFlow/
├── profiles/
│   ├── gaming.json
│   ├── music.json
│   ├── work.json
│   └── custom-1.json
└── settings.json
```

---

### 6. Tray Manager (`src/tray/trayManager.js`)

**Responsibility**: System tray icon and context menu management.

**Context menu structure**:
```
SoundFlow
──────────────
🎮 Gaming          ← Profile (click to apply)
🎵 Music           ← Profile
💼 Work            ← Profile
──────────────
☐ Start with Windows
──────────────
Show Window
Quit
```

---

### 7. UI Layer (Renderer Process)

**Responsibility**: All visual rendering and user interaction.

**File structure**:
```
src/renderer/
├── index.html          # Main HTML structure
├── styles/
│   ├── main.css        # Design system (variables, reset, typography)
│   └── components.css  # Component-specific styles
└── js/
    ├── app.js          # Main UI controller, IPC communication
    ├── visualizer.js   # Audio level visualization
    └── notifications.js # Toast notification system
```

**UI does NOT**:
- Access the file system directly
- Call Windows APIs directly
- Manage state beyond UI state (display state, animations)

**UI communicates via IPC**:
```javascript
// Renderer → Main (request)
window.electronAPI.getDevices()           // → Device[]
window.electronAPI.getSessions()          // → Session[]
window.electronAPI.routeSession(sid, did) // → boolean
window.electronAPI.setVolume(sid, vol)    // → boolean
window.electronAPI.getProfiles()          // → Profile[]
window.electronAPI.applyProfile(pid)      // → boolean
window.electronAPI.saveProfile(profile)   // → boolean

// Main → Renderer (push events)
window.electronAPI.onDevicesChanged(callback)
window.electronAPI.onSessionsChanged(callback)
window.electronAPI.onVolumeChanged(callback)
```

---

## Data Flow

### Audio Routing Flow
```
User clicks device dropdown for Spotify
         │
         ▼
   Renderer Process
   app.js captures selection
         │
         ▼ IPC: 'route-session'
   Main Process
   IPC handler receives (sessionId, deviceId)
         │
         ▼
   AudioManager.routeSession()
         │
         ▼
   NativeBridge → WASAPI IPolicyConfig
         │
         ▼
   Windows Audio Subsystem
   Spotify's audio → new device
         │
         ▼
   AudioManager emits 'sessions-changed'
         │
         ▼ IPC: push event
   Renderer Process
   UI updates device indicator for Spotify
```

### Profile Apply Flow
```
User clicks "Gaming" profile button
         │
         ▼
   Renderer Process
   app.js sends 'apply-profile'
         │
         ▼ IPC: 'apply-profile'
   Main Process
   ProfileManager.loadProfile('gaming')
         │
         ▼
   For each mapping in profile:
   AudioManager.routeSession(processName, deviceId)
   AudioManager.setSessionVolume(processName, volume)
         │
         ▼
   Results collected (success/failure per mapping)
         │
         ▼ IPC: push result
   Renderer Process
   Show success notification
   UI updates all cards to reflect new state
```

---

## External Dependencies

| Dependency | Purpose | Version | Critical? |
|-----------|---------|---------|-----------|
| Electron | App framework | 28+ | Yes |
| electron-builder | Packaging/installer | Latest | Yes (build only) |
| node-addon-api | Native C++ addon bridge | Latest | Yes |
| Jest | Testing | 29+ | Dev only |

**Minimal dependency philosophy**: We deliberately keep dependencies minimal to reduce attack surface, bundle size, and maintenance burden.

---

## Communication Between Components

All inter-component communication flows through **Electron IPC** (Inter-Process Communication):

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `get-devices` | Renderer → Main | Request device list |
| `get-sessions` | Renderer → Main | Request session list |
| `route-session` | Renderer → Main | Route app to device |
| `set-volume` | Renderer → Main | Set app volume |
| `mute-session` | Renderer → Main | Mute/unmute app |
| `get-profiles` | Renderer → Main | Request profile list |
| `apply-profile` | Renderer → Main | Apply a profile |
| `save-profile` | Renderer → Main | Save current state as profile |
| `delete-profile` | Renderer → Main | Delete a profile |
| `devices-changed` | Main → Renderer | Device list changed |
| `sessions-changed` | Main → Renderer | Session list changed |
| `volume-changed` | Main → Renderer | Volume changed externally |

**Security**: All IPC is handled through a `preload.js` script that exposes only whitelisted APIs via `contextBridge`. The renderer has no direct access to Node.js APIs.

---

## Important Architectural Constraints

1. **Renderer process has no Node.js access** — all system operations go through IPC
2. **No network requests** — SoundFlow is fully offline (no analytics, no telemetry, no updates in MVP)
3. **Single window** — no multi-window complexity
4. **Single user** — no multi-user, no authentication
5. **Windows only** (MVP) — no macOS/Linux code paths
6. **No database** — file-based storage only
7. **Polling-based monitoring** — no native COM event sinks (simplicity over performance)

---

## Key Architectural Decisions

| Decision | Choice | Rationale | Date |
|----------|--------|-----------|------|
| Process separation | Strict main/renderer split via IPC | Security best practice, prevents renderer from accessing system APIs directly | 2026-08-16 |
| Audio API access | PowerShell + Native addon hybrid | PowerShell for quick enumeration, native addon for real-time performance | 2026-08-16 |
| Monitoring approach | Polling (500-1000ms) | Simpler than COM event sinks, adequate responsiveness, easier to debug | 2026-08-16 |
| State management | Main process is source of truth | Renderer only holds UI state; audio/profile state lives in main process | 2026-08-16 |
| Profile matching | By process name | Simpler than PID (which changes every launch); handles app restarts naturally | 2026-08-16 |
| Undocumented API (IPolicyConfig) | Use for per-app routing | No documented alternative for per-app device routing; widely used by similar tools | 2026-08-16 |

---

## Directory Structure (Full Project)

```
soundflow/
├── docs/                          # 📄 Project documentation (this folder)
│   ├── product-requirements.md
│   ├── tech-stack.md
│   ├── phases.md
│   ├── verification.md
│   ├── testing.md
│   └── architecture.md
├── src/
│   ├── main.js                    # Electron main process entry
│   ├── preload.js                 # Secure IPC bridge
│   ├── audio/
│   │   ├── audioManager.js        # Audio control API
│   │   ├── deviceMonitor.js       # Device/session change detection
│   │   └── nativeBridge.js        # Windows API interface
│   ├── profiles/
│   │   ├── profileManager.js      # Profile CRUD
│   │   └── defaultProfiles.js     # Built-in profile definitions
│   ├── tray/
│   │   └── trayManager.js         # System tray management
│   ├── utils/
│   │   └── startup.js             # Windows startup registration
│   └── renderer/
│       ├── index.html             # Main window HTML
│       ├── styles/
│       │   ├── main.css           # Design system
│       │   └── components.css     # Component styles
│       └── js/
│           ├── app.js             # UI controller
│           ├── visualizer.js      # Audio level visualization
│           └── notifications.js   # Toast notifications
├── tests/                         # Test files (see testing.md)
├── assets/                        # App icons, images
├── native/                        # C++ native addon source (if needed)
├── scripts/                       # Build/dev helper scripts
├── package.json
├── .gitignore
└── README.md
```
