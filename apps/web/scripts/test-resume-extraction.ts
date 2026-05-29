/**
 * Verifies real PDF and DOCX text extraction (not just .txt). Generates a
 * genuine PDF (minimal pdf.js-readable structure) and a genuine DOCX (a ZIP
 * with the required OOXML parts) in memory, then runs them through the same
 * extraction + scoring pipeline the upload action uses.
 *
 * Run: npx tsx scripts/test-resume-extraction.ts
 */
import { deflateRawSync } from "node:zlib";

import { extractResumeText } from "../src/app/onboarding/imports/extract-text";
import { parseResumeText } from "../src/app/onboarding/imports/resume";

let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  fail  ${name}`);
    console.error(`        ${error instanceof Error ? error.message : String(error)}`);
  }
}

const RESUME_LINES = [
  "Jane Engineer - Senior Software Engineer",
  "",
  "Skills",
  "TypeScript, React, Next.js, Node.js, PostgreSQL, Docker, Kubernetes, AWS, GraphQL",
  "",
  "Experience",
  "Acme Corp - Staff Engineer",
  "Built TypeScript microservices on Kubernetes and AWS. Led GraphQL API design.",
  "Improved PostgreSQL query performance and React rendering speed.",
];
const RESUME_TEXT = RESUME_LINES.join("\n");

/** Builds a minimal single-page PDF whose text content stream is readable by pdf.js. */
function buildMinimalPdf(lines: string[]): Buffer {
  const escape = (line: string) => line.replace(/([\\()])/g, "\\$1");
  let y = 760;
  const textOps = lines
    .map((line) => {
      const op = `BT /F1 11 Tf 56 ${y} Td (${escape(line)}) Tj ET`;
      y -= 16;
      return op;
    })
    .join("\n");

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
  );
  const stream = `${textOps}`;
  objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

/** Minimal ZIP (store + deflate) builder so we can synthesize a real .docx. */
function buildZip(files: { name: string; content: Buffer }[]): Buffer {
  const chunks: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  const crcTable: number[] = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }
  const crc32 = (buf: Buffer) => {
    let crc = 0xffffffff;
    for (const byte of buf) {
      crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, "utf8");
    const compressed = deflateRawSync(file.content);
    const crc = crc32(file.content);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8); // deflate
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(file.content.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    chunks.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(file.content.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([centralHeader, nameBuf]));

    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralBuf = Buffer.concat(central);
  const localBuf = Buffer.concat(chunks);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(localBuf.length, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([localBuf, centralBuf, end]);
}

function buildMinimalDocx(lines: string[]): Buffer {
  const paragraphs = lines
    .map((line) => `<w:p><w:r><w:t xml:space="preserve">${line}</w:t></w:r></w:p>`)
    .join("");
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}</w:body></w:document>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

  return buildZip([
    { name: "[Content_Types].xml", content: Buffer.from(contentTypes, "utf8") },
    { name: "_rels/.rels", content: Buffer.from(rels, "utf8") },
    { name: "word/document.xml", content: Buffer.from(documentXml, "utf8") },
  ]);
}

function makeFile(name: string, buffer: Buffer): File {
  return new File([new Uint8Array(buffer)], name, { type: "application/octet-stream" });
}

async function main() {
  console.log("Resume extraction (real PDF + DOCX) tests\n");

  await runTest("extracts text from a real PDF and scores skills", async () => {
    const file = makeFile("resume.pdf", buildMinimalPdf(RESUME_LINES));
    const { text, kind } = await extractResumeText(file);
    assert(kind === "pdf", `expected kind pdf, got ${kind}`);
    assert(/typescript/i.test(text), `PDF text missing TypeScript: ${text.slice(0, 200)}`);
    const skills = parseResumeText(text).skills.map((s) => s.name);
    assert(skills.includes("TypeScript"), `expected TypeScript, got: ${skills.join(", ")}`);
    assert(skills.includes("Kubernetes"), `expected Kubernetes, got: ${skills.join(", ")}`);
  });

  await runTest("extracts text from a real DOCX and scores skills", async () => {
    const file = makeFile("resume.docx", buildMinimalDocx(RESUME_LINES));
    const { text, kind } = await extractResumeText(file);
    assert(kind === "docx", `expected kind docx, got ${kind}`);
    assert(/postgresql/i.test(text), `DOCX text missing PostgreSQL: ${text.slice(0, 200)}`);
    const skills = parseResumeText(text).skills.map((s) => s.name);
    assert(skills.includes("PostgreSQL"), `expected PostgreSQL, got: ${skills.join(", ")}`);
    assert(skills.includes("React"), `expected React, got: ${skills.join(", ")}`);
  });

  await runTest("extracts text from a .txt resume", async () => {
    const file = makeFile("resume.txt", Buffer.from(RESUME_TEXT, "utf8"));
    const { text, kind } = await extractResumeText(file);
    assert(kind === "txt", `expected kind txt, got ${kind}`);
    const skills = parseResumeText(text).skills.map((s) => s.name);
    assert(skills.includes("GraphQL"), `expected GraphQL, got: ${skills.join(", ")}`);
  });

  await runTest("rejects unsupported file types", async () => {
    const file = makeFile("resume.rtf", Buffer.from("hello world", "utf8"));
    let threw = false;
    try {
      await extractResumeText(file);
    } catch {
      threw = true;
    }
    assert(threw, "expected unsupported extension to throw");
  });

  await runTest("rejects near-empty documents", async () => {
    const file = makeFile("resume.txt", Buffer.from("hi", "utf8"));
    let threw = false;
    try {
      await extractResumeText(file);
    } catch {
      threw = true;
    }
    assert(threw, "expected near-empty file to throw");
  });

  console.log("");
  console.log(`Passed: ${passed} / ${passed + failed}`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

void main();
