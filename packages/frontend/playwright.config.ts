import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL: "http://localhost:4321",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: [
		{
			command: "bun run --cwd ../.. dev:frontend",
			url: "http://localhost:4321",
			reuseExistingServer: true,
		},
		{
			command: "bun run --cwd ../.. dev:server",
			url: "http://localhost:3000/api/health",
			reuseExistingServer: true,
		},
	],
});
