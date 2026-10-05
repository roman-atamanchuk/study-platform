package ie.setu.study.modules.user.dto;

import ie.setu.study.common.enums.UserRole;

public record UserResponse(
    Long id,
    String firstName,
    String lastName,
    String email,
    String studentNumber,
    UserRole role,
    Long programmeId,
    Integer currentSemesterNumber
) {
}
