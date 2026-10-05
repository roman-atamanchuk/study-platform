package ie.setu.study.modules.ai.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AiStructuredResponseParserTest {

    private AiStructuredResponseParser parser;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        parser = new AiStructuredResponseParser(objectMapper, new AiVisualsValidator());
    }

    @Test
    void parsesStructuredResponseWithMarkdownAndVisuals() throws Exception {
        String raw =
            """
            {
              "markdown": "## Q1",
              "visuals": {
                "formulas": [{"name": "Combination", "latex": "\\\\binom{n}{r}", "source": "exam"}]
              }
            }
            """;

        AiStructuredResponse result = parser.parse(raw, ParsedPrompt.general(""), "formula for q1");

        assertEquals("## Q1", result.markdown());
        assertNotNull(result.visualsJson());
        JsonNode visuals = objectMapper.readTree(result.visualsJson());
        assertEquals(1, visuals.path("formulas").size());
    }

    @Test
    void wrapsBareChartJsonIntoVisuals() throws Exception {
        String raw =
            """
            {
              "type": "boxplot",
              "title": "Output",
              "labels": ["Output"],
              "datasets": [{"label": "Output", "data": [{"min":10,"q1":15,"median":20,"q3":25,"max":30}]}]
            }
            """;

        AiStructuredResponse result = parser.parse(
            raw,
            new ParsedPrompt(AiIntent.VISUALIZE, new QuestionRef(5, "b", null)),
            "q5b boxplot"
        );

        assertNotNull(result.visualsJson());
        JsonNode chart = objectMapper.readTree(result.visualsJson()).path("charts").path(0);
        assertEquals("boxplot", chart.path("type").asText());
        assertEquals("horizontal", chart.path("orientation").asText());
        JsonNode point = chart.path("datasets").path(0).path("data").path(0);
        assertEquals(25, point.path("min").asDouble(), 0.01);
        assertEquals(35, point.path("max").asDouble(), 0.01);
    }

    @Test
    void appliesUserQuartileOverrides() throws Exception {
        String raw =
            """
            {
              "markdown": "## Custom",
              "visuals": {
                "charts": [{
                  "type": "boxplot",
                  "title": "Custom",
                  "xLabel": "mass (tonnes)",
                  "labels": ["Output"],
                  "datasets": [{"label": "Output", "data": [{"min":1,"q1":2,"median":3,"q3":4,"max":5}]}]
                }]
              }
            }
            """;

        AiStructuredResponse result = parser.parse(
            raw,
            new ParsedPrompt(AiIntent.VISUALIZE, new QuestionRef(5, null, null)),
            "q1=28 q3=32 create graph"
        );

        JsonNode point = objectMapper.readTree(result.visualsJson()).path("charts").path(0).path("datasets").path(0).path("data").path(0);
        assertEquals(28, point.path("q1").asDouble(), 0.01);
        assertEquals(32, point.path("q3").asDouble(), 0.01);
        assertEquals(30, point.path("median").asDouble(), 0.01);
    }

    @Test
    void doesNotInjectSyntheticBoxplotForGraphPrompts() {
        AiStructuredResponse result = parser.parse(
            "Here is an explanation of the normal distribution.",
            ParsedPrompt.general(""),
            "give graph of normal distribution"
        );

        assertEquals("Here is an explanation of the normal distribution.", result.markdown());
        assertTrue(result.visualsJson() == null || result.visualsJson().isBlank());
    }

    @Test
    void rejectsInvalidBoxplotPointsWithoutNumbers() throws Exception {
        String raw =
            """
            {
              "markdown": "## Broken",
              "visuals": {
                "charts": [{
                  "type": "boxplot",
                  "labels": ["Data"],
                  "datasets": [{"label": "Data", "data": [{"min":null,"q1":15,"median":20,"q3":25,"max":30}]}]
                }]
              }
            }
            """;

        AiStructuredResponse result = parser.parse(raw, ParsedPrompt.general(""), "boxplot");

        assertNotNull(result.visualsJson());
        JsonNode data = objectMapper.readTree(result.visualsJson()).path("charts").path(0).path("datasets").path(0).path("data");
        assertTrue(data.isEmpty() || data.path(0).isMissingNode());
    }
}
