import { z } from "zod";

const count = z.number().int().nonnegative();
export const profileResponseSchema = z.object({
  user: z
    .object({
      login: z.string(),
      avatarUrl: z.string().url(),
      name: z.string().nullable(),
      bio: z.string().nullable(),
      url: z.string().url().startsWith("https://github.com/"),
      createdAt: z.string().datetime(),
      repositories: z.object({ totalCount: count }),
      contributionsCollection: z.object({
        contributionYears: z.array(z.number().int().min(2008)),
      }),
    })
    .nullable(),
});
export const periodResponseSchema = z.object({
  user: z
    .object({
      contributionsCollection: z.object({
        startedAt: z.string().datetime(),
        endedAt: z.string().datetime(),
        restrictedContributionsCount: count,
        totalCommitContributions: count,
        totalPullRequestContributions: count,
        totalIssueContributions: count,
        totalRepositoryContributions: count,
        totalRepositoriesWithContributedCommits: count,
        contributionCalendar: z.object({
          totalContributions: count,
          weeks: z.array(
            z.object({
              contributionDays: z.array(
                z.object({
                  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                  contributionCount: count,
                }),
              ),
            }),
          ),
        }),
      }),
    })
    .nullable(),
});
