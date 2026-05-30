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

import { groupAchievements, normalizeResumeSectionOrder } from "@/lib/dashboard/resume/section-order";

// Real text-based (ATS-readable) PDF in a "Classic Elegant Serif" style. Times-Roman
// is a built-in PDF font, so the output has selectable text and embeds no images.
// This MUST stay visually in lock-step with the on-screen preview (resume-document.tsx):
// centered serif header, uppercase letter-spaced section labels with a full-width rule,
// role-bold/company-normal, italic muted periods, en-dash bullets.
const INK = "#1a1a1a";
const MUTE = "#5a5a5a";
const RULE = "#bfbfbf";

const styles = StyleSheet.create({
  page: { paddingVertical: 38, paddingHorizontal: 40, fontSize: 9.5, fontFamily: "Times-Roman", color: INK, lineHeight: 1.4 },
  header: { alignItems: "center", marginBottom: 4 },
  name: { fontSize: 21, fontFamily: "Times-Bold", letterSpacing: 0.5 },
  contact: { fontSize: 8.5, color: MUTE, marginTop: 4 },
  sectionLabel: {
    fontSize: 8.5,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: INK,
    marginTop: 11,
    marginBottom: 5,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  summary: { color: INK, marginBottom: 1 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 1 },
  roleTitle: { fontFamily: "Times-Bold" },
  roleCompany: { fontFamily: "Times-Roman" },
  period: { fontSize: 8.5, fontFamily: "Times-Italic", color: MUTE },
  projectUrl: { fontSize: 8.5, color: MUTE },
  description: { color: INK, marginTop: 1 },
  bullet: { flexDirection: "row", marginBottom: 1.5, paddingLeft: 4 },
  bulletDash: { width: 9, color: MUTE },
  bulletText: { flex: 1, color: INK },
  skills: { color: INK },
  block: { marginBottom: 7 },
  project: { marginBottom: 7 },
  otherRow: { marginBottom: 1.5 },
  otherLabel: { fontFamily: "Times-Bold" },
});

function ResumePdfDocument({ content }: { content: ResumeContent }) {
  const contactParts = [
    content.contact.email,
    content.contact.location,
    ...content.contact.links,
  ].filter(Boolean);

  const achievementGroups = groupAchievements(content.achievements);

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
            <View style={styles.rowBetween}>
              <Text>
                <Text style={styles.roleTitle}>{exp.roleTitle}</Text>
                <Text style={styles.roleCompany}> · {exp.company}</Text>
              </Text>
              <Text style={styles.period}>{exp.period}</Text>
            </View>
            {exp.bullets.map((b, j) => (
              <View key={j} style={styles.bullet}>
                <Text style={styles.bulletDash}>–</Text>
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
        <Text style={styles.skills}>{content.skills.join("  ·  ")}</Text>
      </>
    ) : null,
    education: content.education.length > 0 ? (
      <>
        <Text style={styles.sectionLabel}>Education</Text>
        {content.education.map((e, i) => (
          <View key={i} style={styles.rowBetween}>
            <Text>
              <Text style={styles.roleTitle}>{e.credential}</Text> · {e.issuer}
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
          <View key={i} style={styles.rowBetween}>
            <Text>
              <Text style={styles.roleTitle}>{c.name}</Text> · {c.issuer}
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
          <View key={i} style={styles.project} wrap={false}>
            <View style={styles.rowBetween}>
              <Text>
                <Text style={styles.roleTitle}>{p.title}</Text>
                {p.url ? <Text style={styles.projectUrl}>{`   ${p.url}`}</Text> : null}
              </Text>
              {p.period ? <Text style={styles.period}>{p.period}</Text> : null}
            </View>
            {p.description ? <Text style={styles.description}>{p.description}</Text> : null}
            {p.bullets?.map((b, j) => (
              <View key={j} style={styles.bullet}>
                <Text style={styles.bulletDash}>–</Text>
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        ))}
      </>
    ) : null,
    others: achievementGroups.length > 0 ? (
      <>
        <Text style={styles.sectionLabel}>Others</Text>
        {achievementGroups.map((g) => (
          <Text key={g.type} style={styles.otherRow}>
            <Text style={styles.otherLabel}>{g.label}: </Text>
            {g.titles.join(", ")}
          </Text>
        ))}
      </>
    ) : null,
  };

  return (
    <Document title={`${content.fullName} — Resume`} author={content.fullName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{content.fullName}</Text>
          {contactParts.length > 0 && (
            <Text style={styles.contact}>{contactParts.join("  ·  ")}</Text>
          )}
        </View>

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
