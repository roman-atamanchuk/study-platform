package ie.setu.study.modules.ai.service;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class AiTutorRulesTest {

    @Test
    void includesLearningMaterialPriorityWhenMaterialsAttached() {
        String prompt = AiTutorRules.systemPrompt(
            "Statistics",
            "STAT_&_PROB",
            ParsedPrompt.general("solve q1"),
            true,
            true
        );

        assertTrue(prompt.contains("LEARNING MATERIALS FIRST"));
        assertTrue(prompt.contains("improve that explanation only"));
    }

    @Test
    void omitsLearningMaterialPriorityWhenNoMaterials() {
        String prompt = AiTutorRules.systemPrompt(
            "Statistics",
            "STAT_&_PROB",
            ParsedPrompt.general("solve q1"),
            false,
            false
        );

        assertTrue(prompt.contains("No course learning materials were attached"));
    }
}
