# Netflix AI Watch Spaces

## Project Overview

Netflix AI Watch Spaces is a full-stack, real-time social streaming
platform that combines synchronized group playback, real-time chat and
presence, a retrieval-grounded AI Co-Pilot, contextual trivia,
pre-approved content variations, voting, personalized recommendations,
and session analytics.

The project is designed as a single-engineer, four-week implementation.
It is a private/self-hosted engineering project and does not integrate
with Netflix infrastructure, accounts, catalog, or user data.

## Selected Technology Stack

This implementation uses **Option A --- Java Full-Stack** from the
project specification:

-   Frontend: React
-   Backend: Spring Boot
-   Real-time: Spring WebFlux reactive WebSockets
-   Database: PostgreSQL
-   ORM/Data Access: JPA/Hibernate
-   Authentication: Spring Security + JWT
-   Language: Java
-   Supporting tools: Git, Postman, Docker/Docker Compose, JUnit/Mockito

## Core Capabilities

1.  User registration, login, JWT authentication, and role-based access
    control.
2.  Watch Space creation and invite-code based joining.
3.  Host-authoritative synchronized playback.
4.  Drift correction and reconnect/resynchronization.
5.  Real-time chat, presence, typing indicators, and reactions.
6.  Timeline-driven AI trivia and contextual information.
7.  Retrieval-grounded AI Co-Pilot Q&A with source timeline events.
8.  Pre-approved subtitle/localization variations.
9.  Pre-approved narrative-variation voting.
10. Personal dashboard, watch history, recommendations, and session
    analytics.
11. Admin-facing timeline metadata upload and validation.
12. Automated testing, performance measurement, security validation, and
    documentation.

## Primary Demo Flow

``` text
Register/Login
    ↓
Select Title
    ↓
Create Watch Space
    ↓
Share Invite Code
    ↓
Second Browser Joins
    ↓
Initial Time Sync
    ↓
Synchronized Playback
    ↓
Chat / Presence
    ↓
AI Question About Current Scene
    ↓
Grounded Answer + Source Events
    ↓
Trivia Trigger
    ↓
Localization / Variation Vote
    ↓
Session Ends
    ↓
History + Analytics + Recommendations
```

## Scope Boundaries

The project does not include:

-   Real Netflix infrastructure or account integration
-   Real Netflix catalog or user data
-   DRM or CDN video delivery
-   Public internet production deployment
-   Mobile native applications
-   Payment or subscription functionality
-   Training a language model from scratch
-   Live generative rewriting of video, audio, or narrative content

Sample videos and authored metadata timelines are used for
demonstration.

## Performance Targets

  Metric                       Target
  ---------------------------- -------------------------------------------------------
  API latency, P95             \< 200 ms for non-AI endpoints
  AI Co-Pilot latency, P95     \< 3 seconds
  Playback drift               \< 100 ms design target; \< 250 ms acceptable ceiling
  WebSocket fan-out            \< 500 ms for rooms at design capacity
  Designed room capacity       50 concurrent participants
  Room join success            \> 99% in local/staging test runs
  Trivia timing                Within 1 second for ≥95% of markers
  Recommendation Precision@5   ≥ 0.6 on generated evaluation data
  Trivia/context accuracy      ≥ 90% in manual QA

## Repository Structure

``` text
netflix-ai-watch-spaces/
├── backend/
├── frontend/
├── docs/
├── data/
├── tests/
├── docker-compose.yml
├── .env.example
└── README.md
```

See the other Markdown documents in this documentation pack for
architecture, database design, APIs, WebSocket events, AI design,
testing, and delivery planning.
