export interface AuthResult {
    userId: string;
}

export async function authenticate(_request: Request): Promise<AuthResult> {
    // MOCK AUTHENTICATION
    // In the future, verify JWT or Session Token here.
    return { userId: "dev-user-001" };
}
