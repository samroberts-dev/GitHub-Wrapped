import "server-only";
import { z } from "zod";
import { GitHubError } from "./errors";

const envelope = z.object({
  data: z.unknown().optional(),
  errors: z
    .array(
      z.object({ type: z.string().optional(), message: z.string().optional() }),
    )
    .optional(),
});
let verified: { token: string; expires: number } | undefined;

function retrySeconds(response: Response) {
  const value = Number(response.headers.get("retry-after"));
  if (Number.isFinite(value) && value > 0) return Math.ceil(value);
  const reset = Number(response.headers.get("x-ratelimit-reset")) * 1000;
  return Math.min(
    3600,
    Math.max(1, Math.ceil((reset - Date.now()) / 1000) || 60),
  );
}

async function request(
  url: string,
  token: string,
  signal: AbortSignal,
  body?: string,
) {
  let response: Response;
  try {
    response = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "GitHub-Wrapped",
      },
      body,
      cache: "no-store",
      signal,
    });
  } catch {
    if (signal.aborted)
      throw new GitHubError(
        "TIMEOUT",
        "GitHub took too long to respond. Please try again.",
        504,
      );
    throw new GitHubError(
      "NETWORK_ERROR",
      "Unable to reach GitHub. Please try again.",
      502,
    );
  }
  if (
    response.status === 429 ||
    (response.status === 403 &&
      (response.headers.get("x-ratelimit-remaining") === "0" ||
        response.headers.has("retry-after")))
  )
    throw new GitHubError(
      "RATE_LIMITED",
      "GitHub is rate limiting requests. Please try again later.",
      429,
      retrySeconds(response),
    );
  if (response.status === 401 || response.status === 403)
    throw new GitHubError(
      "CONFIGURATION_ERROR",
      "GitHub access is not configured correctly. Contact the deployment maintainer.",
      503,
    );
  if (!response.ok)
    throw new GitHubError(
      "UPSTREAM_ERROR",
      "GitHub could not complete the request. Please try again.",
      502,
    );
  return response;
}

export async function publicToken(signal: AbortSignal): Promise<string> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token)
    throw new GitHubError(
      "NOT_CONFIGURED",
      "Live reports need a server-side GITHUB_TOKEN. See the setup guide.",
      503,
    );
  if (!token.startsWith("ghp_"))
    throw new GitHubError(
      "CONFIGURATION_ERROR",
      "Public lookup requires a classic GitHub token with public_repo only or no scopes. See the setup guide.",
      503,
    );
  if (verified?.token === token && verified.expires > Date.now()) return token;
  const response = await request("https://api.github.com/user", token, signal);
  // Fail closed: fine-grained/App tokens do not provide this classic-token scope header.
  const scopes = response.headers.get("x-oauth-scopes");
  if (
    scopes === null ||
    scopes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .some((s) => s !== "public_repo")
  )
    throw new GitHubError(
      "CONFIGURATION_ERROR",
      "Public lookup requires a classic token with no scopes or public_repo only. Remove private-access scopes and restart the server.",
      503,
    );
  verified = { token, expires: Date.now() + 300_000 };
  return token;
}

export async function graphql<T>(
  query: string,
  variables: Record<string, unknown>,
  schema: z.ZodType<T>,
  token: string,
  signal: AbortSignal,
): Promise<T> {
  const response = await request(
    "https://api.github.com/graphql",
    token,
    signal,
    JSON.stringify({ query, variables }),
  );
  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new GitHubError(
      "INVALID_RESPONSE",
      "GitHub returned an invalid response.",
      502,
    );
  }
  const parsed = envelope.safeParse(raw);
  if (!parsed.success)
    throw new GitHubError(
      "INVALID_RESPONSE",
      "GitHub returned an unexpected response.",
      502,
    );
  const errors = parsed.data.errors;
  if (errors?.length) {
    if (errors.some((e) => e.type === "INSUFFICIENT_SCOPES"))
      throw new GitHubError(
        "CONFIGURATION_ERROR",
        "GitHub requires the public_repo scope for this query. Use a classic token with only public_repo selected.",
        503,
      );
    if (errors.some((e) => e.type === "RATE_LIMITED"))
      throw new GitHubError(
        "RATE_LIMITED",
        "GitHub is rate limiting requests. Please try again later.",
        429,
        60,
      );
    if (errors.some((e) => e.type === "NOT_FOUND"))
      throw new GitHubError(
        "NOT_FOUND",
        "That GitHub user could not be found.",
        404,
      );
    throw new GitHubError(
      "UPSTREAM_ERROR",
      "GitHub could not complete the report. Please try again.",
      502,
    );
  }
  const data = schema.safeParse(parsed.data.data);
  if (!data.success)
    throw new GitHubError(
      "INVALID_RESPONSE",
      "GitHub returned an unexpected response.",
      502,
    );
  return data.data;
}
