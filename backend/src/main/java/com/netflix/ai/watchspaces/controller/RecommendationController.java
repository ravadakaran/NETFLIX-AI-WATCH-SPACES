package com.netflix.ai.watchspaces.controller;

import com.netflix.ai.watchspaces.dto.RecommendationDtos.HistoryItemDto;
import com.netflix.ai.watchspaces.dto.RecommendationDtos.RecommendationResponseDto;
import com.netflix.ai.watchspaces.dto.RecommendationDtos.RecordInteractionRequest;
import com.netflix.ai.watchspaces.entity.User;
import com.netflix.ai.watchspaces.repository.UserRepository;
import com.netflix.ai.watchspaces.security.UserPrincipal;
import com.netflix.ai.watchspaces.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequiredArgsConstructor
@SuppressWarnings({"null"})
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserRepository userRepository;

    @GetMapping("/api/v1/users/me/recommendations")
    public ResponseEntity<RecommendationResponseDto> getRecommendations(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(recommendationService.getRecommendations(principal.getId()));
    }

    @GetMapping("/api/v1/users/me/history")
    public ResponseEntity<List<HistoryItemDto>> getHistory(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(recommendationService.getWatchHistory(principal.getId()));
    }

    @PostMapping("/api/v1/interactions")
    public ResponseEntity<Void> recordInteraction(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RecordInteractionRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        recommendationService.recordInteraction(user, request);
        return ResponseEntity.ok().build();
    }
}
