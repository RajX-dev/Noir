# Visuals & Design System — SoundFlow

> **Last Updated**: 2026-08-16
> **Status**: Pre-Implementation — Design System Defined

---

## Design Philosophy

SoundFlow must feel **premium, alive, and effortless**. Users should be wowed at first glance. The interface should feel like a high-end audio control panel — not a boring settings page.

### Core Principles

| Principle | Meaning |
|-----------|---------|
| **Dark-first** | Dark mode is the default — our target users (gamers, creators, music lovers) live in dark mode |
| **Glassmorphism** | Frosted glass cards with blur effects create depth and premium feel |
| **Motion is meaning** | Every animation serves a purpose — transitions guide attention, micro-animations confirm actions |
| **Information density** | Show everything on one screen — no tabs, no pages, no buried settings |
| **Alive interface** | Real-time audio visualizers make the UI feel like a living dashboard |
| **Zero learning curve** | Every control is self-explanatory — drag, slide, click |

---

## Color Palette

### Primary Colors (Dark Theme)

```css
:root {
  /* Background layers (darkest → lightest) */
  --bg-base:          #0a0a0f;        /* App background — near black with blue tint */
  --bg-surface:       #12121a;        /* Card backgrounds */
  --bg-surface-hover: #1a1a28;        /* Card hover state */
  --bg-elevated:      #1e1e2e;        /* Modals, dropdowns, tooltips */
  --bg-overlay:       rgba(0, 0, 0, 0.6); /* Modal backdrop */

  /* Accent — Purple/Violet gradient (primary brand color) */
  --accent-primary:   #7c3aed;        /* Primary purple */
  --accent-secondary: #a855f7;        /* Lighter purple */
  --accent-gradient:  linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #6366f1 100%);
  --accent-glow:      rgba(124, 58, 237, 0.3); /* Glow effect behind accent elements */

  /* Audio visualizer colors */
  --viz-low:          #22c55e;        /* Green — low audio level */
  --viz-mid:          #eab308;        /* Yellow — mid audio level */
  --viz-high:         #ef4444;        /* Red — high/clipping audio level */
  --viz-gradient:     linear-gradient(90deg, #22c55e 0%, #eab308 60%, #ef4444 100%);

  /* Text */
  --text-primary:     #f0f0f5;        /* Main text — near white */
  --text-secondary:   #8888a0;        /* Subtitles, labels — muted */
  --text-disabled:    #4a4a5e;        /* Disabled state */
  --text-accent:      #a855f7;        /* Accent-colored text (links, active items) */

  /* Borders */
  --border-subtle:    rgba(255, 255, 255, 0.06); /* Very subtle separator */
  --border-medium:    rgba(255, 255, 255, 0.10); /* Card borders */
  --border-accent:    rgba(124, 58, 237, 0.4);   /* Accent-highlighted border */

  /* Status */
  --status-active:    #22c55e;        /* Connected, active — green */
  --status-inactive:  #6b7280;        /* Disconnected, inactive — gray */
  --status-warning:   #f59e0b;        /* Warning — amber */
  --status-error:     #ef4444;        /* Error — red */

  /* Glassmorphism */
  --glass-bg:         rgba(255, 255, 255, 0.03);
  --glass-border:     rgba(255, 255, 255, 0.08);
  --glass-blur:       16px;
}
```

### Color Usage Rules

| Element | Color | Notes |
|---------|-------|-------|
| App background | `--bg-base` | Solid, no patterns |
| Device cards | `--bg-surface` + glassmorphism | Slightly translucent with blur |
| App audio cards | `--bg-surface` + glassmorphism | Consistent with device cards |
| Active/selected state | `--accent-primary` border | Purple glow highlight |
| Volume slider track | `--border-medium` | Subtle track |
| Volume slider fill | `--accent-gradient` | Purple gradient fills as volume increases |
| Audio level meter | `--viz-gradient` | Green → Yellow → Red based on level |
| Profile buttons | `--bg-surface` default, `--accent-gradient` when active | Clear active state |
| Mute button | `--status-error` when muted | Red = silence |
| Tray/notification | System default | Match Windows theme |

