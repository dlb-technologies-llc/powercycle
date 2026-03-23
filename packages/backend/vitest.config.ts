import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["test/**/*.test.ts"],
		globals: true,
	},
	resolve: {
		alias: {
			"@shared": path.resolve(__dirname, "../shared/src"),
		},
	},
});
