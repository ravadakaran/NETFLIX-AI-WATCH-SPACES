package com.netflix.ai.watchspaces.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "variation_options")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariationOption {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "timeline_event_id", nullable = false)
    @JsonIgnore
    private TimelineEvent timelineEvent;

    @Column(name = "label", nullable = false)
    private String label;

    @Column(name = "asset_ref")
    private String assetRef;

    @Column(name = "vote_count", nullable = false)
    @Builder.Default
    private Integer voteCount = 0;
}
