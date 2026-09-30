package com.netflix.ai.watchspaces.config;

import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.UUID;

@Component
public class CorrelationIdFilter implements Filter {

    private static final String CORRELATION_ID_HEADER_NAME = "X-Correlation-Id";
    private static final String CORRELATION_ID_LOG_VAR_NAME = "correlationId";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest req = (HttpServletRequest) request;
        String correlationId = req.getHeader(CORRELATION_ID_HEADER_NAME);
        
        if (correlationId == null || correlationId.trim().isEmpty()) {
            correlationId = UUID.randomUUID().toString();
        }
        
        MDC.put(CORRELATION_ID_LOG_VAR_NAME, correlationId);
        
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(CORRELATION_ID_LOG_VAR_NAME);
        }
    }
}
