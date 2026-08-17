# Development Phases — Noir

> **Last Updated**: 2026-08-16
> **Current Phase**: Phase 2 — Audio Engine ⬅️

---

## Phase Overview

```
Phase 1: Project Setup          ██████████  COMPLETED ✅
Phase 2: Audio Engine           ██░░░░░░░░  CURRENT ⬅️
Phase 3: User Interface         ░░░░░░░░░░  NOT STARTED
Phase 4: Profile System         ░░░░░░░░░░  NOT STARTED
Phase 5: System Integration     ░░░░░░░░░░  NOT STARTED
Phase 6: Polish & Packaging     ░░░░░░░░░░  NOT STARTED
```

---

## Phase 1: Project Setup ✅ COMPLETED

### Objective
Set up the Electron project skeleton, install dependencies, configure build tooling, and establish the development workflow.

### Features/Components
- Initialize Electron project with `package.json`
- Create main process entry point (`main.js`)
- Create renderer process scaffold (HTML/CSS/JS)
- Configure electron-builder for packaging
- Set up development scripts (dev, build, package)
- Establish project directory structure
- Create `.gitignore` and basic project config

### Dependencies
- Node.js (v18+) installed on system (v22.13.1)
- npm installed (10.9.2)

### Definition of Done
- [x] `npm install` runs without errors
- [x] `npm run dev` launches an Electron window
- [x] Window displays a basic "Noir" placeholder UI
- [x] Project structure matches architecture document
- [x] All development scripts work (dev, lint, build)

### Verification Criteria
- [x] Electron app launches successfully
- [x] Main process and renderer process communicate via IPC
- [x] No console errors on startup
- [x] Window renders correctly with dark glassmorphism theme and interactive components

### Current Status
🟢 **Completed (2026-08-16)**

### Completed Work
- Initialized `package.json` with Electron 28, electron-builder, and ESLint
- Built `src/main.js` with custom frameless window and mock IPC handlers
- Built `src/preload.js` with secure contextBridge API mapping
- Built full CSS design system (`src/renderer/styles/main.css`, `components.css`)
- Built UI controller with visualizer and notifications (`src/renderer/js/`)
- Set up empty directory structure and `.gitkeep` for subsequent phases
- Passed `npm run lint` with zero warnings/errors

### Remaining Work
- None for Phase 1

### Known Blockers
- None

---

## Phase 2: Audio Engine ✅ COMPLETED

### Objective
Build the core audio control layer that enumerates devices, detects audio sessions, controls per-app volume, and routes app audio to specific devices.

### Features/Components
- **Device Enumeration**: List all audio output devices with metadata via SoundVolumeView and WASAPI
- **Session Enumeration**: List all running apps with active audio sessions via native-sound-mixer
- **Volume Control**: Real-time per-app volume and mute control via native COM bindings
- **Audio Routing**: Assign an app's audio to a specific output device via SoundVolumeView
- **Device & Session Monitoring**: Polling detector emitting real-time push events (`devices-changed`, `sessions-changed`)
- Native bridge (`src/audio/nativeBridge.js`), high-level API (`src/audio/audioManager.js`), and monitor (`src/audio/deviceMonitor.js`)

### Dependencies
- `native-sound-mixer` npm package (C++ WASAPI wrapper)
- `SoundVolumeView` (NirSoft 64-bit CLI) bundled in `assets/tools/`

### Definition of Done
- [x] All connected audio output devices are listed with correct names and types
- [x] All running apps with audio sessions are detected (Discord, Valorant, Zen, etc.)
- [x] Per-app volume can be read and set programmatically
- [x] App audio can be routed to a different output device
- [x] Device and session change events are detected and pushed to renderer
- [x] All audio operations complete in < 200ms
- [x] Error handling and graceful fallback in place

### Verification Criteria
- [x] Audio output devices enumerated accurately from live Windows subsystem
- [x] Live sessions detected and deduplicated
- [x] ESLint passes with 0 errors

### Current Status
🟢 **Completed (2026-08-18)**

### Completed Work
- Integrated `native-sound-mixer` for in-memory session volume and mute control
- Integrated `SoundVolumeView` for per-app device routing
- Implemented `src/audio/nativeBridge.js`, `src/audio/audioManager.js`, and `src/audio/deviceMonitor.js`
- Rewired `src/main.js` and `src/renderer/js/app.js` to live Windows audio data and push events

### Remaining Work
- None for Phase 2

### Known Blockers
- None

---

## Phase 3: User Interface

### Objective
Build the complete SoundFlow UI — device cards, app audio cards with volume sliders, real-time audio visualization, and the main layout.

### Features/Components
- **Design System**: CSS variables, color palette, typography, spacing
- **Device Cards**: Visual cards for each output device showing name, type, status
- **App Audio Cards**: Per-app cards with icon, name, volume slider, device selector, audio level meter
- **Volume Sliders**: Custom-styled sliders with real-time feedback
- **Audio Visualizers**: Real-time audio level bars/waveforms per app
- **Layout**: Responsive main window layout with device bar + app list
- **Animations**: Smooth transitions for all state changes
- **Theme**: Dark mode with glassmorphism effects, purple/blue accent

### Dependencies
- Phase 2 complete (audio engine provides data to display)
- Phase 1 complete (Electron shell renders the UI)

