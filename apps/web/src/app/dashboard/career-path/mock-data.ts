export interface Milestone {
  order: number
  title: string
  description: string
  estimatedMonthsFromNow: number
  salaryBand: { min: number; max: number; currency: "USD" }
  requiredSkills: string[]
  status: "not_started" | "in_progress" | "completed"
}

export interface CareerPath {
  id: string
  title: string
  description: string
  confidenceScore: number
  projectedTimelineMonths: number
  milestones: Milestone[]
}

export const MOCK_PATHS: CareerPath[] = [
  {
    id: "ic",
    title: "Staff Engineer · Series B",
    description: "Individual contributor track toward Staff Engineer at a growth-stage company.",
    confidenceScore: 0.84,
    projectedTimelineMonths: 20,
    milestones: [
      {
        order: 1,
        title: "Lead a project end-to-end",
        description: "Own a project from scoping through delivery, coordinating with stakeholders.",
        estimatedMonthsFromNow: 3,
        salaryBand: { min: 140000, max: 170000, currency: "USD" },
        requiredSkills: ["System Design", "Technical Leadership"],
        status: "completed",
      },
      {
        order: 2,
        title: "Own a technical domain",
        description: "Become the primary owner of a significant technical area within your team.",
        estimatedMonthsFromNow: 7,
        salaryBand: { min: 155000, max: 185000, currency: "USD" },
        requiredSkills: ["Architecture", "Mentorship"],
        status: "in_progress",
      },
      {
        order: 3,
        title: "Drive an architectural decision",
        description: "Propose, document, and gain buy-in for a meaningful architectural change.",
        estimatedMonthsFromNow: 11,
        salaryBand: { min: 165000, max: 195000, currency: "USD" },
        requiredSkills: ["Cross-team Collaboration"],
        status: "not_started",
      },
      {
        order: 4,
        title: "Become cross-team tech lead",
        description: "Provide technical leadership across multiple teams and projects.",
        estimatedMonthsFromNow: 16,
        salaryBand: { min: 180000, max: 210000, currency: "USD" },
        requiredSkills: ["Engineering Strategy"],
        status: "not_started",
      },
      {
        order: 5,
        title: "Staff Engineer",
        description: "Operating at Staff level — shaping roadmap and leveling up the org.",
        estimatedMonthsFromNow: 20,
        salaryBand: { min: 200000, max: 240000, currency: "USD" },
        requiredSkills: ["System Design", "Leadership"],
        status: "not_started",
      },
    ],
  },
  {
    id: "em",
    title: "Engineering Manager · Growth Stage",
    description: "People-management track toward Engineering Manager at a growth-stage startup.",
    confidenceScore: 0.61,
    projectedTimelineMonths: 28,
    milestones: [
      {
        order: 1,
        title: "Mentor 2 junior engineers",
        description: "Formally mentor two junior engineers, tracking their growth over a quarter.",
        estimatedMonthsFromNow: 4,
        salaryBand: { min: 150000, max: 175000, currency: "USD" },
        requiredSkills: ["Mentorship", "Communication"],
        status: "not_started",
      },
      {
        order: 2,
        title: "Lead a full hiring loop",
        description: "Own the end-to-end hiring loop for at least one engineering role.",
        estimatedMonthsFromNow: 10,
        salaryBand: { min: 160000, max: 190000, currency: "USD" },
        requiredSkills: ["Interviewing", "Team Building"],
        status: "not_started",
      },
      {
        order: 3,
        title: "Manage a team of 4",
        description: "Transition into managing a small team with regular 1:1s and performance reviews.",
        estimatedMonthsFromNow: 18,
        salaryBand: { min: 175000, max: 210000, currency: "USD" },
        requiredSkills: ["People Management", "Roadmap Planning"],
        status: "not_started",
      },
      {
        order: 4,
        title: "Engineering Manager",
        description: "Fully operating as an EM — hiring, performance, roadmap, and team health.",
        estimatedMonthsFromNow: 28,
        salaryBand: { min: 200000, max: 250000, currency: "USD" },
        requiredSkills: ["Strategy", "Org Design"],
        status: "not_started",
      },
    ],
  },
  {
    id: "tpm",
    title: "Technical PM · B2B SaaS",
    description: "Pivot toward Technical Product Manager at a B2B SaaS company.",
    confidenceScore: 0.47,
    projectedTimelineMonths: 18,
    milestones: [
      {
        order: 1,
        title: "Write and ship a product spec",
        description: "Author a full product spec and see it through to engineering handoff.",
        estimatedMonthsFromNow: 3,
        salaryBand: { min: 130000, max: 155000, currency: "USD" },
        requiredSkills: ["Product Thinking", "Writing"],
        status: "not_started",
      },
      {
        order: 2,
        title: "Run a discovery sprint",
        description: "Facilitate a structured discovery sprint with customer interviews and synthesis.",
        estimatedMonthsFromNow: 7,
        salaryBand: { min: 140000, max: 165000, currency: "USD" },
        requiredSkills: ["User Research", "Prioritisation"],
        status: "not_started",
      },
      {
        order: 3,
        title: "Own a product area end-to-end",
        description: "Take ownership of a product area across design, engineering, and go-to-market.",
        estimatedMonthsFromNow: 12,
        salaryBand: { min: 155000, max: 185000, currency: "USD" },
        requiredSkills: ["Stakeholder Management"],
        status: "not_started",
      },
      {
        order: 4,
        title: "Technical Product Manager",
        description: "Fully operating as a TPM — strategy, roadmap, and cross-functional leadership.",
        estimatedMonthsFromNow: 18,
        salaryBand: { min: 170000, max: 210000, currency: "USD" },
        requiredSkills: ["Product Strategy", "Data Analysis"],
        status: "not_started",
      },
    ],
  },
]
