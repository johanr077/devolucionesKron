"use client";

import { useRef, useState } from "react";
import { compressImage } from "@/lib/image";
import { uploadImage } from "@/lib/client";
import { Spinner } from "./Spinner";

interface Props {
  url: string;
  onChange: (url: string) => void;
  onBusy: (busy: boolean) => void;
}

export function PhotoUpload({ url, onChange, onBusy }: Props) {
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [local, setLocal] = useState("");

  async function handle(file: File) {
    setError("");
    setUploading(true);
    onBusy(true);
    try {
      const blob = await compressImage(file, 1600, 0.8);
      setLocal((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      onChange(await uploadImage(blob, "evidencia"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la foto");
      onChange("");
    } finally {
      setUploading(false);
      onBusy(false);
    }
  }

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) void handle(f);
  };

  return (
    <div>
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
      <input ref={galRef} type="file" accept="image/*" className="hidden" onChange={pick} />

      {local && (
        <div className="relative mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={local} alt="Evidencia de la mercancía" className="h-48 w-full rounded-2xl object-cover ring-1 ring-kron-purple/15" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-kron-deep/60 text-sm font-semibold text-white" role="status">
              <Spinner /> Subiendo foto…
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="btn-soft" disabled={uploading} onClick={() => camRef.current?.click()}>
          {url ? "Tomar otra" : "Tomar foto"}
        </button>
        <button type="button" className="btn-soft" disabled={uploading} onClick={() => galRef.current?.click()}>
          Elegir de galería
        </button>
      </div>
      {url && !uploading && <p className="mt-2 text-sm text-green-800">Foto subida correctamente.</p>}
      {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
    </div>
  );
}
