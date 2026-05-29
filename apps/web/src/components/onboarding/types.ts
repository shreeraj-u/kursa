import type {
  AspirationsInput,
  ImportsInput,
  RiskAppetite,
  SkillInput,
  ValuesInput,
  WorkEnvironment,
  WorkHistoryInput,
} from "@/app/onboarding/schema";

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
