package ie.setu.study.modules.course.dto;

import ie.setu.study.common.enums.CourseStatus;

public record CourseSummaryResponse(
    Long id,
    Long programmeId,
    Integer semesterNumber,
    String name,
    String code,
    String iconUrl,
    CourseStatus status,
    long publicMaterialCount
) {
}
