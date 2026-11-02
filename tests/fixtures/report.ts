import type { GitHubReport } from "../../src/types/report";
export const report: GitHubReport = {
  profile: {
    login: "octocat",
    name: "The Octocat",
    bio: null,
    avatarUrl: "https://avatars.githubusercontent.com/u/583231?s=160",
    url: "https://github.com/octocat",
    createdAt: "2011-01-01T00:00:00Z",
    publicRepositories: 8,
  },
  mode: "yearly",
  periods: [
    {
      year: 2025,
      from: "2025-01-01T00:00:00Z",
      to: "2025-12-31T23:59:59Z",
      source: "github",
      contributions: 1284,
      commits: 1024,
      pullRequests: 89,
      issues: 42,
      repositoriesCreated: 3,
      repositoriesWithCommits: 12,
      days: [],
    },
  ],
  coverage: {
    requestedYears: [2025],
    fetchedYears: [2025],
    omittedYears: [],
    complete: true,
    notes: [],
  },
  retrievedAt: "2026-11-02T00:00:00Z",
};
