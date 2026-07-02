import { expect, Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/password/i).fill(password);

    await this.page.getByRole("button", {
      name: /login/i,
    }).click();
  }

  async expectDashboard() {
    await expect(this.page).toHaveURL(/dashboard/);
  }

  async expectLoginPage() {
    await expect(this.page).toHaveURL(/login/);
  }
}