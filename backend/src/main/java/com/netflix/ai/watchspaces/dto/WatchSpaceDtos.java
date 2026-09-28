package com.netflix.ai.watchspaces.dto;

import com.netflix.ai.watchspaces.entity.WatchSpaceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class WatchSpaceDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateWatchSpaceRequest {
        @NotNull
        private UUID titleId;

        private Integer maxParticipants;
        private String aiVerbosity;
        private Boolean votingEnabled;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JoinSpaceRequest {
        @javax.validation.constraints.NotBlank(message = "Invite code is required")
        private String inviteCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WatchSpaceDto {
        private UUID watchSpaceId;
        private UUID titleId;
        private String titleName;
        private String videoAssetUrl;
        private Integer durationSeconds;
        private String inviteCode;
        private WatchSpaceStatus status;
        private UUID hostUserId;
        private String hostDisplayName;
        private Integer maxParticipants;
        private Integer activeParticipantsCount;
        private String aiVerbosity;
        private Boolean votingEnabled;
        private String playbackState;
        private Double positionSeconds;
        private Boolean isLocked;
        private Instant createdAt;
        private Instant endedAt;
        private List<ParticipantDto> participants;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantDto {
        private UUID userId;
        private String displayName;
        private String email;
        private Instant joinedAt;
        private boolean isHost;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnalyticsDto {
        private UUID watchSpaceId;
        private long sessionDurationSeconds;
        private int peakParticipants;
        private int currentParticipants;
        private int aiQuestionsCount;
        private int triviaCardsSurfacedCount;
        private int chatMessagesCount;
        private int variationVotesCount;
    }
}
