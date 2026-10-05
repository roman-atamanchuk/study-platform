package ie.setu.study.common.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class MaterialYearsTest {

    @Test
    void extractsYearFromSimpleFilename() {
        assertEquals(2022, MaterialYears.extractFromFilename("2022.pdf"));
    }

    @Test
    void extractsYearFromCompoundFilename() {
        assertEquals(2023, MaterialYears.extractFromFilename("2023-solutions.pdf"));
        assertEquals(2025, MaterialYears.extractFromFilename("2025-Solutions.pdf"));
    }

    @Test
    void returnsNullWhenNoYearInFilename() {
        assertNull(MaterialYears.extractFromFilename("lecture-notes.pdf"));
    }
}
