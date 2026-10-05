package ie.setu.study.modules.course.dto;

import ie.setu.study.common.enums.CourseStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateCourseRequest(
    Long programmeId,
    @Min(1) @Max(8) Integer semesterNumber,
    @Size(max = 255) String name,
    @Size(max = 32) String code,
    String description,
    CourseStatus status
) {
    public boolean hasUpdates() {
        return programmeId != null || semesterNumber != null || name != null
            || code != null || description != null || status != null;
    }
}
