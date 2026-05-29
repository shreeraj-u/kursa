export type ResumeFileKind = "pdf" | "docx" | "txt";

export function resolveResumeFileKind(fileName: string): ResumeFileKind | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return "pdf";
  }
  if (lower.endsWith(".docx")) {
    return "docx";
  }
  if (lower.endsWith(".txt")) {
    return "txt";
  }
  return null;
}

/**
 * Collapses excessive whitespace while preserving line breaks, which the
 * skill/section scoring relies on to detect headings like "Skills".
 */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  // unpdf bundles a serverless build of pdf.js; no native deps required.
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export type ExtractResult = {
  text: string;
  kind: ResumeFileKind;
};

/**
 * Extracts plain text from a supported resume file. Throws a user-facing
 * error if the format is unsupported or the document yields no readable text.
 */
export async function extractResumeText(file: File): Promise<ExtractResult> {
  const kind = resolveResumeFileKind(file.name);
  if (!kind) {
    throw new Error("Only PDF, DOCX, or TXT resumes are supported.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let rawText = "";
  if (kind === "pdf") {
    rawText = await extractPdf(new Uint8Array(arrayBuffer));
  } else if (kind === "docx") {
    rawText = await extractDocx(buffer);
  } else {
    rawText = buffer.toString("utf8").replaceAll("\u0000", "");
  }

  const text = normalizeWhitespace(rawText).slice(0, 80_000);

  if (text.replace(/\s/g, "").length < 30) {
    throw new Error(
      "I couldn't read enough text from that file. If it's a scanned/image PDF, try a text-based export.",
    );
  }

  return { text, kind };
}
