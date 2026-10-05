package ie.setu.study.modules.sharing.dto;

import java.time.OffsetDateTime;

public record SharedCourseResponse(
    Long sharedAccessId,
    Long userCourseId,
    Long courseId,
    String courseName,
    String courseCode,
    String ownerName,
    OffsetDateTime sharedAt
) {}
