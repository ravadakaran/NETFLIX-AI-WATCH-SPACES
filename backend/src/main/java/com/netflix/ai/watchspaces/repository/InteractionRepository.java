package com.netflix.ai.watchspaces.repository;

import com.netflix.ai.watchspaces.entity.Interaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InteractionRepository extends JpaRepository<Interaction, UUID> {
    List<Interaction> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Interaction> findByUserIdAndTitleId(UUID userId, UUID titleId);
    List<Interaction> findByTitleId(UUID titleId);
}
