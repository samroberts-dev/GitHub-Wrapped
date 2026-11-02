import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  normalizePeriod,
  selectYears,
  yearWindow,
} from "../../src/lib/github/normalize";
import { periodResponseSchema } from "../../src/lib/github/schema";

vi.mock("server-only", () => ({}));
const period = () => ({
  user: {
    contributionsCollection: {
      startedAt: "2025-01-01T00:00:00Z",
      endedAt: "2025-12-31T23:59:59Z",
      restrictedContributionsCount: 0,
      totalCommitContributions: 8,
      totalPullRequestContributions: 2,
      totalIssueContributions: 1,
      totalRepositoryContributions: 1,
      totalRepositoriesWithContributedCommits: 2,
      contributionCalendar: {
        totalContributions: 12,
        weeks: [
          {
            contributionDays: [
              { date: "2025-01-01", contributionCount: 12 },
              { date: "2024-12-31", contributionCount: 5 },
            ],
          },
        ],
      },
    },
  },
});
const profile = () => ({
  user: {
    login: "octocat",
    name: null,
    bio: null,
    avatarUrl: "https://avatars.githubusercontent.com/u/583231?s=160",
    url: "https://github.com/octocat",
    createdAt: "2011-01-01T00:00:00Z",
    repositories: { totalCount: 3 },
    contributionsCollection: { contributionYears: [2025, 2024] },
  },
});
function reply(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(data), { status, headers });
}

describe("normalization", () => {
  it("preserves direct counts and filters calendar boundary spillover", () => {
    const data = periodResponseSchema.parse(period());
    const normalized = normalizePeriod(2025, data.user!);
    expect(normalized.contributions).toBe(12);
    expect(normalized.days).toEqual([{ date: "2025-01-01", count: 12 }]);
    expect(normalized.source).toBe("github");
    expect(normalized.repositoriesWithCommits).toBe(2);
  });
  it("withholds restricted calendars instead of labelling them public", () => {
    const data = period();
    data.user.contributionsCollection.restrictedContributionsCount = 4;
    expect(normalizePeriod(2025, data.user)).toMatchObject({
      contributions: null,
      days: null,
    });
  });
  it("deduplicates, bounds and discloses omitted history", () => {
    expect(
      selectYears(
        [2025, 2025, 2024, 2023, 2007, 2027],
        new Date("2026-06-01Z"),
        2,
      ),
    ).toEqual({ fetched: [2025, 2024], omitted: [2023] });
  });
  it("uses complete UTC years and caps this year at now", () => {
    const now = new Date("2026-06-01T12:00:00Z");
    expect(yearWindow(2026, now).to).toBe(now.toISOString());
    expect(yearWindow(2024, now)).toEqual({
      from: "2024-01-01T00:00:00.000Z",
      to: "2024-12-31T23:59:59.999Z",
    });
  });
});

