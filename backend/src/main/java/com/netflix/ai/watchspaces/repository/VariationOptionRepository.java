package com.netflix.ai.watchspaces.repository;

import com.netflix.ai.watchspaces.entity.VariationOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VariationOptionRepository extends JpaRepository<VariationOption, UUID> {
    List<VariationOption> findByTimelineEventId(UUID timelineEventId);
}
