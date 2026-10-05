package ie.setu.study.modules.programme.controller;

import ie.setu.study.modules.programme.dto.ProgrammeDetailResponse;
import ie.setu.study.modules.programme.dto.ProgrammeSummaryResponse;
import ie.setu.study.modules.programme.dto.PublicLibraryResponse;
import ie.setu.study.modules.programme.service.ProgrammeService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PublicLibraryController {

    private final ProgrammeService programmeService;

    public PublicLibraryController(ProgrammeService programmeService) {
        this.programmeService = programmeService;
    }

    @GetMapping("/public-library")
    public PublicLibraryResponse getPublicLibrary() {
        return programmeService.getPublicLibrary();
    }

    @GetMapping("/programmes")
    public List<ProgrammeSummaryResponse> listProgrammes() {
        return programmeService.listProgrammes();
    }

    @GetMapping("/programmes/{id}")
    public ProgrammeDetailResponse getProgramme(@PathVariable Long id) {
        return programmeService.getProgramme(id);
    }
}
