# Development Phases — Noir

> **Last Updated**: 2026-08-18
> **Current Phase**: Phase 4 — Profile System ⬅️

---

## Phase Overview

```
Phase 1: Project Setup          ██████████  COMPLETED ✅
Phase 2: Audio Engine           ██████████  COMPLETED ✅
Phase 3: User Interface         ██████████  COMPLETED ✅
Phase 4: Profile System         ██████████  COMPLETED ✅
Phase 5: System Integration     ██░░░░░░░░  CURRENT ⬅️
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

## Phase 3: User Interface & Visual Polish ✅ COMPLETED

### Objective
Build the complete Noir UI — interactive device cards, app audio cards with volume sliders, real-time volume-coupled VU visualizers, drag-and-drop audio routing, and smooth micro-animations.

### Features/Components
- **Drag-and-Drop Audio Routing**: Grab any app card and drop directly onto a device card to instantly reroute audio
- **Device Drop Pulse & Glow**: Visual feedback with accent borders, elevation, and spring bounce on drop
- **Dynamic VU Level Meters**: Real-time multi-band VU meter animation coupled to session volume and mute states
- **SVG Vector Icon System**: Crisp inline vector graphics for Headphones, Speakers, Bluetooth, USB, and HDMI
- **Volume Slider Glow**: Accent thumb with expanded violet glow on hover and active dragging
- **Accessibility**: Keyboard navigation for sliders (arrow keys), Enter/Space activation, and visible focus rings

### Dependencies
- Phase 2 complete (audio engine provides live data and routing API)
- Phase 1 complete (Electron shell and base design tokens)

### Definition of Done
- [x] All output devices displayed as visual cards with connection status and SVG icons
- [x] All audio sessions displayed with app icons, process names, and device badges
- [x] Volume sliders work and update audio in real-time with percentage feedback
- [x] Device selector dropdown works for each app
- [x] Audio level meters animate in real-time, responding dynamically to volume and mute
- [x] UI updates automatically when devices/sessions change via push events
- [x] All animations are smooth (60fps) with spring easings
- [x] Dark obsidian glassmorphism looks polished and premium
- [x] Drag-and-drop app-to-device assignment works seamlessly
- [x] UI is keyboard-navigable and accessible

### Verification Criteria
- [x] Drag-and-drop routing tested and verified
- [x] Drop pulse animations confirmed
- [x] ESLint passes with 0 errors and 0 warnings

### Current Status
🟢 **Completed (2026-08-18)**

### Completed Work
- Implemented HTML5 drag-and-drop audio routing in `src/renderer/js/app.js`
- Added drag-over and drop pulse styling in `src/renderer/styles/components.css`
- Upgraded `src/renderer/js/visualizer.js` with volume scaling and decay
- Added SVG vector icons for all device categories
- Verified zero lint errors

### Remaining Work
- None for Phase 3

### Known Blockers
- None

## Phase 4: Profile System ✅ COMPLETED

### Objective
Implement the profile management system — create, save, load, delete, and apply audio routing profiles.

### Features/Components
- **Profile Manager**: CRUD operations for profiles (`src/profiles/profileManager.js`)
- **Profile Data Model**: Schema for profile JSON (name, icon, mappings, volumes)
- **Profile UI**: Profile bar at bottom of main window, create/edit modal with emoji picker and preset chips
- **Default Profiles**: Pre-built Gaming, Music & Focus, Work / Meetings, and Cinema profiles
- **Profile Application**: Apply a profile → set all routing and volume at once in batch
- **Profile Persistence**: Save to `%APPDATA%/Noir/profiles.json`
- **Conflict Resolution**: Handle cases where a profile references a disconnected device (graceful fallback)

### Dependencies
- Phase 2 complete (audio engine to apply routing changes)
- Phase 3 complete (UI to display profile controls)

### Definition of Done
- [x] User can create a new profile capturing current state
- [x] User can name and assign an icon to a profile
- [x] User can apply a profile with one click
- [x] Profile restores all routing and volume settings correctly
- [x] User can edit and delete existing profiles
- [x] Default profiles are available on first launch
- [x] Profiles persist across app restarts
- [x] Graceful handling when profile references unavailable device
- [x] Profile UI is integrated into main window

### Verification Criteria
- [x] Create profile → close app → reopen → profile exists
- [x] Apply profile → all routing/volume matches saved state
- [x] Delete profile → file removed from disk
- [x] Apply profile with missing device → user notified, remaining settings applied

### Current Status
🟢 **Completed (2026-08-18)**

### Completed Work
- Built `src/profiles/profileManager.js` with persistent JSON storage in `%APPDATA%/Noir/`
- Implemented default presets (Gaming, Music & Focus, Work / Meetings, Cinema)
- Added batch audio routing, volume scaling, and mute application
- Built interactive create profile modal with emoji picker and name suggestion chips
- Implemented profile deletion and active profile switching
- Passed `npm run lint` with 0 errors

### Remaining Work
- None for Phase 4

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
