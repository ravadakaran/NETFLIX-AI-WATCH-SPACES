package com.netflix.ai.watchspaces.service;

import com.netflix.ai.watchspaces.dto.WatchSpaceDtos.*;
import com.netflix.ai.watchspaces.entity.*;
import com.netflix.ai.watchspaces.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings({"null"})
public class WatchSpaceService {

    private final WatchSpaceRepository watchSpaceRepository;
    private final WatchSpaceParticipantRepository participantRepository;
    private final TitleRepository titleRepository;
    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    public String generateInviteCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder("NX-");
            for (int i = 0; i < 4; i++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (!watchSpaceRepository.findByInviteCode(code).isPresent()) {
                return code;
            }
        }
        return "NX-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    @Transactional
    public WatchSpaceDto createWatchSpace(User hostUser, CreateWatchSpaceRequest request) {
        Title title = titleRepository.findById(request.getTitleId())
                .orElseThrow(() -> new IllegalArgumentException("Title not found with id: " + request.getTitleId()));

        String inviteCode = generateInviteCode();

        WatchSpace space = WatchSpace.builder()
                .title(title)
                .hostUser(hostUser)
                .inviteCode(inviteCode)
                .status(WatchSpaceStatus.LIVE)
                .maxParticipants(request.getMaxParticipants() != null ? request.getMaxParticipants() : 25)
                .aiVerbosity(request.getAiVerbosity() != null ? request.getAiVerbosity() : "normal")
                .votingEnabled(request.getVotingEnabled() != null ? request.getVotingEnabled() : true)
                .playbackState("pause")
                .positionSeconds(0.0)
                .createdAt(Instant.now())
                .build();

        space = watchSpaceRepository.save(space);

        // Add host as participant
        WatchSpaceParticipant participant = WatchSpaceParticipant.builder()
                .id(new WatchSpaceParticipantId(space.getId(), hostUser.getId()))
                .watchSpace(space)
                .user(hostUser)
                .joinedAt(Instant.now())
                .build();
        participantRepository.save(participant);

        return mapToDto(space);
    }

    @Transactional
    public WatchSpaceDto joinWatchSpace(User user, UUID spaceId, String inviteCode) {
        WatchSpace space;
        if (spaceId != null) {
            space = watchSpaceRepository.findById(spaceId)
                    .orElseThrow(() -> new IllegalArgumentException("Watch Space not found with id: " + spaceId));
        } else if (inviteCode != null && !inviteCode.trim().isEmpty()) {
            space = watchSpaceRepository.findByInviteCode(inviteCode.trim().toUpperCase())
                    .orElseThrow(() -> new IllegalArgumentException("Watch Space not found with invite code: " + inviteCode));
        } else {
            throw new IllegalArgumentException("Either spaceId or inviteCode must be provided");
        }

        if (space.getStatus() == WatchSpaceStatus.ENDED) {
            throw new IllegalStateException("Watch Space has ended");
        }
        if (Boolean.TRUE.equals(space.getIsLocked())) {
            throw new IllegalStateException("Watch Space is locked by the host");
        }

        long activeCount = participantRepository.countByIdWatchSpaceIdAndLeftAtIsNull(space.getId());
        Optional<WatchSpaceParticipant> existing = participantRepository.findByIdWatchSpaceIdAndIdUserId(space.getId(), user.getId());

        if (!existing.isPresent() && activeCount >= space.getMaxParticipants()) {
            throw new IllegalStateException("Watch Space is at maximum capacity (" + space.getMaxParticipants() + ")");
        }

        WatchSpaceParticipant participant;
        if (existing.isPresent()) {
            participant = existing.get();
            participant.setLeftAt(null); // Reconnected / rejoined
        } else {
            participant = WatchSpaceParticipant.builder()
                    .id(new WatchSpaceParticipantId(space.getId(), user.getId()))
                    .watchSpace(space)
                    .user(user)
                    .joinedAt(Instant.now())
                    .build();
        }
        participantRepository.save(participant);

        return mapToDto(space);
    }

    @Transactional(readOnly = true)
    public WatchSpaceDto getWatchSpace(UUID spaceId) {
        WatchSpace space = watchSpaceRepository.findById(spaceId)
                .orElseThrow(() -> new IllegalArgumentException("Watch Space not found with id: " + spaceId));
        return mapToDto(space);
    }

    @Transactional(readOnly = true)
    public WatchSpace getEntity(UUID spaceId) {
        return watchSpaceRepository.findById(spaceId)
                .orElseThrow(() -> new IllegalArgumentException("Watch Space not found with id: " + spaceId));
    }

    @Transactional
    public WatchSpaceDto endWatchSpace(User caller, UUID spaceId) {
        WatchSpace space = watchSpaceRepository.findById(spaceId)
                .orElseThrow(() -> new IllegalArgumentException("Watch Space not found with id: " + spaceId));

        if (!space.getHostUser().getId().equals(caller.getId()) && !caller.getRole().name().equals("ADMIN")) {
            throw new SecurityException("Host role required to end this Watch Space");
        }

        space.setStatus(WatchSpaceStatus.ENDED);
        space.setEndedAt(Instant.now());
        space.setPlaybackState("pause");
        space = watchSpaceRepository.save(space);

        return mapToDto(space);
    }

