package com.netflix.ai.watchspaces.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {

    @Value("${app.gemini.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String askQuestionWithContext(String spaceId, int currentTs, String question, String context) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

        // Formulate the prompt contextually
        String prompt = String.format(
                "You are an AI Film Scholar copilot in a synchronized Netflix watch space. " +
                "The user is watching a video at timestamp %d seconds. " +
                "Here is the verified scene metadata timeline: %s\n\n" +
                "Answer their question in a highly knowledgeable, cinematic, and conversational tone, grounding your answer strictly in the timeline context provided above. " +
                "Question: %s",
                currentTs, context, question
        );

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            long startTime = System.currentTimeMillis();
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(url, entity, JsonNode.class);
            long latency = System.currentTimeMillis() - startTime;
            
            log.info("Gemini API call took {} ms", latency);

            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode body = response.getBody();
                if (body != null) {
                    JsonNode candidates = body.get("candidates");
                    if (candidates != null && candidates.isArray() && !candidates.isEmpty()) {
                        JsonNode content = candidates.get(0).get("content");
                        if (content != null) {
                            JsonNode parts = content.get("parts");
                            if (parts != null && parts.isArray() && !parts.isEmpty()) {
                                JsonNode textNode = parts.get(0).get("text");
                                if (textNode != null) {
                                    return textNode.asText();
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to query Gemini API", e);
        }

        return "AI Film Scholar note: I am currently unable to analyze this scene due to a temporal disturbance. (Error reaching Gemini API)";
    }

    public List<Double> getEmbedding(String text) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=" + apiKey;

        Map<String, Object> requestBody = Map.of(
                "model", "models/gemini-embedding-001",
                "content", Map.of("parts", List.of(Map.of("text", text)))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(url, entity, JsonNode.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode body = response.getBody();
                if (body != null && body.has("embedding")) {
                    JsonNode values = body.get("embedding").get("values");
                    if (values != null && values.isArray()) {
                        List<Double> embedding = new java.util.ArrayList<>();
                        for (JsonNode val : values) {
                            embedding.add(val.asDouble());
                        }
                        return embedding;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to generate embedding from Gemini API", e);
        }
        return null;
    }
}
