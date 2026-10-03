package com.netflix.ai.watchspaces.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.netflix.ai.watchspaces.dto.NarrativeDtos.*;
import com.netflix.ai.watchspaces.dto.WsDtos.WsEnvelope;
import com.netflix.ai.watchspaces.entity.*;
import com.netflix.ai.watchspaces.repository.*;
import com.netflix.ai.watchspaces.websocket.RoomSessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Server-authoritative narrative state machine. A room gets one round per authored
 * timeline event; submissions and decisions are persisted so reconnects cannot
 * reset a branch or award points twice.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NarrativeService {

    private static final String OPEN = "OPEN";
    private static final String RESOLVED = "RESOLVED";
    private static final long VOTE_DURATION_SECONDS = 15;
    private static final long PREDICTION_DURATION_SECONDS = 20;
    private static final long PREDICTION_RESOLVE_GRACE_SECONDS = 5;

    private final WatchSpaceRepository watchSpaceRepository;
    private final UserRepository userRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final NarrativeRoundRepository roundRepository;
    private final NarrativeSubmissionRepository submissionRepository;
    private final NarrativeDecisionRepository decisionRepository;
    private final ObjectMapper objectMapper;
    private final RoomSessionManager sessionManager;

    @Transactional
    public StateDto getState(UUID watchSpaceId, UUID userId) {
        WatchSpace space = getSpace(watchSpaceId);
        resolveExpiredRounds(space);
        return buildState(space, userId);
    }

    @Transactional
    public synchronized StateDto handleAction(UUID watchSpaceId, UUID userId, ActionRequest request) {
        if (request == null || request.getAction() == null) {
            throw new IllegalArgumentException("Narrative action is required");
        }

        WatchSpace space = getSpace(watchSpaceId);
        User user = getUser(userId);
        resolveExpiredRounds(space);

        String action = request.getAction().trim().toLowerCase(Locale.ROOT);
        switch (action) {
            case "openvote":
                openRound(space, user, request, false);
                break;
            case "castvote":
                submit(space, user, request, false);
                break;
            case "resolvevote":
                resolveRequestedRound(space, user, request, false);
                break;
            case "openprediction":
                openRound(space, user, request, true);
                break;
            case "answerprediction":
                submit(space, user, request, true);
                break;
            case "resolveprediction":
                resolveRequestedRound(space, user, request, true);
                break;
            case "finishsegment":
                finishSegment(space, user, request);
                break;
            default:
                throw new IllegalArgumentException("Unsupported narrative action: " + request.getAction());
        }

        space.setNarrativeVersion((space.getNarrativeVersion() == null ? 0L : space.getNarrativeVersion()) + 1L);
        watchSpaceRepository.save(space);
        StateDto state = buildState(space, userId);
        broadcast(watchSpaceId, state);
        return state;
    }

    private void openRound(WatchSpace space, User user, ActionRequest request, boolean prediction) {
        requireHost(space, user);
        if (!prediction && !Boolean.TRUE.equals(space.getVotingEnabled())) {
            throw new IllegalStateException("Voting is disabled for this watch space");
        }
        TimelineEvent event = findEvent(space, request.getEventId());
        String kind = kindOf(event);
        if (prediction ? !isInteractivePredictionEvent(event) : !isVariation(kind)) {
            throw new IllegalArgumentException("Timeline event is not a " + (prediction ? "prediction" : "variation") + " card");
        }
        if (!isEligible(space, event)) {
            throw new IllegalStateException("This narrative branch is not currently available");
        }

        Optional<NarrativeRound> existing = roundRepository.findByWatchSpaceIdAndEventId(space.getId(), event.getId());
        if (existing.isPresent()) {
            if (OPEN.equals(existing.get().getStatus())) return;
            throw new IllegalStateException("This narrative card has already been resolved");
        }

        Instant now = Instant.now();
        long duration = prediction ? PREDICTION_DURATION_SECONDS : VOTE_DURATION_SECONDS;
        Instant closesAt = now.plusSeconds(duration);
        Instant resolvesAt = prediction ? closesAt.plusSeconds(PREDICTION_RESOLVE_GRACE_SECONDS) : closesAt;
        NarrativeRound round = NarrativeRound.builder()
                .watchSpace(space)
                .event(event)
                .kind(kind)
                .variationId(variationIdOf(event))
                .prompt(promptOf(event))
                .openedAt(now)
                .closesAt(closesAt)
                .resolvesAt(resolvesAt)
                .status(OPEN)
                .build();
        roundRepository.save(round);
    }

    private void submit(WatchSpace space, User user, ActionRequest request, boolean prediction) {
        NarrativeRound round = findOpenRound(space, request.getEventId(), prediction);
        Instant now = Instant.now();
        if (!now.isBefore(round.getClosesAt())) {
            throw new IllegalStateException("This card is no longer accepting answers");
        }
        if (submissionRepository.findByRoundIdAndUserId(round.getId(), user.getId()).isPresent()) {
            throw new IllegalStateException("You have already answered this card");
        }
        VariationOption option = findOption(round.getEvent(), request.getOptionId());
        NarrativeSubmission submission = NarrativeSubmission.builder()
                .round(round)
                .watchSpace(space)
                .user(user)
                .optionKey(optionKey(option))
                .submittedAt(now)
                .points(0)
                .correct(false)
                .build();
        submissionRepository.save(submission);
    }

    private void resolveRequestedRound(WatchSpace space, User user, ActionRequest request, boolean prediction) {
        requireHost(space, user);
        NarrativeRound round = findOpenRound(space, request.getEventId(), prediction);
        resolveRound(space, round);
    }

    private void resolveExpiredRounds(WatchSpace space) {
        Instant now = Instant.now();
        List<NarrativeRound> openRounds = roundRepository.findByWatchSpaceIdAndStatus(space.getId(), OPEN);
        boolean changed = false;
        for (NarrativeRound round : openRounds) {
            boolean due = isPrediction(round.getKind())
                    ? !now.isBefore(round.getResolvesAt())
                    : !now.isBefore(round.getClosesAt());
            if (due) {
                resolveRound(space, round);
                changed = true;
            }
        }
        if (changed) {
            space.setNarrativeVersion((space.getNarrativeVersion() == null ? 0L : space.getNarrativeVersion()) + 1L);
            watchSpaceRepository.save(space);
        }
    }

    private void resolveRound(WatchSpace space, NarrativeRound round) {
        if (!OPEN.equals(round.getStatus())) return;

        List<VariationOption> options = round.getEvent().getVariationOptions() == null
                ? Collections.emptyList() : round.getEvent().getVariationOptions();
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (VariationOption option : options) counts.put(optionKey(option), 0);
        for (NarrativeSubmission submission : submissionRepository.findByRoundId(round.getId())) {
            counts.put(submission.getOptionKey(), counts.getOrDefault(submission.getOptionKey(), 0) + 1);
        }

        // A tie always goes to the first authored option, never to UUID ordering.
        VariationOption selected = null;
        int highest = -1;
        selected = null;
        for (VariationOption option : options) {
            int count = counts.getOrDefault(optionKey(option), 0);
            if (count > highest) {
                highest = count;
                selected = option;
            }
        }
        if (selected == null) {
            round.setStatus(RESOLVED);
            round.setResolvedAt(Instant.now());
            roundRepository.save(round);
            return;
        }

        String kind = round.getKind();
        if (isPrediction(kind)) {
            String correctKey = correctOptionKey(round.getEvent());
            round.setCorrectOptionKey(correctKey);
            for (NarrativeSubmission submission : submissionRepository.findByRoundId(round.getId())) {
                boolean correct = correctKey != null && correctKey.equals(submission.getOptionKey());
                submission.setCorrect(correct);
                submission.setPoints(correct ? 100 : 0);
                submissionRepository.save(submission);
            }
        } else {
            Map<String, Integer> voteMap = counts;
            NarrativeDecision decision = NarrativeDecision.builder()
                    .watchSpace(space)
                    .round(round)
                    .eventId(round.getEvent().getId())
                    .variationId(round.getVariationId())
                    .prompt(round.getPrompt())
                    .optionKey(optionKey(selected))
                    .label(selected.getLabel())
                    .assetRef(selected.getAssetRef())
                    .nextVariationId(selected.getNextVariationId())
                    .votesJson(writeJson(voteMap))
                    .sequenceNumber(decisionRepository.findByWatchSpaceIdOrderBySequenceNumberAsc(space.getId()).size() + 1)
                    .decidedAt(Instant.now())
                    .build();
            decisionRepository.save(decision);
            activateSegment(space, decision, selected);
        }

        round.setStatus(RESOLVED);
        round.setResolvedAt(Instant.now());
        roundRepository.save(round);
    }

    private void activateSegment(WatchSpace space, NarrativeDecision decision, VariationOption option) {
        if (!isAbsoluteUrl(option.getAssetRef())) {
            return;
        }
        space.setNarrativeBaseResumeSeconds(space.getPositionSeconds());
        space.setActiveSegmentDecisionId(decision.getId());
        space.setActiveSegmentUrl(option.getAssetRef());
        space.setActiveSegmentStartSeconds(option.getSegmentStartSeconds() == null ? 0 : option.getSegmentStartSeconds());
        space.setActiveSegmentEndSeconds(option.getSegmentEndSeconds());
        space.setActiveSegmentResumeSeconds(option.getResumeSeconds());
        space.setActiveSegmentStartedAt(Instant.now());
    }

    private void finishSegment(WatchSpace space, User user, ActionRequest request) {
        requireHost(space, user);
        if (space.getActiveSegmentDecisionId() == null) return;
        if (request.getDecisionId() != null
                && !space.getActiveSegmentDecisionId().toString().equals(request.getDecisionId())) {
            throw new IllegalArgumentException("The requested segment is not active");
        }
        Double resume = space.getActiveSegmentResumeSeconds() == null
                ? space.getNarrativeBaseResumeSeconds() : space.getActiveSegmentResumeSeconds().doubleValue();
        space.setActiveSegmentDecisionId(null);
        space.setActiveSegmentUrl(null);
        space.setActiveSegmentStartSeconds(null);
        space.setActiveSegmentEndSeconds(null);
        space.setActiveSegmentResumeSeconds(null);
        space.setActiveSegmentStartedAt(null);
        space.setNarrativeBaseResumeSeconds(resume);
    }

    private StateDto buildState(WatchSpace space, UUID userId) {
        List<TimelineEvent> events = timelineEventRepository.findAllWithVariationOptionsByTitleId(space.getTitle().getId());
        List<NarrativeDecision> decisions = decisionRepository.findByWatchSpaceIdOrderBySequenceNumberAsc(space.getId());
        Set<UUID> decidedEvents = decisions.stream().map(NarrativeDecision::getEventId).collect(Collectors.toSet());
        Map<UUID, NarrativeRound> rounds = roundRepository.findByWatchSpaceIdOrderByOpenedAtAsc(space.getId()).stream()
                .collect(Collectors.toMap(r -> r.getEvent().getId(), Function.identity(), (a, b) -> b, LinkedHashMap::new));

        List<CardDto> votes = new ArrayList<>();
        List<CardDto> predictions = new ArrayList<>();
        for (TimelineEvent event : events) {
            String kind = kindOf(event);
            if (isVariation(kind) && !decidedEvents.contains(event.getId()) && isEligible(space, event)
                    && !hasOpenRound(rounds.get(event.getId()))) {
                votes.add(card(event, kind));
            } else if (isInteractivePredictionEvent(event) && !isResolved(rounds.get(event.getId()))
                    && !hasOpenRound(rounds.get(event.getId()))) {
                predictions.add(card(event, kind));
            }
        }

        NarrativeRound activeVote = rounds.values().stream()
                .filter(r -> OPEN.equals(r.getStatus()) && isVariation(r.getKind()))
                .findFirst().orElse(null);
        NarrativeRound activePrediction = rounds.values().stream()
                .filter(r -> OPEN.equals(r.getStatus()) && isPrediction(r.getKind()))
                .findFirst().orElse(null);

        return StateDto.builder()
                .version(space.getNarrativeVersion() == null ? 0L : space.getNarrativeVersion())
                .availableVotes(votes)
                .availablePredictions(predictions)
                .activeVote(round(activeVote, userId))
                .activePrediction(round(activePrediction, userId))
                .history(decisions.stream().map(this::decision).collect(Collectors.toList()))
                .completedPredictions(completedPredictions(rounds.values()))
                .leaderboard(leaderboard(space.getId()))
                .activeSegment(segment(space))
                .baseResumeSeconds(space.getNarrativeBaseResumeSeconds())
                .build();
    }

    private List<PredictionResultDto> completedPredictions(Collection<NarrativeRound> rounds) {
        return rounds.stream()
                .filter(r -> isPrediction(r.getKind()) && RESOLVED.equals(r.getStatus()))
                .map(r -> {
                    VariationOption option = findOptionByKey(r.getEvent(), r.getCorrectOptionKey());
                    return PredictionResultDto.builder()
                            .eventId(r.getEvent().getId().toString())
                            .prompt(r.getPrompt())
                            .kind(r.getKind())
                            .correctOptionId(r.getCorrectOptionKey())
                            .correctLabel(option == null ? "" : option.getLabel())
                            .resolvedAt(r.getResolvedAt() == null ? null : r.getResolvedAt().toEpochMilli())
                            .build();
                }).collect(Collectors.toList());
    }

    private List<ScoreDto> leaderboard(UUID spaceId) {
        Map<UUID, List<NarrativeSubmission>> byUser = submissionRepository.findByRoundWatchSpaceId(spaceId).stream()
                .collect(Collectors.groupingBy(s -> s.getUser().getId(), LinkedHashMap::new, Collectors.toList()));
        return byUser.values().stream().map(items -> {
            User user = items.get(0).getUser();
            int points = items.stream().mapToInt(s -> s.getPoints() == null ? 0 : s.getPoints()).sum();
            int correct = (int) items.stream().filter(s -> Boolean.TRUE.equals(s.getCorrect())).count();
            int answered = items.size();
            double accuracy = answered == 0 ? 0.0 : ((double) correct / answered);
            List<String> badges = new ArrayList<>();
            if (correct >= 3) badges.add("prediction-oracle");
            if (answered >= 5 && accuracy >= 0.8) badges.add("sharp-eyed");
            if (points >= 500) badges.add("story-scholar");
            return ScoreDto.builder().userId(user.getId().toString()).displayName(user.getDisplayName())
                    .points(points).correct(correct).answered(answered).accuracy(accuracy).badges(badges).build();
        }).sorted(Comparator.comparing(ScoreDto::getPoints, Comparator.reverseOrder())
                .thenComparing(ScoreDto::getDisplayName)).collect(Collectors.toList());
    }

    private RoundDto round(NarrativeRound round, UUID userId) {
        if (round == null) return null;
        Map<String, Integer> counts = submissionRepository.findByRoundId(round.getId()).stream()
                .collect(Collectors.groupingBy(NarrativeSubmission::getOptionKey, LinkedHashMap::new, Collectors.summingInt(s -> 1)));
        String mine = userId == null ? null : submissionRepository.findByRoundIdAndUserId(round.getId(), userId)
                .map(NarrativeSubmission::getOptionKey).orElse(null);
        List<ChoiceDto> options = round.getEvent().getVariationOptions().stream().map(option -> choice(option, counts.getOrDefault(optionKey(option), 0))).collect(Collectors.toList());
        return RoundDto.builder().eventId(round.getEvent().getId().toString()).variationId(round.getVariationId())
                .prompt(round.getPrompt()).kind(round.getKind()).ts(round.getEvent().getTsSeconds())
                .options(options).closesAt(round.getClosesAt().toEpochMilli()).myOptionId(mine).build();
    }

    private CardDto card(TimelineEvent event, String kind) {
        List<ChoiceDto> options = event.getVariationOptions().stream().map(option -> choice(option, 0)).collect(Collectors.toList());
        return CardDto.builder().eventId(event.getId().toString()).variationId(variationIdOf(event))
                .prompt(promptOf(event)).kind(kind).ts(event.getTsSeconds()).options(options).build();
    }

    private ChoiceDto choice(VariationOption option, int count) {
        return ChoiceDto.builder().id(optionKey(option)).label(option.getLabel()).assetRef(option.getAssetRef())
                .nextVariationId(option.getNextVariationId()).segmentStartSeconds(option.getSegmentStartSeconds())
                .segmentEndSeconds(option.getSegmentEndSeconds()).resumeSeconds(option.getResumeSeconds()).voteCount(count).build();
    }

    private DecisionDto decision(NarrativeDecision decision) {
        return DecisionDto.builder().id(decision.getId().toString()).eventId(decision.getEventId().toString())
                .variationId(decision.getVariationId()).prompt(decision.getPrompt()).optionId(decision.getOptionKey())
                .label(decision.getLabel()).assetRef(decision.getAssetRef()).nextVariationId(decision.getNextVariationId())
                .votes(readVotes(decision.getVotesJson())).decidedAt(decision.getDecidedAt().toEpochMilli())
                .sequence(decision.getSequenceNumber()).build();
    }

    private SegmentDto segment(WatchSpace space) {
        if (space.getActiveSegmentDecisionId() == null || space.getActiveSegmentUrl() == null) return null;
        return SegmentDto.builder().decisionId(space.getActiveSegmentDecisionId().toString()).url(space.getActiveSegmentUrl())
                .startSeconds(space.getActiveSegmentStartSeconds()).endSeconds(space.getActiveSegmentEndSeconds())
                .resumeSeconds(space.getActiveSegmentResumeSeconds()).startedAt(space.getActiveSegmentStartedAt() == null ? null : space.getActiveSegmentStartedAt().toEpochMilli()).build();
    }

    private boolean isEligible(WatchSpace space, TimelineEvent event) {
        String parent = textPayload(event, "parentVariationId");
        if (parent == null || parent.trim().isEmpty()) return true;
        return decisionRepository.findByWatchSpaceIdOrderBySequenceNumberAsc(space.getId()).stream()
                .anyMatch(d -> parent.equals(d.getNextVariationId()));
    }

    private NarrativeRound findOpenRound(WatchSpace space, String eventId, boolean prediction) {
        if (eventId == null) throw new IllegalArgumentException("eventId is required");
        NarrativeRound round = roundRepository.findByWatchSpaceIdAndEventId(space.getId(), parseUuid(eventId))
                .orElseThrow(() -> new IllegalStateException("No active narrative card for this event"));
        if (!OPEN.equals(round.getStatus()) || (prediction != isPrediction(round.getKind()))) {
            throw new IllegalStateException("No active " + (prediction ? "prediction" : "vote") + " for this event");
        }
        return round;
    }

    private TimelineEvent findEvent(WatchSpace space, String eventId) {
        UUID id = parseUuid(eventId);
        return timelineEventRepository.findById(id)
                .filter(event -> event.getTitle().getId().equals(space.getTitle().getId()))
                .orElseThrow(() -> new IllegalArgumentException("Narrative event not found"));
    }

    private VariationOption findOption(TimelineEvent event, String id) {
        if (id == null) throw new IllegalArgumentException("optionId is required");
        VariationOption option = findOptionByKey(event, id);
        if (option == null) {
            try {
                UUID uuid = UUID.fromString(id);
                option = event.getVariationOptions().stream().filter(o -> uuid.equals(o.getId())).findFirst().orElse(null);
            } catch (IllegalArgumentException ignored) {
                // The authored option key is the preferred wire identifier.
            }
        }
        if (option == null) throw new IllegalArgumentException("Narrative option not found");
        return option;
    }

    private VariationOption findOptionByKey(TimelineEvent event, String key) {
        if (key == null || event == null || event.getVariationOptions() == null) return null;
        return event.getVariationOptions().stream().filter(o -> key.equals(optionKey(o))).findFirst().orElse(null);
    }

    private void requireHost(WatchSpace space, User user) {
        if (space.getHostUser() == null || !space.getHostUser().getId().equals(user.getId())) {
            throw new SecurityException("Only the watch-space host can perform this action");
        }
    }

    private WatchSpace getSpace(UUID id) {
        return watchSpaceRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Watch space not found"));
    }

    private User getUser(UUID id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private UUID parseUuid(String id) {
        if (id == null) throw new IllegalArgumentException("eventId is required");
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Narrative identifiers must be UUIDs");
        }
    }

    private String kindOf(TimelineEvent event) {
        String type = event.getEventType() == null ? "" : event.getEventType().toLowerCase(Locale.ROOT);
        if (isVariation(type)) return "variation";
        if (isPrediction(type)) return type.equals("trivia_question") ? "trivia" : "prediction";
        return type;
    }

    private boolean isVariation(String kind) {
        return "variation_point".equals(kind) || "variationpoint".equals(kind) || "variation".equals(kind);
    }

    private boolean isPrediction(String kind) {
        return "prediction".equals(kind) || "trivia".equals(kind);
    }

    private boolean isInteractivePredictionEvent(TimelineEvent event) {
        String type = event.getEventType() == null ? "" : event.getEventType().toLowerCase(Locale.ROOT);
        return "prediction".equals(type) || "prediction_point".equals(type) || "trivia_question".equals(type);
    }

    private boolean hasOpenRound(NarrativeRound round) {
        return round != null && OPEN.equals(round.getStatus());
    }

    private boolean isResolved(NarrativeRound round) {
        return round != null && RESOLVED.equals(round.getStatus());
    }

    private String optionKey(VariationOption option) {
        return option.getOptionKey() == null || option.getOptionKey().trim().isEmpty()
                ? option.getId().toString() : option.getOptionKey();
    }

    private String variationIdOf(TimelineEvent event) {
        String id = textPayload(event, "variationId");
        return id == null ? event.getId().toString() : id;
    }

    private String promptOf(TimelineEvent event) {
        String prompt = textPayload(event, "prompt");
        if (prompt == null) prompt = textPayload(event, "question");
        if (prompt == null) prompt = textPayload(event, "text");
        return prompt == null ? "Choose the next narrative outcome" : prompt;
    }

    private String correctOptionKey(TimelineEvent event) {
        return textPayload(event, "correctOptionId");
    }

    private String textPayload(TimelineEvent event, String key) {
        try {
            JsonNode node = objectMapper.readTree(event.getPayload());
            JsonNode value = node == null ? null : node.get(key);
            return value == null || value.isNull() ? null : value.asText();
        } catch (Exception e) {
            return null;
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return "{}";
        }
    }

    private Map<String, Integer> readVotes(String value) {
        try {
            return objectMapper.readValue(value == null ? "{}" : value, new TypeReference<Map<String, Integer>>() { });
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    private boolean isAbsoluteUrl(String value) {
        if (value == null || value.trim().isEmpty()) return false;
        try {
            URI uri = URI.create(value);
            return "http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme());
        } catch (Exception e) {
            return false;
        }
    }

    private void broadcast(UUID spaceId, StateDto state) {
        sessionManager.broadcast(spaceId.toString(), WsEnvelope.builder().event("room.narrative.state")
                .watchSpaceId(spaceId.toString()).payload(state).ts(System.currentTimeMillis()).build());
    }
}
