import LegalLayout from "@/components/landing/legal-layout";

export const metadata = {
  title: "Privacy Policy — Kursa",
  description: "Simple and transparent privacy policy for Kursa, an AI career operating system.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="LEGAL / PRIVACY"
      title="Privacy Policy"
      lastUpdated="Last updated: June 2, 2026"
    >
      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">1. Introduction</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          At Kursa Labs, we build tools that think alongside you throughout your career. To do that effectively, we need to handle some of your personal and professional information. We believe in complete transparency, extreme data minimization, and placing you in control of your footprint.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">2. What We Collect</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          We collect only the information that is strictly required to run our career operating system:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-[var(--mute)]">
          <li><strong>Account Data:</strong> Email address and authentication details provided during login.</li>
          <li><strong>Career & Profile Information:</strong> Resumes, work history, job targets, goals, and skills profile that you voluntarily submit or build within Kursa.</li>
          <li><strong>Interaction Data:</strong> The chats, prompts, and updates you make when building roadmaps or editing your journal.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">3. How We Use Your Data</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          Your information is used solely to power the Kursa AI features:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-[var(--mute)]">
          <li>Customizing career roadmaps and role recommendations.</li>
          <li>Analyzing and optimizing resumes in our Resume Studio.</li>
          <li>Improving the underlying AI matching models for your specific context.</li>
        </ul>
        <p className="text-[var(--mute)] leading-relaxed">
          We do not sell, rent, or trade your data to recruiters, employers, or third-party advertisers.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">4. Your Control and Rights</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          You own your career data. At any point, you can download your complete data profile or request the permanent deletion of your account and all associated records directly from the settings panel or by reaching out to us.
        </p>
      </section>

      <section className="space-y-4 border-t border-[var(--line)] pt-8">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">Contact Us</h2>
        <p className="text-[var(--mute)] leading-relaxed">
          If you have any questions about this Privacy Policy or how we handle your personal data, please contact Kursa Labs in Singapore at <a href="mailto:privacy@kursa.io" className="text-[var(--ink)] underline hover:text-[var(--accent)] transition-colors">privacy@kursa.io</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
