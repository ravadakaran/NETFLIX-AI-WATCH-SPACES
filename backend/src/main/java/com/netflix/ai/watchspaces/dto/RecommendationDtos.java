package com.netflix.ai.watchspaces.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class RecommendationDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendationItemDto {
        private UUID titleId;
        private String title;
        private String genre;
        private String thumbnailUrl;
        private String description;
        private double score;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendationResponseDto {
        private List<RecommendationItemDto> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoryItemDto {
        private UUID id;
        private UUID titleId;
        private String titleName;
        private String thumbnailUrl;
        private Integer watchedSeconds;
        private Integer durationSeconds;
        private Boolean completed;
        private Short rating;
        private Instant watchedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecordInteractionRequest {
        @NotNull
        private UUID titleId;

        private Integer watchedSeconds;
        private Boolean completed;
        private Short rating;
    }
}
