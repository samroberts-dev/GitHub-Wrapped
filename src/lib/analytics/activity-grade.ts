import type { GitHubReport } from "../../types/report";

export const activityGrades = [
  { grade: "S", minimum: 1500 },
  { grade: "A", minimum: 750 },
  { grade: "B", minimum: 365 },
  { grade: "C", minimum: 150 },
  { grade: "D", minimum: 50 },
  { grade: "E", minimum: 1 },
  { grade: "F", minimum: 0 },
] as const;

/** A playful activity scale, never a population percentile or a skill rating. */
export function activityGrade(report: GitHubReport) {
  if (
    !report.coverage.complete ||
    !report.periods.length ||
    report.periods.some((p) => p.contributions === null)
  )
    return null;
  const average =
    report.periods.reduce((sum, p) => sum + p.contributions!, 0) /
    report.periods.length;
  return {
    grade: activityGrades.find((tier) => average >= tier.minimum)!.grade,
    contributionsPerYear: average,
  };
}
