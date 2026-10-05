package com.netflix.ai.watchspaces.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public class TitleDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TitleSummaryDto {
        private UUID id;
        private String name;
        private Integer durationSeconds;
        private String videoAssetUrl;
        private String description;
        private String genre;
        private String thumbnailUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateTitleDto {
        @NotBlank
        private String name;
        @NotNull
        private Integer durationSeconds;
        @NotBlank
        private String videoAssetUrl;
        @NotBlank
        private String description;
        private String genre;
        private String thumbnailUrl;
    }


    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariationOptionDto {
        private UUID id;
        private String optionKey;
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
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TimelineEventDto {
        private UUID id;
        private Integer ts;
        private String type;
        private String text;
        private String characterId;
        private String term;
        private String definition;
        private String variationId;
        private Object payload;
        private List<VariationOptionDto> options;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineResponseDto {
        private UUID titleId;
        private List<TimelineEventDto> events;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineUploadDto {
        @NotBlank
        private String titleId;

        @NotBlank
        private String version;

        @NotEmpty
        private List<UploadEventItemDto> events;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UploadEventItemDto {
        @NotNull
        private Integer ts;

        @NotBlank
        private String type;

        private Object payload;
        private List<VariationOptionUploadDto> options;
    }

    @Data
    @NoArgsConstructor
    public static class VariationOptionUploadDto {
        private String id;
        private String label;
        private String assetRef;
        private String nextVariationId;
        private Integer segmentStartSeconds;
        private Integer segmentEndSeconds;
        private Integer resumeSeconds;

        public VariationOptionUploadDto(String id, String label, String assetRef) {
            this.id = id;
            this.label = label;
            this.assetRef = assetRef;
        }

        public VariationOptionUploadDto(String id, String label, String assetRef,
                                        String nextVariationId, Integer segmentStartSeconds,
                                        Integer segmentEndSeconds, Integer resumeSeconds) {
            this.id = id;
            this.label = label;
            this.assetRef = assetRef;
            this.nextVariationId = nextVariationId;
            this.segmentStartSeconds = segmentStartSeconds;
            this.segmentEndSeconds = segmentEndSeconds;
            this.resumeSeconds = resumeSeconds;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidationResultDto {
        private boolean valid;
        private int totalEvents;
        private List<String> errors;
        private List<String> warnings;
    }
}
