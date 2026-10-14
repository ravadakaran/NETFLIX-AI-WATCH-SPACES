package com.netflix.ai.watchspaces;

import com.netflix.ai.watchspaces.controller.UserController;
import com.netflix.ai.watchspaces.dto.WatchSpaceDtos.WatchSpaceDto;
import com.netflix.ai.watchspaces.entity.*;
import com.netflix.ai.watchspaces.repository.ChatMessageRepository;
import com.netflix.ai.watchspaces.repository.TitleRepository;
import com.netflix.ai.watchspaces.repository.UserRepository;
import com.netflix.ai.watchspaces.repository.WatchSpaceParticipantRepository;
import com.netflix.ai.watchspaces.repository.WatchSpaceRepository;
import com.netflix.ai.watchspaces.security.UserPrincipal;
import com.netflix.ai.watchspaces.service.WatchSpaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WatchSpaceCorrectnessTest {

    @Mock
    private WatchSpaceRepository watchSpaceRepository;

    @Mock
    private WatchSpaceParticipantRepository participantRepository;

    @Mock
    private TitleRepository titleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    private WatchSpaceService watchSpaceService;
    private UserController userController;

    @BeforeEach
    void setUp() {
        watchSpaceService = new WatchSpaceService(
                watchSpaceRepository,
                participantRepository,
                titleRepository,
                userRepository,
                chatMessageRepository
        );
        userController = new UserController(userRepository);
    }

    @Test
    void testRejoiningUserEnforcesCapacityWhenInactive() {
        UUID spaceId = UUID.randomUUID();
        User host = User.builder().id(UUID.randomUUID()).displayName("Host").build();
        Title title = Title.builder().id(UUID.randomUUID()).name("Inception").build();

        WatchSpace space = WatchSpace.builder()
                .id(spaceId)
                .title(title)
                .hostUser(host)
                .maxParticipants(2)
                .status(WatchSpaceStatus.LIVE)
                .isLocked(false)
                .build();

        User rejoiningUser = User.builder().id(UUID.randomUUID()).displayName("Charlie").build();

        // Currently 2 participants are active (room is at max capacity)
        when(watchSpaceRepository.findById(spaceId)).thenReturn(Optional.of(space));
        when(participantRepository.countByIdWatchSpaceIdAndLeftAtIsNull(spaceId)).thenReturn(2L);

        // rejoiningUser has an existing participant record, but leftAt is NOT null (they were inactive)
        WatchSpaceParticipant inactiveParticipant = WatchSpaceParticipant.builder()
                .id(new WatchSpaceParticipantId(spaceId, rejoiningUser.getId()))
                .watchSpace(space)
                .user(rejoiningUser)
                .joinedAt(Instant.now().minusSeconds(3600))
                .leftAt(Instant.now().minusSeconds(1800))
                .build();

        when(participantRepository.findByIdWatchSpaceIdAndIdUserId(spaceId, rejoiningUser.getId()))
                .thenReturn(Optional.of(inactiveParticipant));

        // Rejoining must fail with capacity exception!
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                watchSpaceService.joinWatchSpace(rejoiningUser, spaceId, null));

        assertTrue(ex.getMessage().contains("maximum capacity"));
    }

    @Test
    void testLeaveWatchSpaceSetsLeftAt() {
        UUID spaceId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        WatchSpace space = WatchSpace.builder().id(spaceId).build();
        User user = User.builder().id(userId).build();

        WatchSpaceParticipant participant = WatchSpaceParticipant.builder()
                .id(new WatchSpaceParticipantId(spaceId, userId))
                .watchSpace(space)
                .user(user)
                .joinedAt(Instant.now().minusSeconds(100))
                .leftAt(null)
                .build();

        when(participantRepository.findByIdWatchSpaceIdAndIdUserId(spaceId, userId))
                .thenReturn(Optional.of(participant));

        watchSpaceService.leaveWatchSpace(spaceId, userId);

        ArgumentCaptor<WatchSpaceParticipant> captor = ArgumentCaptor.forClass(WatchSpaceParticipant.class);
        verify(participantRepository).save(captor.capture());
        assertNotNull(captor.getValue().getLeftAt());
    }

    @Test
    void testSelfFriendIsPrevented() {
        UUID userId = UUID.randomUUID();
        UserPrincipal principal = new UserPrincipal(userId, "user@example.com", "hash", "User", UserRole.VIEWER, java.util.Collections.emptyList());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                userController.addFriend(principal, userId));

        assertEquals("Cannot add yourself as a friend", ex.getMessage());
    }
}
