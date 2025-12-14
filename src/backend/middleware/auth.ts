

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
}

export async function authenticate(request: Request, env: Env): Promise<AuthResult> {
    const authHeader = request.headers.get("Authorization");

    // DEV BYPASS: Allow basic auth or custom header for local dev if needed
    // For now, we'll keep the mock if no header is present in DEV, 
    // BUT we should really strictly enforce it or use a specific dev token.
    if (!authHeader && request.url.includes("localhost")) {
        // console.warn("Using DEV MOCK user");
        // return { userId: "dev-user-001", email: "dev@local.host" };
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Response("Unauthorized: Missing or invalid Authorization header", { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Verify Google Token via Google API
    // (Using tokeninfo endpoint avoids needing heavyweight libraries in Workers)
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);

    if (!googleRes.ok) {
        throw new Response("Unauthorized: Invalid Google Token", { status: 401 });
    }

    const payload = await googleRes.json() as GoogleTokenInfo;

    // TODO: Verify payload.aud matches your Client ID to prevent token reuse attacks
    // const YOUR_CLIENT_ID = "YOUR_CLIENT_ID";
    // if (payload.aud !== YOUR_CLIENT_ID) { ... }

    // Sync User to D1
    const userId = payload.sub; // Google stable ID
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    try {
        await env.DB.prepare(
            `INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET name=excluded.name, picture=excluded.picture`
        ).bind(userId, email, name, picture).run();
    } catch (e) {
        console.error("Failed to sync user to D1", e);
        // We continue even if DB sync fails, as long as token is valid. 
        // But in a real app you might want to fail hard or queue it.
    }

    return { userId, email, name, picture };
}
