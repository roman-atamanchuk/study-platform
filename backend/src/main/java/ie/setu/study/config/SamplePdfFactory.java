package ie.setu.study.config;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public final class SamplePdfFactory {

    private SamplePdfFactory() {
    }

    public static byte[] createStudyDocument(String title, List<String> pageLines) {
        List<String> lines = pageLines == null || pageLines.isEmpty()
            ? List.of(title)
            : pageLines;

        StringBuilder pdf = new StringBuilder();
        pdf.append("%PDF-1.4\n");

        List<Integer> offsets = new ArrayList<>();
        offsets.add(0);

        int catalogId = 1;
        int pagesId = 2;
        int fontId = 3;
        int nextId = 4;
        List<Integer> pageIds = new ArrayList<>();
        List<Integer> contentIds = new ArrayList<>();

        for (int i = 0; i < lines.size(); i++) {
            pageIds.add(nextId++);
            contentIds.add(nextId++);
        }
        int totalObjects = nextId - 1;

        offsets.add(pdf.length());
        pdf.append(catalogId).append(" 0 obj\n");
        pdf.append("<< /Type /Catalog /Pages ").append(pagesId).append(" 0 R >>\n");
        pdf.append("endobj\n");

        offsets.add(pdf.length());
        pdf.append(pagesId).append(" 0 obj\n");
        pdf.append("<< /Type /Pages /Kids [");
        for (int pageId : pageIds) {
            pdf.append(pageId).append(" 0 R ");
        }
        pdf.append("] /Count ").append(lines.size()).append(" >>\n");
        pdf.append("endobj\n");

        offsets.add(pdf.length());
        pdf.append(fontId).append(" 0 obj\n");
        pdf.append("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
        pdf.append("endobj\n");

        for (int i = 0; i < lines.size(); i++) {
            String escaped = escapePdfText(lines.get(i));
            String stream = "BT /F1 16 Tf 48 740 Td (" + escaped + ") Tj ET\n"
                + "BT /F1 12 Tf 48 710 Td (Page " + (i + 1) + " of " + lines.size() + ") Tj ET\n";

            offsets.add(pdf.length());
            pdf.append(contentIds.get(i)).append(" 0 obj\n");
            pdf.append("<< /Length ").append(stream.length()).append(" >>\n");
            pdf.append("stream\n");
            pdf.append(stream);
            pdf.append("endstream\n");
            pdf.append("endobj\n");

            offsets.add(pdf.length());
            pdf.append(pageIds.get(i)).append(" 0 obj\n");
            pdf.append("<< /Type /Page /Parent ").append(pagesId).append(" 0 R ");
            pdf.append("/MediaBox [0 0 612 792] /Contents ").append(contentIds.get(i)).append(" 0 R ");
            pdf.append("/Resources << /Font << /F1 ").append(fontId).append(" 0 R >> >> >>\n");
            pdf.append("endobj\n");
        }

        int xrefOffset = pdf.length();
        pdf.append("xref\n");
        pdf.append("0 ").append(totalObjects + 1).append("\n");
        pdf.append("0000000000 65535 f \n");
        for (int i = 1; i <= totalObjects; i++) {
            pdf.append(String.format("%010d", offsets.get(i))).append(" 00000 n \n");
        }
        pdf.append("trailer\n");
        pdf.append("<< /Size ").append(totalObjects + 1).append(" /Root ").append(catalogId).append(" 0 R >>\n");
        pdf.append("startxref\n");
        pdf.append(xrefOffset).append("\n");
        pdf.append("%%EOF\n");

        return pdf.toString().getBytes(StandardCharsets.US_ASCII);
    }

    private static String escapePdfText(String value) {
        return value
            .replace("\\", "\\\\")
            .replace("(", "\\(")
            .replace(")", "\\)");
    }
}
