package com.netflix.ai.watchspaces.repository;

import com.netflix.ai.watchspaces.entity.NarrativeDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NarrativeDecisionRepository extends JpaRepository<NarrativeDecision, UUID> {
    List<NarrativeDecision> findByWatchSpaceIdOrderBySequenceNumberAsc(UUID watchSpaceId);
}
