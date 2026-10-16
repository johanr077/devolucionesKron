import { randomBytes } from "crypto";
import type { ReportInput, ReportRecord } from "./schema";

export function makeReportId(now = new Date()): string {
  const d = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `DEV-${d}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

export function caracasTimestamp(now = new Date()): string {
  return new Intl.DateTimeFormat("es-VE", {
    timeZone: "America/Caracas",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
}

export function itemLine(i: ReportInput["items"][number]): string {
  const of = i.delivered != null && i.delivered !== i.returned ? ` (de ${i.delivered})` : "";
  return `${i.returned} ${i.unit} — ${i.description}${of}`;
}

export function productsSummary(r: ReportRecord): string {
  if (r.items.length === 0) return "TOTAL — todos los productos de la nota";
  return r.items.map(itemLine).join("\n");
}

export const typeLabel = (r: ReportRecord) =>
  r.returnType === "TOTAL" ? "TOTAL" : "PARCIAL";
