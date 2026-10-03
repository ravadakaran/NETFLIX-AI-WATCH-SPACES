package com.netflix.ai.watchspaces.repository;

import com.netflix.ai.watchspaces.entity.ScheduledSpace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ScheduledSpaceRepository extends JpaRepository<ScheduledSpace, UUID> {
    List<ScheduledSpace> findByHostUserId(UUID hostUserId);
    List<ScheduledSpace> findByScheduledStartTimeBetween(Instant start, Instant end);
}
