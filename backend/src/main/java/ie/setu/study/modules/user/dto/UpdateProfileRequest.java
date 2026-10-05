package ie.setu.study.modules.user.dto;

import ie.setu.study.modules.user.model.StudyUser;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @Size(min = 2, max = 50)
    @Pattern(regexp = "^[A-Za-z][A-Za-z\\s-]*[A-Za-z]$|^[A-Za-z]$", message = "First name must contain letters, spaces, or hyphens only")
    String firstName,

    @Size(min = 2, max = 50)
    @Pattern(regexp = "^[A-Za-z][A-Za-z\\s-]*[A-Za-z]$|^[A-Za-z]$", message = "Last name must contain letters, spaces, or hyphens only")
    String lastName,

    Long programmeId,

    @Min(1)
    @Max(8)
    Integer currentSemesterNumber
) {
    public void applyTo(StudyUser user) {
        if (firstName != null && !firstName.isBlank()) {
            user.setFirstName(firstName.trim());
        }
        if (lastName != null && !lastName.isBlank()) {
            user.setLastName(lastName.trim());
        }
        if (programmeId != null) {
            user.setProgrammeId(programmeId);
        }
        if (currentSemesterNumber != null) {
            user.setCurrentSemesterNumber(currentSemesterNumber);
        }
    }
}
