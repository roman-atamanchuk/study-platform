package ie.setu.study.modules.admin.dto;

public record AdminDashboardResponse(
    long userCount,
    long programmeCount,
    long courseCount,
    long officialMaterialCount,
    long activeUserCourseCount
) {}
