import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		include: [
			"packages/shared/test/**/*.test.ts",
			"packages/backend/test/**/*.test.ts",
		],
		exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: [
				"packages/backend/src/services/**/*.ts",
				"packages/backend/src/api/**/*.ts",
				"packages/backend/src/lib/**/*.ts",
				"packages/shared/src/engine/**/*.ts",
			],
			exclude: ["**/*.test.ts", "**/*.d.ts"],
		},
	},
});
