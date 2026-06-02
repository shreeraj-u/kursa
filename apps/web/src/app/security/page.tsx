import LegalLayout from "@/components/landing/legal-layout";

export const metadata = {
  title: "Security — Kursa",
  description: "Simple and transparent security practices for Kursa, an AI career operating system.",
};

export default function SecurityPage() {
  return (
    <LegalLayout
      eyebrow="SECURITY"
      title="Security Practices"
      lastUpdated="Last updated: June 2, 2026"
    >
      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">1. Data Encryption</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          Your personal data is encrypted at all stages of its lifecycle:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-[var(--mute)]">
          <li><strong>In Transit:</strong> All connections to Kursa are encrypted using secure TLS 1.3 protocols, protecting your data from interception.</li>
          <li><strong>At Rest:</strong> All user profiles, resume text, and journal entries are encrypted in our databases using industry-standard AES-256 encryption.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">2. Secure Authentication</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          We use secure, passwordless magic links and trusted OAuth single-sign-on (SSO) providers. This ensures you never have to worry about password breaches or keyloggers compromising your Kursa credentials.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">3. Infrastructure and Isolation</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          Our services run on enterprise-grade cloud providers. We enforce:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-[var(--mute)]">
          <li>VPC network isolation, keeping database systems completely disconnected from the public internet.</li>
          <li>Continuous vulnerability scanning and automated dependency patching to guard against newly discovered attack vectors.</li>
          <li>Strict access controls limiting infrastructure administration exclusively to senior operations staff based in Singapore.</li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-[var(--line)] pt-8">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">Vulnerability Disclosure</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          We welcome and appreciate responsible disclosures from security researchers. If you think you've found a vulnerability in Kursa, please email us directly at <a href="mailto:security@kursa.io" className="text-[var(--ink)] underline hover:text-[var(--accent)] transition-colors">security@kursa.io</a>. We will investigate promptly.
        </p>
      </section>
    </LegalLayout>
  );
}
