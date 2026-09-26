# Timeline Metadata Schema

## Purpose

The timeline is the source of truth for scene-aware AI features. It
contains timestamp-keyed events authored for each sample title.

## Example

``` json
{
  "titleId": "t_1001",
  "version": "1.0",
  "events": [
    {
      "ts": 812,
      "type": "trivia",
      "payload": {
        "text": "This scene was filmed on location."
      }
    },
    {
      "ts": 940,
      "type": "character",
      "payload": {
        "characterId": "c_02",
        "name": "Detective Rios",
        "description": "Former partner of the victim."
      }
    },
    {
      "ts": 1100,
      "type": "glossary",
      "payload": {
        "term": "Example Term",
        "definition": "Example definition."
      }
    },
    {
      "ts": 1500,
      "type": "variation_point",
      "payload": {
        "variationId": "v_01",
        "options": [
          {
            "id": "a",
            "label": "Original line",
            "assetRef": "subtitle-original"
          },
          {
            "id": "b",
            "label": "Alternate localized line",
            "assetRef": "subtitle-alt"
          }
        ]
      }
    }
  ]
}
```

## Event Types

### trivia

Used to surface contextual facts at authored timestamps.

### character

Identifies character appearances or character context.

### glossary

Provides definitions for terms used in the title.

### variation_point

Defines a pre-approved moment with multiple approved options.

## Validation Rules

-   `titleId` is required.
-   `version` is required.
-   `events` must be an array.
-   Every event requires `ts`.
-   `ts` must be within the title duration.
-   `type` must be one of the supported event types.
-   `variation_point` requires at least two approved options.
-   Malformed metadata must be rejected with a clear validation error.

## Retrieval

The application should support timestamp-range retrieval:

``` text
GET /api/v1/titles/{titleId}/timeline?from=800&to=1000
```

This is used by the AI Content Engine and trivia scheduler.
