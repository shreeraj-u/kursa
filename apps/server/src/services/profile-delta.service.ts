import prisma from "@kursa/db";
import type { ProfileUpdateDelta } from "@kursa/types";

export async function applyProfileUpdateDelta(
  profileId: string,
  delta: ProfileUpdateDelta,
): Promise<void> {
  if (
    !delta.skillLastUsed?.length &&
    !delta.newAchievements?.length &&
    !delta.newLearningGoals?.length
  ) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (delta.skillLastUsed?.length) {
      for (const update of delta.skillLastUsed) {
        const skill = await tx.skill.findFirst({
          where: { profileId, name: { equals: update.name, mode: "insensitive" } },
        });
        if (skill) {
          await tx.skill.update({
            where: { id: skill.id },
            data: { lastUsedDate: update.date ?? new Date() },
          });
        }
      }
    }

    if (delta.newLearningGoals?.length) {
      for (const goal of delta.newLearningGoals) {
        const existing = await tx.learningGoal.findFirst({
          where: { profileId, skillName: goal.skillName },
        });
        if (!existing) {
          await tx.learningGoal.create({
            data: { profileId, skillName: goal.skillName, status: "PLANNED" },
          });
        }
      }
    }

    if (delta.newAchievements?.length) {
      for (const ach of delta.newAchievements) {
        const created = await tx.achievement.create({
          data: {
            profileId,
            type: "OTHER",
            title: ach.title,
            description: ach.description,
            dateAchieved: ach.dateAchieved ?? new Date(),
          },
        });

        if (ach.skillNames?.length) {
          for (const skillName of ach.skillNames) {
            const skill = await tx.skill.findFirst({
              where: { profileId, name: { equals: skillName, mode: "insensitive" } },
            });
            if (skill) {
              await tx.achievement.update({
                where: { id: created.id },
                data: { skills: { connect: { id: skill.id } } },
              });
            }
          }
        }
      }
    }

    await tx.profile.update({
      where: { id: profileId },
      data: { updatedAt: new Date() },
    });
  });
}
