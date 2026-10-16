import { z } from "zod";

const isBlobUrl = (u: string) => {
  try {
    const { protocol, hostname } = new URL(u);
    return protocol === "https:" && hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
};

const optionalBlobUrl = z
  .string()
  .max(500)
  .default("")
  .refine((u) => u === "" || isBlobUrl(u), "URL de imagen no válida");

export const reportSchema = z
  .object({
    documentNumber: z.string().trim().min(3, "Falta el número de documento").max(40),
    customer: z.string().trim().max(120).default(""),
    documentUrl: optionalBlobUrl,
    returnType: z.enum(["PARCIAL", "TOTAL"]),
    items: z
      .array(
        z.object({
          code: z.string().trim().max(30).default(""),
          description: z.string().trim().min(1, "Un producto no tiene descripción").max(160),
          delivered: z.number().nonnegative().nullable(),
          returned: z.number().positive().max(100000),
          unit: z.string().trim().max(8).default("UND"),
        }),
      )
      .max(60),
    notes: z.string().trim().max(1500).default(""),
    photoUrl: optionalBlobUrl,
  })
  .refine((d) => d.returnType === "TOTAL" || d.items.length > 0, {
    message: "En una devolución parcial agrega al menos un producto",
    path: ["items"],
  });

export type ReportInput = z.output<typeof reportSchema>;
export type ReportRecord = ReportInput & { id: string; timestamp: string };
