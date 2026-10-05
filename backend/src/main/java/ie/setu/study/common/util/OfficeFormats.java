package ie.setu.study.common.util;

import java.util.Locale;
import java.util.Set;

public final class OfficeFormats {

    private static final Set<String> CONVERTIBLE_EXTENSIONS = Set.of(
        "doc",
        "docx",
        "dot",
        "dotx",
        "odt",
        "ott",
        "rtf",
        "txt",
        "xls",
        "xlsx",
        "xlt",
        "xltx",
        "ods",
        "ots",
        "csv",
        "ppt",
        "pptx",
        "pot",
        "potx",
        "odp",
        "otp",
        "odg"
    );

    private OfficeFormats() {}

    public static boolean isConvertibleToPdf(String filename, String mimeType) {
        if (isPdf(filename, mimeType)) {
            return false;
        }
        if (isImage(filename, mimeType)) {
            return false;
        }
        String extension = extensionOf(filename);
        if (extension != null && CONVERTIBLE_EXTENSIONS.contains(extension)) {
            return true;
        }
        if (mimeType == null || mimeType.isBlank()) {
            return false;
        }
        String lower = mimeType.toLowerCase(Locale.ROOT);
        return lower.contains("wordprocessingml")
            || lower.contains("spreadsheetml")
            || lower.contains("presentationml")
            || lower.contains("msword")
            || lower.contains("ms-excel")
            || lower.contains("ms-powerpoint")
            || lower.contains("opendocument")
            || lower.equals("text/plain")
            || lower.equals("text/rtf")
            || lower.equals("application/rtf")
            || lower.equals("text/csv");
    }

    public static boolean isPdf(String filename, String mimeType) {
        if (mimeType != null && mimeType.equalsIgnoreCase("application/pdf")) {
            return true;
        }
        return "pdf".equals(extensionOf(filename));
    }

    public static boolean isImage(String filename, String mimeType) {
        if (mimeType != null && mimeType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            return true;
        }
        String extension = extensionOf(filename);
        return extension != null
            && Set.of("png", "jpg", "jpeg", "gif", "webp", "bmp", "svg").contains(extension);
    }

    public static String pdfPreviewFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "preview.pdf";
        }
        int dot = originalFilename.lastIndexOf('.');
        String stem = dot > 0 ? originalFilename.substring(0, dot) : originalFilename;
        return stem + ".pdf";
    }

    private static String extensionOf(String filename) {
        if (filename == null || !filename.contains(".")) {
            return null;
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }
}
