ALTER TABLE Material
    ADD COLUMN previewStoredFileId BIGINT REFERENCES StoredFile(id);

CREATE INDEX idx_material_preview_file ON Material(previewStoredFileId);