---

## Typography

### Font Stack

```css
:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
```

**Why Inter**: Clean, modern, excellent readability at small sizes, designed for screens, free on Google Fonts. Used by Figma, Linear, Vercel — the gold standard for tech product UIs.

### Type Scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--text-xs` | 10px | 400 | Tiny labels, timestamps |
| `--text-sm` | 12px | 400 | Secondary labels, hints |
| `--text-base` | 14px | 400 | Body text, app names, dropdown items |
| `--text-md` | 16px | 500 | Section headers ("OUTPUT DEVICES", "RUNNING APPS") |
| `--text-lg` | 20px | 600 | Page title, "SoundFlow" in title bar |
| `--text-xl` | 24px | 700 | Empty state headers, modal titles |
| `--text-volume` | 13px / mono | 500 | Volume percentage (e.g., "72%") — monospace so numbers don't jump |

### Typography Rules

- **All caps + letter-spacing** for section headers ("OUTPUT DEVICES") — gives a HUD/control-panel feel
- **Monospace for numbers** — volume percentages, audio levels — prevents layout shift when numbers change
- **Medium weight (500)** for interactive labels — clickable items should feel sturdy
- **Regular weight (400)** for informational text — descriptions, subtitles

---

## Spacing System

```css
:root {
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  12px;
  --space-lg:  16px;
  --space-xl:  24px;
  --space-2xl: 32px;
  --space-3xl: 48px;
}
```

| Use Case | Spacing |
|----------|---------|
| Inside cards (padding) | `--space-lg` (16px) |
| Between cards | `--space-md` (12px) |
| Between sections | `--space-xl` (24px) |
| Icon to text gap | `--space-sm` (8px) |
| Window padding (edges) | `--space-xl` (24px) |
| Between device cards (horizontal) | `--space-md` (12px) |

---

## Border Radius

```css
:root {
  --radius-sm:  6px;    /* Buttons, badges, inputs */
  --radius-md:  10px;   /* Cards, dropdowns */
  --radius-lg:  14px;   /* Modals, large containers */
  --radius-xl:  20px;   /* Profile pills, special elements */
  --radius-full: 9999px; /* Circular: mute button, indicators */
}
```

---

## Shadows & Elevation

```css
:root {
  /* Layered shadows for depth */
  --shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md:   0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg:   0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-xl:   0 16px 48px rgba(0, 0, 0, 0.6);

  /* Accent glow (for active/selected elements) */
  --shadow-glow: 0 0 20px rgba(124, 58, 237, 0.3),
                 0 0 40px rgba(124, 58, 237, 0.1);
}
```

| Elevation | Shadow | Elements |
|-----------|--------|----------|
| Level 0 | None | Background |
| Level 1 | `--shadow-sm` | Cards at rest |
| Level 2 | `--shadow-md` | Cards on hover, dropdowns |
| Level 3 | `--shadow-lg` | Modals, context menus |
| Level 4 | `--shadow-xl` | Dragged elements |
| Glow | `--shadow-glow` | Active profile, selected device |

---

## Component Designs

### 1. Title Bar (Custom)

```
┌─────────────────────────────────────────────────────────┐
│  🎵 SoundFlow              ━  🗖  ✕                    │
│  ─── ─── ───                                            │
│  (hamburger)      (drag area)     (window controls)     │
└─────────────────────────────────────────────────────────┘
```

- Custom frameless window with `-webkit-app-region: drag`
- SoundFlow logo + text on the left
- Window controls (minimize, maximize, close) on the right
- Background: `--bg-base` with subtle bottom border
- Height: 36px

---

### 2. Device Cards