describe("GitHub service", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("GITHUB_TOKEN", "ghp_test_secret");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  function setup(scopes: string | null = "") {
    const fetcher = vi.fn(async (url: string, options?: RequestInit) => {
      if (url.endsWith("/user"))
        return reply(
          {},
          200,
          scopes === null ? {} : { "x-oauth-scopes": scopes },
        );
      const body = JSON.parse(options?.body as string);
      return reply({
        data: body.query.includes("query Profile") ? profile() : period(),
      });
    });
    vi.stubGlobal("fetch", fetcher);
    return fetcher;
  }
  it("fetches normalized reports, caches success, and keeps the token out of output", async () => {
    const fetcher = setup();
    const { getReport } = await import("../../src/lib/github/report");
    const request = {
      username: "octocat",
      mode: "yearly",
      year: 2025,
    } as const;
    const report = await getReport(request);
    expect(report.profile.publicRepositories).toBe(3);
    expect(report.periods[0].commits).toBe(8);
    expect(JSON.stringify(report)).not.toContain("ghp_test_secret");
    await getReport(request);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls[1][1]?.cache).toBe("no-store");
  });
  it.each(["repo", "read:user", null])(
    "rejects unsafe or unverifiable token scopes: %s",
    async (scopes) => {
      const fetcher = setup(scopes);
      const { getReport } = await import("../../src/lib/github/report");
      await expect(
        getReport({ username: "octocat", mode: "yearly", year: 2025 }),
      ).rejects.toMatchObject({ code: "CONFIGURATION_ERROR" });
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );
  it("rejects missing configuration before any network call", async () => {
    const fetcher = setup();
    vi.stubEnv("GITHUB_TOKEN", "");
    const { getReport } = await import("../../src/lib/github/report");
    await expect(
      getReport({ username: "octocat", mode: "all-time" }),
    ).rejects.toMatchObject({ code: "NOT_CONFIGURED" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("accepts public_repo without accepting private-access scopes", async () => {
    setup("public_repo");
    const { getReport } = await import("../../src/lib/github/report");
    await expect(
      getReport({ username: "octocat", mode: "yearly", year: 2025 }),
    ).resolves.toMatchObject({ profile: { login: "octocat" } });
  });
  it("deduplicates concurrent report builds after verifying the token", async () => {
    const fetcher = setup();
    const { publicToken } = await import("../../src/lib/github/client");
    await publicToken(AbortSignal.timeout(1000));
    const { getReport } = await import("../../src/lib/github/report");
    const input = { username: "octocat", mode: "yearly", year: 2025 } as const;
    const [a, b] = await Promise.all([getReport(input), getReport(input)]);
    expect(a).toEqual(b);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("does not cache a failed report", async () => {
    const fetcher = setup();
    const { getReport } = await import("../../src/lib/github/report");
    fetcher
      .mockImplementationOnce(async () =>
        reply({}, 200, { "x-oauth-scopes": "" }),
      )
      .mockImplementationOnce(async () => reply({ data: { user: null } }));
    const input = { username: "octocat", mode: "yearly", year: 2025 } as const;
    await expect(getReport(input)).rejects.toMatchObject({ status: 404 });
    await expect(getReport(input)).resolves.toMatchObject({
      profile: { login: "octocat" },
    });
    expect(fetcher).toHaveBeenCalledTimes(4);
  });
  it("fetches each available year for all-time without claiming lifetime coverage", async () => {
    const fetcher = setup();
    const { getReport } = await import("../../src/lib/github/report");
    const report = await getReport({ username: "octocat", mode: "all-time" });
    expect(report.coverage.fetchedYears).toEqual([2025, 2024]);
    expect(fetcher).toHaveBeenCalledTimes(4);
  });
  it("does not silently use partial GraphQL data", async () => {
    setup();
    const { graphql } = await import("../../src/lib/github/client");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        reply({
          data: profile(),
          errors: [{ type: "INTERNAL", message: "sensitive upstream detail" }],
        }),
      ),
    );
    await expect(
      graphql(
        "query",
        {},
        periodResponseSchema,
        "secret",
        AbortSignal.timeout(1000),
      ),
    ).rejects.toMatchObject({
      code: "UPSTREAM_ERROR",
      message: "GitHub could not complete the report. Please try again.",
    });
  });
  it("handles HTTP limits with retry metadata", async () => {
    setup();
    const { graphql } = await import("../../src/lib/github/client");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => reply({}, 429, { "retry-after": "120" })),
    );
    await expect(
      graphql(
        "query",
        {},
        periodResponseSchema,
        "secret",
        AbortSignal.timeout(1000),
      ),
    ).rejects.toMatchObject({ status: 429, retryAfter: 120 });
  });
  it("rejects malformed payloads", async () => {
    setup();
    const { graphql } = await import("../../src/lib/github/client");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => reply({ data: { user: { invalid: true } } })),
    );
    await expect(
      graphql(
        "query",
        {},
        periodResponseSchema,
        "secret",
        AbortSignal.timeout(1000),
      ),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
  it("maps a missing user to 404", async () => {
    const fetcher = setup();
    fetcher.mockImplementation(async (url) =>
      url.endsWith("/user")
        ? reply({}, 200, { "x-oauth-scopes": "" })
        : reply({ data: { user: null } }),
    );
    const { getReport } = await import("../../src/lib/github/report");
    await expect(
      getReport({ username: "octocat", mode: "all-time" }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
