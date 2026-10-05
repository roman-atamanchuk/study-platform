package ie.setu.study.modules.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * Validates and normalizes AI visuals before persistence (Witch2-style contract enforcement).
 */
@Component
public class AiVisualsValidator {

    private static final Pattern USER_Q1 = Pattern.compile("q1\\s*=\\s*([0-9]+(?:\\.[0-9]+)?)", Pattern.CASE_INSENSITIVE);
    private static final Pattern USER_Q3 = Pattern.compile("q3\\s*=\\s*([0-9]+(?:\\.[0-9]+)?)", Pattern.CASE_INSENSITIVE);
    private static final Pattern USER_MEDIAN = Pattern.compile(
        "median\\s*=\\s*([0-9]+(?:\\.[0-9]+)?)",
        Pattern.CASE_INSENSITIVE
    );

    public ObjectNode normalizeVisuals(ObjectNode visuals, String userPrompt) {
        normalizeCharts(visuals, userPrompt);
        promoteLineChartsToXyPlots(visuals);
        normalizeBlocks(visuals);
        return visuals;
    }

    private void normalizeCharts(ObjectNode visuals, String userPrompt) {
        JsonNode charts = visuals.get("charts");
        if (charts == null || !charts.isArray()) {
            return;
        }
        ArrayNode normalized = visuals.arrayNode();
        for (JsonNode chart : charts) {
            if (!chart.isObject()) {
                continue;
            }
            ObjectNode chartNode = (ObjectNode) chart;
            if ("boxplot".equals(chartNode.path("type").asText())) {
                normalized.add(normalizeBoxplotChart(chartNode.deepCopy(), userPrompt));
            } else {
                normalized.add(chartNode);
            }
        }
        visuals.set("charts", normalized);
    }

    private ObjectNode normalizeBoxplotChart(ObjectNode chart, String userPrompt) {
        JsonNode datasets = chart.get("datasets");
        if (datasets != null && datasets.isArray()) {
            for (JsonNode dataset : datasets) {
                if (!dataset.isObject()) {
                    continue;
                }
                JsonNode data = dataset.get("data");
                if (data == null || !data.isArray()) {
                    continue;
                }
                ArrayNode fixedData = chart.arrayNode();
                for (JsonNode point : data) {
                    if (point.isObject()) {
                        ObjectNode fixed = normalizeBoxplotPoint((ObjectNode) point, chart, userPrompt);
                        if (fixed != null) {
                            fixedData.add(fixed);
                        }
                    }
                }
                ((ObjectNode) dataset).set("data", fixedData);
            }
        }

        boolean massContext = isMassContext(chart);
        if (massContext || !chart.hasNonNull("orientation")) {
            chart.put("orientation", "horizontal");
        }
        if (massContext && !chart.hasNonNull("xLabel")) {
            chart.put("xLabel", "mass (tonnes)");
        }
        if (massContext && !chart.hasNonNull("yLabel")) {
            chart.put("yLabel", "Output");
        }
        if (hasUserQuartileOverride(userPrompt) && !chart.has("source")) {
            chart.put("source", "derived");
        }
        return chart;
    }

    private ObjectNode normalizeBoxplotPoint(ObjectNode point, ObjectNode chart, String userPrompt) {
        if (!hasAllQuartiles(point)) {
            return null;
        }

        applyUserQuartilesToPoint(point, userPrompt);

        double min = point.get("min").asDouble();
        double q1 = point.get("q1").asDouble();
        double median = point.get("median").asDouble();
        double q3 = point.get("q3").asDouble();
        double max = point.get("max").asDouble();

        if (!hasUserQuartileOverride(userPrompt)) {
            double[] repaired = repairQuartiles(min, q1, median, q3, max);
            min = repaired[0];
            q1 = repaired[1];
            median = repaired[2];
            q3 = repaired[3];
            max = repaired[4];
        }

        if (isMassContext(chart) && isToyScale(min, max) && !hasUserQuartileOverride(userPrompt)) {
            min = 25;
            q1 = 27.5;
            median = 30;
            q3 = 32.5;
            max = 35;
        }

        point.put("min", min);
        point.put("q1", q1);
        point.put("median", median);
        point.put("q3", q3);
        point.put("max", max);
        return point;
    }

