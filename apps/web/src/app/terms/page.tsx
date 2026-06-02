import LegalLayout from "@/components/landing/legal-layout";

export const metadata = {
  title: "Terms of Service — Kursa",
  description: "Simple and transparent terms of service for Kursa, an AI career operating system.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="LEGAL / TERMS"
      title="Terms of Service"
      lastUpdated="Last updated: June 2, 2026"
    >
      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">1. Acceptance of Terms</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          By accessing or using Kursa, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, please do not use the application. These terms constitute a legally binding agreement between you and Kursa Labs.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">2. Description of Service</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          Kursa is an AI-powered career operating system designed to assist individuals in managing their professional trajectories, resume building, skill mapping, and career planning. We constantly iterate and update features to deliver the best experience.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">3. User Accounts</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          To access Kursa, you must register for an account. You agree to provide accurate, current, and complete information and maintain the security of your account credentials. You are responsible for all activities that occur under your account.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">4. Ownership and Intellectual Property</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          <strong>Your Content:</strong> You retain full ownership of all data, resumes, documents, and materials you upload, input, or generate using Kursa.
        </p>
        <p className="text-[var(--mute)] leading-relaxed">
          <strong>Kursa IP:</strong> Kursa Labs retains all rights, title, and interest in and to the Kursa application, design system, underlying algorithms, logos, and service codebase.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">5. Governing Law</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          These terms and any disputes arising out of or related to your use of Kursa are governed by and construed in accordance with the laws of the Republic of Singapore, without regard to its conflict of law principles.
        </p>
      </section>

      <section className="space-y-4 border-t border-[var(--line)] pt-8">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">Contact Us</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          If you have any questions about these Terms, please contact Kursa Labs in Singapore at <a href="mailto:legal@kursa.io" className="text-[var(--ink)] underline hover:text-[var(--accent)] transition-colors">legal@kursa.io</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
