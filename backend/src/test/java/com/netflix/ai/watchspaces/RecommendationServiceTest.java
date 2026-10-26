package com.netflix.ai.watchspaces;

import com.netflix.ai.watchspaces.dto.RecommendationDtos.RecommendationItemDto;
import com.netflix.ai.watchspaces.dto.RecommendationDtos.RecommendationResponseDto;
import com.netflix.ai.watchspaces.entity.Interaction;
import com.netflix.ai.watchspaces.entity.Title;
import com.netflix.ai.watchspaces.entity.User;
import com.netflix.ai.watchspaces.repository.InteractionRepository;
import com.netflix.ai.watchspaces.repository.TitleRepository;
import com.netflix.ai.watchspaces.service.RecommendationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class RecommendationServiceTest {

    @Mock
    private InteractionRepository interactionRepository;

    @Mock
    private TitleRepository titleRepository;

    private RecommendationService recommendationService;

    private UUID userId;
    private UUID otherUserId;
    private User testUser;
    private User otherUser;
    private Title titleSciFi1;
    private Title titleSciFi2;
    private Title titleRomance1;
    private Title titleAction1;

    @BeforeEach
    void setUp() {
        recommendationService = new RecommendationService(interactionRepository, titleRepository);
        userId = UUID.randomUUID();
        otherUserId = UUID.randomUUID();
        testUser = User.builder().id(userId).email("user@test.com").displayName("User").build();
        otherUser = User.builder().id(otherUserId).email("other@test.com").displayName("Other").build();

        titleSciFi1 = Title.builder().id(UUID.randomUUID()).name("SciFi 1").genre("Sci-Fi").build();
        titleSciFi2 = Title.builder().id(UUID.randomUUID()).name("SciFi 2").genre("Sci-Fi").build();
        titleRomance1 = Title.builder().id(UUID.randomUUID()).name("Romance 1").genre("Romance").build();
        titleAction1 = Title.builder().id(UUID.randomUUID()).name("Action 1").genre("Action").build();
    }

    @Test
    void testHybridRecommendationsPreferUserGenreAffinity() {
        when(titleRepository.findAll()).thenReturn(Arrays.asList(titleSciFi1, titleSciFi2, titleRomance1, titleAction1));

        // User watched SciFi 1 and gave it 5 stars
        Interaction userInt = Interaction.builder()
                .user(testUser)
                .title(titleSciFi1)
                .watchedSeconds(500)
                .completed(true)
                .rating((short) 5)
                .createdAt(Instant.now())
                .build();

        when(interactionRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(Collections.singletonList(userInt));
        when(interactionRepository.findAll()).thenReturn(Collections.singletonList(userInt));

        RecommendationResponseDto resp = recommendationService.getRecommendations(userId);

        assertNotNull(resp);
        assertFalse(resp.getItems().isEmpty());

        // Top recommendation should be SciFi 2 due to matching genre affinity
        assertEquals(titleSciFi2.getId(), resp.getItems().get(0).getTitleId());
        assertTrue(resp.getItems().get(0).getScore() >= 0.5);
        assertTrue(resp.getItems().get(0).getReason().contains("Sci-Fi"));
    }

    @Test
    void testCompositeScoreIs60ContentPlus40Collab() {
        when(titleRepository.findAll()).thenReturn(Arrays.asList(titleSciFi1, titleSciFi2, titleRomance1, titleAction1));

        // User watched SciFi 1 (5 stars, completed)
        Interaction userInt = Interaction.builder()
                .user(testUser)
                .title(titleSciFi1)
                .watchedSeconds(500)
                .completed(true)
                .rating((short) 5)
                .createdAt(Instant.now())
                .build();

        // Other user also watched SciFi 1 and Action 1 (4 stars)
        Interaction otherInt1 = Interaction.builder()
                .user(otherUser)
                .title(titleSciFi1)
                .watchedSeconds(500)
                .completed(true)
                .rating((short) 5)
                .createdAt(Instant.now())
                .build();
        Interaction otherInt2 = Interaction.builder()
                .user(otherUser)
                .title(titleAction1)
                .watchedSeconds(650)
                .completed(true)
                .rating((short) 4)
                .createdAt(Instant.now())
                .build();

        when(interactionRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(Collections.singletonList(userInt));
        when(interactionRepository.findAll()).thenReturn(Arrays.asList(userInt, otherInt1, otherInt2));

        RecommendationResponseDto resp = recommendationService.getRecommendations(userId);

        assertNotNull(resp);
        assertFalse(resp.getItems().isEmpty());

        // All items must expose composite score breakdown
        for (RecommendationItemDto item : resp.getItems()) {
            // compositeScore = 0.6 * contentScore + 0.4 * collabScore
            double expectedComposite = Math.round((0.6 * item.getContentScore() + 0.4 * item.getCollabScore()) * 100.0) / 100.0;
            assertEquals(expectedComposite, item.getCompositeScore(), 0.01,
                    "Composite score must equal 0.6*content + 0.4*collab for " + item.getTitle());
            assertTrue(item.getContentScore() >= 0.0 && item.getContentScore() <= 1.0,
                    "Content score must be in [0,1]");
            assertTrue(item.getCollabScore() >= 0.0 && item.getCollabScore() <= 1.0,
                    "Collab score must be in [0,1]");
        }

        // Action 1 should have a non-zero collab score (co-watched by otherUser)
        Optional<RecommendationItemDto> actionItem = resp.getItems().stream()
                .filter(i -> i.getTitleId().equals(titleAction1.getId()))
                .findFirst();
        assertTrue(actionItem.isPresent());
        assertTrue(actionItem.get().getCollabScore() > 0.0,
                "Action 1 should have collaborative signal from otherUser");
    }

    @Test
    void testCompositeScoreSortedDescending() {
        when(titleRepository.findAll()).thenReturn(Arrays.asList(titleSciFi1, titleSciFi2, titleRomance1, titleAction1));

        Interaction userInt = Interaction.builder()
                .user(testUser)
                .title(titleSciFi1)
                .watchedSeconds(500)
                .completed(true)
                .rating((short) 5)
                .createdAt(Instant.now())
                .build();

        when(interactionRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(Collections.singletonList(userInt));
        when(interactionRepository.findAll()).thenReturn(Collections.singletonList(userInt));

        RecommendationResponseDto resp = recommendationService.getRecommendations(userId);

        // Results must be sorted by compositeScore descending
        List<RecommendationItemDto> items = resp.getItems();
        for (int i = 0; i < items.size() - 1; i++) {
            assertTrue(items.get(i).getCompositeScore() >= items.get(i + 1).getCompositeScore(),
                    "Items must be sorted by compositeScore descending");
        }
    }

    @Test
    void testFallbackWhenNoInteractions() {
        when(titleRepository.findAll()).thenReturn(Arrays.asList(titleSciFi1, titleSciFi2));
        when(interactionRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(Collections.emptyList());
        when(interactionRepository.findAll()).thenReturn(Collections.emptyList());

        RecommendationResponseDto resp = recommendationService.getRecommendations(userId);

        assertNotNull(resp);
        assertFalse(resp.getItems().isEmpty());

        // With no interactions, all titles should have equal content scores and 0 collab
        for (RecommendationItemDto item : resp.getItems()) {
            assertEquals(0.0, item.getCollabScore(), 0.01);
            assertTrue(item.getCompositeScore() > 0);
        }
    }
}
