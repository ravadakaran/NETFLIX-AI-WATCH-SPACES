package com.netflix.ai.watchspaces.repository;

import com.netflix.ai.watchspaces.entity.WatchSpaceParticipant;
import com.netflix.ai.watchspaces.entity.WatchSpaceParticipantId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WatchSpaceParticipantRepository extends JpaRepository<WatchSpaceParticipant, WatchSpaceParticipantId> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"user"})
    List<WatchSpaceParticipant> findByIdWatchSpaceId(UUID watchSpaceId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"user"})
    List<WatchSpaceParticipant> findByIdWatchSpaceIdAndLeftAtIsNull(UUID watchSpaceId);

    long countByIdWatchSpaceIdAndLeftAtIsNull(UUID watchSpaceId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"watchSpace", "watchSpace.title", "watchSpace.hostUser"})
    List<WatchSpaceParticipant> findByIdUserIdOrderByJoinedAtDesc(UUID userId);

    Optional<WatchSpaceParticipant> findByIdWatchSpaceIdAndIdUserId(UUID watchSpaceId, UUID userId);
}
