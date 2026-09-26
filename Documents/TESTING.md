# Testing & Performance Plan --- Netflix AI Watch Spaces

## 1. Testing Goals

Automated tests must cover:

-   Playback state machine
-   AI retrieval logic
-   RBAC
-   Core API behavior
-   WebSocket behavior
-   Reconnect handling

## 2. Backend Tests

For Java:

``` text
JUnit
Mockito
Spring Boot Test
```

Test categories:

``` text
Unit Tests
Integration Tests
WebSocket Tests
Security Tests
```

## 3. Playback State Machine Tests

Test:

-   PLAY
-   PAUSE
-   SEEK
-   BUFFERING
-   Host authorization
-   Invalid state transitions
-   Participant synchronization
-   Host disconnect
-   Host transfer/pause behavior
-   Reconnect and resynchronization

## 4. AI Retrieval Tests

Test:

-   Timestamp-range retrieval
-   Correct title filtering
-   Current-scene retrieval
-   Preceding-context retrieval
-   Source event IDs
-   Missing metadata
-   Unsupported-question behavior
-   Trivia marker triggering

## 5. RBAC Tests

Minimum roles:

``` text
viewer
host
admin
```

Verify:

``` text
viewer → cannot update playback
viewer → cannot upload timeline
host   → can control playback
host   → can manage room
admin  → can manage title metadata
```

The authorization must be enforced server-side.

## 6. Security Tests

Verify:

-   Invalid JWT rejection
-   Expired JWT rejection
-   Refresh token flow
-   WebSocket authentication
-   Input validation
-   Chat sanitization
-   AI question validation
-   Timeline upload validation
-   Secrets not present in source control

## 7. Performance Measurements

Measure actual values for:

### API

Target:

``` text
P95 < 200 ms
```

### AI

Target:

``` text
P95 < 3 seconds
```

### Playback

Targets:

``` text
< 100 ms design target
< 250 ms acceptable ceiling
```

### WebSocket fan-out

Target:

``` text
< 500 ms
```

## 8. Sync Drift Test

Use two or more browser clients.

Procedure:

``` text
1. Start Host playback.
2. Join participant.
3. Record timestamps.
4. Trigger play.
5. Trigger pause.
6. Trigger seek.
7. Continue playback.
8. Record participant drift.
9. Repeat under different conditions.
```

Report:

``` text
Minimum drift
Maximum drift
Average drift
P95 drift
Number of corrections
```

## 9. Load Test

The architecture should support 50 participants per room by design.

Personal hardware does not need to load-test the full target. Smaller
honest tests such as 5--10 simulated clients are acceptable.

## 10. Test Evidence

Final submission should include:

-   Test command output
-   Pass/fail summary
-   Sync drift report
-   API latency report
-   AI latency report
-   RBAC rejection evidence
-   Multi-client demonstration
