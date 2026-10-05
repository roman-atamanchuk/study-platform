package ie.setu.study.modules.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import ie.setu.study.common.exception.ApiException;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class OpenAiCompatibleClient {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public OpenAiCompatibleClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();
    }

    public String chatCompletion(
        String baseUrl,
        String apiKey,
        String model,
        String systemPrompt,
        List<ChatTurn> history,
        AiTutorRequestContext tutorContext
    ) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException("AI_NOT_CONFIGURED", "AI provider API key is not configured on the server.");
        }

        MaterialPageContextService.MaterialPageContext exam = tutorContext.exam();

        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);
            body.put("temperature", 0.2);
            body.put("max_tokens", 4096);
            body.putObject("response_format").put("type", "json_object");
            ArrayNode messages = body.putArray("messages");

            messages.addObject()
                .put("role", "system")
                .put("content", systemPrompt);

            for (ChatTurn turn : history) {
                messages.addObject()
                    .put("role", turn.role())
                    .put("content", turn.content());
            }

            ObjectNode userMessage = messages.addObject();
            userMessage.put("role", "user");
            String userText = buildUserText(tutorContext);
            if (exam.imageDataUrl() != null) {
                ArrayNode contentParts = userMessage.putArray("content");
                contentParts.addObject()
                    .put("type", "text")
                    .put("text", userText);
                ObjectNode imagePart = contentParts.addObject();
                imagePart.put("type", "image_url");
                imagePart.putObject("image_url").put("url", exam.imageDataUrl());
            } else {
                userMessage.put("content", userText);
            }

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(trimTrailingSlash(baseUrl) + "/chat/completions"))
                .timeout(Duration.ofSeconds(90))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new ApiException(
                    "AI_PROVIDER_ERROR",
                    "AI provider returned an error (" + response.statusCode() + ")."
                );
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode choice = root.path("choices").path(0);
            JsonNode content = choice.path("message").path("content");
            if (content.isMissingNode() || content.asText().isBlank()) {
                throw new ApiException("AI_EMPTY_RESPONSE", "AI provider returned an empty response.");
            }
            String finishReason = choice.path("finish_reason").asText("");
            String text = content.asText().trim();
            if ("length".equals(finishReason)) {
                text += "\n\n*(Response was cut short — ask a follow-up or try a shorter question.)*";
            }
            return text;
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new ApiException("AI_PROVIDER_ERROR", "Unable to reach AI provider.");
        }
    }

    private String buildUserText(AiTutorRequestContext tutorContext) {
        MaterialPageContextService.MaterialPageContext exam = tutorContext.exam();
        MaterialPageContextService.MaterialPageContext solution = tutorContext.solution();
        ParsedPrompt parsed = tutorContext.parsed();

        String questionFocus = parsed.question().label().isBlank()
            ? "Resolve the exact question part from parent context on the exam page."
            : "Focus on " + parsed.question().label() + " and include parent context from the full question and part (a).";

        StringBuilder builder = new StringBuilder();
        builder.append("=== EXAM PAGE ===\n");
        builder.append("Material: ").append(exam.materialTitle()).append('\n');
        builder.append("Page: ").append(exam.pageNumber()).append('\n');
        builder.append(exam.textSummary()).append('\n');

        if (tutorContext.hasLearningMaterials()) {
            builder.append("\n=== COURSE LEARNING MATERIALS ===\n");
            builder.append("Search these lecture notes and course materials FIRST for methods and answers.\n");
            builder.append(tutorContext.learningMaterials().summary()).append('\n');
        } else {
            builder.append("\n=== COURSE LEARNING MATERIALS ===\n");
            builder.append("No course learning materials were attached for this course.\n");
        }

        if (solution != null) {
            builder.append("\n=== OFFICIAL SOLUTION PAGE ===\n");
            builder.append("Material: ").append(solution.materialTitle()).append('\n');
            builder.append("Page: ").append(solution.pageNumber()).append('\n');
            builder.append(solution.textSummary()).append('\n');
        } else {
            builder.append("\n=== OFFICIAL SOLUTION PAGE ===\n");
            builder.append("No linked official solution page was attached.\n");
        }

        builder.append("\n=== REQUEST ===\n");
        builder.append("Intent: ").append(parsed.intent()).append('\n');
        builder.append(questionFocus).append('\n');
        builder.append("\nStudent question:\n");
        builder.append(tutorContext.userPrompt());
        return builder.toString();
    }

    private String trimTrailingSlash(String baseUrl) {
        if (baseUrl.endsWith("/")) {
            return baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl;
    }

    public record ChatTurn(String role, String content) {}

    public static List<ChatTurn> historyFromMessages(List<String> roles, List<String> contents) {
        List<ChatTurn> turns = new ArrayList<>();
        for (int i = 0; i < roles.size(); i++) {
            turns.add(new ChatTurn(roles.get(i), contents.get(i)));
        }
        return turns;
    }
}
