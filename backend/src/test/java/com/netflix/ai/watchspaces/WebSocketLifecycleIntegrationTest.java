package com.netflix.ai.watchspaces;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.netflix.ai.watchspaces.dto.WsDtos.WsEnvelope;
import com.netflix.ai.watchspaces.entity.User;
import com.netflix.ai.watchspaces.entity.WatchSpace;
import com.netflix.ai.watchspaces.entity.WatchSpaceParticipant;
import com.netflix.ai.watchspaces.entity.WatchSpaceParticipantId;
import com.netflix.ai.watchspaces.repository.ChatMessageRepository;
import com.netflix.ai.watchspaces.repository.UserRepository;
import com.netflix.ai.watchspaces.repository.WatchSpaceParticipantRepository;
import com.netflix.ai.watchspaces.repository.WatchSpaceRepository;
import com.netflix.ai.watchspaces.security.JwtTokenProvider;
import com.netflix.ai.watchspaces.service.AiCopilotService;
import com.netflix.ai.watchspaces.service.ChatModerationService;
import com.netflix.ai.watchspaces.service.NarrativeService;
import com.netflix.ai.watchspaces.service.RateLimitingService;
import com.netflix.ai.watchspaces.service.WatchSpaceService;
import com.netflix.ai.watchspaces.websocket.RoomSessionManager;
import com.netflix.ai.watchspaces.websocket.WatchSpaceWebSocketHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.connection.DefaultMessage;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WebSocketLifecycleIntegrationTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private SetOperations<String, String> setOperations;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private UserRepository userRepository;

    @Mock
    private WatchSpaceRepository watchSpaceRepository;

    @Mock
    private WatchSpaceService watchSpaceService;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private AiCopilotService aiCopilotService;

    @Mock
    private com.netflix.ai.watchspaces.repository.VariationOptionRepository variationOptionRepository;

    @Mock
    private RateLimitingService rateLimitingService;

    @Mock
    private ChatModerationService chatModerationService;

    @Mock
    private NarrativeService narrativeService;

    @Mock
    private WatchSpaceParticipantRepository participantRepository;

    @Mock
    private WebSocketSession session1;

    @Mock
    private WebSocketSession session2;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private RoomSessionManager sessionManager;
    private WatchSpaceWebSocketHandler webSocketHandler;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForSet()).thenReturn(setOperations);
        sessionManager = new RoomSessionManager(objectMapper, redisTemplate);
        webSocketHandler = new WatchSpaceWebSocketHandler(
                sessionManager,
                tokenProvider,
                userRepository,
                watchSpaceRepository,
                watchSpaceService,
                chatMessageRepository,
                aiCopilotService,
                objectMapper,
                variationOptionRepository,
                rateLimitingService,
                chatModerationService,
                narrativeService,
                participantRepository
        );
    }

    @Test
    void testMultiTabDisconnectDoesNotTriggerLeftUntilFinalTabCloses() throws Exception {
        UUID spaceId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        String spaceIdStr = spaceId.toString();

        Map<String, Object> attrs1 = new HashMap<>();
        Map<String, Object> attrs2 = new HashMap<>();
        when(session1.getAttributes()).thenReturn(attrs1);
        when(session2.getAttributes()).thenReturn(attrs2);
        when(session1.getId()).thenReturn("tab-1");
        when(session2.getId()).thenReturn("tab-2");
        when(session1.getUri()).thenReturn(URI.create("ws://localhost/ws/watch-spaces/" + spaceIdStr));
        when(session2.getUri()).thenReturn(URI.create("ws://localhost/ws/watch-spaces/" + spaceIdStr));

        // Connect tab 1 and tab 2
        sessionManager.addSession(spaceIdStr, session1, userId, "Alice", false);
        sessionManager.addSession(spaceIdStr, session2, userId, "Alice", false);

        assertTrue(sessionManager.hasUserSession(spaceIdStr, userId));

        // Close tab 1
        webSocketHandler.afterConnectionClosed(session1, CloseStatus.NORMAL);

        // Since tab 2 is still open, watchSpaceService.leaveWatchSpace should NOT be called yet!
        verify(watchSpaceService, never()).leaveWatchSpace(spaceId, userId);
        assertTrue(sessionManager.hasUserSession(spaceIdStr, userId));

        // Close tab 2 (final tab)
        webSocketHandler.afterConnectionClosed(session2, CloseStatus.NORMAL);

        // Now watchSpaceService.leaveWatchSpace MUST be called!
        verify(watchSpaceService, times(1)).leaveWatchSpace(spaceId, userId);
        assertFalse(sessionManager.hasUserSession(spaceIdStr, userId));
    }

    @Test
    void testClusterWideHostTransferSyncsRemoteInstanceSessionContext() throws Exception {
        UUID spaceId = UUID.randomUUID();
        String spaceIdStr = spaceId.toString();
        UUID oldHostId = UUID.randomUUID();
        UUID newHostId = UUID.randomUUID();

        // This instance has a session for the NEW host
        when(session1.getId()).thenReturn("sess-new-host");
        sessionManager.addSession(spaceIdStr, session1, newHostId, "Bob", false);

        RoomSessionManager.SessionContext ctxBefore = sessionManager.getSessionContext(spaceIdStr, "sess-new-host");
        assertNotNull(ctxBefore);
        assertFalse(ctxBefore.isHost, "Bob was initially a non-host");

        // Simulate a room.mod.transfer broadcast arriving from Redis (sent by another cluster instance)
        Map<String, Object> transferPayload = Map.of("userId", newHostId.toString());
        WsEnvelope envelope = WsEnvelope.builder()
                .event("room.mod.transfer")
                .watchSpaceId(spaceIdStr)
                .payload(transferPayload)
                .ts(System.currentTimeMillis())
                .build();
        byte[] body = objectMapper.writeValueAsBytes(envelope);
        byte[] channel = ("watchspace:" + spaceIdStr).getBytes(StandardCharsets.UTF_8);
        Message redisMsg = new DefaultMessage(channel, body);

        // Message arrives on this instance
        sessionManager.onMessage(redisMsg, null);

        // Bob's local session context must now be updated to isHost = true!
        RoomSessionManager.SessionContext ctxAfter = sessionManager.getSessionContext(spaceIdStr, "sess-new-host");
        assertNotNull(ctxAfter);
        assertTrue(ctxAfter.isHost, "Bob must now be authoritative host on this cluster instance");
    }

    @Test
    void testReconnectReactivatesParticipantInDatabase() throws Exception {
        UUID spaceId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        String spaceIdStr = spaceId.toString();

        Map<String, Object> attrs = new HashMap<>();
        when(session1.getAttributes()).thenReturn(attrs);
        when(session1.getId()).thenReturn("reconnect-tab");
        when(session1.getUri()).thenReturn(URI.create("ws://localhost/ws/watch-spaces/" + spaceIdStr + "?token=valid-token"));
        when(session1.isOpen()).thenReturn(true);

        when(tokenProvider.validateToken("valid-token")).thenReturn(true);
        when(tokenProvider.getUserIdFromToken("valid-token")).thenReturn(userId);

        User user = User.builder().id(userId).displayName("Alice").build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        User host = User.builder().id(UUID.randomUUID()).displayName("Host").build();
        WatchSpace space = WatchSpace.builder()
                .id(spaceId)
                .hostUser(host)
                .playbackState("pause")
                .positionSeconds(10.0)
                .build();
        when(watchSpaceRepository.findById(spaceId)).thenReturn(Optional.of(space));

        // Participant exists in DB but was marked left
        WatchSpaceParticipant inactiveParticipant = WatchSpaceParticipant.builder()
                .id(new WatchSpaceParticipantId(spaceId, userId))
                .watchSpace(space)
                .user(user)
                .joinedAt(Instant.now().minusSeconds(100))
                .leftAt(Instant.now().minusSeconds(50))
                .build();
        when(participantRepository.findByIdWatchSpaceIdAndIdUserId(spaceId, userId))
                .thenReturn(Optional.of(inactiveParticipant));

        // Connect
        webSocketHandler.afterConnectionEstablished(session1);

        // leftAt should now be reset to null!
        assertNull(inactiveParticipant.getLeftAt(), "Reconnect must clear leftAt to reactivate the participant");
        verify(participantRepository).save(inactiveParticipant);
    }
}
