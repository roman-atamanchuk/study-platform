package ie.setu.study.modules.auth.dto;

public record ForgotPasswordResponse(
    String message,
    String resetToken,
    String resetUrl
) {
    public static ForgotPasswordResponse generic(String message) {
        return new ForgotPasswordResponse(message, null, null);
    }

    public static ForgotPasswordResponse withDevToken(String message, String resetToken, String resetUrl) {
        return new ForgotPasswordResponse(message, resetToken, resetUrl);
    }
}
