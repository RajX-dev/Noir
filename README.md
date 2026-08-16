# Noir 🎵

> Advanced Per-Application Audio Router & Controller for Windows.

Noir gives you complete control over where individual apps send their audio output (e.g. Spotify to Bluetooth speaker, Valorant & Discord to Headset), per-app volume sliders, and instant audio profiles.

---

## Features

- 🎧 **Per-App Audio Routing**: Send any application's audio to any connected audio endpoint.
- 🎚️ **Granular Volume Control**: Independent volume sliders and mute toggles per running session.
- ⚡ **Real-Time VU Level Meters**: Live visual feedback of active audio streams.
- 💾 **Audio Profiles**: Switch seamlessly between Gaming, Music & Focus, and Work presets.
- 🔮 **Ultra-Modern Dark UI**: Obsidian glassmorphic interface with micro-animations.

---

## Getting Started

### Prerequisites
- Windows 10 (1903+) or Windows 11
- [Node.js](https://nodejs.org/) v18+ and npm

### Installation & Development

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode
npm run dev

# 3. Lint code
npm run lint

# 4. Package as Windows .exe
npm run package
```

---

## Documentation

All architectural decisions, product requirements, development phases, and verification criteria are maintained in [`docs/`](./docs):

- [`docs/product-requirements.md`](./docs/product-requirements.md) — Product vision & use cases
- [`docs/tech-stack.md`](./docs/tech-stack.md) — Tech choices & trade-offs
- [`docs/phases.md`](./docs/phases.md) — Roadmap & phase tracking
- [`docs/architecture.md`](./docs/architecture.md) — System design & IPC data flow
- [`docs/visuals.md`](./docs/visuals.md) — Design system & component tokens
- [`docs/verification.md`](./docs/verification.md) — Quality criteria & test gates
- [`docs/testing.md`](./docs/testing.md) — Test strategy & suite layout
