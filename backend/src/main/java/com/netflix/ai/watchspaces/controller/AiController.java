package com.netflix.ai.watchspaces.controller;

import com.netflix.ai.watchspaces.dto.AiDtos.AiAnswerResponse;
import com.netflix.ai.watchspaces.dto.AiDtos.AiQuestionRequest;
import com.netflix.ai.watchspaces.entity.User;
import com.netflix.ai.watchspaces.repository.UserRepository;
import com.netflix.ai.watchspaces.security.UserPrincipal;
import com.netflix.ai.watchspaces.service.AiCopilotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/watch-spaces/{id}/ai")
@RequiredArgsConstructor
@SuppressWarnings({"null"})
public class AiController {

    private final AiCopilotService aiCopilotService;
    private final UserRepository userRepository;

    @PostMapping("/ask")
    public ResponseEntity<AiAnswerResponse> askQuestion(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AiQuestionRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(aiCopilotService.askQuestion(id, user, request));
    }
}
