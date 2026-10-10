package com.netflix.ai.watchspaces;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.netflix.ai.watchspaces.dto.NarrativeDtos.ActionRequest;
import com.netflix.ai.watchspaces.entity.Title;
import com.netflix.ai.watchspaces.entity.User;
import com.netflix.ai.watchspaces.entity.WatchSpace;
import com.netflix.ai.watchspaces.repository.NarrativeDecisionRepository;
import com.netflix.ai.watchspaces.repository.NarrativeRoundRepository;
import com.netflix.ai.watchspaces.repository.NarrativeSubmissionRepository;
import com.netflix.ai.watchspaces.repository.TimelineEventRepository;
import com.netflix.ai.watchspaces.repository.UserRepository;
import com.netflix.ai.watchspaces.repository.WatchSpaceRepository;
import com.netflix.ai.watchspaces.service.NarrativeService;
import com.netflix.ai.watchspaces.websocket.RoomSessionManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NarrativeConcurrencyTest {

    @Mock private WatchSpaceRepository watchSpaceRepository;
    @Mock private UserRepository userRepository;
    @Mock private TimelineEventRepository timelineEventRepository;
    @Mock private NarrativeRoundRepository roundRepository;
    @Mock private NarrativeSubmissionRepository submissionRepository;
    @Mock private NarrativeDecisionRepository decisionRepository;
    @Mock private RoomSessionManager sessionManager;

    private NarrativeService narrativeService;
    private UUID spaceId;
    private UUID userId;
    private WatchSpace space;

    @BeforeEach
    void setUp() {
        narrativeService = new NarrativeService(
                watchSpaceRepository,
                userRepository,
                timelineEventRepository,
                roundRepository,
                submissionRepository,
                decisionRepository,
                new ObjectMapper(),
                sessionManager);
        spaceId = UUID.randomUUID();
        userId = UUID.randomUUID();
        space = WatchSpace.builder()
                .id(spaceId)
                .title(Title.builder().id(UUID.randomUUID()).build())
                .hostUser(User.builder().id(userId).build())
                .build();
    }

    @Test
    void statePollingDoesNotLockRoomWhenNothingExpired() {
        when(watchSpaceRepository.findById(spaceId)).thenReturn(Optional.of(space));
        when(roundRepository.findByWatchSpaceIdAndStatus(spaceId, "OPEN")).thenReturn(Collections.emptyList());
        when(timelineEventRepository.findAllWithVariationOptionsByTitleId(space.getTitle().getId()))
                .thenReturn(Collections.emptyList());
        when(decisionRepository.findByWatchSpaceIdOrderBySequenceNumberAsc(spaceId))
                .thenReturn(Collections.emptyList());
        when(roundRepository.findByWatchSpaceIdOrderByOpenedAtAsc(spaceId))
                .thenReturn(Collections.emptyList());
        when(submissionRepository.findByRoundWatchSpaceId(spaceId)).thenReturn(Collections.emptyList());

        narrativeService.getState(spaceId, userId);

        verify(watchSpaceRepository).findById(spaceId);
        verify(watchSpaceRepository, never()).findByIdForNarrativeUpdate(spaceId);
    }

    @Test
    void everyMutationAcquiresDatabaseRoomLock() {
        User user = User.builder().id(userId).build();
        when(watchSpaceRepository.findByIdForNarrativeUpdate(spaceId)).thenReturn(Optional.of(space));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(roundRepository.findByWatchSpaceIdAndStatus(spaceId, "OPEN")).thenReturn(Collections.emptyList());

        ActionRequest request = new ActionRequest("unsupported", null, null, null);
        assertThrows(IllegalArgumentException.class,
                () -> narrativeService.handleAction(spaceId, userId, request));

        verify(watchSpaceRepository).findByIdForNarrativeUpdate(spaceId);
        verify(watchSpaceRepository, never()).findById(spaceId);
    }
}
