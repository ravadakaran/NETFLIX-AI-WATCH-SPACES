package com.netflix.ai.watchspaces.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class WatchSpaceParticipantId implements Serializable {

    @Column(name = "watch_space_id")
    private UUID watchSpaceId;

    @Column(name = "user_id")
    private UUID userId;
}
