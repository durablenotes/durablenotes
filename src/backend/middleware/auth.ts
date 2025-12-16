

export interface AuthResult {
    userId: string;
    email: string;
    name?: string;
    picture?: string;
}

interface GoogleTokenInfo {
    sub: string;
    email: string;
    name: string;
    picture: string;
    aud: string;
}

interface Env {
    NOTES_DO: DurableObjectNamespace;
    DB: D1Database;
    ADMIN_EMAILS: string; // Comma-separated list of admin emails
}

// Parse admin emails from environment variable
function getAdminEmails(env: Env): string[] {
    return (env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
}

export async function authenticate(request: Request, env: Env): Promise<AuthResult> {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Response("Unauthorized: Missing or invalid Authorization header", { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Verify Google Token via Google API
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);

    if (!googleRes.ok) {
        throw new Response("Unauthorized: Invalid Google Token", { status: 401 });
    }

    const payload = await googleRes.json() as GoogleTokenInfo;

    // Sync User to D1
    let userId = payload.sub; // Google stable ID
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    // DB SYNC: Always sync the REAL user (Admin)
    try {
        await env.DB.prepare(
            `INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET name=excluded.name, picture=excluded.picture`
        ).bind(userId, email, name, picture).run();
    } catch (e) {
        console.error("Failed to sync user to D1", e);
    }

    // IMPERSONATION CHECK
    const impersonateId = request.headers.get("X-Impersonate-ID");
    if (impersonateId) {
        if (getAdminEmails(env).includes(email)) {
            // Admin is allowed to impersonate
            userId = impersonateId;
        } else {
            // Non-admin tried to impersonate - Danger!
            console.warn(`Unauthorized impersonation attempt by ${email}`);
            throw new Response("Forbidden: You are not authorized to impersonate.", { status: 403 });
        }
    }

    return { userId, email, name, picture };
}
