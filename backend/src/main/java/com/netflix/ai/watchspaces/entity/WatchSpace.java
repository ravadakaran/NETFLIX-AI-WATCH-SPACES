package com.netflix.ai.watchspaces.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "watch_spaces", indexes = {
    @Index(name = "idx_watch_spaces_title_status", columnList = "title_id, status"),
    @Index(name = "idx_watch_spaces_invite_code", columnList = "invite_code")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WatchSpace {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "title_id", nullable = false)
    private Title title;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "host_user_id", nullable = false)
    private User hostUser;

    @Column(name = "invite_code", unique = true, nullable = false)
    private String inviteCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private WatchSpaceStatus status;

    @Column(name = "max_participants", nullable = false)
    @Builder.Default
    private Integer maxParticipants = 25;

    @Column(name = "ai_verbosity")
    @Builder.Default
    private String aiVerbosity = "normal";

    @Column(name = "voting_enabled", nullable = false)
    @Builder.Default
    private Boolean votingEnabled = true;

    @Column(name = "playback_state")
    @Builder.Default
    private String playbackState = "pause";

    @Column(name = "position_seconds")
    @Builder.Default
    private Double positionSeconds = 0.0;

    @Column(name = "is_locked", nullable = false)
    @Builder.Default
    private Boolean isLocked = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = WatchSpaceStatus.SCHEDULED;
        }
        if (maxParticipants == null) {
            maxParticipants = 25;
        }
        if (aiVerbosity == null) {
            aiVerbosity = "normal";
        }
        if (votingEnabled == null) {
            votingEnabled = true;
        }
        if (playbackState == null) {
            playbackState = "pause";
        }
        if (positionSeconds == null) {
            positionSeconds = 0.0;
        }
        if (isLocked == null) {
            isLocked = false;
        }
    }
}
