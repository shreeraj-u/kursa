import { AnimatePresence, motion } from "motion/react";

import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";
import { Label } from "@kursa/ui/components/label";

import type { ImportsInput, SkillInput } from "@/app/onboarding/schema";

type ImportsAnswerProps = {
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
};

export function ImportsAnswer(props: ImportsAnswerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="grid gap-2 rounded-lg p-3 border border-line bg-surface"
      >
        <Label>Resume (.pdf, .docx, .txt)</Label>
        <Input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => props.onResumeFileChange(e.target.files?.[0] ?? null)}
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-mute">
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
              className="inline-block h-3 w-3 rounded-full border-2 border-accent border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-xs text-mute">
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
              <p className="text-xs text-mute">Detected skills (added to your list):</p>
              <div className="flex flex-wrap gap-1.5">
                {props.detectedSkills.map((skill, i) => (
                  <motion.span
                    key={`detected-${skill.name}`}
                    initial={{ opacity: 0, scale: 0.8, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.6), type: "spring", stiffness: 300, damping: 20 }}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border border-line bg-bg-sub text-ink"
                  >
                    {skill.name}
                    <span className="text-mute">· {skill.confidenceRating}/5</span>
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div
        className="grid gap-2 rounded-lg p-3 border border-line bg-surface"
      >
        <Label>LinkedIn URL</Label>
        <Input
          placeholder="https://linkedin.com/in/username"
          value={props.imports.linkedinProfileUrl}
          onChange={(e) => props.onChange({ ...props.imports, linkedinProfileUrl: e.target.value })}
        />
        <p className="text-xs text-mute">
          We'll save this for future LinkedIn enrichment.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={props.onBack}>Back</Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={props.onSkip}>Skip</Button>
          <Button type="button" onClick={props.onContinue}>Continue</Button>
        </div>
      </div>
    </div>
  );
}
