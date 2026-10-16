import nodemailer from "nodemailer";
import type { ReportRecord } from "./schema";
import { itemLine, typeLabel } from "./report";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function buildHtml(r: ReportRecord): string {
  const products =
    r.items.length === 0
      ? "<li>Todos los productos de la nota de entrega</li>"
      : r.items.map((i) => `<li>${esc(itemLine(i))}</li>`).join("");
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#5A2E17;font-weight:600;vertical-align:top">${k}</td><td style="padding:6px 0">${v}</td></tr>`;

  return `<!doctype html><html><body style="margin:0;background:#F7EEDF;font-family:Arial,Helvetica,sans-serif;color:#24113D">
  <div style="max-width:560px;margin:0 auto">
    <div style="background:#4A1D7A;color:#fff;padding:20px 24px">
      <span style="display:inline-block;background:#4338A0;border-radius:999px;padding:4px 16px;font-size:20px;font-weight:700">krön</span>
      <h1 style="margin:14px 0 0;font-size:20px">Devolución ${typeLabel(r)} · acción requerida</h1>
    </div>
    <div style="background:#FFFAF2;padding:24px">
      <p style="margin-top:0">Almacén registró una devolución. <b>Detengan la cobranza</b> del documento o emitan la <b>nota de crédito</b> correspondiente.</p>
      <table style="border-collapse:collapse;font-size:14px">
        ${row("Reporte", esc(r.id))}
        ${row("Fecha", esc(r.timestamp))}
        ${row("Documento", esc(r.documentNumber))}
        ${row("Cliente", esc(r.customer || "—"))}
        ${row("Observaciones", esc(r.notes || "Sin observaciones").replace(/\n/g, "<br>"))}
      </table>
      <h3 style="color:#4A1D7A;margin:20px 0 6px">Productos devueltos</h3>
      <ul style="margin:0;padding-left:20px;font-size:14px">${products}</ul>
      ${
        r.photoUrl
          ? `<p style="margin-top:20px"><a href="${esc(r.photoUrl)}" style="background:#4338A0;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Ver foto de evidencia</a></p>`
          : ""
      }
      ${r.documentUrl ? `<p style="font-size:13px"><a href="${esc(r.documentUrl)}">Ver documento escaneado</a></p>` : ""}
    </div>
  </div></body></html>`;
}

export async function sendCxcEmail(r: ReportRecord): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.CXC_EMAIL_TO;
  if (!user || !pass || !to) throw new Error("Gmail no configurado");

  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  await transporter.sendMail({
    from: `"Reportes de Devolución" <${user}>`,
    to,
    cc: process.env.CXC_EMAIL_CC || undefined,
    subject: `[Devolución ${typeLabel(r)}] Doc. ${r.documentNumber}${r.customer ? " – " + r.customer : ""} (${r.id})`,
    html: buildHtml(r),
  });
}
