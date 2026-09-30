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

        // 1. Content-based affinity: Calculate preferred genres from watched titles & ratings
        Map<String, Double> genreAffinity = new HashMap<>();
        for (Interaction interaction : userInteractions) {
            String genre = interaction.getTitle().getGenre();
            if (genre != null) {
                double weight = 1.0;
                if (interaction.getRating() != null) {
                    weight += (interaction.getRating() - 3.0) * 0.5; // High rating boosts affinity
                }
                if (Boolean.TRUE.equals(interaction.getCompleted())) {
                    weight += 0.5;
                }
                genreAffinity.put(genre, genreAffinity.getOrDefault(genre, 0.0) + weight);
            }
        }

        // 2. Collaborative filtering: Find other users who watched similar titles
        Map<UUID, Double> userSimilarity = new HashMap<>();
        for (Interaction otherInt : allInteractions) {
            UUID otherUserId = otherInt.getUser().getId();
            if (!otherUserId.equals(userId) && watchedTitleIds.contains(otherInt.getTitle().getId())) {
                userSimilarity.put(otherUserId, userSimilarity.getOrDefault(otherUserId, 0.0) + 1.0);
            }
        }

        // Collaborative title scores
        Map<UUID, Double> collaborativeScores = new HashMap<>();
        for (Interaction otherInt : allInteractions) {
            UUID otherUserId = otherInt.getUser().getId();
            if (!otherUserId.equals(userId) && userSimilarity.containsKey(otherUserId)) {
                UUID titleId = otherInt.getTitle().getId();
                if (!watchedTitleIds.contains(titleId)) {
                    double sim = userSimilarity.get(otherUserId);
                    double ratingFactor = otherInt.getRating() != null ? otherInt.getRating() / 5.0 : 0.7;
                    collaborativeScores.put(titleId, collaborativeScores.getOrDefault(titleId, 0.0) + (sim * ratingFactor));
                }
            }
        }

        // 3. Score candidates with Hybrid model
        List<RecommendationItemDto> items = new ArrayList<>();
        for (Title title : allTitles) {
            if (watchedTitleIds.contains(title.getId())) {
                continue; // Skip already watched
            }

            double contentScore = 0.5;
            String genre = title.getGenre();
            if (genre != null && genreAffinity.containsKey(genre)) {
                contentScore += Math.min(0.45, genreAffinity.get(genre) * 0.15);
            }

            double collabScore = collaborativeScores.getOrDefault(title.getId(), 0.0);
            double normalizedCollab = Math.min(1.0, collabScore * 0.3);

            // Hybrid combination: 60% content-based + 40% collaborative
            double finalScore = (0.6 * contentScore) + (0.4 * normalizedCollab);
            finalScore = Math.round(finalScore * 100.0) / 100.0;

            String reason;
            if (collabScore > 0 && genreAffinity.containsKey(genre)) {
                reason = "Trending among viewers with similar tastes in " + (genre != null ? genre : "Sci-Fi");
            } else if (genreAffinity.containsKey(genre)) {
                reason = "Matches your interest in " + genre;
            } else {
                reason = "Popular choice in Watch Spaces";
            }

            items.add(RecommendationItemDto.builder()
                    .titleId(title.getId())
                    .title(title.getName())
                    .genre(title.getGenre())
                    .thumbnailUrl(title.getThumbnailUrl())
                    .description(title.getDescription())
                    .score(Math.min(0.99, Math.max(0.65, finalScore)))
                    .reason(reason)
                    .build());
        }

        // Sort by highest score
        items.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        // If user watched everything or few items, fallback to top scored titles
        if (items.isEmpty()) {
            for (Title title : allTitles) {
                items.add(RecommendationItemDto.builder()
                        .titleId(title.getId())
                        .title(title.getName())
                        .genre(title.getGenre())
                        .thumbnailUrl(title.getThumbnailUrl())
                        .description(title.getDescription())
                        .score(0.88)
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
