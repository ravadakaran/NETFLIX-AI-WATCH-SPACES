package com.netflix.ai.watchspaces.repository;

import com.netflix.ai.watchspaces.entity.WatchSpace;
import com.netflix.ai.watchspaces.entity.WatchSpaceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}
