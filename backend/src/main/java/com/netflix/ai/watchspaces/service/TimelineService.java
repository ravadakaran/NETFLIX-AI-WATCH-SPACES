package com.netflix.ai.watchspaces.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.netflix.ai.watchspaces.dto.TitleDtos.*;
import com.netflix.ai.watchspaces.entity.TimelineEvent;
import com.netflix.ai.watchspaces.entity.Title;
import com.netflix.ai.watchspaces.entity.VariationOption;
import com.netflix.ai.watchspaces.repository.TimelineEventRepository;
import com.netflix.ai.watchspaces.repository.TitleRepository;
import com.netflix.ai.watchspaces.repository.VariationOptionRepository;
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
public class TimelineService {

    private final TimelineEventRepository timelineEventRepository;
    private final VariationOptionRepository variationOptionRepository;
    private final TitleRepository titleRepository;
    private final ObjectMapper objectMapper;

    private static final Set<String> SUPPORTED_EVENT_TYPES = new HashSet<>(Arrays.asList(
            "trivia", "character", "glossary", "variation_point", "variationpoint",
            "prediction", "prediction_point", "trivia_question"
    ));

    @Transactional(readOnly = true)
    public TimelineResponseDto getTimeline(UUID titleId, Integer from, Integer to) {
        Title title = titleRepository.findById(titleId)
                .orElseThrow(() -> new IllegalArgumentException("Title not found with id: " + titleId));

        List<TimelineEvent> events;
        if (from != null && to != null) {
            events = timelineEventRepository.findByTitleIdAndTsSecondsBetweenOrderByTsSecondsAsc(titleId, from, to);
        } else {
            events = timelineEventRepository.findAllWithVariationOptionsByTitleId(titleId);
        }

        List<TimelineEventDto> eventDtos = events.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return TimelineResponseDto.builder()
                .titleId(title.getId())
                .events(eventDtos)
                .build();
    }

    public ValidationResultDto validateTimeline(TimelineUploadDto uploadDto, Title title) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (uploadDto.getTitleId() == null || uploadDto.getTitleId().trim().isEmpty()) {
            errors.add("titleId is required");
        }
        if (uploadDto.getVersion() == null || uploadDto.getVersion().trim().isEmpty()) {
            errors.add("version is required");
        }
        if (uploadDto.getEvents() == null || uploadDto.getEvents().isEmpty()) {
            errors.add("events array must not be empty");
            return ValidationResultDto.builder()
                    .valid(false)
                    .totalEvents(0)
                    .errors(errors)
                    .warnings(warnings)
                    .build();
        }

        int index = 0;
        int maxDuration = title != null ? title.getDurationSeconds() : Integer.MAX_VALUE;

        for (UploadEventItemDto event : uploadDto.getEvents()) {
            index++;
            if (event.getTs() == null) {
                errors.add("Event #" + index + ": ts is required");
            } else if (event.getTs() < 0) {
                errors.add("Event #" + index + ": ts cannot be negative (" + event.getTs() + ")");
            } else if (event.getTs() > maxDuration) {
                errors.add("Event #" + index + ": ts (" + event.getTs() + "s) exceeds title duration (" + maxDuration + "s)");
            }

            if (event.getType() == null || event.getType().trim().isEmpty()) {
                errors.add("Event #" + index + ": type is required");
            } else {
                String normalizedType = event.getType().trim().toLowerCase().replace("-", "_");
                if (!SUPPORTED_EVENT_TYPES.contains(normalizedType)) {
                    errors.add("Event #" + index + ": unsupported event type '" + event.getType() + "'. Allowed: trivia, character, glossary, variation_point, prediction");
                } else if (normalizedType.equals("variation_point") || normalizedType.equals("variationpoint")
                        || normalizedType.equals("prediction") || normalizedType.equals("prediction_point")
                        || normalizedType.equals("trivia_question")) {
                    if (event.getOptions() == null || event.getOptions().size() < 2) {
                        errors.add("Event #" + index + " (" + normalizedType + "): requires at least 2 approved options");
                    }
                    if (event.getPayload() instanceof Map) {
                        Object correct = ((Map<?, ?>) event.getPayload()).get("correctOptionId");
                        if ((normalizedType.equals("prediction") || normalizedType.equals("prediction_point")
                                || normalizedType.equals("trivia_question")) && correct == null) {
                            errors.add("Event #" + index + " (" + normalizedType + "): payload.correctOptionId is required");
                        } else if (correct != null && event.getOptions() != null
                                && event.getOptions().stream().noneMatch(option -> correct.toString().equals(option.getId()))) {
                            errors.add("Event #" + index + " (" + normalizedType + "): correctOptionId must match an option id");
                        }
                    }
                }
            }
        }

