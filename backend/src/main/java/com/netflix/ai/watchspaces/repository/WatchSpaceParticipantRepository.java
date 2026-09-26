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

    List<WatchSpaceParticipant> findByIdWatchSpaceId(UUID watchSpaceId);

    List<WatchSpaceParticipant> findByIdWatchSpaceIdAndLeftAtIsNull(UUID watchSpaceId);

    long countByIdWatchSpaceIdAndLeftAtIsNull(UUID watchSpaceId);

    List<WatchSpaceParticipant> findByIdUserIdOrderByJoinedAtDesc(UUID userId);

    Optional<WatchSpaceParticipant> findByIdWatchSpaceIdAndIdUserId(UUID watchSpaceId, UUID userId);
}
