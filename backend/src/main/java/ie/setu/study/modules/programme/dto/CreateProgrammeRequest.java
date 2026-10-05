package ie.setu.study.modules.programme.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProgrammeRequest(
    @NotBlank @Size(max = 32) String code,
    @NotBlank @Size(max = 255) String name,
    @Size(max = 255) String streamName,
    String description
) {
}
