package ie.setu.study.common.exception;

import ie.setu.study.common.dto.ApiErrorResponse;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException exception) {
        HttpStatus status = switch (exception.getCode()) {
            case "EMAIL_ALREADY_EXISTS", "STUDENT_NUMBER_ALREADY_EXISTS", "PROGRAMME_CODE_EXISTS" -> HttpStatus.CONFLICT;
            case "INVALID_CREDENTIALS" -> HttpStatus.UNAUTHORIZED;
            case "INVALID_TOKEN", "TOKEN_EXPIRED", "TOKEN_ALREADY_USED" -> HttpStatus.BAD_REQUEST;
            case "ACCESS_DENIED", "COURSE_HIDDEN" -> HttpStatus.FORBIDDEN;
            case "PROGRAMME_NOT_FOUND", "COURSE_NOT_FOUND", "USER_NOT_FOUND",
                 "USER_COURSE_NOT_FOUND", "MATERIAL_NOT_FOUND", "SHARE_LINK_NOT_FOUND",
                 "SHARED_ACCESS_NOT_FOUND", "FILE_NOT_FOUND", "ICON_NOT_FOUND" -> HttpStatus.NOT_FOUND;
            case "USER_COURSE_EXISTS", "SHARE_SELF" -> HttpStatus.CONFLICT;
            default -> HttpStatus.BAD_REQUEST;
        };
        return ResponseEntity.status(status)
            .body(new ApiErrorResponse(exception.getCode(), exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(MethodArgumentNotValidException exception) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return ResponseEntity.badRequest()
            .body(new ApiErrorResponse("VALIDATION_ERROR", "Validation failed", fieldErrors));
    }

    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(Exception exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ApiErrorResponse("INVALID_CREDENTIALS", "Invalid email or password"));
    }
}
