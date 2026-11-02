import { parseCardRequest } from "../../../lib/validation/card";
import { getReport } from "../../../lib/github/report";
import { GitHubError } from "../../../lib/github/errors";
import { renderCard, renderErrorCard } from "../../../features/cards/render";

export const runtime = "nodejs";
export const maxDuration = 60;
const headers = {
  "Content-Type": "image/svg+xml; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'none'; sandbox",
  "Content-Disposition": 'inline; filename="github-wrapped.svg"',
};
export async function GET(request: Request) {
  let parsed: ReturnType<typeof parseCardRequest>;
  try {
    parsed = parseCardRequest(new URL(request.url).searchParams);
  } catch (error) {
    return new Response(
      renderErrorCard(
        error instanceof Error ? error.message : "Invalid card parameters.",
      ),
      {
        headers: {
          ...headers,
          "Cache-Control": "no-store",
          "X-Wrapped-Error": "INVALID_REQUEST",
        },
      },
    );
  }
  try {
    const report = await getReport(parsed.input);
    return new Response(renderCard(report, parsed.theme), {
      headers: {
        ...headers,
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch (error) {
    const safe =
      error instanceof GitHubError
        ? error
        : new GitHubError(
            "INTERNAL_ERROR",
            "The card could not be generated. Please try again.",
          );
    // HTTP 200 lets README image proxies display a helpful error card rather than a broken image.
    return new Response(renderErrorCard(safe.message), {
      headers: {
        ...headers,
        "Cache-Control": "no-store",
        "X-Wrapped-Error": safe.code,
        ...(safe.retryAfter ? { "Retry-After": String(safe.retryAfter) } : {}),
      },
    });
  }
}
