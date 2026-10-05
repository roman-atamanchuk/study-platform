package ie.setu.study.modules.ai.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.regex.Pattern;

public final class AiPromptNormalizer {

    private static final Pattern MULTI_SPACE = Pattern.compile("\\s+");

    private AiPromptNormalizer() {}

    public static String normalize(String prompt) {
        if (prompt == null) {
            return "";
        }
        String trimmed = prompt.trim().toLowerCase(Locale.ROOT);
        trimmed = fixCommonTypos(trimmed);
        return MULTI_SPACE.matcher(trimmed).replaceAll(" ").trim();
    }

    static String fixCommonTypos(String value) {
        return value
            .replace("explan ", "explain ")
            .replace("giv ", "give ")
            .replace("soluion", "solution")
            .replace("quesion", "question")
            .replace(" ques ", " question ")
            .replace(" quetion", " question");
    }

    public static String cacheKey(
        Long courseId,
        Long materialId,
        int pageNumber,
        String modelId,
        String normalizedPrompt,
        String intent,
        String questionKey,
        Long solutionMaterialId
    ) {
        String raw = courseId
            + "|" + materialId
            + "|" + pageNumber
            + "|" + modelId
            + "|" + normalizedPrompt
            + "|" + intent
            + "|" + questionKey
            + "|struct-v9"
            + "|" + (solutionMaterialId == null ? "none" : solutionMaterialId);
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 unavailable", ex);
        }
    }
}
