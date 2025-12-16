
import { authenticate } from "./middleware/auth";
import { NoteStore } from "./do/NoteStore";

// Export the Durable Object Class so Cloudflare can find it
export { NoteStore };


interface Env {
    NOTES_DO: DurableObjectNamespace;
    DB: D1Database;
    ASSETS: Fetcher; // Cloudflare Assets Binding
    ADMIN_EMAILS: string; // Comma-separated list of admin emails
}

import { handleAdminRequest } from "./routes/admin";

// Worker Entry Point
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname.startsWith("/api")) {
            // Public Route: System Settings (Branding)
            if (url.pathname === "/api/settings" && request.method === "GET") {
                const settings = await env.DB.prepare("SELECT * FROM system_settings").all();
                // Convert list [{key, value}] to object {key: value}
                const config = settings.results.reduce((acc: any, curr: any) => {
                    acc[curr.key] = curr.value;
                    return acc;
                }, {});
                return new Response(JSON.stringify(config), { headers: { "Content-Type": "application/json" } });
            }

            // 1. Authenticate
            const user = await authenticate(request, env);

            // 1.5 Admin Routes
            if (url.pathname.startsWith("/api/admin")) {
                return handleAdminRequest(request, env, user);
            }

            // 2. Get Per-User Durable Object
            // Using hex encoding of userId to ensure valid name, though 'dev-user-001' is safe.
            const id = env.NOTES_DO.idFromName(user.userId);
            const stub = env.NOTES_DO.get(id);

            // 3. Forward request to the DO
            // We might want to inject the User ID into the request headers or body if needed by the DO,
            // but the DO already scoped to this user.
            // However, for POST creation, we passed userId in body in NoteStore.ts, so let's ensure we pass it.

            // Clone request to inject userId if it's a POST
            if (request.method === 'POST') {
                const body = await request.json() as Record<string, unknown>;
                const newBody = { ...body, userId: user.userId };
                return stub.fetch(new Request(request.url, {
                    method: 'POST',
                    headers: request.headers,
                    body: JSON.stringify(newBody)
                }));
            }

            return stub.fetch(request);
        }

        // STATIC ASSETS & SPA ROUTING
        // 1. Check if ASSETS binding exists
        if (!env.ASSETS) {
            // console.error("ASSETS binding is missing. Available bindings:", Object.keys(env));
            return new Response(`Config Error: ASSETS binding missing. Keys: ${Object.keys(env).join(", ")}`, { status: 500 });
        }

        try {
            // 2. Try to serve the exact file (e.g. /main.js)
            let response = await env.ASSETS.fetch(request);

            // 3. If not found (e.g. /admin, /login), serve index.html
            if (response.status === 404 && !url.pathname.startsWith("/api/")) {
                const indexUrl = new URL("/index.html", url.origin);
                response = await env.ASSETS.fetch(new Request(indexUrl, request));
            }

            return response;
        } catch (e: any) {
            return new Response(`Asset Fetch Error: ${e.message}`, { status: 500 });
        }
    },
};
