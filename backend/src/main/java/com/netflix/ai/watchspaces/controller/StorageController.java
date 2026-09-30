package com.netflix.ai.watchspaces.controller;

import com.netflix.ai.watchspaces.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/storage")
@RequiredArgsConstructor
public class StorageController {

    private final StorageService storageService;

    @GetMapping("/upload-url")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPresignedUploadUrl(
            @RequestParam("filename") String filename,
            @RequestParam("contentType") String contentType) {
        
        // Generate a unique object key to prevent collisions
        String ext = "";
        int dotIdx = filename.lastIndexOf(".");
        if (dotIdx > -1) {
            ext = filename.substring(dotIdx);
        }
        String objectKey = "uploads/" + UUID.randomUUID() + ext;
        
        String url = storageService.generateUploadUrl(objectKey, contentType);
        
        return ResponseEntity.ok(Map.of(
                "uploadUrl", url,
                "objectKey", objectKey,
                "cdnUrl", "https://cdn.example.com/" + objectKey // Mock CDN URL
        ));
    }
}
