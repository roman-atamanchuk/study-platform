package ie.setu.study.modules.ai.service;

public final class AiTutorRules {

    private AiTutorRules() {}

    public static String systemPrompt(
        String courseName,
        String courseCode,
        ParsedPrompt parsed,
        boolean hasSolution,
        boolean hasLearningMaterials
    ) {
        String questionLine = parsed.question().label().isBlank()
            ? "Resolve the exact question part from parent context on the page when the student uses short labels like i, a, or Q1."
            : "The student is asking about: " + parsed.question().label() + ". Always include parent context from the full question and part (a), not only the sub-part.";

        String subjectRules = AiCourseVisualRules.subjectInstructions(courseCode);

        String intentBlock = switch (parsed.intent()) {
            case FORMULA -> """
                Extract formulas from the exam page and solution. Put each formula in visuals.formulas with LaTeX.
                Include a symbol table in visuals.tables with columns: Symbol, Meaning, Value (if known).
                """;
            case SOLVE -> """
                Extract numeric values from the exam and solution. Show working in markdown.
                Use visuals.blocks step_by_step_block for numbered working steps and final_answer_block for the result.
                """ + learningMaterialSolveHint(hasLearningMaterials)
                + (hasSolution ? "Add a comparison table in visuals.tables: Step, Your answer, Official solution, Match." : "");
            case EXTRACT -> """
                Quote exact exam wording in markdown. Optionally add visuals.tables with Question part | Exact text.
                """;
            case HINT -> """
                Give the first step only in markdown. No full numeric answer.
                """;
            case EXPLAIN -> """
                Explain in plain language in markdown. Add visuals.formulas if useful.
                """;
            case VISUALIZE -> """
                Extract numeric data from the exam page and official solution for the requested chart.
                Put the chart spec in visuals.charts — never describe a chart in markdown without visuals.
                For boxplots: use real or best-estimate min, q1, median, q3, max from the page/solution; set source field.
                Boxplots for mass/output MUST use orientation "horizontal" and xLabel "mass (tonnes)".
                Add visuals.tables with the five-number summary when showing a boxplot.
                For parabolas, quadratic curves, scatter plots, and function graphs: use visuals.blocks xy_plot_block with numeric points — NOT visuals.charts type line.
                For normal distribution / bell curve / Gaussian PDF requests: use xy_plot_block with sampled curve points and equation in LaTeX — never use a boxplot.
                For grouped frequency / histogram questions: use histogram_block with bins [{label, frequency}].
                For correlation or two-variable scatter questions: use scatterplot_block with points [{x, y}] — never connect dots with a line.
                For regression / fitted line questions: use regression_block with points, line {slope, intercept}, equation, and optional xRange.
                Prefer boxplot_block (in visuals.blocks) or visuals.charts boxplot for five-number summaries — include notes[] explaining interpretation.
                Sample at least 12 (x, y) pairs across the visible x-range; include vertex and roots in highlights when known.
                """;
            case GENERAL -> """
                Use the page context. Add visuals only when they clarify the answer.
                """;
        };

        String learningMaterialBlock = hasLearningMaterials
            ? """
            EXAM SOLUTION PRIORITY — LEARNING MATERIALS FIRST:
            Course learning materials (lecture notes, labs, course PDFs) are provided below the exam page.
            Before solving or explaining any exam question:
            1. Search learning materials for a matching method, formula, worked example, or answer.
            2. If relevant content exists: base your response on it — clarify, extend, or improve that explanation only. Do not replace with a different method unless the learning material is clearly incomplete.
            3. If nothing relevant exists in learning materials: then use the official solution (if attached), exam page context, and standard course methods.
            Mark values from lecture notes with source "learning_material" (use "exam", "solution", "derived", or "illustrative" otherwise).
            """
            : """
            No course learning materials were attached for this request.
            Use the official solution (if provided), exam page context, and standard methods.
            """;

        String solutionBlock = hasSolution
            ? """
            Official solution text is provided below the exam page (after learning materials).
            When learning materials already cover the question, treat the official solution as secondary confirmation — do not contradict the learning material method.
            Prefer values from learning materials, then the solution, when building tables and charts.
            """
            : """
            No official solution page was attached.
            If learning materials cover the question, use them. Otherwise mark inferred values with source "illustrative" or "derived".
            """;

        String blocksSchema = """
                "blocks": [
                  {
                    "type": "known_looking_for_table",
                    "known": [{"label": "n", "value": "30"}],
                    "lookingFor": "number of combinations"
                  },
                  {
                    "type": "contingency_table",
                    "title": "Observed counts",
                    "columns": ["", "Col A", "Col B"],
                    "rows": [["Row 1", "10", "20"]],
                    "highlight": [{"row": "Row 1", "column": "Col A"}]
                  },
                  {
                    "type": "probability_tree",
                    "title": "Sequential events",
                    "rootLabel": "Start",
                    "levels": [
                      {
                        "label": "First event",
                        "branches": [
                          {"id": "a", "label": "A", "probability": "0.4"},
                          {"id": "b", "label": "Not A", "probability": "0.6"}
                        ]
                      },
                      {
                        "label": "Second event",
                        "branchesByParent": {
                          "a": [{"id": "a-y", "label": "B given A", "probability": "0.25"}],
                          "b": [{"id": "b-y", "label": "B given not A", "probability": "0.10"}]
                        }
                      }
                    ],
                    "highlightPaths": [["a", "a-y"]]
                  },
                  {
                    "type": "xy_plot_block",
                    "title": "Parabola: y = x² − 4x + 3",
                    "equation": "y = x^2 - 4x + 3",
                    "xLabel": "x",
                    "yLabel": "y",
                    "points": [
                      {"x": -1, "y": 8},
                      {"x": 0, "y": 3},
                      {"x": 1, "y": 0},
                      {"x": 2, "y": -1},
                      {"x": 3, "y": 0},
                      {"x": 4, "y": 3},
                      {"x": 5, "y": 8}
                    ],
                    "highlights": [
                      {"x": 2, "y": -1, "label": "vertex"},
                      {"x": 1, "y": 0, "label": "root"},
                      {"x": 3, "y": 0, "label": "root"}
                    ],
                    "notes": ["U-shaped parabola opening upward"],
                    "connect": true
                  },
                  {
                    "type": "histogram_block",
                    "title": "Output frequency",
                    "xLabel": "mass (tonnes)",
                    "yLabel": "Frequency",
                    "bins": [{"label": "25–27", "frequency": 3}, {"label": "27–29", "frequency": 8}],
                    "notes": ["Roughly symmetric, centred near 30 tonnes"]
                  },
                  {
                    "type": "scatterplot_block",
                    "title": "Operators vs output",
                    "xLabel": "Operators",
                    "yLabel": "Output",
                    "points": [{"x": 2, "y": 10}, {"x": 4, "y": 16}, {"x": 6, "y": 22}],
                    "notes": ["Positive linear association"]
                  },
                  {
                    "type": "regression_block",
                    "title": "Regression of output on operators",
                    "xLabel": "Operators",
                    "yLabel": "Output",
                    "equation": "\\\\hat{y} = 0.026 + 3.21x",
                    "line": {"slope": 3.21, "intercept": 0.026},
                    "xRange": {"min": 0, "max": 10},
                    "notes": ["Slope 3.21: each extra operator adds ~3.21 units of output"]
                  },
                  {
                    "type": "boxplot_block",
                    "title": "Output distribution",
                    "label": "Output",
                    "xLabel": "mass (tonnes)",
                    "min": 25, "q1": 27.5, "median": 30, "q3": 32.5, "max": 35,
                    "notes": ["IQR ≈ 5 tonnes"]
                  },
                  {
                    "type": "step_by_step_block",
                    "steps": ["Identify n and r from the question", "Substitute into the combination formula", "Simplify"]
                  },
                  {
                    "type": "final_answer_block",
                    "content": "P(X ≤ 3) ≈ 0.042"
                  }
                ]
            """;

        return """
            You are a mathematics and statistics tutor for %s.
            %s

            %s

            %s

            %s

            %s

            RESPONSE FORMAT — return a single JSON object (no markdown fences):
            {
              "markdown": "Brief explanation in markdown. Use ## headers. Do NOT embed tables or chart JSON here.",
              "visuals": {
                "tables": [
                  {
                    "title": "Symbol table",
                    "headers": ["Symbol", "Meaning", "Value"],
                    "rows": [["n", "Total count", "64"]],
                    "source": "exam|solution|derived|illustrative"
                  }
                ],
                "charts": [
                  {
                    "type": "boxplot|bar|line|pie",
                    "title": "Chart title",
                    "orientation": "horizontal",
                    "xLabel": "mass (tonnes)",
                    "yLabel": "Output",
                    "labels": ["Output"],
                    "source": "exam|solution|derived|illustrative",
                    "datasets": [{"label": "Output", "data": [{"min":25,"q1":27.5,"median":30,"q3":32.5,"max":35,"outliers":[]}]}]
                  }
                ],
                "formulas": [
                  {
                    "name": "Combination formula",
                    "latex": "\\\\binom{n}{r} = \\\\frac{n!}{r!(n-r)!}",
                    "source": "exam|solution|derived"
                  }
                ],
            %s
              }
            }

            Rules:
            - For exam questions: check COURSE LEARNING MATERIALS first; only use other sources when no relevant answer exists there.
            - Extract numbers from the EXAM PAGE, LEARNING MATERIALS, and SOLUTION PAGE — do not invent values when they are present.
            - Put ALL tables in visuals.tables — not markdown pipe tables.
            - Put ALL charts in visuals.charts — the app renders boxplots with exam-style SVG and bar/pie charts with Plotly.
            - Put ALL formulas in visuals.formulas with LaTeX in the latex field.
            - Use visuals.blocks for known/looking-for tables, contingency tables, probability trees, xy_plot_block curves, histogram_block, scatterplot_block, regression_block, boxplot_block, step_by_step_block, and final_answer_block.
            - For parabolas and continuous curves: use xy_plot_block with points [{x, y}, ...]. Never use visuals.charts line type with only axis labels and no y values.
            - For scatter/correlation: scatterplot_block (dots only). For regression with fitted line: regression_block.
            - For histograms / grouped frequency: histogram_block with bins [{label, frequency}].
            - For solve/working questions: step_by_step_block + final_answer_block.
            - Add notes[] under chart blocks to explain shape, slope, spread, or interpretation.
            - xy_plot_block may include quadratic {a, b, c} and xRange {min, max} instead of points; the app will sample the curve.
            - Put LaTeX in xy_plot_block.equation and visuals.formulas.latex (no $ delimiters) — the app renders with KaTeX.
            - In step_by_step_block, final_answer_block, and table cells you may use inline math with \\( ... \\) delimiters — the app renders them with KaTeX.
            - Keep markdown short: interpretation and steps only.
            - Omit empty arrays from visuals if not needed.
            """.formatted(courseName, questionLine, subjectRules, learningMaterialBlock, intentBlock, solutionBlock, blocksSchema);
    }

    private static String learningMaterialSolveHint(boolean hasLearningMaterials) {
        if (!hasLearningMaterials) {
            return "";
        }
        return """
            
            If learning materials contain a worked solution for this question, improve that working — do not invent a different approach.
            """;
    }
}
