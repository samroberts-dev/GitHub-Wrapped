import { expect, test } from "@playwright/test";
test("validates input and explains report availability", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Generate my Wrapped" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Enter a GitHub username",
  );
  await page.getByLabel("YOUR GITHUB USERNAME").fill("octocat");
  await page.getByRole("button", { name: "All-time journey" }).click();
  await expect(
    page.getByRole("combobox", { name: "Year", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Generate my Wrapped" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Live GitHub reports arrive in Phase 2",
  );
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
