# API Reference --- Netflix AI Watch Spaces

## Base URL

``` text
/api/v1
```

## Authentication

Authenticated REST endpoints require a valid JWT.

Example:

``` http
Authorization: Bearer <access-token>
```

Access tokens should be short-lived, with a refresh-token flow.

## 1. Authentication

### POST /auth/register

Registers a new user.

Example:

``` json
{
  "email": "user@example.com",
  "displayName": "Demo User",
  "password": "password"
}
```

### POST /auth/login

Authenticates the user and returns authentication tokens.

### POST /auth/refresh

Issues a new access token using a valid refresh token.

## 2. Titles

### GET /titles

Returns available titles.

### GET /titles/{titleId}

Returns title details.

### GET /titles/{titleId}/timeline?from={sec}&to={sec}

Returns timeline events within a timestamp range.

Example response:

``` json
{
  "titleId": "t_1001",
  "events": [
    {
      "ts": 812,
      "type": "trivia",
      "text": "This scene was filmed on location."
    },
    {
      "ts": 1500,
      "type": "variationPoint",
      "variationId": "v_01",
      "options": [
        {
          "id": "a",
          "label": "Original line"
        },
        {
          "id": "b",
          "label": "Alternate localized line"
        }
      ]
    }
  ]
}
```

## 3. Watch Spaces

### POST /watch-spaces

Creates a Watch Space.

Request:

``` json
{
  "titleId": "t_1001",
  "maxParticipants": 25,
  "aiVerbosity": "normal",
  "votingEnabled": true
}
```

Response:

``` json
{
  "watchSpaceId": "ws_88231",
  "inviteCode": "NX-4Q7K",
  "status": "scheduled",
  "hostUserId": "u_501",
  "createdAt": "2026-09-18T10:15:00Z"
}
```

### POST /watch-spaces/{id}/join

Joins a Watch Space using an invite code.

### GET /watch-spaces/{id}

Returns Watch Space state and settings.

### POST /watch-spaces/{id}/end

Ends the session. Host authorization is required.

## 4. AI Co-Pilot

### POST /watch-spaces/{id}/ai/ask

Request:

``` json
{
  "userId": "u_733",
  "currentTs": 1487,
  "question": "Who is the character that just walked in?"
}
```

Response:

``` json
{
  "answer": "That's Detective Rios, first introduced at 00:04:12. He's the victim's former partner.",
  "sourceEvents": [
    "evt_2291",
    "evt_2276"
  ],
  "generatedAt": "2026-09-18T10:24:47Z"
}
```

The answer must be grounded in metadata and identify the source timeline
entries.

## 5. Recommendations

### GET /users/me/recommendations

Returns a ranked recommendation rail.

### GET /users/me/history

Returns viewing history.

## 6. Analytics

### GET /watch-spaces/{id}/analytics

Returns:

-   Session duration
-   Peak participants
-   AI questions
-   Trivia cards surfaced
-   Chat activity

## 7. Admin Timeline Management

### POST /admin/titles/{titleId}/timeline

Uploads a validated timeline.

### POST /admin/titles/{titleId}/timeline/validate

Validates timeline structure without publishing it.

Admin authorization is enforced server-side.

## 8. Error Format

Use a consistent response structure:

``` json
{
  "timestamp": "2026-09-26T10:00:00Z",
  "status": 403,
  "error": "FORBIDDEN",
  "message": "Host role required",
  "path": "/api/v1/watch-spaces/ws_123/playback"
}
```
