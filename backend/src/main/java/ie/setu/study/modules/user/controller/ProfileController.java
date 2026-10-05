package ie.setu.study.modules.user.controller;

import ie.setu.study.modules.auth.security.CurrentUserProvider;
import ie.setu.study.modules.user.dto.ChangePasswordRequest;
import ie.setu.study.modules.user.dto.UpdateProfileRequest;
import ie.setu.study.modules.user.dto.UserResponse;
import ie.setu.study.modules.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ie.setu.study.common.exception.ApiException;
import ie.setu.study.modules.user.model.StudyUser;

@RestController
public class ProfileController {

    private final UserService userService;
    private final CurrentUserProvider currentUserProvider;
    private final PasswordEncoder passwordEncoder;

    public ProfileController(
        UserService userService,
        CurrentUserProvider currentUserProvider,
        PasswordEncoder passwordEncoder
    ) {
        this.userService = userService;
        this.currentUserProvider = currentUserProvider;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/me")
    public UserResponse getProfile() {
        return userService.getCurrentUserProfile();
    }

    @PatchMapping("/me")
    public UserResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateCurrentUserProfile(request);
    }

    @PatchMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        StudyUser user = currentUserProvider.requireCurrentUser();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException("INVALID_CREDENTIALS", "Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userService.saveUser(user);
    }
}