### Definition of Done
- [ ] All output devices displayed as visual cards
- [ ] All audio sessions displayed with app icons and names
- [ ] Volume sliders work and update audio in real-time
- [ ] Device selector dropdown works for each app
- [ ] Audio level meters animate in real-time
- [ ] UI updates automatically when devices/sessions change
- [ ] All animations are smooth (60fps)
- [ ] Dark mode looks polished and premium
- [ ] Drag-and-drop app-to-device assignment works
- [ ] UI is keyboard-navigable

### Verification Criteria
- Visual inspection — UI matches design mockups
- Interaction testing — all controls are responsive
- Performance — no jank or frame drops during animations
- Accessibility — tab navigation works through all controls

### Current Status
🔴 **Not Started**

### Completed Work
_(none)_

### Remaining Work
- All components listed above

### Known Blockers
- App icons may require special handling to extract from running processes

---

## Phase 4: Profile System

### Objective
Implement the profile management system — create, save, load, delete, and apply audio routing profiles.

### Features/Components
- **Profile Manager**: CRUD operations for profiles
- **Profile Data Model**: Schema for profile JSON (name, icon, mappings, volumes)
- **Profile UI**: Profile bar at bottom of main window, create/edit modal
- **Default Profiles**: Pre-built Gaming, Music, Work profiles
- **Profile Application**: Apply a profile → set all routing and volume at once
- **Profile Persistence**: Save to `%APPDATA%/SoundFlow/profiles/`
- **Conflict Resolution**: Handle cases where a profile references a disconnected device

### Dependencies
- Phase 2 complete (audio engine to apply routing changes)
- Phase 3 complete (UI to display profile controls)

### Definition of Done
- [ ] User can create a new profile capturing current state
- [ ] User can name and assign an icon to a profile
- [ ] User can apply a profile with one click
- [ ] Profile restores all routing and volume settings correctly
- [ ] User can edit and delete existing profiles
- [ ] Default profiles are available on first launch
- [ ] Profiles persist across app restarts
- [ ] Graceful handling when profile references unavailable device
- [ ] Profile UI is integrated into main window

### Verification Criteria
- Create profile → close app → reopen → profile exists
- Apply profile → all routing/volume matches saved state
- Delete profile → file removed from disk
- Apply profile with missing device → user notified, remaining settings applied

### Current Status
🔴 **Not Started**

### Completed Work
_(none)_

### Remaining Work
- All components listed above

### Known Blockers
- Need to decide on profile icon system (emoji vs custom icons)

---

## Phase 5: System Integration

### Objective
Integrate SoundFlow with the Windows system — system tray, startup registration, notifications, and OS-level polish.

### Features/Components
- **System Tray**: Tray icon, right-click context menu, quick profile switching
- **Startup Registration**: Add/remove from Windows startup
- **Auto-Apply**: Apply last active profile on startup
- **Minimize to Tray**: Close button minimizes to tray instead of quitting
- **Notifications**: Toast notifications for device changes, profile applied
- **Window Management**: Remember window position and size

### Dependencies
- Phase 4 complete (profiles needed for tray menu)
- Phase 3 complete (main window to minimize)

### Definition of Done
- [ ] Tray icon appears when app is running
- [ ] Right-click tray → context menu with profile list
- [ ] Click profile in tray → profile applied without opening window
- [ ] "Start with Windows" toggle works
- [ ] Last active profile auto-applied on startup
- [ ] Close button sends to tray (with first-time notification)
- [ ] Window position/size remembered between sessions
- [ ] Notifications show for key events

### Verification Criteria
- Restart Windows → app starts automatically → last profile applied
- Close window → app still in tray → profiles switchable from tray
- Connect new device → notification shown

### Current Status
🔴 **Not Started**

### Completed Work
_(none)_

### Remaining Work
- All components listed above

### Known Blockers
- None identified

---

## Phase 6: Polish & Packaging

### Objective
Final polish, performance optimization, bug fixes, and creating a distributable installer.

### Features/Components
- **Performance Audit**: CPU/memory profiling, optimize hot paths
- **Error Handling**: Graceful error recovery, crash reporting
- **UX Polish**: Loading states, empty states, edge case UI
- **Installer**: NSIS installer via electron-builder
- **Portable Version**: No-install `.exe` option
- **App Icon**: Custom SoundFlow icon for taskbar/tray/installer
- **About Page**: Version info, credits, update check
- **Documentation**: User-facing README, keyboard shortcuts guide

### Dependencies
- All previous phases complete

### Definition of Done
- [ ] All features work reliably without crashes
- [ ] CPU usage < 2% idle, < 5% active
- [ ] Memory usage < 100MB
- [ ] Installer creates working installation
- [ ] Portable version works from USB drive
- [ ] App icon displays correctly everywhere
- [ ] No console errors in production build
- [ ] All edge cases handled gracefully

### Verification Criteria
- 1-hour stress test — no crashes, no memory leaks
- Fresh Windows install → installer works → app functions correctly
- All acceptance criteria from product-requirements.md pass

### Current Status
🔴 **Not Started**

### Completed Work
_(none)_

### Remaining Work
- All components listed above

### Known Blockers
- Need app icon design (will generate during this phase)

---

## Phase Transition Rules

1. **Do not start a new phase until the current phase's "Definition of Done" is fully met**
2. **Update this document** when transitioning between phases
3. **Run all verification criteria** before marking a phase complete
4. If a blocker is discovered, document it and assess whether it blocks the phase or can be deferred
5. Each phase completion should be recorded with a date and any notes
