import { test, expect } from "@playwright/test";

test("User cannot login with wrong password", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill(process.env.E2E_EMAIL!.trim());
  await page.getByLabel("Password").fill("WrongPassword123");

  await page.getByRole("button", { name: /log in/i }).click();

  // User should remain on login page
  await expect(page).toHaveURL(/login/);

  // Check the visible error text directly
  await expect(
    page.getByText(/invalid login credentials/i)
  ).toBeVisible();
});