import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
		server: {
			proxy: {
				"/api": { target: "http://localhost:3000", changeOrigin: true },
			},
		},
	},
	integrations: [react()],
});