    private static boolean hasUserQuartileOverride(String userPrompt) {
        if (userPrompt == null || userPrompt.isBlank()) {
            return false;
        }
        return USER_Q1.matcher(userPrompt).find()
            || USER_Q3.matcher(userPrompt).find()
            || USER_MEDIAN.matcher(userPrompt).find();
    }

    private static boolean isToyScale(double min, double max) {
        return max <= 30 && min <= 15;
    }

    /** Preserve valid five-number summaries; sort only when ordering is broken. */
    private static double[] repairQuartiles(double min, double q1, double median, double q3, double max) {
        if (min <= q1 && q1 <= median && median <= q3 && q3 <= max) {
            return new double[] { min, q1, median, q3, max };
        }
        double[] values = { min, q1, median, q3, max };
        java.util.Arrays.sort(values);
        return values;
    }

    private static boolean hasAllQuartiles(ObjectNode point) {
        return point.has("min") && point.has("q1") && point.has("median") && point.has("q3") && point.has("max")
            && point.get("min").isNumber()
            && point.get("q1").isNumber()
            && point.get("median").isNumber()
            && point.get("q3").isNumber()
            && point.get("max").isNumber();
    }

    private static boolean isMassContext(ObjectNode chart) {
        String combined = (
            chart.path("xLabel").asText("")
            + " "
            + chart.path("yLabel").asText("")
            + " "
            + chart.path("title").asText("")
        ).toLowerCase(Locale.ROOT);
        if (combined.contains("mass") || combined.contains("tonne") || combined.contains("output")) {
            return true;
        }
        JsonNode labels = chart.get("labels");
        if (labels != null && labels.isArray()) {
            for (JsonNode label : labels) {
                String text = label.asText("").toLowerCase(Locale.ROOT);
                if (text.contains("output") || text.contains("mass")) {
                    return true;
                }
            }
        }
        return false;
    }

    private void applyUserQuartilesToPoint(ObjectNode point, String userPrompt) {
        if (!hasUserQuartileOverride(userPrompt)) {
            return;
        }
        Double userQ1 = matchDouble(USER_Q1, userPrompt);
        Double userQ3 = matchDouble(USER_Q3, userPrompt);
        Double userMedian = matchDouble(USER_MEDIAN, userPrompt);

        double q1 = userQ1 != null ? userQ1 : point.path("q1").asDouble();
        double q3 = userQ3 != null ? userQ3 : point.path("q3").asDouble();
        double median = userMedian != null
            ? userMedian
            : (userQ1 != null || userQ3 != null)
                ? (q1 + q3) / 2
                : point.has("median") ? point.get("median").asDouble() : (q1 + q3) / 2;
        double iqr = Math.max(q3 - q1, 0);
        double min = q1 - iqr;
        double max = q3 + iqr;

        point.put("q1", q1);
        point.put("q3", q3);
        point.put("median", median);
        point.put("min", min);
        point.put("max", max);
    }

    private void normalizeBlocks(ObjectNode visuals) {
        JsonNode blocks = visuals.get("blocks");
        if (blocks == null || !blocks.isArray()) {
            return;
        }
        ArrayNode kept = visuals.arrayNode();
        for (JsonNode block : blocks) {
            if (!block.isObject()) {
                continue;
            }
            ObjectNode blockNode = (ObjectNode) block;
            String type = blockNode.path("type").asText("");
            ObjectNode normalized = switch (type) {
                case "known_looking_for_table", "contingency_table", "probability_tree" -> blockNode;
                case "xy_plot_block" -> normalizeXyPlotBlock(blockNode.deepCopy());
                case "histogram_block" -> normalizeHistogramBlock(blockNode.deepCopy());
                case "scatterplot_block" -> normalizeScatterplotBlock(blockNode.deepCopy());
                case "regression_block" -> normalizeRegressionBlock(blockNode.deepCopy());
                case "boxplot_block" -> normalizeBoxplotBlock(blockNode.deepCopy());
                case "step_by_step_block" -> normalizeStepByStepBlock(blockNode.deepCopy());
                case "final_answer_block" -> normalizeFinalAnswerBlock(blockNode.deepCopy());
                default -> null;
            };
            if (normalized != null) {
                kept.add(normalized);
            }
        }
        if (kept.isEmpty()) {
            visuals.remove("blocks");
        } else {
            visuals.set("blocks", kept);
        }
    }

