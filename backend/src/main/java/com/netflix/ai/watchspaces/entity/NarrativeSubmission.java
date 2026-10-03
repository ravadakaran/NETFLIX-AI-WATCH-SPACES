package com.netflix.ai.watchspaces.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "narrative_submissions", indexes = {
        @Index(name = "idx_narrative_submission_round", columnList = "round_id"),
        @Index(name = "idx_narrative_submission_space_user", columnList = "watch_space_id, user_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_narrative_submission_round_user", columnNames = {"round_id", "user_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NarrativeSubmission {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "round_id", nullable = false)
    private NarrativeRound round;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "watch_space_id", nullable = false)
    private WatchSpace watchSpace;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "option_key", nullable = false)
    private String optionKey;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @Column(name = "points", nullable = false)
    @Builder.Default
    private Integer points = 0;

    @Column(name = "correct", nullable = false)
    @Builder.Default
    private Boolean correct = false;

    @PrePersist
    public void prePersist() {
        if (submittedAt == null) submittedAt = Instant.now();
        if (points == null) points = 0;
        if (correct == null) correct = false;
    }
}
