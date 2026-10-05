package ie.setu.study.modules.user.service;

import ie.setu.study.common.exception.ApiException;
import ie.setu.study.modules.auth.security.CurrentUserProvider;
import ie.setu.study.modules.programme.repository.ProgrammeRepository;
import ie.setu.study.modules.user.dto.UpdateProfileRequest;
import ie.setu.study.modules.user.dto.UserResponse;
import ie.setu.study.modules.user.mapper.UserMapper;
import ie.setu.study.modules.user.model.StudyUser;
import ie.setu.study.modules.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ProgrammeRepository programmeRepository;
    private final UserMapper userMapper;
    private final CurrentUserProvider currentUserProvider;

    public UserService(
        UserRepository userRepository,
        ProgrammeRepository programmeRepository,
        UserMapper userMapper,
        CurrentUserProvider currentUserProvider
    ) {
        this.userRepository = userRepository;
        this.programmeRepository = programmeRepository;
        this.userMapper = userMapper;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile() {
        return userMapper.toResponse(currentUserProvider.requireCurrentUser());
    }

    @Transactional
    public UserResponse updateCurrentUserProfile(UpdateProfileRequest request) {
        StudyUser user = currentUserProvider.requireCurrentUser();
        if (request.programmeId() != null && !programmeRepository.existsById(request.programmeId())) {
            throw new ApiException("PROGRAMME_NOT_FOUND", "Selected programme was not found");
        }
        request.applyTo(user);
        StudyUser saved = userRepository.save(user);
        return userMapper.toResponse(saved);
    }

    @Transactional
    public void saveUser(StudyUser user) {
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        StudyUser user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "User not found"));
        return userMapper.toResponse(user);
    }
}
