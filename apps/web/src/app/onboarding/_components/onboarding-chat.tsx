"use client";

import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";
import { Label } from "@kursa/ui/components/label";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveOnboarding, uploadResumeFile } from "../actions";
import type {
  AspirationsInput,
  BasicsInput,
  ImportsInput,
  RiskAppetite,
  SkillCategory,
  SkillInput,
  ValuesInput,
  WorkEnvironment,
  WorkHistoryInput,
} from "../schema";

type Message =
  | { id: string; role: "bot"; text: string }
  | { id: string; role: "user"; text: string };

type FormState = {
  basics: BasicsInputDraft;
  skills: SkillInput[];
  workHistory: WorkHistoryInput[];
  values: ValuesInputDraft;
  aspirations: AspirationsInput;
  imports: ImportsInput;
};

type BasicsInputDraft = Omit<BasicsInput, "yearsOfExperience"> & { yearsOfExperience: string };
type ValuesInputDraft = Omit<ValuesInput, "workEnvironment" | "riskAppetite"> & {
  workEnvironment: WorkEnvironment | "";
  riskAppetite: RiskAppetite | "";
};

type StepId =
  | "welcome"
  | "targetRole"
  | "location"
  | "yearsOfExperience"
  | "bio"
  | "skills"
  | "workHistory"
  | "workEnvironment"
  | "riskAppetite"
  | "salaryExpectation"
  | "workingStyle"
  | "constraints"
  | "targetRoles"
  | "targetIndustries"
  | "horizon3y"
  | "horizon5y"
  | "definitionOfSuccess"
  | "imports"
  | "review";

type Step = {
  id: StepId;
  prompts: string[];
};

const steps: Step[] = [
  {
    id: "welcome",
    prompts: [
      "Hey, I'm Kursa.",
      "I'll ask you a few quick things so I can map your career foundation.",
      "Ready when you are.",
    ],
  },
  { id: "targetRole", prompts: ["What role are you targeting next?"] },
  { id: "location", prompts: ["Nice. Where are you based right now?"] },
  { id: "yearsOfExperience", prompts: ["How many years of professional experience do you have?"] },
  { id: "bio", prompts: ["In a sentence or two, who are you professionally?"] },
  {
    id: "skills",
    prompts: [
      "Let's get your skills on record.",
      "Add the ones you'd want a recruiter or hiring manager to know about.",
    ],
  },
  {
    id: "workHistory",
    prompts: [
      "Now your work experience.",
      "Just company, role, and a brief summary of what you did — I'll ask about dates later.",
    ],
  },
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
  {
    id: "imports",
    prompts: [
      "Want me to speed this up?",
      "You can drop in a resume or LinkedIn URL. Totally optional.",
    ],
  },
  {
    id: "review",
    prompts: [
      "We're at the finish line.",
      "Take a look at the summary — if it looks right, lock it in and I'll save your profile.",
    ],
  },
];

const SKILL_CATEGORIES: { value: SkillCategory; label: string }[] = [
  { value: "technical", label: "Technical" },
  { value: "tool", label: "Tool" },
  { value: "soft", label: "Soft" },
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
    values: {
      workEnvironment: "",
      riskAppetite: "",
      salaryExpectation: "",
      workingStyle: "",
      constraints: "",
    },
    aspirations: {
      targetRoles: "",
      targetIndustries: "",
      horizon3y: "",
      horizon5y: "",
      definitionOfSuccess: "",
    },
    imports: {
      resumeFileName: "",
      resumeRawText: "",
      linkedinProfileUrl: "",
    },
  };
}

