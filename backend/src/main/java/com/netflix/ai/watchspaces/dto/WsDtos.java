package com.netflix.ai.watchspaces.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class WsDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WsEnvelope {
        private String event;
        private String watchSpaceId;
        private Object payload;
        private Long ts;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlaybackPayload {
        private String state; // play, pause, seek
        private Double positionSeconds;
        private String issuedBy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PresencePayload {
        private String participantId;
        private String displayName;
        private String action; // joined, left
        private Integer participantCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatPayload {
        private String messageId;
        private String userId;
        private String displayName;
        private String body;
        private Double tsSeconds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TriviaPayload {
        private String eventId;
        private String text;
        private Integer tsSeconds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoteOpenPayload {
        private String variationId;
        private String eventId;
        private String prompt;
        private List<VoteOptionItem> options;
        private Long closesAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoteOptionItem {
        private String id;
        private String label;
        private String assetRef;
        private Integer count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoteCastPayload {
        private String variationId;
        private String optionId;
        private String userId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoteAppliedPayload {
        private String variationId;
        private String winningOptionId;
        private String label;
        private String assetRef;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SyncPingPayload {
        private Long clientSentAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SyncPongPayload {
        private Long clientSentAt;
        private Long serverReceivedAt;
    }
}
