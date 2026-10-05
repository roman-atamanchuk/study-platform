package ie.setu.study.modules.auth.dto;

import ie.setu.study.modules.auth.validation.PasswordStrength;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
    @NotBlank
    String token,

    @NotBlank
    @Size(min = 8, max = 128)
    @PasswordStrength
    String password
) {
}
