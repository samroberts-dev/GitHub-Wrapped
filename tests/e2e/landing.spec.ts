import { expect, test } from "@playwright/test";
import { report } from "../fixtures/report";
import { renderCard, renderErrorCard } from "../../src/features/cards/render";
test("validates input and explains report availability", async ({
  page,
}, testInfo) => {
  await page.route("**/api/card?**", (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: renderCard(report) }),
  );
  await page.goto("/");
  await expect(page.locator(".wrapped-card")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: testInfo.outputPath("landing-palette.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Generate my card" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Enter a GitHub username",
  );
  await page.getByLabel("YOUR GITHUB USERNAME").fill("octocat");
  await page.getByRole("button", { name: "All-time journey" }).click();
  await expect(
    page.getByRole("combobox", { name: "Year", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Generate my card" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Your card URL and Markdown are ready",
  );
  await expect(page.getByLabel("Copy this Markdown")).toHaveValue(
    /!\[My GitHub Wrapped\]\(http:\/\/127\.0\.0\.1:3100\/api\/card\?username=octocat&mode=all-time&theme=default\)/,
  );
  await expect(
    page.getByRole("region", { name: "Your embeddable card" }).getByRole("img"),
  ).toBeVisible();
});
test("sample slides and themes work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Take a peek" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("NO LIVE DATA");
  await dialog.getByRole("button", { name: "Next" }).click();
  await expect(dialog).toContainText("32 days");
  await dialog.getByLabel("Sample theme").selectOption("midnight");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("profile flips on hover, keyboard and touch, includes avatar, and respects reduced motion", async ({
  page,
  isMobile,
}, testInfo) => {
  let lookups = 0;
  await page.route("**/api/card?**", (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: renderCard(report) }),
  );
  await page.route("**/api/wrapped?**", (route) => {
    lookups++;
    return route.fulfill({
      json: {
        ...report,
        profile: {
          ...report.profile,
          bio: "Building things for the open-source community.",
        },
      },
    });
  });
  await page.route("https://avatars.githubusercontent.com/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="40" fill="#c3fa68"/><text x="40" y="52" text-anchor="middle" font-size="40">O</text></svg>',
    }),
  );
  await page.goto("/");
  await page.getByLabel("YOUR GITHUB USERNAME").fill("octocat");
  await page.getByRole("button", { name: "Generate my card" }).click();
  const preview = page.locator(".profile-preview");
  const inner = preview.locator(".profile-flip-inner");
  if (isMobile)
    await page.getByRole("button", { name: "Flip to profile" }).tap();
  else await preview.hover();
  const profile = page.getByRole("region", { name: "GitHub profile preview" });
  await expect(profile).toContainText(
    "Building things for the open-source community.",
  );
  await expect(
    profile.getByRole("img", { name: "octocat’s GitHub avatar" }),
  ).toBeVisible();
  await expect(inner).toHaveClass(/is-flipped/);
  await expect(
    profile.getByRole("link", { name: "View GitHub profile" }),
  ).toHaveAttribute("href", report.profile.url);
  await page.waitForTimeout(700);
  await preview.screenshot({ path: testInfo.outputPath("profile-back.png") });
  await page.mouse.move(0, 0);
  await preview.getByRole("button").focus();
  await expect(inner).toHaveClass(/is-flipped/);
  await page.keyboard.press("Escape");
  await expect(inner).not.toHaveClass(/is-flipped/);
  await expect(preview.getByRole("button")).toBeFocused();
  expect(lookups).toBe(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await preview.getByRole("button").click();
  await expect(inner).toHaveClass(/is-flipped/);
  expect(
    await inner.evaluate(
      (element) => getComputedStyle(element).transitionDuration,
    ),
  ).toBe("0s");
});

test("profile errors offer a retry and do not expose stale profile data", async ({
  page,
}) => {
  await page.route("**/api/card?**", (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: renderCard(report) }),
  );
  let fail = true;
  await page.route("**/api/wrapped?**", (route) =>
    route.fulfill(
      fail
        ? { status: 503, json: { error: { message: "Unavailable" } } }
        : { json: report },
    ),
  );
  await page.goto("/");
  await page.getByLabel("YOUR GITHUB USERNAME").fill("octocat");
  await page.getByRole("button", { name: "Generate my card" }).click();
  await page.getByRole("button", { name: "Flip to profile" }).click();
  await expect(
    page.getByRole("region", { name: "GitHub profile preview" }),
  ).toContainText("The profile could not load.");
  fail = false;
  await page.getByRole("button", { name: "Retry profile" }).click();
  await expect(
    page.getByRole("region", { name: "GitHub profile preview" }),
  ).toContainText("The Octocat");
});

test("real API routes validate input and return configuration cards", async ({
  request,
}) => {
  const invalid = await request.get(
    "/api/wrapped?username=bad/name&mode=all-time",
  );
  expect(invalid.status()).toBe(400);
  const unavailable = await request.get(
    "/api/wrapped?username=octocat&mode=all-time",
  );
  expect(unavailable.status()).toBe(503);
  expect((await unavailable.json()).error.code).toBe("NOT_CONFIGURED");
  const card = await request.get("/api/card?username=octocat");
  expect(card.status()).toBe(200);
  expect(card.headers()["content-type"]).toContain("image/svg+xml");
  expect(card.headers()["cache-control"]).toBe("no-store");
  expect(card.headers()["x-wrapped-error"]).toBe("NOT_CONFIGURED");
  expect(await card.text()).toContain("GITHUB_TOKEN");
});

test("SVG cards are valid XML, fit their canvas, and render all themes", async ({
  page,
}, testInfo) => {
  for (const theme of ["default", "midnight", "sunset"] as const) {
    await page.setContent(renderCard(report, theme));
    await page
      .locator("svg")
      .screenshot({ path: testInfo.outputPath(`${theme}-sample.png`) });
    const longName = structuredClone(report);
    longName.profile.name = "W".repeat(80);
    const svg = renderCard(longName, theme);
    await page.setContent(svg);
    expect(
      await page.evaluate(
        (svg) =>
          new DOMParser()
            .parseFromString(svg, "image/svg+xml")
            .querySelector("parsererror") === null,
        svg,
      ),
    ).toBe(true);
    const overflowing = await page.locator("svg text").evaluateAll((elements) =>
      elements
        .filter((element) => {
          const box = (element as SVGGraphicsElement).getBBox();
          return (
            box.x < 0 || box.x + box.width > 800 || box.y + box.height > 440
          );
        })
        .map((element) => element.textContent),
    );
    expect(overflowing).toEqual([]);
    await page
      .locator("svg")
      .screenshot({ path: testInfo.outputPath(`${theme}.png`) });
  }
  await page.setContent(
    renderErrorCard(
      "Public lookup requires a classic token with no scopes or public_repo only. Remove private-access scopes and restart the server.",
    ),
  );
  await page
    .locator("svg")
    .screenshot({ path: testInfo.outputPath("error.png") });
});
