import type { ReportRecord } from "./schema";
import { itemLine, typeLabel } from "./report";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function sendTelegram(r: ReportRecord): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error("Telegram no configurado");

  const products =
    r.items.length === 0
      ? "• Todos los productos de la nota"
      : r.items.map((i) => `• ${esc(itemLine(i))}`).join("\n");

  const lines = [
    `🍫 <b>Devolución ${typeLabel(r)}</b>`,
    `<b>ID:</b> ${esc(r.id)}`,
    `<b>Fecha:</b> ${esc(r.timestamp)}`,
    `<b>Documento:</b> ${esc(r.documentNumber)}`,
    r.customer ? `<b>Cliente:</b> ${esc(r.customer)}` : "",
    "",
    "<b>Productos:</b>",
    products,
    "",
    `<b>Observaciones:</b> ${esc(r.notes || "Sin observaciones")}`,
    r.photoUrl ? `\n📷 <a href="${esc(r.photoUrl)}">Ver foto de evidencia</a>` : "",
    r.documentUrl ? `📄 <a href="${esc(r.documentUrl)}">Ver documento</a>` : "",
  ].filter((l, i, a) => l !== "" || (a[i - 1] !== "" && i !== 0));

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: lines.join("\n"),
    parse_mode: "HTML",
  };
  if (process.env.TELEGRAM_THREAD_ID) body.message_thread_id = Number(process.env.TELEGRAM_THREAD_ID);

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${await res.text()}`);
}
