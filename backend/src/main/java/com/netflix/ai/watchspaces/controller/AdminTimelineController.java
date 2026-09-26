package com.netflix.ai.watchspaces.controller;

import com.netflix.ai.watchspaces.dto.TitleDtos.TimelineResponseDto;
import com.netflix.ai.watchspaces.dto.TitleDtos.TimelineUploadDto;
import com.netflix.ai.watchspaces.dto.TitleDtos.ValidationResultDto;
import com.netflix.ai.watchspaces.entity.Title;
import com.netflix.ai.watchspaces.service.TimelineService;
import com.netflix.ai.watchspaces.service.TitleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/titles/{titleId}/timeline")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminTimelineController {

    private final TimelineService timelineService;
    private final TitleService titleService;

    @PostMapping("/validate")
    public ResponseEntity<ValidationResultDto> validateTimeline(
            @PathVariable UUID titleId,
            @Valid @RequestBody TimelineUploadDto uploadDto) {
        Title title = titleService.getEntity(titleId);
        return ResponseEntity.ok(timelineService.validateTimeline(uploadDto, title));
    }

    @PostMapping
    public ResponseEntity<TimelineResponseDto> uploadTimeline(
            @PathVariable UUID titleId,
            @Valid @RequestBody TimelineUploadDto uploadDto) {
        return ResponseEntity.ok(timelineService.uploadTimeline(titleId, uploadDto));
    }
}
