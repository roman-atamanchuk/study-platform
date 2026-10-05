package ie.setu.study.modules.sharing.dto;

public record SharePreviewResponse(
    String courseName,
    String courseCode,
    String courseDescription,
    String courseIconUrl,
    String ownerName,
    int materialCount,
    boolean linkActive
) {}
