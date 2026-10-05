package ie.setu.study.modules.material.dto;

import ie.setu.study.common.enums.MaterialVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddNoteMaterialRequest(
    @NotBlank @Size(max = 255) String title,
    String htmlBody,
    MaterialVisibility visibility,
    Long parentExamMaterialId
) {}
