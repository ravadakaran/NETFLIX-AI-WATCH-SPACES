package com.netflix.ai.watchspaces.config;

import com.netflix.ai.watchspaces.websocket.RoomSessionManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

import org.springframework.lang.NonNull;

@Configuration
public class RedisPubSubConfig {

    @Bean
    public RedisMessageListenerContainer container(@NonNull RedisConnectionFactory connectionFactory,
                                                   @NonNull RoomSessionManager roomSessionManager) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        // Subscribe to all watch space broadcast channels
        container.addMessageListener(roomSessionManager, new PatternTopic("watchspace:*"));
        return container;
    }
}
