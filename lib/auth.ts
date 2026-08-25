import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

/**
 * Shared authentication utilities for both the Docker/Express server (server.ts)
 * and the Vercel serverless function (api/index.ts).
 *
 * Security model:
 *  - `/api/login` verifies a username + password against server-side credentials
 *    (bcrypt-hashed) and issues an HMAC-signed, httpOnly session cookie.
 *  - Write endpoints (POST /api/data, /api/upload-map, /api/gdrive/import) are
 *    protected by `requireAuth`, which accepts EITHER a valid session cookie OR
 *    an `x-admin-token` header equal to ADMIN_API_TOKEN (for automation).
 *
 * Required environment variables in production:
 *  - SESSION_SECRET      : random string used to sign session cookies.
 *  - ADMIN_API_TOKEN     : shared secret for programmatic write access.
 *  - ADMIN_USERNAME      : admin login username (default: "admin").
 *  - ADMIN_PASSWORD_HASH : bcrypt hash of the admin password (preferred), OR
 *  - ADMIN_PASSWORD      : plaintext password, hashed in-memory at boot (convenience).
 */

export const COOKIE_NAME = "cliff_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export interface SessionPayload {
    username: string;
    role: string;
    fullName: string;
    exp: number; // unix seconds
}

/** True only when running on a real production deployment. */
function isProduction(): boolean {
    return process.env.NODE_ENV === "production";
}

function getSessionSecret(): string {
    const secret = process.env.SESSION_SECRET;
    if (secret && secret.length >= 16) return secret;
    if (isProduction()) {
        // Fail loudly rather than silently signing with a guessable key.
        throw new Error(
            "SESSION_SECRET is not configured (must be >= 16 chars). Refusing to issue sessions in production."
        );
    }
    console.warn(
        "[auth] SESSION_SECRET not set; using an insecure development fallback. DO NOT use in production."
    );
    return "dev-insecure-session-secret-change-me";
}

export function getAdminApiToken(): string | null {
    const token = process.env.ADMIN_API_TOKEN;
    return token && token.length > 0 ? token : null;
}

interface AdminCredential {
    username: string;
    passwordHash: string;
    role: string;
    fullName: string;
}

let cachedCredential: AdminCredential | null = null;

/**
 * Resolves the single admin credential from environment variables.
 * Prefers ADMIN_PASSWORD_HASH; falls back to hashing ADMIN_PASSWORD at runtime.
 */
export function getAdminCredential(): AdminCredential {
    if (cachedCredential) return cachedCredential;

    const username = process.env.ADMIN_USERNAME || "admin";
    const fullName = process.env.ADMIN_FULLNAME || "Administrator";
    const role = process.env.ADMIN_ROLE || "admin";

    let passwordHash = process.env.ADMIN_PASSWORD_HASH || "";

    if (!passwordHash) {
        const plain = process.env.ADMIN_PASSWORD;
        if (plain) {
            passwordHash = bcrypt.hashSync(plain, 10);
        } else if (!isProduction()) {
            // Development-only default so the app is usable out of the box.
            console.warn(
                "[auth] No ADMIN_PASSWORD_HASH / ADMIN_PASSWORD set; using dev default admin/admin. DO NOT use in production."
            );
            passwordHash = bcrypt.hashSync("admin", 10);
        } else {
            throw new Error(
                "No admin credentials configured. Set ADMIN_PASSWORD_HASH or ADMIN_PASSWORD."
            );
        }
    }

    cachedCredential = { username, passwordHash, role, fullName };
    return cachedCredential;
}

/** Verifies a login attempt. Returns a session payload on success, otherwise null. */
export async function verifyLogin(
    username: string,
    password: string
): Promise<Omit<SessionPayload, "exp"> | null> {
    const cred = getAdminCredential();
    if (!username || !password) return null;
    if (username !== cred.username) {
        // Still run a comparison to reduce timing side-channels.
        await bcrypt.compare(password, cred.passwordHash).catch(() => false);
        return null;
    }
    const ok = await bcrypt.compare(password, cred.passwordHash);
    if (!ok) return null;
    return { username: cred.username, role: cred.role, fullName: cred.fullName };
}

function base64url(input: Buffer | string): string {
    return Buffer.from(input)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function base64urlDecode(input: string): Buffer {
    const padded = input.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(padded, "base64");
}

/** Creates an HMAC-signed session token: base64url(payload).base64url(hmac). */
export function createSessionToken(payload: Omit<SessionPayload, "exp">): string {
    const full: SessionPayload = {
        ...payload,
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    };
    const body = base64url(JSON.stringify(full));
    const sig = crypto
        .createHmac("sha256", getSessionSecret())
        .update(body)
        .digest();
    return `${body}.${base64url(sig)}`;
}

/** Verifies a session token and returns its payload, or null if invalid/expired. */
export function verifySessionToken(token: string): SessionPayload | null {
    if (!token || !token.includes(".")) return null;
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;

    const expected = crypto
        .createHmac("sha256", getSessionSecret())
        .update(body)
        .digest();
    const provided = base64urlDecode(sig);
    if (expected.length !== provided.length) return null;
    if (!crypto.timingSafeEqual(expected, provided)) return null;

    try {
        const payload = JSON.parse(base64urlDecode(body).toString("utf-8")) as SessionPayload;
        if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }
        return payload;
    } catch {
        return null;
    }
}

/** Minimal cookie header parser (avoids adding a cookie-parser dependency). */
export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
    const out: Record<string, string> = {};
    if (!cookieHeader) return out;
    for (const part of cookieHeader.split(";")) {
        const idx = part.indexOf("=");
        if (idx === -1) continue;
        const key = part.slice(0, idx).trim();
        const val = part.slice(idx + 1).trim();
        if (key) out[key] = decodeURIComponent(val);
    }
    return out;
}

/** Builds the Set-Cookie header value for the session cookie. */
export function buildSessionCookie(token: string): string {
    const attrs = [
        `${COOKIE_NAME}=${encodeURIComponent(token)}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        `Max-Age=${SESSION_TTL_SECONDS}`,
    ];
    if (isProduction()) attrs.push("Secure");
    return attrs.join("; ");
}

/** Builds a Set-Cookie header value that clears the session cookie. */
export function buildClearCookie(): string {
    const attrs = [
        `${COOKIE_NAME}=`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=0",
    ];
    if (isProduction()) attrs.push("Secure");
    return attrs.join("; ");
}

/** Reads and verifies the session from a request's cookies. */
export function getSessionFromRequest(req: Request): SessionPayload | null {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[COOKIE_NAME];
    if (!token) return null;
    return verifySessionToken(token);
}

/**
 * Express middleware protecting write endpoints. Grants access when the request
 * carries a valid session cookie OR a matching x-admin-token header.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    // 1. Session cookie (interactive admin users)
    const session = getSessionFromRequest(req);
    if (session) {
        (req as any).user = session;
        next();
        return;
    }

    // 2. Shared API token header (automation / server-to-server)
    const apiToken = getAdminApiToken();
    if (apiToken) {
        const header = req.headers["x-admin-token"];
        const provided = Array.isArray(header) ? header[0] : header;
        if (provided) {
            const a = Buffer.from(provided);
            const b = Buffer.from(apiToken);
            if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
                next();
                return;
            }
        }
    }

    res.status(401).json({ error: "Unauthorized" });
}