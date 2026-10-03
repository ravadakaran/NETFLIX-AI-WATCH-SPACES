package com.netflix.ai.watchspaces.service;

import com.netflix.ai.watchspaces.entity.ScheduledSpace;
import com.netflix.ai.watchspaces.repository.ScheduledSpaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderService {

    private final ScheduledSpaceRepository scheduledSpaceRepository;

    // Runs every minute to check for upcoming scheduled spaces
    @Scheduled(fixedRate = 60000)
    public void sendReminders() {
        Instant now = Instant.now();
        // Look for spaces starting in exactly 15 minutes (between 14 and 16 minutes from now)
        Instant startRange = now.plus(14, ChronoUnit.MINUTES);
        Instant endRange = now.plus(16, ChronoUnit.MINUTES);
        
        List<ScheduledSpace> upcomingSpaces = scheduledSpaceRepository.findByScheduledStartTimeBetween(startRange, endRange);
        
        for (ScheduledSpace space : upcomingSpaces) {
            // Mock sending email / push notification
            log.info("Reminder: Watch Space '{}' is starting in 15 minutes! Hosted by {}", 
                    space.getName(), space.getHostUser().getDisplayName());
            
            // In a real implementation, we would integrate with an EmailService or PushNotificationService here.
        }
    }
}
