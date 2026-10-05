package ie.setu.study.modules.conversion.service;

import ie.setu.study.common.util.OfficeFormats;
import ie.setu.study.modules.storage.model.StoredFile;
import ie.setu.study.modules.storage.service.FileStorageService;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class DocumentConversionService {

    private static final Logger log = LoggerFactory.getLogger(DocumentConversionService.class);

    private final FileStorageService fileStorageService;
    private final boolean enabled;
    private final String libreOfficePath;
    private final long timeoutSeconds;

    public DocumentConversionService(
        FileStorageService fileStorageService,
        @Value("${app.conversion.enabled:true}") boolean enabled,
        @Value("${app.conversion.libreoffice-path:libreoffice}") String libreOfficePath,
        @Value("${app.conversion.timeout-seconds:120}") long timeoutSeconds
    ) {
        this.fileStorageService = fileStorageService;
        this.enabled = enabled;
        this.libreOfficePath = libreOfficePath;
        this.timeoutSeconds = timeoutSeconds;
    }

    public Optional<StoredFile> createPdfPreview(StoredFile original) {
        if (!enabled || original == null) {
            return Optional.empty();
        }
        if (!OfficeFormats.isConvertibleToPdf(original.getOriginalFilename(), original.getMimeType())) {
            return Optional.empty();
        }

        Path inputPath = fileStorageService.resolvePath(original);
        if (!Files.exists(inputPath)) {
            log.warn("Skipping conversion; stored file missing for {}", original.getOriginalFilename());
            return Optional.empty();
        }

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("study-office-convert-");
            Process process = new ProcessBuilder(
                libreOfficePath,
                "--headless",
                "--norestore",
                "--nologo",
                "--convert-to",
                "pdf",
                "--outdir",
                tempDir.toString(),
                inputPath.toString()
            ).redirectErrorStream(true).start();

            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                log.warn("LibreOffice conversion timed out for {}", original.getOriginalFilename());
                return Optional.empty();
            }
            if (process.exitValue() != 0) {
                log.warn(
                    "LibreOffice conversion failed (exit {}) for {}",
                    process.exitValue(),
                    original.getOriginalFilename()
                );
                return Optional.empty();
            }

            Path pdfPath = findGeneratedPdf(tempDir);
            if (pdfPath == null) {
                log.warn("LibreOffice produced no PDF for {}", original.getOriginalFilename());
                return Optional.empty();
            }

            byte[] pdfBytes = Files.readAllBytes(pdfPath);
            String previewName = OfficeFormats.pdfPreviewFilename(original.getOriginalFilename());
            StoredFile preview = fileStorageService.storeBytes(pdfBytes, previewName, "application/pdf");
            return Optional.of(preview);
        } catch (IOException | InterruptedException exception) {
            if (exception instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("Office to PDF conversion failed for {}: {}", original.getOriginalFilename(), exception.getMessage());
            return Optional.empty();
        } finally {
            if (tempDir != null) {
                deleteRecursively(tempDir);
            }
        }
    }

    private static Path findGeneratedPdf(Path outputDir) throws IOException {
        try (Stream<Path> files = Files.list(outputDir)) {
            return files
                .filter(path -> path.getFileName().toString().toLowerCase().endsWith(".pdf"))
                .findFirst()
                .orElse(null);
        }
    }

    private static void deleteRecursively(Path root) {
        try {
            Files.walk(root)
                .sorted(Comparator.reverseOrder())
                .forEach(path -> {
                    try {
                        Files.deleteIfExists(path);
                    } catch (IOException ignored) {
                        // Best effort temp cleanup.
                    }
                });
        } catch (IOException ignored) {
            // Best effort temp cleanup.
        }
    }
}
