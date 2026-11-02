import { beforeEach, describe, expect, it, vi } from "vitest";
import { report } from "../fixtures/report";
import {
  escapeXml,
  renderCard,
  renderErrorCard,
} from "../../src/features/cards/render";
import { parseCardRequest } from "../../src/lib/validation/card";
vi.mock("server-only", () => ({}));
vi.mock("../../src/lib/github/report", () => ({ getReport: vi.fn() }));
import { getReport } from "../../src/lib/github/report";
import { GitHubError } from "../../src/lib/github/errors";
import { GET } from "../../src/app/api/card/route";
beforeEach(() => {
  vi.mocked(getReport).mockReset();
});

describe("card query", () => {
  it("defaults to the last complete UTC year", () => {
    expect(
      parseCardRequest(
        new URLSearchParams("username=octocat"),
        new Date("2026-11-02Z"),
      ),
    ).toEqual({
      input: { username: "octocat", mode: "yearly", year: 2025 },
      theme: "default",
    });
  });
  it("supports available history and community themes", () => {
    expect(
      parseCardRequest(
        new URLSearchParams("username=octocat&mode=all-time&theme=sunset"),
      ).theme,
    ).toBe("sunset");
  });
  it.each([
    "username=octocat&theme=__proto__",
    "username=octocat&theme=unknown",
    "username=octocat&year=2025&year=2024",
    "username=octocat&mode=all-time&year=2025",
    "username=octocat&year=9999",
    "username=<script>",
    "username=octocat&token=secret",
  ])("rejects invalid card input %s", (query) => {
    expect(() => parseCardRequest(new URLSearchParams(query))).toThrow();
  });
});
describe("SVG output", () => {
  it("shows an activity grade and removes the footer slogan from every card", () => {
    const svg = renderCard(report);
    expect(svg).toContain("ACTIVITY GRADE");
    expect(svg).toContain(">A</text>");
    expect(svg).not.toContain("Your code. Your journey. Your year.");
    expect(renderErrorCard("Try later")).not.toContain(
      "Your code. Your journey. Your year.",
    );
  });
  it("removes invalid XML characters and repairs unpaired surrogates", () => {
    expect(escapeXml("hello\u0000\uFFFF\ud800")).toBe("hello\uFFFD");
  });
  it("escapes every XML-sensitive character", () => {
    expect(escapeXml("<>&\"'")).toBe("&lt;&gt;&amp;&quot;&apos;");
  });
  it("escapes profile text and includes accessible descriptions", () => {
    const input = structuredClone(report);
    input.profile.name = "<script>alert(1)</script>";
    const svg = renderCard(input);
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("<title");
    expect(svg).toContain("<desc");
    expect(svg).toContain("1,284");
    expect(svg).not.toMatch(/<foreignObject|<image|<script|onload=|href=/i);
  });
  it("marks missing calendars unavailable rather than zero", () => {
    const input = structuredClone(report);
    input.periods[0].contributions = null;
    input.coverage.complete = false;
    expect(renderCard(input)).toContain("N/A");
    expect(renderCard(input)).toContain("Partial coverage");
  });
  it("labels calculated all-time sums and public repository snapshot", () => {
    const input = structuredClone(report);
    input.mode = "all-time";
    expect(renderCard(input)).toContain("Calculated sums");
    expect(renderCard(input)).toContain("Public repos now");
  });
  it("escapes errors too", () => {
    expect(renderErrorCard("<script>")).not.toContain("<script>");
  });
});
describe("card endpoint", () => {
  it("returns cacheable SVG with security headers", async () => {
    vi.mocked(getReport).mockResolvedValue(report);
    const response = await GET(
      new Request(
        "https://example.com/api/card?username=octocat&year=2025&theme=midnight",
      ),
    );
    expect(response.headers.get("content-type")).toContain("image/svg+xml");
    expect(response.headers.get("cache-control")).toContain("s-maxage=3600");
    expect(response.headers.get("content-security-policy")).toContain(
      "default-src 'none'",
    );
    expect(await response.text()).toContain("#101b35");
  });
  it("renders validation errors without upstream calls or caching", async () => {
    const response = await GET(
      new Request("https://example.com/api/card?username=bad/name"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-wrapped-error")).toBe("INVALID_REQUEST");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(getReport).not.toHaveBeenCalled();
  });
  it("renders rate-limit errors for Markdown proxies", async () => {
    vi.mocked(getReport).mockRejectedValue(
      new GitHubError("RATE_LIMITED", "Try later.", 429, 30),
    );
    const response = await GET(
      new Request("https://example.com/api/card?username=octocat"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("retry-after")).toBe("30");
    expect(response.headers.get("x-wrapped-error")).toBe("RATE_LIMITED");
    expect(await response.text()).toContain("Try later.");
  });
  it("hides unexpected exception text", async () => {
    vi.mocked(getReport).mockRejectedValue(new Error("secret token"));
    const response = await GET(
      new Request("https://example.com/api/card?username=octocat"),
    );
    expect(await response.text()).not.toContain("secret token");
  });
});
