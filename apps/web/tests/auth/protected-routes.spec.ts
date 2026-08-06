import { test, expect } from "@playwright/test";

test("Unauthenticated user is redirected to login from dashboard", async ({
  page,
}) => {
  // Try to access dashboard without logging in
  await page.goto("/dashboard");

  // User should be redirected to login
  await expect(page).toHaveURL(/login/);

  // Login page should be visible
  await expect(page.getByRole("heading", { name: /log in/i })).toBeVisible();
});
