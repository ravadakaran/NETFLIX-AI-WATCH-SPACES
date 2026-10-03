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
@Table(name = "narrative_decisions", indexes = {
        @Index(name = "idx_narrative_decision_space_sequence", columnList = "watch_space_id, sequence_number")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NarrativeDecision {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "watch_space_id", nullable = false)
    private WatchSpace watchSpace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "round_id", nullable = false)
    private NarrativeRound round;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "variation_id")
    private String variationId;

    @Column(name = "prompt", nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(name = "option_key", nullable = false)
    private String optionKey;

    @Column(name = "label", nullable = false)
    private String label;

    @Column(name = "asset_ref")
    private String assetRef;

    @Column(name = "next_variation_id")
    private String nextVariationId;

    @Column(name = "votes_json", columnDefinition = "TEXT", nullable = false)
    private String votesJson;

    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;

    @Column(name = "decided_at", nullable = false)
    private Instant decidedAt;

    @PrePersist
    public void prePersist() {
        if (decidedAt == null) decidedAt = Instant.now();
        if (sequenceNumber == null) sequenceNumber = 1;
        if (votesJson == null) votesJson = "{}";
    }
}
