export type ReturnType = "PARCIAL" | "TOTAL";

export interface ReturnItem {
  id: string;
  code: string;
  description: string;
  /** Cantidad de la nota de entrega (null si se agregó a mano). */
  delivered: number | null;
  /** Cantidad devuelta. */
  returned: number;
  unit: string;
}
