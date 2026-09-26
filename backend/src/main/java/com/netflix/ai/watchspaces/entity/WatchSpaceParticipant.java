package com.netflix.ai.watchspaces.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "watch_space_participants", indexes = {
    @Index(name = "idx_participants_space", columnList = "watch_space_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WatchSpaceParticipant {

    @EmbeddedId
    private WatchSpaceParticipantId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("watchSpaceId")
    @JoinColumn(name = "watch_space_id")
    private WatchSpace watchSpace;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    @PrePersist
    public void prePersist() {
        if (joinedAt == null) {
            joinedAt = Instant.now();
        }
    }
}
