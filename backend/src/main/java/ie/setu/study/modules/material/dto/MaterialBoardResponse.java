package ie.setu.study.modules.material.dto;

import ie.setu.study.common.enums.MaterialType;
import java.util.List;

public record MaterialBoardResponse(
    List<MaterialResponse> examPapers,
    List<MaterialResponse> solutions,
    List<MaterialResponse> learningMaterials,
    List<MaterialResponse> images,
    List<MaterialResponse> videos,
    List<MaterialResponse> other,
    List<MaterialResponse> myMaterials
) {}
