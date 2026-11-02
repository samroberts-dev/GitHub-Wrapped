# GitHub Wrapped image and JSON APIs

## Embed a card

After deploying to a public HTTPS domain, paste this into your GitHub profile README:

```markdown
![My GitHub Wrapped](https://YOUR_DOMAIN/api/card?username=octocat&year=2025&theme=default)
```

Your GitHub profile README lives in the public repository with the same name as your GitHub username, in its README.md. The short profile bio field does not render Markdown images. The landing form generates a card URL and Markdown for you; deployment maintainers supply the token, not card users.

Available-history example:

```markdown
![My GitHub journey](https://YOUR_DOMAIN/api/card?username=octocat&mode=all-time&theme=midnight)
```

### GET /api/card

| Parameter | Required | Values / default                                                                  |
| --------- | -------- | --------------------------------------------------------------------------------- |
| username  | Yes      | Valid GitHub username, up to 39 characters                                        |
| mode      | No       | yearly (default), all-time                                                        |
| year      | No       | 2008 through current UTC year; default last completed UTC year; omit for all-time |
| theme     | No       | default, midnight, sunset                                                         |

Unknown, duplicate and invalid parameters are rejected. The SVG is 800 × 440, with a viewBox for proportional scaling. It contains no scripts, external assets, embedded HTML, or animation. Profile text is XML escaped. A title and description provide an accessible text equivalent.

Successful images use `image/svg+xml`, browser max-age 300 seconds, and shared-cache max-age 3600 seconds. Error cards use HTTP 200 so image proxies can display them, `Cache-Control: no-store`, and an `X-Wrapped-Error` code. Rate-limited error cards also include `Retry-After`. Use the JSON endpoint if your integration needs HTTP error statuses.

GitHub proxies README images through Camo. Updates are not instant and GitHub can retain a cached image beyond the origin refresh time. See [GitHub's image cache guidance](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls). Do not put credentials or private network addresses in image URLs.

### GET /api/wrapped

```text
/api/wrapped?username=octocat&mode=yearly&year=2025
/api/wrapped?username=octocat&mode=all-time
```

Requires username and mode; yearly requires year. Does not accept theme. Returns profile, per-year normalized contribution counts and daily calendars, source metadata, retrieval timestamp, and explicit coverage notes. JSON is not publicly cached; the server report cache still applies. Errors have `{ "error": { "code": "...", "message": "..." } }` and meaningful HTTP status: 400 invalid input, 404 user missing, 429 throttled/busy, 503 configuration, 504 timeout, 502 GitHub failures. Unexpected exceptions return 500 without internal details.

## Maintainer setup

1. Install with `npm ci` and copy `.env.example` to `.env.local`.
2. Create an expiring classic personal access token with **only public_repo** selected. No-scope classic tokens are also accepted for fields GitHub permits. Never select repo, user, or read:user. GitHub's [GraphQL guide](https://docs.github.com/en/graphql/guides/forming-calls-with-graphql) specifies public_repo for public repository queries.
3. Set `GITHUB_TOKEN` server-side and restart. On Vercel, add it in project environment settings, then redeploy. Never commit it or use NEXT_PUBLIC_. Never paste it in chat or issue reports.
4. Open `/api/card?username=octocat&year=2025` to test. Open the matching JSON URL to inspect coverage and errors.

The server verifies the classic token's OAuth-scope response header through GitHub's `/user` endpoint. Missing scope headers, private-access scopes, and fine-grained/App tokens fail closed. Token scope verification is cached for five minutes. The integration intentionally supports public lookup only; it does not offer private-user authorization.

## Accuracy and budgets

### Activity grade

Cards show a calculated activity grade: F for 0, E for 1–49, D for 50–149, C for 150–364, B for 365–749, A for 750–1,499, and S for 1,500+ contributions per fetched year. All-time cards use the arithmetic mean across fetched years so account age alone does not increase the grade. Partial years count as-is; no future activity is projected. Missing calendars, empty history, and incomplete coverage receive no grade. The grade is a playful activity scale, not a measure of developer skill or a population percentile. Rules live in `src/lib/analytics/activity-grade.ts` with boundary tests.

On the website, hover over a generated card to flip to the public profile, including avatar, bio, join date and current public repository count. Keyboard focus and the flip button also reveal the profile; Escape returns to stats. Touch users can use the button. Profile data loads on first interaction, reuses the report service's server cache, and offers a retry on failure. Reduced-motion users get an immediate side change. README images remain static SVGs; the interactive back and avatar are website features.

Profile data and per-period counts come directly from GitHub. Card totals for multiple years are calculated sums. Public repository count is a current snapshot, not a count from the requested historical year. Contribution totals include GitHub's eligible activity categories and do not equal the sum of the three displayed activity counters. See [GitHub's contribution schema](https://docs.github.com/en/graphql/reference/users#contributionscollection).

All-time fetches up to 20 distinct contribution years exposed by GitHub, newest first, in bounded single-year requests. Coverage reports omitted years. GitHub's historical coverage and contribution rules still apply; this is not a guarantee of full lifetime activity. Current-year requests end at retrieval time. If restricted activity appears, aggregate calendars and daily values are withheld rather than mislabelled public. Derived streaks, personalities, languages and stars remain later work.

Requests have a 50-second total upstream deadline and no automatic retries. A failure aborts the report; partial GraphQL responses are never cached as success. Per-process caching keeps up to 100 successful public reports for five minutes, deduplicates concurrent requests for a report, and limits active report builds to four. Failed reports are not cached.

These memory limits are per server instance, not distributed abuse protection. Serverless instances can have separate caches. Before a high-traffic launch, configure hosting-level rate limits/WAF and consider a shared cache; monitor GitHub's API budget. Function hosting must allow the configured 60-second route duration. README users do not supply their own tokens.

## Verification

`npm test` uses mocked GitHub responses, including unsafe scopes, rate limits, invalid payloads, missing users, XML injection and coverage. Browser tests use deterministic SVG fixtures and a token-free test server. A real authenticated GitHub smoke test requires your own server token; no token is supplied with the project.
