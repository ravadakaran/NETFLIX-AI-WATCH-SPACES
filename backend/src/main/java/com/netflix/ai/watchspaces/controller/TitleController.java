package com.netflix.ai.watchspaces.controller;

import com.netflix.ai.watchspaces.dto.TitleDtos.CreateTitleDto;
import com.netflix.ai.watchspaces.dto.TitleDtos.TimelineResponseDto;
import com.netflix.ai.watchspaces.dto.TitleDtos.TitleSummaryDto;
import com.netflix.ai.watchspaces.service.TimelineService;
import com.netflix.ai.watchspaces.service.TitleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import javax.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/titles")
@RequiredArgsConstructor
public class TitleController {

    private final TitleService titleService;
    private final TimelineService timelineService;

    @GetMapping
    public ResponseEntity<List<TitleSummaryDto>> getAllTitles() {
        return ResponseEntity.ok(titleService.getAllTitles());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TitleSummaryDto> createTitle(@Valid @RequestBody CreateTitleDto dto) {
        return ResponseEntity.ok(titleService.createTitle(dto));
    }

    @GetMapping("/{titleId}")
    public ResponseEntity<TitleSummaryDto> getTitleById(@PathVariable UUID titleId) {
        return ResponseEntity.ok(titleService.getTitleById(titleId));
    }

    @GetMapping("/{titleId}/timeline")
    public ResponseEntity<TimelineResponseDto> getTimeline(
            @PathVariable UUID titleId,
            @RequestParam(required = false) Integer from,
            @RequestParam(required = false) Integer to) {
        return ResponseEntity.ok(timelineService.getTimeline(titleId, from, to));
    }
}
