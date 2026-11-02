import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("../../src/lib/github/report", () => ({ getReport: vi.fn() }));
import { getReport } from "../../src/lib/github/report";
import { GitHubError } from "../../src/lib/github/errors";
import { GET } from "../../src/app/api/wrapped/route";
beforeEach(() => {
  vi.mocked(getReport).mockReset();
});
it.each([
  "username=bad/name&mode=all-time",
  "username=octocat&mode=yearly&year=2025.5",
  "username=octocat&mode=yearly&year=9999",
  "username=octocat&mode=all-time&year=2025",
  "username=octocat&username=other&mode=all-time",
  "username=octocat&mode=all-time&token=secret",
  "",
])("rejects invalid input before GitHub access: %s", async (query) => {
  const response = await GET(
    new Request(`http://localhost/api/wrapped?${query}`),
  );
  expect(response.status).toBe(400);
  expect(getReport).not.toHaveBeenCalled();
});
it("passes a validated request and returns no-store JSON", async () => {
  vi.mocked(getReport).mockResolvedValue({ mode: "all-time" } as Awaited<
    ReturnType<typeof getReport>
  >);
  const response = await GET(
    new Request("http://localhost/api/wrapped?username=octocat&mode=all-time"),
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(getReport).toHaveBeenCalledWith({
    username: "octocat",
    mode: "all-time",
  });
});
it("returns retry headers on rate limits", async () => {
  vi.mocked(getReport).mockRejectedValue(
    new GitHubError("RATE_LIMITED", "Try later.", 429, 30),
  );
  const response = await GET(
    new Request("http://localhost/api/wrapped?username=octocat&mode=all-time"),
  );
  expect(response.status).toBe(429);
  expect(response.headers.get("retry-after")).toBe("30");
});
it("does not leak unexpected exception details", async () => {
  vi.mocked(getReport).mockRejectedValue(new Error("secret token"));
  const response = await GET(
    new Request("http://localhost/api/wrapped?username=octocat&mode=all-time"),
  );
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain("secret token");
});
