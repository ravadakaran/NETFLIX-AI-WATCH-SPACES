package com.netflix.ai.watchspaces.repository;

import com.netflix.ai.watchspaces.entity.TimelineEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TimelineEventRepository extends JpaRepository<TimelineEvent, UUID> {

    List<TimelineEvent> findByTitleIdOrderByTsSecondsAsc(UUID titleId);

    List<TimelineEvent> findByTitleIdAndTsSecondsBetweenOrderByTsSecondsAsc(UUID titleId, Integer from, Integer to);

    List<TimelineEvent> findByTitleIdAndTsSecondsLessThanEqualOrderByTsSecondsAsc(UUID titleId, Integer ts);

    @Query("SELECT e FROM TimelineEvent e LEFT JOIN FETCH e.variationOptions WHERE e.title.id = :titleId ORDER BY e.tsSeconds ASC")
    List<TimelineEvent> findAllWithVariationOptionsByTitleId(@Param("titleId") UUID titleId);

    void deleteByTitleId(UUID titleId);

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = "UPDATE timeline_events SET embedding = CAST(:embedding AS vector) WHERE id = :id", nativeQuery = true)
    void updateEmbedding(@Param("id") UUID id, @Param("embedding") String embeddingArray);

    @Query(value = "SELECT * FROM timeline_events WHERE title_id = :titleId AND ts_seconds <= :ts " +
                   "ORDER BY embedding <=> CAST(:embedding AS vector) LIMIT :limit", nativeQuery = true)
    List<TimelineEvent> findSimilarEvents(@Param("titleId") UUID titleId, @Param("ts") Integer ts, 
                                          @Param("embedding") String embeddingArray, @Param("limit") int limit);
}
