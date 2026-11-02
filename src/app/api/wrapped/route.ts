import { reportRequestSchema } from "../../../lib/validation/report";
import { getReport } from "../../../lib/github/report";
import { GitHubError } from "../../../lib/github/errors";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const allowed = new Set(["username", "mode", "year"]);
  if (
    [...params.keys()].some(
      (key) => !allowed.has(key) || params.getAll(key).length !== 1,
    )
  )
    return Response.json(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "Use username, mode, and an optional year once each.",
        },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  const input = reportRequestSchema(new Date().getUTCFullYear()).safeParse({
    username: params.get("username"),
    mode: params.get("mode"),
    year:
      params.has("year") && /^\d{4}$/.test(params.get("year")!)
        ? Number(params.get("year"))
        : undefined,
  });
  if (
    !input.success ||
    (params.get("mode") === "all-time" && params.has("year"))
  )
    return Response.json(
      {
        error: {
          code: "INVALID_REQUEST",
          message: input.success
            ? "All-time requests must omit year."
            : input.error.issues[0].message,
        },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  try {
    return Response.json(await getReport(input.data), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const safe =
      error instanceof GitHubError
        ? error
        : new GitHubError(
            "INTERNAL_ERROR",
            "The report could not be generated. Please try again.",
            500,
          );
    return Response.json(
      { error: { code: safe.code, message: safe.message } },
      {
        status: safe.status,
        headers: {
          "Cache-Control": "no-store",
          ...(safe.retryAfter
            ? { "Retry-After": String(safe.retryAfter) }
            : {}),
        },
      },
    );
  }
}
