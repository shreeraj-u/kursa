import type {
  AchievementInput,
  AspirationsInput,
  EducationInput,
  ImportsInput,
  LanguageInput,
  ProjectInput,
  RiskAppetite,
  SkillInput,
  SocialLinkInput,
  ValuesInput,
  WorkEnvironment,
  WorkHistoryInput,
} from "@kursa/types";

export type Message =
  | { id: string; role: "bot"; text: string }
  | { id: string; role: "user"; text: string };

export type BasicsInputDraft = {
  targetRole: string;
  location: string;
  yearsOfExperience: string;
  bio: string;
};

export type ValuesInputDraft = Omit<ValuesInput, "workEnvironment" | "riskAppetite"> & {
  workEnvironment: WorkEnvironment | "";
  riskAppetite: RiskAppetite | "";
};

export type FormState = {
  basics: BasicsInputDraft;
  skills: SkillInput[];
  workHistory: WorkHistoryInput[];
  projects: ProjectInput[];
  achievements: AchievementInput[];
  education: EducationInput[];
  languages: LanguageInput[];
  socialLinks: SocialLinkInput[];
  values: ValuesInputDraft;
  aspirations: AspirationsInput;
  imports: ImportsInput;
};

export type StepId =
  | "welcome"
  | "targetRole"
  | "location"
  | "yearsOfExperience"
  | "bio"
  | "imports"
  | "skills"
  | "workHistory"
  | "projects"
  | "achievements"
  | "education"
  | "languages"
  | "socialLinks"
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
  | "review";

export type Step = {
  id: StepId;
  prompts: string[];
};
