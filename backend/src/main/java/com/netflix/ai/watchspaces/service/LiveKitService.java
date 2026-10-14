package com.netflix.ai.watchspaces.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class LiveKitService {

    private final String apiKey;
    private final String apiSecret;

    public LiveKitService(
            @Value("${livekit.api-key:}") String apiKey,
            @Value("${livekit.api-secret:}") String apiSecret) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.apiSecret = apiSecret != null ? apiSecret.trim() : "";
        log.info("LiveKitService initialized (configured={})", isConfigured());
    }

    public boolean isConfigured() {
        return !apiKey.isEmpty() && !apiSecret.isEmpty() 
                && apiSecret.getBytes(StandardCharsets.UTF_8).length >= 32;
    }

    public String generateToken(String roomName, String participantName) {
        if (!isConfigured()) {
            throw new IllegalStateException("LiveKit is not configured or secret is invalid (minimum 32 bytes required for HS256)");
        }

        Map<String, Object> videoGrants = new HashMap<>();
        videoGrants.put("roomJoin", true);
        videoGrants.put("room", roomName);

        long nowMillis = System.currentTimeMillis();
        long expMillis = nowMillis + 3600 * 1000; // 1 hour token

        return Jwts.builder()
                .setIssuer(apiKey)
                .setSubject(participantName)
                .claim("name", participantName)
                .claim("video", videoGrants)
                .setNotBefore(new Date(nowMillis))
                .setExpiration(new Date(expMillis))
                .signWith(Keys.hmacShaKeyFor(apiSecret.getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS256)
                .compact();
    }
}

