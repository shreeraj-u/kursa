import type { Route } from "next";

export interface DashboardPageHelp {
  title: string;
  description: string;
  tips: string[];
  guideHref?: Route;
}

const GUIDE = "/dashboard/docs" as Route;

export const DASHBOARD_PAGE_HELP = {
  home: {
    title: "How to use Home",
    description: "Use Home as your career command center: it summarizes memory, reasoning, execution signals, and what needs attention next.",
    tips: [
      "Start with the top action when one appears; it is the most urgent step from your journey-wide action queue.",
      "Review Career pulse and Journey pulse together: pulse shows current signals, while journey pulse shows alignment and engagement over time.",
      "Use Aria noticed for observations grounded in your profile, journal, applications, and journey context.",
      "Export the career digest when you want portable proof of journey alignment, skills, applications, and recent activity.",
    ],
    guideHref: GUIDE,
  },
  careerJourney: {
    title: "How to use Career journey",
    description: "Use Career journey to generate, inspect, and maintain the single trajectory Kursa commits to from your Profile.",
    tips: [
      "Generate a journey after your Profile has enough evidence, then use milestones as the main roadmap.",
      "Mark milestone progress when reality changes; manual status takes precedence until you regenerate the journey.",
      "Use the action queue for concrete next steps across path, skills, and applications.",
      "Open advisor reasoning when you want fit reasons, risks, mitigations, and evidence behind the journey.",
    ],
    guideHref: GUIDE,
  },
  skills: {
    title: "How to use Skills",
    description: "Use Skills as the evidence layer behind journeys, résumé tailoring, learning goals, and Aria's advice.",
    tips: [
      "Review imported skills first; skill accuracy directly affects journeys, résumés, and Aria guidance.",
      "Set proficiency and confidence separately: confidence is how sure you feel, proficiency is actual mastery.",
      "Keep 1–3 active learning goals so Kursa can prioritize growth work without scattering attention.",
      "Use journey gaps to decide which missing or weaker skills deserve focus now.",
    ],
    guideHref: GUIDE,
  },
  resume: {
    title: "How to use Resume studio",
    description: "Use Resume studio to move from profile memory to generated résumé, manual control, ATS scoring, and PDF export.",
    tips: [
      "Generate a résumé when your Profile and journey are current; generation creates a new version.",
      "Manual edits change only the selected résumé version and do not write back to your Profile.",
      "Run ATS analysis after edits to refresh the score and actionable issues.",
      "Use AI ATS improvements as a draft to review before saving truth-preserving changes.",
    ],
    guideHref: GUIDE,
  },
  shortlist: {
    title: "How to use Shortlist",
    description: "Use Shortlist to review roles matched to your current location and Career Journey before agents prepare application packets.",
    tips: [
      "Treat the list as strategic targeting, not a job board; fewer high-quality roles are better than volume.",
      "Use fit and path scores together: current fit shows readiness, while path score shows long-term alignment.",
      "Select only roles you would genuinely review, then let agents prepare materials for human approval.",
      "Nothing is submitted automatically; queued packets still need user review before sending.",
    ],
    guideHref: GUIDE,
  },
  applications: {
    title: "How to use Applications",
    description: "Use Applications to track roles from interest through offer so stage movement and outcomes stay visible to Kursa.",
    tips: [
      "Add each role with company, title, stage, and any next action you need to remember.",
      "Update the stage inline as the process moves; active applications count toward dashboard and sidebar signals.",
      "Add next-action dates when follow-up timing matters.",
      "Close or remove stale applications so in-flight guidance stays accurate.",
    ],
    guideHref: GUIDE,
  },
  journal: {
    title: "How to use Journal",
    description: "Use Journal to capture wins, feedback, notes, and check-ins so Kursa can learn from what actually happened.",
    tips: [
      "Log wins and feedback close to when they happen; they become evidence for Aria, reviews, and journey alignment.",
      "Use accomplishments for concrete outcomes and feedback for praise or constructive input.",
      "Complete check-ins when due to feed engagement trends and weekly pulse signals.",
      "Review Aria noticed entries as reflections on your timeline, not generic productivity tips.",
    ],
    guideHref: GUIDE,
  },
  settings: {
    title: "How to use Settings",
    description: "Use Settings to manage account details, Profile preferences, privacy, integrations, notifications, plan, and documentation access.",
    tips: [
      "Use the left settings navigation to move between profile, career, connections, account, notifications, privacy, plan, and docs.",
      "Keep career preferences and social links current because they shape downstream guidance and documents.",
      "Review privacy and connection settings when you add or remove external sources.",
      "Open Documentation from settings when you want the longer product guide.",
    ],
    guideHref: GUIDE,
  },
  guide: {
    title: "How to use the Guide",
    description: "Use the Guide as the longer-form explanation of how each Kursa area fits together.",
    tips: [
      "Open one section at a time to learn the purpose of a dashboard area.",
      "Use the Guide when a page-level help modal is too short for the detail you need.",
      "Return to the sidebar to jump from a guide topic to the actual workspace page.",
    ],
  },
} satisfies Record<string, DashboardPageHelp>;
