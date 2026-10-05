package ie.setu.study.common.util;

import org.springframework.web.multipart.MultipartFile;

public final class MaterialTitles {

    private MaterialTitles() {}

    public static String resolve(String title, MultipartFile file) {
        if (title != null && !title.isBlank()) {
            return title.trim();
        }
        String original = file.getOriginalFilename();
        if (original == null || original.isBlank()) {
            return "Untitled";
        }
        int dot = original.lastIndexOf('.');
        return dot > 0 ? original.substring(0, dot) : original;
    }
}
