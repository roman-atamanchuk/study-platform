package ie.setu.study.modules.storage.service;

import ie.setu.study.common.util.TokenHashUtil;
import ie.setu.study.modules.storage.model.StoredFile;
import ie.setu.study.modules.storage.repository.StoredFileRepository;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LocalFileStorageService implements FileStorageService {

    private final StoredFileRepository storedFileRepository;
    private final Path storageRoot;

    public LocalFileStorageService(
        StoredFileRepository storedFileRepository,
        @Value("${app.storage.local-path:storage}") String storagePath
    ) throws IOException {
        this.storedFileRepository = storedFileRepository;
        this.storageRoot = Path.of(storagePath).toAbsolutePath().normalize();
        Files.createDirectories(storageRoot);
    }

    @Override
    @Transactional
    public StoredFile storeBytes(byte[] content, String originalFilename, String mimeType) throws IOException {
        if (content == null || content.length == 0) {
            throw new IOException("Content is empty");
        }
        String hash = sha256(new ByteArrayInputStream(content));
        Optional<StoredFile> existing = storedFileRepository.findBySha256Hash(hash);
        if (existing.isPresent()) {
            return existing.get();
        }

        String safeName = originalFilename == null || originalFilename.isBlank() ? "document.pdf" : originalFilename;
        String extension = extractExtension(safeName);
        String generatedName = TokenHashUtil.generateRawToken() + extension;
        Path target = storageRoot.resolve(generatedName);
        Files.write(target, content);

        StoredFile storedFile = new StoredFile();
        storedFile.setSha256Hash(hash);
        storedFile.setStorageUrl(generatedName);
        storedFile.setOriginalFilename(safeName);
        storedFile.setMimeType(resolveMimeType(safeName, mimeType));
        storedFile.setFileSize((long) content.length);
        return storedFileRepository.save(storedFile);
    }

    @Override
    @Transactional
    public StoredFile store(MultipartFile file) throws IOException {
        String hash = sha256(file.getInputStream());
        Optional<StoredFile> existing = storedFileRepository.findBySha256Hash(hash);
        if (existing.isPresent()) {
            return existing.get();
        }

        String extension = extractExtension(file.getOriginalFilename());
        String generatedName = TokenHashUtil.generateRawToken() + extension;
        Path target = storageRoot.resolve(generatedName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        StoredFile storedFile = new StoredFile();
        storedFile.setSha256Hash(hash);
        storedFile.setStorageUrl(generatedName);
        storedFile.setOriginalFilename(file.getOriginalFilename() == null ? generatedName : file.getOriginalFilename());
        storedFile.setMimeType(resolveMimeType(file.getOriginalFilename(), file.getContentType()));
        storedFile.setFileSize(file.getSize());
        return storedFileRepository.save(storedFile);
    }

    @Override
    public Path resolvePath(StoredFile storedFile) {
        return storageRoot.resolve(storedFile.getStorageUrl()).normalize();
    }

    @Override
    @Transactional
    public boolean deleteIfUnreferenced(StoredFile storedFile) {
        try {
            Files.deleteIfExists(resolvePath(storedFile));
        } catch (IOException ignored) {
            return false;
        }
        storedFileRepository.delete(storedFile);
        return true;
    }

    private static String sha256(InputStream inputStream) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int read;
            while ((read = inputStream.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (Exception exception) {
            throw new IOException("Unable to hash file", exception);
        }
    }

    private static String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }

    private static String resolveMimeType(String filename, String reported) {
        if (reported != null && !reported.isBlank() && !"application/octet-stream".equals(reported)) {
            return reported;
        }
        if (filename == null) {
            return "application/octet-stream";
        }
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) {
            return "application/pdf";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lower.endsWith(".gif")) {
            return "image/gif";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        return reported == null || reported.isBlank() ? "application/octet-stream" : reported;
    }
}
