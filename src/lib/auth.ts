import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

/**
 * Intentionally lightweight auth. There are no user accounts: writers are gated
 * by a password (one per centro, one for the super admin) and a signed,
 * httpOnly session cookie. The public experience needs no login at all.
 */

const SESSION_COOKIE = "avz_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

export type Session =
  | { role: "super" }
  | { role: "centro"; centroId: string; slug: string; name: string };

function sessionSecret(): string {
  return process.env.SESSION_SECRET || "dev-insecure-session-secret-change-me";
}

/** Hashes a password with a per-password random salt: `salt:hash`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** Constant-time verification of a password against a stored `salt:hash`. */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return (
    expected.length === actual.length && timingSafeEqual(expected, actual)
  );
}

/** Verifies the single super-admin password from the environment. */
export function verifySuperPassword(password: string): boolean {
  const expected = process.env.SUPER_ADMIN_PASSWORD || "admin";
  if (password.length === 0) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function encodeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
  } catch {
    return null;
  }
}

/** Reads and validates the current session from the request cookies. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(session: Session): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
