package com.netflix.ai.watchspaces;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.netflix.ai.watchspaces.dto.AiDtos.AiAnswerResponse;
import com.netflix.ai.watchspaces.dto.AiDtos.AiQuestionRequest;
import com.netflix.ai.watchspaces.entity.TimelineEvent;
import com.netflix.ai.watchspaces.entity.Title;
import com.netflix.ai.watchspaces.entity.User;
import com.netflix.ai.watchspaces.entity.WatchSpace;
import com.netflix.ai.watchspaces.repository.ChatMessageRepository;
import com.netflix.ai.watchspaces.repository.TimelineEventRepository;
import com.netflix.ai.watchspaces.repository.WatchSpaceRepository;
import com.netflix.ai.watchspaces.service.AiCopilotService;
import com.netflix.ai.watchspaces.service.GeminiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AiCopilotServiceTest {

    @Mock
    private WatchSpaceRepository watchSpaceRepository;

    @Mock
    private TimelineEventRepository timelineEventRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private GeminiService geminiService;

    private AiCopilotService aiCopilotService;

    private WatchSpace testSpace;
    private Title testTitle;
    private User testUser;
    private UUID spaceId;

    @BeforeEach
    void setUp() {
        aiCopilotService = new AiCopilotService(
                watchSpaceRepository,
                timelineEventRepository,
                chatMessageRepository,
                new ObjectMapper(),
                geminiService
        );

        spaceId = UUID.randomUUID();
        testTitle = Title.builder().id(UUID.randomUUID()).name("Cyberpunk 2099").durationSeconds(600).build();
        testUser = User.builder().id(UUID.randomUUID()).displayName("Tester").build();
        testSpace = WatchSpace.builder().id(spaceId).title(testTitle).hostUser(testUser).build();
    }

    @Test
    void testGroundedAnswerIdentifiesSourceEvents() {
        when(watchSpaceRepository.findById(spaceId)).thenReturn(Optional.of(testSpace));

        UUID evId = UUID.randomUUID();
        TimelineEvent characterEv = TimelineEvent.builder()
                .id(evId)
                .title(testTitle)
                .tsSeconds(40)
                .eventType("character")
                .payload("{\"name\":\"Detective Rios\",\"description\":\"Former partner\"}")
                .createdAt(Instant.now())
                .build();

        when(timelineEventRepository.findByTitleIdAndTsSecondsLessThanEqualOrderByTsSecondsAsc(testTitle.getId(), 55))
                .thenReturn(Collections.singletonList(characterEv));

        when(geminiService.askQuestionWithContext(anyString(), anyInt(), anyString(), anyString()))
                .thenAnswer(invocation -> invocation.getArgument(3)); // return the context back

        AiQuestionRequest req = new AiQuestionRequest(testUser.getId(), 40.0, "Who is the detective?");
        AiAnswerResponse resp = aiCopilotService.askQuestion(spaceId, testUser, req);

        assertNotNull(resp);
        assertNotNull(resp.getAnswer());
        assertTrue(resp.getAnswer().contains("Detective Rios"));
        assertFalse(resp.getSourceEvents().isEmpty());
        assertTrue(resp.getSourceEvents().get(0).contains(evId.toString().substring(0, 8)));
    }

    @Test
    void testNoContextFallbackGracefully() {
        when(watchSpaceRepository.findById(spaceId)).thenReturn(Optional.of(testSpace));
        when(timelineEventRepository.findByTitleIdAndTsSecondsLessThanEqualOrderByTsSecondsAsc(testTitle.getId(), 15))
                .thenReturn(Collections.emptyList());

        AiQuestionRequest req = new AiQuestionRequest(testUser.getId(), 0.0, "What happened?");
        AiAnswerResponse resp = aiCopilotService.askQuestion(spaceId, testUser, req);

        assertNotNull(resp);
        assertTrue(resp.getAnswer().contains("No scene metadata"));
    }

    @Test
    void testSemanticRetrievalExceptionFallsBackGracefully() {
        when(watchSpaceRepository.findById(spaceId)).thenReturn(Optional.of(testSpace));

        UUID evId = UUID.randomUUID();
        TimelineEvent triviaEv = TimelineEvent.builder()
                .id(evId)
                .title(testTitle)
                .tsSeconds(50)
                .eventType("trivia")
                .payload("{\"text\":\"Neo Nexus was constructed in 2085.\"}")
                .createdAt(Instant.now())
                .build();

        when(timelineEventRepository.findByTitleIdAndTsSecondsLessThanEqualOrderByTsSecondsAsc(testTitle.getId(), 65))
                .thenReturn(Collections.singletonList(triviaEv));

        // Embedding succeeds
        when(geminiService.getEmbedding(anyString())).thenReturn(Arrays.asList(0.1, 0.2, 0.3));

        // But native pgvector query throws (e.g. dimension mismatch or extension error)
        when(timelineEventRepository.findSimilarEvents(eq(testTitle.getId()), eq(65), anyString(), eq(4)))
                .thenThrow(new RuntimeException("ERROR: different vector dimensions 768 and 3072"));

        when(geminiService.askQuestionWithContext(anyString(), anyInt(), anyString(), anyString()))
                .thenAnswer(invocation -> invocation.getArgument(3));

        AiQuestionRequest req = new AiQuestionRequest(testUser.getId(), 50.0, "When was the city built?");
        AiAnswerResponse resp = aiCopilotService.askQuestion(spaceId, testUser, req);

        assertNotNull(resp);
        assertNotNull(resp.getAnswer());
        // Verify that it caught the vector exception and safely used the fallback timeline events
        assertTrue(resp.getAnswer().contains("Neo Nexus was constructed in 2085"));
        assertFalse(resp.getSourceEvents().isEmpty());
    }
}

