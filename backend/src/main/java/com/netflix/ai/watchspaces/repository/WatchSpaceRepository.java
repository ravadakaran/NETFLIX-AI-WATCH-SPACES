package com.netflix.ai.watchspaces.repository;

import com.netflix.ai.watchspaces.entity.WatchSpace;
import com.netflix.ai.watchspaces.entity.WatchSpaceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import javax.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WatchSpaceRepository extends JpaRepository<WatchSpace, UUID> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"title", "hostUser"})
    Optional<WatchSpace> findByInviteCode(String inviteCode);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"title", "hostUser"})
    List<WatchSpace> findByHostUserIdOrderByCreatedAtDesc(UUID hostUserId);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"title", "hostUser"})
    List<WatchSpace> findByStatusOrderByCreatedAtDesc(WatchSpaceStatus status);

    /**
     * Serializes mutations for one room at the database boundary. Unlike a
     * synchronized service method, this lock works across application nodes
     * and never blocks unrelated watch spaces.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"title", "hostUser"})
    @Query("select ws from WatchSpace ws where ws.id = :id")
    Optional<WatchSpace> findByIdForNarrativeUpdate(@Param("id") UUID id);
}