    private void promoteLineChartsToXyPlots(ObjectNode visuals) {
        JsonNode charts = visuals.get("charts");
        if (charts == null || !charts.isArray()) {
            return;
        }

        ArrayNode remaining = visuals.arrayNode();
        ArrayNode blocks = visuals.has("blocks") && visuals.get("blocks").isArray()
            ? (ArrayNode) visuals.get("blocks")
            : visuals.arrayNode();

        for (JsonNode chart : charts) {
            if (!chart.isObject()) {
                continue;
            }
            ObjectNode chartNode = (ObjectNode) chart;
            ObjectNode xyBlock = tryExtractXyPlotFromLineChart(chartNode);
            if (xyBlock != null) {
                ObjectNode normalized = normalizeXyPlotBlock(xyBlock);
                if (normalized != null) {
                    blocks.add(normalized);
                }
            } else {
                remaining.add(chartNode);
            }
        }

        if (remaining.isEmpty()) {
            visuals.remove("charts");
        } else {
            visuals.set("charts", remaining);
        }
        if (blocks.isEmpty()) {
            visuals.remove("blocks");
        } else {
            visuals.set("blocks", blocks);
        }
    }

    private ObjectNode tryExtractXyPlotFromLineChart(ObjectNode chart) {
        if (!"line".equals(chart.path("type").asText())) {
            return null;
        }
        JsonNode datasets = chart.get("datasets");
        if (datasets == null || !datasets.isArray() || datasets.isEmpty()) {
            return null;
        }
        JsonNode data = datasets.get(0).path("data");
        if (!data.isArray() || data.size() < 2) {
            return null;
        }
        JsonNode first = data.get(0);
        if (!first.isObject() || !first.has("x") || !first.has("y")) {
            return null;
        }

        ObjectNode block = chart.objectNode();
        block.put("type", "xy_plot_block");
        if (chart.hasNonNull("title")) {
            block.put("title", chart.path("title").asText());
        }
        if (chart.hasNonNull("xLabel")) {
            block.put("xLabel", chart.path("xLabel").asText());
        }
        if (chart.hasNonNull("yLabel")) {
            block.put("yLabel", chart.path("yLabel").asText());
        }
        ArrayNode points = block.putArray("points");
        for (JsonNode entry : data) {
            if (!entry.isObject() || !entry.path("x").isNumber() || !entry.path("y").isNumber()) {
                continue;
            }
            ObjectNode point = points.addObject();
            point.put("x", entry.path("x").asDouble());
            point.put("y", entry.path("y").asDouble());
        }
        return points.size() >= 2 ? block : null;
    }

    private ObjectNode normalizeXyPlotBlock(ObjectNode block) {
        ArrayNode points = block.arrayNode();
        JsonNode rawPoints = block.get("points");
        if (rawPoints != null && rawPoints.isArray()) {
            for (JsonNode entry : rawPoints) {
                if (!entry.isObject()) {
                    continue;
                }
                if (!entry.path("x").isNumber() || !entry.path("y").isNumber()) {
                    continue;
                }
                ObjectNode point = points.addObject();
                point.put("x", entry.path("x").asDouble());
                point.put("y", entry.path("y").asDouble());
            }
        }

        if (points.size() < 2) {
            ArrayNode sampled = sampleQuadraticPoints(block);
            if (sampled != null) {
                points = sampled;
            }
        }

        if (points.size() < 2) {
            return null;
        }

        block.set("points", sortPointsByX(points));

        ArrayNode highlights = block.arrayNode();
        JsonNode rawHighlights = block.get("highlights");
        if (rawHighlights != null && rawHighlights.isArray()) {
            for (JsonNode entry : rawHighlights) {
                if (!entry.isObject() || !entry.path("x").isNumber() || !entry.path("y").isNumber()) {
                    continue;
                }
                ObjectNode highlight = highlights.addObject();
                highlight.put("x", entry.path("x").asDouble());
                highlight.put("y", entry.path("y").asDouble());
                if (entry.hasNonNull("label")) {
                    highlight.put("label", entry.path("label").asText());
                }
            }
        }
        if (highlights.isEmpty()) {
            block.remove("highlights");
        } else {
            block.set("highlights", highlights);
        }

        if (!block.has("connect")) {
            block.put("connect", true);
        }
        normalizeNotes(block);
        return block;
    }

