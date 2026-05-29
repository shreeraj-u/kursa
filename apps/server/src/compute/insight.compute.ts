import type { ProfileSignals, ProfileInput } from "@kursa/types";

export function computeProfileSignals(profile: ProfileInput): ProfileSignals {
    const now = Date.now();
    const sixMonthsAgo = new Date(now - 86400000 * 30 * 6);
    const ninetyDaysAgo = new Date(now - 86400000 * 90);

    const dormantHighValueSkills = profile.skills
        .filter(
            (s) =>
                s.confidenceRating !== null &&
                s.confidenceRating >= 4 &&
                s.lastUsedDate !== null &&
                new Date(s.lastUsedDate) < sixMonthsAgo,
        )
        .map((s) => s.name);

    const overdueGoals = profile.learningGoals
        .filter(
            (g) =>
                g.deadline !== null &&
                new Date(g.deadline) < new Date() &&
                g.status !== "COMPLETED",
        )
        .map((g) => g.skillName);

    const completedGoals = profile.learningGoals.filter((g) => g.status === "COMPLETED").length;
    const goalsCompletionRatio = { completed: completedGoals, total: profile.learningGoals.length };

    const appliedDates = profile.jobApplications
        .map((a) => (a.appliedAt ? new Date(a.appliedAt).getTime() : null))
        .filter((t): t is number => t !== null);
    const daysSinceLastApplication =
        appliedDates.length > 0
            ? Math.floor((now - Math.max(...appliedDates)) / 86400000)
            : null;

    const hasAppliedToTargetRole =
        profile.targetRole !== null && profile.jobApplications.length > 0;

    const currentRole = profile.workHistories.find((w) => w.isCurrent);
    const currentRoleTenureMonths = currentRole
        ? Math.floor((now - new Date(currentRole.startDate).getTime()) / (86400000 * 30))
        : null;

    const hasWorkOutcomes = profile.workHistories.some((w) => {
        if (!w.outcomes) return false;
        if (Array.isArray(w.outcomes)) return (w.outcomes as unknown[]).length > 0;
        if (typeof w.outcomes === "object")
            return Object.keys(w.outcomes as Record<string, unknown>).length > 0;
        return false;
    });

    const asp = profile.aspirations as Record<string, unknown> | null;
    const aspirationsSet =
        asp !== null &&
        (Boolean(asp?.threeYear) ||
            Boolean(asp?.fiveYear) ||
            (Array.isArray(asp?.targetRoles) && (asp.targetRoles as unknown[]).length > 0));

    let profileCompleteness = 0;
    if (profile.bio) profileCompleteness += 15;
    if (profile.targetRole) profileCompleteness += 15;
    if (profile.location) profileCompleteness += 10;
    if (profile.yearsOfExperience) profileCompleteness += 10;
    if (profile.skills.length >= 3) profileCompleteness += 20;
    if (profile.workHistories.length >= 1) profileCompleteness += 20;
    if (profile.aspirations) profileCompleteness += 10;

    const skillsNeverDated = profile.skills
        .filter((s) => s.lastUsedDate === null)
        .map((s) => s.name);

    const noRecentSkillActivity = !profile.skills.some(
        (s) =>
            new Date(s.createdAt) > ninetyDaysAgo || new Date(s.updatedAt) > ninetyDaysAgo,
    );

    return {
        targetRole: profile.targetRole,
        careerTrajectory: profile.careerTrajectory,
        profileCompleteness,
        dormantHighValueSkills,
        overdueGoals,
        goalsCompletionRatio,
        daysSinceLastApplication,
        hasAppliedToTargetRole,
        currentRoleTenureMonths,
        hasWorkOutcomes,
        aspirationsSet,
        skillsNeverDated,
        noRecentSkillActivity,
    };
}
