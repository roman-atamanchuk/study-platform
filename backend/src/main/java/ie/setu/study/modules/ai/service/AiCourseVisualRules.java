package ie.setu.study.modules.ai.service;

/**
 * Course-specific visual guidance (inspired by Witch2 subject-rules.json).
 */
public final class AiCourseVisualRules {

    private AiCourseVisualRules() {}

    public static String subjectInstructions(String courseCode) {
        if (courseCode == null || courseCode.isBlank()) {
            return "";
        }
        String normalized = courseCode.trim().toUpperCase();
        if ("STAT_&_PROB".equals(normalized) || "STAT101".equals(normalized)) {
            return STATISTICS_PROBABILITY;
        }
        return "";
    }

    private static final String STATISTICS_PROBABILITY = """
        STATISTICS & PROBABILITY RULES:
        - Boxplots for mass/output: use boxplot_block or charts boxplot with orientation "horizontal", xLabel "mass (tonnes)", exam-scale values (typically 20–40).
        - Always add visuals.tables with a five-number summary when showing a boxplot.
        - Combination/permutation questions: visuals.formulas + symbol table; optionally known_looking_for_table.
        - Two-way category tables: contingency_table with highlight cells used in calculations.
        - Sequential probability: probability_tree when the question asks for a tree or sequential events.
        - Grouped frequency / distribution shape: histogram_block with short bin labels and notes on skew/symmetry.
        - Correlation / scatter interpretation: scatterplot_block with numeric points and notes on direction/strength.
        - Regression / prediction / slope-intercept interpretation: regression_block with equation, line {slope, intercept}, and notes.
        - Solve/calculate questions: step_by_step_block for working + final_answer_block for the result.
        - Mark every value with source: exam, solution, learning_material, derived, or illustrative.
        - For exam solutions: search learning materials first; if an answer exists there, improve it only — otherwise use official solution or standard methods.
        """;
}
