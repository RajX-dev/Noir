# Verification — SoundFlow

> **Last Updated**: 2026-08-16
> **Status**: Pre-Implementation — Criteria Defined

---

## Verification Philosophy

**"It seems to work" is not verification.**

Every major feature and component must have:
1. **Clear success criteria** — what must be true
2. **Verification method** — how we confirm it
3. **Expected behavior** — what correct looks like
4. **Edge cases** — boundary conditions that must be handled
5. **Failure conditions** — what happens when things go wrong

---

## Component Verification

### 1. Audio Device Enumeration

#### What Must Be True
- All connected audio output devices appear in the device list
- Device names match what Windows shows in Sound Settings
- Device types are correctly identified (speakers, headphones, Bluetooth, HDMI, USB)
- Disconnected devices are removed from the list
- Newly connected devices appear within 2 seconds

#### How to Verify
1. Open Windows Sound Settings → note all output devices
2. Launch SoundFlow → compare device list
3. Connect a Bluetooth speaker → verify it appears in SoundFlow within 2s
4. Disconnect it → verify it disappears within 2s
5. Repeat with USB headphones

#### Expected Behavior
- Device list matches Windows Sound Settings exactly
- Device icons/types are appropriate
- No phantom/stale devices remain after disconnection

#### Edge Cases
- No audio devices connected (only "Default" exists)
- Device with very long name (50+ characters)
- Multiple devices with the same name (e.g., two "Speakers")
- Device connected via USB hub (may have delayed detection)
- Bluetooth device that's paired but not connected
- HDMI device when TV/monitor is off

#### Failure Conditions
- If device enumeration fails: show error message, offer retry, log error
- If a device disappears mid-route: fall back to default device, notify user
- If PowerShell execution is blocked by policy: detect and inform user

---

### 2. Audio Session Enumeration

#### What Must Be True
- All apps currently producing audio appear in the session list
- App names are human-readable (not process names like `chrome.exe`)
- App icons are displayed correctly
- Sessions update in real-time as apps start/stop audio
- System sounds are listed as a separate entry

#### How to Verify
1. Open Task Manager → note apps with audio
2. Launch SoundFlow → compare session list
3. Start playing music in Spotify → verify it appears
4. Stop playback → verify session shows as inactive (not removed)
5. Close Spotify entirely → verify session is removed
6. Open YouTube in Chrome → verify Chrome appears with audio indicator

#### Expected Behavior
- Active audio sessions have animated level meters
- Inactive sessions show flat level meters
- Sessions are sorted: active first, then inactive

#### Edge Cases
- App with no friendly name (only process name available)
- App with multiple audio sessions (e.g., Chrome with multiple tabs)
- System sounds / Windows notification sounds
- App that rapidly starts/stops audio (notifications)
- Elevated (admin) processes that may not be accessible
- UWP/Microsoft Store apps (different process model)

#### Failure Conditions
- If session enumeration fails: show "Unable to detect audio apps" with retry
- If app icon extraction fails: use a generic audio icon
- If access is denied to a process: skip it, do not crash

---

### 3. Per-App Audio Routing

#### What Must Be True
- Changing an app's output device actually redirects its audio
- Audio transition happens within 200ms with no audible pop/glitch
- The routing persists until the user changes it or the app closes
- Other apps are not affected when one app's routing changes
- The routing survives app minimization/maximization

#### How to Verify
1. Play music in Spotify (default speakers)
2. Change Spotify's output to Bluetooth headphones via SoundFlow
3. Confirm: Spotify audio now comes from Bluetooth, not speakers
4. Start a game → its audio still comes from speakers (unaffected)
5. Minimize Spotify → resume → audio still on Bluetooth
6. Change Spotify back to speakers → audio returns to speakers

#### Expected Behavior
- Smooth transition, no audio gap longer than 200ms
- No distortion, popping, or volume spike during switch
- All other apps continue playing on their assigned devices

#### Edge Cases
- Route to a device, then disconnect that device mid-playback
- Route to a Bluetooth device that goes to sleep
- App that opens a new audio session after routing (e.g., new Chrome tab)
- Multiple apps routed to the same device simultaneously
- Routing while the app is paused (should apply when it resumes)
- Routing system sounds

#### Failure Conditions
- Target device unavailable: revert to default device, notify user
- API call fails: retry once, then show error, do not leave app in broken state
- Permission denied: notify user that admin rights may be needed

---

### 4. Per-App Volume Control

#### What Must Be True
- Volume slider accurately reflects current app volume
- Moving the slider changes the app's volume in real-time
- Volume range is 0% (mute) to 100% (max)
- Mute toggle independently silences/unsilences the app
- Volume changes don't affect other apps
- Volume changes persist while the app is running

#### How to Verify
1. Play audio in an app
2. Set volume to 50% via SoundFlow slider → confirm audio is quieter
3. Set volume to 0% → confirm silence
4. Set volume to 100% → confirm full volume
5. Toggle mute → confirm silence → toggle unmute → confirm volume restored
6. Adjust App A volume → confirm App B volume unchanged
7. Compare SoundFlow volume with Windows Volume Mixer → should match

