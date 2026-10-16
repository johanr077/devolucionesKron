import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

/** Si APP_ACCESS_CODE está definido, exige el header x-access-code. */
export function checkAccess(req: Request): NextResponse | null {
  const expected = process.env.APP_ACCESS_CODE;
  if (!expected) return null;
  const given = req.headers.get("x-access-code") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length === b.length && timingSafeEqual(a, b)) return null;
  return NextResponse.json({ error: "Código de acceso inválido" }, { status: 401 });
}
