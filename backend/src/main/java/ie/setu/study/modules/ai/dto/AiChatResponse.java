package ie.setu.study.modules.ai.dto;

public record AiChatResponse(
    Long threadId,
    AiMessageResponse userMessage,
    AiMessageResponse assistantMessage,
    String promptNormalized,
    String resolvedQuestion,
    String solutionMaterialTitle
) {}
