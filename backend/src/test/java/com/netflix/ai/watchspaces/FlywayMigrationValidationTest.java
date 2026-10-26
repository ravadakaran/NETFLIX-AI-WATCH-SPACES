package com.netflix.ai.watchspaces;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.zip.CRC32;

import static org.junit.jupiter.api.Assertions.*;

public class FlywayMigrationValidationTest {

    private static final int EXPECTED_V3_CHECKSUM = -437175932;

    @Test
    void testV3MigrationChecksumMatchesDatabaseHistory() throws Exception {
        ClassPathResource resource = new ClassPathResource("db/migration/V3__add_pgvector.sql");
        assertTrue(resource.exists(), "V3__add_pgvector.sql must exist");

        CRC32 crc = new CRC32();
        StringBuilder content = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                crc.update(line.getBytes(StandardCharsets.UTF_8));
                content.append(line).append("\n");
            }
        }

        int calculatedChecksum = (int) crc.getValue();
        assertEquals(EXPECTED_V3_CHECKSUM, calculatedChecksum,
                "V3 checksum must match the applied historical database checksum (-437175932)");

        assertTrue(content.toString().contains("vector(768)"),
                "V3 must define vector(768) to align with Gemini embedding model");
    }

    @Test
    void testV7MigrationExistsAndAlignsVectorDimensions() throws Exception {
        ClassPathResource resource = new ClassPathResource("db/migration/V7__align_vector_dimension.sql");
        assertTrue(resource.exists(), "V7__align_vector_dimension.sql must exist");

        StringBuilder content = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
        }

        assertTrue(content.toString().contains("vector(768)"),
                "V7 must align column to vector(768)");
    }

    @Test
    void testV8MigrationExistsAndAddsTitleEmbedding() throws Exception {
        ClassPathResource resource = new ClassPathResource("db/migration/V8__add_title_embedding.sql");
        assertTrue(resource.exists(), "V8__add_title_embedding.sql must exist");

        StringBuilder content = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
        }

        assertTrue(content.toString().contains("vector(768)"),
                "V8 must add title embedding as vector(768)");
        assertTrue(content.toString().contains("titles"),
                "V8 must target the titles table");
    }

    @Test
    void testFlywayMigrationOnDisposableDatabase() {
        try {
            org.flywaydb.core.Flyway flyway = org.flywaydb.core.Flyway.configure()
                    .dataSource("jdbc:postgresql://localhost:5433/netflix_test_disposable", "netflix_admin", "netflix_secure_password")
                    .locations("classpath:db/migration")
                    .cleanDisabled(false)
                    .load();

            flyway.clean();
            org.flywaydb.core.api.output.MigrateResult result = flyway.migrate();
            assertTrue(result.success, "Flyway migration must succeed on clean database");
            assertEquals(8, result.migrationsExecuted, "All 8 migrations must be executed");
        } catch (org.flywaydb.core.internal.exception.FlywaySqlException e) {
            org.junit.jupiter.api.Assumptions.assumeTrue(false,
                    "Disposable test DB on localhost:5433 not reachable, skipping live migration execution: " + e.getMessage());
        }
    }
}
