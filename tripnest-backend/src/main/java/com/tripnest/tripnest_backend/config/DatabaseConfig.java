package com.tripnest.tripnest_backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url:${DATABASE_URL:jdbc:postgresql://localhost:5432/tripnest}}")
    private String dbUrl;

    @Value("${spring.datasource.username:${DATABASE_USERNAME:postgres}}")
    private String username;

    @Value("${spring.datasource.password:${DATABASE_PASSWORD:root}}")
    private String password;

    @Bean
    @Primary
    public DataSource dataSource() {
        String cleanUrl = dbUrl != null ? dbUrl.trim() : "jdbc:postgresql://localhost:5432/tripnest";
        String dbUser = username;
        String dbPass = password;

        // Automatically convert Render standard postgres:// or postgresql:// URLs
        if (cleanUrl.startsWith("postgres://") || cleanUrl.startsWith("postgresql://")) {
            try {
                URI uri = new URI(cleanUrl);
                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath() != null ? uri.getPath() : "/tripnest";
                String query = uri.getQuery();

                if (uri.getUserInfo() != null) {
                    String[] userParts = uri.getUserInfo().split(":", 2);
                    dbUser = userParts[0];
                    if (userParts.length > 1) {
                        dbPass = userParts[1];
                    }
                }

                cleanUrl = "jdbc:postgresql://" + host + ":" + port + path;

                if (query != null && !query.isBlank()) {
                    cleanUrl += "?" + query;
                } else if (!"localhost".equalsIgnoreCase(host) && !"127.0.0.1".equals(host)) {
                    // Remote cloud databases (e.g. Render, Neon, Supabase) require SSL
                    cleanUrl += "?sslmode=prefer";
                }
            } catch (Exception e) {
                log.warn("[DatabaseConfig] URI parsing failed, attempting fallback extraction: {}", e.getMessage());
                try {
                    String stripped = cleanUrl.replaceFirst("^postgres(ql)?://", "");
                    if (stripped.contains("@")) {
                        int atIdx = stripped.lastIndexOf('@');
                        String creds = stripped.substring(0, atIdx);
                        String rest = stripped.substring(atIdx + 1);
                        String[] userParts = creds.split(":", 2);
                        dbUser = userParts[0];
                        if (userParts.length > 1) {
                            dbPass = userParts[1];
                        }
                        cleanUrl = "jdbc:postgresql://" + rest;
                    } else {
                        cleanUrl = "jdbc:postgresql://" + stripped;
                    }
                    if (!cleanUrl.contains("sslmode") && !cleanUrl.contains("localhost") && !cleanUrl.contains("127.0.0.1")) {
                        cleanUrl += (cleanUrl.contains("?") ? "&" : "?") + "sslmode=prefer";
                    }
                } catch (Exception ex) {
                    log.error("[DatabaseConfig] Fallback parsing error", ex);
                }
            }
        } else if (cleanUrl.startsWith("jdbc:postgres://")) {
            cleanUrl = cleanUrl.replace("jdbc:postgres://", "jdbc:postgresql://");
        }

        log.info("[DatabaseConfig] Connecting to database URL: {}", cleanUrl.replaceAll(":[^/@]+@", ":****@"));

        return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(cleanUrl)
                .username(dbUser)
                .password(dbPass)
                .build();
    }
}