function MessageBubble({ message }: { message: Message }) {
  const isBot = message.role === "bot";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isBot ? "justify-start" : "justify-end"}`}
    >
      <div className={`flex max-w-[85%] gap-2 ${isBot ? "" : "flex-row-reverse"}`}>
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5"
          style={{
            border: isBot ? "1px solid var(--accent)" : "1px solid var(--line)",
            background: isBot ? "var(--accent-soft, var(--bg-sub))" : "var(--bg-sub)",
          }}
        >
          <span
            className="mono"
            style={{ fontSize: "var(--text-xs)", color: "var(--ink)" }}
          >
            {isBot ? "K" : "you"[0]}
          </span>
        </div>
        <div
          className="rounded-2xl px-4 py-2.5"
          style={{
            background: isBot ? "var(--bg-sub)" : "var(--ink)",
            color: isBot ? "var(--ink)" : "var(--bg)",
            border: isBot ? "1px solid var(--line)" : "1px solid var(--ink)",
            fontSize: "var(--text-sm)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.5,
          }}
        >
          {message.text}
        </div>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2"
    >
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full"
        style={{ border: "1px solid var(--accent)", background: "var(--bg-sub)" }}
      >
        <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--ink)" }}>
          K
        </span>
      </div>
      <div
        className="flex gap-1 rounded-2xl px-3 py-2"
        style={{ background: "var(--bg-sub)", border: "1px solid var(--line)" }}
      >
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--ink)" }}
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: dot * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function OnboardingChat() {
  const [stepIndex, setStepIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(true);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [isSaving, startSaving] = useTransition();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, startUploading] = useTransition();

  const [lastDetectedSkills, setLastDetectedSkills] = useState<SkillInput[]>([]);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const noticeCounterRef = useRef(0);

  const currentStep = steps[stepIndex];
  const progress = (stepIndex / (steps.length - 1)) * 100;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Emit this step's bot prompts once. Stable message ids + a ref mirror of
  // the transcript make this safe across re-renders, React strict-mode double
  // invokes, and back/forward navigation (no duplicate bubbles).
  useEffect(() => {
    const prompts = steps[stepIndex].prompts;
    const lastId = `bot-${stepIndex}-${prompts.length - 1}`;
    const alreadyShown = messagesRef.current.some((message) => message.id === lastId);

    if (alreadyShown) {
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cumulativeDelay = 450;

    prompts.forEach((prompt, index) => {
      timers.push(
        setTimeout(() => {
          setMessages((prev) => {
            const id = `bot-${stepIndex}-${index}`;
            if (prev.some((message) => message.id === id)) {
              return prev;
            }
            return [...prev, { id, role: "bot", text: prompt }];
          });
        }, cumulativeDelay),
      );
      cumulativeDelay += Math.min(Math.max(prompt.length * 16, 320), 850);
    });

    timers.push(setTimeout(() => setIsTyping(false), cumulativeDelay));

    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [stepIndex]);

  useEffect(() => {
    const node = transcriptRef.current;
    if (!node) {
      return;
    }
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages.length, isTyping]);

  // Records the user's answer for the current step. Re-answering after going
  // back replaces the existing bubble instead of appending a duplicate.
  const recordAnswer = (text: string) => {
    const id = `answer-${stepIndex}`;
    setMessages((prev) => {
      if (prev.some((message) => message.id === id)) {
        return prev.map((message) => (message.id === id ? { ...message, text } : message));
      }
      return [...prev, { id, role: "user", text }];
    });
  };

  // Appends a one-off user-side note (e.g., resume parsed) that can occur
  // multiple times within a single step.
  const pushNotice = (text: string) => {
    noticeCounterRef.current += 1;
    const id = `notice-${noticeCounterRef.current}`;
    setMessages((prev) => [...prev, { id, role: "user", text }]);
  };

  const advance = useCallback(() => {
    setStepIndex((previous) => Math.min(previous + 1, steps.length - 1));
  }, []);

  const goBack = useCallback(() => {
    setStepIndex((previous) => Math.max(previous - 1, 0));
  }, []);

  const handleAdvanceWelcome = () => {
    recordAnswer("Let's do it.");
    advance();
  };

  const handleTextStep = (displayValue: string) => {
    recordAnswer(displayValue);
    advance();
  };

  const mergeImportedSkills = (incoming: SkillInput[]) => {
    setForm((prev) => {
      const seen = new Map<string, SkillInput>();
      for (const skill of [...prev.skills, ...incoming]) {
        const key = skill.name.trim().toLowerCase();
        if (!key) {
          continue;
        }
        if (!seen.has(key)) {
          seen.set(key, { ...skill, name: skill.name.trim() });
        }
      }
      return { ...prev, skills: Array.from(seen.values()) };
    });
  };

  const handleSaveOnboarding = () => {
    startSaving(async () => {
      try {
        const yearsParsed = Number(form.basics.yearsOfExperience);
        const payload = {
          basics: {
            targetRole: form.basics.targetRole.trim(),
            location: form.basics.location.trim(),
            yearsOfExperience: Number.isFinite(yearsParsed) ? yearsParsed : 0,
            bio: form.basics.bio.trim(),
          },
          skills: form.skills.map((skill) => ({
            name: skill.name.trim(),
            category: skill.category,
            confidenceRating: skill.confidenceRating,
          })),
          workHistory: form.workHistory.map((item) => ({
            companyName: item.companyName.trim(),
            roleTitle: item.roleTitle.trim(),
            outcomes: item.outcomes.trim(),
          })),
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
        };

        await saveOnboarding(payload);
        toast.success("Onboarding saved");
        window.location.href = "/dashboard";
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not finish onboarding";
        toast.error(message);
      }
    });
  };

  return (
    <div className="w-full max-w-2xl">
      <div
        className="rounded-2xl"
        style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
      >
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--accent, #2f8a4a)" }}
            />
            <span className="mono" style={{ fontSize: "var(--text-xs)" }}>
              kursa onboarding
            </span>
          </div>
          <div className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}>
            {String(stepIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
          </div>
        </div>

        <div className="h-1 w-full" style={{ background: "var(--bg-sub)" }}>
          <motion.div
            className="h-full"
            style={{ background: "var(--accent, #2f8a4a)" }}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>

        <div
          ref={transcriptRef}
          className="space-y-3 overflow-y-auto px-5 py-4"
          style={{ height: 360 }}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <AnimatePresence>{isTyping ? <TypingIndicator /> : null}</AnimatePresence>
        </div>

        <div className="px-5 py-4" style={{ borderTop: "1px solid var(--line)", background: "var(--bg-sub)" }}>
          <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
          {currentStep.id === "welcome" ? (
            <div className="flex justify-end">
              <Button type="button" onClick={handleAdvanceWelcome}>
                Let's do it
              </Button>
            </div>
          ) : null}

          {currentStep.id === "targetRole" ? (
            <TextAnswer
              placeholder="e.g., Senior Frontend Engineer"
              value={form.basics.targetRole}
              onChange={(value) => setForm((prev) => ({ ...prev, basics: { ...prev.basics, targetRole: value } }))}
              onSubmit={() => {
                const value = form.basics.targetRole.trim();
                if (!value) {
                  toast.error("Tell me the role you're aiming for");
                  return;
                }
                handleTextStep(value);
              }}
              onBack={goBack}
            />
          ) : null}

          {currentStep.id === "location" ? (
            <TextAnswer
              placeholder="e.g., Singapore"
              value={form.basics.location}
              onChange={(value) => setForm((prev) => ({ ...prev, basics: { ...prev.basics, location: value } }))}
              onSubmit={() => {
                const value = form.basics.location.trim();
                if (!value) {
                  toast.error("Where are you based?");
                  return;
                }
                handleTextStep(value);
              }}
              onBack={goBack}
            />
          ) : null}

          {currentStep.id === "yearsOfExperience" ? (
            <TextAnswer
              type="number"
              min={0}
              max={80}
              placeholder="0"
              value={form.basics.yearsOfExperience}
              onChange={(value) => setForm((prev) => ({ ...prev, basics: { ...prev.basics, yearsOfExperience: value } }))}
              onSubmit={() => {
                const value = form.basics.yearsOfExperience.trim();
                const numeric = Number(value);
                if (value === "" || Number.isNaN(numeric) || numeric < 0 || numeric > 80) {
                  toast.error("Enter a number between 0 and 80");
                  return;
                }
                handleTextStep(`${numeric} ${numeric === 1 ? "year" : "years"}`);
              }}
              onBack={goBack}
            />
          ) : null}

          {currentStep.id === "bio" ? (
            <TextareaAnswer
              placeholder="A senior engineer with a knack for shipping clean, fast UI..."
              value={form.basics.bio}
              onChange={(value) => setForm((prev) => ({ ...prev, basics: { ...prev.basics, bio: value } }))}
              onSubmit={() => {
                const value = form.basics.bio.trim();
                if (!value) {
                  toast.error("Share a short bio");
                  return;
                }
                handleTextStep(value);
              }}
              onBack={goBack}
            />
          ) : null}

          {currentStep.id === "skills" ? (
            <SkillsAnswer
              skills={form.skills}
              onChange={(skills) => setForm((prev) => ({ ...prev, skills }))}
              onSubmit={() => {
                if (form.skills.length === 0) {
                  toast.error("Add at least one skill");
                  return;
                }
                recordAnswer(`${form.skills.length} skill${form.skills.length === 1 ? "" : "s"} added`);
                advance();
              }}
              onBack={goBack}
            />
          ) : null}

          {currentStep.id === "workHistory" ? (
            <WorkHistoryAnswer
              items={form.workHistory}
              onChange={(items) => setForm((prev) => ({ ...prev, workHistory: items }))}
              onSubmit={() => {
                if (form.workHistory.length === 0) {
                  toast.error("Add at least one work history entry");
                  return;
                }
                recordAnswer(`${form.workHistory.length} role${form.workHistory.length === 1 ? "" : "s"} added`);
                advance();
              }}
              onBack={goBack}
            />
          ) : null}

          {currentStep.id === "workEnvironment" ? (
            <ChoiceAnswer
              choices={WORK_ENVIRONMENTS}
              value={form.values.workEnvironment}
              onSelect={(value) => {
                setForm((prev) => ({ ...prev, values: { ...prev.values, workEnvironment: value } }));
                const label = WORK_ENVIRONMENTS.find((entry) => entry.value === value)?.label ?? value;
                recordAnswer(label);
                advance();
              }}
              onBack={goBack}
            />
          ) : null}

          {currentStep.id === "riskAppetite" ? (
            <ChoiceAnswer
              choices={RISK_APPETITES}
              value={form.values.riskAppetite}
              onSelect={(value) => {
                setForm((prev) => ({ ...prev, values: { ...prev.values, riskAppetite: value } }));
                const label = RISK_APPETITES.find((entry) => entry.value === value)?.label ?? value;
                recordAnswer(label);
                advance();
              }}
              onBack={goBack}
            />
          ) : null}

          {currentStep.id === "salaryExpectation" ? (
            <TextAnswer
              placeholder="e.g., USD 150-180k"
              value={form.values.salaryExpectation}
              onChange={(value) => setForm((prev) => ({ ...prev, values: { ...prev.values, salaryExpectation: value } }))}
              onSubmit={() => {
                const value = form.values.salaryExpectation.trim();
                if (!value) {
                  toast.error("Share a target compensation");
                  return;
                }
                handleTextStep(value);
              }}
              onBack={goBack}
            />
          ) : null}

          {currentStep.id === "workingStyle" ? (
            <TextareaAnswer
              placeholder="Async-first, deep work in mornings, async docs over meetings..."
              value={form.values.workingStyle}
              onChange={(value) => setForm((prev) => ({ ...prev, values: { ...prev.values, workingStyle: value } }))}
              onSubmit={() => {
                const value = form.values.workingStyle.trim();
                if (!value) {
                  toast.error("Describe your working style");
                  return;
                }
                handleTextStep(value);
              }}
              onBack={goBack}
            />
          ) : null}

          {currentStep.id === "constraints" ? (
            <TextAnswer
              placeholder="None / needs visa sponsorship / remote only..."
              value={form.values.constraints}
              onChange={(value) => setForm((prev) => ({ ...prev, values: { ...prev.values, constraints: value } }))}
              onSubmit={() => {
                const value = form.values.constraints.trim() || "None";
                handleTextStep(value);
              }}
              onBack={goBack}
              allowEmpty
            />
          ) : null}

          {currentStep.id === "targetRoles" ? (
            <TextAnswer
              placeholder="Staff Engineer, Engineering Manager..."
              value={form.aspirations.targetRoles}
              onChange={(value) => setForm((prev) => ({ ...prev, aspirations: { ...prev.aspirations, targetRoles: value } }))}
              onSubmit={() => {
                const value = form.aspirations.targetRoles.trim();
                if (!value) {
                  toast.error("Share roles you're aiming for");
                  return;
                }
                handleTextStep(value);
              }}
              onBack={goBack}
            />
          ) : null}

          {currentStep.id === "targetIndustries" ? (
            <TextAnswer
              placeholder="Developer tools, fintech, AI..."
              value={form.aspirations.targetIndustries}
              onChange={(value) => setForm((prev) => ({ ...prev, aspirations: { ...prev.aspirations, targetIndustries: value } }))}
              onSubmit={() => {
                const value = form.aspirations.targetIndustries.trim();
                if (!value) {
                  toast.error("Share industries you're drawn to");
                  return;
                }
                handleTextStep(value);
              }}
              onBack={goBack}
            />
          ) : null}

          {currentStep.id === "horizon3y" ? (
            <TextareaAnswer
              placeholder="Leading a team that ships a 0-to-1 product..."
              value={form.aspirations.horizon3y}
              onChange={(value) => setForm((prev) => ({ ...prev, aspirations: { ...prev.aspirations, horizon3y: value } }))}
              onSubmit={() => {
                const value = form.aspirations.horizon3y.trim();
                if (!value) {
                  toast.error("Share your 3-year vision");
                  return;
                }
                handleTextStep(value);
              }}
              onBack={goBack}
            />
          ) : null}

          {currentStep.id === "horizon5y" ? (
            <TextareaAnswer
              placeholder="Founder, principal engineer, head of platform..."
              value={form.aspirations.horizon5y}
              onChange={(value) => setForm((prev) => ({ ...prev, aspirations: { ...prev.aspirations, horizon5y: value } }))}
              onSubmit={() => {
                const value = form.aspirations.horizon5y.trim();
                if (!value) {
                  toast.error("Share your 5-year vision");
                  return;
                }
                handleTextStep(value);
              }}
              onBack={goBack}
            />
          ) : null}

          {currentStep.id === "definitionOfSuccess" ? (
            <TextareaAnswer
              placeholder="Building things people use daily, with people I respect..."
              value={form.aspirations.definitionOfSuccess}
              onChange={(value) => setForm((prev) => ({ ...prev, aspirations: { ...prev.aspirations, definitionOfSuccess: value } }))}
              onSubmit={() => {
                const value = form.aspirations.definitionOfSuccess.trim();
                if (!value) {
                  toast.error("Define success in your own words");
                  return;
                }
                handleTextStep(value);
              }}
              onBack={goBack}
            />
          ) : null}

          {currentStep.id === "imports" ? (
            <ImportsAnswer
              imports={form.imports}
              onChange={(value) => setForm((prev) => ({ ...prev, imports: value }))}
              resumeFile={resumeFile}
              onResumeFileChange={setResumeFile}
              isUploading={isUploading}
              onUploadResume={() => {
                if (!resumeFile) {
                  toast.error("Choose a resume file first.");
                  return;
                }
                startUploading(async () => {
                  try {
                    const formData = new FormData();
                    formData.set("resume", resumeFile);
                    const result = await uploadResumeFile(formData);
                    const detected = result.importedSkills.map((skill) => ({
                      name: skill.name,
                      category: skill.category,
                      confidenceRating: skill.confidenceRating,
                    }));
                    mergeImportedSkills(detected);
                    setLastDetectedSkills(detected);
                    setForm((prev) => ({
                      ...prev,
                      imports: {
                        ...prev.imports,
                        resumeFileName: result.resumeFileName,
                        resumeRawText: result.rawText,
                      },
                    }));
                    if (detected.length === 0) {
                      pushNotice("Uploaded my resume — no clear skills detected.");
                      toast.message("Resume uploaded, but I couldn't detect known skills.");
                    } else {
                      pushNotice(
                        `Uploaded my resume — you pulled ${detected.length} skill${detected.length === 1 ? "" : "s"}.`,
                      );
                      toast.success(`Detected ${detected.length} skills from your resume`);
                    }
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Resume upload failed");
                  }
                });
              }}
              detectedSkills={lastDetectedSkills}
              onSkip={() => {
                recordAnswer("Skipping imports.");
                advance();
              }}
              onContinue={() => {
                recordAnswer("Continue.");
                advance();
              }}
              onBack={goBack}
            />
          ) : null}

          {currentStep.id === "review" ? (
            <ReviewAnswer
              form={form}
              isSaving={isSaving}
              onBack={goBack}
              onSubmit={handleSaveOnboarding}
            />
          ) : null}
          </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TextAnswer(props: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  placeholder?: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
  allowEmpty?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Input
        type={props.type ?? "text"}
        min={props.min}
        max={props.max}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            props.onSubmit();
          }
        }}
      />
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={props.onBack}>
          Back
        </Button>
        <Button type="button" onClick={props.onSubmit}>
          Continue
        </Button>
      </div>
    </div>
  );
}

function TextareaAnswer(props: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <textarea
        className="min-h-[88px] w-full rounded-md border bg-[var(--surface)] p-3 text-[var(--ink)]"
        style={{ borderColor: "var(--line)", fontSize: "var(--text-sm)" }}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={props.onBack}>
          Back
        </Button>
        <Button type="button" onClick={props.onSubmit}>
          Continue
        </Button>
      </div>
    </div>
  );
}

function ChoiceAnswer<T extends string>(props: {
  choices: Array<{ value: T; label: string }>;
  value: T | "";
  onSelect: (value: T) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {props.choices.map((choice) => {
          const isSelected = props.value === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              onClick={() => props.onSelect(choice.value)}
              className="rounded-full px-4 py-1.5 transition-colors"
              style={{
                fontSize: "var(--text-sm)",
                border: isSelected ? "1px solid var(--ink)" : "1px solid var(--line)",
                background: isSelected ? "var(--ink)" : "var(--surface)",
                color: isSelected ? "var(--bg)" : "var(--ink)",
              }}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
      <div className="flex justify-start">
        <Button type="button" variant="outline" onClick={props.onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}

function SkillsAnswer(props: {
  skills: SkillInput[];
  onChange: (skills: SkillInput[]) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SkillCategory>("technical");
  const [confidence, setConfidence] = useState<number>(3);

  const addSkill = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Type a skill name");
      return;
    }
    const exists = props.skills.some((skill) => skill.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast.error("Already added");
      return;
    }
    props.onChange([
      ...props.skills,
      { name: trimmed, category, confidenceRating: confidence },
    ]);
    setName("");
    setConfidence(3);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {props.skills.length === 0 ? (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}>
            No skills added yet.
          </p>
        ) : (
          props.skills.map((skill, index) => (
            <span
              key={`skill-chip-${skill.name}-${index}`}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1"
              style={{
                fontSize: "var(--text-xs)",
                border: "1px solid var(--line)",
                background: "var(--surface)",
                color: "var(--ink)",
              }}
            >
              <span>{skill.name}</span>
              <span style={{ color: "var(--mute)" }}>{skill.category}</span>
              <span style={{ color: "var(--mute)" }}>· {skill.confidenceRating}/5</span>
              <button
                type="button"
                aria-label={`Remove ${skill.name}`}
                onClick={() => props.onChange(props.skills.filter((_, i) => i !== index))}
                style={{ color: "var(--mute)" }}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_120px_120px_auto]">
        <Input
          placeholder="Skill (e.g. TypeScript)"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addSkill();
            }
          }}
        />
        <select
          className="h-9 rounded-md border bg-[var(--surface)] px-2"
          style={{ borderColor: "var(--line)", fontSize: "var(--text-sm)", color: "var(--ink)" }}
          value={category}
          onChange={(event) => setCategory(event.target.value as SkillCategory)}
        >
          {SKILL_CATEGORIES.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border bg-[var(--surface)] px-2"
          style={{ borderColor: "var(--line)", fontSize: "var(--text-sm)", color: "var(--ink)" }}
          value={confidence}
          onChange={(event) => setConfidence(Number(event.target.value))}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value}/5
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" onClick={addSkill}>
          Add
        </Button>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={props.onBack}>
          Back
        </Button>
        <Button type="button" onClick={props.onSubmit}>
          Continue
        </Button>
      </div>
    </div>
  );
}

function WorkHistoryAnswer(props: {
  items: WorkHistoryInput[];
  onChange: (items: WorkHistoryInput[]) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [outcomes, setOutcomes] = useState("");

  const addEntry = () => {
    const company = companyName.trim();
    const role = roleTitle.trim();
    const outcomeText = outcomes.trim();
    if (!company || !role || !outcomeText) {
      toast.error("Fill in company, role, and outcomes");
      return;
    }
    const exists = props.items.some(
      (item) =>
        item.companyName.toLowerCase() === company.toLowerCase() &&
        item.roleTitle.toLowerCase() === role.toLowerCase(),
    );
    if (exists) {
      toast.error("Already added that role at that company");
      return;
    }
    props.onChange([
      ...props.items,
      { companyName: company, roleTitle: role, outcomes: outcomeText },
    ]);
    setCompanyName("");
    setRoleTitle("");
    setOutcomes("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {props.items.length === 0 ? (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}>
            No experience added yet.
          </p>
        ) : (
          props.items.map((item, index) => (
            <div
              key={`work-card-${index}`}
              className="rounded-lg p-3"
              style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--ink)", fontWeight: 600 }}>
                    {item.roleTitle}
                  </p>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}>
                    {item.companyName}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Remove role"
                  onClick={() => props.onChange(props.items.filter((_, i) => i !== index))}
                  style={{ color: "var(--mute)" }}
                >
                  ×
                </button>
              </div>
              <p className="mt-2" style={{ fontSize: "var(--text-xs)", color: "var(--ink)" }}>
                {item.outcomes}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <Input
          placeholder="Company name"
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
        />
        <Input
          placeholder="Role title"
          value={roleTitle}
          onChange={(event) => setRoleTitle(event.target.value)}
        />
      </div>
      <textarea
        className="min-h-[72px] w-full rounded-md border bg-[var(--surface)] p-3"
        style={{ borderColor: "var(--line)", fontSize: "var(--text-sm)", color: "var(--ink)" }}
        placeholder="Outcomes, scope, impact..."
        value={outcomes}
        onChange={(event) => setOutcomes(event.target.value)}
      />
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={addEntry}>
          Add role
        </Button>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={props.onBack}>
          Back
        </Button>
        <Button type="button" onClick={props.onSubmit}>
          Continue
        </Button>
      </div>
    </div>
  );
}

function ImportsAnswer(props: {
  imports: ImportsInput;
  onChange: (imports: ImportsInput) => void;
  resumeFile: File | null;
  onResumeFileChange: (file: File | null) => void;
  isUploading: boolean;
  detectedSkills: SkillInput[];
  onUploadResume: () => void;
  onSkip: () => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2 rounded-lg p-3" style={{ border: "1px solid var(--line)", background: "var(--surface)" }}>
        <Label>Resume (.pdf, .docx, .txt)</Label>
        <Input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(event) => props.onResumeFileChange(event.target.files?.[0] ?? null)}
        />
        <div className="flex items-center justify-between gap-2">
          <p style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}>
            {props.imports.resumeFileName
              ? "Resume saved — re-upload to refresh detected skills."
              : "I'll read your PDF/DOCX and detect your skills automatically."}
          </p>
          <Button type="button" variant="outline" disabled={props.isUploading} onClick={props.onUploadResume}>
            {props.isUploading ? "Analyzing..." : "Upload & analyze"}
          </Button>
        </div>

        {props.isUploading ? (
          <div className="flex items-center gap-2 pt-1">
            <motion.span
              className="inline-block h-3 w-3 rounded-full border-2"
              style={{ borderColor: "var(--accent, #2f8a4a)", borderTopColor: "transparent" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}>
              Reading your resume and scoring skills…
            </span>
          </div>
        ) : null}

        <AnimatePresence>
          {!props.isUploading && props.detectedSkills.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2 pt-1"
            >
              <p style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}>
                Detected skills (added to your list):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {props.detectedSkills.map((skill, index) => (
                  <motion.span
                    key={`detected-${skill.name}`}
                    initial={{ opacity: 0, scale: 0.8, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.6), type: "spring", stiffness: 300, damping: 20 }}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
                    style={{
                      fontSize: "var(--text-xs)",
                      border: "1px solid var(--line)",
                      background: "var(--bg-sub)",
                      color: "var(--ink)",
                    }}
                  >
                    {skill.name}
                    <span style={{ color: "var(--mute)" }}>· {skill.confidenceRating}/5</span>
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="grid gap-2 rounded-lg p-3" style={{ border: "1px solid var(--line)", background: "var(--surface)" }}>
        <Label>LinkedIn URL</Label>
        <Input
          placeholder="https://linkedin.com/in/username"
          value={props.imports.linkedinProfileUrl}
          onChange={(event) => props.onChange({ ...props.imports, linkedinProfileUrl: event.target.value })}
        />
        <p style={{ fontSize: "var(--text-xs)", color: "var(--mute)" }}>
          We'll save this for future LinkedIn enrichment.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={props.onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={props.onSkip}>
            Skip
          </Button>
          <Button type="button" onClick={props.onContinue}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReviewAnswer(props: {
  form: FormState;
  isSaving: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const summary = useMemo(() => {
    const skillsByCategory = props.form.skills.reduce<Record<string, number>>((acc, skill) => {
      acc[skill.category] = (acc[skill.category] ?? 0) + 1;
      return acc;
    }, {});
    return {
      skillCount: props.form.skills.length,
      skillsByCategory,
      workCount: props.form.workHistory.length,
    };
  }, [props.form.skills, props.form.workHistory]);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2 rounded-lg p-3" style={{ border: "1px solid var(--line)", background: "var(--surface)" }}>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--ink)" }}>
          <p>
            <strong>Target role:</strong> {props.form.basics.targetRole || "—"} ·{" "}
            <strong>Location:</strong> {props.form.basics.location || "—"} ·{" "}
            <strong>Experience:</strong> {props.form.basics.yearsOfExperience || "—"}y
          </p>
          <p className="mt-1">
            <strong>Skills:</strong> {summary.skillCount} (
            {Object.entries(summary.skillsByCategory)
              .map(([category, count]) => `${count} ${category}`)
              .join(", ") || "none"}
            )
          </p>
          <p>
            <strong>Experience entries:</strong> {summary.workCount}
          </p>
          <p>
            <strong>Environment:</strong> {props.form.values.workEnvironment || "—"} ·{" "}
            <strong>Risk:</strong> {props.form.values.riskAppetite || "—"}
          </p>
          <p>
            <strong>Salary:</strong> {props.form.values.salaryExpectation || "—"}
          </p>
          <p>
            <strong>Working style:</strong> {props.form.values.workingStyle || "—"}
          </p>
          <p>
            <strong>Targets:</strong> {props.form.aspirations.targetRoles || "—"} · {props.form.aspirations.targetIndustries || "—"}
          </p>
          <p>
            <strong>3y:</strong> {props.form.aspirations.horizon3y || "—"}
          </p>
          <p>
            <strong>5y:</strong> {props.form.aspirations.horizon5y || "—"}
          </p>
        </div>
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={props.onBack} disabled={props.isSaving}>
          Back
        </Button>
        <Button type="button" onClick={props.onSubmit} disabled={props.isSaving}>
          {props.isSaving ? "Saving..." : "Finish & save"}
        </Button>
      </div>
    </div>
  );
}
