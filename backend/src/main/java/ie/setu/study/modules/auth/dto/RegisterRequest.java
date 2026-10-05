package ie.setu.study.modules.auth.dto;

import ie.setu.study.modules.auth.validation.PasswordStrength;
import ie.setu.study.modules.auth.validation.SetuEmail;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank
    @Size(min = 2, max = 50)
    @Pattern(regexp = "^[A-Za-z][A-Za-z\\s-]*[A-Za-z]$|^[A-Za-z]$", message = "First name must contain letters, spaces, or hyphens only")
    String firstName,

    @NotBlank
    @Size(min = 2, max = 50)
    @Pattern(regexp = "^[A-Za-z][A-Za-z\\s-]*[A-Za-z]$|^[A-Za-z]$", message = "Last name must contain letters, spaces, or hyphens only")
    String lastName,

    @NotBlank
    @SetuEmail
    String email,

    @NotBlank
    @Pattern(regexp = "^[0-9]+$", message = "Student number must contain digits only")
    @Size(max = 32)
    String studentNumber,

    @NotBlank
    @Size(min = 8, max = 128)
    @PasswordStrength
    String password,

    Long programmeId,

    @Min(1)
    @Max(8)
    Integer currentSemesterNumber
) {
    public RegisterRequest {
        if (firstName != null) {
            firstName = firstName.trim();
        }
        if (lastName != null) {
            lastName = lastName.trim();
        }
        if (email != null) {
            email = email.trim().toLowerCase();
        }
        if (studentNumber != null) {
            studentNumber = studentNumber.trim();
        }
    }
}
