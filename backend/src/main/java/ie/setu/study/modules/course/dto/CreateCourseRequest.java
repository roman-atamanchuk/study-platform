package ie.setu.study.modules.course.dto;

import ie.setu.study.common.enums.CourseStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateCourseRequest(
    @NotNull Long programmeId,
    @NotNull @Min(1) @Max(8) Integer semesterNumber,
    @NotBlank @Size(max = 255) String name,
    @Size(max = 32) String code,
    String description,
    CourseStatus status
) {
    public CreateCourseRequest {
        if (status == null) {
            status = CourseStatus.PUBLISHED;
        }
    }
}
