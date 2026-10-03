package com.netflix.ai.watchspaces.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "variation_options")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariationOption {

    @PrePersist
    public void prePersist() {
        if (optionKey == null || optionKey.trim().isEmpty()) {
            optionKey = "option-" + UUID.randomUUID();
        }
        if (voteCount == null) {
            voteCount = 0;
        }
    }

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "timeline_event_id", nullable = false)
    @JsonIgnore
    private TimelineEvent timelineEvent;

    @Column(name = "option_key")
    private String optionKey;

    @Column(name = "option_order")
    private Integer optionOrder;

    @Column(name = "label", nullable = false)
    private String label;

    @Column(name = "asset_ref")
    private String assetRef;

    @Column(name = "next_variation_id")
    private String nextVariationId;

    @Column(name = "segment_start_seconds")
    private Integer segmentStartSeconds;

    @Column(name = "segment_end_seconds")
    private Integer segmentEndSeconds;

    @Column(name = "resume_seconds")
    private Integer resumeSeconds;

    @Column(name = "vote_count", nullable = false)
    @Builder.Default
    private Integer voteCount = 0;
}
