package com.netflix.ai.watchspaces.controller;

import com.netflix.ai.watchspaces.entity.User;
import com.netflix.ai.watchspaces.repository.UserRepository;
import com.netflix.ai.watchspaces.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
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
    @Transactional(readOnly = true)
    public ResponseEntity<?> getFriends(@AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
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
    @Transactional
    public ResponseEntity<?> addFriend(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID friendId) {
        if (principal.getId().equals(friendId)) {
            throw new IllegalArgumentException("Cannot add yourself as a friend");
        }
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("Friend not found"));

        if (!user.getFriends().contains(friend)) {
            user.getFriends().add(friend);
            userRepository.save(user);
        }
        return ResponseEntity.ok(Map.of("message", "Friend added successfully"));
    }

    @DeleteMapping("/me/friends/{friendId}")
    @Transactional
    public ResponseEntity<?> removeFriend(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID friendId) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("Friend not found"));

        user.getFriends().remove(friend);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Friend removed successfully"));
    }

    @PutMapping("/me/presence")
    @Transactional
    public ResponseEntity<?> updatePresence(@AuthenticationPrincipal UserPrincipal principal, @RequestBody Map<String, String> payload) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String status = (payload != null && payload.containsKey("presenceStatus")) ? payload.get("presenceStatus") : "Online";
        user.setPresenceStatus(status);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Presence updated successfully"));
    }
}
