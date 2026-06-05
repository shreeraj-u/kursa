import { z } from "zod";

export const githubSyncConfirmSchema = z.object({
  selectedRepoIds: z.array(z.number().int()).default([]),
  mergeRepoIds: z
    .array(z.object({ repoId: z.number().int(), projectId: z.string().uuid() }))
    .default([]),
  acceptedProposalIds: z.array(z.string().uuid()).optional(),
});
