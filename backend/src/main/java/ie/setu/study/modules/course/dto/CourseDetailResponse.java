package ie.setu.study.modules.course.dto;

import ie.setu.study.common.enums.CourseStatus;

public record CourseDetailResponse(
    Long id,
    Long programmeId,
    String programmeName,
    String programmeCode,
    Integer semesterNumber,
    String name,
    String code,
    String iconUrl,
    String description,
    CourseStatus status,
    long publicMaterialCount,
    long totalMaterialCount
) {
}
