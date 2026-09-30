# Project Skeleton & Architecture Connections

This document outlines the high-level file structure and connections of the **Netflix AI Watch Spaces** project. The project is split into a **Java/Spring Boot Backend** and a **React/TypeScript Frontend**, working together to deliver a real-time synchronized video-watching experience with AI copilot capabilities.

---

## 1. Backend Structure (Spring Boot)
Located in `backend/src/main/java/com/netflix/ai/watchspaces/`

### 1.1 `controller/` (REST APIs)
Handles HTTP requests from the frontend and delegates work to the services.
- `AiController.java`: Endpoints for AI Copilot queries.
- `AuthController.java`: Login and Registration (issues JWTs).
- `WatchSpaceController.java`: Creating, joining, and managing watch spaces.
- `TitleController.java`: Fetching movies/shows metadata.
- `StorageController.java`: Managing AWS S3 presigned URLs.
- `AdminTimelineController.java`: Endpoints for admins to manage interactive video timelines.
- `RecommendationController.java`: Movie recommendations for users.

### 1.2 `service/` (Business Logic)
Core application logic.
- `GeminiService.java`: Connects to Google's Gemini API for AI scene analysis.
- `AiCopilotService.java`: Orchestrates the AI experience, pairing current timestamp with timeline metadata.
- `WatchSpaceService.java`: State management for rooms and participants.
- `AuthService.java`: Handles user authentication and JWT validation.
- `TimelineService.java`: Manages the interactive markers on the video timeline.

### 1.3 `websocket/` (Real-time Sync)
- `WatchSpaceWebSocketHandler.java`: Manages raw WebSocket connections for live syncing (play, pause, seek, chat).
- `RoomSessionManager.java`: Keeps track of which users are in which rooms.

### 1.4 `security/` (Authentication)
- `JwtAuthenticationFilter.java`: Intercepts API requests to validate JWTs.
- `JwtTokenProvider.java`: Generates and parses JSON Web Tokens.

### 1.5 `repository/` & `entity/` (Database Layer)
- `entity/`: JPA entities representing database tables (`User`, `WatchSpace`, `Title`, `ChatMessage`, etc.).
- `repository/`: Spring Data JPA interfaces for database access.

---

## 2. Frontend Structure (React / Vite)
Located in `frontend/src/`

### 2.1 `components/` (UI Views)
The React components based on the Stitch design system mockups.
- `LandingPage.tsx`: The public facing marketing page.
- `SignInView.tsx` & `SignUpView.tsx`: Authentication flows.
- `HomeCinema.tsx`: The main user dashboard.
- `WatchRoom.tsx`: The core live theater component handling the video player, chat, and AI copilot.
- `Discover.tsx`: Browsing available titles.
- `MySpacesHub.tsx`: Viewing past and active watch spaces.
- `AdminTimelineView.tsx`: Admin dashboard for creating timeline events.

### 2.2 `services/` (Client Connection Layer)
This is where the frontend communicates with the backend.
- `api.ts`: An Axios client defining all REST API calls. Maps directly to the Backend `controller/` package.
- `websocket.ts`: The WebSocket client wrapper. Connects directly to the backend `WatchSpaceWebSocketHandler`.

---

## 3. Core Connections & Data Flow

1. **Authentication Flow:**
   - Frontend `SignInView.tsx` calls `api.login()`.
   - Backend `AuthController` processes this via `AuthService` and returns a JWT.
   - Frontend stores the JWT and attaches it to future requests in `api.ts`.

2. **Real-time Sync Flow:**
   - User opens `WatchRoom.tsx`.
   - Frontend establishes a WS connection via `websocket.ts`.
   - Backend `WatchSpaceWebSocketHandler` registers the user in `RoomSessionManager`.
   - When the host clicks "Pause", `websocket.ts` sends a `SYNC` event.
   - Backend broadcasts the `SYNC` event to all other clients in the room to pause their players.

3. **AI Copilot Flow:**
   - User types a question in the AI Chat in `WatchRoom.tsx`.
   - Frontend calls the AI API endpoint, including the `currentTs` (timestamp) of the video.
   - Backend `AiController` forwards to `AiCopilotService`.
   - `AiCopilotService` fetches the `TimelineEvent` metadata for that specific timestamp.
   - The question and the timeline metadata are passed to `GeminiService.java` to get a context-aware response from the LLM.

---

## 4. Documentation & Design
- `Documents/`: Contains comprehensive markdown files detailing the architecture (`ARCHITECTURE.md`), database (`DATABASE.md`), APIs (`API.md`), and implementation plan.
- `stitch_screens_nocturne/`: Raw HTML/CSS mockups from the Google Stitch design tool, serving as the source of truth for the UI/UX.
