import { test, expect } from "@playwright/test";

test("User can register", async ({ page }) => {
  // Browser console logs
  page.on("console", (msg) => {
    console.log(`[Browser ${msg.type()}] ${msg.text()}`);
  });

  // JS runtime errors
  page.on("pageerror", (err) => {
    console.log("[Page Error]", err.message);
  });

  // Supabase requests
  page.on("request", (request) => {
    if (request.url().includes("supabase.co")) {
      console.log("➡️", request.method(), request.url());
    }
  });

  // Supabase responses
  page.on("response", async (response) => {
    if (response.url().includes("supabase.co")) {
      console.log("⬅️", response.status(), response.url());

      try {
        const body = await response.text();
        console.log(body);
      } catch {}
    }
  });

  // Failed requests
  page.on("requestfailed", (request) => {
    console.log("❌ REQUEST FAILED");
    console.log(request.url());
    console.log(request.failure());
  });

  const email = `playwright.test+${Date.now()}@gmail.com`;
  const password = "Password123!";

  console.log("Using email:", email);

  await page.goto("/register");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);

  const button = page.getByRole("button", {
    name: /create account/i,
  });

  await expect(button).toBeEnabled();

  console.log("Clicking Create Account...");

  await button.click();

  // Give the request time to complete
  await page.waitForTimeout(8000);

  console.log("Current URL:", page.url());

  // Print visible alerts/status messages
  const alerts = page.locator('[role="alert"], [role="status"]');

  const count = await alerts.count();

  for (let i = 0; i < count; i++) {
    console.log(
      `Message ${i + 1}:`,
      await alerts.nth(i).textContent()
    );
  }

  console.log("\n========== PAGE TEXT ==========");
  console.log(await page.locator("body").textContent());
  console.log("================================");

  // Final assertion
  if (page.url().includes("/dashboard")) {
    await expect(page).toHaveURL(/dashboard/);
  } else {
    await expect(alerts.first()).toBeVisible();
  }
});