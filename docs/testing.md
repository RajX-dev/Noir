# Testing Strategy — SoundFlow

> **Last Updated**: 2026-08-16
> **Status**: Pre-Implementation — Strategy Defined

---

## Testing Philosophy

Every feature must be testable. Tests serve as:
1. **Verification** — proof that code works as intended
2. **Regression prevention** — confidence that changes don't break existing features
3. **Documentation** — tests describe expected behavior better than comments

---

## Test Organization

```
tests/
├── unit/                    # Isolated component tests
│   ├── audio/
│   │   ├── audioManager.test.js
│   │   ├── deviceMonitor.test.js
│   │   └── nativeBridge.test.js
│   ├── profiles/
│   │   ├── profileManager.test.js
│   │   └── defaultProfiles.test.js
│   └── utils/
│       └── startup.test.js
├── integration/             # Cross-component tests
│   ├── audio-routing.test.js
│   ├── profile-apply.test.js
│   └── ipc-communication.test.js
├── e2e/                     # Full app tests
│   ├── app-launch.test.js
│   ├── device-routing.test.js
│   ├── profile-workflow.test.js
│   └── tray-interaction.test.js
├── mocks/                   # Shared test mocks
│   ├── audioDevices.mock.js
│   ├── audioSessions.mock.js
│   └── windowsApi.mock.js
└── helpers/                 # Test utilities
    ├── setup.js
    └── assertions.js
```

---

## Test Naming Convention

Tests follow the pattern: **`describe` → `it` → "should [expected behavior] when [condition]"**

```javascript
describe('AudioManager', () => {
  describe('getOutputDevices', () => {
    it('should return all connected audio output devices', () => { ... });
    it('should return an empty array when no devices are connected', () => { ... });
    it('should exclude input-only devices', () => { ... });
  });
});
```

File naming: `[componentName].test.js`

---

## Testing Framework

| Tool | Purpose |
|------|---------|
| **Jest** | Test runner, assertions, mocking |
| **Spectron** or **Playwright** | End-to-end Electron app testing |
| **jest-mock-extended** | Advanced mocking for complex objects |

---

## Unit Testing

### What to Unit Test
Every module in `src/` must have corresponding unit tests covering:

1. **Happy path** — normal expected inputs produce correct outputs
2. **Edge cases** — boundary values, empty inputs, null/undefined
3. **Error handling** — what happens when things go wrong

### Audio Manager (`src/audio/audioManager.js`)
| Test Case | Priority |
|-----------|----------|
| Returns list of output devices | 🔴 Critical |
| Returns empty list when no devices available | 🔴 Critical |
| Returns list of active audio sessions | 🔴 Critical |
| Sets volume for a specific session (0-100) | 🔴 Critical |
| Clamps volume to valid range (0-100) | 🟡 High |
| Routes session to target device | 🔴 Critical |
| Throws error for invalid session ID | 🟡 High |
| Throws error for invalid device ID | 🟡 High |
| Handles device disconnection gracefully | 🔴 Critical |

### Device Monitor (`src/audio/deviceMonitor.js`)
| Test Case | Priority |
|-----------|----------|
| Emits 'device-added' when new device connected | 🔴 Critical |
| Emits 'device-removed' when device disconnected | 🔴 Critical |
| Emits 'session-started' when app begins audio | 🟡 High |
| Emits 'session-ended' when app stops audio | 🟡 High |
| Does not emit duplicate events for same device | 🟡 High |
| Handles rapid connect/disconnect cycles | 🟢 Medium |

### Profile Manager (`src/profiles/profileManager.js`)
| Test Case | Priority |
|-----------|----------|
| Creates profile with name, mappings, volumes | 🔴 Critical |
| Saves profile to JSON file on disk | 🔴 Critical |
| Loads profile from JSON file | 🔴 Critical |
| Lists all saved profiles | 🔴 Critical |
| Deletes profile (removes file) | 🟡 High |
| Renames profile (updates file) | 🟡 High |
| Returns default profiles on first launch | 🟡 High |
| Handles corrupted JSON file gracefully | 🔴 Critical |
| Rejects duplicate profile names | 🟡 High |
| Handles profile with missing device reference | 🔴 Critical |

### Startup Utility (`src/utils/startup.js`)
| Test Case | Priority |
|-----------|----------|
| Registers app in Windows startup | 🟡 High |
| Unregisters app from Windows startup | 🟡 High |
| Checks if app is registered for startup | 🟡 High |
| Handles permission denied gracefully | 🟡 High |

---

## Integration Testing

Integration tests verify that components work together correctly.

### Audio Routing Flow
```
Test: Route app audio to different device
1. AudioManager.getOutputDevices() → returns device list
2. AudioManager.getAudioSessions() → returns session list
3. AudioManager.routeSession(sessionId, deviceId) → routes audio
4. Verify: session's output device changed
5. Verify: audio actually plays from target device (mock verification)
```

### Profile Application Flow
```
Test: Apply a saved profile
1. ProfileManager.loadProfile('Gaming') → returns profile data
2. For each mapping in profile:
   a. AudioManager.routeSession(sessionId, deviceId)
   b. AudioManager.setVolume(sessionId, volume)
3. Verify: all sessions routed correctly
4. Verify: all volumes set correctly
5. Verify: error handling for missing sessions/devices
```