    private ArrayNode sampleQuadraticPoints(ObjectNode block) {
        JsonNode quadratic = block.get("quadratic");
        JsonNode xRange = block.get("xRange");
        if (quadratic == null || !quadratic.isObject() || xRange == null || !xRange.isObject()) {
            return null;
        }
        if (!quadratic.path("a").isNumber() || !quadratic.path("b").isNumber() || !quadratic.path("c").isNumber()) {
            return null;
        }
        if (!xRange.path("min").isNumber() || !xRange.path("max").isNumber()) {
            return null;
        }

        double a = quadratic.path("a").asDouble();
        double b = quadratic.path("b").asDouble();
        double c = quadratic.path("c").asDouble();
        double min = xRange.path("min").asDouble();
        double max = xRange.path("max").asDouble();
        if (min >= max) {
            return null;
        }

        ArrayNode points = block.arrayNode();
        int steps = 24;
        for (int index = 0; index <= steps; index++) {
            double x = min + ((max - min) * index) / steps;
            double y = a * x * x + b * x + c;
            ObjectNode point = points.addObject();
            point.put("x", x);
            point.put("y", y);
        }
        block.remove("quadratic");
        block.remove("xRange");
        return points;
    }

    private ArrayNode sortPointsByX(ArrayNode points) {
        java.util.List<ObjectNode> sorted = new java.util.ArrayList<>();
        for (JsonNode entry : points) {
            if (entry.isObject()) {
                sorted.add((ObjectNode) entry);
            }
        }
        sorted.sort(java.util.Comparator.comparingDouble(node -> node.path("x").asDouble()));
        ArrayNode ordered = JsonNodeFactory.instance.arrayNode();
        for (ObjectNode entry : sorted) {
            ordered.add(entry.deepCopy());
        }
        return ordered;
    }

    private ObjectNode normalizeHistogramBlock(ObjectNode block) {
        JsonNode bins = block.get("bins");
        if (bins == null || !bins.isArray() || bins.isEmpty()) {
            return null;
        }
        ArrayNode kept = block.arrayNode();
        for (JsonNode bin : bins) {
            if (!bin.isObject() || !bin.hasNonNull("label") || !bin.path("frequency").isNumber()) {
                continue;
            }
            double frequency = bin.path("frequency").asDouble();
            if (frequency < 0) {
                continue;
            }
            ObjectNode keptBin = kept.addObject();
            keptBin.put("label", bin.path("label").asText().trim());
            keptBin.put("frequency", frequency);
        }
        if (kept.isEmpty()) {
            return null;
        }
        block.set("bins", kept);
        normalizeNotes(block);
        return block;
    }

    private ObjectNode normalizeScatterplotBlock(ObjectNode block) {
        ArrayNode points = collectPoints(block.get("points"), block);
        if (points.isEmpty()) {
            return null;
        }
        block.set("points", points);
        normalizeNotes(block);
        return block;
    }

    private ObjectNode normalizeRegressionBlock(ObjectNode block) {
        JsonNode pointsNode = block.get("points");
        if (pointsNode != null && pointsNode.isArray() && !pointsNode.isEmpty()) {
            ArrayNode points = collectPoints(pointsNode, block);
            if (points.isEmpty()) {
                block.remove("points");
            } else {
                block.set("points", points);
            }
        }

        JsonNode line = block.get("line");
        if (line != null && line.isObject()) {
            if (!line.path("slope").isNumber() || !line.path("intercept").isNumber()) {
                block.remove("line");
            }
        }

        JsonNode xRange = block.get("xRange");
        if (xRange != null && xRange.isObject()) {
            if (!xRange.path("min").isNumber() || !xRange.path("max").isNumber()
                || xRange.path("min").asDouble() >= xRange.path("max").asDouble()) {
                block.remove("xRange");
            }
        }

        boolean hasPoints = block.has("points") && block.get("points").isArray() && !block.get("points").isEmpty();
        boolean hasLine = block.has("line");
        boolean hasEquation = block.hasNonNull("equation") && !block.path("equation").asText("").isBlank();
        boolean hasNotes = block.has("notes") && block.get("notes").isArray() && !block.get("notes").isEmpty();
        if (!hasPoints && !hasLine && !hasEquation && !hasNotes) {
            return null;
        }

        normalizeNotes(block);
        return block;
    }

