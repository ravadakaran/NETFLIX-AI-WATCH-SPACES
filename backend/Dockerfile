# Stage 1: Build the application
FROM maven:3.8.4-openjdk-11-slim AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build the application, skipping tests to speed up deployment
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:11-jre-focal
WORKDIR /app
# Copy the built JAR from the build stage
COPY --from=build /app/target/watch-spaces-0.0.1-SNAPSHOT.jar app.jar

# Render dynamic port binding
EXPOSE 8080

# Run the jar
ENTRYPOINT ["java", "-jar", "app.jar"]
