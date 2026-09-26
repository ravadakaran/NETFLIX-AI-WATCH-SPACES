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
    Optional<WatchSpace> findByInviteCode(String inviteCode);
    List<WatchSpace> findByHostUserIdOrderByCreatedAtDesc(UUID hostUserId);
    List<WatchSpace> findByStatusOrderByCreatedAtDesc(WatchSpaceStatus status);
}
