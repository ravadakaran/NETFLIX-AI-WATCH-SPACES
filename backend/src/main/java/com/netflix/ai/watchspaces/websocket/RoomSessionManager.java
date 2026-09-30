package com.netflix.ai.watchspaces.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.netflix.ai.watchspaces.dto.WsDtos.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class RoomSessionManager implements MessageListener {

    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;

    // LOCAL websocket connections for THIS container instance
    private final Map<String, Map<String, SessionContext>> localRoomSessions = new ConcurrentHashMap<>();

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
        localRoomSessions.computeIfAbsent(watchSpaceId, k -> new ConcurrentHashMap<>())
                .put(session.getId(), new SessionContext(session, userId, displayName, isHost));
        
        redisTemplate.opsForSet().add("watchspace:participants:" + watchSpaceId, userId.toString());
    }

    public SessionContext removeSession(String watchSpaceId, String sessionId) {
        Map<String, SessionContext> sessions = localRoomSessions.get(watchSpaceId);
        if (sessions != null) {
            SessionContext removed = sessions.remove(sessionId);
            if (removed != null) {
                redisTemplate.opsForSet().remove("watchspace:participants:" + watchSpaceId, removed.userId.toString());
            }
            if (sessions.isEmpty()) {
                localRoomSessions.remove(watchSpaceId);
            }
            return removed;
        }
        return null;
    }

    public void muteUser(String watchSpaceId, UUID userId) {
        redisTemplate.opsForSet().add("watchspace:muted:" + watchSpaceId, userId.toString());
    }

    public void unmuteUser(String watchSpaceId, UUID userId) {
        redisTemplate.opsForSet().remove("watchspace:muted:" + watchSpaceId, userId.toString());
    }

    public boolean isMuted(String watchSpaceId, UUID userId) {
        Boolean isMember = redisTemplate.opsForSet().isMember("watchspace:muted:" + watchSpaceId, userId.toString());
        return isMember != null && isMember;
    }

    public void kickUser(String watchSpaceId, UUID userId) {
        WsEnvelope kickEnv = WsEnvelope.builder()
                .event("internal.cluster.kick")
                .watchSpaceId(watchSpaceId)
                .payload(userId.toString())
                .ts(System.currentTimeMillis())
                .build();
        broadcast(watchSpaceId, kickEnv);
    }

    public void updateHost(String watchSpaceId, UUID newHostId) {
        Map<String, SessionContext> sessions = localRoomSessions.get(watchSpaceId);
        if (sessions != null) {
            for (SessionContext ctx : sessions.values()) {
                ctx.isHost = ctx.userId.equals(newHostId);
            }
        }
    }

    public int getParticipantCount(String watchSpaceId) {
        Long size = redisTemplate.opsForSet().size("watchspace:participants:" + watchSpaceId);
        return size != null ? size.intValue() : 0;
    }

    public SessionContext getSessionContext(String watchSpaceId, String sessionId) {
        Map<String, SessionContext> sessions = localRoomSessions.get(watchSpaceId);
        return sessions != null ? sessions.get(sessionId) : null;
    }

    public void broadcast(String watchSpaceId, WsEnvelope envelope) {
        try {
            String json = objectMapper.writeValueAsString(envelope);
            redisTemplate.convertAndSend("watchspace:" + watchSpaceId, json);
        } catch (Exception e) {
            log.error("Error publishing ws message to Redis for space {}: {}", watchSpaceId, e.getMessage());
        }
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String channel = new String(message.getChannel());
            String json = new String(message.getBody());
            
            String watchSpaceId = channel.substring("watchspace:".length());
            
            WsEnvelope envelope = objectMapper.readValue(json, WsEnvelope.class);
            if ("internal.cluster.kick".equals(envelope.getEvent())) {
                handleClusterKick(watchSpaceId, envelope);
                return;
            }

            Map<String, SessionContext> sessions = localRoomSessions.get(watchSpaceId);
            if (sessions == null || sessions.isEmpty()) {
                return;
            }

            TextMessage textMessage = new TextMessage(json);
            for (SessionContext context : sessions.values()) {
                if (context.session.isOpen()) {
                    try {
                        synchronized (context.session) {
                            context.session.sendMessage(textMessage);
                        }
                    } catch (IOException e) {
                        log.warn("Error sending ws message to session {}: {}", context.session.getId(), e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error processing Redis pub/sub message: {}", e.getMessage());
        }
    }

    private void handleClusterKick(String watchSpaceId, WsEnvelope envelope) {
        String userIdStr = (String) envelope.getPayload();
        Map<String, SessionContext> sessions = localRoomSessions.get(watchSpaceId);
        if (sessions != null) {
            for (SessionContext ctx : sessions.values()) {
                if (ctx.userId.toString().equals(userIdStr)) {
                    try {
                        ctx.session.close(org.springframework.web.socket.CloseStatus.NORMAL.withReason("KICKED"));
                    } catch (IOException e) {
                        log.warn("Error closing session for kicked user: {}", e.getMessage());
                    }
                }
            }
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
        redisTemplate.opsForHash().increment("watchspace:votes:" + watchSpaceId, optionId, 1);
    }

    public Map<String, Integer> getVotes(String watchSpaceId) {
        Map<Object, Object> entries = redisTemplate.opsForHash().entries("watchspace:votes:" + watchSpaceId);
        Map<String, Integer> result = new HashMap<>();
        for (Map.Entry<Object, Object> entry : entries.entrySet()) {
            result.put((String) entry.getKey(), Integer.parseInt((String) entry.getValue()));
        }
        return result;
    }

    public void clearVotes(String watchSpaceId) {
        redisTemplate.delete("watchspace:votes:" + watchSpaceId);
    }
}
