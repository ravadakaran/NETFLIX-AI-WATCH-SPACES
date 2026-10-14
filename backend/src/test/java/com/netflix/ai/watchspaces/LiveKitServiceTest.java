package com.netflix.ai.watchspaces;

import com.netflix.ai.watchspaces.service.LiveKitService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class LiveKitServiceTest {

    @Test
    void testDisabledWhenCredentialsMissing() {
        LiveKitService disabledService = new LiveKitService("", "");
        assertFalse(disabledService.isConfigured());

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                disabledService.generateToken("room-123", "user@example.com"));
        assertTrue(ex.getMessage().contains("LiveKit is not configured"));
    }

    @Test
    void testDisabledWhenSecretTooShortForHS256() {
        // Less than 32 bytes (256 bits)
        LiveKitService weakService = new LiveKitService("devkey", "short_secret_under_32_bytes");
        assertFalse(weakService.isConfigured());

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                weakService.generateToken("room-123", "user@example.com"));
        assertTrue(ex.getMessage().contains("minimum 32 bytes"));
    }

    @Test
    void testGenerateTokenWithValidCredentials() {
        String validSecret = "devkeysecretdevkeysecretdevkeysecret32"; // 38 bytes >= 32
        LiveKitService service = new LiveKitService("devkey", validSecret);

        assertTrue(service.isConfigured());

        String token = service.generateToken("watch-space-abc", "viewer@netflix.test");
        assertNotNull(token);
        assertFalse(token.isEmpty());

        // Verify token can be parsed and claims match
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(validSecret.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseClaimsJws(token)
                .getBody();

        assertEquals("devkey", claims.getIssuer());
        assertEquals("viewer@netflix.test", claims.getSubject());
        assertEquals("viewer@netflix.test", claims.get("name"));

        @SuppressWarnings("unchecked")
        Map<String, Object> videoGrant = (Map<String, Object>) claims.get("video");
        assertNotNull(videoGrant);
        assertEquals(true, videoGrant.get("roomJoin"));
        assertEquals("watch-space-abc", videoGrant.get("room"));
    }
}
