package ie.setu.study.modules.ai.service;

import ie.setu.study.common.enums.MaterialType;
import ie.setu.study.modules.material.model.Material;
import ie.setu.study.modules.material.repository.MaterialRepository;
import ie.setu.study.modules.workspace.model.UserCourse;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class LearningMaterialContextService {

    private static final int MAX_MATERIALS = 6;
    private static final int MAX_CHARS_PER_MATERIAL = 2_500;
    private static final int MAX_TOTAL_CHARS = 12_000;

    private final MaterialRepository materialRepository;
    private final MaterialPageContextService materialPageContextService;

    public LearningMaterialContextService(
        MaterialRepository materialRepository,
        MaterialPageContextService materialPageContextService
    ) {
        this.materialRepository = materialRepository;
        this.materialPageContextService = materialPageContextService;
    }

    public LearningMaterialContext buildContext(UserCourse userCourse, String examPageText, ParsedPrompt parsed) {
        Long sourceUserCourseId = userCourse.getSourceUserCourse() != null
            ? userCourse.getSourceUserCourse().getId()
            : null;

        List<Material> accessible = materialRepository.findAccessibleForUserCourse(
            userCourse.getCourse().getId(),
            userCourse.getId(),
            sourceUserCourseId
        );

        List<Material> learningMaterials = accessible.stream()
            .filter(material -> material.getMaterialType() == MaterialType.LEARNING_MATERIAL)
            .sorted(materialRelevance(examPageText, parsed))
            .limit(MAX_MATERIALS)
            .toList();

        if (learningMaterials.isEmpty()) {
            return LearningMaterialContext.empty();
        }

        StringBuilder summary = new StringBuilder();
        int remaining = MAX_TOTAL_CHARS;

        for (Material material : learningMaterials) {
            if (remaining <= 0) {
                break;
            }
            int budget = Math.min(MAX_CHARS_PER_MATERIAL, remaining);
            Optional<String> text = materialPageContextService.extractPdfFullText(material, budget);
            if (text.isEmpty() || text.get().isBlank()) {
                continue;
            }
            summary.append("\n--- ")
                .append(material.getTitle())
                .append(" ---\n")
                .append(text.get())
                .append('\n');
            remaining -= text.get().length();
        }

        String body = summary.toString().trim();
        if (body.isBlank()) {
            return LearningMaterialContext.empty();
        }
        return new LearningMaterialContext(body, learningMaterials.size());
    }

    private static Comparator<Material> materialRelevance(String examPageText, ParsedPrompt parsed) {
        List<String> keywords = buildKeywords(examPageText, parsed);
        return Comparator
            .comparing((Material material) -> !material.isOfficial())
            .thenComparing(material -> -scoreMaterial(material, keywords));
    }

    private static List<String> buildKeywords(String examPageText, ParsedPrompt parsed) {
        List<String> keywords = new ArrayList<>();
        if (parsed.question().label() != null && !parsed.question().label().isBlank()) {
            keywords.add(parsed.question().label().toLowerCase(Locale.ROOT));
        }
        if (examPageText != null && !examPageText.isBlank()) {
            String lower = examPageText.toLowerCase(Locale.ROOT);
            for (String token : lower.split("[^a-z0-9]+")) {
                if (token.length() >= 4 && !isStopWord(token)) {
                    keywords.add(token);
                }
            }
        }
        return keywords.stream().distinct().limit(24).toList();
    }

    private static int scoreMaterial(Material material, List<String> keywords) {
        if (keywords.isEmpty()) {
            return 0;
        }
        String haystack = (
            material.getTitle()
            + " "
            + (material.getDescription() == null ? "" : material.getDescription())
        ).toLowerCase(Locale.ROOT);
        int score = 0;
        for (String keyword : keywords) {
            if (haystack.contains(keyword)) {
                score += 1;
            }
        }
        return score;
    }

    private static boolean isStopWord(String token) {
        return switch (token) {
            case "question", "answer", "part", "page", "show", "from", "that", "this", "with", "have", "your" -> true;
            default -> false;
        };
    }

    public record LearningMaterialContext(String summary, int materialCount) {
        public static LearningMaterialContext empty() {
            return new LearningMaterialContext("", 0);
        }

        public boolean hasContent() {
            return summary != null && !summary.isBlank();
        }
    }
}
