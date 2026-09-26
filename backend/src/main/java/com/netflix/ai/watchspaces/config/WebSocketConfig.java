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
public class WebSocketConfig implements WebSocketConfigurer {

    private final WatchSpaceWebSocketHandler watchSpaceWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(watchSpaceWebSocketHandler, "/ws/watch-spaces/{watchSpaceId}")
                .setAllowedOriginPatterns("*");
    }
}