### IPC Communication
```
Test: Renderer requests device list via IPC
1. Renderer sends 'get-devices' IPC message
2. Main process calls AudioManager.getOutputDevices()
3. Main process replies with device list
4. Verify: renderer receives correct data
5. Verify: IPC round-trip < 100ms
```

---

## End-to-End Testing

E2E tests run the full Electron app and verify user-facing behavior.

### App Launch
| Test Case | Priority |
|-----------|----------|
| App window opens within 3 seconds | 🔴 Critical |
| Window displays device cards | 🔴 Critical |
| Window displays audio session cards | 🔴 Critical |
| No console errors on launch | 🔴 Critical |
| Tray icon appears | 🟡 High |

### Device Routing Workflow
| Test Case | Priority |
|-----------|----------|
| User can select a different output device for an app | 🔴 Critical |
| Selection updates the device dropdown UI | 🔴 Critical |
| Volume slider is draggable and updates volume | 🔴 Critical |
| Mute button toggles mute state | 🟡 High |

### Profile Workflow
| Test Case | Priority |
|-----------|----------|
| User can click "+" to create a new profile | 🔴 Critical |
| User can name and save a profile | 🔴 Critical |
| User can click a profile to apply it | 🔴 Critical |
| User can delete a profile | 🟡 High |
| Default profiles appear on first launch | 🟡 High |

### System Tray Workflow
| Test Case | Priority |
|-----------|----------|
| Right-click tray → menu appears with profiles | 🟡 High |
| Click profile in tray menu → profile applied | 🟡 High |
| Double-click tray → window opens | 🟡 High |
| Close window → app minimizes to tray | 🟡 High |

---

## Regression Testing

### Critical Paths That Must Never Regress

These are the core user journeys. If any of these break, it's a **release blocker**:

1. **Device detection**: App correctly lists all connected audio output devices
2. **Session detection**: App correctly lists all running audio apps
3. **Audio routing**: Changing an app's output device actually changes where audio plays
4. **Volume control**: Slider changes actually affect audio volume
5. **Profile save/load**: Profiles persist and restore correctly
6. **App startup**: App launches without errors

### Regression Test Suite
- Run the full regression suite before every release
- Run critical path tests after every significant code change
- Automate via CI when repository is set up

---

## Performance Testing

### Benchmarks

| Metric | Target | Test Method |
|--------|--------|-------------|
| App startup | < 3s | Measure from `app.ready` event to `window.show` |
| Device enumeration | < 500ms | Timestamp before/after `getOutputDevices()` |
| Session enumeration | < 500ms | Timestamp before/after `getAudioSessions()` |
| Route change | < 200ms | Timestamp before/after `routeSession()` |
| Volume change | < 50ms | Timestamp before/after `setVolume()` |
| Profile apply | < 500ms | Timestamp before/after `applyProfile()` |
| Memory (idle) | < 100MB | Process memory after 5-minute idle |
| Memory (1 hour) | < 120MB | Process memory after 1-hour operation |
| CPU (idle) | < 2% | Average CPU over 5-minute idle |

### Memory Leak Detection
- Run app for 1 hour with periodic routing changes
- Compare memory at start vs. end
- Acceptable variance: ± 10MB
- If memory grows > 20MB over baseline → investigate

---

## What Must Be Tested Before Merging

For any code change, the following must pass:

### Minimum (for all changes)
- [ ] All existing unit tests pass
- [ ] No new console errors or warnings
- [ ] ESLint passes with no errors

### For feature changes
- [ ] New unit tests written for new code
- [ ] Integration tests pass
- [ ] Manual verification of affected feature
- [ ] Performance benchmarks not regressed

### For release
- [ ] Full regression suite passes
- [ ] E2E tests pass
- [ ] Performance benchmarks all within target
- [ ] 1-hour stability test passes
- [ ] Fresh install test on clean Windows

---

## Mock Strategy

Since audio APIs are system-dependent and not available in CI, we use mocks for unit and integration tests:

### `mocks/audioDevices.mock.js`
```javascript
// Mock audio device data
const mockDevices = [
  { id: 'dev-1', name: 'Speakers', type: 'speakers', isDefault: true },
  { id: 'dev-2', name: 'USB Headphones', type: 'headphones', isDefault: false },
  { id: 'dev-3', name: 'JBL Go BT', type: 'bluetooth', isDefault: false },
];
```

### `mocks/audioSessions.mock.js`
```javascript
// Mock audio session data
const mockSessions = [
  { id: 'ses-1', name: 'Spotify', processName: 'Spotify.exe', volume: 0.72, deviceId: 'dev-3' },
  { id: 'ses-2', name: 'Valorant', processName: 'VALORANT.exe', volume: 0.95, deviceId: 'dev-2' },
  { id: 'ses-3', name: 'Chrome', processName: 'chrome.exe', volume: 0.30, deviceId: 'dev-1' },
];
```

### `mocks/windowsApi.mock.js`
```javascript
// Mock Windows Core Audio API responses
// Used to simulate WASAPI calls in non-Windows environments
```

---

## Test Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run E2E tests only
npm run test:e2e

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run performance benchmarks
npm run test:perf
```