```
┌─────────────────┐
│     🔊          │   ← Device type icon (large, 28px)
│   Speakers      │   ← Device name (--text-base, medium weight)
│   Default       │   ← Status badge (--text-xs, green dot)
│   ●●● 3 apps    │   ← Count of apps routed here
└─────────────────┘
```

- **Layout**: Horizontal row of cards, scrollable if overflow
- **Size**: ~120px wide × 90px tall
- **Background**: `--glass-bg` with `backdrop-filter: blur(16px)`
- **Border**: `--glass-border`, 1px solid
- **Active state**: `--border-accent` border + `--shadow-glow`
- **Hover**: Scale 1.02, border brightens
- **Device icon**: Emoji or SVG — 🔊 speakers, 🎧 headphones, 📡 bluetooth, 🖥️ HDMI
- **Status dot**: Green (active/default), gray (available), red (disconnected)

---

### 3. App Audio Cards

```
┌─────────────────────────────────────────────────────────┐
│  [icon] Spotify        ██████████░░░░  │ 🔊 Speakers ▼ │
│                        ━━━━━━━━○━━━━━  │  72%    🔇    │
└─────────────────────────────────────────────────────────┘
```

- **Layout**: Vertical list, full width
- **Height**: ~70px per card
- **Left side**: App icon (32px) + app name
- **Center**: Audio level meter (top) + volume slider (bottom)
- **Right side**: Device selector dropdown + volume percentage + mute toggle
- **Background**: `--bg-surface` with glassmorphism
- **Hover**: Subtle background lighten (`--bg-surface-hover`)
- **Border**: `--glass-border`, becomes `--border-accent` when interacting

#### Audio Level Meter
- Height: 4px, rounded
- Fill: `--viz-gradient` (green → yellow → red)
- Animation: Smooth real-time update, 30fps minimum
- Empty state: Solid `--border-subtle`

#### Volume Slider
- Track height: 4px, rounded, `--border-medium`
- Fill: `--accent-gradient` (purple gradient)
- Thumb: 14px circle, white, with subtle shadow
- Thumb hover: 16px, accent glow
- Interaction: Drag or click anywhere on track

---

### 4. Device Selector Dropdown

```
┌───────────────────┐
│  🔊 Speakers    ▼ │  ← Closed state
└───────────────────┘
         │
         ▼
┌───────────────────┐
│  🔊 Speakers    ✓ │  ← Currently selected (checkmark)
│  🎧 Headphones    │
│  📡 JBL Go BT     │
└───────────────────┘
```

- **Closed**: Compact, shows current device with icon
- **Open**: Drops down with all available devices
- **Selected item**: Checkmark + accent color text
- **Hover**: Background lighten
- **Animation**: Slide down + fade in (150ms ease-out)

---

### 5. Profile Bar

```
┌─────────────────────────────────────────────────────────┐
│  PROFILES                                               │
│  [ 🎮 Gaming ] [ 🎵 Music ] [ 💼 Work ] [ ➕ New ]    │
└─────────────────────────────────────────────────────────┘
```

- **Position**: Bottom of main window
- **Layout**: Horizontal scroll of profile pills
- **Pill style**: Rounded (`--radius-xl`), `--bg-surface` background
- **Active pill**: `--accent-gradient` background, white text, glow shadow
- **Inactive pill**: `--bg-surface`, `--text-secondary`
- **Hover**: Border accent, slight scale
- **"+ New" button**: Dashed border, muted, becomes solid on hover

---

### 6. Mute Button

- **Shape**: Circle (`--radius-full`), 28px
- **Unmuted**: 🔊 icon, `--bg-surface` background
- **Muted**: 🔇 icon, `--status-error` background (red), icon turns white
- **Hover**: Scale 1.1
- **Click**: Brief scale bounce animation (0.9 → 1.0)

---

### 7. Toast Notifications

```
┌─────────────────────────────────┐
│  ✅  Profile "Gaming" applied   │
└─────────────────────────────────┘
```

