package ie.setu.study.modules.storage.service;

import ie.setu.study.modules.storage.model.StoredFile;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    StoredFile store(MultipartFile file) throws java.io.IOException;

    StoredFile storeBytes(byte[] content, String originalFilename, String mimeType) throws java.io.IOException;

    java.nio.file.Path resolvePath(StoredFile storedFile);

    boolean deleteIfUnreferenced(StoredFile storedFile);
}
