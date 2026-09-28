package com.netflix.ai.watchspaces;

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
    private User testUser;
    private Title titleSciFi1;
    private Title titleSciFi2;
    private Title titleRomance1;
    private Title titleAction1;

    @BeforeEach
    void setUp() {
        recommendationService = new RecommendationService(interactionRepository, titleRepository);
        userId = UUID.randomUUID();
        testUser = User.builder().id(userId).email("user@test.com").displayName("User").build();

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
        assertTrue(resp.getItems().get(0).getScore() >= 0.6);
        assertTrue(resp.getItems().get(0).getReason().contains("Sci-Fi"));
    }
}
