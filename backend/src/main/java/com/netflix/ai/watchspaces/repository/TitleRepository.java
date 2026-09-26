package com.netflix.ai.watchspaces.repository;

import com.netflix.ai.watchspaces.entity.Title;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TitleRepository extends JpaRepository<Title, UUID> {
}
