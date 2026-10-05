package ie.setu.study.modules.material.dto;

import ie.setu.study.common.enums.MaterialType;
import jakarta.validation.constraints.NotNull;

public record UpdateMaterialOrderRequest(@NotNull Integer displayOrder) {}
