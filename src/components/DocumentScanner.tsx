"use client";

import { useRef, useState } from "react";
import { parseDeliveryNote, type ParsedDocument } from "@/lib/ocr-parse";
import { compressImage, prepareForOcr } from "@/lib/image";
import { Spinner } from "./Spinner";

interface Props {
  onScanned: (doc: ParsedDocument, image: Blob) => void;
}

const EMPTY: ParsedDocument = { documentNumber: "", customer: "", items: [] };

export function DocumentScanner({ onScanned }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");

  async function handleFile(file: File) {
    setStatus("working");
    setProgress(0);
    setMessage("");
    let stored: Blob | null = null;
    try {
      stored = await compressImage(file, 1600, 0.8);
      const url = URL.createObjectURL(stored);
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });

      const canvas = await prepareForOcr(file);
      const { createWorker, PSM } = await import("tesseract.js");
      const worker = await createWorker("spa", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
        },
      });
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
      const { data } = await worker.recognize(canvas);
      await worker.terminate();

      const parsed = parseDeliveryNote(data.text);
      onScanned(parsed, stored);
      setStatus("done");
      setMessage(
        parsed.documentNumber
          ? `Documento ${parsed.documentNumber} · ${parsed.items.length} producto(s) detectados. Revisa los datos.`
          : "No pude leer el número. Escríbelo abajo; la imagen quedó guardada.",
      );
    } catch (err) {
      console.error("[ocr]", err);
      if (stored) onScanned(EMPTY, stored);
      setStatus("error");
      setMessage("No se pudo leer el documento. Completa los datos a mano.");
    }
  }

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) void handleFile(f);
  };

  const working = status === "working";

  return (
    <div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={pick} />

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Documento escaneado" className="mb-3 h-44 w-full rounded-2xl bg-white object-contain ring-1 ring-kron-purple/15" />
      )}

      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="btn-primary !min-h-[52px] !text-sm" disabled={working} onClick={() => cameraRef.current?.click()}>
          {working ? <Spinner /> : null}
          {working ? "Leyendo…" : preview ? "Escanear otra" : "Tomar foto"}
        </button>
        <button type="button" className="btn-soft !min-h-[52px]" disabled={working} onClick={() => galleryRef.current?.click()}>
          Subir imagen
        </button>
      </div>

      {working && (
        <div className="mt-3" role="status" aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-kron-purple/10">
            <div className="h-full rounded-full bg-kron-indigo transition-all" style={{ width: `${Math.max(progress, 6)}%` }} />
          </div>
          <p className="mt-1 text-xs text-kron-ink/60">Leyendo el documento… {progress}%</p>
        </div>
      )}

      {message && !working && (
        <p className={`mt-3 text-sm ${status === "error" ? "text-red-700" : "text-kron-ink/70"}`} role="status">
          {message}
        </p>
      )}
    </div>
  );
}
