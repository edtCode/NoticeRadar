const escapePdfText = (text) => {
    return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
};

export const buildTextPdf = (text) => {
    const stream = `BT /F1 12 Tf 72 720 Td (${escapePdfText(text)}) Tj ET`;
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`
    ];

    let pdf = "%PDF-1.4\n";
    const offsets = objects.map((object, index) => {
        const offset = Buffer.byteLength(pdf, "latin1");
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
        return offset;
    });

    const xrefStart = Buffer.byteLength(pdf, "latin1");

    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.forEach((offset) => {
        pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

    return Buffer.from(pdf, "latin1");
};
