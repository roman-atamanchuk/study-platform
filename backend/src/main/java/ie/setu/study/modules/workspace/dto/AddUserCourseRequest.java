package ie.setu.study.modules.workspace.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AddUserCourseRequest(
    @NotNull Long courseId,
    @Size(max = 255) String displayName,
    Boolean createAnother
) {}
