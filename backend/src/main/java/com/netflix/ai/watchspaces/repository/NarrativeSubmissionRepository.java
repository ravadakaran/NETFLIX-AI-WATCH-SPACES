package com.netflix.ai.watchspaces.repository;

import com.netflix.ai.watchspaces.entity.NarrativeSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NarrativeSubmissionRepository extends JpaRepository<NarrativeSubmission, UUID> {
    Optional<NarrativeSubmission> findByRoundIdAndUserId(UUID roundId, UUID userId);
    List<NarrativeSubmission> findByRoundWatchSpaceId(UUID watchSpaceId);
    List<NarrativeSubmission> findByRoundId(UUID roundId);
}
