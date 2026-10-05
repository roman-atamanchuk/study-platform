package ie.setu.study.modules.user.dto;

import ie.setu.study.modules.auth.validation.PasswordStrength;
import jakarta.validation.constraints.NotBlank;

public record ChangePasswordRequest(
    @NotBlank String currentPassword,
    @NotBlank @PasswordStrength String newPassword
) {}
