package com.netflix.ai.watchspaces.repository;

import com.netflix.ai.watchspaces.entity.NarrativeRound;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NarrativeRoundRepository extends JpaRepository<NarrativeRound, UUID> {
    Optional<NarrativeRound> findByWatchSpaceIdAndEventId(UUID watchSpaceId, UUID eventId);
    List<NarrativeRound> findByWatchSpaceIdOrderByOpenedAtAsc(UUID watchSpaceId);
    List<NarrativeRound> findByWatchSpaceIdAndStatus(UUID watchSpaceId, String status);
}