- **Position**: Bottom-right corner, above profile bar
- **Enter**: Slide up + fade in (200ms)
- **Duration**: 3 seconds
- **Exit**: Fade out + slide down (200ms)
- **Background**: `--bg-elevated` with glassmorphism
- **Types**: ✅ success (green), ⚠️ warning (amber), ❌ error (red), ℹ️ info (blue)

---

## Animations & Transitions

### Timing Functions

```css
:root {
  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);     /* Smooth deceleration */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);    /* Symmetric ease */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* Playful bounce */
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Spring effect */
}
```

### Animation Catalog

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Card hover (scale + border) | 200ms | `--ease-out` | Mouse enter/leave |
| Dropdown open/close | 150ms | `--ease-out` | Click toggle |
| Volume slider thumb drag | Instant | — | Mouse drag |
| Audio level meter update | 50ms | linear | Real-time data |
| Profile pill activate | 300ms | `--ease-bounce` | Click |
| Toast enter | 200ms | `--ease-spring` | Event fire |
| Toast exit | 200ms | `--ease-out` | Auto-dismiss |
| Mute button toggle | 150ms | `--ease-bounce` | Click |
| New app appears in list | 300ms | `--ease-out` | Session detected |
| App removed from list | 200ms | `--ease-out` | Session ended |
| Device card connect | 300ms | `--ease-spring` | Device connected |
| Device card disconnect | 200ms | `--ease-out` | Device removed |
| Window open | 250ms | `--ease-out` | From tray |
| Drag-and-drop ghost | Instant | — | Mouse drag |

### Micro-Animations

1. **Volume slider glow**: When dragging, the slider thumb emits a subtle purple glow that intensifies with volume
2. **Audio pulse**: Device cards subtly pulse when audio is actively playing through them
3. **Profile switch ripple**: When applying a profile, a subtle ripple radiates from the clicked profile pill
4. **Connection indicator**: Green dot on active devices has a slow breathing animation (opacity pulse)
5. **Empty state float**: When no audio apps are running, the empty state illustration gently floats up/down

---

## Layout — Main Window

### Window Properties

| Property | Value |
|----------|-------|
| Default size | 480px × 640px |
| Min size | 420px × 500px |
| Max size | 600px × 900px |
| Resizable | Yes (vertical only recommended) |
| Frameless | Yes (custom title bar) |
| Background | `--bg-base` solid |
| Corner radius | 10px (Windows 11 style) |

### Layout Structure

