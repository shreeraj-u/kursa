"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

import { api } from "@/lib/api";

import type { RiskAppetite, SkillInput, WorkEnvironment } from "@kursa/types";
import { ChoiceAnswer } from "./answers/choice-answer";
import { ImportsAnswer } from "./answers/imports-answer";
import { ReviewAnswer } from "./answers/review-answer";
import { SkillsAnswer } from "./answers/skills-answer";
import { TextAnswer } from "./answers/text-answer";
import { TextareaAnswer } from "./answers/textarea-answer";
import { WorkHistoryAnswer } from "./answers/work-history-answer";
import { EducationAnswer } from "./answers/education-answer";
import { ProjectAnswer } from "./answers/project-answer";
import { AchievementAnswer } from "./answers/achievement-answer";
import { LanguagesAnswer } from "./answers/languages-answer";
import { SocialLinksAnswer } from "./answers/social-links-answer";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import type { FormState, Message, Step, StepId } from "./types";

const STEPS: Step[] = [
  { id: "welcome", prompts: ["Hey, I'm Kursa.", "I'll ask you a few quick things so I can map your career foundation.", "Ready when you are."] },
  { id: "targetRole", prompts: ["What role are you targeting next?"] },
  { id: "location", prompts: ["Nice. Where are you based right now?"] },
  { id: "yearsOfExperience", prompts: ["How many years of professional experience do you have?"] },
  { id: "bio", prompts: ["In a sentence or two, who are you professionally?"] },
  { id: "imports", prompts: ["Before we list your skills and experience, want to import them?", "Drop in a resume and I'll pull your skills and work history automatically. Totally optional."] },
  { id: "skills", prompts: ["Here are your skills.", "Add, edit, or remove any — these are the ones a recruiter or hiring manager should see."] },
  { id: "workHistory", prompts: ["Now your work experience.", "Review what's here and add anything missing — company, role, and a brief summary of what you did."] },
  { id: "education", prompts: ["Let's check your education and credentials next."] },
  { id: "projects", prompts: ["Any key projects you'd like to feature on your profile?"] },
  { id: "achievements", prompts: ["Awesome. Do you have any notable achievements, speaking events, or awards?"] },
  { id: "languages", prompts: ["Which languages do you speak, and at what proficiency?"] },
  { id: "socialLinks", prompts: ["Finally, drop your professional social links (GitHub, LinkedIn, website) below."] },
  { id: "workEnvironment", prompts: ["What kind of work environment do you thrive in?"] },
  { id: "riskAppetite", prompts: ["And your risk appetite for your next move?"] },
  { id: "salaryExpectation", prompts: ["What's your salary expectation? A rough range is fine."] },
  { id: "workingStyle", prompts: ["How would you describe your working style?"] },
  { id: "constraints", prompts: ["Any constraints I should keep in mind? (e.g., visa, relocation, hours)"] },
  { id: "targetRoles", prompts: ["Which roles excite you for the future?"] },
  { id: "targetIndustries", prompts: ["Which industries are you drawn to?"] },
  { id: "horizon3y", prompts: ["Where do you want to be in 3 years?"] },
  { id: "horizon5y", prompts: ["And in 5 years?"] },
  { id: "definitionOfSuccess", prompts: ["How would you define success for yourself?"] },
  { id: "review", prompts: ["We're at the finish line.", "Take a look at the summary — if it looks right, lock it in and I'll save your profile."] },
];

const WORK_ENVIRONMENTS: { value: WorkEnvironment; label: string }[] = [
  { value: "startup", label: "Startup" },
  { value: "corporate", label: "Corporate" },
  { value: "remote", label: "Remote-first" },
  { value: "hybrid", label: "Hybrid" },
];

const RISK_APPETITES: { value: RiskAppetite; label: string }[] = [
  { value: "stability_seeking", label: "Stability seeking" },
  { value: "balanced", label: "Balanced" },
  { value: "high_growth", label: "High growth" },
];

function emptyForm(): FormState {
  return {
    basics: { targetRole: "", location: "", yearsOfExperience: "", bio: "" },
    skills: [],
    workHistory: [],
    projects: [],
    achievements: [],
    education: [],
    languages: [],
    socialLinks: [],
    values: { workEnvironment: "", riskAppetite: "", salaryExpectation: "", workingStyle: "", constraints: "" },
    aspirations: { targetRoles: "", targetIndustries: "", horizon3y: "", horizon5y: "", definitionOfSuccess: "" },
    imports: { linkedinProfileUrl: "" },
  };
}

