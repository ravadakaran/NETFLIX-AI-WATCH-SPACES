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
@Table(name = "narrative_rounds", indexes = {
        @Index(name = "idx_narrative_round_space_status", columnList = "watch_space_id, status"),
        @Index(name = "idx_narrative_round_event", columnList = "watch_space_id, event_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_narrative_round_space_event", columnNames = {"watch_space_id", "event_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NarrativeRound {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "watch_space_id", nullable = false)
    private WatchSpace watchSpace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private TimelineEvent event;

    @Column(name = "kind", nullable = false)
    private String kind;

    @Column(name = "variation_id")
    private String variationId;

    @Column(name = "prompt", nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(name = "opened_at", nullable = false)
    private Instant openedAt;

    @Column(name = "closes_at", nullable = false)
    private Instant closesAt;

    @Column(name = "resolves_at", nullable = false)
    private Instant resolvesAt;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "correct_option_key")
    private String correctOptionKey;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @PrePersist
    public void prePersist() {
        if (openedAt == null) openedAt = Instant.now();
        if (status == null) status = "OPEN";
    }
}
