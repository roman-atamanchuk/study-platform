package ie.setu.study.modules.ai.service;

public record AiStructuredResponse(String markdown, String visualsJson) {

    public boolean hasVisuals() {
        return visualsJson != null && !visualsJson.isBlank();
    }
}