    @Transactional
    public void updatePlaybackState(UUID spaceId, String state, Double positionSeconds) {
        watchSpaceRepository.findById(spaceId).ifPresent(space -> {
            space.setPlaybackState(state);
            if (positionSeconds != null) {
                space.setPositionSeconds(positionSeconds);
            }
            watchSpaceRepository.save(space);
        });
    }

    @Transactional
    public void updateRoomLock(UUID spaceId, boolean isLocked) {
        watchSpaceRepository.findById(spaceId).ifPresent(space -> {
            space.setIsLocked(isLocked);
            watchSpaceRepository.save(space);
        });
    }

    @Transactional
    public void transferHost(UUID spaceId, UUID newHostId) {
        watchSpaceRepository.findById(spaceId).ifPresent(space -> {
            userRepository.findById(newHostId).ifPresent(newHost -> {
                space.setHostUser(newHost);
                watchSpaceRepository.save(space);
            });
        });
    }

    @Transactional(readOnly = true)
    public AnalyticsDto getAnalytics(UUID spaceId) {
        WatchSpace space = watchSpaceRepository.findById(spaceId)
                .orElseThrow(() -> new IllegalArgumentException("Watch Space not found with id: " + spaceId));

        List<WatchSpaceParticipant> allParticipants = participantRepository.findByIdWatchSpaceId(spaceId);
        List<WatchSpaceParticipant> activeParticipants = participantRepository.findByIdWatchSpaceIdAndLeftAtIsNull(spaceId);
        List<ChatMessage> messages = chatMessageRepository.findByWatchSpaceIdOrderByCreatedAtAsc(spaceId);

        Instant end = space.getEndedAt() != null ? space.getEndedAt() : Instant.now();
        long durationSec = Duration.between(space.getCreatedAt(), end).getSeconds();

        int aiQuestions = (int) messages.stream().filter(m -> "ai_answer".equalsIgnoreCase(m.getMsgType())).count();
        int chatCount = (int) messages.stream().filter(m -> "chat".equalsIgnoreCase(m.getMsgType())).count();

        return AnalyticsDto.builder()
                .watchSpaceId(spaceId)
                .sessionDurationSeconds(Math.max(0, durationSec))
                .peakParticipants(allParticipants.size())
                .currentParticipants(activeParticipants.size())
                .aiQuestionsCount(aiQuestions)
                .triviaCardsSurfacedCount(Math.max(1, (int) (durationSec / 120)))
                .chatMessagesCount(chatCount)
                .variationVotesCount(space.getVotingEnabled() ? 1 : 0)
                .build();
    }

    @Transactional(readOnly = true)
    public List<WatchSpaceDto> getActiveSpaces() {
        return watchSpaceRepository.findByStatusOrderByCreatedAtDesc(WatchSpaceStatus.LIVE).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WatchSpaceDto> getUserSpaces(UUID userId) {
        List<WatchSpaceParticipant> participants = participantRepository.findByIdUserIdOrderByJoinedAtDesc(userId);
        List<WatchSpace> hostedSpaces = watchSpaceRepository.findByHostUserIdOrderByCreatedAtDesc(userId);

        Set<UUID> seenIds = new LinkedHashSet<>();
        List<WatchSpaceDto> result = new ArrayList<>();

        for (WatchSpace space : hostedSpaces) {
            if (space != null && seenIds.add(space.getId())) {
                result.add(mapToDto(space));
            }
        }

        for (WatchSpaceParticipant p : participants) {
            WatchSpace space = p.getWatchSpace();
            if (space != null && seenIds.add(space.getId())) {
                result.add(mapToDto(space));
            }
        }

        return result;
    }

    public WatchSpaceDto mapToDto(WatchSpace space) {
        List<WatchSpaceParticipant> activeParticipants = participantRepository.findByIdWatchSpaceIdAndLeftAtIsNull(space.getId());

        List<ParticipantDto> participantDtos = activeParticipants.stream()
                .map(p -> ParticipantDto.builder()
                        .userId(p.getUser().getId())
                        .displayName(p.getUser().getDisplayName())
                        .email(p.getUser().getEmail())
                        .joinedAt(p.getJoinedAt())
                        .isHost(p.getUser().getId().equals(space.getHostUser().getId()))
                        .build())
                .collect(Collectors.toList());

        return WatchSpaceDto.builder()
                .watchSpaceId(space.getId())
                .titleId(space.getTitle().getId())
                .titleName(space.getTitle().getName())
                .videoAssetUrl(space.getTitle().getVideoAssetUrl())
                .durationSeconds(space.getTitle().getDurationSeconds())
                .inviteCode(space.getInviteCode())
                .status(space.getStatus())
                .hostUserId(space.getHostUser().getId())
                .hostDisplayName(space.getHostUser().getDisplayName())
                .maxParticipants(space.getMaxParticipants())
                .activeParticipantsCount(activeParticipants.size())
                .aiVerbosity(space.getAiVerbosity())
                .votingEnabled(space.getVotingEnabled())
                .playbackState(space.getPlaybackState())
                .positionSeconds(space.getPositionSeconds())
                .isLocked(space.getIsLocked())
                .createdAt(space.getCreatedAt())
                .endedAt(space.getEndedAt())
                .participants(participantDtos)
                .build();
    }
}
