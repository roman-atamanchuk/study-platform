package ie.setu.study.modules.auth.service;

import ie.setu.study.common.enums.UserRole;
import ie.setu.study.common.exception.ApiException;
import ie.setu.study.common.util.TokenHashUtil;
import ie.setu.study.modules.auth.dto.ForgotPasswordRequest;
import ie.setu.study.modules.auth.dto.ForgotPasswordResponse;
import ie.setu.study.modules.auth.dto.LoginRequest;
import ie.setu.study.modules.auth.dto.RegisterRequest;
import ie.setu.study.modules.auth.dto.ResetPasswordRequest;
import ie.setu.study.modules.auth.model.PasswordResetToken;
import ie.setu.study.modules.auth.repository.PasswordResetTokenRepository;
import ie.setu.study.modules.auth.security.CurrentUserProvider;
import ie.setu.study.modules.auth.security.StudyUserDetails;
import ie.setu.study.modules.programme.repository.ProgrammeRepository;
import ie.setu.study.modules.user.dto.UserResponse;
import ie.setu.study.modules.user.mapper.UserMapper;
import ie.setu.study.modules.user.model.StudyUser;
import ie.setu.study.modules.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.time.OffsetDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final ProgrammeRepository programmeRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final CurrentUserProvider currentUserProvider;
    private final long passwordResetTtlHours;
    private final boolean exposeResetToken;
    private final String frontendBaseUrl;

    public AuthService(
        UserRepository userRepository,
        ProgrammeRepository programmeRepository,
        PasswordResetTokenRepository passwordResetTokenRepository,
        PasswordEncoder passwordEncoder,
        AuthenticationManager authenticationManager,
        UserMapper userMapper,
        CurrentUserProvider currentUserProvider,
        @Value("${app.auth.password-reset-ttl-hours:24}") long passwordResetTtlHours,
        @Value("${app.auth.expose-reset-token:false}") boolean exposeResetToken,
        @Value("${app.frontend-base-url:http://localhost:5173}") String frontendBaseUrl
    ) {
        this.userRepository = userRepository;
        this.programmeRepository = programmeRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.userMapper = userMapper;
        this.currentUserProvider = currentUserProvider;
        this.passwordResetTtlHours = passwordResetTtlHours;
        this.exposeResetToken = exposeResetToken;
        this.frontendBaseUrl = trimTrailingSlash(frontendBaseUrl);
    }

    @Transactional
    public UserResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException("EMAIL_ALREADY_EXISTS", "Email is already registered");
        }
        if (userRepository.existsByStudentNumber(request.studentNumber())) {
            throw new ApiException("STUDENT_NUMBER_ALREADY_EXISTS", "Student number is already registered");
        }

        StudyUser user = new StudyUser();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setStudentNumber(request.studentNumber());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.USER);
        if (request.programmeId() != null) {
            if (!programmeRepository.existsById(request.programmeId())) {
                throw new ApiException("PROGRAMME_NOT_FOUND", "Selected programme was not found");
            }
            user.setProgrammeId(request.programmeId());
        }
        if (request.currentSemesterNumber() != null) {
            user.setCurrentSemesterNumber(request.currentSemesterNumber());
        }

        StudyUser saved = userRepository.save(user);
        authenticateAndPersistSession(saved, request.password(), httpRequest);
        saved.setLastLoginAt(OffsetDateTime.now());
        userRepository.save(saved);

        return userMapper.toResponse(saved);
    }

    @Transactional
    public UserResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        persistSession(authentication, httpRequest);

        StudyUserDetails details = (StudyUserDetails) authentication.getPrincipal();
        StudyUser user = userRepository.findById(details.getUserId())
            .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "User not found"));
        user.setLastLoginAt(OffsetDateTime.now());
        user.setLastActiveAt(OffsetDateTime.now());
        userRepository.save(user);

        return userMapper.toResponse(user);
    }

    public void logout(HttpServletRequest httpRequest) {
        SecurityContextHolder.clearContext();
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        return userMapper.toResponse(currentUserProvider.requireCurrentUser());
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        String genericMessage =
            "If an account exists for that email, password reset instructions are available.";

        return userRepository.findByEmail(request.email()).map(user -> {
            String rawToken = TokenHashUtil.generateRawToken();
            PasswordResetToken token = new PasswordResetToken();
            token.setUser(user);
            token.setTokenHash(TokenHashUtil.hashToken(rawToken));
            token.setExpiresAt(OffsetDateTime.now().plusHours(passwordResetTtlHours));
            passwordResetTokenRepository.save(token);

            log.info("Password reset token generated for {} (dev only log): {}", user.getEmail(), rawToken);

            if (exposeResetToken) {
                String resetUrl = frontendBaseUrl + "/reset-password?token=" + rawToken;
                return ForgotPasswordResponse.withDevToken(
                    "Password reset link ready (local/dev — email is not sent yet).",
                    rawToken,
                    resetUrl
                );
            }
            return ForgotPasswordResponse.generic(genericMessage);
        }).orElseGet(() -> ForgotPasswordResponse.generic(genericMessage));
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String tokenHash = TokenHashUtil.hashToken(request.token());
        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new ApiException("INVALID_TOKEN", "Invalid password reset token"));

        if (token.getUsedAt() != null) {
            throw new ApiException("TOKEN_ALREADY_USED", "Password reset token has already been used");
        }
        if (token.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new ApiException("TOKEN_EXPIRED", "Password reset token has expired");
        }

        StudyUser user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        token.setUsedAt(OffsetDateTime.now());
        userRepository.save(user);
        passwordResetTokenRepository.save(token);
    }

    private void authenticateAndPersistSession(StudyUser user, String rawPassword, HttpServletRequest httpRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(user.getEmail(), rawPassword)
        );
        persistSession(authentication, httpRequest);
    }

    private static String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "http://localhost:5173";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private void persistSession(Authentication authentication, HttpServletRequest httpRequest) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(
            HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
            context
        );
    }
}
