
interface Env {
    NOTES_DO: DurableObjectNamespace;
    DB: D1Database;
    ADMIN_EMAILS: string; // Comma-separated list of admin emails
}

// Parse admin emails from environment variable
function getAdminEmails(env: Env): string[] {
    return (env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
}

export async function handleAdminRequest(request: Request, env: Env, user: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace("/api/admin", "");

    // 1. Security Check
    if (!getAdminEmails(env).includes(user.email)) {
        return new Response("Forbidden: You are not an admin", { status: 403 });
    }

    // 2. Route Dispatch
    if (path === "/users" && request.method === "GET") {
        return listUsers(env);
    }

    if (path === "/stats" && request.method === "GET") {
        return getStats(env);
    }

    if (path === "/settings" && request.method === "POST") {
        return updateSettings(request, env);
    }

    return new Response("Admin Route Not Found", { status: 404 });
}

async function updateSettings(request: Request, env: Env) {
    try {
        const body = await request.json() as Record<string, string>;
        const stmt = env.DB.prepare("INSERT INTO system_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");

        const updates = [];
        if (body.site_title) updates.push(stmt.bind("site_title", body.site_title));
        if (body.logo_url) updates.push(stmt.bind("logo_url", body.logo_url));
        if (body.favicon_url) updates.push(stmt.bind("favicon_url", body.favicon_url));

        if (updates.length > 0) {
            await env.DB.batch(updates);
        }

        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
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
