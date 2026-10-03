package com.netflix.ai.watchspaces;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.netflix.ai.watchspaces.dto.TitleDtos.TimelineUploadDto;
import com.netflix.ai.watchspaces.dto.TitleDtos.UploadEventItemDto;
import com.netflix.ai.watchspaces.dto.TitleDtos.ValidationResultDto;
import com.netflix.ai.watchspaces.dto.TitleDtos.VariationOptionUploadDto;
import com.netflix.ai.watchspaces.entity.Title;
import com.netflix.ai.watchspaces.repository.TimelineEventRepository;
import com.netflix.ai.watchspaces.repository.TitleRepository;
import com.netflix.ai.watchspaces.repository.VariationOptionRepository;
import com.netflix.ai.watchspaces.service.TimelineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class TimelineValidationTest {

    @Mock
    private TimelineEventRepository timelineEventRepository;

    @Mock
    private VariationOptionRepository variationOptionRepository;

    @Mock
    private TitleRepository titleRepository;

    private TimelineService timelineService;
    private Title testTitle;

    @BeforeEach
    void setUp() {
        timelineService = new TimelineService(timelineEventRepository, variationOptionRepository, titleRepository, new ObjectMapper());
        testTitle = Title.builder()
                .id(UUID.randomUUID())
                .name("Test SciFi Film")
                .durationSeconds(600)
                .videoAssetUrl("http://example.com/video.mp4")
                .createdAt(Instant.now())
                .build();
    }

    @Test
    void testValidateValidTimeline() {
        UploadEventItemDto ev1 = new UploadEventItemDto(100, "trivia", Collections.singletonMap("text", "Fact"), null);
        UploadEventItemDto ev2 = new UploadEventItemDto(200, "character", Collections.singletonMap("name", "John"), null);

        List<VariationOptionUploadDto> options = Arrays.asList(
                new VariationOptionUploadDto("a", "Option A", "refA"),
                new VariationOptionUploadDto("b", "Option B", "refB")
        );
        UploadEventItemDto ev3 = new UploadEventItemDto(300, "variation_point", null, options);

        TimelineUploadDto dto = new TimelineUploadDto("title_1", "1.0", Arrays.asList(ev1, ev2, ev3));

        ValidationResultDto result = timelineService.validateTimeline(dto, testTitle);

        assertTrue(result.isValid());
        assertEquals(3, result.getTotalEvents());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    void testValidateRejectsNegativeTimestampAndExceededDuration() {
        UploadEventItemDto evNeg = new UploadEventItemDto(-5, "trivia", null, null);
        UploadEventItemDto evOver = new UploadEventItemDto(99999, "trivia", null, null);

        TimelineUploadDto dto = new TimelineUploadDto("title_1", "1.0", Arrays.asList(evNeg, evOver));
        ValidationResultDto result = timelineService.validateTimeline(dto, testTitle);

        assertFalse(result.isValid());
        assertEquals(2, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("negative"));
        assertTrue(result.getErrors().get(1).contains("exceeds title duration"));
    }

    @Test
    void testValidatePredictionRequiresCorrectOption() {
        UploadEventItemDto prediction = new UploadEventItemDto(150, "prediction", Collections.singletonMap("question", "Will Rios survive?"), Arrays.asList(
                new VariationOptionUploadDto("yes", "Yes", "https://cdn.example/yes.mp4"),
                new VariationOptionUploadDto("no", "No", "https://cdn.example/no.mp4")
        ));

        TimelineUploadDto dto = new TimelineUploadDto("title_1", "2.0", Collections.singletonList(prediction));
        ValidationResultDto result = timelineService.validateTimeline(dto, testTitle);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().get(0).contains("correctOptionId"));
    }

    @Test
    void testValidateAcceptsDecisionTreeMetadata() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("variationId", "branch-root");
        payload.put("prompt", "Choose a route");
        List<VariationOptionUploadDto> options = Arrays.asList(
                new VariationOptionUploadDto("stealth", "Stealth", "https://cdn.example/stealth.m3u8", "branch-stealth", 0, 20, 200),
                new VariationOptionUploadDto("loud", "Loud", "https://cdn.example/loud.m3u8", "branch-loud", 0, 20, 200)
        );

        ValidationResultDto result = timelineService.validateTimeline(
                new TimelineUploadDto("title_1", "2.0", Collections.singletonList(
                        new UploadEventItemDto(150, "variation_point", payload, options))), testTitle);

        assertTrue(result.isValid());
    }

    @Test
    void testValidateRejectsVariationPointWithLessThanTwoOptions() {
        UploadEventItemDto evVar = new UploadEventItemDto(150, "variation_point", null, Collections.singletonList(
                new VariationOptionUploadDto("a", "Only One Option", "refA")
        ));

        TimelineUploadDto dto = new TimelineUploadDto("title_1", "1.0", Collections.singletonList(evVar));
        ValidationResultDto result = timelineService.validateTimeline(dto, testTitle);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().get(0).contains("requires at least 2 approved options"));
    }
}
