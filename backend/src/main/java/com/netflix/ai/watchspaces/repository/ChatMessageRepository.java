package com.netflix.ai.watchspaces.repository;

import com.netflix.ai.watchspaces.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findByWatchSpaceIdOrderByCreatedAtAsc(UUID watchSpaceId);
    List<ChatMessage> findTop50ByWatchSpaceIdOrderByCreatedAtDesc(UUID watchSpaceId);
}
