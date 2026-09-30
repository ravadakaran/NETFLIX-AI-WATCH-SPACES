package com.netflix.ai.watchspaces.service;

import com.netflix.ai.watchspaces.dto.TitleDtos.TitleSummaryDto;
import com.netflix.ai.watchspaces.entity.Title;
import com.netflix.ai.watchspaces.repository.TitleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TitleService {

    private final TitleRepository titleRepository;

    @Transactional(readOnly = true)
    public List<TitleSummaryDto> getAllTitles() {
        return titleRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TitleSummaryDto getTitleById(UUID titleId) {
        Title title = titleRepository.findById(titleId)
                .orElseThrow(() -> new IllegalArgumentException("Title not found with id: " + titleId));
        return mapToDto(title);
    }

    @Transactional(readOnly = true)
    public Title getEntity(UUID titleId) {
        return titleRepository.findById(titleId)
                .orElseThrow(() -> new IllegalArgumentException("Title not found with id: " + titleId));
    }

    public TitleSummaryDto mapToDto(Title title) {
        return TitleSummaryDto.builder()
                .id(title.getId())
                .name(title.getName())
                .durationSeconds(title.getDurationSeconds())
                .videoAssetUrl(title.getVideoAssetUrl())
                .description(title.getDescription())
                .genre(title.getGenre())
                .thumbnailUrl(title.getThumbnailUrl())
                .build();
    }
}
