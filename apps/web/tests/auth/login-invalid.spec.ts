import { test, expect } from "@playwright/test";

test("User cannot login with wrong password", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill(process.env.E2E_EMAIL!.trim());
  await page.getByLabel("Password").fill("WrongPassword123");

  await page.getByRole("button", { name: /log in/i }).click();

  await expect(page).toHaveURL(/login/);

  // Only check the alert inside the form/main content
  const errorAlert = page.locator("main").getByRole("alert");

  await expect(errorAlert).toContainText(
    /invalid|incorrect|credentials|wrong password/i
  );
  await page.getByRole("button", { name: /log in/i }).click();

await expect(page).toHaveURL(/login/);

await expect(
  page.locator("main").getByRole("alert")
).toContainText(/invalid login credentials/i);
});