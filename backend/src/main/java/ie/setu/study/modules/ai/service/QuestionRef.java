package ie.setu.study.modules.ai.service;

import java.util.Optional;

public record QuestionRef(Integer questionNumber, String partLetter, String subPartRoman) {

    public String label() {
        StringBuilder builder = new StringBuilder();
        if (questionNumber != null) {
            builder.append("Q").append(questionNumber);
        }
        if (partLetter != null && !partLetter.isBlank()) {
            builder.append(" (").append(partLetter.toLowerCase()).append(")");
        }
        if (subPartRoman != null && !subPartRoman.isBlank()) {
            builder.append(" (").append(subPartRoman.toLowerCase()).append(")");
        }
        return builder.toString().trim();
    }

    public String cacheKey() {
        return "%s|%s|%s".formatted(
            Optional.ofNullable(questionNumber).map(Object::toString).orElse(""),
            Optional.ofNullable(partLetter).orElse("").toLowerCase(),
            Optional.ofNullable(subPartRoman).orElse("").toLowerCase()
        );
    }
}
