package ie.setu.study.common.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.web.multipart.MultipartFile;

public final class MaterialYears {

    private static final Pattern YEAR = Pattern.compile("\\b(19|20)\\d{2}\\b");

    private MaterialYears() {}

    public static Integer resolve(Integer year, MultipartFile file) {
        if (year != null) {
            return year;
        }
        return extractFromFilename(file.getOriginalFilename());
    }

    public static Integer extractFromFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return null;
        }
        int dot = filename.lastIndexOf('.');
        String stem = dot > 0 ? filename.substring(0, dot) : filename;
        Matcher matcher = YEAR.matcher(stem);
        while (matcher.find()) {
            int value = Integer.parseInt(matcher.group());
            if (value >= 1990 && value <= 2100) {
                return value;
            }
        }
        return null;
    }
}
