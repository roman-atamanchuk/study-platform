package ie.setu.study.modules.material.util;

/**
 * Lightweight HTML allowlist for personal study notes.
 * Strips scripts and event handlers; keeps basic formatting and images.
 */
public final class NoteHtmlSanitizer {

    private static final int MAX_BODY_CHARS = 1_500_000;

    private NoteHtmlSanitizer() {}

    public static String sanitize(String html) {
        if (html == null) {
            return "";
        }
        String trimmed = html.trim();
        if (trimmed.length() > MAX_BODY_CHARS) {
            throw new IllegalArgumentException("Note is too large (max about 1.5MB)");
        }
        String cleaned = trimmed
            .replaceAll("(?is)<script[^>]*>.*?</script>", "")
            .replaceAll("(?is)<style[^>]*>.*?</style>", "")
            .replaceAll("(?is)<iframe[^>]*>.*?</iframe>", "")
            .replaceAll("(?is)<object[^>]*>.*?</object>", "")
            .replaceAll("(?is)<embed[^>]*>.*?</embed>", "")
            .replaceAll("(?i)\\son\\w+\\s*=\\s*(\"[^\"]*\"|'[^']*'|[^\\s>]+)", "")
            .replaceAll("(?i)javascript:", "");
        return cleaned;
    }
}
