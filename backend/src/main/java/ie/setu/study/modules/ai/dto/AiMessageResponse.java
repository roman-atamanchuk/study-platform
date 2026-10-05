package ie.setu.study.modules.ai.dto;

import java.time.OffsetDateTime;

public record AiMessageResponse(
    Long id,
    String role,
    String content,
    String visualsJson,
    String modelId,
    boolean cached,
    OffsetDateTime createdAt
) {}