```
┌─ Window ────────────────────────────────────────────────┐
│                                                         │
│  ┌─ Title Bar ───────────────────────────────────────┐  │
│  │ 🎵 SoundFlow                        ━  🗖  ✕     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Section: Output Devices ─────────────────────────┐  │
│  │ OUTPUT DEVICES                                    │  │
│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │  │
│  │ │ 🔊   │ │ 🎧   │ │ 📡   │ │ 🖥️   │             │  │
│  │ │Spkrs │ │Heads │ │BT    │ │HDMI  │             │  │
│  │ └──────┘ └──────┘ └──────┘ └──────┘             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Section: Running Apps ─── (scrollable) ──────────┐  │
│  │ RUNNING APPS                                      │  │
│  │ ┌──────────────────────────────────────────────┐  │  │
│  │ │ 🎵 Spotify     ████████░░ │ 🔊 Speakers ▼  │  │  │
│  │ │                ━━━━○━━━━━ │  72%    🔇      │  │  │
│  │ ├──────────────────────────────────────────────┤  │  │
│  │ │ 🎮 Valorant    ██████░░░░ │ 🎧 Headphone ▼ │  │  │
│  │ │                ━━━━━━━━○━ │  95%    🔊      │  │  │
│  │ ├──────────────────────────────────────────────┤  │  │
│  │ │ 🌐 Chrome      ██░░░░░░░░ │ 🔊 Speakers ▼  │  │  │
│  │ │                ━━○━━━━━━━ │  30%    🔊      │  │  │
│  │ └──────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Section: Profiles ───────────────────────────────┐  │
│  │ PROFILES                                          │  │
│  │ [🎮 Gaming] [🎵 Music] [💼 Work] [➕]            │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Section Proportions

| Section | Height Behavior |
|---------|----------------|
| Title bar | Fixed: 36px |
| Output Devices | Fixed: ~120px (cards are fixed height) |
| Running Apps | **Flexible** — takes remaining space, scrollable |
| Profiles | Fixed: ~60px (pinned to bottom) |

---

## Empty States

### No Audio Devices

```
┌─────────────────────────────────────────┐
│                                         │
│           🔇                            │
│   No audio devices detected             │
│                                         │
│   Connect speakers, headphones,         │
│   or a Bluetooth device to get          │
│   started.                              │
│                                         │
│         [ 🔄 Refresh ]                  │
│                                         │
└─────────────────────────────────────────┘
```

### No Running Audio Apps

```
┌─────────────────────────────────────────┐
│                                         │
│           🎵                            │
│   No apps playing audio                 │
│                                         │
│   Start playing music or a video,       │
│   and it will appear here               │
│   automatically.                        │
│                                         │
└─────────────────────────────────────────┘
```

- Muted text (`--text-secondary`)
- Emoji icon with gentle floating animation
- Centered vertically in the section

---

## Icon System

### Device Icons
| Device Type | Icon | Fallback |
|------------|------|----------|
| Speakers | 🔊 | SVG speaker icon |
| Headphones | 🎧 | SVG headphone icon |
| Bluetooth | 📡 | SVG bluetooth icon |
| HDMI | 🖥️ | SVG monitor icon |
| USB Audio | 🔌 | SVG usb icon |
| Unknown | 🔈 | SVG generic audio icon |

### Profile Icons
| Profile | Icon |
|---------|------|
| Gaming | 🎮 |
| Music | 🎵 |
| Work | 💼 |
| Movie Night | 🎬 |
| Custom | User picks from emoji set |

### App Icons
- **Source**: Extract from running process using Windows API
- **Size**: 32px × 32px in app cards
- **Fallback**: Generic app icon (🔊) if extraction fails
- **Format**: PNG, cached in temp directory

---

## Drag-and-Drop Visual Feedback

### Dragging an App Card to a Device

1. **Grab**: App card lifts slightly (scale 1.02, shadow increases to `--shadow-xl`)
2. **Dragging**: Ghost of the card follows cursor at 80% opacity
3. **Over device**: Target device card highlights with `--border-accent` + `--shadow-glow`
4. **Drop**: Device card pulses briefly, app card's device selector updates
5. **Cancel**: Card animates back to original position (`--ease-spring`, 300ms)

---

## Responsive Behavior

Since this is a desktop app with constrained window sizes, responsiveness is limited but handled:

| Window Width | Behavior |
|-------------|----------|
| < 420px | Not allowed (minimum width) |
| 420–480px | Compact mode — smaller device cards, tighter spacing |
| 480–600px | Full mode — all elements at designed size |

| Window Height | Behavior |
|--------------|----------|
| < 500px | Not allowed (minimum height) |
| 500–640px | Fewer app cards visible, scrolling earlier |
| 640–900px | More app cards visible |

---

## Design Checklist (Pre-Implementation)

Before building any component, verify it meets these criteria:

- [ ] Uses colors from the defined palette (no hardcoded hex values)
- [ ] Uses spacing from the spacing system (no arbitrary pixel values)
- [ ] Uses typography from the type scale
- [ ] Has defined hover/active/focus states
- [ ] Has smooth transitions (minimum 150ms)
- [ ] Works with 0, 1, and many items (empty, single, overflow states)
- [ ] Text is readable (contrast ratio 4.5:1 minimum for WCAG AA)
- [ ] Interactive elements have 44px minimum touch target
- [ ] Animations can be disabled (respects `prefers-reduced-motion`)
- [ ] Looks premium — would you screenshot it and show a friend?
