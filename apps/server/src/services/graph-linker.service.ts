import prisma from "@kursa/db";

export async function resolveSkillIds(
  profileId: string,
  skillNames: string[],
): Promise<string[]> {
  if (skillNames.length === 0) return [];

  const skills = await prisma.skill.findMany({
    where: { profileId },
    select: { id: true, name: true },
  });

  const ids: string[] = [];
  for (const name of skillNames) {
    const lower = name.toLowerCase().trim();
    const match = skills.find((s) => s.name.toLowerCase() === lower);
    if (match) ids.push(match.id);
  }
  return [...new Set(ids)];
}


async function getCurrentWorkHistoryId(profileId: string): Promise<string | null> {
  const wh = await prisma.workHistory.findFirst({
    where: { profileId, isCurrent: true },
    select: { id: true },
  });
  return wh?.id ?? null;
}

export async function loadGraphContext(profileId: string) {
  const [skills, activePath, workHistoryId] = await Promise.all([
    prisma.skill.findMany({
      where: { profileId },
      select: { id: true, name: true },
    }),
    prisma.careerPath.findFirst({
      where: { profileId, isActive: true },
      select: { id: true, milestones: true },
    }),
    getCurrentWorkHistoryId(profileId),
  ]);

  return {
    skillNames: skills.map((s) => s.name),
    skillMap: skills,
    activePathId: activePath?.id ?? null,
    milestones: (activePath?.milestones ?? []) as Array<{
      order: number;
      title: string;
      description: string;
      requiredSkills: string[];
      status: string;
    }>,
    workHistoryId,
  };
}
