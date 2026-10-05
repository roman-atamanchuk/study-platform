package ie.setu.study.modules.material.dto;

import java.time.OffsetDateTime;

public record TrashMaterialResponse(
    MaterialResponse material,
    OffsetDateTime trashedAt,
    boolean canPermanentlyDelete
) {}
