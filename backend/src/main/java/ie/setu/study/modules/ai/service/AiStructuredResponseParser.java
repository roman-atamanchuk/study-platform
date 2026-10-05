package ie.setu.study.modules.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class AiStructuredResponseParser {

    private static final Pattern JSON_FENCE = Pattern.compile("```json\\s*([\\s\\S]*?)```", Pattern.CASE_INSENSITIVE);
    private final ObjectMapper objectMapper;
    private final AiVisualsValidator visualsValidator;

    public AiStructuredResponseParser(ObjectMapper objectMapper, AiVisualsValidator visualsValidator) {
        this.objectMapper = objectMapper;
        this.visualsValidator = visualsValidator;
    }

    public AiStructuredResponse parse(String raw, ParsedPrompt parsed, String userPrompt) {
        if (raw == null || raw.isBlank()) {
            return new AiStructuredResponse("", null);
        }

        String trimmed = raw.trim();

        AiStructuredResponse fromJson = tryParseStructured(trimmed, userPrompt);
        if (fromJson != null) {
            return fromJson;
        }

        Matcher fence = JSON_FENCE.matcher(trimmed);
        if (fence.find()) {
            AiStructuredResponse fenced = tryParseStructured(fence.group(1).trim(), userPrompt);
            if (fenced != null) {
                return fenced;
            }
        }

        return new AiStructuredResponse(trimmed, null);
    }

    private AiStructuredResponse tryParseStructured(String candidate, String userPrompt) {
        try {
            JsonNode root = objectMapper.readTree(candidate);
            if (!root.isObject()) {
                return null;
            }

            if (root.hasNonNull("markdown")) {
                String markdown = root.get("markdown").asText("").trim();
                String visualsJson = extractVisualsJson(root.get("visuals"), userPrompt);
                return new AiStructuredResponse(markdown, visualsJson);
            }

            if (root.has("visuals") && root.get("visuals").isObject()) {
                String markdown = root.path("markdown").asText("").trim();
                String visualsJson = extractVisualsJson(root.get("visuals"), userPrompt);
                return new AiStructuredResponse(markdown, visualsJson);
            }

            if (isVisualsPayload(root)) {
                String visualsJson = normalizeVisuals((ObjectNode) root, userPrompt);
                return new AiStructuredResponse("", visualsJson);
            }

            if (isChartSpec(root)) {
                return wrapChartAsResponse(root, userPrompt);
            }

            return null;
        } catch (Exception ex) {
            return null;
        }
    }

    private AiStructuredResponse wrapChartAsResponse(JsonNode chart, String userPrompt) {
        try {
            ObjectNode normalizedChart = normalizeChartNode((ObjectNode) chart.deepCopy(), userPrompt);
            ObjectNode visuals = objectMapper.createObjectNode();
            visuals.putArray("charts").add(normalizedChart);
            String title = normalizedChart.path("title").asText("Chart");
            String markdown = title.isBlank() ? "Chart based on your data." : "## " + title;
            return new AiStructuredResponse(markdown, objectMapper.writeValueAsString(visuals));
        } catch (Exception ex) {
            return null;
        }
    }

    private String extractVisualsJson(JsonNode visuals, String userPrompt) {
        if (visuals == null || visuals.isNull() || visuals.isEmpty()) {
            return null;
        }
        try {
            if (visuals.isObject()) {
                return normalizeVisuals((ObjectNode) visuals, userPrompt);
            }
            return objectMapper.writeValueAsString(visuals);
        } catch (Exception ex) {
            return null;
        }
    }

    private String normalizeVisuals(ObjectNode visuals, String userPrompt) throws Exception {
        ObjectNode normalized = visualsValidator.normalizeVisuals(visuals.deepCopy(), userPrompt);
        return objectMapper.writeValueAsString(normalized);
    }

    private ObjectNode normalizeChartNode(ObjectNode chart, String userPrompt) {
        ObjectNode visuals = objectMapper.createObjectNode();
        visuals.putArray("charts").add(chart);
        JsonNode normalized = visualsValidator.normalizeVisuals(visuals, userPrompt).path("charts").path(0);
        return normalized.isObject() ? (ObjectNode) normalized.deepCopy() : chart;
    }

    private boolean isChartSpec(JsonNode root) {
        return root.hasNonNull("type") && root.has("datasets") && root.get("datasets").isArray();
    }

    private boolean isVisualsPayload(JsonNode root) {
        return root.has("charts") || root.has("tables") || root.has("formulas") || root.has("blocks");
    }

}
