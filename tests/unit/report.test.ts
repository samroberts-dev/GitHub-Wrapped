import { describe, expect, it } from "vitest";
import {
  reportRequestSchema,
  usernameSchema,
} from "../../src/lib/validation/report";
describe("usernames", () => {
  it.each(["octocat", "a", "some-developer", "A1", "a".repeat(39)])(
    "accepts %s",
    (value) => expect(usernameSchema.safeParse(value).success).toBe(true),
  );
  it.each([
    "",
    "-octocat",
    "octocat-",
    "two--hyphens",
    "with_space",
    "a/b",
    "a".repeat(40),
  ])("rejects %s", (value) =>
    expect(usernameSchema.safeParse(value).success).toBe(false),
  );
  it("trims whitespace", () =>
    expect(usernameSchema.parse(" octocat ")).toBe("octocat"));
});
describe("report periods", () => {
  const schema = reportRequestSchema(2026);
  it("accepts current year and all-time", () => {
    expect(
      schema.safeParse({ username: "octocat", mode: "yearly", year: 2026 })
        .success,
    ).toBe(true);
    expect(
      schema.safeParse({ username: "octocat", mode: "all-time" }).success,
    ).toBe(true);
  });
  it.each([2007, 2027, 2025.5, "2025", undefined])(
    "rejects invalid year %s",
    (year) =>
      expect(
        schema.safeParse({ username: "octocat", mode: "yearly", year }).success,
      ).toBe(false),
  );
});
