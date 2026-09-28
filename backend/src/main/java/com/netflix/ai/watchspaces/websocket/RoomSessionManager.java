package com.netflix.ai.watchspaces.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.netflix.ai.watchspaces.dto.WsDtos.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings({"null"})
public class RoomSessionManager {

    private final ObjectMapper objectMapper;

    // watchSpaceId -> Map of sessionId to SessionContext
    private final Map<String, Map<String, SessionContext>> roomSessions = new ConcurrentHashMap<>();

    // Variation active votes: watchSpaceId -> (optionId -> count)
    private final Map<String, Map<String, Integer>> activeVotes = new ConcurrentHashMap<>();

    // watchSpaceId -> set of muted user UUIDs
    private final Map<String, Set<UUID>> mutedUsers = new ConcurrentHashMap<>();

    public static class SessionContext {
        public WebSocketSession session;
        public UUID userId;
        public String displayName;
        public boolean isHost;

        public SessionContext(WebSocketSession session, UUID userId, String displayName, boolean isHost) {
            this.session = session;
            this.userId = userId;
            this.displayName = displayName;
            this.isHost = isHost;
        }
    }

    public void addSession(String watchSpaceId, WebSocketSession session, UUID userId, String displayName, boolean isHost) {
        roomSessions.computeIfAbsent(watchSpaceId, k -> new ConcurrentHashMap<>())
                .put(session.getId(), new SessionContext(session, userId, displayName, isHost));
    }

    public SessionContext removeSession(String watchSpaceId, String sessionId) {
        Map<String, SessionContext> sessions = roomSessions.get(watchSpaceId);
        if (sessions != null) {
            SessionContext removed = sessions.remove(sessionId);
            if (sessions.isEmpty()) {
                roomSessions.remove(watchSpaceId);
                activeVotes.remove(watchSpaceId);
                mutedUsers.remove(watchSpaceId);
            }
            return removed;
        }
        return null;
    }

    public void muteUser(String watchSpaceId, UUID userId) {
        mutedUsers.computeIfAbsent(watchSpaceId, k -> ConcurrentHashMap.newKeySet()).add(userId);
    }

    public void unmuteUser(String watchSpaceId, UUID userId) {
        Set<UUID> set = mutedUsers.get(watchSpaceId);
        if (set != null) {
            set.remove(userId);
        }
    }

    public boolean isMuted(String watchSpaceId, UUID userId) {
        Set<UUID> set = mutedUsers.get(watchSpaceId);
        return set != null && set.contains(userId);
    }

    public void kickUser(String watchSpaceId, UUID userId) {
        Map<String, SessionContext> sessions = roomSessions.get(watchSpaceId);
        if (sessions != null) {
            for (SessionContext ctx : sessions.values()) {
                if (ctx.userId.equals(userId)) {
                    try {
                        ctx.session.close(org.springframework.web.socket.CloseStatus.NORMAL.withReason("KICKED"));
                    } catch (IOException e) {
                        log.warn("Error closing session for kicked user: {}", e.getMessage());
                    }
                }
            }
        }
    }

    public void updateHost(String watchSpaceId, UUID newHostId) {
        Map<String, SessionContext> sessions = roomSessions.get(watchSpaceId);
        if (sessions != null) {
            for (SessionContext ctx : sessions.values()) {
                ctx.isHost = ctx.userId.equals(newHostId);
            }
        }
    }

    public int getParticipantCount(String watchSpaceId) {
        Map<String, SessionContext> sessions = roomSessions.get(watchSpaceId);
        return sessions != null ? sessions.size() : 0;
    }

    public SessionContext getSessionContext(String watchSpaceId, String sessionId) {
        Map<String, SessionContext> sessions = roomSessions.get(watchSpaceId);
        return sessions != null ? sessions.get(sessionId) : null;
    }

    public void broadcast(String watchSpaceId, WsEnvelope envelope) {
        Map<String, SessionContext> sessions = roomSessions.get(watchSpaceId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(envelope);
            TextMessage message = new TextMessage(json);

            for (SessionContext context : sessions.values()) {
                if (context.session.isOpen()) {
                    try {
                        synchronized (context.session) {
                            context.session.sendMessage(message);
                        }
                    } catch (IOException e) {
                        log.warn("Error sending ws message to session {}: {}", context.session.getId(), e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error broadcasting ws message to space {}: {}", watchSpaceId, e.getMessage());
        }
    }

    public void sendToSession(WebSocketSession session, WsEnvelope envelope) {
        if (session.isOpen()) {
            try {
                String json = objectMapper.writeValueAsString(envelope);
                synchronized (session) {
                    session.sendMessage(new TextMessage(json));
                }
            } catch (IOException e) {
                log.warn("Error sending direct ws message to session {}: {}", session.getId(), e.getMessage());
            }
        }
    }

    public void registerVote(String watchSpaceId, String optionId) {
        activeVotes.computeIfAbsent(watchSpaceId, k -> new ConcurrentHashMap<>())
                .compute(optionId, (k, v) -> (v == null) ? 1 : v + 1);
    }

    public Map<String, Integer> getVotes(String watchSpaceId) {
        return activeVotes.getOrDefault(watchSpaceId, Collections.emptyMap());
    }

    public void clearVotes(String watchSpaceId) {
        activeVotes.remove(watchSpaceId);
    }
}
