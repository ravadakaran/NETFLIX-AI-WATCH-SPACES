# Stitch UI/UX Source of Truth Governance

## Core Directive
The **Google Stitch design system and screen architecture** is the **permanent UI/UX source of truth** for this repository (`Watch Spaces - Social Streaming Platform`). It strictly governs the initial migration AND **every future frontend modification**.

## Immutable Frontend Principles

1. **Design System & Aesthetics ("Cinematic Obsidian")**:
   - **Theme**: Dark cinematic field with pitch-black foundations, frosted obsidian glass tiers, and subtle atmospheric crimson/amber underglow.
   - **Primary Palette**:
     - Base Canvas: `#131315` / `#050505` (`bg-background`)
     - Obsidian Surfaces: `#0e0e0f` (`surface-container-lowest`), `#1c1b1d` (`surface-container-low`), `#2a2a2b` (`surface-container-high`)
     - Netflix Crimson Accent: `#e50914` (`primary-container`), hover glow `rgba(229, 9, 20, 0.45)`
     - Warm Amber Accent: `#f3bd79` (`secondary`)
     - Synchronous Live Accent: `#22c55e` / `#34d399` (dedicated solely to peer synchronization, live co-watching status, and stream health)
     - High-Contrast Text: `#ffffff` for titles, `#e5e1e3` (`on-surface`), `#a1a1aa` for secondary metadata
   - **Typography**: `Geist` font family with negative tracking on headlines (`-0.04em` to `-0.025em`) and wide tracking (`0.14em` to `0.25em`) on uppercase micro-labels and format badges.
   - **Iconography**: Google `Material Symbols Outlined` (with variable fill settings where specified).

2. **Screen Architecture & Route Mapping**:
   - **Home (`/` or `home`)**: Screen `home_cinema_exp.html` (Full-screen 88vh cinematic hero, asymmetrical Continue Watching, Your Watch Spaces portals, Trending Cinema, AI Film Scholar Picks, Cinema footer). Natural vertical scrolling is mandatory.
   - **Discover (`/discover` or `discover`)**: Screen `discover.html` (Curated Repertory Edition No. 44, floating glass search console with ⌘K, mood/aura filter chips, Featured Editorial Spotlight, catalog grid).
   - **My Spaces (`/spaces` or `spaces`)**: Screen `my_spaces_hub.html` (Personal Vault & Archive, Create Space and Join with Code triggers, Live Sync streaming cards, Scheduled Watch Parties calendar, Past Watch Archives).
   - **Live Theater (`/spaces/:spaceId` or `room`)**: Screen `live_theater.html` (**Core Product Experience**):
     - Left/Center (70-75%): Video canvas, top status bar with Frame-Lock drift ms pill, floating reaction emoji stream, interactive trivia and variation branch voting overlays, and master floating glass pill HUD controls (play/pause, 10s seeks, timeline scrubber, volume, format badges, subtitles, fullscreen).
     - Right Companion Sidebar (25-30%): Frosted obsidian glass rail switching between `People`, `Chat`, and `Watch AI` (AI Film Scholar, scene dissection, cinematography notes, dynamic audio score, curated inquiry pills, and custom inquiry prompt).

3. **Backend Integration & Real Telemetry**:
   - No mock/placeholder data where backend APIs exist.
   - All real-time room communication must flow through `WatchSpaceSocket` (`/ws/watch-spaces/{id}`).
   - All state mutations must use `api.ts` services.
   - Authentication tokens (`netflix_token`) and role personas (`HOST`, `VIEWER`, `ADMIN`) must be maintained across all screens.

4. **Future Modification Rules**:
   - **NEVER** degrade the UI into a standard admin dashboard or generic boilerplate.
   - **NEVER** strip away glassmorphic layers, specular rims, or ambient glows.
   - **NEVER** use `height: 100vh` or `overflow: hidden` on root containers that break page scrolling.
   - Any new feature (e.g. WebRTC voice chat, multi-branch narrative trees, ABR stream switching) MUST be designed and styled strictly according to the Stitch Cinematic Obsidian design tokens.
