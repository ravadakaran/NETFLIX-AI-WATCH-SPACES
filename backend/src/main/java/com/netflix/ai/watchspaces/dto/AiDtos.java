package com.netflix.ai.watchspaces.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class AiDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiQuestionRequest {
        private UUID userId;

        @NotNull
        private Double currentTs;

        @NotBlank
        private String question;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiAnswerResponse {
        private String answer;
        private List<String> sourceEvents;
        private Instant generatedAt;
        private Long latencyMs;
    }
}
