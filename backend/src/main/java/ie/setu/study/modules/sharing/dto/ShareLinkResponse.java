package ie.setu.study.modules.sharing.dto;

import java.time.OffsetDateTime;

public record ShareLinkResponse(
    Long id,
    String token,
    String label,
    OffsetDateTime createdAt,
    OffsetDateTime expiresAt,
    boolean active,
    String shareUrl
) {}
