package ie.setu.study.modules.ai.service;

import ie.setu.study.common.enums.MaterialType;
import ie.setu.study.common.exception.ApiException;
import ie.setu.study.modules.material.model.Material;
import ie.setu.study.modules.storage.model.StoredFile;
import ie.setu.study.modules.storage.service.FileStorageService;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.Locale;
import java.util.Optional;
import javax.imageio.ImageIO;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

@Service
public class MaterialPageContextService {

    private final FileStorageService fileStorageService;

    public MaterialPageContextService(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    public MaterialPageContext buildContext(Material material, int pageNumber) {
        if (material.getMaterialType() == MaterialType.VIDEO) {
            throw new ApiException("AI_UNSUPPORTED_MATERIAL", "AI does not support video materials yet.");
        }
        if (material.getMaterialType() == MaterialType.NOTE) {
            throw new ApiException("AI_UNSUPPORTED_MATERIAL", "AI does not support notes yet.");
        }
        if (material.getMaterialType() == MaterialType.IMAGE) {
            return imageContext(material);
        }
        StoredFile pdfFile = resolvePdfFile(material);
        if (pdfFile == null) {
            throw new ApiException("AI_UNSUPPORTED_MATERIAL", "This material type is not supported for AI yet.");
        }
        return pdfPageContext(pdfFile, material.getTitle(), pageNumber);
    }

    private MaterialPageContext imageContext(Material material) {
        StoredFile file = material.getStoredFile();
        if (file == null) {
            throw new ApiException("MATERIAL_NOT_FOUND", "Image file missing");
        }
        Path path = fileStorageService.resolvePath(file);
        try {
            byte[] bytes = Files.readAllBytes(path);
            String mime = file.getMimeType() != null ? file.getMimeType() : "image/png";
            String base64 = Base64.getEncoder().encodeToString(bytes);
            return new MaterialPageContext(
                material.getTitle(),
                1,
                "Image material attached.",
                "data:" + mime + ";base64," + base64
            );
        } catch (IOException ex) {
            throw new ApiException("AI_CONTEXT_ERROR", "Unable to read image for AI context");
        }
    }

    private MaterialPageContext pdfPageContext(StoredFile pdfFile, String title, int pageNumber) {
        Path path = fileStorageService.resolvePath(pdfFile);
        if (!Files.exists(path)) {
            throw new ApiException("AI_CONTEXT_ERROR", "PDF file not found on server");
        }
        try (PDDocument document = Loader.loadPDF(path.toFile())) {
            int totalPages = document.getNumberOfPages();
            int page = Math.min(Math.max(pageNumber, 1), totalPages);
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(page);
            stripper.setEndPage(page);
            String text = stripper.getText(document).trim();

            String imageDataUrl = null;
            if (text.length() < 40) {
                PDFRenderer renderer = new PDFRenderer(document);
                BufferedImage image = renderer.renderImageWithDPI(page - 1, 144);
                ByteArrayOutputStream output = new ByteArrayOutputStream();
                ImageIO.write(image, "png", output);
                imageDataUrl = "data:image/png;base64," + Base64.getEncoder().encodeToString(output.toByteArray());
            }

            String summary = text.isBlank()
                ? "Scanned or image-based PDF page attached as image."
                : "Extracted text from page " + page + ":\n" + truncate(text, 6000);

            return new MaterialPageContext(title, page, summary, imageDataUrl);
        } catch (IOException ex) {
            throw new ApiException("AI_CONTEXT_ERROR", "Unable to read PDF page for AI context");
        }
    }

    private StoredFile resolvePdfFile(Material material) {
        StoredFile preview = material.getPreviewStoredFile();
        if (preview != null && isPdf(preview)) {
            return preview;
        }
        StoredFile original = material.getStoredFile();
        if (original != null && isPdf(original)) {
            return original;
        }
        return null;
    }

    private boolean isPdf(StoredFile file) {
        String mime = file.getMimeType() == null ? "" : file.getMimeType().toLowerCase(Locale.ROOT);
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        return mime.contains("pdf") || name.endsWith(".pdf");
    }

    private String truncate(String value, int max) {
        if (value.length() <= max) {
            return value;
        }
        return value.substring(0, max) + "\n…";
    }

    public Optional<String> extractPdfFullText(Material material, int maxChars) {
        if (material.getMaterialType() == MaterialType.VIDEO || material.getMaterialType() == MaterialType.IMAGE) {
            return Optional.empty();
        }
        StoredFile pdfFile = resolvePdfFile(material);
        if (pdfFile == null) {
            return Optional.empty();
        }
        Path path = fileStorageService.resolvePath(pdfFile);
        if (!Files.exists(path)) {
            return Optional.empty();
        }
        try (PDDocument document = Loader.loadPDF(path.toFile())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(document).trim();
            if (text.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(truncate(text, maxChars));
        } catch (IOException ex) {
            return Optional.empty();
        }
    }

    public record MaterialPageContext(
        String materialTitle,
        int pageNumber,
        String textSummary,
        String imageDataUrl
    ) {}
}
