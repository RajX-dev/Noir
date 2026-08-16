# Tech Stack — SoundFlow

> **Last Updated**: 2026-08-16
> **Status**: Decisions finalized for MVP

---

## Overview

This document records every major technology decision for SoundFlow, including **what** we chose, **why**, **what alternatives we considered**, and **why we rejected them**. This is a living document — update it whenever a decision changes.

---

## Application Framework

### ✅ Chosen: Electron (v28+)

**What it is**: A framework for building cross-platform desktop apps using web technologies (HTML, CSS, JavaScript). It bundles Chromium and Node.js.

**Why we chose it**:
- **Audio API access is far easier** — Node.js has a rich npm ecosystem for Windows audio control (`ffi-napi`, PowerShell child processes, native N-API addons). Our app's entire core is talking to Windows audio APIs, and Electron/Node.js has the most accessible path to WASAPI.
- Enables a **modern, beautiful UI** using HTML/CSS/JS — critical for our design vision (glassmorphism, animations, dark mode)
- **One language (JavaScript)** for both frontend and backend — faster development, easier debugging, single mental model
- **Node.js integration** gives us access to native Windows APIs via addons and child processes
- **Cross-platform potential** — when we expand to macOS later, we reuse 90%+ of the codebase
- **Massive ecosystem** — thousands of packages, great tooling, well-documented. 10+ years of maturity, huge Stack Overflow presence.
- **IPC system** — clean separation between main process (audio control) and renderer process (UI)
- **System tray support** built-in via Electron's `Tray` API
- **Auto-updater** built-in for future updates
- **Hot reload** — change JS → app reloads instantly during development (vs. 30-60s Rust recompiles)
- **Debugging** — Chrome DevTools + `console.log` everywhere, familiar workflow

**Trade-offs (accepted)**:
- Higher memory footprint (~80-150MB) compared to native apps (~10-30MB)
- Larger bundle size (~150MB installer vs ~5-10MB for Tauri)
- Not as performant as pure native for CPU-intensive tasks
- These are acceptable because SoundFlow is an always-on background utility — users care about functionality, not installer size. Memory usage is comparable to apps like Discord and Slack which users happily run 24/7.

**When to reconsider**: If memory usage becomes a user complaint post-launch, consider migrating to Tauri for v2.0 with the architecture already proven. The frontend (HTML/CSS/JS) would transfer directly — only the backend would need a Rust rewrite.

### ❌ Rejected Alternatives

| Alternative | Why Rejected |
|------------|-------------|
| **Tauri (Rust + WebView)** | **Seriously considered.** 10x smaller bundle (~5-10MB), 5x less memory (~20MB), near-native performance. However, rejected for MVP because: **(1)** Our core feature (per-app audio routing) requires heavy Windows COM/WASAPI API access — Rust has very few ready-made crates for this, meaning we'd write raw unsafe FFI code manually. Node.js has mature packages and PowerShell access. **(2)** Two-language stack (JS + Rust) doubles cognitive overhead vs. JS-only. **(3)** Rust backend changes require full recompilation (30-60s each time) vs. instant hot reload. **(4)** Smaller community means fewer examples for niche audio routing use cases. **(5)** Tauri is ~3 years mature vs. Electron's 10+ years. **Verdict**: Tauri makes a better *app*, Electron makes a faster path to a *working* app. Planned for reconsideration in v2.0. |
| **C# / WPF** | Better native performance and smaller footprint, but UI capabilities are limited compared to web technologies. WPF's styling system is powerful but far more verbose. No cross-platform path to macOS/Linux. Would require learning XAML for UI. |
| **C# / WinUI 3** | Modern Windows-native UI, but locked to Windows only. No cross-platform path. Still maturing — fewer community resources. |
| **Qt (C++ / Python)** | Cross-platform and performant, but UI styling is limited compared to web. Qt licensing (GPL/commercial) adds complexity. PyQt is slow for real-time audio visualization. |
| **Flutter Desktop** | Good cross-platform story, but desktop support is still relatively new. Limited access to Windows audio APIs — would need platform channels for everything. |
| **Python + Tkinter/PyQt** | Simplest to prototype, but UI looks dated. Not suitable for the premium, modern design we need. Performance concerns for real-time audio visualization. |

