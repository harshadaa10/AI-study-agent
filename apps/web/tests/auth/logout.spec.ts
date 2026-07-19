import { test, expect } from "@playwright/test";

test("User can logout", async ({ page }) => {
  page.on("console", msg => console.log("[Browser]", msg.text()));

  await page.goto("/login");

  await page.getByLabel("Email").fill(process.env.E2E_EMAIL!.trim());
  await page.getByLabel("Password").fill(process.env.E2E_PASSWORD!.trim());

  await page.getByRole("button", {
    name: /log in/i,
  }).click();

 await page.waitForURL("**/dashboard", {
  timeout: 15000,
});

  console.log("Current URL:", page.url());

  const alert = page.getByRole("alert").first();

  if (await alert.isVisible()) {
    console.log("Error:", await alert.textContent());
  }

  expect(page.url()).toContain("/dashboard");
});