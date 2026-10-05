package ie.setu.study.modules.ai.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

class AiVisualsValidatorTest {

    private final AiVisualsValidator validator = new AiVisualsValidator();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void fixesToyScaleBoxplotForMassContext() throws Exception {
        ObjectNode chart = objectMapper.createObjectNode();
        chart.put("type", "boxplot");
        chart.put("title", "Output mass");
        chart.putArray("labels").add("Output");
        ObjectNode dataset = chart.putArray("datasets").addObject();
        dataset.put("label", "Output");
        ObjectNode point = dataset.putArray("data").addObject();
        point.put("min", 10);
        point.put("q1", 15);
        point.put("median", 20);
        point.put("q3", 25);
        point.put("max", 30);

        ObjectNode visuals = objectMapper.createObjectNode();
        visuals.putArray("charts").add(chart);

        ObjectNode normalized = validator.normalizeVisuals(visuals, "boxplot");
        ObjectNode fixed = (ObjectNode) normalized.path("charts").path(0).path("datasets").path(0).path("data").path(0);

        assertEquals("horizontal", normalized.path("charts").path(0).path("orientation").asText());
        assertEquals(25, fixed.path("min").asDouble(), 0.01);
        assertEquals(35, fixed.path("max").asDouble(), 0.01);
    }

    @Test
    void appliesUserQuartilesFromPrompt() throws Exception {
        ObjectNode chart = objectMapper.createObjectNode();
        chart.put("type", "boxplot");
        chart.put("xLabel", "mass (tonnes)");
        chart.putArray("labels").add("Output");
        ObjectNode point = chart.putArray("datasets").addObject().putArray("data").addObject();
        point.put("min", 1);
        point.put("q1", 2);
        point.put("median", 3);
        point.put("q3", 4);
        point.put("max", 5);

        ObjectNode visuals = objectMapper.createObjectNode();
        visuals.putArray("charts").add(chart);

        ObjectNode normalized = validator.normalizeVisuals(visuals, "q1=28 q3=32 graph");
        ObjectNode fixed = (ObjectNode) normalized.path("charts").path(0).path("datasets").path(0).path("data").path(0);

        assertEquals(28, fixed.path("q1").asDouble(), 0.01);
        assertEquals(32, fixed.path("q3").asDouble(), 0.01);
        assertEquals(30, fixed.path("median").asDouble(), 0.01);
    }

    @Test
    void keepsAllowedBlocksOnly() {
        ObjectNode visuals = objectMapper.createObjectNode();
        ObjectNode allowed = visuals.putArray("blocks").addObject();
        allowed.put("type", "known_looking_for_table");
        allowed.put("lookingFor", "P(A)");
        ObjectNode rejected = visuals.withArray("blocks").addObject();
        rejected.put("type", "unknown_block");

        ObjectNode normalized = validator.normalizeVisuals(visuals, "");
        assertEquals(1, normalized.path("blocks").size());
        assertEquals("known_looking_for_table", normalized.path("blocks").path(0).path("type").asText());
    }

    @Test
    void normalizesXyPlotBlockAndSortsPoints() {
        ObjectNode block = objectMapper.createObjectNode();
        block.put("type", "xy_plot_block");
        block.put("title", "Parabola");
        ArrayNode points = block.putArray("points");
        points.addObject().put("x", 2).put("y", -1);
        points.addObject().put("x", 0).put("y", 3);
        points.addObject().put("x", 1).put("y", 0);

        ObjectNode visuals = objectMapper.createObjectNode();
        visuals.putArray("blocks").add(block);

        ObjectNode normalized = validator.normalizeVisuals(visuals, "");
        assertEquals(3, normalized.path("blocks").path(0).path("points").size());
        assertEquals(0, normalized.path("blocks").path(0).path("points").path(0).path("x").asDouble(), 0.01);
        assertTrue(normalized.path("blocks").path(0).path("connect").asBoolean());
    }

