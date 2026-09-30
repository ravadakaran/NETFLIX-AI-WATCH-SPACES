package com.netflix.ai.watchspaces;

import com.netflix.ai.watchspaces.dto.AuthDtos.AuthResponse;
import com.netflix.ai.watchspaces.dto.AuthDtos.RegisterRequest;
import com.netflix.ai.watchspaces.entity.User;
import com.netflix.ai.watchspaces.entity.UserRole;
import com.netflix.ai.watchspaces.repository.UserRepository;
import com.netflix.ai.watchspaces.security.JwtTokenProvider;
import com.netflix.ai.watchspaces.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    private JwtTokenProvider jwtTokenProvider;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", 86400000L);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtRefreshExpirationMs", 604800000L);
        jwtTokenProvider.init();

        authService = new AuthService(userRepository, passwordEncoder, authenticationManager, jwtTokenProvider);
    }

    @Test
    void testRegisterSuccess() {
        RegisterRequest req = new RegisterRequest("alice@example.com", "Alice", "password123", UserRole.VIEWER);

        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashedPassword");

        UUID generatedId = UUID.randomUUID();
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(generatedId);
            return u;
        });

        AuthResponse resp = authService.register(req);

        assertNotNull(resp);
        assertNotNull(resp.getAccessToken());
        assertNotNull(resp.getRefreshToken());
        assertEquals("alice@example.com", resp.getUser().getEmail());
        assertEquals("Alice", resp.getUser().getDisplayName());

        assertTrue(jwtTokenProvider.validateToken(resp.getAccessToken()));
        assertEquals(generatedId, jwtTokenProvider.getUserIdFromToken(resp.getAccessToken()));
    }

    @Test
    void testRegisterDuplicateEmailThrows() {
        RegisterRequest req = new RegisterRequest("existing@example.com", "Bob", "password123", UserRole.VIEWER);
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> authService.register(req));
    }

    @Test
    void testRegisterIgnoresAdminRoleAndForcesViewer() {
        RegisterRequest req = new RegisterRequest("hacker@example.com", "Hacker", "password123", UserRole.ADMIN);
        when(userRepository.existsByEmail("hacker@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashedPassword");

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            assertEquals(UserRole.VIEWER, u.getRole(), "User role must be VIEWER regardless of client input");
            u.setId(UUID.randomUUID());
            return u;
        });

        AuthResponse resp = authService.register(req);
        assertNotNull(resp);
        assertEquals(UserRole.VIEWER, resp.getUser().getRole());
    }
}
