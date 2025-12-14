
interface Env {
    NOTES_DO: DurableObjectNamespace;
    DB: D1Database;
}

const ADMIN_EMAILS = ["durablenotes@gmail.com"];

export async function handleAdminRequest(request: Request, env: Env, user: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace("/api/admin", "");

    // 1. Security Check
    if (!ADMIN_EMAILS.includes(user.email)) {
        return new Response("Forbidden: You are not an admin", { status: 403 });
    }

    // 2. Route Dispatch
    if (path === "/users" && request.method === "GET") {
        return listUsers(env);
    }

    if (path === "/stats" && request.method === "GET") {
        return getStats(env);
    }

    return new Response("Admin Route Not Found", { status: 404 });
}

async function listUsers(env: Env) {
    try {
        const { results } = await env.DB.prepare(
            "SELECT * FROM users ORDER BY created_at DESC LIMIT 100"
        ).all();
        return new Response(JSON.stringify({ users: results }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

async function getStats(env: Env) {
    try {
        const userCount = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first("count");
        const noteCount = await env.DB.prepare("SELECT value FROM stats WHERE key = 'total_notes'").first("value");

        return new Response(JSON.stringify({
            totalUsers: userCount,
            totalNotes: noteCount || 0, // [NEW] Real stats
            activeToday: 0
        }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
