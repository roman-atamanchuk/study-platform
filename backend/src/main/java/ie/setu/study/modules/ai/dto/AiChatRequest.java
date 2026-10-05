package ie.setu.study.modules.ai.dto;

import ie.setu.study.common.enums.AiModel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AiChatRequest(
    @NotNull Long materialId,
    @NotNull Integer pageNumber,
    @NotBlank String prompt,
    @NotNull AiModel model,
    Long rightMaterialId,
    Integer rightPageNumber
) {}
