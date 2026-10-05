package ie.setu.study.modules.auth.security;

import ie.setu.study.modules.user.model.StudyUser;
import ie.setu.study.modules.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserProvider {

    private final UserRepository userRepository;

    public CurrentUserProvider(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public StudyUser requireCurrentUser() {
        StudyUserDetails details = requireDetails();
        return userRepository.findById(details.getUserId())
            .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Not authenticated"));
    }

    public StudyUser getCurrentUserOrNull() {
        StudyUserDetails details = getDetailsOrNull();
        if (details == null) {
            return null;
        }
        return userRepository.findById(details.getUserId()).orElse(null);
    }

    public StudyUserDetails requireDetails() {
        StudyUserDetails details = getDetailsOrNull();
        if (details == null) {
            throw new org.springframework.security.access.AccessDeniedException("Not authenticated");
        }
        return details;
    }

    private StudyUserDetails getDetailsOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof StudyUserDetails details)) {
            return null;
        }
        return details;
    }
}
