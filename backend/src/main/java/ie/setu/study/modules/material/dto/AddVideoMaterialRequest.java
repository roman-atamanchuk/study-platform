package ie.setu.study.modules.material.dto;

import ie.setu.study.common.enums.MaterialVisibility;
import jakarta.validation.constraints.NotBlank;

public record AddVideoMaterialRequest(
    @NotBlank String title,
    String description,
    @NotBlank String videoId,
    String thumbnailUrl,
    Integer year,
    MaterialVisibility visibility,
    Long parentExamMaterialId
) {}
