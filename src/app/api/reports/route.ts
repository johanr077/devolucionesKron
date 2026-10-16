import { NextResponse } from "next/server";
import { checkAccess } from "@/lib/auth";
import { reportSchema, type ReportRecord } from "@/lib/schema";
import { caracasTimestamp, makeReportId, productsSummary, typeLabel } from "@/lib/report";
import { appendReportRow, updateStatusCell } from "@/lib/sheets";
import { sendTelegram } from "@/lib/telegram";
import { sendCxcEmail } from "@/lib/mailer";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const denied = checkAccess(req);
  if (denied) return denied;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const report: ReportRecord = {
    ...parsed.data,
    id: makeReportId(),
    timestamp: caracasTimestamp(),
  };

  const documentCell = [
    report.documentNumber,
    report.customer,
    report.documentUrl,
  ]
    .filter(Boolean)
    .join(" | ");

  // 1) Guardar primero: si Sheets falla, no se avisa a nadie de un reporte que no existe.
  let rowNumber: number;
  try {
    rowNumber = await appendReportRow([
      report.id,
      report.timestamp,
      documentCell,
      typeLabel(report),
      productsSummary(report),
      report.notes,
      report.photoUrl || "—",
      "PENDIENTE",
    ]);
  } catch (err) {
    console.error("[sheets]", err);
    return NextResponse.json(
      { error: "No se pudo guardar en Google Sheets. Intenta de nuevo." },
      { status: 502 },
    );
  }

  // 2) Notificar en paralelo.
  const [tg, mail] = await Promise.allSettled([sendTelegram(report), sendCxcEmail(report)]);
  if (tg.status === "rejected") console.error("[telegram]", tg.reason);
  if (mail.status === "rejected") console.error("[gmail]", mail.reason);

  const telegram = tg.status === "fulfilled";
  const gmail = mail.status === "fulfilled";

  // 3) Registrar el resultado en la hoja (no bloquea la respuesta si falla).
  const status = `Telegram: ${telegram ? "OK" : "ERROR"} | Gmail: ${gmail ? "OK" : "ERROR"}`;
  await updateStatusCell(rowNumber, status).catch((e) => console.error("[status]", e));

  return NextResponse.json({ id: report.id, timestamp: report.timestamp, telegram, gmail });
}
