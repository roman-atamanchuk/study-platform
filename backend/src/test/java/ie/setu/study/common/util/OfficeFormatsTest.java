package ie.setu.study.common.util;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class OfficeFormatsTest {

    @Test
    void detectsConvertibleOfficeFormats() {
        assertTrue(OfficeFormats.isConvertibleToPdf("notes.docx", null));
        assertTrue(OfficeFormats.isConvertibleToPdf("sheet.xlsx", null));
        assertTrue(OfficeFormats.isConvertibleToPdf("slides.pptx", null));
        assertTrue(OfficeFormats.isConvertibleToPdf("legacy.doc", null));
        assertTrue(OfficeFormats.isConvertibleToPdf("open.odt", null));
    }

    @Test
    void skipsPdfAndImages() {
        assertFalse(OfficeFormats.isConvertibleToPdf("exam.pdf", "application/pdf"));
        assertFalse(OfficeFormats.isConvertibleToPdf("scan.png", "image/png"));
    }

    @Test
    void buildsPreviewFilename() {
        assertTrue(OfficeFormats.pdfPreviewFilename("report.docx").endsWith(".pdf"));
    }
}
