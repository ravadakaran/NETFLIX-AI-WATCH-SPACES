package com.netflix.ai.watchspaces.controller;

import com.netflix.ai.watchspaces.dto.NarrativeDtos.ActionRequest;
import com.netflix.ai.watchspaces.dto.NarrativeDtos.DecisionDto;
import com.netflix.ai.watchspaces.dto.NarrativeDtos.PredictionGameDto;
import com.netflix.ai.watchspaces.dto.NarrativeDtos.ScoreDto;
import com.netflix.ai.watchspaces.dto.NarrativeDtos.StateDto;
import com.netflix.ai.watchspaces.security.UserPrincipal;
import com.netflix.ai.watchspaces.service.NarrativeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.List;

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

    @GetMapping("/branch-history")
    public ResponseEntity<List<DecisionDto>> getBranchHistory(@PathVariable UUID watchSpaceId,
                                                               @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(narrativeService.getBranchHistory(watchSpaceId, principal.getId()));
    }

    @GetMapping("/predictions")
    public ResponseEntity<PredictionGameDto> getPredictionGames(@PathVariable UUID watchSpaceId,
                                                                 @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(narrativeService.getPredictionGames(watchSpaceId, principal.getId()));
    }

    @GetMapping("/scores")
    public ResponseEntity<List<ScoreDto>> getScores(@PathVariable UUID watchSpaceId,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(narrativeService.getScores(watchSpaceId, principal.getId()));
    }

    @PostMapping("/actions")
    public ResponseEntity<StateDto> act(@PathVariable UUID watchSpaceId,
                                        @AuthenticationPrincipal UserPrincipal principal,
                                        @RequestBody ActionRequest request) {
        return ResponseEntity.ok(narrativeService.handleAction(watchSpaceId, principal.getId(), request));
    }
}
