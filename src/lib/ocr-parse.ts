export interface ParsedItem {
  code: string;
  description: string;
  quantity: number;
  unit: string;
}

export interface ParsedDocument {
  documentNumber: string;
  customer: string;
  items: ParsedItem[];
}

const toNumber = (s: string) => Number(s.replace(",", "."));

/**
 * Extrae número de documento, cliente y renglones de una nota de entrega / factura.
 * Es un mejor esfuerzo: el OCR comete errores, por eso todo queda editable en el formulario.
 */
export function parseDeliveryNote(raw: string): ParsedDocument {
  const text = raw.replace(/\r/g, "");
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // Número de documento
  const docMatch =
    text.match(/NOTA\s+DE\s+ENTREGA\s*[:#.\-]?\s*([0-9A-Z\-]{5,})/i) ??
    text.match(/FACTURA\s*(?:N[º°o]\.?)?\s*[:#.\-]?\s*([0-9A-Z\-]{4,})/i);
  const documentNumber = docMatch?.[1]?.toUpperCase() ?? "";

  // Cliente (línea que empieza por "Cliente", no "Cod Cliente")
  let customer = "";
  for (const line of lines) {
    const m = line.match(/^Cliente\s*[:;.]?\s*(.+)$/i);
    if (m) {
      customer = m[1]
        .split(/Fecha\s*Emisi/i)[0]
        .replace(/^[^A-Za-z0-9]+/, "")
        .trim();
      break;
    }
  }

  // Renglones: CODIGO DESCRIPCION [ALM] CANT UNI ...
  const itemRe = /^(\d{6,9})\s+(.+?)\s+(?:\d{4}\s+)?(\d+[.,]\d{2})\s+([A-Z]{2,4})\b/;
  const items: ParsedItem[] = [];
  for (const line of lines) {
    const m = line.match(itemRe);
    if (m) {
      items.push({
        code: m[1],
        description: m[2].trim(),
        quantity: toNumber(m[3]),
        unit: m[4],
      });
    } else if (items.length > 0 && line.length <= 12 && !/\d{3,}/.test(line) && /^[A-Z0-9.\s]+$/i.test(line)) {
      // Descripción que continúa en la línea siguiente (ej. "GR.")
      items[items.length - 1].description += " " + line;
    }
  }

  return { documentNumber, customer, items };
}
