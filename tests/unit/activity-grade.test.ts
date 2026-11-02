import { describe, expect, it } from "vitest";
import { activityGrade } from "../../src/lib/analytics/activity-grade";
import { report } from "../fixtures/report";

describe("documented activity grades", () => {
  it.each([
    [0, "F"],
    [1, "E"],
    [49, "E"],
    [50, "D"],
    [149, "D"],
    [150, "C"],
    [364, "C"],
    [365, "B"],
    [749, "B"],
    [750, "A"],
    [1499, "A"],
    [1500, "S"],
  ])("grades %s contributions as %s", (count, grade) => {
    const input = structuredClone(report);
    input.periods[0].contributions = count as number;
    expect(activityGrade(input)?.grade).toBe(grade);
  });
  it("averages across fetched years without rewarding account age", () => {
    const input = structuredClone(report);
    input.mode = "all-time";
    input.periods[0].contributions = 1500;
    input.periods.push({ ...input.periods[0], year: 2024, contributions: 0 });
    expect(activityGrade(input)).toEqual({
      grade: "A",
      contributionsPerYear: 750,
    });
  });
  it("does not project partial-year activity into the future", () => {
    const input = structuredClone(report);
    input.periods[0].to = "2025-01-31T00:00:00Z";
    input.periods[0].contributions = 50;
    expect(activityGrade(input)?.grade).toBe("D");
  });
  it("withholds grades with missing, empty or incomplete coverage", () => {
    const input = structuredClone(report);
    input.periods[0].contributions = null;
    expect(activityGrade(input)).toBeNull();
    input.periods = [];
    expect(activityGrade(input)).toBeNull();
    input.periods = report.periods;
    input.coverage.complete = false;
    expect(activityGrade(input)).toBeNull();
  });
});
