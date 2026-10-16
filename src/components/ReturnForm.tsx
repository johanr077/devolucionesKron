"use client";

import { useMemo, useState } from "react";
import type { ReturnItem, ReturnType } from "@/types";
import type { ParsedDocument } from "@/lib/ocr-parse";
import { apiFetch, uploadImage } from "@/lib/client";
import { DocumentScanner } from "./DocumentScanner";
import { PhotoUpload } from "./PhotoUpload";
import { ProductList } from "./ProductList";
import { Spinner } from "./Spinner";

const QUICK_NOTES = [
  "Mercancía en mal estado",
  "Cliente cerrado",
  "Cliente rechazó la entrega",
  "Faltante en la entrega",
  "Dirección incorrecta",
];

interface Result {
  id: string;
  telegram: boolean;
  gmail: boolean;
}

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-kron-milk p-5 ring-1 ring-kron-purple/10">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kron-purple font-display text-sm font-bold text-white">
          {n}
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold leading-tight">{title}</h2>
          {hint && <p className="text-sm text-kron-ink/60">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function ReturnForm() {
  const [docBlob, setDocBlob] = useState<Blob | null>(null);
  const [documentNumber, setDocumentNumber] = useState("");
  const [customer, setCustomer] = useState("");
  const [returnType, setReturnType] = useState<ReturnType>("PARCIAL");
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [formKey, setFormKey] = useState(0);

  function onScanned(doc: ParsedDocument, image: Blob) {
    setDocBlob(image);
    if (doc.documentNumber) setDocumentNumber(doc.documentNumber);
    if (doc.customer) setCustomer(doc.customer);
    setItems(
      doc.items.map((p) => ({
        id: crypto.randomUUID(),
        code: p.code,
        description: p.description,
        delivered: p.quantity,
        returned: 0,
        unit: p.unit,
      })),
    );
  }

  const effective = useMemo(
    () =>
      items
        .map((i) => ({
          code: i.code,
          description: i.description.trim(),
          delivered: i.delivered,
          returned: returnType === "TOTAL" && i.delivered !== null ? i.delivered : i.returned,
          unit: i.unit,
        }))
        .filter((i) => i.returned > 0),
    [items, returnType],
  );

  const busy = stage !== "" || photoBusy;

  function addNote(text: string) {
    setNotes((n) => (n.includes(text) ? n : n ? `${n.trim()}. ${text}` : text));
  }

  async function submit() {
    setError("");
    if (!documentNumber.trim()) return setError("Escribe el número de la nota o factura.");
    if (returnType === "PARCIAL" && effective.length === 0)
      return setError("Indica la cantidad devuelta de al menos un producto.");
    if (effective.some((i) => !i.description)) return setError("Hay un producto sin descripción.");

    try {
      let documentUrl = "";
      if (docBlob) {
        setStage("Subiendo documento…");
        documentUrl = await uploadImage(docBlob, "documento");
      }
      setStage("Guardando y notificando…");
      const res = await apiFetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentNumber: documentNumber.trim(),
          customer: customer.trim(),
          documentUrl,
          returnType,
          items: effective,
          notes: notes.trim(),
          photoUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No se pudo enviar el reporte");
      setResult(data as Result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar el reporte");
    } finally {
      setStage("");
    }
  }

  function reset() {
    setDocBlob(null);
    setDocumentNumber("");
    setCustomer("");
    setReturnType("PARCIAL");
    setItems([]);
    setNotes("");
    setPhotoUrl("");
    setError("");
    setResult(null);
    setFormKey((k) => k + 1);
  }

  if (result) {
    const row = (label: string, ok: boolean) => (
      <li className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-kron-purple/10">
        <span>{label}</span>
        <span className={`font-semibold ${ok ? "text-green-800" : "text-red-700"}`}>{ok ? "Enviado" : "No se envió"}</span>
      </li>
    );
    return (
      <div className="space-y-4 px-4 pb-10 pt-2">
        <section className="rounded-3xl bg-kron-milk p-6 ring-1 ring-kron-purple/10" role="status">
          <h2 className="font-display text-2xl font-bold">Reporte guardado</h2>
          <p className="mt-1 text-kron-ink/70">
            Número de reporte: <b className="font-display">{result.id}</b>
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {row("Google Sheets", true)}
            {row("Telegram (Almacén)", result.telegram)}
            {row("Correo (Cuentas por Cobrar)", result.gmail)}
          </ul>
          {(!result.telegram || !result.gmail) && (
            <p className="mt-3 text-sm text-red-700">
              El reporte quedó registrado, pero un aviso falló. Avisa a Almacén o Cuentas por Cobrar por otro medio.
            </p>
          )}
        </section>
        <button className="btn-primary" onClick={reset}>Nuevo reporte</button>
      </div>
    );
  }

  return (
    <div key={formKey} className="space-y-4 px-4 pb-36 pt-2">
      <Step n={1} title="Documento" hint="Foto de la nota de entrega o factura">
        <DocumentScanner onScanned={onScanned} />
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-semibold">
            N° de documento
            <input className="field mt-1" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="Ej. 50031910" inputMode="text" autoComplete="off" />
          </label>
          <label className="block text-sm font-semibold">
            Cliente
            <input className="field mt-1" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nombre del cliente" autoComplete="off" />
          </label>
        </div>
      </Step>

      <Step n={2} title="Qué regresa" hint="Elige si es parcial o total">
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-kron-cream p-1" role="radiogroup" aria-label="Tipo de devolución">
          {(["PARCIAL", "TOTAL"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={returnType === t}
              onClick={() => setReturnType(t)}
              className={`min-h-[48px] rounded-xl font-semibold transition-colors ${
                returnType === t ? "bg-kron-purple text-white shadow" : "text-kron-purple"
              }`}
            >
              {t === "PARCIAL" ? "Parcial" : "Total"}
            </button>
          ))}
        </div>
        <ProductList items={items} returnType={returnType} onChange={setItems} />
      </Step>

      <Step n={3} title="Observaciones" hint="Cuenta qué pasó">
        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_NOTES.map((q) => (
            <button key={q} type="button" className="rounded-full border border-kron-cocoa/30 bg-white px-3 py-2 text-sm text-kron-cocoa active:bg-kron-cream" onClick={() => addNote(q)}>
              {q}
            </button>
          ))}
        </div>
        <textarea className="field min-h-32" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1500} placeholder="Ej. Mercancía en mal estado, cliente cerrado…" />
      </Step>

      <Step n={4} title="Foto de evidencia" hint="Fotografía los productos devueltos">
        <PhotoUpload url={photoUrl} onChange={setPhotoUrl} onBusy={setPhotoBusy} />
      </Step>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-kron-purple/10 bg-kron-cream/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto max-w-xl">
          {error && <p className="mb-2 text-sm font-semibold text-red-700" role="alert">{error}</p>}
          <button className="btn-primary" disabled={busy} onClick={submit}>
            {busy && <Spinner />}
            {stage || (photoBusy ? "Subiendo foto…" : "Enviar reporte")}
          </button>
        </div>
      </div>
    </div>
  );
}
