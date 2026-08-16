# Product Requirements Document — SoundFlow

> **Last Updated**: 2026-08-16
> **Status**: Draft — Pre-Implementation

---

## Product Vision

**SoundFlow** is a desktop application that gives users complete control over per-application audio routing and volume on Windows. Users can assign any running app's audio to any connected output device, adjust volume per-app, and save/load audio profiles for different scenarios.

Long-term, SoundFlow will expand to Android.

---

## Problem Being Solved

Modern operating systems route **all application audio to a single output device** by default. Users who want to:

- Play music on a Bluetooth speaker while gaming with headphones
- Watch a tutorial on speakers while keeping Discord on headphones
- Scroll social media on phone speakers while music plays on earbuds

...are forced into clunky workarounds (Windows sound settings buried in menus, or no solution at all on mobile). There is no intuitive, unified tool that makes per-app audio routing simple and instant.

---

## Target Users

| Persona | Description | Pain Point |
|---------|------------|------------|
| **Gamers** | Play games while listening to music/Discord | Want game audio on headset, music on speakers |
| **Streamers/Content Creators** | Manage multiple audio sources | Need fine control over what goes where |
| **Remote Workers** | On calls while listening to music | Meeting audio on headset, music on desk speakers |
| **Casual Users** | Watch videos, listen to music simultaneously | Just want things to "work" without settings diving |
| **Music Enthusiasts** | Use multiple audio devices | Want high-quality routing without latency |

---

## Core Use Cases

### UC-1: Route App Audio to Specific Device
**As a** user, **I want to** assign an app's audio output to a specific device, **so that** I can hear different apps on different speakers/headphones.

### UC-2: Control Per-App Volume
**As a** user, **I want to** adjust the volume of individual apps independently, **so that** I can balance audio levels across apps without changing system volume.

### UC-3: Save Audio Profiles
**As a** user, **I want to** save my audio routing and volume configuration as a named profile, **so that** I can instantly switch between setups (e.g., Gaming, Music, Work).

### UC-4: Quick Profile Switching
**As a** user, **I want to** switch profiles from the system tray, **so that** I don't have to open the full app every time.

### UC-5: Auto-Detect Devices and Apps
**As a** user, **I want** the app to automatically detect connected audio devices and running audio apps, **so that** I don't have to manually configure anything.

---

## Functional Requirements

### FR-1: Audio Device Enumeration
- Detect all connected audio output devices (speakers, headphones, Bluetooth, USB, HDMI)
- Update device list in real-time when devices are connected/disconnected
- Display device name, type, and connection status

### FR-2: Audio Session Enumeration
- List all running applications that are currently producing or capable of producing audio
- Show app name, icon, and current audio level
- Update in real-time as apps start/stop

### FR-3: Per-App Audio Routing
- Allow user to assign any audio session to any output device
- Changes take effect immediately without restarting the app
- Support drag-and-drop assignment
- Support dropdown selection as alternative

### FR-4: Per-App Volume Control
- Individual volume sliders for each audio session
- Mute/unmute toggle per app
- Real-time audio level visualization (VU meter)
- Volume changes take effect immediately

### FR-5: Audio Profiles
- Create, rename, delete profiles
- Each profile stores: app-to-device mappings, per-app volumes, profile name, icon
- Apply profile with one click
- Default profiles provided: Gaming, Music, Work, Movie Night
- Profiles persist across app restarts (stored as JSON)

### FR-6: System Tray Integration
- Minimize to system tray
- Tray icon with right-click context menu
- Quick profile switching from tray menu
- Show/hide main window from tray
- Notification on device connect/disconnect

### FR-7: Startup Integration
- Option to start with Windows
- Auto-apply last active profile on startup
- Silent start to tray option

---

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Latency** | Audio routing changes apply in < 200ms |
| **CPU Usage** | < 2% CPU when idle, < 5% during active routing |
| **Memory** | < 100MB RAM usage |
| **Startup Time** | App ready in < 3 seconds |
| **Reliability** | No audio glitches/pops when switching routes |
| **Compatibility** | Windows 10 (1903+) and Windows 11 |
| **UI Responsiveness** | All interactions respond in < 100ms |
| **Accessibility** | Keyboard navigable, screen reader friendly |

---

## MVP Scope (Version 1.0)

### In Scope
- [x] Audio output device detection and listing
- [x] Running audio app detection and listing
- [x] Per-app audio routing to different output devices
- [x] Per-app volume control with sliders
- [x] Real-time audio level visualization
- [x] Profile system (create, save, load, delete)
- [x] Default profiles (Gaming, Music, Work)
- [x] System tray with quick profile switching
- [x] Start with Windows option
- [x] Dark mode UI with modern design

### Explicitly Out of Scope (v1.0)
- ❌ Android version (planned for v2.0)
- ❌ iOS version (likely not feasible due to Apple restrictions)
- ❌ macOS version (planned for v2.0)
- ❌ Virtual audio driver creation
- ❌ Audio input (microphone) routing
- ❌ Audio effects/EQ
- ❌ Multi-user/cloud sync for profiles
- ❌ Plugin/extension system
- ❌ Recording/streaming integration
- ❌ Per-app audio routing for UWP/Microsoft Store apps (limited API support)

---

## Current Product Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platform | Windows first | Best API support for per-app audio |
| Audio API | Windows Core Audio (WASAPI) via PowerShell + native addon | Most reliable, well-documented |
| UI Framework | Electron | Modern UI, cross-platform potential |
| Profile Storage | Local JSON files | Simple, no server needed, portable |
| Default Theme | Dark mode | Target users (gamers, creators) prefer dark UI |

---

## Acceptance Criteria for Major Features

### Per-App Audio Routing
- [ ] User can see all connected output devices
- [ ] User can see all apps producing audio
- [ ] User can assign any app to any device via dropdown or drag-and-drop
- [ ] Audio actually plays through the assigned device within 200ms
- [ ] Routing persists until changed by user or app closes
- [ ] New apps appear automatically when they start producing audio

### Per-App Volume Control
- [ ] Each app has an independent volume slider (0–100%)
- [ ] Volume changes are reflected immediately in audio output
- [ ] Mute toggle works independently per app
- [ ] Audio level indicator shows real-time levels

### Profile System
- [ ] User can create a new profile with a custom name
- [ ] Profile captures current routing + volume state
- [ ] Applying a profile restores all routing and volume settings
- [ ] Profiles persist across app restarts
- [ ] Default profiles are available on first launch
- [ ] Profiles can be renamed and deleted

### System Tray
- [ ] App minimizes to tray (not taskbar) when closed/minimized
- [ ] Right-click shows context menu with profile list
- [ ] Clicking a profile in tray menu applies it instantly
- [ ] Double-click tray icon opens main window
