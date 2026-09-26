# AI Content Engine --- Netflix AI Watch Spaces

## 1. Purpose

The AI Content Engine knows the current position in the title and
provides:

-   Timeline-grounded Q&A
-   Timeline-triggered trivia
-   Contextual information
-   Pre-approved localization variations
-   Pre-approved narrative variation evaluation

The engine is not an unconstrained chatbot.

## 2. Timeline Data

Each title has an authored timeline containing timestamp-keyed events.

Example:

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
      "ts": 940,
      "type": "character",
      "characterId": "c_02",
      "payload": {
        "name": "Detective Rios",
        "description": "Former partner of the victim."
      }
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

## 3. Context Retrieval

For a question at timestamp `T`:

``` text
Question
   ↓
Current timestamp
   ↓
Retrieve timeline entries around T
   ↓
Include relevant preceding entries
   ↓
Build grounded context
   ↓
LLM
   ↓
Answer + sourceEvents
```

The retrieval layer must return the actual metadata entries used to
generate the answer.

## 4. Grounded Answer Rules

The AI response must:

1.  Use retrieved title metadata.
2.  Identify source timeline events.
3.  Avoid inventing facts absent from the ingested metadata.
4.  Respond gracefully when relevant metadata is unavailable.
5.  Remain scoped to the selected title.

## 5. Trivia Scheduler

Playback events are compared against authored markers.

``` text
Current timestamp
       ↓
Has a marker been crossed?
       ↓
Yes
       ↓
Load trivia/context event
       ↓
Send room.ai.trivia
```

Trivia can be enabled or disabled by the Host.

## 6. Variation Evaluation

Variations are pre-authored and pre-approved.

The AI does not generate new plot content or rewrite video/audio at
watch time.

Examples:

``` text
Alternate subtitle phrasing
Regional asset
Minor approved narrative branch
```

The system selects only from stored options.

## 7. Q&A API Flow

``` text
Participant
    ↓
POST /watch-spaces/{id}/ai/ask
    ↓
Validate JWT + room membership
    ↓
Read current timestamp
    ↓
Retrieve timeline metadata
    ↓
Construct grounded prompt/context
    ↓
LLM
    ↓
Validate source events
    ↓
Persist AI message
    ↓
Broadcast room.ai.answer
```

## 8. AI Performance Target

Target:

``` text
P95 response latency < 3 seconds
```

The final report must contain actual measurements rather than estimates.

## 9. AI Tests

Minimum tests should cover:

-   Relevant timeline retrieval
-   Timestamp-range retrieval
-   Grounded answer generation
-   Source event inclusion
-   No-context behavior
-   Prevention of unsupported facts
-   Trivia marker triggering
-   Variation eligibility
