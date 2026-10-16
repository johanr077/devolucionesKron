import { google } from "googleapis";

export const SHEET_HEADERS = [
  "ID de Reporte",
  "Fecha y Hora",
  "Documento Escaneado",
  "Tipo de Devolución",
  "Productos Devueltos",
  "Observaciones",
  "URL Foto del Producto",
  "Status Telegram/Gmail",
];

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno ${name}`);
  return v;
}

function client() {
  const auth = new google.auth.JWT({
    email: env("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: env("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

const tabName = () => `'${(process.env.GOOGLE_SHEET_TAB || "DEVOLUCIONES").replace(/'/g, "''")}'`;

/** Agrega la fila y devuelve el número de fila escrita. */
export async function appendReportRow(row: string[]): Promise<number> {
  const sheets = client();
  const spreadsheetId = env("GOOGLE_SHEET_ID");
  const tab = tabName();

  // Crea los encabezados si la pestaña está vacía.
  const head = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${tab}!A1:H1` });
  if (!head.data.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tab}!A1:H1`,
      valueInputOption: "RAW",
      requestBody: { values: [SHEET_HEADERS] },
    });
  }

  // RAW: el texto del usuario nunca se interpreta como fórmula.
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tab}!A:H`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });

  const range = res.data.updates?.updatedRange ?? "";
  const match = range.match(/!A(\d+):H\d+/);
  if (!match) throw new Error("Google Sheets no devolvió la fila escrita");
  return Number(match[1]);
}

export async function updateStatusCell(rowNumber: number, status: string): Promise<void> {
  const sheets = client();
  await sheets.spreadsheets.values.update({
    spreadsheetId: env("GOOGLE_SHEET_ID"),
    range: `${tabName()}!H${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [[status]] },
  });
}
