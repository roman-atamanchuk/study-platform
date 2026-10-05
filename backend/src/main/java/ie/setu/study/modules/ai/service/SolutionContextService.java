package ie.setu.study.modules.ai.service;

import ie.setu.study.common.enums.MaterialType;
import ie.setu.study.modules.material.model.Material;
import ie.setu.study.modules.material.repository.MaterialRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class SolutionContextService {

    private final MaterialRepository materialRepository;

    public SolutionContextService(MaterialRepository materialRepository) {
        this.materialRepository = materialRepository;
    }

    public Optional<Material> resolveSolutionMaterial(
        Material sourceMaterial,
        Long preferredSolutionMaterialId
    ) {
        if (preferredSolutionMaterialId != null) {
            Optional<Material> preferred = materialRepository.findById(preferredSolutionMaterialId)
                .filter(material -> material.getDeletedAt() == null)
                .filter(material -> material.getMaterialType() == MaterialType.SOLUTION);
            if (preferred.isPresent() && isLinkedToExam(preferred.get(), sourceMaterial)) {
                return preferred;
            }
        }

        Material examMaterial = sourceMaterial.getMaterialType() == MaterialType.EXAM_PAPER
            ? sourceMaterial
            : sourceMaterial.getParentExamMaterial();

        if (examMaterial == null) {
            return Optional.empty();
        }

        List<Material> linked = materialRepository
            .findByParentExamMaterial_IdAndMaterialTypeAndDeletedAtIsNullOrderByOfficialDescCreatedAtDesc(
                examMaterial.getId(),
                MaterialType.SOLUTION
            );
        if (!linked.isEmpty()) {
            return Optional.of(linked.getFirst());
        }

        if (examMaterial.getYear() == null) {
            return Optional.empty();
        }

        return materialRepository
            .findByCourse_IdAndMaterialTypeAndYearAndDeletedAtIsNullAndParentExamMaterialIsNullOrderByOfficialDescCreatedAtDesc(
                examMaterial.getCourse().getId(),
                MaterialType.SOLUTION,
                examMaterial.getYear()
            )
            .stream()
            .findFirst();
    }

    private boolean isLinkedToExam(Material solution, Material sourceMaterial) {
        Material examMaterial = sourceMaterial.getMaterialType() == MaterialType.EXAM_PAPER
            ? sourceMaterial
            : sourceMaterial.getParentExamMaterial();
        if (examMaterial == null) {
            return false;
        }
        if (solution.getParentExamMaterial() != null) {
            return solution.getParentExamMaterial().getId().equals(examMaterial.getId());
        }
        return examMaterial.getYear() != null
            && examMaterial.getYear().equals(solution.getYear())
            && solution.getCourse().getId().equals(examMaterial.getCourse().getId());
    }
}
