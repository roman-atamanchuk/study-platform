package ie.setu.study.modules.workspace.dto;

import java.time.OffsetDateTime;

public record UserCourseResponse(
    Long id,
    Long courseId,
    String displayName,
    String courseName,
    String courseCode,
    String programmeName,
    Integer semesterNumber,
    boolean archived,
    OffsetDateTime addedAt,
    boolean ownedByCurrentUser
) {}
