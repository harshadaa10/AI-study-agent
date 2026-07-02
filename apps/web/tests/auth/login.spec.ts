import { test, expect } from "@playwright/test";

test("User can login with valid credentials", async ({ page }) => {
  // Open login page
  await page.goto("/login");

  // Fill credentials
  await page.getByLabel("Email").fill(process.env.E2E_EMAIL!.trim());
  await page.getByLabel("Password").fill(process.env.E2E_PASSWORD!.trim());

  // Click login and wait for navigation simultaneously
  await Promise.all([
    page.waitForURL("**/dashboard", {
      timeout: 30000,
    }),
    page.getByRole("button", { name: /log in/i }).click(),
  ]);

  // Verify dashboard opened
  await expect(page).toHaveURL(/dashboard/);

  // Optional: Verify dashboard content
  await expect(
    page.getByRole("heading", { name: /dashboard/i })
  ).toBeVisible();
});