# Stitch Design System & UI/UX Source of Truth Reference

## 1. Overview
The **Stitch frontend** is the permanent UI/UX source of truth for the **Netflix AI Watch Spaces** project. It dictates both the foundational architecture and all future evolutions of the interface.

---

## 2. Design Tokens ("Cinematic Obsidian")

### Palette Architecture
| Role | Hex | Tailwind Token | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas** | `#131315` | `bg-background` | Master stage & root backdrop |
| **Obsidian Base** | `#0e0e0f` | `surface-container-lowest` | Ground-tier frosted glass & cards |
| **Obsidian Mid** | `#1c1b1d` | `surface-container-low` | Card bodies, input backgrounds |
| **Obsidian Elevated** | `#2a2a2b` | `surface-container-high` | Modals, active pills, hovering panels |
| **Netflix Crimson** | `#e50914` | `primary-container` | Primary actions, live indicators, playheads |
| **Warm Amber** | `#f3bd79` | `secondary` | Secondary highlights, AI tags, chapter pips |
| **Live Emerald** | `#22c55e` | `emerald-500` / `emerald-400` | Peer synchronization & frame-lock indicators |
| **Typography** | `#ffffff` / `#e5e1e3` | `text-white` / `on-surface` | High-contrast clarity against pitch-black |

### Typography Hierarchy (Font: Geist)
- **Display Headlines**: `Geist`, 56px–88px, letter-spacing `-0.04em` to `-0.03em`, uppercase, tight tracking.
- **Section Titles**: `Geist`, 24px–40px, letter-spacing `-0.025em`.
- **Editorial Body**: `Geist`, 14px–18px, relaxed line height (`1.6`).
- **Micro-Labels & Technical Badges**: `Geist`, 10px–12px, uppercase, letter-spacing `0.14em`–`0.25em`.

---

## 3. Screen Inventory & Architecture

### Screen 1: Home Cinema Experience (`home_cinema_exp.html` → `HomeCinema.tsx`)
- **Cinematic Hero (88vh)**: Full bleed key artwork, multi-tier obsidian vignette, ambient crimson glow, technical indicator (`Frame-Lock ±0.8ms`), dual-cta (`Create Watch Space`, `Explore Theater`).
- **Continue Watching Rail**: Asymmetrical rhythm (featured card + companion cards) wired to real user `history`.
- **Your Watch Spaces**: 16:9 widescreen portals wired to real `activeSpaces` with live sync emerald pings and guest avatars.
- **Trending Cinema**: Master artwork grid wired to real `titles`.
- **AI Film Scholar Picks**: Hybrid recommendation cards with precision match percentages and grounded reasoning.

### Screen 2: Discover Repertory (`discover.html` → `Discover.tsx`)
- **Curated Repertory Header**: Edition No. 44 masthead.
- **Floating Glass Search Console**: ⌘K hotkey trigger, real-time input.
- **Mood / Aura Chips**: `Mind-Bending Sci-Fi`, `A24 Psychological`, `70mm Panavision`, `Criterion 4K Master`.
- **Featured Spotlight**: 6-stop organic vignette, 4K Dolby Atmos badges.
- **Catalog Grid**: Interactive title cards with solo watch or room launch triggers.

### Screen 3: My Spaces Vault (`my_spaces_hub.html` → `MySpacesHub.tsx`)
- **Personal Vault & Archive Header**: Fast action buttons (`Create New Space`, `Join with Invite Code`).
- **Currently Streaming Portals**: Active rooms with status and live guest avatars.
- **Scheduled Watch Parties**: Slated premieres calendar.
- **Past Watch Archives**: History records with progress bars and star ratings.

### Screen 4: Live Theater & AI Co-Pilot (`live_theater.html` → `WatchRoom.tsx`)
- **Left / Center Video Viewport (70-75%)**:
  - Full HTML5 video stream with millisecond drift measurement (`Frame-Lock ±Xms`).
  - Floating emoji reaction stream (`🔥`, `🤯`, `🍿`, `✨`, `👏`).
  - In-scene timeline trivia cards & character dossier popups.
  - Interactive narrative variation voting overlay (`room.variation.vote`) with live percentage bars.
  - Master HUD glass pill controls: 10s seeks, glowing playhead scrubber with chapter markers, format badges, subtitles, fullscreen.
- **Right Companion Sidebar (25-30%)**:
  - **People Tab**: Presence status, spatial audio channels, host crown.
  - **Chat Tab**: Real-time group chat stream over WebSocket.
  - **Watch AI Tab**: AI Film Scholar, scene dissection, cinematography notes, dynamic audio score, curated inquiry pills, and custom inquiry prompt.

---

## 4. Governance Policy for Future Modifications
1. **Permanence**: All new screens, modals, or components must follow the Stitch design tokens without deviation.
2. **Real Telemetry**: No UI element may introduce mock data where backend APIs exist.
3. **No Viewport Lock**: Main application pages must maintain natural vertical scrolling (`overflow-y: auto`).
