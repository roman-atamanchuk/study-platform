package ie.setu.study.modules.ai.service;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class AiPromptAnalyzer {

    private static final Pattern COMPACT_QUESTION = Pattern.compile(
        "(?:^|\\b)q\\s*(\\d+)\\s*([a-e])\\b",
        Pattern.CASE_INSENSITIVE
    );
    private static final Pattern QUESTION = Pattern.compile(
        "(?:question|q)\\s*(\\d+)(?!\\s*=)",
        Pattern.CASE_INSENSITIVE
    );
    private static final Pattern PART = Pattern.compile("(?:part\\s*)?\\(([a-e])\\)|\\bpart\\s+([a-e])\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern SUBPART = Pattern.compile("\\b(i{1,3}|iv|v|vi)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern LETTER_PAIR = Pattern.compile("\\b([a-e])\\s+(i{1,3}|iv|v|vi)\\b", Pattern.CASE_INSENSITIVE);

    public ParsedPrompt analyze(String prompt) {
        String normalized = AiPromptNormalizer.normalize(prompt);
        AiIntent intent = detectIntent(normalized);
        QuestionRef question = detectQuestion(normalized);
        return new ParsedPrompt(intent, question);
    }

    private AiIntent detectIntent(String normalized) {
        if (containsAny(
            normalized,
            "normal distribution",
            "bell curve",
            "gaussian",
            "gauss curve",
            "probability density"
        )) {
            return AiIntent.VISUALIZE;
        }
        if (containsAny(normalized, "boxplot", "box plot", "box-plot")) {
            return AiIntent.VISUALIZE;
        }
        if (containsAny(normalized, "bar chart", "barchart", "bar-chart", "histogram", "scatter plot", "violin plot")) {
            return AiIntent.VISUALIZE;
        }
        if (containsAny(normalized, "chart", "graph", "plot", "diagram")
            && containsAny(normalized, "show", "draw", "display", "visual", "see", "example", "create", "make", "new", "give")) {
            return AiIntent.VISUALIZE;
        }
        if (containsAny(normalized, "create new graph", "new graph", "new chart", "new boxplot")) {
            return AiIntent.VISUALIZE;
        }
        if (Pattern.compile("q[13]\\s*=\\s*\\d").matcher(normalized).find()
            && containsAny(normalized, "graph", "chart", "plot", "boxplot")) {
            return AiIntent.VISUALIZE;
        }
        if (containsAny(normalized, "formula", "notation", "which formula")) {
            return AiIntent.FORMULA;
        }
        if (containsAny(normalized, "extract", "quote", "copy question", "show question")) {
            return AiIntent.EXTRACT;
        }
        if (containsAny(normalized, "hint", "help me start", "where do i start")) {
            return AiIntent.HINT;
        }
        if (containsAny(normalized, "solve", "answer", "solution", "work out", "calculate")) {
            return AiIntent.SOLVE;
        }
        if (containsAny(normalized, "explain", "what does", "what is", "summarize", "summary")) {
            return AiIntent.EXPLAIN;
        }
        return AiIntent.GENERAL;
    }

    private QuestionRef detectQuestion(String normalized) {
        Matcher compact = COMPACT_QUESTION.matcher(normalized);
        if (compact.find()) {
            return new QuestionRef(
                Integer.parseInt(compact.group(1)),
                compact.group(2).toLowerCase(Locale.ROOT),
                detectSubPart(normalized)
            );
        }

        Integer questionNumber = matchFirstGroup(QUESTION, normalized);
        String partLetter = null;
        String subPart = null;

        Matcher letterPair = LETTER_PAIR.matcher(normalized);
        if (letterPair.find()) {
            partLetter = letterPair.group(1).toLowerCase(Locale.ROOT);
            subPart = letterPair.group(2).toLowerCase(Locale.ROOT);
        } else {
            Matcher part = PART.matcher(normalized);
            if (part.find()) {
                partLetter = firstNonBlank(part.group(1), part.group(2));
                if (partLetter != null) {
                    partLetter = partLetter.toLowerCase(Locale.ROOT);
                }
            }
            subPart = detectSubPart(normalized);
        }

        return new QuestionRef(questionNumber, partLetter, subPart);
    }

    private static String detectSubPart(String normalized) {
        Matcher sub = SUBPART.matcher(normalized);
        if (sub.find()) {
            return sub.group(1).toLowerCase(Locale.ROOT);
        }
        return null;
    }

    private static boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private static Integer matchFirstGroup(Pattern pattern, String text) {
        Matcher matcher = pattern.matcher(text);
        if (!matcher.find()) {
            return null;
        }
        return Integer.parseInt(matcher.group(1));
    }

    private static String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        if (second != null && !second.isBlank()) {
            return second;
        }
        return null;
    }
}
