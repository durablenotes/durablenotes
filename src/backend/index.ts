
import { authenticate } from "./middleware/auth";
import { NoteStore } from "./do/NoteStore";

// Export the Durable Object Class so Cloudflare can find it
export { NoteStore };

interface Env {
    NOTES_DO: DurableObjectNamespace;
}

// Worker Entry Point
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname.startsWith("/api")) {
            // 1. Authenticate
            const user = await authenticate(request);

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

        // Fallback for static assets
        return new Response("Not Found", { status: 404 });
    },
};
