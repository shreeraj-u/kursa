export type ResumeFileKind = "pdf" | "docx" | "txt";

export function resolveResumeFileKind(fileName: string): ResumeFileKind | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".txt")) return "txt";
  return null;
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
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

export async function extractResumeText(buffer: Buffer, originalName: string): Promise<ExtractResult> {
  const kind = resolveResumeFileKind(originalName);
  if (!kind) {
    throw new Error("Only PDF, DOCX, or TXT resumes are supported.");
  }

  let rawText = "";
  if (kind === "pdf") {
    rawText = await extractPdf(buffer);
  } else if (kind === "docx") {
    rawText = await extractDocx(buffer);
  } else {
    // Strip null bytes that can appear in binary-encoded text files
    rawText = buffer.toString("utf8").replace(/\0/g, "");
  }

  const text = normalizeWhitespace(rawText).slice(0, 80_000);

  if (text.replace(/\s/g, "").length < 30) {
    throw new Error(
      "I couldn't read enough text from that file. If it's a scanned/image PDF, try a text-based export.",
    );
  }

  return { text, kind };
}
