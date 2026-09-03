function pdfEscape(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function buildSyntheticDemoPdf(title: string, bodyLines: string[]) {
  const lines = [
    "SYNTHETIC DEMONSTRATION DOCUMENT",
    "NOT A REAL CREDENTIAL",
    "FOR BOF PRODUCT DEMONSTRATION ONLY",
    "",
    title,
    "",
    ...bodyLines,
    "",
    "This file is fictional. It is not a government credential, medical record, tax form, or employment authorization document.",
  ];

  const commands = ["BT", "/F1 12 Tf", "50 740 Td"];
  lines.forEach((line, index) => {
    if (index === 0) commands.push(`(${pdfEscape(line)}) Tj`);
    else commands.push(`0 -16 Td (${pdfEscape(line)}) Tj`);
  });
  commands.push("ET");
  const stream = commands.join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
    `4 0 obj << /Length ${Buffer.byteLength(stream, "utf8")} >> stream\n${stream}\nendstream endobj\n`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
  ];

  let offset = "%PDF-1.4\n".length;
  const xref = ["xref", "0 6", "0000000000 65535 f "];
  const body = objects.map((object) => {
    xref.push(`${String(offset).padStart(10, "0")} 00000 n `);
    offset += Buffer.byteLength(object, "utf8");
    return object;
  });
  const startxref = offset;
  return Buffer.from(
    `%PDF-1.4\n${body.join("")}${xref.join("\n")}\ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`,
    "utf8",
  );
}