#### Expected Behavior
- Slider moves smoothly with no jumping
- Audio volume changes smoothly (no stepping/crackling)
- Mute icon changes state visually
- Volume percentage label updates in real-time

#### Edge Cases
- App at 0% volume — mute button should still toggle
- System volume at 0% — app volume slider still works (relative to system)
- Multiple apps, all at different volumes
- Rapidly dragging the slider back and forth
- Setting volume while app is not producing audio (should apply when it starts)

#### Failure Conditions
- Volume set fails: retry silently, log error
- Volume reads as NaN/undefined: display as 0% with warning icon
- Volume resets unexpectedly: re-apply from cached state

---

### 5. Profile System

#### What Must Be True
- Profiles save all current routing + volume state accurately
- Applying a profile restores exact state
- Profiles persist across app restarts (saved to disk)
- Profile files are valid JSON and not corrupted
- Default profiles are created on first launch only (not overwritten)

#### How to Verify
1. Set up routing: Spotify→BT, Game→Headphones, Chrome→Speakers
2. Set volumes: Spotify 70%, Game 90%, Chrome 30%
3. Save as "My Profile"
4. Change everything (different routing, different volumes)
5. Apply "My Profile" → verify all routing and volumes match step 2
6. Close SoundFlow → reopen → verify "My Profile" exists
7. Delete "My Profile" → verify it's gone from UI and disk

#### Expected Behavior
- Profile applies in < 500ms
- All routing changes happen together (not one-by-one with visible delay)
- Success notification shown after applying
- Profile list updates immediately after create/delete

#### Edge Cases
- Apply profile when a referenced app is not running (skip that app, apply rest)
- Apply profile when a referenced device is not connected (notify, apply rest)
- Profile with no apps mapped (empty profile — should still save/load)
- Create profile with a name that already exists (warn, offer rename)
- Profile file manually corrupted (detect, warn, offer to delete)
- 50+ profiles (performance should not degrade)

#### Failure Conditions
- File write fails (disk full, permissions): show error, do not lose in-memory data
- File read fails (corrupted JSON): quarantine file, notify user, load remaining profiles
- Profile references nonexistent device ID: map to default device, warn user

---

### 6. System Tray

#### What Must Be True
- Tray icon is visible when app is running
- Right-click shows context menu with all profiles + options
- Profile switching from tray works without opening the window
- Double-click opens/focuses the main window
- Tray icon tooltip shows current active profile

#### How to Verify
1. Launch app → verify tray icon appears
2. Right-click tray icon → verify menu shows profiles
3. Click a profile in menu → verify it applies (audio changes)
4. Double-click tray icon → verify window opens
5. Close window → verify tray icon remains → verify app still works

#### Expected Behavior
- Tray menu opens instantly
- Profile applies within 500ms of clicking
- Window animates into view when opened from tray

#### Edge Cases
- Windows notification area overflow (icon might be hidden)
- Multiple monitors — window should appear on correct monitor
- Tray icon with high-DPI scaling

#### Failure Conditions
- Tray icon fails to load: app still works, tray features unavailable
- Menu fails to build: show minimal menu (Show/Quit only)

---

### 7. Startup Integration

#### What Must Be True
- "Start with Windows" toggle creates/removes a registry entry or startup shortcut
- When enabled, app starts automatically on Windows login
- Auto-start applies the last active profile silently
- App starts minimized to tray (not opening a window)

#### How to Verify
1. Enable "Start with Windows" in settings
2. Restart computer
3. After login → verify SoundFlow tray icon appears
4. Verify last active profile is applied (check audio routing)
5. Disable "Start with Windows"
6. Restart computer → verify SoundFlow does NOT start

#### Expected Behavior
- Startup is silent (no splash screen, no window)
- Profile applied within 5 seconds of login
- If last profile's devices aren't available, fall back gracefully

#### Edge Cases
- User doesn't have permission to modify startup entries
- Antivirus blocks startup registration
- App is moved to a different folder after startup was registered
- Multiple Windows user accounts

#### Failure Conditions
- Registry write fails: notify user, suggest running as admin
- Auto-apply fails on startup: start with default routing, log error

---

## Cross-Cutting Verification

### Performance
| Metric | Target | How to Measure |
|--------|--------|---------------|
| CPU (idle) | < 2% | Task Manager, 5-minute observation |
| CPU (active routing) | < 5% | Task Manager during route change |
| Memory | < 100MB | Task Manager after 1 hour |
| Startup time | < 3s | Stopwatch from click to window |
| Route change latency | < 200ms | Audible test + timestamp logging |
| UI interaction latency | < 100ms | Visual inspection |

### Reliability
- [ ] No crash after 1 hour of continuous use
- [ ] No crash after 100 rapid routing changes
- [ ] No crash after rapid device connect/disconnect (10 times)
- [ ] No memory leak after 1 hour (memory stable ± 10MB)
- [ ] Graceful recovery after sleep/hibernate
- [ ] Graceful recovery after display driver reset

### Security
- [ ] No data sent to external servers
- [ ] Profile data stored only in user's AppData
- [ ] No unnecessary admin privileges requested
- [ ] No plaintext sensitive data in logs
