import { test, expect } from "@playwright/test";

test("User cannot login with wrong password", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill(process.env.E2E_EMAIL!.trim());
  await page.getByLabel("Password").fill("WrongPassword123");

  await page.getByRole("button", { name: /log in/i }).click();

  // ensure we're still on login page (give a bit more time if needed)
  await expect(page).toHaveURL(/login/, { timeout: 10000 });

  // wait for the auth network response that indicates failure (adjust the URL fragment if your auth endpoint differs)
  await page.waitForResponse(resp =>
    resp.url().includes("/auth/v1/token") && (resp.status() === 400 || resp.status() === 401),
    { timeout: 5000 }
  ).catch(() => { /* continue; network may behave differently in some setups */ });

  // Try several ways to find the error message: role=alert, toasts, or text content
  const alertByRole = page.getByRole("alert");
  const alertInMain = page.locator("main").getByRole("alert");
  const genericText = page.locator("body").getByText(/invalid|incorrect|wrong.*password|credentials/i);

  // Prefer role-based alert if present, otherwise check text
  if (await alertByRole.count() > 0) {
    await expect(alertByRole.first()).toBeVisible({ timeout: 10000 });
    await expect(alertByRole.first()).toContainText(/invalid|incorrect|credentials|wrong password/i);
  } else if (await alertInMain.count() > 0) {
    await expect(alertInMain.first()).toBeVisible({ timeout: 10000 });
    await expect(alertInMain.first()).toContainText(/invalid|incorrect|credentials|wrong password/i);
  } else {
    // fallback: check anywhere on the page for the error text
    await expect(genericText).toBeVisible({ timeout: 10000 });
  }
});