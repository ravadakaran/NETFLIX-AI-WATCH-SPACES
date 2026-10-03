package com.netflix.ai.watchspaces.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    private final Map<UUID, Bucket> aiAskBuckets = new ConcurrentHashMap<>();
    private final Map<UUID, Bucket> chatMessageBuckets = new ConcurrentHashMap<>();

    // Limit AI ask to 10 queries per minute per user
    public Bucket resolveAiAskBucket(UUID userId) {
        return aiAskBuckets.computeIfAbsent(userId, this::createNewAiAskBucket);
    }

    private Bucket createNewAiAskBucket(UUID userId) {
        Bandwidth limit = Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    // Limit chat messages to 30 messages per minute per user to prevent spam
    public Bucket resolveChatBucket(UUID userId) {
        return chatMessageBuckets.computeIfAbsent(userId, this::createNewChatBucket);
    }

    private Bucket createNewChatBucket(UUID userId) {
        Bandwidth limit = Bandwidth.classic(30, Refill.intervally(30, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
