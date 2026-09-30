package com.netflix.ai.watchspaces.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.netflix.ai.watchspaces.dto.AiDtos.AiAnswerResponse;
import com.netflix.ai.watchspaces.dto.AiDtos.AiQuestionRequest;
import com.netflix.ai.watchspaces.dto.WsDtos.*;
import com.netflix.ai.watchspaces.entity.ChatMessage;
import com.netflix.ai.watchspaces.entity.User;
import com.netflix.ai.watchspaces.entity.WatchSpace;
import com.netflix.ai.watchspaces.repository.ChatMessageRepository;
import com.netflix.ai.watchspaces.repository.UserRepository;
import com.netflix.ai.watchspaces.repository.WatchSpaceRepository;
import com.netflix.ai.watchspaces.security.JwtTokenProvider;
import com.netflix.ai.watchspaces.service.AiCopilotService;
import com.netflix.ai.watchspaces.service.WatchSpaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.slf4j.MDC;

import java.net.URI;
import java.time.Instant;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings({"unchecked"})
public class WatchSpaceWebSocketHandler extends TextWebSocketHandler {

    private final RoomSessionManager sessionManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final WatchSpaceRepository watchSpaceRepository;
    private final WatchSpaceService watchSpaceService;
    private final ChatMessageRepository chatMessageRepository;
    private final AiCopilotService aiCopilotService;
    private final ObjectMapper objectMapper;
    private final com.netflix.ai.watchspaces.repository.VariationOptionRepository variationOptionRepository;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String correlationId = UUID.randomUUID().toString();
        session.getAttributes().put("correlationId", correlationId);
        MDC.put("correlationId", correlationId);
        try {
            String watchSpaceIdStr = extractWatchSpaceId(session);
        String token = extractToken(session);

        if (token == null || !tokenProvider.validateToken(token)) {
            log.warn("WS Connection rejected: invalid token for space {}", watchSpaceIdStr);
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Invalid or missing token"));
            return;
        }

        UUID userId = tokenProvider.getUserIdFromToken(token);
        Optional<User> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("User not found"));
            return;
        }
        User user = userOpt.get();

        UUID spaceId;
        try {
            spaceId = UUID.fromString(watchSpaceIdStr);
        } catch (Exception e) {
            session.close(CloseStatus.BAD_DATA.withReason("Invalid watchSpaceId"));
            return;
        }

        Optional<WatchSpace> spaceOpt = watchSpaceRepository.findById(spaceId);
        if (!spaceOpt.isPresent()) {
            session.close(CloseStatus.BAD_DATA.withReason("Watch space not found"));
            return;
        }
        WatchSpace space = spaceOpt.get();

        boolean isHost = space.getHostUser().getId().equals(user.getId());
        sessionManager.addSession(watchSpaceIdStr, session, user.getId(), user.getDisplayName(), isHost);

        int count = sessionManager.getParticipantCount(watchSpaceIdStr);

        // Broadcast presence joined
        WsEnvelope presenceEnv = WsEnvelope.builder()
                .event("room.presence.update")
                .watchSpaceId(watchSpaceIdStr)
                .payload(PresencePayload.builder()
                        .participantId(user.getId().toString())
                        .displayName(user.getDisplayName())
                        .action("joined")
                        .participantCount(count)
                        .build())
                .ts(System.currentTimeMillis())
                .build();
        sessionManager.broadcast(watchSpaceIdStr, presenceEnv);

        // Send current authoritative playback state to newly connected client
        WsEnvelope currentPlayback = WsEnvelope.builder()
                .event("room.playback.update")
                .watchSpaceId(watchSpaceIdStr)
                .payload(PlaybackPayload.builder()
                        .state(space.getPlaybackState())
                        .positionSeconds(space.getPositionSeconds())
                        .issuedBy(space.getHostUser().getId().toString())
                        .build())
                .ts(System.currentTimeMillis())
                .build();
        sessionManager.sendToSession(session, currentPlayback);

        // Send recent chat history (up to 50 messages) to newly connected client
        try {
            List<ChatMessage> history = chatMessageRepository.findTop50ByWatchSpaceIdOrderByCreatedAtDesc(spaceId);
            if (history != null && !history.isEmpty()) {
                List<ChatMessage> chronological = new ArrayList<>(history);
                Collections.reverse(chronological);
                List<ChatPayload> historyPayload = chronological.stream()
                        .map(cm -> ChatPayload.builder()
                                .messageId(cm.getId() != null ? cm.getId().toString() : "msg_" + UUID.randomUUID().toString().substring(0, 8))
                                .userId(cm.getUser() != null ? cm.getUser().getId().toString() : "")
                                .displayName(cm.getUser() != null ? cm.getUser().getDisplayName() : "Guest")
                                .body(cm.getBody())
                                .tsSeconds(cm.getTsSeconds())
                                .build())
                        .collect(java.util.stream.Collectors.toList());

                WsEnvelope historyEnv = WsEnvelope.builder()
                        .event("room.chat.history")
                        .watchSpaceId(watchSpaceIdStr)
                        .payload(historyPayload)
                        .ts(System.currentTimeMillis())
                        .build();
                sessionManager.sendToSession(session, historyEnv);
            }
        } catch (Exception e) {
            log.error("Failed to send chat history for space {}: {}", watchSpaceIdStr, e.getMessage());
        }

        log.info("User {} connected to space {}, total: {}", user.getDisplayName(), watchSpaceIdStr, count);
        } finally {
            MDC.remove("correlationId");
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String correlationId = (String) session.getAttributes().get("correlationId");
        if (correlationId != null) MDC.put("correlationId", correlationId);
        try {
            String payload = message.getPayload();
            WsEnvelope envelope;
        try {
            envelope = objectMapper.readValue(payload, WsEnvelope.class);
        } catch (Exception e) {
            log.warn("Malformed WS message: {}", payload);
            return;
        }

        String spaceId = envelope.getWatchSpaceId();
        if (spaceId == null) {
            spaceId = extractWatchSpaceId(session);
        }

        RoomSessionManager.SessionContext ctx = sessionManager.getSessionContext(spaceId, session.getId());
        if (ctx == null) {
            return;
        }

        String event = envelope.getEvent();
        long now = System.currentTimeMillis();

        if ("room.playback.update".equalsIgnoreCase(event)) {
            // Host authoritative check
            if (!ctx.isHost) {
                log.warn("Non-host {} attempted playback control in space {}", ctx.displayName, spaceId);
                return;
            }

            PlaybackPayload pb = objectMapper.convertValue(envelope.getPayload(), PlaybackPayload.class);
            pb.setIssuedBy(ctx.userId.toString());

            // Update database state
            try {
                watchSpaceService.updatePlaybackState(UUID.fromString(spaceId), pb.getState(), pb.getPositionSeconds());
            } catch (Exception e) {
                log.error("Failed to update space playback state: {}", e.getMessage());
            }

            envelope.setPayload(pb);
            envelope.setTs(now);
            sessionManager.broadcast(spaceId, envelope);

        } else if ("room.chat.message".equalsIgnoreCase(event)) {
            if (sessionManager.isMuted(spaceId, ctx.userId)) {
                return; // User is muted
            }

            ChatPayload chat = objectMapper.convertValue(envelope.getPayload(), ChatPayload.class);
            chat.setUserId(ctx.userId.toString());
            chat.setDisplayName(ctx.displayName);
            if (chat.getMessageId() == null) {
                chat.setMessageId("msg_" + UUID.randomUUID().toString().substring(0, 8));
            }

            // Save to database
            try {
                WatchSpace space = watchSpaceRepository.findById(UUID.fromString(spaceId)).orElse(null);
                User user = userRepository.findById(ctx.userId).orElse(null);
                if (space != null && user != null) {
                    ChatMessage cm = ChatMessage.builder()
                            .watchSpace(space)
                            .user(user)
                            .msgType("chat")
                            .body(chat.getBody())
                            .tsSeconds(chat.getTsSeconds())
                            .createdAt(Instant.now())
                            .build();
                    chatMessageRepository.save(cm);
                }
            } catch (Exception e) {
                log.error("Failed to persist chat message: {}", e.getMessage());
            }

            envelope.setPayload(chat);
            envelope.setTs(now);
            sessionManager.broadcast(spaceId, envelope);

        } else if ("room.chat.typing".equalsIgnoreCase(event)) {
            // Typing indicator
            Map<String, Object> typingPayload = new HashMap<>();
            typingPayload.put("userId", ctx.userId.toString());
            typingPayload.put("displayName", ctx.displayName);
            
            envelope.setPayload(typingPayload);
            envelope.setTs(now);
            sessionManager.broadcast(spaceId, envelope);

        } else if ("room.sync.ping".equalsIgnoreCase(event)) {
            SyncPingPayload ping = objectMapper.convertValue(envelope.getPayload(), SyncPingPayload.class);
            WsEnvelope pongEnv = WsEnvelope.builder()
                    .event("room.sync.pong")
                    .watchSpaceId(spaceId)
                    .payload(SyncPongPayload.builder()
                            .clientSentAt(ping.getClientSentAt())
                            .serverReceivedAt(now)
                            .build())
                    .ts(now)
                    .build();
            sessionManager.sendToSession(session, pongEnv);

        } else if ("room.variation.vote".equalsIgnoreCase(event)) {
            VoteCastPayload vote = objectMapper.convertValue(envelope.getPayload(), VoteCastPayload.class);
            sessionManager.registerVote(spaceId, vote.getOptionId());

        } else if ("room.variation.voteOpen".equalsIgnoreCase(event)) {
            if (ctx.isHost) {
                sessionManager.clearVotes(spaceId);
                envelope.setTs(now);
                sessionManager.broadcast(spaceId, envelope);
            }

        } else if ("room.variation.applied".equalsIgnoreCase(event)) {
            if (ctx.isHost) {
                Map<String, Integer> votes = sessionManager.getVotes(spaceId);
                if (votes != null && !votes.isEmpty()) {
                    votes.forEach((optionIdStr, count) -> {
                        try {
                            UUID optId = UUID.fromString(optionIdStr);
                            variationOptionRepository.findById(optId).ifPresent(opt -> {
                                opt.setVoteCount(opt.getVoteCount() + count);
                                variationOptionRepository.save(opt);
                            });
                        } catch (Exception e) {
                            log.warn("Failed to persist vote count for option {}: {}", optionIdStr, e.getMessage());
                        }
                    });
                }

                envelope.setTs(now);
                sessionManager.broadcast(spaceId, envelope);
            }

        } else if ("room.mod.mute".equalsIgnoreCase(event)) {
            if (ctx.isHost) {
                Map<String, Object> payloadMap = (Map<String, Object>) envelope.getPayload();
                String targetId = (String) payloadMap.get("userId");
                Boolean isMuted = (Boolean) payloadMap.get("isMuted");
                if (isMuted != null && isMuted) {
                    sessionManager.muteUser(spaceId, UUID.fromString(targetId));
                } else {
                    sessionManager.unmuteUser(spaceId, UUID.fromString(targetId));
                }
                envelope.setTs(now);
                sessionManager.broadcast(spaceId, envelope);
            }

        } else if ("room.mod.kick".equalsIgnoreCase(event)) {
            if (ctx.isHost) {
                Map<String, Object> payloadMap = (Map<String, Object>) envelope.getPayload();
                String targetId = (String) payloadMap.get("userId");
                sessionManager.kickUser(spaceId, UUID.fromString(targetId));
                envelope.setTs(now);
                sessionManager.broadcast(spaceId, envelope);
            }

        } else if ("room.mod.lock".equalsIgnoreCase(event)) {
            if (ctx.isHost) {
                Map<String, Object> payloadMap = (Map<String, Object>) envelope.getPayload();
                Boolean isLocked = (Boolean) payloadMap.get("isLocked");
                try {
                    watchSpaceService.updateRoomLock(UUID.fromString(spaceId), isLocked != null && isLocked);
                } catch (Exception e) {
                    log.error("Failed to update room lock: {}", e.getMessage());
                }
                envelope.setTs(now);
                sessionManager.broadcast(spaceId, envelope);
            }

        } else if ("room.mod.transfer".equalsIgnoreCase(event)) {
            if (ctx.isHost) {
                Map<String, Object> payloadMap = (Map<String, Object>) envelope.getPayload();
                String targetId = (String) payloadMap.get("userId");
                try {
                    watchSpaceService.transferHost(UUID.fromString(spaceId), UUID.fromString(targetId));
                    sessionManager.updateHost(spaceId, UUID.fromString(targetId));
                } catch (Exception e) {
                    log.error("Failed to transfer host: {}", e.getMessage());
                }
                envelope.setTs(now);
                sessionManager.broadcast(spaceId, envelope);
            }

        } else if ("room.ai.trivia".equalsIgnoreCase(event)) {
            envelope.setTs(now);
            sessionManager.broadcast(spaceId, envelope);

        } else if ("room.ai.ask".equalsIgnoreCase(event)) {
            AiQuestionRequest req = objectMapper.convertValue(envelope.getPayload(), AiQuestionRequest.class);
            try {
                User user = userRepository.findById(ctx.userId).orElse(null);
                AiAnswerResponse ans = aiCopilotService.askQuestion(UUID.fromString(spaceId), user, req);

                Map<String, Object> aiAnswerPayload = new HashMap<>();
                aiAnswerPayload.put("questionId", "q_" + UUID.randomUUID().toString().substring(0, 8));
                aiAnswerPayload.put("userId", ctx.userId.toString());
                aiAnswerPayload.put("displayName", ctx.displayName);
                aiAnswerPayload.put("question", req.getQuestion());
                aiAnswerPayload.put("answer", ans.getAnswer());
                aiAnswerPayload.put("sourceEvents", ans.getSourceEvents());
                aiAnswerPayload.put("latencyMs", ans.getLatencyMs());

                WsEnvelope answerEnv = WsEnvelope.builder()
                        .event("room.ai.answer")
                        .watchSpaceId(spaceId)
                        .payload(aiAnswerPayload)
                        .ts(now)
                        .build();
                sessionManager.broadcast(spaceId, answerEnv);
            } catch (Exception e) {
                log.error("Error processing AI question over WS: {}", e.getMessage());
            }
        }
        } finally {
            MDC.remove("correlationId");
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String correlationId = (String) session.getAttributes().get("correlationId");
        if (correlationId != null) MDC.put("correlationId", correlationId);
        try {
            String watchSpaceIdStr = extractWatchSpaceId(session);
        RoomSessionManager.SessionContext ctx = sessionManager.removeSession(watchSpaceIdStr, session.getId());

        if (ctx != null) {
            int count = sessionManager.getParticipantCount(watchSpaceIdStr);

            WsEnvelope presenceEnv = WsEnvelope.builder()
                    .event("room.presence.update")
                    .watchSpaceId(watchSpaceIdStr)
                    .payload(PresencePayload.builder()
                            .participantId(ctx.userId.toString())
                            .displayName(ctx.displayName)
                            .action("left")
                            .participantCount(count)
                            .build())
                    .ts(System.currentTimeMillis())
                    .build();
            sessionManager.broadcast(watchSpaceIdStr, presenceEnv);

            log.info("User {} disconnected from space {}, remaining: {}", ctx.displayName, watchSpaceIdStr, count);
        }
        } finally {
            MDC.remove("correlationId");
        }
    }

    private String extractWatchSpaceId(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri != null) {
            String path = uri.getPath();
            String[] segments = path.split("/");
            if (segments.length > 0) {
                return segments[segments.length - 1];
            }
        }
        return "";
    }

    private String extractToken(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri != null && uri.getQuery() != null) {
            for (String param : uri.getQuery().split("&")) {
                String[] pair = param.split("=");
                if (pair.length == 2 && "token".equalsIgnoreCase(pair[0])) {
                    return pair[1];
                }
            }
        }
        List<String> authHeaders = session.getHandshakeHeaders().get("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String header = authHeaders.get(0);
            if (header.startsWith("Bearer ")) {
                return header.substring(7);
            }
        }
        return null;
    }
}
