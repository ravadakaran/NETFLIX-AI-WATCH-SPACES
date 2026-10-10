# GEMINI WORKSPACE INSTRUCTIONS: NETFLIX AI WATCH SPACES

## Permanent UI/UX Source of Truth
**Google Stitch** is the **permanent UI/UX source of truth** for this project.

All frontend components, layouts, color palettes, animations, and typography are governed by the **Stitch "Nocturne Luminary" Design System** and the screens stored in `screens/`:
1. `landing_page.html` -> Landing Cinema (`LandingPage.tsx`)
2. `sign_in.html` -> Sign In (`SignInView.tsx`)
3. `get_started.html` -> Sign Up / Onboarding (`SignUpView.tsx`)
4. `home_nocturne.html` -> Home Cinema (`HomeCinema.tsx`)
5. `discover_nocturne.html` -> Discover Repertory (`Discover.tsx`)
6. `my_spaces_nocturne.html` -> My Spaces Vault (`MySpacesHub.tsx`)
7. `live_theater_nocturne.html` -> Watch Space Live Theater (`WatchRoom.tsx`)

### Rules for All Future Modifications:
1. **Preserve Stitch Aesthetic**:
   - Palette: Midnight Blue (`#0D1535`, `#080D24`, `#050712`), Dark Blue (`#111936`), Electric Blue (`#2563EB`, `#3B82F6`), Violet (`#7C3AED`, `#8B5CF6`), Magenta (`#D946EF`), Soft Pink (`#EC4899`, `#F472B6`, `#FFB0CD`).
   - Primary Gradient: Electric Blue → Violet → Pink (`bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#EC4899]`).
   - Glass: `rgba(8,13,36,0.75)` with `rgba(255,255,255,0.10)` borders.
   - Font family: `Geist` with negative letter-spacing on titles and wide letter-spacing on labels.
   - Icons: `Material Symbols Outlined`.
2. **Preserve Natural Page Scrolling**:
   - Never use `height: 100vh` or `overflow: hidden` on root page wrappers.
   - Keep page scrolling fluid and natural.
3. **Preserve Backend Telemetry**:
   - Every UI interaction must be wired to existing backend APIs (`/api/v1/...`) and WebSocket brokers (`/ws/watch-spaces/{id}`).
   - Do not replace real APIs with static mock data.
