package com.tripnest.tripnest_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

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
                String path = uri.getPath();
                if (uri.getUserInfo() != null) {
                    String[] userParts = uri.getUserInfo().split(":");
                    dbUser = userParts[0];
                    if (userParts.length > 1) {
                        dbPass = userParts[1];
                    }
                }
                cleanUrl = "jdbc:postgresql://" + host + ":" + port + path;
            } catch (Exception e) {
                if (cleanUrl.startsWith("postgres://")) {
                    cleanUrl = "jdbc:postgresql://" + cleanUrl.substring("postgres://".length());
                } else if (cleanUrl.startsWith("postgresql://")) {
                    cleanUrl = "jdbc:postgresql://" + cleanUrl.substring("postgresql://".length());
                }
            }
        } else if (cleanUrl.startsWith("jdbc:postgres://")) {
            cleanUrl = cleanUrl.replace("jdbc:postgres://", "jdbc:postgresql://");
        }

        return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(cleanUrl)
                .username(dbUser)
                .password(dbPass)
                .build();
    }
}
