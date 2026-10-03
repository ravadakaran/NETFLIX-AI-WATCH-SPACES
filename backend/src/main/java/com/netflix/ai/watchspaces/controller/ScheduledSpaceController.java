package com.netflix.ai.watchspaces.controller;

import com.netflix.ai.watchspaces.entity.ScheduledSpace;
import com.netflix.ai.watchspaces.entity.Title;
import com.netflix.ai.watchspaces.entity.User;
import com.netflix.ai.watchspaces.repository.ScheduledSpaceRepository;
import com.netflix.ai.watchspaces.repository.TitleRepository;
import com.netflix.ai.watchspaces.repository.UserRepository;
import com.netflix.ai.watchspaces.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/scheduled-spaces")
@RequiredArgsConstructor
public class ScheduledSpaceController {

    private final ScheduledSpaceRepository scheduledSpaceRepository;
    private final UserRepository userRepository;
    private final TitleRepository titleRepository;

    @GetMapping
    public ResponseEntity<List<ScheduledSpace>> getMyScheduledSpaces(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(scheduledSpaceRepository.findByHostUserId(principal.getId()));
    }

    @PostMapping
    public ResponseEntity<ScheduledSpace> createScheduledSpace(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> payload) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        Title title = titleRepository.findById(UUID.fromString(payload.get("titleId").toString())).orElseThrow();
        Instant startTime = Instant.parse(payload.get("scheduledStartTime").toString());
        String name = payload.getOrDefault("name", title.getName() + " Watch Party").toString();

        ScheduledSpace space = ScheduledSpace.builder()
                .hostUser(user)
                .title(title)
                .scheduledStartTime(startTime)
                .name(name)
                .build();

        return ResponseEntity.ok(scheduledSpaceRepository.save(space));
    }

    @GetMapping("/{id}/ics")
    public ResponseEntity<String> exportIcs(@PathVariable UUID id) {
        ScheduledSpace space = scheduledSpaceRepository.findById(id).orElseThrow();
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'")
                .withZone(ZoneId.of("UTC"));
        
        String now = formatter.format(Instant.now());
        String start = formatter.format(space.getScheduledStartTime());
        // Assume 2 hour duration for movie
        String end = formatter.format(space.getScheduledStartTime().plusSeconds(7200));

        String icsContent = "BEGIN:VCALENDAR\r\n" +
                "VERSION:2.0\r\n" +
                "PRODID:-//Netflix AI Watch Spaces//EN\r\n" +
                "BEGIN:VEVENT\r\n" +
                "UID:" + space.getId() + "@netflixai.local\r\n" +
                "DTSTAMP:" + now + "\r\n" +
                "DTSTART:" + start + "\r\n" +
                "DTEND:" + end + "\r\n" +
                "SUMMARY:" + space.getName() + "\r\n" +
                "DESCRIPTION:Join the watch party for " + space.getTitle().getName() + ".\r\n" +
                "END:VEVENT\r\n" +
                "END:VCALENDAR";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/calendar"));
        headers.setContentDispositionFormData("attachment", "watch_space_" + space.getId() + ".ics");
        
        return new ResponseEntity<>(icsContent, headers, HttpStatus.OK);
    }
}
