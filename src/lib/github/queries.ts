export const PROFILE_QUERY = `query Profile($login: String!) {
  user(login: $login) {
    login name bio avatarUrl(size: 160) url createdAt
    repositories(privacy: PUBLIC, ownerAffiliations: OWNER) { totalCount }
    contributionsCollection { contributionYears }
  }
  rateLimit { remaining resetAt }
}`;
export const PERIOD_QUERY = `query Contributions($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      startedAt endedAt restrictedContributionsCount
      totalCommitContributions totalPullRequestContributions totalIssueContributions
      totalRepositoryContributions totalRepositoriesWithContributedCommits
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
  }
  rateLimit { remaining resetAt }
}`;
