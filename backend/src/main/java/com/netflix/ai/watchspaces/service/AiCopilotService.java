package com.netflix.ai.watchspaces.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.netflix.ai.watchspaces.dto.AiDtos.AiAnswerResponse;
import com.netflix.ai.watchspaces.dto.AiDtos.AiQuestionRequest;
import com.netflix.ai.watchspaces.entity.ChatMessage;
import com.netflix.ai.watchspaces.entity.TimelineEvent;
import com.netflix.ai.watchspaces.entity.User;
import com.netflix.ai.watchspaces.entity.WatchSpace;
import com.netflix.ai.watchspaces.repository.ChatMessageRepository;
import com.netflix.ai.watchspaces.repository.TimelineEventRepository;
import com.netflix.ai.watchspaces.repository.WatchSpaceRepository;
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
@SuppressWarnings({"null"})
public class AiCopilotService {

    private final WatchSpaceRepository watchSpaceRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public AiAnswerResponse askQuestion(UUID spaceId, User user, AiQuestionRequest request) {
        long startTime = System.currentTimeMillis();

        WatchSpace space = watchSpaceRepository.findById(spaceId)
                .orElseThrow(() -> new IllegalArgumentException("Watch Space not found with id: " + spaceId));

        int currentSec = request.getCurrentTs() != null ? (int) Math.round(request.getCurrentTs()) : 0;
        UUID titleId = space.getTitle().getId();

        // 1. Retrieve timeline entries up to current playback timestamp (or near it)
        List<TimelineEvent> pastAndCurrentEvents = timelineEventRepository
                .findByTitleIdAndTsSecondsLessThanEqualOrderByTsSecondsAsc(titleId, currentSec + 15);

        // 2. Perform grounded retrieval
        String userQuery = request.getQuestion().trim();
        List<TimelineEvent> matchedEvents = retrieveRelevantEvents(userQuery, pastAndCurrentEvents);

        List<String> sourceEventIds = new ArrayList<>();
        String answer;

        if (matchedEvents.isEmpty()) {
            if (pastAndCurrentEvents.isEmpty()) {
                answer = "I am tracking " + space.getTitle().getName() + " at " + formatTimestamp(currentSec) +
                        ". No scene metadata has been authored for this portion of the title yet.";
            } else {
                // Return context about recent scene/characters
                TimelineEvent latest = pastAndCurrentEvents.get(pastAndCurrentEvents.size() - 1);
                sourceEventIds.add("evt_" + latest.getId().toString().substring(0, 8));
                answer = "At timestamp " + formatTimestamp(currentSec) + " in " + space.getTitle().getName() +
                        ", the latest verified scene event was at " + formatTimestamp(latest.getTsSeconds()) +
                        ": " + extractSummary(latest) + ". I cannot verify facts outside the ingested title metadata.";
            }
        } else {
            sourceEventIds = matchedEvents.stream()
                    .map(e -> "evt_" + e.getId().toString().substring(0, 8))
                    .collect(Collectors.toList());

            answer = synthesizeGroundedAnswer(space.getTitle().getName(), userQuery, currentSec, matchedEvents);
        }

        long latencyMs = System.currentTimeMillis() - startTime;

        // Persist AI answer in chat messages
        ChatMessage aiMsg = ChatMessage.builder()
                .watchSpace(space)
                .user(user)
                .msgType("ai_answer")
                .body(answer)
                .tsSeconds(request.getCurrentTs())
                .createdAt(Instant.now())
                .build();
        chatMessageRepository.save(aiMsg);

        return AiAnswerResponse.builder()
                .answer(answer)
                .sourceEvents(sourceEventIds)
                .generatedAt(Instant.now())
                .latencyMs(latencyMs)
                .build();
    }

    private List<TimelineEvent> retrieveRelevantEvents(String query, List<TimelineEvent> candidates) {
        String lowerQuery = query.toLowerCase();
        List<TimelineEvent> relevant = new ArrayList<>();

        for (TimelineEvent event : candidates) {
            String payload = event.getPayload().toLowerCase();
            String type = event.getEventType().toLowerCase();

            // Match based on keywords, character mentions, glossary terms, or trivia
            if (lowerQuery.contains("who") && (type.contains("character") || payload.contains("character") || payload.contains("name"))) {
                relevant.add(event);
            } else if ((lowerQuery.contains("what") || lowerQuery.contains("mean") || lowerQuery.contains("explain")) &&
                    (type.contains("glossary") || payload.contains("term") || payload.contains("definition"))) {
                relevant.add(event);
            } else if (lowerQuery.contains("where") || lowerQuery.contains("location") || lowerQuery.contains("scene") || lowerQuery.contains("filmed")) {
                if (payload.contains("location") || payload.contains("film") || payload.contains("scene") || type.contains("trivia")) {
                    relevant.add(event);
                }
            } else {
                // General word overlap check
                String[] words = lowerQuery.split("\\W+");
                int matchCount = 0;
                for (String w : words) {
                    if (w.length() > 3 && payload.contains(w)) {
                        matchCount++;
                    }
                }
                if (matchCount > 0) {
                    relevant.add(event);
                }
            }
        }

        // If none specifically matched, pick the most recent 2 events before current timestamp
        if (relevant.isEmpty() && !candidates.isEmpty()) {
            int start = Math.max(0, candidates.size() - 2);
            relevant.addAll(candidates.subList(start, candidates.size()));
        }

        return relevant.stream().limit(4).collect(Collectors.toList());
    }

    private String synthesizeGroundedAnswer(String titleName, String query, int currentTs, List<TimelineEvent> matched) {
        StringBuilder sb = new StringBuilder();
        TimelineEvent primary = matched.get(0);
        String summary = extractSummary(primary);

        sb.append(summary);

        if (matched.size() > 1) {
            TimelineEvent secondary = matched.get(1);
            String secSummary = extractSummary(secondary);
            if (!secSummary.equals(summary)) {
                sb.append(" Additionally, at ").append(formatTimestamp(secondary.getTsSeconds()))
                        .append(": ").append(secSummary);
            }
        }

        return sb.toString();
    }

    private String extractSummary(TimelineEvent event) {
        try {
            JsonNode node = objectMapper.readTree(event.getPayload());
            if (node.has("text")) {
                return node.get("text").asText();
            }
            if (node.has("name") && node.has("description")) {
                return node.get("name").asText() + " (" + node.get("description").asText() + "), introduced at " + formatTimestamp(event.getTsSeconds()) + ".";
            }
            if (node.has("term") && node.has("definition")) {
                return node.get("term").asText() + ": " + node.get("definition").asText();
            }
            if (node.has("characterId") && node.has("name")) {
                return node.get("name").asText() + ", seen at " + formatTimestamp(event.getTsSeconds()) + ".";
            }
        } catch (Exception e) {
            log.warn("Failed to extract summary from payload", e);
        }
        return "Authored metadata event [" + event.getEventType() + "] at " + formatTimestamp(event.getTsSeconds()) + ".";
    }

    private String formatTimestamp(int seconds) {
        int m = seconds / 60;
        int s = seconds % 60;
        return String.format("%02d:%02d", m, s);
    }
}
