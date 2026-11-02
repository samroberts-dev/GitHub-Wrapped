export type ReportRequest =
  | { username: string; mode: "yearly"; year: number }
  | { username: string; mode: "all-time" };
export interface ContributionDay {
  date: string;
  count: number;
}
export interface ContributionPeriod {
  year: number;
  from: string;
  to: string;
  source: "github";
  contributions: number | null;
  commits: number;
  pullRequests: number;
  issues: number;
  repositoriesCreated: number;
  repositoriesWithCommits: number;
  days: ContributionDay[] | null;
}
export interface GitHubReport {
  profile: {
    login: string;
    name: string | null;
    bio: string | null;
    avatarUrl: string;
    url: string;
    createdAt: string;
    publicRepositories: number;
  };
  mode: "yearly" | "all-time";
  periods: ContributionPeriod[];
  coverage: {
    requestedYears: number[];
    fetchedYears: number[];
    omittedYears: number[];
    complete: boolean;
    notes: string[];
  };
  retrievedAt: string;
}
