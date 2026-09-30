package com.netflix.ai.watchspaces.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class LiveKitService {

    @Value("${livekit.api-key}")
    private String apiKey;

    @Value("${livekit.api-secret}")
    private String apiSecret;

    public String generateToken(String roomName, String participantName) {
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
