package com.netflix.ai.watchspaces.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/** Wire contracts for server-authoritative narrative decisions and prediction games. */
public final class NarrativeDtos {
    private NarrativeDtos() {
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChoiceDto {
        private String id;
        private String label;
        private String assetRef;
        private String nextVariationId;
        private Integer segmentStartSeconds;
        private Integer segmentEndSeconds;
        private Integer resumeSeconds;
        private Integer voteCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CardDto {
        private String eventId;
        private String variationId;
        private String prompt;
        private String kind;
        private Integer ts;
        private List<ChoiceDto> options;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoundDto {
        private String eventId;
        private String variationId;
        private String prompt;
        private String kind;
        private Integer ts;
        private List<ChoiceDto> options;
        private Long closesAt;
        private Long resolvesAt;
        private String myOptionId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PredictionGameDto {
        private List<CardDto> available;
        private RoundDto active;
        private List<PredictionResultDto> completed;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DecisionDto {
        private String id;
        private String eventId;
        private String variationId;
        private String prompt;
        private String optionId;
        private String label;
        private String assetRef;
        private String nextVariationId;
        private Map<String, Integer> votes;
        private Long decidedAt;
        private Integer sequence;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SegmentDto {
        private String decisionId;
        private String url;
        private Integer startSeconds;
        private Integer endSeconds;
        private Integer resumeSeconds;
        private Long startedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreDto {
        private String userId;
        private String displayName;
        private Integer points;
        private Integer correct;
        private Integer answered;
        private Double accuracy;
        private List<String> badges;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PredictionResultDto {
        private String eventId;
        private String prompt;
        private String kind;
        private String correctOptionId;
        private String correctLabel;
        private Long resolvedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StateDto {
        private Long version;
        private List<CardDto> availableVotes;
        private List<CardDto> availablePredictions;
        private RoundDto activeVote;
        private RoundDto activePrediction;
        private List<DecisionDto> history;
        private List<PredictionResultDto> completedPredictions;
        private List<ScoreDto> leaderboard;
        private SegmentDto activeSegment;
        private Double baseResumeSeconds;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActionRequest {
        private String action;
        private String eventId;
        private String optionId;
        private String decisionId;
    }
}
