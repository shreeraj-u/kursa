"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { ResumeContent, ResumeSectionKey } from "@kursa/types";

import { normalizeResumeSectionOrder } from "@/lib/dashboard/resume/section-order";

// Real text-based (ATS-readable) PDF. Helvetica is a built-in PDF font, so the
// output has selectable text and embeds no images.
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a", lineHeight: 1.24 },
  name: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 1 },
  contact: { fontSize: 8, color: "#555", marginBottom: 5 },
  rule: { borderBottomWidth: 1, borderBottomColor: "#ccc", marginBottom: 5 },
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#444",
    marginTop: 6,
    marginBottom: 2,
  },
  summary: { color: "#333", marginBottom: 2 },
  roleRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
  roleTitle: { fontFamily: "Helvetica-Bold", fontSize: 9.2 },
  period: { fontSize: 8, color: "#666" },
  bullet: { flexDirection: "row", marginBottom: 1, paddingLeft: 7 },
  bulletDot: { width: 7 },
  bulletText: { flex: 1, color: "#333" },
  skills: { color: "#333" },
  eduRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
  block: { marginBottom: 4 },
  project: { marginBottom: 2 },
});

function ResumePdfDocument({ content }: { content: ResumeContent }) {
  const contactParts = [
    content.contact.email,
    content.contact.location,
    ...content.contact.links,
  ].filter(Boolean);

  const sectionRenderers: Record<ResumeSectionKey, React.ReactNode> = {
    summary: content.summary ? (
      <>
        <Text style={styles.sectionLabel}>Summary</Text>
        <Text style={styles.summary}>{content.summary}</Text>
      </>
    ) : null,
    experience: content.experience.length > 0 ? (
      <>
        <Text style={styles.sectionLabel}>Experience</Text>
        {content.experience.map((exp, i) => (
          <View key={i} style={styles.block} wrap={false}>
            <View style={styles.roleRow}>
              <Text style={styles.roleTitle}>
                {exp.roleTitle} · {exp.company}
              </Text>
              <Text style={styles.period}>{exp.period}</Text>
            </View>
            {exp.bullets.map((b, j) => (
              <View key={j} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        ))}
      </>
    ) : null,
    skills: content.skills.length > 0 ? (
      <>
        <Text style={styles.sectionLabel}>Skills</Text>
        <Text style={styles.skills}>{content.skills.join(" · ")}</Text>
      </>
    ) : null,
    education: content.education.length > 0 ? (
      <>
        <Text style={styles.sectionLabel}>Education</Text>
        {content.education.map((e, i) => (
          <View key={i} style={styles.eduRow}>
            <Text>
              {e.credential} · {e.issuer}
            </Text>
            {e.year ? <Text style={styles.period}>{e.year}</Text> : null}
          </View>
        ))}
      </>
    ) : null,
    certifications: content.certifications.length > 0 ? (
      <>
        <Text style={styles.sectionLabel}>Certifications</Text>
        {content.certifications.map((c, i) => (
          <View key={i} style={styles.eduRow}>
            <Text>
              {c.name} · {c.issuer}
            </Text>
            {c.year ? <Text style={styles.period}>{c.year}</Text> : null}
          </View>
        ))}
      </>
    ) : null,
    projects: content.projects && content.projects.length > 0 ? (
      <>
        <Text style={styles.sectionLabel}>Projects</Text>
        {content.projects.map((p, i) => (
          <View key={i} style={styles.project}>
            <Text>
              <Text style={styles.roleTitle}>{p.title}</Text>
              {p.description ? ` — ${p.description}` : ""}
            </Text>
          </View>
        ))}
      </>
    ) : null,
  };

  return (
    <Document title={`${content.fullName} — Resume`} author={content.fullName}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{content.fullName}</Text>
        {contactParts.length > 0 && (
          <Text style={styles.contact}>{contactParts.join("  ·  ")}</Text>
        )}
        <View style={styles.rule} />

        {normalizeResumeSectionOrder(content).map((section) => (
        <React.Fragment key={section}>{sectionRenderers[section]}</React.Fragment>
      ))}
      </Page>
    </Document>
  );
}

/** Generate the PDF in the browser and trigger a download. */
export async function downloadResumePdf(content: ResumeContent): Promise<void> {
  const blob = await pdf(<ResumePdfDocument content={content} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = content.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "resume";
  a.href = url;
  a.download = `${safeName}_resume.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
