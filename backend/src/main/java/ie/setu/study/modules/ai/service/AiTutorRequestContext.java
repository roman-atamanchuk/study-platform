package ie.setu.study.modules.ai.service;

import ie.setu.study.modules.ai.service.MaterialPageContextService.MaterialPageContext;

public record AiTutorRequestContext(
    MaterialPageContext exam,
    MaterialPageContext solution,
    LearningMaterialContextService.LearningMaterialContext learningMaterials,
    ParsedPrompt parsed,
    String userPrompt
) {
    public boolean hasSolution() {
        return solution != null;
    }

    public boolean hasLearningMaterials() {
        return learningMaterials != null && learningMaterials.hasContent();
    }
}