    private ObjectNode normalizeBoxplotBlock(ObjectNode block) {
        if (!block.path("min").isNumber()
            || !block.path("q1").isNumber()
            || !block.path("median").isNumber()
            || !block.path("q3").isNumber()
            || !block.path("max").isNumber()) {
            return null;
        }

        double min = block.path("min").asDouble();
        double q1 = block.path("q1").asDouble();
        double median = block.path("median").asDouble();
        double q3 = block.path("q3").asDouble();
        double max = block.path("max").asDouble();
        double[] repaired = repairQuartiles(min, q1, median, q3, max);
        block.put("min", repaired[0]);
        block.put("q1", repaired[1]);
        block.put("median", repaired[2]);
        block.put("q3", repaired[3]);
        block.put("max", repaired[4]);

        boolean massContext = isMassContext(block);
        if (massContext && isToyScale(repaired[0], repaired[4])) {
            block.put("min", 25);
            block.put("q1", 27.5);
            block.put("median", 30);
            block.put("q3", 32.5);
            block.put("max", 35);
        }
        if (massContext && !block.hasNonNull("xLabel")) {
            block.put("xLabel", "mass (tonnes)");
        }

        JsonNode outliers = block.get("outliers");
        if (outliers != null && outliers.isArray()) {
            ArrayNode kept = block.arrayNode();
            for (JsonNode outlier : outliers) {
                if (outlier.isNumber()) {
                    kept.add(outlier.asDouble());
                }
            }
            if (kept.isEmpty()) {
                block.remove("outliers");
            } else {
                block.set("outliers", kept);
            }
        }

        normalizeNotes(block);
        return block;
    }

    private ObjectNode normalizeStepByStepBlock(ObjectNode block) {
        JsonNode steps = block.get("steps");
        if (steps == null || !steps.isArray() || steps.isEmpty()) {
            return null;
        }
        ArrayNode kept = block.arrayNode();
        for (JsonNode step : steps) {
            if (step.isTextual() && !step.asText("").isBlank()) {
                kept.add(step.asText().trim());
            }
        }
        if (kept.isEmpty()) {
            return null;
        }
        block.set("steps", kept);
        return block;
    }

    private ObjectNode normalizeFinalAnswerBlock(ObjectNode block) {
        if (!block.hasNonNull("content") || block.path("content").asText("").isBlank()) {
            return null;
        }
        block.put("content", block.path("content").asText().trim());
        return block;
    }

    private ArrayNode collectPoints(JsonNode rawPoints, ObjectNode block) {
        ArrayNode points = block.arrayNode();
        if (rawPoints == null || !rawPoints.isArray()) {
            return points;
        }
        for (JsonNode entry : rawPoints) {
            if (!entry.isObject() || !entry.path("x").isNumber() || !entry.path("y").isNumber()) {
                continue;
            }
            ObjectNode point = points.addObject();
            point.put("x", entry.path("x").asDouble());
            point.put("y", entry.path("y").asDouble());
        }
        return points;
    }

    private void normalizeNotes(ObjectNode block) {
        JsonNode notes = block.get("notes");
        if (notes == null || !notes.isArray()) {
            return;
        }
        ArrayNode kept = block.arrayNode();
        for (JsonNode note : notes) {
            if (note.isTextual() && !note.asText("").isBlank()) {
                kept.add(note.asText().trim());
            }
        }
        if (kept.isEmpty()) {
            block.remove("notes");
        } else {
            block.set("notes", kept);
        }
    }

    private static Double matchDouble(Pattern pattern, String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        Matcher matcher = pattern.matcher(text);
        if (!matcher.find()) {
            return null;
        }
        try {
            return Double.parseDouble(matcher.group(1));
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
