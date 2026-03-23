import { existsSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const PORT = Number(process.env.PORT) || 3000;
const API_PORT = PORT + 1;
const DIST_DIR = resolve(
	new URL(".", import.meta.url).pathname,
	"../../frontend/dist",
);

const MIME_TYPES: Record<string, string> = {
	".html": "text/html",
	".js": "application/javascript",
	".css": "text/css",
	".json": "application/json",
	".png": "image/png",
	".jpg": "image/jpeg",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".woff": "font/woff",
	".woff2": "font/woff2",
};

const indexHtml = readFileSync(join(DIST_DIR, "index.html"));

const server = Bun.serve({
	port: PORT,
	hostname: "0.0.0.0",
	async fetch(request) {
		const url = new URL(request.url);

		if (url.pathname.startsWith("/api")) {
			const apiUrl = new URL(request.url);
			apiUrl.port = String(API_PORT);
			return fetch(new Request(apiUrl, request));
		}

		const filePath = join(DIST_DIR, url.pathname);
		if (url.pathname !== "/" && existsSync(filePath)) {
			const content = readFileSync(filePath);
			const ext = extname(filePath);
			return new Response(content, {
				headers: {
					"Content-Type": MIME_TYPES[ext] || "application/octet-stream",
					"Cache-Control": "public, max-age=31536000, immutable",
				},
			});
		}

		return new Response(indexHtml, {
			headers: { "Content-Type": "text/html" },
		});
	},
});

console.log(`Static server on http://${server.hostname}:${server.port}`);
console.log(`Proxying /api/* to http://localhost:${API_PORT}`);
