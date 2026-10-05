package ie.setu.study.modules.auth.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class SetuEmailValidator implements ConstraintValidator<SetuEmail, String> {

    private static final Pattern SETU_EMAIL = Pattern.compile("^[A-Za-z0-9._%+-]+@setu\\.ie$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }
        return SETU_EMAIL.matcher(value.trim().toLowerCase()).matches();
    }
}