---

## Audio Control Layer

### ✅ Chosen: Windows Core Audio API (WASAPI) via PowerShell + Native Node Addon

**What it is**: Windows Core Audio Session API (WASAPI) is the low-level Windows API for managing audio sessions, devices, and routing. We access it through:
1. **PowerShell scripts** — for device/session enumeration (simpler, no compilation needed)
2. **Native Node.js addon (N-API/C++)** — for real-time audio control and routing (performance-critical operations)

**Why we chose it**:
- WASAPI is the **only reliable way** to control per-app audio on Windows
- It's the **same API** that Windows 10/11 uses internally for its sound settings
- PowerShell gives us quick access for non-performance-critical operations (listing devices)
- Native addon gives us low-latency control for routing and volume changes
- Well-documented by Microsoft

**Trade-offs**:
- Native addon requires C++ compilation (adds build complexity)
- PowerShell calls have ~100-200ms overhead (acceptable for enumeration, not for real-time control)
- Windows-only (expected — we're targeting Windows first)

**When to reconsider**: If we find a well-maintained Node.js package that wraps WASAPI reliably (e.g., `node-audio-windows` or `windows-audio`), we should evaluate switching to reduce maintenance burden.

### ❌ Rejected Alternatives

| Alternative | Why Rejected |
|------------|-------------|
| **`pycaw` (Python)** | Excellent WASAPI wrapper, but we're not using Python as our runtime. Would require spawning a Python subprocess — adds complexity and a Python dependency. |
| **`node-audio-windows` (npm)** | Promising but not mature enough / poorly maintained. If it improves, we should revisit. |
| **Windows Sound Settings API (via Settings app)** | Too high-level, no programmatic per-app routing control. Only exposes what the Settings UI shows. |
| **Virtual Audio Driver (VAC/VB-Cable approach)** | Maximum flexibility but requires kernel-mode driver development or bundling third-party drivers. Too complex for MVP. Planned for future consideration if WASAPI routing proves insufficient. |

---

## Frontend (Renderer Process)

### ✅ Chosen: Vanilla HTML + CSS + JavaScript

**What it is**: Plain web technologies without a framework. Custom components built with vanilla JS.

**Why we chose it**:
- **Zero build step** for the renderer — faster development iteration
- **No framework overhead** — smaller bundle, faster load
- **Full control** over every pixel — critical for our premium design vision
- **No framework churn** — won't need to migrate when React/Vue/Svelte release breaking changes
- The app is a **single-page, single-view** application — a framework would be overkill
- **Simpler debugging** — no virtual DOM, no framework-specific devtools needed

**Trade-offs**:
- More boilerplate for DOM manipulation compared to React/Vue
- No component lifecycle management (we'll build a lightweight pattern ourselves)
- State management is manual (fine for our simple state)

**When to reconsider**: If the UI grows significantly complex (multiple pages, complex state, nested component trees), we should consider adding a lightweight framework like Svelte or Preact.

### ❌ Rejected Alternatives

| Alternative | Why Rejected |
|------------|-------------|
| **React** | Adds ~45KB to bundle, requires JSX compilation, virtual DOM overhead. Overkill for a single-view app with ~10 interactive components. |
| **Vue.js** | Lighter than React but still adds unnecessary abstraction for our use case. Template compilation adds build complexity. |
| **Svelte** | Best alternative — compiles away at build time, minimal overhead. However, adds a build step and Svelte-specific tooling. Would be our choice if we needed a framework. |
| **Angular** | Enterprise-grade framework, massive overkill. Heavy, opinionated, steep learning curve. |

---

## Styling

### ✅ Chosen: Vanilla CSS with Custom Properties (CSS Variables)

**What it is**: Standard CSS with a design token system built on CSS custom properties for theming and consistency.

**Why we chose it**:
- **Full control** over design — glassmorphism, custom animations, gradients
- **CSS custom properties** provide a clean theming system (dark mode, accent colors)
- **No build step** — styles load directly
- **No class name conflicts** — we use BEM naming convention
- **Smaller payload** than utility frameworks

**Trade-offs**:
- More verbose than utility-first frameworks for simple layouts
- No automatic purging of unused styles (not needed at our scale)

**When to reconsider**: If the project grows to 50+ components with many developers, a utility framework or CSS-in-JS solution would reduce style conflicts.

### ❌ Rejected Alternatives

| Alternative | Why Rejected |
|------------|-------------|
| **Tailwind CSS** | Utility-first approach clutters HTML with dozens of classes, making templates harder to read. Requires build step (PostCSS). Good for rapid prototyping but less control over custom designs. |
| **Sass/SCSS** | Adds a build/compilation step. CSS custom properties now cover most of what Sass variables provided. Nesting is coming to native CSS. |
| **CSS Modules** | Useful in React/Vue for scoped styles, but we're not using a framework. BEM convention handles scoping for us. |
| **Styled Components** | React-specific. Not applicable. |

---

## Data Storage

### ✅ Chosen: Local JSON Files (via Node.js `fs` module)

**What it is**: Profiles and settings stored as JSON files in `%APPDATA%/SoundFlow/`.

**Why we chose it**:
- **Simplest possible solution** for our data needs (profiles = small JSON objects)
- **No database dependency** — nothing to install, configure, or maintain
- **Human-readable** — users can manually edit/backup profiles
- **Portable** — users can copy profile files between machines
- **Node.js native** — `fs.readFileSync`/`fs.writeFileSync`, zero dependencies

**Trade-offs**:
- No querying capabilities (not needed)
- No concurrent write protection (single-user desktop app, not an issue)
- No schema validation built-in (we'll validate in code)

**When to reconsider**: If we add cloud sync, multi-device profiles, or usage analytics, we'll need a proper database or cloud storage solution.

### ❌ Rejected Alternatives

| Alternative | Why Rejected |
|------------|-------------|
| **SQLite** | Full relational database — massive overkill for storing 5-10 JSON profile objects. Adds a native dependency (better-sqlite3). |
| **electron-store** | A popular key-value store for Electron. Viable option, but adds a dependency for something `fs` handles natively. Would reconsider if we need encryption or schema migration. |
| **LowDB** | JSON-based database with lodash-like API. Nice but unnecessary abstraction over raw JSON file I/O. |
| **IndexedDB (in renderer)** | Browser-based storage. Data would be tied to the Chromium profile, making backup/portability harder. |

---

## Build & Packaging

### ✅ Chosen: electron-builder

**What it is**: A complete solution to package and build Electron apps for distribution. Creates `.exe` installers, portable executables, and auto-update support.

**Why we chose it**:
- **Industry standard** for Electron app distribution
- **NSIS installer** support (professional Windows installer experience)
- **Auto-update** support via electron-updater
- **Code signing** support for future distribution
- **Portable mode** option (no installation required)

**Trade-offs**:
- Configuration can be complex for advanced scenarios
- Build times are slow (~2-5 minutes for a full build)

### ❌ Rejected Alternatives

| Alternative | Why Rejected |
|------------|-------------|
| **electron-forge** | Electron's official tool. Good but less flexible than electron-builder for custom installer configurations. Smaller community. |
| **Manual packaging** | No installer, no auto-update, no code signing. Not viable for distribution. |

---

## Development Tools

| Tool | Purpose | Why |
|------|---------|-----|
| **npm** | Package management | Standard for Node.js/Electron projects |
| **ESLint** | Code linting | Catch bugs early, enforce code style |
| **Prettier** | Code formatting | Consistent code style across the project |
| **nodemon** | Dev auto-reload | Restart Electron on file changes during development |
| **electron-devtools-installer** | DevTools extensions | Chrome DevTools for debugging renderer process |

---

## Decision Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-08-16 | Chose Electron over Tauri/C# | Cross-platform potential + web UI capabilities outweigh bundle size concerns |
| 2026-08-16 | Chose WASAPI over virtual audio driver | WASAPI is sufficient for MVP per-app routing; virtual driver too complex |
| 2026-08-16 | Chose vanilla JS over React/Vue | Single-view app doesn't justify framework overhead |
| 2026-08-16 | Chose JSON files over SQLite | Profile data is simple enough for flat-file storage |
| 2026-08-16 | Windows first, Android later | Windows has best API support for per-app audio control |
