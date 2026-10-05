package ie.setu.study.modules.material.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateMaterialRequest(
    @Size(max = 255) String title,
    String description,
    Integer year,
    String htmlBody
) {
    public boolean hasUpdates() {
        return title != null || description != null || year != null || htmlBody != null;
    }
}
