import "server-only";
import type { GitHubReport, ReportRequest } from "../../types/report";
import { graphql, publicToken } from "./client";
import { GitHubError } from "./errors";
import { normalizePeriod, selectYears, yearWindow } from "./normalize";
import { PROFILE_QUERY, PERIOD_QUERY } from "./queries";
import { profileResponseSchema, periodResponseSchema } from "./schema";

const cache = new Map<
  string,
  { report: GitHubReport; expires: number; token: string }
>();
const pending = new Map<string, Promise<GitHubReport>>();
export async function getReport(input: ReportRequest): Promise<GitHubReport> {
  const now = new Date();
  const key = `${input.username.toLowerCase()}:${input.mode}:${input.mode === "yearly" ? input.year : now.getUTCFullYear()}`;
  const signal = AbortSignal.timeout(50_000);
  const token = await publicToken(signal);
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now() && cached.token === token)
    return cached.report;
  const running = pending.get(key);
  if (running) return running;
  if (pending.size >= 4)
    throw new GitHubError(
      "BUSY",
      "The report service is busy. Please try again shortly.",
      429,
      10,
    );
  const task = buildReport(input, token, signal, now);
  pending.set(key, task);
  try {
    const report = await task;
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(key, { report, token, expires: Date.now() + 300_000 });
    return report;
  } finally {
    pending.delete(key);
  }
}

async function buildReport(
  input: ReportRequest,
  token: string,
  signal: AbortSignal,
  now: Date,
): Promise<GitHubReport> {
  const { user } = await graphql(
    PROFILE_QUERY,
    { login: input.username },
    profileResponseSchema,
    token,
    signal,
  );
  if (!user)
    throw new GitHubError(
      "NOT_FOUND",
      "That GitHub user could not be found.",
      404,
    );
  const available = user.contributionsCollection.contributionYears;
  const selected =
    input.mode === "yearly"
      ? { fetched: [input.year], omitted: [] }
      : selectYears(available, now);
  const periods: GitHubReport["periods"] = [];
  // Sequential bounded year windows avoid a large query or unbounded fan-out.
  for (const year of selected.fetched) {
    const window = yearWindow(year, now);
    const data = await graphql(
      PERIOD_QUERY,
      { login: user.login, ...window },
      periodResponseSchema,
      token,
      signal,
    );
    if (!data.user)
      throw new GitHubError(
        "NOT_FOUND",
        "That GitHub user could not be found.",
        404,
      );
    periods.push(normalizePeriod(year, data.user));
  }
  const notes = [
    "Public-only lookup; no private-user authentication is performed.",
    "Contribution totals follow GitHub contribution rules, not every commit ever made.",
    "All-time coverage uses the contribution years exposed by GitHub, with a maximum of 20 year windows.",
    "Repositories with commits is not a count of every repository contributed to.",
  ];
  if (periods.some((p) => p.days === null))
    notes.push(
      "Some calendars were withheld because GitHub included restricted contributions; unavailable values are not zero.",
    );
  if (selected.omitted.length)
    notes.push("Older years were omitted by the request budget.");
  return {
    profile: {
      login: user.login,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      url: user.url,
      createdAt: user.createdAt,
      publicRepositories: user.repositories.totalCount,
    },
    mode: input.mode,
    periods,
    coverage: {
      requestedYears:
        input.mode === "yearly"
          ? [input.year]
          : [...selected.fetched, ...selected.omitted],
      fetchedYears: selected.fetched,
      omittedYears: selected.omitted,
      complete:
        selected.omitted.length === 0 && periods.every((p) => p.days !== null),
      notes,
    },
    retrievedAt: now.toISOString(),
  };
}
