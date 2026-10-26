package com.netflix.ai.watchspaces.repository;

import com.netflix.ai.watchspaces.entity.Title;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TitleRepository extends JpaRepository<Title, UUID> {

    /**
     * Returns titles ranked by cosine similarity to the given embedding vector string.
     * Uses pgvector's cosine distance operator (<=>).
     * Excludes titles the user has already watched and limits to the top N candidates.
     */
    @Query(value = "SELECT t.* " +
                   "FROM titles t " +
                   "WHERE t.id NOT IN (:excludeIds) " +
                   "AND t.embedding IS NOT NULL " +
                   "ORDER BY t.embedding <=> CAST(:embedding AS vector) " +
                   "LIMIT :limit", nativeQuery = true)
    List<Title> findSimilarTitles(@Param("embedding") String embedding,
                                  @Param("excludeIds") List<UUID> excludeIds,
                                  @Param("limit") int limit);

    /**
     * Returns titles ranked by cosine similarity to a source title's embedding.
     * Uses a subquery to retrieve the source title's embedding vector.
     * Excludes the source title and any already-watched titles.
     */
    @Query(value = "SELECT t.* " +
                   "FROM titles t " +
                   "WHERE t.id NOT IN (:excludeIds) " +
                   "AND t.id != :sourceTitleId " +
                   "AND t.embedding IS NOT NULL " +
                   "AND (SELECT s.embedding FROM titles s WHERE s.id = :sourceTitleId) IS NOT NULL " +
                   "ORDER BY t.embedding <=> (SELECT s.embedding FROM titles s WHERE s.id = :sourceTitleId) " +
                   "LIMIT :limit", nativeQuery = true)
    List<Title> findSimilarByTitleId(@Param("sourceTitleId") UUID sourceTitleId,
                                     @Param("excludeIds") List<UUID> excludeIds,
                                     @Param("limit") int limit);

    /**
     * Updates a title's embedding column with the given vector string.
     */
    @Modifying
    @Query(value = "UPDATE titles SET embedding = CAST(:embedding AS vector) WHERE id = :id", nativeQuery = true)
    void updateEmbedding(@Param("id") UUID id, @Param("embedding") String embedding);
}
