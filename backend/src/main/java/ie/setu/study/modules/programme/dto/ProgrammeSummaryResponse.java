package ie.setu.study.modules.programme.dto;

public record ProgrammeSummaryResponse(
    Long id,
    String code,
    String name,
    String streamName,
    String description
) {
}