        return ValidationResultDto.builder()
                .valid(errors.isEmpty())
        .totalEvents(uploadDto.getEvents().size())
                .errors(errors)
                .warnings(warnings)
                .build();
    }

    @Transactional
    public TimelineResponseDto uploadTimeline(UUID titleId, TimelineUploadDto uploadDto) {
        Title title = titleRepository.findById(titleId)
                .orElseThrow(() -> new IllegalArgumentException("Title not found with id: " + titleId));

        ValidationResultDto validation = validateTimeline(uploadDto, title);
        if (!validation.isValid()) {
            throw new IllegalArgumentException("Timeline validation failed: " + String.join("; ", validation.getErrors()));
        }

        // Delete existing events
        timelineEventRepository.deleteByTitleId(titleId);

        List<TimelineEvent> savedEvents = new ArrayList<>();
        for (UploadEventItemDto item : uploadDto.getEvents()) {
            String payloadJson = "{}";
            try {
                if (item.getPayload() != null) {
                    payloadJson = objectMapper.writeValueAsString(item.getPayload());
                }
            } catch (Exception e) {
                log.warn("Failed to serialize payload: {}", e.getMessage());
            }

            TimelineEvent event = TimelineEvent.builder()
                    .title(title)
                    .tsSeconds(item.getTs())
                    .eventType(item.getType().trim().toLowerCase().replace("-", "_"))
                    .payload(payloadJson)
                    .createdAt(Instant.now())
                    .build();

            event = timelineEventRepository.save(event);

            if (item.getOptions() != null && !item.getOptions().isEmpty()) {
                int optionOrder = 0;
                for (VariationOptionUploadDto opt : item.getOptions()) {
                    VariationOption vo = VariationOption.builder()
                            .timelineEvent(event)
                            .optionKey(opt.getId() != null && !opt.getId().trim().isEmpty()
                                    ? opt.getId() : "option-" + UUID.randomUUID())
                            .optionOrder(optionOrder++)
                            .label(opt.getLabel())
                            .assetRef(opt.getAssetRef())
                            .nextVariationId(opt.getNextVariationId())
                            .segmentStartSeconds(opt.getSegmentStartSeconds())
                            .segmentEndSeconds(opt.getSegmentEndSeconds())
                            .resumeSeconds(opt.getResumeSeconds())
                            .voteCount(0)
                            .build();
                    variationOptionRepository.save(vo);
                    event.getVariationOptions().add(vo);
                }
            }

            savedEvents.add(event);
        }

        return TimelineResponseDto.builder()
                .titleId(title.getId())
                .events(savedEvents.stream().map(this::mapToDto).collect(Collectors.toList()))
                .build();
    }

    public TimelineEventDto mapToDto(TimelineEvent event) {
        TimelineEventDto.TimelineEventDtoBuilder builder = TimelineEventDto.builder()
                .id(event.getId())
                .ts(event.getTsSeconds())
                .type(event.getEventType());

        try {
            JsonNode root = objectMapper.readTree(event.getPayload());
            if (root.has("text")) builder.text(root.get("text").asText());
            if (root.has("characterId")) builder.characterId(root.get("characterId").asText());
            if (root.has("term")) builder.term(root.get("term").asText());
            if (root.has("definition")) builder.definition(root.get("definition").asText());
            if (root.has("variationId")) builder.variationId(root.get("variationId").asText());
            builder.payload(objectMapper.readValue(event.getPayload(), Map.class));
        } catch (Exception e) {
            builder.payload(event.getPayload());
        }

        if (event.getVariationOptions() != null && !event.getVariationOptions().isEmpty()) {
            builder.options(event.getVariationOptions().stream()
                    .map(vo -> VariationOptionDto.builder()
                            .id(vo.getId())
                            .optionKey(vo.getOptionKey())
                            .label(vo.getLabel())
                            .assetRef(vo.getAssetRef())
                            .nextVariationId(vo.getNextVariationId())
                            .segmentStartSeconds(vo.getSegmentStartSeconds())
                            .segmentEndSeconds(vo.getSegmentEndSeconds())
                            .resumeSeconds(vo.getResumeSeconds())
                            .voteCount(vo.getVoteCount())
                            .build())
                    .collect(Collectors.toList()));
        }

        return builder.build();
    }
}