    @Test
    void samplesQuadraticWhenPointsMissing() {
        ObjectNode block = objectMapper.createObjectNode();
        block.put("type", "xy_plot_block");
        block.put("equation", "y = x² − 4x + 3");
        block.putObject("quadratic").put("a", 1).put("b", -4).put("c", 3);
        block.putObject("xRange").put("min", -1).put("max", 5);

        ObjectNode visuals = objectMapper.createObjectNode();
        visuals.putArray("blocks").add(block);

        ObjectNode normalized = validator.normalizeVisuals(visuals, "");
        assertTrue(normalized.path("blocks").path(0).path("points").size() >= 12);
        assertTrue(normalized.path("blocks").path(0).path("quadratic").isMissingNode());
    }

    @Test
    void promotesLineChartWithPointObjectsToXyPlotBlock() {
        ObjectNode chart = objectMapper.createObjectNode();
        chart.put("type", "line");
        chart.put("title", "Parabola");
        ObjectNode dataset = chart.putArray("datasets").addObject();
        ArrayNode data = dataset.putArray("data");
        data.addObject().put("x", -1).put("y", 8);
        data.addObject().put("x", 0).put("y", 3);
        data.addObject().put("x", 1).put("y", 0);

        ObjectNode visuals = objectMapper.createObjectNode();
        visuals.putArray("charts").add(chart);

        ObjectNode normalized = validator.normalizeVisuals(visuals, "");
        assertTrue(normalized.path("charts").isMissingNode() || normalized.path("charts").size() == 0);
        assertEquals("xy_plot_block", normalized.path("blocks").path(0).path("type").asText());
        assertEquals(3, normalized.path("blocks").path(0).path("points").size());
    }

    @Test
    void keepsHistogramBlock() {
        ObjectNode block = objectMapper.createObjectNode();
        block.put("type", "histogram_block");
        block.put("title", "Freq");
        ArrayNode bins = block.putArray("bins");
        bins.addObject().put("label", "0-10").put("frequency", 5);
        bins.addObject().put("label", "10-20").put("frequency", -1);

        ObjectNode visuals = objectMapper.createObjectNode();
        visuals.putArray("blocks").add(block);

        ObjectNode normalized = validator.normalizeVisuals(visuals, "");
        assertEquals(1, normalized.path("blocks").size());
        assertEquals("histogram_block", normalized.path("blocks").path(0).path("type").asText());
        assertEquals(1, normalized.path("blocks").path(0).path("bins").size());
    }

    @Test
    void keepsRegressionBlockWithLineOnly() {
        ObjectNode block = objectMapper.createObjectNode();
        block.put("type", "regression_block");
        block.put("equation", "y = 2x + 1");
        block.putObject("line").put("slope", 2).put("intercept", 1);
        block.putObject("xRange").put("min", 0).put("max", 5);

        ObjectNode visuals = objectMapper.createObjectNode();
        visuals.putArray("blocks").add(block);

        ObjectNode normalized = validator.normalizeVisuals(visuals, "");
        assertEquals("regression_block", normalized.path("blocks").path(0).path("type").asText());
        assertEquals(2, normalized.path("blocks").path(0).path("line").path("slope").asDouble(), 0.01);
    }

    @Test
    void keepsStepByStepAndFinalAnswerBlocks() {
        ObjectNode visuals = objectMapper.createObjectNode();
        ArrayNode blocks = visuals.putArray("blocks");
        ObjectNode steps = blocks.addObject();
        steps.put("type", "step_by_step_block");
        steps.putArray("steps").add("Step one").add("  ");
        ObjectNode answer = blocks.addObject();
        answer.put("type", "final_answer_block");
        answer.put("content", "  42  ");

        ObjectNode normalized = validator.normalizeVisuals(visuals, "");
        assertEquals(2, normalized.path("blocks").size());
        assertEquals(1, normalized.path("blocks").path(0).path("steps").size());
        assertEquals("42", normalized.path("blocks").path(1).path("content").asText());
    }

    @Test
    void subjectRulesPresentForStatisticsCourse() {
        String rules = AiCourseVisualRules.subjectInstructions("STAT_&_PROB");
        assertTrue(rules.contains("mass (tonnes)"));
        assertTrue(rules.contains("histogram_block"));
        assertTrue(rules.contains("regression_block"));
    }
}
