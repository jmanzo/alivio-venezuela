import { NextResponse } from "next/server";
import { setSessionCookie, verifySuperPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST /api/auth/super — super-admin login; sets a signed session cookie. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!verifySuperPassword(password)) {
    return NextResponse.json(
      { error: "AuthError", message: "Clave incorrecta." },
      { status: 401 },
    );
  }

  await setSessionCookie({ role: "super" });
  return NextResponse.json({ ok: true });
}
