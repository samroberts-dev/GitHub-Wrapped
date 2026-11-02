import type { GitHubReport } from "../../types/report";
import { themes, type ThemeId } from "../../themes";
import { activityGrade } from "../../lib/analytics/activity-grade";

export function escapeXml(value: string): string {
  return value
    .toWellFormed()
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
    .replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
        })[char]!,
    );
}
const shorten = (value: string, length = 24) =>
  escapeXml(
    Array.from(value).slice(0, length).join("") +
      (Array.from(value).length > length ? "…" : ""),
  );
function frame(
  content: string,
  title: string,
  description: string,
  theme: ThemeId,
) {
  const t = themes[theme];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="440" viewBox="0 0 800 440" role="img" aria-labelledby="title desc"><title id="title">${escapeXml(title)}</title><desc id="desc">${escapeXml(description)}</desc><rect width="800" height="440" rx="22" fill="${t.background}"/><g font-family="Arial, Helvetica, sans-serif" fill="${t.text}"><text x="36" y="42" font-size="14" font-weight="700">↗ githubwrapped</text><path d="M640 0L800 160M690 0L800 110M740 0L800 60" stroke="${t.accent}" stroke-width="18" opacity=".15"/>${content}</g></svg>`;
}
export function renderCard(report: GitHubReport, theme: ThemeId = "default") {
  const accent = themes[theme].accent;
  const ranking = activityGrade(report);
  const visibilityLabel = report.periods.some(
    (p) => p.includesAnonymizedContributions,
  )
    ? "Public + shared anonymous counts"
    : "Public-only";
  const badge = `<circle cx="650" cy="213" r="52" fill="${accent}" fill-opacity=".1" stroke="${accent}" stroke-opacity=".5"/><text x="650" y="231" text-anchor="middle" font-size="52" font-weight="800" fill="${accent}">${ranking?.grade ?? "—"}</text><text x="650" y="285" text-anchor="middle" font-size="11" fill="${themes[theme].muted}">${ranking ? "ACTIVITY GRADE" : "GRADE UNAVAILABLE"}</text>`;
  const sum = (key: "commits" | "pullRequests" | "issues") =>
    report.periods.reduce((total, p) => total + p[key], 0);
  const contributions =
    report.periods.length &&
    report.periods.every((p) => p.contributions !== null)
      ? report.periods
          .reduce((total, p) => total + p.contributions!, 0)
          .toLocaleString("en-US")
      : "N/A";
  const years = report.coverage.fetchedYears;
  const period =
    report.mode === "yearly"
      ? String(years[0] ?? "")
      : years.length
        ? `${Math.min(...years)}–${Math.max(...years)} · AVAILABLE HISTORY`
        : "NO AVAILABLE HISTORY";
  const metrics = [
    ["Commits", sum("commits").toLocaleString("en-US")],
    ["Pull requests", sum("pullRequests").toLocaleString("en-US")],
    ["Issues opened", sum("issues").toLocaleString("en-US")],
    [
      "Public repos now",
      report.profile.publicRepositories.toLocaleString("en-US"),
    ],
  ];
  const description = `${report.profile.login}: ${contributions} contributions; ${metrics.map(([label, value]) => `${value} ${label}`).join(", ")}. ${period}. GitHub-provided counts; sums across fetched years are calculated. ${visibilityLabel}. No private repository details are accessed. Coverage may be incomplete.`;
  return frame(
    `<text x="36" y="79" font-size="12" fill="${accent}">${escapeXml(period)}</text><text x="36" y="124" font-size="32" font-weight="700" ${Array.from(report.profile.name || report.profile.login).length > 20 ? 'textLength="700" lengthAdjust="spacingAndGlyphs"' : ""}>${shorten(report.profile.name || report.profile.login)}’s Wrapped</text><text x="36" y="152" font-size="14" fill="${themes[theme].muted}">@${escapeXml(report.profile.login)}</text><text x="36" y="235" font-size="68" font-weight="800" fill="${accent}">${contributions}</text><text x="38" y="261" font-size="15">contributions across fetched history</text>${badge}${metrics.map(([label, value], index) => `<text x="${36 + index * 190}" y="324" font-size="29" font-weight="700">${value}</text><text x="${36 + index * 190}" y="348" font-size="12" fill="${themes[theme].muted}">${label}</text>`).join("")}<text x="36" y="382" font-size="10" fill="${themes[theme].muted}">${visibilityLabel} · ${report.mode === "all-time" ? "Calculated sums of GitHub counts" : "GitHub-provided counts"} · ${report.coverage.complete ? "Available coverage" : "Partial coverage"} · Updated ${escapeXml(report.retrievedAt.slice(0, 10))}</text>`,
    `${report.profile.login}’s GitHub Wrapped`,
    `${description} Activity grade: ${ranking?.grade ?? "unavailable"}. Based on average contributions per fetched year, including partial years as-is; not a GitHub percentile or skill rating.`,
    theme,
  );
}
export function renderErrorCard(message: string) {
  const theme = "default";
  // Fixed layout with bounded lines; never interpolate upstream exception strings.
  const words = message.slice(0, 240).split(/\s+/);
  const lines: string[] = [""];
  for (const word of words) {
    if ((lines[lines.length - 1] + word).length > 75) lines.push("");
    lines[lines.length - 1] += `${word} `;
  }
  return frame(
    `<text x="36" y="135" font-size="32" font-weight="700">Your Wrapped is taking a moment.</text>${lines
      .slice(0, 4)
      .map(
        (line, i) =>
          `<text x="36" y="${190 + i * 26}" font-size="15" fill="${themes[theme].muted}">${escapeXml(line.trim())}</text>`,
      )
      .join(
        "",
      )}<text x="36" y="340" font-size="13" fill="${themes.default.accent}">Check the card URL or try again later.</text>`,
    "GitHub Wrapped unavailable",
    message,
    "default",
  );
}
