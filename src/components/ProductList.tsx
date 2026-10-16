"use client";

import type { ReturnItem, ReturnType } from "@/types";

interface Props {
  items: ReturnItem[];
  returnType: ReturnType;
  onChange: (items: ReturnItem[]) => void;
}

function Stepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const btn =
    "flex h-11 w-11 items-center justify-center rounded-xl bg-kron-purple/10 text-xl font-bold text-kron-purple active:bg-kron-purple/20 disabled:opacity-30";
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={btn} aria-label="Restar una unidad" disabled={value <= 0} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="w-10 text-center font-display text-lg font-bold tabular-nums">{value}</span>
      <button type="button" className={btn} aria-label="Sumar una unidad" disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

export function ProductList({ items, returnType, onChange }: Props) {
  const total = returnType === "TOTAL";

  const update = (id: string, patch: Partial<ReturnItem>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const add = () =>
    onChange([
      ...items,
      { id: crypto.randomUUID(), code: "", description: "", delivered: null, returned: 1, unit: "UND" },
    ]);

  return (
    <div>
      {items.length === 0 && (
        <p className="mb-3 rounded-xl bg-kron-cream px-4 py-3 text-sm text-kron-ink/70">
          {total
            ? "Se reportará la devolución de todos los productos de la nota. Puedes detallarlos si quieres."
            : "Escanea la nota para cargar los productos o agrégalos a mano."}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((item) => {
          const locked = total && item.delivered !== null;
          const shown = locked ? (item.delivered as number) : item.returned;
          const dimmed = !total && item.returned === 0;
          return (
            <li key={item.id} className={`rounded-2xl bg-white p-3 ring-1 ring-kron-purple/10 ${dimmed ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-2">
                <input
                  className="field !py-2 !text-sm"
                  value={item.description}
                  onChange={(e) => update(item.id, { description: e.target.value })}
                  placeholder="Descripción del producto"
                  aria-label="Descripción del producto"
                />
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-kron-cocoa active:bg-kron-cream"
                  aria-label="Quitar producto"
                  onClick={() => remove(item.id)}
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-kron-ink/60">
                  {item.delivered !== null ? `En la nota: ${item.delivered} ${item.unit}` : `Unidad: ${item.unit}`}
                  {item.code ? ` · ${item.code}` : ""}
                </p>
                {locked ? (
                  <span className="font-display text-lg font-bold">{shown} {item.unit}</span>
                ) : (
                  <Stepper
                    value={item.returned}
                    max={item.delivered ?? 9999}
                    onChange={(v) => update(item.id, { returned: v })}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <button type="button" className="btn-soft mt-3 w-full" onClick={add}>
        + Agregar producto
      </button>
      {!total && items.length > 0 && (
        <p className="mt-2 text-xs text-kron-ink/60">Los productos con 0 unidades no se incluyen en el reporte.</p>
      )}
    </div>
  );
}
