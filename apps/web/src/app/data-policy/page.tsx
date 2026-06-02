import LegalLayout from "@/components/landing/legal-layout";

export const metadata = {
  title: "Data Policy — Kursa",
  description: "Simple and transparent data policy for Kursa, an AI career operating system.",
};

export default function DataPolicyPage() {
  return (
    <LegalLayout
      eyebrow="LEGAL / DATA POLICY"
      title="Data & AI Usage Policy"
      lastUpdated="Last updated: June 2, 2026"
    >
      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">1. Data Ownership</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          At Kursa Labs, we believe your professional history and career aspirations belong entirely to you. Any resume you upload, journal entry you write, or career roadmap you design is your property. We are simply curators helping you navigate your journey.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">2. AI Models and Training</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          We use state-of-the-art AI systems to help analyze and build your career profiles:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-[var(--mute)]">
          <li><strong>No Global Model Training:</strong> We do not use your personal resumes, journal entries, or career logs to train third-party public foundation AI models.</li>
          <li><strong>Secure API Processors:</strong> We partner with trusted, secure AI inference providers. All interactions with these models are conducted via private APIs that explicitly prohibit the provider from retaining or using your data for model fine-tuning or training.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">3. Data Portability and Export</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          You should never feel locked into our system. At any time, you can:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-[var(--mute)]">
          <li>Export your updated resumes as high-quality, ATS-parsed PDF or raw markdown format.</li>
          <li>Request a complete dump of your Kursa profile and journal data.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">4. Retention and Erasure</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          We retain your data as long as your account is active to provide you with career recommendations. When you request the deletion of your account:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-[var(--mute)]">
          <li>All uploaded files are permanently purged from our object storage within 48 hours.</li>
          <li>All database records relating to your profile are irreversibly deleted or fully anonymized.</li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-[var(--line)] pt-8">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">Contact Us</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          If you have any questions regarding your data or our AI processing methods, please reach out to the Kursa Labs data team at <a href="mailto:data@kursa.io" className="text-[var(--ink)] underline hover:text-[var(--accent)] transition-colors">data@kursa.io</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
