package com.netflix.ai.watchspaces.controller;

import com.netflix.ai.watchspaces.dto.WatchSpaceDtos.*;
import com.netflix.ai.watchspaces.entity.User;
import com.netflix.ai.watchspaces.repository.UserRepository;
import com.netflix.ai.watchspaces.security.UserPrincipal;
import com.netflix.ai.watchspaces.service.WatchSpaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/watch-spaces")
@RequiredArgsConstructor
@SuppressWarnings({"null"})
public class WatchSpaceController {

    private final WatchSpaceService watchSpaceService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<WatchSpaceDto> createWatchSpace(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateWatchSpaceRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(watchSpaceService.createWatchSpace(user, request));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<WatchSpaceDto> joinWatchSpaceById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(watchSpaceService.joinWatchSpace(user, id, null));
    }

    @PostMapping("/join")
    public ResponseEntity<WatchSpaceDto> joinWatchSpaceByCode(
            @Valid @RequestBody JoinSpaceRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(watchSpaceService.joinWatchSpace(user, null, request.getInviteCode()));
    }

    @GetMapping("/me")
    public ResponseEntity<List<WatchSpaceDto>> getMySpaces(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(watchSpaceService.getUserSpaces(principal.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WatchSpaceDto> getWatchSpace(@PathVariable UUID id) {
        return ResponseEntity.ok(watchSpaceService.getWatchSpace(id));
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<WatchSpaceDto> endWatchSpace(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(watchSpaceService.endWatchSpace(user, id));
    }

    @GetMapping("/{id}/analytics")
    public ResponseEntity<AnalyticsDto> getAnalytics(@PathVariable UUID id) {
        return ResponseEntity.ok(watchSpaceService.getAnalytics(id));
    }

    @GetMapping
    public ResponseEntity<List<WatchSpaceDto>> getActiveSpaces() {
        return ResponseEntity.ok(watchSpaceService.getActiveSpaces());
    }
}