export default function OnboardingChat() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, startSaving] = useTransition();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, startUploading] = useTransition();
  const [lastDetectedSkills, setLastDetectedSkills] = useState<SkillInput[]>([]);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const noticeCounterRef = useRef(0);

  const currentStep = STEPS[stepIndex];
  const progress = (stepIndex / (STEPS.length - 1)) * 100;

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    const prompts = STEPS[stepIndex].prompts;
    const lastId = `bot-${stepIndex}-${prompts.length - 1}`;
    if (messagesRef.current.some((m) => m.id === lastId)) { setIsTyping(false); return; }

    setIsTyping(true);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let delay = 450;

    prompts.forEach((prompt, i) => {
      timers.push(setTimeout(() => {
        setMessages((prev) => {
          const id = `bot-${stepIndex}-${i}`;
          if (prev.some((m) => m.id === id)) return prev;
          return [...prev, { id, role: "bot", text: prompt }];
        });
      }, delay));
      delay += Math.min(Math.max(prompt.length * 16, 320), 850);
    });

    timers.push(setTimeout(() => setIsTyping(false), delay));
    return () => { for (const t of timers) clearTimeout(t); };
  }, [stepIndex]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isTyping]);

  const recordAnswer = (text: string) => {
    const id = `answer-${stepIndex}`;
    setMessages((prev) => {
      if (prev.some((m) => m.id === id)) return prev.map((m) => (m.id === id ? { ...m, text } : m));
      return [...prev, { id, role: "user", text }];
    });
  };

  const pushNotice = (text: string) => {
    noticeCounterRef.current += 1;
    setMessages((prev) => [...prev, { id: `notice-${noticeCounterRef.current}`, role: "user", text }]);
  };

  const advance = useCallback(() => setStepIndex((p) => Math.min(p + 1, STEPS.length - 1)), []);
  const goBack = useCallback(() => setStepIndex((p) => Math.max(p - 1, 0)), []);

  const handleTextStep = (displayValue: string) => { recordAnswer(displayValue); advance(); };

  const mergeImportedSkills = (incoming: SkillInput[]) => {
    setForm((prev) => {
      const seen = new Map<string, SkillInput>();
      for (const s of [...prev.skills, ...incoming]) {
        const key = s.name.trim().toLowerCase();
        if (key && !seen.has(key)) seen.set(key, { ...s, name: s.name.trim() });
      }
      return { ...prev, skills: Array.from(seen.values()) };
    });
  };

  const handleUploadResume = () => {
    if (!resumeFile) { toast.error("Choose a resume file first."); return; }
    startUploading(async () => {
      try {
        const formData = new FormData();
        formData.set("resume", resumeFile);
        const result = await api.onboarding.uploadResume(formData);

        // Pre-populate skills
        const detected = result.importedSkills.map(({ name, category, confidenceRating }) => ({
          name, category, confidenceRating,
        }));
        mergeImportedSkills(detected);
        setLastDetectedSkills(detected);

        // Pre-populate work history (skip entries already added) and record the upload
        setForm((prev) => {
          const existingWork = new Set(
            prev.workHistory.map((w) => `${w.companyName.toLowerCase()}__${w.roleTitle.toLowerCase()}`),
          );
          const freshWork = result.importedWorkHistory.filter(
            (w) => !existingWork.has(`${w.companyName.toLowerCase()}__${w.roleTitle.toLowerCase()}`),
          );

          const existingEdu = new Set(
            prev.education.map((e) => `${e.credentialName.toLowerCase()}__${e.issuer.toLowerCase()}`),
          );
          const freshEdu = result.importedEducation.filter(
            (e) => !existingEdu.has(`${e.credentialName.toLowerCase()}__${e.issuer.toLowerCase()}`),
          );

          const existingProject = new Set(
            prev.projects.map((p) => p.title.toLowerCase()),
          );
          const freshProject = result.importedProjects.filter(
            (p) => !existingProject.has(p.title.toLowerCase()),
          );

          const existingAchievement = new Set(
            prev.achievements.map((a) => a.title.toLowerCase()),
          );
          const freshAchievement = result.importedAchievements.filter(
            (a) => !existingAchievement.has(a.title.toLowerCase()),
          );

          const existingLanguage = new Set(
            prev.languages.map((l) => l.name.toLowerCase()),
          );
          const freshLanguage = result.importedLanguages.filter(
            (l) => !existingLanguage.has(l.name.toLowerCase()),
          );

          const existingLink = new Set(
            prev.socialLinks.map((l) => `${l.platform.toLowerCase()}__${l.url.toLowerCase()}`),
          );
          const freshLink = result.importedSocialLinks.filter(
            (l) => !existingLink.has(`${l.platform.toLowerCase()}__${l.url.toLowerCase()}`),
          );

          return {
            ...prev,
            workHistory: [...prev.workHistory, ...freshWork],
            education: [...prev.education, ...freshEdu],
            projects: [...prev.projects, ...freshProject],
            achievements: [...prev.achievements, ...freshAchievement],
            languages: [...prev.languages, ...freshLanguage],
            socialLinks: [...prev.socialLinks, ...freshLink],
            imports: prev.imports,
          };
        });

        const parts: string[] = [];
        if (detected.length > 0) parts.push(`${detected.length} skill${detected.length === 1 ? "" : "s"}`);
        if (result.importedWorkHistory.length > 0) parts.push(`${result.importedWorkHistory.length} role${result.importedWorkHistory.length === 1 ? "" : "s"}`);
        if (result.importedEducation.length > 0) parts.push(`${result.importedEducation.length} education entr${result.importedEducation.length === 1 ? "y" : "ies"}`);
        if (result.importedLanguages.length > 0) parts.push(`${result.importedLanguages.length} language${result.importedLanguages.length === 1 ? "" : "s"}`);

        if (parts.length === 0) {
          pushNotice("Uploaded my resume — nothing detected.");
          toast.message("Resume uploaded, but I couldn't extract data from it.");
        } else {
          pushNotice(`Uploaded my resume — pulled ${parts.join(", ")}.`);
          toast.success(`Extracted ${parts.join(", ")} from your resume`);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Resume upload failed");
      }
    });
  };

  const handleSave = () => {
    startSaving(async () => {
      try {
        const yearsParsed = Number(form.basics.yearsOfExperience);
        await api.onboarding.complete({
          basics: {
            targetRole: form.basics.targetRole.trim(),
            location: form.basics.location.trim(),
            yearsOfExperience: Number.isFinite(yearsParsed) ? yearsParsed : 0,
            bio: form.basics.bio.trim(),
          },
          skills: form.skills.map((s) => ({ name: s.name.trim(), category: s.category, confidenceRating: s.confidenceRating })),
          workHistory: form.workHistory.map((w) => ({
            companyName: w.companyName.trim(),
            roleTitle: w.roleTitle.trim(),
            outcomes: w.outcomes.trim(),
            startDate: w.startDate,
            endDate: w.endDate,
            isCurrent: w.isCurrent,
          })),
          education: form.education,
          languages: form.languages,
          socialLinks: form.socialLinks,
          projects: form.projects,
          achievements: form.achievements,
          values: {
            workEnvironment: form.values.workEnvironment,
            riskAppetite: form.values.riskAppetite,
            salaryExpectation: form.values.salaryExpectation.trim(),
            workingStyle: form.values.workingStyle.trim(),
            constraints: form.values.constraints.trim() || "None",
          },
          aspirations: {
            targetRoles: form.aspirations.targetRoles.trim(),
            targetIndustries: form.aspirations.targetIndustries.trim(),
            horizon3y: form.aspirations.horizon3y.trim(),
            horizon5y: form.aspirations.horizon5y.trim(),
            definitionOfSuccess: form.aspirations.definitionOfSuccess.trim(),
          },
          imports: form.imports,
        });
        toast.success("Onboarding saved");
        router.push("/dashboard");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not finish onboarding");
      }
    });
  };

  function renderCurrentStep(stepId: StepId) {
    switch (stepId) {
      case "welcome":
        return (
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-md px-4 py-2 bg-ink text-bg text-sm"
              onClick={() => { recordAnswer("Let's do it."); advance(); }}
            >
              Let's do it
            </button>
          </div>
        );

      case "targetRole":
        return <TextAnswer placeholder="e.g., Senior Frontend Engineer" value={form.basics.targetRole}
          onChange={(v) => setForm((p) => ({ ...p, basics: { ...p.basics, targetRole: v } }))}
          onSubmit={() => { const v = form.basics.targetRole.trim(); if (!v) { toast.error("Tell me the role you're aiming for"); return; } handleTextStep(v); }}
          onBack={goBack} />;

      case "location":
        return <TextAnswer placeholder="e.g., Singapore" value={form.basics.location}
          onChange={(v) => setForm((p) => ({ ...p, basics: { ...p.basics, location: v } }))}
          onSubmit={() => { const v = form.basics.location.trim(); if (!v) { toast.error("Where are you based?"); return; } handleTextStep(v); }}
          onBack={goBack} />;

      case "yearsOfExperience":
        return <TextAnswer type="number" min={0} max={80} placeholder="0" value={form.basics.yearsOfExperience}
          onChange={(v) => setForm((p) => ({ ...p, basics: { ...p.basics, yearsOfExperience: v } }))}
          onSubmit={() => {
            const v = form.basics.yearsOfExperience.trim();
            const n = Number(v);
            if (v === "" || Number.isNaN(n) || n < 0 || n > 80) { toast.error("Enter a number between 0 and 80"); return; }
            handleTextStep(`${n} ${n === 1 ? "year" : "years"}`);
          }}
          onBack={goBack} />;

      case "bio":
        return <TextareaAnswer placeholder="A senior engineer with a knack for shipping clean, fast UI..." value={form.basics.bio}
          onChange={(v) => setForm((p) => ({ ...p, basics: { ...p.basics, bio: v } }))}
          onSubmit={() => { const v = form.basics.bio.trim(); if (!v) { toast.error("Share a short bio"); return; } handleTextStep(v); }}
          onBack={goBack} />;

      case "skills":
        return <SkillsAnswer skills={form.skills}
          onChange={(skills) => setForm((p) => ({ ...p, skills }))}
          onSubmit={() => { if (form.skills.length === 0) { toast.error("Add at least one skill"); return; } recordAnswer(`${form.skills.length} skill${form.skills.length === 1 ? "" : "s"} added`); advance(); }}
          onBack={goBack} />;

      case "workHistory":
        return <WorkHistoryAnswer items={form.workHistory}
          onChange={(workHistory) => setForm((p) => ({ ...p, workHistory }))}
          onSubmit={() => { if (form.workHistory.length === 0) { toast.error("Add at least one work history entry"); return; } recordAnswer(`${form.workHistory.length} role${form.workHistory.length === 1 ? "" : "s"} added`); advance(); }}
          onBack={goBack} />;

      case "workEnvironment":
        return <ChoiceAnswer choices={WORK_ENVIRONMENTS} value={form.values.workEnvironment}
          onSelect={(v) => { setForm((p) => ({ ...p, values: { ...p.values, workEnvironment: v } })); recordAnswer(WORK_ENVIRONMENTS.find((e) => e.value === v)?.label ?? v); advance(); }}
          onBack={goBack} />;

      case "riskAppetite":
        return <ChoiceAnswer choices={RISK_APPETITES} value={form.values.riskAppetite}
          onSelect={(v) => { setForm((p) => ({ ...p, values: { ...p.values, riskAppetite: v } })); recordAnswer(RISK_APPETITES.find((e) => e.value === v)?.label ?? v); advance(); }}
          onBack={goBack} />;

      case "salaryExpectation":
        return <TextAnswer placeholder="e.g., USD 150-180k" value={form.values.salaryExpectation}
          onChange={(v) => setForm((p) => ({ ...p, values: { ...p.values, salaryExpectation: v } }))}
          onSubmit={() => { const v = form.values.salaryExpectation.trim(); if (!v) { toast.error("Share a target compensation"); return; } handleTextStep(v); }}
          onBack={goBack} />;

      case "workingStyle":
        return <TextareaAnswer placeholder="Async-first, deep work in mornings..." value={form.values.workingStyle}
          onChange={(v) => setForm((p) => ({ ...p, values: { ...p.values, workingStyle: v } }))}
          onSubmit={() => { const v = form.values.workingStyle.trim(); if (!v) { toast.error("Describe your working style"); return; } handleTextStep(v); }}
          onBack={goBack} />;

      case "constraints":
        return <TextAnswer placeholder="None / needs visa sponsorship / remote only..." value={form.values.constraints}
          onChange={(v) => setForm((p) => ({ ...p, values: { ...p.values, constraints: v } }))}
          onSubmit={() => handleTextStep(form.values.constraints.trim() || "None")}
          onBack={goBack} allowEmpty />;

      case "targetRoles":
        return <TextAnswer placeholder="Staff Engineer, Engineering Manager..." value={form.aspirations.targetRoles}
          onChange={(v) => setForm((p) => ({ ...p, aspirations: { ...p.aspirations, targetRoles: v } }))}
          onSubmit={() => { const v = form.aspirations.targetRoles.trim(); if (!v) { toast.error("Share roles you're aiming for"); return; } handleTextStep(v); }}
          onBack={goBack} />;

      case "targetIndustries":
        return <TextAnswer placeholder="Developer tools, fintech, AI..." value={form.aspirations.targetIndustries}
          onChange={(v) => setForm((p) => ({ ...p, aspirations: { ...p.aspirations, targetIndustries: v } }))}
          onSubmit={() => { const v = form.aspirations.targetIndustries.trim(); if (!v) { toast.error("Share industries you're drawn to"); return; } handleTextStep(v); }}
          onBack={goBack} />;

      case "horizon3y":
        return <TextareaAnswer placeholder="Leading a team that ships a 0-to-1 product..." value={form.aspirations.horizon3y}
          onChange={(v) => setForm((p) => ({ ...p, aspirations: { ...p.aspirations, horizon3y: v } }))}
          onSubmit={() => { const v = form.aspirations.horizon3y.trim(); if (!v) { toast.error("Share your 3-year vision"); return; } handleTextStep(v); }}
          onBack={goBack} />;

      case "horizon5y":
        return <TextareaAnswer placeholder="Founder, principal engineer, head of platform..." value={form.aspirations.horizon5y}
          onChange={(v) => setForm((p) => ({ ...p, aspirations: { ...p.aspirations, horizon5y: v } }))}
          onSubmit={() => { const v = form.aspirations.horizon5y.trim(); if (!v) { toast.error("Share your 5-year vision"); return; } handleTextStep(v); }}
          onBack={goBack} />;

      case "definitionOfSuccess":
        return <TextareaAnswer placeholder="Building things people use daily, with people I respect..." value={form.aspirations.definitionOfSuccess}
          onChange={(v) => setForm((p) => ({ ...p, aspirations: { ...p.aspirations, definitionOfSuccess: v } }))}
          onSubmit={() => { const v = form.aspirations.definitionOfSuccess.trim(); if (!v) { toast.error("Define success in your own words"); return; } handleTextStep(v); }}
          onBack={goBack} />;

      case "imports":
        return <ImportsAnswer
          imports={form.imports}
          onChange={(imports) => setForm((p) => ({ ...p, imports }))}
          resumeFile={resumeFile}
          onResumeFileChange={setResumeFile}
          isUploading={isUploading}
          detectedSkills={lastDetectedSkills}
          onUploadResume={handleUploadResume}
          onSkip={() => { recordAnswer("Skipping imports."); advance(); }}
          onContinue={() => { recordAnswer("Continue."); advance(); }}
          onBack={goBack}
        />;

      case "review":
        return <ReviewAnswer form={form} isSaving={isSaving} onBack={goBack} onSubmit={handleSave} />;

      case "education":
        return <EducationAnswer items={form.education}
          onChange={(education) => setForm((p) => ({ ...p, education }))}
          onSubmit={() => { recordAnswer(`${form.education.length} credential${form.education.length === 1 ? "" : "s"} added`); advance(); }}
          onBack={goBack} />;

      case "projects":
        return <ProjectAnswer items={form.projects}
          onChange={(projects) => setForm((p) => ({ ...p, projects }))}
          onSubmit={() => { recordAnswer(`${form.projects.length} project${form.projects.length === 1 ? "" : "s"} added`); advance(); }}
          onBack={goBack} />;

      case "achievements":
        return <AchievementAnswer items={form.achievements}
          onChange={(achievements) => setForm((p) => ({ ...p, achievements }))}
          onSubmit={() => { recordAnswer(`${form.achievements.length} achievement${form.achievements.length === 1 ? "" : "s"} added`); advance(); }}
          onBack={goBack} />;

      case "languages":
        return <LanguagesAnswer items={form.languages}
          onChange={(languages) => setForm((p) => ({ ...p, languages }))}
          onSubmit={() => { recordAnswer(`${form.languages.length} language${form.languages.length === 1 ? "" : "s"} added`); advance(); }}
          onBack={goBack} />;

      case "socialLinks":
        return <SocialLinksAnswer items={form.socialLinks}
          onChange={(socialLinks) => setForm((p) => ({ ...p, socialLinks }))}
          onSubmit={() => { recordAnswer(`${form.socialLinks.length} link${form.socialLinks.length === 1 ? "" : "s"} added`); advance(); }}
          onBack={goBack} />;

      default: {
        const _exhaustive: never = stepId;
        return _exhaustive;
      }
    }
  }

  return (
    <div className="w-full max-w-6xl h-full">
      <div className="rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between px-5 py-3 border-b border-line">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span className="mono text-xs">kursa onboarding</span>
          </div>
          <div className="mono text-xs text-mute">
            {String(stepIndex + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
          </div>
        </div>

        <div className="h-1 w-full bg-bg-sub">
          <motion.div
            className="h-full bg-accent"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>

        <div ref={transcriptRef} className="space-y-3 overflow-y-auto px-5 py-4 h-[360px]">
          {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
          <AnimatePresence>{isTyping ? <TypingIndicator /> : null}</AnimatePresence>
        </div>

        <div className="px-5 py-4 border-t border-line bg-bg-sub">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderCurrentStep(currentStep.id)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
