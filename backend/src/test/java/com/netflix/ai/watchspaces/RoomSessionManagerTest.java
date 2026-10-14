package com.netflix.ai.watchspaces;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.netflix.ai.watchspaces.dto.WsDtos.WsEnvelope;
import com.netflix.ai.watchspaces.websocket.RoomSessionManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RoomSessionManagerTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private SetOperations<String, String> setOperations;

    @Mock
    private WebSocketSession session1;

    @Mock
    private WebSocketSession session2;

    private RoomSessionManager sessionManager;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForSet()).thenReturn(setOperations);
        sessionManager = new RoomSessionManager(objectMapper, redisTemplate);
    }

    @Test
    void testMultiTabDoesNotRemoveUserUntilLastSessionCloses() {
        String spaceId = UUID.randomUUID().toString();
        UUID userId = UUID.randomUUID();

        when(session1.getId()).thenReturn("sess-tab-1");
        when(session2.getId()).thenReturn("sess-tab-2");

        // User opens tab 1
        sessionManager.addSession(spaceId, session1, userId, "Alice", false);
        verify(setOperations).add("watchspace:participants:" + spaceId, userId.toString());

        // User opens tab 2
        sessionManager.addSession(spaceId, session2, userId, "Alice", false);

        assertTrue(sessionManager.hasUserSession(spaceId, userId));

        // User closes tab 1
        RoomSessionManager.SessionContext removed1 = sessionManager.removeSession(spaceId, "sess-tab-1");
        assertNotNull(removed1);
        assertEquals(userId, removed1.userId);

        // Redis remove should NOT have been called because tab 2 is still open!
        verify(setOperations, never()).remove("watchspace:participants:" + spaceId, userId.toString());
        assertTrue(sessionManager.hasUserSession(spaceId, userId));

        // User closes tab 2
        RoomSessionManager.SessionContext removed2 = sessionManager.removeSession(spaceId, "sess-tab-2");
        assertNotNull(removed2);

        // NOW Redis remove should be called
        verify(setOperations).remove("watchspace:participants:" + spaceId, userId.toString());
        assertFalse(sessionManager.hasUserSession(spaceId, userId));
    }

    @Test
    void testBroadcastFallsBackToLocalSessionsWhenRedisFails() throws IOException {
        String spaceId = UUID.randomUUID().toString();
        UUID userId = UUID.randomUUID();

        when(session1.getId()).thenReturn("sess-local-1");
        when(session1.isOpen()).thenReturn(true);

        sessionManager.addSession(spaceId, session1, userId, "Bob", true);

        // Simulate Redis failure during broadcast
        doThrow(new RedisConnectionFailureException("Redis connection lost"))
                .when(redisTemplate).convertAndSend(anyString(), anyString());

        WsEnvelope envelope = WsEnvelope.builder()
                .event("room.chat.message")
                .watchSpaceId(spaceId)
                .payload("Hello local fallback")
                .ts(System.currentTimeMillis())
                .build();

        // Broadcast should NOT throw an exception, and should fallback to local sessions
        assertDoesNotThrow(() -> sessionManager.broadcast(spaceId, envelope));

        // Session 1 should have received the message locally
        verify(session1, atLeastOnce()).sendMessage(any(TextMessage.class));
    }
}
