package ie.setu.study.modules.material.dto;

import ie.setu.study.common.enums.MaterialVisibility;
import jakarta.validation.constraints.NotNull;

public record UpdateMaterialVisibilityRequest(@NotNull MaterialVisibility visibility) {}
