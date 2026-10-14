package com.netflix.ai.watchspaces;

import com.netflix.ai.watchspaces.controller.WatchSpaceController;
import com.netflix.ai.watchspaces.entity.User;
import com.netflix.ai.watchspaces.entity.UserRole;
import com.netflix.ai.watchspaces.repository.UserRepository;
import com.netflix.ai.watchspaces.security.UserPrincipal;
import com.netflix.ai.watchspaces.service.LiveKitService;
import com.netflix.ai.watchspaces.service.WatchSpaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class WatchSpaceControllerLiveKitTest {

    @Mock
    private WatchSpaceService watchSpaceService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LiveKitService liveKitService;

    private WatchSpaceController controller;
    private UserPrincipal testPrincipal;
    private User testUser;
    private UUID testSpaceId;

    @BeforeEach
    void setUp() {
        controller = new WatchSpaceController(watchSpaceService, userRepository, liveKitService);

        UUID userId = UUID.randomUUID();
        testUser = User.builder()
                .id(userId)
                .email("test@netflix.test")
                .displayName("Test User")
                .passwordHash("pass")
                .role(UserRole.VIEWER)
                .build();
        testPrincipal = UserPrincipal.create(testUser);
        testSpaceId = UUID.randomUUID();
    }

    @Test
    void testGetLiveKitTokenReturns503WhenLiveKitDisabled() {
        when(liveKitService.isConfigured()).thenReturn(false);

        ResponseEntity<Map<String, String>> response = controller.getLiveKitToken(testSpaceId, testPrincipal);

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().containsKey("error"));
        assertTrue(response.getBody().get("error").contains("LiveKit voice chat is not configured"));
    }

    @Test
    void testGetLiveKitTokenReturns200WithTokenWhenLiveKitConfigured() {
        when(liveKitService.isConfigured()).thenReturn(true);
        when(userRepository.findById(testPrincipal.getId())).thenReturn(Optional.of(testUser));
        when(liveKitService.generateToken(eq(testSpaceId.toString()), eq("test@netflix.test")))
                .thenReturn("mock.signed.jwt.token");

        ResponseEntity<Map<String, String>> response = controller.getLiveKitToken(testSpaceId, testPrincipal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("mock.signed.jwt.token", response.getBody().get("token"));
    }
}
