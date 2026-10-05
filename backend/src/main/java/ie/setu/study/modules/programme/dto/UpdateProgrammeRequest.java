package ie.setu.study.modules.programme.dto;

import jakarta.validation.constraints.Size;

public record UpdateProgrammeRequest(
    @Size(max = 255) String name,
    @Size(max = 255) String streamName,
    String description
) {
    public boolean hasUpdates() {
        return name != null || streamName != null || description != null;
    }
}
