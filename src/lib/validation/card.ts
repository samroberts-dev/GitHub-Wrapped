import { reportRequestSchema } from "./report";
import { themes, type ThemeId } from "../../themes";
import type { ReportRequest } from "../../types/report";

export function parseCardRequest(
  params: URLSearchParams,
  now = new Date(),
): { input: ReportRequest; theme: ThemeId } {
  const allowed = new Set(["username", "mode", "year", "theme"]);
  for (const key of params.keys())
    if (!allowed.has(key) || params.getAll(key).length !== 1)
      throw new Error("Use username, mode, year, and theme once each.");
  const mode = params.get("mode") ?? "yearly";
  if (mode === "all-time" && params.has("year"))
    throw new Error("All-time cards must omit year.");
  const rawYear = params.get("year");
  if (rawYear !== null && !/^\d{4}$/.test(rawYear))
    throw new Error("Year must contain four digits.");
  const result = reportRequestSchema(now.getUTCFullYear()).safeParse({
    username: params.get("username"),
    mode,
    year: rawYear === null ? now.getUTCFullYear() - 1 : Number(rawYear),
  });
  if (!result.success) throw new Error(result.error.issues[0].message);
  const theme = params.get("theme") ?? "default";
  if (!Object.hasOwn(themes, theme))
    throw new Error("Choose default, midnight, or sunset as the theme.");
  return { input: result.data, theme: theme as ThemeId };
}
