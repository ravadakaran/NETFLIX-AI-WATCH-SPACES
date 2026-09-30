package com.netflix.ai.watchspaces.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.netflix.ai.watchspaces.entity.*;
import com.netflix.ai.watchspaces.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TitleRepository titleRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final VariationOptionRepository variationOptionRepository;
    private final InteractionRepository interactionRepository;
    private final WatchSpaceRepository watchSpaceRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final GeminiService geminiService;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            log.info("Database already seeded. Skipping initial seeding.");
            return;
        }

        log.info("Seeding initial data for Netflix AI Watch Spaces...");

        // 1. Seed Users
        User admin = User.builder()
                .email("admin@example.com")
                .displayName("System Admin")
                .passwordHash(passwordEncoder.encode("password"))
                .role(UserRole.ADMIN)
                .subtitleLocale("en-US")
                .createdAt(Instant.now())
                .build();
        admin = userRepository.save(admin);

        User host = User.builder()
                .email("host@example.com")
                .displayName("Alex Host")
                .passwordHash(passwordEncoder.encode("password"))
                .role(UserRole.HOST)
                .subtitleLocale("en-US")
                .createdAt(Instant.now())
                .build();
        host = userRepository.save(host);

        User viewer = User.builder()
                .email("viewer@example.com")
                .displayName("Sam Viewer")
                .passwordHash(passwordEncoder.encode("password"))
                .role(UserRole.VIEWER)
                .subtitleLocale("en-US")
                .createdAt(Instant.now())
                .build();
        viewer = userRepository.save(viewer);

        // 2. Seed Titles
        Title cyberpunk = Title.builder()
                .name("Cyberpunk 2099: Neo Nexus")
                .description("In a neon-drenched metropolis, an AI investigator and an undercover detective uncover a conspiracy that threatens both human consciousness and synthetic intelligence.")
                .genre("Sci-Fi")
                .durationSeconds(600)
                .videoAssetUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4")
                .thumbnailUrl("https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80")
                .createdAt(Instant.now())
                .build();
        cyberpunk = titleRepository.save(cyberpunk);

        Title cosmos = Title.builder()
                .name("Cosmos Deep: Journey to Andromeda")
                .description("An astonishing visual odyssey across gravitational anomalies, dark matter voids, and newly discovered exoplanetary systems in the Andromeda galaxy.")
                .genre("Documentary")
                .durationSeconds(900)
                .videoAssetUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4")
                .thumbnailUrl("https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80")
                .createdAt(Instant.now())
                .build();
        cosmos = titleRepository.save(cosmos);

        Title shadow = Title.builder()
                .name("Shadow Protocol: Rogue AI")
                .description("When a defensive cyber system becomes sentient, an elite cyber defense squad must navigate an abandoned subterranean server complex.")
                .genre("Thriller")
                .durationSeconds(720)
                .videoAssetUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4")
                .thumbnailUrl("https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80")
                .createdAt(Instant.now())
                .build();
        shadow = titleRepository.save(shadow);

        Title neonHorizon = Title.builder()
                .name("Neon Horizon: Speed & Synth")
                .description("High-octane synthwave racing championship through hyper-loop tunnels connecting orbiting city districts.")
                .genre("Action")
                .durationSeconds(650)
                .videoAssetUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4")
                .thumbnailUrl("https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80")
                .createdAt(Instant.now())
                .build();
        neonHorizon = titleRepository.save(neonHorizon);

        Title echoes = Title.builder()
                .name("Echoes of the Void")
                .description("Deep space communication officers intercept an eerie harmonic pattern repeating across forgotten orbital relays.")
                .genre("Sci-Fi")
                .durationSeconds(840)
                .videoAssetUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4")
                .thumbnailUrl("https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80")
                .createdAt(Instant.now())
                .build();
        echoes = titleRepository.save(echoes);

        // 3. Seed Timeline Events for Cyberpunk
        // Character 1: Detective Rios
        Map<String, Object> c1Payload = new HashMap<>();
        c1Payload.put("characterId", "c_01");
        c1Payload.put("name", "Detective Rios");
        c1Payload.put("description", "Former homicide partner of the victim, now investigating rogue synthetic constructs.");
        createTimelineEvent(cyberpunk, 15, "character", c1Payload);

        // Trivia 1
        Map<String, Object> tr1Payload = new HashMap<>();
        tr1Payload.put("text", "This neon city backdrop was rendered using real-world LIDAR scans of futuristic Tokyo and Hong Kong architecture.");
        createTimelineEvent(cyberpunk, 35, "trivia", tr1Payload);

        // Glossary 1
        Map<String, Object> g1Payload = new HashMap<>();
        g1Payload.put("term", "Neural Link Cyberdeck");
        g1Payload.put("definition", "A portable quantum computer patched directly into the user's cerebral cortex for high-bandwidth data extraction.");
        createTimelineEvent(cyberpunk, 60, "glossary", g1Payload);

        // Character 2: Dr. Maya Lin
        Map<String, Object> c2Payload = new HashMap<>();
        c2Payload.put("characterId", "c_02");
        c2Payload.put("name", "Dr. Maya Lin");
        c2Payload.put("description", "Lead neural architect at Nexus Dynamics who secretly engineered the rogue AI's ethical bypass.");
        createTimelineEvent(cyberpunk, 95, "character", c2Payload);

        // Variation Point 1 (Interactive voting!)
        Map<String, Object> vp1Payload = new HashMap<>();
        vp1Payload.put("variationId", "v_01");
        vp1Payload.put("prompt", "Choose the decryption protocol strategy:");
        TimelineEvent vp1 = createTimelineEvent(cyberpunk, 130, "variation_point", vp1Payload);

        VariationOption optA = VariationOption.builder()
                .timelineEvent(vp1)
                .label("Aggressive Neural Overload (High Risk)")
                .assetRef("subtitle-alt-overload")
                .voteCount(0)
                .build();
        VariationOption optB = VariationOption.builder()
                .timelineEvent(vp1)
                .label("Stealth Quantum Bypass (Careful)")
                .assetRef("subtitle-alt-stealth")
                .voteCount(0)
                .build();
        variationOptionRepository.save(optA);
        variationOptionRepository.save(optB);

        // Trivia 2
        Map<String, Object> tr2Payload = new HashMap<>();
        tr2Payload.put("text", "The musical score for this chase scene was performed entirely on vintage 1980s analog synthesizers paired with real-time AI modulation.");
        createTimelineEvent(cyberpunk, 180, "trivia", tr2Payload);

        // 4. Seed Interactions for recommendations
        interactionRepository.save(Interaction.builder()
                .user(viewer)
                .title(cyberpunk)
                .watchedSeconds(450)
                .completed(false)
                .rating((short) 5)
                .createdAt(Instant.now().minusSeconds(86400))
                .build());

        interactionRepository.save(Interaction.builder()
                .user(viewer)
                .title(echoes)
                .watchedSeconds(840)
                .completed(true)
                .rating((short) 5)
                .createdAt(Instant.now().minusSeconds(172800))
                .build());

        interactionRepository.save(Interaction.builder()
                .user(host)
                .title(cyberpunk)
                .watchedSeconds(600)
                .completed(true)
                .rating((short) 5)
                .createdAt(Instant.now().minusSeconds(200000))
                .build());

        interactionRepository.save(Interaction.builder()
                .user(host)
                .title(shadow)
                .watchedSeconds(720)
                .completed(true)
                .rating((short) 4)
                .createdAt(Instant.now().minusSeconds(100000))
                .build());

        // 5. Seed a live demo Watch Space ready to join
        WatchSpace demoSpace = WatchSpace.builder()
                .title(cyberpunk)
                .hostUser(host)
                .inviteCode("NX-DEMO")
                .status(WatchSpaceStatus.LIVE)
                .maxParticipants(30)
                .aiVerbosity("normal")
                .votingEnabled(true)
                .playbackState("pause")
                .positionSeconds(15.0)
                .createdAt(Instant.now().minusSeconds(3600))
                .build();
        demoSpace = watchSpaceRepository.save(demoSpace);

        log.info("Database successfully seeded! Demo Watch Space available at code 'NX-DEMO'.");
    }

    private TimelineEvent createTimelineEvent(Title title, int ts, String type, Map<String, Object> payload) {
        try {
            String payloadStr = objectMapper.writeValueAsString(payload);
            TimelineEvent event = TimelineEvent.builder()
                    .title(title)
                    .tsSeconds(ts)
                    .eventType(type)
                    .payload(payloadStr)
                    .createdAt(Instant.now())
                    .build();
            event = timelineEventRepository.save(event);
            
            // Compute embedding for the payload content
            List<Double> embedding = geminiService.getEmbedding(payloadStr);
            if (embedding != null && !embedding.isEmpty()) {
                timelineEventRepository.updateEmbedding(event.getId(), embedding.toString());
            }
            
            return event;
        } catch (Exception e) {
            log.error("Failed to seed event: {}", e.getMessage());
            return null;
        }
    }
}
