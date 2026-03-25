import { expect, test } from "@playwright/test";

test("homepage loads", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator("body")).toBeVisible();
});

test("login page renders form", async ({ page }) => {
	await page.goto("/login");
	await expect(page.locator("input[type='text']")).toBeVisible({
		timeout: 10000,
	});
});

test("health API returns ok", async ({ request }) => {
	const response = await request.get("http://localhost:3000/api/health");
	expect(response.ok()).toBeTruthy();
	const body = await response.json();
	expect(body.status).toBe("ok");
});
