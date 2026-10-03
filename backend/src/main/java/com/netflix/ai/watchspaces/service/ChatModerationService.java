package com.netflix.ai.watchspaces.service;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class ChatModerationService {

    // Simple list of profanity words to moderate
    private static final List<String> PROFANITY_WORDS = Arrays.asList(
            "badword1", "badword2", "spam", "abuse", "fuck", "shit", "bitch", "asshole"
    );

    // Creates a regex pattern that matches any of the words (case insensitive, whole word matching if needed)
    private static final Pattern PROFANITY_PATTERN = Pattern.compile(
            "(?i)\\b(" + String.join("|", PROFANITY_WORDS) + ")\\b"
    );

    /**
     * Checks if a message contains profanity or is considered spam.
     *
     * @param message the chat message body
     * @return true if the message is clean, false if it contains profanity
     */
    public boolean isClean(String message) {
        if (message == null || message.trim().isEmpty()) {
            return false; // Reject empty messages
        }
        
        // Check length
        if (message.length() > 500) {
            return false; // Message too long
        }
        
        // Check for profanity
        return !PROFANITY_PATTERN.matcher(message).find();
    }

    /**
     * Masks profanity in the given message with asterisks.
     * 
     * @param message the chat message body
     * @return the moderated message
     */
    public String maskProfanity(String message) {
        if (message == null) return null;
        
        return PROFANITY_PATTERN.matcher(message).replaceAll("***");
    }
}
