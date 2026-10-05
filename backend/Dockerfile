FROM gradle:8.14-jdk21-alpine AS build
WORKDIR /home/gradle/project

COPY build.gradle.kts settings.gradle.kts ./
COPY gradle gradle
COPY src src

RUN gradle bootJar --no-daemon

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libreoffice fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /home/gradle/project/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
