package ie.setu.study.modules.sharing.dto;

import jakarta.validation.constraints.Size;

public record CreateShareLinkRequest(@Size(max = 128) String label) {}
