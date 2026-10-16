"use client";

import { useEffect, useState } from "react";
import { CODE_KEY } from "@/lib/client";

export function AccessGate({ children }: { children: React.ReactNode }) {
  const required = process.env.NEXT_PUBLIC_REQUIRE_CODE === "true";
  const [ready, setReady] = useState(!required);
  const [checked, setChecked] = useState(!required);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!required) return;
    setReady(Boolean(localStorage.getItem(CODE_KEY)));
    setChecked(true);
  }, [required]);

  if (!checked) return null;
  if (ready) return <>{children}</>;

  return (
    <div className="px-5 py-8">
      <div className="rounded-3xl bg-kron-milk p-6 ring-1 ring-kron-purple/10">
        <h2 className="font-display text-xl font-semibold">Código de acceso</h2>
        <p className="mt-1 text-sm text-kron-ink/60">Pídelo a tu supervisor de logística.</p>
        <input
          className="field mt-4"
          type="password"
          inputMode="text"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código"
        />
        <button
          className="btn-primary mt-4"
          disabled={!code.trim()}
          onClick={() => {
            localStorage.setItem(CODE_KEY, code.trim());
            setReady(true);
          }}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
