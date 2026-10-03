package com.netflix.ai.watchspaces.controller;

import com.netflix.ai.watchspaces.entity.User;
import com.netflix.ai.watchspaces.repository.UserRepository;
import com.netflix.ai.watchspaces.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me/friends")
    public ResponseEntity<?> getFriends(@AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        List<Map<String, Object>> friendsList = user.getFriends().stream().map(friend -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", friend.getId());
            map.put("displayName", friend.getDisplayName());
            map.put("presenceStatus", friend.getPresenceStatus() == null ? "Offline" : friend.getPresenceStatus());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(friendsList);
    }

    @PostMapping("/me/friends/{friendId}")
    public ResponseEntity<?> addFriend(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID friendId) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        User friend = userRepository.findById(friendId).orElseThrow(() -> new IllegalArgumentException("Friend not found"));
        user.getFriends().add(friend);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Friend added successfully"));
    }

    @DeleteMapping("/me/friends/{friendId}")
    public ResponseEntity<?> removeFriend(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID friendId) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        User friend = userRepository.findById(friendId).orElseThrow(() -> new IllegalArgumentException("Friend not found"));
        user.getFriends().remove(friend);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Friend removed successfully"));
    }

    @PutMapping("/me/presence")
    public ResponseEntity<?> updatePresence(@AuthenticationPrincipal UserPrincipal principal, @RequestBody Map<String, String> payload) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        user.setPresenceStatus(payload.get("presenceStatus"));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Presence updated successfully"));
    }
}
