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
@Table(name = "titles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Title {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds;

    @Column(name = "video_asset_url", nullable = false)
    private String videoAssetUrl;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "genre")
    private String genre;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
