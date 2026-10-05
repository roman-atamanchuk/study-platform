package ie.setu.study.modules.ai.service;

public record ParsedPrompt(AiIntent intent, QuestionRef question) {

    public static ParsedPrompt general(String normalizedPrompt) {
        return new ParsedPrompt(AiIntent.GENERAL, new QuestionRef(null, null, null));
    }
}
