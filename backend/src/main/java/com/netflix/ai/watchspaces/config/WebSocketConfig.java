package com.netflix.ai.watchspaces.config;

import com.netflix.ai.watchspaces.websocket.WatchSpaceWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
@SuppressWarnings({"null"})
public class WebSocketConfig implements WebSocketConfigurer {

    private final WatchSpaceWebSocketHandler watchSpaceWebSocketHandler;

    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173}")
    private String allowedOrigins;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        String[] origins = java.util.Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);
        registry.addHandler(watchSpaceWebSocketHandler, "/ws/watch-spaces/{watchSpaceId}")
                .setAllowedOrigins(origins);
    }
}
