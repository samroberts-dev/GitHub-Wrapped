import type { z } from "zod";
import type { ContributionPeriod } from "../../types/report";
import { periodResponseSchema } from "./schema";

export function selectYears(available: number[], now: Date, limit = 20) {
  const current = now.getUTCFullYear();
  const years = [...new Set(available)]
    .filter((year) => year >= 2008 && year <= current)
    .sort((a, b) => b - a);
  return { fetched: years.slice(0, limit), omitted: years.slice(limit) };
}
export function yearWindow(year: number, now: Date) {
  return {
    from: `${year}-01-01T00:00:00.000Z`,
    to:
      year === now.getUTCFullYear()
        ? now.toISOString()
        : `${year}-12-31T23:59:59.999Z`,
  };
}
export function normalizePeriod(
  year: number,
  data: NonNullable<z.infer<typeof periodResponseSchema>["user"]>,
): ContributionPeriod {
  const c = data.contributionsCollection;
  const safeCalendar = c.restrictedContributionsCount === 0;
  return {
    year,
    from: c.startedAt,
    to: c.endedAt,
    source: "github",
    contributions: safeCalendar
      ? c.contributionCalendar.totalContributions
      : null,
    commits: c.totalCommitContributions,
    pullRequests: c.totalPullRequestContributions,
    issues: c.totalIssueContributions,
    repositoriesCreated: c.totalRepositoryContributions,
    repositoriesWithCommits: c.totalRepositoriesWithContributedCommits,
    days: safeCalendar
      ? c.contributionCalendar.weeks
          .flatMap((w) => w.contributionDays)
          .filter(
            (d) =>
              d.date >= c.startedAt.slice(0, 10) &&
              d.date <= c.endedAt.slice(0, 10),
          )
          .map((d) => ({ date: d.date, count: d.contributionCount }))
      : null,
  };
}
