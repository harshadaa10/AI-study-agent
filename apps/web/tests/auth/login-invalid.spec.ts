import { test, expect } from "@playwright/test";

test("User cannot login with wrong password", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill(process.env.E2E_EMAIL!.trim());
  await page.getByLabel("Password").fill("WrongPassword123");

  await page.getByRole("button", { name: /log in/i }).click();

  // User should remain on login page
  await expect(page).toHaveURL(/login/);

  // Target only the login form error alert
  const errorAlert = page.locator("main").getByRole("alert");

  await expect(errorAlert).toContainText(/invalid login credentials/i);
});