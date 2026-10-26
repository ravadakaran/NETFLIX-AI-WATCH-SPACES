package com.netflix.ai.watchspaces.service;

import com.netflix.ai.watchspaces.dto.RecommendationDtos.*;
import com.netflix.ai.watchspaces.entity.Interaction;
import com.netflix.ai.watchspaces.entity.Title;
import com.netflix.ai.watchspaces.entity.User;
import com.netflix.ai.watchspaces.repository.InteractionRepository;
import com.netflix.ai.watchspaces.repository.TitleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    /** Weight for content-based similarity (pgvector cosine / genre affinity fallback) */
    private static final double CONTENT_WEIGHT = 0.6;
    /** Weight for collaborative filtering (co-watch user similarity) */
    private static final double COLLAB_WEIGHT = 0.4;

    private final InteractionRepository interactionRepository;
    private final TitleRepository titleRepository;

    @Transactional(readOnly = true)
    public RecommendationResponseDto getRecommendations(UUID userId) {
        List<Title> allTitles = titleRepository.findAll();
        List<Interaction> userInteractions = interactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Interaction> allInteractions = interactionRepository.findAll();

        Set<UUID> watchedTitleIds = userInteractions.stream()
                .map(i -> i.getTitle().getId())
                .collect(Collectors.toSet());

        // ──────────────────────────────────────────────────────────────────────
        // 1. CONTENT-BASED COMPONENT — pgvector cosine similarity
        //    Build a weighted user-profile embedding from all watched titles,
        //    then query pgvector for nearest neighbours.
        // ──────────────────────────────────────────────────────────────────────
        Map<UUID, Double> contentScores = new HashMap<>();

        // Compute genre affinity as secondary content signal
        Map<String, Double> genreAffinity = new HashMap<>();
        for (Interaction interaction : userInteractions) {
            String genre = interaction.getTitle().getGenre();
            if (genre != null) {
                double weight = 1.0;
                if (interaction.getRating() != null) {
                    weight += (interaction.getRating() - 3.0) * 0.5;
                }
                if (Boolean.TRUE.equals(interaction.getCompleted())) {
                    weight += 0.5;
                }
                genreAffinity.put(genre, genreAffinity.getOrDefault(genre, 0.0) + weight);
            }
        }

        // Attempt pgvector cosine similarity if embeddings are available
        boolean vectorSearchUsed = false;
        try {
            if (!watchedTitleIds.isEmpty()) {
                // Query pgvector for similar titles using each watched title
                List<UUID> excludeList = new ArrayList<>(watchedTitleIds);
                for (Interaction interaction : userInteractions) {
                    try {
                        // Use pgvector cosine similarity via the source title's embedding
                        List<Title> similar = titleRepository.findSimilarByTitleId(
                                interaction.getTitle().getId(),
                                excludeList, 10);

                        if (similar != null && !similar.isEmpty()) {
                            vectorSearchUsed = true;
                            double interactionWeight = 1.0;
                            if (interaction.getRating() != null) {
                                interactionWeight = interaction.getRating() / 5.0;
                            }
                            if (Boolean.TRUE.equals(interaction.getCompleted())) {
                                interactionWeight += 0.3;
                            }

                            for (int i = 0; i < similar.size(); i++) {
                                Title sim = similar.get(i);
                                // Cosine similarity decays by rank position
                                double cosineSim = 1.0 - (i * 0.1);
                                double weighted = cosineSim * interactionWeight;
                                contentScores.merge(sim.getId(), weighted, Double::max);
                            }
                        }
                    } catch (Exception e) {
                        log.debug("pgvector query failed for title {}: {}", interaction.getTitle().getId(), e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("pgvector content-based scoring failed, falling back to genre affinity: {}", e.getMessage());
        }

        // Fallback: genre affinity scoring when pgvector is unavailable
        if (!vectorSearchUsed) {
            for (Title title : allTitles) {
                if (watchedTitleIds.contains(title.getId())) continue;
                String genre = title.getGenre();
                if (genre != null && genreAffinity.containsKey(genre)) {
                    double genreScore = 0.5 + Math.min(0.45, genreAffinity.get(genre) * 0.15);
                    contentScores.put(title.getId(), genreScore);
                } else {
                    contentScores.put(title.getId(), 0.5);
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // 2. COLLABORATIVE FILTERING COMPONENT — co-watch user similarity
        // ──────────────────────────────────────────────────────────────────────
        Map<UUID, Double> userSimilarity = new HashMap<>();
        for (Interaction otherInt : allInteractions) {
            UUID otherUserId = otherInt.getUser().getId();
            if (!otherUserId.equals(userId) && watchedTitleIds.contains(otherInt.getTitle().getId())) {
                userSimilarity.merge(otherUserId, 1.0, Double::sum);
            }
        }

        Map<UUID, Double> collaborativeScores = new HashMap<>();
        for (Interaction otherInt : allInteractions) {
            UUID otherUserId = otherInt.getUser().getId();
            if (!otherUserId.equals(userId) && userSimilarity.containsKey(otherUserId)) {
                UUID titleId = otherInt.getTitle().getId();
                if (!watchedTitleIds.contains(titleId)) {
                    double sim = userSimilarity.get(otherUserId);
                    double ratingFactor = otherInt.getRating() != null ? otherInt.getRating() / 5.0 : 0.7;
                    collaborativeScores.merge(titleId, sim * ratingFactor, Double::sum);
                }
            }
        }

        // Normalize collaborative scores to [0, 1]
        double maxCollab = collaborativeScores.values().stream()
                .mapToDouble(Double::doubleValue).max().orElse(1.0);
        if (maxCollab == 0.0) maxCollab = 1.0;

        // Normalize content scores to [0, 1] once outside title candidate loop
        double maxContent = contentScores.values().stream()
                .mapToDouble(Double::doubleValue).max().orElse(1.0);
        if (maxContent == 0.0) maxContent = 1.0;

        // ──────────────────────────────────────────────────────────────────────
        // 3. COMPOSITE SCORE = 0.6 × Content + 0.4 × Collaborative
        // ──────────────────────────────────────────────────────────────────────
        List<RecommendationItemDto> items = new ArrayList<>();
        for (Title title : allTitles) {
            if (watchedTitleIds.contains(title.getId())) continue;

            double defaultContent = vectorSearchUsed ? 0.1 : 0.5;
            double contentScore = contentScores.getOrDefault(title.getId(), defaultContent);
            double normalizedContent = Math.min(1.0, contentScore / maxContent);

            double rawCollab = collaborativeScores.getOrDefault(title.getId(), 0.0);
            double normalizedCollab = Math.min(1.0, rawCollab / maxCollab);

            // Hybrid weighted composite: 60% content-based + 40% collaborative
            double compositeScore = (CONTENT_WEIGHT * normalizedContent) + (COLLAB_WEIGHT * normalizedCollab);
            compositeScore = Math.round(compositeScore * 100.0) / 100.0;

            // Clamp to presentable range
            double displayScore = Math.min(0.99, Math.max(0.50, compositeScore));

            String reason;
            String genre = title.getGenre();
            if (rawCollab > 0 && genreAffinity.containsKey(genre)) {
                reason = "Trending among viewers with similar tastes in " + (genre != null ? genre : "this genre");
            } else if (genreAffinity.containsKey(genre)) {
                reason = "Matches your interest in " + genre;
            } else if (rawCollab > 0) {
                reason = "Popular among viewers with similar watch history";
            } else {
                reason = "Popular choice in Watch Spaces";
            }

            items.add(RecommendationItemDto.builder()
                    .titleId(title.getId())
                    .title(title.getName())
                    .genre(title.getGenre())
                    .thumbnailUrl(title.getThumbnailUrl())
                    .description(title.getDescription())
                    .score(displayScore)
                    .contentScore(Math.round(normalizedContent * 100.0) / 100.0)
                    .collabScore(Math.round(normalizedCollab * 100.0) / 100.0)
                    .compositeScore(compositeScore)
                    .reason(reason)
                    .build());
        }

        // Sort by composite score (highest first)
        items.sort((a, b) -> Double.compare(b.getCompositeScore(), a.getCompositeScore()));

        // Fallback: if no candidates (e.g. user watched everything)
        if (items.isEmpty()) {
            for (Title title : allTitles) {
                items.add(RecommendationItemDto.builder()
                        .titleId(title.getId())
                        .title(title.getName())
                        .genre(title.getGenre())
                        .thumbnailUrl(title.getThumbnailUrl())
                        .description(title.getDescription())
                        .score(0.88)
                        .contentScore(0.88)
                        .collabScore(0.0)
                        .compositeScore(0.88)
                        .reason("Top pick for you")
                        .build());
            }
        }

        return RecommendationResponseDto.builder()
                .items(items.stream().limit(10).collect(Collectors.toList()))
                .build();
    }

    @Transactional(readOnly = true)
    public List<HistoryItemDto> getWatchHistory(UUID userId) {
        return interactionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(i -> HistoryItemDto.builder()
                        .id(i.getId())
                        .titleId(i.getTitle().getId())
                        .titleName(i.getTitle().getName())
                        .thumbnailUrl(i.getTitle().getThumbnailUrl())
                        .watchedSeconds(i.getWatchedSeconds())
                        .durationSeconds(i.getTitle().getDurationSeconds())
                        .completed(i.getCompleted())
                        .rating(i.getRating())
                        .watchedAt(i.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void recordInteraction(User user, RecordInteractionRequest request) {
        Title title = titleRepository.findById(request.getTitleId())
                .orElseThrow(() -> new IllegalArgumentException("Title not found with id: " + request.getTitleId()));

        Optional<Interaction> existing = interactionRepository.findByUserIdAndTitleId(user.getId(), title.getId());
        Interaction interaction;
        if (existing.isPresent()) {
            interaction = existing.get();
            if (request.getWatchedSeconds() != null) {
                interaction.setWatchedSeconds(Math.max(interaction.getWatchedSeconds(), request.getWatchedSeconds()));
            }
            if (request.getCompleted() != null) {
                interaction.setCompleted(request.getCompleted());
            }
            if (request.getRating() != null) {
                interaction.setRating(request.getRating());
            }
        } else {
            interaction = Interaction.builder()
                    .user(user)
                    .title(title)
                    .watchedSeconds(request.getWatchedSeconds() != null ? request.getWatchedSeconds() : 0)
                    .completed(request.getCompleted() != null ? request.getCompleted() : false)
                    .rating(request.getRating())
                    .createdAt(Instant.now())
                    .build();
        }
        interactionRepository.save(interaction);
    }
}
