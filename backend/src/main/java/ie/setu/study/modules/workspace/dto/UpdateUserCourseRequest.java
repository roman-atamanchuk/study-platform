package ie.setu.study.modules.workspace.dto;

import jakarta.validation.constraints.Size;

public record UpdateUserCourseRequest(@Size(max = 255) String displayName) {}
