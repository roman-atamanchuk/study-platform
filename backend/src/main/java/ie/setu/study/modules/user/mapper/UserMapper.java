package ie.setu.study.modules.user.mapper;

import ie.setu.study.modules.user.dto.UserResponse;
import ie.setu.study.modules.user.model.StudyUser;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(StudyUser user) {
        return new UserResponse(
            user.getId(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            user.getStudentNumber(),
            user.getRole(),
            user.getProgrammeId(),
            user.getCurrentSemesterNumber()
        );
    }
}
