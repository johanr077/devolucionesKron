import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { checkAccess } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_BYTES = 4_000_000; // Vercel limita el cuerpo a 4.5 MB; el cliente ya comprime.

export async function POST(req: Request) {
  const denied = checkAccess(req);
  if (denied) return denied;

  try {
    const form = await req.formData();
    const file = form.get("file");
    const kindRaw = String(form.get("kind") ?? "evidencia");
    const kind = kindRaw === "documento" ? "documento" : "evidencia";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No llegó ninguna imagen" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "La imagen es demasiado grande" }, { status: 413 });
    }

    const ext = file.type === "image/png" ? "png" : "jpg";
    const blob = await put(`devoluciones/${kind}.${ext}`, file, {
      access: "public",
      addRandomSuffix: true, // URL no adivinable
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "No se pudo subir la imagen" }, { status: 500 });
  }
}
