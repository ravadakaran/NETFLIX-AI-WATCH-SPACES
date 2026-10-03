package com.netflix.ai.watchspaces.controller;

import com.netflix.ai.watchspaces.dto.NarrativeDtos.ActionRequest;
import com.netflix.ai.watchspaces.dto.NarrativeDtos.StateDto;
import com.netflix.ai.watchspaces.security.UserPrincipal;
import com.netflix.ai.watchspaces.service.NarrativeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/watch-spaces/{watchSpaceId}/narrative")
@RequiredArgsConstructor
public class NarrativeController {

    private final NarrativeService narrativeService;

    @GetMapping
    public ResponseEntity<StateDto> getState(@PathVariable UUID watchSpaceId,
                                             @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(narrativeService.getState(watchSpaceId, principal.getId()));
    }

    @PostMapping("/actions")
    public ResponseEntity<StateDto> act(@PathVariable UUID watchSpaceId,
                                        @AuthenticationPrincipal UserPrincipal principal,
                                        @RequestBody ActionRequest request) {
        return ResponseEntity.ok(narrativeService.handleAction(watchSpaceId, principal.getId(), request));
    }
}
